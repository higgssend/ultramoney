import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Banknote, Shield, AlertTriangle, RefreshCw, 
  DollarSign, Printer, Download, FileCode, FileImage, CloudUpload, 
  MessageCircle, CreditCard, CheckCircle, Clock, Calendar, ChevronRight, User, Eye
} from 'lucide-react';
import { useLoans, useClients, useSettings } from '../context/StoreContext';
import { Loan, Client, formatLoanId, formatReceiptId, Transaction } from '../types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { insforge } from '../lib/insforge';

export const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'summary';

  const { loans, refinanceLoan, forgiveDebt } = useLoans();
  const { clients } = useClients();
  const { companySettings } = useSettings();

  const loan = loans.find(l => l.id === id);
  const client = clients.find(c => c?.id === loan?.clientId);

  const [activeTab, setActiveTab] = useState<'summary' | 'amortization' | 'collateral' | 'documents' | 'refinance' | 'forgiveness'>(initialTab);
  const [docType, setDocType] = useState<'pagare' | 'contrato' | 'estado_cuenta' | 'carta_saldo' | 'carta_cobro' | 'recibo'>('pagare');

  // Refinance state
  const [refinanceAmount, setRefinanceAmount] = useState<number>(0);
  const [refinanceWeeks, setRefinanceWeeks] = useState<number>(12);
  const [refinanceInterest, setRefinanceInterest] = useState<number>(10);

  // Forgiveness state
  const [forgiveAmount, setForgiveAmount] = useState<number>(0);
  const [forgiveNote, setForgiveNote] = useState<string>('');

  // Loan Transactions
  const [loanTransactions, setLoanTransactions] = useState<Transaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (loan) {
      setRefinanceAmount(loan.amount);
      const fetchTransactions = async () => {
        try {
          const { data } = await insforge.database
            .from('transactions')
            .select('*')
            .eq('referenceid', loan.id);
          
          if (data && data.length > 0) {
            setLoanTransactions(data as any);
          } else {
            const { data: data2 } = await insforge.database
              .from('transactions')
              .select('*')
              .eq('reference_id', loan.id);
            if (data2) setLoanTransactions(data2 as any);
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
    const totalPeriods = loan.loanType === 'Rédito' ? 12 : (loan.durationWeeks || 1);
    const balance = loan.remainingBalance;
    const rate = (loan.interestRate || 0) / 100;

    let rows = [];
    let currentBalance = loan.amount;
    const isRedito = loan.loanType === 'Rédito';

    for (let i = 1; i <= totalPeriods; i++) {
      let interestAmount = 0;
      let principalAmount = 0;
      let totalInstallment = 0;

      if (isRedito) {
        interestAmount = loan.amount * rate;
        principalAmount = 0;
        totalInstallment = interestAmount;
      } else {
        totalInstallment = loan.totalToPay / totalPeriods;
        interestAmount = (loan.amount * rate) / totalPeriods;
        principalAmount = totalInstallment - interestAmount;
        currentBalance = Math.max(0, currentBalance - principalAmount);
      }

      const pDate = new Date(loan.startDate || Date.now());
      if (loan.frequency === 'Semanal') pDate.setDate(pDate.getDate() + (i * 7));
      else if (loan.frequency === 'Quincenal') pDate.setDate(pDate.getDate() + (i * 15));
      else if (loan.frequency === 'Diario') pDate.setDate(pDate.getDate() + i);
      else pDate.setMonth(pDate.getMonth() + i);

      rows.push({
        period: i,
        date: pDate.toISOString().split('T')[0],
        principal: principalAmount,
        interest: interestAmount,
        amount: totalInstallment,
        balance: currentBalance
      });
    }
    return rows;
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

  if (collateralType === 'Vehículo') {
    collateralHeading = 'GARANTÍA MOBILIARIA VEHICULAR (PRENDA SIN DESPOSESIÓN)';
    collateralLegalClause = `PRENDA SIN DESPOSESIÓN sobre el vehículo motorizado descrito a continuación: Marca/Modelo/Año: ${collateralDescription || 'Declarado en expediente'}, Matrícula / Placa / Chasis No.: ${collateralRefNumber || 'N/A'}${collateralEstimatedValue > 0 ? `, por un valor estimado de RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}. EL DEUDOR autoriza expresamente la inscripción del gravamen en la DGII.`;
  } else if (collateralType === 'Propiedad') {
    collateralHeading = 'GARANTÍA INMOBILIARIA HIPOTECARIA EN PRIMER RANGO';
    collateralLegalClause = `HIPOTECA EN PRIMER RANGO sobre el inmueble ubicado en: ${collateralDescription || 'Dirección registrada'}, Matrícula de Título de Propiedad / Parcela / Solar No.: ${collateralRefNumber || 'N/A'}${collateralEstimatedValue > 0 ? `, asignado con un valor comercial de RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}, registrado conforme a la Ley 108-05.`;
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

  const handleWhatsAppShare = () => {
    let message = `Hola ${loan.clientName.split(' ')[0]},\n\n`;
    message += `Te enviamos el documento ${docType} oficial de tu Préstamo #${formatLoanId(loan.id)}.\n`;
    if (documentUrl) {
      message += `Puedes ver tu PDF oficial aquí:\n${documentUrl}\n\n`;
    }
    message += `Gracias por confiar en ${company.name || 'nosotros'}.`;
    
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
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'documents' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <FileText className="w-4 h-4 text-emerald-400" /> Documentos & Pagaré Legal
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
              <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-2">Capital Original Prestado</p>
              <p className="text-4xl md:text-5xl font-black tracking-tight">RD$ {(loan.amount || 0).toLocaleString()}</p>
              <div className="mt-6 pt-6 border-t border-indigo-800/60 flex justify-between items-center text-xs text-indigo-200">
                <span>Total a Pagar Pactado: <strong>RD$ {(loan.totalToPay || loan.amount).toLocaleString()}</strong></span>
                <span>Tasa Interés: <strong>{loan.interestRate}%</strong></span>
              </div>
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full -mr-16 -mt-16"></div>
            </div>

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

      {/* TAB CONTENT 3: DOCUMENTS */}
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
                <button onClick={handleWhatsAppShare} className="px-3.5 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 shadow-md flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
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
          <div className="p-6 md:p-10 bg-slate-200 dark:bg-slate-950 rounded-3xl shadow-inner border border-slate-300 dark:border-slate-800 flex justify-center">
            <div id="loan-printable-document" className="bg-white text-slate-900 p-12 md:p-16 rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl font-serif text-sm leading-relaxed min-h-[850px]">
              
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

      {/* TAB CONTENT 4: COLLATERAL */}
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

      {/* TAB CONTENT 5: REFINANCE */}
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
              <input type="number" value={refinanceAmount} onChange={e => setRefinanceAmount(Number(e.target.value))} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Duración (Cuotas)</label>
              <input type="number" value={refinanceWeeks} onChange={e => setRefinanceWeeks(Number(e.target.value))} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tasa de Interés (%)</label>
              <input type="number" value={refinanceInterest} onChange={e => setRefinanceInterest(Number(e.target.value))} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" />
            </div>
            <button onClick={handleRefinance} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              Procesar Refinanciamiento
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: FORGIVENESS */}
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
              <input type="number" value={forgiveAmount} onChange={e => setForgiveAmount(Number(e.target.value))} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" placeholder="Monto a descontar" />
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

    </div>
  );
};
