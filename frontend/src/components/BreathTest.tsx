import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Wind, Activity, Thermometer, Droplets,
  CheckCircle2, AlertCircle, AlertTriangle,
  Wifi, Cpu, BrainCircuit,
  FileText, Cloud, Coins, Wallet, Share2,
  ExternalLink, Copy, Loader2, ChevronRight,
  ShieldCheck, Zap, ChevronDown,
} from 'lucide-react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SensorData {
  mq3: number;
  mq135: number;
  mq138: number;
  temp: number;
  humidity: number;
  pressure: number;
  spo2: number;
  hr: number;
}

interface MedicalRecord {
  timestamp: string;
  sensor_data: {
    mq3: number;
    mq135: number;
    mq138: number;
    temperature: number;
    humidity: number;
    pressure: number;
    spo2: number;
    heart_rate: number;
  };
  prediction: string;
  device: string;
  patient?: string;
}

type ScanPhase = 'idle' | 'connecting' | 'receiving' | 'analyzing' | 'complete';
type WorkflowStep = 1 | 2 | 3 | 4 | 5;
type HealthStatus = 'Good' | 'Moderate' | 'Risk';

interface IpfsResult { cid: string; url: string }
interface BlockchainResult { assetId: string; txId: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const SCAN_STEPS = [
  { phase: 'connecting' as ScanPhase, label: 'Connecting to device...', icon: <Wifi className="w-8 h-8" /> },
  { phase: 'receiving' as ScanPhase, label: 'Receiving sensor data...', icon: <Cpu className="w-8 h-8" /> },
  { phase: 'analyzing' as ScanPhase, label: 'Analyzing with AI model...', icon: <BrainCircuit className="w-8 h-8" /> },
];

// Representative fixed sensor payload (no physical device)
const SENSOR_DATA: SensorData = {
  mq3: 120, mq135: 200, mq138: 150,
  temp: 36.5, humidity: 45, pressure: 1012,
  spo2: 98, hr: 72,
};

const WORKFLOW_META = [
  { step: 1, title: 'AI Prediction',      icon: BrainCircuit, color: 'blue' },
  { step: 2, title: 'Medical Record',     icon: FileText,     color: 'violet' },
  { step: 3, title: 'IPFS Storage',       icon: Cloud,        color: 'teal' },
  { step: 4, title: 'Blockchain Token',   icon: Coins,        color: 'amber' },
  { step: 5, title: 'Access Sharing',     icon: Share2,       color: 'rose' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function randHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/** Simulate Pinata IPFS upload — returns a deterministic-looking CID */
async function simulateIpfsUpload(_record: MedicalRecord): Promise<IpfsResult> {
  await delay(1800);
  // Real implementation would POST to https://api.pinata.cloud/pinning/pinJSONToIPFS
  // with header Authorization: Bearer <PINATA_JWT>
  const hash = 'Qm' + randHex(44);
  return { cid: hash, url: `https://gateway.pinata.cloud/ipfs/${hash}` };
}

/** Simulate Algorand ASA minting */
async function simulateAlgorandMint(cid: string): Promise<BlockchainResult> {
  await delay(2200);
  void cid; // would embed in asset metadata
  return {
    assetId: String(Math.floor(800_000_000 + Math.random() * 100_000_000)),
    txId: randHex(52).toUpperCase(),
  };
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
    <button
      onClick={copy}
      className="ml-2 text-slate-400 hover:text-blue-500 transition-colors"
      title="Copy"
    >
      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function WorkflowProgressBar({ activeStep }: { activeStep: WorkflowStep | null }) {
  return (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
      {WORKFLOW_META.map(({ step, title, icon: Icon, color }) => {
        const done = activeStep !== null && step < activeStep;
        const active = activeStep === step;

        const colorMap: Record<string, string> = {
          blue: 'bg-blue-500 text-white border-blue-500',
          violet: 'bg-violet-500 text-white border-violet-500',
          teal: 'bg-teal-500 text-white border-teal-500',
          amber: 'bg-amber-500 text-white border-amber-500',
          rose: 'bg-rose-500 text-white border-rose-500',
        };
        const activeRing: Record<string, string> = {
          blue: 'ring-blue-200',
          violet: 'ring-violet-200',
          teal: 'ring-teal-200',
          amber: 'ring-amber-200',
          rose: 'ring-rose-200',
        };

        return (
          <div key={step} className="flex flex-col items-center z-10 gap-1.5">
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm
                ${done ? colorMap[color] : active ? `${colorMap[color]} ring-4 ${activeRing[color]} scale-110` : 'bg-white border-slate-200 text-slate-400'}
              `}
            >
              {done
                ? <CheckCircle2 className="w-4 h-4" />
                : <Icon className="w-4 h-4" />
              }
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BreathTest() {
  const { token, currentUser, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();

  // Scan states
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [scanStep, setScanStep] = useState(0);

  // Result states
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
  const stepIconRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);

  // Animations
  useEffect(() => {
    if (!stepIconRef.current) return;
    gsap.fromTo(stepIconRef.current,
      { scale: 0.7, opacity: 0, rotate: -15 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.45, ease: 'back.out(1.7)' }
    );
  }, [scanStep, scanPhase]);

  useEffect(() => {
    if (scanPhase !== 'complete' || !resultCardRef.current) return;
    gsap.fromTo(resultCardRef.current,
      { scale: 0.88, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)' }
    );
    gsap.fromTo(resultCardRef.current,
      { boxShadow: '0 0 0px rgba(59,130,246,0)' },
      { boxShadow: '0 0 50px rgba(59,130,246,0.15)', duration: 0.8, yoyo: true, repeat: 2, ease: 'power1.inOut' }
    );
  }, [scanPhase]);

  useEffect(() => {
    if (!workflowStep || !workflowRef.current) return;
    const cards = workflowRef.current.querySelectorAll('.wf-card');
    gsap.fromTo(cards[workflowStep - 1] ?? cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
    );
  }, [workflowStep]);

  // ── Scan Logic ──

  const startTest = async () => {
    setScanPhase('connecting');
    setScanStep(0);
    setWorkflowStep(null);
    setPrediction(null);
    setMedicalRecord(null);
    setIpfsResult(null);
    setBlockchainResult(null);
    setWalletAssigned(false);
    setAccessShared(false);

    await delay(1200);
    setScanPhase('receiving');
    setScanStep(1);
    await delay(1200);
    setScanPhase('analyzing');
    setScanStep(2);

    try {
      const res = await fetch('http://127.0.0.1:5001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(SENSOR_DATA),
      });

      if (res.status === 401) {
        showToast('Session expired. Logging out.', 'error');
        logout();
        return;
      }

      await delay(600);

      if (res.ok) {
        const json = await res.json();
        const resultText: string = json.prediction_text ?? 'Healthy Profile';
        setPrediction(resultText);
        setFinalData(SENSOR_DATA);

        const lower = resultText.toLowerCase();
        if (lower.includes('elevated') || lower.includes('danger') || lower.includes('significant')) {
          setHealthStatus('Risk');
        } else if (lower.includes('mild') || lower.includes('minor') || lower.includes('irregularity')) {
          setHealthStatus('Moderate');
        } else {
          setHealthStatus('Good');
        }

        setScanPhase('complete');
        setWorkflowStep(1);
        showToast('AI Analysis complete!', 'success');
        window.dispatchEvent(new Event('breath-test-completed'));
      } else {
        throw new Error('Server error');
      }
    } catch {
      setPrediction('Error: Unable to reach backend server.');
      setHealthStatus('Risk');
      setFinalData(SENSOR_DATA);
      setScanPhase('complete');
      setWorkflowStep(1);
      showToast('Could not reach backend server.', 'error');
    }
  };

  // ── Workflow Steps ──

  const handleGenerateRecord = () => {
    if (!finalData || !prediction) return;
    const record: MedicalRecord = {
      timestamp: new Date().toISOString(),
      sensor_data: {
        mq3: finalData.mq3,
        mq135: finalData.mq135,
        mq138: finalData.mq138,
        temperature: finalData.temp,
        humidity: finalData.humidity,
        pressure: finalData.pressure,
        spo2: finalData.spo2,
        heart_rate: finalData.hr,
      },
      prediction,
      device: 'Breath Analyzer v1',
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
      const result = await simulateIpfsUpload(medicalRecord);
      setIpfsResult(result);
      setWorkflowStep(4);
      showToast('Record stored on IPFS!', 'success');
    } catch {
      showToast('IPFS upload failed.', 'error');
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
    } catch {
      showToast('Minting failed.', 'error');
    } finally {
      setMintLoading(false);
    }
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
    setScanPhase('idle');
    setScanStep(0);
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
      case 'Good':    return { bg: 'from-green-50 to-emerald-50 border-green-200', text: 'text-green-700', icon: <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" /> };
      case 'Moderate':return { bg: 'from-yellow-50 to-amber-50 border-yellow-200', text: 'text-yellow-700', icon: <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" /> };
      case 'Risk':    return { bg: 'from-red-50 to-rose-50 border-red-200',        text: 'text-red-700',   icon: <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" /> };
    }
  };

  const sc = getStatusConfig();
  const isScanning = ['connecting', 'receiving', 'analyzing'].includes(scanPhase);
  const curScanInfo = isScanning ? SCAN_STEPS[scanStep] : null;

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
              Analyze, record, and secure your health data on the blockchain—powered by AI.
            </p>
          </motion.div>

          {/* ── Scan Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden mb-6"
          >
            <div className="min-h-[360px] flex items-center justify-center p-8">
              <AnimatePresence mode="wait">

                {/* Idle */}
                {scanPhase === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center w-full">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Wind className="w-12 h-12 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready for Breath Test</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">Initiate the sensor collection sequence. Breathe normally during the scan.</p>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      onClick={startTest}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg shadow-blue-200 transition-all"
                    >
                      Start Breath Test
                    </motion.button>
                  </motion.div>
                )}

                {/* Scanning */}
                {isScanning && curScanInfo && (
                  <motion.div key={scanPhase} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center flex flex-col items-center w-full">
                    <div className="flex items-center gap-2 mb-8">
                      {SCAN_STEPS.map((s, i) => (
                        <div key={s.phase} className={`h-2 rounded-full transition-all duration-500 ${i < scanStep ? 'w-8 bg-blue-500' : i === scanStep ? 'w-12 bg-blue-600' : 'w-6 bg-slate-200'}`} />
                      ))}
                    </div>
                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-blue-500" />
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-3 rounded-full border-[2px] border-slate-100 border-b-indigo-300" />
                      <div ref={stepIconRef} className="text-blue-600 z-10">{curScanInfo.icon}</div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{curScanInfo.label}</h3>
                    <p className="text-slate-400 text-sm">Step {scanStep + 1} of {SCAN_STEPS.length}</p>
                  </motion.div>
                )}

                {/* Result */}
                {scanPhase === 'complete' && (
                  <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                    <div ref={resultCardRef} className={`p-7 rounded-2xl border bg-gradient-to-br ${sc.bg} text-center`}>
                      {sc.icon}
                      <h3 className={`text-2xl font-extrabold mb-1 ${sc.text}`}>
                        AI Result: <span className="ml-1">{healthStatus}</span>
                      </h3>
                      <p className={`text-base font-medium opacity-80 mb-5 ${sc.text}`}>{prediction}</p>

                      {finalData && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                          {[
                            { label: 'VOCs', value: String(finalData.mq3), icon: <Wind className="w-3.5 h-3.5" /> },
                            { label: 'SpO₂', value: `${finalData.spo2}%`, icon: <Activity className="w-3.5 h-3.5" /> },
                            { label: 'Temp', value: `${finalData.temp}°C`, icon: <Thermometer className="w-3.5 h-3.5" /> },
                            { label: 'HR', value: `${finalData.hr} bpm`, icon: <Droplets className="w-3.5 h-3.5" /> },
                          ].map(item => (
                            <div key={item.label} className="bg-white/60 backdrop-blur rounded-xl p-3 border border-white/50">
                              <div className={`text-xs uppercase font-bold opacity-60 flex justify-center gap-1 mb-1 ${sc.text}`}>{item.icon} {item.label}</div>
                              <div className={`font-extrabold text-lg ${sc.text}`}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 text-center">
                      <button onClick={reset} className="text-slate-400 hover:text-slate-700 text-sm font-semibold underline underline-offset-4 transition-colors">
                        Run another test
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
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

                {/* ── Step 2: Medical Record ── */}
                <WorkflowCard step={2} title="Medical Record" icon={<FileText className="w-5 h-5" />} color="violet" activeStep={workflowStep} className="wf-card">
                  <StepBadge current={2} total={5} />
                  <p className="text-slate-500 text-sm mb-4">Generate a structured JSON medical record from your analysis results.</p>

                  {!medicalRecord ? (
                    <button
                      onClick={handleGenerateRecord}
                      className="btn-violet"
                    >
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

                {/* ── Step 3: IPFS ── */}
                <WorkflowCard step={3} title="IPFS Storage" icon={<Cloud className="w-5 h-5" />} color="teal" activeStep={workflowStep} className="wf-card">
                  <StepBadge current={3} total={5} />
                  <p className="text-slate-500 text-sm mb-4">Upload the medical record to IPFS via Pinata for decentralized, permanent storage.</p>

                  {!ipfsResult ? (
                    <button onClick={handleIpfsUpload} disabled={ipfsLoading} className="btn-teal disabled:opacity-60 disabled:cursor-not-allowed">
                      {ipfsLoading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading to IPFS...</>
                        : <><Cloud className="w-4 h-4 mr-2" /> Store Record on IPFS</>
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
                      <a
                        href={ipfsResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> View on IPFS
                      </a>
                    </motion.div>
                  )}
                </WorkflowCard>

                {/* ── Step 4: Blockchain ── */}
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
                        <><Coins className="w-4 h-4 mr-2" /> Mint Health NFT on Algorand</>
                      )}
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Health NFT Created
                      </div>

                      {/* Animated mint badge */}
                      <MintBadge assetId={blockchainResult.assetId} txId={blockchainResult.txId} />
                    </motion.div>
                  )}
                </WorkflowCard>

                {/* ── Step 5: Access ── */}
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
                            {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Share2 className="w-4 h-4 mr-1" /> Share</>}
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

      {/* Injected button utility styles */}
      <style>{`
        .btn-violet { @apply flex items-center bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-violet-200; }
        .btn-teal   { @apply flex items-center bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-teal-200; }
        .btn-amber  { @apply flex items-center bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-200; }
        .btn-rose   { @apply flex items-center bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm; }
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
  const isLocked = activeStep === null || step > activeStep;

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
              {!isLocked && <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />}
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

