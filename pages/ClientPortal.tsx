import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/StoreContext';
import { Smartphone, CreditCard, Clock, FileText, CheckCircle, ArrowRight, ShieldCheck, Download, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { Loan, Transaction, CompanySettings, Client } from '../types';
import { useParams } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { addWeeks, addMonths, addDays } from 'date-fns';

export const ClientPortal: React.FC = () => {
    const { companySettings } = useSettings();
    const { clientId } = useParams<{ clientId: string }>(); // Can be UUID or portal_alias
    
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [authError, setAuthError] = useState('');
    
    // Client State
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    
    // Data State
    const [clientLoans, setClientLoans] = useState<Loan[]>([]);
    const [clientTransactions, setClientTransactions] = useState<Transaction[]>([]);
    const [clientDocuments, setClientDocuments] = useState<any[]>([]);

    // Helper for theoretical installments
    const getInstallmentAmount = (loan: Loan) => {
        if (!loan.durationWeeks || loan.durationWeeks <= 0) return loan.amount;
        return (loan.amount / loan.durationWeeks) + ((loan.amount * (loan.interestRate / 100)));
    };

    const getNextDate = (loan: Loan) => {
        if (!loan.startDate) return new Date();
        const start = new Date(loan.startDate);
        // Approximation based on frequency
        if (loan.frequency === 'Semanal') return addWeeks(start, 1);
        if (loan.frequency === 'Quincenal') return addDays(start, 15);
        if (loan.frequency === 'Mensual') return addMonths(start, 1);
        if (loan.frequency === 'Diario') return addDays(start, 1);
        return start;
    };

    // Initial Auth Check
    useEffect(() => {
        if (!clientId) return;
        
        async function fetchClientData() {
            try {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId as string);
                let query = insforge.database.from('clients').select('*');
                
                if (isUuid) {
                    query = query.eq('id', clientId);
                } else {
                    query = query.eq('portal_alias', clientId);
                }
                
                const { data: cData, error: clientErr } = await query.single();
                
                if (clientErr || !cData) {
                    setNotFound(true);
                    return;
                }

                const foundClient = cData as any;
                
                if (foundClient.portal_active === false) {
                    setAccessDenied(true);
                    setIsLoading(false);
                    return;
                }

                const mappedClient: Client = {
                    ...foundClient,
                    clientPin: foundClient.clientpin,
                    portalAlias: foundClient.portal_alias,
                    portalActive: foundClient.portal_active
                };
                
                setClient(mappedClient);

                // If no pin is set, we bypass auth
                if (!mappedClient.clientPin) {
                    await fetchClientDetails(mappedClient.id);
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error("Error fetching client for portal:", err);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }
        fetchClientData();
    }, [clientId]);

    const fetchClientDetails = async (id: string) => {
        try {
            const { data: lData } = await insforge.database.from('loans').select('*').eq('clientId', id);
            if (lData) {
                setClientLoans(lData as any);
                const lIds = lData.map((l: any) => l.id);
                if (lIds.length > 0) {
                    const { data: tData } = await insforge.database.from('transactions').select('*').in('referenceId', lIds);
                    if (tData) {
                        setClientTransactions(tData.sort((a: any,b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    }
                }
            }
            // Fetch Documents
            const { data: docsData } = await insforge.database.from('client_documents').select('*').eq('client_id', id);
            if (docsData) {
                setClientDocuments(docsData);
            }
        } catch (err) {
            console.error("Error fetching details", err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
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

        await fetchClientDetails(client.id);
        setIsAuthenticated(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <XCircle className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">Cliente no encontrado</h2>
                <p className="text-slate-500 mt-2 text-center">El enlace que ingresaste es inválido o no existe.</p>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Acceso Desactivado</h2>
                <p className="text-slate-500 mt-2 text-center">Tu acceso al portal ha sido desactivado temporalmente. Por favor, contacta a {companySettings.name}.</p>
            </div>
        );
    }

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
                        Hola, {client?.name.split(' ')[0]}
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Bienvenido al portal de {companySettings.name}
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <label htmlFor="pin" className="block text-sm font-medium text-slate-700 text-center mb-4">
                                    Ingresa tu PIN de Seguridad (4 dígitos)
                                </label>
                                <div className="mt-1 flex justify-center">
                                    <input
                                        id="pin"
                                        name="pin"
                                        type="password"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        required
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        className="appearance-none block w-32 px-3 py-3 text-center text-2xl tracking-widest font-bold border-2 border-slate-300 rounded-xl shadow-sm placeholder-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder="••••"
                                        maxLength={4}
                                    />
                                </div>
                            </div>

                            {authError && (
                                <div className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100 text-center font-medium">
                                    {authError}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                                >
                                    Ingresar a mi cuenta <ArrowRight className="ml-2 w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            {companySettings.logoUrl ? (
                                <img src={companySettings.logoUrl} alt="Logo" className="h-8 w-auto" />
                            ) : (
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <span className="font-bold text-slate-800">{companySettings.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800">{client?.name}</p>
                                <p className="text-xs text-slate-500">Miembro desde {client?.joinedDate ? new Date(client.joinedDate).getFullYear() : 'N/A'}</p>
                            </div>
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                {client?.name.charAt(0)}{client?.lastName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* Active Loans Section */}
                <section>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center mb-4">
                        <CreditCard className="w-5 h-5 mr-2 text-indigo-500" /> Mis Préstamos
                    </h2>
                    
                    {clientLoans.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-800">No tienes préstamos activos</h3>
                            <p className="text-slate-500 mt-1">Tu cuenta está al día.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {clientLoans.map(loan => (
                                <div key={loan.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        {loan.status}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-sm text-slate-500 font-medium">{loan.loanType}</p>
                                                <h3 className="text-2xl font-bold text-slate-900">
                                                    RD$ {loan.remainingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-1">Saldo Restante</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div>
                                                <div className="flex items-center text-slate-500 text-xs mb-1">
                                                    <Calendar className="w-3 h-3 mr-1" /> Próximo Pago
                                                </div>
                                                <p className="font-semibold text-slate-800">
                                                    {getNextDate(loan).toLocaleDateString('es-DO')}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="flex items-center text-slate-500 text-xs mb-1">
                                                    <CreditCard className="w-3 h-3 mr-1" /> Cuota {loan.frequency}
                                                </div>
                                                <p className="font-semibold text-slate-800">
                                                    RD$ {getInstallmentAmount(loan).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs text-slate-500 font-mono">ID: {loan.id.substring(0,8).toUpperCase()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Recent Documents & Receipts */}
                <section>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center mb-4">
                        <FileText className="w-5 h-5 mr-2 text-indigo-500" /> Mis Documentos y Recibos
                    </h2>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {clientDocuments.length === 0 && clientTransactions.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-slate-500">No hay documentos generados recientemente.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {/* First show actual uploaded PDF documents */}
                                {clientDocuments.map(doc => (
                                    <li key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{doc.title}</p>
                                                <p className="text-xs text-slate-500">{new Date(doc.upload_date).toLocaleDateString('es-DO')} • {doc.type}</p>
                                            </div>
                                        </div>
                                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors">
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </li>
                                ))}
                                
                                {/* Fallback list for transactions that didn't generate a PDF */}
                                {clientTransactions.slice(0, 5).map(t => {
                                    // If we already have a PDF for this receipt (approximate match), maybe skip it, but let's just show it
                                    return (
                                        <li key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">Recibo de Pago: {t.description}</p>
                                                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('es-DO')} • RD$ {t.amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                                Procesado
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </section>

                <footer className="text-center pt-8 pb-4">
                    <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} {companySettings.name}. Todos los derechos reservados.</p>
                </footer>
            </main>
        </div>
    );
};
