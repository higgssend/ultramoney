import React, { useState } from 'react';
import { 
  Landmark, Plus, Wallet, CheckCircle, CreditCard, 
  Trash2, Edit3, ShieldCheck, Building2, X, Link, Copy, Check,
  ExternalLink, Share2, Smartphone, Eye, Sparkles, AlertCircle
} from 'lucide-react';
import { useAccounting, useSettings } from '../context/StoreContext';
import { BankAccount, CustomPaymentMethod, PaymentLinkConfig } from '../types';
import { DOMINICAN_BANKS, getBankLogoUrl } from '../utils/bankLogos';
import { PublicPaymentPortal } from './PublicPaymentPortal';
import { toast } from 'sonner';

export const BankAccountsPage: React.FC = () => {
  const { 
    bankAccounts, addBankAccount, removeBankAccount, updateBankAccount,
    paymentMethods, addPaymentMethod, updatePaymentMethod, removePaymentMethod, togglePaymentMethodStatus
  } = useAccounting();
  const { companySettings } = useSettings();

  // Tab State: 'accounts' | 'payment-link'
  const [activeTab, setActiveTab] = useState<'accounts' | 'payment-link'>('accounts');

  // Bank Account Modal Form State
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [bankName, setBankName] = useState(DOMINICAN_BANKS[0].name);
  const [customBankName, setCustomBankName] = useState('');
  const [accountType, setAccountType] = useState<'Ahorros' | 'Corriente' | 'Caja Chica / Efectivo'>('Corriente');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [cedulaOrRnc, setCedulaOrRnc] = useState('');
  const [currency, setCurrency] = useState<'DOP' | 'USD'>('DOP');
  const [balance, setBalance] = useState<number>(0);

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editBalanceVal, setEditBalanceVal] = useState<number>(0);

  // Payment Method Modal Form State
  const [isAddingPm, setIsAddingPm] = useState(false);
  const [editingPmId, setEditingPmId] = useState<string | null>(null);
  const [pmName, setPmName] = useState('');
  const [pmCategory, setPmCategory] = useState<CustomPaymentMethod['category']>('POS / Verifone');
  const [pmDescription, setPmDescription] = useState('');
  const [pmRequiresRef, setPmRequiresRef] = useState(true);

  // Payment Link Configuration State for Live Preview
  const [linkConfig, setLinkConfig] = useState<PaymentLinkConfig>({
    title: 'Portal de Pagos & Transferencias Bancarias',
    instructions: 'Transfiere a cualquiera de nuestras cuentas oficiales y envía el comprobante por WhatsApp.',
    whatsappPhone: companySettings?.phone || '',
    showCompanyLogo: true,
    showCompanyRnc: true,
    customNote: 'Por favor indica tu nombre o número de cédula en el concepto de la transferencia.',
    selectedAccountIds: bankAccounts.map(a => a.id)
  });

  const [copiedLink, setCopiedLink] = useState(false);

  const publicLinkUrl = `${window.location.origin}/pagar`;

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBankName = bankName === 'Otro Banco / Entidad' ? (customBankName.trim() || 'Banco Personalizado') : bankName;

    if (!accountName.trim()) {
      toast.error('Ingrese el nombre o titular de la cuenta/caja');
      return;
    }

    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: finalBankName,
      accountType,
      accountNumber: accountNumber.trim() || 'S/N',
      accountName: accountName.trim(),
      holderName: accountName.trim(),
      cedulaOrRnc: cedulaOrRnc.trim() || companySettings?.rnc || '',
      showInPaymentLink: true,
      currency,
      balance: balance || 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    addBankAccount(newAccount);
    toast.success(`Cuenta "${accountName}" agregada con éxito`);
    setIsAddingBank(false);
    setAccountNumber('');
    setAccountName('');
    setCedulaOrRnc('');
    setBalance(0);
  };

  const handleSaveEditBalance = (id: string) => {
    updateBankAccount(id, { balance: editBalanceVal });
    toast.success('Balance de la cuenta actualizado');
    setEditingAccountId(null);
  };

  // Open Payment Method Modal for Create or Edit
  const handleOpenPmModal = (pm?: CustomPaymentMethod) => {
    if (pm) {
      setEditingPmId(pm.id);
      setPmName(pm.name);
      setPmCategory(pm.category);
      setPmDescription(pm.description || '');
      setPmRequiresRef(Boolean(pm.requiresReference));
    } else {
      setEditingPmId(null);
      setPmName('');
      setPmCategory('POS / Verifone');
      setPmDescription('');
      setPmRequiresRef(true);
    }
    setIsAddingPm(true);
  };

  const handlePmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmName.trim()) {
      toast.error('Ingrese el nombre del método de pago (ej. Verifone CardNet)');
      return;
    }

    if (editingPmId) {
      updatePaymentMethod(editingPmId, {
        name: pmName.trim(),
        category: pmCategory,
        description: pmDescription.trim(),
        requiresReference: pmRequiresRef
      });
      toast.success(`Método "${pmName}" actualizado`);
    } else {
      const newPm: CustomPaymentMethod = {
        id: `pm-${Date.now()}`,
        name: pmName.trim(),
        category: pmCategory,
        description: pmDescription.trim() || undefined,
        requiresReference: pmRequiresRef,
        isActive: true,
        isDefault: false,
        createdAt: new Date().toISOString()
      };
      addPaymentMethod(newPm);
      toast.success(`Método de pago "${pmName}" registrado`);
    }

    setIsAddingPm(false);
    setEditingPmId(null);
    setPmName('');
    setPmDescription('');
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-extrabold uppercase border border-indigo-400/30">
            Módulo Financiero & Pagos
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" /> Cuentas Bancarias & Link de Pagos
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl">
            Administra tus cuentas de banco, verifones POS, y genera links de cobro interactivos con logos de bancos dominicanos.
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
              onClick={() => setIsAddingBank(true)}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" /> + Añadir Cuenta Bancaria
            </button>
          )}
        </div>
      </div>

      {/* Module Navigation Tabs */}
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

      {/* TAB 1: ACCOUNTS & PAYMENT METHODS */}
      {activeTab === 'accounts' && (
        <div className="space-y-8 animate-fade-in">
          {/* Add Bank Account Modal Form */}
          {isAddingBank && (
            <form onSubmit={handleBankSubmit} className="bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-indigo-600 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-600" /> Crear Nueva Cuenta Bancaria o Caja
                </h3>
                <button type="button" onClick={() => setIsAddingBank(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Banco Dominicano / Entidad</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                  >
                    {DOMINICAN_BANKS.map((b) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                    <option value="Otro Banco / Entidad">Otro Banco / Entidad</option>
                  </select>
                </div>

                {bankName === 'Otro Banco / Entidad' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Banco Personalizado</label>
                    <input
                      type="text"
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      placeholder="Ej: Banco Lafise"
                      className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre o Titular de la Cuenta</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Ej. UltraMoney SRL - Cuenta Principal"
                    className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Cédula / RNC del Titular</label>
                  <input
                    type="text"
                    value={cedulaOrRnc}
                    onChange={(e) => setCedulaOrRnc(e.target.value)}
                    placeholder="Ej. 131-1234567-8"
                    className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Número de Cuenta</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Ej. 960-1234567-1"
                    className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Cuenta</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as BankAccount['accountType'])}
                    className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                  >
                    <option value="Corriente">Cuenta Corriente</option>
                    <option value="Ahorros">Cuenta de Ahorros</option>
                    <option value="Caja Chica / Efectivo">Caja Chica / Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Balance Inicial</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingBank(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-indigo-600/30"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          )}

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bankAccounts.map((acc) => {
              const isEditing = editingAccountId === acc.id;
              const logoPath = acc.bankLogoUrl || getBankLogoUrl(acc.bankName);

              return (
                <div
                  key={acc.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200/80 dark:border-slate-800 space-y-4 relative overflow-hidden group hover:border-indigo-400 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-sm">
                        <img 
                          src={logoPath} 
                          alt={acc.bankName} 
                          className="max-w-full max-h-full object-contain rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/banks/Bancos_Banreservas.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                          {acc.bankName}
                        </h4>
                        <span className="text-xs text-slate-500 font-semibold block">
                          {acc.accountName || acc.holderName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAccountId(acc.id);
                          setEditBalanceVal(acc.balance || 0);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        title="Editar balance"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!acc.isDefault && (
                        <button
                          onClick={() => {
                            removeBankAccount(acc.id);
                            toast.success('Cuenta eliminada');
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Número de Cuenta</span>
                      <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                        {acc.accountNumber}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Tipo de Cuenta</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {acc.accountType}
                      </span>
                    </div>

                    {acc.cedulaOrRnc && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Cédula / RNC</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {acc.cedulaOrRnc}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-slate-500 font-bold">Balance Disponible</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editBalanceVal}
                            onChange={(e) => setEditBalanceVal(Number(e.target.value))}
                            className="w-28 p-1.5 border rounded-xl text-xs font-mono font-bold dark:bg-slate-800"
                          />
                          <button
                            onClick={() => handleSaveEditBalance(acc.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                          RD$ {(acc.balance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Methods Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-600" /> Otros Métodos de Pago & Terminales POS
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configura terminales de tarjeta, PayPal, Zelle o cobros personalizados.</p>
              </div>

              <button
                onClick={() => handleOpenPmModal()}
                className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> + Nuevo Método de Pago
              </button>
            </div>

            {/* Payment Method Modal */}
            {isAddingPm && (
              <form onSubmit={handlePmSubmit} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900 space-y-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                  {editingPmId ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Método</label>
                    <input
                      type="text"
                      value={pmName}
                      onChange={(e) => setPmName(e.target.value)}
                      placeholder="Ej: CardNet POS 01"
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                    <select
                      value={pmCategory}
                      onChange={(e) => setPmCategory(e.target.value as CustomPaymentMethod['category'])}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-900 font-bold"
                    >
                      <option value="POS / Verifone">POS / Verifone</option>
                      <option value="Pasarela Digital">Pasarela Digital (PayPal / Stripe)</option>
                      <option value="Transferencia">Transferencia Directa</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddingPm(false)} className="px-4 py-2 text-xs font-bold">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">Guardar</button>
                </div>
              </form>
            )}

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
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        pm.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {pm.isActive ? 'Activo' : 'Inactivo'}
                    </button>
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
                  href="/pagar"
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

          {/* SPLIT VIEW: Customizer Controls (Left) vs Live Real-Time Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Customization & Bank Selection (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* General Portal Settings Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" /> Personaliza tu Portal
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Título del Portal</label>
                    <input
                      type="text"
                      value={linkConfig.title}
                      onChange={(e) => setLinkConfig(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Instrucciones para el Cliente</label>
                    <textarea
                      rows={3}
                      value={linkConfig.instructions}
                      onChange={(e) => setLinkConfig(prev => ({ ...prev, instructions: e.target.value }))}
                      className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono WhatsApp para Comprobantes</label>
                    <input
                      type="text"
                      value={linkConfig.whatsappPhone}
                      onChange={(e) => setLinkConfig(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                      placeholder="Ej. +1 (809) 555-0199"
                      className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nota Adicional / Concepto</label>
                    <input
                      type="text"
                      value={linkConfig.customNote}
                      onChange={(e) => setLinkConfig(prev => ({ ...prev, customNote: e.target.value }))}
                      placeholder="Ej. Indicar nombre o cédula en el concepto"
                      className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-medium"
                    />
                  </div>

                  <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={linkConfig.showCompanyLogo}
                        onChange={(e) => setLinkConfig(prev => ({ ...prev, showCompanyLogo: e.target.checked }))}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Mostrar Logo de la Empresa</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={linkConfig.showCompanyRnc}
                        onChange={(e) => setLinkConfig(prev => ({ ...prev, showCompanyRnc: e.target.checked }))}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Mostrar RNC en la Cabecera</span>
                    </label>
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

                        {/* Inline Edit Inputs for Holder & Cédula */}
                        {isSelected && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Titular</label>
                              <input
                                type="text"
                                value={acc.holderName || acc.accountName || ''}
                                onChange={(e) => updateBankAccount(acc.id, { holderName: e.target.value, accountName: e.target.value })}
                                placeholder="Nombre del Titular"
                                className="w-full p-2 border rounded-xl dark:bg-slate-800 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Cédula / RNC</label>
                              <input
                                type="text"
                                value={acc.cedulaOrRnc || ''}
                                onChange={(e) => updateBankAccount(acc.id, { cedulaOrRnc: e.target.value })}
                                placeholder="Cédula o RNC"
                                className="w-full p-2 border rounded-xl dark:bg-slate-800 font-bold font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Live Real-Time Preview Frame (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-3 sticky top-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" /> Vista Previa en Vivo (Real-Time Live Device Mockup)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                  ● Actualización en vivo
                </span>
              </div>

              {/* Realistic Mobile Device Frame Mockup */}
              <div className="bg-slate-900 p-4 sm:p-6 rounded-[40px] shadow-2xl border-4 border-slate-800 relative max-w-md mx-auto">
                {/* Top Phone Camera Notch */}
                <div className="w-32 h-4 bg-slate-950 rounded-full mx-auto mb-4 flex items-center justify-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-900" />
                </div>

                {/* Inner Device Screen */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-[30px] overflow-hidden max-h-[680px] overflow-y-auto border border-slate-800">
                  <PublicPaymentPortal
                    isLivePreview={true}
                    previewConfig={linkConfig}
                    previewAccounts={bankAccounts}
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default BankAccountsPage;
