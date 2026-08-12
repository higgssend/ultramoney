import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccounting, useSettings } from '../context/StoreContext';
import { Download, Image, CheckCircle, Smartphone, User, CreditCard, ShieldCheck, FileText, Calendar, DollarSign, Clock, ChevronLeft, Shield, AlertTriangle } from 'lucide-react';
import { Transaction, Loan, Client, formatLoanId, formatReceiptId } from '../types';
import { insforge } from '../lib/insforge';
import html2canvas from 'html2canvas';

export const ReceiptView: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>();
    const { transactions } = useAccounting();
    const { companySettings } = useSettings();
    
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loan, setLoan] = useState<any | null>(null);
    const [client, setClient] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('printable-voucher-card');
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `Recibo_${formatReceiptId(transactionId || '1')}.png`;
            link.click();
        } catch (e) {
            console.error("Error exportando imagen:", e);
        }
    };

    useEffect(() => {
        const fetchReceiptDetails = async () => {
            if (!transactionId) {
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch transaction directly from DB if not in local store
                let txData: any = transactions.find(t => t.id === transactionId);
                
                if (!txData) {
                    const { data, error } = await insforge.database
                        .from('transactions')
                        .select('*')
                        .eq('id', transactionId)
                        .maybeSingle();

                    if (data && !error) {
                        txData = {
                            ...data,
                            referenceId: data.referenceid || data.reference_id || data.referenceId,
                            paymentType: data.paymenttype || data.payment_type || data.paymentType,
                            paymentMethod: data.paymentmethod || data.payment_method || data.paymentMethod || 'Efectivo',
                            invoiceDate: data.invoicedate || data.invoice_date || data.invoiceDate
                        };
                    }
                }

                if (txData) {
                    setTransaction(txData as Transaction);
                    const refId = txData.referenceId || txData.referenceid;

                    // 2. Fetch associated Loan from DB
                    if (refId) {
                        const { data: loanRes } = await insforge.database
                            .from('loans')
                            .select('*')
                            .eq('id', refId)
                            .maybeSingle();

                        if (loanRes) {
                            setLoan(loanRes);
                            const clientId = loanRes.clientid || loanRes.client_id || loanRes.clientId;

                            // 3. Fetch associated Client from DB
                            if (clientId) {
                                const { data: clientRes } = await insforge.database
                                    .from('clients')
                                    .select('*')
                                    .eq('id', clientId)
                                    .maybeSingle();
                                if (clientRes) {
                                    setClient(clientRes);
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Error cargando detalles del recibo:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchReceiptDetails();
    }, [transactionId, transactions]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-bold">Generando recibo oficial...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Recibo No Encontrado</h1>
                <p className="text-slate-500 text-center max-w-md">El recibo consultado no existe o el enlace es incorrecto.</p>
                <Link to="/pagos" className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors">Volver a Cobranza</Link>
            </div>
        );
    }

    // Financial breakdown values
    const paymentAmount = Number(transaction.amount || 0);
    const currentBalance = loan ? Number(loan.remainingbalance ?? loan.remainingBalance ?? 0) : 0;
    const previousBalance = loan ? currentBalance + paymentAmount : paymentAmount;
    
    // Payment type classification
    const rawPaymentType = (transaction as any).paymenttype || (transaction as any).payment_type || transaction.paymentType;
    let capitalPaid = 0;
    let interestPaid = 0;
    let lateFeePaid = 0;

    if (rawPaymentType === 'Capital') {
        capitalPaid = paymentAmount;
    } else if (rawPaymentType === 'Interes' || rawPaymentType === 'Interés') {
        interestPaid = paymentAmount;
    } else if (transaction.description?.toLowerCase().includes('mora')) {
        lateFeePaid = paymentAmount;
    } else {
        interestPaid = paymentAmount;
    }

    // Overdue calculation
    let daysOverdue = 0;
    const nextDateStr = loan?.nextpaymentdate || loan?.nextPaymentDate;
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
        if (loan.collateralref || loan.collateralRef) {
            collateralText = String(loan.collateralref || loan.collateralRef);
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

    const rawDateStr = (transaction as any).created_at || transaction.date;
    const parsedDate = rawDateStr 
        ? (rawDateStr.includes('T') 
            ? new Date(rawDateStr) 
            : new Date(`${rawDateStr}T${new Date().toTimeString().split(' ')[0]}`)) 
        : new Date();

    const formattedDate = parsedDate.toLocaleDateString('es-DO', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const formattedTime = parsedDate.toLocaleTimeString('es-DO', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col py-8 sm:px-6 lg:px-8 relative overflow-hidden print:bg-white print:py-0 print:px-0">
            {/* Background glowing effects */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob print:hidden"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob print:hidden"></div>
            
            <div className="sm:mx-auto w-full max-w-lg relative z-10 print:max-w-none">
                
                {/* Action Bar - Hidden on print */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Link to="/pagos" className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Volver a Cobranza
                    </Link>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDownloadImage}
                            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-colors"
                        >
                            <Image className="w-4 h-4" />
                            Imagen (PNG)
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-slate-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Imprimir / Ticket
                        </button>
                    </div>
                </div>

                {/* Main Receipt Voucher Card */}
                <div id="printable-voucher-card" className="bg-white shadow-xl sm:rounded-3xl border border-slate-200 p-6 sm:p-8 print:shadow-none print:border-none print:p-2">
                    
                    {/* Header */}
                    <div className="text-center pb-6 border-b border-dashed border-slate-300">
                        {companySettings.logoUrl ? (
                            <img src={companySettings.logoUrl} alt="Logo Empresa" className="mx-auto h-16 w-auto mb-3 object-contain" />
                        ) : (
                            <div className="mx-auto h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
                                <Smartphone className="w-7 h-7 text-white" />
                            </div>
                        )}
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">{companySettings.name}</h2>
                        {companySettings.rnc && <p className="text-xs font-semibold text-slate-500 mt-0.5">RNC: {companySettings.rnc}</p>}
                        <p className="text-xs text-slate-500">{companySettings.address}</p>
                        <p className="text-xs text-slate-500">Teléfono: {companySettings.phone}</p>
                        
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
                            <span className="font-extrabold text-indigo-600 uppercase">{transaction.paymentMethod || transaction.paymentType || 'Efectivo'}</span>
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
                            <span className="font-black text-slate-900 text-sm">{client?.name || loan?.clientname || loan?.clientName || 'Cliente General'}</span>
                        </div>
                        {client?.cedula && (
                            <div className="flex justify-between items-center px-1">
                                <span className="text-slate-500 font-medium">Cédula / Documento:</span>
                                <span className="font-mono font-bold text-slate-800">{client.cedula}</span>
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
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs mb-4">
                        <span className="font-black text-slate-700 uppercase text-[10px] block mb-2 tracking-wider border-b border-slate-200 pb-1">
                            Desglose de Pago & Estado del Préstamo
                        </span>
                        
                        <div className="flex justify-between text-slate-600">
                            <span>Abono a Capital:</span>
                            <span className="font-bold text-slate-800">RD$ {capitalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between text-slate-600">
                            <span>Interés Pagado:</span>
                            <span className="font-bold text-slate-800">RD$ {interestPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between text-slate-600">
                            <span>Mora / Recargo por Atraso:</span>
                            <span className={`font-bold ${lateFeePaid > 0 ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                                RD$ {lateFeePaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                            <span>Estado de Atraso:</span>
                            <span className={`font-bold ${daysOverdue > 0 ? 'text-rose-600 font-black' : 'text-emerald-700 font-bold'}`}>
                                {daysOverdue > 0 ? `En Atraso (${daysOverdue} días de mora)` : 'Sin Atraso (0 días moroso)'}
                            </span>
                        </div>

                        <div className="flex justify-between text-slate-600">
                            <span>Balance Anterior:</span>
                            <span className="font-bold text-slate-800">RD$ {previousBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-200 text-sm">
                            <span>(=) Balance Restante Pendiente:</span>
                            <span className="text-indigo-700">RD$ {currentBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

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
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.href)}`}
                            alt="QR Validación"
                            className="w-20 h-20 mx-auto mb-2"
                        />
                        <p className="text-[11px] text-slate-400 font-medium">Escanee el código QR para validar la autenticidad de este recibo electrónico.</p>
                        <p className="text-[10px] text-slate-400 mt-2 italic">© {companySettings.name} — Documento oficial emitido electrónicamente.</p>
                    </div>

                </div>

            </div>
        </div>
    );
};
