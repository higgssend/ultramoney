import React, { useState, useMemo } from 'react';
import { 
  Store, Plus, Search, Filter, Phone, Mail, MapPin, Building2, 
  CreditCard, CheckCircle2, Clock, AlertCircle, QrCode, Copy, 
  ExternalLink, Edit, Trash2, Send, ShoppingBag, ShieldCheck, 
  ArrowUpRight, DollarSign, RefreshCw, X, ChevronRight, Printer, Sparkles
} from 'lucide-react';
import { useMerchants, useLoans, useAccounting, useSettings } from '../context/StoreContext';
import { MerchantPartner, LoanRequest } from '../types';
import StatCard from '../components/StatCard';
import { CustomSelect } from '../components/CustomSelect';
import { toast } from 'sonner';

export const MerchantsPage: React.FC = () => {
  const { 
    merchants, isLoadingMerchants, addMerchant, updateMerchant, 
    deleteMerchant, refreshMerchants, approvePosLoanRequest, rejectPosLoanRequest 
  } = useMerchants();
  const { loanRequests, loans } = useLoans();
  const { bankAccounts } = useAccounting();
  const { companySettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'requests' | 'merchants' | 'payouts'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // New / Edit Merchant Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [rncOrCedula, setRncOrCedula] = useState('');
  const [category, setCategory] = useState<MerchantPartner['category']>('Mueblería');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('0');
  const [bankName, setBankName] = useState('Banreservas');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountType, setBankAccountType] = useState<'Corriente' | 'Ahorro'>('Corriente');
  const [bankHolderName, setBankHolderName] = useState('');
  const [portalSlug, setPortalSlug] = useState('');
  const [pinCode, setPinCode] = useState('1234');

  // Approval Modal State
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<LoanRequest | null>(null);
  const [disbursementBankAccountId, setDisbursementBankAccountId] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);

  // QR Modal State
  const [qrMerchant, setQrMerchant] = useState<MerchantPartner | null>(null);

  // Filter POS Loan Requests
  const posLoanRequests = useMemo(() => {
    return loanRequests.filter(r => r.merchantId || r.merchantName || (r.notes && r.notes.toLowerCase().includes('punto de venta')));
  }, [loanRequests]);

  const pendingPosRequests = useMemo(() => {
    return posLoanRequests.filter(r => r.status === 'En evaluación' || r.status === 'Pendiente' || r.status === 'Pending');
  }, [posLoanRequests]);

  const approvedPosRequests = useMemo(() => {
    return posLoanRequests.filter(r => r.status === 'Aprobado');
  }, [posLoanRequests]);

  // Financial Metrics
  const totalVolumeFinanced = useMemo(() => {
    return merchants.reduce((sum, m) => sum + (Number(m.totalFinanced) || 0), 0);
  }, [merchants]);

  // Filter Merchants
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const matchesSearch = searchQuery === '' || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.contactName && m.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.phone && m.phone.includes(searchQuery)) ||
        (m.portalSlug && m.portalSlug.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategoryFilter === 'ALL' || m.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [merchants, searchQuery, selectedCategoryFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingMerchantId(null);
    setName('');
    setRncOrCedula('');
    setCategory('Mueblería');
    setContactName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setCity('Santiago');
    setCommissionPercent('0');
    setBankName('Banreservas');
    setBankAccountNumber('');
    setBankAccountType('Corriente');
    setBankHolderName('');
    setPortalSlug('');
    setPinCode('1234');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (m: MerchantPartner) => {
    setEditingMerchantId(m.id);
    setName(m.name);
    setRncOrCedula(m.rncOrCedula || '');
    setCategory(m.category);
    setContactName(m.contactName || '');
    setPhone(m.phone || '');
    setWhatsapp(m.whatsapp || '');
    setEmail(m.email || '');
    setAddress(m.address || '');
    setCity(m.city || '');
    setCommissionPercent(String(m.commissionPercent || 0));
    setBankName(m.bankName || 'Banreservas');
    setBankAccountNumber(m.bankAccountNumber || '');
    setBankAccountType(m.bankAccountType || 'Corriente');
    setBankHolderName(m.bankHolderName || '');
    setPortalSlug(m.portalSlug);
    setPinCode(m.pinCode);
    setIsModalOpen(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingMerchantId) {
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      setPortalSlug(autoSlug);
    }
  };

  // Save Merchant (Create / Update)
  const handleSaveMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del comercio es requerido');
      return;
    }

    const payload = {
      name: name.trim(),
      rncOrCedula: rncOrCedula.trim() || undefined,
      category,
      contactName: contactName.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      commissionPercent: Number(commissionPercent) || 0,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankAccountType,
      bankHolderName: bankHolderName.trim() || undefined,
      portalSlug: portalSlug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      pinCode: pinCode.trim() || '1234',
      status: 'Activo' as const
    };

    if (editingMerchantId) {
      await updateMerchant(editingMerchantId, payload);
    } else {
      await addMerchant(payload);
    }
    setIsModalOpen(false);
  };

  // 1-Click Express Approval Handler
  const handleConfirmApproval = async () => {
    if (!selectedRequestForApproval) return;
    setIsApproving(true);
    try {
      await approvePosLoanRequest(selectedRequestForApproval, {
        bankAccountId: disbursementBankAccountId || undefined
      });
      setSelectedRequestForApproval(null);
    } finally {
      setIsApproving(false);
    }
  };

  const copyPosLink = (slug: string) => {
    const url = `${window.location.origin}/pos/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace del Punto de Venta copiado al portapapeles');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Store className="w-3.5 h-3.5" /> Buy Now Pay Later (BNPL) & Alianzas Comerciales
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Comercios Aliados & Puntos de Venta</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Permite a mueblerías, tiendas de celulares y talleres cargar solicitudes de financiamiento directamente en el mostrador con aprobación express y desembolso directo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nuevo Comercio Aliado
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Comercios Aliados"
          value={String(merchants.length)}
          trend={`${merchants.filter(m => m.status === 'Activo').length} Activos en Plataforma`}
          trendUp={true}
          icon={Store}
          gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
          glowColor="shadow-indigo-500/20"
        />
        <StatCard
          title="Solicitudes POS Pendientes"
          value={String(pendingPosRequests.length)}
          trend="Esperando Aprobación Express"
          trendUp={pendingPosRequests.length === 0}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          glowColor="shadow-amber-500/20"
        />
        <StatCard
          title="Cartera Financiada en Tiendas"
          value={`RD$ ${totalVolumeFinanced.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Total Desembolsado a Comercios"
          trendUp={true}
          icon={ShoppingBag}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          glowColor="shadow-emerald-500/20"
        />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'requests' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> 
            Bandeja de Aprobación Express 
            {pendingPosRequests.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black animate-pulse">
                {pendingPosRequests.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('merchants')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'merchants' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Directorio de Comercios ({merchants.length})
          </button>
          <button 
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'payouts' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Liquidaciones & Desembolsos
          </button>
        </div>

        <button
          onClick={refreshMerchants}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── TAB 1: BANDEJA DE APROBACIÓN EXPRESS BNPL ─── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingPosRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">¡Bandeja al Día!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No hay solicitudes de financiamiento pendientes de los comercios aliados en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPosRequests.map((req) => (
                <div 
                  key={req.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-md p-6 space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Store & Client Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 mb-1">
                        <Store className="w-3 h-3" /> {req.merchantName || 'Comercio Aliado'}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{req.clientName}</h3>
                      <p className="text-xs text-slate-400 font-mono">Cédula: {req.buyerCedula || 'N/A'}</p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                      Express POS
                    </span>
                  </div>

                  {/* Product & Financial Details */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Artículo / Servicio:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{req.productDescription || 'Mercancía en tienda'}</span>
                    </div>
                    {req.merchantInvoiceNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Factura Tienda:</span>
                        <span className="font-mono">{req.merchantInvoiceNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Precio de Contado:</span>
                      <span className="font-mono">RD$ {req.itemPrice?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Inicial Cobrado en Tienda:</span>
                      <span className="font-mono font-bold">- RD$ {req.downPayment?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-indigo-600 dark:text-indigo-400 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span>Monto a Desembolsar:</span>
                      <span className="font-mono text-sm">RD$ {req.financedAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>Plan Solicitado:</span>
                      <span className="font-semibold">{req.durationWeeks} cuotas {req.frequency}es</span>
                    </div>
                  </div>

                  {/* ID Photos Preview if provided */}
                  {(req.buyerIdPhotoFront || req.buyerIdPhotoBack) && (
                    <div className="flex items-center gap-2">
                      {req.buyerIdPhotoFront && (
                        <a href={req.buyerIdPhotoFront} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-indigo-600 underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Cédula Frontal
                        </a>
                      )}
                      {req.buyerIdPhotoBack && (
                        <a href={req.buyerIdPhotoBack} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-indigo-600 underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Cédula Reverso
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setSelectedRequestForApproval(req)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobación Express (1-Clic)
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Rechazar la solicitud de ${req.clientName}?`)) {
                          rejectPosLoanRequest(req.id);
                        }
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all"
                    >
                      Rechazar
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: DIRECTORIO DE COMERCIOS ALIADOS ─── */}
      {activeTab === 'merchants' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por comercio, contacto o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <CustomSelect
              value={selectedCategoryFilter}
              onChange={(val) => setSelectedCategoryFilter(val)}
              options={[
                { value: 'ALL', label: 'Todas las Categorías' },
                { value: 'Mueblería', label: 'Mueblerías' },
                { value: 'Celulares & Tecnología', label: 'Celulares & Tecnología' },
                { value: 'Taller & Repuestos', label: 'Talleres & Repuestos' },
                { value: 'Electrodomésticos', label: 'Electrodomésticos' },
                { value: 'Ferretería', label: 'Ferreterías' },
                { value: 'Salud & Clínica', label: 'Salud & Clínicas' },
                { value: 'Otro', label: 'Otros Rubros' },
              ]}
              className="w-48 text-xs"
            />
          </div>

          {/* Merchants Grid */}
          {filteredMerchants.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Store className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No hay comercios encontrados</h3>
              <p className="text-xs text-slate-400">Registre un nuevo comercio afiliado para comenzar a operar financiamiento en tienda.</p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Primer Comercio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMerchants.map((m) => (
                <div 
                  key={m.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {m.category}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">{m.name}</h3>
                        {m.contactName && <p className="text-xs text-slate-500">Contacto: {m.contactName}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar comercio ${m.name}?`)) {
                              deleteMerchant(m.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                      {m.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" /> {m.phone}
                        </div>
                      )}
                      {m.bankAccountNumber && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                          <Building2 className="w-3 h-3 text-slate-400" /> {m.bankName}: {m.bankAccountNumber}
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400">Total Financiado:</span>
                        <span className="font-mono font-bold text-emerald-600">RD$ {m.totalFinanced?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* POS Access & QR Links */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Slug: /pos/{m.portalSlug}</span>
                      <span>PIN: {m.pinCode}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyPosLink(m.portalSlug)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/40 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copiar Enlace POS
                      </button>
                      <button
                        onClick={() => setQrMerchant(m)}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 rounded-xl transition-all"
                        title="Ver Código QR para mostrador"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <a
                        href={`/pos/${m.portalSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                        title="Abrir POS en nueva pestaña"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: LIQUIDACIONES & DESEMBOLSOS ─── */}
      {activeTab === 'payouts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Historial de Liquidaciones a Comercios</h3>
              <p className="text-xs text-slate-400">Control de fondos desembolsados a las cuentas bancarias de los negocios aliados.</p>
            </div>
          </div>

          {approvedPosRequests.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No hay liquidaciones registradas todavía.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Comercio Beneficiario</th>
                    <th className="p-3">Cliente Comprador</th>
                    <th className="p-3">Artículo Financiado</th>
                    <th className="p-3 text-right">Monto Desembolsado</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {approvedPosRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-slate-500">{req.merchantPayoutDate || req.requestDate?.split('T')[0]}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-white">{req.merchantName || 'Comercio Aliado'}</td>
                      <td className="p-3">{req.clientName}</td>
                      <td className="p-3 text-slate-500">{req.productDescription || 'Mercancía'}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        RD$ {req.financedAmount?.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {req.merchantPayoutStatus || 'Liquidado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: CREAR / EDITAR COMERCIO ALIADO ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-600" />
                {editingMerchantId ? 'Editar Comercio Aliado' : 'Registrar Nuevo Comercio Aliado'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMerchant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Comercial de la Tienda *</label>
                  <input
                    type="text"
                    placeholder="Ej. Mueblería La Confianza / iStore Santiago / Taller AutoExpert"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Rubro / Categoría *</label>
                  <CustomSelect
                    value={category}
                    onChange={(val) => setCategory(val as MerchantPartner['category'])}
                    options={[
                      { value: 'Mueblería', label: 'Mueblería & Hogar' },
                      { value: 'Celulares & Tecnología', label: 'Celulares & Tecnología' },
                      { value: 'Taller & Repuestos', label: 'Taller de Vehículos & Repuestos' },
                      { value: 'Electrodomésticos', label: 'Electrodomésticos' },
                      { value: 'Ferretería', label: 'Ferretería & Construcción' },
                      { value: 'Salud & Clínica', label: 'Salud & Tratamientos' },
                      { value: 'Otro', label: 'Otro Rubro' },
                    ]}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">RNC o Cédula Titular</label>
                  <input
                    type="text"
                    placeholder="130-00000-0"
                    value={rncOrCedula}
                    onChange={(e) => setRncOrCedula(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Contacto Principal / Gerente</label>
                  <input
                    type="text"
                    placeholder="Ej. Ramón Gómez"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp Tienda</label>
                  <input
                    type="tel"
                    placeholder="809-000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Dirección Física del Local</label>
                  <input
                    type="text"
                    placeholder="Calle, No., Sector y Ciudad"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

              </div>

              {/* Bank Account Section for Direct Disbursements */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Cuenta Bancaria para Desembolsos Directos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Banco</label>
                    <CustomSelect
                      value={bankName}
                      onChange={(val) => setBankName(val)}
                      options={[
                        { value: 'Banreservas', label: 'Banreservas' },
                        { value: 'Banco Popular', label: 'Banco Popular Dominicano' },
                        { value: 'Banco BHD', label: 'Banco BHD' },
                        { value: 'Scotiabank', label: 'Scotiabank' },
                        { value: 'Banco Santa Cruz', label: 'Banco Santa Cruz' },
                        { value: 'Asociación Popular (APAP)', label: 'APAP' },
                        { value: 'Qik Banco Digital', label: 'Qik Banco Digital' },
                        { value: 'Otro Banco', label: 'Otro Banco' },
                      ]}
                      className="w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      placeholder="000-000000-0"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Tipo de Cuenta</label>
                    <CustomSelect
                      value={bankAccountType}
                      onChange={(val) => setBankAccountType(val as 'Corriente' | 'Ahorro')}
                      options={[
                        { value: 'Corriente', label: 'Cuenta Corriente' },
                        { value: 'Ahorro', label: 'Cuenta de Ahorro' },
                      ]}
                      className="w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Titular de la Cuenta</label>
                    <input
                      type="text"
                      placeholder="Nombre de la empresa o titular"
                      value={bankHolderName}
                      onChange={(e) => setBankHolderName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* POS Access Slug & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Slug / Enlace del Punto de Venta *</label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl text-xs font-mono">
                      /pos/
                    </span>
                    <input
                      type="text"
                      placeholder="muebleria-la-confianza"
                      value={portalSlug}
                      onChange={(e) => setPortalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">PIN de Seguridad para el Cajero *</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-center tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingMerchantId ? 'Guardar Cambios' : 'Registrar Comercio'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRMACIÓN DE APROBACIÓN EXPRESS (1-CLIC) ─── */}
      {selectedRequestForApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Aprobación Express de Financiamiento</h3>
                <p className="text-xs text-slate-400">Liquidación y creación de préstamo inmediato</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between"><span className="text-slate-500">Comercio Aliado:</span><span className="font-bold text-indigo-600">{selectedRequestForApproval.merchantName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Cliente Comprador:</span><span className="font-bold text-slate-800 dark:text-white">{selectedRequestForApproval.clientName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Cédula:</span><span className="font-mono">{selectedRequestForApproval.buyerCedula || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Artículo:</span><span className="font-semibold">{selectedRequestForApproval.productDescription}</span></div>
              <div className="flex justify-between font-bold text-sm text-emerald-600 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Monto a Transferir al Comercio:</span>
                <span className="font-mono">RD$ {selectedRequestForApproval.financedAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cuenta Bancaria de Origen para el Desembolso
              </label>
              <CustomSelect
                value={disbursementBankAccountId}
                onChange={(val) => setDisbursementBankAccountId(val)}
                options={[
                  { value: '', label: 'Caja Principal (Efectivo / General)' },
                  ...bankAccounts.map(b => ({ value: b.id, label: `${b.bankName} - ${b.accountNumber} (RD$ ${b.balance?.toLocaleString() || 0})` }))
                ]}
                className="w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequestForApproval(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isApproving}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isApproving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirmar y Desembolsar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL: CÓDIGO QR PARA MOSTRADOR DE TIENDA ─── */}
      {qrMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">QR Punto de Venta</h3>
              <button onClick={() => setQrMerchant(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-inner">
                {/* SVG QR Code representation */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/pos/${qrMerchant.portalSlug}`)}`}
                  alt="QR POS"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{qrMerchant.name}</h4>
              <p className="text-xs text-slate-500 font-mono">/pos/{qrMerchant.portalSlug}</p>
              <p className="text-[11px] text-slate-400">
                Coloque este QR en el mostrador para que los vendedores accedan de inmediato desde su móvil.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => copyPosLink(qrMerchant.portalSlug)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Copiar Enlace
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl"
                title="Imprimir QR"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MerchantsPage;
