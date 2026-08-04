
import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Lock, Calculator, AlertTriangle, Save, Wallet, ChevronLeft, Play, StopCircle, Clock, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useAccounting } from '../context/StoreContext';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';
import { PaymentMethod } from '../types';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { CustomSelect } from '../components/CustomSelect';

const Accounting: React.FC = () => {
  const { transactions, getFinancialStats, activeCashShift, openCashShift, closeCashShift, getCashShiftSummary, cashShifts, addTransaction } = useAccounting();
  const navigate = useNavigate();
  const stats = getFinancialStats();
  const shiftSummary = getCashShiftSummary();
  const recentTransactions = transactions.slice(0, 10);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'shift' | 'expense'>('overview');
  const [showSystemSummary, setShowSystemSummary] = useState(false);

  // Open Shift Form State
  const [initialCashAmount, setInitialCashAmount] = useState('5000');
  const [openShiftNotes, setOpenShiftNotes] = useState('');

  // Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<'Combustible' | 'Papelería' | 'Nómina' | 'Operativo' | 'Servicios' | 'Mantenimiento' | 'Otros'>('Operativo');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('Efectivo');

  // Cash Closing Billete Counter State
  const [closingData, setClosingData] = useState({
      twoThousands: 0,
      thousands: 0,
      fiveHundreds: 0,
      twoHundreds: 0,
      hundreds: 0,
      fifties: 0,
      coins: 0,
      notes: ''
  });

  const chartData = [
    { name: 'Flujo Hoy', ingresos: stats.incomeToday, gastos: stats.expenseToday },
  ];

  const calculateCountedTotal = () => {
      return (
          (closingData.twoThousands * 2000) +
          (closingData.thousands * 1000) +
          (closingData.fiveHundreds * 500) +
          (closingData.twoHundreds * 200) +
          (closingData.hundreds * 100) +
          (closingData.fifties * 50) +
          Number(closingData.coins)
      );
  };

  const countedTotal = calculateCountedTotal();
  const shiftDifference = countedTotal - shiftSummary.expectedAmount;

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(initialCashAmount);
    if (isNaN(amount) || amount < 0) return;
    openCashShift(amount, openShiftNotes);
  };

  const handleCloseShiftSubmit = () => {
    closeCashShift(countedTotal, closingData.notes);
    setClosingData({ twoThousands: 0, thousands: 0, fiveHundreds: 0, twoHundreds: 0, hundreds: 0, fifties: 0, coins: 0, notes: '' });
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    await addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Gasto',
        category: expenseCategory,
        description: expenseDescription,
        amount: amount,
        paymentMethod: expenseMethod,
        lender_id: '' // Managed by addTransaction internally via currentUser
    });
    
    setExpenseAmount('');
    setExpenseDescription('');
    setActiveTab('overview');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Contabilidad y Caja</h2>
                <p className="text-slate-500">Apertura, arqueo, egresos y control de flujo de caja.</p>
            </div>
        </div>
        <div className="flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
                Resumen
            </button>
            <button 
                onClick={() => setActiveTab('shift')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'shift' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
                <Wallet className="w-4 h-4" />
                {activeCashShift ? 'Turno Activo (Arqueo)' : 'Apertura de Caja'}
            </button>
            <button 
                onClick={() => setActiveTab('expense')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'expense' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
                <TrendingDown className="w-4 h-4" />
                Registrar Gasto
            </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
            {/* Status of Active Shift Banner */}
            <div className={`p-4 rounded-2xl border flex flex-wrap justify-between items-center gap-4 ${activeCashShift ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${activeCashShift ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs uppercase font-bold tracking-wider">{activeCashShift ? 'Turno de Caja Abierto' : 'No Hay Caja Abierta'}</span>
                        <h4 className="font-bold text-base">
                            {activeCashShift ? `Cajero: ${activeCashShift.userName} | Abierto: ${new Date(activeCashShift.openedAt).toLocaleTimeString()}` : 'Debes abrir caja para empezar a registrar operaciones presenciales'}
                        </h4>
                    </div>
                </div>
                <button
                    onClick={() => setActiveTab('shift')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all ${activeCashShift ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-amber-700 hover:bg-amber-800 text-white'}`}
                >
                    {activeCashShift ? 'Realizar Arqueo / Cierre' : 'Abrir Caja Ahora'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Saldo en Caja" 
                    value={`$${stats.balance.toLocaleString()}`} 
                    icon={Wallet} 
                    gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                    glowColor="shadow-blue-500/30"
                />
                <StatCard 
                    title="Ingresos Hoy" 
                    value={`+$${stats.incomeToday.toLocaleString()}`} 
                    icon={TrendingUp} 
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
                    glowColor="shadow-emerald-500/30"
                />
                <StatCard 
                    title="Gastos Hoy" 
                    value={`-$${stats.expenseToday.toLocaleString()}`} 
                    icon={TrendingDown} 
                    gradient="bg-gradient-to-br from-rose-500 to-pink-600"
                    glowColor="shadow-rose-500/30"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 text-lg">Comparativa de Flujo (Hoy)</h3>
                    <div className="h-80 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={60}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} prefix="$" tick={{fill: '#94a3b8'}} />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Legend />
                            <Bar dataKey="ingresos" name="Ingresos" radius={[8, 8, 0, 0]}>
                                <Cell fill="url(#colorIncome)" />
                            </Bar>
                            <Bar dataKey="gastos" name="Gastos" radius={[8, 8, 0, 0]}>
                                <Cell fill="url(#colorExpense)" />
                            </Bar>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" />
                                    <stop offset="100%" stopColor="#e11d48" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 text-lg">Últimos Movimientos</h3>
                        <DataExportToolbar 
                            data={transactions} 
                            title="Historial de Movimientos"
                            filename="movimientos_ultramoney"
                            columns={[
                                { header: 'ID', key: 'id' },
                                { header: 'Fecha', key: 'date', format: (v) => new Date(v).toLocaleDateString() },
                                { header: 'Tipo', key: 'type' },
                                { header: 'Categoría', key: 'category' },
                                { header: 'Descripción', key: 'description' },
                                { header: 'Monto', key: 'amount', format: (v) => `RD$ ${v?.toLocaleString()}` },
                                { header: 'Método', key: 'paymentMethod' }
                            ]} 
                        />
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                        {recentTransactions.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-3 -mx-2 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${t.type === 'Gasto' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                        {t.type === 'Gasto' ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{t.category} <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-1">{t.paymentMethod || 'Efectivo'}</span></p>
                                        <p className="text-xs text-slate-400 truncate w-40">{t.description}</p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${t.type === 'Gasto' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {t.type === 'Gasto' ? '-' : '+'}${t.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}

      {activeTab === 'shift' && (
        !activeCashShift ? (
            /* Open Cash Shift Form */
            <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
                        <Play className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">Apertura de Caja</h3>
                        <p className="text-sm text-slate-500">Inicia el turno de trabajo asignando el balance inicial.</p>
                    </div>
                </div>

                <form onSubmit={handleOpenShiftSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Monto Base Inicial (RD$)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                            <input 
                                type="number" 
                                min="0"
                                required
                                value={initialCashAmount}
                                onChange={e => setInitialCashAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 rounded-xl font-mono font-bold text-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Suma en billetes y monedas entregada al cajero.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notas de Apertura (Opcional)</label>
                        <textarea 
                            rows={3}
                            value={openShiftNotes}
                            onChange={e => setOpenShiftNotes(e.target.value)}
                            placeholder="Ej: Billetes de RD$ 500 y RD$ 1,000 en fondo de caja..."
                            className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5 fill-current" /> ABRIR CAJA DEL DÍA
                    </button>
                </form>
            </div>
        ) : (
            /* Cash Shift Active & Closing View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                {/* Physical Bill Counting */}
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <Calculator className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-800">Conteo de Billetes (Arqueo)</h3>
                            <p className="text-sm text-slate-500">Ingresa la cantidad física en caja al momento de cerrar.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[2000, 1000, 500, 200, 100, 50].map((denom) => {
                            const keyMap: Record<number, keyof typeof closingData> = {
                                2000: 'twoThousands',
                                1000: 'thousands',
                                500: 'fiveHundreds',
                                200: 'twoHundreds',
                                100: 'hundreds',
                                50: 'fifties'
                            };
                            const k = keyMap[denom];
                            return (
                              <div key={denom} className="flex items-center gap-4">
                                  <label className="w-24 text-sm font-bold text-slate-700">RD$ {denom}</label>
                                  <input 
                                      type="number" 
                                      min="0" 
                                      className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-right font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                      value={closingData[k] || ''} 
                                      onChange={e => setClosingData({...closingData, [k]: Number(e.target.value)})} 
                                      placeholder="0" 
                                  />
                                  <span className="w-28 text-right font-mono font-bold text-slate-500">${(Number(closingData[k] || 0) * denom).toLocaleString()}</span>
                              </div>
                            );
                        })}
                        
                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-2">
                            <label className="w-24 text-sm font-bold text-slate-700">Monedas</label>
                            <input 
                              type="number" 
                              min="0" 
                              className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-right font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                              value={closingData.coins || ''} 
                              onChange={e => setClosingData({...closingData, coins: Number(e.target.value)})} 
                              placeholder="0.00" 
                            />
                            <span className="w-28 text-right font-mono font-bold text-slate-500">${Number(closingData.coins || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Shift Summary & Close Action */}
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Turno Activo #{activeCashShift.id}</span>
                                <h3 className="font-bold text-xl text-slate-800 mt-1">{activeCashShift.userName}</h3>
                            </div>
                            <div className="text-right text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {new Date(activeCashShift.openedAt).toLocaleTimeString()}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-4 text-blue-900 text-sm">
                                <h4 className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4"/> Modo de Cuadre Ciego</h4>
                                <p>Por seguridad, el sistema espera a que cuentes físicamente el dinero en caja antes de revelar el balance teórico. El cálculo de faltantes/sobrantes se registrará al cerrar el turno.</p>
                                <button 
                                  onClick={() => setShowSystemSummary(!showSystemSummary)} 
                                  className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  {showSystemSummary ? <><EyeOff className="w-3 h-3"/> Ocultar Balance Teórico</> : <><Eye className="w-3 h-3"/> Ver Balance Teórico (Solo Admin)</>}
                                </button>
                            </div>

                            {showSystemSummary && (
                                <div className="space-y-2 mb-4 animate-fade-in p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Monto Base Inicial</span>
                                        <span className="font-mono font-bold text-slate-700">RD$ {shiftSummary.initialAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-700 font-medium">(+) Cobros en Efectivo</span>
                                        <span className="font-mono font-bold text-emerald-800">+RD$ {shiftSummary.cashCollected.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-rose-700 font-medium">(-) Egresos en Efectivo</span>
                                        <span className="font-mono font-bold text-rose-800">-RD$ {shiftSummary.cashExpenses.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-sm font-bold text-indigo-900">Total Esperado</span>
                                        <span className="font-bold text-lg text-indigo-700 font-mono">RD$ {shiftSummary.expectedAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="flex items-center gap-2 font-bold text-sm text-slate-700">
                                            {shiftDifference === 0 ? 'Cuadre Perfecto' : shiftDifference > 0 ? 'Sobrante en Caja' : 'Faltante en Caja'}
                                        </span>
                                        <span className={`font-bold text-lg font-mono ${shiftDifference === 0 ? 'text-emerald-600' : shiftDifference > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                            {shiftDifference > 0 ? '+' : ''}RD$ {shiftDifference.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-2xl border border-indigo-200 shadow-sm">
                                <span className="text-sm font-bold text-indigo-900 flex flex-col">
                                    Total Físico Contado
                                    <span className="text-[10px] font-normal text-indigo-600 uppercase tracking-wider mt-0.5">Monto final a reportar</span>
                                </span>
                                <span className="font-bold text-3xl text-indigo-700 font-mono">RD$ {countedTotal.toLocaleString()}</span>
                            </div>
                            
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Notas / Justificación de Cierre</label>
                                <textarea 
                                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                  rows={2}
                                  placeholder="Escribe observaciones sobre el cuadre de caja..."
                                  value={closingData.notes}
                                  onChange={e => setClosingData({...closingData, notes: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <button 
                      onClick={handleCloseShiftSubmit}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-xl shadow-slate-200 mt-6 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <StopCircle className="w-5 h-5 text-rose-400" /> CERRAR TURNO Y GUARDAR CAJA
                    </button>
                </div>
            </div>
        )
      )}

      {activeTab === 'expense' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                  <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg shadow-rose-200">
                      <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="font-bold text-xl text-slate-800">Registrar Gasto Operativo</h3>
                      <p className="text-sm text-slate-500">Agrega pagos de nómina, servicios o mantenimiento.</p>
                  </div>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Categoría</label>
                          <CustomSelect 
                              value={expenseCategory}
                              onChange={e => setExpenseCategory(e as any)}
                              className="w-full font-bold"
                              options={[
                                  { value: 'Operativo', label: 'Gasto Operativo' },
                                  { value: 'Nómina', label: 'Nómina / Pago a Empleado' },
                                  { value: 'Servicios', label: 'Luz / Internet / Teléfono' },
                                  { value: 'Combustible', label: 'Combustible / Transporte' },
                                  { value: 'Papelería', label: 'Papelería y Oficina' },
                                  { value: 'Mantenimiento', label: 'Mantenimiento local' },
                                  { value: 'Otros', label: 'Otros Gastos' }
                              ]}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Método de Pago</label>
                          <CustomSelect 
                              value={expenseMethod}
                              onChange={e => setExpenseMethod(e as PaymentMethod)}
                              className="w-full font-bold"
                              options={[
                                  { value: 'Efectivo', label: 'Efectivo de Caja' },
                                  { value: 'Transferencia', label: 'Transferencia Bancaria' },
                                  { value: 'Cheque', label: 'Cheque' }
                              ]}
                          />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Monto del Gasto (RD$)</label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                          <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              required
                              value={expenseAmount}
                              onChange={e => setExpenseAmount(e.target.value)}
                              className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 rounded-xl font-mono font-bold text-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="0.00"
                          />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Descripción (Obligatoria)</label>
                      <textarea 
                          rows={2}
                          required
                          value={expenseDescription}
                          onChange={e => setExpenseDescription(e.target.value)}
                          placeholder="Ej: Pago de quincena a cobrador Juan..."
                          className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>

                  <button 
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                      <Save className="w-5 h-5" /> GUARDAR GASTO
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};

export default Accounting;
