
import React, { useState } from 'react';
import { Phone, AlertTriangle, Clock, ChevronLeft, FileText, Send, Users, ShieldAlert, Scale, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans, useSettings } from '../context/StoreContext';
import { DocumentGenerator } from '../components/DocumentGenerator';
import { Client, Loan, formatLoanId, Guarantor } from '../types';

import { WhatsAppIcon } from '../components/WhatsAppIcon';

const Overdue: React.FC = () => {
  const navigate = useNavigate();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { companySettings } = useSettings();
  const [selectedNoticeLoan, setSelectedNoticeLoan] = useState<{ loan: Loan; client: Client } | null>(null);

  const overdueList = loans.filter(l => l.status === 'Atrasado' || (l.status === 'Activo' && new Date(l.nextPaymentDate) < new Date()));
  const totalOverdueAmount = overdueList.reduce((sum, l) => sum + l.remainingBalance, 0);

  const handleWhatsAppNotice = (loan: Loan) => {
    const client = clients.find(c => c.id === loan.clientId);
    const clientFullName = client ? `${client.name} ${client.lastName || ''}`.trim() : loan.clientName;
    const phone = client?.whatsapp || client?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola *${clientFullName}*, le saludamos de *${companySettings.name || 'UltraMoney'}*. Le recordamos que su cuota del préstamo #${formatLoanId(loan.id)} por valor de *RD$ ${loan.remainingBalance.toLocaleString()}* presenta atrasos. Por favor contactarnos a la brevedad para coordinar su regularización. ¡Gracias!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWhatsAppGuarantorNotice = (loan: Loan, guarantorName: string, guarantorPhone: string) => {
    const client = clients.find(c => c.id === loan.clientId);
    const clientFullName = client ? `${client.name} ${client.lastName || ''}`.trim() : loan.clientName;
    const cleanPhone = guarantorPhone.replace(/\D/g, '');
    const message = `Estimado/a *${guarantorName}*,\n\nLe saludamos de *${companySettings.name || 'UltraMoney'}* en relación al crédito solidario de *${clientFullName}* (Préstamo #${formatLoanId(loan.id)}).\n\nLe notificamos que dicho préstamo presenta atrasos en sus pagos con un balance vencido de *RD$ ${loan.remainingBalance.toLocaleString()}*.\n\nEn virtud de su condición de *GARANTE SOLIDARIO Y MANCOMUNADO*, le solicitamos comunicarse con nosotros para coordinar la regularización de la cuenta.\n\nGracias por su pronta atención.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Atrasos y Cobranza</h2>
                <p className="text-slate-500 dark:text-slate-400">Gestión de cuotas vencidas y avisos de cobro por WhatsApp a deudores y garantes.</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/legal')}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 shadow-xs transition-all"
          >
            <Scale className="w-4 h-4" /> Expedientes Cobranza Legal
          </button>
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-5 py-3 rounded-2xl font-bold flex items-center gap-3 border border-rose-100 dark:border-rose-900/60 shadow-sm">
              <div className="p-1 bg-rose-200 dark:bg-rose-900/80 rounded-full"><AlertTriangle className="w-5 h-5 text-rose-700 dark:text-rose-300" /></div>
              Total Mora: RD$ {totalOverdueAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {overdueList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl text-center border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">¡Excelente! No hay préstamos atrasados</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">Toda la cartera de cobros se encuentra al día.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {overdueList.map((loan) => {
              const client = clients.find(c => c.id === loan.clientId);
              const clientFullName = client ? `${client.name} ${client.lastName || ''}`.trim() : loan.clientName;
              const daysLate = Math.max(1, Math.floor((new Date().getTime() - new Date(loan.nextPaymentDate).getTime()) / (1000 * 3600 * 24)));

              // Resolve guarantors
              const guarantorsList: Guarantor[] = (loan.guarantors && loan.guarantors.length > 0)
                ? loan.guarantors
                : (loan.collateral && typeof loan.collateral === 'object' && Array.isArray((loan.collateral as unknown as Record<string, unknown>).guarantors))
                  ? ((loan.collateral as unknown as Record<string, unknown>).guarantors as Guarantor[])
                  : (client?.guarantorName)
                    ? [{
                        id: 'legacy-1',
                        name: client.guarantorName,
                        cedula: client.guarantorCedula || 'N/A',
                        phone: client.guarantorPhone || '',
                        relationship: 'Garante Principal'
                      }]
                    : [];

              const primaryGuarantor = guarantorsList[0];

              return (
                <div key={loan.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-none transition-all hover:-translate-y-1 space-y-4">
                    <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 transition-transform group-hover:scale-150 ${daysLate > 15 ? 'bg-rose-600' : 'bg-amber-500'}`}></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{clientFullName}</h3>
                            <p className="text-xs text-slate-400 font-mono">Préstamo #{formatLoanId(loan.id, loan.loanCategory, loan.loanType)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${daysLate > 15 ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/60' : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/60'}`}>
                            {daysLate} días de mora
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="font-bold text-2xl text-slate-800 dark:text-white block leading-none">RD$ {loan.remainingBalance.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Saldo Pendiente ({loan.frequency})</span>
                        </div>
                    </div>

                    {/* Guarantor Solidary Banner if present */}
                    {primaryGuarantor && (
                      <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold block uppercase">Garante Solidario</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{primaryGuarantor.name}</span>
                          </div>
                        </div>

                        {primaryGuarantor.phone && (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppGuarantorNotice(loan, primaryGuarantor.name, primaryGuarantor.phone)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 shrink-0 shadow-sm transition-colors cursor-pointer"
                            title="Enviar aviso de mora al Garante Solidario"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Aviso Garante</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button 
                            onClick={() => handleWhatsAppNotice(loan)}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20b85c] transition-colors shadow-md shadow-emerald-100 dark:shadow-none cursor-pointer"
                        >
                            <WhatsAppIcon /> Aviso Deudor
                        </button>
                        <button 
                            onClick={() => client && setSelectedNoticeLoan({ loan, client })}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-md cursor-pointer"
                        >
                            <FileText className="w-4 h-4" /> Carta Cobro
                        </button>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => navigate('/legal')}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] rounded-xl border border-rose-200 dark:border-rose-900/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" /> Pasar a Cobranza Legal / Cobro Compulsivo
                      </button>
                    </div>
                </div>
              );
          })}
        </div>
      )}

      {/* Document Generator for Overdue Notice */}
      {selectedNoticeLoan && (
        <DocumentGenerator
          loan={selectedNoticeLoan.loan}
          client={selectedNoticeLoan.client}
          company={companySettings}
          isOpen={!!selectedNoticeLoan}
          onClose={() => setSelectedNoticeLoan(null)}
          defaultDocType="carta_cobro"
        />
      )}
    </div>
  );
};

export default Overdue;
