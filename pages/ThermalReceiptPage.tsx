import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Printer, Download, Share2, Copy, ArrowLeft, Check, 
  FileText, Smartphone, Layers, ShieldCheck, ExternalLink,
  RefreshCw, CheckCircle2, Image as ImageIcon, QrCode as QrIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { useAccounting, useLoans, useClients, useSettings } from '../context/StoreContext';
import { Transaction, Loan, Client, CompanySettings, formatLoanId, formatReceiptId } from '../types';
import { insforge } from '../lib/insforge';
import { formatExactDate, formatExactTime, formatExactDateTime, formatPaymentDateDisplay } from '../utils/dateUtils';
import { calculateReceiptBalances, isOpenLoanType } from '../utils/receiptBalanceHelper';
import { exportThermalReceiptToPNG, exportThermalReceiptToPDF, printThermalReceiptDirect } from '../utils/thermalExportHelper';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

export const ThermalReceiptPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  
  const { transactions } = useAccounting();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { companySettings } = useSettings();

  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [loading, setLoading] = useState(true);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [dbLoanTransactions, setDbLoanTransactions] = useState<Transaction[]>([]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  const [lenderSettings, setLenderSettings] = useState<CompanySettings | null>(null);

  // Fetch or resolve Transaction, Loan and Client
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (!transactionId) return;

        const cleanId = (transactionId || '').trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleanId);

        // 1. Resolve Transaction
        let resolvedTx = transactions.find(t => 
          t.id === cleanId || 
          formatReceiptId(t.id) === cleanId ||
          formatReceiptId(t.id).replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
          t.id.endsWith(cleanId)
        ) || null;

        let rawLenderId: string | undefined = undefined;

        if (!resolvedTx && isUuid) {
          const { data: txRes } = await insforge.database
            .from('transactions')
            .select('*')
            .eq('id', cleanId)
            .maybeSingle();

          if (txRes) {
            rawLenderId = txRes.lender_id;
            resolvedTx = {
              id: txRes.id,
              type: (txRes.type || 'Ingreso') as Transaction['type'],
              category: (txRes.category || 'Pago Préstamo') as Transaction['category'],
              amount: Number(txRes.amount) || 0,
              date: (txRes.date && !txRes.date.includes('T00:00:00') && !txRes.date.endsWith('T00:00:00.000Z') && txRes.date.includes('T')) 
                ? txRes.date 
                : (txRes.created_at || txRes.date || new Date().toISOString()),
              createdAt: txRes.created_at,
              created_at: txRes.created_at,
              description: txRes.description,
              referenceId: txRes.reference_id || txRes.referenceid,
              reference_id: txRes.reference_id || txRes.referenceid,
              paymentType: (txRes.payment_type || txRes.paymenttype || 'Interes') as Transaction['paymentType'],
              paymentMethod: (txRes.payment_method || txRes.paymentmethod || 'Efectivo') as Transaction['paymentMethod'],
              invoiceDate: txRes.invoice_date || txRes.invoicedate,
              bankAccountId: txRes.bank_account_id,
              proofUrl: txRes.proof_url,
              previousBalance: txRes.previous_balance ? Number(txRes.previous_balance) : undefined,
              newBalance: txRes.new_balance ? Number(txRes.new_balance) : undefined,
              totalDebt: txRes.total_debt ? Number(txRes.total_debt) : undefined,
              capitalAmount: txRes.capital_amount ? Number(txRes.capital_amount) : undefined,
              interestAmount: txRes.interest_amount ? Number(txRes.interest_amount) : undefined,
              lateFeeAmount: txRes.late_fee_amount ? Number(txRes.late_fee_amount) : undefined,
              discountAmount: txRes.discount_amount ? Number(txRes.discount_amount) : undefined
            };
          }
        }

        if (!resolvedTx) {
          const { data: allTxs } = await insforge.database
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

          if (allTxs && allTxs.length > 0) {
            const match = allTxs.find(t => 
              t.id === cleanId || 
              formatReceiptId(t.id) === cleanId || 
              formatReceiptId(t.id).replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
              t.id.endsWith(cleanId) ||
              (cleanId.length >= 4 && t.id.includes(cleanId.replace(/^REC-/i, '')))
            );

            if (match) {
              rawLenderId = match.lender_id;
              resolvedTx = {
                id: match.id,
                type: (match.type || 'Ingreso') as Transaction['type'],
                category: (match.category || 'Pago Préstamo') as Transaction['category'],
                amount: Number(match.amount) || 0,
                date: (match.date && !match.date.includes('T00:00:00') && !match.date.endsWith('T00:00:00.000Z') && match.date.includes('T')) 
                  ? match.date 
                  : (match.created_at || match.date || new Date().toISOString()),
                createdAt: match.created_at,
                created_at: match.created_at,
                description: match.description,
                referenceId: match.reference_id || match.referenceid,
                reference_id: match.reference_id || match.referenceid,
                paymentType: (match.payment_type || match.paymenttype || 'Interes') as Transaction['paymentType'],
                paymentMethod: (match.payment_method || match.paymentmethod || 'Efectivo') as Transaction['paymentMethod'],
                invoiceDate: match.invoice_date || match.invoicedate,
                bankAccountId: match.bank_account_id,
                proofUrl: match.proof_url,
                previousBalance: match.previous_balance ? Number(match.previous_balance) : undefined,
                newBalance: match.new_balance ? Number(match.new_balance) : undefined,
                totalDebt: match.total_debt ? Number(match.total_debt) : undefined,
                capitalAmount: match.capital_amount ? Number(match.capital_amount) : undefined,
                interestAmount: match.interest_amount ? Number(match.interest_amount) : undefined,
                lateFeeAmount: match.late_fee_amount ? Number(match.late_fee_amount) : undefined,
                discountAmount: match.discount_amount ? Number(match.discount_amount) : undefined
              };
            }
          }
        }

        if (resolvedTx) {
          setTransaction(resolvedTx);
          const refId = resolvedTx.referenceId || resolvedTx.reference_id;

          // Fetch Lender Settings from DB
          if (rawLenderId) {
            try {
              const { data: sData } = await insforge.database
                .from('company_settings')
                .select('*')
                .eq('lender_id', rawLenderId)
                .maybeSingle();
              if (sData) {
                setLenderSettings({
                  name: sData.name || 'Ultramoney',
                  slogan: sData.slogan || '',
                  rnc: sData.rnc || '',
                  address: sData.address || '',
                  phone: sData.phone || '',
                  email: sData.email || '',
                  currency: sData.currency || 'DOP',
                  termsAndConditions: sData.terms_and_conditions || '',
                  logoUrl: sData.logourl || sData.logo_url || sData.logoUrl || ''
                });
              }
            } catch (e) {
              console.warn("No se cargó configuración para ticket:", e);
            }
          }

          // 2. Resolve Loan
          let resolvedLoan: Loan | null = null;
          if (refId) {
            resolvedLoan = loans.find(l => 
              l.id === refId || 
              formatLoanId(l.id) === refId ||
              formatLoanId(l.id).replace(/\s+/g, '') === refId.replace(/\s+/g, '')
            ) || null;

            if (!resolvedLoan) {
              let { data: loanRes } = await insforge.database
                .from('loans')
                .select('*')
                .eq('id', refId)
                .maybeSingle();

              if (!loanRes) {
                const { data: byClient } = await insforge.database
                  .from('loans')
                  .select('*')
                  .eq('clientid', refId)
                  .maybeSingle();
                loanRes = byClient;
              }

              if (loanRes) {
                if (!rawLenderId && loanRes.lender_id) {
                  rawLenderId = loanRes.lender_id;
                }
                resolvedLoan = {
                  id: loanRes.id,
                  clientId: loanRes.clientid || '',
                  clientName: loanRes.clientname || '',
                  amount: Number(loanRes.amount) || 0,
                  interestRate: Number(loanRes.interestrate ?? loanRes.interest_rate ?? 0),
                  durationWeeks: Number(loanRes.durationweeks ?? loanRes.duration_weeks ?? loanRes.installments ?? 12),
                  installments: Number(loanRes.installments ?? loanRes.durationweeks ?? loanRes.duration_weeks ?? 12),
                  frequency: (loanRes.frequency as Loan['frequency']) || 'Mensual',
                  paymentFrequency: (loanRes.frequency as Loan['frequency']) || 'Mensual',
                  startDate: loanRes.startdate || loanRes.start_date || '',
                  status: loanRes.status,
                  loanType: loanRes.loantype || loanRes.loan_type || 'Amortizado (Cuota Fija)',
                  totalToPay: Number(loanRes.totaltopay ?? loanRes.total_to_pay ?? loanRes.amount ?? 0),
                  remainingBalance: Number(loanRes.remainingbalance ?? loanRes.remaining_balance ?? 0),
                  nextPaymentDate: loanRes.next_payment_date || loanRes.nextpaymentdate || '',
                  collateral: loanRes.collateral || undefined
                };
              }
            }
          }

          // Fetch Lender Settings from DB
          const targetLenderId = rawLenderId;
          try {
            let sData = null;
            if (targetLenderId) {
              const { data } = await insforge.database
                .from('company_settings')
                .select('*')
                .eq('lender_id', targetLenderId)
                .maybeSingle();
              sData = data;
            }
            if (!sData) {
              const { data: defData } = await insforge.database
                .from('company_settings')
                .select('*')
                .limit(1)
                .maybeSingle();
              sData = defData;
            }
            if (sData) {
              setLenderSettings({
                name: sData.name || 'Ultramoney',
                slogan: sData.slogan || '',
                rnc: sData.rnc || '',
                address: sData.address || '',
                phone: sData.phone || '',
                email: sData.email || '',
                currency: sData.currency || 'DOP',
                termsAndConditions: sData.terms_and_conditions || '',
                logoUrl: sData.logourl || sData.logo_url || sData.logoUrl || ''
              });
            }
          } catch (e) {
            console.warn("No se cargó configuración de empresa:", e);
          }

          if (resolvedLoan) {
            setLoan(resolvedLoan);

            // Fetch DB Transactions for this loan
            const { data: loanTxsData } = await insforge.database
              .from('transactions')
              .select('*')
              .eq('reference_id', resolvedLoan.id);

            if (loanTxsData) {
              setDbLoanTransactions(loanTxsData.map(t => ({
                id: t.id,
                type: (t.type || 'Ingreso') as Transaction['type'],
                category: (t.category || 'Pago Préstamo') as Transaction['category'],
                amount: Number(t.amount) || 0,
                date: (t.date && !t.date.includes('T00:00:00') && !t.date.endsWith('T00:00:00.000Z') && t.date.includes('T')) 
                  ? t.date 
                  : (t.created_at || t.date || new Date().toISOString()),
                createdAt: t.created_at,
                created_at: t.created_at,
                description: t.description,
                referenceId: t.reference_id || t.referenceid,
                paymentType: (t.payment_type || t.paymenttype || 'Interes') as Transaction['paymentType'],
                paymentMethod: (t.payment_method || t.paymentmethod || 'Efectivo') as Transaction['paymentMethod'],
                previousBalance: t.previous_balance ? Number(t.previous_balance) : undefined,
                newBalance: t.new_balance ? Number(t.new_balance) : undefined,
                capitalAmount: t.capital_amount ? Number(t.capital_amount) : undefined,
                interestAmount: t.interest_amount ? Number(t.interest_amount) : undefined,
                lateFeeAmount: t.late_fee_amount ? Number(t.late_fee_amount) : undefined,
                discountAmount: t.discount_amount ? Number(t.discount_amount) : undefined
              })));
            }
          }

          // 3. Resolve Client
          const targetClientId = resolvedLoan?.clientId || (refId && clients.some(c => c.id === refId) ? refId : '');
          let resolvedClient: Client | null = null;
          if (targetClientId) {
            resolvedClient = clients.find(c => c.id === targetClientId) || null;
            if (!resolvedClient) {
              const { data: clientRes } = await insforge.database
                .from('clients')
                .select('*')
                .eq('id', targetClientId)
                .maybeSingle();

              if (clientRes) {
                resolvedClient = {
                  id: clientRes.id,
                  name: clientRes.name,
                  lastName: clientRes.lastname || clientRes.last_name || '',
                  sex: clientRes.sex || 'Masculino',
                  occupation: clientRes.occupation || '',
                  phone: clientRes.phone || '',
                  cedula: clientRes.cedula || '',
                  address: clientRes.address || '',
                  income: Number(clientRes.income) || 0,
                  creditScore: Number(clientRes.credit_score || clientRes.creditscore) || 80,
                  status: clientRes.status || 'Activo',
                  joinedDate: clientRes.created_at || new Date().toISOString()
                };
              }
            }
          }

          if (!resolvedClient) {
            const fallbackName = resolvedLoan?.clientName || resolvedTx.description?.split('-')[1]?.trim() || 'Cliente';
            resolvedClient = {
              id: targetClientId || 'N/A',
              name: fallbackName,
              lastName: '',
              sex: 'Otro',
              occupation: 'Particular',
              phone: '',
              cedula: 'N/A',
              address: '',
              income: 0,
              creditScore: 100,
              status: 'Activo',
              joinedDate: new Date().toISOString()
            };
          }

          setClient(resolvedClient);
        }
      } catch (err) {
        console.error('Error cargando datos para ticket térmico:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [transactionId, transactions, loans, clients]);

  // Combined transactions for complete calculation
  const allRelatedTransactions = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactions.forEach(t => {
      if ((loan?.id && (t.referenceId === loan.id || t.reference_id === loan.id)) ||
          (transaction?.referenceId && (t.referenceId === transaction.referenceId || t.reference_id === transaction.referenceId))) {
        map.set(t.id, t);
      }
    });
    dbLoanTransactions.forEach(t => map.set(t.id, t));
    return Array.from(map.values());
  }, [transactions, dbLoanTransactions, loan?.id, transaction?.referenceId]);

  const calculated = useMemo(() => {
    if (!transaction) return null;
    return calculateReceiptBalances(transaction, loan, allRelatedTransactions);
  }, [transaction, loan, allRelatedTransactions]);

  const liveClientName = useMemo(() => {
    if (client) return `${client.name} ${client.lastName || ''}`.trim();
    if (loan) return loan.clientName || 'Cliente';
    return transaction?.description?.split('-')[1]?.trim() || 'Cliente';
  }, [client, loan, transaction]);

  const liveClientCedula = client?.cedula || client?.documentId;
  const liveClientPhone = client?.phone;
  const formattedReceiptNo = transaction ? formatReceiptId(transaction.id) : '000000';
  const cleanLoanId = loan?.id || transaction?.referenceId || 'N/A';
  const isOpenLoan = Boolean(calculated?.isOpenLoan || (loan && isOpenLoanType(loan.loanType)));

  const displayDate = transaction ? formatExactDate(transaction.date) : '';
  const displayTime = transaction ? formatExactTime(transaction.date, true) : '';
  const displayNextDate = calculated?.nextPaymentDateText || (loan?.nextPaymentDate ? formatPaymentDateDisplay(loan.nextPaymentDate) : 'Al Día / Sin Deuda');

  const verificationUrl = useMemo(() => {
    const origin = window.location.origin;
    if (transaction?.id) return `${origin}/recibo/${transaction.id}`;
    return window.location.href;
  }, [transaction]);

  // Generate genuine high-resolution QR code
  useEffect(() => {
    if (verificationUrl) {
      QRCode.toDataURL(verificationUrl, {
        width: paperWidth === '58mm' ? 160 : 200,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error generando QR:', err));
    }
  }, [verificationUrl, paperWidth]);

  // Handlers
  const handlePrint = () => {
    if (!printableRef.current) return;
    try {
      printThermalReceiptDirect(
        printableRef.current.innerHTML,
        paperWidth,
        `Ticket_${formattedReceiptNo}`
      );
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Error al imprimir');
    }
  };

  const handleDownloadPNG = async () => {
    if (!receiptRef.current) return;
    setIsExportingPNG(true);
    try {
      toast.info('Generando imagen fiel del ticket en alta definición...');
      await exportThermalReceiptToPNG(receiptRef.current, `Ticket_${formattedReceiptNo}.png`, paperWidth);
      toast.success('Imagen PNG completa descargada sin recortes');
    } catch (err) {
      console.error('Error exportando PNG:', err);
      toast.error('Error al generar la imagen del ticket');
    } finally {
      setIsExportingPNG(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsExportingPDF(true);
    try {
      toast.info('Generando PDF en rollo continuo...');
      await exportThermalReceiptToPDF(receiptRef.current, `Ticket_${formattedReceiptNo}.pdf`, paperWidth);
      toast.success('PDF térmico continuo descargado');
    } catch (err) {
      console.error('Error exportando PDF:', err);
      toast.error('Error al generar el PDF del ticket');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    toast.success('Enlace oficial del recibo copiado');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeCompanySettings = lenderSettings || (companySettings.name !== 'Ultramoney S.R.L.' ? companySettings : {
    name: 'Ultramoney S.R.L.',
    phone: '(809) 555-0100',
    rnc: '131-00000-1',
    address: 'Av. 27 de Febrero #23, Santo Domingo, RD',
    email: 'contacto@ultramoney.com',
    currency: 'DOP',
    termsAndConditions: 'El incumplimiento de pago generará una mora del 5% mensual.',
    slogan: 'Tu socio financiero de confianza'
  });

  const handleCopyMonospaceText = () => {
    const compName = activeCompanySettings?.name || 'ULTRAMONEY';
    const compRnc = activeCompanySettings?.rnc ? `RNC: ${activeCompanySettings.rnc}` : '';
    const compPhone = activeCompanySettings?.phone ? `TEL: ${activeCompanySettings.phone}` : '';
    const sep = paperWidth === '58mm' ? '--------------------------------' : '------------------------------------------------';
    const dsep = paperWidth === '58mm' ? '================================' : '================================================';

    const lines: string[] = [
      compName,
      compRnc,
      compPhone,
      sep,
      'COMPROBANTE OFICIAL DE PAGO',
      `RECIBO: #${formattedReceiptNo}`,
      `FECHA:  ${displayDate}`,
      `HORA:   ${displayTime}`,
      `CAJERO: Administración`,
      sep,
      `CLIENTE:  ${liveClientName}`,
      liveClientCedula ? `DOC/CED:  ${liveClientCedula}` : '',
      liveClientPhone ? `TEL:      ${liveClientPhone}` : '',
      `PRESTAMO: #${formatLoanId(cleanLoanId)}`,
      loan?.loanType ? `TIPO:     ${loan.loanType}` : '',
      calculated?.installmentText ? `CUOTA:    ${calculated.installmentText}` : '',
      !isOpenLoan && calculated?.remainingInstallmentsText ? `RESTANTE: ${calculated.remainingInstallmentsText}` : '',
      sep,
      calculated?.capitalPaid ? `ABONO CAPITAL:  RD$ ${calculated.capitalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      calculated?.interestPaid ? `INTERES CUBIERTO:RD$ ${calculated.interestPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      calculated?.lateFeePaid ? `CARGO MORA:     RD$ ${calculated.lateFeePaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      calculated?.discountPaid ? `DESCUENTO:      RD$ ${calculated.discountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '',
      dsep,
      `TOTAL PAGADO:   RD$ ${(calculated?.amountPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      dsep,
      `METODO: ${transaction?.paymentMethod || 'Efectivo'}`,
      sep,
      isOpenLoan 
        ? `CAPITAL ACTIVO: RD$ ${(calculated?.newBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}` 
        : `BAL. ANTERIOR:  RD$ ${(calculated?.previousBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `SALDO PENDIENTE:RD$ ${(calculated?.newBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `PROXIMO PAGO:   ${displayNextDate}`,
      sep,
      isOpenLoan ? '* Modalidad Pagare Abierto: El pago cubre intereses.' : '',
      'Verificar recibo en linea:',
      verificationUrl,
      sep,
      'Gracias por su pago puntual.',
      'Documento emitido electronicamente.'
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedText(true);
    toast.success('Texto copiado para RawBT / Impresora Bluetooth');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const nextPayTxt = displayNextDate ? `\n*Próximo Pago*: ${displayNextDate}` : '';
    const text = `*${activeCompanySettings?.name || 'ULTRAMONEY'}*\n*Recibo de Pago*: #${formattedReceiptNo}\n*Fecha*: ${displayDate}\n*Hora*: ${displayTime}\n*Cliente*: ${liveClientName}\n*Monto Pagado*: RD$ ${(calculated?.amountPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n*Saldo Restante*: RD$ ${(calculated?.newBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}${nextPayTxt}\n\nPuede ver su comprobante digital oficial aquí:\n${verificationUrl}`;
    const targetPhone = liveClientPhone ? liveClientPhone.replace(/[^0-9]/g, '') : '';
    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone.length === 10 ? '1' + targetPhone : targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-400 tracking-wider">Cargando estación de impresión térmica...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <h1 className="text-2xl font-bold text-slate-200 mb-2">Comprobante no encontrado</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">El recibo solicitado no existe o el enlace es incorrecto.</p>
        <button
          onClick={() => navigate('/pagos')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          Volver a Cobranza
        </button>
      </div>
    );
  }

  const receiptWidthClass = paperWidth === '58mm' ? 'w-[360px] max-w-full' : 'w-[480px] max-w-full';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-6 px-3 sm:px-6 relative selection:bg-indigo-500 selection:text-white pb-32 sm:pb-16">
      
      {/* Top Header Controls */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>

          <Link
            to={`/recibo/${transaction.id}`}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-900/50 hover:border-indigo-700 transition-colors"
          >
            <FileText className="w-4 h-4" /> Ver Recibo Estándar A4
          </Link>
        </div>

        {/* Paper Width Toggle Selector */}
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 self-center">
          <button
            onClick={() => setPaperWidth('58mm')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              paperWidth === '58mm'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Rollo 58 mm (POS)
          </button>
          <button
            onClick={() => setPaperWidth('80mm')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              paperWidth === '80mm'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Rollo 80 mm (Grande)
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="w-full max-w-4xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        
        {/* Left / Center: The Thermal Receipt Paper Preview Card */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Vista Previa Térmica 100% Fiel ({paperWidth})
          </div>

          {/* Paper Container with Real Thermal Style */}
          <div 
            ref={receiptRef}
            id="thermal-receipt-preview-card"
            className={`bg-white text-black p-4 sm:p-6 shadow-2xl rounded-sm border-t-8 border-b-8 border-slate-300 transition-all font-mono leading-tight ${receiptWidthClass}`}
            style={{
              fontFamily: "'Courier New', Courier, monospace, sans-serif"
            }}
          >
            {/* Header / Company */}
            <div className="text-center space-y-0.5">
              <h2 className="font-extrabold text-base tracking-wider uppercase">
                {activeCompanySettings?.name || 'ULTRAMONEY S.R.L.'}
              </h2>
              {activeCompanySettings?.rnc && (
                <p className="text-[11px]">RNC: {activeCompanySettings.rnc}</p>
              )}
              {activeCompanySettings?.phone && (
                <p className="text-[11px]">TEL: {activeCompanySettings.phone}</p>
              )}
              {activeCompanySettings?.address && (
                <p className="text-[10px]">{activeCompanySettings.address}</p>
              )}

              <div className="border-t border-dashed border-black my-2.5" />

              <p className="font-extrabold text-[12px] uppercase tracking-wide">
                COMPROBANTE OFICIAL DE PAGO
              </p>
              <p className="font-black text-[13px]">RECIBO: #{formattedReceiptNo}</p>

              <div className="flex justify-between text-[10px] pt-1 font-bold">
                <span>FECHA: {displayDate}</span>
                <span>HORA: {displayTime}</span>
              </div>
              <div className="text-left text-[10px] pt-0.5">
                <span>CAJERO: Administración</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black my-2.5" />

            {/* Client & Loan Details */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-start gap-2">
                <span className="font-bold shrink-0">CLIENTE:</span>
                <span className="font-black text-right">{liveClientName}</span>
              </div>
              {liveClientCedula && (
                <div className="flex justify-between text-[10px]">
                  <span>DOC/CED:</span>
                  <span className="font-bold">{liveClientCedula}</span>
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
                <span className="font-bold">#{formatLoanId(cleanLoanId)}</span>
              </div>
              {loan?.loanType && (
                <div className="flex justify-between text-[10px]">
                  <span>MODALIDAD:</span>
                  <span>{loan.loanType}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px]">
                <span>TOTAL DE LA DEUDA:</span>
                <span className="font-bold">RD$ {(calculated?.totalDebt || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              {calculated?.installmentText && (
                <div className="flex justify-between text-[10px]">
                  <span>CUOTA:</span>
                  <span className="font-bold">{calculated.installmentText}</span>
                </div>
              )}
              {!isOpenLoan && calculated?.remainingInstallmentsText && (
                <div className="flex justify-between text-[10px]">
                  <span>CUOTAS RESTANTES:</span>
                  <span className="font-bold">{calculated.remainingInstallmentsText}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-black my-2.5" />

            {/* Breakdown Section */}
            <div className="space-y-1 text-[11px]">
              {isOpenLoan ? (
                <>
                  <div className="flex justify-between text-[10px]">
                    <span>CAPITAL A LA FECHA:</span>
                    <span className="font-bold">RD$ {(calculated?.newBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>INTERÉS CUBIERTO:</span>
                    <span>RD$ {(calculated?.interestPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {calculated?.capitalPaid !== undefined && calculated.capitalPaid > 0 && (
                    <div className="flex justify-between font-semibold">
                      <span>ABONO A CAPITAL:</span>
                      <span>RD$ {calculated.capitalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between font-semibold">
                    <span>ABONO A CAPITAL:</span>
                    <span>RD$ {(calculated?.capitalPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>INTERÉS ORDINARIO:</span>
                    <span>RD$ {(calculated?.interestPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}

              {calculated?.lateFeePaid !== undefined && calculated.lateFeePaid > 0 && (
                <div className="flex justify-between text-black font-bold">
                  <span>CARGO POR MORA:</span>
                  <span>RD$ {calculated.lateFeePaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {calculated?.discountPaid !== undefined && calculated.discountPaid > 0 && (
                <div className="flex justify-between font-semibold text-[10px]">
                  <span>DESCUENTO APLICADO:</span>
                  <span>- RD$ {calculated.discountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-black my-2.5" />

            {/* Total Paid & Method */}
            <div className="space-y-1">
              <div className="flex justify-between text-[14px] font-black">
                <span>TOTAL PAGADO:</span>
                <span>RD$ {(calculated?.amountPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span>MÉTODO DE PAGO:</span>
                <span className="uppercase">{transaction.paymentMethod || 'Efectivo'}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black my-2.5" />

            {/* Balances Summary */}
            <div className="space-y-1 text-[11px]">
              {!isOpenLoan && (
                <div className="flex justify-between text-[10px]">
                  <span>BALANCE ANTERIOR:</span>
                  <span>RD$ {(calculated?.previousBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-[12px]">
                <span>(=) SALDO PENDIENTE:</span>
                <span>RD$ {(calculated?.newBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Next Payment Date - Live Calculated */}
              <div className="flex justify-between items-center text-[11px] font-black pt-1">
                <span>PRÓXIMO PAGO:</span>
                <span>{displayNextDate}</span>
              </div>
            </div>

            {transaction.description && (
              <div className="mt-2 text-[10px] text-gray-700 italic border-t border-dotted border-gray-400 pt-1">
                <span>Nota: {transaction.description}</span>
              </div>
            )}

            <div className="border-t border-dashed border-black my-2.5" />

            {/* QR Code and Verification */}
            <div className="text-center space-y-1">
              {qrDataUrl && (
                <div className="flex justify-center my-1">
                  <img
                    src={qrDataUrl}
                    alt="QR Verification"
                    className="w-28 h-28 object-contain border border-black p-1 bg-white"
                  />
                </div>
              )}
              <p className="text-[9px] uppercase tracking-wider font-bold">
                Escanear para validar autenticidad
              </p>
              <p className="text-[8px] text-gray-800 break-all font-mono">
                {verificationUrl}
              </p>
              <p className="text-[9px] pt-1 font-bold">
                ¡Gracias por su puntualidad!
              </p>
              <p className="text-[8px] text-gray-600">
                Documento emitido electrónicamente por UltraMoney.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Action Buttons Suite (Web Desktop & Mobile Sticky) */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Centro de Impresión y Envío
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Genera tickets fieles, sin cortes y de alta calidad para cualquier dispositivo.
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Direct Thermal Print Button */}
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Printer className="w-4 h-4" /> Imprimir Ticket Térmico ({paperWidth})
              </button>

              {/* Download PNG (Guaranteed Non-Clipped) */}
              <button
                onClick={handleDownloadPNG}
                disabled={isExportingPNG}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-100 font-bold text-xs rounded-2xl border border-slate-700 transition-all disabled:opacity-50"
              >
                {isExportingPNG ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Generando PNG completo...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-emerald-400" /> Guardar Imagen PNG (100% Completa)
                  </>
                )}
              </button>

              {/* Download Continuous Roll PDF */}
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-100 font-bold text-xs rounded-2xl border border-slate-700 transition-all disabled:opacity-50"
              >
                {isExportingPDF ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-sky-400" /> Descargar PDF Térmico (Rollo)
                  </>
                )}
              </button>

              {/* Share WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4" /> Enviar Ticket por WhatsApp
              </button>

              {/* Copy Monospace Text for Bluetooth / RawBT */}
              <button
                onClick={handleCopyMonospaceText}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition-all"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> ¡Texto de Ticket Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" /> Copiar Texto (Impresora Bluetooth / RawBT)
                  </>
                )}
              </button>

              {/* Copy Direct Web Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-800/60 transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Enlace copiado al portapapeles
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" /> Copiar enlace web de verificación
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick specs box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <QrIcon className="w-3.5 h-3.5 text-indigo-400" /> Características del Ticket
            </div>
            <p>• Compatible con impresoras térmicas USB, WiFi, Red y Bluetooth.</p>
            <p>• El código QR incluye certificación digital del recibo en tiempo real.</p>
            <p>• La imagen PNG se renderiza en 3x HD con aislamiento total fuera de pantalla.</p>
          </div>
        </div>
      </main>

      {/* Hidden container for printing */}
      <div className="hidden">
        <div ref={printableRef}>
          <div className="center">
            <div className="bold">{activeCompanySettings?.name || 'ULTRAMONEY S.R.L.'}</div>
            {activeCompanySettings?.rnc && <div>RNC: {activeCompanySettings.rnc}</div>}
            {activeCompanySettings?.phone && <div>TEL: {activeCompanySettings.phone}</div>}
            {activeCompanySettings?.address && <div>{activeCompanySettings.address}</div>}
            <div className="divider"></div>
            <div className="bold">COMPROBANTE OFICIAL DE PAGO</div>
            <div className="bold">RECIBO: #{formattedReceiptNo}</div>
            <div className="row">
              <span>FECHA: {displayDate}</span>
              <span>HORA: {displayTime}</span>
            </div>
            <div style={{ textAlign: 'left' }}>CAJERO: Administración</div>
          </div>

          <div className="divider"></div>

          <div className="row">
            <span className="bold">CLIENTE:</span>
            <span>{liveClientName}</span>
          </div>
          {liveClientCedula && (
            <div className="row">
              <span>DOC/CED:</span>
              <span>{liveClientCedula}</span>
            </div>
          )}
          {liveClientPhone && (
            <div className="row">
              <span>TEL:</span>
              <span>{liveClientPhone}</span>
            </div>
          )}
          <div className="row">
            <span>PRESTAMO:</span>
            <span>#{formatLoanId(cleanLoanId)}</span>
          </div>
          {loan?.loanType && (
            <div className="row">
              <span>TIPO:</span>
              <span>{loan.loanType}</span>
            </div>
          )}
          {calculated?.installmentText && (
            <div className="row">
              <span>CUOTA:</span>
              <span>{calculated.installmentText}</span>
            </div>
          )}
          {!isOpenLoan && calculated?.remainingInstallmentsText && (
            <div className="row">
              <span>RESTANTE:</span>
              <span>{calculated.remainingInstallmentsText}</span>
            </div>
          )}

          <div className="divider"></div>

          {isOpenLoan ? (
            <>
              <div className="row">
                <span>CAPITAL ACTIVO:</span>
                <span>RD$ {(calculated?.newBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="row">
                <span>INTERES CUBIERTO:</span>
                <span>RD$ {(calculated?.interestPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          ) : (
            <>
              <div className="row">
                <span>ABONO CAPITAL:</span>
                <span>RD$ {(calculated?.capitalPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="row">
                <span>INTERES:</span>
                <span>RD$ {(calculated?.interestPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          )}

          {calculated?.lateFeePaid !== undefined && calculated.lateFeePaid > 0 && (
            <div className="row bold">
              <span>CARGO MORA:</span>
              <span>RD$ {calculated.lateFeePaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {calculated?.discountPaid !== undefined && calculated.discountPaid > 0 && (
            <div className="row">
              <span>DESCUENTO:</span>
              <span>- RD$ {calculated.discountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="double-divider"></div>

          <div className="row bold" style={{ fontSize: '13px' }}>
            <span>TOTAL PAGADO:</span>
            <span>RD$ {(calculated?.amountPaid || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="row">
            <span>METODO:</span>
            <span>{transaction.paymentMethod || 'Efectivo'}</span>
          </div>

          <div className="divider"></div>

          <div className="row">
            <span>SALDO PENDIENTE:</span>
            <span className="bold">RD$ {(calculated?.newBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="row bold">
            <span>PROXIMO PAGO:</span>
            <span>{displayNextDate}</span>
          </div>

          <div className="divider"></div>

          <div className="center">
            {qrDataUrl && (
              <div className="qr-container">
                <img src={qrDataUrl} alt="QR Code" />
              </div>
            )}
            <div style={{ fontSize: '9px' }}>Escanear para validar recibo</div>
            <div style={{ fontSize: '8px' }}>{verificationUrl}</div>
            <div style={{ marginTop: '4px' }}>Gracias por su pago puntual</div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default ThermalReceiptPage;
