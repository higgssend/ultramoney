
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cloud, Globe, Smartphone, Laptop, ArrowRight } from 'lucide-react';

const CloudFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-sky-500 selection:text-white">
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Disponibilidad Total</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-sky-500 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 mb-8">
              <Cloud className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Tu oficina en <span className="text-sky-500">cualquier lugar.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              No dependas de un servidor físico en tu local. Ultramoney vive en la nube, permitiéndote gestionar tu financiera desde la playa, tu casa o en ruta.
          </p>
          <div className="flex justify-center gap-8 text-6xl text-slate-300 dark:text-slate-700 animate-pulse">
              <Smartphone className="w-20 h-20" />
              <Laptop className="w-20 h-20" />
              <Globe className="w-20 h-20" />
          </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600"><Globe className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Acceso 24/7</h3>
                  <p className="text-slate-600 dark:text-slate-400">El sistema nunca cierra. Consulta reportes a medianoche o registra pagos en días feriados sin interrupciones.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Smartphone className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">100% Responsivo</h3>
                  <p className="text-slate-600 dark:text-slate-400">La interfaz se adapta perfectamente a tu celular. Los cobradores pueden trabajar cómodamente desde sus smartphones.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Cloud className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sin Instalaciones</h3>
                  <p className="text-slate-600 dark:text-slate-400">Olvídate de técnicos y mantenimientos de servidores. Solo inicia sesión y listo.</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Ir a la Nube <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default CloudFeature;
