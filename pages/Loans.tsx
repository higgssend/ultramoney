import React, { useState } from 'react';
import { Search, Plus, Filter, Clock, X, Banknote, Calendar, CreditCard, DollarSign, FileText, Printer, RefreshCw, Calculator, ChevronRight, CheckCircle, Tag, Infinity, ChevronLeft, Shield, LayoutGrid, List, AlertTriangle, Eye } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { toast } from 'sonner';
import { LoanStatus, Loan, formatLoanId } from '../types';
import { useNavigate } from 'react-router-dom';
import { DataExportToolbar } from '../components/DataExportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Loans: React.FC = () => {
  const { loans, companySettings, refinanceLoan, forgiveDebt } = useStore();
  const navigate = useNavigate();
  const [filterTerm, setFilterTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'A tiempo' | 'Atrasado' | 'Vencido' | 'Pagado'>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'amortization' | 'refinance' | 'collateral' | 'forgiveness'>('summary');

  // Refinance State
  const [refinanceAmount, setRefinanceAmount] = useState<number>(0);
  const [refinanceWeeks, setRefinanceWeeks] = useState<number>(12);
  const [refinanceInterest, setRefinanceInterest] = useState<number>(10);

  // Forgiveness State
  const [forgiveAmount, setForgiveAmount] = useState<number>(0);
  const [forgiveNote, setForgiveNote] = useState('');

  const getStatusStyle = (status: string, nextDate: string) => {
      if (status === LoanStatus.OVERDUE) return { badge: 'Vencido', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' };
      if (status === LoanStatus.PAID) return { badge: 'Pagado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' };
      
      const daysDiff = Math.ceil((new Date(nextDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (daysDiff < 0) return { badge: 'Atrasado', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' };
      return { badge: 'A tiempo', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' };
  };

  const filteredLoans = loans.filter(l => {
    const matchesSearch = l.clientName.toLowerCase().includes(filterTerm.toLowerCase()) || l.id.toLowerCase().includes(filterTerm.toLowerCase());
    const statusObj = getStatusStyle(l.status, l.nextPaymentDate);
    const matchesStatus = statusFilter === 'TODOS' || statusObj.badge === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalLentGlobal = loans.reduce((acc, loan) => acc + loan.amount, 0);
  const totalCollectedGlobal = loans.reduce((acc, loan) => acc + (loan.totalToPay - loan.remainingBalance), 0);

  const goToPayment = (loanId: string) => {
      navigate('/pagos', { state: { loanId } });
  };

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

  const handleForgive = () => {
      if(!selectedLoan || forgiveAmount <= 0) return;
      forgiveDebt(selectedLoan.id, forgiveAmount, forgiveNote);
      setForgiveAmount(0);
      setForgiveNote('');
      setSelectedLoan(null);
  };
  
  const generatePDFContract = (loan: Loan) => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Pagare Notarial / Contrato de Prestamo", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Prestamo ID: #${loan.id.substring(0,8)}`, 20, 40);
      doc.text(`Cliente: ${loan.clientName}`, 20, 50);
      doc.text(`Monto Prestado: $${loan.amount.toLocaleString()}`, 20, 60);
      doc.text(`Tasa de Interes: ${loan.interestRate}%`, 20, 70);
      doc.text(`Fecha de Emision: ${loan.startDate}`, 20, 80);
      
      doc.text("DECLARACION LEGAL", 105, 100, { align: "center" });
      doc.setFontSize(10);
      const legalText = `Por medio del presente PAGARE NOTARIAL, yo, ${loan.clientName}, me comprometo a pagar incondicionalmente la suma de $${loan.totalToPay.toLocaleString()} en pagos de $${loan.installmentAmount.toLocaleString()} de manera ${loan.frequency}. En caso de incumplimiento, acepto los cargos por mora estipulados.`;
      doc.text(legalText, 20, 110, { maxWidth: 170 });
      
      // AutoTable
      const tableData = getAmortizationTable(loan).map(row => [
          row.period, row.date, `$${row.principal.toLocaleString()}`, `$${row.interest.toLocaleString()}`, `$${row.amount.toLocaleString()}`, `$${row.balance.toLocaleString()}`
      ]);
      
      autoTable(doc, {
          startY: 140,
          head: [['Cuota', 'Fecha', 'Capital', 'Interes', 'Cuota Total', 'Balance Restante']],
          body: tableData,
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.text("_________________________", 60, finalY + 40, { align: "center" });
      doc.text("Firma del Cliente", 60, finalY + 50, { align: "center" });
      
      doc.text("_________________________", 150, finalY + 40, { align: "center" });
      doc.text("Firma Empresa / Prestamista", 150, finalY + 50, { align: "center" });

      doc.save(`Contrato_${loan.clientName}_${loan.id.substring(0,5)}.pdf`);
  };

    const getAmortizationTable = (loan: Loan) => {
      const isRedito = loan.loanType.includes('Rédito');
      const count = loan.durationWeeks > 0 ? loan.durationWeeks : 12; // Default show 12 periods for Rédito view
      
      // We will delegate to LoanEngine to get the true schedule regardless of the type
      const engineSchedule = LoanEngine.generateAmortizationSchedule(
          loan.amount,
          loan.interestRate,
          count,
          loan.frequency,
          loan.startDate,
          { amortizationMethod: 'Amortizado' },
          loan.loanType
      );

      return engineSchedule.map(s => ({
          period: s.installmentNumber,
          date: s.date,
          principal: s.principal,
          interest: s.interest,
          amount: s.total,
          balance: s.balance
      }));
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
             </button>
             <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Cartera de Préstamos</h2>
                <p className="text-slate-500">Monitoreo y administración avanzada de cartera.</p>
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

      {/* Stats Summary - Advanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Total Prestado Global</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">RD$ {totalLentGlobal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 relative z-10 backdrop-blur-sm"><Banknote className="w-7 h-7"/></div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Retorno Esperado Global</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">RD$ {totalCollectedGlobal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10 backdrop-blur-sm"><CheckCircle className="w-7 h-7"/></div>
          </div>
      </div>

      {/* Advanced Filter & View Toggle Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-0 z-10">
          <div className="relative w-full lg:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    placeholder="Buscar por cliente o ID de préstamo..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900/50 dark:text-white transition-all"
                />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  {['TODOS', 'A tiempo', 'Atrasado', 'Vencido', 'Pagado'].map(status => (
                      <button 
                          key={status}
                          onClick={() => setStatusFilter(status as any)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === status ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                          {status}
                      </button>
                  ))}
              </div>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block mx-2"></div>
              
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Vista de Cuadrícula"
                  >
                      <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Vista de Tabla"
                  >
                      <List className="w-5 h-5" />
                  </button>
              </div>
          </div>
      </div>

      {/* Content Area */}
      {filteredLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No se encontraron préstamos</h3>
              <p className="text-slate-500 text-center max-w-md">No hay préstamos que coincidan con tu búsqueda o con el filtro seleccionado.</p>
          </div>
      ) : viewMode === 'grid' ? (
          /* Grid View - Premium Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredLoans.map((loan) => {
                  const statusInfo = getStatusStyle(loan.status, loan.nextPaymentDate);
                  const isRedito = loan.loanType.includes('Rédito');
                  const installment = isRedito 
                    ? (loan.amount * (loan.interestRate / 100)) 
                    : (loan.totalToPay / loan.durationWeeks);
                  
                  return (
                    <div 
                        key={loan.id} 
                        onClick={() => { setSelectedLoan(loan); setActiveTab('summary'); }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group flex flex-col"
                    >
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold tracking-wider mb-2">
                                        <Tag className="w-3 h-3" /> #{loan.id.substring(0, 8)}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{loan.clientName}</h3>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                                    {statusInfo.badge}
                                </span>
                            </div>
                            
                            <div className="flex gap-2 mb-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 ${isRedito ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {isRedito ? <Infinity className="w-3 h-3" /> : <Calculator className="w-3 h-3" />}
                                    {isRedito ? 'Pagaré Abierto' : 'Amortizado (Cuota Fija)'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-1 rounded border bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {loan.frequency}
                                </span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{isRedito ? 'Interés' : 'Cuota'}</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-lg">RD${installment.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Próx. Pago</p>
                                    <p className={`font-bold text-sm flex items-center gap-1 mt-1 ${statusInfo.badge === 'Vencido' || statusInfo.badge === 'Atrasado' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        <Calendar className="w-4 h-4" />
                                        {loan.nextPaymentDate}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex justify-between items-center">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Monto Original</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm">RD${loan.amount.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">Balance Pendiente</span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">RD${loan.remainingBalance.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                  );
              })}
          </div>
      ) : (
          /* Table View - Advanced Data Table */
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                              <th className="px-6 py-4">ID Préstamo</th>
                              <th className="px-6 py-4">Cliente</th>
                              <th className="px-6 py-4">Tipo & Monto</th>
                              <th className="px-6 py-4 text-center">Cuota</th>
                              <th className="px-6 py-4 text-center">Próximo Pago</th>
                              <th className="px-6 py-4 text-right">Balance</th>
                              <th className="px-6 py-4 text-center">Estado</th>
                              <th className="px-6 py-4 text-center">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {filteredLoans.map((loan) => {
                              const statusInfo = getStatusStyle(loan.status, loan.nextPaymentDate);
                              const isRedito = loan.loanType.includes('Rédito');
                              const installment = isRedito ? (loan.amount * (loan.interestRate / 100)) : (loan.totalToPay / loan.durationWeeks);

                              return (
                                  <tr key={loan.id} onClick={() => { setSelectedLoan(loan); setActiveTab('summary'); }} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group">
                                      <td className="px-6 py-4">
                                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">#{loan.id.substring(0, 8)}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{loan.clientName}</p>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                              <span className="font-bold text-slate-700 dark:text-slate-300">RD${loan.amount.toLocaleString()}</span>
                                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                  {isRedito ? <Infinity className="w-3 h-3"/> : <Calculator className="w-3 h-3"/>}
                                                  {loan.loanType} • {loan.interestRate}%
                                              </span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <p className="font-bold text-slate-700 dark:text-slate-300">RD${installment.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                          <p className="text-[10px] text-slate-500 uppercase">{loan.frequency}</p>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${statusInfo.badge === 'Vencido' || statusInfo.badge === 'Atrasado' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                              <Calendar className="w-3 h-3" />
                                              {loan.nextPaymentDate}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <p className="font-black text-indigo-600 dark:text-indigo-400">RD${loan.remainingBalance.toLocaleString()}</p>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                                              {statusInfo.badge}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); setSelectedLoan(loan); setActiveTab('summary'); }}
                                              className="p-2 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500 transition-all"
                                          >
                                              <Eye className="w-4 h-4" />
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Advanced Loan Detail Modal */}
      {selectedLoan && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                 
                 {/* Modal Header */}
                 <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                     <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30">
                             {selectedLoan.clientName.charAt(0)}
                         </div>
                         <div>
                            <h3 className="font-black text-2xl text-slate-800 dark:text-white leading-none mb-1">{selectedLoan.clientName}</h3>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <span className="uppercase tracking-wide font-mono">ID: {selectedLoan.id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{selectedLoan.frequency}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{selectedLoan.loanType}</span>
                            </div>
                         </div>
                     </div>
                     <button onClick={() => setSelectedLoan(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                 </div>

                 <div className="flex flex-1 overflow-hidden">
                     {/* Sidebar Navigation */}
                     <div className="w-64 bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 flex flex-col p-4 gap-2 overflow-y-auto hidden md:flex">
                        <ModalTab label="Resumen General" icon={FileText} active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
                        <ModalTab label="Tabla Amortización" icon={Banknote} active={activeTab === 'amortization'} onClick={() => setActiveTab('amortization')} />
                        <ModalTab label="Garantías" icon={Shield} active={activeTab === 'collateral'} onClick={() => setActiveTab('collateral')} />
                        <ModalTab label="Condonación" icon={AlertTriangle} active={activeTab === 'forgiveness'} onClick={() => setActiveTab('forgiveness')} />
                        <ModalTab label="Refinanciar" icon={RefreshCw} active={activeTab === 'refinance'} onClick={() => { 
                            setRefinanceAmount(selectedLoan.amount);
                            setActiveTab('refinance'); 
                        }} />
                     </div>

                     {/* Main Content */}
                     <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900">
                         {activeTab === 'summary' && (
                             <div className="space-y-8 animate-fade-in">
                                 {/* Financial Cards */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden">
                                         <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider mb-2">Capital Prestado</p>
                                         <p className="text-4xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">RD${selectedLoan.amount.toLocaleString()}</p>
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16"></div>
                                     </div>
                                     <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                         <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Balance Pendiente</p>
                                            <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-wider">{Math.round(((selectedLoan.totalToPay - selectedLoan.remainingBalance) / selectedLoan.totalToPay) * 100)}% Pagado</p>
                                         </div>
                                         <p className="text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight">RD${selectedLoan.remainingBalance.toLocaleString()}</p>
                                         <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-5 overflow-hidden">
                                             <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${((selectedLoan.totalToPay - selectedLoan.remainingBalance) / selectedLoan.totalToPay) * 100}%` }}></div>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <InfoTile label="Interés" value={`${selectedLoan.interestRate}%`} />
                                     <InfoTile label="Duración" value={`${selectedLoan.loanType === 'Rédito' ? 'Abierta' : selectedLoan.durationWeeks + ' cuotas'}`} />
                                     <InfoTile label="Frecuencia" value={selectedLoan.frequency} />
                                     <InfoTile label="Próximo Pago" value={selectedLoan.nextPaymentDate} highlight={true} />
                                 </div>
                                 
                                 {selectedLoan.collateral && selectedLoan.collateral.type !== 'Sin Garantía' && (
                                     <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-start gap-4">
                                         <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                                            <Shield className="w-5 h-5" />
                                         </div>
                                         <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                                                Garantía: {selectedLoan.collateral.type}
                                            </h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedLoan.collateral.description}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-2">Ref: {selectedLoan.collateral.refNumber}</p>
                                         </div>
                                     </div>
                                 )}

                                 <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4 flex-col md:flex-row">
                                    <button 
                                        onClick={() => goToPayment(selectedLoan.id)}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 text-lg"
                                    >
                                        <DollarSign className="w-6 h-6" /> Registrar Nuevo Pago
                                    </button>
                                    <button 
                                        onClick={() => generatePDFContract(selectedLoan)}
                                        className="md:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-lg"
                                    >
                                        <Printer className="w-6 h-6" /> Pagaré / Contrato
                                    </button>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'amortization' && (
                             <div className="animate-fade-in">
                                 <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-xl">Tabla de Amortización</h4>
                                    <button onClick={() => window.print()} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir Tabla</button>
                                 </div>
                                 <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                                     <table className="w-full text-left text-sm">
                                         <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                             <tr>
                                                 <th className="px-6 py-4"># Cuota</th>
                                                 <th className="px-6 py-4">Fecha Programada</th>
                                                 <th className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">Capital</th>
                                                 <th className="px-6 py-4 text-right text-rose-500 dark:text-rose-400">Interés</th>
                                                 <th className="px-6 py-4 text-right">Cuota Total</th>
                                                 <th className="px-6 py-4 text-right">Balance Restante</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                             {getAmortizationTable(selectedLoan).map((row) => (
                                                 <tr key={row.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                     <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 font-bold">{row.period}</td>
                                                     <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{row.date}</td>
                                                     <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">RD${row.principal.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                                     <td className="px-6 py-4 text-right font-medium text-rose-500 dark:text-rose-400">RD${row.interest.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                                     <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">RD${row.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                                     <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono">RD${row.balance.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                         )}
                         
                         {activeTab === 'refinance' && (
                             <div className="animate-fade-in text-center p-12">
                                 <RefreshCw className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                                 <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Módulo de Refinanciamiento</h4>
                                 <p className="text-slate-500 max-w-md mx-auto">Selecciona esta opción para refinanciar este préstamo, extendiendo el plazo o añadiendo más capital.</p>
                                 <button onClick={handleRefinance} className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Procesar Refinanciamiento</button>
                             </div>
                         )}

                         {activeTab === 'collateral' && (
                             <div className="animate-fade-in p-6 md:p-8">
                                 <div className="flex items-center gap-4 mb-6">
                                     <div className="bg-indigo-50 dark:bg-indigo-900/50 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                         <Shield className="w-6 h-6" />
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-slate-800 dark:text-white text-xl">Bóveda de Garantías</h4>
                                         <p className="text-sm text-slate-500 dark:text-slate-400">Detalles de la garantía asociada a este préstamo.</p>
                                     </div>
                                 </div>
                                 
                                 {selectedLoan.collateral && selectedLoan.collateral.type !== 'Sin Garantía' ? (
                                     <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                                         <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo de Garantía</p>
                                                 <p className="font-bold text-slate-800 dark:text-white text-lg">{selectedLoan.collateral.type}</p>
                                             </div>
                                             <div>
                                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Referencia</p>
                                                 <p className="font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded inline-block border border-slate-200 dark:border-slate-700">{selectedLoan.collateral.refNumber || 'N/A'}</p>
                                             </div>
                                         </div>
                                         <div className="mt-6">
                                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Detallada</p>
                                             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                 <p className="text-slate-700 dark:text-slate-300">{selectedLoan.collateral.description}</p>
                                             </div>
                                         </div>
                                         <div className="mt-6 flex gap-3">
                                              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold uppercase border border-amber-200">En Custodia</span>
                                              <button className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors ml-auto">Actualizar Estado</button>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                                         <Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                         <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Sin Garantía</h4>
                                         <p className="text-sm text-slate-500">Este préstamo fue otorgado sin una garantía asociada.</p>
                                     </div>
                                 )}
                             </div>
                         )}

                         {activeTab === 'forgiveness' && (
                             <div className="animate-fade-in p-6 md:p-8">
                                 <div className="flex items-center gap-4 mb-6">
                                     <div className="bg-rose-50 dark:bg-rose-900/50 p-3 rounded-2xl text-rose-600 dark:text-rose-400">
                                         <AlertTriangle className="w-6 h-6" />
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-slate-800 dark:text-white text-xl">Módulo de Condonación</h4>
                                         <p className="text-sm text-slate-500 dark:text-slate-400">Restar capital o perdonar deudas de manera controlada.</p>
                                     </div>
                                 </div>
                                 <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-lg">
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Monto a Condonar</label>
                                        <input 
                                            type="number" 
                                            value={forgiveAmount}
                                            onChange={(e) => setForgiveAmount(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none" 
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nota / Razón de Condonación</label>
                                        <textarea 
                                            value={forgiveNote}
                                            onChange={(e) => setForgiveNote(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none" 
                                            placeholder="Describa por qué se perdona esta deuda..."
                                        />
                                    </div>
                                    <button 
                                        onClick={handleForgive}
                                        disabled={forgiveAmount <= 0}
                                        className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
                                    >
                                        Ejecutar Condonación
                                    </button>
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
                 
                 {/* Mobile Tab Nav */}
                 <div className="md:hidden flex border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button onClick={() => setActiveTab('summary')} className={`flex-1 py-4 text-center text-[10px] font-bold uppercase tracking-widest ${activeTab === 'summary' ? 'text-indigo-600 border-t-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}>Resumen</button>
                    <button onClick={() => setActiveTab('amortization')} className={`flex-1 py-4 text-center text-[10px] font-bold uppercase tracking-widest ${activeTab === 'amortization' ? 'text-indigo-600 border-t-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}>Tabla</button>
                    <button onClick={() => setActiveTab('collateral')} className={`flex-1 py-4 text-center text-[10px] font-bold uppercase tracking-widest ${activeTab === 'collateral' ? 'text-indigo-600 border-t-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}>Garantías</button>
                    <button onClick={() => setActiveTab('forgiveness')} className={`flex-1 py-4 text-center text-[10px] font-bold uppercase tracking-widest ${activeTab === 'forgiveness' ? 'text-indigo-600 border-t-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}>Condonar</button>
                    <button onClick={() => setActiveTab('refinance')} className={`flex-1 py-4 text-center text-[10px] font-bold uppercase tracking-widest ${activeTab === 'refinance' ? 'text-indigo-600 border-t-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}>Renovar</button>
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};

const ModalTab: React.FC<{ label: string, icon: any, active: boolean, onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`}
    >
        <Icon className="w-5 h-5" /> {label}
    </button>
);

const InfoTile: React.FC<{ label: string, value: string, highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-500/20' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700'}`}>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1.5 tracking-wider">{label}</p>
        <p className={`font-bold text-sm ${highlight ? 'text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5' : 'text-slate-800 dark:text-slate-200'}`}>
            {highlight && <Calendar className="w-4 h-4" />}
            {value}
        </p>
    </div>
);

export default Loans;

import { LoanEngine } from '../utils/LoanEngine';
