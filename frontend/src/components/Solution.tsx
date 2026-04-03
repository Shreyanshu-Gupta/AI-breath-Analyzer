import { Cpu, Wind, ShieldCheck } from 'lucide-react';

export function Solution() {
  const features = [
    {
      icon: <Wind className="w-6 h-6 text-blue-600" />,
      title: "Real-time Breath Analysis",
      description: "Advanced Volatile Organic Compound (VOC) sensors precisely measure the chemical composition of your breath in seconds."
    },
    {
      icon: <Cpu className="w-6 h-6 text-blue-600" />,
      title: "AI-Powered Diagnostics",
      description: "Multi-parameter localized ML models instantly parse MQ3, MQ135, and cardiovascular data to predict pathological patterns."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      title: "Clinical Precision",
      description: "Achieves remarkable accuracy by cross-referencing VOC markers with environmental factors like pressure and humidity."
    }
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">The BreathAI Solution</h2>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              We developed a revolutionary, pocket-sized hardware platform utilizing generic gas sensors enhanced with state-of-the-art Deep Learning. By making diagnostics as simple as breathing, we can detect diseases up to 100x cheaper than clinical labs.
            </p>
            
            <div className="mt-10 space-y-8">
              {features.map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-slate-900">{feature.title}</h4>
                    <p className="mt-2 text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-blue-200 rounded-[3rem] blur-3xl opacity-50 transform rotate-3" />
            <div className="relative bg-white rounded-[3rem] p-8 shadow-2xl border border-white/50 aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50">
               <div className="w-full max-w-sm rounded-2xl bg-slate-900 shadow-2xl p-6 overflow-hidden">
                 <div className="flex items-center justify-between mb-8">
                   <div className="text-white font-medium flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     Live Sensor Feed
                   </div>
                   <Wind className="text-blue-400 w-5 h-5" />
                 </div>
                 <div className="space-y-4">
                   {[80, 45, 92, 30].map((width, i) => (
                     <div key={i} className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 rounded-full" 
                         style={{ width: `${width}%`, transition: 'width 2s ease-in-out' }}
                       />
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
