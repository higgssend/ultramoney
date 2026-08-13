import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Settings, PieChart as PieChartIcon, TrendingUp, Calendar, ChevronLeft, ArrowRight, Table, FileText, Plus, Trash2, Download, UserCheck, ShieldAlert, Sparkles, DollarSign, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans, useSettings } from '../context/StoreContext';
import { LoanType } from '../types';
import { LoanEngine, ExpenseConfig, ExtraordinaryPayment, SimulationResult } from '../utils/LoanEngine';
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

const Simulator: React.FC = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { globalCurrency, companySettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'basico' | 'equipo' | 'gastos' | 'graficos'>('basico');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Simulation Basic State
  const [amount, setAmount] = useState<number | string>('100000');
  const [weeks, setWeeks] = useState<number | string>('12');
  const [interest, setInterest] = useState<number | string>('18');
  const [frequency, setFrequency] = useState('Mensual');
  const [type, setType] = useState<LoanType>('Amortizado (Cuota Fija)');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Equipment / Vehicle Financing Specific State
  const [itemPrice, setItemPrice] = useState<number | string>('150000');
  const [downPayment, setDownPayment] = useState<number | string>('30000');
  const [downPaymentMode, setDownPaymentMode] = useState<'Efectivo' | 'Transferencia' | 'Financiado'>('Efectivo');

  // Expenses & Arrears State
  const [expenses, setExpenses] = useState<ExpenseConfig[]>([
    { id: '1', name: 'Gastos de Cierre', amount: 3000, isPercentage: false, mode: 'Descontado' },
    { id: '2', name: 'Seguro de Cobertura', amount: 1200, isPercentage: false, mode: 'Financiado' }
  ]);
  const [graceDays, setGraceDays] = useState(3);
  const [lateFee, setLateFee] = useState(5);

  const [result, setResult] = useState<SimulationResult | null>(null);

  // Compute effective principal amount based on loan type
  const effectivePrincipal = useMemo(() => {
    if (type === 'Financiamiento de Equipo (Con/Sin Inicial)') {
      const price = Number(itemPrice) || 0;
      const down = Number(downPayment) || 0;
      return Math.max(0, price - down);
    }
    return Number(amount) || 0;
  }, [type, itemPrice, downPayment, amount]);

  // Execute Simulation Logic via LoanEngine
  useEffect(() => {
    try {
      const parsedAmount = effectivePrincipal;
      const parsedWeeks = Math.max(1, Number(weeks) || 1);
      const parsedInterest = Number(interest) || 0;

      const simResult = LoanEngine.calculateSimulation({
        amount: parsedAmount,
        interestRate: parsedInterest,
        durationWeeks: parsedWeeks,
        frequency: frequency as any,
        loanType: type,
        expenses,
        startDate
      });

      setResult(simResult);
    } catch (e) {
      console.error("Simulation Calculation Error:", e);
    }
  }, [effectivePrincipal, weeks, interest, frequency, type, expenses, startDate]);

  const handleNumberInput = (setter: React.Dispatch<React.SetStateAction<string | number>>, val: string) => {
    if (val.length > 1 && val.startsWith('0') && !val.includes('.')) val = val.replace(/^0+/, '');
    setter(val === '' ? '' : val);
  };

  const addExpense = () => {
    setExpenses([...expenses, { id: Date.now().toString(), name: 'Nuevo Cargo', amount: 0, isPercentage: false, mode: 'Descontado' }]);
  };
  
  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = <K extends keyof ExpenseConfig>(id: string, field: K, value: ExpenseConfig[K]) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
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

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Top Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Simulador Financiero Pro</h2>
              <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Todos los Métodos
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Cálculo de amortizaciones, cargos, financiamiento de vehículos y proyecciones en tiempo real.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={exportPDF} 
            disabled={!result}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm">
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Exportar PDF
          </button>
          <button 
            onClick={handleApproveSimulation}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all text-sm">
            CREAR PRÉSTAMO <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Tabs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Client Assignment Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Asignar a Cliente (Opcional)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona un cliente para enviar esta simulación directo a solicitud.</p>
              </div>
            </div>
            <div className="min-w-[240px]">
              <CustomSelect 
                className="w-full bg-white dark:bg-slate-900 text-sm"
                value={selectedClientId}
                onChange={setSelectedClientId}
                options={[
                  { value: '', label: '-- Sin cliente asignado --' },
                  ...clients.map(c => ({ value: c.id, label: `${c.name} (${c.cedula || 'Sin cédula'})` }))
                ]}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm w-full overflow-x-auto">
            {[
              { id: 'basico', label: 'Parámetros del Préstamo', icon: <Calculator className="w-4 h-4" /> },
              ...(type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? [{ id: 'equipo', label: 'Detalles del Artículo / Vehículo', icon: <DollarSign className="w-4 h-4" /> }] : []),
              { id: 'gastos', label: 'Cargos, Seguros & Mora', icon: <Settings className="w-4 h-4" /> },
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
                        type="number" 
                        disabled={type === 'Financiamiento de Equipo (Con/Sin Inicial)'}
                        className={`w-full pl-8 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500 ${type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900 dark:text-white'}`}
                        value={type === 'Financiamiento de Equipo (Con/Sin Inicial)' ? effectivePrincipal : amount} 
                        onChange={e => handleNumberInput(setAmount, e.target.value)} 
                      />
                    </div>
                    {type === 'Financiamiento de Equipo (Con/Sin Inicial)' && (
                      <p className="text-xs text-slate-500 mt-1">Calculado automáticamente como: Precio del Artículo ({globalCurrency} {Number(itemPrice).toLocaleString()}) - Inicial ({globalCurrency} {Number(downPayment).toLocaleString()})</p>
                    )}
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tasa de Interés (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                        value={interest} 
                        onChange={e => handleNumberInput(setInterest, e.target.value)} 
                      />
                      <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-bold">%</span>
                    </div>
                  </div>

                  {/* Installments Duration */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cantidad de Cuotas</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                      value={weeks} 
                      onChange={e => handleNumberInput(setWeeks, e.target.value)} 
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
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <p className="font-bold">Financiamiento de Equipos, Artículos o Vehículos</p>
                    <p>Permite registrar el valor total del bien comercializado y descontar la inicial pagada por el cliente. El resto se amortiza en las cuotas pactadas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Precio Total del Artículo / Vehículo ($)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                      value={itemPrice} 
                      onChange={e => handleNumberInput(setItemPrice, e.target.value)} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Inicial / Enganche ($)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                      value={downPayment} 
                      onChange={e => handleNumberInput(setDownPayment, e.target.value)} 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Modalidad de Pago de la Inicial</label>
                    <CustomSelect 
                      className="w-full"
                      value={downPaymentMode}
                      onChange={e => setDownPaymentMode(e as typeof downPaymentMode)}
                      options={[
                        { value: 'Efectivo', label: 'Efectivo en Caja' },
                        { value: 'Transferencia', label: 'Transferencia Bancaria Directa' },
                        { value: 'Financiado', label: 'Financiado (Sumar a capital principal)' }
                      ]}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Monto Total Resultante a Financiar</p>
                    <p className="text-2xl font-bold text-emerald-400">{globalCurrency} {effectivePrincipal.toLocaleString()}</p>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
                    Precio {globalCurrency} {Number(itemPrice).toLocaleString()} - Inicial {globalCurrency} {Number(downPayment).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* TAB: GASTOS Y MORA */}
            {activeTab === 'gastos' && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base">Comisiones, Seguros & Cargos de Cierre</h3>
                      <p className="text-xs text-slate-500">Configura gastos adicionales descontados del desembolso o financiados.</p>
                    </div>
                    <button onClick={addExpense} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
                      <Plus className="w-3.5 h-3.5"/> Agregar Cargo
                    </button>
                  </div>

                  <div className="space-y-3">
                    {expenses.map(exp => (
                      <div key={exp.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <input 
                          type="text" 
                          value={exp.name} 
                          onChange={e => updateExpense(exp.id, 'name', e.target.value)} 
                          className="px-3 py-2 border rounded-xl text-sm flex-1 bg-white dark:bg-slate-800 font-medium" 
                          placeholder="Nombre del cargo" 
                        />
                        <input 
                          type="number" 
                          value={exp.amount} 
                          onChange={e => updateExpense(exp.id, 'amount', Number(e.target.value))} 
                          className="w-28 px-3 py-2 border rounded-xl text-sm bg-white dark:bg-slate-800 font-bold" 
                          placeholder="Monto" 
                        />
                        <CustomSelect 
                          value={exp.isPercentage ? 'true' : 'false'} 
                          onChange={e => updateExpense(exp.id, 'isPercentage', e === 'true')} 
                          className="w-36"
                          options={[
                            { value: 'false', label: '$ Fijo' },
                            { value: 'true', label: '% del Capital' }
                          ]}
                        />
                        <CustomSelect 
                          value={exp.mode} 
                          onChange={e => updateExpense(exp.id, 'mode', e as ExpenseConfig['mode'])} 
                          className="flex-1 min-w-[200px]"
                          options={[
                            { value: 'Descontado', label: 'Descontado (Restar del desembolso)' },
                            { value: 'Financiado', label: 'Financiado (Sumar al saldo capital)' },
                            { value: 'Independiente', label: 'Externo / Paga aparte' }
                          ]}
                        />
                        <button onClick={() => removeExpense(exp.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
                        type="number" 
                        value={lateFee} 
                        onChange={e => setLateFee(Number(e.target.value))} 
                        className="w-full px-4 py-2.5 border rounded-xl text-sm font-bold bg-white dark:bg-slate-900" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Días de Gracia sin Recargo</label>
                      <input 
                        type="number" 
                        value={graceDays} 
                        onChange={e => setGraceDays(Number(e.target.value))} 
                        className="w-full px-4 py-2.5 border rounded-xl text-sm font-bold bg-white dark:bg-slate-900" 
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
                        {result.charts.distribution.map((entry, index) => (
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
              <div className="flex items-center justify-between mb-4">
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
                  <span className="text-slate-400">Cargos y Seguros</span>
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
                    {globalCurrency} {(effectivePrincipal - expenses.filter(e => e.mode === 'Descontado').reduce((sum, e) => sum + (e.isPercentage ? effectivePrincipal * (e.amount/100) : e.amount), 0)).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Se deduce cualquier gasto descontado del capital desembolsado.</p>
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
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50 transition-all">
                  APROBAR / SOLICITAR PRÉSTAMO <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={exportPDF}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs">
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
