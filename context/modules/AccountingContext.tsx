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
  removeBankAccount: (id: string) => void;
  addCollectorVisit: (visit: Omit<CollectorVisit, 'id'>) => void;
  getFinancialStats: () => { balance: number; incomeToday: number; expenseToday: number };
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

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
});

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { addAuditLog } = useSettings();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [collectorVisits, setCollectorVisits] = useState<CollectorVisit[]>([]);

  const activeCashShift = cashShifts.find(s => s.status === 'Abierta' && s.userId === currentUser?.id) || null;

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]); setBankAccounts([]); setCashShifts([]); setCollectorVisits([]);
      return;
    }

    const fetchData = async () => {
      try {
        const [trxRes, banksRes, shiftsRes, visitsRes] = await Promise.all([
          insforge.database.from('transactions').select('*').order('created_at', { ascending: false }),
          insforge.database.from('bank_accounts').select('*').order('created_at', { ascending: false }),
          insforge.database.from('cash_shifts').select('*').order('created_at', { ascending: false }),
          insforge.database.from('collector_visits').select('*').order('created_at', { ascending: false })
        ]);

        if (trxRes.data) setTransactions(trxRes.data.map(mapTransaction));
        if (banksRes.data) {
          setBankAccounts((banksRes.data as BankAccountDB[]).map((b) => ({
            id: b.id,
            bankName: b.bank_name || '',
            accountName: b.account_name || '',
            accountNumber: b.account_number || '',
            accountType: (b.account_type || 'Ahorro') as BankAccount['accountType'],
            currency: (b.currency || 'DOP') as BankAccount['currency'],
            status: (b.status || 'Activa') as BankAccount['status'],
            initialBalance: Number(b.initial_balance) || 0,
          })));
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
            id: v.id, collectorId: v.collector_id, collectorName: v.collector_name || '',
            clientId: v.client_id, clientName: v.client_name || '',
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
      // Fetch again to update state properly
      const { data } = await insforge.database.from('cash_shifts').select('*').order('created_at', { ascending: false });
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
      t.lender_id === currentUser?.id && t.date >= activeCashShift.openedAt.split('T')[0] && t.paymentMethod === 'Efectivo'
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
    const { error } = await insforge.database.from('transactions').insert([transaction]);
    if (error) addToast("Error al registrar transacción", 'error');
    else addToast("Transacción registrada", "success");
  };

  const addBankAccount = async (account: BankAccount) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('bank_accounts').insert([{
      lender_id: currentUser.id, bank_name: account.bankName, account_name: account.accountName,
      account_number: account.accountNumber, account_type: account.accountType,
      currency: account.currency, status: account.status, initial_balance: account.initialBalance
    }]);
    if (!error) {
       addToast("Cuenta bancaria agregada", "success");
       const { data } = await insforge.database.from('bank_accounts').select('*').order('created_at', { ascending: false });
       if(data) {
          setBankAccounts(data.map((b: any) => ({
            id: b.id, bankName: b.bank_name, accountName: b.account_name, accountNumber: b.account_number,
            accountType: b.account_type, currency: b.currency, status: b.status, initialBalance: b.initial_balance
          })));
       }
    }
  };

  const removeBankAccount = async (id: string) => {
    const { error } = await insforge.database.from('bank_accounts').delete().eq('id', id);
    if (!error) setBankAccounts(prev => prev.filter(b => b.id !== id));
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
      removeBankAccount, addCollectorVisit, getFinancialStats
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
