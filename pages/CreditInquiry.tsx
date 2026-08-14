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
import { CreditScoreGauge } from '../components/CreditScoreGauge';
import { CreditScoreEngine, CreditScoreResult } from '../utils/CreditScoreEngine';

export const CreditInquiry: React.FC = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { loans } = useLoans();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchContainerRef = useRef<HTMLFormElement>(null);

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

  const analytics = selectedClient ? CreditScoreEngine.calculateScore(selectedClient, loans) : null;
  const clientLoans = selectedClient ? loans.filter(l => l.clientId === selectedClient.id) : [];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      
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
                  const hasOverdue = clientLoans.some(l => l.status === LoanStatus.OVERDUE || (l.status as string) === 'Atrasado');
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            
            {/* Banking Header & Gauge Container (Light Theme) */}
            <div className="p-6 lg:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Client Summary (Left Column - 7 Cols) */}
              <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    {selectedClient.name.charAt(0)}{selectedClient.lastName ? selectedClient.lastName.charAt(0) : ''}
                  </div>
                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 inline-block">
                      Reporte de Buró de Crédito
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                      {selectedClient.name} {selectedClient.lastName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cédula / RNC: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedClient.cedula}</span> • Ocupación: <span className="text-slate-700 dark:text-slate-300 font-semibold">{selectedClient.occupation || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {selectedClient.phone || 'N/A'}</span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60"><MapPin className="w-3.5 h-3.5 text-indigo-500" /> {selectedClient.address || 'N/A'}</span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60"><Building2 className="w-3.5 h-3.5 text-indigo-500" /> RD$ {(Number(selectedClient.income) || 0).toLocaleString()} / mes</span>
                </div>
              </div>

              {/* Banking Circular Gauge (Right Column - 5 Cols) */}
              <div className="lg:col-span-5 bg-slate-50/80 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center relative shadow-sm overflow-hidden">
                <CreditScoreGauge 
                  score={analytics.score} 
                  points100={analytics.points100}
                  riskLevel={analytics.label}
                />
              </div>

            </div>

            {/* Recommendation & Dictamen Note */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
              <div className={`p-5 rounded-2xl border flex items-start gap-4 ${analytics.badgeBg} ${analytics.badgeBorder}`}>
                <ShieldCheck className={`w-6 h-6 shrink-0 mt-0.5 ${analytics.badgeColor}`} />
                <div>
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${analytics.badgeColor}`}>Dictamen de Evaluación Crediticia ({analytics.label})</h4>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{analytics.recommendation}</p>
                </div>
              </div>
            </div>

            {/* Financial Metrics Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> Capital Prestado Total
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">RD$ {analytics.metrics.totalBorrowed.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Histórico contratado</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                  <Briefcase className="w-4 h-4 text-amber-500" /> Balance Adeudado Actual
                </div>
                <p className={`text-xl font-bold ${analytics.metrics.activeDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  RD$ {analytics.metrics.activeDebt.toLocaleString()}
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
                  {analytics.metrics.activeLoans} Activos / {analytics.metrics.paidLoans} Saldados
                </p>
                {analytics.metrics.overdueLoans > 0 && (
                  <p className="text-xs font-bold text-rose-500 mt-1">{analytics.metrics.overdueLoans} Préstamo(s) en mora</p>
                )}
              </div>

            </div>

          </div>

          {/* Client Loan History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Histórico de Préstamos del Cliente
            </h3>

            {clientLoans.length === 0 ? (
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
                    {clientLoans.map((loan) => (
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
                            loan.status === LoanStatus.PAID || (loan.status as string) === 'Saldado'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : loan.status === LoanStatus.OVERDUE || (loan.status as string) === 'Atrasado'
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