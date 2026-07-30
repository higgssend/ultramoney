
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, PieChart, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

const AccountingFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Contabilidad Automática</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-8">
              <FileText className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Tus números, <span className="text-emerald-600">siempre claros.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              Olvídate de las hojas de Excel y los errores manuales. Ultramoney registra cada movimiento automáticamente y genera tu libro mayor en tiempo real.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000" 
            alt="Accounting Dashboard" 
            className="rounded-3xl shadow-2xl border-4 border-slate-200 dark:border-slate-800 w-full opacity-90"
          />
      </section>

      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><PieChart className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Estado de Resultados</h3>
                  <p className="text-slate-600 dark:text-slate-400">Visualiza exactamente cuánto ganaste este mes, separando capital retornado de intereses netos.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><DollarSign className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cierre de Caja</h3>
                  <p className="text-slate-600 dark:text-slate-400">Herramienta de arqueo diario para asegurar que el efectivo físico coincida con el sistema.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><TrendingUp className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Proyecciones</h3>
                  <p className="text-slate-600 dark:text-slate-400">Anticipa tu flujo de efectivo basado en las cuotas por cobrar de las próximas semanas.</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Organizar mis Finanzas <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default AccountingFeature;
