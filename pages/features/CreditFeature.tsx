
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Shield, Activity, FileCheck, ArrowRight } from 'lucide-react';

const CreditFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Consulta Crediticia</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-8">
              <Search className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Conoce a tu cliente <span className="text-blue-600">antes de prestar.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              Evita riesgos innecesarios. Nuestra herramienta simula consultas a burós de crédito y utiliza inteligencia interna para calificar a cada solicitante en segundos.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=1000" 
            alt="Credit Analysis" 
            className="rounded-3xl shadow-2xl border-4 border-slate-200 dark:border-slate-800 w-full"
          />
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Shield className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Score Predictivo</h3>
                  <p className="text-slate-600 dark:text-slate-400">Algoritmo propio que evalúa el riesgo basado en el historial interno y datos demográficos.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Activity className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Historial Unificado</h3>
                  <p className="text-slate-600 dark:text-slate-400">Si un cliente ya tiene deudas en otra sucursal tuya, el sistema lo detecta al instante.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><FileCheck className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Validación de Documentos</h3>
                  <p className="text-slate-600 dark:text-slate-400">Almacena y verifica cédulas y pasaportes digitalmente para evitar suplantación de identidad.</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Empezar a Evaluar <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default CreditFeature;
