import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, ChevronLeft, 
  Download, FileSpreadsheet, Percent, Calendar, Filter, ArrowUpRight, ArrowDownRight,
  ShieldAlert, Sparkles, Building2, CheckCircle2, Clock, Calculator, BarChart3, Printer, LineChart
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import StatCard from '../components/StatCard';
import { useClients, useAccounting, useAuth, useLoans } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { LoanStatus } from '../types';

export const Profit: React.FC = () => {
  const { transactions } = useAccounting();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { employees } = useAuth();
  const navigate = useNavigate();

  // Filters & Tabs state
  const [periodFilter, setPeriodFilter] = useState<'month' | 'quarter' | 'year' | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'projections' | 'loans_profit' | 'expenses'>('overview');
  const [loanSearch, setLoanSearch] = useState('');

  // Helper for CSV export
  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (!t.date) return true;
      const tDate = new Date(t.date);
      if (periodFilter === 'month') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      }
      if (periodFilter === 'quarter') {
        const diffMonths = (now.getFullYear() - tDate.getFullYear()) * 12 + (now.getMonth() - tDate.getMonth());
        return diffMonths >= 0 && diffMonths < 3;
      }
      if (periodFilter === 'year') {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });
  }, [transactions, periodFilter]);

  // Financial Metric Calculations
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'Ingreso' && t.category !== 'Capital')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const interestIncomeOnly = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'Ingreso' && (t.category === 'Pago Préstamo' || t.category === 'Cierre' || t.paymentType === 'Interes'))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const lateFeeIncomeOnly = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'Ingreso' && (t.paymentType === 'Mora' || t.description?.toLowerCase().includes('mora') || t.description?.toLowerCase().includes('recargo')))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'Gasto' && t.category !== 'Desembolso')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const netProfit = totalIncome - totalExpenses;

  // Portfolio & Loan Level Analytics
  const portfolioStats = useMemo(() => {
    let totalCapitalDisbursed = 0;
    let totalExpectedInterest = 0;
    let totalCollectedInterest = 0;
    let totalRemainingInterest = 0;

    loans.forEach(loan => {
      const amount = Number(loan.amount) || 0;
      const totalToPay = Number(loan.totalToPay) || amount;
      const interestTotal = Math.max(0, totalToPay - amount);
      const paid = Number(loan.totalPaid) || 0;

      totalCapitalDisbursed += amount;
      totalExpectedInterest += interestTotal;

      // Estimate paid interest proportion
      const paidInterest = Math.min(interestTotal, paid > amount ? paid - amount : (paid * (interestTotal / (totalToPay || 1))));
      totalCollectedInterest += Math.max(0, paidInterest);
      totalRemainingInterest += Math.max(0, interestTotal - paidInterest);
    });

    const netRoi = totalCapitalDisbursed > 0 ? ((netProfit / totalCapitalDisbursed) * 100).toFixed(1) : '0.0';
    const collectionProgress = totalExpectedInterest > 0 ? Math.round((totalCollectedInterest / totalExpectedInterest) * 100) : 0;

    return {
      totalCapitalDisbursed,
      totalExpectedInterest,
      totalCollectedInterest,
      totalRemainingInterest,
      netRoi,
      collectionProgress
    };
  }, [loans, netProfit]);

  // Monthly Trend Chart Data
  const profitTrendData = useMemo(() => {
    const profitDataMap = new Map<number, { name: string; ingresos: number; gastos: number; neto: number }>();
    const currentMonth = new Date().getMonth();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      profitDataMap.set(m, { name: monthNames[m], ingresos: 0, gastos: 0, neto: 0 });
    }

    transactions.forEach(t => {
      if (!t.date) return;
      const dateObj = new Date(t.date);
      const diffMonths = (new Date().getFullYear() - dateObj.getFullYear()) * 12 + (currentMonth - dateObj.getMonth());
      if (diffMonths >= 0 && diffMonths <= 5) {
        const m = dateObj.getMonth();
        if (profitDataMap.has(m)) {
          const current = profitDataMap.get(m)!;
          if (t.type === 'Ingreso' && t.category !== 'Capital') current.ingresos += Number(t.amount) || 0;
          if (t.type === 'Gasto' && t.category !== 'Desembolso') current.gastos += Number(t.amount) || 0;
          current.neto = current.ingresos - current.gastos;
        }
      }
    });

    return Array.from(profitDataMap.values());
  }, [transactions]);

  // Detailed Loan Interest Breakdown Table
  const loanProfitList = useMemo(() => {
    return loans.map(loan => {
      const amount = Number(loan.amount) || 0;
      const totalToPay = Number(loan.totalToPay) || amount;
      const interestTotal = Math.max(0, totalToPay - amount);
      const paid = Number(loan.totalPaid) || 0;
      
      const interestCollected = Math.max(0, Math.min(interestTotal, paid > amount ? paid - amount : (paid * (interestTotal / (totalToPay || 1)))));
      const interestPending = Math.max(0, interestTotal - interestCollected);
      const yieldPercentage = amount > 0 ? ((interestTotal / amount) * 100).toFixed(1) : '0.0';

      return {
        id: loan.id,
        clientName: loan.clientName,
        amount,
        totalToPay,
        interestTotal,
        interestCollected,
        interestPending,
        yieldPercentage,
        status: loan.status,
        frequency: loan.frequency
      };
    }).filter(l => {
      if (!loanSearch.trim()) return true;
      const term = loanSearch.toLowerCase();
      return l.clientName.toLowerCase().includes(term) || l.id.toLowerCase().includes(term);
    });
  }, [loans, loanSearch]);

  // Expense breakdown categories for donut chart / list
  const expenseCategories = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === 'Gasto' && t.category !== 'Desembolso').forEach(t => {
      const cat = t.category || 'Otros Operativos';
      map.set(cat, (map.get(cat) || 0) + (Number(t.amount) || 0));
    });

    const colors = ['#f43f5e', '#f59e0b', '#6366f1', '#8b5cf6', '#10b981', '#64748b'];
    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [transactions]);

  // Export CSV functions
  const exportPLReport = () => {
    const rows = [
      ['ESTADO DE RESULTADOS (P&L) - ULTRAMONEY'],
      [`Fecha de Generación`, new Date().toLocaleString()],
      [`Filtro Aplicado`, periodFilter.toUpperCase()],
      [''],
      ['CONCEPTO', 'MONTO (RD$)'],
      ['(+) Ingresos Operativos Totales', totalIncome.toFixed(2)],
      ['   - Cobro de Intereses', interestIncomeOnly.toFixed(2)],
      ['   - Cargos por Mora y Penalidades', lateFeeIncomeOnly.toFixed(2)],
      ['   - Otros Ingresos Financieros', Math.max(0, totalIncome - interestIncomeOnly - lateFeeIncomeOnly).toFixed(2)],
      ['(-) Gastos Operativos Totales', totalExpenses.toFixed(2)],
      ['(=) GANANCIA NETA REALIZADA', netProfit.toFixed(2)],
      [''],
      ['MÉTRICAS DE PROYECCIÓN DE CARTERA'],
      ['Capital Total en Cartera', portfolioStats.totalCapitalDisbursed.toFixed(2)],
      ['Interés Total Esperado (Contratado)', portfolioStats.totalExpectedInterest.toFixed(2)],
      ['Interés Recaudado a la Fecha', portfolioStats.totalCollectedInterest.toFixed(2)],
      ['Interés Proyectado por Recaudar', portfolioStats.totalRemainingInterest.toFixed(2)],
      ['Retorno Neto de Inversión (ROI %)', `${portfolioStats.netRoi}%`]
    ];
    downloadCSV('Estado_de_Resultados_PL', rows);
  };

  const exportLoansProfitCSV = () => {
    const headers = ['ID Préstamo', 'Cliente', 'Capital Prestado', 'Interés Pactado', 'Interés Cobrado', 'Interés Pendiente', 'Rendimiento %', 'Frecuencia', 'Estado'];
    const rows = loanProfitList.map(l => [
      l.id, l.clientName, l.amount.toString(), l.interestTotal.toFixed(2), l.interestCollected.toFixed(2), l.interestPending.toFixed(2), `${l.yieldPercentage}%`, l.frequency, l.status
    ]);
    downloadCSV('Reporte_Rentabilidad_Prestamos', [headers, ...rows]);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Top Header Controls & Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
            title="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                P&L & Rendimiento
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-secondary tracking-tight text-slate-900 dark:text-white mt-1">
              Análisis de Ganancias e Intereses
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estado de pérdidas y ganancias, proyecciones de intereses cobrados vs devengados y ROI de cartera.
            </p>
          </div>
        </div>

        {/* Filters & Export Toolbar */}
        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {(['all', 'month', 'quarter', 'year'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setPeriodFilter(filterKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all ${
                  periodFilter === filterKey
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filterKey === 'all' ? 'Todo' : filterKey === 'month' ? 'Este Mes' : filterKey === 'quarter' ? 'Trimestre' : 'Año'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => navigate('/flujo-caja')}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95"
            title="Abrir Proyección Detallada de Flujo de Caja (30/60/90 días)"
          >
            <LineChart className="w-4 h-4 text-blue-200" /> Flujo de Caja (30/60/90d)
          </button>

          <button 
            onClick={exportPLReport} 
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95 ml-auto lg:ml-0"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar P&L
          </button>
        </div>
      </div>

      {/* Main Executive KPI Cards (5 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Income Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingresos Totales</span>
            <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              RD$ {totalIncome.toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Intereses + Moras + Cierre
            </p>
          </div>
        </div>

        {/* Expected / Projected Interest Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interés Proyectado</span>
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              RD$ {portfolioStats.totalRemainingInterest.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Por cobrar en cartera activa
            </p>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gastos Operativos</span>
            <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              RD$ {totalExpenses.toLocaleString()}
            </h3>
            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Nómina, servicios, insumos
            </p>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ganancia Neta Real</span>
            <div className={`p-2 rounded-2xl border ${netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black tracking-tight ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              RD$ {netProfit.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              {netProfit >= 0 ? 'Rentabilidad Operativa Neta' : 'Pérdida Operativa'}
            </p>
          </div>
        </div>

        {/* Net ROI % Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Retorno Neto (ROI)</span>
            <div className="p-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {portfolioStats.netRoi}%
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Rendimiento sobre capital
            </p>
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Tendencia & Flujo P&L
        </button>

        <button
          onClick={() => setActiveTab('projections')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'projections'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Proyección de Intereses
        </button>

        <button
          onClick={() => setActiveTab('loans_profit')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'loans_profit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" /> Rentabilidad por Préstamo
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <PieIcon className="w-4 h-4" /> Desglose de Gastos
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TREND CHARTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Profit Trend Chart (8 Cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  Comparativa Mensual de Ganancias vs Gastos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comportamiento histórico de los ingresos operativos netos de la empresa.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800">
                Flujo Realizado
              </span>
            </div>

            <div className="h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitTrendData}>
                  <defs>
                    <linearGradient id="profitIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="profitExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `RD$${val.toLocaleString()}`} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip 
                    formatter={(value: number | string | undefined) => [`RD$ ${Number(value || 0).toLocaleString()}`, '']}
                    contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fill="url(#profitIncomeGrad)" name="Ingresos Operativos" />
                  <Area type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={3} fill="url(#profitExpenseGrad)" name="Gastos Operativos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Summary & Target Gauge (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Interest Goal & Collection Progress */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-7 rounded-3xl shadow-xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <h3 className="font-extrabold text-lg mb-1 relative z-10">Recaudación de Intereses</h3>
              <p className="text-indigo-200 text-xs mb-6 relative z-10">Meta de intereses pactados en cartera</p>
              
              <div className="space-y-1 mb-4 relative z-10">
                <span className="text-xs text-indigo-200 font-medium uppercase">Interés Cobrado / Total</span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black tracking-tight">
                    RD$ {portfolioStats.totalCollectedInterest.toLocaleString()}
                  </h2>
                  <span className="text-xs text-indigo-300 font-bold">
                    / {portfolioStats.totalExpectedInterest.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/20 h-3.5 rounded-full relative z-10 backdrop-blur-sm overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${portfolioStats.collectionProgress}%` }}
                />
              </div>
              <p className="text-xs text-indigo-200 mt-2.5 relative z-10 font-bold flex items-center justify-between">
                <span>Avance de Recaudación</span>
                <span className="text-emerald-300 font-extrabold">{portfolioStats.collectionProgress}% Completado</span>
              </p>
            </div>

            {/* Income Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <PieIcon className="w-4 h-4 text-indigo-500" />
                Composición de Ingresos
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Intereses de Cuotas</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">RD$ {interestIncomeOnly.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalIncome > 0 ? Math.round((interestIncomeOnly / totalIncome) * 100) : 85}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Recargos y Moras</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">RD$ {lateFeeIncomeOnly.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalIncome > 0 ? Math.round((lateFeeIncomeOnly / totalIncome) * 100) : 10}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PROJECTIONS & INTEREST ANALYSIS */}
      {activeTab === 'projections' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mb-1">Proyección Detallada de Rendimientos de Cartera</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Proyección de intereses acumulados y ganancias esperadas a medida que se cumplan las cuotas.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-400">Interés Ya Cobrado</span>
                <h2 className="text-3xl font-black text-emerald-800 dark:text-emerald-300 mt-2">RD$ {portfolioStats.totalCollectedInterest.toLocaleString()}</h2>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Dinero efectivamente ingresado a caja/bancos.</p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-xs font-extrabold uppercase text-indigo-700 dark:text-indigo-400">Interés Pendiente en Cartera Al Día</span>
                <h2 className="text-3xl font-black text-indigo-800 dark:text-indigo-300 mt-2">RD$ {portfolioStats.totalRemainingInterest.toLocaleString()}</h2>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Ganancia asegurada en cobros futuros regulares.</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-xs font-extrabold uppercase text-amber-700 dark:text-amber-400">Rendimiento Promedio Anual (APR)</span>
                <h2 className="text-3xl font-black text-amber-800 dark:text-amber-300 mt-2">{portfolioStats.netRoi}%</h2>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Retorno neto sobre capital invertido.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RENTABILIDAD POR PRÉSTAMO */}
      {activeTab === 'loans_profit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Desglose de Ganancias por Préstamo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Consulta cuánto interés se ha generado y cobrado cliente por cliente.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                value={loanSearch}
                onChange={e => setLoanSearch(e.target.value)}
                placeholder="Buscar por cliente o ID..."
                className="px-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-full sm:w-64"
              />
              <button 
                onClick={exportLoansProfitCSV} 
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3">ID / Cliente</th>
                  <th className="px-4 py-3">Capital Prestado</th>
                  <th className="px-4 py-3">Interés Pactado</th>
                  <th className="px-4 py-3">Interés Cobrado</th>
                  <th className="px-4 py-3">Interés Pendiente</th>
                  <th className="px-4 py-3">Rendimiento</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {loanProfitList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No se encontraron préstamos para mostrar.
                    </td>
                  </tr>
                ) : (
                  loanProfitList.map(loan => (
                    <tr key={loan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <p>{loan.clientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {loan.id}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        RD$ {loan.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                        RD$ {loan.interestTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        RD$ {loan.interestCollected.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">
                        RD$ {loan.interestPending.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-200">
                        {loan.yieldPercentage}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          loan.status === LoanStatus.PAID || (loan.status as string) === 'Saldado' 
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : loan.status === LoanStatus.OVERDUE || (loan.status as string) === 'Vencido'
                            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                            : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSES BREAKDOWN */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mb-1">Distribución de Gastos Operativos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Desglose de salidas de caja por categoría administrativa y operacional.</p>

            <div className="space-y-4">
              {expenseCategories.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No se registraron gastos en el período seleccionado.</p>
              ) : (
                expenseCategories.map(cat => {
                  const percentage = totalExpenses > 0 ? Math.round((cat.value / totalExpenses) * 100) : 0;
                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                        <span className="text-slate-900 dark:text-white">RD$ {cat.value.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: cat.color }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-4">Gráfico de Proporción de Gastos</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number | string | undefined) => [`RD$ ${Number(val || 0).toLocaleString()}`, 'Monto']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Profit;
