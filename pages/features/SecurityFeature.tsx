
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Lock, Server, Database, ArrowRight } from 'lucide-react';

const SecurityFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-slate-700 selection:text-white">
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Seguridad Bancaria</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 mb-8">
              <Shield className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Tus datos, blindados <span className="text-slate-500">al máximo nivel.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              Entendemos que manejas información sensible. Por eso utilizamos la misma infraestructura de seguridad que las fintechs más grandes del mundo.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000" 
            alt="Security Lock" 
            className="rounded-3xl shadow-2xl border-4 border-slate-200 dark:border-slate-800 w-full opacity-90"
          />
      </section>

      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300"><Lock className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Encriptación SSL/TLS</h3>
                  <p className="text-slate-600 dark:text-slate-400">Todos los datos viajan encriptados desde tu dispositivo hasta nuestros servidores. Nadie puede interceptarlos.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300"><Database className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Backups Automáticos</h3>
                  <p className="text-slate-600 dark:text-slate-400">Realizamos copias de seguridad cada hora y las almacenamos en múltiples ubicaciones geográficas.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300"><Server className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Infraestructura Segura</h3>
                  <p className="text-slate-600 dark:text-slate-400">Servidores protegidos contra ataques DDoS y con monitoreo de intrusiones 24/7.</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Proteger mi Negocio <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default SecurityFeature;
