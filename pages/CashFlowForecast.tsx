import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, 
  ArrowUpRight, ArrowDownRight, Sparkles, Building2, CheckCircle2, 
  Clock, Calculator, BarChart3, Printer, Users, ChevronDown, 
  ChevronRight, Phone, AlertCircle, ArrowLeftRight, HelpCircle, FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LineChart, Line, ComposedChart 
} from 'recharts';
import { useLoans, useAccounting, useClients, useSettings } from '../context/StoreContext';
import { calculateCashFlowForecast, DayCashFlowForecast } from '../utils/CashFlowEngine';
import { formatLoanId } from '../types';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';

export const CashFlowForecast: React.FC = () => {
  const { loans } = useLoans();
  const { transactions, bankAccounts } = useAccounting();
  const { clients } = useClients();
  const { companySettings } = useSettings();

  // Range Horizon: 30, 60, or 90 days
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(30);
  const [chartViewMode, setChartViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayCashFlowForecast | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  // Initial cash position from all active bank accounts & cash boxes
  const totalCashBalance = useMemo(() => {
    return bankAccounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }, [bankAccounts]);

  // Compute Forecast Engine
  const forecast = useMemo(() => {
    return calculateCashFlowForecast(loans, transactions, horizonDays, totalCashBalance);
  }, [loans, transactions, horizonDays, totalCashBalance]);

  // Filtered days table
  const filteredDays = useMemo(() => {
    if (!tableSearch.trim()) return forecast.days;
    const q = tableSearch.toLowerCase();
    return forecast.days.filter(d => {
      const matchDate = d.date.includes(q) || d.formattedDate.toLowerCase().includes(q) || d.dayOfWeek.toLowerCase().includes(q);
      const matchClient = d.clientsDue.some(c => c.clientName.toLowerCase().includes(q));
      return matchDate || matchClient;
    });
  }, [forecast.days, tableSearch]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Fecha',
      'Dia de la Semana',
      'Capital Proyectado (RD$)',
      'Intereses Proyectados (RD$)',
      'Total Entrada (RD$)',
      'Gastos Estimados (RD$)',
      'Flujo Neto (RD$)',
      'Liquidez Acumulada (RD$)',
      'Cantidad de Cuotas'
    ];

    const rows = forecast.days.map(d => [
      d.date,
      d.dayOfWeek,
      d.capitalDue.toFixed(2),
      d.interestDue.toFixed(2),
      d.totalInflow.toFixed(2),
      d.projectedExpense.toFixed(2),
      d.netFlow.toFixed(2),
      d.cumulativeLiquidity.toFixed(2),
      d.installmentsCount.toString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Proyeccion_Flujo_Caja_${horizonDays}Dias_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Proyección de Flujo de Caja descargada en CSV');
  };

  // Print Executive Summary
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Reminder to Client for Upcoming Due Date
  const handleSendReminderWhatsApp = (clientPhone: string | undefined, clientName: string, amount: number, dueDate: string) => {
    const cleanPhone = (clientPhone || '').replace(/\D/g, '');
    const message = `*RECORDATORIO DE PAGO - ${companySettings?.name || 'ULTRAMONEY'}*\n\n` +
      `Estimado/a *${clientName}*,\n` +
      `Le recordamos cordialmente que su próxima cuota de *RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}* vence el *${dueDate}*.\n\n` +
      `Agradecemos realizar su pago a tiempo para mantener su excelente historial crediticio. Si ya realizó el pago, por favor ignore este mensaje.\n\n` +
      `_¡Muchas gracias por su confianza!_`;

    const encoded = encodeURIComponent(message);
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Planificación Financiera & Liquidez
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            Proyección de Flujo de Caja (Cash Flow)
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl">
            Prevé con exactitud el dinero que entrará día por día por concepto de amortización de capital e intereses, y conoce tu capital disponible para colocar nuevos préstamos.
          </p>
        </div>

        {/* Horizon Range Switcher & Export */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/15 text-xs font-bold shadow-inner">
            {([30, 60, 90] as const).map(days => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  horizonDays === days
                    ? 'bg-blue-600 text-white shadow-md font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {days} Días
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 transition-all shadow-sm active:scale-95"
            title="Exportar a CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 transition-all shadow-sm active:scale-95"
            title="Imprimir informe"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow Projected */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Total a Recaudar ({horizonDays} Días)
            </span>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              RD$ {forecast.summary.totalProjectedInflow.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
              <span>{forecast.summary.totalInstallmentsDue} cuotas calendarizadas</span>
              <span className="font-bold text-blue-600">Eficiencia: {forecast.summary.historicalCollectionRate}%</span>
            </p>
          </div>
        </div>

        {/* Interest Earnings Projected */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Ganancia en Intereses
            </span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              RD$ {forecast.summary.totalInterestEarnings.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Rendimiento financiero neto de la cartera
            </p>
          </div>
        </div>

        {/* Capital to Recover */}
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/40 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Recuperación de Capital
            </span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-300">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              RD$ {forecast.summary.totalCapitalRecoverable.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Principal amortizado a retornar a caja
            </p>
          </div>
        </div>

        {/* Lending Power / Available Liquidity */}
        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 p-5 rounded-2xl shadow-sm bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Poder de Colocación (Nuevos Préstamos)
            </span>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              RD$ {forecast.summary.estimatedLendingPower.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Liquidez segura para desembolsos futuros
            </p>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Inflows vs Expenses */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span>Flujo de Entradas vs Costos ({horizonDays} Días)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Desglose de Capital + Intereses proyectados vs Salidas operativas estimadas
              </p>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setChartViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartViewMode === 'weekly'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Por Semana
              </button>
              <button
                onClick={() => setChartViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartViewMode === 'daily'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Día a Día
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === 'weekly' ? (
                <ComposedChart data={forecast.weeks} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `RD$ ${Number(value || 0).toLocaleString()}`,
                      name === 'capitalDue' ? 'Capital a Cobrar' : name === 'interestDue' ? 'Intereses a Cobrar' : name === 'projectedExpense' ? 'Gastos Estimados' : 'Flujo Neto'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="capitalDue" name="Capital" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="interestDue" name="Intereses" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projectedExpense" name="Gastos Fijos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="netFlow" name="Flujo Neto" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              ) : (
                <ComposedChart data={forecast.days} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 9 }} interval={Math.floor(horizonDays / 10)} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `RD$ ${Number(value || 0).toLocaleString()}`,
                      name === 'totalInflow' ? 'Entrada Total' : name === 'projectedExpense' ? 'Gasto Diario' : 'Flujo Neto'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="totalInflow" name="Entrada Total" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="netFlow" name="Flujo Neto" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart: Cumulative Liquidity Curve */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>Curva de Liquidez Acumulada</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evolución del saldo disponible a lo largo del tiempo
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="liquidityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 9 }} interval={Math.floor(horizonDays / 6)} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`RD$ ${Number(v || 0).toLocaleString()}`, 'Liquidez Acumulada']} />
                <Area type="monotone" dataKey="cumulativeLiquidity" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#liquidityGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Caja Inicial Actual:</span>
              <span className="text-slate-900 dark:text-white">RD$ {totalCashBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Pico Máximo de Recaudación:</span>
              <span className="text-emerald-600 font-extrabold">{forecast.summary.peakDay?.date} (RD$ {forecast.summary.peakDay?.amount?.toLocaleString()})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Day-by-Day Calendar & Clients Due Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>Cronograma Detallado Día por Día & Clientes</span>
            </h3>
            <p className="text-xs text-slate-500">
              Haz clic en cualquier día para ver qué clientes tienen cuotas por pagar y enviarles recordatorios por WhatsApp
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              placeholder="Filtrar por fecha o cliente..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Days Table Accordion */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDays.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No se encontraron cuotas para los filtros aplicados.</p>
          ) : (
            filteredDays.map(day => {
              const isExpanded = expandedDate === day.date;
              const hasInstallments = day.installmentsCount > 0;

              return (
                <div key={day.date} className="transition-colors">
                  {/* Day Header Row */}
                  <div
                    onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isExpanded ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        hasInstallments 
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {day.dayNumber}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{day.dayOfWeek}, {day.formattedDate}</span>
                          {hasInstallments && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] rounded-full font-extrabold">
                              {day.installmentsCount} cuotas
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{day.date}</p>
                      </div>
                    </div>

                    {/* Financial Figures for this day */}
                    <div className="flex items-center gap-4 sm:gap-8 justify-between md:justify-end text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Capital</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          RD$ {day.capitalDue.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Interés</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          RD$ {day.interestDue.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase">Total Entrada</span>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          RD$ {day.totalInflow.toLocaleString()}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Accordion: Clients Due on this Date */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/75 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>Clientes y Cuotas Programadas para el {day.formattedDate}</span>
                      </h4>

                      {day.clientsDue.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay cuotas programadas para este día específico.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {day.clientsDue.map((clientItem, idx) => {
                            const clientObj = clients.find(c => c.id === clientItem.clientId);
                            return (
                              <div
                                key={`${clientItem.loanId}-${idx}`}
                                className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                                      {clientItem.clientName}
                                    </h5>
                                    <p className="text-[11px] text-slate-500">
                                      Préstamo #{formatLoanId(clientItem.loanId)} • {clientItem.frequency}
                                    </p>
                                  </div>
                                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                    RD$ {clientItem.amountDue.toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                  <span>Cap: RD$ {clientItem.capitalPart.toLocaleString()} | Int: RD$ {clientItem.interestPart.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => handleSendReminderWhatsApp(
                                      clientObj?.phone,
                                      clientItem.clientName,
                                      clientItem.amountDue,
                                      day.formattedDate
                                    )}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                                    title="Enviar recordatorio amistoso por WhatsApp"
                                  >
                                    <FaWhatsapp className="w-3 h-3" />
                                    <span>Recordatorio</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowForecast;
