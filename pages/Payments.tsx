import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, CheckCircle, Receipt, User, CreditCard, Calendar, List, 
  CheckSquare, Filter, ChevronDown, ChevronUp, AlertCircle, Banknote, 
  Mail, X, FileText, Download, ArrowRight, Printer, ChevronLeft, 
  Image, ArrowLeftRight, TrendingUp, Sparkles, Clock, Share2, 
  Copy, ExternalLink, ShieldAlert, Check, RefreshCw, Zap, Navigation,
  Edit3, Trash2, PlusCircle, Layers
} from 'lucide-react';
import { useClients, useAuth, useSettings, useLoans, useAccounting } from '../context/StoreContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { Loan, CompanySettings, PaymentMethod, formatLoanId, formatReceiptId, LoanStatus, Transaction } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { maskCedula } from '../utils/masks';
import { ThermalReceiptModal, ThermalReceiptData } from '../components/ThermalReceiptModal';
import { EditPaymentModal } from '../components/EditPaymentModal';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { formatExactDateTime, combineDateAndTimeToISO, formatExactTime, formatExactDate, formatPaymentDateDisplay } from '../utils/dateUtils';
import { calculateReceiptBalances, calculateLoanNextPaymentDate } from '../utils/receiptBalanceHelper';
import { LoanEngine } from '../utils/LoanEngine';

// Helper to calculate date strings
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days); 
  return date.toISOString().split('T')[0];
};

const getFrequencyDays = (freq: string) => {
  switch(freq) {
    case 'Semanal': return 7;
    case 'Quincenal': return 15;
    case 'Mensual': return 30;
    case 'Diario': return 1;
    default: return 7;
  }
};

interface Installment {
  number: number;
  date: string;
  amount: number;
  status: 'Pagado' | 'Pendiente' | 'Atrasado' | 'Parcial';
  paidAmount: number;
}

interface FullReceiptData {
  loanId: string;
  amountPaid: number;
  clientName: string;
  clientId?: string;
  clientCedula?: string;
  clientPhone?: string;
  loanType?: string;
  totalDebt?: number;
  capitalAmount?: number;
  interestAmount?: number;
  previousBalance: number;
  newBalance: number;
  transactionId: string;
  receiptNo: string;
  lateFeeAmount?: number;
  discountAmount?: number;
  date: string;
  time?: string;
  nextPaymentDate?: string;
  collateral: string;
  overdueAmount: number;
  overdueInstallments: number;
  totalInstallments: number;
  paidInstallments: number;
  otherLoans: { id: string, balance: number }[];
  cashierName: string;
  paymentNote: string;
  renewalStatus: string;
  paymentMethod?: PaymentMethod;
}

export const Payments: React.FC = () => {
  const { loans = [], registerPayment } = useLoans();
  const { clients = [] } = useClients();
  const { transactions = [], bankAccounts = [], processBankDeposit, paymentMethods = [], bankDeposits = [], isDateInLockedPeriod } = useAccounting();
  const { companySettings, addNotification } = useSettings();
  const { currentUser, roles = [] } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const pendingBankDeposits = bankDeposits.filter(d => d.status === 'Pendiente');
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'registrar' | 'monitor' | 'historial' | 'rutas'>('registrar');
  
  // Form State
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('Cuota Regular');
  const [paymentMode, setPaymentMode] = useState<'cuotas' | 'manual'>('cuotas');
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]); 
  const [paymentType, setPaymentType] = useState<'Interes' | 'Capital' | 'Mixto'>('Interes');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [selectedCashierId, setSelectedCashierId] = useState<string>('');
  const [capitalAmount, setCapitalAmount] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [lateFeeAmount, setLateFeeAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');

  // Edit Payment Modal State
  const [selectedTransactionToEdit, setSelectedTransactionToEdit] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Main Feed & History State
  const [mainFeedFilter, setMainFeedFilter] = useState<'todos' | 'hoy' | 'semana' | 'mes'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Success Modal & Thermal Modal State
  const [receiptData, setReceiptData] = useState<FullReceiptData | null>(null);
  const [thermalModalData, setThermalModalData] = useState<ThermalReceiptData | null>(null);

  // Mobile View Switcher & Quick Pay State
  const [mobileViewMode, setMobileViewMode] = useState<'rapida' | 'full'>('rapida');
  const [mobileQuickSearch, setMobileQuickSearch] = useState<string>('');
  const [isMobileQuickPayModalOpen, setIsMobileQuickPayModalOpen] = useState<boolean>(false);
  const [quickPayLoanSearch, setQuickPayLoanSearch] = useState<string>('');

  // Monitor State
  const [expandedClients, setExpandedClients] = useState<string[]>([]);

  // Pre-select loan if passed via navigation state
  useEffect(() => {
    if (location.state && location.state.loanId) {
      setSelectedLoanId(location.state.loanId);
      setActiveTab('registrar');
    }
  }, [location]);

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  // --- Logic to Generate Installments ---
  const generateInstallments = (loan: Loan): Installment[] => {
    const isRedito = Boolean(loan.loanType && (
      loan.loanType.includes('Rédito') || 
      loan.loanType.includes('Redito') || 
      loan.loanType.includes('Solo Interé') || 
      loan.loanType.includes('Pagaré Abierto')
    ));

    if (isRedito) {
      const interestAmount = Math.round(loan.remainingBalance * (loan.interestRate / 100) * 100) / 100;
      return [{
        number: 1,
        date: loan.nextPaymentDate || loan.startDate,
        amount: interestAmount,
        status: loan.status === LoanStatus.OVERDUE ? 'Atrasado' : 'Pendiente',
        paidAmount: 0
      }];
    }

    const installments: Installment[] = [];
    const count = loan.durationWeeks && loan.durationWeeks > 0 ? loan.durationWeeks : 1; 
    const amountPerInstallment = Math.round((loan.totalToPay / count) * 100) / 100;
    
    let totalPaidSoFar = loan.totalToPay - loan.remainingBalance;
    const frequencyDays = getFrequencyDays(loan.frequency);

    for (let i = 0; i < count; i++) {
      const date = LoanEngine.getNextDate(loan.startDate, loan.frequency, i + 1, loan.startDate);
      let status: Installment['status'] = 'Pendiente';
      let paidOnThis = 0;

      if (totalPaidSoFar >= amountPerInstallment - 0.1) {
        status = 'Pagado';
        paidOnThis = amountPerInstallment;
        totalPaidSoFar -= amountPerInstallment;
      } else if (totalPaidSoFar > 0) {
        status = 'Parcial';
        paidOnThis = totalPaidSoFar;
        totalPaidSoFar = 0;
      } else {
        if (new Date(date) < new Date() && loan.remainingBalance > 0) {
          status = 'Atrasado';
        }
      }

      installments.push({
        number: i + 1,
        date,
        amount: amountPerInstallment,
        status,
        paidAmount: Math.round(paidOnThis * 100) / 100
      });
    }
    return installments;
  };

  const currentLoanInstallments = selectedLoan ? generateInstallments(selectedLoan) : [];

  // Auto-populate amount & settings when selectedLoan is resolved
  useEffect(() => {
    if (!selectedLoan) return;
    const isRedito = Boolean(selectedLoan.loanType && (
      selectedLoan.loanType.includes('Rédito') || 
      selectedLoan.loanType.includes('Redito') || 
      selectedLoan.loanType.includes('Solo Interé') || 
      selectedLoan.loanType.includes('Pagaré Abierto')
    ));

    if (isRedito) {
      setPaymentType('Interes');
      setPaymentMode('manual');
      const interestAmount = Math.round(selectedLoan.remainingBalance * (selectedLoan.interestRate / 100) * 100) / 100;
      setPayAmount(interestAmount.toFixed(2));
      setPayNote('Pago de Interés (Rédito)');
    } else {
      const insts = generateInstallments(selectedLoan);
      const pendingInst = insts.find(i => i.status !== 'Pagado');
      const sugerida = pendingInst ? (pendingInst.amount - pendingInst.paidAmount) : selectedLoan.remainingBalance;
      setPayAmount((Math.round(sugerida * 100) / 100).toFixed(2));
    }
  }, [selectedLoan?.id, loans.length]);

  const getSuggestedAutoAmount = () => {
    if (!selectedLoan) return 0;
    const isRedito = Boolean(selectedLoan.loanType && (
      selectedLoan.loanType.includes('Rédito') || 
      selectedLoan.loanType.includes('Redito') || 
      selectedLoan.loanType.includes('Solo Interé') || 
      selectedLoan.loanType.includes('Pagaré Abierto')
    ));
    if (isRedito) {
      return Math.round(selectedLoan.remainingBalance * (selectedLoan.interestRate / 100) * 100) / 100;
    }
    const pendingInst = currentLoanInstallments.find(i => i.status !== 'Pagado');
    return pendingInst ? Math.round((pendingInst.amount - pendingInst.paidAmount) * 100) / 100 : selectedLoan.remainingBalance;
  };

  const autoSuggestedAmount = getSuggestedAutoAmount();

  const handlePaymentTypeChange = (newType: 'Interes' | 'Capital' | 'Mixto') => {
    setPaymentType(newType);
    if (!selectedLoan) return;
    if (newType === 'Interes') {
      const interestAmount = Math.round(selectedLoan.remainingBalance * (selectedLoan.interestRate / 100) * 100) / 100;
      setPayAmount(interestAmount.toFixed(2));
      setPayNote('Pago de Interés (Rédito)');
    } else if (newType === 'Capital') {
      setPayAmount(selectedLoan.remainingBalance.toFixed(2));
      setPayNote('Abono Directo a Capital');
    } else if (newType === 'Mixto') {
      const interestAmount = Math.round(selectedLoan.remainingBalance * (selectedLoan.interestRate / 100) * 100) / 100;
      setPayAmount(interestAmount.toFixed(2));
      setCapitalAmount('0.00');
      setPayNote('Pago Mixto (Interés + Capital)');
    }
  };

  // --- Real-time Metrics Calculations ---
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const paymentTransactions = useMemo(() => {
    return transactions
      .filter(t => t && t.type === 'Ingreso' && (t.category === 'Pago Préstamo' || Boolean(t.referenceId)))
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [transactions]);

  const todayPayments = useMemo(() => {
    return paymentTransactions.filter(t => {
      const tDate = String(t.date || '').split('T')[0];
      return tDate === todayStr;
    });
  }, [paymentTransactions, todayStr]);

  const todayTotal = useMemo(() => {
    return todayPayments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [todayPayments]);

  const monthPayments = useMemo(() => {
    return paymentTransactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(String(t.date));
      return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [paymentTransactions, now]);

  const monthTotal = useMemo(() => {
    return monthPayments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [monthPayments]);

  const overdueLoans = useMemo(() => {
    return loans.filter(l => l && (l.status === LoanStatus.OVERDUE || (l.status as string) === 'Vencido' || (l.remainingBalance > 0 && l.nextPaymentDate && new Date(l.nextPaymentDate) < now)));
  }, [loans, now]);

  const overdueTotal = useMemo(() => {
    return overdueLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  }, [overdueLoans]);

  const dueTodayLoans = useMemo(() => {
    return loans.filter(l => {
      if (!l || l.remainingBalance <= 0 || l.status === LoanStatus.PAID) return false;
      const nDate = l.nextPaymentDate ? String(l.nextPaymentDate).split('T')[0] : '';
      return nDate === todayStr;
    });
  }, [loans, todayStr]);

  const totalBankBalance = useMemo(() => {
    return bankAccounts.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
  }, [bankAccounts]);

  // Main Live Stream Filtered Payments
  const displayedMainFeedPayments = useMemo(() => {
    const term = historySearch.toLowerCase().trim();
    
    return paymentTransactions.filter(t => {
      // 1. Time Filter
      if (mainFeedFilter === 'hoy') {
        const tDate = String(t.date || '').split('T')[0];
        if (tDate !== todayStr) return false;
      } else if (mainFeedFilter === 'semana') {
        const tDate = new Date(String(t.date || ''));
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (tDate < weekAgo) return false;
      } else if (mainFeedFilter === 'mes') {
        const tDate = new Date(String(t.date || ''));
        if (isNaN(tDate.getTime()) || tDate.getMonth() !== now.getMonth() || tDate.getFullYear() !== now.getFullYear()) return false;
      }

      // 2. Search Filter
      if (!term) return true;
      const desc = (t.description || '').toLowerCase();
      const recId = formatReceiptId(t.id).toLowerCase();
      const rawId = (t.id || '').toLowerCase();
      const refId = (t.referenceId || '').toLowerCase();
      const matchedLoan = loans.find(l => l.id === t.referenceId);
      const matchedClient = matchedLoan ? clients.find(c => c.id === matchedLoan.clientId) : undefined;
      const clientName = (matchedClient ? `${matchedClient.name} ${matchedClient.lastName || ''}`.trim() : (matchedLoan?.clientName || '')).toLowerCase();

      return desc.includes(term) || recId.includes(term) || rawId.includes(term) || refId.includes(term) || clientName.includes(term);
    });
  }, [paymentTransactions, mainFeedFilter, historySearch, todayStr, now, loans, clients]);

  // Mobile Quick Feed Filtered Payments
  const quickFeedPayments = useMemo(() => {
    const term = mobileQuickSearch.toLowerCase().trim();
    if (!term) return paymentTransactions;
    return paymentTransactions.filter(t => {
      const desc = (t.description || '').toLowerCase();
      const recId = formatReceiptId(t.id).toLowerCase();
      const rawId = (t.id || '').toLowerCase();
      const refId = (t.referenceId || '').toLowerCase();
      const method = (t.paymentMethod || '').toLowerCase();
      const amountStr = String(t.amount || '');
      const matchedLoan = loans.find(l => 
        l.id === t.referenceId || 
        formatLoanId(l.id) === t.referenceId || 
        formatLoanId(l.id).replace(/\s+/g, '') === (t.referenceId || '').replace(/\s+/g, '')
      );
      const matchedClient = matchedLoan ? clients.find(c => c.id === matchedLoan.clientId) : (t.referenceId ? clients.find(c => c.id === t.referenceId) : undefined);
      const clientFullName = (matchedClient ? `${matchedClient.name} ${matchedClient.lastName || ''}`.trim() : (matchedLoan?.clientName || '')).toLowerCase();
      const cedula = (matchedClient?.cedula || matchedClient?.documentId || '').toLowerCase();

      return (
        desc.includes(term) ||
        recId.includes(term) ||
        rawId.includes(term) ||
        refId.includes(term) ||
        clientFullName.includes(term) ||
        cedula.includes(term) ||
        method.includes(term) ||
        amountStr.includes(term)
      );
    });
  }, [paymentTransactions, mobileQuickSearch, loans, clients]);

  // Quick Pay Modal Loan Picker
  const quickPayFilteredLoans = useMemo(() => {
    const term = quickPayLoanSearch.toLowerCase().trim();
    const activeLoans = loans.filter(l => l && l.remainingBalance > 0 && l.status !== LoanStatus.PAID);
    if (!term) return activeLoans;
    return activeLoans.filter(loan => {
      const client = clients.find(c => c.id === loan.clientId);
      const clientName = (client ? `${client.name} ${client.lastName || ''}`.trim() : (loan.clientName || '')).toLowerCase();
      const cedula = (client?.cedula || client?.documentId || '').toLowerCase();
      const loanFormatted = formatLoanId(loan.id, loan.loanCategory, loan.loanType).toLowerCase();
      const rawId = loan.id.toLowerCase();
      return clientName.includes(term) || cedula.includes(term) || loanFormatted.includes(term) || rawId.includes(term);
    });
  }, [loans, clients, quickPayLoanSearch]);

  // --- Handlers ---
  const handleToggleInstallment = (inst: Installment) => {
    if (inst.status === 'Pagado') return;

    const isSelected = selectedInstallments.includes(inst.number);
    let newSelection: number[] = [];

    if (isSelected) {
      newSelection = selectedInstallments.filter(n => n !== inst.number);
    } else {
      newSelection = [...selectedInstallments, inst.number];
    }

    setSelectedInstallments(newSelection);

    const total = newSelection.reduce((acc, num) => {
      const item = currentLoanInstallments.find(i => i.number === num);
      const toPay = item ? item.amount - item.paidAmount : 0;
      return acc + toPay;
    }, 0);

    setPayAmount(total.toFixed(2));
    setPayNote(newSelection.length > 1 ? `Pago de ${newSelection.length} cuotas` : newSelection.length === 1 ? `Pago cuota #${newSelection[0]}` : 'Cuota Regular');
  };

  const handleSaldarFull = () => {
    if (!selectedLoan) return;
    setPaymentMode('manual');
    setPayAmount(selectedLoan.remainingBalance.toFixed(2));
    setPaymentType('Capital');
    setPayNote('Saldado Completo del Préstamo');
  };

  const handlePayment = async () => {
    if (!selectedLoanId || !payAmount || !selectedLoan) return;
    
    const amountVal = Number(payAmount);
    const previousBalance = selectedLoan.remainingBalance;
    
    const isReditoLoan = Boolean(selectedLoan?.loanType && (
      selectedLoan.loanType.includes('Rédito') || 
      selectedLoan.loanType.includes('Redito') || 
      selectedLoan.loanType.includes('Solo Interé') || 
      selectedLoan.loanType.includes('Pagaré Abierto')
    ));

    let newBalance = Math.max(0, previousBalance - amountVal);
    if (isReditoLoan) {
      const currentInterestDue = Math.round((previousBalance * (selectedLoan.interestRate / 100)) * 100) / 100;
      if (paymentType === 'Capital') {
        newBalance = Math.max(0, previousBalance - amountVal);
      } else if (paymentType === 'Mixto') {
        const capVal = Number(capitalAmount) || 0;
        newBalance = Math.max(0, previousBalance - capVal);
      } else {
        if (amountVal > currentInterestDue && currentInterestDue > 0) {
          const excessCapital = Math.round((amountVal - currentInterestDue) * 100) / 100;
          newBalance = Math.max(0, previousBalance - excessCapital);
        } else {
          newBalance = previousBalance;
        }
      }
    }
    
    const lateVal = Number(lateFeeAmount) || 0;
    const discVal = Number(discountAmount) || 0;
    const effectiveTotal = amountVal + lateVal - discVal;
    const capitalAmountVal = paymentType === 'Mixto' ? Number(capitalAmount) : undefined;

    // Check if the payment date falls into a locked/closed accounting period
    const targetCheckDate = paymentDate || invoiceDate || new Date().toISOString().split('T')[0];
    const lockCheck = isDateInLockedPeriod(targetCheckDate);
    if (lockCheck.isLocked) {
      toast.error(lockCheck.reason || 'Período contable cerrado y auditado. No se pueden registrar pagos en esta fecha.');
      return;
    }

    // Combine exact date and time
    const exactPaymentDateTime = combineDateAndTimeToISO(paymentDate || new Date().toISOString().split('T')[0], paymentTime);

    // Register the payment with exact date and time
    const insertedTxs = await registerPayment(
      selectedLoanId, 
      effectiveTotal, 
      payNote, 
      exactPaymentDateTime, 
      invoiceDate, 
      paymentType, 
      capitalAmountVal, 
      paymentMethod, 
      selectedCashierId || undefined,
      selectedBankAccountId || undefined,
      proofUrl || undefined
    );

    if (effectiveTotal > 0) {
      processBankDeposit(selectedBankAccountId || undefined, effectiveTotal);
    }
    
    const insertedTx = Array.isArray(insertedTxs) ? insertedTxs[0] : insertedTxs;
    const actualTxId = insertedTx?.id || `REC-${String(Date.now()).slice(-6)}`;
    const formattedRecNo = formatReceiptId(actualTxId);

    addNotification({
      title: 'Pago Recibido',
      message: `Cobro de RD$ ${effectiveTotal.toLocaleString()} registrado para ${selectedLoan.clientName} (Recibo #${formattedRecNo}).`,
      type: 'success',
      link: '/pagos'
    });

    const otherActiveLoans = loans
      .filter(l => l.clientId === selectedLoan.clientId && l.id !== selectedLoanId && l.status !== LoanStatus.PAID)
      .map(l => ({ id: l.id, balance: l.remainingBalance }));

    const selectedLoanClient = clients.find(c => c.id === selectedLoan.clientId);
    const exactPayTime = paymentTime ? `${paymentTime}:00` : formatExactTime(null, true);
    const resolvedClientName = selectedLoanClient 
      ? `${selectedLoanClient.name} ${selectedLoanClient.lastName || ''}`.trim() 
      : selectedLoan.clientName;
    const nextCalc = calculateLoanNextPaymentDate(selectedLoan, [
      ...transactions.filter(t => t.referenceId === selectedLoan.id || t.reference_id === selectedLoan.id),
      ...(Array.isArray(insertedTxs) ? insertedTxs : (insertedTxs ? [insertedTxs] : []))
    ]);

    const fullReceipt: FullReceiptData = {
      loanId: formatLoanId(selectedLoan.id, selectedLoan.loanCategory, selectedLoan.loanType),
      amountPaid: effectiveTotal,
      clientName: resolvedClientName,
      clientId: selectedLoan.clientId,
      clientCedula: selectedLoanClient?.cedula || selectedLoanClient?.documentId || selectedLoanClient?.clientCode,
      clientPhone: selectedLoanClient?.phone,
      loanType: selectedLoan.loanType,
      totalDebt: Number(selectedLoan.totalToPay || selectedLoan.amount) || 0,
      capitalAmount: paymentType === 'Capital' ? effectiveTotal : undefined,
      interestAmount: paymentType !== 'Capital' ? effectiveTotal : undefined,
      previousBalance: previousBalance,
      newBalance: newBalance,
      transactionId: actualTxId,
      receiptNo: formattedRecNo,
      lateFeeAmount: lateVal,
      discountAmount: discVal,
      date: formatExactDate(paymentDate),
      time: exactPayTime,
      nextPaymentDate: (newBalance <= 0 || nextCalc.fullyPaid) ? undefined : (nextCalc.nextPaymentDate || selectedLoan.nextPaymentDate),
      collateral: selectedLoan.collateralType ? `${selectedLoan.collateralType} - ${selectedLoan.collateralDescription || ''}` : 'Sin Garantía',
      overdueAmount: 0, 
      overdueInstallments: 0,
      totalInstallments: selectedLoan.durationWeeks || selectedLoan.installments || 1,
      paidInstallments: 1,
      otherLoans: otherActiveLoans,
      cashierName: currentUser?.name || 'Sistema',
      paymentNote: payNote,
      renewalStatus: newBalance < (selectedLoan.totalToPay * 0.5) ? 'DISPONIBLE' : 'No disponible',
      paymentMethod: paymentMethod
    };

    setReceiptData(fullReceipt);
    setLateFeeAmount('');
    setDiscountAmount('');

    // Reset Form
    setSelectedInstallments([]);
    setPayAmount('');
    setPayNote('Cuota Regular');
    setSelectedLoanId(null);
    setSearchTerm('');
    setIsMobileQuickPayModalOpen(false);
    setQuickPayLoanSearch('');

    toast.success("¡Pago registrado y aplicado exitosamente!");
  };

  const handleOpenThermalReceipt = (t: Transaction) => {
    const loan = loans.find(l => 
      l.id === t.referenceId || 
      formatLoanId(l.id) === t.referenceId || 
      formatLoanId(l.id).replace(/\s+/g, '') === (t.referenceId || '').replace(/\s+/g, '')
    );
    const client = loan ? clients.find(c => c.id === loan.clientId) : (t.referenceId ? clients.find(c => c.id === t.referenceId) : undefined);
    const clientName = client ? `${client.name} ${client.lastName || ''}`.trim() : (loan ? (loan.clientName || loan.clientname) : (t.description?.split('-')[1]?.trim() || 'Cliente'));

    const formattedRecNo = formatReceiptId(t.id);
    const calculated = calculateReceiptBalances(t, loan, transactions);

    const data: ThermalReceiptData = {
      receiptNo: formattedRecNo,
      date: formatExactDate(t.date),
      time: formatExactTime(t.date, true),
      clientName: clientName,
      clientCedula: client?.cedula || client?.documentId || client?.clientCode,
      clientPhone: client?.phone,
      loanId: loan ? loan.id : (t.referenceId || ''),
      loanType: loan?.loanType || (calculated.isOpenLoan ? 'Pagaré Abierto / Solo Interés' : 'Amortizado'),
      loanAmount: loan?.amount,
      totalDebt: calculated.totalDebt,
      installmentInfo: calculated.installmentText || (loan ? `Cuota ${loan.frequency}` : undefined),
      installmentNumber: calculated.installmentNumber,
      totalInstallments: calculated.totalInstallments,
      remainingInstallments: calculated.remainingInstallments,
      remainingInstallmentsText: calculated.remainingInstallmentsText,
      amountPaid: calculated.amountPaid,
      capitalAmount: calculated.capitalPaid,
      interestAmount: calculated.interestPaid,
      lateFeeAmount: calculated.lateFeePaid,
      discountAmount: calculated.discountPaid,
      previousBalance: calculated.previousBalance,
      newBalance: calculated.newBalance,
      paymentMethod: t.paymentMethod || 'Efectivo',
      paymentType: t.paymentType,
      cashierName: currentUser?.name || 'Caja',
      nextPaymentDate: calculated.nextPaymentDate || loan?.nextPaymentDate,
      notes: t.description,
      transactionId: t.id,
      clientId: client?.id || loan?.clientId
    };

    setThermalModalData(data);
  };

  const handleShareWhatsApp = (t: Transaction) => {
    const loan = loans.find(l => 
      l.id === t.referenceId || 
      formatLoanId(l.id) === t.referenceId || 
      formatLoanId(l.id).replace(/\s+/g, '') === (t.referenceId || '').replace(/\s+/g, '')
    );
    const client = loan ? clients.find(c => c.id === loan.clientId) : (t.referenceId ? clients.find(c => c.id === t.referenceId) : undefined);
    const clientName = client ? `${client.name} ${client.lastName || ''}`.trim() : (loan ? (loan.clientName || loan.clientname) : 'Cliente');
    const formattedRecNo = formatReceiptId(t.id);
    const calculated = calculateReceiptBalances(t, loan, transactions);
    const url = `${window.location.origin}/recibo/${t.id}`;
    const nextPayTxt = calculated.nextPaymentDateText ? `\n*Próximo Pago*: ${calculated.nextPaymentDateText}` : (loan?.nextPaymentDate ? `\n*Próximo Pago*: ${formatPaymentDateDisplay(loan.nextPaymentDate)}` : '');
    
    const text = `*${companySettings.name}*\n*Recibo de Cobro*: ${formattedRecNo}\n*Fecha y Hora*: ${formatExactDateTime(t.date)}\n*Cliente*: ${clientName}\n*Monto Recibido*: RD$ ${Number(t.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n*Saldo Restante*: RD$ ${Number(calculated.newBalance).toLocaleString('es-DO', { minimumFractionDigits: 2 })}${nextPayTxt}\n\nPuede ver y descargar su recibo oficial aquí:\n${url}`;
    
    const targetPhone = client?.phone ? client.phone.replace(/[^0-9]/g, '') : '';
    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone.length === 10 ? '1' + targetPhone : targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
      
    window.open(waUrl, '_blank');
  };

  const toggleClientExpand = (clientId: string) => {
    setExpandedClients(prev => 
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  // --- Search Logic for Quick Cashier Input ---
  const filteredLoans = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return loans.filter(l => {
      const client = clients.find(c => c.id === l.clientId);
      const clientFullName = client ? `${client.name} ${client.lastName || ''}`.trim().toLowerCase() : (l.clientName || '').toLowerCase();
      const matchesLoan = l.id.toLowerCase().includes(term);
      const matchesName = clientFullName.includes(term) || (l.clientName || '').toLowerCase().includes(term);
      const matchesCedula = client ? client.cedula.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, '')) : false;
      return (matchesLoan || matchesName || matchesCedula) && l.remainingBalance > 0;
    }).slice(0, 10);
  }, [searchTerm, loans, clients]);

  // Grouping for Monitor Tab
  const clientGroups = useMemo(() => {
    const groups: Record<string, { 
      clientName: string, 
      clientId: string, 
      totalPending: number, 
      loans: { loan: Loan, installments: Installment[] }[] 
    }> = {};

    loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE).forEach(loan => {
      const insts = generateInstallments(loan).filter(i => i.status !== 'Pagado');
      if (insts.length === 0) return;

      const client = clients.find(c => c.id === loan.clientId);
      const clientFullName = client ? `${client.name} ${client.lastName || ''}`.trim() : loan.clientName;

      if (!groups[loan.clientId]) {
        groups[loan.clientId] = {
          clientName: clientFullName,
          clientId: loan.clientId,
          totalPending: 0,
          loans: []
        };
      }

      const loanPending = insts.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
      groups[loan.clientId].totalPending += loanPending;
      groups[loan.clientId].loans.push({ loan, installments: insts });
    });

    return Object.values(groups);
  }, [loans, clients]);

  return (
    <div className="space-y-6 animate-fade-in relative pb-32 md:pb-12">
      {/* Thermal POS Receipt Modal */}
      {thermalModalData && (
        <ThermalReceiptModal
          isOpen={Boolean(thermalModalData)}
          onClose={() => setThermalModalData(null)}
          data={thermalModalData}
        />
      )}

      {/* Quick Pay Modal for Mobile */}
      {isMobileQuickPayModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white">Realizar un Pago Rápido</h3>
                  <p className="text-xs text-indigo-100">Selecciona el préstamo e ingresa el monto</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileQuickPayModalOpen(false);
                  setSelectedLoanId(null);
                }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {!selectedLoan ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-indigo-500 w-4 h-4" />
                    <input
                      type="text"
                      value={quickPayLoanSearch}
                      onChange={e => setQuickPayLoanSearch(e.target.value)}
                      placeholder="Buscar por cliente, cédula o préstamo..."
                      className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {quickPayLoanSearch && (
                      <button
                        type="button"
                        onClick={() => setQuickPayLoanSearch('')}
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {quickPayFilteredLoans.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <User className="w-8 h-8 mx-auto opacity-40 mb-1" />
                        <p className="text-xs font-bold">No se encontraron préstamos activos</p>
                      </div>
                    ) : (
                      quickPayFilteredLoans.map(loan => {
                        const client = clients.find(c => c.id === loan.clientId);
                        const clientFullName = client ? `${client.name} ${client.lastName || ''}`.trim() : loan.clientName;
                        return (
                          <div
                            key={loan.id}
                            onClick={() => {
                              setSelectedLoanId(loan.id);
                              const isRedito = Boolean(loan.loanType && (
                                loan.loanType.includes('Rédito') || 
                                loan.loanType.includes('Redito') || 
                                loan.loanType.includes('Solo Interé') || 
                                loan.loanType.includes('Pagaré Abierto')
                              ));
                              if (isRedito) {
                                const interest = Math.round(loan.remainingBalance * (loan.interestRate / 100) * 100) / 100;
                                setPayAmount(interest.toFixed(2));
                                setPayNote('Pago de Interés (Rédito)');
                              } else {
                                const insts = generateInstallments(loan);
                                const nextInst = insts.find(i => i.status !== 'Pagado');
                                if (nextInst) {
                                  setSelectedInstallments([nextInst.number]);
                                  setPayAmount((nextInst.amount - nextInst.paidAmount).toFixed(2));
                                  setPayNote(`Pago cuota #${nextInst.number}`);
                                } else {
                                  setPayAmount(loan.remainingBalance.toFixed(2));
                                }
                              }
                            }}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {(clientFullName || 'C').charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 truncate">
                                  {clientFullName}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span className="font-mono text-indigo-500 font-semibold">#{formatLoanId(loan.id, loan.loanCategory, loan.loanType)}</span>
                                  <span>•</span>
                                  <span>{loan.frequency}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                                RD$ {loan.remainingBalance.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                Cobrar
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const loanClient = clients.find(c => c.id === selectedLoan.clientId);
                    const clientFullName = loanClient ? `${loanClient.name} ${loanClient.lastName || ''}`.trim() : selectedLoan.clientName;
                    return (
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                            {(clientFullName || 'C').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{clientFullName}</p>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate">
                              #{formatLoanId(selectedLoan.id, selectedLoan.loanCategory, selectedLoan.loanType)} • Bal: RD$ {selectedLoan.remainingBalance.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedLoanId(null)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline shrink-0"
                        >
                          Cambiar
                        </button>
                      </div>
                    );
                  })()}

                  {Boolean(selectedLoan.loanType && (
                    selectedLoan.loanType.includes('Rédito') || 
                    selectedLoan.loanType.includes('Redito') || 
                    selectedLoan.loanType.includes('Solo Interé') || 
                    selectedLoan.loanType.includes('Pagaré Abierto')
                  )) ? (
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handlePaymentTypeChange('Interes')}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${paymentType === 'Interes' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        Solo Interés
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentTypeChange('Capital')}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${paymentType === 'Capital' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        Capital
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentTypeChange('Mixto')}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${paymentType === 'Mixto' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        Mixto
                      </button>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Monto a Cobrar (RD$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">RD$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-11 pr-3 py-2.5 text-sm sm:text-base font-black border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Hora</label>
                      <input
                        type="time"
                        value={paymentTime}
                        onChange={e => setPaymentTime(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Método de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  {paymentMethod === 'Transferencia' && bankAccounts.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Cuenta Bancaria Destino</label>
                      <select
                        value={selectedBankAccountId}
                        onChange={e => setSelectedBankAccountId(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl"
                      >
                        <option value="">Seleccionar cuenta bancaria...</option>
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.accountType})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Concepto / Nota</label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      placeholder="Ej. Cuota Regular"
                      className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={!payAmount || Number(payAmount) <= 0}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar y Registrar Pago</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Mobile Switcher: Vista Rápida vs Vista Full */}
      <div className="md:hidden flex items-center bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full mb-1 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileViewMode('rapida')}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            mobileViewMode === 'rapida'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Vista Rápida</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileViewMode('full')}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            mobileViewMode === 'full'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Vista Full</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE: VISTA RÁPIDA (Default en móviles)                      */}
      {/* ------------------------------------------------------------- */}
      {mobileViewMode === 'rapida' && (
        <div className="md:hidden space-y-4 animate-fade-in">
          {/* 1. Barra de Búsqueda de Pagos */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-indigo-500 w-5 h-5" />
              <input 
                type="text" 
                value={mobileQuickSearch}
                onChange={e => setMobileQuickSearch(e.target.value)}
                placeholder="Buscar pagos por cliente, recibo (#REC-...), préstamo o monto..." 
                className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs placeholder-slate-400"
              />
              {mobileQuickSearch && (
                <button 
                  type="button"
                  onClick={() => setMobileQuickSearch('')}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Botón de Realizar un Pago */}
          <button
            type="button"
            onClick={() => {
              setSelectedLoanId(null);
              setQuickPayLoanSearch('');
              setIsMobileQuickPayModalOpen(true);
            }}
            className="w-full py-4 px-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-sm sm:text-base rounded-3xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Realizar un Pago</span>
          </button>

          {/* 3. Lista de Pagos Recientes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Pagos Recientes</span>
              </h3>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                {quickFeedPayments.length} recibos
              </span>
            </div>

            {quickFeedPayments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No se encontraron pagos registrados</p>
                <p className="text-xs text-slate-400 mt-1">Los cobros registrados aparecerán aquí en tiempo real.</p>
              </div>
            ) : (
              quickFeedPayments.map(t => {
                const loan = loans.find(l => 
                  l.id === t.referenceId || 
                  formatLoanId(l.id) === t.referenceId || 
                  formatLoanId(l.id).replace(/\s+/g, '') === (t.referenceId || '').replace(/\s+/g, '')
                );
                const client = loan ? clients.find(c => c.id === loan.clientId) : (t.referenceId ? clients.find(c => c.id === t.referenceId) : undefined);
                const clientName = client ? `${client.name} ${client.lastName || ''}`.trim() : (loan ? (loan.clientName || loan.clientname) : (t.description?.split('-')[1]?.trim() || 'Cliente'));
                const formattedRecNo = formatReceiptId(t.id);
                const formattedLoanIdText = loan ? formatLoanId(loan.id, loan.loanCategory, loan.loanType) : (t.referenceId || '');
                const exactTimeStr = formatExactDateTime(t.date || t.createdAt);

                return (
                  <div 
                    key={t.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 transition-all hover:shadow-md"
                  >
                    {/* Client & Amount Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-sm shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                          {(clientName || 'C').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                            {clientName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              Recibo #{formattedRecNo}
                            </span>
                            {formattedLoanIdText && (
                              <>
                                <span>•</span>
                                <span className="font-mono">Préstamo #{formattedLoanIdText}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block">
                          RD$ {(Number(t.amount) || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {t.paymentMethod || 'Efectivo'}
                        </span>
                      </div>
                    </div>

                    {/* Date / Time and Note */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exactTimeStr}</span>
                      </span>
                      {t.description && (
                        <span className="truncate max-w-[180px] text-[11px] text-slate-500 italic">
                          {t.description}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenThermalReceipt(t)}
                        className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                        title="Ticket Térmico (58/80mm)"
                      >
                        <Printer className="w-3.5 h-3.5 shrink-0" />
                        <span>Ticket</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(t)}
                        className="py-2 px-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] dark:text-[#25D366] rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                        title="Enviar por WhatsApp"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/recibo/${t.id}`)}
                        className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                        title="Ver Recibo Oficial"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>Recibo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTransactionToEdit(t);
                          setIsEditModalOpen(true);
                        }}
                        className="py-2 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                        title="Editar Pago"
                      >
                        <Edit3 className="w-3.5 h-3.5 shrink-0" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VISTA FULL (Intacta en Escritorio y cuando se activa en móvil) */}
      {/* ------------------------------------------------------------- */}
      <div className={`${mobileViewMode === 'rapida' ? 'hidden md:block' : 'block'} space-y-6`}>
        {/* Top Header & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
              title="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  Módulo de Cobranza & Caja
                </h2>
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En Vivo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Registra cobros rápidos, imprime tickets térmicos y consulta el historial en tiempo real.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shrink-0">
          <button 
            onClick={() => { setActiveTab('registrar'); setSelectedLoanId(null); }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'registrar' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'}`}
          >
            <Zap className="w-4 h-4" />
            <span>Cobranza & Historial</span>
          </button>
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'monitor' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'}`}
          >
            <List className="w-4 h-4" />
            <span>Monitor Cuotas</span>
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'historial' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>Reportes / Filtro Fecha</span>
          </button>
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg shadow-emerald-600/20 relative overflow-hidden group">
          <div className="absolute right-3 bottom-3 opacity-15 group-hover:scale-110 transition-transform">
            <Banknote className="w-16 h-16 text-white" />
          </div>
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Cobros de Hoy</p>
          <h3 className="text-2xl font-black mt-1">RD$ {todayTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-100 bg-white/15 w-fit px-2.5 py-0.5 rounded-lg backdrop-blur-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{todayPayments.length} Recibos registrados hoy</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white p-5 rounded-3xl shadow-lg shadow-indigo-600/20 relative overflow-hidden group">
          <div className="absolute right-3 bottom-3 opacity-15 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-16 h-16 text-white" />
          </div>
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Cobros del Mes</p>
          <h3 className="text-2xl font-black mt-1">RD$ {monthTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-100 bg-white/15 w-fit px-2.5 py-0.5 rounded-lg backdrop-blur-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{monthPayments.length} Cobros acumulados</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 via-rose-600 to-red-700 text-white p-5 rounded-3xl shadow-lg shadow-rose-600/20 relative overflow-hidden group">
          <div className="absolute right-3 bottom-3 opacity-15 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-16 h-16 text-white" />
          </div>
          <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Mora / Cuotas Vencidas</p>
          <h3 className="text-2xl font-black mt-1">RD$ {overdueTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-100 bg-white/15 w-fit px-2.5 py-0.5 rounded-lg backdrop-blur-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{overdueLoans.length} Préstamos con atrasos</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Cuentas & Caja</span>
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              RD$ {totalBankBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{bankAccounts.length} Cuentas / Cajas</span>
            <Link to="/cuentas" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">Ver saldos ➔</Link>
          </div>
        </div>
      </div>

      {/* Pending Bank Deposits Banner */}
      {pendingBankDeposits.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Tienes {pendingBankDeposits.length} transferencias bancarias pendientes</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h4>
              <p className="text-xs text-slate-300">
                Total por conciliar: <strong className="text-emerald-300">RD$ {pendingBankDeposits.reduce((s, d) => s + d.amount, 0).toLocaleString()}</strong>. Puedes aplicarlas directamente a préstamos con 1 solo clic.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/conciliacion')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Ir a Conciliación Bancaria</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: COBRANZA & HISTORIAL PRINCIPAL                                     */}
      {/* ========================================================================= */}
      {activeTab === 'registrar' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Smart Search Bar & Quick Loan Picker */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-500 w-5 h-5" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar préstamo por cliente, cédula (#001-...) o código (#PR-0001)..." 
                  className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs placeholder-slate-400"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {searchTerm && filteredLoans.length > 0 && !selectedLoan && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl mt-2 z-30 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 animate-fadeIn">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Préstamos Encontrados ({filteredLoans.length})
                    </div>
                    {filteredLoans.map(loan => {
                      const client = clients.find(c => c.id === loan.clientId);
                      const clientFullName = client ? `${client.name} ${client.lastName || ''}`.trim() : loan.clientName;
                      return (
                        <div 
                          key={loan.id} 
                          onClick={() => { setSelectedLoanId(loan.id); setSearchTerm(''); }}
                          className="p-3.5 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shrink-0">
                              {(clientFullName || 'C').charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 text-sm">
                                {clientFullName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="font-mono font-semibold text-indigo-500">#{formatLoanId(loan.id, loan.loanCategory, loan.loanType)}</span>
                                {client && <span>• {maskCedula(client.cedula)}</span>}
                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded text-[10px] text-slate-600 dark:text-slate-300">{loan.frequency}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm block">
                              RD$ {loan.remainingBalance.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all inline-block mt-0.5">
                              Cobrar Ahora ➔
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action indicator */}
              {selectedLoan ? (
                <button 
                  onClick={() => setSelectedLoanId(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" /> Deseleccionar Préstamo
                </button>
              ) : null}
            </div>

            {/* Quick Due Pill Filters */}
            {!selectedLoan && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Accesos Rápidos:
                </span>
                {overdueLoans.length > 0 && (
                  <button 
                    onClick={() => {
                      const first = overdueLoans[0];
                      if (first) setSelectedLoanId(first.id);
                    }}
                    className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Cobrar Préstamo en Mora ({overdueLoans.length})</span>
                  </button>
                )}
                {dueTodayLoans.length > 0 && (
                  <button 
                    onClick={() => {
                      const first = dueTodayLoans[0];
                      if (first) setSelectedLoanId(first.id);
                    }}
                    className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Cobrar Cuota de Hoy ({dueTodayLoans.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* A: SELECTED LOAN PAYMENT DESK (When loan is active)                   */}
          {/* ===================================================================== */}
          {selectedLoan ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-indigo-100 dark:border-slate-800 shadow-xl shadow-indigo-500/5 space-y-6 animate-fadeIn">
              
              {/* Header Profile of Selected Loan */}
              {(() => {
                const loanClient = clients.find(c => c.id === selectedLoan.clientId);
                const loanClientFullName = loanClient ? `${loanClient.name} ${loanClient.lastName || ''}`.trim() : selectedLoan.clientName;
                return (
                  <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-indigo-600/30">
                        {(loanClientFullName || 'C').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                          {loanClientFullName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            Préstamo #{formatLoanId(selectedLoan.id, selectedLoan.loanCategory, selectedLoan.loanType)}
                          </span>
                      <span>•</span>
                      <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-semibold">
                        {selectedLoan.frequency}
                      </span>
                      <span>•</span>
                      <span>Tipo: {selectedLoan.loanType}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-left md:text-right">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Balance Pendiente</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      RD$ {selectedLoan.remainingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedLoanId(null)}
                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                    title="Cerrar cobro"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })()}

              {/* Mode Toggle & Suggested Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => { setPaymentMode('cuotas'); setSelectedInstallments([]); }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${paymentMode === 'cuotas' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Seleccionar Cuotas</span>
                  </button>
                  <button 
                    onClick={() => { setPaymentMode('manual'); }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${paymentMode === 'manual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Monto Libre / Abono</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPayAmount(autoSuggestedAmount.toFixed(2))}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs rounded-xl border border-indigo-100 dark:border-indigo-800 transition-colors"
                  >
                    Cuota Sugerida (RD$ {autoSuggestedAmount.toLocaleString()})
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaldarFull}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-100 dark:border-emerald-800 transition-colors"
                  >
                    Saldar Total (RD$ {selectedLoan.remainingBalance.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Installment Table Selection Mode */}
              {paymentMode === 'cuotas' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <List className="w-4 h-4 text-indigo-600" /> Tabla de Cuotas y Amortización
                    </span>
                    <span className="text-slate-400">Marca las casillas para sumar el cobro</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {currentLoanInstallments.map((inst) => (
                      <div 
                        key={inst.number} 
                        onClick={() => handleToggleInstallment(inst)}
                        className={`p-3.5 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors ${selectedInstallments.includes(inst.number) ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black font-mono ${selectedInstallments.includes(inst.number) ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            #{inst.number}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Vencimiento: {inst.date}</p>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase inline-block mt-0.5 ${
                              inst.status === 'Pagado' ? 'bg-emerald-100 text-emerald-700' :
                              inst.status === 'Atrasado' ? 'bg-rose-100 text-rose-700' :
                              inst.status === 'Parcial' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {inst.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                              RD$ {(inst.amount - inst.paidAmount).toLocaleString()}
                            </span>
                          </div>
                          {inst.status !== 'Pagado' && (
                            <div className={`p-1 rounded-lg ${selectedInstallments.includes(inst.number) ? 'text-indigo-600' : 'text-slate-300'}`}>
                              {selectedInstallments.includes(inst.number) ? <CheckCircle className="w-5 h-5 fill-indigo-100" /> : <CheckSquare className="w-5 h-5" />}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Input Desk Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monto a Cobrar (RD$)</label>
                  <input 
                    type="number"
                    step="any"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-indigo-50/40 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl text-xl font-black text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Concepto / Nota</label>
                  <input 
                    type="text"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    placeholder="Cuota Regular"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Método de Pago</label>
                  <CustomSelect 
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                    className="w-full"
                    options={[
                      { value: 'Efectivo', label: 'Efectivo en Caja' },
                      { value: 'Transferencia', label: 'Transferencia Bancaria' },
                      { value: 'Tarjeta', label: 'Tarjeta de Crédito / Débito' },
                      { value: 'Verifone / POS', label: 'Verifone / Terminal POS' },
                      { value: 'Cheque', label: 'Cheque' }
                    ]}
                  />
                </div>
              </div>

              {/* Exact Date & Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Fecha del Cobro
                  </label>
                  <input 
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> Hora Exacta de Cobro
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const h = String(now.getHours()).padStart(2, '0');
                        const m = String(now.getMinutes()).padStart(2, '0');
                        setPaymentTime(`${h}:${m}`);
                        toast.info(`Hora fijada a las ${h}:${m}`);
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Hora actual
                    </button>
                  </div>
                  <input 
                    type="time"
                    step="1"
                    value={paymentTime}
                    onChange={e => setPaymentTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Advanced Bank Account & Proof Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destino / Cuenta Bancaria (Opcional)</label>
                  <CustomSelect 
                    value={selectedBankAccountId}
                    onChange={(val) => setSelectedBankAccountId(val)}
                    className="w-full"
                    options={[
                      { value: '', label: '-- Caja General por Defecto --' },
                      ...bankAccounts.map(b => ({
                        value: b.id,
                        label: `${b.bankName} - ${b.accountName} (Bal: RD$ ${(b.balance || 0).toLocaleString()})`
                      }))
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Adjuntar Comprobante (Voucher)</label>
                  <input 
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setProofUrl(ev.target?.result as string);
                          toast.success('Comprobante adjuntado correctamente');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Final Confirm Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setSelectedLoanId(null)}
                  className="px-5 py-3 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePayment}
                  disabled={!payAmount || Number(payAmount) <= 0}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>APLICAR PAGO & GENERAR RECIBO (RD$ {Number(payAmount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })})</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* ===================================================================== */}
          {/* B: LIVE PAYMENT STREAM & COMPREHENSIVE HISTORY (MAIN PAGE DEFAULT)   */}
          {/* ===================================================================== */}
          {!selectedLoan && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left 2 Cols: Main Live Payment Stream & Comprehensive Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  
                  {/* Feed Header with Live Filter Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base sm:text-lg">
                          Historial de Pagos & Cobros Recientes
                        </h3>
                        <p className="text-xs text-slate-400">
                          {displayedMainFeedPayments.length} transacciones registradas
                        </p>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                      <button 
                        onClick={() => setMainFeedFilter('todos')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${mainFeedFilter === 'todos' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-500'}`}
                      >
                        Todos ({paymentTransactions.length})
                      </button>
                      <button 
                        onClick={() => setMainFeedFilter('hoy')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${mainFeedFilter === 'hoy' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-500'}`}
                      >
                        Hoy ({todayPayments.length})
                      </button>
                      <button 
                        onClick={() => setMainFeedFilter('semana')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${mainFeedFilter === 'semana' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-500'}`}
                      >
                        Semana
                      </button>
                      <button 
                        onClick={() => setMainFeedFilter('mes')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${mainFeedFilter === 'mes' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-500'}`}
                      >
                        Mes ({monthPayments.length})
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick Search inside History */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Filtrar por cliente, referencia, recibo o descripción..." 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>

                  {/* Payment Records Feed / Table */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {displayedMainFeedPayments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <Receipt className="w-12 h-12 mx-auto text-slate-300 opacity-40" />
                        <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No hay pagos registrados con estos filtros.</p>
                        <p className="text-xs">Los nuevos cobros aplicados aparecerán automáticamente aquí.</p>
                      </div>
                    ) : (
                      displayedMainFeedPayments.slice(0, 50).map((t) => {
                        const loan = loans.find(l => 
                          l.id === t.referenceId || 
                          formatLoanId(l.id) === t.referenceId || 
                          formatLoanId(l.id).replace(/\s+/g, '') === (t.referenceId || '').replace(/\s+/g, '')
                        );
                        const client = loan ? clients.find(c => c.id === loan.clientId) : (t.referenceId ? clients.find(c => c.id === t.referenceId) : undefined);
                        const clientName = client ? `${client.name} ${client.lastName || ''}`.trim() : (loan?.clientName || loan?.clientname || (t.description?.split('-')[1]?.trim() || 'Cliente'));
                        const formattedRec = formatReceiptId(t.id);
                        const parsedDate = t.date ? new Date(t.date) : new Date();

                        return (
                          <div 
                            key={t.id}
                            onClick={() => navigate(`/recibo/${t.id}`)}
                            className="py-3.5 px-3 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                            title="Haga clic para ver el recibo oficial digital de este pago"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {client?.avatarUrl ? (
                                <img 
                                  src={client.avatarUrl} 
                                  alt={clientName} 
                                  className="w-10 h-10 rounded-2xl object-cover border border-emerald-200 dark:border-emerald-800 shrink-0 shadow-2xs"
                                  crossOrigin="anonymous" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-200 dark:border-emerald-800">
                                  {clientName.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-slate-800 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                    {clientName}
                                  </span>
                                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900 shrink-0">
                                    {formattedRec}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-indigo-500" />
                                    {formatExactDateTime(t.date)}
                                  </span>
                                  <span>•</span>
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                    {t.paymentMethod || 'Efectivo'}
                                  </span>
                                  {t.paymentType && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                      {t.paymentType}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                              <div className="text-right">
                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base sm:text-lg block">
                                  +RD$ {Number(t.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] inline-block">
                                  {t.description || 'Cobro registrado'}
                                </span>
                              </div>

                              {/* Quick Action Icons */}
                              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xs">
                                <button
                                  onClick={() => {
                                    setSelectedTransactionToEdit(t);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
                                  title="Editar Pago Completamente"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenThermalReceipt(t)}
                                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                  title="Impresión Térmica Directa (58/80mm)"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/recibo/${t.id}`)}
                                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                                  title="Ver Recibo Digital Oficial"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleShareWhatsApp(t)}
                                  className="p-2 text-slate-500 hover:text-[#25D366] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                  title="Enviar Recibo por WhatsApp"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Quick Action Sidebars (Overdue / Due Today Collections) */}
              <div className="space-y-5">
                
                {/* Due Today & Overdue Quick Collect Panel */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        Cobros Pendientes / En Mora
                      </h4>
                    </div>
                    <span className="text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">
                      {overdueLoans.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {overdueLoans.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">
                        <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">¡Al día! No hay préstamos en mora.</p>
                      </div>
                    ) : (
                      overdueLoans.slice(0, 8).map(loan => (
                        <div 
                          key={loan.id}
                          onClick={() => setSelectedLoanId(loan.id)}
                          className="p-3 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-2xl border border-slate-100 dark:border-slate-700/60 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 truncate w-36">
                              {loan.clientName}
                            </p>
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                              {loan.nextPaymentDate ? `Venció: ${loan.nextPaymentDate}` : 'En mora'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                              RD$ {loan.remainingBalance.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-bold group-hover:underline">
                              Cobrar ➔
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-sm">Herramientas de Cobranza</h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Organiza tus rutas con mapa GPS o consulta el monitor de cuotas por cliente.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => navigate('/rutas')}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-center transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Rutas GPS</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('monitor')}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-center transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Monitor Cuotas</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONITOR DE CUOTAS POR CLIENTE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'monitor' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar clientes en monitor de cuotas..." 
              className="w-full bg-transparent text-sm focus:outline-none dark:text-white"
            />
          </div>

          {clientGroups.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-500" />
              <p className="font-bold text-slate-700 dark:text-slate-200">No hay cuotas pendientes para mostrar.</p>
            </div>
          ) : (
            clientGroups.map((group) => {
              const isExpanded = expandedClients.includes(group.clientId);
              const overdueCount = group.loans.reduce((acc, l) => acc + (l.installments || []).filter(i => i.status === 'Atrasado').length, 0);
              
              return (
                <div key={group.clientId} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
                  <div 
                    onClick={() => toggleClientExpand(group.clientId)} 
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${overdueCount > 0 ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'}`}>
                        {(group.clientName || '?').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base sm:text-lg">{group.clientName}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-semibold"><Banknote className="w-3.5 h-3.5" /> {group.loans.length} Préstamo(s)</span>
                          {overdueCount > 0 && (
                            <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full text-xs">
                              <AlertCircle className="w-3 h-3" /> {overdueCount} Atrasos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase font-bold">Total Pendiente</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">RD$ {group.totalPending.toLocaleString()}</p>
                      </div>
                      <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-4 animate-fade-in">
                      {group.loans.map((loanGroup) => (
                        <div key={loanGroup.loan.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                          <div className="px-4 py-3 bg-slate-100/60 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-2">
                              Préstamo #{formatLoanId(loanGroup.loan.id, loanGroup.loan.loanCategory, loanGroup.loan.loanType)} <span className="text-slate-400">•</span> {loanGroup.loan.frequency}
                            </span>
                            <button 
                              onClick={() => { setActiveTab('registrar'); setSelectedLoanId(loanGroup.loan.id); }} 
                              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                            >
                              <span>Cobrar Préstamo</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(loanGroup.installments || []).map(inst => (
                              <div key={`${loanGroup.loan.id}-${inst.number}`} className="flex justify-between items-center p-3.5 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                                    #{inst.number}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Vencimiento: {inst.date}</p>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded mt-0.5 inline-block ${inst.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                      {inst.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                    RD$ {(inst.amount - inst.paidAmount).toLocaleString()}
                                  </span>
                                  <button 
                                    onClick={() => {
                                      setActiveTab('registrar');
                                      setSelectedLoanId(loanGroup.loan.id);
                                      setPaymentMode('cuotas');
                                      setPayAmount((inst.amount - inst.paidAmount).toFixed(2));
                                      setPayNote(`Pago cuota #${inst.number}`);
                                    }} 
                                    className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
                                    title="Cobrar esta cuota"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HISTORIAL AVANZADO CON FILTROS DE FECHA & EXPORTACIÓN              */}
      {/* ========================================================================= */}
      {activeTab === 'historial' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="flex-1 w-full md:w-auto space-y-4 md:space-y-0 md:flex md:gap-4 items-end">
                <div className="relative flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buscar Transacción</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Cliente, Ref o ID de Recibo..." 
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desde</label>
                  <input 
                    type="date" 
                    value={dateStart} 
                    onChange={e => setDateStart(e.target.value)} 
                    className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hasta</label>
                  <input 
                    type="date" 
                    value={dateEnd} 
                    onChange={e => setDateEnd(e.target.value)} 
                    className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  const rows = displayedMainFeedPayments.map(t => ({
                    Recibo: formatReceiptId(t.id),
                    Fecha: t.date,
                    Monto: t.amount,
                    Metodo: t.paymentMethod,
                    Tipo: t.paymentType,
                    Descripcion: t.description
                  }));
                  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Historial_Cobros_${todayStr}.json`;
                  a.click();
                  toast.success("Historial exportado");
                }}
                className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" /> Exportar JSON
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">ID Recibo</th>
                    <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                    <th className="px-6 py-4 font-bold">Cliente</th>
                    <th className="px-6 py-4 font-bold">Préstamo</th>
                    <th className="px-6 py-4 font-bold">Método</th>
                    <th className="px-6 py-4 font-bold text-right">Monto Cobrado</th>
                    <th className="px-6 py-4 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {displayedMainFeedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No se encontraron pagos en este período.
                      </td>
                    </tr>
                  ) : (
                    displayedMainFeedPayments.map((t) => {
                      const loan = loans.find(l => l.id === t.referenceId);
                      const client = loan ? clients.find(c => c.id === loan.clientId) : undefined;
                      const clientName = client ? `${client.name} ${client.lastName || ''}`.trim() : (loan ? loan.clientName : 'Cliente');
                      const parsedDate = t.date ? new Date(t.date) : new Date();

                      return (
                        <tr 
                          key={t.id}
                          className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400 font-black text-xs">
                            {formatReceiptId(t.id)}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium text-xs">
                            {formatExactDateTime(t.date)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                            {clientName}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-xs font-mono">
                              {t.referenceId ? formatLoanId(t.referenceId) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {t.paymentMethod || 'Efectivo'}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                            +RD$ {Number(t.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setSelectedTransactionToEdit(t);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
                                title="Editar Pago Completamente"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleOpenThermalReceipt(t)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                title="Imprimir Ticket Térmico"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleShareWhatsApp(t)}
                                className="p-2 text-[#25D366] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                title="Enviar Recibo por WhatsApp"
                              >
                                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" colored={false} />
                              </button>
                              <button 
                                onClick={() => navigate(`/recibo/${t.id}`)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                                title="Ver Recibo Oficial"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Enhanced Success Modal (Receipt) */}
      {receiptData && (
        <PaymentSuccessModal 
          data={receiptData} 
          company={companySettings}
          onClose={() => setReceiptData(null)} 
        />
      )}
    </div>
  );
};

// Detailed Receipt Component
const PaymentSuccessModal: React.FC<{
  data: FullReceiptData, 
  company: CompanySettings,
  onClose: () => void
}> = ({ data, company, onClose }) => {
  const receiptWebLink = `${window.location.origin}/recibo/${data.transactionId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(receiptWebLink).then(() => {
      toast.success("¡Enlace directo del recibo copiado al portapapeles!");
    });
  };

  const formattedNextPay = data.nextPaymentDate ? formatPaymentDateDisplay(data.nextPaymentDate) : undefined;
  const exactTimeStr = data.time || formatExactTime(null, true);
  const nextPayTxt = formattedNextPay ? `\n*Próximo Pago*: ${formattedNextPay}` : '';
  const message = `*${company.name}*\n*Recibo de Pago*: ${data.receiptNo || formatReceiptId(data.transactionId)}\n*Fecha*: ${data.date}\n*Hora*: ${exactTimeStr}\n*Cliente*: ${data.clientName}\n*Monto Pagado*: RD$ ${data.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n*Saldo Restante*: RD$ ${data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}${nextPayTxt}\n\nPuede ver y descargar su recibo oficial aquí:\n${receiptWebLink}\n\nGracias por su pago.`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const mailLink = `mailto:?subject=Recibo de Pago ${data.receiptNo || data.transactionId}&body=${encodeURIComponent(message)}`;

  const [isThermalOpen, setIsThermalOpen] = useState(false);

  const thermalData: ThermalReceiptData = {
    receiptNo: data.receiptNo || formatReceiptId(data.transactionId),
    date: data.date,
    time: exactTimeStr,
    nextPaymentDate: data.nextPaymentDate,
    clientName: data.clientName,
    clientCedula: data.clientCedula,
    clientPhone: data.clientPhone,
    clientId: data.clientId,
    loanId: data.loanId,
    loanType: data.loanType,
    totalDebt: data.totalDebt,
    installmentInfo: data.paidInstallments && data.totalInstallments ? `Cuota ${data.paidInstallments} de ${data.totalInstallments}` : undefined,
    amountPaid: data.amountPaid,
    capitalAmount: data.capitalAmount ?? (data.amountPaid > (data.lateFeeAmount || 0) ? (data.amountPaid - (data.lateFeeAmount || 0)) : data.amountPaid),
    interestAmount: data.interestAmount,
    lateFeeAmount: data.lateFeeAmount,
    discountAmount: data.discountAmount,
    previousBalance: data.previousBalance,
    newBalance: data.newBalance,
    paymentMethod: data.paymentMethod || 'Efectivo',
    cashierName: data.cashierName || 'Cajero',
    notes: data.paymentNote,
    transactionId: data.transactionId
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-receipt');
    if (!element) return;
    try {
      toast.info("Generando imagen del recibo...");
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Recibo_${data.receiptNo || formatReceiptId(data.transactionId)}.png`;
      link.click();
      toast.success("Recibo guardado como imagen PNG");
    } catch (err) {
      console.error("Error al exportar imagen:", err);
      toast.error("No se pudo generar la imagen del recibo");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      {isThermalOpen && (
        <ThermalReceiptModal
          isOpen={isThermalOpen}
          onClose={() => setIsThermalOpen(false)}
          data={thermalData}
        />
      )}

      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-base">Pago Registrado Exitosamente</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="printable-receipt" className="p-5 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 flex-1">
          <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl text-xs space-y-3">
            <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-800 dark:text-white uppercase">{company.name}</h3>
              {company.rnc && <p className="text-slate-400 text-[11px]">RNC: {company.rnc}</p>}
              <p className="text-slate-400 text-[11px]">{company.address} • {company.phone}</p>
            </div>

            <div className="grid grid-cols-2 gap-y-1.5 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <span className="text-slate-500 font-bold">No. Recibo:</span>
              <span className="text-right font-mono font-black text-indigo-600 dark:text-indigo-400">{data.receiptNo || formatReceiptId(data.transactionId)}</span>
              <span className="text-slate-500">Fecha:</span>
              <span className="text-right text-slate-700 dark:text-slate-300 font-medium">{data.date}</span>
              <span className="text-slate-500">Hora:</span>
              <span className="text-right text-slate-700 dark:text-slate-300 font-bold font-mono">{exactTimeStr}</span>
              <span className="text-slate-500">Método:</span>
              <span className="text-right font-bold text-slate-800 dark:text-slate-200">{data.paymentMethod || 'Efectivo'}</span>
              {data.totalDebt !== undefined && data.totalDebt > 0 && (
                <>
                  <span className="text-slate-500 font-bold">Total Deuda:</span>
                  <span className="text-right font-black text-slate-800 dark:text-slate-200">RD$ {data.totalDebt.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </>
              )}
              <span className="text-slate-500 font-bold">Balance Anterior:</span>
              <span className="text-right font-bold text-slate-800 dark:text-slate-200">RD$ {data.previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              <span className="text-slate-500 font-bold">Próximo Pago:</span>
              <span className="text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formattedNextPay || 'Al Día'}</span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Monto Cobrado</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">RD$ {data.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Nuevo Balance</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">RD$ {data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(receiptWebLink)}`} 
                alt="QR Code" 
                className="w-20 h-20 mx-auto mb-1 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">Escanee para validar recibo web</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 gap-2">
          <button 
            onClick={() => setIsThermalOpen(true)}
            className="col-span-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 hover:from-emerald-500"
          >
            <Printer className="w-4 h-4" /> Impresión Térmica POS (58/80mm)
          </button>
          <button 
            onClick={() => window.open(receiptWebLink, '_blank')}
            className="py-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ver Recibo Digital
          </button>
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noreferrer"
            className="py-2.5 bg-[#25D366] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
          >
            <WhatsAppIcon /> Enviar WhatsApp
          </a>
          <button 
            onClick={handleCopyLink}
            className="col-span-2 py-2 text-slate-500 text-xs font-bold hover:underline"
          >
            Copiar enlace del recibo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payments;
