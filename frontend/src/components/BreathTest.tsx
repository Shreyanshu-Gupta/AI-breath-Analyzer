import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Activity, Thermometer, Droplets, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

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

export function BreathTest() {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [status, setStatus] = useState<'Good' | 'Moderate' | 'Risk'>('Good');
  const [finalData, setFinalData] = useState<SensorData | null>(null);

  const startTest = async () => {
    setPhase('scanning');
    
    // Simulate analyzing for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Use sample sensor data (for now)
    const data: SensorData = {
      mq3: 120,
      mq135: 200,
      mq138: 150,
      temp: 36.5,
      humidity: 45,
      pressure: 1012,
      spo2: 98,
      hr: 72
    };
    
    setFinalData(data);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:5001/predict', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      
      let resultText = "Healthy Profile";
      if (res.ok) {
        const json = await res.json();
        resultText = json.prediction_text || "Healthy Profile";
        setPrediction(resultText);
        
        // Determine color/status artificially based on strings
        const lowerReq = resultText.toLowerCase();
        if (lowerReq.includes("elevated") || lowerReq.includes("danger") || lowerReq.includes("risk")) {
          setStatus('Risk');
        } else if (lowerReq.includes("irregularity") || lowerReq.includes("minor")) {
          setStatus('Moderate');
        } else {
          setStatus('Good');
        }
      } else {
        setPrediction("Error: Could not process prediction.");
        setStatus('Risk');
      }
    } catch (err) {
      console.error(err);
      setPrediction("Error: Unable to connect to backend server.");
      setStatus('Risk');
    }

    setPhase('complete');
  };

  const getStatusColor = () => {
    switch(status) {
      case 'Good': return 'bg-green-50 text-green-700 border-green-200';
      case 'Moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Risk': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = () => {
    switch(status) {
      case 'Good': return <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />;
      case 'Moderate': return <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />;
      case 'Risk': return <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex flex-col items-center">
      <div className="max-w-3xl w-full px-4 sm:px-6">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AI Breath Analysis</h1>
          <p className="mt-3 text-lg text-slate-600">
            Real-time, non-invasive health insights powered by advanced sensor logic.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative min-h-[400px] flex items-center justify-center p-8">
          <AnimatePresence mode="wait">
            
            {/* IDLE PHASE */}
            {phase === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center w-full"
              >
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wind className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready for Test</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Click the button below to initiate the sensory collection sequence. Breathe normally.
                </p>
                <button 
                  onClick={startTest}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
                >
                  Start Breath Test
                </button>
              </motion.div>
            )}

            {/* SCANNING PHASE */}
            {phase === 'scanning' && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center w-full flex flex-col items-center"
              >
                <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-[4px] border-slate-100 border-t-blue-500"
                  />
                  <Wind className="w-10 h-10 text-blue-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing breath...</h3>
                <p className="text-slate-500">Cross-referencing VOC markers with AI model</p>
              </motion.div>
            )}

            {/* COMPLETE PHASE */}
            {phase === 'complete' && (
              <motion.div 
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className={`p-8 rounded-2xl border text-center ${getStatusColor()} transition-colors duration-500`}>
                  {getStatusIcon()}
                  <h3 className="text-3xl font-extrabold mb-1">Status: {status}</h3>
                  <p className="text-lg font-medium opacity-90 mb-6">{prediction}</p>
                  
                  {/* Small stat grid to show the generated values visually appealing */}
                  {finalData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                           <div className="text-xs uppercase font-bold opacity-70 mb-1 flex justify-center items-center gap-1"><Wind className="w-3 h-3"/> VOCs</div>
                           <div className="font-bold text-lg">{finalData.mq3}</div>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                           <div className="text-xs uppercase font-bold opacity-70 mb-1 flex justify-center items-center gap-1"><Activity className="w-3 h-3"/> SpO2</div>
                           <div className="font-bold text-lg">{finalData.spo2}%</div>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                           <div className="text-xs uppercase font-bold opacity-70 mb-1 flex justify-center items-center gap-1"><Thermometer className="w-3 h-3"/> Temp</div>
                           <div className="font-bold text-lg">{finalData.temp}°C</div>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                           <div className="text-xs uppercase font-bold opacity-70 mb-1 flex justify-center items-center gap-1"><Droplets className="w-3 h-3"/> Humid</div>
                           <div className="font-bold text-lg">{finalData.humidity}%</div>
                        </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 text-center">
                  <button 
                    onClick={() => setPhase('idle')}
                    className="text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4"
                  >
                    Run another test
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
