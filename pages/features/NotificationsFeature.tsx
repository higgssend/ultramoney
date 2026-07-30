
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, MessageSquare, Clock, Smartphone, ArrowRight } from 'lucide-react';

const NotificationsFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-amber-500 selection:text-white">
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Notificaciones Inteligentes</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-8">
              <Bell className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Cobra <span className="text-amber-500">mientras duermes.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              Automatiza la cobranza con recordatorios programados. Reduce la morosidad manteniendo a tus clientes informados antes, durante y después de la fecha de pago.
          </p>
          <div className="flex justify-center gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-sm text-left">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><MessageSquare className="w-4 h-4 text-green-600" /></div>
                      <span className="font-bold text-slate-800 dark:text-white">WhatsApp</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">"Hola Juan, recordatorio amistoso de que tu cuota de $1,500 vence mañana."</p>
              </div>
          </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><Smartphone className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp Automático</h3>
                  <p className="text-slate-600 dark:text-slate-400">Conecta tu número de empresa y envía mensajes predefinidos con un solo clic o totalmente automático.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Clock className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recordatorios de Vencimiento</h3>
                  <p className="text-slate-600 dark:text-slate-400">Configura alertas 3 días antes, el día de pago y avisos de mora automáticamente.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Bell className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Alertas Internas</h3>
                  <p className="text-slate-600 dark:text-slate-400">Tus cobradores recibirán una lista diaria de a quién visitar y cuánto cobrar.</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Automatizar Cobranza <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default NotificationsFeature;
