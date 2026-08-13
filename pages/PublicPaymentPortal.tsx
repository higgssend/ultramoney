import React, { useState } from 'react';
import { 
  Landmark, Copy, Check, ExternalLink, Smartphone, 
  ChevronDown, ChevronUp, ShieldCheck, Sparkles, Building2, HelpCircle
} from 'lucide-react';
import { BankAccount, PaymentLinkConfig } from '../types';
import { getBankLogoUrl } from '../utils/bankLogos';
import { useSettings, useAccounting } from '../context/StoreContext';
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
  const { companySettings } = useSettings();
  const { bankAccounts } = useAccounting();

  // Accordion open/close state per bank account
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Configuration values (from preview props or store)
  const title = previewConfig?.title || 'Portal de Pagos & Transferencias Bancarias';
  const instructions = previewConfig?.instructions || 'Selecciona el banco de tu preferencia para ver los datos completos. Copia los números directamente y envía tu comprobante de pago por WhatsApp.';
  const whatsappPhone = previewConfig?.whatsappPhone || companySettings?.phone || '';
  const showLogo = previewConfig?.showCompanyLogo ?? true;
  const showRnc = previewConfig?.showCompanyRnc ?? true;
  const customNote = previewConfig?.customNote || 'Por favor indica tu nombre o cédula en el concepto de la transferencia.';

  // Determine active accounts to render
  const allAccounts = isLivePreview ? (previewAccounts || []) : bankAccounts;
  
  // Filter accounts selected for payment link
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

  const cleanWhatsappPhone = whatsappPhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappPhone}?text=${encodeURIComponent('Hola, adjunto comprobante de pago realizado por transferencia bancaria.')}`;

  return (
    <div className={`w-full min-h-screen ${isLivePreview ? 'bg-slate-900/5 p-4 rounded-3xl' : 'bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6'}`}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Company Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          
          <div className="flex flex-col items-center justify-center space-y-3">
            {showLogo && companySettings?.logoUrl ? (
              <img 
                src={companySettings.logoUrl} 
                alt={companySettings.name} 
                className="w-20 h-20 object-contain rounded-2xl p-1 bg-white shadow-md border border-slate-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Building2 className="w-9 h-9" />
              </div>
            )}

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {companySettings?.name || 'UltraMoney Pagos'}
              </h1>
              {showRnc && companySettings?.rnc && (
                <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  RNC: {companySettings.rnc}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Portal Verificado de Cuentas Oficiales</span>
            </div>
          </div>
        </div>

        {/* Portal Title & Instructions */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-950 text-white rounded-3xl p-6 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Transferencias Directas</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed opacity-90">{instructions}</p>
        </div>

        {/* Bank Cards Container */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Cuentas Bancarias Disponibles ({accountsToDisplay.length})
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Toca un banco para abrir detalles</span>
          </div>

          {accountsToDisplay.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center text-slate-400 border border-slate-100 dark:border-slate-800">
              <Landmark className="w-12 h-12 mx-auto mb-2 opacity-50 text-slate-400" />
              <p className="text-sm font-bold">No hay cuentas bancarias seleccionadas en este momento.</p>
            </div>
          ) : (
            accountsToDisplay.map((acc) => {
              const isOpen = openAccountId === acc.id;
              const logoPath = acc.bankLogoUrl || getBankLogoUrl(acc.bankName);
              const holder = acc.holderName || acc.accountName || companySettings?.name || 'Titular de Cuenta';
              const cedulaRnc = acc.cedulaOrRnc || companySettings?.rnc || 'N/A';

              return (
                <div 
                  key={acc.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' 
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  {/* Bank Tile Header (Click to toggle Accordion) */}
                  <button
                    onClick={() => handleToggleAccordion(acc.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none select-none group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Bank Logo */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <img 
                          src={logoPath} 
                          alt={acc.bankName} 
                          className="max-w-full max-h-full object-contain rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/banks/Bancos_Banreservas.jpg';
                          }}
                        />
                      </div>

                      {/* Bank Name & Number Preview */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                            {acc.bankName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                            {acc.accountType || 'Ahorros'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">
                          Nº {acc.accountNumber}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                          {holder}
                        </p>
                      </div>
                    </div>

                    {/* Accordion Arrow Indicator */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      isOpen 
                        ? 'bg-indigo-600 text-white rotate-180 shadow-md shadow-indigo-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}>
                      <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                    </div>
                  </button>

                  {/* Accordion Expandable Details */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 space-y-3 animate-fade-in">
                      
                      {/* Account Number Row */}
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Número de Cuenta ({acc.accountType})
                          </span>
                          <span className="text-base sm:text-lg font-black font-mono text-indigo-700 dark:text-indigo-400 tracking-tight break-all">
                            {acc.accountNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(acc.accountNumber, 'Número de cuenta')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all shrink-0"
                        >
                          {copiedField === `Número de cuenta-${acc.accountNumber}` ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-300" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Holder Name Row */}
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Nombre del Titular
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                            {holder}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(holder, 'Nombre del titular')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                        >
                          {copiedField === `Nombre del titular-${holder}` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                          <span>Copiar</span>
                        </button>
                      </div>

                      {/* Cedula / RNC Row */}
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Cédula / RNC del Titular
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 truncate block">
                            {cedulaRnc}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(cedulaRnc, 'Cédula / RNC')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                        >
                          {copiedField === `Cédula / RNC-${cedulaRnc}` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                          <span>Copiar</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Note / Terms Box */}
        {customNote && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              {customNote}
            </p>
          </div>
        )}

        {/* WhatsApp Receipt Submission Action */}
        {whatsappPhone && (
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 transition-all text-center"
            >
              <Smartphone className="w-5 h-5" />
              <span>Enviar Comprobante por WhatsApp</span>
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} {companySettings?.name || 'UltraMoney'}. Sistema Seguro de Gestión Bancaria.</p>
        </div>

      </div>
    </div>
  );
};

export default PublicPaymentPortal;
