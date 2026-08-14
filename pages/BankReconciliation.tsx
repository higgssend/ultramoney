import React, { useState, useMemo, useRef } from 'react';
import { 
  Building2, Plus, Search, Filter, CheckCircle2, Clock, XCircle, ArrowLeftRight, 
  ExternalLink, Eye, Copy, Check, Sparkles, Receipt, Trash2, Edit3, ArrowRight,
  Download, Printer, Share2, UploadCloud, AlertCircle, RefreshCw, Smartphone, 
  Banknote, Calendar, ChevronRight, X, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';
import { useAccounting, useLoans, useClients, useAuth, useSettings } from '../context/StoreContext';
import { BankDeposit, Loan, Client, LoanStatus, PaymentMethod, formatLoanId, formatReceiptId } from '../types';
import { DOMINICAN_BANKS, getBankLogoUrl } from '../utils/bankLogos';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export const BankReconciliation: React.FC = () => {
  const { 
    bankDeposits, isLoadingDeposits, addBankDeposit, updateBankDeposit, 
    deleteBankDeposit, reconcileDepositWithLoan, rejectBankDeposit, 
    refreshBankDeposits, bankAccounts, processBankDeposit 
  } = useAccounting();

  const { loans, registerPayment } = useLoans();
  const { clients } = useClients();
  const { currentUser } = useAuth();
  const { companySettings } = useSettings();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendiente' | 'Conciliado' | 'Rechazado'>('Todos');
  const [bankFilter, setBankFilter] = useState<string>('Todos');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImgUrl, setLightboxImgUrl] = useState<string | null>(null);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Selected Deposit for Action
  const [selectedDeposit, setSelectedDeposit] = useState<BankDeposit | null>(null);

  // Form State: New Deposit
  const [formBankName, setFormBankName] = useState(DOMINICAN_BANKS[0].name);
  const [formBankAccountId, setFormBankAccountId] = useState('');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<'DOP' | 'USD'>('DOP');
  const [formSenderName, setFormSenderName] = useState('');
  const [formDepositDate, setFormDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formVoucherFile, setFormVoucherFile] = useState<File | null>(null);
  const [formVoucherPreview, setFormVoucherPreview] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Match / Reconciliation Modal State
  const [matchClientSearch, setMatchClientSearch] = useState('');
  const [matchSelectedClientId, setMatchSelectedClientId] = useState<string | null>(null);
  const [matchSelectedLoanId, setMatchSelectedLoanId] = useState<string | null>(null);
  const [matchPaymentType, setMatchPaymentType] = useState<'Mixto' | 'Capital' | 'Interes'>('Mixto');
  const [matchPayAmount, setMatchPayAmount] = useState<string>('');
  const [matchPayNote, setMatchPayNote] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);

  // Reject Modal State
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Receipt Modal State (after reconciliation or viewing existing)
  const [receiptData, setReceiptData] = useState<{
    receiptNo: string;
    date: string;
    clientName: string;
    clientId?: string;
    loanId: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    bankName: string;
    referenceNo: string;
    cashierName: string;
    previousBalance: number;
    newBalance: number;
    notes: string;
  } | null>(null);

  // Copied Reference Helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Referencia "${text}" copiada al portapapeles`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const totalDeposits = bankDeposits.length;
    const pending = bankDeposits.filter(d => d.status === 'Pendiente');
    const reconciled = bankDeposits.filter(d => d.status === 'Conciliado');
    const rejected = bankDeposits.filter(d => d.status === 'Rechazado');

    const pendingTotalAmount = pending.reduce((sum, d) => sum + d.amount, 0);
    const reconciledTotalAmount = reconciled.reduce((sum, d) => sum + d.amount, 0);

    const activeBanks = new Set(bankDeposits.map(d => d.bankName)).size;

    return {
      totalCount: totalDeposits,
      pendingCount: pending.length,
      pendingAmount: pendingTotalAmount,
      reconciledCount: reconciled.length,
      reconciledAmount: reconciledTotalAmount,
      rejectedCount: rejected.length,
      activeBanksCount: activeBanks
    };
  }, [bankDeposits]);

  // Filtered Deposits
  const filteredDeposits = useMemo(() => {
    return bankDeposits.filter(deposit => {
      // Status Filter
      if (statusFilter !== 'Todos' && deposit.status !== statusFilter) {
        return false;
      }

      // Bank Filter
      if (bankFilter !== 'Todos' && deposit.bankName !== bankFilter) {
        return false;
      }

      // Date Range Filter
      if (dateFilterStart && deposit.depositDate < dateFilterStart) {
        return false;
      }
      if (dateFilterEnd && deposit.depositDate > dateFilterEnd) {
        return false;
      }

      // Text Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const refMatch = deposit.referenceNumber.toLowerCase().includes(q);
        const senderMatch = deposit.senderName?.toLowerCase().includes(q);
        const bankMatch = deposit.bankName.toLowerCase().includes(q);
        const notesMatch = deposit.notes?.toLowerCase().includes(q);
        const amountMatch = deposit.amount.toString().includes(q);
        return refMatch || senderMatch || bankMatch || notesMatch || amountMatch;
      }

      return true;
    });
  }, [bankDeposits, statusFilter, bankFilter, dateFilterStart, dateFilterEnd, searchTerm]);

  // Open Lightbox
  const handleOpenLightbox = (url: string) => {
    setLightboxImgUrl(url);
    setLightboxRotation(0);
    setLightboxZoom(1);
    setIsLightboxOpen(true);
  };

  // Handle Voucher File Pick
  const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormVoucherFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFormVoucherPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset Create Form
  const resetCreateForm = () => {
    setFormBankName(DOMINICAN_BANKS[0].name);
    setFormBankAccountId('');
    setFormReferenceNumber('');
    setFormAmount('');
    setFormCurrency('DOP');
    setFormSenderName('');
    setFormDepositDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormVoucherFile(null);
    setFormVoucherPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Create Deposit
  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }
    if (!formReferenceNumber.trim()) {
      toast.error('El número de referencia o autorización es obligatorio');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const created = await addBankDeposit({
        bankName: formBankName,
        bankAccountId: formBankAccountId || undefined,
        referenceNumber: formReferenceNumber.trim(),
        amount: parsedAmount,
        currency: formCurrency,
        senderName: formSenderName.trim() || undefined,
        depositDate: formDepositDate,
        voucherUrl: formVoucherPreview || undefined,
        notes: formNotes.trim() || undefined,
        status: 'Pendiente'
      }, formVoucherFile || (formVoucherPreview?.startsWith('data:') ? formVoucherPreview : undefined));

      if (created) {
        setIsCreateModalOpen(false);
        resetCreateForm();
      }
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Match Modal with smart suggestions
  const handleOpenMatchModal = (deposit: BankDeposit) => {
    setSelectedDeposit(deposit);
    setMatchPayAmount(deposit.amount.toString());
    setMatchPaymentType('Mixto');
    setMatchPayNote(`Conciliación bancaria Ref #${deposit.referenceNumber} (${deposit.bankName})`);

    // Smart auto-suggestion logic:
    // 1. Try to find a client whose name resembles senderName
    let matchedClient: Client | undefined;
    if (deposit.senderName) {
      const sName = deposit.senderName.toLowerCase().trim();
      matchedClient = clients.find(c => {
        const full = `${c.name} ${c.lastName || ''}`.toLowerCase();
        return full.includes(sName) || sName.includes(c.name.toLowerCase());
      });
    }

    if (matchedClient) {
      setMatchSelectedClientId(matchedClient.id);
      setMatchClientSearch(`${matchedClient.name} ${matchedClient.lastName || ''}`.trim());
      // Find active loan of this client
      const activeLoan = loans.find(l => l.clientId === matchedClient?.id && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE));
      if (activeLoan) {
        setMatchSelectedLoanId(activeLoan.id);
      } else {
        setMatchSelectedLoanId(null);
      }
    } else {
      // 2. Try to find active loan with installmentAmount == deposit.amount
      const matchedLoan = loans.find(l => 
        (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE) && 
        Math.abs((l.installmentAmount || 0) - deposit.amount) < 1
      );

      if (matchedLoan) {
        const client = clients.find(c => c.id === matchedLoan.clientId);
        setMatchSelectedClientId(matchedLoan.clientId);
        setMatchSelectedLoanId(matchedLoan.id);
        if (client) {
          setMatchClientSearch(`${client.name} ${client.lastName || ''}`.trim());
        }
      } else {
        setMatchSelectedClientId(null);
        setMatchSelectedLoanId(null);
        setMatchClientSearch('');
      }
    }

    setIsMatchModalOpen(true);
  };

  // Smart suggestions for the selected deposit
  const smartSuggestions = useMemo(() => {
    if (!selectedDeposit) return [];
    const suggestions: { loan: Loan; client: Client; matchReason: string }[] = [];

    // Exact amount match
    loans.forEach(loan => {
      if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.OVERDUE) return;
      const client = clients.find(c => c.id === loan.clientId);
      if (!client) return;

      const isExactInstallment = Math.abs((loan.installmentAmount || 0) - selectedDeposit.amount) < 0.5;
      const isExactBalance = Math.abs((loan.remainingBalance || 0) - selectedDeposit.amount) < 0.5;

      let nameMatch = false;
      if (selectedDeposit.senderName) {
        const sName = selectedDeposit.senderName.toLowerCase();
        const fullName = `${client.name} ${client.lastName || ''}`.toLowerCase();
        if (fullName.includes(sName) || sName.includes(client.name.toLowerCase())) {
          nameMatch = true;
        }
      }

      if (isExactInstallment && nameMatch) {
        suggestions.unshift({ loan, client, matchReason: '⭐ Coincidencia Exacta: Nombre de Cliente + Monto de Cuota' });
      } else if (nameMatch) {
        suggestions.push({ loan, client, matchReason: `👤 Coincide Nombre del Titular ("${selectedDeposit.senderName}")` });
      } else if (isExactInstallment) {
        suggestions.push({ loan, client, matchReason: `💵 Monto de Cuota idéntico (RD$ ${loan.installmentAmount?.toLocaleString()})` });
      } else if (isExactBalance) {
        suggestions.push({ loan, client, matchReason: `🎯 Monto coincide con Saldo Total del Préstamo (RD$ ${loan.remainingBalance?.toLocaleString()})` });
      }
    });

    return suggestions.slice(0, 4);
  }, [selectedDeposit, loans, clients]);

  // Clients matching the search text in the modal
  const modalFilteredClients = useMemo(() => {
    if (!matchClientSearch.trim()) return clients.slice(0, 10);
    const q = matchClientSearch.toLowerCase();
    return clients.filter(c => {
      const name = `${c.name} ${c.lastName || ''}`.toLowerCase();
      const doc = (c.documentId || c.cedula || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(q) || doc.includes(q) || phone.includes(q);
    }).slice(0, 15);
  }, [clients, matchClientSearch]);

  // Active loans for the currently selected client in the modal
  const clientActiveLoans = useMemo(() => {
    if (!matchSelectedClientId) return [];
    return loans.filter(l => l.clientId === matchSelectedClientId && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE));
  }, [loans, matchSelectedClientId]);

  // Execute 1-Click Reconciliation
  const handleConfirmReconciliation = async () => {
    if (!selectedDeposit) return;
    if (!matchSelectedLoanId) {
      toast.error('Debes seleccionar un préstamo para vincular el pago');
      return;
    }

    const targetLoan = loans.find(l => l.id === matchSelectedLoanId);
    if (!targetLoan) {
      toast.error('Préstamo no encontrado');
      return;
    }

    const payAmountNum = parseFloat(matchPayAmount);
    if (!payAmountNum || payAmountNum <= 0) {
      toast.error('Monto de pago inválido');
      return;
    }

    setIsReconciling(true);
    try {
      const client = clients.find(c => c.id === targetLoan.clientId);
      const prevBal = targetLoan.remainingBalance;
      const calcNewBal = Math.max(0, prevBal - payAmountNum);

      // 1. Register payment in LoanContext & Transactions
      await registerPayment(
        targetLoan.id,
        payAmountNum,
        matchPayNote || `Depósito Bancario Ref #${selectedDeposit.referenceNumber} - ${selectedDeposit.bankName}`,
        selectedDeposit.depositDate,
        selectedDeposit.depositDate,
        matchPaymentType,
        matchPaymentType === 'Capital' ? payAmountNum : undefined,
        'Transferencia',
        currentUser?.id,
        selectedDeposit.bankAccountId,
        selectedDeposit.voucherUrl
      );

      // 2. Reconcile deposit in database
      const generatedReceiptId = `REC-${Date.now().toString().slice(-6)}`;
      await reconcileDepositWithLoan(selectedDeposit.id, {
        loanId: targetLoan.id,
        clientId: targetLoan.clientId,
        receiptId: generatedReceiptId,
        reconciledBy: currentUser?.name || currentUser?.email || 'Admin'
      });

      // 3. Process bank account balance update if bank account is linked
      if (selectedDeposit.bankAccountId) {
        processBankDeposit(selectedDeposit.bankAccountId, payAmountNum);
      }

      // 4. Open Receipt Modal
      setReceiptData({
        receiptNo: generatedReceiptId,
        date: selectedDeposit.depositDate,
        clientName: client ? `${client.name} ${client.lastName || ''}`.trim() : targetLoan.clientName || 'Cliente',
        clientId: targetLoan.clientId,
        loanId: targetLoan.id,
        amountPaid: payAmountNum,
        paymentMethod: 'Transferencia',
        bankName: selectedDeposit.bankName,
        referenceNo: selectedDeposit.referenceNumber,
        cashierName: currentUser?.name || currentUser?.email || 'Administrador',
        previousBalance: prevBal,
        newBalance: calcNewBal,
        notes: matchPayNote || `Transferencia bancaria conciliada ${selectedDeposit.bankName}`
      });

      setIsMatchModalOpen(false);
      setSelectedDeposit(null);
      toast.success('¡Transferencia bancaria conciliada y pago aplicado con éxito!');
    } catch (err) {
      console.error('Error during reconciliation:', err);
      toast.error('Error al procesar la conciliación');
    } finally {
      setIsReconciling(false);
    }
  };

  // Reject Deposit Action
  const handleConfirmReject = async () => {
    if (!selectedDeposit) return;
    setIsRejecting(true);
    try {
      await rejectBankDeposit(selectedDeposit.id, rejectReason.trim() || undefined);
      setIsRejectModalOpen(false);
      setSelectedDeposit(null);
      setRejectReason('');
    } finally {
      setIsRejecting(false);
    }
  };

  // Delete Deposit Action
  const handleDeleteDeposit = async (deposit: BankDeposit) => {
    if (confirm(`¿Estás seguro de eliminar el depósito Ref #${deposit.referenceNumber} de RD$ ${deposit.amount.toLocaleString()}?`)) {
      await deleteBankDeposit(deposit.id);
    }
  };

  // View Receipt for an already reconciled deposit
  const handleViewReconciledReceipt = (deposit: BankDeposit) => {
    const loan = loans.find(l => l.id === deposit.matchedLoanId);
    const client = clients.find(c => c.id === (deposit.matchedClientId || loan?.clientId));

    setReceiptData({
      receiptNo: deposit.matchedReceiptId || `REC-${deposit.id.slice(-6).toUpperCase()}`,
      date: deposit.depositDate,
      clientName: client ? `${client.name} ${client.lastName || ''}`.trim() : (loan?.clientName || 'Cliente'),
      clientId: deposit.matchedClientId || loan?.clientId,
      loanId: deposit.matchedLoanId || 'N/A',
      amountPaid: deposit.amount,
      paymentMethod: 'Transferencia',
      bankName: deposit.bankName,
      referenceNo: deposit.referenceNumber,
      cashierName: deposit.reconciledBy || 'Administrador',
      previousBalance: (loan?.remainingBalance || 0) + deposit.amount,
      newBalance: loan?.remainingBalance || 0,
      notes: deposit.notes || `Comprobante de depósito bancario ${deposit.bankName}`
    });
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!receiptData) return;
    const client = clients.find(c => c.id === receiptData.clientId);
    const phone = client?.phone?.replace(/\D/g, '') || '';

    const message = `*RECIBO OFICIAL DE PAGO - ${companySettings?.name || 'ULTRAMONEY'}*\n\n` +
      `📄 *Recibo No:* ${receiptData.receiptNo}\n` +
      `📅 *Fecha:* ${receiptData.date}\n` +
      `👤 *Cliente:* ${receiptData.clientName}\n` +
      `🏦 *Banco:* ${receiptData.bankName}\n` +
      `🔢 *Ref Bancaria:* ${receiptData.referenceNo}\n` +
      `💵 *Monto Pagado:* RD$ ${receiptData.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n` +
      `📊 *Nuevo Balance:* RD$ ${receiptData.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n\n` +
      `_Gracias por su pago puntual._`;

    const encoded = encodeURIComponent(message);
    if (phone) {
      window.open(`https://wa.me/${phone.startsWith('1') ? phone : `1${phone}`}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Finanzas Dominicanas & Pagos Electrónicos
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-emerald-400" />
            Conciliación Bancaria & Depósitos
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl">
            Gestiona transferencias entrantes (Banreservas, Popular, BHD, APAP, etc.), verifica comprobantes y vincúlalos a las cuotas de préstamos con 1 solo clic.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-wrap">
          <button
            onClick={() => refreshBankDeposits()}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 flex items-center justify-center"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-5 h-5 ${isLoadingDeposits ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Depósito / Transferencia</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Depósitos Pendientes
            </span>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              RD$ {stats.pendingAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              {stats.pendingCount} transferencias por vincular
            </p>
          </div>
        </div>

        {/* Reconciled Card */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Conciliado
            </span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              RD$ {stats.reconciledAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {stats.reconciledCount} pagos aplicados a préstamos
            </p>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Rechazados / Inválidos
            </span>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600 dark:text-rose-300">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.rejectedCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Comprobantes no válidos o duplicados
            </p>
          </div>
        </div>

        {/* Active Banks Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Bancos Utilizados
            </span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-300">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.activeBanksCount} Bancos
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Banreservas, Popular, BHD, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            {(['Todos', 'Pendiente', 'Conciliado', 'Rechazado'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'Todos' && `Todos (${bankDeposits.length})`}
                {tab === 'Pendiente' && `⏳ Pendientes (${stats.pendingCount})`}
                {tab === 'Conciliado' && `✅ Conciliados (${stats.reconciledCount})`}
                {tab === 'Rechazado' && `❌ Rechazados (${stats.rejectedCount})`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por # de referencia, cliente, banco o monto..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Secondary filters: Bank & Date Range */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Filter className="w-4 h-4" />
            <span>Filtrar por:</span>
          </div>

          {/* Bank Select */}
          <select
            value={bankFilter}
            onChange={e => setBankFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Todos">Todos los Bancos</option>
            {DOMINICAN_BANKS.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>

          {/* Date Start */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-slate-400 text-xs">Desde:</span>
            <input
              type="date"
              value={dateFilterStart}
              onChange={e => setDateFilterStart(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
            />
          </div>

          {/* Date End */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-slate-400 text-xs">Hasta:</span>
            <input
              type="date"
              value={dateFilterEnd}
              onChange={e => setDateFilterEnd(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
            />
          </div>

          {(bankFilter !== 'Todos' || dateFilterStart || dateFilterEnd || searchTerm) && (
            <button
              onClick={() => {
                setBankFilter('Todos');
                setDateFilterStart('');
                setDateFilterEnd('');
                setSearchTerm('');
              }}
              className="px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Deposits Table / Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredDeposits.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ArrowLeftRight className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No hay depósitos o transferencias
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchTerm || statusFilter !== 'Todos' || bankFilter !== 'Todos'
                  ? 'No se encontraron resultados con los filtros aplicados.'
                  : 'Registra los depósitos recibidos para comenzar a conciliar los pagos con las cuotas de tus clientes.'}
              </p>
            </div>
            <button
              onClick={() => {
                resetCreateForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Depósito</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Banco & Comprobante</th>
                  <th className="py-3.5 px-4">Ref / Autorización</th>
                  <th className="py-3.5 px-4">Titular / Remitente</th>
                  <th className="py-3.5 px-4">Fecha Depósito</th>
                  <th className="py-3.5 px-4 text-right">Monto</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4">Voucher</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredDeposits.map(deposit => {
                  const logoUrl = getBankLogoUrl(deposit.bankName);
                  const isPending = deposit.status === 'Pendiente';
                  const isReconciled = deposit.status === 'Conciliado';
                  const isRejected = deposit.status === 'Rechazado';

                  // Matched loan info if reconciled
                  const matchedLoan = deposit.matchedLoanId ? loans.find(l => l.id === deposit.matchedLoanId) : null;
                  const matchedClient = deposit.matchedClientId ? clients.find(c => c.id === deposit.matchedClientId) : null;

                  return (
                    <tr 
                      key={deposit.id} 
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isPending ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Bank & Logo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={deposit.bankName}
                              className="w-10 h-10 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                              {deposit.bankName}
                            </p>
                            {deposit.notes && (
                              <p className="text-xs text-slate-400 truncate max-w-[180px]" title={deposit.notes}>
                                {deposit.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reference Number */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
                            #{deposit.referenceNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(deposit.referenceNumber, deposit.id)}
                            className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded"
                            title="Copiar Referencia"
                          >
                            {copiedId === deposit.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Sender Name */}
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {deposit.senderName ? (
                          <span>{deposit.senderName}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No especificado</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {deposit.depositDate}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 text-right">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          RD$ {deposit.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-full border border-amber-300 dark:border-amber-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pendiente
                          </span>
                        )}
                        {isReconciled && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-300 dark:border-emerald-800/40">
                              <Check className="w-3.5 h-3.5" />
                              Conciliado
                            </span>
                            {(matchedClient || matchedLoan) && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px] mx-auto">
                                {matchedClient ? `${matchedClient.name} ${matchedClient.lastName || ''}`.trim() : `Préstamo #${matchedLoan?.id?.slice(-6)}`}
                              </p>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-full border border-rose-300 dark:border-rose-800/40">
                            <X className="w-3.5 h-3.5" />
                            Rechazado
                          </span>
                        )}
                      </td>

                      {/* Voucher Preview Thumbnail */}
                      <td className="py-4 px-4">
                        {deposit.voucherUrl ? (
                          <button
                            onClick={() => handleOpenLightbox(deposit.voucherUrl!)}
                            className="group relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-emerald-500 transition-all flex items-center justify-center"
                            title="Ver Comprobante en Grande"
                          >
                            <img
                              src={deposit.voucherUrl}
                              alt="Comprobante"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin captura</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenMatchModal(deposit)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all active:scale-95"
                                title="Vincular pago a un préstamo"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>Vincular (1-Clic)</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedDeposit(deposit);
                                  setRejectReason('');
                                  setIsRejectModalOpen(true);
                                }}
                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                title="Rechazar depósito"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isReconciled && (
                            <button
                              onClick={() => handleViewReconciledReceipt(deposit)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Ver Recibo</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteDeposit(deposit)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: REGISTRAR DEPÓSITO / TRANSFERENCIA ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Registrar Depósito o Transferencia
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ingresa los datos de la transferencia recibida por el cliente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateDeposit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Bank Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Banco Destino *
                </label>
                <select
                  value={formBankName}
                  onChange={e => {
                    setFormBankName(e.target.value);
                    const matchingAcc = bankAccounts.find(a => a.bankName === e.target.value);
                    if (matchingAcc) setFormBankAccountId(matchingAcc.id);
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  {DOMINICAN_BANKS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Bank Account link (Optional) */}
              {bankAccounts.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cuenta Registrada en Ultramoney (Opcional)
                  </label>
                  <select
                    value={formBankAccountId}
                    onChange={e => setFormBankAccountId(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Seleccionar cuenta financiera...</option>
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountNumber} ({acc.holderName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount & Reference Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Monto Recibido (RD$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      RD$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    # de Referencia / Autorización *
                  </label>
                  <input
                    type="text"
                    value={formReferenceNumber}
                    onChange={e => setFormReferenceNumber(e.target.value)}
                    placeholder="Ej. 984729103"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Sender Name & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Titular / Quien Transfiere
                  </label>
                  <input
                    type="text"
                    value={formSenderName}
                    onChange={e => setFormSenderName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Fecha de Transferencia *
                  </label>
                  <input
                    type="date"
                    value={formDepositDate}
                    onChange={e => setFormDepositDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Voucher Upload / Image Drop */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Foto / Captura del Comprobante Bancario</span>
                  {formVoucherPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormVoucherFile(null);
                        setFormVoucherPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-rose-500 text-xs hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </label>

                {formVoucherPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 flex items-center justify-center bg-slate-950">
                    <img
                      src={formVoucherPreview}
                      alt="Comprobante subido"
                      className="max-h-48 object-contain"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-800/40 space-y-2"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Arrastra la captura del comprobante o haz clic para subir
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Soporta JPG, PNG, WEBP (Captura de app Banreservas, Popular, BHD, etc.)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleVoucherChange}
                  className="hidden"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notas Adicionales
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Detalles sobre el pago o instrucciones especiales..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  {isSubmittingCreate ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Guardar Depósito</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ⚡ VINCULAR A PRÉSTAMO (1-CLIC MATCH) ================= */}
      {isMatchModalOpen && selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    Vincular Transferencia a Préstamo (1-Clic)
                  </h3>
                  <p className="text-xs text-emerald-300/80">
                    Aplica el depósito a la cuota del cliente y genera el recibo oficial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Deposit Card Overview */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {getBankLogoUrl(selectedDeposit.bankName) ? (
                    <img
                      src={getBankLogoUrl(selectedDeposit.bankName)!}
                      alt={selectedDeposit.bankName}
                      className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      {selectedDeposit.bankName}
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                      Ref: #{selectedDeposit.referenceNumber}
                    </p>
                    {selectedDeposit.senderName && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Titular: <span className="font-semibold">{selectedDeposit.senderName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right md:border-l md:border-emerald-200 dark:md:border-emerald-800 md:pl-6">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                    Monto Depositado
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    RD$ {selectedDeposit.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Fecha: {selectedDeposit.depositDate}
                  </span>
                </div>
              </div>

              {/* Smart Match Suggestions (If Any) */}
              {smartSuggestions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Coincidencias Inteligentes Encontradas ({smartSuggestions.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {smartSuggestions.map(({ loan, client, matchReason }) => {
                      const isSelected = matchSelectedLoanId === loan.id;
                      return (
                        <div
                          key={loan.id}
                          onClick={() => {
                            setMatchSelectedClientId(client.id);
                            setMatchSelectedLoanId(loan.id);
                            setMatchClientSearch(`${client.name} ${client.lastName || ''}`.trim());
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all text-left ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500'
                              : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                            {matchReason}
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {client.name} {client.lastName || ''}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mt-1">
                            <span>Préstamo #{loan.id.slice(-6)}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              Cuota: RD$ {loan.installmentAmount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 1: Select / Search Client */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Buscar Cliente
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={matchClientSearch}
                    onChange={e => {
                      setMatchClientSearch(e.target.value);
                      setMatchSelectedClientId(null);
                      setMatchSelectedLoanId(null);
                    }}
                    placeholder="Escribe el nombre, cédula o teléfono del cliente..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Clients Dropdown List */}
                {!matchSelectedClientId && matchClientSearch.trim() && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 shadow-lg">
                    {modalFilteredClients.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400 text-center">No se encontraron clientes</p>
                    ) : (
                      modalFilteredClients.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setMatchSelectedClientId(c.id);
                            setMatchClientSearch(`${c.name} ${c.lastName || ''}`.trim());
                            const firstLoan = loans.find(l => l.clientId === c.id && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE));
                            if (firstLoan) setMatchSelectedLoanId(firstLoan.id);
                          }}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between text-sm"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {c.name} {c.lastName || ''}
                            </p>
                            <p className="text-xs text-slate-400">
                              Cédula: {c.documentId || c.cedula || 'N/A'} • Tel: {c.phone || 'N/A'}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Select Loan */}
              {matchSelectedClientId && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    2. Seleccionar Préstamo Activo
                  </label>
                  {clientActiveLoans.length === 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Este cliente no tiene préstamos activos actualmente.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clientActiveLoans.map(loan => {
                        const isSelected = matchSelectedLoanId === loan.id;
                        return (
                          <div
                            key={loan.id}
                            onClick={() => setMatchSelectedLoanId(loan.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500'
                                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                Préstamo #{loan.id.slice(-6)}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                                {loan.frequency}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between text-slate-500">
                                <span>Saldo Restante:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  RD$ {loan.remainingBalance.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Valor Cuota:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  RD$ {loan.installmentAmount?.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Próximo Pago:</span>
                                <span>{loan.nextPaymentDate || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment Type & Adjustments */}
              {matchSelectedLoanId && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    3. Aplicación del Pago
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setMatchPaymentType('Mixto')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        matchPaymentType === 'Mixto'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Cuota Normal (Mixto)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchPaymentType('Capital')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        matchPaymentType === 'Capital'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Abono Directo a Capital
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchPaymentType('Interes')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        matchPaymentType === 'Interes'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Solo Intereses / Rédito
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Monto a Aplicar (RD$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={matchPayAmount}
                        onChange={e => setMatchPayAmount(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Concepto / Nota en Recibo
                      </label>
                      <input
                        type="text"
                        value={matchPayNote}
                        onChange={e => setMatchPayNote(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setIsMatchModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmReconciliation}
                disabled={!matchSelectedLoanId || isReconciling}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                {isReconciling ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>Confirmar Conciliación & Generar Recibo (1-Clic)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: RECHAZAR DEPÓSITO ================= */}
      {isRejectModalOpen && selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rechazar Depósito
                </h3>
                <p className="text-xs text-slate-500">
                  Ref #{selectedDeposit.referenceNumber} por RD$ {selectedDeposit.amount.toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Indica el motivo por el cual este comprobante o depósito no es válido (ej. comprobante falso, monto no acreditado en cuenta bancaria, transferencia reversada).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Motivo del Rechazo
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ej. Transferencia no figura en el estado de cuenta bancario..."
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {isRejecting ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: VOUCHER LIGHTBOX ================= */}
      {isLightboxOpen && lightboxImgUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setLightboxZoom(prev => Math.min(prev + 0.25, 3))}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLightboxZoom(prev => Math.max(prev - 0.25, 0.5))}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              title="Disminuir zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              title="Rotar imagen"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <a
              href={lightboxImgUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="comprobante_bancario.png"
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              title="Abrir en pestaña nueva / Descargar"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition-all ml-2"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[85vh] overflow-hidden flex items-center justify-center">
            <img
              src={lightboxImgUrl}
              alt="Comprobante Bancario"
              style={{
                transform: `rotate(${lightboxRotation}deg) scale(${lightboxZoom})`,
                transition: 'transform 0.2s ease-in-out'
              }}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ================= MODAL 5: OFFICIAL RECEIPT MODAL ================= */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Recibo Oficial de Pago</h3>
                  <p className="text-xs text-emerald-100">Comprobante generado automáticamente</p>
                </div>
              </div>
              <button
                onClick={() => setReceiptData(null)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Preview */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
                <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                  {companySettings?.name || 'ULTRAMONEY DOMINICANA'}
                </h2>
                {companySettings?.rnc && <p>RNC: {companySettings.rnc}</p>}
                {companySettings?.phone && <p>Tel: {companySettings.phone}</p>}
                {companySettings?.address && <p>{companySettings.address}</p>}
                <p className="font-bold pt-2 text-sm text-emerald-600 dark:text-emerald-400">
                  COMPROBANTE DE PAGO BANCARIO
                </p>
                <p>No: {receiptData.receiptNo}</p>
                <p>Fecha: {receiptData.date}</p>
              </div>

              {/* Client & Loan Details */}
              <div className="space-y-1.5 py-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-right">{receiptData.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Préstamo:</span>
                  <span className="font-bold">#{receiptData.loanId.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Banco:</span>
                  <span>{receiptData.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref Bancaria:</span>
                  <span className="font-bold">#{receiptData.referenceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cajero/Admin:</span>
                  <span>{receiptData.cashierName}</span>
                </div>
              </div>

              {/* Balances & Payment Breakdown */}
              <div className="space-y-2 py-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="flex justify-between text-sm font-extrabold">
                  <span>MONTO PAGADO:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    RD$ {receiptData.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Balance Anterior:</span>
                  <span>RD$ {receiptData.previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Nuevo Balance:</span>
                  <span>RD$ {receiptData.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-slate-500 pt-2 space-y-1">
                <p>{receiptData.notes}</p>
                <p className="italic">Este documento es un comprobante oficial de abono o liquidación emitido electrónicamente.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                onClick={handlePrintReceipt}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>

              <button
                onClick={() => setReceiptData(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;
