import React, { useState, useMemo } from 'react';
import { 
  Sun, Moon, Sunset, Calendar, AlertTriangle, CheckCircle2, 
  ChevronDown, ChevronUp, ArrowRight, Sparkles, Navigation, ShieldAlert,
  Wallet
} from 'lucide-react';
import { useLoans, useAuth, useAccounting } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { LoanStatus } from '../types';

export const DailyMorningBriefing: React.FC = () => {
  const { loans } = useLoans();
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
      return { text: 'Buenos días', icon: Sun, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40' };
    }
    if (hour >= 12 && hour < 18) {
      return { text: 'Buenas tardes', icon: Sunset, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-900/40' };
    }
    return { text: 'Buenas noches', icon: Moon, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/40' };
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

  // Critical overdue loans
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
    <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all text-slate-800 dark:text-slate-100">
      
      {/* Header Compact Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl border ${greeting.color} shrink-0`}>
            <GreetingIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {greeting.text}, <span className="text-indigo-600 dark:text-indigo-400">{currentUser?.name || 'Administrador'}</span>
              </h3>
              <span className="hidden md:inline-block text-[11px] text-slate-400 font-medium border-l border-slate-200 dark:border-slate-700 pl-2">
                {new Date().toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick horizontal mini-stats or toggle */}
        <div className="flex items-center gap-2 text-xs">
          {isCollapsed && (
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>Hoy: <strong className="text-indigo-600 dark:text-indigo-400">RD$ {todayDueAmount.toLocaleString()}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>Atrasado: <strong className="text-rose-500">RD$ {overdueTotalAmount.toLocaleString()}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>Recaudado: <strong className="text-emerald-500">RD$ {collectedToday.toLocaleString()}</strong></span>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
            title={isCollapsed ? 'Mostrar resumen detallado' : 'Minimizar resumen'}
          >
            <span>{isCollapsed ? 'Ver Resumen' : 'Ocultar'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Light Metrics Grid */}
      {!isCollapsed && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 animate-fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            
            {/* Por Cobrar Hoy */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Por Cobrar Hoy</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    RD$ {todayDueAmount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({todayDueLoans.length} cuota{todayDueLoans.length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/pagos')} 
                title="Ir a Pagos"
                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mora / Atrasados */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mora / Atrasados</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                    RD$ {overdueTotalAmount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({overdueLoans.length} cliente{overdueLoans.length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/atrasos')} 
                title="Ver Atrasados"
                className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Recaudado Hoy */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Recaudado Hoy</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    RD$ {collectedToday.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (En caja)
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/caja')} 
                title="Ir a Caja"
                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Quick Action Navigation Bar - Light and Compact */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => navigate('/pagos')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Registrar Cobro</span>
            </button>

            <button
              onClick={() => navigate('/rutas')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 active:scale-95 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-500" />
              <span>Rutas GPS</span>
            </button>

            <button
              onClick={() => navigate('/atrasos')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Mora ({overdueLoans.length})</span>
            </button>

            <button
              onClick={() => navigate('/caja')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 active:scale-95 ml-auto cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Caja</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default DailyMorningBriefing;
