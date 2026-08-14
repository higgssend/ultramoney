import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/StoreContext';
import { 
    CreditCard, 
    FileText, 
    CheckCircle, 
    ArrowRight, 
    ShieldCheck, 
    Download, 
    XCircle, 
    Printer, 
    LogOut, 
    CheckCircle2, 
    Lock, 
    Sparkles, 
    Building2, 
    PhoneCall, 
    Phone, 
    MapPin, 
    DollarSign, 
    ChevronRight, 
    Filter, 
    Receipt, 
    Eye, 
    X
} from 'lucide-react';
import { Loan, Transaction, CompanySettings, Client, formatLoanId, formatReceiptId, LoanStatus } from '../types';
import type { ClientDB, LoanDB, TransactionDB, ClientDocumentDB } from '../types.db';
import { useParams, Link } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { formatExactDateTime, formatPaymentDateDisplay } from '../utils/dateUtils';
import { CreditScoreGauge } from '../components/CreditScoreGauge';
import { CreditScoreEngine } from '../utils/CreditScoreEngine';

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

    // Interactive Filter & Modal States
    const [selectedLoanFilter, setSelectedLoanFilter] = useState<string>('ALL');
    const [inspectingLoan, setInspectingLoan] = useState<Loan | null>(null);

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
                const term = (clientId || '').trim();
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
                    creditScore: Number(foundClient.credit_score ?? foundClient.creditscore ?? 720),
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
                const targetIds = [...lIds, id];

                if (targetIds.length > 0) {
                    // 2. Fetch Transactions
                    let { data: tData } = await insforge.database
                        .from('transactions')
                        .select('*')
                        .in('referenceid', targetIds);

                    if (!tData || tData.length === 0) {
                        const { data: tData2 } = await insforge.database
                            .from('transactions')
                            .select('*')
                            .in('reference_id', targetIds);
                        if (tData2) tData = tData2;
                    }

                    if (tData) {
                        const mappedTx: Transaction[] = (tData as TransactionDB[]).map((t) => ({
                            id: t.id,
                            type: (t.type === 'Gasto' ? 'Gasto' : 'Ingreso') as 'Ingreso' | 'Gasto',
                            category: (t.category || 'Pago Préstamo') as Transaction['category'],
                            amount: Number(t.amount || 0),
                            date: (t.date && !t.date.includes('T00:00:00') && !t.date.endsWith('T00:00:00.000Z') && t.date.includes('T')) 
                                ? t.date 
                                : (t.created_at || t.date || new Date().toISOString()),
                            createdAt: t.created_at,
                            created_at: t.created_at,
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

            // 3. Fetch Client Documents
            const { data: docData } = await insforge.database
                .from('client_documents')
                .select('*')
                .eq('client_id', id);
            
            if (docData) {
                setClientDocuments(docData as ClientDocumentDB[]);
            }

        } catch (e) {
            console.error("Error al cargar detalles de cliente:", e);
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

    // Unified Credit Score Calculation via CreditScoreEngine
    const scoreResult = CreditScoreEngine.calculateScore(client, clientLoans);

    // Filtered Transactions
    const filteredTransactions = selectedLoanFilter === 'ALL'
        ? clientTransactions
        : clientTransactions.filter(t => t.referenceId === selectedLoanFilter);

    // Loading State (Light)
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-sm text-slate-600">Cargando Banca Digital...</p>
            </div>
        );
    }

    // Not Found (Light)
    if (notFound) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 text-center">
                <div className="p-4 bg-rose-50 text-rose-500 rounded-3xl mb-4 border border-rose-200">
                    <XCircle className="w-14 h-14" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-slate-900">Cliente No Encontrado</h2>
                <p className="text-slate-500 text-sm max-w-md mb-6">
                    El enlace o alias que ingresaste no corresponde a ningún cliente registrado o fue modificado.
                </p>
                <div className="text-xs text-slate-600 font-mono bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                    Verifica el alias o solicita un nuevo enlace a tu financiera.
                </div>
            </div>
        );
    }

    // Access Denied (Light)
    if (accessDenied) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 text-center">
                <div className="p-4 bg-amber-50 text-amber-500 rounded-3xl mb-4 border border-amber-200">
                    <Lock className="w-14 h-14" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-slate-900">Portal Temporalmente Desactivado</h2>
                <p className="text-slate-500 text-sm max-w-md mb-6">
                    El acceso a tu portal digital está suspendido. Por favor comunícate con la administración de {activeCompany.name}.
                </p>
            </div>
        );
    }

    // PIN Authentication Screen (Clean Light Theme)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-800 font-sans">
                <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl relative z-10">
                    
                    {/* Header Branding */}
                    <div className="text-center space-y-2 mb-6">
                        {activeCompany.logoUrl ? (
                            <img src={activeCompany.logoUrl} alt="Logo" className="h-12 w-auto mx-auto object-contain mb-2" />
                        ) : (
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md shadow-indigo-500/20 mb-2">
                                <Building2 className="w-6 h-6" />
                            </div>
                        )}
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{activeCompany.name}</h1>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Portal Digital de Clientes</p>
                    </div>

                    {/* Lock & Form */}
                    <div className="text-center space-y-5">
                        {client?.avatarUrl ? (
                            <img 
                                src={client.avatarUrl} 
                                alt={client.name} 
                                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-indigo-200 shadow-sm" 
                            />
                        ) : (
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
                                <Lock className="w-8 h-8" />
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Hola, {client?.name} {client?.lastName || ''}</h2>
                            <p className="text-xs text-slate-500 mt-1">Ingresa tu PIN de 4 dígitos para acceder a tus préstamos</p>
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
                                    className="w-44 mx-auto text-center text-3xl font-black tracking-[0.4em] py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>

                            {authError && (
                                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-semibold text-left">
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                            >
                                Entrar a mi Portal <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[11px] text-slate-500 relative z-10 mt-6">
                    <p>Acceso seguro cifrado • {activeCompany.name}</p>
                </div>
            </div>
        );
    }

    // Authenticated Digital Banking Dashboard (Full Light Theme)
    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans pb-16">

            {/* Banking Top Header (Light) */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    
                    {/* Logo & Company Name */}
                    <div className="flex items-center gap-3">
                        {activeCompany.logoUrl ? (
                            <img src={activeCompany.logoUrl} alt="Logo" className="h-9 w-auto object-contain" />
                        ) : (
                            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm text-white">
                                <Building2 className="w-5 h-5" />
                            </div>
                        )}
                        <div>
                            <p className="font-black text-slate-900 text-sm leading-tight">{activeCompany.name}</p>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Portal del Cliente</p>
                        </div>
                    </div>

                    {/* Client Badge + Lock Exit */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
                            {client?.avatarUrl ? (
                                <img 
                                    src={client.avatarUrl} 
                                    alt={client.name} 
                                    className="w-7 h-7 rounded-full object-cover border border-indigo-200 shrink-0" 
                                />
                            ) : (
                                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                                    {client?.name.charAt(0)}{client?.lastName?.charAt(0) || ''}
                                </div>
                            )}
                            <div className="text-left pr-1">
                                <p className="text-xs font-bold text-slate-900 leading-tight">{client?.name} {client?.lastName || ''}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-500 font-mono">{client?.cedula}</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${scoreResult.badgeBg} ${scoreResult.badgeColor} border ${scoreResult.badgeBorder}`}>
                                        Score {scoreResult.score}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {client?.clientPin && (
                            <button
                                onClick={() => { setIsAuthenticated(false); setPin(''); }}
                                title="Cerrar sesión"
                                className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-all border border-slate-200"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

                {/* 1. Exact Buró de Crédito Card & Speedometer Arc Gauge Section */}
                <div className="space-y-3.5">
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            
                            {/* Left Column: Identity, Badge, Subtitle & Chips */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="flex items-start gap-4">
                                    {client?.avatarUrl ? (
                                        <img 
                                            src={client.avatarUrl} 
                                            alt={client.name} 
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0" 
                                        />
                                    ) : (
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                                            {client?.name.charAt(0)}{client?.lastName?.charAt(0) || ''}
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            REPORTE DE BURÓ DE CRÉDITO
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                            {client?.name} {client?.lastName || ''}
                                        </h2>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Cédula / RNC: <span className="font-mono font-bold text-slate-700">{client?.cedula || 'N/A'}</span> • Ocupación: <span className="font-bold text-slate-700">{client?.occupation || 'N/A'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Info Chips */}
                                <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{client?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate max-w-[220px]">{client?.address || 'N/A'}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600">
                                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                        <span>RD$ {(client?.income || 0).toLocaleString()} / mes</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Speedometer Arc Gauge Card */}
                            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-center">
                                <CreditScoreGauge 
                                    score={scoreResult.score} 
                                    points100={scoreResult.points100} 
                                    riskLevel={scoreResult.label.replace('Cliente ', '')} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dictamen de Evaluación Crediticia Banner */}
                    <div className={`rounded-2xl border p-4 flex items-start gap-3.5 shadow-xs ${
                        scoreResult.category === 'Platino' 
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
                            : scoreResult.category === 'Bueno'
                            ? 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
                            : scoreResult.category === 'Regular'
                            ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                            : 'bg-rose-50/90 border-rose-200 text-rose-900'
                    }`}>
                        <div className={`p-2 rounded-xl shrink-0 ${
                            scoreResult.category === 'Platino' ? 'bg-emerald-500 text-white' :
                            scoreResult.category === 'Bueno' ? 'bg-indigo-600 text-white' :
                            scoreResult.category === 'Regular' ? 'bg-amber-500 text-white' :
                            'bg-rose-500 text-white'
                        }`}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">
                                DICTAMEN DE EVALUACIÓN CREDITICIA ({scoreResult.label.toUpperCase()})
                            </h4>
                            <p className="text-xs font-medium mt-0.5 opacity-90">
                                {scoreResult.recommendation}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Hero Financial Summary Banner (Clean Modern Light/Indigo Card) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        
                        {/* Left: Total Balance */}
                        <div className="md:col-span-2 space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 text-indigo-100 rounded-full text-xs font-bold border border-white/20">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Balance Total de Deuda
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
                                RD$ {totalRemaining.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            
                            {/* Progress bar */}
                            <div className="pt-2">
                                <div className="flex justify-between text-xs text-indigo-200 font-medium mb-1.5">
                                    <span>Progreso de Pago Global</span>
                                    <span className="font-bold text-emerald-300">{paidPercentage}% Pagado</span>
                                </div>
                                <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-700" 
                                        style={{ width: `${Math.min(100, Math.max(5, paidPercentage))}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right: Quick Action & Status Pill */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center space-y-3">
                            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                                <span className="text-indigo-200">Estado General</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                    ● AL DÍA
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="text-[11px] text-indigo-200 font-medium">Préstamos Registrados</p>
                                <p className="text-2xl font-black text-white font-mono">{clientLoans.length} operaciones</p>
                            </div>
                            
                            {/* Contact Lender Button */}
                            {activeCompany.phone && (
                                <a
                                    href={`https://wa.me/${activeCompany.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                                >
                                    <PhoneCall className="w-3.5 h-3.5" /> Contactar a Financiera
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Section: Recent Payment History & Official Receipts (FIRST) */}
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-indigo-600" /> Historial de Pagos y Recibos Oficiales ({clientTransactions.length})
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Comprobantes válidos y movimientos registrados</p>
                        </div>

                        {/* Filter by Loan (if client has multiple loans) */}
                        {clientLoans.length > 1 && (
                            <div className="flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5 text-slate-400" />
                                <select 
                                    value={selectedLoanFilter}
                                    onChange={(e) => setSelectedLoanFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shadow-xs"
                                >
                                    <option value="ALL">Todos los préstamos ({clientTransactions.length} pagos)</option>
                                    {clientLoans.map(loan => {
                                        const count = clientTransactions.filter(t => t.referenceId === loan.id).length;
                                        return (
                                            <option key={loan.id} value={loan.id}>
                                                Préstamo #{formatLoanId(loan.id)} - {loan.loanType} ({count} pagos)
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
                        {filteredTransactions.length === 0 && clientDocuments.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 text-xs space-y-2">
                                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                                <p className="font-semibold text-slate-600">No se encontraron pagos registrados para este criterio.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredTransactions.map(t => {
                                    const relatedLoan = clientLoans.find(l => l.id === t.referenceId);

                                    return (
                                        <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between flex-wrap gap-3">
                                            
                                            {/* Left: Icon, Receipt #, Loan Reference & Date */}
                                            <div className="flex items-start sm:items-center gap-3.5">
                                                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs mt-0.5 sm:mt-0">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-black text-slate-900 text-sm">
                                                            Recibo #{formatReceiptId(t.id)}
                                                        </span>
                                                        
                                                        {/* Loan Reference Tag */}
                                                        {t.referenceId ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (relatedLoan) setInspectingLoan(relatedLoan);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-mono transition-colors"
                                                                title="Ver detalles de este préstamo"
                                                            >
                                                                <CreditCard className="w-3 h-3 text-indigo-500" />
                                                                Préstamo #{formatLoanId(t.referenceId)} {relatedLoan ? `(${relatedLoan.loanType})` : ''}
                                                            </button>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                                                                Pago General
                                                            </span>
                                                        )}

                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md font-mono">
                                                            {t.paymentMethod}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-500 font-medium">
                                                        {formatExactDateTime(t.date)} • {t.description}
                                                    </p>

                                                    {/* Optional Breakdown details */}
                                                    {(t.capitalAmount || t.interestAmount || t.lateFeeAmount) && (
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5">
                                                            {Boolean(t.capitalAmount) && <span>Capital: RD$ {Number(t.capitalAmount).toLocaleString()}</span>}
                                                            {Boolean(t.interestAmount) && <span>Interés: RD$ {Number(t.interestAmount).toLocaleString()}</span>}
                                                            {Boolean(t.lateFeeAmount) && <span className="text-rose-500 font-bold">Mora: RD$ {Number(t.lateFeeAmount).toLocaleString()}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Amount & Receipt Actions */}
                                            <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                                                <div className="text-right mr-1">
                                                    <span className="block font-black text-emerald-600 text-base sm:text-lg font-mono">
                                                        + RD$ {t.amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                <Link
                                                    to={`/recibo/${t.id}`}
                                                    target="_blank"
                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-indigo-200 shadow-xs transition-all"
                                                    title="Ver recibo oficial en PDF"
                                                >
                                                    <FileText className="w-3.5 h-3.5" /> PDF
                                                </Link>

                                                <Link
                                                    to={`/recibo-termico/${t.id}`}
                                                    target="_blank"
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                                    title="Imprimir ticket térmico 58mm / 80mm"
                                                >
                                                    <Printer className="w-3.5 h-3.5" /> Ticket
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}

                                {clientDocuments.map(doc => (
                                    <div key={doc.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-200 shadow-xs">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{doc.title}</p>
                                                <p className="text-xs text-slate-500">{new Date(doc.upload_date).toLocaleDateString('es-DO')} • {doc.type}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl transition-all border border-slate-200"
                                            title="Descargar documento"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Section: Active & Past Loans (UNDERNEATH RECEIPTS) */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-600" /> Mis Préstamos y Financiamientos ({clientLoans.length})
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Haz clic en un préstamo para ver todos sus pagos y desglose</p>
                        </div>
                    </div>

                    {clientLoans.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2 shadow-xs">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                            <h4 className="font-bold text-slate-900 text-base">No tienes préstamos activos</h4>
                            <p className="text-xs text-slate-500">Todas tus cuentas están completamente saldadas o al día.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {clientLoans.map(loan => {
                                const instAmt = getInstallmentAmount(loan);
                                const nextDt = getNextDate(loan);
                                const loanPaidPct = loan.totalToPay && loan.totalToPay > 0
                                    ? Math.round(((loan.totalToPay - loan.remainingBalance) / loan.totalToPay) * 100)
                                    : 0;
                                const loanTxCount = clientTransactions.filter(t => t.referenceId === loan.id).length;

                                return (
                                    <div 
                                        key={loan.id} 
                                        onClick={() => setInspectingLoan(loan)}
                                        className="bg-white border border-slate-200/90 hover:border-indigo-500/50 hover:shadow-md rounded-3xl p-6 transition-all shadow-xs relative flex flex-col justify-between space-y-4 cursor-pointer group"
                                    >
                                        
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold mb-1">
                                                    {loan.loanType}
                                                </span>
                                                <p className="text-xs text-slate-500 font-mono">Ref: #{formatLoanId(loan.id)}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                                                loan.status === 'Pagado' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                loan.status === 'Atrasado' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {loan.status}
                                            </span>
                                        </div>

                                        {/* Main Balance */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Balance Pendiente</p>
                                            <p className="text-3xl font-black text-slate-900 font-mono">
                                                RD$ {loan.remainingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>

                                        {/* Loan Progress */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[11px] text-slate-500">
                                                <span>Pagado: RD$ {(loan.totalToPay - loan.remainingBalance).toLocaleString()}</span>
                                                <span className="font-bold text-indigo-600">{Math.max(0, loanPaidPct)}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${Math.max(3, loanPaidPct)}%` }} />
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                                            <div>
                                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Cuota ({loan.frequency})</span>
                                                <span className="font-bold text-emerald-700 text-sm font-mono">
                                                    RD$ {instAmt.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Próximo Cobro</span>
                                                <span className="font-bold text-slate-800 text-sm">
                                                    {loan.nextPaymentDate ? formatPaymentDateDisplay(loan.nextPaymentDate) : nextDt.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Click to inspect action banner */}
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold group-hover:text-indigo-700">
                                            <span className="flex items-center gap-1.5">
                                                <Eye className="w-3.5 h-3.5" /> Ver todos los pagos ({loanTxCount})
                                            </span>
                                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="text-center pt-8 pb-2 text-xs text-slate-500 space-y-1">
                    <p>© {new Date().getFullYear()} {activeCompany.name}. Banca Digital Segura.</p>
                    {activeCompany.termsAndConditions && (
                        <p className="text-[10px] text-slate-400 max-w-lg mx-auto leading-relaxed">{activeCompany.termsAndConditions}</p>
                    )}
                </footer>
            </main>

            {/* 5. Modal: Inspección Detallada de Pagos del Préstamo */}
            {inspectingLoan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-modal-pop">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div>
                                <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-extrabold uppercase">
                                    {inspectingLoan.loanType}
                                </span>
                                <h3 className="text-lg font-black text-slate-900 mt-1">
                                    Historial de Pagos: Préstamo #{formatLoanId(inspectingLoan.id)}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setInspectingLoan(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            
                            {/* Summary Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Monto Original</span>
                                    <span className="text-sm font-black text-slate-900 font-mono">RD$ {inspectingLoan.amount.toLocaleString()}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Balance Pendiente</span>
                                    <span className="text-sm font-black text-rose-600 font-mono">RD$ {inspectingLoan.remainingBalance.toLocaleString()}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Cuota ({inspectingLoan.frequency})</span>
                                    <span className="text-sm font-black text-emerald-700 font-mono">RD$ {getInstallmentAmount(inspectingLoan).toLocaleString()}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tasa Interés</span>
                                    <span className="text-sm font-black text-indigo-600 font-mono">{inspectingLoan.interestRate}%</span>
                                </div>
                            </div>

                            {/* List of Payments for this loan */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Receipt className="w-4 h-4 text-indigo-600" />
                                    Comprobantes de Pago Asociados ({clientTransactions.filter(t => t.referenceId === inspectingLoan.id).length})
                                </h4>

                                {clientTransactions.filter(t => t.referenceId === inspectingLoan.id).length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                                        No se han registrado pagos para este préstamo aún.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                                        {clientTransactions.filter(t => t.referenceId === inspectingLoan.id).map(t => (
                                            <div key={t.id} className="p-4 hover:bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-sm">Recibo #{formatReceiptId(t.id)}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                                            {t.paymentMethod}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500">{formatExactDateTime(t.date)}</p>
                                                    
                                                    {(t.capitalAmount || t.interestAmount || t.lateFeeAmount) && (
                                                        <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-medium">
                                                            {Boolean(t.capitalAmount) && <span>Cap: RD$ {Number(t.capitalAmount).toLocaleString()}</span>}
                                                            {Boolean(t.interestAmount) && <span>Int: RD$ {Number(t.interestAmount).toLocaleString()}</span>}
                                                            {Boolean(t.lateFeeAmount) && <span className="text-rose-500 font-bold">Mora: RD$ {Number(t.lateFeeAmount).toLocaleString()}</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-emerald-600 text-sm sm:text-base font-mono">
                                                        + RD$ {t.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <Link
                                                        to={`/recibo-termico/${t.id}`}
                                                        target="_blank"
                                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                                                    >
                                                        <Printer className="w-3 h-3" /> Ticket
                                                    </Link>
                                                    <Link
                                                        to={`/recibo/${t.id}`}
                                                        target="_blank"
                                                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200"
                                                    >
                                                        <FileText className="w-3 h-3" /> PDF
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setInspectingLoan(null)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPortal;
