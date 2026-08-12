import React, { useState } from 'react';
import {
  Users, Banknote, AlertTriangle, Wallet,
  ArrowUpRight, ArrowDownRight, Plus, Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import { useSettings, useClients, useLoans, useAccounting } from '../context/StoreContext';
import { LoanStatus } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { loans } = useLoans();
  const { clients } = useClients();
  const { transactions, getFinancialStats } = useAccounting();
  const { globalCurrency } = useSettings();
  const navigate = useNavigate();
  const stats = getFinancialStats();

  // Filters State
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('month');

  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRange === 'today') {
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return dStart.getTime() === todayStart.getTime();
    }

    if (dateRange === 'week') {
      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }

    if (dateRange === 'month') {
      const monthAgo = new Date(todayStart);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return d >= monthAgo;
    }

    return true;
  };

  // Metrics Logic
  const currencyLoans = loans.filter(l => (l.currency || 'DOP') === globalCurrency);
  const totalPortfolio = currencyLoans.reduce((sum, loan) => sum + (Number(loan.remainingBalance) || 0), 0);
  const activeClientsCount = clients.filter(c => c.status !== 'Inactivo' && c.status !== 'Bloqueado').length; 
  const balance = stats.balance;

  // Calculate PAR (Portfolio At Risk)
  let par30 = 0;
  let par60 = 0;
  let par90 = 0;

  currencyLoans.forEach(loan => {
      if (loan.remainingBalance > 0 && loan.status !== LoanStatus.PAID) {
          if (loan.status === LoanStatus.OVERDUE || loan.status === 'Vencido' || (loan.nextPaymentDate && new Date() > new Date(loan.nextPaymentDate))) {
              const nextDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : new Date();
              const diffTime = Math.abs(new Date().getTime() - nextDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 30) par30 += loan.remainingBalance;
              else if (diffDays <= 60) par60 += loan.remainingBalance;
              else par90 += loan.remainingBalance;
          }
      }
  });

  const parTotal = par30 + par60 + par90;
  const overdueAmount = parTotal;
  const parTotalPercent = totalPortfolio > 0 ? ((parTotal / totalPortfolio) * 100).toFixed(1) : '0';

  const filteredTransactions = transactions.filter(t => (t.currency || 'DOP') === globalCurrency && isDateInRange(t.date));
  const recentTransactions = (filteredTransactions.length > 0 ? filteredTransactions : transactions).slice(0, 5);

  // Dynamic Chart Data Logic based on dateRange
  const getChartData = () => {
    if (dateRange === 'today') {
      const hours = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
      const map = new Map<string, number>();
      hours.forEach(h => map.set(h, 0));
      
      const todayStr = new Date().toISOString().split('T')[0];
      transactions
        .filter(t => (t.currency || 'DOP') === globalCurrency && t.type === 'Ingreso' && t.date.startsWith(todayStr))
        .forEach(t => {
          const dt = new Date(t.date.includes('T') ? t.date : t.date + 'T12:00:00');
          const hr = dt.getHours();
          let label = '12:00';
          if (hr < 9) label = '8:00';
          else if (hr < 11) label = '10:00';
          else if (hr < 13) label = '12:00';
          else if (hr < 15) label = '14:00';
          else if (hr < 17) label = '16:00';
          else if (hr < 19) label = '18:00';
          else label = '20:00';
          map.set(label, (map.get(label) || 0) + Number(t.amount));
        });

      return Array.from(map.entries()).map(([name, income]) => ({ name, income, expense: 0 }));
    }

    if (dateRange === 'week') {
      const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const now = new Date();
      const result: { name: string; income: number; expense: number; dateStr: string }[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        result.push({ name: dayLabels[d.getDay()], income: 0, expense: 0, dateStr });
      }

      transactions
        .filter(t => (t.currency || 'DOP') === globalCurrency)
        .forEach(t => {
          const tDateStr = t.date.split('T')[0];
          const found = result.find(r => r.dateStr === tDateStr);
          if (found) {
            if (t.type === 'Ingreso') found.income += Number(t.amount);
            if (t.type === 'Gasto') found.expense += Number(t.amount);
          }
        });

      return result.map(({ name, income, expense }) => ({ name, income, expense }));
    }

    // Default 'month'
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const chartDataMap = new Map<number, { income: number; expense: number }>();
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      chartDataMap.set(m, { income: 0, expense: 0 });
    }

    transactions.filter(t => (t.currency || 'DOP') === globalCurrency).forEach(t => {
      const dateObj = new Date(t.date);
      const diffMonths = (new Date().getFullYear() - dateObj.getFullYear()) * 12 + (currentMonth - dateObj.getMonth());
      if (diffMonths >= 0 && diffMonths <= 5) {
        const m = dateObj.getMonth();
        if (chartDataMap.has(m)) {
          const current = chartDataMap.get(m)!;
          if (t.type === 'Ingreso') current.income += Number(t.amount);
          if (t.type === 'Gasto') current.expense += Number(t.amount);
        }
      }
    });

    return Array.from(chartDataMap.entries()).map(([m, vals]) => ({
      name: monthNames[m],
      income: vals.income,
      expense: vals.expense
    }));
  };

  const data = getChartData();

  const getDateLabel = () => {
    if (dateRange === 'today') {
      return new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (dateRange === 'week') {
      return 'Esta Semana (Últimos 7 Días)';
    }
    return `Este Mes (${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Panel Principal</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Resumen financiero en tiempo real.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                <button 
                    onClick={() => setDateRange('today')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dateRange === 'today' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}
                >
                    Hoy
                </button>
                <button 
                    onClick={() => setDateRange('week')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dateRange === 'week' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}
                >
                    Semana
                </button>
                <button 
                    onClick={() => setDateRange('month')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dateRange === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}
                >
                    Mes
                </button>
            </div>
            <div className="hidden md:block text-sm font-medium text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm capitalize">
                {getDateLabel()}
            </div>
        </div>
      </div>

      {/* 4 Cards Row - Gradient Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Cartera por Cobrar"
          value={`RD$ ${totalPortfolio.toLocaleString()}`}
          trend="Ver Préstamos ➔"
          trendUp={true}
          icon={Banknote}
          gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
          glowColor="shadow-indigo-500/30"
          onClick={() => navigate('/prestamos')}
        />

        <StatCard
          title="Clientes Activos"
          value={activeClientsCount.toString()}
          trend="Ver Clientes ➔"
          trendUp={true}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
          glowColor="shadow-blue-500/30"
          onClick={() => navigate('/clientes')}
        />

        <StatCard
          title="Mora / Atrasos"
          value={`RD$ ${overdueAmount.toLocaleString()}`}
          trend="Gestionar Mora ➔"
          trendUp={false}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-amber-500 to-rose-600"
          glowColor="shadow-orange-500/30"
          onClick={() => navigate('/atrasos')}
        />

        <StatCard
          title="Balance en Caja"
          value={`RD$ ${balance.toLocaleString()}`}
          trend="Ver Movimientos ➔"
          trendUp={true}
          icon={Wallet}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          glowColor="shadow-emerald-500/30"
          onClick={() => navigate('/caja')}
        />
      </div>

      {/* Quick Actions Shortcuts Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Accesos Rápidos / Acciones Frecuentes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => navigate('/solicitud')}
            className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all font-bold text-sm border border-indigo-100/50 group"
          >
            <div className="p-2 bg-indigo-600 text-white rounded-xl group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span>Nuevo Préstamo</span>
          </button>
          
          <button 
            onClick={() => navigate('/pagos')}
            className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all font-bold text-sm border border-emerald-100/50 group"
          >
            <div className="p-2 bg-emerald-600 text-white rounded-xl group-hover:scale-110 transition-transform">
              <Banknote className="w-5 h-5" />
            </div>
            <span>Registrar Cobro</span>
          </button>

          <button 
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-bold text-sm border border-blue-100/50 group"
          >
            <div className="p-2 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span>Gestionar Clientes</span>
          </button>

          <button 
            onClick={() => navigate('/atrasos')}
            className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all font-bold text-sm border border-rose-100/50 group"
          >
            <div className="p-2 bg-rose-600 text-white rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span>Cobranza & Mora</span>
          </button>
        </div>
      </div>

      {/* Portfolio At Risk (PAR) Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      Métricas de Riesgo (Cartera PAR)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total en riesgo: <span className="font-bold text-rose-500">RD$ {parTotal.toLocaleString()} ({parTotalPercent}%)</span> del portafolio.</p>
              </div>
              <button 
                  onClick={() => navigate('/atrasos')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
              >
                  Ver Cobranza <ArrowUpRight className="w-4 h-4" />
              </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                  onClick={() => navigate('/atrasos')}
                  className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50 cursor-pointer hover:bg-rose-100/70 transition-all hover:-translate-y-0.5 group"
              >
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-rose-800 dark:text-rose-400 group-hover:underline">PAR 30</span>
                      <span className="text-xs font-bold text-rose-500 bg-rose-100 dark:bg-rose-900/50 px-2 py-1 rounded-lg">1-30 Días</span>
                  </div>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-300">RD$ {par30.toLocaleString()}</div>
              </div>
              <div 
                  onClick={() => navigate('/atrasos')}
                  className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/50 cursor-pointer hover:bg-orange-100/70 transition-all hover:-translate-y-0.5 group"
              >
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-orange-800 dark:text-orange-400 group-hover:underline">PAR 60</span>
                      <span className="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-lg">31-60 Días</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">RD$ {par60.toLocaleString()}</div>
              </div>
              <div 
                  onClick={() => navigate('/atrasos')}
                  className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 cursor-pointer hover:bg-red-100/70 transition-all hover:-translate-y-0.5 group"
              >
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-red-800 dark:text-red-400 group-hover:underline">PAR 90+</span>
                      <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-lg">&gt; 60 Días</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-300">RD$ {par90.toLocaleString()}</div>
              </div>
          </div>
      </div>

      {/* Main Content Split: Chart (2/3) + Activity (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div 
            onClick={() => navigate('/reportes')}
            className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-[420px] cursor-pointer hover:border-indigo-200 transition-all group"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                    Flujo de Caja
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-slate-400">Entradas vs Salidas (Haz clic para ver reportes detallados)</p>
            </div>
          </div>
          
          <div className="flex-1 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc', opacity: 0.8}}
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{color: '#1e293b', fontWeight: 'bold'}}
                  formatter={(value: number) => [`RD$ ${value.toLocaleString()}`, '']}
                />
                <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-[420px] flex flex-col">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Actividad Reciente</h3>
            <button onClick={() => navigate('/pagos')} className="text-xs text-indigo-600 font-bold hover:underline">Ver Todo</button>
          </div>
          
          <div className="space-y-5 overflow-y-auto pr-2 flex-1 custom-scrollbar">
            {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No hay actividad reciente.</p>
                </div>
            ) : (
                recentTransactions.map((t) => (
                <div 
                    key={t.id} 
                    onClick={() => navigate('/pagos')}
                    className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 -mx-2 rounded-xl transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                            t.type === 'Ingreso' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                            {t.type === 'Ingreso' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-32 md:w-24 lg:w-32 group-hover:text-indigo-600">{t.description}</p>
                            <p className="text-xs text-slate-400 truncate w-32">{t.date}</p>
                        </div>
                    </div>
                    <span className={`text-sm font-bold ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t.type === 'Ingreso' ? '+' : '-'}RD$ {t.amount.toLocaleString()}
                    </span>
                </div>
                ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 text-center shrink-0">
              <button onClick={() => navigate('/pagos')} className="text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1 w-full">
                  Ver todas las transacciones <ArrowUpRight className="w-4 h-4" />
              </button>
          </div>
        </div>
      </div>


      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-24 right-6 md:hidden z-30">
          <button 
            onClick={() => navigate('/solicitud')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white"
          >
              <Plus className="w-8 h-8" />
          </button>
      </div>
    </div>
  );
};

export default Dashboard;