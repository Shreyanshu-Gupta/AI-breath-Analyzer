import { AlertCircle, Stethoscope, Wallet } from 'lucide-react';

export function Problem() {
  const problems = [
    {
      icon: <Stethoscope className="w-8 h-8 text-rose-500" />,
      title: "Lack of Access",
      description: "Rural healthcare often lacks dedicated prognostic equipment, leaving millions without early disease detection capabilities."
    },
    {
      icon: <Wallet className="w-8 h-8 text-rose-500" />,
      title: "Costly Tests",
      description: "Traditional blood tests, MRIs, and biopsies are expensive and require large laboratory setups."
    },
    {
      icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
      title: "Invasive Procedures",
      description: "Current diagnostic methods are often invasive, time-consuming, and uncomfortable for patients."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">The Challenge in Healthcare</h2>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            Modern diagnostics remain inaccessible, expensive, and invasive for the vast majority of the global population.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {problems.map((prob, index) => (
            <div key={index} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="bg-rose-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                {prob.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{prob.title}</h3>
              <p className="text-slate-600 leading-relaxed">{prob.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
