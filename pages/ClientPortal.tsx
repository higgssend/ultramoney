import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Smartphone, CreditCard, Clock, FileText, CheckCircle, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { Loan, Transaction, CompanySettings, Client } from '../types';
import { useParams } from 'react-router-dom';

export const ClientPortal: React.FC = () => {
    const { clients, loans, transactions, companySettings } = useStore();
    const { clientId } = useParams<{ clientId: string }>();
    
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [authError, setAuthError] = useState('');
    
    // Client State
    const [client, setClient] = useState<Client | null>(null);
    const [clientLoans, setClientLoans] = useState<Loan[]>([]);
    const [clientTransactions, setClientTransactions] = useState<Transaction[]>([]);

    // Initial Auth Check
    useEffect(() => {
        if (!clientId) return;
        
        async function fetchClientData() {
            try {
                // We use dynamic import for insforge to avoid circular dependencies if any
                const { insforge } = await import('../lib/insforge');
                const { data: cData } = await insforge.database.from('clients').select('*').eq('id', clientId).single();
                
                if (cData) {
                    const foundClient = cData as unknown as Client;
                    setClient(foundClient);
                    
                    const { data: lData } = await insforge.database.from('loans').select('*').eq('clientId', clientId);
                    if (lData) {
                        setClientLoans(lData as unknown as Loan[]);
                        const lIds = lData.map((l: any) => l.id);
                        if (lIds.length > 0) {
                            const { data: tData } = await insforge.database.from('transactions').select('*').in('referenceId', lIds);
                            if (tData) {
                                setClientTransactions(tData.sort((a: any,b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) as unknown as Transaction[]);
                            }
                        }
                    }

                    if (!foundClient.clientPin) {
                        // Auto-login si no tiene PIN
                        setIsAuthenticated(true);
                    }
                }
            } catch (err) {
                console.error("Error fetching client for portal:", err);
            }
        }
        fetchClientData();
    }, [clientId]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        
        if (!client) {
            setAuthError('Enlace inválido o cliente no encontrado.');
            return;
        }
        
        if (client.clientPin !== pin) {
            setAuthError('PIN incorrecto.');
            return;
        }

        // Success
        setClientLoans(loans.filter(l => l.clientId === client.id));
        const myLoanIds = loans.filter(l => l.clientId === client.id).map(l => l.id);
        setClientTransactions(transactions.filter(t => myLoanIds.includes(t.referenceId)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setIsAuthenticated(true);
    };

    const handleDownloadReceipt = (t: Transaction) => {
        // We will generate a simple PDF/Image for the receipt or just trigger print
        const printContent = document.getElementById(`receipt-hidden-${t.id}`);
        if (printContent) {
            const windowUrl = 'about:blank';
            const uniqueName = new Date();
            const windowName = 'Print' + uniqueName.getTime();
            const printWindow = window.open(windowUrl, windowName, 'width=400,height=600');
            
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Recibo ${t.id}</title>
                            <style>
                                body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; max-width: 350px; margin: 0 auto; color: #000; }
                                .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                                .header h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
                                .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                                .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                ${companySettings.logoUrl ? `<img src="${companySettings.logoUrl}" style="max-height: 60px; margin: 0 auto 10px;" />` : ''}
                                <h2>${companySettings.name}</h2>
                                <p style="margin-top:5px"><strong>RECIBO DE PAGO</strong></p>
                            </div>
                            <div class="row"><span>Recibo #:</span> <span>${t.id}</span></div>
                            <div class="row"><span>Fecha:</span> <span>${t.date}</span></div>
                            <div class="divider"></div>
                            <div class="row"><strong>Monto Pagado:</strong> <span>$${t.amount.toLocaleString()}</span></div>
                            <div class="row"><span>Nota:</span> <span>${t.description}</span></div>
                            <div class="divider"></div>
                            <div style="text-align:center; margin-top: 20px;">
                                <p>Gracias por su pago.</p>
                            </div>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                
                <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                    {companySettings.logoUrl ? (
                        <img src={companySettings.logoUrl} alt="Logo" className="mx-auto h-16 w-auto mb-4 object-contain" />
                    ) : (
                        <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <h2 className="text-center text-3xl font-extrabold text-slate-900">
                        Portal de Clientes
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        {companySettings.name}
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-100">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
                                    PIN de Acceso
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="pin"
                                        name="pin"
                                        type="password"
                                        required
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="****"
                                        maxLength={4}
                                    />
                                </div>
                            </div>

                            {authError && (
                                <div className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                                    {authError}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Ingresar al Portal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (!client) return null;

    return (
        <div className="min-h-screen bg-slate-50 relative pb-20">
            {/* Realtime Indicator */}
            <div className="bg-emerald-500 text-white text-[10px] uppercase font-bold text-center py-1 tracking-widest flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Conexión Segura Real-Time
            </div>

            {/* Header */}
            <div className="bg-indigo-600 px-4 pt-8 pb-10 rounded-b-[2.5rem] shadow-lg text-white relative">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-indigo-200 text-sm">Bienvenido,</p>
                        <h3 className="text-2xl font-bold">{client.name.split(' ')[0]}</h3>
                    </div>
                    {companySettings.logoUrl ? (
                        <div className="w-12 h-12 bg-white p-1 rounded-full shadow-md flex items-center justify-center">
                            <img src={companySettings.logoUrl} alt="Logo" className="max-h-full object-contain rounded-full" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    )}
                </div>
                
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                    <p className="text-sm text-indigo-100 mb-1">Total Adeudado</p>
                    <div className="flex justify-between items-end">
                        <span className="text-3xl font-bold">
                            ${clientLoans.reduce((acc, curr) => acc + curr.remainingBalance, 0).toLocaleString()}
                        </span>
                        <span className="text-xs bg-white text-indigo-700 px-3 py-1 rounded-full font-bold shadow-sm">
                            {clientLoans.filter(l => l.status === 'Activo' || l.status === 'Atrasado').length} Préstamo(s)
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 -mt-6 relative z-10 max-w-md mx-auto">
                <h4 className="font-bold text-slate-800 mb-4 ml-1">Mis Préstamos</h4>
                
                {clientLoans.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                        <p className="text-slate-500">No tienes préstamos registrados.</p>
                    </div>
                ) : (
                    clientLoans.map(loan => (
                        <div key={loan.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 hover:shadow-md transition-shadow relative overflow-hidden">
                            {loan.status === 'Completado' && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 text-white font-bold text-[10px] transform rotate-45 flex items-end justify-center pb-2 translate-x-8 -translate-y-8 shadow-sm">PAGADO</div>}
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{loan.loanType}</span>
                                <span className={`text-xs font-bold ${loan.status === 'Atrasado' ? 'text-rose-500' : 'text-slate-400'}`}>{loan.status}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mb-3">
                                <div>
                                    <p className="text-xs text-slate-400">Próxima Cuota</p>
                                    <p className="font-bold text-slate-700">${loan.installmentAmount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Balance</p>
                                    <p className="font-bold text-slate-700">${loan.remainingBalance.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            {/* Progress */}
                            {loan.status !== 'Completado' && (
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>Progreso</span>
                                        <span>{(loan.installments || []).filter(i => i.status === 'Pagada').length} / {(loan.installments || []).length} Cuotas</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                        <div className="bg-indigo-600 h-1.5 rounded-full" 
                                            style={{width: `${Math.min(100, ((loan.installments || []).filter(i => i.status === 'Pagada').length / Math.max((loan.installments || []).length, 1)) * 100)}%`}}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Transactions */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4 ml-1">
                        <h4 className="font-bold text-slate-800">Historial de Pagos</h4>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {clientTransactions.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                No hay pagos registrados.
                            </div>
                        ) : (
                            clientTransactions.map((t, idx) => (
                                <div key={t.id} className={`flex items-center gap-3 p-4 ${idx !== clientTransactions.length -1 ? 'border-b border-slate-50' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{t.description}</p>
                                        <p className="text-xs text-slate-400">{t.date}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className="font-bold text-slate-800">${t.amount.toLocaleString()}</span>
                                        <button 
                                            onClick={() => handleDownloadReceipt(t)}
                                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold"
                                        >
                                            <Download className="w-3 h-3" /> Recibo
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {/* Logout */}
            <div className="max-w-md mx-auto mt-8 px-4 text-center pb-8">
                <button onClick={() => { setIsAuthenticated(false); setClient(null); setPin(''); }} className="text-sm text-slate-500 hover:text-slate-700 underline">
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};
