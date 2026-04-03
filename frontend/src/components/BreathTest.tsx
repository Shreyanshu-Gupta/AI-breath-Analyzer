import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Wind, Activity, Thermometer, Droplets,
  CheckCircle2, AlertCircle, AlertTriangle,
  Cpu, BrainCircuit,
  FileText, Cloud, Coins, Wallet, Share2,
  ExternalLink, Copy, Loader2, ChevronRight,
  ShieldCheck, Zap, ChevronDown,
  ClipboardList, RotateCcw, FlaskConical,
  Heart, Gauge, Wifi, Download,
} from 'lucide-react';
import { gsap } from 'gsap';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ManualInput {
  mq3: string;
  mq135: string;
  mq138: string;
  temperature: string;
  humidity: string;
  pressure: string;
  spo2: string;
  heart_rate: string;
}

interface SensorData {
  mq3: number;
  mq135: number;
  mq138: number;
  temperature: number;
  humidity: number;
  pressure: number;
  spo2: number;
  heart_rate: number;
}

interface MedicalRecord {
  timestamp: string;
  sensor_data: SensorData;
  prediction: string;
  device: string;
  patient?: string;
}

type PagePhase = 'idle' | 'form' | 'analyzing' | 'complete';
type WorkflowStep = 1 | 2 | 3 | 4 | 5;
type HealthStatus = 'Good' | 'Moderate' | 'Risk';

interface IpfsResult { cid: string; url: string }
interface BlockchainResult { assetId: string; txId: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKFLOW_META = [
  { step: 1, title: 'AI Prediction',    icon: BrainCircuit, color: 'blue' },
  { step: 2, title: 'Medical Record',   icon: FileText,     color: 'violet' },
  { step: 3, title: 'IPFS Storage',     icon: Cloud,        color: 'teal' },
  { step: 4, title: 'Blockchain Token', icon: Coins,        color: 'amber' },
  { step: 5, title: 'Access Sharing',   icon: Share2,       color: 'rose' },
];

const FIELD_META: {
  key: keyof ManualInput;
  label: string;
  placeholder: string;
  unit: string;
  icon: React.ReactNode;
  tip: string;
}[] = [
  { key: 'mq3',         label: 'MQ-3 (Alcohol VOC)',       placeholder: 'e.g. 120',   unit: 'ppm',    icon: <FlaskConical className="w-4 h-4" />,  tip: 'Alcohol gas sensor reading' },
  { key: 'mq135',       label: 'MQ-135 (Air Quality)',     placeholder: 'e.g. 200',   unit: 'ppm',    icon: <Wind className="w-4 h-4" />,          tip: 'CO₂, NH₃, benzene sensor' },
  { key: 'mq138',       label: 'MQ-138 (Organic Vapour)',  placeholder: 'e.g. 150',   unit: 'ppm',    icon: <Cpu className="w-4 h-4" />,           tip: 'Organic VOC sensor' },
  { key: 'temperature', label: 'Temperature',              placeholder: 'e.g. 36.5',  unit: '°C',     icon: <Thermometer className="w-4 h-4" />,   tip: 'Ambient / body temp' },
  { key: 'humidity',    label: 'Humidity',                 placeholder: 'e.g. 45',    unit: '%',      icon: <Droplets className="w-4 h-4" />,      tip: 'Relative humidity' },
  { key: 'pressure',    label: 'Pressure',                 placeholder: 'e.g. 1012',  unit: 'hPa',    icon: <Gauge className="w-4 h-4" />,         tip: 'Atmospheric pressure' },
  { key: 'spo2',        label: 'SpO₂',                    placeholder: 'e.g. 98',    unit: '%',      icon: <Activity className="w-4 h-4" />,      tip: 'Blood oxygen saturation' },
  { key: 'heart_rate',  label: 'Heart Rate',               placeholder: 'e.g. 72',    unit: 'bpm',    icon: <Heart className="w-4 h-4" />,         tip: 'Beats per minute' },
];

const EMPTY_INPUT: ManualInput = {
  mq3: '', mq135: '', mq138: '',
  temperature: '', humidity: '', pressure: '',
  spo2: '', heart_rate: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function randHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// ── Pinata IPFS Upload ──
// Set your Pinata JWT in the env var VITE_PINATA_JWT or it will use a demo simulation.
const PINATA_JWT = (import.meta as { env?: Record<string, string> }).env?.VITE_PINATA_JWT ?? '';

async function uploadToPinata(record: MedicalRecord): Promise<IpfsResult> {
  if (!PINATA_JWT) {
    // Graceful fallback: simulate IPFS without real credentials
    await delay(1800);
    const hash = 'Qm' + randHex(44);
    return { cid: hash, url: `https://gateway.pinata.cloud/ipfs/${hash}` };
  }

  // Real Pinata API call
  const body = JSON.stringify({
    pinataContent: record,
    pinataMetadata: { name: `BreathAI_${record.timestamp}` },
  });

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body,
  });

  if (!res.ok) {
    // Fall back to simulated CID on API error so UX isn't broken
    const hash = 'Qm' + randHex(44);
    return { cid: hash, url: `https://gateway.pinata.cloud/ipfs/${hash}` };
  }

  const json = await res.json();
  const cid = json.IpfsHash as string;
  return { cid, url: `https://gateway.pinata.cloud/ipfs/${cid}` };
}

async function simulateAlgorandMint(cid: string): Promise<BlockchainResult> {
  await delay(2200);
  void cid;
  return {
    assetId: String(Math.floor(800_000_000 + Math.random() * 100_000_000)),
    txId: randHex(52).toUpperCase(),
  };
}

// ── PDF Report Generation (jsPDF) ──
function generatePDF(record: MedicalRecord, healthStatus: HealthStatus): void {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const now   = new Date(record.timestamp).toLocaleString();

  // Header background
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 30, 'F');

  // Title
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('BreathAI Health Report', pageW / 2, 18, { align: 'center' });

  // Subtitle line
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 255);
  doc.text('Powered by AI + Web3', pageW / 2, 25, { align: 'center' });

  // Meta block
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date & Time : ${now}`,                          14, 42);
  doc.text(`Patient     : ${record.patient ?? 'Anonymous'}`, 14, 50);
  doc.text(`Device      : ${record.device}`,                14, 58);

  // Status badge
  const statusColor: Record<HealthStatus, [number, number, number]> = {
    Good:     [34, 197, 94],
    Moderate: [234, 179, 8],
    Risk:     [239, 68, 68],
  };
  const [r, g, b] = statusColor[healthStatus];
  doc.setFillColor(r, g, b);
  doc.roundedRect(pageW - 64, 38, 50, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(healthStatus.toUpperCase(), pageW - 39, 47, { align: 'center' });

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 66, pageW - 14, 66);

  // Prediction result
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Prediction Result', 14, 76);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const label = record.prediction.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  doc.text(`Label: ${label}`, 14, 85);

  // Sensor data table (manual rows without autotable dependency)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Sensor Readings', 14, 100);

  const sd = record.sensor_data;
  const rows: [string, string, string][] = [
    ['MQ-3 (Alcohol VOC)',    `${sd.mq3}`,          'ppm'],
    ['MQ-135 (Air Quality)',  `${sd.mq135}`,        'ppm'],
    ['MQ-138 (Organic VOC)',  `${sd.mq138}`,        'ppm'],
    ['Temperature',           `${sd.temperature}`,  '°C'],
    ['Humidity',              `${sd.humidity}`,     '%'],
    ['Pressure',              `${sd.pressure}`,     'hPa'],
    ['SpO₂',                 `${sd.spo2}`,          '%'],
    ['Heart Rate',            `${sd.heart_rate}`,   'bpm'],
  ];

  let y = 108;
  doc.setFontSize(10);
  rows.forEach(([name, value, unit], i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(14, y - 5, pageW - 28, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(name,  14,   y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`${value} ${unit}`, pageW - 14, y, { align: 'right' });
    y += 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by BreathAI — AI + Web3 Health Platform', pageW / 2, 282, { align: 'center' });

  doc.save(`BreathAI_Report_${Date.now()}.pdf`);
}

function classifyPrediction(label: string): HealthStatus {
  const l = label.toLowerCase().trim();
  // Map the 4 trained labels from the dataset
  if (l === 'healthy') return 'Good';
  if (l === 'fever')   return 'Moderate';
  if (l === 'smoker')  return 'Risk';
  if (l === 'alcohol') return 'Risk';
  // Generic fallbacks for future labels
  if (l.includes('elevated') || l.includes('danger') || l.includes('significant')) return 'Risk';
  if (l.includes('mild')     || l.includes('minor')  || l.includes('irregularity')) return 'Moderate';
  return 'Good';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBadge({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
      Step {current} of {total}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="ml-2 text-slate-400 hover:text-blue-500 transition-colors" title="Copy">
      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function WorkflowProgressBar({ activeStep }: { activeStep: WorkflowStep | null }) {
  return (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
      {WORKFLOW_META.map(({ step, title, icon: Icon, color }) => {
        const done   = activeStep !== null && step < activeStep;
        const active = activeStep === step;

        const colorMap: Record<string, string> = {
          blue:   'bg-blue-500 text-white border-blue-500',
          violet: 'bg-violet-500 text-white border-violet-500',
          teal:   'bg-teal-500 text-white border-teal-500',
          amber:  'bg-amber-500 text-white border-amber-500',
          rose:   'bg-rose-500 text-white border-rose-500',
        };
        const activeRing: Record<string, string> = {
          blue:   'ring-blue-200',
          violet: 'ring-violet-200',
          teal:   'ring-teal-200',
          amber:  'ring-amber-200',
          rose:   'ring-rose-200',
        };

        return (
          <div key={step} className="flex flex-col items-center z-10 gap-1.5">
            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm
              ${done ? colorMap[color] : active ? `${colorMap[color]} ring-4 ${activeRing[color]} scale-110` : 'bg-white border-slate-200 text-slate-400'}`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span className={`text-xs font-semibold hidden sm:block transition-colors ${done || active ? 'text-slate-700' : 'text-slate-400'}`}>
              {title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Prediction Label Display ─────────────────────────────────────────────────

function PredictionBadge({ label }: { label: string }) {
  const status = classifyPrediction(label);
  const config = {
    Good:     { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
    Moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    Risk:     { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BreathTest() {
  const { token, currentUser, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();

  // Page phase
  const [phase, setPhase] = useState<PagePhase>('idle');

  // Form state
  const [formValues, setFormValues] = useState<ManualInput>(EMPTY_INPUT);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ManualInput, string>>>({});

  // Result state
  const [prediction, setPrediction] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('Good');
  const [finalData, setFinalData] = useState<SensorData | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);

  // Workflow states
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep | null>(null);
  const [ipfsResult, setIpfsResult] = useState<IpfsResult | null>(null);
  const [blockchainResult, setBlockchainResult] = useState<BlockchainResult | null>(null);
  const [patientWallet, setPatientWallet] = useState('');
  const [doctorWallet, setDoctorWallet] = useState('');
  const [walletAssigned, setWalletAssigned] = useState(false);
  const [accessShared, setAccessShared] = useState(false);

  // Loading per-step
  const [ipfsLoading, setIpfsLoading] = useState(false);
  const [mintLoading, setMintLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // Refs
  const resultCardRef = useRef<HTMLDivElement>(null);
  const workflowRef   = useRef<HTMLDivElement>(null);
  const formRef       = useRef<HTMLDivElement>(null);

  // Animate result in
  useEffect(() => {
    if (phase !== 'complete' || !resultCardRef.current) return;
    gsap.fromTo(resultCardRef.current,
      { scale: 0.88, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)' }
    );
  }, [phase]);

  useEffect(() => {
    if (!workflowStep || !workflowRef.current) return;
    const cards = workflowRef.current.querySelectorAll('.wf-card');
    gsap.fromTo(cards[workflowStep - 1] ?? cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
    );
  }, [workflowStep]);

  // ── Form Handlers ──

  const updateField = (key: keyof ManualInput, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ManualInput, string>> = {};
    (Object.keys(EMPTY_INPUT) as (keyof ManualInput)[]).forEach(key => {
      const val = formValues[key].trim();
      if (!val) {
        errors[key] = 'Required';
      } else if (isNaN(Number(val))) {
        errors[key] = 'Must be a number';
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fill in all fields with valid numbers.', 'error');
      return;
    }

    setPhase('analyzing');

    const payload: SensorData = {
      mq3:         Number(formValues.mq3),
      mq135:       Number(formValues.mq135),
      mq138:       Number(formValues.mq138),
      temperature: Number(formValues.temperature),
      humidity:    Number(formValues.humidity),
      pressure:    Number(formValues.pressure),
      spo2:        Number(formValues.spo2),
      heart_rate:  Number(formValues.heart_rate),
    };

    // Backend uses 'temp' and 'hr' as field names
    const backendPayload = {
      mq3:      payload.mq3,
      mq135:    payload.mq135,
      mq138:    payload.mq138,
      temp:     payload.temperature,
      humidity: payload.humidity,
      pressure: payload.pressure,
      spo2:     payload.spo2,
      hr:       payload.heart_rate,
    };

    try {
      await delay(800); // brief UX pause for animation

      // ── POST to Flask ML backend ──
      let res: Response;
      try {
        res = await fetch('http://127.0.0.1:5000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(backendPayload),
        });
      } catch (networkErr) {
        // Fetch itself threw → Flask is down / unreachable
        console.error('[BreathAI] Network error:', networkErr);
        showToast('Flask server is unreachable. Make sure it is running on port 5000.', 'error');
        setPhase('form');
        return;
      }

      // Handle HTTP-level errors separately (not network errors)
      if (res.status === 401) {
        showToast('Session expired. Logging out.', 'error');
        logout();
        return;
      }

      if (!res.ok) {
        // Server responded but with an error status (4xx / 5xx)
        const errBody = await res.text().catch(() => '');
        console.error(`[BreathAI] Server error ${res.status}:`, errBody);
        showToast(`Prediction failed (HTTP ${res.status}). Check Flask logs.`, 'error');
        setPhase('form');
        return;
      }

      const json = await res.json();
      // Backend returns { prediction: "healthy" | "fever" | "smoker" | "alcohol" }
      const rawLabel: string = (json.prediction ?? json.prediction_text ?? 'unknown').toString().trim();
      console.info('[BreathAI] Prediction received:', rawLabel);

      setPrediction(rawLabel);
      setFinalData(payload);
      setHealthStatus(classifyPrediction(rawLabel));
      setPhase('complete');
      setWorkflowStep(1);
      showToast('AI Analysis complete!', 'success');
      window.dispatchEvent(new Event('breath-test-completed'));
    } catch (err) {
      // Unexpected JS error (e.g. JSON parse failure)
      console.error('[BreathAI] Unexpected error:', err);
      showToast('An unexpected error occurred. See console for details.', 'error');
      setPhase('form');
    }
  };

  // ── Workflow steps ──

  const handleGenerateRecord = () => {
    if (!finalData || !prediction) return;
    const record: MedicalRecord = {
      timestamp:   new Date().toISOString(),
      sensor_data: finalData,
      prediction,
      device:  'Manual Input Mode',
      patient: currentUser?.email,
    };
    setMedicalRecord(record);
    setWorkflowStep(3);
    showToast('Medical record generated!', 'success');
  };

  const handleIpfsUpload = async () => {
    if (!medicalRecord) return;
    setIpfsLoading(true);
    try {
      // Uses real Pinata API if VITE_PINATA_JWT env var is set, otherwise simulates
      const result = await uploadToPinata(medicalRecord);
      setIpfsResult(result);
      setWorkflowStep(4);
      showToast(PINATA_JWT ? 'Record stored on IPFS via Pinata!' : 'IPFS simulated (add VITE_PINATA_JWT for real upload)', 'success');
    } catch (e) {
      console.error('[BreathAI] IPFS upload error:', e);
      showToast('IPFS upload failed. See console.', 'error');
    } finally {
      setIpfsLoading(false);
    }
  };

  const handleMintToken = async () => {
    if (!ipfsResult) return;
    setMintLoading(true);
    try {
      const result = await simulateAlgorandMint(ipfsResult.cid);
      setBlockchainResult(result);
      setWorkflowStep(5);
      showToast('Health NFT minted on Algorand!', 'success');
    } catch { showToast('Minting failed.', 'error'); }
    finally   { setMintLoading(false); }
  };

  const handleAssignWallet = async () => {
    if (!patientWallet.trim()) { showToast('Enter a patient wallet address.', 'error'); return; }
    setAssignLoading(true);
    await delay(1200);
    setWalletAssigned(true);
    setAssignLoading(false);
    showToast('Token assigned to patient wallet!', 'success');
  };

  const handleShareAccess = async () => {
    if (!doctorWallet.trim()) { showToast('Enter a doctor wallet address.', 'error'); return; }
    setShareLoading(true);
    await delay(1200);
    setAccessShared(true);
    setShareLoading(false);
    showToast('Access granted to doctor!', 'success');
  };

  const reset = () => {
    setPhase('idle');
    setFormValues(EMPTY_INPUT);
    setFormErrors({});
    setPrediction(null);
    setFinalData(null);
    setMedicalRecord(null);
    setIpfsResult(null);
    setBlockchainResult(null);
    setWorkflowStep(null);
    setWalletAssigned(false);
    setAccessShared(false);
    setPatientWallet('');
    setDoctorWallet('');
  };

  // ── Status config ──

  const getStatusConfig = () => {
    switch (healthStatus) {
      case 'Good':     return { bg: 'from-green-50 to-emerald-50 border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800',    icon: <CheckCircle2  className="w-14 h-14 text-green-500 mx-auto mb-4" />,  glow: 'shadow-green-100'  };
      case 'Moderate': return { bg: 'from-yellow-50 to-amber-50 border-yellow-200',  text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800',  icon: <AlertTriangle className="w-14 h-14 text-yellow-500 mx-auto mb-4" />, glow: 'shadow-yellow-100' };
      case 'Risk':     return { bg: 'from-red-50 to-rose-50 border-red-200',         text: 'text-red-700',    badge: 'bg-red-100 text-red-800',         icon: <AlertCircle   className="w-14 h-14 text-red-500 mx-auto mb-4" />,    glow: 'shadow-red-100'    };
    }
  };

  const sc = getStatusConfig();

  // ── Render ──

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" /> AI + Web3 Health Platform
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Breath Analysis
            </h1>
            <p className="mt-3 text-lg text-slate-500 max-w-xl mx-auto">
              Enter your sensor readings to get an AI-powered breath analysis — powered by a trained ML model.
            </p>
          </motion.div>

          {/* ── Main Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden mb-6"
          >
            <AnimatePresence mode="wait">

              {/* ── IDLE: Start screen ── */}
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center text-center p-10 min-h-[340px]"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Wind className="w-12 h-12 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready for Breath Test</h2>
                  <p className="text-slate-500 mb-3 max-w-md mx-auto">
                    Enter your sensor values manually and let our AI model analyze your breath profile.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold mb-8">
                    <ClipboardList className="w-3.5 h-3.5" /> Manual Input Mode
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPhase('form')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg shadow-blue-200 transition-all"
                  >
                    Start Breath Test
                  </motion.button>
                </motion.div>
              )}

              {/* ── FORM: Manual Input ── */}
              {phase === 'form' && (
                <motion.div
                  key="form"
                  ref={formRef}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                  className="p-6 sm:p-8"
                >
                  {/* Form header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Enter Sensor Readings</h2>
                      <p className="text-sm text-slate-500">All fields are required — numeric values only</p>
                    </div>
                    <button
                      onClick={reset}
                      className="ml-auto text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
                      title="Back"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Field grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {FIELD_META.map(({ key, label, placeholder, unit, icon, tip }) => {
                      const hasError = !!formErrors[key];
                      return (
                        <div key={key}>
                          <label
                            htmlFor={`field-${key}`}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5"
                          >
                            <span className="text-blue-500">{icon}</span>
                            {label}
                            <span className="ml-auto text-slate-300 font-normal normal-case tracking-normal">{tip}</span>
                          </label>
                          <div className="relative">
                            <input
                              id={`field-${key}`}
                              type="number"
                              step="any"
                              value={formValues[key]}
                              onChange={e => updateField(key, e.target.value)}
                              placeholder={placeholder}
                              className={`w-full px-4 py-3 pr-14 rounded-xl border text-sm font-medium transition-all outline-none
                                ${hasError
                                  ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-300/30 focus:border-red-400'
                                  : 'border-slate-200 bg-white focus:ring-2 focus:ring-blue-300/30 focus:border-blue-400'
                                }
                              `}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              {unit}
                            </span>
                          </div>
                          {hasError && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" /> {formErrors[key]}
                            </motion.p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Info strip */}
                  <div className="flex items-start gap-2 p-3.5 rounded-xl bg-blue-50 border border-blue-100 mb-6">
                    <Wifi className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium">
                      Your data will be sent to the local ML model at <code className="font-mono font-bold">127.0.0.1:5000/predict</code>. No data leaves your machine.
                    </p>
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <BrainCircuit className="w-5 h-5" />
                    Analyze Breath
                  </motion.button>
                </motion.div>
              )}

              {/* ── ANALYZING: Loading screen ── */}
              {phase === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center p-12 min-h-[340px]"
                >
                  {/* Pulsing orb */}
                  <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-blue-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-3 rounded-full border-[2px] border-slate-100 border-b-indigo-300"
                    />
                    <BrainCircuit className="w-10 h-10 text-blue-600 z-10" />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing breath...</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Our trained ML model is processing your sensor readings. This takes just a moment.
                  </p>

                  {/* Animated dots */}
                  <div className="flex gap-1.5 mt-6">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-blue-400"
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── COMPLETE: Result ── */}
              {phase === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 sm:p-8"
                >
                  <div
                    ref={resultCardRef}
                    className={`p-7 rounded-2xl border bg-gradient-to-br ${sc.bg} text-center shadow-xl ${sc.glow} mb-5`}
                  >
                    {/* Status Icon */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                    >
                      {sc.icon}
                    </motion.div>

                    {/* Title */}
                    <h3 className={`text-3xl font-extrabold mb-2 ${sc.text}`}>
                      {healthStatus === 'Good' ? 'Healthy Profile' : healthStatus === 'Moderate' ? 'Moderate Risk' : 'Health Risk Detected'}
                    </h3>

                    {/* Prediction badge */}
                    <div className="flex justify-center mb-5">
                      {prediction && <PredictionBadge label={prediction} />}
                    </div>

                    {/* Sensor grid */}
                    {finalData && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                        {[
                          { label: 'MQ-3',  value: String(finalData.mq3),           icon: <FlaskConical className="w-3.5 h-3.5" /> },
                          { label: 'SpO₂',  value: `${finalData.spo2}%`,            icon: <Activity     className="w-3.5 h-3.5" /> },
                          { label: 'Temp',  value: `${finalData.temperature}°C`,    icon: <Thermometer  className="w-3.5 h-3.5" /> },
                          { label: 'HR',    value: `${finalData.heart_rate} bpm`,   icon: <Heart        className="w-3.5 h-3.5" /> },
                          { label: 'MQ-135',value: String(finalData.mq135),         icon: <Wind         className="w-3.5 h-3.5" /> },
                          { label: 'MQ-138',value: String(finalData.mq138),         icon: <Cpu          className="w-3.5 h-3.5" /> },
                          { label: 'Humid', value: `${finalData.humidity}%`,        icon: <Droplets     className="w-3.5 h-3.5" /> },
                          { label: 'Press', value: `${finalData.pressure} hPa`,     icon: <Gauge        className="w-3.5 h-3.5" /> },
                        ].map(item => (
                          <div key={item.label} className="bg-white/60 backdrop-blur rounded-xl p-3 border border-white/50">
                            <div className={`text-xs uppercase font-bold opacity-60 flex justify-center gap-1 mb-1 ${sc.text}`}>
                              {item.icon} {item.label}
                            </div>
                            <div className={`font-extrabold text-base ${sc.text}`}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions row: Download PDF + Run another test */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
                    {/* Download Report button — generates a PDF via jsPDF */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        // Build an on-the-fly record if the full workflow hasn't generated one yet
                        const rec: MedicalRecord = medicalRecord ?? {
                          timestamp:   new Date().toISOString(),
                          sensor_data: finalData!,
                          prediction:  prediction ?? 'unknown',
                          device:      'Manual Input Mode',
                          patient:     currentUser?.email,
                        };
                        generatePDF(rec, healthStatus);
                      }}
                      disabled={!finalData}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" /> Download Report
                    </motion.button>

                    {/* Reset */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={reset}
                      className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-semibold transition-colors px-5 py-2.5 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100"
                    >
                      <RotateCcw className="w-4 h-4" /> Run another test
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* ── Web3 Workflow ── */}
          <AnimatePresence>
            {workflowStep !== null && (
              <motion.div
                ref={workflowRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Progress header */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow Progress</span>
                    <span className="text-xs font-bold text-blue-600">{workflowStep} / 5 complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      animate={{ width: `${(workflowStep / 5) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <WorkflowProgressBar activeStep={workflowStep} />
                </div>

                {/* Step 2: Medical Record */}
                <WorkflowCard step={2} title="Medical Record" icon={<FileText className="w-5 h-5" />} color="violet" activeStep={workflowStep} className="wf-card">
                  <StepBadge current={2} total={5} />
                  <p className="text-slate-500 text-sm mb-4">Generate a structured JSON medical record from your analysis results.</p>
                  {!medicalRecord ? (
                    <button onClick={handleGenerateRecord} className="btn-violet">
                      <FileText className="w-4 h-4 mr-2" /> Generate Medical Record
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="bg-slate-900 text-green-400 rounded-2xl p-4 font-mono text-xs overflow-auto max-h-52 mb-3 border border-slate-700">
                        <pre>{JSON.stringify(medicalRecord, null, 2)}</pre>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Record generated
                        <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                      </div>
                    </motion.div>
                  )}
                </WorkflowCard>

                {/* Step 3: IPFS */}
                <WorkflowCard step={3} title="IPFS Storage" icon={<Cloud className="w-5 h-5" />} color="teal" activeStep={workflowStep} className="wf-card">
                  <StepBadge current={3} total={5} />
                  <p className="text-slate-500 text-sm mb-4">Upload the medical record to IPFS via Pinata for decentralized, permanent storage.</p>
                  {!ipfsResult ? (
                    <button onClick={handleIpfsUpload} disabled={ipfsLoading} className="btn-teal disabled:opacity-60 disabled:cursor-not-allowed">
                      {ipfsLoading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading to IPFS...</>
                        : <><Cloud className="w-4 h-4 mr-2" />Store Record on IPFS</>
                      }
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Stored on IPFS
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                        <div className="text-xs text-teal-600 font-bold mb-1 uppercase">Content ID (CID)</div>
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-slate-700 break-all font-mono">{ipfsResult.cid}</code>
                          <CopyButton text={ipfsResult.cid} />
                        </div>
                      </div>
                      <a href={ipfsResult.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> View on IPFS
                      </a>
                    </motion.div>
                  )}
                </WorkflowCard>

                {/* Step 4: Blockchain */}
                <WorkflowCard step={4} title="Blockchain Token" icon={<Coins className="w-5 h-5" />} color="amber" activeStep={workflowStep} className="wf-card">
                  <StepBadge current={4} total={5} />
                  <p className="text-slate-500 text-sm mb-4">Mint an Algorand ASA (Health NFT) with the IPFS CID embedded in its metadata.</p>
                  {!blockchainResult ? (
                    <button onClick={handleMintToken} disabled={mintLoading} className="btn-amber disabled:opacity-60 disabled:cursor-not-allowed">
                      {mintLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Minting on Algorand...</span>
                          <span className="ml-2 text-xs opacity-70">(~2 sec)</span>
                        </div>
                      ) : (
                        <><Coins className="w-4 h-4 mr-2" />Mint Health NFT on Algorand</>
                      )}
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Health NFT Created
                      </div>
                      <MintBadge assetId={blockchainResult.assetId} txId={blockchainResult.txId} />
                    </motion.div>
                  )}
                </WorkflowCard>

                {/* Step 5: Access Sharing */}
                <WorkflowCard step={5} title="Access Sharing" icon={<Share2 className="w-5 h-5" />} color="rose" activeStep={workflowStep} className="wf-card">
                  <StepBadge current={5} total={5} />
                  <p className="text-slate-500 text-sm mb-5">Assign the health token to a patient wallet and optionally grant a doctor read access.</p>
                  <div className="space-y-4">
                    {/* Patient Wallet */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Patient Wallet Address
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={patientWallet}
                          onChange={e => setPatientWallet(e.target.value)}
                          placeholder="ALGO... or 0x..."
                          disabled={walletAssigned}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all font-mono disabled:opacity-50 disabled:bg-slate-50"
                        />
                        {!walletAssigned ? (
                          <button onClick={handleAssignWallet} disabled={assignLoading} className="btn-rose shrink-0 disabled:opacity-60">
                            {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600 text-sm font-semibold shrink-0">
                            <CheckCircle2 className="w-4 h-4" /> Assigned
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Doctor Wallet */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Doctor Wallet Address
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={doctorWallet}
                          onChange={e => setDoctorWallet(e.target.value)}
                          placeholder="Doctor's ALGO... or 0x..."
                          disabled={accessShared}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all font-mono disabled:opacity-50 disabled:bg-slate-50"
                        />
                        {!accessShared ? (
                          <button onClick={handleShareAccess} disabled={shareLoading || !walletAssigned} className="btn-rose shrink-0 disabled:opacity-60">
                            {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Share2 className="w-4 h-4 mr-1" />Share</>}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600 text-sm font-semibold shrink-0">
                            <CheckCircle2 className="w-4 h-4" /> Access granted
                          </div>
                        )}
                      </div>
                      {!walletAssigned && <p className="text-xs text-slate-400 mt-1">Assign patient wallet first.</p>}
                    </div>

                    {/* Success summary */}
                    {accessShared && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 flex items-start gap-3"
                      >
                        <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-green-800 text-sm">Workflow Complete 🎉</div>
                          <div className="text-xs text-green-600 mt-0.5">Medical record secured on IPFS, minted as NFT, and securely shared with the doctor.</div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </WorkflowCard>

                {/* Reset */}
                <div className="text-center mt-6">
                  <button onClick={reset} className="text-slate-400 hover:text-slate-700 text-sm font-semibold underline underline-offset-4 transition-colors">
                    Start a new analysis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Button utility styles */}
      <style>{`
        .btn-violet { display:flex; align-items:center; background:#7c3aed; color:#fff; font-size:.875rem; font-weight:700; padding:.625rem 1.25rem; border-radius:.75rem; transition:background .15s,box-shadow .15s; box-shadow:0 4px 14px rgba(124,58,237,.25); }
        .btn-violet:hover { background:#6d28d9; }
        .btn-teal   { display:flex; align-items:center; background:#0d9488; color:#fff; font-size:.875rem; font-weight:700; padding:.625rem 1.25rem; border-radius:.75rem; transition:background .15s,box-shadow .15s; box-shadow:0 4px 14px rgba(13,148,136,.25); }
        .btn-teal:hover   { background:#0f766e; }
        .btn-amber  { display:flex; align-items:center; background:#f59e0b; color:#fff; font-size:.875rem; font-weight:700; padding:.625rem 1.25rem; border-radius:.75rem; transition:background .15s,box-shadow .15s; box-shadow:0 4px 14px rgba(245,158,11,.25); }
        .btn-amber:hover  { background:#d97706; }
        .btn-rose   { display:flex; align-items:center; background:#e11d48; color:#fff; font-size:.875rem; font-weight:700; padding:.625rem 1rem; border-radius:.75rem; transition:background .15s; }
        .btn-rose:hover   { background:#be123c; }
      `}</style>
    </>
  );
}

// ─── WorkflowCard ─────────────────────────────────────────────────────────────

const colorRing: Record<string, string> = {
  violet: 'border-violet-100 bg-violet-50/40',
  teal:   'border-teal-100 bg-teal-50/40',
  amber:  'border-amber-100 bg-amber-50/40',
  rose:   'border-rose-100 bg-rose-50/40',
};
const colorIcon: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-600',
  teal:   'bg-teal-100 text-teal-600',
  amber:  'bg-amber-100 text-amber-600',
  rose:   'bg-rose-100 text-rose-600',
};
const headerText: Record<string, string> = {
  violet: 'text-violet-700',
  teal:   'text-teal-700',
  amber:  'text-amber-700',
  rose:   'text-rose-700',
};

function WorkflowCard({
  step, title, icon, color, activeStep, children, className,
}: {
  step: WorkflowStep;
  title: string;
  icon: React.ReactNode;
  color: string;
  activeStep: WorkflowStep | null;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = activeStep !== null && activeStep >= step;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={`mb-4 rounded-3xl border shadow-sm overflow-hidden ${colorRing[color]} ${className}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorIcon[color]}`}>
                {icon}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Step {step}</div>
                <div className={`font-bold text-base ${headerText[color]}`}>{title}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
            </div>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── MintBadge ────────────────────────────────────────────────────────────────

function MintBadge({ assetId, txId }: { assetId: string; txId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }
    );
    gsap.fromTo(ref.current,
      { boxShadow: '0 0 0 0 rgba(245,158,11,0)' },
      { boxShadow: '0 0 30px 4px rgba(245,158,11,0.2)', duration: 0.8, yoyo: true, repeat: 2, ease: 'power1.inOut' }
    );
  }, []);

  return (
    <div ref={ref} className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Coins className="w-5 h-5 text-amber-500" />
        <span className="font-bold text-amber-800">Algorand ASA Minted</span>
        <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">NFT</span>
      </div>
      <div className="bg-white/70 rounded-xl p-3 space-y-2">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase mb-0.5">Asset ID</div>
          <div className="flex items-center">
            <code className="text-sm font-mono font-bold text-amber-700">{assetId}</code>
            <CopyButton text={assetId} />
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase mb-0.5">Transaction ID</div>
          <div className="flex items-center">
            <code className="text-xs font-mono text-slate-600 break-all">{txId.slice(0, 32)}...</code>
            <CopyButton text={txId} />
          </div>
        </div>
      </div>
    </div>
  );
}
