import React, { useState, useEffect } from 'react';
import { Calculator, Settings, PieChart as PieChartIcon, TrendingUp, Calendar, ChevronLeft, ArrowRight, Table, FileText, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LoanType } from '../types';
import { LoanEngine, ExpenseConfig, ExtraordinaryPayment, SimulationResult } from '../utils/LoanEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

const Simulator: React.FC = () => {
  const navigate = useNavigate();
  const { clients, createLoan, globalCurrency } = useStore();

  const [activeTab, setActiveTab] = useState<'basico' | 'gastos' | 'abonos' | 'graficos'>('basico');

  // Simulation State
  const [amount, setAmount] = useState<number | string>('100000');
  const [weeks, setWeeks] = useState<number | string>('12');
  const [interest, setInterest] = useState<number | string>('18');
  const [frequency, setFrequency] = useState('Mensual');
  const [type, setType] = useState<LoanType>('Amortizado (Cuota Fija)');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Gastos
  const [expenses, setExpenses] = useState<ExpenseConfig[]>([
    { id: '1', name: 'Comisión', amount: 3000, isPercentage: false, mode: 'Financiado', type: 'Comisión' },
    { id: '2', name: 'Seguro', amount: 1200, isPercentage: false, mode: 'Independiente', type: 'Seguro' }
  ]);

  // Mora
  const [graceDays, setGraceDays] = useState(3);
  const [lateFee, setLateFee] = useState(5);

  // Abonos Extraordinarios
  const [extraPayments, setExtraPayments] = useState<ExtraordinaryPayment[]>([]);

  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
      const config = {
          amount: Number(amount) || 0,
          interestRate: Number(interest) || 0,
          installments: Number(weeks) || 1,
          frequency,
          startDate,
          loanType: type,
          expenses,
          arrears: { graceDays, monthlyPercentage: lateFee },
          extraPayments
      };

      const res = LoanEngine.calcular(config);
      setResult(res);
  }, [amount, weeks, interest, frequency, type, startDate, expenses, graceDays, lateFee, extraPayments]);

  const handleNumberInput = (setter: React.Dispatch<React.SetStateAction<string | number>>, val: string) => {
      if (val.length > 1 && val.startsWith('0') && !val.includes('.')) val = val.replace(/^0+/, '');
      setter(val === '' ? '' : val);
  };

  const addExpense = () => {
      setExpenses([...expenses, { id: Date.now().toString(), name: 'Nuevo Cargo', amount: 0, isPercentage: false, mode: 'Financiado', type: 'Otro' }]);
  };
  
  const removeExpense = (id: string) => {
      setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, field: keyof ExpenseConfig, value: any) => {
      setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-10">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Simulador Avanzado</h2>
                    <p className="text-slate-500 dark:text-slate-400">Recálculo automático e inteligente en tiempo real.</p>
                </div>
            </div>
            
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all">
                APROBAR ESTA SIMULACIÓN <ArrowRight className="w-5 h-5" />
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Controls */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Tabs */}
                <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm w-fit overflow-x-auto">
                    {[
                        { id: 'basico', label: 'Info Básica', icon: <Calculator className="w-4 h-4" /> },
                        { id: 'gastos', label: 'Gastos & Mora', icon: <Settings className="w-4 h-4" /> },
                        { id: 'abonos', label: 'Abonos', icon: <TrendingUp className="w-4 h-4" /> },
                        { id: 'graficos', label: 'Gráficos', icon: <PieChartIcon className="w-4 h-4" /> }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    
                    {activeTab === 'basico' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Monto a Prestar (Capital)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                    <input type="number" className="w-full pl-8 pr-4 py-3 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-lg" 
                                        value={amount} onChange={e => handleNumberInput(setAmount, e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tasa de Interés (%)</label>
                                <input type="number" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500" 
                                    value={interest} onChange={e => handleNumberInput(setInterest, e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duración (Cuotas)</label>
                                <input type="number" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500" 
                                    value={weeks} onChange={e => handleNumberInput(setWeeks, e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Frecuencia</label>
                                <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    value={frequency} onChange={e => setFrequency(e.target.value)}>
                                    <option>Diario</option>
                                    <option>Semanal</option>
                                    <option>Quincenal</option>
                                    <option>Mensual</option>
                                    <option>Anual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha de Desembolso</label>
                                <input type="date" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500" 
                                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Método de Amortización</label>
                                <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                    value={type} onChange={e => setType(e.target.value as LoanType)}>
                                    <option value="Amortizado (Cuota Fija)">Cuota Fija (Francés)</option>
                                    <option value="Amortizado (Capital Fijo)">Capital Fijo (Alemán)</option>
                                    <option value="Rédito (Solo Interés)">Solo Intereses (Abierto)</option>
                                    <option value="Interés Adelantado">Interés Adelantado</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gastos' && (
                        <div className="animate-fade-in space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800 dark:text-white">Cargos y Seguros</h3>
                                    <button onClick={addExpense} className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"><Plus className="w-3 h-3"/> Agregar Gasto</button>
                                </div>
                                <div className="space-y-3">
                                    {expenses.map(exp => (
                                        <div key={exp.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <input type="text" value={exp.name} onChange={e => updateExpense(exp.id, 'name', e.target.value)} className="px-3 py-2 border rounded-lg text-sm flex-1 bg-white dark:bg-slate-800" placeholder="Nombre (Ej. Seguro)" />
                                            <input type="number" value={exp.amount} onChange={e => updateExpense(exp.id, 'amount', Number(e.target.value))} className="w-24 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="Monto" />
                                            <select value={exp.isPercentage ? 'true' : 'false'} onChange={e => updateExpense(exp.id, 'isPercentage', e.target.value === 'true')} className="px-2 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800">
                                                <option value="false">$ Fijo</option>
                                                <option value="true">% del Capital</option>
                                            </select>
                                            <select value={exp.mode} onChange={e => updateExpense(exp.id, 'mode', e.target.value)} className="px-2 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800">
                                                <option value="Financiado">Financiado (Sumar a capital)</option>
                                                <option value="Descontado">Descontado (Restar del desembolso)</option>
                                                <option value="Independiente">Pago Independiente</option>
                                            </select>
                                            <button onClick={() => removeExpense(exp.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {expenses.length === 0 && <p className="text-sm text-slate-400 p-4 text-center border border-dashed rounded-xl">Sin cargos adicionales.</p>}
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Configuración de Mora</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">% de Mora (Mensual)</label>
                                        <input type="number" value={lateFee} onChange={e => setLateFee(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Días de Gracia</label>
                                        <input type="number" value={graceDays} onChange={e => setGraceDays(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'graficos' && result && (
                        <div className="animate-fade-in flex flex-col items-center justify-center h-64">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Distribución del Préstamo</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={result.charts.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                        {result.charts.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => `${globalCurrency} ${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Table */}
                {result && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Table className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Cronograma</h3>
                            </div>
                            <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 border px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Exportar PDF
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3 text-right">Capital</th>
                                        <th className="px-4 py-3 text-right text-rose-500">Interés</th>
                                        <th className="px-4 py-3 text-right text-indigo-600">Cuota</th>
                                        <th className="px-4 py-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                                    {result.schedule.map((row) => (
                                        <tr key={row.installmentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-500">{row.installmentNumber}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{row.date}</td>
                                            <td className="px-4 py-3 text-right font-medium">{globalCurrency} {row.principal.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                            <td className="px-4 py-3 text-right font-medium text-rose-500">{globalCurrency} {row.interest.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                            <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{globalCurrency} {row.total.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-500">{globalCurrency} {row.balance.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Immediate Result Summary */}
            <div className="lg:col-span-4">
                {result && (
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl sticky top-8">
                        <div className="text-center mb-6">
                            <p className="text-indigo-300 font-bold uppercase tracking-wider text-xs mb-1">
                                {type.includes('Fijo') ? 'Cuota Estimada' : 'Interés Periódico'}
                            </p>
                            <div className="text-4xl font-bold tracking-tight mb-2 text-white">
                                {globalCurrency} {result.summary.baseInstallment.toLocaleString(undefined, {maximumFractionDigits: 2})}
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-slate-800 pt-6 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Monto Base</span>
                                <span className="font-bold">{globalCurrency} {(Number(amount) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Intereses</span>
                                <span className="font-bold text-rose-400">{globalCurrency} {result.summary.totalInterest.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Comisiones/Seguros</span>
                                <span className="font-bold text-emerald-400">{globalCurrency} {result.summary.totalExpenses.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                <span className="text-white font-bold text-base">Total a Pagar</span>
                                <span className="font-bold text-xl text-white">{globalCurrency} {result.summary.totalToPay.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">1er Pago</p>
                                <p className="font-bold text-indigo-300">{result.summary.firstPaymentDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Último Pago</p>
                                <p className="font-bold text-indigo-300">{result.summary.lastPaymentDate}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Simulator;
