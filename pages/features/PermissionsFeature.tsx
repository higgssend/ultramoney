
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, UserCheck, ShieldCheck, EyeOff, ArrowRight } from 'lucide-react';

const PermissionsFeature: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors font-bold">
                <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Control de Acceso</span>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all">
                Probar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-block p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-8">
              <Lock className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Delega con <span className="text-indigo-600">confianza total.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
              No todos necesitan ver todo. Configura qué pueden ver y editar tus empleados con un sistema de roles granular y seguro.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm opacity-50">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">Cobrador</h4>
                  <ul className="text-xs text-slate-500 space-y-1">
                      <li>✅ Ver Ruta Asignada</li>
                      <li>✅ Registrar Pagos</li>
                      <li>❌ Ver Reporte Ganancias</li>
                  </ul>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-indigo-500 shadow-xl transform scale-110 z-10">
                  <h4 className="font-bold text-indigo-600 mb-2">Admin</h4>
                  <ul className="text-xs text-slate-500 space-y-1">
                      <li>✅ Acceso Total</li>
                      <li>✅ Configuración</li>
                      <li>✅ Auditoría</li>
                  </ul>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm opacity-50">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">Secretaria</h4>
                  <ul className="text-xs text-slate-500 space-y-1">
                      <li>✅ Crear Clientes</li>
                      <li>✅ Imprimir Recibos</li>
                      <li>❌ Eliminar Registros</li>
                  </ul>
              </div>
          </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><UserCheck className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Roles Personalizables</h3>
                  <p className="text-slate-600 dark:text-slate-400">Crea tus propios roles (ej. "Supervisor de Zona") y asigna permisos específicos casilla por casilla.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><EyeOff className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ocultar Datos Sensibles</h3>
                  <p className="text-slate-600 dark:text-slate-400">Protege tu información financiera. Evita que los empleados vean el capital total o las ganancias netas.</p>
              </div>
              <div className="space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><ShieldCheck className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Log de Auditoría</h3>
                  <p className="text-slate-600 dark:text-slate-400">Cada acción queda registrada. Sabrás exactamente quién borró un cliente o editó un pago y cuándo.</p>
              </div>
          </div>
      </section>

      <section className="py-20 text-center">
          <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto">
              Configurar Accesos <ArrowRight className="w-6 h-6" />
          </button>
      </section>
    </div>
  );
};

export default PermissionsFeature;
