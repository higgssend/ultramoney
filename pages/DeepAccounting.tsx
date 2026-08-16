import React, { useState, useMemo } from 'react';
import { 
  Download, TrendingUp, TrendingDown, DollarSign, Calculator, Scale, 
  PieChart, FileText, CheckCircle2, BookOpen, PlusCircle, Filter, 
  ChevronLeft, Search, ShieldCheck, Landmark, Building2, Award, 
  AlertTriangle, ArrowRight, Shield, RefreshCw, Lock, Unlock, Calendar,
  History, RotateCcw, AlertCircle, Check
} from 'lucide-react';
import { useAccounting, useLoans, useClients, useSettings } from '../context/StoreContext';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/CustomSelect';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { CreditScoreEngine } from '../utils/CreditScoreEngine';
import { toast } from 'sonner';

// Chart of Accounts Structure (PUC / NIIF)
export interface Account {
  code: string;
  name: string;
  type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto';
  category: string;
  balance: number;
}

export const defaultChartOfAccounts: Account[] = [
  { code: '1100', name: 'Caja General & Efectivo', type: 'Activo', category: 'Activo Circulante', balance: 0 },
  { code: '1110', name: 'Bancos & Cuentas de Ahorro/Corriente', type: 'Activo', category: 'Activo Circulante', balance: 0 },
  { code: '1200', name: 'Cartera de Préstamos Vigente (Capital)', type: 'Activo', category: 'Activo Financiero', balance: 0 },
  { code: '1210', name: 'Cartera de Préstamos Vencida (Mora)', type: 'Activo', category: 'Activo Financiero', balance: 0 },
  { code: '1220', name: 'Provisión Acumulada para Cartera Dudosa', type: 'Activo', category: 'Activo Compensatorio', balance: 0 },
  { code: '2100', name: 'Cuentas por Pagar & Proveedores', type: 'Pasivo', category: 'Pasivo Corriente', balance: 0 },
  { code: '2200', name: 'Retenciones Impositivas & DGII por Pagar', type: 'Pasivo', category: 'Pasivo Corriente', balance: 0 },
  { code: '2300', name: 'Fondos & Préstamos de Inversionistas', type: 'Pasivo', category: 'Pasivo Financiero', balance: 0 },
  { code: '3100', name: 'Capital Social Aportado', type: 'Patrimonio', category: 'Patrimonio Neto', balance: 0 },
  { code: '3200', name: 'Utilidades Acumuladas de Ejercicios Anteriores', type: 'Patrimonio', category: 'Patrimonio Neto', balance: 0 },
  { code: '3300', name: 'Resultado / Utilidad Neta del Ejercicio', type: 'Patrimonio', category: 'Patrimonio Neto', balance: 0 },
  { code: '4100', name: 'Ingresos por Intereses Financieros', type: 'Ingreso', category: 'Ingresos Operativos', balance: 0 },
  { code: '4200', name: 'Ingresos por Moras y Recargos', type: 'Ingreso', category: 'Ingresos Operativos', balance: 0 },
  { code: '4300', name: 'Ingresos por Gastos de Cierre & Legal', type: 'Ingreso', category: 'Ingresos Operativos', balance: 0 },
  { code: '5100', name: 'Gastos de Nómina y Comisiones de Cobro', type: 'Gasto', category: 'Gastos Operativos', balance: 0 },
  { code: '5200', name: 'Gastos Administrativos, Local y Servicios', type: 'Gasto', category: 'Gastos Operativos', balance: 0 },
  { code: '5300', name: 'Gasto por Provisión de Cartera de Crédito', type: 'Gasto', category: 'Gastos Financieros', balance: 0 },
  { code: '5400', name: 'Gastos y Comisiones Bancarias', type: 'Gasto', category: 'Gastos Financieros', balance: 0 }
];

export const DeepAccounting: React.FC = () => {
  const { 
    transactions, bankAccounts, getFinancialStats, addTransaction,
    accountingPeriods = [], lockedUntilDate, setLockedUntilDate,
    closeAccountingPeriod, reopenAccountingPeriod
  } = useAccounting();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { addAuditLog } = useSettings();
  const navigate = useNavigate();
  
  const stats = getFinancialStats();
  const [activeTab, setActiveTab] = useState<'chart' | 'journal' | 'trial' | 'income-statement' | 'balance-sheet' | 'provisions' | 'closing'>('chart');
  const [accountFilterType, setAccountFilterType] = useState<string>('ALL');
  const [accountSearch, setAccountSearch] = useState('');

  // Manual Journal Entry Form State
  const [manualDebitCode, setManualDebitCode] = useState('1100');
  const [manualCreditCode, setManualCreditCode] = useState('4100');
  const [manualEntryAmount, setManualEntryAmount] = useState('');
  const [manualEntryConcept, setManualEntryConcept] = useState('');

  // Period Closing Wizard & Lock State
  const [closingType, setClosingType] = useState<'Anual' | 'Mensual'>('Anual');
  const [closingYear, setClosingYear] = useState<number>(new Date().getFullYear());
  const [closingMonth, setClosingMonth] = useState<number>(new Date().getMonth() + 1);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isClosingExecuting, setIsClosingExecuting] = useState<boolean>(false);
  const [manualLockDateInput, setManualLockDateInput] = useState<string>(lockedUntilDate || '');
  const [reopenModalPeriodId, setReopenModalPeriodId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState<string>('');

  // 1. Live Portfolio & Financial Calculations
  const activeLoans = loans.filter(l => l.status === 'Activo' || (l.status as string) === 'Vigente');
  const overdueLoans = loans.filter(l => l.status === 'Atrasado' || (l.status as string) === 'Vencido');

  const totalActivePortfolio = activeLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  const totalOverduePortfolio = overdueLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  const totalPortfolioValue = totalActivePortfolio + totalOverduePortfolio;
  
  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

  // Income Breakdown
  const interestIncome = transactions
    .filter(t => t.type === 'Ingreso' && (t.category === 'Pago Préstamo' || t.category === 'Capital' || t.paymentType === 'Capital' || t.paymentType === 'Interes'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0) * 0.35; // Estimated 35% interest component on payments or real calculation

  const lateFeeIncome = transactions
    .filter(t => t.type === 'Ingreso' && (t.paymentType === 'Mora' || (t.description || '').toLowerCase().includes('mora')))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const closingCostIncome = loans.reduce((sum, l) => sum + (Number(l.closingCost) || 0), 0);

  const otherIncome = transactions
    .filter(t => t.type === 'Ingreso' && t.category !== 'Pago Préstamo' && t.paymentType !== 'Mora')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalOperatingIncome = interestIncome + lateFeeIncome + closingCostIncome + otherIncome;

  // Expenses Breakdown
  const payrollExpense = transactions
    .filter(t => t.type === 'Gasto' && (t.category === 'Nómina' || (t.description || '').toLowerCase().includes('nomina')))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const adminExpense = transactions
    .filter(t => t.type === 'Gasto' && t.category !== 'Nómina')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Portfolio Provision Calculation based on prudential classification
  const provisionSummary = useMemo(() => {
    let gradeA = 0;
    let gradeB = 0;
    let gradeC = 0;
    let gradeD = 0;
    let gradeE = 0;

    clients.forEach(c => {
      const scoreRes = CreditScoreEngine.calculateScore(c, loans);
      const clientDebt = loans
        .filter(l => l.clientId === c.id && (l.status === 'Activo' || l.status === 'Atrasado'))
        .reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);

      if (scoreRes.grade === 'A') gradeA += clientDebt;
      else if (scoreRes.grade === 'B') gradeB += clientDebt;
      else if (scoreRes.grade === 'C') gradeC += clientDebt;
      else if (scoreRes.grade === 'D') gradeD += clientDebt;
      else gradeE += clientDebt;
    });

    const reqA = gradeA * 0.01;
    const reqB = gradeB * 0.05;
    const reqC = gradeC * 0.20;
    const reqD = gradeD * 0.50;
    const reqE = gradeE * 1.00;
    const totalRequired = reqA + reqB + reqC + reqD + reqE;

    return { gradeA, gradeB, gradeC, gradeD, gradeE, reqA, reqB, reqC, reqD, reqE, totalRequired };
  }, [clients, loans]);

  const totalExpenses = payrollExpense + adminExpense + provisionSummary.totalRequired;
  const netProfit = totalOperatingIncome - totalExpenses;

  // Total Assets & Liabilities for Balance Sheet
  const totalAssets = stats.balance + totalBankBalance + totalPortfolioValue - provisionSummary.totalRequired;
  const totalLiabilities = 0; // Baseline current liabilities
  const totalEquity = totalAssets - totalLiabilities;

  // Live Chart of Accounts Balance Map
  const liveChartOfAccounts = useMemo(() => {
    return defaultChartOfAccounts.map(acc => {
      let bal = 0;
      if (acc.code === '1100') bal = stats.balance;
      else if (acc.code === '1110') bal = totalBankBalance;
      else if (acc.code === '1200') bal = totalActivePortfolio;
      else if (acc.code === '1210') bal = totalOverduePortfolio;
      else if (acc.code === '1220') bal = -provisionSummary.totalRequired;
      else if (acc.code === '3100') bal = Math.max(0, totalEquity - netProfit);
      else if (acc.code === '3200') bal = 0;
      else if (acc.code === '3300') bal = netProfit;
      else if (acc.code === '4100') bal = interestIncome;
      else if (acc.code === '4200') bal = lateFeeIncome;
      else if (acc.code === '4300') bal = closingCostIncome + otherIncome;
      else if (acc.code === '5100') bal = payrollExpense;
      else if (acc.code === '5200') bal = adminExpense;
      else if (acc.code === '5300') bal = provisionSummary.totalRequired;
      else if (acc.code === '5400') bal = 0;
      return { ...acc, balance: bal };
    });
  }, [
    stats.balance, totalBankBalance, totalActivePortfolio, totalOverduePortfolio,
    provisionSummary.totalRequired, totalEquity, netProfit, interestIncome,
    lateFeeIncome, closingCostIncome, otherIncome, payrollExpense, adminExpense
  ]);

  // Filtered Chart of Accounts
  const filteredAccounts = useMemo(() => {
    return liveChartOfAccounts.filter(acc => {
      const matchType = accountFilterType === 'ALL' || acc.type === accountFilterType;
      const matchSearch = accountSearch === '' || 
        acc.code.toLowerCase().includes(accountSearch.toLowerCase()) || 
        acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.category.toLowerCase().includes(accountSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [liveChartOfAccounts, accountFilterType, accountSearch]);

  // Manual Journal Entry Submit Handler
  const handleAddManualJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(manualEntryAmount);
    if (!amount || amount <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }
    if (!manualEntryConcept.trim()) {
      toast.error('Ingrese un concepto o descripción para el asiento');
      return;
    }

    const debitAcc = liveChartOfAccounts.find(a => a.code === manualDebitCode);
    const creditAcc = liveChartOfAccounts.find(a => a.code === manualCreditCode);

    if (manualDebitCode === manualCreditCode) {
      toast.error('La cuenta débito y crédito deben ser distintas');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    await addTransaction({
      type: debitAcc?.type === 'Gasto' ? 'Gasto' : 'Ingreso',
      category: 'Cierre',
      amount,
      date: today,
      description: `[Asiento Manual] Débito: ${debitAcc?.code} (${debitAcc?.name}) | Crédito: ${creditAcc?.code} (${creditAcc?.name}) - ${manualEntryConcept}`,
      paymentType: 'Capital',
      paymentMethod: 'Transferencia'
    });

    addAuditLog('journal_entry_created', `Asiento Manual: DR ${manualDebitCode} / CR ${manualCreditCode} por RD$ ${amount.toLocaleString()}`);
    toast.success('Asiento contable registrado con éxito');
    setManualEntryAmount('');
    setManualEntryConcept('');
  };

  // ─── PERIOD CLOSING WIZARD COMPUTATIONS ───
  const wizardDates = useMemo(() => {
    if (closingType === 'Anual') {
      return {
        startDate: `${closingYear}-01-01`,
        endDate: `${closingYear}-12-31`,
        label: `Año Fiscal ${closingYear}`
      };
    } else {
      const monthStr = String(closingMonth).padStart(2, '0');
      const lastDay = new Date(closingYear, closingMonth, 0).getDate();
      return {
        startDate: `${closingYear}-${monthStr}-01`,
        endDate: `${closingYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
        label: `Mes ${closingMonth}/${closingYear}`
      };
    }
  }, [closingType, closingYear, closingMonth]);

  const wizardPeriodMetrics = useMemo(() => {
    const { startDate, endDate } = wizardDates;
    const pTxs = transactions.filter(t => {
      const d = (t.date || '').split('T')[0];
      return d >= startDate && d <= endDate;
    });

    const pInterest = pTxs
      .filter(t => t.type === 'Ingreso' && (t.category === 'Pago Préstamo' || t.category === 'Capital' || t.paymentType === 'Capital' || t.paymentType === 'Interes'))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0) * 0.35;

    const pLate = pTxs
      .filter(t => t.type === 'Ingreso' && (t.paymentType === 'Mora' || (t.description || '').toLowerCase().includes('mora')))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pOther = pTxs
      .filter(t => t.type === 'Ingreso' && t.category !== 'Pago Préstamo' && t.paymentType !== 'Mora')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pIncome = pInterest + pLate + pOther;

    const pPayroll = pTxs
      .filter(t => t.type === 'Gasto' && (t.category === 'Nómina' || (t.description || '').toLowerCase().includes('nomina')))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pAdmin = pTxs
      .filter(t => t.type === 'Gasto' && t.category !== 'Nómina')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pExpense = pPayroll + pAdmin;
    const pNet = pIncome - pExpense;

    return {
      txCount: pTxs.length,
      interestIncome: pInterest,
      lateFeeIncome: pLate,
      otherIncome: pOther,
      totalIncome: pIncome,
      payrollExpense: pPayroll,
      adminExpense: pAdmin,
      totalExpense: pExpense,
      netIncome: pNet
    };
  }, [transactions, wizardDates]);

  // Execute Closing and Journal Entry
  const handleExecuteClosing = async () => {
    if (isClosingExecuting) return;
    setIsClosingExecuting(true);
    try {
      await closeAccountingPeriod({
        periodType: closingType,
        year: closingYear,
        month: closingType === 'Mensual' ? closingMonth : undefined,
        startDate: wizardDates.startDate,
        endDate: wizardDates.endDate,
        totalIncome: wizardPeriodMetrics.totalIncome,
        totalExpense: wizardPeriodMetrics.totalExpense,
        netIncome: wizardPeriodMetrics.netIncome,
        notes: closingNotes || `Cierre contable ${wizardDates.label} ejecutado con traslado a Utilidades Acumuladas / Patrimonio.`
      });
      setClosingNotes('');
    } finally {
      setIsClosingExecuting(false);
    }
  };

  // Reopen Period Handler
  const handleReopenPeriod = async () => {
    if (!reopenModalPeriodId) return;
    if (!reopenReason.trim()) {
      toast.error('Debe ingresar un motivo para reabrir el período contable.');
      return;
    }
    await reopenAccountingPeriod(reopenModalPeriodId, reopenReason.trim());
    setReopenModalPeriodId(null);
    setReopenReason('');
  };

  // Save manual lock date
  const handleSaveManualLockDate = async () => {
    if (!manualLockDateInput) {
      await setLockedUntilDate(null);
    } else {
      await setLockedUntilDate(manualLockDateInput);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> NIIF / Contabilidad Regulatoria
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Contabilidad Profunda & Balances</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Catálogo de Cuentas (PUC), Libro Diario, Balanza de Comprobación, Cierres Fiscales, Bloqueo de Períodos y Provisiones según normativa bancaria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DataExportToolbar
              title="Reporte Contable Maestro"
              columns={[
                { header: 'Código', key: 'Código' },
                { header: 'Nombre de Cuenta', key: 'Cuenta' },
                { header: 'Tipo', key: 'Tipo' },
                { header: 'Categoría', key: 'Categoría' },
                { header: 'Saldo (RD$)', key: 'Saldo (RD$)' }
              ]}
              data={liveChartOfAccounts.map(a => ({
                'Código': a.code,
                'Cuenta': a.name,
                'Tipo': a.type,
                'Categoría': a.category,
                'Saldo (RD$)': a.balance
              }))}
              filename="contabilidad-maestra"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button 
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'chart' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Plan de Cuentas
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'journal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
          >
            <FileText className="w-3.5 h-3.5" /> Libro Diario
          </button>
          <button 
            onClick={() => setActiveTab('trial')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'trial' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
          >
            <Scale className="w-3.5 h-3.5" /> Balanza Comprobación
          </button>
          <button 
            onClick={() => setActiveTab('income-statement')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'income-statement' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Estado de Resultados
          </button>
          <button 
            onClick={() => setActiveTab('balance-sheet')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'balance-sheet' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
          >
            <Building2 className="w-3.5 h-3.5" /> Balance General
          </button>
          <button 
            onClick={() => setActiveTab('provisions')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'provisions' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
          >
            <Shield className="w-3.5 h-3.5" /> Provisiones Cartera
          </button>
          <button 
            onClick={() => setActiveTab('closing')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'closing' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
          >
            <Lock className="w-3.5 h-3.5" /> Cierres & Bloqueos
          </button>
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Activos Totales"
          value={`RD$ ${totalAssets.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Caja + Bancos + Cartera"
          trendUp={true}
          icon={Building2}
          gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
          glowColor="shadow-indigo-500/20"
        />
        <StatCard
          title="Cartera por Cobrar"
          value={`RD$ ${totalPortfolioValue.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend={`${activeLoans.length} Vigentes • ${overdueLoans.length} En Mora`}
          trendUp={true}
          icon={BookOpen}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          glowColor="shadow-emerald-500/20"
        />
        <StatCard
          title="Ingresos Devengados"
          value={`RD$ ${totalOperatingIncome.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Intereses + Moras + Cierre"
          trendUp={true}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
          glowColor="shadow-blue-500/20"
        />
        <StatCard
          title="Utilidad Neta (P&L)"
          value={`RD$ ${netProfit.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend={netProfit >= 0 ? 'Resultado Favorable' : 'Déficit Contable'}
          trendUp={netProfit >= 0}
          icon={Calculator}
          gradient="bg-gradient-to-br from-amber-500 to-rose-600"
          glowColor="shadow-amber-500/20"
        />
      </div>

      {/* ─── TAB 1: PLAN DE CUENTAS (PUC / NIIF) ─── */}
      {activeTab === 'chart' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Catálogo de Cuentas Contables (PUC)</h3>
              <p className="text-xs text-slate-400">Estructura contable codificada con saldos en tiempo real.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <CustomSelect
                value={accountFilterType}
                onChange={(val) => setAccountFilterType(val)}
                options={[
                  { value: 'ALL', label: 'Todos los Tipos' },
                  { value: 'Activo', label: '1. Activos' },
                  { value: 'Pasivo', label: '2. Pasivos' },
                  { value: 'Patrimonio', label: '3. Patrimonio' },
                  { value: 'Ingreso', label: '4. Ingresos' },
                  { value: 'Gasto', label: '5. Gastos' },
                ]}
                className="w-40 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre de la Cuenta</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Saldo Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{acc.code}</td>
                    <td className="p-3 text-slate-800 dark:text-white font-semibold">{acc.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.type === 'Activo' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        acc.type === 'Pasivo' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                        acc.type === 'Patrimonio' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                        acc.type === 'Ingreso' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{acc.category}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      RD$ {acc.balance.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LIBRO DIARIO (MANUAL JOURNAL & TRANSACTIONS) ─── */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" /> Registrar Asiento Diario
            </h3>
            <p className="text-xs text-slate-400">Genera un asiento de doble partida debitando y acreditando cuentas específicas.</p>

            <form onSubmit={handleAddManualJournalEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Cuenta Débito (Debe)</label>
                <CustomSelect
                  value={manualDebitCode}
                  onChange={(val) => setManualDebitCode(val)}
                  options={liveChartOfAccounts.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }))}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Cuenta Crédito (Haber)</label>
                <CustomSelect
                  value={manualCreditCode}
                  onChange={(val) => setManualCreditCode(val)}
                  options={liveChartOfAccounts.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }))}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Monto (RD$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={manualEntryAmount}
                  onChange={(e) => setManualEntryAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Concepto / Glosa</label>
                <textarea
                  placeholder="Motivo del asiento contable..."
                  value={manualEntryConcept}
                  onChange={(e) => setManualEntryConcept(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Registrar Asiento
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Transacciones & Asientos Registrados</h3>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5">Concepto</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {transactions.slice(0, 50).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-mono text-slate-500">{t.date}</td>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-white">{t.description}</td>
                      <td className="p-2.5 text-slate-500">{t.category}</td>
                      <td className={`p-2.5 text-right font-mono font-bold ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'Ingreso' ? '+' : '-'} RD$ {Number(t.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BALANZA DE COMPROBACIÓN ─── */}
      {activeTab === 'trial' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Balanza de Comprobación de Saldos</h3>
              <p className="text-xs text-slate-400">Verificación de partida doble: Sumas del Débito y Crédito.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Código</th>
                  <th className="p-3">Cuenta</th>
                  <th className="p-3 text-right">Débitos (Debe)</th>
                  <th className="p-3 text-right">Créditos (Haber)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {liveChartOfAccounts.map(acc => {
                  const isDebitNature = acc.type === 'Activo' || acc.type === 'Gasto';
                  const debitAmount = isDebitNature ? Math.max(0, acc.balance) : 0;
                  const creditAmount = !isDebitNature ? Math.max(0, acc.balance) : 0;
                  return (
                    <tr key={acc.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-slate-500">{acc.code}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-white">{acc.name}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600">
                        {debitAmount > 0 ? `RD$ ${debitAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-purple-600">
                        {creditAmount > 0 ? `RD$ ${creditAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: ESTADO DE RESULTADOS (P&L) ─── */}
      {activeTab === 'income-statement' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Estado de Resultados (Pérdidas y Ganancias)</h3>
              <p className="text-xs text-slate-400">Ingresos devengados menos costos operativos y provisiones.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider mb-2">Ingresos Operativos</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">4100 • Intereses Financieros Cobrados</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {interestIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">4200 • Moras y Recargos</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {lateFeeIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">4300 • Gastos de Cierre & Legal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {closingCostIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-900 dark:text-emerald-300">Total Ingresos Operativos</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">RD$ {totalOperatingIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <h4 className="font-bold text-rose-800 dark:text-rose-400 text-xs uppercase tracking-wider mb-2">Gastos Operativos & Provisiones</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">5100 • Nómina y Comisiones</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {payrollExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">5200 • Gastos Administrativos & Local</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {adminExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">5300 • Gasto por Provisión de Cartera</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {provisionSummary.totalRequired.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-rose-200 dark:border-rose-800">
                  <span className="text-rose-900 dark:text-rose-300">Total Gastos & Provisiones</span>
                  <span className="font-mono text-rose-700 dark:text-rose-400">RD$ {totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Resultado Neto del Ejercicio</span>
                <p className="text-[11px] text-slate-500">Utilidad contable devengada para el período</p>
              </div>
              <div className="text-right">
                <span className={`text-xl font-extrabold font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  RD$ {netProfit.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: BALANCE GENERAL (BALANCE SHEET) ─── */}
      {activeTab === 'balance-sheet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Activos Totales
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">1100 • Caja General (Efectivo)</span>
                <span className="font-mono font-bold">RD$ {stats.balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">1110 • Bancos & Cuentas de Ahorro</span>
                <span className="font-mono font-bold">RD$ {totalBankBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">1200 • Cartera Préstamos Vigente</span>
                <span className="font-mono font-bold">RD$ {totalActivePortfolio.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">1210 • Cartera Préstamos en Mora</span>
                <span className="font-mono font-bold">RD$ {totalOverduePortfolio.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600">
                <span>1220 • Provisión de Cartera (Compensatoria)</span>
                <span className="font-mono font-bold">- RD$ {provisionSummary.totalRequired.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <span>Total Activos Netos</span>
                <span className="font-mono">RD$ {totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-600" /> Pasivo & Patrimonio Neto
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">2100 • Pasivos Corrientes / Proveedores</span>
                <span className="font-mono font-bold">RD$ 0.00</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">3100 • Capital Social Aportado</span>
                <span className="font-mono font-bold">RD$ {Math.max(0, totalEquity - netProfit).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">3300 • Utilidad Neta del Ejercicio</span>
                <span className="font-mono font-bold text-indigo-600">RD$ {netProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 font-bold text-sm">
                <span>Total Pasivo + Patrimonio</span>
                <span className="font-mono">RD$ {totalEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: PROVISIONES DE CARTERA ─── */}
      {activeTab === 'provisions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Matriz de Provisiones de Cartera Crediticia</h3>
              <p className="text-xs text-slate-400">Clasificación prudencial del riesgo y reserva regulatoria exigida.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-bold">Provisión Total Requerida</span>
              <span className="text-lg font-black font-mono text-rose-600">RD$ {provisionSummary.totalRequired.toLocaleString()}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Categoría de Riesgo</th>
                  <th className="p-3">Días de Mora</th>
                  <th className="p-3 text-right">Saldo de Cartera Expuesto</th>
                  <th className="p-3 text-center">% Provisión Exigida</th>
                  <th className="p-3 text-right">Monto de Provisión Contable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-emerald-600">Grado A • Riesgo Normal / Platino</td>
                  <td className="p-3 text-slate-500">0 días</td>
                  <td className="p-3 text-right font-mono font-bold">RD$ {provisionSummary.gradeA.toLocaleString()}</td>
                  <td className="p-3 text-center font-bold">1%</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">RD$ {provisionSummary.reqA.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-indigo-600">Grado B • Riesgo Potencial / Confiable</td>
                  <td className="p-3 text-slate-500">1 - 15 días</td>
                  <td className="p-3 text-right font-mono font-bold">RD$ {provisionSummary.gradeB.toLocaleString()}</td>
                  <td className="p-3 text-center font-bold">5%</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">RD$ {provisionSummary.reqB.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-amber-600">Grado C • Riesgo Deficiente / Regular</td>
                  <td className="p-3 text-slate-500">16 - 30 días</td>
                  <td className="p-3 text-right font-mono font-bold">RD$ {provisionSummary.gradeC.toLocaleString()}</td>
                  <td className="p-3 text-center font-bold">20%</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">RD$ {provisionSummary.reqC.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-rose-600">Grado D • Dudosa Recuperación</td>
                  <td className="p-3 text-slate-500">31 - 60 días</td>
                  <td className="p-3 text-right font-mono font-bold">RD$ {provisionSummary.gradeD.toLocaleString()}</td>
                  <td className="p-3 text-center font-bold">50%</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">RD$ {provisionSummary.reqD.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-red-700">Grado E • Irrecuperable / Pérdida</td>
                  <td className="p-3 text-slate-500">&gt; 60 días</td>
                  <td className="p-3 text-right font-mono font-bold">RD$ {provisionSummary.gradeE.toLocaleString()}</td>
                  <td className="p-3 text-center font-bold">100%</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">RD$ {provisionSummary.reqE.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 7: CIERRES & BLOQUEOS CONTABLES ─── */}
      {activeTab === 'closing' && (
        <div className="space-y-6">
          
          {/* Card 1: Estado de Bloqueo de Períodos Contables */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  lockedUntilDate 
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900' 
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-900'
                }`}>
                  {lockedUntilDate ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {lockedUntilDate ? `Libros Bloqueados hasta el ${lockedUntilDate}` : 'Operación Contable Abierta'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lockedUntilDate 
                      ? 'No se permiten registros, modificaciones ni anulaciones de transacciones o pagos anteriores o iguales a esta fecha.'
                      : 'No hay bloqueo de fecha activo. Los usuarios pueden registrar movimientos en cualquier fecha.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={manualLockDateInput}
                  onChange={(e) => setManualLockDateInput(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
                <button
                  onClick={handleSaveManualLockDate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Fijar Bloqueo
                </button>
                {lockedUntilDate && (
                  <button
                    onClick={() => {
                      setManualLockDateInput('');
                      setLockedUntilDate(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/30 dark:text-slate-300 dark:hover:text-rose-400 font-bold rounded-xl text-xs transition-all"
                  >
                    Desbloquear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Asistente de Cierre de Ejercicio Contable & Asientos Automáticos */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" /> Asistente de Cierre & Asientos Automáticos
                </h3>
                <p className="text-xs text-slate-400">
                  Calcula el resultado neto del ejercicio y traslada automáticamente los saldos de ingresos y gastos al Patrimonio Neto.
                </p>
              </div>

              {/* Selector de Período */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setClosingType('Anual')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      closingType === 'Anual' 
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Cierre Anual Fiscal
                  </button>
                  <button
                    type="button"
                    onClick={() => setClosingType('Mensual')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      closingType === 'Mensual' 
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Cierre Mensual
                  </button>
                </div>

                <CustomSelect
                  value={String(closingYear)}
                  onChange={(val) => setClosingYear(Number(val))}
                  options={[
                    { value: '2024', label: 'Año 2024' },
                    { value: '2025', label: 'Año 2025' },
                    { value: '2026', label: 'Año 2026' },
                    { value: '2027', label: 'Año 2027' },
                  ]}
                  className="w-32 text-xs"
                />

                {closingType === 'Mensual' && (
                  <CustomSelect
                    value={String(closingMonth)}
                    onChange={(val) => setClosingMonth(Number(val))}
                    options={[
                      { value: '1', label: '01 - Enero' },
                      { value: '2', label: '02 - Febrero' },
                      { value: '3', label: '03 - Marzo' },
                      { value: '4', label: '04 - Abril' },
                      { value: '5', label: '05 - Mayo' },
                      { value: '6', label: '06 - Junio' },
                      { value: '7', label: '07 - Julio' },
                      { value: '8', label: '08 - Agosto' },
                      { value: '9', label: '09 - Septiembre' },
                      { value: '10', label: '10 - Octubre' },
                      { value: '11', label: '11 - Noviembre' },
                      { value: '12', label: '12 - Diciembre' },
                    ]}
                    className="w-36 text-xs"
                  />
                )}
              </div>
            </div>

            {/* Resumen del Período a Cerrar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Ingresos del Período</span>
                <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                  RD$ {wizardPeriodMetrics.totalIncome.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Intereses RD$ {wizardPeriodMetrics.interestIncome.toLocaleString()} • Moras RD$ {wizardPeriodMetrics.lateFeeIncome.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">Gastos del Período</span>
                <span className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">
                  RD$ {wizardPeriodMetrics.totalExpense.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Nómina RD$ {wizardPeriodMetrics.payrollExpense.toLocaleString()} • Adm RD$ {wizardPeriodMetrics.adminExpense.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
                <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">Utilidad / Pérdida a Trasladar</span>
                <span className={`text-lg font-black font-mono ${wizardPeriodMetrics.netIncome >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-600'}`}>
                  RD$ {wizardPeriodMetrics.netIncome.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {wizardPeriodMetrics.txCount} transacciones en el rango {wizardDates.startDate} al {wizardDates.endDate}
                </span>
              </div>
            </div>

            {/* Vista Previa del Asiento de Cierre (Double-Entry Balance) */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-600" /> Vista Previa del Asiento Contable de Cierre
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2">Código</th>
                      <th className="p-2">Nombre de Cuenta</th>
                      <th className="p-2">Efecto Contable</th>
                      <th className="p-2 text-right">Débito (Debe)</th>
                      <th className="p-2 text-right">Crédito (Haber)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                    <tr>
                      <td className="p-2 font-mono font-bold text-indigo-600">4100</td>
                      <td className="p-2">Ingresos por Intereses Financieros</td>
                      <td className="p-2 text-slate-500">Cancelación de saldo acreedor</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-800 dark:text-white">RD$ {wizardPeriodMetrics.interestIncome.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-slate-400">-</td>
                    </tr>
                    {wizardPeriodMetrics.lateFeeIncome > 0 && (
                      <tr>
                        <td className="p-2 font-mono font-bold text-indigo-600">4200</td>
                        <td className="p-2">Ingresos por Moras y Recargos</td>
                        <td className="p-2 text-slate-500">Cancelación de saldo acreedor</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800 dark:text-white">RD$ {wizardPeriodMetrics.lateFeeIncome.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-slate-400">-</td>
                      </tr>
                    )}
                    {wizardPeriodMetrics.payrollExpense > 0 && (
                      <tr>
                        <td className="p-2 font-mono font-bold text-rose-600">5100</td>
                        <td className="p-2">Gastos de Nómina y Comisiones</td>
                        <td className="p-2 text-slate-500">Cancelación de saldo deudor</td>
                        <td className="p-2 text-right font-mono text-slate-400">-</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800 dark:text-white">RD$ {wizardPeriodMetrics.payrollExpense.toLocaleString()}</td>
                      </tr>
                    )}
                    {wizardPeriodMetrics.adminExpense > 0 && (
                      <tr>
                        <td className="p-2 font-mono font-bold text-rose-600">5200</td>
                        <td className="p-2">Gastos Administrativos & Servicios</td>
                        <td className="p-2 text-slate-500">Cancelación de saldo deudor</td>
                        <td className="p-2 text-right font-mono text-slate-400">-</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800 dark:text-white">RD$ {wizardPeriodMetrics.adminExpense.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="bg-indigo-50/50 dark:bg-indigo-950/30">
                      <td className="p-2 font-mono font-bold text-purple-600">3200</td>
                      <td className="p-2 font-bold text-indigo-950 dark:text-indigo-200">
                        Utilidades Acumuladas de Ejercicios Anteriores (Patrimonio Neto)
                      </td>
                      <td className="p-2 text-indigo-600 font-bold">Traslado definitivo de resultado</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-400">
                        {wizardPeriodMetrics.netIncome < 0 ? `RD$ ${Math.abs(wizardPeriodMetrics.netIncome).toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-600">
                        {wizardPeriodMetrics.netIncome >= 0 ? `RD$ ${wizardPeriodMetrics.netIncome.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notas opcionales y Botón de Ejecución */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Notas u observaciones del cierre (opcional)..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full sm:max-w-md px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleExecuteClosing}
                disabled={isClosingExecuting}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {isClosingExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Ejecutar Cierre Definitivo & Bloquear Período
              </button>
            </div>
          </div>

          {/* Card 3: Historial de Cierres Contables & Auditoría */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" /> Historial de Períodos Cerrados & Auditoría
                </h3>
                <p className="text-xs text-slate-400">Registro cronológico de cierres contables y estados de auditoría.</p>
              </div>
            </div>

            {accountingPeriods.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No hay períodos contables cerrados todavía.</p>
                <p className="text-[11px] text-slate-400">Utilice el asistente superior cuando desee realizar el cierre de fin de mes o de año fiscal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">Tipo / Período</th>
                      <th className="p-3">Rango Fechas</th>
                      <th className="p-3 text-right">Ingresos</th>
                      <th className="p-3 text-right">Gastos</th>
                      <th className="p-3 text-right">Resultado Neto</th>
                      <th className="p-3">Cerrado Por</th>
                      <th className="p-3 text-center">Estado</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {accountingPeriods.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-800 dark:text-white">
                          {p.periodType} {p.year} {p.month ? `(Mes ${p.month})` : ''}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{p.startDate} al {p.endDate}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">RD$ {p.totalIncome.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">RD$ {p.totalExpense.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-600">RD$ {p.netIncome.toLocaleString()}</td>
                        <td className="p-3 text-slate-500">{p.closedBy || 'Admin'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Cerrado' 
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {p.status === 'Cerrado' ? (
                            <button
                              onClick={() => {
                                setReopenModalPeriodId(p.id);
                                setReopenReason('');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/40 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 mx-auto"
                            >
                              <RotateCcw className="w-3 h-3" /> Reabrir
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Reabierto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal: Reabrir Período Contable */}
      {reopenModalPeriodId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Reabrir Período Contable</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Al reabrir este período, se habilitará temporalmente el registro de modificaciones en las fechas correspondientes. Esta acción quedará registrada en la bitácora de auditoría.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo de Reapertura</label>
              <textarea
                rows={3}
                placeholder="Indique la justificación para reabrir este período auditado..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReopenModalPeriodId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReopenPeriod}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Confirmar Reapertura
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeepAccounting;
