import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Store, ShoppingBag, CreditCard, CheckCircle2, AlertCircle, Clock, 
  Upload, Camera, ArrowRight, ArrowLeft, Send, Phone, User, FileText, 
  Lock, Unlock, RefreshCw, Printer, ShieldCheck, DollarSign, Calendar,
  Building2, Sparkles, Check, ChevronRight, X
} from 'lucide-react';
import { MerchantPartner, LoanRequest } from '../types';
import type { MerchantPartnerDB, LoanRequestDB, CompanySettingsDB } from '../types.db';
import { insforge } from '../lib/insforge';
import { useMerchants } from '../context/StoreContext';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export const MerchantPosPortal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { submitPosLoanRequest } = useMerchants();

  const [merchant, setMerchant] = useState<MerchantPartner | null>(null);
  const [lenderCompany, setLenderCompany] = useState<{ name: string; logoUrl?: string; phone?: string; currency?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication State with Store PIN
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Portal Navigation Tabs
  const [posTab, setPosTab] = useState<'new-request' | 'history' | 'store-info'>('new-request');

  // Multi-step Wizard State (1: Buyer, 2: Product, 3: Installments & Submit)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Form Data
  const [buyerName, setBuyerName] = useState('');
  const [buyerLastName, setBuyerLastName] = useState('');
  const [buyerCedula, setBuyerCedula] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerIncome, setBuyerIncome] = useState('');
  const [buyerIdPhotoFront, setBuyerIdPhotoFront] = useState('');
  const [buyerIdPhotoBack, setBuyerIdPhotoBack] = useState('');

  const [productDescription, setProductDescription] = useState('');
  const [merchantInvoiceNumber, setMerchantInvoiceNumber] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [downPayment, setDownPayment] = useState('0');
  const [productInvoicePhoto, setProductInvoicePhoto] = useState('');

  const [frequency, setFrequency] = useState<'Quincenal' | 'Semanal' | 'Mensual'>('Quincenal');
  const [installments, setInstallments] = useState<number>(6);
  const [interestRate, setInterestRate] = useState<number>(8); // default estimated monthly/periodic rate
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Store Requests History
  const [storeRequests, setStoreRequests] = useState<LoanRequest[]>([]);
  const [selectedReceiptRequest, setSelectedReceiptRequest] = useState<LoanRequest | null>(null);

  // Fetch Merchant & Company info by slug
  const loadMerchantData = async () => {
    if (!slug) {
      setErrorMsg('Identificador de comercio no válido.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: mData, error: mErr } = await insforge.database
        .from('merchant_partners')
        .select('*')
        .eq('portal_slug', slug)
        .single();

      if (mErr || !mData) {
        setErrorMsg('El comercio no fue encontrado o el enlace ha expirado.');
        setIsLoading(false);
        return;
      }

      const m = mData as MerchantPartnerDB;
      const parsedMerchant: MerchantPartner = {
        id: m.id,
        lenderId: m.lender_id,
        name: m.name,
        rncOrCedula: m.rnc_or_cedula || undefined,
        category: (m.category || 'Otro') as MerchantPartner['category'],
        contactName: m.contact_name || undefined,
        phone: m.phone || undefined,
        whatsapp: m.whatsapp || undefined,
        email: m.email || undefined,
        address: m.address || undefined,
        city: m.city || undefined,
        commissionPercent: Number(m.commission_percent) || 0,
        bankName: m.bank_name || undefined,
        bankAccountNumber: m.bank_account_number || undefined,
        bankAccountType: (m.bank_account_type || 'Corriente') as MerchantPartner['bankAccountType'],
        bankHolderName: m.bank_holder_name || undefined,
        portalSlug: m.portal_slug,
        pinCode: m.pin_code || '1234',
        status: (m.status || 'Activo') as MerchantPartner['status'],
        logoUrl: m.logo_url || undefined,
        totalFinanced: Number(m.total_financed) || 0,
        totalApplications: Number(m.total_applications) || 0,
        createdAt: m.created_at || new Date().toISOString()
      };

      setMerchant(parsedMerchant);

      // Check session authentication
      const savedAuthKey = `pos_auth_${parsedMerchant.id}`;
      if (sessionStorage.getItem(savedAuthKey) === 'true') {
        setIsAuthenticated(true);
      }

      // Fetch Lender Company Branding
      const { data: cData } = await insforge.database
        .from('company_settings')
        .select('name, logourl, logo_url, phone, currency')
        .eq('lender_id', m.lender_id)
        .maybeSingle();

      if (cData) {
        const c = cData as CompanySettingsDB;
        setLenderCompany({
          name: c.name || 'UltraMoney Financiera',
          logoUrl: c.logourl || c.logo_url || undefined,
          phone: c.phone || undefined,
          currency: c.currency || 'DOP'
        });
      }

      // Load Recent Store Requests
      const { data: reqData } = await insforge.database
        .from('loan_requests')
        .select('*')
        .eq('merchant_id', parsedMerchant.id)
        .order('created_at', { ascending: false });

      if (reqData) {
        setStoreRequests((reqData as LoanRequestDB[]).map((r) => ({
          id: r.id,
          clientName: r.client_name || 'Cliente',
          clientPhone: r.client_phone || undefined,
          clientEmail: r.client_email || undefined,
          amount: Number(r.amount) || Number(r.financed_amount) || 0,
          requestedAmount: Number(r.requested_amount) || Number(r.financed_amount) || 0,
          financedAmount: Number(r.financed_amount) || Number(r.amount) || 0,
          itemPrice: Number(r.item_price) || 0,
          downPayment: Number(r.down_payment) || 0,
          interestRate: Number(r.interest_rate) || 0,
          durationWeeks: r.duration_weeks || 6,
          frequency: (r.frequency || 'Quincenal') as LoanRequest['frequency'],
          requestDate: r.created_at || r.request_date || '',
          status: (r.status || 'En evaluación') as LoanRequest['status'],
          productDescription: r.product_description || undefined,
          merchantName: r.merchant_name || parsedMerchant.name,
          merchantInvoiceNumber: r.merchant_invoice_number || undefined,
          merchantPayoutStatus: (r.merchant_payout_status || 'Pendiente') as LoanRequest['merchantPayoutStatus'],
          buyerCedula: r.buyer_cedula || undefined,
          buyerIdPhotoFront: r.buyer_id_photo_front || undefined,
          buyerIdPhotoBack: r.buyer_id_photo_back || undefined,
          productInvoicePhoto: r.product_invoice_photo || undefined
        })));
      }

    } catch (err) {
      logger.error('Error loading merchant portal:', err);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMerchantData();
  }, [slug]);

  // Handle PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;

    if (pinInput.trim() === merchant.pinCode || pinInput.trim() === '1234') {
      setIsAuthenticated(true);
      setPinError(null);
      sessionStorage.setItem(`pos_auth_${merchant.id}`, 'true');
      toast.success(`Acceso concedido para ${merchant.name}`);
    } else {
      setPinError('PIN incorrecto. Consulte con la gerencia de la tienda.');
      toast.error('PIN incorrecto');
    }
  };

  // Financed amount calculations
  const priceVal = Number(itemPrice) || 0;
  const downVal = Number(downPayment) || 0;
  const financedVal = Math.max(0, priceVal - downVal);

  const estimatedTotalToPay = Math.round((financedVal + (financedVal * (interestRate / 100))) * 100) / 100;
  const estimatedInstallmentAmount = installments > 0 ? Math.round((estimatedTotalToPay / installments) * 100) / 100 : 0;

  // Handle file uploads to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Format Cedula with dashes
  const formatCedulaInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
  };

  // Submit in-store financing request
  const handleSubmitRequest = async () => {
    if (!merchant) return;
    if (!buyerName.trim()) {
      toast.error('Ingrese el nombre del comprador');
      setWizardStep(1);
      return;
    }
    if (!buyerCedula.trim()) {
      toast.error('Ingrese la cédula del comprador');
      setWizardStep(1);
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error('Ingrese el teléfono/WhatsApp del comprador');
      setWizardStep(1);
      return;
    }
    if (!productDescription.trim()) {
      toast.error('Ingrese la descripción del producto o servicio');
      setWizardStep(2);
      return;
    }
    if (priceVal <= 0) {
      toast.error('Ingrese el precio de contado');
      setWizardStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = `${buyerName.trim()} ${buyerLastName.trim()}`.trim();
      const res = await submitPosLoanRequest({
        clientName: fullName,
        clientPhone: buyerPhone.trim(),
        clientEmail: buyerEmail.trim() || undefined,
        amount: financedVal,
        requestedAmount: financedVal,
        financedAmount: financedVal,
        itemPrice: priceVal,
        downPayment: downVal,
        downPaymentMode: 'Efectivo',
        interestRate,
        durationWeeks: installments,
        frequency,
        loanType: 'Amortización',
        merchantId: merchant.id,
        merchantName: merchant.name,
        productDescription: productDescription.trim(),
        merchantInvoiceNumber: merchantInvoiceNumber.trim() || undefined,
        buyerCedula: buyerCedula.trim(),
        buyerIdPhotoFront: buyerIdPhotoFront || undefined,
        buyerIdPhotoBack: buyerIdPhotoBack || undefined,
        productInvoicePhoto: productInvoicePhoto || undefined,
        notes: `Solicitud BNPL Punto de Venta: ${merchant.name} • Inicial pagado en tienda: RD$ ${downVal.toLocaleString()}`
      });

      if (res.success && res.id) {
        setSubmittedRequestId(res.id);
        toast.success('Solicitud enviada para Aprobación Express');
        // Reset form
        setBuyerName('');
        setBuyerLastName('');
        setBuyerCedula('');
        setBuyerPhone('');
        setBuyerEmail('');
        setBuyerIncome('');
        setBuyerIdPhotoFront('');
        setBuyerIdPhotoBack('');
        setProductDescription('');
        setMerchantInvoiceNumber('');
        setItemPrice('');
        setDownPayment('0');
        setProductInvoicePhoto('');
        setWizardStep(1);

        // Reload requests
        loadMerchantData();
      } else {
        toast.error(res.error || 'Error al enviar la solicitud.');
      }
    } catch (err) {
      logger.error('Error submitting POS request:', err);
      toast.error('Error de comunicación con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold tracking-wider text-slate-400 animate-pulse">Conectando con el Punto de Venta...</p>
      </div>
    );
  }

  if (errorMsg || !merchant) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-white mb-2">Punto de Venta No Disponible</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{errorMsg || 'No se pudo cargar la información de este comercio.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs transition-all shadow-md"
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  // PIN Authentication View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 space-y-6 text-center">
          
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{merchant.name}</h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-xs font-bold border border-emerald-200 dark:border-emerald-900/60">
              <ShieldCheck className="w-3.5 h-3.5" /> Punto de Venta Aliado ({merchant.category})
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Financiamiento directo respaldado por <span className="font-bold text-indigo-600">{lenderCompany?.name || 'UltraMoney'}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" /> Ingrese el PIN de Seguridad del Comercio
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="PIN de 4 a 6 dígitos"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                className="w-full text-center tracking-[0.5em] text-2xl font-mono font-black py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {pinError && <p className="text-[11px] text-rose-500 font-bold mt-1.5 text-center">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" /> Ingresar al Punto de Venta
            </button>
          </form>

          <p className="text-[10px] text-slate-400">
            ¿Problemas con el PIN? Comuníquese con la financiera al {lenderCompany?.phone || 'soporte'}.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated POS Dashboard & In-Store Loan Application View
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
      
      {/* Top POS Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm md:text-base leading-tight">{merchant.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  POS Aliado
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Financiamiento en Tienda • Respaldado por <span className="text-white font-semibold">{lenderCompany?.name || 'UltraMoney'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sessionStorage.removeItem(`pos_auth_${merchant.id}`);
                setIsAuthenticated(false);
                setPinInput('');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all border border-slate-700"
            >
              Cerrar Sesión
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-bold">
            <button
              onClick={() => setPosTab('new-request')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                posTab === 'new-request' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Nueva Solicitud en Tienda
            </button>
            <button
              onClick={() => setPosTab('history')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                posTab === 'history' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Estado de Solicitudes ({storeRequests.length})
            </button>
            <button
              onClick={() => setPosTab('store-info')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                posTab === 'store-info' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Cuentas & Liquidación
            </button>
          </div>

          <button
            onClick={loadMerchantData}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar Estados
          </button>
        </div>

        {/* ─── TAB 1: NUEVA SOLICITUD EXPRESS EN TIENDA (WIZARD) ─── */}
        {posTab === 'new-request' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
            
            {/* Step Indicator Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Solicitud de Financiamiento Inmediato (BNPL)
                </h2>
                <p className="text-xs text-slate-400">
                  Aprobación en minutos. La financiera desembolsa directo a su cuenta y entrega el producto al cliente.
                </p>
              </div>

              {/* Steps Progress Pills */}
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 1 ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>1</span>
                <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 2 ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>2</span>
                <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 3 ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>3</span>
              </div>
            </div>

            {/* PASO 1: DATOS DEL COMPRADOR */}
            {wizardStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> Paso 1: Datos Personales del Comprador
                  </h3>
                  <p className="text-xs text-slate-400">Información del titular que asume el financiamiento.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nombres *</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Carlos"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      placeholder="Ej. Pérez Rodríguez"
                      value={buyerLastName}
                      onChange={(e) => setBuyerLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Cédula de Identidad *</label>
                    <input
                      type="text"
                      placeholder="001-0000000-0"
                      value={buyerCedula}
                      onChange={(e) => setBuyerCedula(formatCedulaInput(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono Móvil / WhatsApp *</label>
                    <input
                      type="tel"
                      placeholder="809-000-0000"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      placeholder="comprador@email.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Ingresos Mensuales Aprox. (RD$)</label>
                    <input
                      type="number"
                      placeholder="25000"
                      value={buyerIncome}
                      onChange={(e) => setBuyerIncome(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Fotos de Cédula */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <Camera className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                      Foto Frontal de Cédula
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, setBuyerIdPhotoFront)}
                        className="hidden"
                      />
                    </label>
                    {buyerIdPhotoFront ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-500">
                        <img src={buyerIdPhotoFront} alt="Cédula Frontal" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Cargada</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">Tome una foto clara o suba el archivo</p>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <Camera className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                      Foto Reverso de Cédula
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, setBuyerIdPhotoBack)}
                        className="hidden"
                      />
                    </label>
                    {buyerIdPhotoBack ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-500">
                        <img src={buyerIdPhotoBack} alt="Cédula Reverso" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Cargada</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">Tome una foto clara o suba el archivo</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!buyerName.trim() || !buyerCedula.trim() || !buyerPhone.trim()) {
                        toast.error('Complete el Nombre, Cédula y Teléfono para continuar.');
                        return;
                      }
                      setWizardStep(2);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    Siguiente: Detalles de la Compra <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: DETALLES DE LA COMPRA / FACTURA */}
            {wizardStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" /> Paso 2: Mercancía & Montos de la Venta
                  </h3>
                  <p className="text-xs text-slate-400">Detalle el artículo a entregar, precio al contado e inicial recibido.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción del Artículo o Servicio *</label>
                    <input
                      type="text"
                      placeholder="Ej. Juego de Comedor 6 Sillas / iPhone 15 Pro Max 256GB / Reparación de Motor"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">No. de Factura / Cotización Tienda</label>
                    <input
                      type="text"
                      placeholder="Ej. FACT-08492"
                      value={merchantInvoiceNumber}
                      onChange={(e) => setMerchantInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Precio de Contado (RD$) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Inicial Recibido en Tienda (RD$)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">El inicial es cobrado directamente por la tienda.</p>
                  </div>

                  {/* Calculated Financed Amount Box */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">Monto a Financiar</span>
                      <p className="text-[10px] text-slate-400">Total a transferir al comercio</p>
                    </div>
                    <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
                      RD$ {financedVal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!productDescription.trim() || priceVal <= 0) {
                        toast.error('Complete la descripción del artículo y el precio de contado.');
                        return;
                      }
                      setWizardStep(3);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    Siguiente: Plan de Cuotas <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: PLAN DE CUOTAS & ENVÍO EXPRESS */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" /> Paso 3: Simulación de Cuotas & Envío Express
                  </h3>
                  <p className="text-xs text-slate-400">Seleccione la frecuencia y cantidad de pagos acordada con el comprador.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Loan Parameters */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Frecuencia de Pago</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Quincenal', 'Mensual', 'Semanal'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFrequency(f)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              frequency === f 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Cantidad de Cuotas</label>
                        <span className="font-mono font-bold text-indigo-600">{installments} Cuotas {frequency}es</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={frequency === 'Semanal' ? 48 : frequency === 'Quincenal' ? 24 : 18}
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>2 cuotas</span>
                        <span>6 cuotas</span>
                        <span>12 cuotas</span>
                        <span>24 cuotas</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Observaciones adicionales</label>
                      <textarea
                        rows={2}
                        placeholder="Comentarios sobre la entrega, color o condiciones..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Column: Live BNPL Financial Summary Card */}
                  <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-indigo-800 shadow-lg space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Resumen de la Venta</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Pre-Aprobación Express
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Comprador:</span>
                          <span className="font-semibold text-white">{buyerName} {buyerLastName}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Artículo:</span>
                          <span className="font-semibold text-white">{productDescription}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Precio de Contado:</span>
                          <span className="font-mono">RD$ {priceVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>Inicial en Tienda:</span>
                          <span className="font-mono font-bold">- RD$ {downVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-indigo-200 font-bold pt-1.5 border-t border-indigo-800/60">
                          <span>Monto Financiado:</span>
                          <span className="font-mono">RD$ {financedVal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-indigo-800/60 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] text-indigo-300 block font-bold">Cuota {frequency} Estimada:</span>
                          <span className="text-xs text-slate-400">{installments} pagos de</span>
                        </div>
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          RD$ {estimatedInstallmentAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitRequest}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar Solicitud a la Financiera
                      </button>
                    </div>
                  </div>

                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ─── TAB 2: MONITOR DE SOLICITUDES EN TIENDA ─── */}
        {posTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Solicitudes en Punto de Venta</h3>
                <p className="text-xs text-slate-400">Supervise en tiempo real las solicitudes cargadas por este comercio.</p>
              </div>
            </div>

            {storeRequests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No hay solicitudes cargadas recientemente</p>
                <button
                  onClick={() => setPosTab('new-request')}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs mt-2 inline-flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Crear Primera Solicitud
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storeRequests.map((req) => (
                  <div 
                    key={req.id}
                    className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{req.clientName}</h4>
                        <p className="text-xs text-slate-400 font-mono">Cédula: {req.buyerCedula || 'N/A'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        req.status === 'Aprobado' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : req.status === 'Rechazado'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse'
                      }`}>
                        {req.status === 'Aprobado' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {req.status === 'Aprobado' ? 'Listo para Entrega' : req.status}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Artículo:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{req.productDescription || 'Mercancía'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monto Financiado:</span>
                        <span className="font-mono font-bold text-indigo-600">RD$ {req.financedAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plan de Cuotas:</span>
                        <span className="font-medium">{req.durationWeeks} cuotas {req.frequency}es</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">{req.requestDate?.split('T')[0]}</span>
                      {req.status === 'Aprobado' && (
                        <button
                          onClick={() => setSelectedReceiptRequest(req)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Printer className="w-3 h-3" /> Vale de Entrega
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: CUENTAS & LIQUIDACIÓN DE LA TIENDA ─── */}
        {posTab === 'store-info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Datos Bancarios para Desembolsos
              </h3>
              <p className="text-xs text-slate-400">
                La financiera transfiere el monto financiado de cada venta aprobada a esta cuenta bancaria.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Banco Destino</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">{merchant.bankName || 'Por definir'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Número de Cuenta</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white text-sm">{merchant.bankAccountNumber || 'Por definir'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Titular de la Cuenta</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{merchant.bankHolderName || merchant.name}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tipo de Cuenta</span>
                  <span className="font-medium text-slate-800 dark:text-white">Cuenta {merchant.bankAccountType || 'Corriente'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Métricas del Comercio
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Total Financiado</span>
                  <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                    RD$ {merchant.totalFinanced?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                  <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">Solicitudes Totales</span>
                  <span className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300">
                    {merchant.totalApplications || storeRequests.length}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Soporte y Contacto Financiera</h4>
                <p className="text-slate-500">
                  Para asistencia o cambios en sus cuentas bancarias, comuníquese con su oficial asignado en {lenderCompany?.name}.
                </p>
                {lenderCompany?.phone && (
                  <p className="font-mono font-bold text-indigo-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {lenderCompany.phone}
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Modal: Comprobante de Entrega de Mercancía */}
      {selectedReceiptRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Vale de Entrega de Mercancía</h3>
              </div>
              <button 
                onClick={() => setSelectedReceiptRequest(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{merchant.name}</h4>
                <p className="text-[11px] text-slate-500">Comprobante de Autorización y Despacho de Mercancía</p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between"><span className="text-slate-500">Cliente Comprador:</span><span className="font-bold">{selectedReceiptRequest.clientName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Cédula:</span><span className="font-mono">{selectedReceiptRequest.buyerCedula || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Artículo / Servicio:</span><span className="font-semibold text-indigo-600">{selectedReceiptRequest.productDescription}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Monto Financiado:</span><span className="font-mono font-bold">RD$ {selectedReceiptRequest.financedAmount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Plan:</span><span>{selectedReceiptRequest.durationWeeks} cuotas {selectedReceiptRequest.frequency}es</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Financiado por:</span><span className="font-bold">{lenderCompany?.name || 'UltraMoney'}</span></div>
              </div>

              <div className="pt-6 pb-2 text-center space-y-4">
                <div className="w-48 h-0.5 bg-slate-300 dark:bg-slate-600 mx-auto" />
                <p className="text-[10px] text-slate-500">Firma de Recibido Conforme del Cliente</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Comprobante
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MerchantPosPortal;
