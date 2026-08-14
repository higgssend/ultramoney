import React, { useState, useMemo } from 'react';
import { 
  Printer, X, Smartphone, Copy, Check, Download, Share2, 
  QrCode, Sliders, Receipt, RefreshCw, FileText
} from 'lucide-react';
import { useSettings } from '../context/StoreContext';
import { formatLoanId, formatReceiptId, PaymentMethod } from '../types';
import { generateQRCodeSVG } from '../utils/qrGenerator';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export interface ThermalReceiptData {
  receiptNo: string;
  date: string;
  time?: string;
  clientName: string;
  clientCedula?: string;
  clientPhone?: string;
  loanId: string;
  installmentInfo?: string;
  amountPaid: number;
  capitalAmount?: number;
  interestAmount?: number;
  lateFeeAmount?: number;
  discountAmount?: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: PaymentMethod | string;
  bankName?: string;
  referenceNo?: string;
  cashierName: string;
  nextPaymentDate?: string;
  notes?: string;
  transactionId?: string;
  clientId?: string;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ThermalReceiptData;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const { companySettings } = useSettings();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Digital verification URL for the QR code
  const verificationUrl = useMemo(() => {
    const origin = window.location.origin;
    if (data.transactionId) {
      return `${origin}/recibo/${data.transactionId}`;
    }
    if (data.clientId) {
      return `${origin}/portal/${data.clientId}`;
    }
    return `${origin}/recibo/${data.receiptNo}`;
  }, [data]);

  // Generate QR Code SVG string
  const qrSvgString = useMemo(() => {
    return generateQRCodeSVG(verificationUrl, paperWidth === '58mm' ? 120 : 140);
  }, [verificationUrl, paperWidth]);

  if (!isOpen) return null;

  // Direct Thermal Printing handler
  const handlePrint = () => {
    const receiptElement = document.getElementById('thermal-receipt-printable-content');
    if (!receiptElement) return;

    const widthCss = paperWidth === '58mm' ? '58mm' : '80mm';
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) {
      toast.error('Por favor permite las ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket_${data.receiptNo}</title>
          <style>
            @page {
              size: ${widthCss} auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: ${paperWidth === '58mm' ? '8px 4px' : '14px 8px'};
              font-family: 'Courier New', Courier, monospace, sans-serif;
              font-size: ${paperWidth === '58mm' ? '11px' : '13px'};
              line-height: 1.25;
              color: #000000;
              background: #ffffff;
              width: ${widthCss};
              max-width: ${widthCss};
              box-sizing: border-box;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000000; margin: 6px 0; }
            .double-divider { border-top: 2px double #000000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .qr-container { display: flex; justify-content: center; margin: 8px 0; }
            .qr-container svg { width: ${paperWidth === '58mm' ? '110px' : '130px'}; height: auto; }
            @media print {
              html, body {
                width: ${widthCss};
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${receiptElement.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Generate plain text monospace receipt for Bluetooth raw printer apps (RawBT / ESC/POS)
  const generateMonospaceText = (): string => {
    const compName = companySettings?.name || 'ULTRAMONEY';
    const compRnc = companySettings?.rnc ? `RNC: ${companySettings.rnc}` : '';
    const compPhone = companySettings?.phone ? `TEL: ${companySettings.phone}` : '';
    const sep = paperWidth === '58mm' ? '--------------------------------' : '------------------------------------------------';
    const dsep = paperWidth === '58mm' ? '================================' : '================================================';

    const lines: string[] = [
      compName,
      compRnc,
      compPhone,
      sep,
      'COMPROBANTE OFICIAL DE PAGO',
      `RECIBO: #${data.receiptNo}`,
      `FECHA:  ${data.date} ${data.time || ''}`,
      `CAJERO: ${data.cashierName}`,
      sep,
      `CLIENTE:  ${data.clientName}`,
      data.clientCedula ? `DOC/CED:  ${data.clientCedula}` : '',
      `PRESTAMO: #${formatLoanId(data.loanId)}`,
      data.installmentInfo ? `CUOTA:    ${data.installmentInfo}` : '',
      sep,
      data.capitalAmount ? `CAPITAL:        RD$ ${data.capitalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      data.interestAmount ? `INTERES:        RD$ ${data.interestAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      data.lateFeeAmount ? `MORA/RECARGO:   RD$ ${data.lateFeeAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      data.discountAmount ? `DESCUENTO:     -RD$ ${data.discountAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      dsep,
      `TOTAL PAGADO:   RD$ ${data.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      dsep,
      `METODO: ${data.paymentMethod} ${data.referenceNo ? `(Ref: #${data.referenceNo})` : ''}`,
      sep,
      `BAL. ANTERIOR:  RD$ ${data.previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `NUEVO BALANCE:  RD$ ${data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      data.nextPaymentDate ? `PROXIMO PAGO:   ${data.nextPaymentDate}` : '',
      sep,
      'Verificar recibo en linea:',
      verificationUrl,
      sep,
      'Gracias por su pago puntual.',
      'Documento emitido electronicamente.'
    ];

    return lines.filter(Boolean).join('\n');
  };

  // Copy monospace raw text for Bluetooth printing
  const handleCopyMonospaceText = () => {
    const rawText = generateMonospaceText();
    navigator.clipboard.writeText(rawText);
    setCopiedText(true);
    toast.success('Texto monospace copiado (listo para apps Bluetooth como RawBT)');
    setTimeout(() => setCopiedText(false), 2500);
  };

  // WhatsApp formatted share
  const handleShareWhatsApp = () => {
    const phone = (data.clientPhone || '').replace(/\D/g, '');
    const message = `*🧾 COMPROBANTE DE PAGO - ${companySettings?.name || 'ULTRAMONEY'}*\n\n` +
      `📄 *Recibo:* #${data.receiptNo}\n` +
      `📅 *Fecha:* ${data.date}\n` +
      `👤 *Cliente:* ${data.clientName}\n` +
      `💰 *Préstamo:* #${formatLoanId(data.loanId)}\n` +
      (data.installmentInfo ? `🔢 *Cuota:* ${data.installmentInfo}\n` : '') +
      `--------------------------------\n` +
      `💵 *TOTAL PAGADO: RD$ ${data.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}*\n` +
      `💳 *Método:* ${data.paymentMethod}\n` +
      `--------------------------------\n` +
      `📊 *Nuevo Balance:* RD$ ${data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n` +
      (data.nextPaymentDate ? `🗓️ *Próximo Pago:* ${data.nextPaymentDate}\n` : '') +
      `\n🔗 *Ver Recibo Oficial con Código QR:*\n${verificationUrl}\n\n` +
      `_¡Gracias por su pago puntual!_`;

    const encoded = encodeURIComponent(message);
    if (phone) {
      window.open(`https://wa.me/${phone.startsWith('1') ? phone : `1${phone}`}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Download image PNG
  const handleDownloadPNG = async () => {
    const element = document.getElementById('thermal-receipt-preview-card');
    if (!element) return;
    setIsExportingImage(true);
    try {
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = img;
      link.download = `Ticket_${data.receiptNo}_${paperWidth}.png`;
      link.click();
      toast.success('Ticket descargado en imagen PNG de alta calidad');
    } catch (e) {
      console.error('Error exporting thermal image:', e);
      toast.error('Error al generar imagen del ticket');
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header with paper width switch */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Modo Impresión Térmica Directa (POS)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full font-bold">
                  Calle & Ventanilla
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Formato ultra-compacto para impresoras Bluetooth móviles y código QR
              </p>
            </div>
          </div>

          {/* Width Selector */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  paperWidth === '58mm'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="58mm - Impresora portátil Bluetooth de bolsillo"
              >
                58 mm (Móvil)
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  paperWidth === '80mm'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="80mm - Impresora POS de mostrador"
              >
                80 mm (POS)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Ticket Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-950/80">
          <div
            id="thermal-receipt-preview-card"
            style={{ width: paperWidth === '58mm' ? '300px' : '380px' }}
            className="bg-white text-slate-950 rounded-xl shadow-2xl p-5 border border-slate-300 font-mono text-xs transition-all select-none"
          >
            {/* Hidden printable template container (rendered identically) */}
            <div id="thermal-receipt-printable-content" className="space-y-2">
              {/* Header */}
              <div className="text-center space-y-0.5">
                <h1 className="font-extrabold text-sm uppercase tracking-tight text-black">
                  {companySettings?.name || 'ULTRAMONEY'}
                </h1>
                {companySettings?.rnc && (
                  <p className="text-[11px]">RNC: {companySettings.rnc}</p>
                )}
                {companySettings?.phone && (
                  <p className="text-[11px]">TEL: {companySettings.phone}</p>
                )}
                {companySettings?.address && (
                  <p className="text-[10px]">{companySettings.address}</p>
                )}
                <div className="border-t border-dashed border-black my-2" />
                <p className="font-extrabold text-[12px] uppercase">
                  COMPROBANTE OFICIAL DE PAGO
                </p>
                <p className="font-bold text-[11px]">RECIBO: #{data.receiptNo}</p>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>FECHA: {data.date}</span>
                  <span>{data.time || new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-left text-[10px]">
                  <span>CAJERO: {data.cashierName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Client & Loan */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="font-bold">CLIENTE:</span>
                  <span className="font-bold text-right truncate max-w-[170px]">{data.clientName}</span>
                </div>
                {data.clientCedula && (
                  <div className="flex justify-between text-[10px]">
                    <span>DOC/CED:</span>
                    <span>{data.clientCedula}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>PRÉSTAMO:</span>
                  <span className="font-bold">#{formatLoanId(data.loanId)}</span>
                </div>
                {data.installmentInfo && (
                  <div className="flex justify-between text-[10px]">
                    <span>CUOTA:</span>
                    <span>{data.installmentInfo}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Breakdown */}
              <div className="space-y-1 text-[11px]">
                {data.capitalAmount !== undefined && data.capitalAmount > 0 && (
                  <div className="flex justify-between">
                    <span>CAPITAL:</span>
                    <span>RD$ {data.capitalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {data.interestAmount !== undefined && data.interestAmount > 0 && (
                  <div className="flex justify-between">
                    <span>INTERÉS:</span>
                    <span>RD$ {data.interestAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {data.lateFeeAmount !== undefined && data.lateFeeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>MORA/RECARGO:</span>
                    <span>RD$ {data.lateFeeAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {data.discountAmount !== undefined && data.discountAmount > 0 && (
                  <div className="flex justify-between text-black font-semibold">
                    <span>DESCUENTO:</span>
                    <span>-RD$ {data.discountAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="border-t-2 border-b-2 border-black py-1 my-1 flex justify-between font-extrabold text-[13px]">
                  <span>TOTAL PAGADO:</span>
                  <span>RD$ {data.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span>FORMA DE PAGO:</span>
                  <span className="font-bold uppercase">{data.paymentMethod}</span>
                </div>
                {data.referenceNo && (
                  <div className="flex justify-between text-[10px]">
                    <span>REF / AUT:</span>
                    <span className="font-mono">#{data.referenceNo}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Balances */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>BALANCE ANTERIOR:</span>
                  <span>RD$ {data.previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-extrabold text-[11px]">
                  <span>NUEVO BALANCE:</span>
                  <span>RD$ {data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                {data.nextPaymentDate && (
                  <div className="flex justify-between pt-0.5">
                    <span>PRÓXIMO VENCIMIENTO:</span>
                    <span className="font-bold">{data.nextPaymentDate}</span>
                  </div>
                )}
              </div>

              {/* Scannable QR Code */}
              <div className="border-t border-dashed border-black my-2 pt-2 text-center">
                <div 
                  className="flex justify-center my-1"
                  dangerouslySetInnerHTML={{ __html: qrSvgString }}
                />
                <p className="text-[9px] font-bold tracking-tight">
                  Escanea para ver tu recibo digital oficial
                </p>
                <p className="text-[8px] text-slate-600 truncate max-w-[240px] mx-auto">
                  {verificationUrl}
                </p>
              </div>

              {/* Footer Note */}
              <div className="border-t border-dashed border-black my-2 pt-1 text-center text-[9px] space-y-0.5">
                <p className="font-bold">¡GRACIAS POR SU PAGO PUNTUAL!</p>
                <p className="italic">Documento fiscal emitido electrónicamente.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket Térmico</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyMonospaceText}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
              title="Copiar texto plano monospace para RawBT o terminal Bluetooth"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copiado (RawBT)' : 'Copiar RawBT'}</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={isExportingImage}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
