import React, { useState } from 'react';
import { 
  Landmark, Plus, CreditCard, Trash2, Edit3, Building2, X, Link, Copy, Check,
  ExternalLink, Smartphone, Eye, Sparkles, Sliders, Wallet, ArrowRight, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { useAccounting, useSettings } from '../context/StoreContext';
import { BankAccount, CustomPaymentMethod, PaymentLinkConfig } from '../types';
import { DOMINICAN_BANKS, getBankLogoUrl } from '../utils/bankLogos';
import { PublicPaymentPortal } from './PublicPaymentPortal';
import { toast } from 'sonner';

type InstrumentCategory = 'bank_transfer' | 'verifone_pos' | 'cash_box' | 'digital_wallet';

export const BankAccountsPage: React.FC = () => {
  const { 
    bankAccounts, addBankAccount, removeBankAccount, updateBankAccount,
    paymentMethods, addPaymentMethod, updatePaymentMethod, removePaymentMethod, togglePaymentMethodStatus
  } = useAccounting();
  const { companySettings } = useSettings();

  // Tab State: 'accounts' | 'payment-link'
  const [activeTab, setActiveTab] = useState<'accounts' | 'payment-link'>('accounts');

  // Modal State for Create/Edit Instrument
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Category Selection
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory>('bank_transfer');

  // Form Fields State
  const [bankName, setBankName] = useState(DOMINICAN_BANKS[0].name);
  const [customBankName, setCustomBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Ahorros' | 'Corriente' | 'Caja Chica / Efectivo'>('Corriente');
  const [cedulaOrRnc, setCedulaOrRnc] = useState('');
  const [currency, setCurrency] = useState<'DOP' | 'USD'>('DOP');
  const [balance, setBalance] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // POS / Verifone Specific Fields
  const [posNetwork, setPosNetwork] = useState('CardNet POS');
  const [terminalCode, setTerminalCode] = useState('');
  const [feePercentage, setFeePercentage] = useState<number>(2.5);

  // Confirm Delete Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<'account' | 'payment_method'>('account');

  // Payment Link Configuration State for Live Preview
  const [linkConfig, setLinkConfig] = useState<PaymentLinkConfig>({
    title: 'Portal de Pagos & Transferencias Bancarias',
    instructions: 'Transfiere a cualquiera de nuestras cuentas oficiales y envía el comprobante por WhatsApp.',
    whatsappPhone: companySettings?.phone || '809-555-0123',
    showCompanyLogo: true,
    showCompanyRnc: true,
    customNote: 'Esta información ha sido proporcionada directamente por el titular. Asegúrate de verificar los datos antes de transferir.',
    customSlug: companySettings?.customLink || 'tu-empresa',
    selectedAccountIds: bankAccounts.map(a => a.id)
  });

  const [copiedLink, setCopiedLink] = useState(false);

  // Format custom URL slug
  const formattedSlug = (linkConfig.customSlug || 'tu-empresa')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');

  const publicLinkUrl = `${window.location.origin}/linkpagos/${formattedSlug}`;

  // Open Modal for Create or Edit
  const handleOpenCreateModal = (category: InstrumentCategory = 'bank_transfer') => {
    setEditingAccountId(null);
    setSelectedCategory(category);
    setBankName(DOMINICAN_BANKS[0].name);
    setCustomBankName('');
    setAccountName('');
    setHolderName(companySettings?.name || '');
    setAccountNumber('');
    setAccountType(category === 'bank_transfer' ? 'Corriente' : category === 'cash_box' ? 'Caja Chica / Efectivo' : 'Ahorros');
    setCedulaOrRnc(companySettings?.rnc || '');
    setCurrency('DOP');
    setBalance(0);
    setIsActive(true);
    setPosNetwork('CardNet POS');
    setTerminalCode('');
    setFeePercentage(2.5);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: BankAccount) => {
    setEditingAccountId(acc.id);
    
    // Determine category
    if (acc.accountType === 'Caja Chica / Efectivo') {
      setSelectedCategory('cash_box');
    } else if (acc.bankName.toLowerCase().includes('paypal') || acc.bankName.toLowerCase().includes('zelle') || acc.bankName.toLowerCase().includes('billet')) {
      setSelectedCategory('digital_wallet');
    } else if (acc.bankName.toLowerCase().includes('pos') || acc.bankName.toLowerCase().includes('verifone')) {
      setSelectedCategory('verifone_pos');
    } else {
      setSelectedCategory('bank_transfer');
    }

    setBankName(acc.bankName);
    setCustomBankName(acc.bankName);
    setAccountName(acc.accountName || '');
    setHolderName(acc.holderName || acc.accountName || '');
    setAccountNumber(acc.accountNumber || '');
    setAccountType(acc.accountType || 'Corriente');
    setCedulaOrRnc(acc.cedulaOrRnc || '');
    setCurrency(acc.currency || 'DOP');
    setBalance(acc.balance || 0);
    setIsActive(acc.isActive !== false);
    setIsModalOpen(true);
  };

  // Submit Form (Create or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    let finalBankName = bankName;
    if (selectedCategory === 'cash_box') {
      finalBankName = 'Caja Chica / Efectivo';
    } else if (selectedCategory === 'verifone_pos') {
      finalBankName = `${posNetwork} (${terminalCode || 'Verifone'})`;
    } else if (bankName === 'Otro Banco / Entidad') {
      finalBankName = customBankName.trim() || 'Entidad Financiera';
    }

    const finalAccountName = accountName.trim() || (selectedCategory === 'cash_box' ? 'Caja General' : `${finalBankName}`);

    if (editingAccountId) {
      // Update existing account
      updateBankAccount(editingAccountId, {
        bankName: finalBankName,
        accountName: finalAccountName,
        holderName: holderName.trim() || finalAccountName,
        accountNumber: accountNumber.trim() || 'S/N',
        accountType: selectedCategory === 'cash_box' ? 'Caja Chica / Efectivo' : accountType,
        cedulaOrRnc: cedulaOrRnc.trim(),
        currency,
        balance,
        isActive,
        bankLogoUrl: getBankLogoUrl(finalBankName)
      });
      toast.success('Cuenta actualizada con éxito');
    } else {
      // Create new account
      const newAccount: BankAccount = {
        id: `bank-${Date.now()}`,
        bankName: finalBankName,
        accountName: finalAccountName,
        holderName: holderName.trim() || finalAccountName,
        accountNumber: accountNumber.trim() || 'S/N',
        accountType: selectedCategory === 'cash_box' ? 'Caja Chica / Efectivo' : accountType,
        cedulaOrRnc: cedulaOrRnc.trim() || companySettings?.rnc || '',
        currency,
        balance,
        isActive,
        showInPaymentLink: true,
        bankLogoUrl: getBankLogoUrl(finalBankName),
        createdAt: new Date().toISOString()
      };
      addBankAccount(newAccount);
    }

    setIsModalOpen(false);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deletingId) return;
    if (deletingType === 'account') {
      removeBankAccount(deletingId);
    } else {
      removePaymentMethod(deletingId);
    }
    setDeletingId(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLinkUrl);
    setCopiedLink(true);
    toast.success('¡Link de pagos copiado al portapapeles!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsapp = () => {
    const text = `Hola, aquí tienes nuestras cuentas bancarias oficiales para transferencias y pagos: ${publicLinkUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleToggleAccountForLink = (accountId: string) => {
    setLinkConfig(prev => {
      const current = prev.selectedAccountIds || [];
      const updated = current.includes(accountId)
        ? current.filter(id => id !== accountId)
        : [...current, accountId];
      return { ...prev, selectedAccountIds: updated };
    });
  };

  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-extrabold uppercase border border-indigo-400/30">
            Gestión Financiera & Métodos de Pago
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" /> Cuentas Bancarias & Formas de Cobro
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl">
            Crea y administra tus cuentas de transferencia bancaria, terminales verifone POS, cajas chicas y pasarelas digitales.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right">
            <span className="text-xs text-indigo-200 block font-medium">Balance Total Consolidado</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              RD$ {totalBankBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {activeTab === 'accounts' && (
            <button
              onClick={() => handleOpenCreateModal('bank_transfer')}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> + Crear Cuenta o Método
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'accounts'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cuentas & Cajas</span>
        </button>

        <button
          onClick={() => setActiveTab('payment-link')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'payment-link'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>Link de Pago & Portal</span>
        </button>
      </div>

      {/* TAB 1: FINANCIAL INSTRUMENTS & ACCOUNTS GRID */}
      {activeTab === 'accounts' && (
        <div className="space-y-8 animate-fade-in">

          {/* Quick Action Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleOpenCreateModal('bank_transfer')}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all text-left group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Cuenta Bancaria</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Transferencia Banreservas, Popular, BHD, APAP, etc.</p>
              </div>
              <div className="flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>+ Agregar Cuenta</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>

            <button
              onClick={() => handleOpenCreateModal('verifone_pos')}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all text-left group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold group-hover:bg-cyan-600 group-hover:text-white transition-all">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Verifone / POS</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Terminales CardNet, Visanet/Azul, PixelPay.</p>
              </div>
              <div className="flex items-center text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">
                <span>+ Registrar POS</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>

            <button
              onClick={() => handleOpenCreateModal('cash_box')}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all text-left group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Caja Chica / Efectivo</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Caja Principal, Mostrador o Cobrador en Ruta.</p>
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>+ Crear Caja</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>

            <button
              onClick={() => handleOpenCreateModal('digital_wallet')}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all text-left group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Pasarela Digital</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">PayPal, Zelle, Billet, Bitcoin wallet.</p>
              </div>
              <div className="flex items-center text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                <span>+ Añadir Billetera</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>
          </div>

          {/* Instrument Accounts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bankAccounts.map((acc) => {
              const logoPath = acc.bankLogoUrl || getBankLogoUrl(acc.bankName);

              return (
                <div
                  key={acc.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200/80 dark:border-slate-800 space-y-4 relative overflow-hidden group hover:border-indigo-400 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-sm">
                        <img 
                          src={logoPath} 
                          alt={acc.bankName} 
                          className="max-w-full max-h-full object-contain rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getBankLogoUrl('Banreservas');
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight truncate">
                          {acc.bankName}
                        </h4>
                        <span className="text-xs text-slate-500 font-semibold block truncate">
                          {acc.accountName || acc.holderName}
                        </span>
                      </div>
                    </div>

                    {/* Edit and Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(acc)}
                        className="p-2.5 rounded-2xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all font-bold"
                        title="Editar cuenta completa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(acc.id);
                          setDeletingType('account');
                        }}
                        className="p-2.5 rounded-2xl text-rose-600 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 transition-all font-bold"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Número / ID</span>
                      <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                        {acc.accountNumber}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Tipo / Categoría</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {acc.accountType}
                      </span>
                    </div>

                    {acc.holderName && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Titular</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {acc.holderName}
                        </span>
                      </div>
                    )}

                    {acc.cedulaOrRnc && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Cédula / RNC</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {acc.cedulaOrRnc}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 font-bold">Balance Disponible</span>
                      <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                        RD$ {(acc.balance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Methods / Terminals Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-600" /> Formas de Pago & Terminales POS Registradas
                </h3>
                <p className="text-xs text-slate-500 mt-1">Habilita o deshabilita terminales POS, cobros en efectivo y transferencias.</p>
              </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{pm.name}</h5>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{pm.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePaymentMethodStatus(pm.id)}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                        pm.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {pm.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                    {!pm.isDefault && (
                      <button
                        onClick={() => {
                          setDeletingId(pm.id);
                          setDeletingType('payment_method');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-all"
                        title="Eliminar método"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PUBLIC PAYMENT LINK & REAL-TIME LIVE PREVIEW */}
      {activeTab === 'payment-link' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Public Link Share Bar */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-3 py-1 bg-white/10 text-indigo-200 rounded-full text-xs font-extrabold uppercase tracking-wider">
                  Tu Link Público de Cobro
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1">Comparte tus cuentas con tus clientes</h3>
                <p className="text-xs text-indigo-200">Cualquier cliente con este enlace podrá ver los datos bancarios y copiar el número de cuenta en 1 solo clic.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`/linkpagos/${formattedSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-white/20"
                >
                  <Eye className="w-4 h-4" />
                  <span>Abrir Vista Pública</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>

            {/* URL Input & Copy Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-black/30 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                <Link className="w-5 h-5 text-indigo-300 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={publicLinkUrl}
                  className="w-full bg-transparent font-mono text-xs sm:text-sm font-bold text-indigo-100 outline-none select-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none px-6 py-3 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  onClick={handleShareWhatsapp}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
                  title="Compartir por WhatsApp"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* SPLIT VIEW: Customizer Controls (Left) vs Live iPhone 15 Pro Max Mockup (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Customization & Bank Selection (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* General Portal Settings Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" /> Personaliza tu Portal
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Link Slug Customizer */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                    <label className="block font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>URL Personalizada (Slug de tu Empresa)</span>
                    </label>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2">
                      <span className="text-slate-400 font-mono font-bold select-none text-[11px]">
                        ultramoney.app/linkpagos/
                      </span>
                      <input
                        type="text"
                        value={linkConfig.customSlug || 'tu-empresa'}
                        onChange={(e) => setLinkConfig(prev => ({ ...prev, customSlug: e.target.value }))}
                        placeholder="tu-empresa"
                        className="w-full bg-transparent font-mono font-black text-indigo-600 dark:text-indigo-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono WhatsApp para Comprobantes</label>
                    <input
                      type="text"
                      value={linkConfig.whatsappPhone}
                      onChange={(e) => setLinkConfig(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                      placeholder="Ej. 809-555-0123"
                      className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nota de Seguridad / Términos</label>
                    <textarea
                      rows={3}
                      value={linkConfig.customNote}
                      onChange={(e) => setLinkConfig(prev => ({ ...prev, customNote: e.target.value }))}
                      className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Accounts Setup for Payment Link Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-indigo-600" /> Selecciona Cuentas a Mostrar
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {linkConfig.selectedAccountIds.length} de {bankAccounts.length} activas
                  </span>
                </div>

                <div className="space-y-4">
                  {bankAccounts.filter(a => a.accountType !== 'Caja Chica / Efectivo').map((acc) => {
                    const isSelected = linkConfig.selectedAccountIds.includes(acc.id);
                    const logoPath = acc.bankLogoUrl || getBankLogoUrl(acc.bankName);

                    return (
                      <div
                        key={acc.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20' 
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-3 cursor-pointer min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAccountForLink(acc.id)}
                              className="w-5 h-5 rounded text-indigo-600 shrink-0"
                            />
                            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-100 shrink-0 flex items-center justify-center">
                              <img src={logoPath} alt={acc.bankName} className="max-w-full max-h-full object-contain rounded-lg" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-black text-slate-900 dark:text-white text-sm block truncate">
                                {acc.bankName}
                              </span>
                              <span className="text-xs text-slate-500 font-mono block truncate">
                                Nº {acc.accountNumber}
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: iPhone 15 Pro Max Live Preview Chassis (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-3 sticky top-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" /> iPhone 15 Pro Max — Vista Previa en Vivo
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                  ● Actualización en tiempo real
                </span>
              </div>

              {/* iPhone 15 Pro Max Titanium Chassis */}
              <div className="relative max-w-[380px] mx-auto bg-[#1a191d] p-[7px] rounded-[52px] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.65)] border-[6px] border-[#2e2d33] ring-1 ring-white/10 select-none">
                
                {/* Physical Side Buttons */}
                <div className="absolute -left-[9px] top-28 w-[3px] h-9 bg-[#3a3940] rounded-l-md" />
                <div className="absolute -left-[9px] top-42 w-[3px] h-12 bg-[#3a3940] rounded-l-md" />
                <div className="absolute -left-[9px] top-58 w-[3px] h-12 bg-[#3a3940] rounded-l-md" />
                <div className="absolute -right-[9px] top-36 w-[3px] h-18 bg-[#3a3940] rounded-r-md" />

                {/* Inner Device Viewport Screen */}
                <div className="relative bg-[#f8fafc] dark:bg-slate-950 rounded-[44px] overflow-hidden max-h-[710px] overflow-y-auto border border-black/80">
                  
                  {/* Dynamic Island */}
                  <div className="sticky top-0 z-40 bg-[#f8fafc]/90 dark:bg-slate-950/90 backdrop-blur-md pt-2 pb-1 text-center">
                    <div className="w-28 h-6 bg-black rounded-full mx-auto flex items-center justify-between px-2.5 shadow-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#111116] border border-white/10" />
                      <div className="w-2 h-2 rounded-full bg-[#0a0a20] ring-1 ring-indigo-900/50" />
                    </div>
                  </div>

                  {/* Render Live Portal Page */}
                  <PublicPaymentPortal
                    isLivePreview={true}
                    previewConfig={{ ...linkConfig, customSlug: formattedSlug }}
                    previewAccounts={bankAccounts}
                  />

                  {/* Bottom Home Bar Indicator */}
                  <div className="sticky bottom-1 z-40 pt-1 pb-1">
                    <div className="w-32 h-1 bg-slate-900 dark:bg-slate-100 rounded-full mx-auto opacity-75" />
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CREATE & EDIT INSTRUMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                  {editingAccountId ? 'Editar Instrumento' : 'Nuevo Instrumento Financiero'}
                </span>
                <h3 className="text-xl font-black">
                  {editingAccountId ? 'Modificar Datos de la Cuenta' : 'Registrar Cuenta, Verifone o Caja'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Category Selector Tabs */}
              {!editingAccountId && (
                <div className="space-y-2">
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300">
                    1. Selecciona el Tipo de Método Financiero
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('bank_transfer')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedCategory === 'bank_transfer'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-extrabold ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300 font-bold'
                      }`}
                    >
                      <Landmark className="w-5 h-5 mx-auto mb-1" />
                      <span>Banco</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('verifone_pos')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedCategory === 'verifone_pos'
                          ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 font-extrabold ring-2 ring-cyan-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300 font-bold'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1" />
                      <span>Verifone POS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('cash_box')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedCategory === 'cash_box'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-extrabold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300 font-bold'
                      }`}
                    >
                      <Wallet className="w-5 h-5 mx-auto mb-1" />
                      <span>Caja Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('digital_wallet')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedCategory === 'digital_wallet'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-600 font-extrabold ring-2 ring-purple-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300 font-bold'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mx-auto mb-1" />
                      <span>Billetera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Category Specific Form Fields */}
              {selectedCategory === 'bank_transfer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Banco Dominicano</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    >
                      {DOMINICAN_BANKS.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                      <option value="Otro Banco / Entidad">Otro Banco / Entidad</option>
                    </select>
                  </div>

                  {bankName === 'Otro Banco / Entidad' && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Banco</label>
                      <input
                        type="text"
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        placeholder="Ej. Banco Lafise"
                        className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Cuenta</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Ej. Banreservas Principal SRL"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Ej. 960-1234567-1"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Titular de la Cuenta</label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cédula / RNC</label>
                    <input
                      type="text"
                      value={cedulaOrRnc}
                      onChange={(e) => setCedulaOrRnc(e.target.value)}
                      placeholder="Ej. 402-1234567-8"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Cuenta</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as BankAccount['accountType'])}
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    >
                      <option value="Corriente">Cuenta Corriente</option>
                      <option value="Ahorros">Cuenta de Ahorros</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedCategory === 'verifone_pos' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Red del Verifone / Procesador</label>
                    <select
                      value={posNetwork}
                      onChange={(e) => setPosNetwork(e.target.value)}
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    >
                      <option value="CardNet POS">CardNet (Dominicano)</option>
                      <option value="Visanet / Azul">Visanet / Azul (Banco Popular)</option>
                      <option value="PixelPay POS">PixelPay</option>
                      <option value="Clover POS">Clover</option>
                      <option value="Otro POS">Otro Verifone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Código de Afiliado / Terminal ID</label>
                    <input
                      type="text"
                      value={terminalCode}
                      onChange={(e) => setTerminalCode(e.target.value)}
                      placeholder="Ej. TER-884920"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre o Etiqueta</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Ej. Verifone Caja Mostrador 01"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Comisión Estimada (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={feePercentage}
                      onChange={(e) => setFeePercentage(Number(e.target.value))}
                      placeholder="2.5"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'cash_box' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Caja</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Ej. Caja Principal Mostrador"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Responsable / Encargado</label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Ej. María Rodríguez"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'digital_wallet' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plataforma Digital</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    >
                      <option value="PayPal">PayPal</option>
                      <option value="Zelle">Zelle</option>
                      <option value="Billet">Billet</option>
                      <option value="Bitcoin / Crypto">Bitcoin / Wallet Crypto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Usuario / Email / ID de Pago</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Ej. pagos@ultramoney.app"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Titular Registrado</label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Ej. UltraMoney SRL"
                      className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Shared Balance & Status Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Balance Actual (RD$)</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-mono font-black text-emerald-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estado de la Cuenta</label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full p-3 border rounded-2xl dark:bg-slate-800 font-bold"
                  >
                    <option value="true">Activa (Disponible para Operar)</option>
                    <option value="false">Inactiva (Deshabilitada)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30"
                >
                  {editingAccountId ? 'Guardar Cambios' : 'Crear Instrumento'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">¿Eliminar este elemento?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Esta acción eliminará de forma permanente el elemento seleccionado de la base de datos de InsForge.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs shadow-md shadow-rose-600/30"
              >
                Sí, Eliminar de la Base de Datos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BankAccountsPage;
