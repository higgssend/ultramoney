
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Smartphone, CreditCard, Bell, ArrowRight } from 'lucide-react';

const MobileAppFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-purple-500 selection:text-white">
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">App para Clientes</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-8">
              <Smartphone className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Dale poder <span className="text-purple-600">a tus clientes.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              Incluye un portal web y móvil donde tus clientes pueden ver su estado de cuenta, historial de pagos y próximos vencimientos sin llamarte.
          </p>
          <div className="flex justify-center">
             <div className="relative w-64 h-[500px] bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden ring-4 ring-purple-100">
                 <img src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-50" />
                 <div className="absolute inset-0 flex items-center justify-center">
                     <button onClick={() => navigate('/app-clientes')} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">Ver Demo Interactiva</button>
                 </div>
             </div>
          </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><CreditCard className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pagos Online (Próximamente)</h3>
                  <p className="text-slate-600 dark:text-slate-400">Tus clientes podrán pagar sus cuotas directamente desde la app usando tarjeta de crédito o débito.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Bell className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Push Notifications</h3>
                  <p className="text-slate-600 dark:text-slate-400">Envía recordatorios directos a la pantalla de inicio de tus clientes. Más efectivo que un SMS.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600"><Smartphone className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Marca Blanca</h3>
                  <p className="text-slate-600 dark:text-slate-400">Personaliza la app con el logo y los colores de tu financiera. (Plan Empresas)</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Obtener App <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default MobileAppFeature;
