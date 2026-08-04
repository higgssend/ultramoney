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
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Metrics Logic (Filtered could be implemented here based on dateRange)
  const currencyLoans = loans.filter(l => (l.currency || 'DOP') === globalCurrency);
  const totalPortfolio = currencyLoans.reduce((sum, loan) => sum + (Number(loan.remainingBalance) || 0), 0);
  const activeClientsCount = clients.filter(c => c.status === 'Activo').length; 
  const overdueAmount = currencyLoans
    .filter(l => l.status === LoanStatus.OVERDUE)
    .reduce((sum, l) => sum + l.remainingBalance, 0);
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
  const parTotalPercent = totalPortfolio > 0 ? ((parTotal / totalPortfolio) * 100).toFixed(1) : '0';

  const recentTransactions = transactions.slice(0, 5);

  // Dynamic Chart Data Logic
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const chartDataMap = new Map<number, { income: number, expense: number }>();
  const currentMonth = new Date().getMonth();
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    chartDataMap.set(m, { income: 0, expense: 0 });
  }

  transactions.filter(t => (t.currency || 'DOP') === globalCurrency).forEach(t => {
    const dateObj = new Date(t.date);
    // Only include transactions from the last 6 months to avoid year overlap issues for this simple view
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

  const data = Array.from(chartDataMap.entries()).map(([m, vals]) => ({
    name: monthNames[m],
    income: vals.income,
    expense: vals.expense
  }));

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
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${dateRange === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}
                >
                    Hoy
                </button>
                <button 
                    onClick={() => setDateRange('week')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${dateRange === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}
                >
                    Semana
                </button>
                <button 
                    onClick={() => setDateRange('month')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${dateRange === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}
                >
                    Mes
                </button>
            </div>
            <div className="hidden md:block text-sm font-medium text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
        </div>
      </div>

      {/* 4 Cards Row - Gradient Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Cartera por Cobrar"
          value={`$${totalPortfolio.toLocaleString()}`}
          trend="+12% mes anterior"
          trendUp={true}
          icon={Banknote}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          glowColor="shadow-indigo-500/30"
        />

        <StatCard
          title="Clientes Activos"
          value={activeClientsCount.toString()}
          trend="+5% mes anterior"
          trendUp={true}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          glowColor="shadow-blue-500/30"
        />

        <StatCard
          title="Mora / Atrasos"
          value={`$${overdueAmount.toLocaleString()}`}
          trend="Atención requerida"
          trendUp={false}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          glowColor="shadow-orange-500/30"
        />

        <StatCard
          title="Balance en Caja"
          value={`$${balance.toLocaleString()}`}
          trend="Disponible"
          trendUp={true}
          icon={Wallet}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          glowColor="shadow-emerald-500/30"
        />
      </div>

      {/* Portfolio At Risk (PAR) Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      Métricas de Riesgo (Cartera PAR)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total en riesgo: <span className="font-bold text-rose-500">${parTotal.toLocaleString()} ({parTotalPercent}%)</span> del portafolio.</p>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-rose-800 dark:text-rose-400">PAR 30</span>
                      <span className="text-xs font-bold text-rose-500 bg-rose-100 dark:bg-rose-900/50 px-2 py-1 rounded-lg">1-30 Días</span>
                  </div>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-300">${par30.toLocaleString()}</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-orange-800 dark:text-orange-400">PAR 60</span>
                      <span className="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-lg">31-60 Días</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">${par60.toLocaleString()}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/50">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-red-800 dark:text-red-400">PAR 90+</span>
                      <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-lg">&gt; 60 Días</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-300">${par90.toLocaleString()}</div>
              </div>
          </div>
      </div>

      {/* Main Content Split: Chart (2/3) + Activity (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Flujo de Caja</h3>
                <p className="text-xs text-slate-400">Entradas vs Salidas</p>
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
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
          </div>
          
          <div className="space-y-5 overflow-y-auto pr-2 flex-1 custom-scrollbar">
            {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No hay actividad reciente.</p>
                </div>
            ) : (
                recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 -mx-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                            t.type === 'Ingreso' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                            {t.type === 'Ingreso' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-32 md:w-24 lg:w-32">{t.description}</p>
                            <p className="text-xs text-slate-400 truncate w-32">{t.date}</p>
                        </div>
                    </div>
                    <span className={`text-sm font-bold ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t.type === 'Ingreso' ? '+' : '-'}${t.amount.toLocaleString()}
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