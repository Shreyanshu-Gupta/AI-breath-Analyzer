import { Wind, Activity, ArrowRight } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-32">
      <div className="absolute inset-0 bg-blue-50/50" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-100/50 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-600 mb-6">
              <Activity className="w-4 h-4 mr-2" />
              Next-Gen Diagnostics
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
              Detect Diseases With Your <span className="text-blue-600">Breath</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Experience the future of non-invasive AI diagnosis. Our cutting-edge sensor technology analyzes your breath in real-time to provide immediate, clinical-grade health insights at a fraction of the cost.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:-translate-y-1"
              >
                Start Breath Test
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="relative flex justify-center hidden md:flex">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-50" />
            <div className="relative w-80 h-80 rounded-[2rem] bg-white shadow-2xl p-8 border border-slate-100 flex flex-col items-center justify-center gap-6">
              <Wind className="w-32 h-32 text-blue-500 opacity-80" />
              <div className="text-center font-medium text-slate-500">
                AI Breathing Analysis
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
