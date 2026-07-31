import React, { useState } from 'react';
import { Search, Plus, Filter, Clock, X, Banknote, Calendar, CreditCard, DollarSign, FileText, Printer, RefreshCw, Calculator, ChevronRight, CheckCircle, Tag, Infinity, ChevronLeft, Shield } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { toast } from 'sonner';
import { LoanStatus, Loan, formatLoanId } from '../types';
import { useNavigate } from 'react-router-dom';
import { DataExportToolbar } from '../components/DataExportToolbar';

const Loans: React.FC = () => {
  const { loans, companySettings, refinanceLoan } = useStore();
  const navigate = useNavigate();
  const [filterTerm, setFilterTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'amortization' | 'refinance'>('summary');

  // Refinance State
  const [refinanceAmount, setRefinanceAmount] = useState<number>(0);
  const [refinanceWeeks, setRefinanceWeeks] = useState<number>(12);
  const [refinanceInterest, setRefinanceInterest] = useState<number>(10);

  const filteredLoans = loans.filter(l => 
    l.clientName.toLowerCase().includes(filterTerm.toLowerCase()) || 
    l.id.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const totalLentGlobal = loans.reduce((acc, loan) => acc + loan.amount, 0);
  const totalCollectedGlobal = loans.reduce((acc, loan) => acc + (loan.totalToPay - loan.remainingBalance), 0);

  const getStatusStyle = (status: string, nextDate: string) => {
      if (status === LoanStatus.OVERDUE) return { badge: 'Vencido', color: 'bg-rose-100 text-rose-700 border-rose-200' };
      if (status === LoanStatus.PAID) return { badge: 'Pagado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      
      const daysDiff = Math.ceil((new Date(nextDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (daysDiff < 0) return { badge: 'Atrasado', color: 'bg-amber-100 text-amber-700 border-amber-200' };
      return { badge: 'A tiempo', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  };

  const goToPayment = (loanId: string) => {
      navigate('/pagos', { state: { loanId } });
  };

  // ... (Refinance & Print logic remains same as previous but omitted for brevity if unchanged logic, keeping UI updates) ...
  const handleRefinance = () => {
      if(!selectedLoan) return;
      refinanceLoan(selectedLoan.id, {
          clientId: selectedLoan.clientId,
          clientName: selectedLoan.clientName,
          amount: refinanceAmount,
          interestRate: refinanceInterest,
          durationWeeks: refinanceWeeks,
          frequency: selectedLoan.frequency,
          loanType: selectedLoan.loanType,
          startDate: new Date().toISOString().split('T')[0],
          nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      toast.success(`Préstamo refinanciado con éxito.`);
      setSelectedLoan(null);
  };
  
  const getAmortizationTable = (loan: Loan) => {
      const rows = [];
      const isRedito = loan.loanType === 'Rédito';
      const count = loan.durationWeeks > 0 ? loan.durationWeeks : 12; // Default show 12 periods for Rédito view
      
      // Calculation base
      // For Amortizado: Flat rate logic (Total / Weeks)
      // For Rédito: Interest only installments, Capital at end or tracked separately.
      
      const installmentAmount = isRedito 
        ? (loan.amount * (loan.interestRate / 100)) 
        : (loan.totalToPay / count);

      let currentDate = new Date(loan.startDate);
      let balance = loan.totalToPay; 
      
      for (let i = 1; i <= count; i++) {
          currentDate.setDate(currentDate.getDate() + 7); // Simplified weekly
          if (!isRedito) {
            balance -= installmentAmount;
          }
          
          rows.push({
              period: i,
              date: currentDate.toLocaleDateString(),
              amount: installmentAmount,
              balance: isRedito ? loan.amount : Math.max(0, balance),
              note: isRedito ? (i === count ? 'Interés (Proyección)' : 'Interés') : 'Cuota'
          });
      }
      return rows;
  };


  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
             </button>
             <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Control de Préstamos</h2>
                <p className="text-slate-500">Monitoreo en tiempo real de la cartera.</p>
             </div>
         </div>
         <div className="flex gap-2 items-center">
             <DataExportToolbar 
                data={filteredLoans} 
                title="Cartera de Préstamos"
                filename="prestamos_ultramoney"
                columns={[
                  { header: 'ID', key: 'id' },
                  { header: 'Cliente', key: 'clientName' },
                  { header: 'Monto', key: 'amount', format: (v) => `RD$ ${v?.toLocaleString()}` },
                  { header: 'Interés (%)', key: 'interestRate' },
                  { header: 'Cuotas', key: 'durationWeeks' },
                  { header: 'Frecuencia', key: 'frequency' },
                  { header: 'Balance', key: 'remainingBalance', format: (v) => `RD$ ${v?.toLocaleString()}` },
                  { header: 'Estado', key: 'status' }
                ]} 
             />
             <button 
                 onClick={() => navigate('/solicitud')}
                 className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
             >
                 <Plus className="w-5 h-5" />
                 <span className="font-bold text-sm">Nuevo Préstamo</span>
             </button>
         </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center relative overflow-hidden group">
              <div className="relative z-10">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Prestado</p>
                  <p className="text-2xl font-bold text-slate-800">RD$ {totalLentGlobal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 relative z-10"><Clock className="w-6 h-6"/></div>
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-50 transition-opacity"></div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center relative overflow-hidden group">
              <div className="relative z-10">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Cobrado</p>
                  <p className="text-2xl font-bold text-emerald-600">RD$ {totalCollectedGlobal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 relative z-10"><CheckCircle className="w-6 h-6"/></div>
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-50 transition-opacity"></div>
          </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10">
          <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    placeholder="Buscar préstamo, cliente..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
                />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
               <FilterButton color="bg-emerald-500" />
               <FilterButton color="bg-amber-400" />
               <FilterButton color="bg-rose-500" />
               <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"><Filter className="w-5 h-5" /></button>
          </div>
      </div>

      {/* Loan List - Card Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredLoans.map((loan) => {
              const statusInfo = getStatusStyle(loan.status, loan.nextPaymentDate);
              const isRedito = loan.loanType === 'Rédito';
              const installment = isRedito 
                ? (loan.amount * (loan.interestRate / 100)) 
                : (loan.totalToPay / loan.durationWeeks);
              
              return (
                <div 
                    key={loan.id} 
                    onClick={() => { setSelectedLoan(loan); setActiveTab('summary'); }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/40 transition-all relative overflow-hidden group cursor-pointer transform hover:-translate-y-1"
                >
                    {/* Hover Glow Bar */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                        <div className="flex items-center gap-2">
                             <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">#{loan.id}</span>
                             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{loan.frequency}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                            {statusInfo.badge}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1 truncate pl-2">{loan.clientName}</h3>
                    <div className="pl-2 mb-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex w-fit items-center gap-1 ${isRedito ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {isRedito && <Infinity className="w-3 h-3" />}
                            {loan.loanType === 'Rédito' ? 'Pagaré Abierto' : 'Amortizado'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 my-5 pl-2">
                         <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-slate-400 text-xs font-bold uppercase mb-1">{isRedito ? 'Interés' : 'Cuota'}</p>
                             <p className="font-bold text-slate-700">RD${installment.toFixed(0)}</p>
                         </div>
                         <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-slate-400 text-xs font-bold uppercase mb-1">Próx. Pago</p>
                             <p className="font-bold text-slate-700">{loan.nextPaymentDate}</p>
                         </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-between items-end pl-2">
                        <div className="text-xs">
                            <span className="text-slate-400 font-bold block mb-1">CAPITAL</span>
                            <span className="font-bold text-slate-600 text-sm">RD${loan.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                             <span className="text-xs text-slate-400 font-bold block mb-1">RESTANTE</span>
                             <span className="font-bold text-indigo-600 text-xl">RD${loan.remainingBalance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
              );
          })}
      </div>

      {/* Advanced Loan Detail Modal */}
      {selectedLoan && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
                 
                 {/* Modal Header */}
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                     <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
                             {selectedLoan.clientName.charAt(0)}
                         </div>
                         <div>
                            <h3 className="font-bold text-xl text-slate-800">{selectedLoan.clientName}</h3>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                Préstamo #{formatLoanId(selectedLoan.id, selectedLoan.loanCategory, selectedLoan.loanType)} • {selectedLoan.frequency}
                                <span className="ml-2 bg-slate-100 px-2 py-0.5 rounded text-slate-600">{selectedLoan.loanType}</span>
                            </p>
                         </div>
                     </div>
                     <button onClick={() => setSelectedLoan(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                 </div>

                 <div className="flex flex-1 overflow-hidden">
                     {/* Sidebar Navigation */}
                     <div className="w-56 bg-slate-50 border-r border-slate-100 flex flex-col p-4 gap-2 overflow-y-auto hidden md:flex">
                        <ModalTab label="Resumen General" icon={FileText} active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
                        <ModalTab label="Tabla Amortización" icon={Banknote} active={activeTab === 'amortization'} onClick={() => setActiveTab('amortization')} />
                        <ModalTab label="Refinanciar" icon={RefreshCw} active={activeTab === 'refinance'} onClick={() => { 
                            setRefinanceAmount(selectedLoan.amount);
                            setActiveTab('refinance'); 
                        }} />
                     </div>

                     {/* Main Content */}
                     <div className="flex-1 overflow-y-auto p-8 bg-white">
                         {activeTab === 'summary' && (
                             <div className="space-y-8 animate-fade-in">
                                 {/* Financial Cards */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 relative overflow-hidden">
                                         <p className="text-xs text-indigo-500 font-bold uppercase mb-2">Capital Prestado</p>
                                         <p className="text-4xl font-bold text-indigo-900 tracking-tight">${selectedLoan.amount.toLocaleString()}</p>
                                         <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200 rounded-full -mr-12 -mt-12 opacity-30"></div>
                                     </div>
                                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                         <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs text-slate-500 font-bold uppercase">Balance Pendiente</p>
                                            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{Math.round(((selectedLoan.totalToPay - selectedLoan.remainingBalance) / selectedLoan.totalToPay) * 100)}% Pagado</p>
                                         </div>
                                         <p className="text-4xl font-bold text-rose-600 tracking-tight">${selectedLoan.remainingBalance.toLocaleString()}</p>
                                         <div className="w-full bg-slate-100 h-2 rounded-full mt-4">
                                             <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full" style={{ width: `${((selectedLoan.totalToPay - selectedLoan.remainingBalance) / selectedLoan.totalToPay) * 100}%` }}></div>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <InfoTile label="Interés" value={`${selectedLoan.interestRate}%`} />
                                     <InfoTile label="Duración" value={`${selectedLoan.loanType === 'Rédito' ? 'Abierta' : selectedLoan.durationWeeks + ' cuotas'}`} />
                                     <InfoTile label="Frecuencia" value={selectedLoan.frequency} />
                                     <InfoTile label="Próximo Pago" value={selectedLoan.nextPaymentDate} />
                                 </div>
                                 
                                 {selectedLoan.collateral && selectedLoan.collateral.type !== 'Sin Garantía' && (
                                     <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                         <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                             <Shield className="w-4 h-4 text-indigo-500" />
                                             Garantía: {selectedLoan.collateral.type}
                                         </h4>
                                         <p className="text-sm text-slate-600">{selectedLoan.collateral.description}</p>
                                         <p className="text-xs text-slate-400 font-mono mt-1">{selectedLoan.collateral.refNumber}</p>
                                     </div>
                                 )}

                                 <div className="pt-6 border-t border-slate-100 flex gap-4">
                                    <button 
                                        onClick={() => goToPayment(selectedLoan.id)}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5"
                                    >
                                        <DollarSign className="w-5 h-5" /> Registrar Pago
                                    </button>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'amortization' && (
                             <div className="animate-fade-in">
                                 <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-800 text-lg">Tabla de Amortización</h4>
                                    <button onClick={() => window.print()} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"><Printer className="w-4 h-4 inline mr-2"/>Imprimir</button>
                                 </div>
                                 <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                     <table className="w-full text-left text-sm">
                                         <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                             <tr>
                                                 <th className="px-6 py-4 font-semibold">#</th>
                                                 <th className="px-6 py-4 font-semibold">Fecha</th>
                                                 <th className="px-6 py-4 font-semibold text-right">Cuota</th>
                                                 <th className="px-6 py-4 font-semibold text-right">Balance</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100">
                                             {getAmortizationTable(selectedLoan).map((row) => (
                                                 <tr key={row.period} className="hover:bg-slate-50">
                                                     <td className="px-6 py-4 font-mono text-slate-500 font-bold">{row.period}</td>
                                                     <td className="px-6 py-4 text-slate-700">{row.date}</td>
                                                     <td className="px-6 py-4 text-right font-bold text-slate-800">${row.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                                     <td className="px-6 py-4 text-right text-slate-500 font-mono">${row.balance.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
                 
                 {/* Mobile Tab Nav */}
                 <div className="md:hidden flex border-t border-slate-200">
                    <button onClick={() => setActiveTab('summary')} className={`flex-1 p-4 text-center text-xs font-bold uppercase tracking-wider ${activeTab === 'summary' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>Resumen</button>
                    <button onClick={() => setActiveTab('amortization')} className={`flex-1 p-4 text-center text-xs font-bold uppercase tracking-wider ${activeTab === 'amortization' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>Tabla</button>
                    <button onClick={() => setActiveTab('refinance')} className={`flex-1 p-4 text-center text-xs font-bold uppercase tracking-wider ${activeTab === 'refinance' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>Refinanciar</button>
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};

const FilterButton: React.FC<{color: string}> = ({color}) => (
    <button className={`w-10 h-10 rounded-xl ${color} shadow-sm border-2 border-white ring-1 ring-slate-100 hover:scale-110 transition-transform`}></button>
);

const ModalTab: React.FC<{ label: string, icon: any, active: boolean, onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
    >
        <Icon className="w-4 h-4" /> {label}
    </button>
);

const InfoTile: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">{label}</p>
        <p className="font-bold text-slate-800 text-sm">{value}</p>
    </div>
);

export default Loans;
