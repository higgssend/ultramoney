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
}

const fmt = (n: number, cur = 'DOP') =>
  `${cur === 'USD' ? '$' : 'RD$'} ${n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) => {
  if (!d) return '';
  const date = new Date(d + 'T12:00:00');
  return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const RECEIPT_ID = () => `CTR-${Date.now().toString(36).toUpperCase().slice(-8)}`;

export const LoanContractModal: React.FC<LoanContractModalProps> = ({
  isOpen, onClose, client, amount, interest, weeks, frequency, loanType,
  closingCost, closingCostMode, startDate, firstPaymentDate, schedulePreview,
  netDisbursement, totalToPay, installmentAmount, currency, companySettings,
  itemPrice, downPayment, downPaymentMode, financedAmount
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const contractId = useRef(RECEIPT_ID()).current;

  const isAmortized = loanType.includes('Amortizado') || loanType.includes('Financiamiento');
  const isRedito = loanType.includes('Rédito') || loanType.includes('Pagaré');
  const isFinancing = loanType.includes('Financiamiento');

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!printRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Contrato-${client?.name || 'Prestamo'}-${contractId}.pdf`);
  }, [client, contractId]);

  const handleDownloadImage = useCallback(async () => {
    if (!printRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `Contrato-${client?.name || 'Prestamo'}-${contractId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [client, contractId]);

  const handleWhatsApp = useCallback(() => {
    const txt = encodeURIComponent(
      `📋 *Resumen de Préstamo - ${companySettings.name}*\n\n` +
      `👤 Cliente: ${client?.name} ${client?.lastName || ''}\n` +
      `💰 Capital: ${fmt(amount, currency)}\n` +
      `📊 Tasa: ${interest}%\n` +
      `📅 Plazo: ${weeks} cuotas (${frequency})\n` +
      `💵 Cuota: ${fmt(installmentAmount, currency)}\n` +
      `🧾 Total a Pagar: ${fmt(totalToPay, currency)}\n\n` +
      `Primer pago: ${fmtDate(firstPaymentDate)}\n` +
      `N° Contrato: ${contractId}`
    );
    window.open(`https://wa.me/?text=${txt}`, '_blank');
  }, [client, amount, interest, weeks, frequency, installmentAmount, totalToPay, firstPaymentDate, currency, companySettings, contractId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #loan-contract-print-root { display: block !important; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; }
          #loan-contract-modal-overlay { display: none !important; }
        }
      `}</style>

      {/* Overlay + Modal */}
      <div id="loan-contract-modal-overlay" className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-6 overflow-hidden">

          {/* Action Bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-3 print:hidden">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Contrato de Préstamo</h2>
              <p className="text-xs text-slate-400">N° {contractId}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleWhatsApp} title="Compartir por WhatsApp" className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button onClick={handleDownloadImage} title="Descargar como imagen PNG" className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imagen</span>
              </button>
              <button onClick={handleDownloadPDF} title="Descargar PDF" className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button onClick={handlePrint} title="Imprimir" className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all">
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Contract Body */}
          <div id="loan-contract-print-root" ref={printRef} className="bg-white p-8 md:p-12 font-sans text-slate-800" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>

            {/* Company Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-4">
                {companySettings.logoUrl ? (
                  <img src={companySettings.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-xl" crossOrigin="anonymous" />
                ) : (
                  <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-slate-800">{companySettings.name}</h1>
                  {companySettings.slogan && <p className="text-xs text-slate-400 italic">{companySettings.slogan}</p>}
                  {companySettings.rnc && <p className="text-xs text-slate-500 font-medium">RNC: {companySettings.rnc}</p>}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-1">
                {companySettings.phone && (
                  <div className="flex items-center gap-1 justify-end">
                    <Phone className="w-3 h-3" /> {companySettings.phone}
                  </div>
                )}
                {companySettings.email && (
                  <div className="flex items-center gap-1 justify-end">
                    <Mail className="w-3 h-3" /> {companySettings.email}
                  </div>
                )}
                {companySettings.address && (
                  <div className="flex items-center gap-1 justify-end">
                    <MapPin className="w-3 h-3" /> {companySettings.address}
                  </div>
                )}
              </div>
            </div>

            {/* Contract Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-700">
                {isFinancing ? 'Contrato de Financiamiento' : isRedito ? 'Pagaré Abierto' : 'Contrato de Préstamo'}
              </h2>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-400">
                <span>N° Contrato: <strong className="text-slate-700">{contractId}</strong></span>
                <span>•</span>
                <span>Fecha de Emisión: <strong className="text-slate-700">{fmtDate(startDate || new Date().toISOString().split('T')[0])}</strong></span>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Información del Prestatario</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Nombre Completo</span>
                  <p className="font-bold text-slate-800">{client?.name} {client?.lastName || ''}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Cédula / Documento</span>
                  <p className="font-bold text-slate-800">{client?.cedula || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Teléfono</span>
                  <p className="font-bold text-slate-800">{client?.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Dirección</span>
                  <p className="font-bold text-slate-800 truncate">{client?.address || '—'}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Detalles del Préstamo</h3>
              <div className="grid grid-cols-2 gap-3">

                {/* Left column */}
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: 'Tipo de Préstamo', value: loanType },
                    { label: 'Capital Solicitado', value: fmt(amount, currency) },
                    ...(isFinancing ? [
                      { label: 'Precio del Artículo', value: fmt(itemPrice || 0, currency) },
                      { label: 'Inicial / Enganche', value: `${fmt(downPayment || 0, currency)} (${downPaymentMode || 'Efectivo'})` },
                      { label: 'Monto Financiado', value: fmt(financedAmount || amount, currency) },
                    ] : []),
                    ...(closingCost > 0 ? [
                      { label: `Gastos de Cierre (${closingCostMode})`, value: `${closingCostMode === 'Descontado' ? '-' : '+'}${fmt(closingCost, currency)}` },
                    ] : []),
                    { label: 'Monto a Entregar (Neto)', value: fmt(netDisbursement, currency), highlight: true },
                  ].map((row, i) => (
                    <div key={i} className={`flex justify-between items-center py-1.5 border-b border-slate-100 ${row.highlight ? 'text-emerald-700 font-black' : ''}`}>
                      <span className="text-slate-500 text-xs">{row.label}</span>
                      <span className={`font-bold ${row.highlight ? 'text-emerald-600 text-base' : 'text-slate-800'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Right column */}
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: 'Tasa de Interés', value: `${interest}%` },
                    { label: 'Frecuencia de Pago', value: frequency },
                    { label: 'Número de Cuotas', value: `${weeks} cuotas` },
                    { label: 'Fecha de Inicio', value: fmtDate(startDate) },
                    { label: 'Primer Pago', value: fmtDate(firstPaymentDate) },
                    { label: isAmortized ? 'Cuota Fija' : 'Interés Periódico', value: fmt(installmentAmount, currency), highlight: true },
                  ].map((row, i) => (
                    <div key={i} className={`flex justify-between items-center py-1.5 border-b border-slate-100`}>
                      <span className="text-slate-500 text-xs">{row.label}</span>
                      <span className={`font-bold ${row.highlight ? 'text-indigo-600 text-base' : 'text-slate-800'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total to Pay — BIG */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 mb-8 text-center text-white">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">
                {isRedito ? 'Interés Total Estimado (Capital Permanece)' : 'Total a Pagar por el Cliente'}
              </p>
              <p className="text-4xl font-black">{fmt(totalToPay, currency)}</p>
              {!isRedito && (
                <p className="text-xs text-indigo-200 mt-1">
                  Capital {fmt(amount, currency)} + Intereses {fmt(totalToPay - amount, currency)}
                </p>
              )}
            </div>

            {/* Installment Schedule (Amortized only) */}
            {isAmortized && schedulePreview.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Cronograma de Pagos — {schedulePreview.length} Cuotas
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="py-2.5 px-3 text-left font-black text-slate-500 uppercase tracking-wide">#</th>
                        <th className="py-2.5 px-3 text-left font-black text-slate-500 uppercase tracking-wide">Fecha</th>
                        <th className="py-2.5 px-3 text-right font-black text-slate-500 uppercase tracking-wide">Capital</th>
                        <th className="py-2.5 px-3 text-right font-black text-slate-500 uppercase tracking-wide">Interés</th>
                        <th className="py-2.5 px-3 text-right font-black text-slate-500 uppercase tracking-wide">Cuota</th>
                        <th className="py-2.5 px-3 text-right font-black text-slate-500 uppercase tracking-wide">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedulePreview.map((row, i) => (
                        <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                          <td className="py-2 px-3 font-bold text-slate-400">{row.installmentNumber}</td>
                          <td className="py-2 px-3 font-medium text-slate-700">{fmtDate(row.dueDate)}</td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {row.principal != null ? `RD$ ${row.principal.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right text-rose-500">
                            {row.interest != null ? `RD$ ${row.interest.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-indigo-700">
                            RD$ {row.total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-500">
                            {row.balance != null ? `RD$ ${row.balance.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                        <td colSpan={4} className="py-2.5 px-3 font-black text-indigo-700 text-xs uppercase">TOTALES</td>
                        <td className="py-2.5 px-3 text-right font-black text-indigo-700">
                          RD$ {totalToPay.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Redito/Pagaré note */}
            {isRedito && (
              <div className="mb-8 bg-purple-50 border border-purple-200 rounded-2xl p-4 text-sm text-purple-800">
                <p className="font-bold mb-1">📋 Condiciones del Pagaré Abierto</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-purple-700">
                  <li>El cliente paga <strong>{fmt(installmentAmount, currency)}</strong> de interés cada <strong>{frequency}</strong>.</li>
                  <li>El capital de <strong>{fmt(amount, currency)}</strong> permanece constante hasta ser saldado.</li>
                  <li>El capital puede reducirse con abonos voluntarios en cualquier momento.</li>
                  <li>No hay fecha de vencimiento fija; el contrato finaliza cuando se paga el capital.</li>
                </ul>
              </div>
            )}

            {/* Terms */}
            {companySettings.termsAndConditions && (
              <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Términos y Condiciones</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{companySettings.termsAndConditions}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-10 mt-10 pt-6 border-t border-slate-200">
              <div className="text-center">
                <div className="border-b-2 border-slate-300 pb-2 mb-2 h-12" />
                <p className="text-xs font-bold text-slate-500">Firma del Prestatario</p>
                <p className="text-xs text-slate-400">{client?.name} {client?.lastName || ''}</p>
                <p className="text-xs text-slate-300">{client?.cedula || ''}</p>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-slate-300 pb-2 mb-2 h-12" />
                <p className="text-xs font-bold text-slate-500">Firma del Prestamista</p>
                <p className="text-xs text-slate-400">{companySettings.name}</p>
                <p className="text-xs text-slate-300">{companySettings.rnc || ''}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-300">
              <p>Documento generado por {companySettings.name} • N° {contractId} • {new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

          </div>{/* end printable body */}
        </div>
      </div>
    </>
  );
};

export default LoanContractModal;
