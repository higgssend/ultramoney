import React, { useState } from 'react';
import { 
  CheckCircle2, Share2, Copy, Check, ExternalLink, 
  FileText, User, Calendar, DollarSign, Smartphone, MessageCircle, X
} from 'lucide-react';
import { Loan, Client, formatLoanId } from '../types';
import { toast } from 'sonner';
import { WhatsAppIcon } from './WhatsAppIcon';

interface LoanCreatedSharingModalProps {
  loan: Loan;
  client?: Client | null;
  companyName?: string;
  onClose: () => void;
  onNavigateToDetail?: () => void;
}

export const LoanCreatedSharingModal: React.FC<LoanCreatedSharingModalProps> = ({
  loan,
  client,
  companyName = 'UltraMoney',
  onClose,
  onNavigateToDetail
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);

  const contractUrl = `${window.location.origin}/documento/contrato/${loan.id}`;
  const portalUrl = `${window.location.origin}/portal/${loan.clientId}`;

  const clientFirstName = loan.clientName ? loan.clientName.split(' ')[0] : 'Cliente';
  const cedulaStr = client?.cedula ? ` (Cédula: ${client.cedula})` : '';

  const fullMessage = `Hola *${clientFirstName}*,\n\nTu préstamo No. *#${formatLoanId(loan.id)}* por *RD$ ${loan.amount.toLocaleString()}* ha sido procesado exitosamente.\n\n*Resumen de tu Préstamo:*\n• Cliente: ${loan.clientName}${cedulaStr}\n• Monto Desembolsado: RD$ ${loan.amount.toLocaleString()}\n• Tasa de Interés: ${loan.interestRate}%\n• Frecuencia de Pago: ${loan.frequency}\n• Próximo Pago: ${loan.nextPaymentDate || 'Por definir'}\n\n*Enlaces de Acceso:*\n📄 *Tu Contrato Digital*:\n${contractUrl}\n\n🌐 *Tu Portal de Cliente*:\n${portalUrl}\n\nEn tu portal de cliente puedes ver tu estado de cuenta completo, cuotas pagadas, balance restante y descargar tus recibos.\n\nGracias por preferir a *${companyName}*.`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopiedMessage(true);
    toast.success('Mensaje completo copiado al portapapeles');
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractUrl);
    setCopiedContract(true);
    toast.success('Link del contrato copiado al portapapeles');
    setTimeout(() => setCopiedContract(false), 3000);
  };

  const handleCopyPortal = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortal(true);
    toast.success('Link del portal de cliente copiado al portapapeles');
    setTimeout(() => setCopiedPortal(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = client?.phone ? client.phone.replace(/\D/g, '') : '';
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessage)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 animate-scale-in my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">¡Préstamo Registrado con Éxito!</h3>
              <p className="text-xs text-slate-500">Préstamo #{formatLoanId(loan.id)} · {loan.clientName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loan Financial Cards */}
        <div className="my-5 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-extrabold text-[10px] block">Cliente</span>
            <span className="font-black text-slate-800 dark:text-slate-200 text-sm truncate block">{loan.clientName}</span>
            {client?.cedula && <span className="text-[11px] text-slate-500 font-mono">Cédula: {client.cedula}</span>}
          </div>
          <div className="text-right">
            <span className="text-slate-400 uppercase font-extrabold text-[10px] block">Monto Aprobado</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">RD$ {loan.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Links Quick Grid */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 bg-indigo-600 text-white rounded-xl"><FileText className="w-4 h-4" /></div>
              <div className="truncate">
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Enlace del Contrato Digital</p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate">{contractUrl}</p>
              </div>
            </div>
            <button
              onClick={handleCopyContract}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 transition-all shrink-0"
            >
              {copiedContract ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedContract ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 bg-purple-600 text-white rounded-xl"><ExternalLink className="w-4 h-4" /></div>
              <div className="truncate">
                <p className="text-xs font-bold text-purple-950 dark:text-purple-200">Enlace del Portal de Cliente</p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 truncate">{portalUrl}</p>
              </div>
            </div>
            <button
              onClick={handleCopyPortal}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-purple-700 transition-all shrink-0"
            >
              {copiedPortal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPortal ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Mensaje Listo para Enviar al Cliente</label>
            <button
              onClick={handleCopyMessage}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMessage ? 'Mensaje Copiado' : 'Copiar Texto Completo'}
            </button>
          </div>
          <textarea
            readOnly
            value={fullMessage}
            rows={5}
            className="w-full p-3.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 focus:outline-none"
          />
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.01]"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" /> Enviar por WhatsApp al Cliente
          </button>

          {onNavigateToDetail && (
            <button
              onClick={onNavigateToDetail}
              className="w-full sm:w-auto py-3 px-5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all"
            >
              Ver Detalle del Préstamo
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
