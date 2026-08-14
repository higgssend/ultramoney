
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Receipt, User, CreditCard, Calendar, List, CheckSquare, Filter, ChevronDown, ChevronUp, AlertCircle, Banknote, Mail, X, FileText, Download, ArrowRight, Printer, ChevronLeft, Image, ArrowLeftRight } from 'lucide-react';
import { useClients, useAuth, useSettings, useLoans, useAccounting } from '../context/StoreContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { LoanEngine } from '../utils/LoanEngine';
import { Loan, CompanySettings, PaymentMethod, formatLoanId, formatReceiptId, LoanStatus } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { maskCedula } from '../utils/masks';
import { ThermalReceiptModal, ThermalReceiptData } from '../components/ThermalReceiptModal';

// WhatsApp Official Icon SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

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
    previousBalance: number;
    newBalance: number;
    transactionId: string;
    receiptNo: string;
    lateFeeAmount?: number;
    discountAmount?: number;
    date: string;
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

const Payments: React.FC = () => {
  const { loans, registerPayment } = useLoans();
  const { clients } = useClients();
  const { transactions, bankAccounts, processBankDeposit, paymentMethods, bankDeposits } = useAccounting();
  const pendingBankDeposits = bankDeposits?.filter(d => d.status === 'Pendiente') || [];
  const { companySettings } = useSettings();
  const { currentUser, users, roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
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
  const [sidebarFilter, setSidebarFilter] = useState<'hoy' | 'recientes'>('hoy');
  const [capitalAmount, setCapitalAmount] = useState<string>('');
  const [lateFeeAmount, setLateFeeAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // History & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Success Modal State
  const [receiptData, setReceiptData] = useState<FullReceiptData | null>(null);

  // Monitor State
  const [expandedClients, setExpandedClients] = useState<string[]>([]);

  // Pre-select loan if passed via navigation state
  useEffect(() => {
    if (location.state && location.state.loanId) {
        setSelectedLoanId(location.state.loanId);
        setActiveTab('registrar');
    }
  }, [location]);

  const isAdmin = roles.some(r => currentUser?.roleIds?.includes(r.id) && r.name.toLowerCase().includes('admin'));
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
    
    // Total paid so far
    let totalPaidSoFar = loan.totalToPay - loan.remainingBalance;
    const frequencyDays = getFrequencyDays(loan.frequency);

    for (let i = 0; i < count; i++) {
        const date = addDays(loan.startDate, (i + 1) * frequencyDays);
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
            // Check overdue
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

  // --- Grouping Logic for Monitor ---
  const getClientGroups = () => {
      const groups: Record<string, { 
          clientName: string, 
          clientId: string, 
          totalPending: number, 
          loans: { loan: Loan, installments: Installment[] }[] 
      }> = {};

      loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE).forEach(loan => {
          const insts = generateInstallments(loan).filter(i => i.status !== 'Pagado');
          if (insts.length === 0) return;

          if (!groups[loan.clientId]) {
              groups[loan.clientId] = {
                  clientName: loan.clientName,
                  clientId: loan.clientId,
                  totalPending: 0,
                  loans: []
              };
          }

          const loanPending = insts.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
          groups[loan.clientId].totalPending += loanPending;
          groups[loan.clientId].loans.push({ loan, installments: insts });
      });

      // Filter by search term if exists
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return Object.values(groups).filter(g => 
              (g.clientName || '').toLowerCase().includes(term) || 
              g.loans.some(l => l.loan.id.toLowerCase().includes(term))
          );
      }

      return Object.values(groups);
  };

  const clientGroups = getClientGroups();

  // --- History Logic ---
  const getHistoryTransactions = () => {
      return transactions
        .filter(t => t.type === 'Ingreso' && t.category === 'Pago Préstamo')
        .filter(t => {
            const searchLower = historySearch.toLowerCase();
            const loan = loans.find(l => l.id === t.referenceId);
            const clientName = loan ? (loan.clientName || '').toLowerCase() : '';
            
            const matchesSearch = (
                (t.description || '').toLowerCase().includes(searchLower) || 
                (t.referenceId && t.referenceId.toLowerCase().includes(searchLower)) ||
                (t.id && t.id.toLowerCase().includes(searchLower)) ||
                clientName.includes(searchLower)
            );

            const matchesStart = dateStart ? t.date >= dateStart : true;
            const matchesEnd = dateEnd ? t.date <= dateEnd : true;

            return matchesSearch && matchesStart && matchesEnd;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
  };

  const historyData = getHistoryTransactions();

  // --- Handlers ---

  const handleToggleInstallment = (inst: Installment) => {
      if (inst.status === 'Pagado') return;

      const isSelected = selectedInstallments.includes(inst.number);
      let newSelection = [];

      if (isSelected) {
          newSelection = selectedInstallments.filter(n => n !== inst.number);
      } else {
          newSelection = [...selectedInstallments, inst.number];
      }

      setSelectedInstallments(newSelection);

      // Recalculate Total
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
    
    const isReditoLoan = Boolean(selectedLoan?.loanType && (selectedLoan.loanType.includes('Rédito') || selectedLoan.loanType.includes('Redito') || selectedLoan.loanType.includes('Solo Interé') || selectedLoan.loanType.includes('Pagaré Abierto')));

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

    // Register the payment
    const insertedTxs = await registerPayment(
        selectedLoanId, 
        effectiveTotal, 
        payNote, 
        paymentDate, 
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

    // Other loans active for client
    const otherActiveLoans = loans
        .filter(l => l.clientId === selectedLoan.clientId && l.id !== selectedLoanId && l.status !== 'Pagado')
        .map(l => ({ id: l.id, balance: l.remainingBalance }));

    setReceiptData({
        loanId: formatLoanId(selectedLoan.id, selectedLoan.loanCategory, selectedLoan.loanType),
        amountPaid: effectiveTotal,
        clientName: selectedLoan.clientName,
        clientId: selectedLoan.clientId,
        previousBalance: previousBalance,
        newBalance: newBalance,
        transactionId: actualTxId,
        receiptNo: formattedRecNo,
        lateFeeAmount: lateVal,
        discountAmount: discVal,
        date: new Date().toLocaleString('es-DO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
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
    });

    setLateFeeAmount('');
    setDiscountAmount('');

    // Reset Form & Navigate directly to full Receipt Page View
    if(paymentMode === 'manual') {
        setSelectedLoanId(null);
        setSearchTerm('');
    } else {
        setSelectedInstallments([]);
        setPayAmount('');
        setPayNote('Cuota Regular');
    }

    toast.success("Pago registrado exitosamente");
    navigate(`/recibo/${actualTxId}`);
  };

  const handleReprintReceipt = (t: import('../types').Transaction) => {
      navigate(`/recibo/${t.id}`);
  };

  const toggleClientExpand = (clientId: string) => {
      setExpandedClients(prev => 
          prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
      );
  };

  // --- Search Logic for Register Tab ---
  const filteredLoans = searchTerm ? loans.filter(l => {
    const client = clients.find(c => c.id === l.clientId);
    const term = searchTerm.toLowerCase();
    const matchesLoan = l.id.toLowerCase().includes(term);
    const matchesName = (l.clientName || '').toLowerCase().includes(term);
    const matchesCedula = client ? client.cedula.includes(searchTerm) : false;
    return (matchesLoan || matchesName || matchesCedula) && l.remainingBalance > 0;
  }) : [];

  const todayPayments = transactions.filter(t => 
    t.type === 'Ingreso' && t.category === 'Pago Préstamo' && t.date === new Date().toISOString().split('T')[0]
  );

  const recentPayments = transactions
    .filter(t => t.type === 'Ingreso' && t.category === 'Pago Préstamo')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 25);

  const displayedSidebarPayments = sidebarFilter === 'hoy' ? todayPayments : recentPayments;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Módulo de Cobranza</h2>
                <p className="text-slate-500">Registra pagos y monitorea las cuotas.</p>
            </div>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('registrar')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'registrar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
            >
                Registrar Pago
            </button>
            <button 
                onClick={() => setActiveTab('monitor')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'monitor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
            >
                Monitor de Cuotas
            </button>
            <button 
                onClick={() => setActiveTab('historial')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'historial' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
            >
                Historial
            </button>
        </div>
      </div>

      {/* Pending Bank Deposits Reconciliation Banner */}
      {pendingBankDeposits.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Tienes {pendingBankDeposits.length} transferencias bancarias pendientes</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h4>
              <p className="text-xs text-slate-300">
                Total por conciliar: <strong className="text-emerald-300">RD$ {pendingBankDeposits.reduce((s, d) => s + d.amount, 0).toLocaleString()}</strong>. Puedes vincularlas automáticamente a préstamos con 1 solo clic.
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

      {activeTab === 'registrar' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Payment Form Area */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
                
                {/* Search Box */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Buscar préstamo, cliente o cédula..." 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    {searchTerm && filteredLoans.length > 0 && !selectedLoan && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-lg mt-1 z-20 max-h-60 overflow-y-auto">
                            {filteredLoans.map(loan => {
                                const client = clients.find(c => c.id === loan.clientId);
                                return (
                                    <div 
                                        key={loan.id} 
                                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                        onClick={() => { setSelectedLoanId(loan.id); setSearchTerm(''); }}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-slate-700">{loan.clientName}</span>
                                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                Bal: ${loan.remainingBalance.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                            <span>Ref: #{formatLoanId(loan.id, loan.loanCategory, loan.loanType)} {client && `• ${maskCedula(client.cedula)}`}</span>
                                            <span>{loan.frequency}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedLoan ? (
                    <div className="animate-fade-in">
                        {/* Loan Summary Header */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 mb-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800">{selectedLoan.clientName}</h4>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        Préstamo #{formatLoanId(selectedLoan.id, selectedLoan.loanCategory, selectedLoan.loanType)}
                                        <span className="bg-white border border-indigo-100 px-2 py-0.5 rounded text-xs font-medium text-indigo-600">{selectedLoan.frequency}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Balance Actual</p>
                                    <p className="font-bold text-2xl text-indigo-600">${selectedLoan.remainingBalance.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            {/* Toggle Mode */}
                            <div className="flex bg-white rounded-lg p-1 border border-indigo-100 w-fit">
                                <button 
                                    onClick={() => { setPaymentMode('manual'); setPayAmount(''); }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${paymentMode === 'manual' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    Monto Libre
                                </button>
                                <button 
                                    onClick={() => { setPaymentMode('cuotas'); setPayAmount(''); setSelectedInstallments([]); }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${paymentMode === 'cuotas' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    Seleccionar Cuotas
                                </button>
                            </div>
                        </div>

                        {/* Installment Table Selection */}
                        {paymentMode === 'cuotas' && (
                            <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                        <List className="w-4 h-4" /> Tabla de Amortización
                                    </h4>
                                    <span className="text-xs text-slate-500">Selecciona para sumar</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                            <tr className="text-xs text-slate-500 uppercase">
                                                <th className="px-4 py-2">#</th>
                                                <th className="px-4 py-2">Fecha</th>
                                                <th className="px-4 py-2">Monto</th>
                                                <th className="px-4 py-2">Estado</th>
                                                <th className="px-4 py-2 text-center">Pagar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {currentLoanInstallments.map((inst) => (
                                                <tr key={inst.number} className={`hover:bg-slate-50 ${selectedInstallments.includes(inst.number) ? 'bg-indigo-50' : ''}`}>
                                                    <td className="px-4 py-3 font-mono text-slate-500">{inst.number}</td>
                                                    <td className="px-4 py-3 text-slate-700">{inst.date}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-700">
                                                        ${inst.amount.toLocaleString()}
                                                        {inst.status === 'Parcial' && <span className="text-xs font-normal text-slate-400 block">Restan ${(inst.amount - inst.paidAmount).toLocaleString()}</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            inst.status === 'Pagado' ? 'bg-emerald-100 text-emerald-600' :
                                                            inst.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' :
                                                            inst.status === 'Parcial' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {inst.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {inst.status !== 'Pagado' && (
                                                            <button 
                                                                onClick={() => handleToggleInstallment(inst)}
                                                                className={`p-1 rounded transition-colors ${selectedInstallments.includes(inst.number) ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}
                                                            >
                                                                {selectedInstallments.includes(inst.number) ? <CheckCircle className="w-5 h-5 fill-indigo-100" /> : <CheckSquare className="w-5 h-5" />}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Payment Input Area */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            {/* Fechas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-600">Fecha Emisión (Comprobante)</label>
                                        <button type="button" onClick={() => setInvoiceDate(new Date().toISOString().split('T')[0])} className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors">Hoy</button>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={invoiceDate}
                                        onChange={e => setInvoiceDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-600">Fecha de Pago (Recibo)</label>
                                        <button type="button" onClick={() => setPaymentDate(new Date().toISOString().split('T')[0])} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors">Hoy</button>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                                    />
                                </div>
                            </div>
                            
                            {/* Método de Pago */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Método de Pago</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {(paymentMethods && paymentMethods.length > 0 ? paymentMethods.filter(p => p.isActive) : [
                                        { id: 'pm-1', name: 'Efectivo' },
                                        { id: 'pm-2', name: 'Transferencia' },
                                        { id: 'pm-3', name: 'Verifone / POS' },
                                        { id: 'pm-4', name: 'Tarjeta' },
                                        { id: 'pm-5', name: 'Cheque' }
                                    ]).map(pm => (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(pm.name as PaymentMethod)}
                                            className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${paymentMethod === pm.name ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {pm.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cuenta Bancaria o Caja (Opcional) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Cuenta Bancaria / Caja (Opcional)</label>
                                    <CustomSelect 
                                        value={selectedBankAccountId}
                                        onChange={(val) => setSelectedBankAccountId(val)}
                                        className="w-full"
                                        options={[
                                            { value: '', label: '-- Seleccionar Cuenta o Caja --' },
                                            ...bankAccounts.map(b => ({
                                                value: b.id,
                                                label: `${b.bankName} - ${b.accountName} (RD$ ${(b.balance || 0).toLocaleString('es-DO')})`
                                            }))
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Adjuntar Comprobante / Voucher (Opcional)</label>
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
                                    {proofUrl && (
                                        <p className="text-[11px] text-emerald-600 font-bold mt-1">Comprobante adjuntado listo para guardar</p>
                                    )}
                                </div>
                            </div>
                            {(selectedLoan?.loanType && (selectedLoan.loanType.includes('Rédito') || selectedLoan.loanType.includes('Redito') || selectedLoan.loanType.includes('Solo Interé') || selectedLoan.loanType.includes('Pagaré Abierto'))) && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Pago (Pagaré Abierto)</label>
                                        <CustomSelect 
                                            value={paymentType}
                                            onChange={(e) => handlePaymentTypeChange(e as 'Interes' | 'Capital' | 'Mixto')}
                                            className="w-full"
                                            options={[
                                                { value: 'Interes', label: 'Solo Intereses (Réditos)' },
                                                { value: 'Capital', label: 'Abono Directo a Capital' },
                                                { value: 'Mixto', label: 'Interés + Abono a Capital (Mixto)' }
                                            ]}
                                        />
                                    </div>
                                )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-600">Monto a Pagar</label>
                                        {selectedLoan && (
                                            <div className="flex items-center gap-1.5">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const isRedito = Boolean(selectedLoan.loanType && (selectedLoan.loanType.includes('Rédito') || selectedLoan.loanType.includes('Redito') || selectedLoan.loanType.includes('Solo Interé') || selectedLoan.loanType.includes('Pagaré Abierto')));
                                                        if (isRedito) {
                                                            handlePaymentTypeChange('Interes');
                                                        } else {
                                                            setPayAmount(autoSuggestedAmount.toFixed(2));
                                                        }
                                                    }} 
                                                    className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                                                    title="Cargar automáticamente el monto regular / interés sugerido"
                                                >
                                                    Auto (${autoSuggestedAmount.toLocaleString()})
                                                </button>

                                                <button 
                                                    type="button" 
                                                    onClick={handleSaldarFull} 
                                                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                                                    title="Llenar con el monto total para saldar este préstamo"
                                                >
                                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                    Saldar (${selectedLoan.remainingBalance.toLocaleString()})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            value={payAmount === '0' || payAmount === '0.00' ? '' : payAmount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => { if(paymentMode === 'manual') setPayAmount(e.target.value); }}
                                            readOnly={paymentMode === 'cuotas'}
                                            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-xl font-bold text-slate-800 ${paymentMode === 'cuotas' ? 'bg-slate-50 border-slate-200 text-indigo-600' : 'border-slate-300 focus:ring-indigo-500'}`}
                                            placeholder="0.00" 
                                        />
                                    </div>
                                    {paymentMode === 'cuotas' && <p className="text-xs text-indigo-500 mt-1">* Calculado automáticamente</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Concepto / Nota</label>
                                    <input 
                                        type="text" 
                                        value={payNote}
                                        onChange={e => setPayNote(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Recargo por Mora y Condonación */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-slate-50/70 p-4 border border-slate-200 rounded-xl">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recargo por Mora / Atraso (Opcional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold">$</span>
                                        <input 
                                            type="number"
                                            value={lateFeeAmount === '0' || lateFeeAmount === '0.00' ? '' : lateFeeAmount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setLateFeeAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Condonación / Descuento (Opcional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">-$</span>
                                        <input 
                                            type="number"
                                            value={discountAmount === '0' || discountAmount === '0.00' ? '' : discountAmount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setDiscountAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {isAdmin && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Cajero / Cobrador (Opcional)</label>
                                    <CustomSelect 
                                        value={selectedCashierId}
                                        onChange={(e) => setSelectedCashierId(e)}
                                        className="w-full"
                                        options={[
                                            { value: '', label: `-- Mi Usuario (${currentUser?.name}) --` },
                                            ...users.map(u => ({ value: u.id, label: `${u.name} ${u.lastName || ''}` }))
                                        ]}
                                    />
                                </div>
                            )}

                            {paymentType === 'Mixto' && selectedLoan?.loanType && (selectedLoan.loanType.includes('Rédito') || selectedLoan.loanType.includes('Redito') || selectedLoan.loanType.includes('Solo Interé') || selectedLoan.loanType.includes('Pagaré Abierto')) && (
                                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <label className="block text-sm font-medium text-indigo-700 mb-1">Monto a abonar al Capital</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            value={capitalAmount}
                                            onChange={e => setCapitalAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-indigo-900 font-bold"
                                            placeholder="0.00" 
                                        />
                                    </div>
                                    <p className="text-xs text-indigo-500 mt-1">El resto (${(Number(payAmount) - Number(capitalAmount)).toFixed(2)}) se registrará como Interés.</p>
                                </div>
                            )}
                            
                            <button 
                                onClick={handlePayment}
                                disabled={!payAmount || Number(payAmount) <= 0}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200 transform hover:-translate-y-0.5"
                            >
                                <CheckCircle className="w-6 h-6" />
                                CONFIRMAR PAGO
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <CreditCard className="w-8 h-8 opacity-50" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-600">Comienza buscando un préstamo</p>
                            <p className="text-sm">Busca por nombre, cédula o código para ver detalles y cobrar.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Recent Payments Sidebar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                    <button 
                        type="button" 
                        onClick={() => setSidebarFilter('hoy')} 
                        className={`px-2.5 py-1 rounded-md transition-all ${sidebarFilter === 'hoy' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Hoy ({todayPayments.length})
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setSidebarFilter('recientes')} 
                        className={`px-2.5 py-1 rounded-md transition-all ${sidebarFilter === 'recientes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Recientes ({recentPayments.length})
                    </button>
                </div>
                <Receipt className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {displayedSidebarPayments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-sm font-medium mb-2">No hay cobros registrados {sidebarFilter === 'hoy' ? 'hoy' : 'recientes'}.</p>
                        {sidebarFilter === 'hoy' && recentPayments.length > 0 && (
                            <button 
                                type="button" 
                                onClick={() => setSidebarFilter('recientes')} 
                                className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                            >
                                Ver últimos cobros grabados ({recentPayments.length})
                            </button>
                        )}
                    </div>
                ) : (
                    displayedSidebarPayments.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => handleReprintReceipt(t)}
                            className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-indigo-50/60 hover:border-indigo-200 cursor-pointer transition-all group shadow-2xs"
                            title="Haz clic para ver, imprimir o descargar el Recibo de Pago"
                        >
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate w-36">{t.description}</p>
                                <p className="text-xs text-slate-400 font-mono">Ref: {t.referenceId ? formatLoanId(t.referenceId) : t.id.slice(0, 8)}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <span className="font-bold text-emerald-600 text-sm">+${t.amount.toLocaleString()}</span>
                                <Printer className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
      )}

      {/* Monitor and History Tabs remain same structure but use shared functions */}
      {activeTab === 'monitor' && (
          <div className="space-y-4 animate-fade-in">
              {/* Search bar logic repeated for simplicity or componentized in real app */}
              <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                          type="text" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Filtrar clientes en mora..." 
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>
              </div>
              {clientGroups.length === 0 ? (
                   <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No hay cuotas pendientes para mostrar.</p>
                   </div>
              ) : (
                  clientGroups.map((group) => {
                      const isExpanded = expandedClients.includes(group.clientId);
                      const overdueCount = group.loans.reduce((acc, l) => acc + (l.installments || []).filter(i => i.status === 'Atrasado').length, 0);
                      return (
                          <div key={group.clientId} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                              <div onClick={() => toggleClientExpand(group.clientId)} className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${overdueCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>{(group.clientName || '?').charAt(0)}</div>
                                      <div><h3 className="font-bold text-slate-800 text-lg">{group.clientName}</h3><div className="flex items-center gap-3 text-sm text-slate-500"><span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> {group.loans.length} Préstamo(s)</span>{overdueCount > 0 && (<span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full text-xs"><AlertCircle className="w-3 h-3" /> {overdueCount} Atrasos</span>)}</div></div>
                                  </div>
                                  <div className="text-right flex items-center gap-4"><div><p className="text-xs text-slate-500 uppercase font-bold">Total Pendiente</p><p className="text-xl font-bold text-slate-800">RD${group.totalPending.toLocaleString()}</p></div><div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown className="w-6 h-6 text-slate-400" /></div></div>
                              </div>
                              {isExpanded && (<div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 animate-fade-in">{group.loans.map((loanGroup) => (<div key={loanGroup.loan.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden"><div className="px-4 py-2 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center"><span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">Préstamo #{formatLoanId(loanGroup.loan.id, loanGroup.loan.loanCategory, loanGroup.loan.loanType)} <span className="text-slate-400">•</span>{loanGroup.loan.frequency}</span><button onClick={() => {setActiveTab('registrar');setSelectedLoanId(loanGroup.loan.id);}} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">Ir a Pagar</button></div><div className="divide-y divide-slate-100">{(loanGroup.installments || []).map(inst => (<div key={`${loanGroup.loan.id}-${inst.number}`} className="flex justify-between items-center p-3 hover:bg-indigo-50/30 transition-colors"><div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold font-mono">#{inst.number}</div><div><p className="text-sm font-bold text-slate-700">{inst.date}</p><p className="text-xs text-slate-400">Vencimiento</p></div></div><div className="text-right flex items-center gap-4"><div><p className="font-bold text-slate-700">RD${(inst.amount - inst.paidAmount).toLocaleString()}</p><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${inst.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' : inst.status === 'Parcial' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{inst.status}</span></div><button onClick={() => {setActiveTab('registrar');setSelectedLoanId(loanGroup.loan.id);setPaymentMode('cuotas');setPayAmount((inst.amount - inst.paidAmount).toFixed(2));setPayNote(`Pago cuota #${inst.number}`);}} className="p-2 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-colors" title="Cobrar esta cuota"><CreditCard className="w-4 h-4" /></button></div></div>))}</div></div>))}</div>)}
                          </div>
                      );
                  })
              )}
          </div>
      )}

      {activeTab === 'historial' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-end mb-2">
                      <div className="flex-1 w-full md:w-auto space-y-4 md:space-y-0 md:flex md:gap-4 items-end">
                          <div className="relative flex-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buscar Transacción</label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    placeholder="Cliente, Ref o ID..." 
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                          </div>
                          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desde</label><div className="relative"><Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div></div>
                          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hasta</label><div className="relative"><Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div></div>
                      </div>
                      <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"><Download className="w-4 h-4" /> Exportar</button>
                  </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                  <th className="px-6 py-4 font-semibold">ID Transacción</th>
                                  <th className="px-6 py-4 font-semibold">Fecha</th>
                                  <th className="px-6 py-4 font-semibold">Cliente</th>
                                  <th className="px-6 py-4 font-semibold">Referencia</th>
                                  <th className="px-6 py-4 font-semibold">Método / Nota</th>
                                  <th className="px-6 py-4 font-semibold text-right">Monto</th>
                                  <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                              {historyData.length === 0 ? (
                                  <tr>
                                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                          No se encontraron pagos con estos filtros.
                                      </td>
                                  </tr>
                              ) : (
                                  historyData.map((t) => {
                                      const loan = loans.find(l => l.id === t.referenceId);
                                      const clientName = loan ? loan.clientName : 'Cliente Desconocido';
                                      return (
                                          <tr 
                                              key={t.id} 
                                              onClick={() => handleReprintReceipt(t)}
                                              className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                              title="Haz clic para ver o imprimir este recibo"
                                          >
                                              <td className="px-6 py-4 font-mono text-indigo-600 text-xs font-bold">{formatReceiptId(t.id)}</td>
                                              <td className="px-6 py-4 text-slate-600 font-medium">
                                                  {t.date.includes('T') ? new Date(t.date).toLocaleString('es-DO', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : t.date}
                                              </td>
                                              <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-indigo-700">{clientName}</td>
                                              <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">{t.referenceId ? formatLoanId(t.referenceId) : '-'}</span></td>
                                              <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={t.description}>{t.description.replace(` - ${clientName}`, '')}</td>
                                              <td className="px-6 py-4 text-right font-bold text-emerald-600">RD${t.amount.toLocaleString()}</td>
                                              <td className="px-6 py-4 text-center">
                                                  <button 
                                                      type="button"
                                                      onClick={(e) => { e.stopPropagation(); handleReprintReceipt(t); }} 
                                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center mx-auto gap-1 text-xs font-bold" 
                                                      title="Ver Recibo"
                                                  >
                                                      <Printer className="w-4 h-4 text-indigo-600" />
                                                      <span>Recibo</span>
                                                  </button>
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
    // Construct Receipt Web Link
    const receiptWebLink = `${window.location.origin}/recibo/${data.transactionId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(receiptWebLink).then(() => {
            toast.info("Link de recibo copiado al portapapeles");
        });
    };

    // Construct WhatsApp Message
    const message = `🏢 *${company.name}*
📄 *Recibo de Pago*: ${data.transactionId}
👤 *Cliente*: ${data.clientName}
💰 *Monto Pagado*: RD$ ${data.amountPaid.toLocaleString()}

Link web para descargar o imprimir su recibo:
${receiptWebLink}

Gracias por su pago.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/?text=${encodedMessage}`;
    const mailLink = `mailto:?subject=Recibo de Pago ${data.transactionId}&body=${encodedMessage}`;

    const [isThermalOpen, setIsThermalOpen] = useState(false);

    const thermalData: ThermalReceiptData = {
        receiptNo: data.receiptNo || formatReceiptId(data.transactionId),
        date: data.date,
        clientName: data.clientName,
        clientId: data.clientId,
        loanId: data.loanId,
        installmentInfo: data.paidInstallments && data.totalInstallments ? `Cuota ${data.paidInstallments} de ${data.totalInstallments}` : undefined,
        amountPaid: data.amountPaid,
        capitalAmount: data.amountPaid > (data.lateFeeAmount || 0) ? (data.amountPaid - (data.lateFeeAmount || 0)) : data.amountPaid,
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
        const printContent = document.getElementById('printable-receipt');
        if (printContent) {
            const windowUrl = 'about:blank';
            const uniqueName = new Date();
            const windowName = 'Print' + uniqueName.getTime();
            const printWindow = window.open(windowUrl, windowName, 'width=400,height=600');
            
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Recibo ${data.transactionId}</title>
                            <style>
                                body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; max-width: 350px; margin: 0 auto; color: #000; }
                                .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                                .header h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
                                .header p { margin: 2px 0; }
                                .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                                .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
                                .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                                .section-title { font-weight: bold; text-decoration: underline; margin-top: 10px; margin-bottom: 5px; display: block; font-size: 11px; }
                                .small-text { font-size: 10px; color: #555; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                ${company.logoUrl ? `<img src="${company.logoUrl}" style="max-height: 60px; margin: 0 auto 10px;" />` : ''}
                                <h2>${company.name}</h2>
                                ${company.rnc ? `<p>RNC: ${company.rnc}</p>` : ''}
                                ${company.slogan ? `<p style="font-style: italic; font-size: 10px;">"${company.slogan}"</p>` : ''}
                                <p>${company.address}</p>
                                <p>${company.phone}</p>
                                <p style="margin-top:5px"><strong>RECIBO DE INGRESO - CAJA</strong></p>
                            </div>
                            
                            <div class="row"><span>Recibo #:</span> <span>${data.receiptNo || formatReceiptId(data.transactionId)}</span></div>
                            <div class="row"><span>Fecha:</span> <span>${data.date}</span></div>
                            <div class="row"><span>Método Pago:</span> <span>${data.paymentMethod || 'Efectivo'}</span></div>
                            <div class="row"><span>Cajero:</span> <span>${data.cashierName}</span></div>
                            
                            <div class="divider"></div>
                            
                            <div class="row"><strong>Cliente:</strong> <span style="text-align:right">${data.clientName}</span></div>
                            <div class="row"><span>Préstamo #:</span> <span>${formatLoanId(data.loanId)}</span></div>
                            <div class="row"><span>Garantía:</span> <span style="text-align:right; max-width: 150px;">${data.collateral}</span></div>
                            
                            <div class="divider"></div>
                            
                            <span class="section-title">DETALLE FINANCIERO</span>
                            <div class="row"><span>Balance Anterior:</span> <span>$${data.previousBalance.toLocaleString()}</span></div>
                            <div class="row"><span>(-) ABONO:</span> <span>$${data.amountPaid.toLocaleString()}</span></div>
                            <div class="row total"><span>(=) NUEVO BALANCE:</span> <span>$${data.newBalance.toLocaleString()}</span></div>
                            <div class="row small-text" style="margin-top:2px;"><span>Nota:</span> <span>${data.paymentNote}</span></div>
                            
                            <div class="divider"></div>
                            
                            <span class="section-title">ESTADO DE CUENTA</span>
                            <div class="row"><span>Monto Vencido:</span> <span>$${data.overdueAmount.toLocaleString()}</span></div>
                            <div class="row"><span>Cuotas Atrasadas:</span> <span>${data.overdueInstallments}</span></div>
                            <div class="row"><span>Cargos/Mora:</span> <span>$0.00</span></div>
                            <div class="row"><span>Progreso Pago:</span> <span>${data.paidInstallments} / ${data.totalInstallments} cuotas</span></div>
                            <div class="row"><span>Estado Renovación:</span> <span>${data.renewalStatus}</span></div>
                            
                            ${data.otherLoans.length > 0 ? `
                                <div class="divider"></div>
                                <span class="section-title">OTROS PRÉSTAMOS ACTIVOS</span>
                                ${data.otherLoans.map(ol => `<div class="row"><span>${ol.id}:</span> <span>$${ol.balance.toLocaleString()}</span></div>`).join('')}
                            ` : ''}

                            <div class="footer">
                                <br/><br/>
                                <p>__________________________</p>
                                <p>Firma Conforme</p>
                                <br/>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(receiptWebLink)}" alt="QR Code" style="margin: 10px auto; display: block;" />
                                <p>Escanee para validar recibo</p>
                                <p>Gracias por su pago.</p>
                            </div>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        }
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('printable-receipt');
        if (!element) return;
        try {
            toast.info("Generando imagen del recibo...");
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            {/* Direct Thermal POS Modal */}
            {isThermalOpen && (
                <ThermalReceiptModal
                    isOpen={isThermalOpen}
                    onClose={() => setIsThermalOpen(false)}
                    data={thermalData}
                />
            )}

            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <span className="font-bold text-lg">Pago Aplicado</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Printable Content Area */}
                <div id="printable-receipt" className="p-6 overflow-y-auto bg-slate-50 flex-1">
                    <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-lg text-sm">
                        
                        {/* Receipt Header */}
                        <div className="text-center border-b-2 border-dashed border-slate-200 pb-4 mb-4">
                            {company.logoUrl && (
                                <img src={company.logoUrl} alt="Logo" className="h-16 object-contain mx-auto mb-2" />
                            )}
                            <h3 className="font-bold text-lg text-slate-800 uppercase">{company.name}</h3>
                            {company.rnc && <p className="text-slate-500 text-xs font-bold mb-1">RNC: {company.rnc}</p>}
                            {company.slogan && <p className="text-slate-500 text-xs italic mb-1">"{company.slogan}"</p>}
                            <p className="text-slate-500 text-xs">{company.address}</p>
                            <p className="text-slate-500 text-xs mb-2">{company.phone}</p>
                            <span className="inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded font-bold text-xs uppercase tracking-wider">Recibo de Ingreso - Caja</span>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-y-2 text-xs mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="text-slate-500 font-bold">No. Recibo:</div>
                            <div className="text-right font-mono font-bold text-indigo-600 text-sm">{data.receiptNo || formatReceiptId(data.transactionId)}</div>
                            <div className="text-slate-500">Fecha:</div>
                            <div className="text-right text-slate-700 font-medium">{data.date}</div>
                            <div className="text-slate-500">Método de Pago:</div>
                            <div className="text-right font-bold text-indigo-700 uppercase">{data.paymentMethod || 'Efectivo'}</div>
                            <div className="text-slate-500">Cajero:</div>
                            <div className="text-right text-slate-700 font-bold uppercase">{data.cashierName}</div>
                        </div>

                        {data.lateFeeAmount && data.lateFeeAmount > 0 ? (
                            <div className="mb-2 p-2 bg-rose-50 border border-rose-100 rounded text-xs flex justify-between text-rose-700 font-bold">
                                <span>(+) Recargo por Mora:</span>
                                <span>+RD$ {data.lateFeeAmount.toLocaleString()}</span>
                            </div>
                        ) : null}

                        {data.discountAmount && data.discountAmount > 0 ? (
                            <div className="mb-2 p-2 bg-emerald-50 border border-emerald-100 rounded text-xs flex justify-between text-emerald-700 font-bold">
                                <span>(-) Condonación / Descuento:</span>
                                <span>-RD$ {data.discountAmount.toLocaleString()}</span>
                            </div>
                        ) : null}

                        <div className="border-t border-slate-100 my-2"></div>

                        {/* Client Info */}
                        <div className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-slate-700">Cliente:</span>
                                <span className="text-right font-semibold">{data.clientName}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Ref. Préstamo:</span>
                                <span className="font-mono font-bold text-indigo-600">{formatLoanId(data.loanId)}</span>
                            </div>
                            {data.collateral !== 'Sin Garantía' && (
                                <div className="mt-2 bg-yellow-50 p-2 rounded border border-yellow-100 text-xs">
                                    <span className="font-bold text-yellow-700 block mb-0.5">Garantía / Matrícula:</span>
                                    <span className="text-yellow-800">{data.collateral}</span>
                                </div>
                            )}
                        </div>

                        {/* Financial Table */}
                        <div className="bg-slate-50 rounded border border-slate-200 p-3 mb-4">
                            <div className="flex justify-between text-slate-500 text-xs mb-1">
                                <span>Balance Anterior</span>
                                <span>RD$ {data.previousBalance.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-700 font-bold text-base mb-2 border-b border-slate-200 pb-2">
                                <span>(-) ABONO</span>
                                <span>RD$ {data.amountPaid.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-800">
                                <span>Nuevo Balance</span>
                                <span>RD$ {data.newBalance.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2 text-right italic">{data.paymentNote}</div>
                        </div>

                        {/* Arrears & Status */}
                        <div className="space-y-2 text-xs mb-4">
                            <div className="flex justify-between">
                                <span className="text-rose-600 font-bold">Monto Vencido</span>
                                <span className="font-bold text-rose-600">RD$ {data.overdueAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Cuotas Atrasadas</span>
                                <span className="text-slate-700">{data.overdueInstallments}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Pagado</span>
                                <span className="text-slate-700">{data.paidInstallments} / {data.totalInstallments} cuotas</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 mt-2">
                                <span className="text-slate-500 font-bold">Estatus Renovación</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${data.renewalStatus === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{data.renewalStatus}</span>
                            </div>
                        </div>

                        {/* Other Loans */}
                        {data.otherLoans.length > 0 && (
                            <div className="border-t border-dashed border-slate-200 pt-3">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Otros Préstamos Activos</p>
                                {data.otherLoans.map(ol => (
                                    <div key={ol.id} className="flex justify-between text-xs text-slate-600">
                                        <span className="font-mono">{formatLoanId(ol.id)}</span>
                                        <span>RD$ {ol.balance.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* QR Code in Visual Preview */}
                    <div className="mt-4 flex flex-col items-center pb-4">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(receiptWebLink)}`} 
                            alt="QR Code del recibo" 
                            className="w-24 h-24 mb-1" 
                        />
                        <span className="text-[10px] text-slate-400">Escanee para validar recibo</span>
                    </div>
                </div>
                
                {/* Actions Footer */}
                <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setIsThermalOpen(true)}
                        className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/25 active:scale-95"
                    >
                        <Printer className="w-5 h-5" /> 🖨️ Ticket Térmico Directo (58mm / 80mm)
                    </button>
                    <button 
                        onClick={handleDownloadImage}
                        className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                    >
                        <Image className="w-5 h-5" /> Descargar Recibo como Imagen (PNG)
                    </button>
                    <button 
                        onClick={handleCopyLink}
                        className="col-span-2 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 font-bold py-2.5 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200 text-xs"
                    >
                        <FileText className="w-4 h-4" /> Copiar Link Web del Recibo
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="col-span-2 flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors shadow-lg"
                    >
                        <Printer className="w-5 h-5" /> Imprimir Recibo Local / Ticket
                    </button>
                    <a 
                        href={whatsappLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20b85c] transition-colors"
                    >
                        <WhatsAppIcon /> WhatsApp
                    </a>
                    <a 
                        href={mailLink}
                        className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <Mail className="w-5 h-5" /> Correo
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Payments;
