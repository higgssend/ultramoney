import React, { useRef, useCallback } from 'react';
import { X, Printer, Download, Share2, Image as ImageIcon, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { LoanEngine, InstallmentPreview } from '../../utils/LoanEngine';
import { LoanType, ClosingCostMode, CompanySettings, Client, Collateral, Loan, formatContractId, Guarantor } from '../../types';
import { useSettings } from '../../context/StoreContext';

export interface LoanContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan?: Loan;
  // Loan data
  client?: Client | undefined;
  amount?: number;
  interest?: number;
  weeks?: number;
  frequency?: string;
  loanType?: LoanType;
  closingCost?: number;
  closingCostMode?: ClosingCostMode;
  startDate?: string;
  firstPaymentDate?: string;
  schedulePreview?: InstallmentPreview[];
  // Computed
  netDisbursement?: number;
  totalToPay?: number;
  installmentAmount?: number;
  currency?: 'DOP' | 'USD';
  // Company
  companySettings?: CompanySettings;
  // Item financing
  itemPrice?: number;
  downPayment?: number;
  downPaymentMode?: string;
  financedAmount?: number;
  customContractId?: string;
  collateral?: Collateral;
  guarantors?: Guarantor[];
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
  isOpen, onClose, loan, client, amount, interest, weeks, frequency, loanType,
  closingCost, closingCostMode, startDate, firstPaymentDate, schedulePreview,
  netDisbursement, totalToPay, installmentAmount, currency, companySettings,
  itemPrice, downPayment, downPaymentMode, financedAmount, customContractId,
  collateral, guarantors
}) => {
  const settingsCtx = useSettings();
  const activeCompanySettings = companySettings || settingsCtx.companySettings;

  const effectiveClient = client || (loan ? {
    id: loan.clientId,
    name: loan.clientName,
    cedula: loan.clientCedula || 'S/N',
    phone: loan.clientPhone || 'N/A',
    address: loan.clientAddress || 'N/A'
  } as Client : undefined);

  const effectiveAmount = amount ?? loan?.amount ?? 0;
  const effectiveInterest = interest ?? loan?.interestRate ?? 0;
  const effectiveWeeks = weeks ?? loan?.durationWeeks ?? loan?.installments ?? 1;
  const effectiveFrequency = frequency ?? loan?.frequency ?? 'Mensual';
  const effectiveLoanType: LoanType = (loanType ?? loan?.loanType ?? 'Amortizado (Cuota Fija)') as LoanType;
  const effectiveClosingCost = closingCost ?? loan?.closingCost ?? 0;
  const effectiveClosingCostMode: ClosingCostMode = (closingCostMode ?? loan?.closingCostMode ?? 'Descontado') as ClosingCostMode;
  const effectiveStartDate = startDate ?? loan?.startDate ?? new Date().toISOString().split('T')[0];
  const effectiveFirstPaymentDate = firstPaymentDate ?? loan?.firstPaymentDate ?? loan?.nextPaymentDate ?? effectiveStartDate;

  const effectiveItemPrice = itemPrice ?? loan?.itemPrice;
  const effectiveDownPayment = downPayment ?? loan?.downPayment;
  const effectiveDownPaymentMode = downPaymentMode ?? loan?.downPaymentMode;

  const effectiveSchedulePreview: InstallmentPreview[] = (schedulePreview && schedulePreview.length > 0)
    ? schedulePreview
    : (loan ? LoanEngine.calculateSchedule(
        loan.amount,
        loan.interestRate,
        loan.durationWeeks || loan.installments || 1,
        loan.frequency,
        loan.startDate,
        loan.firstPaymentDate,
        loan.loanType,
        loan.closingCost,
        loan.closingCostMode,
        loan.itemPrice,
        loan.downPayment,
        loan.downPaymentMode
      ).installments : []);

  const effectiveNetDisbursement = netDisbursement ?? loan?.netDisbursementAmount ?? effectiveAmount;
  const effectiveTotalToPay = (totalToPay && totalToPay > 0) ? totalToPay : (loan?.totalToPay ?? (effectiveAmount + (effectiveAmount * (effectiveInterest / 100))));
  const effectiveInstallmentAmount = installmentAmount ?? loan?.installmentAmount ?? (effectiveWeeks > 0 ? Math.round(effectiveTotalToPay / effectiveWeeks) : 0);
  const effectiveCurrency = currency ?? loan?.currency ?? activeCompanySettings.currency ?? 'DOP';
  const effectiveContractId = customContractId || (loan ? formatContractId(loan.id) : undefined);
  const effectiveCollateral = collateral || (loan?.collaterals?.[0] || (loan?.collateralType ? { type: loan.collateralType as Collateral['type'], description: loan.collateralDescription || '', refNumber: loan.collateralRefNumber || '' } : undefined));
  const effectiveGuarantors: Guarantor[] = (guarantors && guarantors.length > 0)
    ? guarantors
    : (loan?.guarantors && loan.guarantors.length > 0)
      ? loan.guarantors
      : (loan?.collateral && typeof loan.collateral === 'object' && Array.isArray((loan.collateral as Record<string, unknown>).guarantors))
        ? ((loan.collateral as Record<string, unknown>).guarantors as Guarantor[])
        : [];

  const printRef = useRef<HTMLDivElement>(null);
  const contractIdRef = useRef(RECEIPT_ID());
  const contractId = effectiveContractId || contractIdRef.current;

  const isAmortized = effectiveLoanType.includes('Amortizado') || effectiveLoanType.includes('Financiamiento');
  const isRedito = effectiveLoanType.includes('Rédito') || effectiveLoanType.includes('Pagaré');
  const isFinancing = effectiveLoanType.includes('Financiamiento');

  const effectivePrincipal = (isFinancing && effectiveItemPrice && effectiveItemPrice > 0) ? ((effectiveDownPayment && effectiveDownPayment > 0) ? Math.max(0, effectiveItemPrice - effectiveDownPayment) : effectiveItemPrice) : (effectiveAmount || 0);
  const effectiveTotalInterest = effectiveInterest > 0 ? effectivePrincipal * (effectiveInterest / 100) : 0;
  const computedTotalToPay = (effectiveTotalToPay && effectiveTotalToPay > 0) ? effectiveTotalToPay : (effectivePrincipal + effectiveTotalInterest);
  const computedInstallment = (effectiveInstallmentAmount && effectiveInstallmentAmount > 0) ? effectiveInstallmentAmount : (computedTotalToPay / (effectiveWeeks || 1));
  const totalInterestAmount = Math.max(0, computedTotalToPay - effectivePrincipal);

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

      pdf.save(`Contrato-${(effectiveClient?.name || 'Prestamo').replace(/\s+/g, '_')}-${contractId}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
    }
  }, [effectiveClient, contractId]);

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
      link.download = `Contrato-${(effectiveClient?.name || 'Prestamo').replace(/\s+/g, '_')}-${contractId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Error generando imagen:", err);
    }
  }, [effectiveClient, contractId]);

  const handleWhatsApp = useCallback(() => {
    const txt = encodeURIComponent(
      `📋 *Resumen de Préstamo - ${activeCompanySettings.name}*\n\n` +
      `👤 Cliente: ${effectiveClient?.name} ${effectiveClient?.lastName || ''}\n` +
      `💰 Capital Solicitado: ${fmt(effectiveAmount, effectiveCurrency)}\n` +
      `📈 Interés Total: ${fmt(totalInterestAmount, effectiveCurrency)}\n` +
      `💵 Neto Entregado: ${fmt(effectiveNetDisbursement, effectiveCurrency)}\n` +
      `📊 Tasa: ${effectiveInterest}%\n` +
      `📅 Plazo: ${effectiveWeeks} cuotas (${effectiveFrequency})\n` +
      `💵 Cuota Periódica: ${fmt(computedInstallment, effectiveCurrency)}\n` +
      `🧾 TOTAL A PAGAR: ${fmt(computedTotalToPay, effectiveCurrency)}\n\n` +
      `Primer pago: ${fmtDate(effectiveFirstPaymentDate)}\n` +
      `N° Contrato: ${contractId}`
    );
    window.open(`https://wa.me/?text=${txt}`, '_blank');
  }, [effectiveClient, effectiveAmount, effectiveInterest, effectiveWeeks, effectiveFrequency, computedInstallment, computedTotalToPay, totalInterestAmount, effectiveNetDisbursement, effectiveFirstPaymentDate, effectiveCurrency, activeCompanySettings, contractId]);

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
          <div id="loan-contract-print-root" ref={printRef} className="bg-white p-4 sm:p-8 md:p-12 font-sans text-slate-800 leading-relaxed overflow-x-auto" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>

            {/* Company Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-slate-200">
              <div className="flex items-center gap-4">
                {activeCompanySettings.logoUrl ? (
                  <img src={activeCompanySettings.logoUrl} alt="Logo" className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-xl" crossOrigin="anonymous" />
                ) : (
                  <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{activeCompanySettings.name}</h1>
                  {activeCompanySettings.slogan && <p className="text-xs text-slate-400 italic">{activeCompanySettings.slogan}</p>}
                  {activeCompanySettings.rnc && <p className="text-xs text-slate-500 font-bold mt-0.5">RNC: {activeCompanySettings.rnc}</p>}
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
                {activeCompanySettings.phone && (
                  <div className="flex items-center gap-1 sm:justify-end font-semibold text-slate-700">
                    <Phone className="w-3 h-3 text-indigo-500" /> {activeCompanySettings.phone}
                  </div>
                )}
                {activeCompanySettings.email && (
                  <div className="flex items-center gap-1 sm:justify-end">
                    <Mail className="w-3 h-3 text-indigo-500" /> {activeCompanySettings.email}
                  </div>
                )}
                {activeCompanySettings.address && (
                  <div className="flex items-center gap-1 sm:justify-end">
                    <MapPin className="w-3 h-3 text-indigo-500" /> {activeCompanySettings.address}
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
                <span>Emisión: <strong className="text-slate-800">{fmtDate(effectiveStartDate || new Date().toISOString().split('T')[0])}</strong></span>
              </div>
            </div>

            {/* Borrower Details */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-200/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-3">Datos del Prestatario</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Nombre Completo</span>
                  <p className="font-black text-slate-900 text-base">{effectiveClient?.name} {effectiveClient?.lastName || ''}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Cédula / Documento</span>
                  <p className="font-bold text-slate-800 font-mono">{effectiveClient?.cedula || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Teléfono de Contacto</span>
                  <p className="font-bold text-slate-800">{effectiveClient?.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Dirección Residencia</span>
                  <p className="font-bold text-slate-800 truncate">{effectiveClient?.address || '—'}</p>
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
                    <span className="font-bold text-slate-900">{effectiveLoanType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Capital Solicitado</span>
                    <span className="font-bold text-slate-900">{fmt(effectiveAmount, effectiveCurrency)}</span>
                  </div>
                  
                  {isFinancing && (
                    <>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                        <span className="text-xs text-slate-500 font-medium">Precio de Venta</span>
                        <span className="font-bold text-slate-800">{fmt(effectiveItemPrice || 0, effectiveCurrency)}</span>
                      </div>
                      {effectiveDownPayment && effectiveDownPayment > 0 ? (
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                          <span className="text-xs text-slate-500 font-medium">Inicial Pagado</span>
                          <span className="font-bold text-emerald-600">{fmt(effectiveDownPayment, effectiveCurrency)} ({effectiveDownPaymentMode || 'Efectivo'})</span>
                        </div>
                      ) : null}
                    </>
                  )}

                  {effectiveClosingCost > 0 && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                      <span className="text-xs text-amber-700 font-medium">Gastos de Cierre ({effectiveClosingCostMode})</span>
                      <span className="font-bold text-amber-700">
                        {effectiveClosingCostMode === 'Descontado' ? '-' : '+'}{fmt(effectiveClosingCost, effectiveCurrency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-black uppercase">Monto Neto a Entregar</span>
                    <span className="font-black text-emerald-700 text-base">{fmt(effectiveNetDisbursement || effectivePrincipal, effectiveCurrency)}</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Tasa de Interés</span>
                    <span className="font-bold text-slate-900">{effectiveInterest}% ({effectiveFrequency})</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-rose-600 font-medium">Interés Total a Pagar</span>
                    <span className="font-bold text-rose-600">{fmt(totalInterestAmount, effectiveCurrency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Plazo de Cuotas</span>
                    <span className="font-bold text-slate-900">
                      {isRedito ? 'Indefinido (Pagaré Abierto)' : `${effectiveWeeks} cuotas (${effectiveFrequency})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500 font-medium">Primer Pago</span>
                    <span className="font-bold text-slate-900">{fmtDate(effectiveFirstPaymentDate)} ({fmt(computedInstallment, effectiveCurrency)} / {effectiveFrequency})</span>
                  </div>

                  <div className="flex justify-between items-center py-2 bg-indigo-50 px-3 rounded-xl border border-indigo-200">
                    <span className="text-xs text-indigo-800 font-black uppercase">{isAmortized ? 'Cuota Fija' : 'Interés Periódico'}</span>
                    <span className="font-black text-indigo-700 text-base">{fmt(computedInstallment, effectiveCurrency)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Collateral / Guarantee Section if present */}
            {effectiveCollateral && effectiveCollateral.type && effectiveCollateral.type !== 'Sin Garantía' && (
              <div className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-3">Garantía / Prenda Registrada</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Tipo de Garantía</span>
                    <span className="font-extrabold text-slate-900 text-sm">{effectiveCollateral.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Descripción del Bien</span>
                    <span className="font-bold text-slate-800">{effectiveCollateral.description || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Matrícula / Serie / Referencia</span>
                    <span className="font-bold text-slate-900 font-mono">{effectiveCollateral.refNumber || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Solidary Guarantors Section if present */}
            {effectiveGuarantors.length > 0 && (
              <div className="bg-indigo-50/50 rounded-2xl p-5 mb-6 border border-indigo-200/70">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1.5">
                  <span>🤝 Garantes y Codeudores Solidarios ({effectiveGuarantors.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {effectiveGuarantors.map((g, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-sm space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900 text-sm">{g.name} {g.lastName || ''}</span>
                        {g.relationship && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {g.relationship}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Cédula</span>
                          <span className="font-mono font-bold text-slate-800">{g.cedula || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Teléfono</span>
                          <span className="font-semibold text-slate-800">{g.phone || 'N/A'}</span>
                        </div>
                        {g.workplace && (
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 block font-medium">Lugar de Trabajo</span>
                            <span className="text-slate-800">{g.workplace} {g.jobPosition ? `(${g.jobPosition})` : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlighted Total Banner */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 mb-8 text-center text-white shadow-lg">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">
                {isRedito ? 'Monto Principal a Mantener en Pagaré' : 'MONTO TOTAL NETO A PAGAR POR EL CLIENTE'}
              </p>
              <p className="text-4xl font-black">{fmt(computedTotalToPay, effectiveCurrency)}</p>
              <p className="text-xs text-indigo-200/90 mt-1 font-medium">
                (Capital {fmt(effectivePrincipal, effectiveCurrency)} + Intereses {fmt(totalInterestAmount, effectiveCurrency)})
              </p>
            </div>

            {/* Installment Table Preview */}
            {isAmortized && effectiveSchedulePreview.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-3">
                  Tabla de Amortización Completa ({effectiveSchedulePreview.length} Cuotas)
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
                      {effectiveSchedulePreview.map((row, i) => (
                        <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                          <td className="py-2 px-3 font-bold text-slate-400">{row.installmentNumber}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{fmtDate(row.dueDate)}</td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            {row.principal != null ? fmt(row.principal, effectiveCurrency) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-rose-600">
                            {row.interest != null ? fmt(row.interest, effectiveCurrency) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-indigo-700">
                            {fmt(row.total, effectiveCurrency)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-500">
                            {row.balance != null ? fmt(row.balance, effectiveCurrency) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                        <td colSpan={4} className="py-2.5 px-3 font-black text-indigo-900 text-xs uppercase">TOTALES GENERALES</td>
                        <td className="py-2.5 px-3 text-right font-black text-indigo-700 text-sm">
                          {fmt(computedTotalToPay, effectiveCurrency)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {activeCompanySettings.termsAndConditions && (
              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">Términos y Condiciones Contractuales</p>
                <p>{activeCompanySettings.termsAndConditions}</p>
              </div>
            )}

            {/* Signatures Block */}
            <div className={`grid ${effectiveGuarantors.length > 0 ? (effectiveGuarantors.length === 1 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-4') : 'grid-cols-2'} gap-8 mt-12 pt-8 border-t-2 border-slate-200`}>
              <div className="text-center">
                <div className="border-b-2 border-slate-400 pb-2 mb-2 h-14" />
                <p className="text-xs font-black text-slate-800">Firma del Prestatario</p>
                <p className="text-xs text-slate-600">{effectiveClient?.name} {effectiveClient?.lastName || ''}</p>
                <p className="text-xs text-slate-400 font-mono">{effectiveClient?.cedula || ''}</p>
              </div>

              {effectiveGuarantors.map((g, idx) => (
                <div key={idx} className="text-center">
                  <div className="border-b-2 border-slate-400 pb-2 mb-2 h-14" />
                  <p className="text-xs font-black text-indigo-900">Garante Solidario #{idx + 1}</p>
                  <p className="text-xs text-slate-700 font-bold">{g.name} {g.lastName || ''}</p>
                  <p className="text-xs text-slate-400 font-mono">{g.cedula || ''}</p>
                </div>
              ))}

              <div className="text-center">
                <div className="border-b-2 border-slate-400 pb-2 mb-2 h-14" />
                <p className="text-xs font-black text-slate-800">Firma del Prestamista / Autorizado</p>
                <p className="text-xs text-slate-600">{activeCompanySettings.name}</p>
                <p className="text-xs text-slate-400 font-mono">RNC: {activeCompanySettings.rnc || '—'}</p>
              </div>
            </div>

            {/* Document Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
              <p>Documento oficial emitido por {activeCompanySettings.name} • N° Contrato {contractId} • Fecha {new Date().toLocaleDateString('es-DO')}</p>
            </div>

          </div>{/* end printable document */}
        </div>
      </div>
    </>
  );
};

export default LoanContractModal;
