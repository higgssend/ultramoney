import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, CheckCircle, X, Shield, FileCheck, AlertCircle, CloudUpload, MessageCircle, CreditCard, ChevronDown } from 'lucide-react';
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
            setLoanTransactions(data as any);
          } else {
            const { data: data2 } = await insforge.database
              .from('transactions')
              .select('*')
              .eq('reference_id', currentLoan.id);
            if (data2) setLoanTransactions(data2 as any);
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
        client_id: client.id,
        name: `Documento ${docType} - Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''} - ${todayStr}`,
        url: docLink,
        upload_date: new Date().toISOString()
      }]);

      addToast('Documento guardado en la nube exitosamente', 'success');
    } catch (err: any) {
      addToast('Error al guardar en la nube: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualWhatsApp = () => {
    if (!documentUrl) return;
    
    const amountStr = activeTransaction ? `$${activeTransaction.amount.toLocaleString('es-DO')}` : '';
    let message = `Hola ${client.name.split(' ')[0]},\n\n`;
    
    if (docType === 'recibo' && activeTransaction) {
      message += `Te enviamos el comprobante de tu pago por ${amountStr} relativo al Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}.\n`;
    } else if (docType === 'pagare' || docType === 'contrato') {
      message += `Adjunto encontrarás el ${docType} oficial de tu Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}.\n`;
    } else {
      message += `Te enviamos el documento ${docType} de tu Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}.\n`;
    }

    message += `\nPuedes ver o descargar tu documento PDF aquí: ${documentUrl}\n\nGracias por confiar en ${company.name || 'nosotros'}.`;
    
    const cleanPhone = client.phone ? client.phone.replace(/\D/g, '') : '';
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    const printElement = document.getElementById('printable-legal-document');
    if (!printElement) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Documento - ${client.name} - Préstamo ${currentLoan ? formatLoanId(currentLoan.id) : ''}</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.6; padding: 40px; color: #111; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
              .header h1 { font-size: 18pt; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
              .header p { margin: 3px 0; font-size: 10pt; font-family: sans-serif; color: #555; }
              .title { text-align: center; font-size: 16pt; font-weight: bold; margin: 25px 0; text-transform: uppercase; text-decoration: underline; }
              .content p { margin-bottom: 15px; text-align: justify; text-indent: 30px; }
              .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
              .sig-block { text-align: center; width: 45%; }
              .sig-line { border-top: 1px solid #000; margin-bottom: 5px; margin-top: 60px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11pt; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="font-bold text-lg">Generador de Documentos Oficiales</h3>
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
              Documentos para el Préstamo:
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
                    <span className="font-mono">{formatLoanId(l.id)}</span>
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

        {/* Document Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setDocType('recibo')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'recibo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Recibo de Pago
          </button>
          <button
            onClick={() => setDocType('pagare')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'pagare' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Pagaré Notarial
          </button>
          <button
            onClick={() => setDocType('contrato')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'contrato' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Contrato de Préstamo
          </button>
          <button
            onClick={() => setDocType('estado_cuenta')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'estado_cuenta' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Estado de Cuenta
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
            <div className="header text-center border-b border-slate-300 pb-4 mb-6">
              <h1 className="text-xl font-bold uppercase tracking-wider font-sans text-slate-800">{company.name}</h1>
              {company.rnc && <p className="text-xs text-slate-500 font-sans">RNC: {company.rnc}</p>}
              <p className="text-xs text-slate-500 font-sans">{company.address} • Tel: {company.phone}</p>
            </div>

            {/* 1. RECIBO DE PAGO */}
            {docType === 'recibo' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">RECIBO DE PAGO DE PRÉSTAMO</h2>
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4 font-sans">
                  <div className="text-sm">
                    <p><strong>Recibo No:</strong> {formatReceiptId(activeTransaction?.id)}</p>
                    <p><strong>Préstamo Ref:</strong> <span className="font-mono font-bold">{formatLoanId(currentLoan?.id)}</span></p>
                    <p><strong>Fecha:</strong> {activeTransaction?.date ? new Date(activeTransaction.date).toLocaleDateString('es-DO') : todayStr}</p>
                  </div>
                  <div className="text-xl font-bold bg-slate-100 px-4 py-2 rounded-lg border border-slate-300">
                    Monto: RD$ {activeTransaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}
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
                      <strong>Préstamo Asociado:</strong> {currentLoan.loanType} (Ref. #{formatLoanId(currentLoan.id)}) — Monto Original: RD$ {(currentLoan.amount || 0).toLocaleString('es-DO')}
                    </p>
                  )}
                  {currentLoan && (
                    <div className="mt-6 border border-slate-200 rounded p-4 bg-slate-50 font-sans text-sm">
                      <p><strong>Saldo Anterior:</strong> RD$ {((currentLoan.remainingBalance || 0) + (activeTransaction?.amount || 0)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                      <p className="font-bold text-lg mt-2 text-indigo-700"><strong>Nuevo Saldo Pendiente:</strong> RD$ {(currentLoan.remainingBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                </div>

                <div className="signatures flex-col sm:flex-row gap-8 items-center justify-center mt-12">
                  <div className="sig-block mx-auto sm:mx-0 w-64">
                    <div className="sig-line border-t-2 border-slate-400"></div>
                    <p className="font-bold text-sm">Cajero / Recibidor</p>
                    <p className="text-xs text-slate-500">{company.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PAGARÉ NOTARIAL */}
            {docType === 'pagare' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">PAGARÉ NOTARIAL A LA ORDEN</h2>
                <div className="content space-y-4 text-justify">
                  <p>
                    POR MEDIO DEL PRESENTE DOCUMENTO, yo, <strong>{client.name} {client.lastName || ''}</strong>, de nacionalidad dominicana, portador(a) de la Cédula de Identidad y Electoral No. <strong>{client.cedula || 'N/A'}</strong>, domiciliado(a) y residente en <strong>{client.address || 'la República Dominicana'}</strong>, reconozco deber y me obligo a pagar incondicionalmente a la orden de <strong>{company.name}</strong>, o a su cesionario, la suma de <strong>RD$ {currentLoan ? (currentLoan.totalToPay || currentLoan.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 }) : '0.00'}</strong> pesos dominicanos, correspondiente al Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong>.
                  </p>
                  <p>
                    El presente capital generará un interés del <strong>{currentLoan?.interestRate || 0}%</strong> acordado bajo la modalidad de pago <strong>{currentLoan?.frequency || 'Mensual'}</strong>, el cual será pagado según las cuotas pactadas a partir de la fecha de desembolso.
                  </p>
                  {currentLoan?.collateral && (
                    <p>
                      <strong>GARANTÍA:</strong> Como respaldo del fiel cumplimiento de este compromiso relativo al Préstamo #{formatLoanId(currentLoan.id)}, el DEUDOR otorga en garantía el bien consistente en: <strong>{typeof currentLoan.collateral === 'object' ? `${currentLoan.collateral.type || 'Garantía'} - ${currentLoan.collateral.description || ''} ${currentLoan.collateral.refNumber ? `(Matrícula/Ref: ${currentLoan.collateral.refNumber})` : ''}` : String(currentLoan.collateral)}</strong>.
                    </p>
                  )}
                  <p>
                    En caso de mora o incumplimiento de cualquiera de las cuotas pactadas, la totalidad del saldo adeudado se considerará vencido y exigible de pleno derecho, autorizando al acreedor a ejecutar la garantía correspondiente.
                  </p>
                  <p className="pt-4">
                    Hecho y firmado de buena fe en Santo Domingo, República Dominicana, a los <strong>{todayStr}</strong>.
                  </p>
                </div>

                <div className="signatures flex justify-between mt-16 pt-8 border-t border-slate-300 font-sans">
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-800 pt-2 font-bold">{client.name}</div>
                    <div className="text-xs text-slate-500">DEUDOR (FIRMA)</div>
                  </div>
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-800 pt-2 font-bold">{company.name}</div>
                    <div className="text-xs text-slate-500">POR LA EMPRESA (FIRMA)</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CONTRATO DE PRÉSTAMO */}
            {docType === 'contrato' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">CONTRATO DE FINANCIAMIENTO</h2>
                <div className="content space-y-4 text-justify">
                  <p>
                    Entre la entidad <strong>{company.name}</strong>, de una parte; y de la otra parte <strong>{client.name} {client.lastName || ''}</strong>, Cédula No. <strong>{client.cedula || 'N/A'}</strong>, se convenió el siguiente contrato relativo al Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong>:
                  </p>
                  <p>
                    <strong>PRIMERO:</strong> EL ACREEDOR entrega en calidad de préstamo la suma de <strong>RD$ {currentLoan?.amount?.toLocaleString('es-DO') || '0.00'}</strong> al DEUDOR, quien declara haber recibido dicha suma a su entera satisfacción.
                  </p>
                  <p>
                    <strong>SEGUNDO:</strong> El préstamo devengará una tasa de interés de <strong>{currentLoan?.interestRate}%</strong> bajo la modalidad <strong>{currentLoan?.loanType}</strong> con frecuencia de pago <strong>{currentLoan?.frequency}</strong>.
                  </p>
                  <p>
                    <strong>TERCERO (MORA):</strong> En caso de retraso en el pago de las cuotas pactadas, se aplicará el recargo por mora correspondiente sobre el saldo adeudado.
                  </p>
                  <p className="pt-4">
                    Firmado de conformidad a los <strong>{todayStr}</strong>.
                  </p>
                </div>

                <div className="signatures flex justify-between mt-16 pt-8 font-sans">
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-800 pt-2 font-bold">{client.name}</div>
                    <div className="text-xs text-slate-500">DEUDOR</div>
                  </div>
                  <div className="sig-block text-center w-5/12">
                    <div className="sig-line border-t border-slate-800 pt-2 font-bold">{company.name}</div>
                    <div className="text-xs text-slate-500">ACREEDOR</div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ESTADO DE CUENTA */}
            {docType === 'estado_cuenta' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">ESTADO DE CUENTA OFICIAL</h2>
                <div className="mb-4 font-sans text-xs space-y-1">
                  <p><strong>Fecha de Emisión:</strong> {todayStr}</p>
                  <p><strong>Cliente:</strong> {client.name} {client.lastName || ''}</p>
                  <p><strong>Cédula:</strong> {client.cedula || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> {client.phone || 'N/A'}</p>
                </div>

                {currentLoan ? (
                  <div className="space-y-4 font-sans text-xs">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border p-2">Préstamo #</th>
                          <th className="border p-2">Monto Inicial</th>
                          <th className="border p-2">Frecuencia</th>
                          <th className="border p-2">Balance Pendiente</th>
                          <th className="border p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-mono font-bold">{formatLoanId(currentLoan.id)}</td>
                          <td className="border p-2">RD$ {(currentLoan.amount || 0).toLocaleString()}</td>
                          <td className="border p-2">{currentLoan.frequency}</td>
                          <td className="border p-2 font-bold text-indigo-700">RD$ {(currentLoan.remainingBalance || 0).toLocaleString()}</td>
                          <td className="border p-2 font-bold">{currentLoan.status}</td>
                        </tr>
                      </tbody>
                    </table>

                    {loanTransactions.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-bold text-sm text-slate-800 mb-2 uppercase">Historial de Pagos de este Préstamo</h4>
                        <table className="w-full border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border p-2">Fecha</th>
                              <th className="border p-2">Recibo</th>
                              <th className="border p-2">Monto Pagado</th>
                              <th className="border p-2">Método</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loanTransactions.map(t => (
                              <tr key={t.id}>
                                <td className="border p-2">{new Date(t.date).toLocaleDateString('es-DO')}</td>
                                <td className="border p-2 font-mono">{formatReceiptId(t.id)}</td>
                                <td className="border p-2 font-bold text-emerald-700">RD$ {t.amount.toLocaleString()}</td>
                                <td className="border p-2">{t.paymentMethod || 'Efectivo'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-500 font-sans">No hay préstamo seleccionado.</p>
                )}
              </div>
            )}

            {/* 5. CARTA DE SALDO */}
            {docType === 'carta_saldo' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">CARTA DE SALDO Y CANCELACIÓN DE DEUDA</h2>
                <div className="content space-y-4 text-justify">
                  <p>A QUIEN PUEDA INTERESAR:</p>
                  <p>
                    Por medio de la presente, certificamos formalmente que el Sr.(a) <strong>{client.name} {client.lastName || ''}</strong>, portador(a) de la Cédula de Identidad No. <strong>{client.cedula || 'N/A'}</strong>, ha saldado en su totalidad la obligación financiera relativa al Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong> otorgado por nuestra institución por un monto inicial de RD$ {(currentLoan?.amount || 0).toLocaleString()}.
                  </p>
                  <p>
                    En tal sentido, declaramos libre de toda responsabilidad o gravamen crediticio sobre el mencionado Préstamo #{formatLoanId(currentLoan?.id)} a la fecha de hoy <strong>{todayStr}</strong>.
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

            {/* 6. CARTA DE COBRO (MORA) */}
            {docType === 'carta_cobro' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline text-rose-700">NOTIFICACIÓN DE COBRO Y MORA</h2>
                <div className="content space-y-4 text-justify">
                  <p><strong>FECHA:</strong> {todayStr}</p>
                  <p><strong>SEÑOR(A):</strong> {client.name} {client.lastName || ''}</p>
                  <p><strong>DIRECCIÓN:</strong> {client.address || 'Domicilio Registrado'}</p>
                  <p className="pt-2">Estimado(a) cliente:</p>
                  <p>
                    Le informamos por este medio que la cuota correspondiente al Préstamo No. <strong>#{formatLoanId(currentLoan?.id)}</strong> se encuentra en estado de <strong>ATRASO DE PAGO</strong> por un saldo pendiente de <strong>RD$ {(currentLoan?.remainingBalance || 0).toLocaleString()}</strong>.
                  </p>
                  <p>
                    Le solicitamos ponerse en contacto con nuestra oficina de cobros a la brevedad posible a fin de regularizar su situación y evitar recargos adicionales o ejecuciones legales sobre la garantía.
                  </p>
                </div>

                <div className="signatures flex justify-center mt-16 pt-8 font-sans">
                  <div className="sig-block text-center w-6/12">
                    <div className="sig-line border-t border-slate-800 pt-2 font-bold">{company.name}</div>
                    <div className="text-xs text-slate-500">GERENCIA DE COBRANZAS</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
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
