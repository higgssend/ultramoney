import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, ChevronLeft, User, CreditCard, Calendar, Briefcase, 
  FileText, ShieldCheck, ShieldAlert, Award, TrendingUp, DollarSign, 
  CheckCircle2, AlertTriangle, Phone, MapPin, Building2,
  ArrowRight, Activity, Clock, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans } from '../context/StoreContext';
import { Client, LoanStatus } from '../types';

export const CreditInquiry: React.FC = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { loans } = useLoans();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter clients by term (name, cedula, phone)
  const filteredClients = searchTerm.trim() === '' ? [] : clients.filter(c => {
    const term = searchTerm.toLowerCase().replace(/-/g, '');
    const fullName = `${c.name} ${c.lastName || ''}`.toLowerCase();
    const cedulaClean = (c.cedula || '').replace(/-/g, '');
    const phoneClean = (c.phone || '').replace(/-/g, '');
    return fullName.includes(term) || cedulaClean.includes(term) || phoneClean.includes(term);
  });

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm(`${client.name} ${client.lastName || ''} - ${client.cedula}`);
    setIsDropdownOpen(false);
    setHasSearched(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Search exact or first match
    const term = searchTerm.toLowerCase().replace(/-/g, '');
    const found = clients.find(c => {
      const fullName = `${c.name} ${c.lastName || ''}`.toLowerCase();
      const cedulaClean = (c.cedula || '').replace(/-/g, '');
      return cedulaClean === term || fullName.includes(term) || c.id === searchTerm;
    });

    if (found) {
      setSelectedClient(found);
    } else {
      setSelectedClient(null);
    }
    setIsDropdownOpen(false);
    setHasSearched(true);
  };

  // Calculate Credit Analytics & Datacrédito Score for selected client
  const getClientAnalytics = (client: Client) => {
    const clientLoans = loans.filter(l => l.clientId === client.id);
    const activeLoans = clientLoans.filter(l => l.status === LoanStatus.ACTIVE || l.status === 'Activo' || l.status === LoanStatus.OVERDUE || l.status === 'Atrasado');
    const paidLoans = clientLoans.filter(l => l.status === LoanStatus.PAID || l.status === 'Saldado' || l.status === 'Pagado');
    const overdueLoans = clientLoans.filter(l => l.status === LoanStatus.OVERDUE || l.status === 'Atrasado' || l.status === 'Vencido');

    const totalBorrowed = clientLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const totalOwed = activeLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);

    // Dynamic Score Calculation (300 to 850)
    let score = 650;
    
    // Bonus for paid loans (+25 each, up to 100)
    score += Math.min(paidLoans.length * 25, 100);

    // Bonus for active clean loans (+30)
    if (activeLoans.length > 0 && overdueLoans.length === 0) {
      score += 30;
    }

    // Penalty for overdue loans (-60 each)
    score -= overdueLoans.length * 60;

    // Income to debt evaluation
    const monthlyIncome = Number(client.income) || 0;
    if (monthlyIncome > 0 && totalOwed > monthlyIncome * 4) {
      score -= 40; // Over-leveraged
    } else if (monthlyIncome >= 40000) {
      score += 20; // High income
    }

    // Clamp score between 300 and 850
    score = Math.max(300, Math.min(850, score));

    // Determine Risk Level & Badge
    let riskLevel: 'Excelente' | 'Bueno' | 'Regular' | 'Alto Riesgo';
    let riskColor: string;
    let riskBg: string;
    let recommendation: string;

    if (score >= 750) {
      riskLevel = 'Excelente';
      riskColor = 'text-emerald-600 dark:text-emerald-400';
      riskBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      recommendation = 'Cliente AAA - Aprobación prioritaria para cualquier línea de crédito.';
    } else if (score >= 650) {
      riskLevel = 'Bueno';
      riskColor = 'text-indigo-600 dark:text-indigo-400';
      riskBg = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800';
      recommendation = 'Perfil Confiable - Aprobado según capacidad de pago mensual.';
    } else if (score >= 550) {
      riskLevel = 'Regular';
      riskColor = 'text-amber-600 dark:text-amber-400';
      riskBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      recommendation = 'Aprobación Condicionada - Se recomienda solicitar garante o garantía colateral.';
    } else {
      riskLevel = 'Alto Riesgo';
      riskColor = 'text-rose-600 dark:text-rose-400';
      riskBg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
      recommendation = 'Riesgo Elevado - Cliente posee atrasos o sobre-endeudamiento. Requiere autorización gerencial.';
    }

    const scorePercentage = Math.round(((score - 300) / (850 - 300)) * 100);

    return {
      clientLoans,
      activeLoansCount: activeLoans.length,
      paidLoansCount: paidLoans.length,
      overdueLoansCount: overdueLoans.length,
      totalBorrowed,
      totalOwed,
      score,
      scorePercentage,
      riskLevel,
      riskColor,
      riskBg,
      recommendation
    };
  };

  const analytics = selectedClient ? getClientAnalytics(selectedClient) : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-secondary text-slate-900 dark:text-white">
              Datapréstamos & Score Crediticio
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Consulta de score interno y Red de Buró Compartido entre prestamistas.</p>
          </div>
        </div>
      </div>

      {/* Live Search Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-20">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Buscar Cliente por Nombre, Cédula o Teléfono
        </label>
        
        <form onSubmit={handleFormSubmit} className="relative" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-indigo-500 w-5 h-5" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Escriba el nombre, apellido, cédula o teléfono..." 
              className="w-full pl-12 pr-28 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
            />
            <button 
              type="submit" 
              className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              Consultar
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchTerm.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto z-50 p-2 animate-in fade-in slide-in-from-top-2">
              {filteredClients.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No se encontraron clientes coincidentes con "{searchTerm}"
                </div>
              ) : (
                filteredClients.map((client) => {
                  const clientLoans = loans.filter(l => l.clientId === client.id);
                  const hasOverdue = clientLoans.some(l => l.status === LoanStatus.OVERDUE || l.status === 'Atrasado');
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full p-3 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-between group border-b border-slate-100 dark:border-slate-800 last:border-0 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {client.name.charAt(0)}{client.lastName ? client.lastName.charAt(0) : ''}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {client.name} {client.lastName}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            Cédula: {client.cedula} • Tel: {client.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasOverdue ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                            En Mora
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            Al Día ({clientLoans.length})
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </form>

        {/* Quick selection chips for fast testing */}
        {clients.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">Acceso rápido:</span>
            {clients.slice(0, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectClient(c)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  selectedClient?.id === c.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {c.name} {c.lastName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {selectedClient && analytics && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Profile & Score Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Client Summary */}
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-indigo-400/30">
                  {selectedClient.name.charAt(0)}{selectedClient.lastName ? selectedClient.lastName.charAt(0) : ''}
                </div>
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h2 className="text-2xl font-bold uppercase">{selectedClient.name} {selectedClient.lastName}</h2>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Cédula: <span className="font-mono font-bold text-white">{selectedClient.cedula}</span> • Ocupación: <span className="text-white font-semibold">{selectedClient.occupation || 'N/A'}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                    <Phone className="w-3.5 h-3.5" /> {selectedClient.phone || 'N/A'}
                    <MapPin className="w-3.5 h-3.5 ml-2" /> {selectedClient.address || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Score Gauge Badge */}
              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[200px]">
                <span className="text-xs uppercase font-bold tracking-widest text-indigo-300">Score Interno Datacrédito</span>
                <div className="text-4xl font-black text-white my-1 tracking-tight flex items-baseline gap-1">
                  <span>{analytics.score}</span>
                  <span className="text-sm font-normal text-slate-400">/ 850</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${analytics.riskBg} ${analytics.riskColor} border`}>
                  {analytics.riskLevel}
                </div>
              </div>

            </div>

            {/* Score Progress Bar & Recommendation */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>Riesgo Crítico (300)</span>
                <span>Regular (600)</span>
                <span>Bueno (700)</span>
                <span>Excelente (850)</span>
              </div>
              
              {/* Meter Bar */}
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    analytics.score >= 750 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    analytics.score >= 650 ? 'bg-gradient-to-r from-indigo-500 to-blue-400' :
                    analytics.score >= 550 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    'bg-gradient-to-r from-rose-600 to-red-400'
                  }`}
                  style={{ width: `${analytics.scorePercentage}%` }}
                ></div>
              </div>

              {/* Recommendation Note */}
              <div className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 ${analytics.riskBg}`}>
                <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${analytics.riskColor}`} />
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${analytics.riskColor}`}>Dictamen & Recomendación del Sistema</h4>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{analytics.recommendation}</p>
                </div>
              </div>
            </div>

            {/* Financial Metrics Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> Capital Prestado Total
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">RD$ {analytics.totalBorrowed.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Histórico contratado</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                  <Briefcase className="w-4 h-4 text-amber-500" /> Balance Adeudado Actual
                </div>
                <p className={`text-xl font-bold ${analytics.totalOwed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  RD$ {analytics.totalOwed.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">Capital vigente pendiente</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Ingreso Declarado
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  RD$ {(Number(selectedClient.income) || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">Mensual declarado</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                  <Activity className="w-4 h-4 text-blue-500" /> Estado de Operaciones
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {analytics.activeLoansCount} Activos / {analytics.paidLoansCount} Saldados
                </p>
                {analytics.overdueLoansCount > 0 && (
                  <p className="text-xs font-bold text-rose-500 mt-1">{analytics.overdueLoansCount} Préstamo(s) en mora</p>
                )}
              </div>

            </div>

          </div>

          {/* Client Loan History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Histórico de Préstamos del Cliente
            </h3>

            {analytics.clientLoans.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                El cliente no posee préstamos registrados previamente en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                      <th className="py-3 px-4">Monto</th>
                      <th className="py-3 px-4">Balance Restante</th>
                      <th className="py-3 px-4">Modalidad / Frecuencia</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {analytics.clientLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          RD$ {(Number(loan.amount) || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          RD$ {(Number(loan.remainingBalance) || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {loan.loanType || 'Amortizado'} ({loan.frequency})
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            loan.status === LoanStatus.PAID || loan.status === 'Saldado' || loan.status === 'Pagado'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : loan.status === LoanStatus.OVERDUE || loan.status === 'Atrasado'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => navigate(`/prestamos/${loan.id}`)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 ml-auto"
                          >
                            Ver detalle <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Search Not Found State */}
      {hasSearched && !selectedClient && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center animate-fade-in mt-6">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No se encontraron resultados</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            No se encontró ningún cliente registrado con el nombre o cédula ingresada. Verifique los datos o registre un nuevo cliente en el módulo de Clientes.
          </p>
        </div>
      )}

    </div>
  );
};

export default CreditInquiry;