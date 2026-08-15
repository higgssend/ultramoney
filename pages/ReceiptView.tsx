import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccounting, useSettings, useAuth, useLoans, useClients } from '../context/StoreContext';
import { Download, Image, CheckCircle, Smartphone, User, CreditCard, ShieldCheck, FileText, Calendar, DollarSign, Clock, ChevronLeft, Shield, AlertTriangle, Link2, Copy, Share2, Check, Printer, Edit3 } from 'lucide-react';
import { Transaction, Loan, Client, LoanStatus, LoanType, CompanySettings, formatLoanId, formatReceiptId } from '../types';
import { insforge } from '../lib/insforge';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { ThermalReceiptModal, ThermalReceiptData } from '../components/ThermalReceiptModal';
import { EditPaymentModal } from '../components/EditPaymentModal';

import { calculateReceiptBalances } from '../utils/receiptBalanceHelper';
import { formatExactTime, formatExactDate, formatPaymentDateDisplay } from '../utils/dateUtils';

export const ReceiptView: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>();
    const { transactions } = useAccounting();
    const { loans } = useLoans();
    const { clients } = useClients();
    const { companySettings } = useSettings();
    const { currentUser } = useAuth();
    
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loan, setLoan] = useState<Loan | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isThermalOpen, setIsThermalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingImage, setIsExportingImage] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('printable-voucher-card');
        if (!element) return;
        setIsExportingPDF(true);
        try {
            toast.info("Generando PDF oficial del recibo...");
            const canvas = await html2canvas(element, { 
                scale: 3, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                scrollY: -window.scrollY,
                scrollX: -window.scrollX,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * (pdfWidth - 20)) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
            pdf.save(`Recibo_Oficial_${formatReceiptId(transaction?.id || transactionId || '1')}.pdf`);
            toast.success("Recibo PDF descargado exitosamente");
        } catch (e) {
            console.error("Error exportando PDF:", e);
            toast.error("Error al exportar PDF");
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('printable-voucher-card');
        if (!element) return;
        setIsExportingImage(true);
        try {
            toast.info("Generando imagen completa del recibo...");
            const canvas = await html2canvas(element, { 
                scale: 3, 
                useCORS: true, 
                backgroundColor: '#ffffff',
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
                    link.download = `Recibo_${formatReceiptId(transaction?.id || transactionId || '1')}.png`;
                    link.click();
                    toast.success("Imagen descargada");
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Recibo_${formatReceiptId(transaction?.id || transactionId || '1')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                toast.success("Imagen completa del recibo descargada");
            }, 'image/png');
        } catch (e) {
            console.error("Error exportando imagen:", e);
            toast.error("Error al exportar imagen");
        } finally {
            setIsExportingImage(false);
        }
    };

    // Generate validation QR code
    useEffect(() => {
        if (transactionId || transaction?.id) {
            const recId = transaction?.id || transactionId || '';
            const receiptLink = `${window.location.origin}/recibo/${recId}`;
            QRCode.toDataURL(receiptLink, {
                width: 240,
                margin: 1,
                color: { dark: '#0f172a', light: '#ffffff' }
            }).then(setQrDataUrl).catch(e => console.error("Error generating QR:", e));
        }
    }, [transactionId, transaction?.id]);

    const [dbLoanTransactions, setDbLoanTransactions] = useState<Transaction[]>([]);
    const [lenderSettings, setLenderSettings] = useState<CompanySettings | null>(null);

    useEffect(() => {
        const fetchReceiptDetails = async () => {
            if (!transactionId) {
                setLoading(false);
                return;
            }

            try {
                const cleanId = (transactionId || '').trim();
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleanId);
                
                // 1. Fetch transaction from memory store first, otherwise fetch from DB
                let txData: Transaction | null = transactions.find(t => 
                    t.id === cleanId || 
                    formatReceiptId(t.id) === cleanId ||
                    formatReceiptId(t.id).replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
                    t.id.endsWith(cleanId)
                ) || null;
                
                let rawLenderId: string | undefined = undefined;

                if (!txData && isUuid) {
                    const { data, error } = await insforge.database
                        .from('transactions')
                        .select('*')
                        .eq('id', cleanId)
                        .maybeSingle();

                    if (data && !error) {
                        rawLenderId = data.lender_id;
                        txData = {
                            id: data.id,
                            type: (data.type || 'Ingreso') as Transaction['type'],
                            category: (data.category || 'Pago Préstamo') as Transaction['category'],
                            amount: Number(data.amount) || 0,
                            date: (data.date && !data.date.includes('T00:00:00') && !data.date.endsWith('T00:00:00.000Z') && data.date.includes('T')) 
                                ? data.date 
                                : (data.created_at || data.date || new Date().toISOString()),
                            createdAt: data.created_at,
                            created_at: data.created_at,
                            description: data.description,
                            referenceId: data.reference_id || data.referenceid,
                            paymentType: (data.payment_type || data.paymenttype || 'Interes') as Transaction['paymentType'],
                            paymentMethod: (data.payment_method || data.paymentmethod || 'Efectivo') as Transaction['paymentMethod'],
                            invoiceDate: data.invoice_date || data.invoicedate,
                            bankAccountId: data.bank_account_id,
                            proofUrl: data.proof_url,
                            previousBalance: data.previous_balance ? Number(data.previous_balance) : undefined,
                            newBalance: data.new_balance ? Number(data.new_balance) : undefined,
                            totalDebt: data.total_debt ? Number(data.total_debt) : undefined,
                            capitalAmount: data.capital_amount ? Number(data.capital_amount) : undefined,
                            interestAmount: data.interest_amount ? Number(data.interest_amount) : undefined,
                            lateFeeAmount: data.late_fee_amount ? Number(data.late_fee_amount) : undefined,
                            discountAmount: data.discount_amount ? Number(data.discount_amount) : undefined
                        };
                    }
                }

                if (!txData) {
                    // Search DB by ID substring / formatReceiptId match
                    const { data: allDbTxs } = await insforge.database
                        .from('transactions')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(500);

                    if (allDbTxs && allDbTxs.length > 0) {
                        const match = allDbTxs.find(t => 
                            t.id === cleanId || 
                            formatReceiptId(t.id) === cleanId || 
                            formatReceiptId(t.id).replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
                            t.id.endsWith(cleanId) ||
                            (cleanId.length >= 4 && t.id.includes(cleanId.replace(/^REC-/i, '')))
                        );
                        if (match) {
                            rawLenderId = match.lender_id;
                            txData = {
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

                if (txData) {
                    setTransaction(txData);
                    const refId = txData.referenceId;

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
                            console.warn("No se cargó configuración de empresa:", e);
                        }
                    }

                    // 2. Resolve Loan: find in memory store first, otherwise fetch from DB
                    let resolvedLoan: Loan | null = null;
                    if (refId) {
                        resolvedLoan = loans.find(l => 
                            l.id === refId || 
                            formatLoanId(l.id) === refId ||
                            formatLoanId(l.id).replace(/\s+/g, '') === refId.replace(/\s+/g, '')
                        ) || null;

                        if (!resolvedLoan) {
                            const { data: loanRes } = await insforge.database
                                .from('loans')
                                .select('*')
                                .or(`id.eq.${refId},clientid.eq.${refId},client_id.eq.${refId}`)
                                .maybeSingle();

                            if (loanRes) {
                                resolvedLoan = {
                                    id: loanRes.id,
                                    clientId: loanRes.clientid || loanRes.client_id || '',
                                    clientName: loanRes.clientname || loanRes.client_name || '',
                                    amount: Number(loanRes.amount) || 0,
                                    interestRate: Number(loanRes.interestrate ?? loanRes.interest_rate ?? 0),
                                    durationWeeks: Number(loanRes.durationweeks ?? loanRes.duration_weeks ?? loanRes.installments ?? 12),
                                    installments: Number(loanRes.installments ?? loanRes.durationweeks ?? loanRes.duration_weeks ?? 12),
                                    frequency: (loanRes.frequency as Loan['frequency']) || 'Mensual',
                                    startDate: loanRes.startdate || loanRes.start_date || '',
                                    status: (loanRes.status as LoanStatus) || LoanStatus.ACTIVE,
                                    loanType: (loanRes.loantype || loanRes.loan_type || 'Amortizado (Cuota Fija)') as LoanType,
                                    totalToPay: Number(loanRes.totaltopay ?? loanRes.total_to_pay ?? loanRes.amount ?? 0),
                                    remainingBalance: Number(loanRes.remainingbalance ?? loanRes.remaining_balance ?? 0),
                                    nextPaymentDate: loanRes.next_payment_date || loanRes.nextpaymentdate || '',
                                    collateral: loanRes.collateral || undefined
                                };

                                // If lender settings still not loaded, try loan's lender_id
                                if (!rawLenderId && loanRes.lender_id) {
                                    try {
                                        const { data: sData } = await insforge.database
                                            .from('company_settings')
                                            .select('*')
                                            .eq('lender_id', loanRes.lender_id)
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
                                        console.warn("No se cargó configuración de empresa desde préstamo:", e);
                                    }
                                }
                            }
                        }
                    }

                    if (resolvedLoan) {
                        setLoan(resolvedLoan);

                        // Fetch all DB transactions for this loan to calculate balances
                        const { data: loanTxsData } = await insforge.database
                            .from('transactions')
                            .select('*')
                            .or(`referenceid.eq.${resolvedLoan.id},reference_id.eq.${resolvedLoan.id}`);

                        if (loanTxsData && loanTxsData.length > 0) {
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

                    // 3. Resolve Client: find in memory store first, otherwise fetch from DB
                    const targetClientId = resolvedLoan?.clientId || (refId && clients.some(c => c.id === refId) ? refId : '');
                    let resolvedClient: Client | null = null;

                    if (targetClientId) {
                        resolvedClient = clients.find(c => c.id === targetClientId) || null;
                    }

                    if (!resolvedClient && targetClientId) {
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
                                sex: (clientRes.sex as Client['sex']) || 'Masculino',
                                occupation: clientRes.occupation || '',
                                phone: clientRes.phone || '',
                                cedula: clientRes.cedula || '',
                                address: clientRes.address || '',
                                income: Number(clientRes.income) || 0,
                                creditScore: Number(clientRes.credit_score || clientRes.creditscore) || 80,
                                status: (clientRes.status as Client['status']) || 'Activo',
                                joinedDate: clientRes.created_at || new Date().toISOString(),
                                avatarUrl: clientRes.avatarurl || clientRes.avatar_url || ''
                            };
                        }
                    }

                    // Fallback client if not in database
                    if (!resolvedClient) {
                        const fallbackName = resolvedLoan?.clientName || txData.description?.split('-')[1]?.trim() || 'Cliente';
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
            } catch (e) {
                console.error("Error cargando detalles del recibo:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchReceiptDetails();
    }, [transactionId, transactions, loans, clients]);

    // Keep client and loan reactively synced with live context store
    useEffect(() => {
        const targetClientId = loan?.clientId || client?.id || transaction?.referenceId;
        if (targetClientId && clients.length > 0) {
            const liveClient = clients.find(c => c.id === targetClientId);
            if (liveClient) {
                setClient(liveClient);
            }
        }
        const targetLoanId = transaction?.referenceId || loan?.id;
        if (targetLoanId && loans.length > 0) {
            const liveLoan = loans.find(l => 
                l.id === targetLoanId || 
                formatLoanId(l.id) === targetLoanId ||
                formatLoanId(l.id).replace(/\s+/g, '') === (targetLoanId || '').replace(/\s+/g, '')
            );
            if (liveLoan) {
                setLoan(liveLoan);
            }
        }
    }, [clients, loans, loan?.clientId, transaction?.referenceId, client?.id, loan?.id]);

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

    // Filter relevant transactions for this loan to build chronological history
    const combinedLoanTransactions = useMemo(() => {
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

    const clientFullName = useMemo(() => {
        if (client) return `${client.name} ${client.lastName || ''}`.trim();
        if (loan) return loan.clientName || 'Cliente';
        return transaction?.description?.split('-')[1]?.trim() || 'Cliente';
    }, [client, loan, transaction]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-slate-400 tracking-wider">Cargando comprobante oficial...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mb-2">Comprobante no encontrado</h1>
                <p className="text-slate-400 text-sm max-w-md mb-6 mx-auto">El recibo solicitado no existe, ha sido eliminado o el enlace es incorrecto.</p>
                <Link
                    to="/pagos"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm inline-flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" /> Volver a Cobranza
                </Link>
            </div>
        );
    }

    const calculated = calculateReceiptBalances(transaction, loan, combinedLoanTransactions);
    const paymentAmount = calculated ? calculated.amountPaid : (Number(transaction.amount) || 0);
    const previousBalance = calculated ? calculated.previousBalance : (transaction.previousBalance || 0);
    const currentBalance = calculated ? calculated.newBalance : (transaction.newBalance || 0);
    const totalDebt = calculated ? calculated.totalDebt : (transaction.totalDebt || 0);
    const capitalPaid = calculated ? calculated.capitalPaid : (transaction.capitalAmount || 0);
    const interestPaid = calculated ? calculated.interestPaid : (transaction.interestAmount || 0);
    const lateFeePaid = calculated ? calculated.lateFeePaid : (transaction.lateFeeAmount || 0);
    const discountPaid = calculated ? calculated.discountPaid : (transaction.discountAmount || 0);
    const isOpenLoan = Boolean(calculated ? calculated.isOpenLoan : false);

    // Overdue calculation
    let daysOverdue = 0;
    const nextDateStr = loan?.nextPaymentDate || loan?.nextpaymentdate;
    if (nextDateStr) {
        const nextDate = new Date(nextDateStr);
        if (!isNaN(nextDate.getTime())) {
            const diffMs = new Date().getTime() - nextDate.getTime();
            daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 3600 * 24)));
        }
    }

    // Collateral info extraction
    let collateralText = 'Sin Garantía Registrada';
    if (loan) {
        if (loan.guarantorId || loan.collateralref) {
            collateralText = String(loan.guarantorId || loan.collateralref);
        } else if (loan.collateral) {
            if (typeof loan.collateral === 'object') {
                const col = loan.collateral;
                collateralText = `${col.type || 'Garantía'}: ${col.description || ''} ${col.refNumber ? `(Matrícula/Ref #${col.refNumber})` : ''}`.trim();
            } else {
                collateralText = String(loan.collateral);
            }
        }
    }

    // Sequential IDs formatting
    const formattedReceiptNo = formatReceiptId(transaction.id);
    const formattedLoanNo = loan ? formatLoanId(loan.id) : 'No. 000000';

    const rawDateStr = transaction.date;
    const formattedDate = formatExactDate(rawDateStr);
    const formattedTime = formatExactTime(rawDateStr, true);

    const handleCopyReceiptLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("¡Enlace directo del recibo copiado al portapapeles!");
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareWhatsApp = () => {
        const url = window.location.href;
        const nextPayTxt = calculated?.nextPaymentDateText
            ? `\n*Próximo Pago*: ${calculated.nextPaymentDateText}`
            : (loan?.nextPaymentDate ? `\n*Próximo Pago*: ${formatPaymentDateDisplay(loan.nextPaymentDate)}` : '');
        const text = `*${activeCompanySettings.name}*\n*Recibo de Pago*: ${formattedReceiptNo}\n*Fecha*: ${formattedDate}\n*Hora*: ${formattedTime}\n*Cliente*: ${clientFullName}\n*Monto Pagado*: RD$ ${paymentAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n*Saldo Restante*: RD$ ${currentBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}${nextPayTxt}\n\nPuede ver y descargar su recibo oficial aquí:\n${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const thermalData: ThermalReceiptData = {
        receiptNo: formattedReceiptNo,
        date: formattedDate,
        time: formattedTime,
        clientName: clientFullName,
        clientCedula: client?.cedula || client?.documentId || client?.clientCode,
        clientPhone: client?.phone,
        loanId: loan?.id || transaction.referenceId || '',
        loanType: loan?.loanType || (isOpenLoan ? 'Pagaré Abierto / Solo Interés' : 'Amortizado'),
        loanAmount: loan?.amount,
        totalDebt: totalDebt,
        installmentInfo: calculated?.installmentText || (loan ? `Cuota ${loan.frequency || 'Mensual'}` : undefined),
        installmentNumber: calculated?.installmentNumber,
        totalInstallments: calculated?.totalInstallments,
        remainingInstallments: calculated?.remainingInstallments,
        remainingInstallmentsText: calculated?.remainingInstallmentsText,
        amountPaid: paymentAmount,
        capitalAmount: capitalPaid,
        interestAmount: interestPaid,
        lateFeeAmount: lateFeePaid,
        discountAmount: discountPaid,
        previousBalance: previousBalance,
        newBalance: currentBalance,
        paymentMethod: transaction.paymentMethod || 'Efectivo',
        paymentType: transaction.paymentType,
        cashierName: 'Administración',
        nextPaymentDate: calculated?.nextPaymentDate || loan?.nextPaymentDate,
        notes: transaction.description,
        transactionId: transaction.id,
        clientId: client?.id || loan?.clientId
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col py-8 sm:px-6 lg:px-8 relative overflow-hidden print:bg-white print:py-0 print:px-0">
            {/* Direct Thermal POS Modal */}
            {isThermalOpen && (
                <ThermalReceiptModal
                    isOpen={isThermalOpen}
                    onClose={() => setIsThermalOpen(false)}
                    data={thermalData}
                />
            )}

            {/* Background glowing effects */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob print:hidden"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob print:hidden"></div>
            
            <div className="sm:mx-auto w-full max-w-lg relative z-10 print:max-w-none">
                
                {/* Action Bar - Hidden on print */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Link to="/pagos" className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Volver a Cobranza
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                        {currentUser && transaction && (
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
                                title="Modificar monto, fecha, hora o anular este pago"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>Editar Pago</span>
                            </button>
                        )}
                        <Link 
                            to={`/recibo-termico/${transaction?.id}`}
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
                            title="Abrir estación de impresión térmica en página dedicada completa"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Impresión Térmica (58/80mm)</span>
                        </Link>
                        <button 
                            onClick={handleCopyReceiptLink}
                            className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            {copied ? '¡Copiado!' : 'Copiar Link'}
                        </button>
                        <button 
                            onClick={handleShareWhatsApp}
                            className="px-3.5 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-[#20b85c] transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            WhatsApp
                        </button>
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isExportingPDF}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                            title="Descargar recibo oficial en formato PDF"
                        >
                            <FileText className="w-4 h-4" />
                            <span>{isExportingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
                        </button>
                        <button 
                            onClick={handleDownloadImage}
                            disabled={isExportingImage}
                            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            <Image className="w-4 h-4" />
                            <span>{isExportingImage ? 'Exportando...' : 'Imagen (PNG)'}</span>
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-slate-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Imprimir Carta
                        </button>
                    </div>
                </div>

                {/* Main Receipt Voucher Card */}
                <div id="printable-voucher-card" className="bg-white shadow-xl sm:rounded-3xl border border-slate-200 p-6 sm:p-8 print:shadow-none print:border-none print:p-2">
                    
                    {/* Header */}
                    <div className="text-center pb-6 border-b border-dashed border-slate-300">
                        {activeCompanySettings.logoUrl ? (
                            <img src={activeCompanySettings.logoUrl} alt="Logo Empresa" className="mx-auto h-16 w-auto mb-3 object-contain" />
                        ) : (
                            <div className="mx-auto h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
                                <Smartphone className="w-7 h-7 text-white" />
                            </div>
                        )}
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">{activeCompanySettings.name}</h2>
                        {activeCompanySettings.rnc && <p className="text-xs font-semibold text-slate-500 mt-0.5">RNC: {activeCompanySettings.rnc}</p>}
                        <p className="text-xs text-slate-500">{activeCompanySettings.address}</p>
                        <p className="text-xs text-slate-500">Teléfono: {activeCompanySettings.phone}</p>
                        
                        <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Comprobante Oficial de Pago
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-3 py-4 text-xs border-b border-slate-100">
                        <div>
                            <span className="text-slate-400 block font-bold uppercase text-[10px]">No. Recibo</span>
                            <span className="font-mono font-black text-indigo-600 text-base">
                                {formattedReceiptNo}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-400 block font-bold uppercase text-[10px]">Fecha y Hora</span>
                            <span className="font-bold text-slate-800">{formattedDate} {formattedTime}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-bold uppercase text-[10px]">Forma de Pago</span>
                            <span className="font-extrabold text-indigo-600 uppercase">{transaction.paymentMethod || 'Efectivo'}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-400 block font-bold uppercase text-[10px]">Préstamo Ref.</span>
                            <span className="font-mono font-black text-indigo-600 text-sm">{formattedLoanNo}</span>
                        </div>
                    </div>

                    {/* Client Information */}
                    <div className="py-4 border-b border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold flex items-center gap-1.5">
                                <User className="w-4 h-4 text-indigo-600" /> Nombre del Cliente
                            </span>
                            <div className="flex items-center gap-2">
                                {client?.avatarUrl ? (
                                    <img 
                                        src={client.avatarUrl} 
                                        alt={clientFullName} 
                                        className="w-7 h-7 rounded-full object-cover border border-indigo-200 shadow-sm"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                        {clientFullName.charAt(0)}
                                    </div>
                                )}
                                <span className="font-black text-slate-900 text-sm">{clientFullName}</span>
                            </div>
                        </div>
                        {(client?.cedula || client?.documentId) && (
                            <div className="flex justify-between items-center px-1">
                                <span className="text-slate-500 font-medium">Cédula / Documento:</span>
                                <span className="font-mono font-bold text-slate-800">{client.cedula || client.documentId}</span>
                            </div>
                        )}
                        {client?.phone && (
                            <div className="flex justify-between items-center px-1">
                                <span className="text-slate-500 font-medium">Teléfono:</span>
                                <span className="font-semibold text-slate-800">{client.phone}</span>
                            </div>
                        )}
                        {loan?.loanType && (
                            <div className="flex justify-between items-center px-1">
                                <span className="text-slate-500 font-medium">Tipo de Préstamo:</span>
                                <span className="font-bold text-indigo-600">{loan.loanType}</span>
                            </div>
                        )}
                    </div>

                    {/* Amount Received Box */}
                    <div className="my-5 p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl text-white shadow-xl text-center">
                        <span className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider block mb-1">Monto Recibido</span>
                        <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                            RD$ {paymentAmount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Detailed Payment & Financial Breakdown */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs mb-4">
                        <span className="font-black text-slate-700 uppercase text-[10px] block mb-2 tracking-wider border-b border-slate-200 pb-1">
                            Desglose de Pago & Estado del Préstamo
                        </span>

                        <div className="flex justify-between text-slate-700 font-bold bg-white p-2.5 rounded-xl border border-slate-200/80">
                            <span>Total de la Deuda Original:</span>
                            <span className="font-black text-slate-900">RD$ {totalDebt.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {/* Installment count and remaining installments info */}
                        {!isOpenLoan && (
                            <div className="grid grid-cols-2 gap-2 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                                <div>
                                    <span className="text-slate-500 text-[10px] font-bold block uppercase">No. de Cuota:</span>
                                    <span className="font-mono font-black text-indigo-700 text-sm">
                                        {calculated?.installmentText || (loan ? `Cuota ${loan.frequency || 'Mensual'}` : 'Cuota #1')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-500 text-[10px] font-bold block uppercase">Cuotas Restantes:</span>
                                    <span className="font-mono font-black text-slate-800 text-sm">
                                        {calculated?.remainingInstallmentsText || '0 cuotas restantes'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between text-slate-600 px-1">
                            <span>Balance Anterior al Pago:</span>
                            <span className="font-bold text-slate-800">RD$ {previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        {/* Open Loans specific vs Amortized Breakdown */}
                        {isOpenLoan ? (
                            <>
                                <div className="flex justify-between text-slate-600 px-1">
                                    <span>Capital Prestado a la Fecha:</span>
                                    <span className="font-bold text-slate-800">RD$ {currentBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 px-1">
                                    <span>Intereses Cubiertos del Período:</span>
                                    <span className="font-bold text-emerald-700">RD$ {interestPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {capitalPaid > 0 && (
                                    <div className="flex justify-between text-slate-600 px-1">
                                        <span>Abono Directo a Capital:</span>
                                        <span className="font-bold text-slate-800">RD$ {capitalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between text-slate-600 px-1">
                                    <span>Abono a Capital:</span>
                                    <span className="font-bold text-emerald-700 font-mono">RD$ {capitalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 px-1">
                                    <span>Interés Pagado:</span>
                                    <span className="font-bold text-indigo-600 font-mono">RD$ {interestPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </>
                        )}

                        {lateFeePaid > 0 && (
                            <div className="flex justify-between text-slate-600 px-1">
                                <span>Mora / Recargo por Atraso:</span>
                                <span className="font-bold text-rose-600 font-black font-mono">
                                    RD$ {lateFeePaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {discountPaid > 0 && (
                            <div className="flex justify-between text-emerald-700 font-semibold px-1">
                                <span>Descuento Otorgado:</span>
                                <span className="font-black font-mono">
                                    -RD$ {discountPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200 px-1">
                            <span>Estado de Atraso:</span>
                            <span className={`font-bold ${daysOverdue > 0 ? 'text-rose-600 font-black' : 'text-emerald-700 font-bold'}`}>
                                {daysOverdue > 0 ? `En Atraso (${daysOverdue} días de mora)` : 'Sin Atraso (Al día)'}
                            </span>
                        </div>

                        <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-300 text-sm bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                            <span>(=) Balance Restante a la Fecha:</span>
                            <span className="text-indigo-700 font-black text-base font-mono">RD$ {currentBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center bg-emerald-50 text-emerald-950 p-3 rounded-xl border border-emerald-200 mt-2">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-emerald-600" /> Próxima Fecha de Pago:
                            </span>
                            <span className="font-black text-sm font-mono text-emerald-700">
                                {calculated?.nextPaymentDateText || (loan?.nextPaymentDate ? formatPaymentDateDisplay(loan.nextPaymentDate) : 'Al Día / Sin Deuda Pendiente')}
                            </span>
                        </div>

                        {isOpenLoan && (
                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed mt-2">
                                <span className="font-bold block mb-0.5">Modalidad Pagaré Abierto (Solo Interés):</span>
                                Este recibo certifica la cancelación de los intereses correspondientes al período. El capital prestado permanece activo al 100% hasta amortizaciones directas a capital.
                            </div>
                        )}
                    </div>

                    {/* Attached Proof Voucher */}
                    {transaction.proofUrl && (
                        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 mb-4 space-y-2">
                            <span className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-indigo-600" /> Comprobante de Transferencia / Voucher Adjunto
                            </span>
                            <div className="rounded-xl overflow-hidden border border-indigo-200 bg-white max-h-48 flex justify-center items-center">
                                <img src={transaction.proofUrl} alt="Comprobante de Pago" className="max-h-48 object-contain" />
                            </div>
                        </div>
                    )}

                    {/* Collateral / Guarantee Section */}
                    <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-3.5 space-y-1 text-xs mb-4">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
                            <Shield className="w-4 h-4 text-amber-600" />
                            <span>Garantía Asociada al Préstamo</span>
                        </div>
                        <p className="text-slate-800 font-medium">{collateralText}</p>
                    </div>

                    {/* Concept & Note */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4">
                        <span className="text-slate-400 font-bold block mb-1">Concepto de Pago:</span>
                        <p className="text-slate-800 font-medium leading-relaxed">{transaction.description}</p>
                    </div>

                    {/* QR Code and Validation */}
                    <div className="pt-4 text-center border-t border-dashed border-slate-300">
                        {qrDataUrl ? (
                            <img 
                                src={qrDataUrl}
                                alt="QR Validación Oficial"
                                className="w-24 h-24 mx-auto mb-2 object-contain"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-slate-100 mx-auto mb-2 flex items-center justify-center text-[10px] text-slate-400">
                                Generando QR...
                            </div>
                        )}
                        <p className="text-[11px] text-slate-500 font-bold">Escanee el código QR para validar la autenticidad de este recibo electrónico.</p>
                        <p className="text-[10px] text-slate-400 mt-1 italic">© {activeCompanySettings.name} — Documento oficial emitido electrónicamente.</p>
                    </div>

                </div>

            </div>

            {/* Edit Payment Modal */}
            <EditPaymentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                transaction={transaction}
            />
        </div>
    );
};
