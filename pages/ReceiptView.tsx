import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Download, CheckCircle, Smartphone } from 'lucide-react';
import { Transaction } from '../types';
import { insforge } from '../lib/insforge';


export const ReceiptView: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>();
    const { transactions, companySettings } = useStore();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReceipt = async () => {
            if (transactionId) {
                // Primero intentar desde el estado local si ya est cargado (usuario autenticado navegando)
                const found = transactions.find(t => t.id === transactionId);
                if (found) {
                    setTransaction(found);
                    setLoading(false);
                    return;
                }
                
                // Si no, intentar fetchear directamente desde Supabase/InsForge
                try {
                    const { data, error } = await insforge.database.from('transactions').select('*').eq('id', transactionId).single();
                    if (data && !error) {
                        setTransaction({
                            ...data,
                            referenceId: data.reference_id,
                            paymentType: data.payment_type,
                            paymentMethod: data.payment_method,
                            invoiceDate: data.invoice_date
                        } as unknown as Transaction);
                    }
                } catch(e) {
                    console.error("Error fetching receipt:", e);
                }
            }
            setLoading(false);
        };
        fetchReceipt();
    }, [transactionId, transactions]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Buscando recibo...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Recibo no encontrado</h1>
                <p className="text-slate-500 text-center max-w-md">El enlace que intentas abrir no es válido o el recibo ha sido eliminado del sistema.</p>
                <Link to="/" className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Volver al Inicio</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col py-12 sm:px-6 lg:px-8 relative overflow-hidden print:bg-white print:py-0 print:px-0">
            {/* Background elements */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob print:hidden"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 print:hidden"></div>
            
            <div className="sm:mx-auto w-full max-w-md relative z-10 print:max-w-none">
                
                {/* Action Bar - Hidden on print */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex items-center justify-between print:hidden">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Recibo Original
                    </span>
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Descargar / Imprimir
                    </button>
                </div>

                {/* Receipt Card */}
                <div className="bg-white shadow-xl sm:rounded-2xl border border-slate-200 p-8 print:shadow-none print:border-none print:p-4">
                    <div className="text-center mb-8 pb-8 border-b border-dashed border-slate-300">
                        {companySettings.logoUrl ? (
                            <img src={companySettings.logoUrl} alt="Logo" className="mx-auto h-16 w-auto mb-4 object-contain" />
                        ) : (
                            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                                <Smartphone className="w-8 h-8 text-white" />
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wider">{companySettings.name}</h2>
                        <p className="text-slate-500 text-sm">{companySettings.address}</p>
                        <p className="text-slate-500 text-sm">RNC: {companySettings.rnc}</p>
                        <p className="text-slate-500 text-sm">Tel: {companySettings.phone}</p>
                        
                        {/* QR Code in Visual Preview */}
                        <div className="flex justify-center mt-4">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.href)}`}
                                alt="QR Code del recibo"
                                className="w-24 h-24"
                            />
                        </div>
                        
                        <div className="mt-6 inline-block bg-slate-100 px-4 py-2 rounded-lg">
                            <p className="text-xs font-bold text-slate-500 uppercase">Comprobante de Pago</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Recibo No.</span>
                            <span className="font-mono font-bold text-slate-800">{transaction.id.split('-')[0].toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Fecha</span>
                            <span className="font-bold text-slate-800">{new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Método de Pago</span>
                            <span className="font-bold text-slate-800 uppercase">{transaction.paymentType || 'Transferencia'}</span>
                        </div>
                    </div>

                    <div className="my-8 py-6 border-y border-dashed border-slate-300">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-500 uppercase">Monto Recibido</span>
                            <span className="text-4xl font-black text-slate-900">
                                {companySettings.currency} {transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-xl">
                        <p className="text-slate-700"><strong>Concepto:</strong> {transaction.description}</p>
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-xs text-slate-400 font-medium">Este documento es un comprobante válido de pago electrónico emitido por {companySettings.name}.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
