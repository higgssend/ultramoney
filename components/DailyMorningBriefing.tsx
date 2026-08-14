import React, { useState, useMemo } from 'react';
import { 
  Sun, Moon, Sunset, Calendar, AlertTriangle, CheckCircle2, 
  MapPin, DollarSign, ChevronRight, ChevronDown, ChevronUp, 
  ArrowUpRight, Sparkles, Navigation, Clock, ShieldAlert, Users
} from 'lucide-react';
import { useLoans, useClients, useAuth, useAccounting } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { LoanStatus } from '../types';

export const DailyMorningBriefing: React.FC = () => {
  const { loans } = useLoans();
  const { clients } = useClients();
  const { currentUser } = useAuth();
  const { transactions } = useAccounting();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('morning_briefing_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('morning_briefing_collapsed', String(next));
      return next;
    });
  };

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: '¡Buenos días', icon: Sun, color: 'text-amber-500 bg-amber-100 dark:bg-amber-950/50' };
    }
    if (hour >= 12 && hour < 18) {
      return { text: '¡Buenas tardes', icon: Sunset, color: 'text-orange-500 bg-orange-100 dark:bg-orange-950/50' };
    }
    return { text: '¡Buenas noches', icon: Moon, color: 'text-indigo-400 bg-indigo-950/50' };
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Today's due installments
  const todayDueLoans = useMemo(() => {
    return loans.filter(l => {
      if (l.status === LoanStatus.PAID || l.status === LoanStatus.REJECTED) return false;
      return l.nextPaymentDate === todayStr;
    });
  }, [loans, todayStr]);

  const todayDueAmount = useMemo(() => {
    return todayDueLoans.reduce((sum, l) => sum + (Number(l.installmentAmount) || 0), 0);
  }, [todayDueLoans]);

  // Critical overdue loans (> 3 days overdue)
  const overdueLoans = useMemo(() => {
    return loans.filter(l => l.status === LoanStatus.OVERDUE && l.remainingBalance > 0);
  }, [loans]);

  const overdueTotalAmount = useMemo(() => {
    return overdueLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  }, [overdueLoans]);

  // Collected today so far
  const collectedToday = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Ingreso' && t.date && t.date.startsWith(todayStr))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, todayStr]);

  const GreetingIcon = greeting.icon;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-900/50 relative overflow-hidden animate-fade-in transition-all">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl ${greeting.color} shadow-sm shrink-0`}>
            <GreetingIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Resumen Ejecutivo del Día
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              {greeting.text}, {currentUser?.name || 'Administrador'} 👋
            </h3>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={toggleCollapse}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
            title={isCollapsed ? 'Expandir resumen' : 'Minimizar resumen'}
          >
            <span>{isCollapsed ? 'Mostrar Métricas' : 'Ocultar'}</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Content Area */}
      {!isCollapsed && (
        <div className="mt-5 pt-5 border-t border-white/10 space-y-4 relative z-10 animate-fade-in">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Today Due Card */}
            <div className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Por Cobrar Hoy</span>
                </div>
                <h4 className="text-2xl font-black text-white mt-1">
                  RD$ {todayDueAmount.toLocaleString()}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {todayDueLoans.length} cuota{todayDueLoans.length !== 1 ? 's' : ''} programada{todayDueLoans.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-black text-sm">
                {todayDueLoans.length}
              </div>
            </div>

            {/* Overdue Card */}
            <div className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Mora / Atrasados</span>
                </div>
                <h4 className="text-2xl font-black text-rose-300 mt-1">
                  RD$ {overdueTotalAmount.toLocaleString()}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {overdueLoans.length} cliente{overdueLoans.length !== 1 ? 's' : ''} requieren gestión
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-400/30 flex items-center justify-center text-rose-300 font-black text-sm">
                {overdueLoans.length}
              </div>
            </div>

            {/* Collected Today Card */}
            <div className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Recaudado Hoy</span>
                </div>
                <h4 className="text-2xl font-black text-emerald-300 mt-1">
                  RD$ {collectedToday.toLocaleString()}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Ingresos en caja registrados hoy
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-black text-sm">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex items-center gap-2.5 flex-wrap pt-2">
            <button
              onClick={() => navigate('/pagos')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              <span>Registrar Cobro</span>
            </button>

            <button
              onClick={() => navigate('/rutas')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15 active:scale-95"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Abrir Ruta de Cobranza</span>
            </button>

            <button
              onClick={() => navigate('/atrasos')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15 active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Ver Atrasados ({overdueLoans.length})</span>
            </button>

            <button
              onClick={() => navigate('/caja')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15 active:scale-95 ml-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ir a Caja</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default DailyMorningBriefing;
