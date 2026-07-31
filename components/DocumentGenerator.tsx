import React, { useState } from 'react';
import { FileText, Printer, Download, CheckCircle, X, Shield, FileCheck, AlertCircle, CloudUpload, MessageCircle } from 'lucide-react';
import { Loan, Client, CompanySettings, Transaction } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { insforge } from '../lib/insforge';
import { useToast } from '../context/ToastContext';

export type DocumentType = 'pagare' | 'contrato' | 'estado_cuenta' | 'carta_saldo' | 'carta_cobro' | 'recibo';

interface DocumentGeneratorProps {
  loan?: Loan;
  client: Client;
  company: CompanySettings;
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  defaultDocType?: DocumentType;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  loan,
  client,
  company,
  transaction,
  isOpen,
  onClose,
  defaultDocType = 'pagare'
}) => {
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

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
      
      const fileName = `${client.id}_${docType}_${Date.now()}.pdf`;
      
      // Cast to any to bypass the SDK type definition missing the 3rd argument
      const { data, error } = await (insforge.storage.from('documents').upload as any)(
        fileName, 
        pdfBlob, 
        { contentType: 'application/pdf', upsert: true }
      );

      if (error) throw error;
      
      const { data: publicData } = insforge.storage.from('documents').getPublicUrl(fileName);
      const docLink = publicData.publicUrl;
      setDocumentUrl(docLink);
      
      // Save URL to client_documents table
      await insforge.database.from('client_documents').insert({
        client_id: client.id,
        name: `Documento ${docType} - ${todayStr}`,
        url: docLink,
        upload_date: new Date().toISOString()
      });

      addToast('Documento guardado en la nube exitosamente', 'success');
    } catch (err: any) {
      addToast('Error al guardar en la nube: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualWhatsApp = () => {
    if (!documentUrl) return;
    
    const amountStr = transaction ? `$${transaction.amount.toLocaleString('es-DO')}` : '';
    let message = `Hola ${client.name.split(' ')[0]},\n\n`;
    
    if (docType === 'recibo' && transaction) {
      message += `Te enviamos el comprobante de tu pago por ${amountStr} realizado el ${new Date(transaction.date).toLocaleDateString('es-DO')}.\n`;
    } else if (docType === 'pagare' || docType === 'contrato') {
      message += `Adjunto encontrarás el ${docType} de tu préstamo.\n`;
    } else {
      message += `Te enviamos el siguiente documento: ${docType}.\n`;
    }

    message += `\nPuedes descargar o ver el documento PDF aquí: ${documentUrl}\n\nGracias por confiar en ${company.name || 'nosotros'}.`;
    
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
            <title>Documento - ${client.name}</title>
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
              <p className="text-xs text-slate-400">Cliente: {client.name} | Cédula: {client.cedula}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setDocType('recibo')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'recibo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Recibo de Pago
          </button>
          <button
            onClick={() => setDocType('pagare')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'pagare' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Pagaré Notarial
          </button>
          <button
            onClick={() => setDocType('contrato')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'contrato' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Contrato de Préstamo
          </button>
          <button
            onClick={() => setDocType('estado_cuenta')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'estado_cuenta' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Estado de Cuenta
          </button>
          <button
            onClick={() => setDocType('carta_saldo')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'carta_saldo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Carta de Saldo
          </button>
          <button
            onClick={() => setDocType('carta_cobro')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'carta_cobro' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Carta de Cobro (Mora)
          </button>
        </div>

        {/* Printable View Container */}
        <div className="p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1">
          <div id="printable-legal-document" className="bg-white text-slate-900 p-10 rounded-xl shadow-md border border-slate-200 max-w-3xl mx-auto font-serif text-sm leading-relaxed">
            
            {/* Header */}
            <div className="header text-center border-b border-slate-300 pb-4 mb-6">
              <h1 className="text-xl font-bold uppercase tracking-wider font-sans text-slate-800">{company.name}</h1>
              {company.rnc && <p className="text-xs text-slate-500 font-sans">RNC: {company.rnc}</p>}
              <p className="text-xs text-slate-500 font-sans">{company.address} • Tel: {company.phone}</p>
            </div>

            {/* Document Content Switcher */}
            {docType === 'recibo' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">RECIBO DE PAGO</h2>
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                  <div className="font-sans text-sm">
                    <p><strong>Recibo No:</strong> {transaction?.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
                    <p><strong>Fecha:</strong> {transaction?.date ? new Date(transaction.date).toLocaleDateString('es-DO') : todayStr}</p>
                  </div>
                  <div className="font-sans text-xl font-bold bg-slate-100 px-4 py-2 rounded-lg border border-slate-300">
                    Monto: RD$ {transaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                </div>
                
                <div className="content space-y-4 text-justify">
                  <p>
                    HEMOS RECIBIDO DE: <strong>{client.name} {client.lastName || ''}</strong> (Cédula: {client.cedula}), la suma de <strong>RD$ {transaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}</strong> pesos dominicanos.
                  </p>
                  <p>
                    <strong>Por Concepto De:</strong> {transaction?.description || 'Abono a Préstamo'}
                  </p>
                  {loan && (
                    <p>
                      <strong>Préstamo Asociado:</strong> {loan.loanType} - Monto Original: RD$ {loan.amount.toLocaleString('es-DO')}
                    </p>
                  )}
                  {loan && (
                    <div className="mt-6 border border-slate-200 rounded p-4 bg-slate-50 font-sans text-sm">
                      <p><strong>Saldo Anterior:</strong> RD$ {(loan.remainingBalance + (transaction?.amount || 0)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                      <p className="font-bold text-lg mt-2 text-indigo-700"><strong>Saldo Actual:</strong> RD$ {loan.remainingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
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

            {docType === 'pagare' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">PAGARÉ NOTARIAL A LA ORDEN</h2>
                <div className="content space-y-4 text-justify">
                  <p>
                    POR MEDIO DEL PRESENTE DOCUMENTO, yo, <strong>{client.name} {client.lastName || ''}</strong>, de nacionalidad dominicana, portador(a) de la Cédula de Identidad y Electoral No. <strong>{client.cedula}</strong>, domiciliado(a) y residente en <strong>{client.address}</strong>, reconozco deber y me obligo a pagar incondicionalmente a la orden de <strong>{company.name}</strong>, o a su cesionario, la suma de <strong>RD$ {loan ? loan.totalToPay.toLocaleString('es-DO', { minimumFractionDigits: 2 }) : '0.00'}</strong> pesos dominicanos.
                  </p>
                  <p>
                    El presente capital generará un interés del <strong>{loan?.interestRate || 0}%</strong> acordado bajo la modalidad de pago <strong>{loan?.frequency || 'Mensual'}</strong>, el cual será pagado según las cuotas pactadas a partir de la fecha de desembolso.
                  </p>
                  {loan?.collateral && loan.collateral.type !== 'Sin Garantía' && (
                    <p>
                      <strong>GARANTÍA:</strong> Como respaldo del fiel cumplimiento de este compromiso, el DEUDOR otorga en garantía el bien consistente en: <strong>{loan.collateral.type} - {loan.collateral.description}</strong> (Matrícula/Referencia: {loan.collateral.refNumber}).
                    </p>
                  )}
                  <p>
                    En caso de mora o incumplimiento de cualquiera de las cuotas, la totalidad del saldo adeudado se considerará vencido y exigible de pleno derecho, autorizando al acreedor a ejecutar la garantía correspondiente.
                  </p>
                  <p className="pt-4">
                    Hecho y firmado de buena fe en Santo Domingo, República Dominicana, a los <strong>{todayStr}</strong>.
                  </p>
                </div>

                <div className="signatures flex justify-between mt-16 pt-8 border-t border-slate-300">
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

            {docType === 'contrato' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">CONTRATO DE PRÉSTAMO</h2>
                <div className="content space-y-4 text-justify">
                  <p>
                    Entre la entidad <strong>{company.name}</strong>, de una parte; y de la otra parte <strong>{client.name} {client.lastName || ''}</strong>, cédula No. <strong>{client.cedula}</strong>, se ha convenido el siguiente contrato de financiamiento:
                  </p>
                  <p>
                    <strong>PRIMERO:</strong> EL ACREEDOR entrega en calidad de préstamo la suma de <strong>RD$ {loan?.amount.toLocaleString('es-DO') || '0.00'}</strong> al DEUDOR, quien declara haber recibido dicha suma a su entera satisfacción.
                  </p>
                  <p>
                    <strong>SEGUNDO:</strong> El préstamo devengará una tasa de interés mensual de <strong>{loan?.interestRate}%</strong> bajo modalidad <strong>{loan?.loanType}</strong> con frecuencia de pago <strong>{loan?.frequency}</strong>.
                  </p>
                  <p>
                    <strong>TERCERO:</strong> Cláusula de Mora: En caso de retraso en el pago de las cuotas pactadas, se aplicará un recargo por mora del 5% sobre el saldo adeudado.
                  </p>
                  <p className="pt-4">
                    Firmado a los <strong>{todayStr}</strong>.
                  </p>
                </div>

                <div className="signatures flex justify-between mt-16 pt-8">
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

            {docType === 'estado_cuenta' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">ESTADO DE CUENTA OFICIAL</h2>
                <div className="mb-4 font-sans text-xs space-y-1">
                  <p><strong>Fecha de Emisión:</strong> {todayStr}</p>
                  <p><strong>Cliente:</strong> {client.name} {client.lastName || ''}</p>
                  <p><strong>Cédula:</strong> {client.cedula}</p>
                  <p><strong>Teléfono:</strong> {client.phone}</p>
                </div>

                {loan ? (
                  <div className="space-y-4 font-sans text-xs">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border p-2">Préstamo #</th>
                          <th className="border p-2">Monto Inicial</th>
                          <th className="border p-2">Total a Pagar</th>
                          <th className="border p-2">Balance Pendiente</th>
                          <th className="border p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-mono font-bold">{loan.id}</td>
                          <td className="border p-2">RD$ {loan.amount.toLocaleString()}</td>
                          <td className="border p-2">RD$ {loan.totalToPay.toLocaleString()}</td>
                          <td className="border p-2 font-bold text-indigo-700">RD$ {loan.remainingBalance.toLocaleString()}</td>
                          <td className="border p-2 font-bold">{loan.status}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-500 font-sans">No hay préstamo seleccionado.</p>
                )}
              </div>
            )}

            {docType === 'carta_saldo' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">CARTA DE SALDO Y CANCELACIÓN</h2>
                <div className="content space-y-4 text-justify">
                  <p>A QUIEN PUEDA INTERESAR:</p>
                  <p>
                    Por medio de la presente, certificamos que el Sr.(a) <strong>{client.name} {client.lastName || ''}</strong>, portador(a) de la cédula de identidad No. <strong>{client.cedula}</strong>, ha saldado en su totalidad las obligaciones financieras relativas al préstamo identificador <strong>#{loan?.id || 'GLOBAL'}</strong> otorgado por nuestra institución.
                  </p>
                  <p>
                    En tal sentido, declaramos libre de toda responsabilidad o gravamen crediticio al referido cliente sobre la mencionada operación de préstamo a la fecha de hoy <strong>{todayStr}</strong>.
                  </p>
                </div>

                <div className="signatures flex justify-center mt-16 pt-8">
                  <div className="sig-block text-center w-6/12">
                    <div className="sig-line border-t border-slate-800 pt-2 font-bold">{company.name}</div>
                    <div className="text-xs text-slate-500">DEPARTAMENTO DE CRÉDITO Y COBROS</div>
                  </div>
                </div>
              </div>
            )}

            {docType === 'carta_cobro' && (
              <div>
                <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline text-rose-700">NOTIFICACIÓN DE COBRO Y MORA</h2>
                <div className="content space-y-4 text-justify">
                  <p><strong>FECHA:</strong> {todayStr}</p>
                  <p><strong>SEÑOR(A):</strong> {client.name} {client.lastName || ''}</p>
                  <p><strong>DIRECCIÓN:</strong> {client.address}</p>
                  <p className="pt-2">Estimado(a) cliente:</p>
                  <p>
                    Le informamos por este medio que su cuota correspondiente al préstamo No. <strong>#{loan?.id || ''}</strong> se encuentra en estado de <strong>ATRASO DE PAGO</strong> por un saldo pendiente de <strong>RD$ {loan?.remainingBalance.toLocaleString() || '0.00'}</strong>.
                  </p>
                  <p>
                    Le solicitamos ponerse en contacto con nuestra oficina de cobros en un plazo no mayor a 48 horas a fin de regularizar su situación y evitar recargos adicionales o acciones de cobro extrajudicial.
                  </p>
                </div>

                <div className="signatures flex justify-center mt-16 pt-8">
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
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2"
          >
            <Printer className="w-5 h-5" /> Imprimir / Exportar a PDF
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
