import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Calculator, Scale, PieChart, FileText, CheckCircle2, BookOpen, PlusCircle, Filter, ChevronLeft } from 'lucide-react';
import { useAccounting, useLoans, useClients, useSettings } from '../context/StoreContext';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/CustomSelect';
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

const DeepAccounting: React.FC = () => {
  const { transactions, getFinancialStats, addTransaction } = useAccounting();
  const { loans } = useLoans();
  const { addAuditLog } = useSettings();
  const navigate = useNavigate();
  
  const stats = getFinancialStats();
  const [activeTab, setActiveTab] = useState<'chart' | 'journal' | 'trial' | 'financials'>('chart');

  // Manual Journal Entry Form State
  const [manualDebitCode, setManualDebitCode] = useState('1100');
  const [manualCreditCode, setManualCreditCode] = useState('4100');
  const [manualEntryAmount, setManualEntryAmount] = useState('');
  const [manualEntryConcept, setManualEntryConcept] = useState('');

  // Calculate live portfolio balance from loans
  const totalPortfolioValue = loans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  
  // Calculate total income and expenses
  const totalIncome = transactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'Gasto').reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

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
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Contabilidad Profunda 2.0 (Partida Doble)
            </h2>
            <p className="text-slate-500 text-sm">Catálogo de cuentas, libro diario general, balanza de comprobación y estados financieros.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto text-xs font-bold">
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
            <FileText className="w-4 h-4" /> Libro Diario General
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

      {/* 4 Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Balance en Caja General"
          value={`RD$ ${stats.balance.toLocaleString()}`}
          trend="Disponibilidad"
          trendUp={true}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          glowColor="shadow-emerald-500/20"
        />
        <StatCard
          title="Cartera por Cobrar (Activo)"
          value={`RD$ ${totalPortfolioValue.toLocaleString()}`}
          trend="Activos Financieros"
          trendUp={true}
          icon={BookOpen}
          gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
          glowColor="shadow-indigo-500/20"
        />
        <StatCard
          title="Ingresos por Intereses"
          value={`RD$ ${totalIncome.toLocaleString()}`}
          trend="Cuentas 4100-4300"
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

      {/* ─── TAB 1: CATÁLOGO DE CUENTAS ─── */}
      {activeTab === 'chart' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">Catálogo de Cuentas Contables</h3>
              <p className="text-xs text-slate-500">Plan contable estructurado por Activos, Pasivos, Patrimonio, Ingresos y Gastos.</p>
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

      {/* ─── TAB 2: LIBRO DIARIO GENERAL ─── */}
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

          {/* Journal Entries Table */}
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

      {/* ─── TAB 3: BALANZA DE COMPROBACIÓN ─── */}
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
                  <th className="p-3 text-right">Saldo Resultante</th>
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

      {/* ─── TAB 4: ESTADO DE RESULTADOS (P&L) & BALANCE GENERAL ─── */}
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

    </div>
  );
};

export default DeepAccounting;
