
import React, { useState } from 'react';
import { Phone, AlertTriangle, Clock, ChevronLeft, FileText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { DocumentGenerator } from '../components/DocumentGenerator';
import { Client, Loan } from '../types';

// WhatsApp Official Icon SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Overdue: React.FC = () => {
  const navigate = useNavigate();
  const { loans, clients, companySettings } = useStore();
  const [selectedNoticeLoan, setSelectedNoticeLoan] = useState<{ loan: Loan; client: Client } | null>(null);

  const overdueList = loans.filter(l => l.status === 'Atrasado' || (l.status === 'Activo' && new Date(l.nextPaymentDate) < new Date()));
  const totalOverdueAmount = overdueList.reduce((sum, l) => sum + l.remainingBalance, 0);

  const handleWhatsAppNotice = (loan: Loan) => {
    const client = clients.find(c => c.id === loan.clientId);
    const phone = client?.whatsapp || client?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola ${loan.clientName}, le saludamos de *${companySettings.name}*. Le recordamos que su cuota del préstamo #${loan.id} por valor de RD$ ${loan.remainingBalance.toLocaleString()} se encuentra pendiente. Por favor ponerse en contacto para regularizar su pago. ¡Gracias!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Atrasos y Cobranza</h2>
                <p className="text-slate-500">Gestión de cuotas vencidas y avisos de cobro por WhatsApp.</p>
            </div>
        </div>
        <div className="bg-rose-50 text-rose-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-3 border border-rose-100 shadow-sm">
            <div className="p-1 bg-rose-200 rounded-full"><AlertTriangle className="w-5 h-5 text-rose-700" /></div>
            Total Mora: RD$ {totalOverdueAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {overdueList.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">¡Excelente! No hay préstamos atrasados</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">Toda la cartera de cobros se encuentra al día.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {overdueList.map((loan) => {
              const client = clients.find(c => c.id === loan.clientId);
              const daysLate = Math.max(1, Math.floor((new Date().getTime() - new Date(loan.nextPaymentDate).getTime()) / (1000 * 3600 * 24)));

              return (
                <div key={loan.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-rose-100/50 transition-all hover:-translate-y-1">
                    <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 transition-transform group-hover:scale-150 ${daysLate > 15 ? 'bg-rose-600' : 'bg-amber-500'}`}></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{loan.clientName}</h3>
                            <p className="text-sm text-slate-400 font-mono">Préstamo #{loan.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${daysLate > 15 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {daysLate} días de mora
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="font-bold text-2xl text-slate-800 block leading-none">RD$ {loan.remainingBalance.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Saldo Pendiente ({loan.frequency})</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handleWhatsAppNotice(loan)}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20b85c] transition-colors shadow-md shadow-emerald-100"
                        >
                            <WhatsAppIcon /> Aviso WhatsApp
                        </button>
                        <button 
                            onClick={() => client && setSelectedNoticeLoan({ loan, client })}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-md"
                        >
                            <FileText className="w-4 h-4" /> Carta Cobro
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
