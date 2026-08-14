import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Lock, Calculator, AlertTriangle, Save, Wallet, ChevronLeft, Play, StopCircle, Clock, PlusCircle, Eye, EyeOff, BookOpen, Scale, PieChart, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useAccounting, useLoans, useClients, useSettings } from '../context/StoreContext';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';
import { PaymentMethod } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { CashCounterModal } from '../components/CashCounterModal';
import { toast } from 'sonner';

// Chart of Accounts Structure
interface Account {
  code: string;
  name: string;
  type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto';
  category: string;
  balance: number;
}

const defaultChartOfAccounts: Account[] = [
  { code: '1100', name: 'Caja General & Efectivo', type: 'Activo', category: 'Activo Circulante', balance: 0 },
  { code: '1110', name: 'Bancos & Cuentas Corrientes', type: 'Activo', category: 'Activo Circulante', balance: 0 },
  { code: '1200', name: 'Cartera de Préstamos por Cobrar', type: 'Activo', category: 'Activo Financiero', balance: 0 },
  { code: '1210', name: 'Intereses por Cobrar Acumulados', type: 'Activo', category: 'Activo Financiero', balance: 0 },
  { code: '2100', name: 'Cuentas por Pagar Inversionistas', type: 'Pasivo', category: 'Pasivo Corriente', balance: 0 },
  { code: '2200', name: 'Impuestos & Retenciones por Pagar', type: 'Pasivo', category: 'Pasivo Corriente', balance: 0 },
  { code: '3100', name: 'Capital Social Aportado', type: 'Patrimonio', category: 'Patrimonio Neto', balance: 0 },
  { code: '3200', name: 'Utilidades Retenidas / Acumuladas', type: 'Patrimonio', category: 'Patrimonio Neto', balance: 0 },
  { code: '4100', name: 'Ingresos por Intereses Financieros', type: 'Ingreso', category: 'Ingresos Operativos', balance: 0 },
  { code: '4200', name: 'Ingresos por Moras y Recargos', type: 'Ingreso', category: 'Ingresos Operativos', balance: 0 },
  { code: '4300', name: 'Ingresos por Gastos de Cierre & Legal', type: 'Ingreso', category: 'Ingresos Operativos', balance: 0 },
  { code: '5100', name: 'Gastos de Nómina y Comisiones', type: 'Gasto', category: 'Gastos Operativos', balance: 0 },
  { code: '5200', name: 'Gastos Operativos y Papelería', type: 'Gasto', category: 'Gastos Operativos', balance: 0 },
  { code: '5300', name: 'Condonaciones & Pérdidas Morosas', type: 'Gasto', category: 'Gastos Financieros', balance: 0 }
];

const Accounting: React.FC = () => {
  const { 
    transactions, bankAccounts, getFinancialStats, activeCashShift, openCashShift, 
    closeCashShift, getCashShiftSummary, addTransaction, processBankDisbursement 
  } = useAccounting();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { addAuditLog } = useSettings();
  const navigate = useNavigate();
  
  const stats = getFinancialStats();
  const shiftSummary = getCashShiftSummary();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'shift' | 'chart' | 'journal' | 'trial' | 'financials'>('overview');
  const [isCashCounterOpen, setIsCashCounterOpen] = useState(false);

  // Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<'Combustible' | 'Papelería' | 'Nómina' | 'Operativo' | 'Servicios' | 'Mantenimiento' | 'Otros'>('Operativo');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('Efectivo');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');

  // Manual Journal Entry Form State
  const [manualDebitCode, setManualDebitCode] = useState('1100');
  const [manualCreditCode, setManualCreditCode] = useState('4100');
  const [manualEntryAmount, setManualEntryAmount] = useState('');
  const [manualEntryConcept, setManualEntryConcept] = useState('');

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

  // Calculate live portfolio balance from loans
  const totalPortfolioValue = loans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  
  // Calculate total income and expenses
  const totalIncome = transactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'Gasto').reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

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

  // Dynamic Chart of Accounts balances calculation
  const accounts: Account[] = defaultChartOfAccounts.map(acc => {
    let bal = 0;
    if (acc.code === '1100') bal = stats.balance; // Cash balance
    else if (acc.code === '1200') bal = totalPortfolioValue; // Loans portfolio
    else if (acc.code === '4100') bal = transactions.filter(t => t.type === 'Ingreso' && t.category === 'Pago Préstamo').reduce((sum, t) => sum + Number(t.amount), 0);
    else if (acc.code === '4200') bal = transactions.filter(t => t.type === 'Ingreso' && (t.description || '').toLowerCase().includes('mora')).reduce((sum, t) => sum + Number(t.amount), 0);
    else if (acc.code === '4300') bal = loans.reduce((sum, l) => sum + (Number(l.closingCost) || 0), 0);
    else if (acc.code === '5100') bal = transactions.filter(t => t.type === 'Gasto' && t.category === 'Nómina').reduce((sum, t) => sum + Number(t.amount), 0);
    else if (acc.code === '5200') bal = transactions.filter(t => t.type === 'Gasto' && t.category !== 'Nómina').reduce((sum, t) => sum + Number(t.amount), 0);
    else if (acc.code === '3100') bal = 500000; // Initial Equity
    else if (acc.code === '3200') bal = netProfit;
    return { ...acc, balance: Math.max(0, bal) };
  });

  // Double Entry Journal Entries generated from Transactions
  const journalEntries = transactions.map((t, idx) => {
    const isIncome = t.type === 'Ingreso';
    const amount = Number(t.amount);
    return {
      id: `ASIENTO-${String(idx + 1001)}`,
      date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0],
      concept: t.description || (isIncome ? 'Ingreso registrado en caja' : 'Gasto operativo'),
      debitAccount: isIncome ? '1100 - Caja General & Efectivo' : '5200 - Gastos Operativos',
      creditAccount: isIncome ? '4100 - Ingresos por Intereses' : '1100 - Caja General & Efectivo',
      debitAmount: amount,
      creditAmount: amount,
      status: 'Cuadrado'
    };
  });

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
      category: expenseCategory,
      description: expenseDescription || `Gasto de ${expenseCategory}`,
      amount: amount,
      paymentMethod: selectedBankAccountId ? 'Transferencia' : expenseMethod,
      bank_account_id: selectedBankAccountId || undefined,
      lender_id: ''
    });

    if (selectedBankAccountId) {
      processBankDisbursement(selectedBankAccountId, amount);
    }
    
    addAuditLog('expense_registered', `Registró gasto por RD$ ${amount} (${expenseCategory})`);
    toast.success("Gasto registrado y contabilizado");
    setExpenseAmount('');
    setExpenseDescription('');
    setSelectedBankAccountId('');
    setActiveTab('overview');
  };

  const handleManualJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(manualEntryAmount);
    if (isNaN(amount) || amount <= 0) return;

    addTransaction({
      date: new Date().toISOString(),
      type: 'Gasto',
      category: 'Otros',
      description: `[Asiento Manual] ${manualEntryConcept} (Débito: ${manualDebitCode} / Crédito: ${manualCreditCode})`,
      amount: amount,
      paymentMethod: 'Efectivo',
      lender_id: ''
    });

    addAuditLog('journal_entry_created', `Creó asiento contable manual por RD$ ${amount}`);
    toast.success("Asiento contable en partida doble registrado");
    setManualEntryAmount('');
    setManualEntryConcept('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Contabilidad Profunda 2.0
            </h2>
            <p className="text-slate-500 text-sm">Partida doble, catálogo de cuentas, libro diario, balances y arqueo de caja.</p>
          </div>
        </div>

        {/* Accounting Module Navigation Tabs & Quick Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setIsCashCounterOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all border border-emerald-500"
            title="Abrir calculadora rápida de billetes (Opcional - sin necesidad de abrir turno)"
          >
            <Calculator className="w-4 h-4" /> Cuadre Rápido
          </button>

          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto text-xs font-bold">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <PieChart className="w-4 h-4" /> Resumen & Caja
            </button>
            <button 
              onClick={() => setActiveTab('shift')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'shift' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <Wallet className="w-4 h-4" /> {activeCashShift ? 'Arqueo de Turno' : 'Apertura de Caja'}
            </button>
            <button 
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'chart' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <BookOpen className="w-4 h-4" /> Catálogo de Cuentas
            </button>
            <button 
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'journal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <FileText className="w-4 h-4" /> Libro Diario
            </button>
            <button 
              onClick={() => setActiveTab('trial')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'trial' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <Scale className="w-4 h-4" /> Balanza Comprobación
            </button>
            <button 
              onClick={() => setActiveTab('financials')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'financials' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <TrendingUp className="w-4 h-4" /> Estado de Resultados (P&L)
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: EXECUTIVE OVERVIEW & CASH SHIFT ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Shift Banner */}
          <div className={`p-5 rounded-2xl border flex flex-wrap justify-between items-center gap-4 ${activeCashShift ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${activeCashShift ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider">{activeCashShift ? 'Turno de Caja Abierto' : 'No Hay Turno de Caja Abierto'}</span>
                <h4 className="font-bold text-base">
                  {activeCashShift ? `Cajero: ${activeCashShift.userName} | Apertura: ${new Date(activeCashShift.openedAt).toLocaleTimeString()}` : 'Abre turno para empezar a registrar cobros presenciales con arqueo'}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('shift')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${activeCashShift ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-amber-700 hover:bg-amber-800 text-white'}`}
            >
              {activeCashShift ? 'Realizar Arqueo / Cierre' : 'Abrir Caja Ahora'}
            </button>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Balance en Caja General"
              value={`RD$ ${stats.balance.toLocaleString()}`}
              trend="Fondo disponible"
              trendUp={true}
              icon={Wallet}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
              glowColor="shadow-emerald-500/20"
            />
            <StatCard
              title="Cartera Activa por Cobrar"
              value={`RD$ ${totalPortfolioValue.toLocaleString()}`}
              trend="Activo Financiero"
              trendUp={true}
              icon={DollarSign}
              gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
              glowColor="shadow-indigo-500/20"
            />
            <StatCard
              title="Ingresos Totales"
              value={`RD$ ${totalIncome.toLocaleString()}`}
              trend="Intereses + Cierres"
              trendUp={true}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
              glowColor="shadow-blue-500/20"
            />
            <StatCard
              title="Utilidad Neta (Ganancia)"
              value={`RD$ ${netProfit.toLocaleString()}`}
              trend="Ingresos - Gastos"
              trendUp={netProfit >= 0}
              icon={Calculator}
              gradient="bg-gradient-to-br from-amber-500 to-rose-600"
              glowColor="shadow-amber-500/20"
            />
          </div>

          {/* Quick Expense Form & Recent Movements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Quick Expense Entry */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                Registrar Gasto u Operación
              </h3>
              
              <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría del Gasto</label>
                  <CustomSelect
                    value={expenseCategory}
                    onChange={(val: string) => setExpenseCategory(val)}
                    options={[
                      { value: 'Operativo', label: 'Operativo / General' },
                      { value: 'Nómina', label: 'Nómina & Comisiones' },
                      { value: 'Combustible', label: 'Combustible & Cobranza' },
                      { value: 'Papelería', label: 'Papelería e Impresiones' },
                      { value: 'Servicios', label: 'Servicios Básicos' },
                      { value: 'Mantenimiento', label: 'Mantenimiento' },
                      { value: 'Otros', label: 'Otros Gastos' }
                    ]}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto del Gasto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount === '0' || expenseAmount === '0.00' ? '' : expenseAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={e => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Descripción / Concepto</label>
                  <input
                    type="text"
                    value={expenseDescription}
                    onChange={e => setExpenseDescription(e.target.value)}
                    placeholder="Ej. Pago de combustible cobrador ruta 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cuenta o Método Pagador (Opcional)</label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="">-- Sin cuenta específica (Caja General) --</option>
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountName || acc.holderName} (RD$ {(acc.balance || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  Registrar & Contabilizar Gasto
                </button>
              </form>
            </div>

            {/* Transactions List */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-base">Últimos Movimientos Contables</h3>
                  <span className="text-xs text-slate-400 font-bold">{transactions.length} registros</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {transactions.slice(0, 8).map(t => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg">
                      <div>
                        <p className="font-bold text-slate-800">{t.description}</p>
                        <p className="text-[10px] text-slate-400">{t.date ? t.date.split('T')[0] : ''} · {t.paymentMethod || 'Efectivo'}</p>
                      </div>
                      <span className={`font-black text-sm ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'Ingreso' ? '+' : '-'}RD$ {Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 2: CASH SHIFT & ARQUEO DE BILLETES ─── */}
      {activeTab === 'shift' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {!activeCashShift ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Apertura de Turno de Caja</h3>
                  <p className="text-xs text-slate-500">Ingresa el fondo inicial en efectivo para iniciar la jornada.</p>
                </div>
              </div>

              <form onSubmit={handleOpenShiftSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto Inicial en Caja (RD$)</label>
                  <input
                    type="number"
                    value={initialCashAmount}
                    onChange={e => setInitialCashAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl font-black text-xl text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Observaciones de Apertura</label>
                  <textarea
                    value={openShiftNotes}
                    onChange={e => setOpenShiftNotes(e.target.value)}
                    placeholder="Ej. Caja chica entregada por gerencia sin novedades"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-sm">
                  Abrir Turno de Caja
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    TURNO ACTIVO
                  </span>
                  <h3 className="text-xl font-black text-slate-800 mt-2">Arqueo y Cierre de Caja</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Esperado en Caja</p>
                  <p className="text-2xl font-black text-indigo-700">RD$ {shiftSummary.expectedAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Billete Counter Grid */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Conteo de Billetes y Monedas</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'RD$ 2,000', key: 'twoThousands', mult: 2000 },
                    { label: 'RD$ 1,000', key: 'thousands', mult: 1000 },
                    { label: 'RD$ 500', key: 'fiveHundreds', mult: 500 },
                    { label: 'RD$ 200', key: 'twoHundreds', mult: 200 },
                    { label: 'RD$ 100', key: 'hundreds', mult: 100 },
                    { label: 'RD$ 50', key: 'fifties', mult: 50 },
                  ].map(b => (
                    <div key={b.key} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="font-bold text-slate-600 block mb-1">{b.label}</label>
                      <input
                        type="number"
                        min="0"
                        value={closingData[b.key as keyof typeof closingData] || 0}
                        onChange={e => setClosingData({ ...closingData, [b.key]: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-1 font-mono">
                        RD$ {((closingData[b.key as keyof typeof closingData] || 0) * b.mult).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-600 block mb-1">Monedas & Menudos (RD$)</label>
                    <input
                      type="number"
                      min="0"
                      value={closingData.coins}
                      onChange={e => setClosingData({ ...closingData, coins: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center text-sm font-bold">
                  <span>Total Contado en Caja:</span>
                  <span className="text-xl font-black text-indigo-700">RD$ {countedTotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleCloseShiftSubmit}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                >
                  Cerrar y Cuadrar Caja
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: CATÁLOGO DE CUENTAS ─── */}
      {activeTab === 'chart' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">Catálogo de Cuentas Contables</h3>
              <p className="text-xs text-slate-500">Estructura oficial de cuentas contables agrupadas por tipo.</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              14 Cuentas Activas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre de la Cuenta</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Clasificación</th>
                  <th className="p-3 text-right">Balance Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts.map(acc => (
                  <tr key={acc.code} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-600">{acc.code}</td>
                    <td className="p-3 font-bold text-slate-800">{acc.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.type === 'Activo' ? 'bg-emerald-100 text-emerald-700' :
                        acc.type === 'Pasivo' ? 'bg-rose-100 text-rose-700' :
                        acc.type === 'Ingreso' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{acc.category}</td>
                    <td className="p-3 text-right font-black text-slate-900">
                      RD$ {acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: LIBRO DIARIO (PARTIDA DOBLE) ─── */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          
          {/* Manual Entry Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Crear Asiento Contable Manual (Partida Doble)
            </h3>

            <form onSubmit={handleManualJournalSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cuenta Débito (Debe)</label>
                <CustomSelect
                  value={manualDebitCode}
                  onChange={(val: string) => setManualDebitCode(val)}
                  options={accounts.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }))}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cuenta Crédito (Haber)</label>
                <CustomSelect
                  value={manualCreditCode}
                  onChange={(val: string) => setManualCreditCode(val)}
                  options={accounts.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }))}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monto (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualEntryAmount}
                  onChange={e => setManualEntryAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Concepto / Glosa</label>
                <input
                  type="text"
                  value={manualEntryConcept}
                  onChange={e => setManualEntryConcept(e.target.value)}
                  placeholder="Ej. Ajuste de caja chica"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-4 pt-2">
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-all">
                  Registrar Asiento Cuadrado
                </button>
              </div>
            </form>
          </div>

          {/* Journal Entries List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-base">Libro Diario General</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <th className="p-3">Asiento #</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Cuenta Débito</th>
                    <th className="p-3">Cuenta Crédito</th>
                    <th className="p-3 text-right">Débito (Debe)</th>
                    <th className="p-3 text-right">Crédito (Haber)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {journalEntries.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-600">{j.id}</td>
                      <td className="p-3 text-slate-500">{j.date}</td>
                      <td className="p-3 font-bold text-slate-800">{j.concept}</td>
                      <td className="p-3 text-emerald-700 font-bold">{j.debitAccount}</td>
                      <td className="p-3 text-indigo-700 font-bold">{j.creditAccount}</td>
                      <td className="p-3 text-right font-black text-slate-900">RD$ {j.debitAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="p-3 text-right font-black text-slate-900">RD$ {j.creditAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 5: BALANZA DE COMPROBACIÓN ─── */}
      {activeTab === 'trial' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" /> Balanza de Comprobación
              </h3>
              <p className="text-xs text-slate-500">Verificación de igualdad entre sumas de Débitos (Debe) y Créditos (Haber).</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Partida Doble Cuadrada
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre de la Cuenta</th>
                  <th className="p-3 text-right">Débitos (Debe)</th>
                  <th className="p-3 text-right">Créditos (Haber)</th>
                  <th className="p-3 text-right">Saldo Deudor / Acreedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts.map(acc => {
                  const isDeb = acc.type === 'Activo' || acc.type === 'Gasto';
                  return (
                    <tr key={acc.code} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-600">{acc.code}</td>
                      <td className="p-3 font-bold text-slate-800">{acc.name}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {isDeb ? `RD$ ${acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'RD$ 0.00'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600">
                        {!isDeb ? `RD$ ${acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'RD$ 0.00'}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        RD$ {acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: ESTADO DE RESULTADOS (P&L) & BALANCE GENERAL ─── */}
      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Income Statement (P&L) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-lg border-b border-slate-100 pb-3">
              Estado de Resultados (Ganancias & Pérdidas)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-bold flex justify-between text-emerald-900">
                <span>(+) Ingresos por Intereses Financieros:</span>
                <span>RD$ {totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 font-bold flex justify-between text-rose-900">
                <span>(-) Gastos Operativos Totales:</span>
                <span>RD$ {totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-slate-900 text-white p-4 rounded-xl font-black text-sm flex justify-between">
                <span>(=) UTILIDAD NETA DEL PERIODO:</span>
                <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  RD$ {netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-lg border-b border-slate-100 pb-3">
              Balance General (Situación Financiera)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 font-bold flex justify-between text-indigo-900">
                <span>Activos Totales (Caja + Cartera):</span>
                <span>RD$ {(stats.balance + totalPortfolioValue).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold flex justify-between text-slate-700">
                <span>Pasivos Totales:</span>
                <span>RD$ 0.00</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 font-bold flex justify-between text-purple-900">
                <span>Patrimonio Neto (Capital + Utilidad):</span>
                <span>RD$ {(500000 + netProfit).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Optional Cash Bill Counter Modal */}
      <CashCounterModal 
        isOpen={isCashCounterOpen}
        onClose={() => setIsCashCounterOpen(false)}
        systemBalance={stats.balance}
        cashBoxName="Caja General"
      />

    </div>
  );
};

export default Accounting;
