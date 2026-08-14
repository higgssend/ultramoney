import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, CashShift, BankAccount, CollectorVisit, CustomPaymentMethod, BankDeposit } from '../../types';
import type { TransactionDB, CashShiftDB, BankAccountDB, CollectorVisitDB, BankDepositDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { logger } from '../../utils/logger';
import { uploadToBucketHelper } from '../../utils/storage';

interface AccountingContextType {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  paymentMethods: CustomPaymentMethod[];
  cashShifts: CashShift[];
  activeCashShift: CashShift | null;
  collectorVisits: CollectorVisit[];
  bankDeposits: BankDeposit[];
  isLoadingDeposits: boolean;
  
  openCashShift: (initialAmount: number, notes?: string) => void;
  closeCashShift: (finalCashCount: number, notes?: string) => void;
  getCashShiftSummary: () => { initialAmount: number; cashCollected: number; cashExpenses: number; expectedAmount: number };
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
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
    isDefault: true
  },
  {
    id: 'pm-cheque',
    name: 'Cheque',
    category: 'Cheque',
    description: 'Cheques de gerencia o comerciales',
    requiresReference: true,
    isActive: true,
    isDefault: true
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

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { addAuditLog } = useSettings();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANK_ACCOUNTS);
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [collectorVisits, setCollectorVisits] = useState<CollectorVisit[]>([]);
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>([]);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false);

  const activeCashShift = cashShifts.find(s => s.status === 'Abierta' && s.userId === currentUser?.id) || null;

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
      setTransactions([]); setBankAccounts(DEFAULT_BANK_ACCOUNTS); setCashShifts([]); setCollectorVisits([]);
      return;
    }

    const fetchData = async () => {
      try {
        const [trxRes, banksRes, shiftsRes, visitsRes, depositsRes] = await Promise.all([
          insforge.database.from('transactions').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('bank_accounts').select('*').or(`lender_id.eq.${currentUser.id},lender_id.is.null`).order('created_at', { ascending: false }),
          insforge.database.from('cash_shifts').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('collector_visits').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('bank_deposits').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false })
        ]);

        if (trxRes.data) setTransactions(trxRes.data.map(mapTransaction));
        if (depositsRes.data) setBankDeposits((depositsRes.data as BankDepositDB[]).map(mapBankDeposit));
        if (banksRes.data && banksRes.data.length > 0) {
          const fetchedAccounts = (banksRes.data as BankAccountDB[]).map((b) => ({
            id: b.id,
            bankName: b.bank_name || b.bankname || '',
            accountName: b.account_name || b.accountname || '',
            holderName: b.holder_name || b.holdername || b.account_name || b.accountname || '',
            accountNumber: b.account_number || b.accountnumber || '',
            accountType: (b.account_type || b.accounttype || 'Corriente') as BankAccount['accountType'],
            currency: (b.currency || 'DOP') as BankAccount['currency'],
            balance: Number(b.initial_balance) || Number(b.balance) || Number(b.initialbalance) || 0,
            isActive: b.status !== 'Inactiva',
            cedulaOrRnc: b.cedula_or_rnc || '',
            showInPaymentLink: b.show_in_payment_link !== false,
            bankLogoUrl: b.bank_logo_url || ''
          }));

          const hasCashBox = fetchedAccounts.some(a => a.accountType === 'Caja Chica / Efectivo' || a.bankName.toLowerCase().includes('caja'));
          if (!hasCashBox) {
            setBankAccounts([DEFAULT_BANK_ACCOUNTS[0], ...fetchedAccounts]);
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
          } else {
            setBankAccounts(fetchedAccounts);
          }
        } else {
          setBankAccounts(DEFAULT_BANK_ACCOUNTS);
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
        isActive: inserted.status !== 'Inactiva',
        cedulaOrRnc: inserted.cedula_or_rnc || account.cedulaOrRnc || '',
        showInPaymentLink: inserted.show_in_payment_link !== false,
        bankLogoUrl: inserted.bank_logo_url || account.bankLogoUrl || ''
      };
      setBankAccounts(prev => [realAccount, ...prev]);
      addToast("Cuenta registrada en la base de datos", "success");
      return realAccount;
    } else {
      if (error) logger.error("Error inserting bank_account to DB:", error);
      setBankAccounts(prev => [account, ...prev]);
      addToast("Cuenta registrada en la base de datos", "success");
      return account;
    }
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
    if (currentUser) {
      const updateData: Record<string, string | number | boolean> = {};
      if (updates.balance !== undefined) updateData.initial_balance = updates.balance;
      if (updates.isActive !== undefined) updateData.status = updates.isActive ? 'Activa' : 'Inactiva';
      if (updates.accountName !== undefined) updateData.account_name = updates.accountName;
      if (updates.holderName !== undefined) updateData.holder_name = updates.holderName;
      if (updates.accountNumber !== undefined) updateData.account_number = updates.accountNumber;
      if (updates.bankName !== undefined) updateData.bank_name = updates.bankName;
      if (updates.accountType !== undefined) updateData.account_type = updates.accountType;
      if (updates.cedulaOrRnc !== undefined) updateData.cedula_or_rnc = updates.cedulaOrRnc;
      if (updates.showInPaymentLink !== undefined) updateData.show_in_payment_link = updates.showInPaymentLink;
      if (updates.bankLogoUrl !== undefined) updateData.bank_logo_url = updates.bankLogoUrl;

      if (Object.keys(updateData).length > 0) {
        await insforge.database.from('bank_accounts').update(updateData).eq('id', id).eq('lender_id', currentUser.id);
      }
    }
    addToast("Cuenta actualizada en la base de datos", "success");
  };

  const removeBankAccount = async (id: string) => {
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    if (currentUser) {
      const { error } = await insforge.database.from('bank_accounts').delete().eq('id', id).eq('lender_id', currentUser.id);
      if (error) {
        await insforge.database.from('bank_accounts').delete().eq('id', id);
      }
    }
    addToast("Cuenta eliminada", "info");
  };

  const processBankDeposit = async (bankAccountId: string | undefined, amount: number) => {
    if (amount <= 0) return;
    const target = bankAccountId ? bankAccounts.find(a => a.id === bankAccountId) : null;
    if (!target) return;

    const currentBal = Number(target.balance) || 0;
    const newBal = currentBal + amount;
    setBankAccounts(prev => prev.map(acc => acc.id === target.id ? { ...acc, balance: newBal } : acc));
    if (currentUser) {
      await insforge.database.from('bank_accounts').update({ initial_balance: newBal }).eq('id', target.id).eq('lender_id', currentUser.id);
    }
  };

  const processBankDisbursement = async (bankAccountId: string | undefined, amount: number) => {
    if (amount <= 0) return;
    const target = bankAccountId ? bankAccounts.find(a => a.id === bankAccountId) : null;
    if (!target) return;

    const currentBal = Number(target.balance) || 0;
    // If target account balance is 0 or less, retain at 0 to avoid driving balance negative or blocking operational disbursements
    const finalBal = currentBal > 0 ? Math.max(0, currentBal - amount) : 0;

    setBankAccounts(prev => prev.map(acc => acc.id === target.id ? { ...acc, balance: finalBal } : acc));
    if (currentUser) {
      await insforge.database.from('bank_accounts').update({ initial_balance: finalBal }).eq('id', target.id).eq('lender_id', currentUser.id);
    }
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

  const [paymentMethods, setPaymentMethods] = useState<CustomPaymentMethod[]>(() => {
    try {
      const saved = localStorage.getItem('ultramoney_payment_methods');
      return saved ? JSON.parse(saved) : DEFAULT_PAYMENT_METHODS;
    } catch (e) {
      return DEFAULT_PAYMENT_METHODS;
    }
  });

  useEffect(() => {
    localStorage.setItem('ultramoney_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  const addPaymentMethod = (pm: CustomPaymentMethod) => {
    setPaymentMethods(prev => [pm, ...prev]);
    addToast(`Método de pago "${pm.name}" agregado`, 'success');
  };

  const updatePaymentMethod = (id: string, updates: Partial<CustomPaymentMethod>) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addToast('Método de pago actualizado', 'success');
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
    addToast('Método de pago eliminado', 'info');
  };

  const togglePaymentMethodStatus = (id: string) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
    addToast('Estado del método de pago modificado', 'success');
  };

  const addBankDeposit = async (deposit: Omit<BankDeposit, 'id'>, voucherFile?: File | string): Promise<BankDeposit | void> => {
    if (!currentUser) return;
    try {
      let finalVoucherUrl = deposit.voucherUrl;
      if (voucherFile) {
        const uploadedUrl = await uploadToBucketHelper(voucherFile, 'documents', 'vouchers');
        if (uploadedUrl) {
          finalVoucherUrl = uploadedUrl;
        }
      }

      const insertPayload: Record<string, string | number | null> = {
        lender_id: currentUser.id,
        bank_name: deposit.bankName,
        bank_account_id: deposit.bankAccountId || null,
        reference_number: deposit.referenceNumber,
        amount: deposit.amount,
        currency: deposit.currency || 'DOP',
        sender_name: deposit.senderName || null,
        deposit_date: deposit.depositDate || new Date().toISOString().split('T')[0],
        voucher_url: finalVoucherUrl || null,
        notes: deposit.notes || null,
        status: deposit.status || 'Pendiente',
        matched_loan_id: deposit.matchedLoanId || null,
        matched_client_id: deposit.matchedClientId || null,
        matched_receipt_id: deposit.matchedReceiptId || null,
        matched_transaction_id: deposit.matchedTransactionId || null,
        reconciled_at: deposit.reconciledAt || null,
        reconciled_by: deposit.reconciledBy || null
      };

      const { data, error } = await insforge.database
        .from('bank_deposits')
        .insert([insertPayload])
        .select('*');

      if (error) {
        logger.error('Error inserting bank deposit:', error);
        addToast('Error al registrar depósito bancario', 'error');
        return;
      }

      if (data && data.length > 0) {
        const created = mapBankDeposit(data[0] as BankDepositDB);
        setBankDeposits(prev => [created, ...prev]);
        addAuditLog('bank_deposit_registered', `Registró depósito/transferencia de ${deposit.bankName} por RD$ ${deposit.amount} Ref: ${deposit.referenceNumber}`);
        addToast('Depósito bancario registrado correctamente', 'success');
        return created;
      }
    } catch (err) {
      logger.error('Exception adding bank deposit:', err);
      addToast('Error inesperado al registrar depósito', 'error');
    }
  };

  const updateBankDeposit = async (id: string, updates: Partial<BankDeposit>) => {
    setBankDeposits(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    if (!currentUser) return;
    try {
      const updateData: Record<string, string | number | null> = {};
      if (updates.bankName !== undefined) updateData.bank_name = updates.bankName;
      if (updates.bankAccountId !== undefined) updateData.bank_account_id = updates.bankAccountId || null;
      if (updates.referenceNumber !== undefined) updateData.reference_number = updates.referenceNumber;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.senderName !== undefined) updateData.sender_name = updates.senderName || null;
      if (updates.depositDate !== undefined) updateData.deposit_date = updates.depositDate;
      if (updates.voucherUrl !== undefined) updateData.voucher_url = updates.voucherUrl || null;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.matchedLoanId !== undefined) updateData.matched_loan_id = updates.matchedLoanId || null;
      if (updates.matchedClientId !== undefined) updateData.matched_client_id = updates.matchedClientId || null;
      if (updates.matchedReceiptId !== undefined) updateData.matched_receipt_id = updates.matchedReceiptId || null;
      if (updates.matchedTransactionId !== undefined) updateData.matched_transaction_id = updates.matchedTransactionId || null;
      if (updates.reconciledAt !== undefined) updateData.reconciled_at = updates.reconciledAt || null;
      if (updates.reconciledBy !== undefined) updateData.reconciled_by = updates.reconciledBy || null;

      if (Object.keys(updateData).length > 0) {
        await insforge.database
          .from('bank_deposits')
          .update(updateData)
          .eq('id', id)
          .eq('lender_id', currentUser.id);
      }
      addToast('Depósito actualizado', 'success');
    } catch (err) {
      logger.error('Error updating bank deposit:', err);
      addToast('Error al actualizar depósito', 'error');
    }
  };

  const deleteBankDeposit = async (id: string) => {
    setBankDeposits(prev => prev.filter(d => d.id !== id));
    if (!currentUser) return;
    try {
      const { error } = await insforge.database
        .from('bank_deposits')
        .delete()
        .eq('id', id)
        .eq('lender_id', currentUser.id);
      if (error) {
        logger.error('Error deleting bank deposit:', error);
        addToast('Error al eliminar depósito de la base de datos', 'error');
      } else {
        addToast('Depósito eliminado', 'info');
      }
    } catch (err) {
      logger.error('Error deleting bank deposit:', err);
    }
  };

  const reconcileDepositWithLoan = async (
    depositId: string,
    matchedData: {
      loanId: string;
      clientId?: string;
      receiptId?: string;
      transactionId?: string;
      reconciledBy?: string;
    }
  ) => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();
    const adminName = matchedData.reconciledBy || currentUser.name || currentUser.email || 'Administrador';

    const updates: Partial<BankDeposit> = {
      status: 'Conciliado',
      matchedLoanId: matchedData.loanId,
      matchedClientId: matchedData.clientId,
      matchedReceiptId: matchedData.receiptId,
      matchedTransactionId: matchedData.transactionId,
      reconciledAt: nowIso,
      reconciledBy: adminName
    };

    setBankDeposits(prev => prev.map(d => d.id === depositId ? { ...d, ...updates } : d));

    try {
      await insforge.database
        .from('bank_deposits')
        .update({
          status: 'Conciliado',
          matched_loan_id: matchedData.loanId,
          matched_client_id: matchedData.clientId || null,
          matched_receipt_id: matchedData.receiptId || null,
          matched_transaction_id: matchedData.transactionId || null,
          reconciled_at: nowIso,
          reconciled_by: adminName
        })
        .eq('id', depositId)
        .eq('lender_id', currentUser.id);

      addAuditLog('bank_deposit_reconciled', `Concilió depósito con préstamo #${matchedData.loanId.slice(-6)}`);
      addToast('Depósito conciliado y vinculado exitosamente al préstamo', 'success');
    } catch (err) {
      logger.error('Error reconciling deposit:', err);
      addToast('Error al actualizar estado de conciliación', 'error');
    }
  };

  const rejectBankDeposit = async (depositId: string, notes?: string) => {
    if (!currentUser) return;
    const target = bankDeposits.find(d => d.id === depositId);
    const updatedNotes = notes ? (target?.notes ? `${target.notes} | Motivo rechazo: ${notes}` : `Motivo rechazo: ${notes}`) : target?.notes;

    setBankDeposits(prev => prev.map(d => d.id === depositId ? { ...d, status: 'Rechazado', notes: updatedNotes } : d));

    try {
      await insforge.database
        .from('bank_deposits')
        .update({
          status: 'Rechazado',
          notes: updatedNotes || null
        })
        .eq('id', depositId)
        .eq('lender_id', currentUser.id);

      addAuditLog('bank_deposit_rejected', `Rechazó depósito bancario ID #${depositId.slice(-6)}`);
      addToast('Depósito marcado como rechazado', 'info');
    } catch (err) {
      logger.error('Error rejecting deposit:', err);
      addToast('Error al rechazar depósito', 'error');
    }
  };

  return (
    <AccountingContext.Provider value={{
      transactions, bankAccounts, paymentMethods, cashShifts, activeCashShift, collectorVisits,
      bankDeposits, isLoadingDeposits,
      openCashShift, closeCashShift, getCashShiftSummary, addTransaction, addBankAccount,
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
