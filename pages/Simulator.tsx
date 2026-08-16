import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Settings, PieChart as PieChartIcon, TrendingUp, Calendar, 
  ChevronLeft, ArrowRight, Table, FileText, Plus, Trash2, Download, 
  UserCheck, ShieldAlert, Sparkles, DollarSign, X, Check, ToggleLeft, ToggleRight, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans, useSettings } from '../context/StoreContext';
import { LoanType } from '../types';
import { LoanEngine, ExpenseConfig, SimulationResult } from '../utils/LoanEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { CustomSelect } from '../components/CustomSelect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

const LOAN_TYPE_OPTIONS: { value: LoanType; label: string; description: string }[] = [
  { value: 'Amortizado (Cuota Fija)', label: 'Amortizado (Cuota Fija / Francés)', description: 'Cuota periódica constante. Amortiza más interés al inicio y más capital al final.' },
  { value: 'Amortizado (Capital Fijo)', label: 'Amortizado (Capital Fijo / Alemán)', description: 'Capital constante en cada cuota. La cuota total disminuye progresivamente.' },
  { value: 'Rédito (Solo Interés)', label: 'Rédito (Solo Interés / Abierto)', description: 'Solo se pagan intereses en cada período. El capital se salda al vencimiento.' },
  { value: 'Interés Adelantado', label: 'Interés Adelantado', description: 'Los intereses se retienen/descuentan por adelantado al momento del desembolso.' },
  { value: 'Financiamiento de Equipo (Con/Sin Inicial)', label: 'Financiamiento de Equipo / Artículos / Vehículos', description: 'Financiamiento de artículos con o sin inicial/enganche previa.' },
  { value: 'Pagaré / Préstamo Abierto', label: 'Pagaré Abierto / Préstamo Abierto (Línea Flexible)', description: 'Préstamo abierto flexible respaldado por pagaré donde el cliente abona capital libremente o paga intereses periódicos.' },
  { value: 'Amortización', label: 'Amortización Estándar', description: 'Plan de amortización directo equilibrado.' },
  { value: 'Rédito', label: 'Rédito Simple', description: 'Cobro periódico exclusivo de intereses.' }
];

/**
 * Formats a numeric string or number with real-time comma thousand separators.
 * Preserves trailing dots and decimals during typing (e.g. 100000 -> "100,000", "12500.5" -> "12,500.5").
 */
const formatMoneyWithCommas = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).replace(/,/g, '');
  if (str === '') return '';

  const parts = str.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  if (integerPart === '' || isNaN(Number(integerPart))) {
    return str;
  }

  const formattedInt = Number(integerPart).toLocaleString('en-US');
  return `${formattedInt}${decimalPart}`;
};

/**
 * Parses user text input into a clean numeric string for calculation.
 * Prevents leading zero lock (e.g. typing "5" into empty or "0" produces "5", not "05").
 * Allows clearing all the way to empty "" with backspace.
 */
const parseCleanMoney = (inputVal: string): string => {
  let clean = inputVal.replace(/[^\d.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  // Strip leading zeroes if entering integer numbers, e.g. "05" -> "5", but preserve "0."
  if (clean.length > 1 && clean.startsWith('0') && !clean.startsWith('0.')) {
    clean = clean.replace(/^0+/, '') || '0';
  }
  return clean;
};

/**
 * Parses integer or rate percentage inputs without leading zero locks.
 */
const parseCleanNumber = (inputVal: string): string => {
  let clean = inputVal.replace(/[^\d.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  if (clean.length > 1 && clean.startsWith('0') && !clean.startsWith('0.')) {
    clean = clean.replace(/^0+/, '') || '0';
  }
  return clean;
};

const DEFAULT_PRESET_EXPENSES: ExpenseConfig[] = [
  { id: '1', name: 'Gastos de Cierre', amount: 3000, isPercentage: false, mode: 'Descontado', enabled: false },
  { id: '2', name: 'Seguro de Cobertura / Desgravamen', amount: 1200, isPercentage: false, mode: 'Financiado', enabled: false },
  { id: '3', name: 'Gastos Legales y Contrato', amount: 1500, isPercentage: false, mode: 'Descontado', enabled: false },
  { id: '4', name: 'GPS / Rastreo de Vehículo', amount: 2500, isPercentage: false, mode: 'Financiado', enabled: false },
  { id: '5', name: 'Comisión Administrativa', amount: 1000, isPercentage: false, mode: 'Descontado', enabled: false }
];

const Simulator: React.FC = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { globalCurrency, companySettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'basico' | 'equipo' | 'gastos' | 'graficos'>('basico');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Simulation Basic State (stored as clean strings to allow fluid editing without 0 lock)
  const [amount, setAmount] = useState<string>('100000');
  const [weeks, setWeeks] = useState<string>('12');
  const [interest, setInterest] = useState<string>('18');
  const [frequency, setFrequency] = useState('Mensual');
  const [type, setType] = useState<LoanType>('Amortizado (Cuota Fija)');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Equipment / Vehicle Financing Specific State
  const [cashPrice, setCashPrice] = useState<string>('50000');
  const [financedPrice, setFinancedPrice] = useState<string>('70000');
  const [financingCalcMode, setFinancingCalcMode] = useState<'financed_price' | 'interest_rate'>('financed_price');
  const [itemPrice, setItemPrice] = useState<string>('50000');
  const [downPayment, setDownPayment] = useState<string>('10000');
  const [downPaymentMode, setDownPaymentMode] = useState<'Efectivo' | 'Transferencia' | 'Financiado'>('Efectivo');

  // Expenses & Arrears State (Defaulted to disabled / inactive as requested)
  const [expenses, setExpenses] = useState<ExpenseConfig[]>(DEFAULT_PRESET_EXPENSES);
  const [graceDays, setGraceDays] = useState<string>('3');
  const [lateFee, setLateFee] = useState<string>('5');

  const [result, setResult] = useState<SimulationResult | null>(null);

  // Compute effective principal amount based on loan type
  const effectivePrincipal = useMemo(() => {
    if (type === 'Financiamiento de Equipo (Con/Sin Inicial)') {
      const price = Number(String(cashPrice || itemPrice).replace(/,/g, '')) || 0;
      const down = Number(String(downPayment).replace(/,/g, '')) || 0;
      return Math.max(0, price - down);
    }
    return Number(String(amount).replace(/,/g, '')) || 0;
  }, [type, cashPrice, itemPrice, downPayment, amount]);

  // Compute effective interest rate based on calculation mode
  const effectiveInterestRate = useMemo(() => {
    if (type === 'Financiamiento de Equipo (Con/Sin Inicial)' && financingCalcMode === 'financed_price') {
      const principal = effectivePrincipal;
      const fPrice = Number(String(financedPrice).replace(/,/g, '')) || 0;
      const cPrice = Number(String(cashPrice || itemPrice).replace(/,/g, '')) || 0;
      const profit = Math.max(0, fPrice - cPrice);
      return principal > 0 ? (profit / principal) * 100 : 0;
    }
    return Number(interest) || 0;
  }, [type, financingCalcMode, effectivePrincipal, financedPrice, cashPrice, itemPrice, interest]);

  // Active expenses count and total
  const activeExpenses = useMemo(() => {
    return expenses.filter(e => e.enabled);
  }, [expenses]);

  // Execute Simulation Logic via LoanEngine
  useEffect(() => {
    try {
      const parsedAmount = effectivePrincipal;
      const parsedWeeks = Math.max(1, Number(weeks) || 1);
      const parsedInterest = effectiveInterestRate;

      const simResult = LoanEngine.calculateSimulation({
        amount: parsedAmount,
        interestRate: parsedInterest,
        durationWeeks: parsedWeeks,
        frequency,
        loanType: type,
        expenses: activeExpenses,
        startDate
      });

      setResult(simResult);
    } catch (e) {
      console.error("Simulation Calculation Error:", e);
    }
  }, [effectivePrincipal, effectiveInterestRate, weeks, frequency, type, activeExpenses, startDate]);

  const addExpense = () => {
    setExpenses(prev => [
      ...prev, 
      { 
        id: Date.now().toString(), 
        name: 'Nuevo Cargo / Seguro', 
        amount: 1000, 
        isPercentage: false, 
        mode: 'Descontado',
        enabled: true 
      }
    ]);
  };
  
  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateExpense = <K extends keyof ExpenseConfig>(id: string, field: K, value: ExpenseConfig[K]) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const toggleExpense = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  // Export Amortization Schedule to PDF
  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const companyName = companySettings?.name || 'UltraMoney';
    
    // Header
    doc.setFillColor(79, 70, 229); // #4F46E5
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(companyName.toUpperCase(), 14, 16);
    doc.setFontSize(10);
    doc.text('SIMULACIÓN OFICIAL DE PRÉSTAMO', 14, 23);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 16);

    // Summary Box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text('Resumen del Financiamiento', 14, 38);
    doc.setFontSize(9);
    doc.text(`Monto Solicitado: ${globalCurrency} ${effectivePrincipal.toLocaleString()}`, 14, 45);
    doc.text(`Tipo de Préstamo: ${type}`, 14, 51);
    doc.text(`Tasa de Interés: ${interest}% | Frecuencia: ${frequency}`, 14, 57);
    doc.text(`Duración: ${weeks} Cuotas | 1ra Cuota: ${result.summary.firstPaymentDate}`, 14, 63);

    doc.text(`Total Intereses: ${globalCurrency} ${result.summary.totalInterest.toLocaleString()}`, 110, 45);
    doc.text(`Total Cargos/Seguros: ${globalCurrency} ${result.summary.totalExpenses.toLocaleString()}`, 110, 51);
    doc.text(`Total General a Pagar: ${globalCurrency} ${result.summary.totalToPay.toLocaleString()}`, 110, 57);
    doc.text(`Cuota Periódica Estimada: ${globalCurrency} ${result.summary.baseInstallment.toLocaleString()}`, 110, 63);

    // Amortization Table
    const tableRows = result.schedule.map(row => [
      row.installmentNumber,
      row.date,
      `${globalCurrency} ${row.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${globalCurrency} ${row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${globalCurrency} ${row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${globalCurrency} ${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 72,
      head: [['#', 'Fecha Pago', 'Capital', 'Interés', 'Cuota Total', 'Balance Residual']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    doc.save(`Simulacion_${type.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  // Navigate to Loan Creation with Pre-filled Data
  const handleApproveSimulation = () => {
    navigate('/solicitud', {
      state: {
        clientId: selectedClientId,
        amount: effectivePrincipal,
        interestRate: Number(interest),
        durationWeeks: Number(weeks),
        frequency,
        loanType: type,
        itemPrice: type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? Number(itemPrice) : undefined,
        downPayment: type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? Number(downPayment) : undefined,
        downPaymentMode: type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? downPaymentMode : undefined
      }
    });
  };

  const selectedTypeDescription = useMemo(() => {
    return LOAN_TYPE_OPTIONS.find(o => o.value === type)?.description || '';
  }, [type]);

  const activeDiscountedTotal = useMemo(() => {
    return expenses
      .filter(e => e.enabled && e.mode === 'Descontado')
      .reduce((sum, e) => sum + (e.isPercentage ? effectivePrincipal * (e.amount / 100) : e.amount), 0);
  }, [expenses, effectivePrincipal]);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      {/* Top Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Simulador Financiero Pro</h1>
            <p className="text-xs text-slate-500 font-medium">Calculadora multi-esquema, financiamiento de vehículos/equipos y amortización precisa</p>
          </div>
        </div>
        
        {/* Client Fast Assignment (Optional) */}
        <div className="flex items-center gap-2">
          {selectedClientId && (
            <button
              onClick={() => setSelectedClientId('')}
              className="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl"
              title="Quitar cliente asignado"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={exportPDF} 
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Exportar a PDF
          </button>
        </div>
      </div>

      {/* Main Container: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls and Configuration Tabs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Client Selector Banner */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Cliente a Simular (Opcional):</span>
            </div>
            <div className="flex-1 min-w-[240px]">
              <CustomSelect 
                className="w-full text-xs font-medium"
                value={selectedClientId} 
                onChange={setSelectedClientId}
                options={[
                  { value: '', label: '-- Sin cliente asignado --' },
                  ...clients.map(c => ({ value: c.id, label: `${c.name} ${c.lastName || ''} (${c.cedula || 'Sin cédula'})` }))
                ]}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm w-full overflow-x-auto">
            {[
              { id: 'basico', label: 'Parámetros del Préstamo', icon: <Calculator className="w-4 h-4" /> },
              ...(type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? [{ id: 'equipo', label: 'Detalles del Artículo / Vehículo', icon: <DollarSign className="w-4 h-4" /> }] : []),
              { id: 'gastos', label: `Cargos & Seguros (${activeExpenses.length} activos)`, icon: <Settings className="w-4 h-4" /> },
              { id: 'graficos', label: 'Distribución Visual', icon: <PieChartIcon className="w-4 h-4" /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Box */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            
            {/* TAB: BÁSICO */}
            {activeTab === 'basico' && (
              <div className="space-y-6 animate-fade-in">
                {/* Loan Type Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Método de Amortización / Tipo de Préstamo</label>
                  <CustomSelect 
                    className="w-full font-bold text-slate-800 dark:text-white"
                    value={type} 
                    onChange={e => setType(e as LoanType)}
                    options={LOAN_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  />
                  {selectedTypeDescription && (
                    <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                      💡 <strong>{type}:</strong> {selectedTypeDescription}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount / Capital */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      {type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? 'Monto Neto a Financiar (Calculado)' : 'Monto del Préstamo (Capital)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400 font-bold">$</span>
                      <input 
                        type="text"
                        inputMode="decimal"
                        disabled={type === 'Financiamiento de Equipo (Con/Sin Inicial)'}
                        className={`w-full pl-8 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500 transition-all ${type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900 dark:text-white'}`}
                        value={type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? formatMoneyWithCommas(effectivePrincipal) : formatMoneyWithCommas(amount)} 
                        onChange={e => setAmount(parseCleanMoney(e.target.value))} 
                        placeholder="0.00"
                      />
                    </div>
                    {type === 'Financiamiento de Equipo (Con/Sin Inicial)' && (
                      <p className="text-xs text-slate-500 mt-1">Calculado automáticamente como: Precio del Artículo ({globalCurrency} {formatMoneyWithCommas(itemPrice)}) - Inicial ({globalCurrency} {formatMoneyWithCommas(downPayment)})</p>
                    )}
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tasa de Interés (%)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                        value={interest} 
                        onChange={e => setInterest(parseCleanNumber(e.target.value))} 
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-bold">%</span>
                    </div>
                  </div>

                  {/* Installments Duration */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cantidad de Cuotas</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                      value={weeks} 
                      onChange={e => setWeeks(parseCleanNumber(e.target.value))} 
                      placeholder="1"
                    />
                  </div>

                  {/* Payment Frequency */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Frecuencia de Pago</label>
                    <CustomSelect 
                      className="w-full"
                      value={frequency} 
                      onChange={setFrequency}
                      options={[
                        { value: 'Diario', label: 'Diario (Cobro cada día)' },
                        { value: 'Semanal', label: 'Semanal (Cada semana)' },
                        { value: 'Quincenal', label: 'Quincenal (Cada 15 días)' },
                        { value: 'Mensual', label: 'Mensual (Cada mes)' },
                        { value: 'Anual', label: 'Anual (Cada año)' }
                      ]}
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha de Desembolso</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: FINANCIAMIENTO DE EQUIPO */}
            {activeTab === 'equipo' && type === 'Financiamiento de Equipo (Con/Sin Inicial)' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      <p className="font-bold">Financiamiento de Equipos, Artículos, Laptops o Vehículos</p>
                      <p>Configura el precio al contado y el precio a financiar para calcular automáticamente el margen, capital e intereses.</p>
                    </div>
                  </div>
                  <div className="flex bg-emerald-100 dark:bg-emerald-900/60 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setFinancingCalcMode('financed_price')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${financingCalcMode === 'financed_price' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-emerald-800 dark:text-emerald-300 opacity-70'}`}
                    >
                      Por Precio Financiado
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinancingCalcMode('interest_rate')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${financingCalcMode === 'interest_rate' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-emerald-800 dark:text-emerald-300 opacity-70'}`}
                    >
                      Por Tasa %
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Precio Normal / Contado ($)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold" 
                      value={formatMoneyWithCommas(cashPrice)} 
                      onChange={e => {
                        const raw = parseCleanMoney(e.target.value);
                        setCashPrice(raw);
                        setItemPrice(raw);
                      }} 
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Precio comercial de venta al contado sin financiamiento.</p>
                  </div>

                  {financingCalcMode === 'financed_price' ? (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Precio Total Financiado ($)</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold" 
                        value={formatMoneyWithCommas(financedPrice)} 
                        onChange={e => setFinancedPrice(parseCleanMoney(e.target.value))} 
                        placeholder="0.00"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Precio total que pagará el cliente amortizado en cuotas.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tasa de Interés Total (%)</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold" 
                        value={interest} 
                        onChange={e => setInterest(parseCleanNumber(e.target.value))} 
                        placeholder="0"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Porcentaje de interés o ganancia aplicado sobre el capital neto.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Inicial / Enganche ($)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold" 
                      value={formatMoneyWithCommas(downPayment)} 
                      onChange={e => setDownPayment(parseCleanMoney(e.target.value))} 
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Monto adelantado pagado por el cliente al momento de la compra.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Modalidad de Cobro del Inicial</label>
                    <CustomSelect 
                      className="w-full"
                      value={downPaymentMode} 
                      onChange={e => setDownPaymentMode(e as typeof downPaymentMode)}
                      options={[
                        { value: 'Efectivo', label: 'Efectivo en Caja' },
                        { value: 'Transferencia', label: 'Transferencia Bancaria' },
                        { value: 'Financiado', label: 'Inicial Financiada en Cuotas' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GASTOS, SEGUROS & MORA */}
            {activeTab === 'gastos' && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                        <span>Comisiones, Seguros & Gastos de Cierre</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-extrabold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {activeExpenses.length} activo(s)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">Activa o desactiva cada cargo con su interruptor. Todos vienen inactivos por defecto.</p>
                    </div>
                    <button 
                      onClick={addExpense} 
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4"/> Agregar Nuevo Cargo
                    </button>
                  </div>

                  <div className="space-y-3">
                    {expenses.map(exp => {
                      const isExpActive = Boolean(exp.enabled);
                      return (
                        <div 
                          key={exp.id} 
                          className={`p-4 rounded-2xl border transition-all ${
                            isExpActive 
                              ? 'bg-white dark:bg-slate-900/90 border-indigo-200 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-500/20' 
                              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => toggleExpense(exp.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isExpActive
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {isExpActive ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Activo (Aplicar en Préstamo)</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4" />
                                  <span>Inactivo (Desactivado)</span>
                                </>
                              )}
                            </button>

                            <div className="flex items-center gap-2 self-end md:self-auto">
                              <span className={`text-[11px] font-bold ${isExpActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                Modo: {exp.mode}
                              </span>
                              <button 
                                onClick={() => removeExpense(exp.id)} 
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                title="Eliminar cargo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Nombre del Cargo</label>
                              <input 
                                type="text" 
                                value={exp.name} 
                                onChange={e => updateExpense(exp.id, 'name', e.target.value)} 
                                className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white font-medium border-slate-200 dark:border-slate-700" 
                                placeholder="Ej: Gastos de Cierre" 
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                {exp.isPercentage ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
                              </label>
                              <input 
                                type="text" 
                                inputMode="decimal"
                                value={exp.isPercentage ? exp.amount : formatMoneyWithCommas(exp.amount)} 
                                onChange={e => {
                                  const raw = exp.isPercentage 
                                    ? Number(parseCleanNumber(e.target.value)) || 0 
                                    : Number(parseCleanMoney(e.target.value)) || 0;
                                  updateExpense(exp.id, 'amount', raw);
                                }} 
                                className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white font-bold border-slate-200 dark:border-slate-700" 
                                placeholder="0.00" 
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo de Cargo</label>
                              <CustomSelect 
                                value={exp.isPercentage ? 'true' : 'false'} 
                                onChange={e => updateExpense(exp.id, 'isPercentage', e === 'true')} 
                                className="w-full text-xs"
                                options={[
                                  { value: 'false', label: '$ Monto Fijo' },
                                  { value: 'true', label: '% del Capital' }
                                ]}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Aplicación</label>
                              <CustomSelect 
                                value={exp.mode} 
                                onChange={e => updateExpense(exp.id, 'mode', e as ExpenseConfig['mode'])} 
                                className="w-full text-xs"
                                options={[
                                  { value: 'Descontado', label: 'Descontado (Resta del desembolso)' },
                                  { value: 'Financiado', label: 'Financiado (Suma al saldo capital)' },
                                  { value: 'Independiente', label: 'Externo / Pago por separado' }
                                ]}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {expenses.length === 0 && (
                      <p className="text-sm text-slate-400 p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">Sin cargos adicionales configurados.</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Políticas de Mora por Atraso</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">% Penalidad por Mora (Mensual)</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={lateFee} 
                        onChange={e => setLateFee(parseCleanNumber(e.target.value))} 
                        className="w-full px-4 py-2.5 border rounded-xl text-sm font-bold bg-white dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-700" 
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Días de Gracia sin Recargo</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={graceDays} 
                        onChange={e => setGraceDays(parseCleanNumber(e.target.value))} 
                        className="w-full px-4 py-2.5 border rounded-xl text-sm font-bold bg-white dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-700" 
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GRÁFICOS */}
            {activeTab === 'graficos' && result && (
              <div className="animate-fade-in space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-base text-center">Distribución Total del Crédito</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={result.charts.distribution} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={90} 
                        innerRadius={50}
                        paddingAngle={5}
                        fill="#8884d8" 
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {result.charts.distribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: number) => `${globalCurrency} ${val.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Amortization Schedule Table */}
          {result && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Tabla de Amortización Proyectada</h3>
                    <p className="text-xs text-slate-500">Desglose exacto cuota por cuota ({result.schedule.length} cuotas generadas)</p>
                  </div>
                </div>
                <button 
                  onClick={exportPDF}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors">
                  <FileText className="w-4 h-4 text-indigo-600" /> Exportar Plan PDF
                </button>
              </div>
              
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center">#</th>
                      <th className="px-4 py-3">Fecha de Pago</th>
                      <th className="px-4 py-3 text-right">Capital</th>
                      <th className="px-4 py-3 text-right text-rose-500">Interés</th>
                      <th className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400">Cuota Total</th>
                      <th className="px-4 py-3 text-right">Balance Residual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                    {result.schedule.map((row) => (
                      <tr key={row.installmentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">{row.installmentNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {row.date}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{globalCurrency} {row.principal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-4 py-3 text-right font-medium text-rose-500">{globalCurrency} {row.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{globalCurrency} {row.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{globalCurrency} {row.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial Summary Dashboard */}
        <div className="lg:col-span-4">
          {result && (
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl sticky top-8 space-y-6">
              <div className="text-center pb-6 border-b border-slate-800">
                <p className="text-indigo-400 font-bold uppercase tracking-wider text-xs mb-1">
                  {type.includes('Rédito') ? 'Interés Periódico por Cuota' : 'Cuota Periódica Estimada'}
                </p>
                <div className="text-4xl font-extrabold tracking-tight mb-1 text-white">
                  {globalCurrency} {result.summary.baseInstallment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <span className="inline-block bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-bold px-3 py-1 rounded-full">
                  Frecuencia: {frequency} ({weeks} cuotas)
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Capital Financiamiento</span>
                  <span className="font-bold">{globalCurrency} {effectivePrincipal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Intereses Proyectados</span>
                  <span className="font-bold text-rose-400">+{globalCurrency} {result.summary.totalInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cargos y Seguros Activos</span>
                  <span className="font-bold text-emerald-400">+{globalCurrency} {result.summary.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>

                {type === 'Financiamiento de Equipo (Con/Sin Inicial)' && (
                  <div className="flex justify-between items-center text-amber-300">
                    <span>Inicial Pagada por Cliente</span>
                    <span className="font-bold">-{globalCurrency} {Number(downPayment).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <span className="text-white font-bold text-base">Total General a Pagar</span>
                  <span className="font-extrabold text-2xl text-indigo-300">{globalCurrency} {result.summary.totalToPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              {/* Disbursement Summary */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Desembolso Neto al Cliente:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {globalCurrency} {Math.max(0, effectivePrincipal - activeDiscountedTotal).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Se deduce cualquier gasto descontado activo ({globalCurrency} {activeDiscountedTotal.toLocaleString()}) del capital desembolsado.</p>
              </div>

              {/* Key Dates */}
              <div className="pt-2 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">1er Pago</p>
                  <p className="font-bold text-indigo-300 text-xs">{result.summary.firstPaymentDate}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Último Pago</p>
                  <p className="font-bold text-indigo-300 text-xs">{result.summary.lastPaymentDate}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button 
                  onClick={handleApproveSimulation}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50 transition-all active:scale-95">
                  APROBAR / SOLICITAR PRÉSTAMO <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={exportPDF}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs active:scale-95">
                  <Download className="w-3.5 h-3.5" /> Descargar Plan en PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
