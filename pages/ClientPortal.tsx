import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/StoreContext';
import { Smartphone, CreditCard, Clock, FileText, CheckCircle, ArrowRight, ShieldCheck, Download, XCircle, AlertCircle, Calendar, ExternalLink, Printer, LogOut, CheckCircle2, Lock, ArrowUpRight, Percent, Award, Sparkles, Building2, PhoneCall } from 'lucide-react';
import { Loan, Transaction, CompanySettings, Client, formatLoanId, formatReceiptId, LoanStatus } from '../types';
import type { ClientDB, LoanDB, TransactionDB, ClientDocumentDB } from '../types.db';
import { useParams, Link } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { formatExactDateTime, formatPaymentDateDisplay } from '../utils/dateUtils';

export const ClientPortal: React.FC = () => {
    const { companySettings: globalSettings } = useSettings();
    const { clientId } = useParams<{ clientId: string }>();
    
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
    const [clientDocuments, setClientDocuments] = useState<ClientDocumentDB[]>([]);

    // Lender Company Settings State (for custom branding)
    const [lenderBranding, setLenderBranding] = useState<CompanySettings | null>(null);

    const activeCompany = lenderBranding || globalSettings;

    // Helpers
    const getInstallmentAmount = (loan: Loan) => {
        const total = loan.totalToPay || loan.amount || 0;
        const count = loan.durationWeeks || loan.installments || 1;
        if (total > 0 && count > 0) return total / count;
        return loan.amount || 0;
    };

    const getNextDate = (loan: Loan) => {
        const nextStr = loan.nextPaymentDate || loan.startDate;
        if (nextStr) {
            const parsed = new Date(nextStr + 'T12:00:00');
            if (!isNaN(parsed.getTime())) return parsed;
        }
        return new Date();
    };

    // Initial Client Lookup
    useEffect(() => {
        if (!clientId) return;
        
        async function fetchClientData() {
            try {
                const term = clientId.trim();
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(term);
                let cData: ClientDB | null = null;

                // 1. Try ID if valid UUID
                if (isUuid) {
                    const { data } = await insforge.database.from('clients').select('*').eq('id', term).maybeSingle();
                    cData = data as ClientDB | null;
                }
                
                // 2. Try portal_alias as passed
                if (!cData) {
                    const { data: aliasData } = await insforge.database.from('clients').select('*').eq('portal_alias', term).maybeSingle();
                    cData = aliasData;
                }

                // 3. Try portal_alias variation (with @ or stripped of @)
                if (!cData) {
                    const altAlias = term.startsWith('@') ? term.substring(1) : `@${term}`;
                    const { data: aliasData2 } = await insforge.database.from('clients').select('*').eq('portal_alias', altAlias).maybeSingle();
                    cData = aliasData2;
                }

                // 4. Try cedula as passed
                if (!cData) {
                    const { data: cedulaData } = await insforge.database.from('clients').select('*').eq('cedula', term).maybeSingle();
                    cData = cedulaData;
                }

                // 5. Try cedula stripped of non-digits
                if (!cData) {
                    const cleanDigits = term.replace(/\D/g, '');
                    if (cleanDigits.length >= 7) {
                        const { data: allClients } = await insforge.database.from('clients').select('*');
                        if (allClients) {
                            cData = (allClients as ClientDB[]).find((c) => (c.cedula || '').replace(/\D/g, '') === cleanDigits) || null;
                        }
                    }
                }
                
                if (!cData) {
                    setNotFound(true);
                    return;
                }

                const foundClient = cData;
                
                if (foundClient.portal_active === false) {
                    setAccessDenied(true);
                    setIsLoading(false);
                    return;
                }

                const mappedClient: Client = {
                    ...foundClient,
                    id: foundClient.id,
                    name: foundClient.name || 'Cliente',
                    lastName: foundClient.lastname || '',
                    sex: (foundClient.sex || 'Otro') as Client['sex'],
                    occupation: foundClient.occupation || '',
                    income: Number(foundClient.income || 0),
                    creditScore: Number(foundClient.credit_score || 700),
                    status: (foundClient.status || 'Activo') as Client['status'],
                    joinedDate: foundClient.joineddate || foundClient.created_at || new Date().toISOString(),
                    cedula: foundClient.cedula || '',
                    address: foundClient.address || '',
                    phone: foundClient.phone || '',
                    clientPin: foundClient.clientpin,
                    portalAlias: foundClient.portal_alias,
                    portalActive: foundClient.portal_active ?? true,
                    avatarUrl: foundClient.avatarurl || foundClient.avatar_url || ''
                };
                
                setClient(mappedClient);

                // Fetch Lender Company Settings if lender_id exists
                if (foundClient.lender_id) {
                    try {
                        const { data: sData } = await insforge.database.from('company_settings').select('*').eq('lender_id', foundClient.lender_id).maybeSingle();
                        if (sData) {
                            setLenderBranding({
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
                        console.warn("No se cargó configuración del prestamista:", e);
                    }
                }

                // If no pin is set or portal is open, fetch details & authenticate immediately
                const hasCustomPin = Boolean(mappedClient.clientPin && mappedClient.clientPin.trim() !== '');
                if (!hasCustomPin) {
                    await fetchClientDetails(mappedClient.id);
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error("Error cargando portal de cliente:", err);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }
        fetchClientData();
    }, [clientId]);

    const fetchClientDetails = async (id: string) => {
        try {
            // 1. Fetch Loans for this client
            let { data: lData } = await insforge.database
                .from('loans')
                .select('*')
                .eq('clientid', id);

            if (!lData || lData.length === 0) {
                const { data: lData2 } = await insforge.database
                    .from('loans')
                    .select('*')
                    .eq('client_id', id);
                if (lData2) lData = lData2;
            }

            if (lData && lData.length > 0) {
                const mappedLoans: Loan[] = (lData as LoanDB[]).map((l) => ({
                    id: l.id,
                    clientId: l.client_id || l.clientid || id,
                    clientName: l.client_name || l.clientname || 'Cliente',
                    amount: Number(l.amount || 0),
                    remainingBalance: Number(l.remainingbalance ?? l.remaining_balance ?? l.amount ?? 0),
                    totalToPay: Number(l.totaltopay ?? l.total_to_pay ?? l.amount ?? 0),
                    loanType: (l.loantype || l.loan_type || 'Amortizado (Cuota Fija)') as Loan['loanType'],
                    loanCategory: (l.loancategory || l.loan_category || 'Personal') as Loan['loanCategory'],
                    frequency: (l.frequency || 'Mensual') as Loan['frequency'],
                    interestRate: Number(l.interestrate ?? l.interest_rate ?? 0),
                    durationWeeks: Number(l.durationweeks ?? l.duration_weeks ?? l.installments ?? 1),
                    status: (l.status || 'Activo') as LoanStatus,
                    startDate: l.startdate || l.start_date || l.created_at || new Date().toISOString().split('T')[0],
                    nextPaymentDate: l.nextpaymentdate || l.next_payment_date || '',
                    collateral: l.collateral as unknown as Loan['collateral'],
                    guarantors: Array.isArray(l.guarantors) ? (l.guarantors as unknown as Loan['guarantors']) : undefined,
                    currency: (l.currency === 'USD' ? 'USD' : 'DOP') as 'DOP' | 'USD',
                }));

                setClientLoans(mappedLoans);

                const lIds = (lData as LoanDB[]).map((l) => l.id);
                if (lIds.length > 0) {
                    // 2. Fetch Transactions
                    let { data: tData } = await insforge.database
                        .from('transactions')
                        .select('*')
                        .in('referenceid', lIds);

                    if (!tData || tData.length === 0) {
                        const { data: tData2 } = await insforge.database
                            .from('transactions')
                            .select('*')
                            .in('reference_id', lIds);
                        if (tData2) tData = tData2;
                    }

                    if (tData) {
                        const mappedTx: Transaction[] = (tData as TransactionDB[]).map((t) => ({
                            id: t.id,
                            type: (t.type === 'Gasto' ? 'Gasto' : 'Ingreso') as 'Ingreso' | 'Gasto',
                            category: (t.category || 'Pago Préstamo') as Transaction['category'],
                            amount: Number(t.amount || 0),
                            date: t.date || t.created_at || new Date().toISOString(),
                            description: t.description || 'Pago de Préstamo',
                            paymentMethod: (t.paymentmethod || t.payment_method || 'Efectivo') as Transaction['paymentMethod'],
                            paymentType: (t.paymenttype || t.payment_type || 'Ingreso') as Transaction['paymentType'],
                            referenceId: t.referenceid || t.reference_id,
                            currency: (t.currency === 'USD' ? 'USD' : 'DOP') as 'DOP' | 'USD',
                            previousBalance: t.previous_balance !== undefined ? Number(t.previous_balance) : undefined,
                            newBalance: t.new_balance !== undefined ? Number(t.new_balance) : undefined,
                            capitalAmount: t.capital_amount !== undefined ? Number(t.capital_amount) : undefined,
                            interestAmount: t.interest_amount !== undefined ? Number(t.interest_amount) : undefined,
                            lateFeeAmount: t.late_fee_amount !== undefined ? Number(t.late_fee_amount) : undefined,
                            discountAmount: t.discount_amount !== undefined ? Number(t.discount_amount) : undefined,
                        }));
                        setClientTransactions(mappedTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    }
                }
            }

            // 3. Fetch Documents
            const { data: docsData } = await insforge.database
                .from('client_documents')
                .select('*')
                .eq('client_id', id);

            if (docsData) {
                setClientDocuments(docsData);
            }
        } catch (err) {
            console.error("Error cargando detalles del cliente en portal:", err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        
        if (!client) {
            setAuthError('Enlace inválido o cliente no encontrado.');
            return;
        }

        const inputClean = pin.trim();
        const configuredPin = client.clientPin ? client.clientPin.trim() : '';
        const last4Cedula = (client.cedula || '').replace(/\D/g, '').slice(-4);
        const last4Phone = (client.phone || '').replace(/\D/g, '').slice(-4);

        const isPinValid = 
            !configuredPin || 
            inputClean === configuredPin || 
            (last4Cedula && last4Cedula.length === 4 && inputClean === last4Cedula) ||
            (last4Phone && last4Phone.length === 4 && inputClean === last4Phone);

        if (!isPinValid) {
            setAuthError('PIN incorrecto. Puedes ingresar tu PIN asignado o los últimos 4 dígitos de tu cédula.');
            return;
        }

        await fetchClientDetails(client.id);
        setIsAuthenticated(true);
    };

    // Calculate Global Totals
    const totalRemaining = clientLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
    const totalInitial = clientLoans.reduce((sum, l) => sum + (l.totalToPay || l.amount || 0), 0);
    const totalPaid = Math.max(0, totalInitial - totalRemaining);
    const paidPercentage = totalInitial > 0 ? Math.round((totalPaid / totalInitial) * 100) : 100;

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-sm text-slate-300">Cargando Banca Digital...</p>
            </div>
        );
    }

    // Not Found
    if (notFound) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="p-4 bg-rose-500/10 text-rose-400 rounded-3xl mb-4 border border-rose-500/20">
                    <XCircle className="w-14 h-14" />
                </div>
                <h2 className="text-2xl font-black mb-2">Cliente No Encontrado</h2>
                <p className="text-slate-400 text-sm max-w-md mb-6">
                    El enlace o alias que ingresaste no corresponde a ningún cliente registrado o fue modificado.
                </p>
                <div className="text-xs text-slate-500 font-mono bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                    Verifica el alias o solicita un nuevo enlace a tu financiera.
                </div>
            </div>
        );
    }

    // Access Denied
    if (accessDenied) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="p-4 bg-amber-500/10 text-amber-400 rounded-3xl mb-4 border border-amber-500/20">
                    <AlertCircle className="w-14 h-14" />
                </div>
                <h2 className="text-2xl font-black mb-2">Acceso Temporalmente Bloqueado</h2>
                <p className="text-slate-400 text-sm max-w-md mb-6">
                    Tu portal de cliente se encuentra deshabilitado por razones de seguridad o actualización de datos.
                </p>
                <p className="text-xs text-indigo-400 font-bold">
                    Contacta a {activeCompany.name} {activeCompany.phone && `al ${activeCompany.phone}`}
                </p>
            </div>
        );
    }

    // PIN Authentication Screen (Modern Banking Lock Screen)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between py-10 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Branding */}
                <div className="text-center relative z-10 pt-4">
                    {activeCompany.logoUrl ? (
                        <img src={activeCompany.logoUrl} alt="Logo" className="mx-auto h-16 w-auto mb-3 object-contain drop-shadow-lg" />
                    ) : (
                        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <h1 className="text-xl font-black text-white tracking-wide">{activeCompany.name}</h1>
                    <p className="text-xs text-indigo-300 font-medium">Banca Digital de Clientes</p>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-sm mx-auto relative z-10 my-auto">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
                        
                        {client?.avatarUrl ? (
                            <img 
                                src={client.avatarUrl} 
                                alt={client.name} 
                                className="w-20 h-20 rounded-full object-cover mx-auto border-3 border-indigo-500 shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/20" 
                            />
                        ) : (
                            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
                                <Lock className="w-8 h-8" />
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-bold text-white">Hola, {client?.name} {client?.lastName || ''}</h2>
                            <p className="text-xs text-slate-400 mt-1">Ingresa tu PIN de 4 dígitos para acceder a tus préstamos</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    required
                                    autoFocus
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-40 mx-auto text-center text-3xl font-black tracking-[0.5em] py-3.5 bg-slate-950 border-2 border-indigo-500/40 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            {authError && (
                                <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-semibold">
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                Entrar a mi Portal <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[11px] text-slate-500 relative z-10">
                    <p>Acceso seguro cifrado • {activeCompany.name}</p>
                </div>
            </div>
        );
    }

    // Authenticated Digital Banking Dashboard
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">

            {/* Banking Top Header */}
            <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    
                    {/* Logo & Company Name */}
                    <div className="flex items-center gap-3">
                        {activeCompany.logoUrl ? (
                            <img src={activeCompany.logoUrl} alt="Logo" className="h-9 w-auto object-contain" />
                        ) : (
                            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div>
                            <p className="font-black text-white text-sm leading-tight">{activeCompany.name}</p>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Portal del Cliente</p>
                        </div>
                    </div>

                    {/* Client Badge + Lock Exit */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full">
                            {client?.avatarUrl ? (
                                <img 
                                    src={client.avatarUrl} 
                                    alt={client.name} 
                                    className="w-7 h-7 rounded-full object-cover border border-indigo-400 shrink-0" 
                                />
                            ) : (
                                <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0">
                                    {client?.name.charAt(0)}{client?.lastName?.charAt(0) || ''}
                                </div>
                            )}
                            <div className="text-left pr-1">
                                <p className="text-xs font-bold text-white leading-tight">{client?.name} {client?.lastName || ''}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{client?.cedula}</p>
                            </div>
                        </div>

                        {client?.clientPin && (
                            <button
                                onClick={() => { setIsAuthenticated(false); setPin(''); }}
                                title="Cerrar sesión"
                                className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-700/60"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

                {/* Hero Financial Summary Banner (Bank Card Style) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        
                        {/* Left: Total Balance */}
                        <div className="md:col-span-2 space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-500/30">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                Balance Total de Deuda
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                                RD$ {totalRemaining.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            
                            {/* Progress bar */}
                            <div className="pt-2">
                                <div className="flex justify-between text-xs text-indigo-200 font-medium mb-1.5">
                                    <span>Progreso de Pago Global</span>
                                    <span className="font-bold text-emerald-400">{paidPercentage}% Pagado</span>
                                </div>
                                <div className="w-full h-3 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-indigo-500/20">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" 
                                        style={{ width: `${Math.min(100, Math.max(5, paidPercentage))}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right: Quick Action & Status Pill */}
                        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 text-center space-y-3">
                            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                                <span className="text-slate-400">Estado de Cuenta</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    ● AL DÍA
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="text-[11px] text-slate-400 font-medium">Préstamos Activos</p>
                                <p className="text-2xl font-black text-white">{clientLoans.length} operaciones</p>
                            </div>
                            
                            {/* Contact Lender Button */}
                            {activeCompany.phone && (
                                <a
                                    href={`https://wa.me/${activeCompany.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                                >
                                    <PhoneCall className="w-3.5 h-3.5" /> Contactar a Financiera
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 1: Active Loans */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-400" /> Mis Préstamos ({clientLoans.length})
                        </h3>
                    </div>

                    {clientLoans.length === 0 ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                            <h4 className="font-bold text-white text-base">No tienes préstamos pendientes</h4>
                            <p className="text-xs text-slate-400">Todas tus cuentas están completamente al día.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {clientLoans.map(loan => {
                                const instAmt = getInstallmentAmount(loan);
                                const nextDt = getNextDate(loan);
                                const loanPaidPct = loan.totalToPay && loan.totalToPay > 0
                                    ? Math.round(((loan.totalToPay - loan.remainingBalance) / loan.totalToPay) * 100)
                                    : 0;

                                return (
                                    <div key={loan.id} className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 transition-all shadow-lg relative flex flex-col justify-between space-y-4">
                                        
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="inline-block px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-bold mb-1">
                                                    {loan.loanType}
                                                </span>
                                                <p className="text-xs text-slate-400 font-mono">Ref: {formatLoanId(loan.id)}</p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
                                                {loan.status}
                                            </span>
                                        </div>

                                        {/* Main Balance */}
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Balance Pendiente</p>
                                            <p className="text-3xl font-black text-white">
                                                RD$ {loan.remainingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>

                                        {/* Loan Progress */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[11px] text-slate-400">
                                                <span>Pagado: RD$ {(loan.totalToPay - loan.remainingBalance).toLocaleString()}</span>
                                                <span className="font-bold text-indigo-300">{Math.max(0, loanPaidPct)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(3, loanPaidPct)}%` }} />
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cuota ({loan.frequency})</span>
                                                <span className="font-bold text-emerald-400 text-sm">
                                                    RD$ {instAmt.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Próximo Cobro</span>
                                                <span className="font-bold text-white text-sm">
                                                    {loan.nextPaymentDate ? formatPaymentDateDisplay(loan.nextPaymentDate) : nextDt.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Section 2: Recent Payment History & Official Receipts */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" /> Historial de Pagos y Recibos Oficiales
                    </h3>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                        {clientTransactions.length === 0 && clientDocuments.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-xs">
                                No se han registrado pagos o documentos aún.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {clientTransactions.map(t => (
                                    <div key={t.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-sm">Recibo {formatReceiptId(t.id)}</span>
                                                    <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 text-[10px] font-bold rounded-md font-mono">
                                                        {t.paymentMethod}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">{formatExactDateTime(t.date)} • {t.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-emerald-400 text-base">
                                                + RD$ {t.amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <Link
                                                to={`/recibo/${t.id}`}
                                                target="_blank"
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                                            >
                                                <Printer className="w-3.5 h-3.5" /> Ver Recibo
                                            </Link>
                                        </div>
                                    </div>
                                ))}

                                {clientDocuments.map(doc => (
                                    <div key={doc.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/30">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{doc.title}</p>
                                                <p className="text-xs text-slate-400">{new Date(doc.upload_date).toLocaleDateString('es-DO')} • {doc.type}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl transition-all"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center pt-6 pb-2 text-xs text-slate-500 space-y-1">
                    <p>© {new Date().getFullYear()} {activeCompany.name}. Banca Digital Segura.</p>
                    {activeCompany.termsAndConditions && (
                        <p className="text-[10px] text-slate-600 max-w-lg mx-auto leading-relaxed">{activeCompany.termsAndConditions}</p>
                    )}
                </footer>
            </main>
        </div>
    );
};

export default ClientPortal;
