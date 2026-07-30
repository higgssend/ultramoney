
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Infinity, Server, Database, Zap, ArrowRight } from 'lucide-react';

const ScalabilityFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-violet-500 selection:text-white">
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-violet-600 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Escalabilidad Infinita</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-violet-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-8">
              <Infinity className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Crece sin <span className="text-violet-600">límites técnicos.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              Desde 10 préstamos hasta 100,000. Nuestra arquitectura está diseñada para soportar cargas masivas sin perder velocidad ni estabilidad.
          </p>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600"><Database className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Base de Datos Distribuida</h3>
                  <p className="text-slate-600 dark:text-slate-400">Tus datos se replican automáticamente para garantizar un acceso rápido sin importar cuántos usuarios estén conectados.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center text-fuchsia-600"><Zap className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rendimiento Optimizado</h3>
                  <p className="text-slate-600 dark:text-slate-400">El sistema carga en milisegundos. Optimizamos cada consulta para que tus cobradores no pierdan tiempo esperando.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Server className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Microservicios</h3>
                  <p className="text-slate-600 dark:text-slate-400">Arquitectura moderna que permite actualizar módulos individuales sin detener el sistema completo.</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Escalar Ahora <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default ScalabilityFeature;
