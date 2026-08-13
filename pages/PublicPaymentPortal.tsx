import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Copy, Check, Share2, Smartphone, ChevronDown, ChevronUp, 
  ShieldCheck, CheckCircle2, Download, ArrowLeft, Building2, Landmark, Wallet, CreditCard
} from 'lucide-react';
import { BankAccount, PaymentLinkConfig } from '../types';
import { getBankLogoUrl } from '../utils/bankLogos';
import { useSettings, useAccounting, useAuth } from '../context/StoreContext';
import { toast } from 'sonner';

interface PublicPaymentPortalProps {
  isLivePreview?: boolean;
  previewConfig?: PaymentLinkConfig;
  previewAccounts?: BankAccount[];
}

export const PublicPaymentPortal: React.FC<PublicPaymentPortalProps> = ({
  isLivePreview = false,
  previewConfig,
  previewAccounts
}) => {
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const { companySettings } = useSettings();
  const { bankAccounts } = useAccounting();
  const { currentUser } = useAuth();

  // Accordion state
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Configuration settings
  const whatsappPhone = previewConfig?.whatsappPhone || companySettings?.phone || '809-555-0123';
  const showLogo = previewConfig?.showCompanyLogo ?? true;
  const showRnc = previewConfig?.showCompanyRnc ?? true;
  const customNote = previewConfig?.customNote || 'Esta información ha sido proporcionada directamente por el titular. Asegúrate de verificar los datos antes de transferir.';

  const currentSlug = (previewConfig?.customSlug || routeSlug || companySettings?.customLink || 'tu-empresa').toLowerCase();

  const holderName = companySettings?.name || currentUser?.name || 'Juan Pérez';
  const usernameSlug = (companySettings?.name || currentUser?.name || 'juanperez').toLowerCase().replace(/\s+/g, '');
  const subtitle = companySettings?.slogan || 'Servicios Financieros & Préstamos';

  // Accounts list
  const allAccounts = isLivePreview ? (previewAccounts || []) : bankAccounts;
  const selectedIds = previewConfig?.selectedAccountIds;
  const accountsToDisplay = allAccounts.filter(acc => {
    if (!acc.isActive) return false;
    if (acc.accountType === 'Caja Chica / Efectivo') return false;
    if (selectedIds && selectedIds.length > 0) {
      return selectedIds.includes(acc.id);
    }
    return acc.showInPaymentLink !== false;
  });

  const handleToggleAccordion = (id: string) => {
    setOpenAccountId(prev => (prev === id ? null : id));
  };

  const handleCopy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(`${label}-${text}`);
    toast.success(`${label} copiado al portapapeles`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAllData = (acc: BankAccount) => {
    const text = `*DATOS BANCARIOS PARA PAGO*
Banco: ${acc.bankName}
Tipo de Cuenta: ${acc.accountType}
Número de Cuenta: ${acc.accountNumber}
Titular: ${acc.holderName || acc.accountName || holderName}
Cédula/RNC: ${acc.cedulaOrRnc || companySettings?.rnc || 'N/A'}`;

    navigator.clipboard.writeText(text);
    setCopiedField(`all-${acc.id}`);
    toast.success('¡Todos los datos de la cuenta fueron copiados!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Cuentas Bancarias - ${holderName}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('¡Link copiado al portapapeles!');
    }
  };

  const cleanWhatsappPhone = whatsappPhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappPhone}?text=${encodeURIComponent('Hola, adjunto comprobante de pago realizado por transferencia bancaria.')}`;

  return (
    <div className={`w-full min-h-screen ${isLivePreview ? 'bg-slate-100/70 p-3 sm:p-5 rounded-[36px]' : 'bg-[#f8fafc] dark:bg-slate-950 py-6 px-4 sm:px-6'}`}>
      <div className="max-w-md mx-auto space-y-5 font-sans">

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-2 pt-1">
          {!isLivePreview ? (
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:text-slate-950"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          ) : (
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Volver</span>
          )}

          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 dark:text-slate-300 transition-colors"
            title="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Main Profile & User Card (Exact replica of reference image) */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center relative space-y-4">
          
          {/* Avatar with Floating Speech Pill */}
          <div className="relative inline-block mx-auto">
            {/* Speech Bubble Pill */}
            <div className="absolute -top-3 -right-6 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-md rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1 z-10">
              <span>👋 ¡Hola!</span>
            </div>

            {/* Avatar Circle */}
            {showLogo && companySettings?.logoUrl ? (
              <img 
                src={companySettings.logoUrl} 
                alt={holderName} 
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/20 shadow-lg mx-auto p-1 bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border-4 border-white dark:border-slate-800 mx-auto">
                {holderName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User / Company Information */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>{holderName}</span>
            </h1>
            
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>{usernameSlug}</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-500 fill-cyan-500 text-white" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
              {subtitle}
            </p>
          </div>

          {/* Link Capsule Pill with Glowing Green Status Dot */}
          <div className="inline-flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-full px-4 py-1.5 text-[10px] font-extrabold tracking-widest text-slate-600 dark:text-slate-300 uppercase mx-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ULTRAMONEY.APP/LINKPAGOS/{currentSlug.toUpperCase()}</span>
          </div>

          {/* Phone Number */}
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider font-mono">
            {whatsappPhone}
          </p>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleCopy(window.location.href, 'Link de pago')}
              className="py-3 px-4 bg-[#111827] hover:bg-slate-800 active:scale-95 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Datos</span>
            </button>

            <button
              onClick={() => toast.info('Descargando tarjeta de contacto...')}
              className="py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 active:scale-95 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Descargar Tarjeta</span>
            </button>
          </div>

        </div>

        {/* Cuentas Bancarias Accordion List Section */}
        <div className="space-y-3 pt-2">
          
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              CUENTAS BANCARIAS
            </span>
            <ChevronUp className="w-4 h-4 text-slate-400" />
          </div>

          {accountsToDisplay.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center text-slate-400 border border-slate-100 dark:border-slate-800">
              <Landmark className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-bold">No hay cuentas bancarias visibles actualmente.</p>
            </div>
          ) : (
            accountsToDisplay.map((acc) => {
              const isOpen = openAccountId === acc.id;
              const logoUrl = acc.bankLogoUrl || getBankLogoUrl(acc.bankName);
              const accHolder = acc.holderName || acc.accountName || holderName;
              const accCedula = acc.cedulaOrRnc || companySettings?.rnc || '402-1234567-8';

              return (
                <div 
                  key={acc.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' 
                      : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Card Tile Header (Click to Expand Accordion) */}
                  <button
                    onClick={() => handleToggleAccordion(acc.id)}
                    className="w-full p-4 flex items-center justify-between text-left focus:outline-none select-none group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Bank Logo or Cash/POS Icon Container */}
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={acc.bankName} 
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className={`w-full h-full rounded-lg flex items-center justify-center ${
                            acc.accountType === 'Caja Chica / Efectivo' || acc.bankName.toLowerCase().includes('caja')
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400'
                          }`}>
                            {acc.accountType === 'Caja Chica / Efectivo' || acc.bankName.toLowerCase().includes('caja') ? (
                              <Wallet className="w-5 h-5" />
                            ) : (
                              <CreditCard className="w-5 h-5" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bank Title & Type */}
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base truncate">
                          {acc.bankName}
                        </h4>
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          {acc.accountType || 'AHORROS'}
                        </span>
                      </div>
                    </div>

                    {/* Chevron Indicator */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Accordion Details (Exact replica of Screen 2) */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-4 space-y-3.5 animate-fade-in">
                      
                      {/* NÚMERO DE CUENTA (Input Box Card with Copy Icon inside) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          NÚMERO DE CUENTA
                        </span>
                        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-sm">
                          <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white tracking-wider truncate">
                            {acc.accountNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(acc.accountNumber, 'Número de cuenta')}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                            title="Copiar Número de Cuenta"
                          >
                            {copiedField === `Número de cuenta-${acc.accountNumber}` ? (
                              <Check className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 2 Columns Grid: CÉDULA / RNC & TITULAR */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* CÉDULA / RNC Box */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            CÉDULA / RNC
                          </span>
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-1 shadow-sm">
                            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 truncate">
                              {accCedula}
                            </span>
                            <button
                              onClick={() => handleCopy(accCedula, 'Cédula / RNC')}
                              className="p-1 text-slate-400 hover:text-indigo-600 shrink-0"
                            >
                              {copiedField === `Cédula / RNC-${accCedula}` ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* TITULAR Box */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            TITULAR
                          </span>
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-1 shadow-sm">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {accHolder}
                            </span>
                            <button
                              onClick={() => handleCopy(accHolder, 'Titular')}
                              className="p-1 text-slate-400 hover:text-indigo-600 shrink-0"
                            >
                              {copiedField === `Titular-${accHolder}` ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Copiar Todo Button (Exact style from Screen 2) */}
                      <button
                        onClick={() => handleCopyAllData(acc)}
                        className="w-full py-3.5 px-4 bg-[#111827] hover:bg-slate-800 active:scale-98 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all mt-2"
                      >
                        {copiedField === `all-${acc.id}` ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>¡Datos Copiados al Portapapeles!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Todo</span>
                          </>
                        )}
                      </button>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Lavender / Blue Info Box */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            {customNote}
          </p>
        </div>

        {/* Large Green WhatsApp Action Button (Exact style from reference screenshot) */}
        <div className="pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-[#10b981] hover:bg-[#059669] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all text-center"
          >
            <Smartphone className="w-5 h-5" />
            <span>Enviar Comprobante por WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default PublicPaymentPortal;
