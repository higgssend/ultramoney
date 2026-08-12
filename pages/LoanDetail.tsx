import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Banknote, Shield, AlertTriangle, RefreshCw, 
  DollarSign, Printer, Download, FileCode, FileImage, CloudUpload, 
  MessageCircle, CreditCard, CheckCircle, Clock, Calendar, ChevronRight, User, Eye, Receipt,
  Edit3, Trash2, Save, X, AlertCircle, Copy, Link
} from 'lucide-react';
import { useLoans, useClients, useSettings, useAccounting } from '../context/StoreContext';
import { Loan, Client, formatLoanId, formatReceiptId, Transaction, PaymentMethod } from '../types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { insforge } from '../lib/insforge';
import { LoanEngine } from '../utils/LoanEngine';
import { LoanCreatedSharingModal } from '../components/LoanCreatedSharingModal';
import { LoanContractModal } from './features/LoanContractModal';

export const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'summary';

  const { loans, updateLoan, deleteLoan, addHistoricalPayment, refinanceLoan, forgiveDebt } = useLoans();
  const { clients } = useClients();
  const { companySettings } = useSettings();
  const { transactions } = useAccounting();

  const loan = loans.find(l => l.id === id);
  const client = clients.find(c => c?.id === loan?.clientId);

  const [activeTab, setActiveTab] = useState<'summary' | 'amortization' | 'payments' | 'documents' | 'collateral' | 'refinance' | 'forgiveness'>(initialTab);
  const [docType, setDocType] = useState<'pagare' | 'contrato' | 'estado_cuenta' | 'carta_saldo' | 'carta_cobro' | 'recibo'>('pagare');
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  // Refinance state
  const [refinanceAmount, setRefinanceAmount] = useState<number>(0);
  const [refinanceWeeks, setRefinanceWeeks] = useState<number>(12);
  const [refinanceInterest, setRefinanceInterest] = useState<number>(10);

  // Forgiveness state
  const [forgiveAmount, setForgiveAmount] = useState<number>(0);
  const [forgiveNote, setForgiveNote] = useState<string>('');

  // Loan Transactions from Database
  const [dbTransactions, setDbTransactions] = useState<Transaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  // Edit Loan Modal State - Complete Edition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editInterestRate, setEditInterestRate] = useState<number>(0);
  const [editFrequency, setEditFrequency] = useState<string>('Semanal');
  const [editLoanType, setEditLoanType] = useState<string>('Amortizado (Cuota Fija)');
  const [editInstallments, setEditInstallments] = useState<number>(12);
  const [editRemainingBalance, setEditRemainingBalance] = useState<number>(0);
  const [editTotalToPay, setEditTotalToPay] = useState<number>(0);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editNextPaymentDate, setEditNextPaymentDate] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('Activo');

  // Financiamiento / Garantías state for edit
  const [editItemPrice, setEditItemPrice] = useState<number>(0);
  const [editDownPayment, setEditDownPayment] = useState<number>(0);
  const [editDownPaymentMode, setEditDownPaymentMode] = useState<string>('Efectivo');
  const [editCollateralType, setEditCollateralType] = useState<string>('Sin Garantía');
  const [editCollateralDesc, setEditCollateralDesc] = useState<string>('');
  const [editCollateralRef, setEditCollateralRef] = useState<string>('');

  // Delete Loan Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Historical Payment Modal State
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);
  const [histAmount, setHistAmount] = useState<number>(0);
  const [histDate, setHistDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [histRef, setHistRef] = useState<string>('');
  const [histNotes, setHistNotes] = useState<string>('Pago Histórico / Migrado');
  const [histMethod, setHistMethod] = useState<PaymentMethod>('Efectivo');
  const [histType, setHistType] = useState<'Interes' | 'Capital' | 'Mixto'>('Mixto');

  const openEditModal = () => {
    if (!loan) return;
    setEditAmount(loan.amount);
    setEditInterestRate(loan.interestRate);
    setEditFrequency(loan.frequency || loan.paymentFrequency || 'Semanal');
    setEditLoanType(loan.loanType || 'Amortizado (Cuota Fija)');
    setEditInstallments(loan.installments || loan.durationWeeks || 12);
    setEditRemainingBalance(loan.remainingBalance ?? loan.amount);
    setEditTotalToPay(loan.totalToPay ?? loan.amount);
    setEditStartDate(loan.startDate || new Date().toISOString().split('T')[0]);
    setEditNextPaymentDate(loan.nextPaymentDate || '');
    setEditNote(loan.note || '');
    setEditStatus(loan.status || 'Activo');

    setEditItemPrice(loan.itemPrice || 0);
    setEditDownPayment(loan.downPayment || 0);
    setEditDownPaymentMode(loan.downPaymentMode || 'Efectivo');
    setEditCollateralType(loan.collateral?.type || 'Sin Garantía');
    setEditCollateralDesc(loan.collateral?.description || '');
    setEditCollateralRef(loan.collateral?.refNumber || '');

    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!loan) return;

    const collateralObj = editCollateralDesc || editCollateralRef ? {
      type: editCollateralType as any,
      description: editCollateralDesc,
      refNumber: editCollateralRef,
    } : loan.collateral;

    const updatedLoan: Loan = {
      ...loan,
      amount: editAmount,
      interestRate: editInterestRate,
      frequency: editFrequency as any,
      paymentFrequency: editFrequency as any,
      loanType: editLoanType as any,
      installments: editInstallments,
      durationWeeks: editInstallments,
      remainingBalance: editRemainingBalance,
      totalToPay: editTotalToPay,
      startDate: editStartDate,
      nextPaymentDate: editNextPaymentDate || loan.nextPaymentDate,
      note: editNote,
      status: editStatus as any,
      itemPrice: editItemPrice || undefined,
      downPayment: editDownPayment || undefined,
      downPaymentMode: editDownPaymentMode as any,
      financedAmount: editItemPrice && editDownPayment ? (editItemPrice - editDownPayment) : loan.financedAmount,
      collateral: collateralObj,
    };
    await updateLoan(updatedLoan);
    setIsEditModalOpen(false);
  };

  const handleDeleteLoan = async () => {
    if (!loan) return;
    await deleteLoan(loan.id);
    setIsDeleteModalOpen(false);
    navigate('/prestamos');
  };

  const handleAddHistoricalPayment = async () => {
    if (!loan || histAmount <= 0) {
      toast.error('Por favor ingrese un monto válido para el pago histórico');
      return;
    }
    const res = await addHistoricalPayment(loan.id, {
      amount: histAmount,
      date: histDate,
      reference: histRef,
      notes: histNotes,
      paymentMethod: histMethod,
      paymentType: histType,
    });
    if (res) {
      setDbTransactions(prev => [res, ...prev]);
      setHistAmount(0);
      setHistRef('');
      setIsHistoricalModalOpen(false);
    }
  };

  useEffect(() => {
    if (loan) {
      if (searchParams.get('edit') === 'true') {
        openEditModal();
      }
      if (searchParams.get('delete') === 'true') {
        setIsDeleteModalOpen(true);
      }
      setRefinanceAmount(loan.amount);
      const fetchTransactions = async () => {
        try {
          const { data } = await insforge.database
            .from('transactions')
            .select('*')
            .eq('referenceid', loan.id);
          
          if (data && data.length > 0) {
            setDbTransactions(data as any);
          } else {
            const { data: data2 } = await insforge.database
              .from('transactions')
              .select('*')
              .eq('reference_id', loan.id);
            if (data2) setDbTransactions(data2 as any);
          }
        } catch (e) {
          console.error("Error fetching transactions for loan detail:", e);
        }
      };
      fetchTransactions();
    }
  }, [loan?.id]);

  if (!loan) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-lg font-bold">Préstamo no encontrado.</p>
        <button onClick={() => navigate('/prestamos')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Volver a Préstamos
        </button>
      </div>
    );
  }

  // Combine store transactions and database transactions avoiding duplicates
  const storeLoanTx = transactions.filter(t => 
    t.referenceId === loan.id || 
    (t as any).referenceid === loan.id || 
    (t.description && t.description.includes(loan.id))
  );

  const combinedTransactionsMap = new Map<string, Transaction>();
  storeLoanTx.forEach(t => combinedTransactionsMap.set(t.id, t));
  dbTransactions.forEach(t => combinedTransactionsMap.set(t.id, t));

  const allLoanTransactions = Array.from(combinedTransactionsMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalCollectedOnLoan = allLoanTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  const company = companySettings || { name: 'UltraMoney Financial', address: 'Santo Domingo, R.D.', phone: '809-000-0000', rnc: '101-00000-1' };
  const todayStr = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });

  // Overdue & Mora Calculation
  const nextPayDateObj = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);

  const isDateOverdue = nextPayDateObj ? (nextPayDateObj.getTime() < todayStart.getTime()) : false;
  const isLoanOverdue = loan.status === 'Atrasado' || (loan.status === 'Activo' && isDateOverdue);
  
  const daysLate = (isLoanOverdue && nextPayDateObj)
    ? Math.max(1, Math.floor((todayStart.getTime() - nextPayDateObj.getTime()) / (1000 * 3600 * 24)))
    : 0;

  const installmentAmount = loan.installmentAmount || Math.round((loan.totalToPay || loan.amount) / (loan.durationWeeks || 1));
  const lateFeeAmount = isLoanOverdue ? Math.round(installmentAmount * 0.05) : 0;
  const totalRegularizeAmount = (loan.remainingBalance || installmentAmount) + lateFeeAmount;

  // Amortization Table Generator
  const getAmortizationTable = () => {
    const isRedito = (loan.loanType || '').includes('Rédito') || (loan.loanType || '').includes('Pagaré');
    const totalPeriods = isRedito ? 1 : Math.max(1, loan.durationWeeks || 1);
    const rate = (loan.interestRate || 0) / 100;

    if (!isRedito) {
      const engineSchedule = LoanEngine.generateAmortizationSchedule(
        loan.amount || 0,
        loan.interestRate || 0,
        totalPeriods,
        loan.frequency || 'Semanal',
        loan.startDate || new Date().toISOString().split('T')[0],
        { amortizationMethod: 'Amortizado' },
        loan.loanType || 'Amortizado'
      );
      return (engineSchedule || []).map(s => ({
        period: s.installmentNumber,
        date: s.date,
        principal: s.principal,
        interest: s.interest,
        amount: s.total,
        balance: s.balance
      }));
    }

    // For Redito (Pagaré Abierto)
    const interestAmount = (loan.amount || 0) * rate;
    const dateStr = LoanEngine.getNextDate(loan.startDate || new Date().toISOString().split('T')[0], loan.frequency || 'Semanal', 1, loan.startDate);
    return [{
      period: 1,
      date: dateStr,
      principal: 0,
      interest: interestAmount,
      amount: interestAmount,
      balance: loan.amount || 0
    }];
  };

  // Collateral Wording Analysis
  let collateralType = 'Sin Garantía';
  let collateralDescription = '';
  let collateralRefNumber = '';
  let collateralEstimatedValue = 0;
  let collateralLegalClause = 'EL DEUDOR responde con la totalidad de su patrimonio personal presente y futuro (Fianza Personal e Indivisible).';
  let collateralHeading = 'GARANTÍA PERSONAL Y PATRIMONIAL';

  if (loan.collateral && typeof loan.collateral === 'object') {
    collateralType = loan.collateral.type || 'Sin Garantía';
    collateralDescription = loan.collateral.description || '';
    collateralRefNumber = loan.collateral.refNumber || '';
    collateralEstimatedValue = loan.collateral.estimatedValue || 0;
  } else if (loan.collateralref || loan.collateralRef) {
    collateralRefNumber = String(loan.collateralref || loan.collateralRef);
    collateralDescription = String(loan.collateral || '');
    collateralType = loan.loanCategory === 'Vehicular' ? 'Vehículo' : (loan.loanCategory === 'Hipotecario' ? 'Propiedad' : 'Otro');
  }

  const isFinancingLoan = Boolean(
    loan.loanCategory === 'Financiamiento' || 
    (loan.loanType && loan.loanType.includes('Financiamiento')) ||
    loan.itemPrice
  );

  if (isFinancingLoan) {
    collateralHeading = 'RESERVA DE DOMINIO Y FINANCIAMIENTO DE BIEN / PRODUCTO';
    collateralLegalClause = `VENTA CON RESERVA DE DOMINIO Y PROPIEDAD sobre el bien financiado: ${collateralDescription || 'Bien / Producto Financiado'}${collateralRefNumber ? `, Serial/IMEI/Matrícula No.: ${collateralRefNumber}` : ''}${loan.itemPrice ? `, Precio Total de Venta: RD$ ${loan.itemPrice.toLocaleString('es-DO')}` : ''}${loan.downPayment ? `, Inicial Pagado: RD$ ${loan.downPayment.toLocaleString('es-DO')} (${loan.downPaymentMode || 'Efectivo'})` : ''}. EL ACREEDOR conserva la titularidad y reserva de dominio del bien hasta el pago total de las cuotas acordadas.`;
  } else if (collateralType === 'Vehículo') {
    collateralHeading = 'GARANTÍA MOBILIARIA VEHICULAR (PRENDA SIN DESPOSESIÓN)';
    collateralLegalClause = `PRENDA SIN DESPOSESIÓN sobre el vehículo motorizado descrito a continuación: Marca/Modelo/Año: ${collateralDescription || 'Declarado en expediente'}, Matrícula / Placa / Chasis No.: ${collateralRefNumber || 'N/A'}${collateralEstimatedValue > 0 ? `, por un valor estimado de RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}. EL DEUDOR autoriza expresamente la inscripción del gravamen en la DGII.`;
  } else if (collateralType === 'Propiedad') {
    collateralHeading = 'GARANTÍA INMOBILIARIA HIPOTECARIA EN PRIMER RANGO';
    collateralLegalClause = `HIPOTECA EN PRIMER RANGO sobre el inmueble ubicado en: ${collateralDescription || 'Dirección registrada'}, Matrícula de Título de Propiedad / Parcela / Solar No.: ${collateralRefNumber || 'N/A'}${collateralEstimatedValue > 0 ? `, asignado con un valor comercial de RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}, registrado conforme a la Ley 108-05.`;
  } else if (collateralType !== 'Sin Garantía') {
    collateralHeading = `GARANTÍA MOBILIARIA EN CUSTODIA (${collateralType.toUpperCase()})`;
    collateralLegalClause = `PRENDA CON CUSTODIA sobre el bien entregado en garantía: ${collateralType} - ${collateralDescription || 'Bien registrado'}${collateralRefNumber ? `, Serial/Ref No.: ${collateralRefNumber}` : ''}${collateralEstimatedValue > 0 ? `, con un valor estimado de RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}. EL ACREEDOR mantendrá la custodia del bien en sus bóvedas de seguridad hasta la cancelación total del préstamo.`;
  }

  const collateralText = collateralDescription 
    ? `${collateralType} - ${collateralDescription} ${collateralRefNumber ? `(${collateralRefNumber})` : ''}` 
    : 'Garantía Personal / Sin Garantía Específica Declarada';

  // Handlers for Refinance & Forgive
  const handleRefinance = () => {
    refinanceLoan(loan.id, {
      clientId: loan.clientId,
      clientName: loan.clientName,
      amount: refinanceAmount,
      interestRate: refinanceInterest,
      durationWeeks: refinanceWeeks,
      frequency: loan.frequency,
      loanType: loan.loanType,
      startDate: new Date().toISOString().split('T')[0],
      nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    toast.success('Préstamo refinanciado con éxito.');
    navigate('/prestamos');
  };

  const handleForgive = () => {
    if (forgiveAmount <= 0) {
      toast.error('Ingrese un monto válido a condonar');
      return;
    }
    forgiveDebt(loan.id, forgiveAmount, forgiveNote);
    toast.success('Condonación procesada exitosamente.');
    setForgiveAmount(0);
    setForgiveNote('');
  };

  // Export Document Handlers
  const handlePrintDocument = () => {
    const printElement = document.getElementById('loan-printable-document');
    if (!printElement) return;

    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Documento Legal - ${loan.clientName} - Préstamo ${formatLoanId(loan.id)}</title>
            <style>
              body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; padding: 40px; color: #111; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #222; padding-bottom: 15px; }
              .header h1 { font-size: 16pt; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
              .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; text-transform: uppercase; text-decoration: underline; }
              .content p { margin-bottom: 14px; text-align: justify; text-indent: 25px; }
              .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
              .sig-block { text-align: center; width: 45%; }
              .sig-line { border-top: 1px solid #000; margin-bottom: 5px; margin-top: 55px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
              th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
            </style>
          </head>
          <body>${printElement.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleExportPDF = async () => {
    const printElement = document.getElementById('loan-printable-document');
    if (!printElement) return;

    toast.info('Generando PDF en alta resolución...');
    try {
      const canvas = await html2canvas(printElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Documento_${docType}_${loan.clientName.replace(/\s+/g, '_')}_${formatLoanId(loan.id)}.pdf`);
      toast.success('PDF descargado exitosamente');
    } catch (err: any) {
      toast.error('Error al exportar PDF: ' + err.message);
    }
  };

  const handleExportWord = () => {
    const printElement = document.getElementById('loan-printable-document');
    if (!printElement) return;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Documento Legal</title><style>body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; padding: 20px; }</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + printElement.innerHTML + footer;
    const blob = new Blob(['\ufeff' + sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = url;
    fileDownload.download = `Documento_${docType}_${loan.clientName.replace(/\s+/g, '_')}_${formatLoanId(loan.id)}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
    toast.success('Documento exportado para Microsoft Word (.doc)');
  };

  const handleExportImage = async () => {
    const printElement = document.getElementById('loan-printable-document');
    if (!printElement) return;

    toast.info('Generando imagen...');
    try {
      const canvas = await html2canvas(printElement, { scale: 2 });
      const link = document.createElement('a');
      link.download = `Documento_${docType}_${loan.clientName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagen guardada exitosamente');
    } catch (err: any) {
      toast.error('Error al exportar imagen: ' + err.message);
    }
  };

  const handleCloudSave = async () => {
    const printElement = document.getElementById('loan-printable-document');
    if (!printElement) return;
    
    setIsUploading(true);
    toast.info('Subiendo PDF a la nube...');

    try {
      const canvas = await html2canvas(printElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const fileName = `loan_${loan.id}_${docType}_${Date.now()}.pdf`;
      
      const { data, error } = await (insforge.storage.from('client-documents').upload as any)(
        fileName, 
        pdfBlob, 
        { contentType: 'application/pdf', upsert: true }
      );

      if (error) throw error;
      
      const { data: publicData } = insforge.storage.from('client-documents').getPublicUrl(fileName);
      const docLink = publicData.publicUrl;
      setDocumentUrl(docLink);
      
      await insforge.database.from('client_documents').insert([{
        client_id: loan.clientId,
        name: `Documento ${docType} - Préstamo ${formatLoanId(loan.id)} - ${todayStr}`,
        url: docLink,
        upload_date: new Date().toISOString()
      }]);

      toast.success('Documento guardado en la nube exitosamente');
    } catch (err: any) {
      toast.error('Error al guardar en la nube: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyDocumentLink = () => {
    const docPathMap: Record<string, string> = {
      'pagare': 'pagare',
      'contrato': 'contrato',
      'estado_cuenta': 'estado',
      'carta_saldo': 'saldo',
      'recibo': 'recibo'
    };
    const path = docPathMap[docType] || 'contrato';
    const link = `${window.location.origin}/documento/${path}/${loan.id}`;
    navigator.clipboard.writeText(link);
    toast.success(`Enlace del documento (${docType}) copiado al portapapeles`);
  };

  const handleWhatsAppShare = () => {
    const docPathMap: Record<string, string> = {
      'pagare': 'pagare',
      'contrato': 'contrato',
      'estado_cuenta': 'estado',
      'carta_saldo': 'saldo',
      'recibo': 'recibo'
    };
    const path = docPathMap[docType] || 'contrato';
    const publicDocUrl = `${window.location.origin}/documento/${path}/${loan.id}`;

    let message = `Hola *${loan.clientName.split(' ')[0]}*,\n\n`;
    message += `Te compartimos tu documento oficial (*${docType.toUpperCase()}*) del Préstamo #${formatLoanId(loan.id)}:\n\n`;
    message += `*Monto:* RD$ ${loan.amount.toLocaleString()}\n`;
    message += `*Estado:* ${loan.status}\n\n`;
    message += `Puedes ver y descargar tu documento digital aquí:\n${publicDocUrl}\n\n`;
    message += `Gracias por preferir a ${company.name || 'UltraMoney'}.`;
    
    const cleanPhone = client?.phone ? client.phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* Top Page Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/prestamos')}
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-5 h-5" /> Volver a Préstamos
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                Préstamo #{formatLoanId(loan.id, loan.loanCategory, loan.loanType)}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                isLoanOverdue 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800' 
                  : (loan.status === 'Pagado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800')
              }`}>
                {isLoanOverdue ? `ATRASADO (${daysLate} DÍAS)` : loan.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Cliente: <strong className="text-slate-800 dark:text-slate-200">{loan.clientName}</strong> | Frecuencia: {loan.frequency} | Modalidad: {loan.loanType}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/pagos', { state: { loanId: loan.id } })}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <DollarSign className="w-4 h-4" /> Registrar Pago
          </button>
          <button
            onClick={() => setShowContractModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
            title="Ver Contrato Oficial y Desglose Financiero Integral"
          >
            <FileText className="w-4 h-4" /> Ver Contrato Oficial & Desglose
          </button>
          <button
            onClick={() => setShowSharingModal(true)}
            className="px-4 py-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-purple-200 dark:border-purple-800 shadow-sm"
            title="Compartir enlaces de contrato y portal de cliente por WhatsApp"
          >
            <MessageCircle className="w-4 h-4" /> Enviar Enlaces
          </button>
          <button
            onClick={() => setIsHistoricalModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800"
            title="Añadir cobro con fecha personalizada del pasado"
          >
            <Calendar className="w-4 h-4" /> + Pago Histórico
          </button>
          <button
            onClick={openEditModal}
            className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-amber-200 dark:border-amber-800"
            title="Editar préstamo"
          >
            <Edit3 className="w-4 h-4" /> Editar
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-rose-200 dark:border-rose-800"
            title="Eliminar préstamo"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
          {client && (
            <button
              onClick={() => navigate(`/clientes/${client.id}`)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
            >
              <User className="w-4 h-4" /> Perfil de Cliente
            </button>
          )}
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 gap-2 rounded-2xl shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <FileText className="w-4 h-4" /> Resumen General
        </button>
        <button
          onClick={() => setActiveTab('amortization')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'amortization' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Banknote className="w-4 h-4" /> Tabla de Amortización
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" /> Historial de Pagos ({allLoanTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'documents' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <FileText className="w-4 h-4 text-blue-400" /> Documentos & Pagaré Legal
        </button>
        <button
          onClick={() => setActiveTab('collateral')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'collateral' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Shield className="w-4 h-4" /> Garantías & Colateral
        </button>
        <button
          onClick={() => setActiveTab('refinance')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'refinance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <RefreshCw className="w-4 h-4" /> Refinanciamiento
        </button>
        <button
          onClick={() => setActiveTab('forgiveness')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'forgiveness' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Condonación de Deuda
        </button>
      </div>

      {/* TAB CONTENT 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-2">
                {loan.loanType?.includes('Financiamiento') ? 'Capital Financiado' : 'Capital Original Prestado'}
              </p>
              <p className="text-4xl md:text-5xl font-black tracking-tight">RD$ {(loan.amount || 0).toLocaleString()}</p>
              <div className="mt-6 pt-6 border-t border-indigo-800/60 flex justify-between items-center text-xs text-indigo-200">
                <span>Total a Pagar Pactado: <strong>RD$ {(loan.totalToPay || loan.amount).toLocaleString()}</strong></span>
                <span>Tasa Interés: <strong>{loan.interestRate}%</strong></span>
              </div>
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full -mr-16 -mt-16"></div>
            </div>

            {/* If Equipment Financing (Con/Sin Inicial), render breakdown card */}
            {(loan.itemPrice || loan.loanType?.includes('Financiamiento')) ? (
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Desglose de Financiamiento de Equipo</p>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {loan.downPayment && loan.downPayment > 0 ? 'Con Inicial' : 'Sin Inicial (0 Inicial)'}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-emerald-400">
                    RD$ {(loan.itemPrice || loan.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">Precio Total de Contado del Artículo / Bien</p>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-800/60 grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/50">
                    <span className="block text-emerald-300 text-[10px] uppercase font-bold">Inicial Recibida</span>
                    <strong className="text-sm font-extrabold text-white">
                      RD$ {(loan.downPayment || 0).toLocaleString()}
                    </strong>
                    {loan.downPaymentMode && <span className="block text-[10px] text-emerald-400 mt-0.5">Vía {loan.downPaymentMode}</span>}
                  </div>
                  <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/50">
                    <span className="block text-emerald-300 text-[10px] uppercase font-bold">Monto Neto Financiado</span>
                    <strong className="text-sm font-extrabold text-emerald-400">
                      RD$ {(loan.financedAmount || loan.amount).toLocaleString()}
                    </strong>
                    <span className="block text-[10px] text-slate-300 mt-0.5">En cuotas {loan.frequency?.toLowerCase()}s</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Balance Restante por Cobrar</p>
                  <p className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-1 rounded-full uppercase">
                    {Math.round((((loan.totalToPay || loan.amount) - loan.remainingBalance) / (loan.totalToPay || loan.amount)) * 100)}% Amortizado
                  </p>
                </div>
                <p className="text-4xl md:text-5xl font-black text-rose-600 dark:text-rose-400 tracking-tight">RD$ {(loan.remainingBalance || 0).toLocaleString()}</p>
                
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mt-6 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, Math.max(0, (((loan.totalToPay || loan.amount) - loan.remainingBalance) / (loan.totalToPay || loan.amount)) * 100))}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Tasa de Interés</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{loan.interestRate}%</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Duración / Plazo</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{loan.loanType === 'Rédito' ? 'Abierta' : `${loan.durationWeeks || 0} cuotas`}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Frecuencia de Pago</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{loan.frequency}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Próximo Pago</span>
              <span className={`text-xl font-bold ${isLoanOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{loan.nextPaymentDate || 'N/A'}</span>
            </div>
          </div>

          {/* Garantía Vinculada Banner */}
          <div className="bg-amber-50/90 dark:bg-amber-950/40 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-2xl"><Shield className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Garantía Declarada: <strong className="uppercase">{collateralType}</strong></h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{collateralDescription || 'Garantía Personal / Sin detalles adicionales'}</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold bg-amber-100 dark:bg-amber-900/60 px-4 py-2 rounded-xl text-amber-900 dark:text-amber-200">
              Ref: {collateralRefNumber || 'N/A'}
            </span>
          </div>

          {/* Recent Payments Preview Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" /> Últimos Pagos Registrados en este Préstamo
              </h4>
              <button 
                onClick={() => setActiveTab('payments')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Ver todo el historial ({allLoanTransactions.length}) <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {allLoanTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {allLoanTransactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{tx.description || 'Abono a Préstamo'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Recibo #{formatReceiptId(tx.id)} • {new Date(tx.date).toLocaleDateString('es-DO')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">RD$ {(tx.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{tx.paymentMethod || 'Efectivo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">No hay pagos registrados aún para este préstamo.</p>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: AMORTIZATION */}
      {activeTab === 'amortization' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Tabla de Amortización de Cuotas</h3>
            <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir Tabla
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4"># Cuota</th>
                  <th className="px-6 py-4">Fecha Programada</th>
                  <th className="px-6 py-4 text-right text-emerald-600">Capital</th>
                  <th className="px-6 py-4 text-right text-rose-500">Interés</th>
                  <th className="px-6 py-4 text-right">Cuota Total</th>
                  <th className="px-6 py-4 text-right">Balance Restante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {getAmortizationTable().map(row => (
                  <tr key={row.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-500">#{row.period}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{row.date}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">RD$ {row.principal.toLocaleString('es-DO', { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-medium text-rose-500">RD$ {row.interest.toLocaleString('es-DO', { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">RD$ {row.amount.toLocaleString('es-DO', { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500">RD$ {row.balance.toLocaleString('es-DO', { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: HISTORIAL DE PAGOS (TRANSACTIONS) */}
      {activeTab === 'payments' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Metrics Summary Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Total Cobrado en Préstamo</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">RD$ {totalCollectedOnLoan.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-2xl">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Pagos Realizados</p>
                <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{allLoanTransactions.length} Transacciones</p>
              </div>
              <div className="p-3 bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded-2xl">
                <Banknote className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-3xl border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Balance Restante</p>
                <p className="text-3xl font-black text-rose-700 dark:text-rose-400 mt-1">RD$ {(loan.remainingBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" /> Registro Completo de Cobros y Recibos
              </h3>
              <button 
                onClick={() => navigate('/pagos', { state: { loanId: loan.id } })}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" /> Registrar Nuevo Pago
              </button>
            </div>

            {allLoanTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">No. Recibo</th>
                      <th className="px-6 py-4">Fecha y Hora</th>
                      <th className="px-6 py-4">Concepto / Descripción</th>
                      <th className="px-6 py-4 text-center">Método de Pago</th>
                      <th className="px-6 py-4 text-right">Monto Pagado</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allLoanTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatReceiptId(tx.id)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          {new Date(tx.date).toLocaleString('es-DO')}
                        </td>
                        <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-bold">
                          {tx.description || 'Abono a Préstamo'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase">
                            {tx.paymentMethod || 'Efectivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          RD$ {(tx.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => navigate(`/recibo/${tx.id}`)}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg font-bold hover:bg-indigo-100 text-[11px] inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver Recibo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-base">No hay pagos registrados aún</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Cuando registres cobros o abonos a este préstamo, aparecerán detallados en esta lista con su número de recibo oficial.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Document Type Selector & Export Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Documento Seleccionado:</span>
              </div>

              {/* Action Toolbar Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handlePrintDocument} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button onClick={handleExportPDF} className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-md flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button onClick={handleExportWord} className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" /> Word (.doc)
                </button>
                <button onClick={handleExportImage} className="px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 shadow-md flex items-center gap-1.5">
                  <FileImage className="w-4 h-4" /> Imagen
                </button>
                <button onClick={handleCloudSave} disabled={isUploading} className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5 disabled:opacity-50">
                  <CloudUpload className="w-4 h-4" /> {isUploading ? 'Guardando...' : 'Nube'}
                </button>
                <button onClick={handleWhatsAppShare} className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button onClick={handleCopyDocumentLink} className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-md flex items-center gap-1.5" title="Copiar enlace web único de este documento">
                  <Copy className="w-4 h-4" /> Copiar Link
                </button>
              </div>
            </div>

            {/* Document Sub-tabs */}
            <div className="flex border-t border-slate-100 dark:border-slate-800 pt-4 gap-2 overflow-x-auto">
              <button onClick={() => setDocType('pagare')} className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${docType === 'pagare' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}>Pagaré Notarial</button>
              <button onClick={() => setDocType('contrato')} className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${docType === 'contrato' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}>Contrato de Préstamo</button>
              <button onClick={() => setDocType('estado_cuenta')} className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${docType === 'estado_cuenta' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}>Estado de Cuenta</button>
              <button onClick={() => setDocType('recibo')} className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${docType === 'recibo' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}>Recibo de Pago</button>
              <button onClick={() => setDocType('carta_saldo')} className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${docType === 'carta_saldo' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}>Carta de Saldo</button>
              <button onClick={() => setDocType('carta_cobro')} className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${docType === 'carta_cobro' ? (isLoanOverdue ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white') : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'}`}>{isLoanOverdue ? 'Carta de Cobro (Mora)' : 'Notificación (Al Día)'}</button>
            </div>
          </div>

          {/* Printable Document Paper */}
          <div className="p-2 sm:p-6 md:p-10 bg-slate-200 dark:bg-slate-950 rounded-3xl shadow-inner border border-slate-300 dark:border-slate-800 flex justify-center overflow-x-auto">
            <div id="loan-printable-document" className="bg-white text-slate-900 p-5 sm:p-10 md:p-16 rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl font-serif text-sm leading-relaxed min-h-[850px] overflow-x-auto">
              
              {/* Document Header */}
              <div className="header text-center border-b-2 border-slate-900 pb-5 mb-8">
                {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-16 mx-auto mb-3 object-contain font-sans" />}
                <h1 className="text-2xl font-black uppercase tracking-wider font-sans text-slate-900">{company.name}</h1>
                {company.rnc && <p className="text-xs text-slate-600 font-sans font-bold">RNC No.: {company.rnc}</p>}
                <p className="text-xs text-slate-600 font-sans">{company.address} • Teléfono: {company.phone}</p>
              </div>

              {/* 1. PAGARÉ NOTARIAL */}
              {docType === 'pagare' && (
                <div>
                  <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline font-sans text-slate-900">
                    PAGARÉ NOTARIAL A LA ORDEN Y CONSTITUCIÓN DE {collateralHeading}
                  </h2>
                  <div className="text-right text-xs font-sans font-bold text-indigo-950 mb-4">
                    Préstamo Ref. No.: <span className="font-mono">{formatLoanId(loan.id)}</span>
                  </div>
                  
                  <div className="content space-y-4 text-justify leading-relaxed">
                    <p>
                      POR ANTE MÍ, Notario Público de los del Número para el Distrito Nacional, República Dominicana, matrícula No. ____________, COMPARECE libre y voluntariamente el señor(a) <strong>{loan.clientName}</strong>, Cédula No. <strong>{client?.cedula || 'N/A'}</strong>, domiciliado(a) en <strong>{client?.address || 'República Dominicana'}</strong>, denominado <strong>EL DEUDOR</strong>.
                    </p>
                    <p>
                      <strong>PRIMERO (DECLARACIÓN DE DEUDA):</strong> EL DEUDOR reconoce que DEBE y PAGARÁ incondicionalmente a la orden de <strong>{company.name}</strong>, RNC No. <strong>{company.rnc || 'N/A'}</strong>, la suma total de <strong>RD$ {(loan.totalToPay || loan.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> pesos dominicanos.
                    </p>
                    <p>
                      <strong>SEGUNDO (INTERESES Y PAGO):</strong> Generará una tasa de interés del <strong>{loan.interestRate}%</strong> bajo la modalidad <strong>{loan.frequency}</strong> ({loan.loanType}).
                    </p>
                    <p>
                      <strong>TERCERO (GARANTÍA):</strong> {collateralLegalClause}
                    </p>
                    <p>
                      <strong>CUARTO (MORA):</strong> La falta de pago de una cuota producirá el vencimiento anticipado de pleno derecho con recargo por mora del 5% mensual.
                    </p>
                    <p className="pt-2">
                      Hecho y firmado en Santo Domingo, República Dominicana, a los <strong>{todayStr}</strong>.
                    </p>
                  </div>

                  <div className="signatures flex justify-between mt-16 pt-8 font-sans border-t border-slate-300">
                    <div className="sig-block text-center w-5/12">
                      <div className="sig-line border-t border-slate-900 pt-2 font-bold">{loan.clientName}</div>
                      <div className="text-xs text-slate-600">EL DEUDOR (FIRMA Y HUELLA)</div>
                    </div>
                    <div className="sig-block text-center w-5/12">
                      <div className="sig-line border-t border-slate-900 pt-2 font-bold">{company.name}</div>
                      <div className="text-xs text-slate-600">POR EL ACREEDOR</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CONTRATO DE PRÉSTAMO */}
              {docType === 'contrato' && (
                <div>
                  <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline font-sans text-slate-900">
                    CONTRATO DE PRÉSTAMO Y FINANCIAMIENTO CON {collateralHeading}
                  </h2>
                  <div className="text-right text-xs font-sans font-bold text-indigo-950 mb-4">
                    Préstamo Ref. No.: <span className="font-mono">{formatLoanId(loan.id)}</span>
                  </div>

                  <div className="content space-y-4 text-justify leading-relaxed">
                    <p>
                      ENTRE: <strong>{company.name}</strong> (EL ACREEDOR), RNC <strong>{company.rnc || 'N/A'}</strong>; y el señor(a) <strong>{loan.clientName}</strong> (EL DEUDOR), Cédula <strong>{client?.cedula || 'N/A'}</strong>.
                    </p>
                    <p>
                      <strong>ARTÍCULO 1:</strong> EL ACREEDOR entrega en préstamo a EL DEUDOR la suma de <strong>RD$ {(loan.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> pesos.
                    </p>
                    <p>
                      <strong>ARTÍCULO 2:</strong> El Préstamo No. <strong>#{formatLoanId(loan.id)}</strong> devengará el {loan.interestRate}% de interés con modalidad {loan.frequency}. Total a reembolsar: <strong>RD$ {(loan.totalToPay || loan.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>.
                    </p>
                    <p>
                      <strong>ARTÍCULO 3 (GARANTÍA):</strong> {collateralLegalClause}
                    </p>
                    <p className="pt-2">
                      Hecho y firmado en Santo Domingo, R.D., a los <strong>{todayStr}</strong>.
                    </p>
                  </div>

                  <div className="signatures flex justify-between mt-20 pt-8 font-sans border-t border-slate-300">
                    <div className="sig-block text-center w-5/12">
                      <div className="sig-line border-t border-slate-900 pt-2 font-bold">{loan.clientName}</div>
                      <div className="text-xs text-slate-600">EL DEUDOR</div>
                    </div>
                    <div className="sig-block text-center w-5/12">
                      <div className="sig-line border-t border-slate-900 pt-2 font-bold">{company.name}</div>
                      <div className="text-xs text-slate-600">EL ACREEDOR</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ESTADO DE CUENTA */}
              {docType === 'estado_cuenta' && (
                <div>
                  <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline font-sans text-slate-900">
                    ESTADO DE CUENTA FINANCIERO OFICIAL
                  </h2>
                  <div className="mb-6 font-sans text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                    <div><strong>Cliente:</strong> {loan.clientName}</div>
                    <div><strong>Cédula:</strong> {client?.cedula || 'N/A'}</div>
                    <div><strong>Préstamo Ref:</strong> #{formatLoanId(loan.id)}</div>
                    <div><strong>Fecha Emisión:</strong> {todayStr}</div>
                  </div>

                  <table className="w-full border-collapse border border-slate-300 font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border p-2">Monto Desembolsado</th>
                        <th className="border p-2">Frecuencia</th>
                        <th className="border p-2">Tasa</th>
                        <th className="border p-2">Total Deuda</th>
                        <th className="border p-2">Balance Restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center font-medium">
                        <td className="border p-2">RD$ {(loan.amount || 0).toLocaleString()}</td>
                        <td className="border p-2">{loan.frequency}</td>
                        <td className="border p-2">{loan.interestRate}%</td>
                        <td className="border p-2 font-bold">RD$ {(loan.totalToPay || loan.amount).toLocaleString()}</td>
                        <td className="border p-2 font-black text-indigo-700">RD$ {(loan.remainingBalance || 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. RECIBO DE PAGO */}
              {docType === 'recibo' && (
                <div>
                  <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline font-sans text-slate-900">
                    COMPROBANTE OFICIAL DE RECIBO DE PAGO
                  </h2>
                  <div className="content space-y-4 text-justify font-sans text-xs">
                    <p>HEMOS RECIBIDO DE: <strong>{loan.clientName}</strong>, por concepto de abono al Préstamo Ref. #{formatLoanId(loan.id)}.</p>
                    <div className="p-4 bg-slate-50 border rounded-xl">
                      <p><strong>Balance Restante Pendiente:</strong> RD$ {(loan.remainingBalance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CARTA DE SALDO */}
              {docType === 'carta_saldo' && (
                <div>
                  <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline font-sans text-slate-900">
                    CARTA DE SALDO Y CANCELACIÓN DEFINITIVA DE GRAVAMEN
                  </h2>
                  <div className="content space-y-4 text-justify">
                    <p>A QUIEN PUEDA INTERESAR:</p>
                    <p>
                      Certificamos que el Sr.(a) <strong>{loan.clientName}</strong>, Cédula No. <strong>{client?.cedula || 'N/A'}</strong>, ha saldado en su totalidad el Préstamo No. <strong>#{formatLoanId(loan.id)}</strong> por RD$ {(loan.amount || 0).toLocaleString()}.
                    </p>
                    <p>
                      Garantía liberada: <strong>{collateralText}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* 6. CARTA DE COBRO / MORA */}
              {docType === 'carta_cobro' && (
                <div>
                  {isLoanOverdue ? (
                    <div>
                      <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline font-sans text-rose-700">
                        NOTIFICACIÓN FORMAL DE INTIMACIÓN DE PAGO Y COBRO DE MORA
                      </h2>
                      <div className="content space-y-4 text-justify">
                        <p>Le informamos que su Préstamo No. <strong>#{formatLoanId(loan.id)}</strong> se encuentra en <strong>ATRASO Y MORA ({daysLate} días)</strong>.</p>
                        <div className="p-4 border border-rose-200 bg-rose-50 rounded-xl font-sans text-xs space-y-1">
                          <p className="flex justify-between"><span>Cuota Pendiente:</span> <strong>RD$ {installmentAmount.toLocaleString()}</strong></p>
                          <p className="flex justify-between"><span>Recargo por Mora (5%):</span> <strong>RD$ {lateFeeAmount.toLocaleString()}</strong></p>
                          <p className="flex justify-between border-t border-rose-200 pt-1 font-bold text-rose-800"><span>TOTAL A REGULARIZAR:</span> <strong>RD$ {(installmentAmount + lateFeeAmount).toLocaleString()}</strong></p>
                        </div>
                        <p>Garantía en riesgo de ejecución: <strong>{collateralText}</strong>.</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline font-sans text-emerald-700">
                        NOTIFICACIÓN DE ESTADO AL DÍA Y RECORDATORIO PREVENTIVO
                      </h2>
                      <div className="content space-y-4 text-justify">
                        <p>Le certificamos que su Préstamo No. <strong>#{formatLoanId(loan.id)}</strong> se encuentra <strong>TOTALMENTE AL DÍA (0 DÍAS DE MORA)</strong>.</p>
                        <p>Próximo vencimiento: <strong>{loan.nextPaymentDate || 'Al día'}</strong> — Monto Cuota: <strong>RD$ {installmentAmount.toLocaleString()}</strong>.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: COLLATERAL */}
      {activeTab === 'collateral' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-2xl"><Shield className="w-8 h-8" /></div>
            <div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">Bóveda de Garantías Legales</h3>
              <p className="text-xs text-slate-500">Inspección de bienes registrados como respaldo del crédito.</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-slate-400 font-bold uppercase block mb-1">Tipo de Bien</span><strong className="text-sm font-extrabold text-slate-800 dark:text-white uppercase">{collateralType}</strong></div>
              <div><span className="text-slate-400 font-bold uppercase block mb-1">No. Matrícula / Registro</span><strong className="font-mono text-sm bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-600">{collateralRefNumber || 'N/A'}</strong></div>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-xs block mb-1">Descripción del Bien</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">{collateralDescription || 'Sin descripción detallada'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: REFINANCE */}
      {activeTab === 'refinance' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-black text-2xl text-slate-900 dark:text-white">Refinanciamiento del Préstamo</h3>
            <p className="text-xs text-slate-500">Reestructura las condiciones actuales incrementando capital o extendiendo el plazo.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Monto a Refinanciar (RD$)</label>
              <input 
                type="number" 
                value={refinanceAmount === 0 ? '' : refinanceAmount} 
                onFocus={(e) => e.target.select()}
                onChange={e => setRefinanceAmount(e.target.value === '' ? 0 : Number(e.target.value))} 
                placeholder="0"
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" 
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Duración (Cuotas)</label>
              <input 
                type="number" 
                value={refinanceWeeks === 0 ? '' : refinanceWeeks} 
                onFocus={(e) => e.target.select()}
                onChange={e => setRefinanceWeeks(e.target.value === '' ? 0 : Number(e.target.value))} 
                placeholder="0"
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" 
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tasa de Interés (%)</label>
              <input 
                type="number" 
                value={refinanceInterest === 0 ? '' : refinanceInterest} 
                onFocus={(e) => e.target.select()}
                onChange={e => setRefinanceInterest(e.target.value === '' ? 0 : Number(e.target.value))} 
                placeholder="0"
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" 
              />
            </div>
            <button onClick={handleRefinance} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              Procesar Refinanciamiento
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: FORGIVENESS */}
      {activeTab === 'forgiveness' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
            <h3 className="font-black text-2xl text-slate-900 dark:text-white">Condonación y Ajuste de Deuda</h3>
            <p className="text-xs text-slate-500">Aplica un descuento especial o perdona un monto del balance adeudado.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Monto a Condonar (RD$)</label>
              <input 
                type="number" 
                value={forgiveAmount === 0 ? '' : forgiveAmount} 
                onFocus={(e) => e.target.select()}
                onChange={e => setForgiveAmount(e.target.value === '' ? 0 : Number(e.target.value))} 
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" 
                placeholder="Monto a descontar" 
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Motivo / Razón Legal de Condonación</label>
              <textarea value={forgiveNote} onChange={e => setForgiveNote(e.target.value)} rows={3} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-xs" placeholder="Escriba la justificación" />
            </div>
            <button onClick={handleForgive} className="w-full py-3.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 shadow-lg shadow-amber-500/20">
              Aplicar Condonación
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT LOAN (EDICIÓN COMPLETA) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" /> Edición Completa del Préstamo #{formatLoanId(loan.id)}
                </h3>
                <p className="text-xs text-slate-500">Puedes modificar cualquier condición o parámetro del préstamo.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monto Prestado / Capital (RD$)</label>
                  <input 
                    type="number" 
                    value={editAmount === 0 ? '' : editAmount} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditAmount(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Modalidad / Tipo de Préstamo</label>
                  <select 
                    value={editLoanType} 
                    onChange={e => setEditLoanType(e.target.value)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  >
                    <option value="Amortizado (Cuota Fija)">Amortizado (Cuota Fija)</option>
                    <option value="Amortizado (Capital Fijo)">Amortizado (Capital Fijo)</option>
                    <option value="Rédito (Solo Interés)">Rédito (Solo Interés / Pagaré Abierto)</option>
                    <option value="Financiamiento de Equipo (Con/Sin Inicial)">Financiamiento de Equipo / Bienes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tasa de Interés (%)</label>
                  <input 
                    type="number" 
                    value={editInterestRate === 0 ? '' : editInterestRate} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditInterestRate(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Frecuencia</label>
                  <select 
                    value={editFrequency} 
                    onChange={e => setEditFrequency(e.target.value)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Diario">Diario</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plazo (No. Cuotas)</label>
                  <input 
                    type="number" 
                    value={editInstallments === 0 ? '' : editInstallments} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditInstallments(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Balance Restante por Cobrar (RD$)</label>
                  <input 
                    type="number" 
                    value={editRemainingBalance === 0 ? '' : editRemainingBalance} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditRemainingBalance(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className="w-full p-3 border border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monto Total a Pagar (RD$)</label>
                  <input 
                    type="number" 
                    value={editTotalToPay === 0 ? '' : editTotalToPay} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditTotalToPay(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha de Inicio / Desembolso</label>
                  <input 
                    type="date" 
                    value={editStartDate} 
                    onChange={e => setEditStartDate(e.target.value)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha Próximo Cobro</label>
                  <input 
                    type="date" 
                    value={editNextPaymentDate} 
                    onChange={e => setEditNextPaymentDate(e.target.value)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                  <select 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Al Día">Al Día</option>
                    <option value="Atrasado">Atrasado</option>
                    <option value="Vencido">Vencido</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>
              </div>

              {/* FINANCIAMIENTO / ARTÍCULO */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Datos de Financiamiento de Equipo (Opcional)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Precio Artículo</label>
                    <input 
                      type="number" 
                      value={editItemPrice === 0 ? '' : editItemPrice} 
                      onFocus={e => e.target.select()}
                      onChange={e => setEditItemPrice(e.target.value === '' ? 0 : Number(e.target.value))} 
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Inicial Recibida</label>
                    <input 
                      type="number" 
                      value={editDownPayment === 0 ? '' : editDownPayment} 
                      onFocus={e => e.target.select()}
                      onChange={e => setEditDownPayment(e.target.value === '' ? 0 : Number(e.target.value))} 
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vía de Inicial</label>
                    <select 
                      value={editDownPaymentMode} 
                      onChange={e => setEditDownPaymentMode(e.target.value)} 
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 font-medium"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* GARANTÍAS */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-3">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider">Datos de Garantía Declarada</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo Garantía</label>
                    <select 
                      value={editCollateralType} 
                      onChange={e => setEditCollateralType(e.target.value)} 
                      className="w-full p-2.5 border border-amber-200 dark:border-amber-800 rounded-xl dark:bg-slate-900 font-medium"
                    >
                      <option value="Sin Garantía">Sin Garantía</option>
                      <option value="Teléfono / Celular">Teléfono / Celular</option>
                      <option value="Tarjeta de Crédito / Débito">Tarjeta de Crédito / Débito</option>
                      <option value="Vehículo">Vehículo</option>
                      <option value="Propiedad">Propiedad</option>
                      <option value="Electrodoméstico">Electrodoméstico</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción / Marca / Modelo</label>
                    <input 
                      type="text" 
                      value={editCollateralDesc} 
                      onChange={e => setEditCollateralDesc(e.target.value)} 
                      placeholder="Ej: iPhone 15 Pro Max 256GB"
                      className="w-full p-2.5 border border-amber-200 dark:border-amber-800 rounded-xl dark:bg-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IMEI / Serial / Matrícula</label>
                    <input 
                      type="text" 
                      value={editCollateralRef} 
                      onChange={e => setEditCollateralRef(e.target.value)} 
                      placeholder="Ej: IMEI 35489..."
                      className="w-full p-2.5 border border-amber-200 dark:border-amber-800 rounded-xl dark:bg-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notas / Observaciones del Préstamo</label>
                <textarea 
                  value={editNote} 
                  onChange={e => setEditNote(e.target.value)} 
                  rows={2} 
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-xs" 
                  placeholder="Observaciones generales sobre el crédito..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar Cambios Completos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HISTORICAL / PAST MANUAL PAYMENT */}
      {isHistoricalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Registrar Pago Histórico (Manual)
              </h3>
              <button onClick={() => setIsHistoricalModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Permite ingresar pagos o cobros recibidos en fechas pasadas para sincronizar historiales en Excel o libretas físicas.
            </p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monto Cobrado (RD$)</label>
                  <input 
                    type="number" 
                    value={histAmount === 0 ? '' : histAmount} 
                    onFocus={e => e.target.select()}
                    onChange={e => setHistAmount(e.target.value === '' ? 0 : Number(e.target.value))} 
                    placeholder="Monto pagado"
                    className="w-full p-3 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl font-bold text-base text-indigo-900 dark:text-indigo-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha del Pago Pasado</label>
                  <input 
                    type="date" 
                    value={histDate} 
                    onChange={e => setHistDate(e.target.value)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
                  <select 
                    value={histMethod} 
                    onChange={e => setHistMethod(e.target.value as any)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Depósito">Depósito</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Pago</label>
                  <select 
                    value={histType} 
                    onChange={e => setHistType(e.target.value as any)} 
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold"
                  >
                    <option value="Mixto">Cuota Completa / Mixto</option>
                    <option value="Interes">Solo Interés</option>
                    <option value="Capital">Abono Directo a Capital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. Recibo / Comprobante / Referencia (Opcional)</label>
                <input 
                  type="text" 
                  value={histRef} 
                  onChange={e => setHistRef(e.target.value)} 
                  placeholder="Ej: REC-2024-0042 o Transf. 98124"
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notas u Observaciones</label>
                <input 
                  type="text" 
                  value={histNotes} 
                  onChange={e => setHistNotes(e.target.value)} 
                  placeholder="Ej: Migrado de historial de Excel"
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsHistoricalModalOpen(false)} 
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddHistoricalPayment} 
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" /> Guardar Pago Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE LOAN CONFIRMATION */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">¿Eliminar este préstamo?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Está a punto de borrar el préstamo <strong>#{formatLoanId(loan.id)}</strong> de <strong>{loan.clientName}</strong>. Esta acción eliminará también las transacciones asociadas.
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-left text-xs text-rose-800 dark:text-rose-300">
              <span className="font-bold block">Resumen del registro:</span>
              <span>• Capital: RD$ {loan.amount.toLocaleString()}</span><br />
              <span>• Balance Restante: RD$ {(loan.remainingBalance || 0).toLocaleString()}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteLoan} 
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSharingModal && loan && (
        <LoanCreatedSharingModal
          loan={loan}
          client={client}
          companyName={companySettings?.companyName || companySettings?.name}
          onClose={() => setShowSharingModal(false)}
        />
      )}

      {showContractModal && loan && (
        <LoanContractModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          loan={loan}
          client={client}
        />
      )}

    </div>
  );
};
