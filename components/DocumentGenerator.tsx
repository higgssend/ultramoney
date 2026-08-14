import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, CheckCircle, X, Shield, FileCheck, AlertCircle, CloudUpload, MessageCircle, CreditCard, ChevronDown, Car, Home, Package } from 'lucide-react';
import { Loan, Client, CompanySettings, Transaction, formatLoanId, formatReceiptId } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { insforge } from '../lib/insforge';
import { useToast } from '../context/ToastContext';

export type DocumentType = 'pagare' | 'contrato' | 'estado_cuenta' | 'carta_saldo' | 'carta_cobro' | 'recibo';

interface DocumentGeneratorProps {
  loan?: Loan;
  clientLoans?: Loan[];
  client: Client;
  company: CompanySettings;
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  defaultDocType?: DocumentType;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  loan,
  clientLoans = [],
  client,
  company,
  transaction,
  isOpen,
  onClose,
  defaultDocType = 'pagare'
}) => {
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  // Active Loan Selection
  const allLoans = (clientLoans && clientLoans.length > 0) 
    ? clientLoans 
    : (loan ? [loan] : []);

  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    loan?.id || (allLoans.length > 0 ? allLoans[0].id : '')
  );

  const currentLoan = allLoans.find(l => l.id === selectedLoanId) || allLoans[0] || loan;

  // Transactions associated with current loan
  const [loanTransactions, setLoanTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (currentLoan?.id) {
      const fetchTransactionsForLoan = async () => {
        try {
          const { data } = await insforge.database
            .from('transactions')
            .select('*')
            .eq('referenceid', currentLoan.id);
          
          if (data && data.length > 0) {
            setLoanTransactions(data as unknown as Transaction[]);
          } else {
            const { data: data2 } = await insforge.database
              .from('transactions')
              .select('*')
              .eq('reference_id', currentLoan.id);
            if (data2) setLoanTransactions(data2 as unknown as Transaction[]);
          }
        } catch (e) {
          console.error("Error fetching transactions for document generator:", e);
        }
      };
      fetchTransactionsForLoan();
    }
  }, [currentLoan?.id]);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const activeTransaction = transaction || (loanTransactions.length > 0 ? loanTransactions[0] : undefined);

  // Real Overdue & Mora Calculation
  const nextPayDateObj = currentLoan?.nextPaymentDate ? new Date(currentLoan.nextPaymentDate) : null;
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);

  const isDateOverdue = nextPayDateObj ? (nextPayDateObj.getTime() < todayStart.getTime()) : false;
  const isLoanOverdue = currentLoan ? (currentLoan.status === 'Atrasado' || (currentLoan.status === 'Activo' && isDateOverdue)) : false;
  
  const daysLate = (currentLoan && isLoanOverdue && nextPayDateObj)
    ? Math.max(1, Math.floor((todayStart.getTime() - nextPayDateObj.getTime()) / (1000 * 3600 * 24)))
    : 0;

  const installmentAmount = currentLoan?.installmentAmount || (currentLoan ? Math.round((currentLoan.totalToPay || currentLoan.amount) / (currentLoan.durationWeeks || 1)) : 0);
  const lateFeeAmount = isLoanOverdue ? Math.round(installmentAmount * 0.05) : 0;

  // Advanced Collateral Analysis & Structured Legal Wording
  let collateralType = 'Sin Garantía';
  let collateralDescription = '';
  let collateralRefNumber = '';
  let collateralEstimatedValue = 0;
  let collateralLegalClause = 'EL DEUDOR responde con la totalidad de su patrimonio personal presente y futuro (Fianza Personal e Indivisible).';
  let collateralHeading = 'GARANTÍA PERSONAL Y PATRIMONIAL';

  if (currentLoan) {
    if (currentLoan.collateral && typeof currentLoan.collateral === 'object') {
      const col = currentLoan.collateral;
      collateralType = col.type || 'Sin Garantía';
      collateralDescription = col.description || '';
      collateralRefNumber = col.refNumber || '';
      collateralEstimatedValue = col.estimatedValue || 0;
    } else if (currentLoan.collateralref || currentLoan.collateralRef) {
      collateralRefNumber = String(currentLoan.collateralref || currentLoan.collateralRef);
      collateralDescription = String(currentLoan.collateral || '');
      collateralType = (currentLoan.loanCategory as string) === 'Vehicular' ? 'Vehículo' : (currentLoan.loanCategory === 'Hipotecario' ? 'Propiedad' : 'Otro');
    }

    if (collateralType === 'Vehículo') {
      collateralHeading = 'GARANTÍA MOBILIARIA VEHICULAR (PRENDA SIN DESPOSESIÓN)';
      collateralLegalClause = `PRENDA SIN DESPOSESIÓN sobre el vehículo motorizado descrito a continuación: Marca/Modelo/Año: ${collateralDescription || 'Declarado en expediente'}, Matrícula / Placa / Chasis No.: ${collateralRefNumber || 'N/A'}${collateralEstimatedValue > 0 ? `, por un valor estimado de RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}. EL DEUDOR autoriza expresamente la inscripción del gravamen en la Dirección General de Impuestos Internos (DGII).`;
    } else if (collateralType === 'Propiedad') {
      collateralHeading = 'GARANTÍA INMOBILIARIA HIPOTECARIA EN PRIMER RANGO';
      collateralLegalClause = `HIPOTECA EN PRIMER RANGO sobre el inmueble ubicado en: ${collateralDescription || 'Dirección registrada'}, Matrícula de Título de Propiedad / Parcela / Solar No.: ${collateralRefNumber || 'N/A'}${collateralEstimatedValue > 0 ? `, asignado con un valor comercial de RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}, registrado conforme a la Ley 108-05 de Registro Inmobiliario.`;
    } else if (collateralType !== 'Sin Garantía' && collateralType) {
      collateralHeading = `GARANTÍA MOBILIARIA ESPECIAL (${collateralType.toUpperCase()})`;
      collateralLegalClause = `PRENDA MOBILIARIA SOBRE ARTÍCULO DE VALOR (${collateralType}): ${collateralDescription || ''} (Serie / Certificado No.: ${collateralRefNumber || 'N/A'})${collateralEstimatedValue > 0 ? `, de valor estimado RD$ ${collateralEstimatedValue.toLocaleString('es-DO')}` : ''}.`;
    }
  }

  const collateralText = collateralDescription 
    ? `${collateralType} - ${collateralDescription} ${collateralRefNumber ? `(${collateralRefNumber})` : ''}` 
    : 'Garantía Personal / Sin Garantía Específica Declarada';

  const handleCloudSave = async () => {
    const printElement = document.getElementById('printable-legal-document');
    if (!printElement) return;
    
    setIsUploading(true);
    addToast('Generando PDF y subiendo a la nube...', 'info');

    try {
      const canvas = await html2canvas(printElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      
      const fileName = `${client.id}_${docType}_${currentLoan ? currentLoan.id : 'global'}_${Date.now()}.pdf`;
      
      const { error } = await insforge.storage.from('client-documents').upload(
        fileName, 
        pdfBlob
      );

      if (error) throw error;
      
      const { data: publicData } = insforge.storage.from('client-documents').getPublicUrl(fileName);
      const docLink = publicData.publicUrl;
      setDocumentUrl(docLink);
      
      await insforge.database.from('client_documents').insert([{
        client_id: client.id,
        name: `Documento ${docType} - Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''} - ${todayStr}`,
        url: docLink,
        upload_date: new Date().toISOString()
      }]);

      addToast('Documento guardado en la nube exitosamente', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      addToast('Error al guardar en la nube: ' + msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualWhatsApp = () => {
    if (!documentUrl) return;
    
    const amountStr = activeTransaction ? `$${activeTransaction.amount.toLocaleString('es-DO')}` : '';
    let message = `Hola ${client.name.split(' ')[0]},\n\n`;
    
    if (docType === 'recibo' && activeTransaction) {
      message += `Te enviamos el recibo oficial de tu pago por ${amountStr} del Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}.\n`;
    } else if (docType === 'pagare' || docType === 'contrato') {
      message += `Adjunto encontrarás el ${docType} oficial firmado relativo a tu Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}.\n`;
    } else {
      message += `Te enviamos el documento ${docType} de tu Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}.\n`;
    }

    message += `\nPuedes ver o descargar tu documento PDF oficial aquí:\n${documentUrl}\n\nGracias por confiar en ${company.name || 'nosotros'}.`;
    
    const cleanPhone = client.phone ? client.phone.replace(/\D/g, '') : '';
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    const printElement = document.getElementById('printable-legal-document');
    if (!printElement) return;

    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Documento Legal - ${client.name} - Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.6; padding: 40px; color: #111; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #222; padding-bottom: 15px; }
              .header h1 { font-size: 16pt; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
              .header p { margin: 2px 0; font-size: 9pt; font-family: sans-serif; color: #444; }
              .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; text-transform: uppercase; text-decoration: underline; }
              .content p { margin-bottom: 14px; text-align: justify; text-indent: 25px; }
              .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
              .sig-block { text-align: center; width: 45%; }
              .sig-line { border-top: 1px solid #000; margin-bottom: 5px; margin-top: 55px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
              th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 9pt; }
            </style>
          </head>
          <body>
            ${printElement.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="font-bold text-lg">Generador de Contratos y Documentos Legales Dominicanos</h3>
              <p className="text-xs text-slate-400">Cliente: {client.name} | Cédula: {client.cedula || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loan Selector Header Bar (Por Préstamo) */}
        {allLoans.length > 0 && (
          <div className="bg-indigo-50/90 dark:bg-indigo-950/50 p-3.5 border-b border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 shrink-0">
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 
              Seleccionar Préstamo Específico:
            </span>
            
            <div className="flex gap-2 flex-wrap items-center">
              {allLoans.map(l => {
                const isSelected = currentLoan?.id === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedLoanId(l.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    <span className="font-mono">Préstamo {formatLoanId(l.id)}</span>
                    <span>• RD$ {(l.amount || 0).toLocaleString()}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                      l.status === 'Activo' ? (isSelected ? 'bg-indigo-800 text-white' : 'bg-emerald-100 text-emerald-700') : 'bg-slate-200 text-slate-700'
                    }`}>
                      {l.status || 'Activo'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Collateral Banner */}
        {currentLoan && (
          <div className="bg-amber-50/80 dark:bg-amber-950/40 px-4 py-2.5 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold">
              {collateralType === 'Vehículo' && <Car className="w-4 h-4 text-amber-600" />}
              {collateralType === 'Propiedad' && <Home className="w-4 h-4 text-amber-600" />}
              {collateralType !== 'Vehículo' && collateralType !== 'Propiedad' && <Shield className="w-4 h-4 text-amber-600" />}
              <span>Garantía Legal Vinculada: <strong className="uppercase">{collateralType}</strong></span>
            </div>
            <span className="font-mono font-medium text-[11px] truncate max-w-md">
              {collateralDescription ? `${collateralDescription} ` : ''} {collateralRefNumber ? `(Matrícula/Ref #${collateralRefNumber})` : ''}
            </span>
          </div>
        )}

        {/* Document Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setDocType('pagare')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'pagare' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Pagaré Notarial a la Orden
          </button>
          <button
            onClick={() => setDocType('contrato')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'contrato' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Contrato de Préstamo con Garantía
          </button>
          <button
            onClick={() => setDocType('estado_cuenta')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'estado_cuenta' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Estado de Cuenta
          </button>
          <button
            onClick={() => setDocType('recibo')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'recibo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Recibo de Pago
          </button>
          <button
            onClick={() => setDocType('carta_saldo')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'carta_saldo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Carta de Saldo
          </button>
          <button
            onClick={() => setDocType('carta_cobro')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'carta_cobro' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Carta de Cobro (Mora)
          </button>
        </div>

        {/* Printable View Container */}
        <div className="p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1">
          <div id="printable-legal-document" className="bg-white text-slate-900 p-10 rounded-xl shadow-md border border-slate-200 max-w-3xl mx-auto font-serif text-sm leading-relaxed">
            
            {/* Document Header */}
            <div className="header text-center border-b-2 border-slate-800 pb-4 mb-6">
              {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-14 mx-auto mb-2 object-contain font-sans" />}
              <h1 className="text-xl font-black uppercase tracking-wider font-sans text-slate-900">{company.name}</h1>
              {company.rnc && <p className="text-xs text-slate-600 font-sans font-bold">RNC No.: {company.rnc}</p>}
              <p className="text-xs text-slate-600 font-sans">{company.address} • Teléfono: {company.phone}</p>
            </div>

            {/* 1. PAGARÉ NOTARIAL A LA ORDEN COMPLETO CON LEGALIZACIÓN NOTARIAL Y GARANTÍA DETALLADA */}
            {docType === 'pagare' && (
              <div>
                <h2 className="title text-center text-base font-bold uppercase my-5 tracking-wide underline font-sans text-slate-900">
                  PAGARÉ NOTARIAL A LA ORDEN Y CONSTITUCIÓN DE {collateralHeading}
                </h2>
                <div className="text-right text-xs font-sans font-bold text-indigo-950 mb-4">
                  Préstamo Ref. No.: <span className="font-mono">{formatLoanId(currentLoan?.id)}</span>
                </div>
                
                <div className="content space-y-3.5 text-justify leading-relaxed">
                  <p>
                    POR ANTE MÍ, Notario Público de los del Número para el Distrito Nacional, República Dominicana, matrícula del Colegio Dominicano de Notarios No. ____________, COMPARECE libre y voluntariamente el señor(a) <strong>{client.name} {client.lastName || ''}</strong>, de nacionalidad dominicana, mayor de edad, estado civil {client.maritalStatus || client.civilStatus || 'Soltero/a'}, profesión u ocupación {client.occupation || 'Comerciante'}, portador(a) de la Cédula de Identidad y Electoral No. <strong>{client.cedula || 'N/A'}</strong>, domiciliado(a) y residente en <strong>{client.address || 'República Dominicana'}</strong>, quien en lo adelante del presente acto se denominará <strong>EL DEUDOR</strong>.
                  </p>
                  
                  <p>
                    <strong>PRIMERO (DECLARACIÓN DE DEUDA):</strong> EL DEUDOR reconoce mediante el presente acto formal e irrevocable que DEBE y PAGARÁ de manera incondicional a la orden de <strong>{company.name}</strong>, sociedad legalmente constituida bajo RNC No. <strong>{company.rnc || 'N/A'}</strong>, o a su cesionario o legítimo tenedor, la suma total de <strong>RD$ {currentLoan ? (currentLoan.totalToPay || currentLoan.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 }) : '0.00'}</strong> pesos dominicanos, moneda de curso legal en la República Dominicana.
                  </p>
                  
                  <p>
                    <strong>SEGUNDO (INTERESES Y MODALIDAD DE PAGO):</strong> La presente suma adeudada generará una tasa de interés acordada del <strong>{currentLoan?.interestRate || 0}%</strong> bajo la modalidad de pago <strong>{currentLoan?.frequency || 'Mensual'}</strong> ({currentLoan?.loanType || 'Préstamo Amortizado'}). Los pagos se efectuarán puntualmente en las fechas pactadas a partir de la fecha de desembolso.
                  </p>
                  
                  <p>
                    <strong>TERCERO (DETALLE ESPECÍFICO DE LA GARANTÍA OTORGADA):</strong> Como garantía real y especial del fiel, puntual e íntegro cumplimiento de la obligación asumida en este Pagaré Notarial relativo al Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong>, {collateralLegalClause}
                  </p>
                  
                  <p>
                    <strong>CUARTO (MORA Y VENCIMIENTO ANTICIPADO):</strong> Queda expresamente pactado que la falta de pago de una sola de las cuotas acordadas a su vencimiento producirá la caducidad del término y el vencimiento anticipado de la totalidad del saldo adeudado de pleno derecho, sin necesidad de puesta en mora ni requerimiento judicial previo, autorizando al Acreedor a ejecutar la garantía otorgada. Se aplicará un recargo por mora moratoria pactada del 5% mensual sobre el saldo en atraso.
                  </p>
                  
                  <p>
                    <strong>QUINTO (ELECCIÓN DE DOMICILIO Y JURISDICCIÓN):</strong> Para la ejecución del presente Pagaré Notarial y sus consecuencias legales, las partes eligen domicilio formal en las oficinas del Acreedor y atribuyen competencia a los Tribunales de la República Dominicana.
                  </p>
                  
                  <p className="pt-2">
                    Hecho y firmado de buena fe en la ciudad de Santo Domingo, República Dominicana, a los <strong>{todayStr}</strong>.
                  </p>
                </div>

                {/* Firmas de las Partes */}
                <div className="signatures flex justify-between mt-12 pt-6 font-sans">
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-900 pt-2 font-bold">{client.name} {client.lastName || ''}</div>
                    <div className="text-xs text-slate-600">EL DEUDOR (FIRMA Y HUELLA)</div>
                  </div>
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-900 pt-2 font-bold">{company.name}</div>
                    <div className="text-xs text-slate-600">POR EL ACREEDOR</div>
                  </div>
                </div>

                {/* Acto de Legalización Notarial */}
                <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-400 font-serif text-xs leading-relaxed">
                  <h3 className="font-bold uppercase text-center font-sans text-xs mb-3 text-slate-900">ACTO DE LEGALIZACIÓN DE FIRMAS NOTARIAL</h3>
                  <p className="text-justify">
                    YO, _____________________________________, Notario Público de los del Número para el Distrito Nacional, Matrícula del Colegio Dominicano de Notarios No. ________, CERTIFICO Y DOY FE: Que las firmas que anteceden fueron puestas en mi presencia de manera libre y voluntaria por los señores <strong>{client.name} {client.lastName || ''}</strong> y el representante legal de <strong>{company.name}</strong>, cuyas generales constan en el presente acto, quienes me declararon bajo la fe del juramento que esas son las firmas que acostumbran a usar en todos los actos de sus vidas públicas y privadas.
                  </p>
                  <p className="mt-2 text-justify">
                    Dada y firmada en mi estudio notarial en la ciudad de Santo Domingo, República Dominicana, a los <strong>{todayStr}</strong>.
                  </p>
                  
                  <div className="mt-12 text-center font-sans">
                    <div className="w-64 mx-auto border-t border-slate-900 pt-1 font-bold">
                      NOTARIO PÚBLICO
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">(SELLO NOTARIAL OFICIAL)</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONTRATO DE FINANCIAMIENTO Y PRÉSTAMO CON GARANTÍA COMPLETO */}
            {docType === 'contrato' && (
              <div>
                <h2 className="title text-center text-base font-bold uppercase my-5 tracking-wide underline font-sans text-slate-900">
                  CONTRATO DE PRÉSTAMO Y FINANCIAMIENTO CON {collateralHeading}
                </h2>
                <div className="text-right text-xs font-sans font-bold text-indigo-950 mb-4">
                  Préstamo Ref. No.: <span className="font-mono">{formatLoanId(currentLoan?.id)}</span>
                </div>

                <div className="content space-y-3.5 text-justify leading-relaxed">
                  <p>
                    ENTRE: De una parte, <strong>{company.name}</strong>, entidad mercantil organizada conforme a las leyes de la República Dominicana, RNC No. <strong>{company.rnc || 'N/A'}</strong>, con domicilio en {company.address}, denominada en lo adelante <strong>EL ACREEDOR</strong>;
                  </p>
                  <p>
                    Y de la otra parte, el señor(a) <strong>{client.name} {client.lastName || ''}</strong>, dominicano/a, mayor de edad, Cédula de Identidad y Electoral No. <strong>{client.cedula || 'N/A'}</strong>, domiciliado(a) en <strong>{client.address || 'República Dominicana'}</strong>, denominado(a) en lo adelante <strong>EL DEUDOR</strong>.
                  </p>
                  
                  <p className="text-center font-bold uppercase my-3 font-sans text-xs">
                    SE HA CONVENIDO Y PACTADO LO SIGUIENTE:
                  </p>
                  
                  <p>
                    <strong>ARTÍCULO 1 (DEL OBJETO Y ENTREGA):</strong> EL ACREEDOR entrega en calidad de préstamo de dinero en efectivo a EL DEUDOR la suma de <strong>RD$ {(currentLoan?.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> pesos dominicanos, suma que EL DEUDOR declara haber recibido en su totalidad a su entera satisfacción.
                  </p>
                  
                  <p>
                    <strong>ARTÍCULO 2 (PLAZO, INTERÉS Y CONDICIONES):</strong> El presente financiamiento relativo al Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong> devengará una tasa de interés acordada de <strong>{currentLoan?.interestRate}%</strong> bajo la modalidad <strong>{currentLoan?.loanType || 'Amortizado'}</strong> con frecuencia de pago <strong>{currentLoan?.frequency}</strong>. El monto total de la deuda a reembolsar asciende a <strong>RD$ {(currentLoan?.totalToPay || currentLoan?.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>.
                  </p>
                  
                  <p>
                    <strong>ARTÍCULO 3 (RÉGIMEN Y ESPECIFICACIÓN DE LA GARANTÍA):</strong> {collateralLegalClause}
                  </p>
                  
                  <p>
                    <strong>ARTÍCULO 4 (CLÁUSULA DE MORA Y GASTOS DE COBRANZA):</strong> El retraso en el cumplimiento de las fechas fijadas para el pago de las cuotas generará un recargo por mora del 5% mensual. Asimismo, en caso de cobro judicial o extrajudicial, EL DEUDOR se compromete a cubrir los honorarios profesionales de abogacía equivalente al 20% del valor adeudado.
                  </p>
                  
                  <p>
                    <strong>ARTÍCULO 5 (FUERZA EJECUTORIA Y JURISDICCIÓN):</strong> Las partes atribuyen al presente contrato la fuerza ejecutoria que otorga el Artículo 545 del Código de Procedimiento Civil de la República Dominicana y someten cualquier litigio a los tribunales del Distrito Nacional.
                  </p>
                  
                  <p className="pt-2">
                    Hecho y firmado en dos (2) ejemplares de un mismo tenor y efecto en Santo Domingo, República Dominicana, a los <strong>{todayStr}</strong>.
                  </p>
                </div>

                <div className="signatures flex justify-between mt-16 pt-8 font-sans border-t border-slate-300">
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-900 pt-2 font-bold">{client.name} {client.lastName || ''}</div>
                    <div className="text-xs text-slate-600">EL DEUDOR</div>
                  </div>
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-900 pt-2 font-bold">{company.name}</div>
                    <div className="text-xs text-slate-600">EL ACREEDOR</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ESTADO DE CUENTA DETALLADO */}
            {docType === 'estado_cuenta' && (
              <div>
                <h2 className="title text-center text-base font-bold uppercase my-5 tracking-wide underline font-sans text-slate-900">
                  ESTADO DE CUENTA FINANCIERO OFICIAL
                </h2>
                
                <div className="mb-5 font-sans text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                  <div><strong>Cliente:</strong> {client.name} {client.lastName || ''}</div>
                  <div><strong>Cédula:</strong> {client.cedula || 'N/A'}</div>
                  <div><strong>Teléfono:</strong> {client.phone || 'N/A'}</div>
                  <div><strong>Fecha Emisión:</strong> {todayStr}</div>
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <strong>Garantía Registrada:</strong> {collateralDescription ? `${collateralType} - ${collateralDescription} (${collateralRefNumber})` : 'Garantía Personal'}
                  </div>
                </div>

                {currentLoan ? (
                  <div className="space-y-5 font-sans text-xs">
                    <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 font-bold uppercase text-[10px] block">Préstamo Consultado</span>
                        <span className="font-mono font-black text-indigo-700 text-sm">Ref. #{formatLoanId(currentLoan.id)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 font-bold uppercase text-[10px] block">Estado</span>
                        <span className="font-extrabold text-emerald-700 uppercase">{currentLoan.status}</span>
                      </div>
                    </div>

                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800">
                          <th className="border p-2">Monto Desembolsado</th>
                          <th className="border p-2">Frecuencia</th>
                          <th className="border p-2">Tasa Interés</th>
                          <th className="border p-2">Total Deuda</th>
                          <th className="border p-2">Saldo Pendiente</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center font-medium">
                          <td className="border p-2">RD$ {(currentLoan.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                          <td className="border p-2">{currentLoan.frequency}</td>
                          <td className="border p-2">{currentLoan.interestRate}%</td>
                          <td className="border p-2 font-bold">RD$ {(currentLoan.totalToPay || currentLoan.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                          <td className="border p-2 font-black text-indigo-700">RD$ {(currentLoan.remainingBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-6">
                      <h4 className="font-bold text-xs uppercase text-slate-800 mb-2 tracking-wider">Historial Detallado de Transacciones de este Préstamo</h4>
                      {loanTransactions.length > 0 ? (
                        <table className="w-full border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border p-2">Fecha</th>
                              <th className="border p-2">No. Recibo</th>
                              <th className="border p-2">Concepto</th>
                              <th className="border p-2 text-right">Monto Pagado</th>
                              <th className="border p-2 text-center">Método</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loanTransactions.map(t => (
                              <tr key={t.id}>
                                <td className="border p-2">{new Date(t.date).toLocaleDateString('es-DO')}</td>
                                <td className="border p-2 font-mono font-bold text-indigo-700">{formatReceiptId(t.id)}</td>
                                <td className="border p-2">{t.description || 'Abono a Préstamo'}</td>
                                <td className="border p-2 text-right font-black text-emerald-600">RD$ {(t.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                                <td className="border p-2 text-center font-bold">{t.paymentMethod || 'Efectivo'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 italic text-center">No se registran pagos en este préstamo.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-500 font-sans">No hay préstamo seleccionado.</p>
                )}
              </div>
            )}

            {/* 4. RECIBO DE PAGO */}
            {docType === 'recibo' && (
              <div>
                <h2 className="title text-center text-base font-bold uppercase my-5 tracking-wide underline font-sans text-slate-900">
                  COMPROBANTE OFICIAL DE RECIBO DE PAGO
                </h2>
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4 font-sans text-xs">
                  <div>
                    <p><strong>No. Recibo:</strong> <span className="font-mono font-bold text-indigo-700">{formatReceiptId(activeTransaction?.id)}</span></p>
                    <p><strong>Préstamo Ref:</strong> <span className="font-mono font-bold">{formatLoanId(currentLoan?.id)}</span></p>
                    <p><strong>Fecha y Hora:</strong> {activeTransaction?.date ? new Date(activeTransaction.date).toLocaleString('es-DO') : todayStr}</p>
                  </div>
                  <div className="text-lg font-black bg-slate-100 px-4 py-2 rounded-lg border border-slate-300 text-emerald-700">
                    RD$ {activeTransaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                </div>
                
                <div className="content space-y-4 text-justify">
                  <p>
                    HEMOS RECIBIDO DE: <strong>{client.name} {client.lastName || ''}</strong> (Cédula No. {client.cedula || 'N/A'}), la suma de <strong>RD$ {activeTransaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}</strong> pesos dominicanos.
                  </p>
                  <p>
                    <strong>Por Concepto De:</strong> {activeTransaction?.description || 'Abono a Préstamo'}
                  </p>
                  {currentLoan && (
                    <p>
                      <strong>Préstamo Asociado:</strong> {currentLoan.loanType} (Ref. #{formatLoanId(currentLoan.id)}) — Garantía: {collateralType} ({collateralRefNumber || collateralDescription || 'Personal'})
                    </p>
                  )}
                  {currentLoan && (
                    <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-slate-50 font-sans text-xs space-y-1">
                      <p><strong>Saldo Anterior:</strong> RD$ {((currentLoan.remainingBalance || 0) + (activeTransaction?.amount || 0)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                      <p className="font-black text-sm text-indigo-700 pt-1"><strong>(=) Nuevo Saldo Pendiente:</strong> RD$ {(currentLoan.remainingBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                </div>

                <div className="signatures flex justify-center mt-12 font-sans">
                  <div className="sig-block text-center w-64">
                    <div className="sig-line border-t border-slate-900 pt-1 font-bold">{company.name}</div>
                    <p className="text-xs text-slate-500">DEPARTAMENTO DE CAJA</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CARTA DE SALDO Y CANCELACIÓN DE PRENDA */}
            {docType === 'carta_saldo' && (
              <div>
                <h2 className="title text-center text-base font-bold uppercase my-5 tracking-wide underline font-sans text-slate-900">
                  CARTA DE SALDO Y CANCELACIÓN DEFINITIVA DE GRAVAMEN
                </h2>
                <div className="content space-y-4 text-justify">
                  <p>A QUIEN PUEDA INTERESAR:</p>
                  <p>
                    Por medio de la presente, certificamos formalmente que el Sr.(a) <strong>{client.name} {client.lastName || ''}</strong>, portador(a) de la Cédula de Identidad No. <strong>{client.cedula || 'N/A'}</strong>, ha saldado en su totalidad la obligación financiera relativa al Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong> otorgado por nuestra institución por un monto inicial de RD$ {(currentLoan?.amount || 0).toLocaleString()}.
                  </p>
                  <p>
                    En tal sentido, declaramos libre de toda responsabilidad, oposición o gravamen crediticio a la garantía otorgada relativa a este préstamo, consistente en: <strong>{collateralText}</strong> a la fecha de hoy <strong>{todayStr}</strong>.
                  </p>
                </div>

                <div className="signatures flex justify-center mt-16 pt-8 font-sans">
                  <div className="sig-block text-center w-6/12">
                    <div className="sig-line border-t border-slate-800 pt-2 font-bold">{company.name}</div>
                    <div className="text-xs text-slate-500">DEPARTAMENTO DE CRÉDITO Y COBROS</div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CARTA DE COBRO (MORA VS RECORDATORIO AL DÍA DINÁMICO) */}
            {docType === 'carta_cobro' && (
              <div>
                {isLoanOverdue ? (
                  /* CASO 1: CLIENTE REALMENTE TIENE MORA / ATRASO */
                  <div>
                    <h2 className="title text-center text-base font-bold uppercase my-5 tracking-wide underline font-sans text-rose-700">
                      NOTIFICACIÓN FORMAL DE INTIMACIÓN DE PAGO Y COBRO DE MORA
                    </h2>
                    <div className="content space-y-3.5 text-justify">
                      <p><strong>FECHA:</strong> {todayStr}</p>
                      <p><strong>SEÑOR(A):</strong> {client.name} {client.lastName || ''}</p>
                      <p><strong>CÉDULA:</strong> {client.cedula || 'N/A'}</p>
                      <p><strong>DIRECCIÓN:</strong> {client.address || 'Domicilio Registrado'}</p>
                      <p className="pt-2">Estimado(a) cliente:</p>
                      
                      <p>
                        Le informamos por este medio formal que la cuota correspondiente a su Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong> se encuentra en estado de <strong>ATRASO Y MORA</strong> por acumular un total de <strong>{daysLate} días transcurridos de mora</strong> desde la fecha de vencimiento pactada (<strong>{currentLoan?.nextPaymentDate || 'Vencida'}</strong>).
                      </p>
                      
                      <div className="my-4 p-4 border border-rose-200 bg-rose-50/70 rounded-xl font-sans text-xs space-y-1">
                        <p className="font-bold text-rose-900 border-b border-rose-200 pb-1 uppercase">DESGLOSE DEL BALANCE EN MORA:</p>
                        <p className="flex justify-between"><span>Monto de la Cuota Pendiente:</span> <strong className="font-mono">RD$ {installmentAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong></p>
                        <p className="flex justify-between"><span>Recargo por Mora Moratoria (5% Pactado):</span> <strong className="font-mono text-rose-700">RD$ {lateFeeAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong></p>
                        <p className="flex justify-between border-t border-rose-200 pt-1 text-xs font-black text-rose-800"><span>TOTAL A REGULARIZAR:</span> <span className="font-mono">RD$ {(installmentAmount + lateFeeAmount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></p>
                      </div>

                      <p>
                        Garantía en riesgo de ejecución notarial: <strong>{collateralText}</strong>.
                      </p>
                      
                      <p>
                        Le requerimos formalmente ponerse en contacto con nuestra gerencia de cobros en un plazo improrrogable no mayor a <strong>48 horas</strong> a partir de la recepción del presente documento, a fin de regularizar su situación financiera y evitar el inicio de acciones de cobro extrajudicial, mora judicial y ejecución de la garantía legal.
                      </p>
                    </div>

                    <div className="signatures flex justify-center mt-16 pt-8 font-sans">
                      <div className="sig-block text-center w-6/12">
                        <div className="sig-line border-t border-slate-800 pt-2 font-bold">{company.name}</div>
                        <div className="text-xs text-slate-500">GERENCIA DE COBRANZAS Y LEGAL</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CASO 2: CLIENTE ESTÁ AL DÍA (SIN MORA) */
                  <div>
                    <h2 className="title text-center text-base font-bold uppercase my-5 tracking-wide underline font-sans text-emerald-700">
                      NOTIFICACIÓN DE ESTADO AL DÍA Y RECORDATORIO PREVENTIVO
                    </h2>
                    <div className="content space-y-3.5 text-justify">
                      <p><strong>FECHA:</strong> {todayStr}</p>
                      <p><strong>SEÑOR(A):</strong> {client.name} {client.lastName || ''}</p>
                      <p><strong>CÉDULA:</strong> {client.cedula || 'N/A'}</p>
                      <p><strong>DIRECCIÓN:</strong> {client.address || 'Domicilio Registrado'}</p>
                      <p className="pt-2">Estimado(a) cliente:</p>
                      
                      <p>
                        Le certificamos por este medio formal que a la fecha de hoy, su Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong> se encuentra en estado de <strong>TOTALMENTE AL DÍA Y SIN NINGÚN REGISTRO DE MORA (0 DÍAS DE MORA)</strong>.
                      </p>

                      <div className="my-4 p-4 border border-emerald-200 bg-emerald-50/70 rounded-xl font-sans text-xs space-y-1">
                        <p className="font-bold text-emerald-900 border-b border-emerald-200 pb-1 uppercase">ESTADO DE PRÓXIMO VENCIMIENTO:</p>
                        <p className="flex justify-between"><span>Próxima Fecha de Pago Programada:</span> <strong className="font-bold text-emerald-800">{currentLoan?.nextPaymentDate || 'Al Día'}</strong></p>
                        <p className="flex justify-between"><span>Monto de la Próxima Cuota:</span> <strong className="font-mono">RD$ {installmentAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong></p>
                        <p className="flex justify-between"><span>Recargo por Mora Actual:</span> <strong className="font-mono text-emerald-700">RD$ 0.00 (SIN MORA)</strong></p>
                      </div>

                      <p>
                        Garantía vinculada en condición normal: <strong>{collateralText}</strong>.
                      </p>

                      <p>
                        Agradecemos la puntualidad demostrada en el cumplimiento de sus compromisos financieros con nuestra institución.
                      </p>
                    </div>

                    <div className="signatures flex justify-center mt-16 pt-8 font-sans">
                      <div className="sig-block text-center w-6/12">
                        <div className="sig-line border-t border-slate-800 pt-2 font-bold">{company.name}</div>
                        <div className="text-xs text-slate-500">DEPARTAMENTO DE CRÉDITO Y COBROS</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2"
          >
            <Printer className="w-5 h-5" /> Imprimir / Exportar PDF
          </button>
          <button
            onClick={handleCloudSave}
            disabled={isUploading}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            <CloudUpload className="w-5 h-5" /> {isUploading ? 'Guardando...' : 'Guardar en la Nube'}
          </button>
          {documentUrl && (
            <button
              onClick={handleManualWhatsApp}
              className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> Enviar por WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
