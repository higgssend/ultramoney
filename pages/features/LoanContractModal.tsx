import React, { useRef, useCallback } from 'react';
import { X, Printer, Download, Share2, Image as ImageIcon, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { InstallmentPreview } from '../../utils/LoanEngine';
import { LoanType, ClosingCostMode, CompanySettings, Client } from '../../types';

interface LoanContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Loan data
  client: Client | undefined;
  amount: number;
  interest: number;
  weeks: number;
  frequency: string;
  loanType: LoanType;
  closingCost: number;
  closingCostMode: ClosingCostMode;
  startDate: string;
  firstPaymentDate: string;
  schedulePreview: InstallmentPreview[];
  // Computed
  netDisbursement: number;
  totalToPay: number;
  installmentAmount: number;
  currency: 'DOP' | 'USD';
  // Company
  companySettings: CompanySettings;
  // Item financing
  itemPrice?: number;
  downPayment?: number;
  downPaymentMode?: string;
  financedAmount?: number;
  customContractId?: string;
}

const fmt = (n: number, cur = 'DOP') =>
  `${cur === 'USD' ? '$' : 'RD$'} ${n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) => {
  if (!d) return '';
  const date = new Date(d.includes('T') ? d : d + 'T12:00:00');
  return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const RECEIPT_ID = () => `CTR-${Date.now().toString(36).toUpperCase().slice(-8)}`;

export const LoanContractModal: React.FC<LoanContractModalProps> = ({
  isOpen, onClose, client, amount, interest, weeks, frequency, loanType,
  closingCost, closingCostMode, startDate, firstPaymentDate, schedulePreview,
  netDisbursement, totalToPay, installmentAmount, currency, companySettings,
  itemPrice, downPayment, downPaymentMode, financedAmount, customContractId
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const contractId = customContractId || useRef(RECEIPT_ID()).current;

  const isAmortized = loanType.includes('Amortizado') || loanType.includes('Financiamiento');
  const isRedito = loanType.includes('Rédito') || loanType.includes('Pagaré');
  const isFinancing = loanType.includes('Financiamiento');

  const totalInterestAmount = Math.max(0, totalToPay - amount);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!printRef.current) return;
    try {
      window.scrollTo(0, 0);
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Contrato-${(client?.name || 'Prestamo').replace(/\s+/g, '_')}-${contractId}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
    }
  }, [client, contractId]);

  const handleDownloadImage = useCallback(async () => {
    if (!printRef.current) return;
    try {
      window.scrollTo(0, 0);
      const { default: html2canvas } = await import('html2canvas');
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1024,
      });

      const link = document.createElement('a');
      link.download = `Contrato-${(client?.name || 'Prestamo').replace(/\s+/g, '_')}-${contractId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Error generando imagen:", err);
    }
  }, [client, contractId]);

  const handleWhatsApp = useCallback(() => {
    const txt = encodeURIComponent(
      `📋 *Resumen de Préstamo - ${companySettings.name}*\n\n` +
      `👤 Cliente: ${client?.name} ${client?.lastName || ''}\n` +
      `💰 Capital Solicitado: ${fmt(amount, currency)}\n` +
      `📈 Interés Total: ${fmt(totalInterestAmount, currency)}\n` +
      `💵 Neto Entregado: ${fmt(netDisbursement, currency)}\n` +
      `📊 Tasa: ${interest}%\n` +
      `📅 Plazo: ${weeks} cuotas (${frequency})\n` +
      `💵 Cuota Periódica: ${fmt(installmentAmount, currency)}\n` +
      `🧾 TOTAL A PAGAR: ${fmt(totalToPay, currency)}\n\n` +
      `Primer pago: ${fmtDate(firstPaymentDate)}\n` +
      `N° Contrato: ${contractId}`
    );
    window.open(`https://wa.me/?text=${txt}`, '_blank');
  }, [client, amount, interest, weeks, frequency, installmentAmount, totalToPay, totalInterestAmount, netDisbursement, firstPaymentDate, currency, companySettings, contractId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Print CSS Isolation */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #loan-contract-print-root, #loan-contract-print-root * {
            visibility: visible !important;
          }
          #loan-contract-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          #loan-contract-modal-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Overlay + Modal */}
      <div id="loan-contract-modal-overlay" className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden border border-slate-100">

          {/* Action Bar */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 print:hidden">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Documento Oficial de Préstamo</h2>
              <p className="text-xs text-slate-400 font-mono">N° {contractId}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleWhatsApp} title="Compartir por WhatsApp" className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button onClick={handleDownloadImage} title="Descargar como imagen PNG" className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imagen</span>
              </button>
              <button onClick={handleDownloadPDF} title="Descargar PDF" className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button onClick={handlePrint} title="Imprimir" className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Contract Document */}
          <div id="loan-contract-print-root" ref={printRef} className="bg-white p-8 sm:p-12 font-sans text-slate-800 leading-relaxed" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>

            {/* Company Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-200">
              <div className="flex items-center gap-4">
                {companySettings.logoUrl ? (
                  <img src={companySettings.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-xl" crossOrigin="anonymous" />
                ) : (
                  <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{companySettings.name}</h1>
                  {companySettings.slogan && <p className="text-xs text-slate-400 italic">{companySettings.slogan}</p>}
                  {companySettings.rnc && <p className="text-xs text-slate-500 font-bold mt-0.5">RNC: {companySettings.rnc}</p>}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-1">
                {companySettings.phone && (
                  <div className="flex items-center gap-1 justify-end font-semibold text-slate-700">
                    <Phone className="w-3 h-3 text-indigo-500" /> {companySettings.phone}
                  </div>
                )}
                {companySettings.email && (
                  <div className="flex items-center gap-1 justify-end">
                    <Mail className="w-3 h-3 text-indigo-500" /> {companySettings.email}
                  </div>
                )}
                {companySettings.address && (
                  <div className="flex items-center gap-1 justify-end">
                    <MapPin className="w-3 h-3 text-indigo-500" /> {companySettings.address}
                  </div>
                )}
              </div>
            </div>

            {/* Contract Title */}
            <div className="text-center mb-8 bg-slate-50 py-4 px-6 rounded-2xl border border-slate-100">
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
                {isFinancing ? 'Contrato de Financiamiento' : isRedito ? 'Pagaré Abierto' : 'Contrato de Préstamo'}
              </h2>
              <div className="flex items-center justify-center gap-4 mt-1.5 text-xs text-slate-500">
                <span>N° Contrato: <strong className="text-indigo-600 font-mono">{contractId}</strong></span>
                <span>•</span>
                <span>Emisión: <strong className="text-slate-800">{fmtDate(startDate || new Date().toISOString().split('T')[0])}</strong></span>
              </div>
            </div>

            {/* Borrower Details */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-200/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-3">Datos del Prestatario</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Nombre Completo</span>
                  <p className="font-black text-slate-900 text-base">{client?.name} {client?.lastName || ''}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Cédula / Documento</span>
                  <p className="font-bold text-slate-800 font-mono">{client?.cedula || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Teléfono de Contacto</span>
                  <p className="font-bold text-slate-800">{client?.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Dirección Residencia</span>
                  <p className="font-bold text-slate-800 truncate">{client?.address || '—'}</p>
                </div>
              </div>
            </div>

            {/* Comprehensive Financial Breakdown */}
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-3">Desglose Financiero Integral</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/60 text-sm">
                
                {/* Left Column */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Tipo de Operación</span>
                    <span className="font-bold text-slate-900">{loanType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Capital Solicitado</span>
                    <span className="font-bold text-slate-900">{fmt(amount, currency)}</span>
                  </div>
                  
                  {isFinancing && (
                    <>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                        <span className="text-xs text-slate-500 font-medium">Precio de Venta</span>
                        <span className="font-bold text-slate-800">{fmt(itemPrice || 0, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                        <span className="text-xs text-slate-500 font-medium">Inicial Pagado</span>
                        <span className="font-bold text-emerald-600">{fmt(downPayment || 0, currency)} ({downPaymentMode || 'Efectivo'})</span>
                      </div>
                    </>
                  )}

                  {closingCost > 0 && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                      <span className="text-xs text-amber-700 font-medium">Gastos de Cierre ({closingCostMode})</span>
                      <span className="font-bold text-amber-700">
                        {closingCostMode === 'Descontado' ? '-' : '+'}{fmt(closingCost, currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-black uppercase">Monto Neto a Entregar</span>
                    <span className="font-black text-emerald-700 text-base">{fmt(netDisbursement, currency)}</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Tasa de Interés</span>
                    <span className="font-bold text-slate-900">{interest}% ({frequency})</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-rose-600 font-medium">Interés Total a Pagar</span>
                    <span className="font-bold text-rose-600">{fmt(totalInterestAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Plazo de Cuotas</span>
                    <span className="font-bold text-slate-900">{weeks} cuotas ({frequency})</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Primer Pago</span>
                    <span className="font-bold text-slate-900">{fmtDate(firstPaymentDate)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 bg-indigo-50 px-3 rounded-xl border border-indigo-200">
                    <span className="text-xs text-indigo-800 font-black uppercase">{isAmortized ? 'Cuota Fija' : 'Interés Periódico'}</span>
                    <span className="font-black text-indigo-700 text-base">{fmt(installmentAmount, currency)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Highlighted Total Banner */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 mb-8 text-center text-white shadow-lg">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">
                {isRedito ? 'Monto Principal a Mantener en Pagaré' : 'MONTO TOTAL NETO A PAGAR POR EL CLIENTE'}
              </p>
              <p className="text-4xl font-black">{fmt(totalToPay, currency)}</p>
              <p className="text-xs text-indigo-200/90 mt-1 font-medium">
                (Capital {fmt(amount, currency)} + Intereses {fmt(totalInterestAmount, currency)})
              </p>
            </div>

            {/* Installment Table Preview */}
            {isAmortized && schedulePreview.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-3">
                  Tabla de Amortización Completa ({schedulePreview.length} Cuotas)
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2.5 px-3 text-left font-black uppercase">N°</th>
                        <th className="py-2.5 px-3 text-left font-black uppercase">Fecha Cobro</th>
                        <th className="py-2.5 px-3 text-right font-black uppercase">Capital</th>
                        <th className="py-2.5 px-3 text-right font-black uppercase">Interés</th>
                        <th className="py-2.5 px-3 text-right font-black uppercase">Cuota</th>
                        <th className="py-2.5 px-3 text-right font-black uppercase">Balance Pendiente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedulePreview.map((row, i) => (
                        <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                          <td className="py-2 px-3 font-bold text-slate-400">{row.installmentNumber}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{fmtDate(row.dueDate)}</td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            {row.principal != null ? fmt(row.principal, currency) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-rose-600">
                            {row.interest != null ? fmt(row.interest, currency) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-indigo-700">
                            {fmt(row.total, currency)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-500">
                            {row.balance != null ? fmt(row.balance, currency) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                        <td colSpan={4} className="py-2.5 px-3 font-black text-indigo-900 text-xs uppercase">TOTALES GENERALES</td>
                        <td className="py-2.5 px-3 text-right font-black text-indigo-700 text-sm">
                          {fmt(totalToPay, currency)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {companySettings.termsAndConditions && (
              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Términos y Condiciones Contractuales</p>
                <p>{companySettings.termsAndConditions}</p>
              </div>
            )}

            {/* Signatures Block */}
            <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-slate-200">
              <div className="text-center">
                <div className="border-b-2 border-slate-400 pb-2 mb-2 h-14" />
                <p className="text-xs font-black text-slate-800">Firma del Prestatario</p>
                <p className="text-xs text-slate-600">{client?.name} {client?.lastName || ''}</p>
                <p className="text-xs text-slate-400 font-mono">{client?.cedula || ''}</p>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-slate-400 pb-2 mb-2 h-14" />
                <p className="text-xs font-black text-slate-800">Firma del Prestamista / Autorizado</p>
                <p className="text-xs text-slate-600">{companySettings.name}</p>
                <p className="text-xs text-slate-400 font-mono">RNC: {companySettings.rnc || '—'}</p>
              </div>
            </div>

            {/* Document Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
              <p>Documento oficial emitido por {companySettings.name} • N° Contrato {contractId} • Fecha {new Date().toLocaleDateString('es-DO')}</p>
            </div>

          </div>{/* end printable document */}
        </div>
      </div>
    </>
  );
};

export default LoanContractModal;
