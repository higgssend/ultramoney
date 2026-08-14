import React, { useState, useMemo } from 'react';
import { 
  Download, TrendingUp, TrendingDown, DollarSign, Lock, Calculator, 
  AlertTriangle, Save, Wallet, ChevronLeft, Play, StopCircle, Clock, 
  PlusCircle, Eye, EyeOff, Scale, PieChart, FileText, CheckCircle2, 
  RefreshCw, Landmark, Filter, ArrowUpRight, ArrowDownRight, User,
  Edit3, Printer
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useAccounting, useLoans, useClients, useSettings } from '../context/StoreContext';
import StatCard from '../components/StatCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { PaymentMethod, Transaction, formatReceiptId } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { CashCounterModal } from '../components/CashCounterModal';
import { EditPaymentModal } from '../components/EditPaymentModal';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { formatExactDateTime } from '../utils/dateUtils';
import { toast } from 'sonner';

interface AccountingProps {
  initialTab?: 'overview' | 'shift' | 'expenses' | 'history';
}

export const Accounting: React.FC<AccountingProps> = ({ initialTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab from prop or URL pathname
  const defaultTab = initialTab || (location.pathname === '/gastos' ? 'expenses' : 'overview');
  const [activeTab, setActiveTab] = useState<'overview' | 'shift' | 'expenses' | 'history'>(defaultTab);
  
  const { 
    transactions, bankAccounts, getFinancialStats, activeCashShift, openCashShift, 
    closeCashShift, getCashShiftSummary, addTransaction, processBankDisbursement 
  } = useAccounting();
  const { loans } = useLoans();
  const { addAuditLog } = useSettings();

  const stats = getFinancialStats();
  const shiftSummary = getCashShiftSummary();
  const [isCashCounterOpen, setIsCashCounterOpen] = useState(false);
  const [selectedTransactionToEdit, setSelectedTransactionToEdit] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Financial Totals
  const totalIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'Gasto').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  // Chart Data for Cash Flow
  const chartData = useMemo(() => {
    const daysMap: { [key: string]: { name: string; Ingresos: number; Gastos: number } } = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const name = d.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' });
      daysMap[key] = { name, Ingresos: 0, Gastos: 0 };
    }
    transactions.forEach(t => {
      const key = (t.date || '').split('T')[0];
      if (daysMap[key]) {
        if (t.type === 'Ingreso') daysMap[key].Ingresos += Number(t.amount || 0);
        else daysMap[key].Gastos += Number(t.amount || 0);
      }
    });
    return Object.values(daysMap);
  }, [transactions]);

  // Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<'Combustible' | 'Papelería' | 'Nómina' | 'Operativo' | 'Servicios' | 'Mantenimiento' | 'Otros'>('Operativo');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('Efectivo');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');

  // Open Shift Form State
  const [initialCashAmount, setInitialCashAmount] = useState('5000');
  const [openShiftNotes, setOpenShiftNotes] = useState('');

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

  // History Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'Ingreso' | 'Gasto'>('ALL');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('ALL');

  // Billete Total Count
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
  const expectedCashInShift = shiftSummary ? shiftSummary.expectedAmount : stats.balance;
  const shiftDifference = countedTotal - expectedCashInShift;

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(initialCashAmount);
    if (isNaN(amount) || amount < 0) return;
    openCashShift(amount, openShiftNotes);
    addAuditLog('cash_shift_opened', `Abrió turno de caja con RD$ ${amount}`);
    toast.success("Turno de caja abierto exitosamente");
  };

  const handleCloseShiftSubmit = () => {
    closeCashShift(countedTotal, closingData.notes);
    addAuditLog('cash_shift_closed', `Cerró turno de caja con conteo de RD$ ${countedTotal}`);
    setClosingData({ twoThousands: 0, thousands: 0, fiveHundreds: 0, twoHundreds: 0, hundreds: 0, fifties: 0, coins: 0, notes: '' });
    toast.success("Turno de caja cerrado exitosamente");
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    await addTransaction({
      date: new Date().toISOString(),
      type: 'Gasto',
      category: (expenseCategory === 'Otros' ? 'Otro' : expenseCategory) as Transaction['category'],
      description: expenseDescription || `Gasto de ${expenseCategory}`,
      amount: amount,
      paymentMethod: selectedBankAccountId ? 'Transferencia' : expenseMethod,
      bankAccountId: selectedBankAccountId || undefined,
    });

    if (selectedBankAccountId) {
      processBankDisbursement(selectedBankAccountId, amount);
    }
    
    addAuditLog('expense_registered', `Registró gasto por RD$ ${amount} (${expenseCategory})`);
    toast.success("Gasto registrado exitosamente en caja");
    setExpenseAmount('');
    setExpenseDescription('');
    setSelectedBankAccountId('');
  };

  // Filtered transactions for History Tab
  const filteredTransactions = transactions.filter(t => {
    if (selectedTypeFilter !== 'ALL' && t.type !== selectedTypeFilter) return false;
    if (selectedMethodFilter !== 'ALL' && t.paymentMethod !== selectedMethodFilter) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      return desc.includes(term) || cat.includes(term);
    }
    return true;
  });

  const expenseTransactions = transactions.filter(t => t.type === 'Gasto');

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-indigo-600" />
                Gestión de Caja & Gastos
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeCashShift 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}>
                {activeCashShift ? 'Turno Abierto' : 'Turno Cerrado'}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Control diario de tesorería, arqueos de efectivo, aperturas/cierres de turno y registro de gastos.
            </p>
          </div>
        </div>

        {/* Action Tabs & Quick Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-x-auto text-xs font-bold">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" /> Flujo de Caja
            </button>
            <button 
              onClick={() => setActiveTab('shift')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'shift' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Arqueo y Turnos
            </button>
            <button 
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Control de Gastos
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Movimientos
            </button>
          </div>

          <button 
            onClick={() => setIsCashCounterOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5" />
            Contador de Billetes
          </button>
        </div>
      </div>

      {/* 4 Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo en Caja de Efectivo"
          value={`RD$ ${stats.balance.toLocaleString()}`}
          trend="Disponible en Caja"
          trendUp={true}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          glowColor="shadow-emerald-500/20"
        />
        <StatCard
          title="Recaudaciones Totales"
          value={`RD$ ${totalIncome.toLocaleString()}`}
          trend="Ingresos Registrados"
          trendUp={true}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
          glowColor="shadow-indigo-500/20"
        />
        <StatCard
          title="Gastos Operativos"
          value={`RD$ ${totalExpenses.toLocaleString()}`}
          trend="Salidas de Caja"
          trendUp={false}
          icon={TrendingDown}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          glowColor="shadow-rose-500/20"
        />
        <StatCard
          title="Turno de Caja"
          value={activeCashShift ? `RD$ ${(shiftSummary?.expectedAmount || 0).toLocaleString()}` : 'Cerrado'}
          trend={activeCashShift ? 'Efectivo en Turno' : 'Sin turno activo'}
          trendUp={!!activeCashShift}
          icon={Lock}
          gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
          glowColor="shadow-blue-500/20"
        />
      </div>

      {/* ─── TAB 1: FLUJO DE CAJA (OVERVIEW) ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Flujo de Entradas vs Salidas</h3>
                  <p className="text-xs text-slate-400">Comparativa de ingresos recaudados y egresos registrados en caja.</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => [`RD$ ${value.toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Expense Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">Registrar Gasto Rápido</h3>
                <p className="text-xs text-slate-400 mb-4">Salida directa de caja chica para pagos operativos menores.</p>

                <form onSubmit={handleExpenseSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Categoría</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                    >
                      <option value="Operativo">Operativo / Varios</option>
                      <option value="Combustible">Combustible</option>
                      <option value="Papelería">Papelería y Suministros</option>
                      <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                      <option value="Nómina">Nómina / Comisiones</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Monto (RD$)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Concepto</label>
                    <input
                      type="text"
                      placeholder="Ej: Pago de gasolina ruta norte"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Registrar Salida de Caja
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Total Gastos Registrados:</span>
                <span className="font-bold text-slate-800 dark:text-white">RD$ {totalExpenses.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Recent Cash Transactions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Últimos Movimientos de Caja</h3>
                <p className="text-xs text-slate-400">Entradas y salidas registradas en el libro de caja.</p>
              </div>
              <button 
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Ver todos los movimientos
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Fecha / Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Medio de Pago</th>
                    <th className="p-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {transactions.slice(0, 8).map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {t.date ? new Date(t.date).toLocaleDateString('es-DO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit ${
                          t.type === 'Ingreso' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {t.type === 'Ingreso' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-white">{t.description}</td>
                      <td className="p-3 text-slate-500">{t.paymentMethod || 'Efectivo'}</td>
                      <td className={`p-3 text-right font-black font-mono ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'Ingreso' ? '+' : '-'} RD$ {Number(t.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 2: ARQUEO Y CIERRE DE TURNO (SHIFT) ─── */}
      {activeTab === 'shift' && (
        <div className="space-y-6">
          
          {!activeCashShift ? (
            /* Open Shift Box */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-8 max-w-xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Abrir Nuevo Turno de Caja</h3>
                <p className="text-xs text-slate-500 mt-1">Ingrese el fondo inicial de caja para habilitar operaciones de cobro y desembolso.</p>
              </div>

              <form onSubmit={handleOpenShiftSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Monto Base Inicial (RD$)</label>
                  <input
                    type="number"
                    value={initialCashAmount}
                    onChange={(e) => setInitialCashAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Notas de Apertura (Opcional)</label>
                  <input
                    type="text"
                    value={openShiftNotes}
                    onChange={(e) => setOpenShiftNotes(e.target.value)}
                    placeholder="Turno matutino cajero 1"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Abrir Turno de Caja
                </button>
              </form>
            </div>
          ) : (
            /* Active Shift Management & Billete Closing */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Summary of Active Shift */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Turno en Curso</h3>
                    <p className="text-xs text-slate-400">Abierto el {new Date(activeCashShift.openedAt).toLocaleTimeString('es-DO')}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Activo
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-500">Monto Inicial Apertura:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">RD$ {Number(activeCashShift.initialAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-500">Cobros en Efectivo:</span>
                    <span className="font-bold font-mono text-emerald-600">+ RD$ {(shiftSummary?.cashCollected || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-500">Gastos en Efectivo:</span>
                    <span className="font-bold font-mono text-rose-600">- RD$ {(shiftSummary?.cashExpenses || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 font-bold">
                    <span className="text-indigo-900 dark:text-indigo-200">Efectivo Esperado:</span>
                    <span className="font-mono text-base text-indigo-700 dark:text-indigo-300">RD$ {expectedCashInShift.toLocaleString()}</span>
                  </div>
                </div>

                {/* Status Box */}
                <div className={`p-4 rounded-2xl border text-xs ${
                  shiftDifference === 0 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300' 
                    : shiftDifference > 0 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 text-blue-800 dark:text-blue-300' 
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
                }`}>
                  <div className="font-bold uppercase tracking-wider text-[10px] mb-1">Resultado del Arqueo</div>
                  <div className="text-sm font-black">
                    {shiftDifference === 0 ? 'Caja Cuadrada Perfecta' : shiftDifference > 0 ? `Sobrante: +RD$ ${shiftDifference.toLocaleString()}` : `Faltante: -RD$ ${Math.abs(shiftDifference).toLocaleString()}`}
                  </div>
                </div>
              </div>

              {/* Billete Counter / Physical Count Form */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Arqueo Físico de Billetes y Monedas</h3>
                    <p className="text-xs text-slate-400">Contabilice la cantidad de billetes en gaveta para cuadrar el cierre.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Contado</span>
                    <span className="text-lg font-black font-mono text-emerald-600">RD$ {countedTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'RD$ 2,000', key: 'twoThousands', val: 2000 },
                    { label: 'RD$ 1,000', key: 'thousands', val: 1000 },
                    { label: 'RD$ 500', key: 'fiveHundreds', val: 500 },
                    { label: 'RD$ 200', key: 'twoHundreds', val: 200 },
                    { label: 'RD$ 100', key: 'hundreds', val: 100 },
                    { label: 'RD$ 50', key: 'fifties', val: 50 },
                  ].map((denom) => (
                    <div key={denom.key} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300 mb-1">
                        <span>{denom.label}</span>
                        <span className="font-mono text-slate-400">x {(closingData as any)[denom.key]}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={(closingData as any)[denom.key] || ''}
                        onChange={(e) => setClosingData({ ...closingData, [denom.key]: Number(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Monedas Sueltas (RD$ Total)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={closingData.coins || ''}
                      onChange={(e) => setClosingData({ ...closingData, coins: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Observaciones del Cierre</label>
                    <input
                      type="text"
                      placeholder="Todo cuadrado sin novedades"
                      value={closingData.notes}
                      onChange={(e) => setClosingData({ ...closingData, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCloseShiftSubmit}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <StopCircle className="w-4 h-4" />
                  Confirmar y Cerrar Turno de Caja
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ─── TAB 3: CONTROL DE GASTOS (EXPENSES) ─── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Expense Form */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Registrar Nuevo Gasto</h3>
                <p className="text-xs text-slate-400">Contabilice compras operativas, nóminas o pagos de servicios.</p>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Categoría del Gasto</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  >
                    <option value="Combustible">Combustible</option>
                    <option value="Papelería">Papelería y Útiles</option>
                    <option value="Nómina">Nómina y Comisiones</option>
                    <option value="Operativo">Operativo General</option>
                    <option value="Servicios">Servicios Públicos (Luz / Agua / Internet)</option>
                    <option value="Mantenimiento">Mantenimiento de Vehículos / Oficina</option>
                    <option value="Otros">Otros Egresos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Monto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Origen del Pago</label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  >
                    <option value="">Caja Chica (Efectivo)</option>
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountNumber} (Disp: RD$ {Number(acc.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Descripción / Proveedor</label>
                  <textarea
                    rows={2}
                    placeholder="Detalle del gasto o nombre del suplidor..."
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar y Descontar Gasto
                </button>
              </form>
            </div>

            {/* Expenses History Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Historial de Gastos Registrados</h3>
                  <p className="text-xs text-slate-400">{expenseTransactions.length} registros de egresos</p>
                </div>
                <span className="text-sm font-black font-mono text-rose-600">
                  Total: RD$ {totalExpenses.toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3">Medio</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {expenseTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">
                          No hay gastos registrados en el sistema.
                        </td>
                      </tr>
                    ) : (
                      expenseTransactions.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono text-slate-500 text-[11px]">
                            {t.date ? new Date(t.date).toLocaleDateString('es-DO') : '-'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              {t.category || 'Operativo'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-white">{t.description}</td>
                          <td className="p-3 text-slate-500">{t.paymentMethod}</td>
                          <td className="p-3 text-right font-black font-mono text-rose-600">
                            RD$ {Number(t.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 4: HISTORIAL DE MOVIMIENTOS (HISTORY) ─── */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Libro Cronológico de Movimientos de Caja</h3>
              <p className="text-xs text-slate-400">Registro histórico completo de cobros, desembolsos y egresos.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <input
                type="text"
                placeholder="Buscar por concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="Ingreso">Ingresos (+)</option>
                <option value="Gasto">Gastos (-)</option>
              </select>
              <DataExportToolbar
                data={filteredTransactions}
                filename="movimientos_caja"
                title="Movimientos de Caja General"
                columns={[
                  { header: 'ID', key: 'id' },
                  { header: 'Fecha', key: 'date' },
                  { header: 'Tipo', key: 'type' },
                  { header: 'Categoría', key: 'category' },
                  { header: 'Descripción', key: 'description' },
                  { header: 'Método', key: 'paymentMethod' },
                  { header: 'Monto', key: 'amount', format: (v) => `RD$ ${Number(v || 0).toLocaleString()}` }
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Fecha / Hora</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3">Medio de Pago</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredTransactions.map((t, idx) => (
                  <tr 
                    key={t.id || idx} 
                    className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (t.type === 'Ingreso' && t.id) {
                        navigate(`/recibo/${t.id}`);
                      }
                    }}
                    title={t.type === 'Ingreso' ? 'Haga clic para ver el recibo oficial digital de este pago' : ''}
                  >
                    <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {formatExactDateTime(t.date)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit ${
                        t.type === 'Ingreso' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{t.category || '-'}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.description}</span>
                        {t.type === 'Ingreso' && t.id && (
                          <span className="font-mono text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900 shrink-0">
                            {formatReceiptId(t.id)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{t.paymentMethod || 'Efectivo'}</td>
                    <td className={`p-3 text-right font-black font-mono whitespace-nowrap ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'Ingreso' ? '+' : '-'} RD$ {Number(t.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {t.type === 'Ingreso' && t.id && (
                          <button
                            onClick={() => navigate(`/recibo/${t.id}`)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                            title="Ver Recibo Oficial Digital"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTransactionToEdit(t);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
                          title="Editar Transacción / Pago"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Cash Counter Modal */}
      <CashCounterModal
        isOpen={isCashCounterOpen}
        onClose={() => setIsCashCounterOpen(false)}
        systemBalance={activeCashShift ? (shiftSummary?.expectedAmount || 0) : stats.balance}
        cashBoxName="Caja General"
      />

      {/* Edit Payment / Transaction Modal */}
      <EditPaymentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTransactionToEdit(null);
        }}
        transaction={selectedTransactionToEdit}
      />

    </div>
  );
};

export default Accounting;
