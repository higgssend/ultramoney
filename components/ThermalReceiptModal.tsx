import React, { useState, useMemo, useEffect } from 'react';
import { 
  Printer, X, Smartphone, Copy, Check, Download, Share2, 
  QrCode, Sliders, Receipt, RefreshCw, FileText
} from 'lucide-react';
import { useSettings, useClients } from '../context/StoreContext';
import { formatLoanId, formatReceiptId, PaymentMethod } from '../types';
import { formatExactTime, formatPaymentDateDisplay } from '../utils/dateUtils';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { WhatsAppIcon } from './WhatsAppIcon';

export interface ThermalReceiptData {
  receiptNo: string;
  date: string;
  time?: string;
  clientName: string;
  clientCedula?: string;
  clientPhone?: string;
  loanId: string;
  loanType?: string;
  loanAmount?: number;
  totalDebt?: number;
  installmentInfo?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  remainingInstallments?: number;
  remainingInstallmentsText?: string;
  amountPaid: number;
  capitalAmount?: number;
  interestAmount?: number;
  lateFeeAmount?: number;
  discountAmount?: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: PaymentMethod | string;
  paymentType?: string;
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
  const { clients = [] } = useClients();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const matchedClient = useMemo(() => {
    if (data.clientId) {
      return clients.find(c => c.id === data.clientId);
    }
    return clients.find(c => c.name.toLowerCase().trim() === (data.clientName || '').toLowerCase().trim());
  }, [clients, data.clientId, data.clientName]);

  const liveClientName = matchedClient 
    ? `${matchedClient.name} ${matchedClient.lastName || ''}`.trim() 
    : data.clientName;
  const liveClientCedula = matchedClient?.cedula || matchedClient?.documentId || data.clientCedula;
  const liveClientPhone = matchedClient?.phone || data.clientPhone;

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

  // Generate genuine, scan-compliant QR Code Data URL
  useEffect(() => {
    if (verificationUrl) {
      QRCode.toDataURL(verificationUrl, {
        width: paperWidth === '58mm' ? 140 : 180,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => {
          console.error('Error generando QR:', err);
        });
    }
  }, [verificationUrl, paperWidth]);

  // Is Open Loan (Rédito / Pagaré Abierto / Solo Interés)
  const isOpenLoan = useMemo(() => {
    if (!data.loanType) return false;
    const t = data.loanType.toLowerCase();
    return t.includes('rédito') || t.includes('redito') || t.includes('solo interés') || t.includes('solo interes') || t.includes('pagaré abierto') || t.includes('pagare abierto');
  }, [data.loanType]);

  const cleanLoanId = data.loanId ? data.loanId.replace(/^(#|No\.\s*)+/i, '') : '';
  const displayTime = data.time && data.time.trim() !== '' ? data.time : formatExactTime(null, true);
  const displayNextDate = data.nextPaymentDate ? formatPaymentDateDisplay(data.nextPaymentDate) : undefined;

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
            .qr-container img { width: ${paperWidth === '58mm' ? '110px' : '130px'}; height: auto; }
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
      `FECHA:  ${data.date}`,
      `HORA:   ${displayTime}`,
      `CAJERO: ${data.cashierName}`,
      sep,
      `CLIENTE:  ${liveClientName}`,
      liveClientCedula ? `DOC/CED:  ${liveClientCedula}` : '',
      liveClientPhone ? `TEL:      ${liveClientPhone}` : '',
      `PRESTAMO: #${formatLoanId(cleanLoanId)}`,
      data.loanType ? `TIPO:     ${data.loanType}` : '',
      data.loanAmount ? `CAPITAL:  RD$ ${data.loanAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      data.installmentInfo ? `CUOTA:    ${data.installmentInfo}` : '',
      !isOpenLoan && data.remainingInstallmentsText ? `RESTANTE: ${data.remainingInstallmentsText}` : '',
      sep,
      data.capitalAmount !== undefined && data.capitalAmount > 0 
        ? `ABONO CAPITAL:  RD$ ${data.capitalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` 
        : '',
      data.interestAmount !== undefined && data.interestAmount > 0 
        ? `INTERES PAGADO: RD$ ${data.interestAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` 
        : '',
      data.lateFeeAmount !== undefined && data.lateFeeAmount > 0 
        ? `MORA/RECARGO:   RD$ ${data.lateFeeAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` 
        : '',
      data.discountAmount !== undefined && data.discountAmount > 0 
        ? `DESCUENTO:     -RD$ ${data.discountAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` 
        : '',
      dsep,
      `TOTAL PAGADO:   RD$ ${data.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      dsep,
      `METODO: ${data.paymentMethod} ${data.referenceNo ? `(Ref: #${data.referenceNo})` : ''}`,
      sep,
      isOpenLoan
        ? `CAPITAL ACTIVO: RD$ ${data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
        : `BAL. ANTERIOR:  RD$ ${data.previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `SALDO PENDIENTE:RD$ ${data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      displayNextDate ? `PROXIMO PAGO:   ${displayNextDate}` : '',
      sep,
      isOpenLoan ? '* Modalidad Pagare Abierto: El pago cubre intereses. El capital permanece activo.' : '',
      'Verificar recibo en linea:',
      verificationUrl,
      sep,
      'Gracias por su pago puntual.',
      'Documento emitido electronicamente.'
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyText = () => {
    const text = generateMonospaceText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success('Texto copiado para impresora Bluetooth / RawBT');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = verificationUrl;
    const nextPayTxt = displayNextDate ? `\n*Próximo Pago*: ${displayNextDate}` : '';
    const text = `*${companySettings?.name || 'ULTRAMONEY'}*\n*Recibo de Cobro*: #${data.receiptNo}\n*Fecha*: ${data.date}\n*Hora*: ${displayTime}\n*Cliente*: ${liveClientName}\n*Total Pagado*: RD$ ${data.amountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n*Saldo Restante*: RD$ ${data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}${nextPayTxt}\n\nPuede ver su comprobante digital oficial aquí:\n${url}`;
    const targetPhone = liveClientPhone ? liveClientPhone.replace(/[^0-9]/g, '') : '';
    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone.length === 10 ? '1' + targetPhone : targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('thermal-receipt-preview-card');
    if (!element) return;
    setIsExportingPDF(true);
    try {
      toast.info('Generando PDF del ticket térmico...');
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidthMm = paperWidth === '58mm' ? 58 : 80;
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidthMm, Math.max(imgHeightMm + 8, 100)]
      });

      pdf.addImage(imgData, 'PNG', 0, 4, imgWidthMm, imgHeightMm);
      pdf.save(`Ticket_Termico_${data.receiptNo}.pdf`);
      toast.success('Ticket PDF descargado exitosamente');
    } catch (e) {
      console.error('Error generando PDF térmico:', e);
      toast.error('Error al generar PDF del ticket');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportPNG = async () => {
    const element = document.getElementById('thermal-receipt-preview-card');
    if (!element) return;
    setIsExportingImage(true);
    try {
      toast.info('Generando imagen completa del ticket...');
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          const image = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = image;
          link.download = `Ticket_${data.receiptNo}.png`;
          link.click();
          toast.success('Imagen de ticket descargada');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ticket_${data.receiptNo}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success('Imagen completa del ticket descargada');
      }, 'image/png');
    } catch (e) {
      console.error('Error al exportar imagen:', e);
      toast.error('Error al exportar imagen');
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-[99999] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Modo Impresión Térmica Directa (POS)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Calle & Ventanilla
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Formato ultra-compacto para impresoras Bluetooth móviles y código QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Width Selector Toggle */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center text-xs font-bold">
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
                  {companySettings?.name || 'ULTRAMONEY S.R.L.'}
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
                <p className="font-extrabold text-[12px] uppercase tracking-wide">
                  COMPROBANTE OFICIAL DE PAGO
                </p>
                <p className="font-black text-[12px]">RECIBO: #{data.receiptNo}</p>
                <div className="flex justify-between text-[10px] pt-1 font-bold">
                  <span>FECHA: {data.date}</span>
                  <span>HORA: {displayTime}</span>
                </div>
                <div className="text-left text-[10px]">
                  <span>CAJERO: {data.cashierName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Client & Loan Details */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="font-bold">CLIENTE:</span>
                  <span className="font-black text-right truncate max-w-[170px]">{liveClientName}</span>
                </div>
                {liveClientCedula && (
                  <div className="flex justify-between text-[10px]">
                    <span>DOC/CED:</span>
                    <span className="font-mono font-bold">{liveClientCedula}</span>
                  </div>
                )}
                {liveClientPhone && (
                  <div className="flex justify-between text-[10px]">
                    <span>TELÉFONO:</span>
                    <span>{liveClientPhone}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>PRÉSTAMO:</span>
                  <span className="font-bold font-mono">#{formatLoanId(cleanLoanId)}</span>
                </div>
                {data.loanType && (
                  <div className="flex justify-between text-[10px]">
                    <span>MODALIDAD:</span>
                    <span className="font-semibold">{data.loanType}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>TOTAL DE LA DEUDA:</span>
                  <span className="font-bold">RD$ {(data.totalDebt || data.loanAmount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                {data.installmentInfo && (
                  <div className="flex justify-between text-[10px]">
                    <span>CUOTA:</span>
                    <span className="font-bold">{data.installmentInfo}</span>
                  </div>
                )}
                {!isOpenLoan && data.remainingInstallmentsText && (
                  <div className="flex justify-between text-[10px]">
                    <span>CUOTAS RESTANTES:</span>
                    <span className="font-bold">{data.remainingInstallmentsText}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Breakdown Section */}
              <div className="space-y-1 text-[11px]">
                {/* Specific Breakdown for Open Loans vs Amortized */}
                {isOpenLoan ? (
                  <>
                    <div className="flex justify-between text-[10px]">
                      <span>CAPITAL A LA FECHA:</span>
                      <span className="font-bold">RD$ {data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>INTERÉS CUBIERTO:</span>
                      <span>RD$ {(data.interestAmount || data.amountPaid).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {data.capitalAmount !== undefined && data.capitalAmount > 0 && (
                      <div className="flex justify-between font-semibold">
                        <span>ABONO A CAPITAL:</span>
                        <span>RD$ {data.capitalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {data.capitalAmount !== undefined && data.capitalAmount > 0 && (
                      <div className="flex justify-between">
                        <span>ABONO A CAPITAL:</span>
                        <span>RD$ {data.capitalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {data.interestAmount !== undefined && data.interestAmount > 0 && (
                      <div className="flex justify-between">
                        <span>INTERÉS PAGADO:</span>
                        <span>RD$ {data.interestAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                )}

                {data.lateFeeAmount !== undefined && data.lateFeeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>MORA / RECARGO:</span>
                    <span>RD$ {data.lateFeeAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {data.discountAmount !== undefined && data.discountAmount > 0 && (
                  <div className="flex justify-between text-black font-semibold">
                    <span>DESCUENTO:</span>
                    <span>-RD$ {data.discountAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="border-t-2 border-b-2 border-black py-1 my-1 flex justify-between font-black text-[13px]">
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

              {/* Balances Section */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-[10px]">
                  <span>BALANCE ANTERIOR:</span>
                  <span>RD$ {data.previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between font-black text-[12px] bg-black text-white p-1 rounded">
                  <span>SALDO RESTANTE PENDIENTE:</span>
                  <span>RD$ {data.newBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>

                {isOpenLoan && (
                  <p className="text-[9px] italic text-slate-700 pt-0.5 leading-tight">
                    * Pagaré Abierto: Pago cubre intereses periódicos. Capital permanece activo.
                  </p>
                )}

                <div className="flex justify-between items-center pt-1 text-[11px] font-black border-t border-dashed border-black/40 mt-1">
                  <span>PRÓXIMO PAGO:</span>
                  <span className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-black/20">
                    {displayNextDate || 'Al Día / Sin Deuda'}
                  </span>
                </div>
              </div>

              {/* Scannable Real QR Code */}
              <div className="border-t border-dashed border-black my-2 pt-2 text-center">
                <div className="flex justify-center my-1.5 qr-container">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Código QR Recibo" 
                      className="w-28 h-28 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 flex items-center justify-center mx-auto text-[10px]">
                      Generando QR...
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-bold tracking-tight">
                  Escanea para validar este recibo oficial
                </p>
                <p className="text-[8px] text-slate-600 truncate max-w-[240px] mx-auto font-mono">
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

        {/* Footer Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket Térmico</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20b85c] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" colored={false} />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
              title="Guardar y descargar ticket en formato PDF"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPDF ? 'Generando PDF...' : 'Guardar PDF'}</span>
            </button>
            <button
              onClick={handleExportPNG}
              disabled={isExportingImage}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
              title="Guardar y descargar ticket completo como imagen PNG"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingImage ? 'Exportando...' : 'Guardar PNG'}</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Copiar texto plano para RawBT / Bluetooth"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? '¡Copiado!' : 'Copiar RawBT'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 hover:text-white font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
