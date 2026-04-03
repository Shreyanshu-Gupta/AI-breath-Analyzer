import { Activity, Clock, ShieldCheck, Wind } from 'lucide-react';
import { motion } from 'framer-motion';

export function Dashboard() {
  const history = [
    { date: 'Today, 10:45 AM', prediction: 'Healthy Profile', severity: 'low', values: { spo2: 98, hr: 72 } },
    { date: 'Yesterday, 02:15 PM', prediction: 'Mild Irregularity Detected (VOC elevated)', severity: 'warning', values: { spo2: 96, hr: 81 } },
    { date: 'Oct 15, 09:00 AM', prediction: 'Healthy Profile', severity: 'low', values: { spo2: 99, hr: 68 } },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Patient Dashboard</h1>
          <p className="mt-2 text-slate-600">Review your past breath analysis results and tracking metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatBox title="Average SpO2" value="97.6%" icon={<Wind />} trend="+0.2%" />
          <StatBox title="Resting Heart Rate" value="70 bpm" icon={<Activity />} trend="-2 bpm" />
          <StatBox title="Recent Readings" value="12" icon={<Clock />} trend="" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-500" /> Analysis History
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {history.map((record, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">{record.date}</div>
                  <div className={`font-semibold ${record.severity === 'low' ? 'text-green-700' : 'text-amber-600'}`}>
                    {record.prediction}
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Wind className="w-4 h-4 text-slate-400" />
                    SpO2: <span className="font-medium text-slate-900">{record.values.spo2}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Activity className="w-4 h-4 text-slate-400" />
                    HR: <span className="font-medium text-slate-900">{record.values.hr}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        {trend && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <div className="text-sm font-medium text-slate-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
