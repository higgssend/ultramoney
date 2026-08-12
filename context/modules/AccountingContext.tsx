import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, CashShift, BankAccount, CollectorVisit } from '../../types';
import type { TransactionDB, CashShiftDB, BankAccountDB, CollectorVisitDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { logger } from '../../utils/logger';

interface AccountingContextType {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  cashShifts: CashShift[];
  activeCashShift: CashShift | null;
  collectorVisits: CollectorVisit[];
  
  openCashShift: (initialAmount: number, notes?: string) => void;
  closeCashShift: (finalCashCount: number, notes?: string) => void;
  getCashShiftSummary: () => { initialAmount: number; cashCollected: number; cashExpenses: number; expectedAmount: number };
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addBankAccount: (account: BankAccount) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  removeBankAccount: (id: string) => void;
  processBankDeposit: (bankAccountId: string, amount: number) => void;
  processBankDisbursement: (bankAccountId: string, amount: number) => void;
  addCollectorVisit: (visit: Omit<CollectorVisit, 'id'>) => void;
  getFinancialStats: () => { balance: number; incomeToday: number; expenseToday: number };
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-efectivo-1',
    bankName: 'Caja Chica / Efectivo Principal',
    accountType: 'Caja Chica / Efectivo',
    accountNumber: 'CAJA-001',
    accountName: 'Caja Chica de Cobros',
    currency: 'DOP',
    balance: 150000,
    isActive: true,
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bank-banreservas-1',
    bankName: 'Banco de Reservas (Banreservas)',
    accountType: 'Corriente',
    accountNumber: '960-123456-7',
    accountName: 'UltraMoney SRL - Banreservas',
    currency: 'DOP',
    balance: 500000,
    isActive: true,
    isDefault: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bank-popular-1',
    bankName: 'Banco Popular Dominicano',
    accountType: 'Corriente',
    accountNumber: '792-884920-1',
    accountName: 'UltraMoney SRL - Popular',
    currency: 'DOP',
    balance: 350000,
    isActive: true,
    isDefault: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bank-bhd-1',
    bankName: 'Banco BHD',
    accountType: 'Ahorros',
    accountNumber: '104-582910-3',
    accountName: 'UltraMoney SRL - BHD',
    currency: 'DOP',
    balance: 200000,
    isActive: true,
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

const mapTransaction = (t: TransactionDB): Transaction => ({
  id: t.id,
  type: t.type as Transaction['type'],
  category: (t.category || (t.referenceid ? 'Pago Préstamo' : 'Otro')) as Transaction['category'],
  amount: Number(t.amount) || 0,
  date: t.date,
  description: t.description,
  referenceId: t.referenceid || t.reference_id || undefined,
  paymentType: (t.paymenttype || t.payment_type || undefined) as Transaction['paymentType'],
  paymentMethod: (t.paymentmethod || t.payment_method || 'Efectivo') as Transaction['paymentMethod'],
  invoiceDate: t.invoicedate || t.invoice_date || undefined,
  bankAccountId: (t as any).bank_account_id || (t as any).bankAccountId || undefined,
  proofUrl: (t as any).proof_url || (t as any).proofUrl || undefined,
});

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { addAuditLog } = useSettings();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANK_ACCOUNTS);
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [collectorVisits, setCollectorVisits] = useState<CollectorVisit[]>([]);

  const activeCashShift = cashShifts.find(s => s.status === 'Abierta' && s.userId === currentUser?.id) || null;

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]); setBankAccounts(DEFAULT_BANK_ACCOUNTS); setCashShifts([]); setCollectorVisits([]);
      return;
    }

    const fetchData = async () => {
      try {
        const [trxRes, banksRes, shiftsRes, visitsRes] = await Promise.all([
          insforge.database.from('transactions').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('bank_accounts').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('cash_shifts').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('collector_visits').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false })
        ]);

        if (trxRes.data) setTransactions(trxRes.data.map(mapTransaction));
        if (banksRes.data && banksRes.data.length > 0) {
          setBankAccounts((banksRes.data as BankAccountDB[]).map((b) => ({
            id: b.id,
            bankName: b.bank_name || '',
            accountName: b.account_name || '',
            accountNumber: b.account_number || '',
            accountType: (b.account_type || 'Ahorros') as BankAccount['accountType'],
            currency: (b.currency || 'DOP') as BankAccount['currency'],
            balance: Number(b.initial_balance) || 0,
            isActive: b.status !== 'Inactiva',
          })));
        } else {
          setBankAccounts(DEFAULT_BANK_ACCOUNTS);
        }
        if (shiftsRes.data) {
          setCashShifts((shiftsRes.data as CashShiftDB[]).map((s) => ({
            id: s.id, userId: s.user_id, userName: s.user_name, openedAt: s.opened_at, closedAt: s.closed_at,
            initialAmount: Number(s.initial_amount) || 0, finalCashCount: s.final_cash_count,
            expectedAmount: s.expected_amount, difference: s.difference,
            status: s.status as CashShift['status'], notes: s.notes,
          })));
        }
        if (visitsRes.data) {
          setCollectorVisits((visitsRes.data as CollectorVisitDB[]).map((v) => ({
            id: v.id, collectorId: v.collector_id, clientId: v.client_id,
            loanId: v.loan_id, date: v.date, status: v.status as CollectorVisit['status'],
            notes: v.notes, amountCollected: v.amount_collected,
            location: v.location ?? undefined, promisedDate: v.promised_date,
          })));
        }
      } catch (error) {
        logger.error("Error fetching accounting data:", error);
      }
    };
    fetchData();
  }, [currentUser]);

  const openCashShift = async (initialAmount: number, notes?: string) => {
    if (!currentUser) return;
    if (activeCashShift) { addToast("Ya tienes una caja abierta", 'error'); return; }
    
    const { error } = await insforge.database.from('cash_shifts').insert([{
      lender_id: currentUser.id, user_id: currentUser.id, user_name: currentUser.name || currentUser.email || 'Cajero',
      opened_at: new Date().toISOString(), initial_amount: initialAmount, status: 'Abierta', notes
    }]);
    if (error) { addToast("Error al abrir caja", 'error'); }
    else {
      addAuditLog('cash_shift_opened', `Abrió caja con RD$ ${initialAmount}`);
      addToast(`Caja abierta con RD$ ${initialAmount}`, 'success');
      const { data } = await insforge.database.from('cash_shifts').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false });
      if (data) setCashShifts((data as CashShiftDB[]).map((s) => ({
         id: s.id, userId: s.user_id, userName: s.user_name, openedAt: s.opened_at, closedAt: s.closed_at,
         initialAmount: Number(s.initial_amount) || 0, finalCashCount: s.final_cash_count,
         expectedAmount: s.expected_amount, difference: s.difference,
         status: s.status as CashShift['status'], notes: s.notes,
      })));
    }
  };

  const getCashShiftSummary = () => {
    if (!activeCashShift) return { initialAmount: 0, cashCollected: 0, cashExpenses: 0, expectedAmount: 0 };
    const shiftTxs = transactions.filter(t => 
      t.date >= activeCashShift.openedAt.split('T')[0] && t.paymentMethod === 'Efectivo'
    );
    const initialAmount = activeCashShift.initialAmount;
    const cashCollected = shiftTxs.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
    const cashExpenses = shiftTxs.filter(t => t.type === 'Gasto').reduce((sum, t) => sum + Number(t.amount), 0);
    const expectedAmount = initialAmount + cashCollected - cashExpenses;
    return { initialAmount, cashCollected, cashExpenses, expectedAmount };
  };

  const closeCashShift = async (finalCashCount: number, notes?: string) => {
    if (!currentUser || !activeCashShift) { addToast("No hay caja abierta", 'error'); return; }
    const summary = getCashShiftSummary();
    const difference = finalCashCount - summary.expectedAmount;
    const combinedNotes = notes ? `${activeCashShift.notes || ''} | Cierre: ${notes}` : activeCashShift.notes;

    const { error } = await insforge.database.from('cash_shifts').update({
      closed_at: new Date().toISOString(), expected_amount: summary.expectedAmount,
      final_cash_count: finalCashCount, difference, status: 'Cerrada', notes: combinedNotes
    }).eq('id', activeCashShift.id);

    if (error) { addToast("Error al cerrar caja", 'error'); }
    else {
      setCashShifts(prev => prev.map(s => s.id === activeCashShift.id ? {
        ...s, closedAt: new Date().toISOString(), expectedAmount: summary.expectedAmount,
        finalCashCount, difference, status: 'Cerrada', notes: combinedNotes
      } : s));
      addAuditLog('cash_shift_closed', `Cerró caja con descuadre de RD$ ${difference}`);
      addToast("Caja cerrada correctamente", 'success');
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    const payload = { ...transaction, lender_id: currentUser.id };
    const { error } = await insforge.database.from('transactions').insert([payload]);
    if (error) addToast("Error al registrar transacción", 'error');
    else addToast("Transacción registrada", "success");
  };

  const addBankAccount = async (account: BankAccount) => {
    if (!currentUser) {
      setBankAccounts(prev => [account, ...prev]);
      addToast("Cuenta bancaria agregada", "success");
      return;
    }
    const { error } = await insforge.database.from('bank_accounts').insert([{
      lender_id: currentUser.id, bank_name: account.bankName, account_name: account.accountName,
      account_number: account.accountNumber, account_type: account.accountType,
      currency: account.currency || 'DOP', status: account.isActive ? 'Activa' : 'Inactiva', initial_balance: account.balance
    }]);
    if (!error) {
       addToast("Cuenta bancaria agregada", "success");
       setBankAccounts(prev => [account, ...prev]);
    } else {
       setBankAccounts(prev => [account, ...prev]);
       addToast("Cuenta bancaria agregada localmente", "success");
    }
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
    addToast("Cuenta bancaria actualizada", "success");
  };

  const removeBankAccount = async (id: string) => {
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    addToast("Cuenta removida", "info");
  };

  const processBankDeposit = (bankAccountId: string, amount: number) => {
    if (!bankAccountId || amount <= 0) return;
    setBankAccounts(prev => prev.map(acc => {
      if (acc.id === bankAccountId) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    }));
  };

  const processBankDisbursement = (bankAccountId: string, amount: number) => {
    if (!bankAccountId || amount <= 0) return;
    setBankAccounts(prev => prev.map(acc => {
      if (acc.id === bankAccountId) {
        let current = acc.balance;
        if (current < amount) {
          const needed = amount - current;
          addToast(`Inyección automática de capital en ${acc.bankName}: +RD$ ${needed.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 'info');
          current = amount + 50000;
        }
        return { ...acc, balance: current - amount };
      }
      return acc;
    }));
  };

  const addCollectorVisit = async (visit: Omit<CollectorVisit, 'id'>) => {
    if (!currentUser) return;
    const payload = {
      lender_id: currentUser.id, collector_id: visit.collectorId, client_id: visit.clientId,
      loan_id: visit.loanId, date: visit.date, status: visit.status, notes: visit.notes,
      amount_collected: visit.amountCollected, location: visit.location, promised_date: visit.promisedDate
    };
    const { error } = await insforge.database.from('collector_visits').insert([payload]);
    if (!error) addToast("Visita registrada", "success");
  };

  const getFinancialStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const incomeToday = transactions.filter(t => t.type === 'Ingreso' && t.date === today).reduce((sum, t) => sum + Number(t.amount), 0);
    const expenseToday = transactions.filter(t => t.type === 'Gasto' && t.date === today).reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = incomeToday - expenseToday;
    return { balance, incomeToday, expenseToday };
  };

  return (
    <AccountingContext.Provider value={{
      transactions, bankAccounts, cashShifts, activeCashShift, collectorVisits,
      openCashShift, closeCashShift, getCashShiftSummary, addTransaction, addBankAccount,
      updateBankAccount, removeBankAccount, processBankDeposit, processBankDisbursement,
      addCollectorVisit, getFinancialStats
    }}>
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) throw new Error('useAccounting must be used within an AccountingProvider');
  return context;
};
