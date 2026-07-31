import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Loan, Transaction, LoanStatus, BankAccount, ClientNote, ClientDocument, User, Role, CompanySettings, AuditLog, LoanRequest, Employee, CashShift, PaymentMethod, CollectorVisit, AppNotification, ApiKey, LoanProduct, Route } from '../types';
import { useToast } from './ToastContext';
import { insforge } from '../lib/insforge';

interface StoreContextType {
  // Data
  clients: Client[];
  loans: Loan[];
  loanProducts: LoanProduct[];
  loanRequests: LoanRequest[]; 
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  clientNotes: ClientNote[];
  clientDocuments: ClientDocument[];
  employees: Employee[];
  auditLogs: AuditLog[];
  cashShifts: CashShift[];
  activeCashShift: CashShift | null;
  collectorVisits: CollectorVisit[];
  notifications: AppNotification[];
  
  // Auth & System
  currentUser: any | null;
  isLoadingAuth: boolean;
  users: User[];
  roles: Role[];
  companySettings: CompanySettings;

  // Actions
  login: (identifier: string, password: string) => boolean;
  logout: () => void;
  loginEmployee: (username: string, pin: string) => Promise<boolean>;
  logoutSystem: () => void;
  registerUser: (user: User) => void;
  updateUser: (user: User) => void;
  updateCompanySettings: (settings: CompanySettings) => void;
  addRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  exportSystemBackup: () => string;
  importSystemBackup: (jsonContent: string) => boolean;

  apiKeys: ApiKey[];
  generateApiKey: (name: string) => void;
  deleteApiKey: (id: string) => void;

  // Domain Actions
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  
  // Employee Actions
  addEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  addCollectorVisit: (visit: Omit<CollectorVisit, 'id'>) => void;

  // Notifications & Audit
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addAuditLog: (action: string, details: string) => void;
  globalCurrency: 'DOP' | 'USD';
  pdfQueue: PdfJob[];
  enqueuePdf: (job: Omit<PdfJob, 'id'>) => void;
  removePdfJob: (id: string) => void;
  setGlobalCurrency: (currency: 'DOP' | 'USD') => void;

  // Cash Shift Actions
  openCashShift: (initialAmount: number, notes?: string) => void;
  closeCashShift: (finalCashCount: number, notes?: string) => void;
  getCashShiftSummary: () => { initialAmount: number; cashCollected: number; cashExpenses: number; expectedAmount: number };

  // Loan & Request Actions
  addLoanRequest: (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => void;
  deleteLoanRequest: (requestId: string) => void; 
  createLoan: (loanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => void;
  
  refinanceLoan: (oldLoanId: string, newLoanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => void;
  registerPayment: (
    loanId: string, 
    amount: number, 
    note: string, 
    paymentDate?: string, 
    invoiceDate?: string, 
    paymentType?: 'Interes' | 'Capital' | 'Mixto',
    capitalAmount?: number,
    paymentMethod?: PaymentMethod
  ) => void;
  addBankAccount: (account: BankAccount) => void;
  removeBankAccount: (id: string) => void;
  addClientNote: (note: ClientNote) => void;
  addClientDocument: (doc: ClientDocument, file?: File) => void;
  removeClientDocument: (id: string) => void;
  generateClientPin: (clientId: string) => string;
  getFinancialStats: () => { balance: number; incomeToday: number; expenseToday: number };
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const initialCompanySettings: CompanySettings = {
  name: 'Ultramoney S.R.L.',
  slogan: 'Tu socio financiero de confianza',
  rnc: '131-00000-1',
  address: 'Av. 27 de Febrero #23, Santo Domingo, RD',
  phone: '(809) 555-0100',
  email: 'contacto@ultramoney.com',
  currency: 'RD$',
  termsAndConditions: 'El incumplimiento de pago generará una mora del 5% mensual.'
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [globalCurrency, setGlobalCurrency] = useState<'DOP' | 'USD'>('DOP');
  const [pdfQueue, setPdfQueue] = useState<PdfJob[]>([]);

  const enqueuePdf = (job: Omit<PdfJob, 'id'>) => {
    setPdfQueue(prev => [...prev, { ...job, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const removePdfJob = (id: string) => {
    setPdfQueue(prev => prev.filter(j => j.id !== id));
  };
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [routes, setRoutes] = useState<Route[]>([]);

  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Cash Shifts State
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const activeCashShift = cashShifts.find(cs => cs.status === 'Abierta' && (currentUser ? cs.userId === currentUser.id : true)) || null;

  // Collector Visits State
  const [collectorVisits, setCollectorVisits] = useState<CollectorVisit[]>([]);
  
  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', title: 'Bienvenido', message: 'Bienvenido a Ultramoney. Aquí aparecerán tus alertas.', date: new Date().toISOString(), read: false, type: 'info' }
  ]);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    const newNotif: AppNotification = { ...notif, id: `notif-${Date.now()}`, date: new Date().toISOString(), read: false };
    setNotifications(prev => [newNotif, ...prev]);
  };
  
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addAuditLog = (action: string, details: string) => {
    if (!currentUser) return;
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email || 'Sistema',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
    // Optionally: Sync to backend here if needed
  };

  const openCashShift = async (initialAmount: number, notes?: string) => {
    if (!currentUser) return;
    if (activeCashShift) {
      addToast("Ya tienes una caja abierta", 'error');
      return;
    }
    
    const { error } = await insforge.database.from('cash_shifts').insert({
      lender_id: currentUser.id,
      user_id: currentUser.id,
      user_name: currentUser.name || currentUser.email || 'Cajero',
      opened_at: new Date().toISOString(),
      initial_amount: initialAmount,
      status: 'Abierta',
      notes
    });

    if (error) {
      addToast("Error al abrir caja", 'error');
    } else {
      addToast(`Caja abierta con RD$ ${initialAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 'success');
    }
  };

  const closeCashShift = async (finalCashCount: number, notes?: string) => {
    if (!currentUser || !activeCashShift) {
      addToast("No hay caja abierta para cerrar", 'error');
      return;
    }
    const summary = getCashShiftSummary();
    const difference = finalCashCount - summary.expectedAmount;
    
    const combinedNotes = notes ? `${activeCashShift.notes || ''} | Cierre: ${notes}` : activeCashShift.notes;

    const { error } = await insforge.database.from('cash_shifts').update({
      closed_at: new Date().toISOString(),
      expected_amount: summary.expectedAmount,
      final_cash_count: finalCashCount,
      difference,
      status: 'Cerrada',
      notes: combinedNotes
    }).eq('id', activeCashShift.id);

    if (error) {
      addToast("Error al cerrar caja", 'error');
    } else {
      addToast(`Caja cerrada. ${difference === 0 ? 'Cuadre perfecto.' : difference > 0 ? `Sobrante de RD$ ${difference.toFixed(2)}` : `Faltante de RD$ ${Math.abs(difference).toFixed(2)}`}`, difference < 0 ? 'error' : 'success');
    }
  };

  const getCashShiftSummary = () => {
    if (!activeCashShift) {
      return { initialAmount: 0, cashCollected: 0, cashExpenses: 0, expectedAmount: 0 };
    }
    const shiftStartTime = new Date(activeCashShift.openedAt).getTime();
    
    const cashCollected = transactions
      .filter(t => (t.currency || 'DOP') === globalCurrency && t.type === 'Ingreso' && new Date(t.date).getTime() >= shiftStartTime && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const cashExpenses = transactions
      .filter(t => (t.currency || 'DOP') === globalCurrency && t.type === 'Gasto' && new Date(t.date).getTime() >= shiftStartTime && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expectedAmount = activeCashShift.initialAmount + cashCollected - cashExpenses;

    return {
      initialAmount: activeCashShift.initialAmount,
      cashCollected,
      cashExpenses,
      expectedAmount
    };
  };

  // 1. Auth Listener
  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      } else {
        const empSession = localStorage.getItem('employee_session');
        if (empSession) {
          setCurrentUser(JSON.parse(empSession));
        } else {
          setCurrentUser(null);
        }
      }
      setIsLoadingAuth(false);
    });

    const unsubscribe = insforge.auth.onAuthStateChange(async (_event) => {
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        setCurrentUser(data.user);
      } else {
        const empSession = localStorage.getItem('employee_session');
        if (empSession) {
          setCurrentUser(JSON.parse(empSession));
        } else {
          setCurrentUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper: map DB lowercase columns to camelCase for Loan objects
  
  // Helper: map DB lowercase columns to camelCase for Client objects
  const mapClient = (c: any) => ({
    ...c,
    phoneHome: c.phonehome ?? c.phoneHome,
    creditScore: c.creditscore ?? c.creditScore,
    joinedDate: c.joineddate ?? c.joinedDate,
    clientPin: c.clientpin ?? c.clientPin
  });

  const mapLoan = (l: any) => ({
    ...l,
    clientId: l.clientid || l.clientId || l.client_id,
    clientName: l.clientname || l.clientName || l.client_name || '',
    interestRate: l.interestrate ?? l.interestRate ?? l.interest_rate,
    durationWeeks: l.durationweeks ?? l.durationWeeks ?? l.duration_weeks,
    startDate: l.startdate || l.startDate || l.start_date,
    installmentAmount: l.installmentamount ?? l.installmentAmount ?? l.installment_amount,
    remainingBalance: l.remainingbalance ?? l.remainingBalance ?? l.remaining_balance,
    totalToPay: l.totaltopay ?? l.totalToPay ?? l.total_to_pay,
    loanType: l.loantype || l.loanType || l.loan_type,
    collateralType: l.collateraltype || l.collateralType || l.collateral_type,
    collateralRef: l.collateralref || l.collateralRef || l.collateral_ref,
    collateralDescription: l.collateraldescription || l.collateralDescription || l.collateral_description,
    collateralData: l.collateraldata || l.collateralData || l.collateral_data,
    lateFeePercentage: l.latefeepercentage ?? l.lateFeePercentage,
    graceDays: l.gracedays ?? l.graceDays,
    collateral: l.guarantees ? (typeof l.guarantees === 'string' ? JSON.parse(l.guarantees) : l.guarantees) : undefined
  });

  // 2. Data Fetching & Realtime Subscriptions
  useEffect(() => {
    if (!currentUser) {
      setClients([]); setLoans([]); setTransactions([]); setBankAccounts([]);
      setClientNotes([]); setClientDocuments([]); setEmployees([]);
      setCashShifts([]); setCollectorVisits([]); setLoanRequests([]); setLoanProducts([]);
      return;
    }

    const fetchData = async () => {
      try {
        const [
          clientsRes, loansRes, trxRes, settingsRes,
          employeesRes, visitsRes, requestsRes, shiftsRes,
          notesRes, docsRes, loanProductsRes, banksRes, rolesRes, usersRes, apiKeysRes
        ] = await Promise.all([
          insforge.database.from('clients').select('*').order('created_at', { ascending: false }),
          insforge.database.from('loans').select('*').order('created_at', { ascending: false }),
          insforge.database.from('transactions').select('*').order('created_at', { ascending: false }),
          insforge.database.from('company_settings').select('*').maybeSingle(),
          
          insforge.database.from('employees').select('*').order('created_at', { ascending: false }),
          insforge.database.from('collector_visits').select('*').order('created_at', { ascending: false }),
          insforge.database.from('loan_requests').select('*').order('created_at', { ascending: false }),
          insforge.database.from('cash_shifts').select('*').order('created_at', { ascending: false }),
          insforge.database.from('client_notes').select('*').order('created_at', { ascending: false }),
          insforge.database.from('loan_products').select('*').order('created_at', { ascending: false }),
          insforge.database.from('client_documents').select('*').order('created_at', { ascending: false }),
          insforge.database.from('bank_accounts').select('*').order('created_at', { ascending: false }),
          insforge.database.from('roles').select('*').order('name'),
          insforge.database.from('user_profiles').select('*').order('created_at'),
          insforge.database.from('api_keys').select('*').order('created_at', { ascending: false })
        ]);

        if (clientsRes.data) setClients(clientsRes.data.map(mapClient) as unknown as Client[]);
        if (loansRes.data) {
          setLoans(loansRes.data.map(mapLoan) as unknown as Loan[]);
        }
        if (trxRes.data) setTransactions(trxRes.data as unknown as Transaction[]);
        if (settingsRes.data) {
          const s = settingsRes.data as any;
          setCompanySettings({
            name: s.name, slogan: s.slogan, rnc: s.rnc, address: s.address, phone: s.phone,
            logoUrl: s.logoUrl, email: currentUser.email, currency: 'RD$', termsAndConditions: 'El incumplimiento de pago generará mora.'
          });
        }
        
        // Map snake_case to camelCase where needed
        if (employeesRes.data) setEmployees(employeesRes.data.map((e: any) => ({...e, assignedRoute: e.assigned_route, activeRoutes: e.active_routes})) as unknown as Employee[]);
        if (visitsRes.data) setCollectorVisits(visitsRes.data.map((v: any) => ({...v, collectorId: v.collector_id, collectorName: v.collector_name, clientId: v.client_id, clientName: v.client_name, loanId: v.loan_id, promisedDate: v.promised_date, amountCollected: v.amount_collected})) as unknown as CollectorVisit[]);
        if (requestsRes.data) setLoanRequests(requestsRes.data.map((r: any) => ({...r, clientId: r.client_id, clientName: r.client_name, interestRate: r.interest_rate, durationWeeks: r.duration_weeks, loanType: r.loan_type, closingCost: r.closing_cost, closingCostMode: r.closing_cost_mode, paymentDay: r.payment_day, requestDate: r.request_date, loanDestination: r.loan_destination})) as unknown as LoanRequest[]);
        if (shiftsRes.data) setCashShifts(shiftsRes.data.map((s: any) => ({...s, userId: s.user_id, userName: s.user_name, openedAt: s.opened_at, closedAt: s.closed_at, initialAmount: s.initial_amount, expectedAmount: s.expected_amount, finalCashCount: s.final_cash_count})) as unknown as CashShift[]);
        if (notesRes.data) setClientNotes(notesRes.data.map((n: any) => ({...n, clientId: n.client_id, createdBy: n.created_by})) as unknown as ClientNote[]);

        if (docsRes.data) setClientDocuments(docsRes.data.map((d: any) => ({...d, clientId: d.client_id, fileUrl: d.file_url, fileType: d.file_type, uploadDate: d.upload_date})) as unknown as ClientDocument[]);
        if (loanProductsRes.data) {
          setLoanProducts(loanProductsRes.data.map((p: any) => ({
            ...p,
            minAmount: p.min_amount, maxAmount: p.max_amount, interestRate: p.interest_rate,
            interestType: p.interest_type, termMonths: p.term_months, defaultInstallments: p.default_installments,
            requiresCollateral: p.requires_collateral, collateralType: p.collateral_type,
            disbursementFee: p.disbursement_fee, lateFeePercentage: p.late_fee_percentage,
            graceDays: p.grace_days, prepaymentAllowed: p.prepayment_allowed,
            autoCalculateInterest: p.auto_calculate_interest, isActive: p.is_active,
            createdAt: p.created_at, updatedAt: p.updated_at
          })) as unknown as LoanProduct[]);
        }

        if (banksRes.data) setBankAccounts(banksRes.data.map((b: any) => ({...b, clientId: b.client_id, bankName: b.bank_name, accountNumber: b.account_number, accountType: b.account_type, holderName: b.holder_name})) as unknown as BankAccount[]);
        if (rolesRes.data) setRoles(rolesRes.data as unknown as Role[]);
        if (usersRes.data) setUsers(usersRes.data.map((u: any) => ({...u, roleId: u.role_id, employeeId: u.employee_id, status: 'Active'})) as unknown as User[]);
        if (apiKeysRes.data) setApiKeys(apiKeysRes.data.map((k: any) => ({...k, createdAt: k.created_at})) as unknown as ApiKey[]);

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();

    const CHANNEL = `db-changes-${currentUser.id}`;
    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        await insforge.realtime.subscribe(CHANNEL);

        // A generic helper could be used, but explicit maps are safer for snake_case conversion
        insforge.realtime.on('clients_insert', (p: any) => setClients(prev => [mapClient(p) as unknown as Client, ...prev]));
        insforge.realtime.on('clients_update', (p: any) => setClients(prev => prev.map(c => c.id === p.id ? mapClient(p) as unknown as Client : c)));
        insforge.realtime.on('clients_delete', (p: any) => setClients(prev => prev.filter(c => c.id !== p.id)));

        insforge.realtime.on('loans_insert', (p: any) => {
          setLoans(prev => [mapLoan(p) as unknown as Loan, ...prev]);
        });
        insforge.realtime.on('loans_update', (p: any) => {
          const l = mapLoan(p);
          setLoans(prev => prev.map(loan => loan.id === l.id ? l as unknown as Loan : loan));
        });
        insforge.realtime.on('loans_delete', (p: any) => setLoans(prev => prev.filter(l => l.id !== p.id)));

        insforge.realtime.on('transactions_insert', (p: any) => setTransactions(prev => [p as unknown as Transaction, ...prev]));
        insforge.realtime.on('transactions_delete', (p: any) => setTransactions(prev => prev.filter(t => t.id !== p.id)));
        
        insforge.realtime.on('cash_shifts_insert', (s: any) => setCashShifts(prev => [{...s, userId: s.user_id, userName: s.user_name, openedAt: s.opened_at, closedAt: s.closed_at, initialAmount: s.initial_amount, expectedAmount: s.expected_amount, finalCashCount: s.final_cash_count} as unknown as CashShift, ...prev]));
        insforge.realtime.on('cash_shifts_update', (s: any) => setCashShifts(prev => prev.map(cs => cs.id === s.id ? {...s, userId: s.user_id, userName: s.user_name, openedAt: s.opened_at, closedAt: s.closed_at, initialAmount: s.initial_amount, expectedAmount: s.expected_amount, finalCashCount: s.final_cash_count} as unknown as CashShift : cs)));
        
        insforge.realtime.on('collector_visits_insert', (v: any) => setCollectorVisits(prev => [{...v, collectorId: v.collector_id, collectorName: v.collector_name, clientId: v.client_id, clientName: v.client_name, loanId: v.loan_id, promisedDate: v.promised_date, amountCollected: v.amount_collected} as unknown as CollectorVisit, ...prev]));
        
        insforge.realtime.on('loan_requests_insert', (r: any) => setLoanRequests(prev => [{...r, clientId: r.client_id, clientName: r.client_name, interestRate: r.interest_rate, durationWeeks: r.duration_weeks, loanType: r.loan_type, closingCost: r.closing_cost, closingCostMode: r.closing_cost_mode, paymentDay: r.payment_day, requestDate: r.request_date, loanDestination: r.loan_destination} as unknown as LoanRequest, ...prev]));
        insforge.realtime.on('loan_requests_update', (r: any) => setLoanRequests(prev => prev.map(req => req.id === r.id ? {...r, clientId: r.client_id, clientName: r.client_name, interestRate: r.interest_rate, durationWeeks: r.duration_weeks, loanType: r.loan_type, closingCost: r.closing_cost, closingCostMode: r.closing_cost_mode, paymentDay: r.payment_day, requestDate: r.request_date, loanDestination: r.loan_destination} as unknown as LoanRequest : req)));
        insforge.realtime.on('loan_requests_delete', (p: any) => setLoanRequests(prev => prev.filter(r => r.id !== p.id)));

        insforge.realtime.on('client_notes_insert', (n: any) => setClientNotes(prev => [{...n, clientId: n.client_id, createdBy: n.created_by} as unknown as ClientNote, ...prev]));

        insforge.realtime.on('client_documents_insert', (d: any) => setClientDocuments(prev => [{...d, clientId: d.client_id, fileUrl: d.file_url, fileType: d.file_type, uploadDate: d.upload_date} as unknown as ClientDocument, ...prev]));

        insforge.realtime.on('loan_products_insert', (p: any) => setLoanProducts(prev => [{...p, minAmount: p.min_amount, maxAmount: p.max_amount, interestRate: p.interest_rate, interestType: p.interest_type, termMonths: p.term_months, defaultInstallments: p.default_installments, requiresCollateral: p.requires_collateral, collateralType: p.collateral_type, disbursementFee: p.disbursement_fee, lateFeePercentage: p.late_fee_percentage, graceDays: p.grace_days, prepaymentAllowed: p.prepayment_allowed, autoCalculateInterest: p.auto_calculate_interest, isActive: p.is_active, createdAt: p.created_at, updatedAt: p.updated_at} as unknown as LoanProduct, ...prev]));
        insforge.realtime.on('loan_products_update', (p: any) => setLoanProducts(prev => prev.map(prod => prod.id === p.id ? {...p, minAmount: p.min_amount, maxAmount: p.max_amount, interestRate: p.interest_rate, interestType: p.interest_type, termMonths: p.term_months, defaultInstallments: p.default_installments, requiresCollateral: p.requires_collateral, collateralType: p.collateral_type, disbursementFee: p.disbursement_fee, lateFeePercentage: p.late_fee_percentage, graceDays: p.grace_days, prepaymentAllowed: p.prepayment_allowed, autoCalculateInterest: p.auto_calculate_interest, isActive: p.is_active, createdAt: p.created_at, updatedAt: p.updated_at} as unknown as LoanProduct : prod)));
        insforge.realtime.on('loan_products_delete', (p: any) => setLoanProducts(prev => prev.filter(prod => prod.id !== p.id)));

        insforge.realtime.on('client_documents_delete', (p: any) => setClientDocuments(prev => prev.filter(d => d.id !== p.id)));
        
        insforge.realtime.on('bank_accounts_insert', (b: any) => setBankAccounts(prev => [{...b, clientId: b.client_id, bankName: b.bank_name, accountNumber: b.account_number, accountType: b.account_type, holderName: b.holder_name} as unknown as BankAccount, ...prev]));
        insforge.realtime.on('bank_accounts_delete', (p: any) => setBankAccounts(prev => prev.filter(b => b.id !== p.id)));
        
        insforge.realtime.on('employees_insert', (e: any) => setEmployees(prev => [{...e, assignedRoute: e.assigned_route, activeRoutes: e.active_routes} as unknown as Employee, ...prev]));
        insforge.realtime.on('employees_delete', (p: any) => setEmployees(prev => prev.filter(e => e.id !== p.id)));

      } catch (err) {
        console.warn("Realtime connection failed, using polling fallback:", err);
      }
    };

    setupRealtime();

    return () => {
      insforge.realtime.unsubscribe(CHANNEL);
    };
  }, [currentUser]);

  const login = (_identifier: string, _password: string): boolean => false;

  const logout = async () => {
    await insforge.auth.signOut();
    addToast("Sesión cerrada correctamente", 'info');
  };

  const registerUser = (_user: User) => {};
  const updateUser = (_updatedUser: User) => {};

  const updateCompanySettings = async (settings: CompanySettings) => {
    if (!currentUser) return;
    await insforge.database.from('company_settings').upsert({
      lender_id: currentUser.id,
      name: settings.name,
      slogan: settings.slogan,
      rnc: settings.rnc,
      address: settings.address,
      phone: settings.phone,
      logoUrl: settings.logoUrl
    });
    addToast("Configuración guardada", 'success');
  };

  const addRole = async (role: Role) => {
    const { data, error } = await insforge.database.from('roles').insert([{
      name: role.name,
      description: role.description,
      permissions: role.permissions
    }]).select();
    if (!error && data) {
      setRoles(prev => [...prev, data[0] as unknown as Role]);
      addToast("Rol creado exitosamente", "success");
    } else {
      addToast("Error al crear rol", "error");
    }
  };
  
  const deleteRole = async (id: string) => {
    const { error } = await insforge.database.from('roles').delete().eq('id', id);
    if (!error) {
      setRoles(prev => prev.filter(r => r.id !== id));
      addToast("Rol eliminado", "success");
    } else {
      addToast("Error al eliminar rol", "error");
    }
  };

  const addClient = async (client: Client) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('clients').insert({
      lender_id: currentUser.id,
      name: client.name,
      cedula: client.cedula,
      email: client.email,
      phone: client.phone,
      phonehome: client.phoneHome,
      address: client.address,
      occupation: client.occupation,
      sex: client.sex,
      income: client.income,
      creditscore: client.creditScore,
      joineddate: client.joinedDate,
      status: client.status,
      clientpin: client.clientPin
    });
    if (error) {
      addToast("Error al registrar cliente", 'error');
    } else {
      addToast("Cliente registrado", 'success');
    }
  };

  const updateClient = async (updatedClient: Client) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('clients').update({
      name: updatedClient.name, cedula: updatedClient.cedula, email: updatedClient.email,
      phone: updatedClient.phone, phonehome: updatedClient.phoneHome, address: updatedClient.address,
      occupation: updatedClient.occupation, sex: updatedClient.sex, income: updatedClient.income,
      status: updatedClient.status, clientpin: updatedClient.clientPin
    }).eq('id', updatedClient.id);
    
    if (error) { addToast("Error al actualizar", 'error'); } 
    else { addToast("Cliente actualizado", 'success'); }
  };

  
  const addRoute = async (route: Omit<Route, 'id' | 'createdAt'>) => {
      try {
          const { data, error } = await insforge.database.from('routes').insert([{
              name: route.name,
              description: route.description,
              collector_id: route.collectorId,
              status: route.status
          }]).select();
          if(error) throw error;
          if(data) {
              setRoutes([...routes, {
                  id: data[0].id,
                  name: data[0].name,
                  description: data[0].description,
                  collectorId: data[0].collector_id,
                  status: data[0].status,
                  createdAt: data[0].created_at
              }]);
              addToast('Ruta creada exitosamente', 'success');
          }
      } catch (e: any) {
          addToast('Error al crear ruta: ' + e.message, 'error');
      }
  };

  const updateRoute = async (id: string, updates: Partial<Route>) => {
      try {
          const dbUpdates: any = {};
          if(updates.name) dbUpdates.name = updates.name;
          if('description' in updates) dbUpdates.description = updates.description;
          if('collectorId' in updates) dbUpdates.collector_id = updates.collectorId;
          if(updates.status) dbUpdates.status = updates.status;
          
          const { error } = await insforge.database.from('routes').update(dbUpdates).eq('id', id);
          if(error) throw error;
          setRoutes(routes.map(r => r.id === id ? { ...r, ...updates } : r));
          addToast('Ruta actualizada', 'success');
      } catch (e: any) {
          addToast('Error al actualizar ruta: ' + e.message, 'error');
      }
  };

  const deleteRoute = async (id: string) => {
      try {
          // Check if clients are assigned
          const hasClients = clients.some(c => c.routeId === id);
          if(hasClients) {
              addToast('No se puede eliminar la ruta porque tiene clientes asignados', 'error');
              return;
          }
          const { error } = await insforge.database.from('routes').delete().eq('id', id);
          if(error) throw error;
          setRoutes(routes.filter(r => r.id !== id));
          addToast('Ruta eliminada', 'success');
      } catch (e: any) {
          addToast('Error al eliminar ruta: ' + e.message, 'error');
      }
  };

  const addEmployee = async (employee: Employee) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('employees').insert({
      lender_id: currentUser.id,
      name: employee.name,
      role: employee.role,
      phone: employee.phone,
      assigned_route: employee.assignedRoute,
      performance: employee.performance,
      active_routes: employee.activeRoutes,
      collections: employee.collections,
      username: employee.username,
      employee_pin: employee.employeePin
    });
    if (error) addToast("Error al registrar empleado", 'error');
    else addToast("Empleado guardado", 'success');
  };
  
  const deleteEmployee = async (id: string) => {
    if (!currentUser) return;
    await insforge.database.from('employees').delete().eq('id', id);
  };

  const addCollectorVisit = async (visit: Omit<CollectorVisit, 'id'>) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('collector_visits').insert({
      lender_id: currentUser.id,
      collector_id: visit.collectorId,
      collector_name: visit.collectorName,
      client_id: visit.clientId,
      client_name: visit.clientName,
      loan_id: visit.loanId,
      date: visit.date,
      status: visit.status,
      promised_date: visit.promisedDate,
      amount_collected: visit.amountCollected,
      notes: visit.notes
    });
    if (error) addToast("Error al registrar visita", 'error');
    else addToast(`Visita registrada (${visit.status})`, 'success');
  };

  const addLoanRequest = async (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('loan_requests').insert({
      lender_id: currentUser.id,
      client_id: request.clientId,
      client_name: request.clientName,
      amount: request.amount,
      interest_rate: request.interestRate,
      duration_weeks: request.durationWeeks,
      frequency: request.frequency,
      loan_type: request.loanType,
      closing_cost: request.closingCost,
      closing_cost_mode: request.closingCostMode,
      payment_day: request.paymentDay,
      request_date: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      collateral: request.collateral,
      loan_destination: request.loanDestination,
      observations: request.observations
    });
    if (error) addToast("Error al crear solicitud", 'error');
    else addToast("Solicitud enviada a evaluación", 'success');
  };

  const deleteLoanRequest = async (requestId: string) => {
    if (!currentUser) return;
    await insforge.database.from('loan_requests').delete().eq('id', requestId);
    addToast("Solicitud eliminada", 'info');
  };

  const createLoan = async (loanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => {
    if (!currentUser) return;

    let finalPrincipal = loanData.amount;
    const closingCost = loanData.closingCost || 0;
    if (loanData.closingCostMode === 'Financiado') finalPrincipal += closingCost;

    let totalToPay = 0;
    let initialBalance = 0;

    if (loanData.loanType === 'Amortizado') {
        const totalInterest = finalPrincipal * (loanData.interestRate / 100);
        totalToPay = finalPrincipal + totalInterest;
        initialBalance = totalToPay;
    } else {
        totalToPay = finalPrincipal;
        initialBalance = finalPrincipal;
    }
    
    let nextPaymentDate = loanData.nextPaymentDate;
    if (loanData.frequency === 'Mensual' && loanData.paymentDay && !nextPaymentDate) {
         const d = new Date();
         if (d.getDate() >= loanData.paymentDay) d.setMonth(d.getMonth() + 1);
         d.setDate(loanData.paymentDay);
         nextPaymentDate = d.toISOString().split('T')[0];
    } else if (!nextPaymentDate) {
         const d = new Date();
         d.setDate(d.getDate() + 7);
         nextPaymentDate = d.toISOString().split('T')[0];
    }

    const { data: insertedLoan, error: loanError } = await insforge.database.from('loans').insert({
      lender_id: currentUser.id,
      clientId: loanData.clientId, clientName: loanData.clientName, amount: finalPrincipal,
      interestRate: loanData.interestRate, durationWeeks: loanData.durationWeeks,
      frequency: loanData.frequency, startDate: loanData.startDate, status: LoanStatus.ACTIVE,
      installmentAmount: loanData.loanType === 'Amortizado' ? (totalToPay / loanData.durationWeeks) : (finalPrincipal * (loanData.interestRate/100)),
      remainingBalance: initialBalance, totalToPay, loanType: loanData.loanType,
      collateralType: loanData.collateral?.type || 'Sin Garantía', collateralRef: loanData.collateral?.refNumber || '',
      guarantees: loanData.collateral ? JSON.stringify(loanData.collateral) : null,
      collateralDescription: loanData.collateral?.description || '', collateralData: loanData.collateral || {},
      installments: []
    }).select().single();

    if (loanError || !insertedLoan) {
      addToast("Error al crear préstamo", 'error');
      return;
    }

    let disbursementAmount = loanData.amount;
    if (loanData.closingCostMode === 'Descontado') disbursementAmount = loanData.amount - closingCost;
    
    await insforge.database.from('transactions').insert({
      lender_id: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      amount: disbursementAmount,
      type: 'Gasto',
      description: `Desembolso ${loanData.loanType} para ${loanData.clientName}`,
      referenceId: (insertedLoan as any).id
    });

    if (loanData.closingCostMode === 'Externo' && closingCost > 0) {
        await insforge.database.from('transactions').insert({
          lender_id: currentUser.id, date: new Date().toISOString().split('T')[0],
          amount: closingCost, type: 'Ingreso', description: `Cobro Gastos de Cierre - ${loanData.clientName}`,
          referenceId: (insertedLoan as any).id
        });
    }
    
    // WhatsApp Notification (Fire and forget)
    const client = clients.find(c => c.id === loanData.clientId);
    if (client && client.phone) {
      insforge.functions.invoke('whatsapp-notifier', {
        body: {
          phone: client.phone,
          clientName: client.name,
          message: `Felicidades ${client.name.split(' ')[0]},\n\nSu préstamo por ${loanData.amount} ha sido desembolsado. Le invitamos a revisar su portal de clientes para más detalles.`
        }
      }).catch(err => console.error("Error enviando WhatsApp:", err));
    }

    addToast(`Préstamo desembolsado correctamente`, 'success');
    enqueuePdf({ type: 'contrato', client, loan: newLoan });
    enqueuePdf({ type: 'pagare', client, loan: newLoan });
  };

  const refinanceLoan = async (oldLoanId: string, newLoanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => {
    if (!currentUser) return;
    const oldLoan = loans.find(l => l.id === oldLoanId);
    if (!oldLoan) return;

    // 1. Mark old loan as PAID
    await insforge.database.from('loans').update({
      status: LoanStatus.PAID,
      remainingBalance: 0,
      notes: (oldLoan.notes || '') + ' [Liquidado por Refinanciamiento]'
    }).eq('id', oldLoanId);

    // 2. Create the new loan
    let finalPrincipal = newLoanData.amount;
    const closingCost = newLoanData.closingCost || 0;
    if (newLoanData.closingCostMode === 'Financiado') finalPrincipal += closingCost;

    let totalToPay = 0;
    let initialBalance = 0;

    if (newLoanData.loanType === 'Amortizado') {
        const totalInterest = finalPrincipal * (newLoanData.interestRate / 100);
        totalToPay = finalPrincipal + totalInterest;
        initialBalance = totalToPay;
    } else {
        totalToPay = finalPrincipal;
        initialBalance = finalPrincipal;
    }

    const { data: insertedLoan, error: loanError } = await insforge.database.from('loans').insert({
      lender_id: currentUser.id,
      clientId: newLoanData.clientId, clientName: newLoanData.clientName, amount: finalPrincipal,
      interestRate: newLoanData.interestRate, durationWeeks: newLoanData.durationWeeks,
      frequency: newLoanData.frequency, startDate: newLoanData.startDate, status: LoanStatus.ACTIVE,
      installmentAmount: newLoanData.loanType === 'Amortizado' ? (totalToPay / newLoanData.durationWeeks) : (finalPrincipal * (newLoanData.interestRate/100)),
      remainingBalance: initialBalance, totalToPay, loanType: newLoanData.loanType,
      collateralType: newLoanData.collateral?.type || 'Sin Garantía', collateralRef: newLoanData.collateral?.refNumber || '',
      guarantees: newLoanData.collateral ? JSON.stringify(newLoanData.collateral) : null,
      collateralDescription: newLoanData.collateral?.description || '', collateralData: newLoanData.collateral || {},
      installments: []
    }).select().single();

    if (loanError || !insertedLoan) {
      addToast("Error al crear el nuevo préstamo refinanciado", 'error');
      return;
    }

    // 3. Transactions
    // The actual money leaving the drawer is the NEW principal MINUS the old loan's remaining balance
    let disbursementAmount = newLoanData.amount - oldLoan.remainingBalance;
    if (newLoanData.closingCostMode === 'Descontado') disbursementAmount -= closingCost;
    
    // Only register an expense if there is actually cash leaving.
    if (disbursementAmount > 0) {
      await insforge.database.from('transactions').insert({
        lender_id: currentUser.id,
        date: new Date().toISOString().split('T')[0],
        amount: disbursementAmount,
        type: 'Gasto',
        description: `Desembolso Refinanciamiento para ${newLoanData.clientName}`,
        referenceId: (insertedLoan as any).id
      });
    } else if (disbursementAmount < 0) {
      // The client actually paid down some principal to get the new terms
      await insforge.database.from('transactions').insert({
        lender_id: currentUser.id,
        date: new Date().toISOString().split('T')[0],
        amount: Math.abs(disbursementAmount),
        type: 'Ingreso',
        description: `Abono Refinanciamiento - ${newLoanData.clientName}`,
        referenceId: (insertedLoan as any).id
      });
    }

    if (newLoanData.closingCostMode === 'Externo' && closingCost > 0) {
        await insforge.database.from('transactions').insert({
          lender_id: currentUser.id, date: new Date().toISOString().split('T')[0],
          amount: closingCost, type: 'Ingreso', description: `Cobro Gastos de Cierre (Refinanciamiento) - ${newLoanData.clientName}`,
          referenceId: (insertedLoan as any).id
        });
    }
    
    addToast(`Préstamo refinanciado correctamente`, 'success');
  };

  const registerPayment = async (
    loanId: string, amount: number, note: string, paymentDate?: string, 
    _invoiceDate?: string, paymentType?: 'Interes' | 'Capital' | 'Mixto',
    capitalAmount?: number, paymentMethod: PaymentMethod = 'Efectivo'
  ) => {
    if (!currentUser) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    let newBalance = loan.remainingBalance;
    let newStatus = loan.status;

    const baseTx = {
      lender_id: currentUser.id, date: paymentDate || new Date().toISOString().split('T')[0],
      type: 'Ingreso', description: note, referenceId: loanId, paymentMethod
    };

    let transactionsToInsert: any[] = [];

    if (loan.loanType === 'Rédito') {
      const currentInterestDue = loan.remainingBalance * (loan.interestRate / 100);
      if (paymentType === 'Capital') {
        newBalance -= amount;
        transactionsToInsert.push({ ...baseTx, amount, paymentType: 'Capital', description: `${note} (Abono Directo a Capital)` });
      } else if (paymentType === 'Mixto' && capitalAmount && capitalAmount > 0) {
        const interestPart = Math.max(0, amount - capitalAmount);
        newBalance -= capitalAmount;
        if (capitalAmount > 0) transactionsToInsert.push({ ...baseTx, amount: capitalAmount, paymentType: 'Capital', description: `${note} (Abono a Capital)` });
        if (interestPart > 0) transactionsToInsert.push({ ...baseTx, amount: interestPart, paymentType: 'Interes', description: `${note} (Interés)` });
      } else {
        if (amount > currentInterestDue) {
          const excessCapital = amount - currentInterestDue;
          newBalance -= excessCapital;
          transactionsToInsert.push({ ...baseTx, amount: currentInterestDue, paymentType: 'Interes', description: `${note} (Pago Rédito/Interés)` });
          transactionsToInsert.push({ ...baseTx, amount: excessCapital, paymentType: 'Capital', description: `${note} (Abono a Capital por Excedente)` });
        } else {
          transactionsToInsert.push({ ...baseTx, amount, paymentType: 'Interes', description: `${note} (Pago Rédito/Interés)` });
        }
      }
      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
    } else {
      newBalance -= amount;
      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
      transactionsToInsert.push({ ...baseTx, amount, paymentType: paymentType || 'Interes' });
    }

    const { error: loanError } = await insforge.database.from('loans').update({ remainingBalance: newBalance, status: newStatus }).eq('id', loanId);
    if (loanError) { addToast("Error al actualizar balance", 'error'); return; }

    const { error: trxError } = await insforge.database.from('transactions').insert(transactionsToInsert);
    if (!trxError) {
      addToast(newBalance === 0 ? "¡Préstamo Saldado Por Completo!" : "Pago registrado correctamente", 'success');
      
      // WhatsApp Notification (Fire and forget)
      const client = clients.find(c => c.id === loan.clientId);
      if (client && client.phone) {
        insforge.functions.invoke('whatsapp-notifier', {
          body: {
            phone: client.phone,
            clientName: client.name,
            message: `Hola ${client.name.split(' ')[0]},\n\nHemos recibido un pago de ${amount} por concepto de: ${note}. Su nuevo balance es: ${newBalance}. ¡Gracias por preferirnos!`
          }
        }).catch(err => console.error("Error enviando WhatsApp:", err));
      }
    } else {
      addToast("Error al guardar transacción", 'error');
    }
  };

  const addBankAccount = async (account: BankAccount) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('bank_accounts').insert({
      lender_id: currentUser.id,
      client_id: account.clientId,
      bank_name: account.bankName,
      account_number: account.accountNumber,
      account_type: account.accountType,
      holder_name: account.holderName
    });
    if (!error) addToast("Cuenta bancaria guardada", 'success');
  };
  const removeBankAccount = async (id: string) => {
    if (!currentUser) return;
    await insforge.database.from('bank_accounts').delete().eq('id', id);
  };
  
  const addClientNote = async (note: ClientNote) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('client_notes').insert({
      lender_id: currentUser.id,
      client_id: note.clientId,
      content: note.content,
      date: note.date,
      created_by: currentUser.name || 'Agente'
    });
    if (!error) addToast("Nota agregada", 'success');
  };

  const addClientDocument = async (doc: ClientDocument, file?: File) => {
    if (!currentUser) return;
    
    let fileUrl = doc.fileUrl;
    
    // Upload file to bucket if provided
    if (file) {
       const ext = file.name.split('.').pop();
       const filename = `${doc.clientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
       const { error: uploadError } = await insforge.storage.from('client-documents').upload(filename, file);
       
       if (uploadError) {
         addToast("Error al subir archivo a la nube", 'error');
         return;
       }
       
       const { data } = insforge.storage.from('client-documents').getPublicUrl(filename);
       fileUrl = data.publicUrl;
    }

    const { error } = await insforge.database.from('client_documents').insert({
      lender_id: currentUser.id,
      client_id: doc.clientId,
      title: doc.title,
      type: doc.type,
      file_url: fileUrl,
      file_type: doc.fileType,
      upload_date: doc.uploadDate
    });
    
    if (error) {
      addToast("Error al registrar documento", 'error');
    } else {
      addToast("Documento archivado de forma segura", 'success');
    }
  };

  const removeClientDocument = async (id: string) => {
    if (!currentUser) return;
    await insforge.database.from('client_documents').delete().eq('id', id);
    addToast("Documento eliminado", 'info');
  };

  const generateClientPin = (clientId: string) => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    if (currentUser) {
       insforge.database.from('clients').update({ clientpin: pin }).eq('id', clientId);
    }
    return pin;
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('transactions').insert(transaction);
    if (error) {
      addToast("Error al registrar transacción: " + error.message, 'error');
    }
  };

  const getFinancialStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const incomeToday = transactions.filter(t => t.type === 'Ingreso' && t.date === today).reduce((sum, t) => sum + Number(t.amount), 0);
    const expenseToday = transactions.filter(t => t.type === 'Gasto' && t.date === today).reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = incomeToday - expenseToday;
    return { balance, incomeToday, expenseToday };
  };

  const exportSystemBackup = () => {
    const backupData = {
      clients, loans, transactions, bankAccounts,
      employees, companySettings, cashShifts, collectorVisits
    };
    return JSON.stringify(backupData, null, 2);
  };
  
  const importSystemBackup = (_jsonContent: string) => {
    // In a real scenario, this would parse the JSON and bulk insert into Supabase/InsForge
    // For now we just return false as the Centro de Datos handles real migrations
    addToast("Usa el Centro de Migración para subir datos masivos", "info");
    return false;
  };

  const loginEmployee = async (username: string, pin: string) => {
    // Busca en la base de datos de empleados
    const { data, error } = await insforge.database
      .from('employees')
      .select('*')
      .eq('username', username)
      .eq('employee_pin', pin)
      .single();

    if (data && !error) {
      const empUser = {
        id: data.id,
        email: `${username}@ultramoney.local`,
        name: data.name,
        roleId: data.role === 'Admin' ? 'Admin' : 'Employee',
        isEmployee: true,
        employeeData: data
      };
      localStorage.setItem('employee_session', JSON.stringify(empUser));
      setCurrentUser(empUser);
      return true;
    }
    return false;
  };

  const logoutSystem = async () => {
    localStorage.removeItem('employee_session');
    await insforge.auth.signOut();
    setCurrentUser(null);
  };


  const addLoanProduct = async (product: Omit<LoanProduct, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
        const { data, error } = await insforge.database.from('loan_products').insert({
            name: product.name,
            description: product.description,
            min_amount: product.minAmount,
            max_amount: product.maxAmount,
            interest_rate: product.interestRate,
            interest_type: product.interestType,
            frequency: product.frequency,
            default_installments: product.defaultInstallments,
            requires_collateral: product.requiresCollateral,
            collateral_type: product.collateralType,
            disbursement_fee: product.disbursementFee,
            late_fee: product.lateFeePercentage,
            grace_period_days: product.graceDays,
            allow_early_payoff: product.prepaymentAllowed,
            auto_calculate_interest: product.autoCalculateInterest,
            is_active: product.isActive,
            amortization_method: product.amortizationMethod,
            payment_order: product.paymentOrder,
            recalculate_interest_on_early_payoff: product.recalculateInterestOnEarlyPayoff,
            capitalization_frequency: product.capitalizationFrequency,
            lender_id: currentUser.id
        }).select().single();
        if (error) throw error;
        const newProduct = {
            id: data.id,
            name: data.name, description: data.description, minAmount: data.min_amount, maxAmount: data.max_amount,
            interestRate: data.interest_rate, interestType: data.interest_type, frequency: data.frequency,
            defaultInstallments: data.default_installments, requiresCollateral: data.requires_collateral,
            collateralType: data.collateral_type, disbursementFee: data.disbursement_fee, lateFeePercentage: data.late_fee,
            graceDays: data.grace_period_days, prepaymentAllowed: data.allow_early_payoff,
            autoCalculateInterest: data.auto_calculate_interest, isActive: data.is_active, 
            amortizationMethod: data.amortization_method, paymentOrder: data.payment_order, 
            recalculateInterestOnEarlyPayoff: data.recalculate_interest_on_early_payoff,
            capitalizationFrequency: data.capitalization_frequency,
            createdAt: data.created_at
        };
        setLoanProducts(prev => [newProduct as LoanProduct, ...prev]);
        addToast('Producto de préstamo creado.', 'success');
    } catch (e: any) {
        addToast('Error al crear producto: ' + e.message, 'error');
    }
  };

  const updateLoanProduct = async (id: string, updates: Partial<LoanProduct>) => {
      try {
          const dbUpdates: any = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.minAmount !== undefined) dbUpdates.min_amount = updates.minAmount;
          if (updates.maxAmount !== undefined) dbUpdates.max_amount = updates.maxAmount;
          if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
          if (updates.interestType !== undefined) dbUpdates.interest_type = updates.interestType;
          if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
          if (updates.defaultInstallments !== undefined) dbUpdates.default_installments = updates.defaultInstallments;
          if (updates.requiresCollateral !== undefined) dbUpdates.requires_collateral = updates.requiresCollateral;
          if (updates.collateralType !== undefined) dbUpdates.collateral_type = updates.collateralType;
          if (updates.disbursementFee !== undefined) dbUpdates.disbursement_fee = updates.disbursementFee;
          if (updates.lateFeePercentage !== undefined) dbUpdates.late_fee = updates.lateFeePercentage;
          if (updates.graceDays !== undefined) dbUpdates.grace_period_days = updates.graceDays;
          if (updates.prepaymentAllowed !== undefined) dbUpdates.allow_early_payoff = updates.prepaymentAllowed;
          if (updates.autoCalculateInterest !== undefined) dbUpdates.auto_calculate_interest = updates.autoCalculateInterest;
          if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
          if (updates.amortizationMethod !== undefined) dbUpdates.amortization_method = updates.amortizationMethod;
          if (updates.paymentOrder !== undefined) dbUpdates.payment_order = updates.paymentOrder;
          if (updates.recalculateInterestOnEarlyPayoff !== undefined) dbUpdates.recalculate_interest_on_early_payoff = updates.recalculateInterestOnEarlyPayoff;
          if (updates.capitalizationFrequency !== undefined) dbUpdates.capitalization_frequency = updates.capitalizationFrequency;

          const { error } = await insforge.database.from('loan_products').update(dbUpdates).eq('id', id);
          if (error) throw error;
          setLoanProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
          addToast('Producto actualizado.', 'success');
      } catch (e: any) {
          addToast('Error al actualizar producto: ' + e.message, 'error');
      }
  };

  const deleteLoanProduct = async (id: string) => {
      try {
          const { error } = await insforge.database.from('loan_products').delete().eq('id', id);
          if (error) throw error;
          setLoanProducts(prev => prev.filter(p => p.id !== id));
          addToast('Producto eliminado.', 'success');
      } catch (e: any) {
          addToast('Error al eliminar producto: ' + e.message, 'error');
      }
  };

  return (
    <StoreContext.Provider value={{
      globalCurrency, setGlobalCurrency,
      pdfQueue, enqueuePdf, removePdfJob,
      clients, loans, loanProducts, loanRequests, transactions, bankAccounts,
      clientNotes, clientDocuments, employees, auditLogs,
      cashShifts, activeCashShift, openCashShift, closeCashShift, getCashShiftSummary,
      collectorVisits, addCollectorVisit, exportSystemBackup, importSystemBackup,
      currentUser, isLoadingAuth, users, roles, companySettings,
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, addAuditLog,
      login, logout, loginEmployee, logoutSystem, registerUser, updateUser, updateCompanySettings, addRole, deleteRole,
      addLoanProduct, updateLoanProduct, deleteLoanProduct,
      apiKeys,
      generateApiKey: async (name: string) => {
        if (!currentUser) return;
        const key = `sk_ultra_${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}`;
        const { error, data } = await insforge.database.from('api_keys').insert({
          lender_id: currentUser.id,
          name,
          key,
          created_at: new Date().toISOString()
        }).select().single();

        if (!error && data) {
          setApiKeys(prev => [...prev, { ...data, createdAt: data.created_at } as unknown as ApiKey]);
          addAuditLog('api_key_generated', `Generó API Key: ${name}`);
          addToast('API Key generada exitosamente', 'success');
        } else {
          addToast('Error al guardar API Key en base de datos', 'error');
        }
      },
      deleteApiKey: async (id: string) => {
        if (!currentUser) return;
        const { error } = await insforge.database.from('api_keys').delete().eq('id', id);
        if (!error) {
          setApiKeys(prev => prev.filter(k => k.id !== id));
          addAuditLog('api_key_deleted', `Eliminó API Key`);
          addToast('API Key eliminada', 'success');
        } else {
          addToast('Error al eliminar API Key', 'error');
        }
      },
      addClient, updateClient, addEmployee, deleteEmployee, addLoanRequest, deleteLoanRequest,
      createLoan, refinanceLoan, registerPayment, addBankAccount, removeBankAccount,
      addClientNote, addClientDocument, removeClientDocument, generateClientPin, getFinancialStats,
      addTransaction
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};