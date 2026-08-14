import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, CashShift, BankAccount, CollectorVisit, CustomPaymentMethod, BankDeposit, AccountingPeriod, LoanStatus } from '../../types';
import type { TransactionDB, CashShiftDB, BankAccountDB, CollectorVisitDB, BankDepositDB, AccountingPeriodDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { useLoans } from './LoanContext';
import { logger } from '../../utils/logger';
import { uploadToBucketHelper } from '../../utils/storage';

export interface ClosePeriodParams {
  periodType: 'Mensual' | 'Anual';
  year: number;
  month?: number;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  notes?: string;
}

interface AccountingContextType {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  paymentMethods: CustomPaymentMethod[];
  cashShifts: CashShift[];
  activeCashShift: CashShift | null;
  collectorVisits: CollectorVisit[];
  bankDeposits: BankDeposit[];
  isLoadingDeposits: boolean;
  
  // Period Locking & Closings
  accountingPeriods: AccountingPeriod[];
  lockedUntilDate: string | null;
  isDateInLockedPeriod: (dateStr: string) => { isLocked: boolean; reason?: string };
  setLockedUntilDate: (date: string | null) => Promise<void>;
  closeAccountingPeriod: (params: ClosePeriodParams) => Promise<void>;
  reopenAccountingPeriod: (periodId: string, reason: string) => Promise<void>;
  refreshAccountingPeriods: () => Promise<void>;
  
  openCashShift: (initialAmount: number, notes?: string) => void;
  closeCashShift: (finalCashCount: number, notes?: string) => void;
  getCashShiftSummary: () => { initialAmount: number; cashCollected: number; cashExpenses: number; expectedAmount: number };
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>, adjustLoanBalance?: boolean) => Promise<void>;
  deleteTransaction: (id: string, restoreLoanBalance?: boolean) => Promise<void>;
  addBankAccount: (account: BankAccount) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  removeBankAccount: (id: string) => void;
  processBankDeposit: (bankAccountId: string | undefined, amount: number) => void;
  processBankDisbursement: (bankAccountId: string | undefined, amount: number) => void;
  
  // Bank Deposits & Reconciliation Methods
  addBankDeposit: (deposit: Omit<BankDeposit, 'id'>, voucherFile?: File | string) => Promise<BankDeposit | void>;
  updateBankDeposit: (id: string, updates: Partial<BankDeposit>) => Promise<void>;
  deleteBankDeposit: (id: string) => Promise<void>;
  reconcileDepositWithLoan: (depositId: string, matchedData: { loanId: string; clientId?: string; receiptId?: string; transactionId?: string; reconciledBy?: string }) => Promise<void>;
  rejectBankDeposit: (depositId: string, notes?: string) => Promise<void>;
  refreshBankDeposits: () => Promise<void>;

  // Custom Payment Methods Management
  addPaymentMethod: (pm: CustomPaymentMethod) => void;
  updatePaymentMethod: (id: string, updates: Partial<CustomPaymentMethod>) => void;
  removePaymentMethod: (id: string) => void;
  togglePaymentMethodStatus: (id: string) => void;

  addCollectorVisit: (visit: Omit<CollectorVisit, 'id'>) => void;
  getFinancialStats: () => { balance: number; incomeToday: number; expenseToday: number };
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-efectivo-1',
    bankName: 'Caja Principal / Efectivo',
    accountType: 'Caja Chica / Efectivo',
    accountNumber: 'CAJA-001',
    accountName: 'Caja Principal (Efectivo)',
    currency: 'DOP',
    balance: 0,
    isActive: true,
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PAYMENT_METHODS: CustomPaymentMethod[] = [
  {
    id: 'pm-efectivo',
    name: 'Efectivo',
    category: 'Efectivo',
    description: 'Caja chica y cobro presencial en mano',
    requiresReference: false,
    isActive: true,
    isDefault: true
  },
  {
    id: 'pm-transferencia',
    name: 'Transferencia Bancaria',
    category: 'Transferencia',
    description: 'Banreservas, Popular, BHD, Scotiabank, Qik, APAP',
    requiresReference: true,
    isActive: true,
    isDefault: true
  },
  {
    id: 'pm-verifone',
    name: 'Verifone / POS',
    category: 'POS / Verifone',
    description: 'Terminal POS (CardNet, Azul, etc.) para cobro con tarjeta',
    requiresReference: true,
    isActive: true,
    isDefault: false
  },
  {
    id: 'pm-tarjeta',
    name: 'Tarjeta de Crédito / Débito',
    category: 'Pasarela Digital',
    description: 'Voucher o pasarela digital de tarjetas',
    requiresReference: true,
    isActive: true,
    isDefault: false
  },
  {
    id: 'pm-cheque',
    name: 'Cheque',
    category: 'Cheque',
    description: 'Cheque de gerencia o personal depositado',
    requiresReference: true,
    isActive: true,
    isDefault: false
  }
];

const mapTransaction = (t: TransactionDB): Transaction => ({
  id: t.id,
  type: t.type as Transaction['type'],
  category: t.category,
  amount: t.amount,
  date: t.date,
  description: t.description,
  referenceId: t.referenceid || t.reference_id || undefined,
  paymentType: (t.paymenttype || t.payment_type || undefined) as Transaction['paymentType'],
  paymentMethod: (t.paymentmethod || t.payment_method || 'Efectivo') as Transaction['paymentMethod'],
  invoiceDate: t.invoicedate || t.invoice_date || undefined,
  bankAccountId: t.bank_account_id || undefined,
  proofUrl: t.proof_url || undefined,
});

const mapBankDeposit = (d: BankDepositDB): BankDeposit => ({
  id: d.id,
  lenderId: d.lender_id,
  bankName: d.bank_name,
  bankAccountId: d.bank_account_id || undefined,
  referenceNumber: d.reference_number,
  amount: Number(d.amount) || 0,
  currency: (d.currency || 'DOP') as BankDeposit['currency'],
  senderName: d.sender_name || undefined,
  depositDate: d.deposit_date,
  voucherUrl: d.voucher_url || undefined,
  notes: d.notes || undefined,
  status: (d.status || 'Pendiente') as BankDeposit['status'],
  matchedLoanId: d.matched_loan_id || undefined,
  matchedClientId: d.matched_client_id || undefined,
  matchedReceiptId: d.matched_receipt_id || undefined,
  matchedTransactionId: d.matched_transaction_id || undefined,
  reconciledAt: d.reconciled_at || undefined,
  reconciledBy: d.reconciled_by || undefined,
  createdAt: d.created_at || undefined,
});

const mapAccountingPeriod = (p: AccountingPeriodDB): AccountingPeriod => ({
  id: p.id,
  lenderId: p.lender_id,
  periodType: (p.period_type || 'Mensual') as AccountingPeriod['periodType'],
  year: p.year,
  month: p.month || undefined,
  startDate: p.start_date,
  endDate: p.end_date,
  status: (p.status || 'Cerrado') as AccountingPeriod['status'],
  totalIncome: Number(p.total_income) || 0,
  totalExpense: Number(p.total_expense) || 0,
  netIncome: Number(p.net_income) || 0,
  closingEntryId: p.closing_entry_id || undefined,
  closedAt: p.closed_at || undefined,
  closedBy: p.closed_by || undefined,
  reopenedAt: p.reopened_at || undefined,
  reopenedBy: p.reopened_by || undefined,
  reopenReason: p.reopen_reason || undefined,
  notes: p.notes || undefined,
  createdAt: p.created_at || new Date().toISOString()
});

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { addAuditLog } = useSettings();
  const { updateLoan } = useLoans();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANK_ACCOUNTS);
  const [paymentMethods, setPaymentMethods] = useState<CustomPaymentMethod[]>(() => {
    const saved = localStorage.getItem('um_payment_methods');
    return saved ? JSON.parse(saved) : DEFAULT_PAYMENT_METHODS;
  });
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [collectorVisits, setCollectorVisits] = useState<CollectorVisit[]>([]);
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>([]);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false);

  // Period Locking State
  const [accountingPeriods, setAccountingPeriods] = useState<AccountingPeriod[]>([]);
  const [lockedUntilDate, setLockedUntilDateState] = useState<string | null>(null);

  const activeCashShift = cashShifts.find(s => s.status === 'Abierta' && s.userId === currentUser?.id) || null;

  // Check if a given date falls within a closed/locked period
  const isDateInLockedPeriod = (dateStr: string): { isLocked: boolean; reason?: string } => {
    if (!dateStr) return { isLocked: false };
    const targetDate = dateStr.split('T')[0];

    // 1. Check global locked_until_date
    if (lockedUntilDate && targetDate <= lockedUntilDate) {
      return {
        isLocked: true,
        reason: `Los libros contables se encuentran cerrados y auditados hasta el ${lockedUntilDate}. No es posible registrar ni modificar transacciones con fecha igual o anterior al cierre.`
      };
    }

    // 2. Check active closed periods
    const closedPeriod = accountingPeriods.find(
      p => p.status === 'Cerrado' && targetDate >= p.startDate && targetDate <= p.endDate
    );
    if (closedPeriod) {
      return {
        isLocked: true,
        reason: `El período contable ${closedPeriod.periodType === 'Anual' ? `Año ${closedPeriod.year}` : `Mes ${closedPeriod.month}/${closedPeriod.year}`} (${closedPeriod.startDate} al ${closedPeriod.endDate}) se encuentra cerrado y auditado.`
      };
    }

    return { isLocked: false };
  };

  const refreshAccountingPeriods = async () => {
    if (!currentUser) { setAccountingPeriods([]); setLockedUntilDateState(null); return; }
    try {
      const [periodsRes, settingsRes] = await Promise.all([
        insforge.database
          .from('accounting_periods')
          .select('*')
          .eq('lender_id', currentUser.id)
          .order('start_date', { ascending: false }),
        insforge.database
          .from('company_settings')
          .select('locked_until_date')
          .eq('lender_id', currentUser.id)
          .maybeSingle()
      ]);

      if (periodsRes.data) {
        setAccountingPeriods((periodsRes.data as AccountingPeriodDB[]).map(mapAccountingPeriod));
      }
      if (settingsRes.data && settingsRes.data.locked_until_date) {
        setLockedUntilDateState(settingsRes.data.locked_until_date);
      }
    } catch (err) {
      logger.error('Error fetching accounting periods:', err);
    }
  };

  const refreshBankDeposits = async () => {
    if (!currentUser) { setBankDeposits([]); return; }
    setIsLoadingDeposits(true);
    try {
      const { data, error } = await insforge.database
        .from('bank_deposits')
        .select('*')
        .eq('lender_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (data && !error) {
        setBankDeposits((data as BankDepositDB[]).map(mapBankDeposit));
      }
    } catch (err) {
      logger.error('Error fetching bank deposits:', err);
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]); setBankAccounts(DEFAULT_BANK_ACCOUNTS); setCashShifts([]); setCollectorVisits([]); setAccountingPeriods([]); setLockedUntilDateState(null);
      return;
    }

    const fetchData = async () => {
      try {
        const [trxRes, banksRes, shiftsRes, visitsRes, depositsRes, periodsRes, settingsRes] = await Promise.all([
          insforge.database.from('transactions').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('bank_accounts').select('*').or(`lender_id.eq.${currentUser.id},lender_id.is.null`).order('created_at', { ascending: false }),
          insforge.database.from('cash_shifts').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('collector_visits').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('bank_deposits').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('accounting_periods').select('*').eq('lender_id', currentUser.id).order('start_date', { ascending: false }),
          insforge.database.from('company_settings').select('locked_until_date').eq('lender_id', currentUser.id).maybeSingle()
        ]);

        if (trxRes.data) setTransactions(trxRes.data.map(mapTransaction));
        if (periodsRes.data) setAccountingPeriods((periodsRes.data as AccountingPeriodDB[]).map(mapAccountingPeriod));
        if (settingsRes.data && settingsRes.data.locked_until_date) setLockedUntilDateState(settingsRes.data.locked_until_date);

        if (banksRes.data && banksRes.data.length > 0) {
          setBankAccounts((banksRes.data as BankAccountDB[]).map((b) => ({
            id: b.id,
            bankName: b.bank_name || b.bankname || '',
            accountName: b.account_name || b.accountname || '',
            accountNumber: b.account_number || b.accountnumber || '',
            accountType: (b.account_type || b.accounttype || 'Ahorro') as BankAccount['accountType'],
            currency: (b.currency || 'DOP') as BankAccount['currency'],
            balance: Number(b.initial_balance || b.initialbalance || b.balance) || 0,
            isActive: b.status === 'Activa',
            holderName: b.holder_name || b.holdername || '',
            cedulaOrRnc: b.cedula_or_rnc || '',
            showInPaymentLink: b.show_in_payment_link !== false,
            bankLogoUrl: b.bank_logo_url || ''
          })));
        } else {
          void (async () => {
            await insforge.database.from('bank_accounts').insert([{
              lender_id: currentUser.id,
              bank_name: DEFAULT_BANK_ACCOUNTS[0].bankName,
              account_name: DEFAULT_BANK_ACCOUNTS[0].accountName,
              holder_name: DEFAULT_BANK_ACCOUNTS[0].accountName,
              account_number: DEFAULT_BANK_ACCOUNTS[0].accountNumber,
              account_type: DEFAULT_BANK_ACCOUNTS[0].accountType,
              currency: 'DOP',
              status: 'Activa',
              initial_balance: 0,
              show_in_payment_link: false
            }]);
          })();
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
        if (depositsRes.data) {
          setBankDeposits((depositsRes.data as BankDepositDB[]).map(mapBankDeposit));
        }
      } catch (error) {
        logger.error("Error fetching accounting data:", error);
      }
    };
    fetchData();
  }, [currentUser]);

  // Set / Update global locked until date
  const setLockedUntilDate = async (date: string | null) => {
    if (!currentUser) return;
    try {
      await insforge.database
        .from('company_settings')
        .update({ locked_until_date: date })
        .eq('lender_id', currentUser.id);

      setLockedUntilDateState(date);
      addAuditLog('period_lock_updated', date ? `Fijó bloqueo de períodos contables hasta el ${date}` : 'Desactivó bloqueo de períodos contables');
      addToast(date ? `Libros contables bloqueados hasta el ${date}` : 'Bloqueo contable desactivado', 'success');
    } catch (err) {
      logger.error('Error updating locked_until_date:', err);
      addToast('Error al actualizar bloqueo contable', 'error');
    }
  };

  // Close an Accounting Period (Monthly / Annual) and generate closing entry
  const closeAccountingPeriod = async (params: ClosePeriodParams) => {
    if (!currentUser) return;
    const periodId = `period-${params.periodType.toLowerCase()}-${params.year}${params.month ? `-${params.month}` : ''}-${Date.now()}`;
    const closingTxId = `TX-CIERRE-${params.year}${params.month ? `-${params.month}` : ''}-${Date.now()}`;

    try {
      // 1. Insert Period Record in accounting_periods
      const { data: insertedPeriod, error: periodErr } = await insforge.database
        .from('accounting_periods')
        .insert([{
          id: periodId,
          lender_id: currentUser.id,
          period_type: params.periodType,
          year: params.year,
          month: params.month || null,
          start_date: params.startDate,
          end_date: params.endDate,
          status: 'Cerrado',
          total_income: params.totalIncome,
          total_expense: params.totalExpense,
          net_income: params.netIncome,
          closing_entry_id: closingTxId,
          closed_at: new Date().toISOString(),
          closed_by: currentUser.name || currentUser.email || 'Administrador',
          notes: params.notes || null
        }])
        .select()
        .single();

      if (periodErr) {
        logger.error('Error inserting accounting_period:', periodErr);
        addToast(`Error al registrar cierre: ${periodErr.message}`, 'error');
        return;
      }

      // 2. Generate closing transaction / equity adjustment record
      const closingTx: Transaction = {
        id: closingTxId,
        type: params.netIncome >= 0 ? 'Ingreso' : 'Gasto',
        category: 'Cierre de Ejercicio Contable',
        amount: Math.abs(params.netIncome),
        date: params.endDate,
        description: `Asiento Automático de Cierre (${params.periodType} ${params.year}${params.month ? `-${params.month}` : ''}) -> Traslado a Utilidades Acumuladas / Patrimonio Neto`,
        paymentType: 'Capital',
        paymentMethod: 'Transferencia'
      };

      await insforge.database.from('transactions').insert([{
        id: closingTx.id,
        lender_id: currentUser.id,
        type: closingTx.type,
        category: closingTx.category,
        amount: closingTx.amount,
        date: closingTx.date,
        description: closingTx.description,
        payment_type: closingTx.paymentType,
        payment_method: closingTx.paymentMethod
      }]);

      // 3. Extend global locked_until_date to period endDate if needed
      if (!lockedUntilDate || params.endDate > lockedUntilDate) {
        await insforge.database
          .from('company_settings')
          .update({ locked_until_date: params.endDate })
          .eq('lender_id', currentUser.id);
        setLockedUntilDateState(params.endDate);
      }

      if (insertedPeriod) {
        setAccountingPeriods(prev => [mapAccountingPeriod(insertedPeriod as AccountingPeriodDB), ...prev]);
      }
      setTransactions(prev => [closingTx, ...prev]);

      addAuditLog('accounting_period_closed', `Cerró el período contable ${params.periodType} ${params.year} con resultado neto de RD$ ${params.netIncome.toLocaleString()}`);
      addToast(`Período ${params.periodType} ${params.year} cerrado y bloqueado con éxito`, 'success');
    } catch (err) {
      logger.error('Error closing accounting period:', err);
      addToast('Error al procesar el cierre contable', 'error');
    }
  };

  // Reopen a closed accounting period
  const reopenAccountingPeriod = async (periodId: string, reason: string) => {
    if (!currentUser) return;
    const targetPeriod = accountingPeriods.find(p => p.id === periodId);
    if (!targetPeriod) return;

    try {
      const { error } = await insforge.database
        .from('accounting_periods')
        .update({
          status: 'Abierto',
          reopened_at: new Date().toISOString(),
          reopened_by: currentUser.name || currentUser.email || 'Administrador',
          reopen_reason: reason
        })
        .eq('id', periodId)
        .eq('lender_id', currentUser.id);

      if (!error) {
        setAccountingPeriods(prev => prev.map(p => p.id === periodId ? {
          ...p,
          status: 'Abierto',
          reopenedAt: new Date().toISOString(),
          reopenedBy: currentUser.name || currentUser.email || 'Administrador',
          reopenReason: reason
        } : p));

        addAuditLog('accounting_period_reopened', `Reabrió el período contable ${targetPeriod.periodType} ${targetPeriod.year}. Motivo: ${reason}`);
        addToast(`Período ${targetPeriod.periodType} ${targetPeriod.year} reabierto`, 'info');
      } else {
        addToast(`Error al reabrir período: ${error.message}`, 'error');
      }
    } catch (err) {
      logger.error('Error reopening accounting period:', err);
      addToast('Error al reabrir período', 'error');
    }
  };

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
    const shiftStart = new Date(activeCashShift.openedAt).getTime();
    
    const shiftTransactions = transactions.filter(t => {
      const tTime = new Date(t.date).getTime();
      return tTime >= shiftStart && (t.paymentMethod === 'Efectivo' || !t.paymentMethod);
    });

    const cashCollected = shiftTransactions
      .filter(t => t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashExpenses = shiftTransactions
      .filter(t => t.type === 'Gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedAmount = activeCashShift.initialAmount + cashCollected - cashExpenses;

    return {
      initialAmount: activeCashShift.initialAmount,
      cashCollected,
      cashExpenses,
      expectedAmount
    };
  };

  const closeCashShift = async (finalCashCount: number, notes?: string) => {
    if (!activeCashShift) { addToast("No hay una caja abierta para cerrar", 'error'); return; }
    const summary = getCashShiftSummary();
    const difference = finalCashCount - summary.expectedAmount;

    let combinedNotes = notes || '';
    if (difference !== 0) {
      const diffText = `[Descuadre de RD$ ${difference > 0 ? '+' : ''}${difference.toLocaleString()}]`;
      combinedNotes = combinedNotes ? `${diffText} ${combinedNotes}` : diffText;
    }

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

    // Check if date is in locked period
    const lockCheck = isDateInLockedPeriod(transaction.date);
    if (lockCheck.isLocked) {
      addToast(lockCheck.reason || "Período contable cerrado y auditado", 'error');
      return;
    }

    const payload = { ...transaction, lender_id: currentUser.id };
    const { error } = await insforge.database.from('transactions').insert([payload]);
    if (error) {
      addToast("Error al registrar transacción", 'error');
    } else {
      addToast("Transacción registrada", "success");
      // Refresh transactions state so UI updates without full page reload
      const { data } = await insforge.database
        .from('transactions')
        .select('*')
        .eq('lender_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (data) setTransactions((data as TransactionDB[]).map(mapTransaction));
    }
  };

  const updateTransaction = async (
    id: string, 
    updates: Partial<Transaction>,
    adjustLoanBalance = true
  ) => {
    if (!currentUser) return;
    
    // Check if date is in locked period
    if (updates.date) {
      const lockCheck = isDateInLockedPeriod(updates.date);
      if (lockCheck.isLocked) {
        addToast(lockCheck.reason || "Período contable cerrado y auditado", 'error');
        return;
      }
    }

    const currentTx = transactions.find(t => t.id === id);
    if (!currentTx) {
      addToast("Transacción no encontrada", 'error');
      return;
    }

    // Convert camelCase updates to database fields
    const dbPayload: Partial<TransactionDB> = {};
    if (updates.type !== undefined) dbPayload.type = updates.type;
    if (updates.category !== undefined) dbPayload.category = updates.category;
    if (updates.amount !== undefined) dbPayload.amount = Number(updates.amount);
    if (updates.date !== undefined) dbPayload.date = updates.date;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.paymentType !== undefined) {
      dbPayload.paymenttype = updates.paymentType;
      dbPayload.payment_type = updates.paymentType;
    }
    if (updates.paymentMethod !== undefined) {
      dbPayload.paymentmethod = updates.paymentMethod;
      dbPayload.payment_method = updates.paymentMethod;
    }
    if (updates.bankAccountId !== undefined) dbPayload.bank_account_id = updates.bankAccountId || undefined;
    if (updates.proofUrl !== undefined) dbPayload.proof_url = updates.proofUrl || undefined;
    if (updates.referenceId !== undefined) {
      dbPayload.referenceid = updates.referenceId || undefined;
      dbPayload.reference_id = updates.referenceId || undefined;
    }

    // If amount changed and transaction is linked to a loan and is an income (payment)
    const targetLoanId = updates.referenceId || currentTx.referenceId;
    if (adjustLoanBalance && targetLoanId && (currentTx.type === 'Ingreso' || updates.type === 'Ingreso')) {
      const oldAmount = Number(currentTx.amount) || 0;
      const newAmount = updates.amount !== undefined ? Number(updates.amount) : oldAmount;
      const diff = newAmount - oldAmount; // positive means more paid, negative means less paid

      if (diff !== 0) {
        const { data: loanData } = await insforge.database
          .from('loans')
          .select('id, remainingbalance, status, totaltopay')
          .eq('id', targetLoanId)
          .eq('lender_id', currentUser.id)
          .maybeSingle();

        if (loanData) {
          const currentBal = Number(loanData.remainingbalance ?? 0);
          const newBal = Math.max(0, currentBal - diff);
          const newStatus = newBal === 0 ? LoanStatus.PAID : LoanStatus.ACTIVE;

          await insforge.database
            .from('loans')
            .update({ remainingbalance: newBal, status: newStatus })
            .eq('id', targetLoanId)
            .eq('lender_id', currentUser.id);

          if (updateLoan) {
            updateLoan(targetLoanId, { remainingBalance: newBal, status: newStatus });
          }
        }
      }
    }

    const { error } = await insforge.database
      .from('transactions')
      .update(dbPayload)
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (error) {
      addToast("Error al actualizar la transacción", 'error');
    } else {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      addAuditLog('transaction_updated', `Actualizó transacción #${id} (Monto: RD$ ${updates.amount ?? currentTx.amount})`);
      addToast("Pago / Transacción actualizado correctamente", 'success');
    }
  };

  const deleteTransaction = async (id: string, restoreLoanBalance = true) => {
    if (!currentUser) return;

    const currentTx = transactions.find(t => t.id === id);
    if (!currentTx) {
      addToast("Transacción no encontrada", 'error');
      return;
    }

    if (currentTx.date) {
      const lockCheck = isDateInLockedPeriod(currentTx.date);
      if (lockCheck.isLocked) {
        addToast(lockCheck.reason || "Período contable cerrado y auditado", 'error');
        return;
      }
    }

    // If transaction is linked to a loan and is an income (payment), restore the balance
    if (restoreLoanBalance && currentTx.referenceId && currentTx.type === 'Ingreso') {
      const amountToRestore = Number(currentTx.amount) || 0;
      if (amountToRestore > 0) {
        const { data: loanData } = await insforge.database
          .from('loans')
          .select('id, remainingbalance, status, totaltopay')
          .eq('id', currentTx.referenceId)
          .eq('lender_id', currentUser.id)
          .maybeSingle();

        if (loanData) {
          const currentBal = Number(loanData.remainingbalance ?? 0);
          const newBal = currentBal + amountToRestore;
          const newStatus = newBal > 0 ? LoanStatus.ACTIVE : LoanStatus.PAID;

          await insforge.database
            .from('loans')
            .update({ remainingbalance: newBal, status: newStatus })
            .eq('id', currentTx.referenceId)
            .eq('lender_id', currentUser.id);

          if (updateLoan) {
            updateLoan(currentTx.referenceId, { remainingBalance: newBal, status: newStatus });
          }
        }
      }
    }

    const { error } = await insforge.database
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (error) {
      addToast("Error al eliminar transacción", 'error');
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id));
      addAuditLog('transaction_deleted', `Eliminó/Anuló transacción #${id} por RD$ ${currentTx.amount}`);
      addToast("Pago anulado y eliminado exitosamente", 'success');
    }
  };

  const addBankAccount = async (account: BankAccount) => {
    const insertPayload = {
      lender_id: currentUser?.id || null, 
      bank_name: account.bankName || 'Cuenta Financiera', 
      account_name: account.accountName || account.bankName || 'Cuenta Principal',
      holder_name: account.holderName || account.accountName || '',
      account_number: account.accountNumber || 'S/N', 
      account_type: account.accountType || 'Corriente',
      currency: account.currency || 'DOP', 
      status: account.isActive ? 'Activa' : 'Inactiva', 
      initial_balance: account.balance || 0,
      cedula_or_rnc: account.cedulaOrRnc || '',
      show_in_payment_link: account.showInPaymentLink !== false,
      bank_logo_url: account.bankLogoUrl || ''
    };

    const { data, error } = await insforge.database.from('bank_accounts').insert([insertPayload]).select('*');

    if (!error && data && data.length > 0) {
      const inserted = data[0] as BankAccountDB;
      const realAccount: BankAccount = {
        id: inserted.id,
        bankName: inserted.bank_name || account.bankName,
        accountName: inserted.account_name || account.accountName,
        holderName: inserted.holder_name || account.holderName,
        accountNumber: inserted.account_number || account.accountNumber,
        accountType: (inserted.account_type || account.accountType) as BankAccount['accountType'],
        currency: (inserted.currency || account.currency || 'DOP') as BankAccount['currency'],
        balance: Number(inserted.initial_balance) || account.balance || 0,
        isActive: inserted.status === 'Activa',
        createdAt: inserted.created_at || new Date().toISOString(),
        cedulaOrRnc: inserted.cedula_or_rnc || '',
        showInPaymentLink: inserted.show_in_payment_link !== false,
        bankLogoUrl: inserted.bank_logo_url || ''
      };
      setBankAccounts(prev => [...prev, realAccount]);
      addAuditLog('bank_account_created', `Creó la cuenta ${account.bankName} - ${account.accountNumber}`);
      addToast("Cuenta bancaria agregada exitosamente", 'success');
    } else {
      addToast("Error al guardar cuenta bancaria en base de datos", 'error');
    }
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    const dbPayload: Partial<BankAccountDB> = {};
    if (updates.bankName !== undefined) dbPayload.bank_name = updates.bankName;
    if (updates.accountName !== undefined) dbPayload.account_name = updates.accountName;
    if (updates.accountNumber !== undefined) dbPayload.account_number = updates.accountNumber;
    if (updates.accountType !== undefined) dbPayload.account_type = updates.accountType;
    if (updates.currency !== undefined) dbPayload.currency = updates.currency;
    if (updates.balance !== undefined) dbPayload.initial_balance = updates.balance;
    if (updates.isActive !== undefined) dbPayload.status = updates.isActive ? 'Activa' : 'Inactiva';
    if (updates.holderName !== undefined) dbPayload.holder_name = updates.holderName;
    if (updates.cedulaOrRnc !== undefined) dbPayload.cedula_or_rnc = updates.cedulaOrRnc;
    if (updates.showInPaymentLink !== undefined) dbPayload.show_in_payment_link = updates.showInPaymentLink;
    if (updates.bankLogoUrl !== undefined) dbPayload.bank_logo_url = updates.bankLogoUrl;

    const { error } = await insforge.database
      .from('bank_accounts')
      .update(dbPayload)
      .eq('id', id);

    if (!error) {
      setBankAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
      addToast("Cuenta bancaria actualizada", 'success');
    } else {
      addToast("Error al actualizar cuenta bancaria", 'error');
    }
  };

  const removeBankAccount = async (id: string) => {
    const { error } = await insforge.database
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (!error) {
      setBankAccounts(prev => prev.filter(acc => acc.id !== id));
      addToast("Cuenta bancaria eliminada", 'success');
    } else {
      addToast("Error al eliminar cuenta bancaria", 'error');
    }
  };

  const processBankDeposit = (bankAccountId: string | undefined, amount: number) => {
    if (!bankAccountId) return;
    setBankAccounts(prev => prev.map(acc => {
      if (acc.id === bankAccountId) {
        const newBal = (acc.balance || 0) + amount;
        void (async () => {
          await insforge.database.from('bank_accounts').update({ initial_balance: newBal }).eq('id', bankAccountId);
        })();
        return { ...acc, balance: newBal };
      }
      return acc;
    }));
  };

  const processBankDisbursement = (bankAccountId: string | undefined, amount: number) => {
    if (!bankAccountId) return;
    setBankAccounts(prev => prev.map(acc => {
      if (acc.id === bankAccountId) {
        const newBal = (acc.balance || 0) - amount;
        void (async () => {
          await insforge.database.from('bank_accounts').update({ initial_balance: newBal }).eq('id', bankAccountId);
        })();
        return { ...acc, balance: newBal };
      }
      return acc;
    }));
  };

  const addBankDeposit = async (deposit: Omit<BankDeposit, 'id'>, voucherFile?: File | string): Promise<BankDeposit | void> => {
    if (!currentUser) return;
    try {
      let finalVoucherUrl = deposit.voucherUrl || null;
      if (voucherFile) {
        if (typeof voucherFile === 'string' && voucherFile.startsWith('data:')) {
          const uploaded = await uploadToBucketHelper(voucherFile, 'bank-vouchers', 'receipts');
          if (uploaded) finalVoucherUrl = uploaded;
        } else if (typeof voucherFile !== 'string') {
          const ext = voucherFile.name.split('.').pop() || 'jpg';
          const path = `deposits/${currentUser.id}_${Date.now()}.${ext}`;
          const { error: upErr } = await insforge.storage.from('bank-vouchers').upload(path, voucherFile);
          if (!upErr) {
            const { data } = insforge.storage.from('bank-vouchers').getPublicUrl(path);
            finalVoucherUrl = data.publicUrl;
          }
        }
      }

      const payload = {
        lender_id: currentUser.id,
        bank_name: deposit.bankName,
        bank_account_id: deposit.bankAccountId || null,
        reference_number: deposit.referenceNumber,
        amount: deposit.amount,
        currency: deposit.currency || 'DOP',
        sender_name: deposit.senderName || null,
        deposit_date: deposit.depositDate || new Date().toISOString().split('T')[0],
        voucher_url: finalVoucherUrl,
        notes: deposit.notes || null,
        status: deposit.status || 'Pendiente'
      };

      const { data, error } = await insforge.database
        .from('bank_deposits')
        .insert([payload])
        .select()
        .single();

      if (error) {
        logger.error('Error inserting bank_deposit:', error);
        addToast(`Error al registrar depósito: ${error.message}`, 'error');
        return;
      }

      const newDeposit = mapBankDeposit(data as BankDepositDB);
      setBankDeposits(prev => [newDeposit, ...prev]);
      addAuditLog('bank_deposit_created', `Registró depósito bancario de RD$ ${deposit.amount.toLocaleString()} en ${deposit.bankName} Ref: ${deposit.referenceNumber}`);
      addToast('Depósito bancario registrado exitosamente', 'success');
      return newDeposit;
    } catch (err) {
      logger.error('Error in addBankDeposit:', err);
      addToast('Error inesperado al guardar depósito', 'error');
    }
  };

  const updateBankDeposit = async (id: string, updates: Partial<BankDeposit>) => {
    if (!currentUser) return;
    try {
      const dbPayload: Partial<BankDepositDB> = {};
      if (updates.bankName !== undefined) dbPayload.bank_name = updates.bankName;
      if (updates.referenceNumber !== undefined) dbPayload.reference_number = updates.referenceNumber;
      if (updates.amount !== undefined) dbPayload.amount = updates.amount;
      if (updates.senderName !== undefined) dbPayload.sender_name = updates.senderName;
      if (updates.notes !== undefined) dbPayload.notes = updates.notes;
      if (updates.status !== undefined) dbPayload.status = updates.status;

      const { error } = await insforge.database
        .from('bank_deposits')
        .update(dbPayload)
        .eq('id', id)
        .eq('lender_id', currentUser.id);

      if (!error) {
        setBankDeposits(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
        addToast('Depósito actualizado', 'success');
      } else {
        addToast('Error al actualizar depósito', 'error');
      }
    } catch (err) {
      logger.error('Error in updateBankDeposit:', err);
    }
  };

  const deleteBankDeposit = async (id: string) => {
    if (!currentUser) return;
    try {
      const { error } = await insforge.database
        .from('bank_deposits')
        .delete()
        .eq('id', id)
        .eq('lender_id', currentUser.id);

      if (!error) {
        setBankDeposits(prev => prev.filter(d => d.id !== id));
        addToast('Depósito eliminado', 'success');
      } else {
        addToast('Error al eliminar depósito', 'error');
      }
    } catch (err) {
      logger.error('Error in deleteBankDeposit:', err);
    }
  };

  const reconcileDepositWithLoan = async (
    depositId: string, 
    matchedData: { loanId: string; clientId?: string; receiptId?: string; transactionId?: string; reconciledBy?: string }
  ) => {
    if (!currentUser) return;
    try {
      const reconciledAt = new Date().toISOString();
      const reconciledBy = matchedData.reconciledBy || currentUser.name || currentUser.email || 'Sistema';

      const { error } = await insforge.database
        .from('bank_deposits')
        .update({
          status: 'Conciliado',
          matched_loan_id: matchedData.loanId,
          matched_client_id: matchedData.clientId || null,
          matched_receipt_id: matchedData.receiptId || null,
          matched_transaction_id: matchedData.transactionId || null,
          reconciled_at: reconciledAt,
          reconciled_by: reconciledBy
        })
        .eq('id', depositId)
        .eq('lender_id', currentUser.id);

      if (!error) {
        setBankDeposits(prev => prev.map(d => d.id === depositId ? {
          ...d,
          status: 'Conciliado',
          matchedLoanId: matchedData.loanId,
          matchedClientId: matchedData.clientId,
          matchedReceiptId: matchedData.receiptId,
          matchedTransactionId: matchedData.transactionId,
          reconciledAt,
          reconciledBy
        } : d));

        addAuditLog('bank_deposit_reconciled', `Concilió depósito ID #${depositId.slice(-6)} con el Préstamo #${matchedData.loanId}`);
        addToast('Depósito conciliado exitosamente', 'success');
      } else {
        addToast('Error al conciliar depósito', 'error');
      }
    } catch (err) {
      logger.error('Error reconciling deposit:', err);
      addToast('Error en la conciliación', 'error');
    }
  };

  const rejectBankDeposit = async (depositId: string, notes?: string) => {
    if (!currentUser) return;
    try {
      const current = bankDeposits.find(d => d.id === depositId);
      const updatedNotes = notes ? (current?.notes ? `${current.notes} | ${notes}` : notes) : current?.notes;

      await insforge.database
        .from('bank_deposits')
        .update({
          status: 'Rechazado',
          notes: updatedNotes || null
        })
        .eq('id', depositId)
        .eq('lender_id', currentUser.id);

      setBankDeposits(prev => prev.map(d => d.id === depositId ? { ...d, status: 'Rechazado', notes: updatedNotes } : d));
      addAuditLog('bank_deposit_rejected', `Rechazó depósito bancario ID #${depositId.slice(-6)}`);
      addToast('Depósito marcado como rechazado', 'info');
    } catch (err) {
      logger.error('Error rejecting deposit:', err);
      addToast('Error al rechazar depósito', 'error');
    }
  };

  const addPaymentMethod = (pm: CustomPaymentMethod) => {
    const updated = [...paymentMethods, pm];
    setPaymentMethods(updated);
    localStorage.setItem('um_payment_methods', JSON.stringify(updated));
    addToast("Método de pago agregado", 'success');
  };

  const updatePaymentMethod = (id: string, updates: Partial<CustomPaymentMethod>) => {
    const updated = paymentMethods.map(pm => pm.id === id ? { ...pm, ...updates } : pm);
    setPaymentMethods(updated);
    localStorage.setItem('um_payment_methods', JSON.stringify(updated));
    addToast("Método de pago actualizado", 'success');
  };

  const removePaymentMethod = (id: string) => {
    const updated = paymentMethods.filter(pm => pm.id !== id);
    setPaymentMethods(updated);
    localStorage.setItem('um_payment_methods', JSON.stringify(updated));
    addToast("Método de pago eliminado", 'success');
  };

  const togglePaymentMethodStatus = (id: string) => {
    const updated = paymentMethods.map(pm => pm.id === id ? { ...pm, isActive: !pm.isActive } : pm);
    setPaymentMethods(updated);
    localStorage.setItem('um_payment_methods', JSON.stringify(updated));
  };

  const addCollectorVisit = async (visit: Omit<CollectorVisit, 'id'>) => {
    if (!currentUser) return;
    const { data, error } = await insforge.database.from('collector_visits').insert([{
      lender_id: currentUser.id,
      collector_id: visit.collectorId,
      client_id: visit.clientId,
      loan_id: visit.loanId,
      date: visit.date,
      status: visit.status,
      promised_date: visit.promisedDate,
      amount_collected: visit.amountCollected,
      notes: visit.notes,
      location: visit.location || visit.coordinates
    }]).select();

    if (!error && data && data[0]) {
      setCollectorVisits([...collectorVisits, {
        id: data[0].id,
        collectorId: data[0].collector_id,
        clientId: data[0].client_id,
        loanId: data[0].loan_id,
        date: data[0].date,
        status: data[0].status,
        promisedDate: data[0].promised_date,
        amountCollected: data[0].amount_collected,
        notes: data[0].notes,
        location: data[0].location
      }]);
    }
  };

  const getFinancialStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const balance = transactions.reduce((acc, curr) => {
      return curr.type === 'Ingreso' ? acc + curr.amount : acc - curr.amount;
    }, 0);

    const incomeToday = transactions
      .filter(t => t.date === today && t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseToday = transactions
      .filter(t => t.date === today && t.type === 'Gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    return { balance, incomeToday, expenseToday };
  };

  return (
    <AccountingContext.Provider value={{
      transactions, bankAccounts, paymentMethods, cashShifts, activeCashShift, collectorVisits,
      bankDeposits, isLoadingDeposits,
      accountingPeriods, lockedUntilDate, isDateInLockedPeriod, setLockedUntilDate,
      closeAccountingPeriod, reopenAccountingPeriod, refreshAccountingPeriods,
      openCashShift, closeCashShift, getCashShiftSummary, addTransaction, updateTransaction, deleteTransaction, addBankAccount,
      updateBankAccount, removeBankAccount, processBankDeposit, processBankDisbursement,
      addBankDeposit, updateBankDeposit, deleteBankDeposit, reconcileDepositWithLoan, rejectBankDeposit, refreshBankDeposits,
      addPaymentMethod, updatePaymentMethod, removePaymentMethod, togglePaymentMethodStatus,
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
