import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Clock, ShieldCheck, Wind, ArrowRight, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface HistoryRecord {
  _id: string;
  timestamp: string;
  prediction: string;
  values?: { spo2: number; hr: number };
}

interface Stats {
  total: number;
  avgSpo2: string;
  avgHr: string;
  lastPrediction: string;
}

// -------- Skeleton Loader --------
function StatSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-slate-200" />
        <div className="w-14 h-5 rounded-full bg-slate-200" />
      </div>
      <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
      <div className="h-8 w-16 bg-slate-200 rounded" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
      <div>
        <div className="h-3.5 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-5 w-44 bg-slate-200 rounded" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// -------- Animated number counter --------
function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Try to parse numeric part for animation
  useEffect(() => {
    if (!ref.current) return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const obj = { n: 0 };
    gsap.to(obj, {
      n: num,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = obj.n.toFixed(value.includes('.') ? 1 : 0) + suffix;
        }
      },
    });
  }, [value, suffix]);

  return <span ref={ref}>{value}{suffix}</span>;
}

// -------- Stat Card --------
function StatBox({
  title,
  value,
  icon,
  color,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 24, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, delay, ease: 'power2.out' }
    );

    // Hover lift
    const el = cardRef.current;
    const onEnter = () => gsap.to(el, { y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.08)', duration: 0.25 });
    const onLeave = () => gsap.to(el, { y: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', duration: 0.25 });
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [delay]);

  return (
    <div ref={cardRef} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-default">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-sm font-medium text-slate-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900">
        <AnimatedNumber value={value} />
      </div>
    </div>
  );
}

// -------- Main Dashboard --------
export function Dashboard() {
  const { token, currentUser, logout } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const navigate = useNavigate();

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef<HTMLDivElement>(null);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        showToast('Session expired. Please log in again.', 'error');
        logout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        const records: HistoryRecord[] = data.history;
        setHistory(records);

        // Compute live stats
        const total = records.length;
        const spo2Values = records.map(r => r.values?.spo2).filter(Boolean) as number[];
        const hrValues = records.map(r => r.values?.hr).filter(Boolean) as number[];

        setStats({
          total,
          avgSpo2:
            spo2Values.length > 0
              ? (spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length).toFixed(1)
              : '--',
          avgHr:
            hrValues.length > 0
              ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length).toString()
              : '--',
          lastPrediction: records[0]?.prediction ?? 'No tests yet',
        });
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      showToast('Failed to load history. Is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, logout, showToast]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Listen for breath test completion event → refetch
  useEffect(() => {
    const handler = () => {
      fetchHistory();
      showToast('Test complete! Dashboard updated.', 'success');
    };
    window.addEventListener('breath-test-completed', handler);
    return () => window.removeEventListener('breath-test-completed', handler);
  }, [fetchHistory, showToast]);

  // Animate history rows when loaded
  useEffect(() => {
    if (loading || !historyRef.current) return;
    const rows = historyRef.current.querySelectorAll('.history-row');
    gsap.fromTo(
      rows,
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
    );
  }, [loading, history]);

  const getPredictionColor = (p: string) => {
    if (p === 'Healthy Profile') return 'text-green-700 bg-green-50';
    if (p.toLowerCase().includes('mild') || p.toLowerCase().includes('minor')) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome, <span className="text-blue-600">{currentUser?.name?.split(' ')[0] ?? 'Patient'}</span>
            </h1>
            <p className="mt-2 text-slate-500 text-lg">
              Real-time breath analysis dashboard — powered by AI
            </p>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {loading ? (
              <>
                <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
              </>
            ) : (
              <>
                <StatBox title="Total Tests" value={String(stats?.total ?? 0)} icon={<Clock className="w-5 h-5 text-blue-600" />} color="bg-blue-50" delay={0} />
                <StatBox title="Avg SpO₂" value={stats?.avgSpo2 ?? '--'} icon={<Wind className="w-5 h-5 text-teal-600" />} color="bg-teal-50" delay={0.1} />
                <StatBox title="Avg Heart Rate" value={stats?.avgHr !== '--' ? stats!.avgHr + ' bpm' : '--'} icon={<Activity className="w-5 h-5 text-rose-500" />} color="bg-rose-50" delay={0.2} />
                <StatBox title="Last Result" value={stats?.lastPrediction ?? '--'} icon={<ShieldCheck className="w-5 h-5 text-violet-500" />} color="bg-violet-50" delay={0.3} />
              </>
            )}
          </div>

          {/* History Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" /> Analysis History
              </h2>
              {!loading && history.length > 0 && (
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                  {history.length} record{history.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div ref={historyRef} className="divide-y divide-slate-100">
              {loading ? (
                <><RowSkeleton /><RowSkeleton /><RowSkeleton /></>
              ) : history.length === 0 ? (
                <div className="p-14 text-center">
                  <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium mb-4">No breath analysis history yet.</p>
                  <button
                    onClick={() => navigate('/test')}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
                  >
                    Take Your First Test <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                history.map((record) => (
                  <div
                    key={record._id}
                    className="history-row p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-1">{record.timestamp}</div>
                      <span
                        className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${getPredictionColor(record.prediction)}`}
                      >
                        {record.prediction}
                      </span>
                    </div>
                    <div className="flex gap-5 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-teal-400" />
                        SpO₂: <span className="font-bold text-slate-800">{record.values?.spo2 ?? '--'}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-rose-400" />
                        HR: <span className="font-bold text-slate-800">{record.values?.hr ?? '--'} bpm</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
