import React, { useState } from 'react';
import { Search, ChevronLeft, User, CreditCard, Calendar, Briefcase, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans } from '../context/StoreContext';

const CreditInquiry: React.FC = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { loans } = useLoans();
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.cedula.replace(/-/g, '') === searchTerm.replace(/-/g, '') || c.id === searchTerm);
    if (client) {
      const clientLoans = loans.filter(l => l.clientId === client.id);
      const active = clientLoans.filter(l => l.status === 'Activo' || l.status === 'Atrasado');
      const finished = clientLoans.filter(l => l.status === 'Saldado');
      const capitalOwed = active.reduce((sum, l) => sum + l.remainingBalance, 0);
      const capital = clientLoans.reduce((sum, l) => sum + l.amount, 0);

      setClientData({
        name: client.firstName,
        lastName: client.lastName,
        cedula: client.cedula,
        dob: 'N/A',
        sex: 'N/A',
        totalCodeudor: 0,
        capital: capital,
        clientM: 'NO',
        currency: 'RD$',
        loansRegistered: `${active.length} ACTIVOS / ${finished.length} TERMINADOS`,
        capitalOwed: capitalOwed
      });
    } else {
      setClientData(null);
    }
    setHasSearched(true);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
              <h1 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Datapréstamos</h1>
              <p className="text-slate-500">Consulta de historial crediticio externo.</p>
          </div>
      </div>

      {/* Search Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <form onSubmit={handleSearch} className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-2">Documento de Identidad</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ingrese Cédula o RNC..." 
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm mb-[1px]">
                    Consultar
                </button>
            </form>
      </div>

      {/* Results */}
      {hasSearched && clientData && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in mt-6">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200 shrink-0">
                     <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                          <User className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-bold text-slate-500 uppercase">Doc. Identidad: {clientData.cedula}</p>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 uppercase leading-tight">{clientData.name} {clientData.lastName}</h2>
                      <div className="flex gap-4 mt-2 justify-center md:justify-start text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {clientData.dob.split(' ')[0]}</span>
                          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {clientData.sex === 'M' ? 'Masculino' : 'Femenino'}</span>
                      </div>
                  </div>
              </div>

              <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <DataPoint label="Capital Total" value={`RD$ ${clientData.capital.toLocaleString()}`} icon={CreditCard} highlight />
                      <DataPoint label="Capital Adeudado" value={`RD$ ${clientData.capitalOwed.toLocaleString()}`} icon={Briefcase} highlight color="text-rose-600" />
                      <DataPoint label="Moneda" value={clientData.currency} icon={DollarSignIcon} />
                      
                      <DataPoint label="Total Codeudor" value={clientData.totalCodeudor.toString()} icon={User} />
                      <DataPoint label="Cliente M" value={clientData.clientM} icon={FileText} />
                      <div className="md:col-span-2 lg:col-span-1">
                          <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-2">
                             <FileText className="w-3 h-3" /> Préstamos Registrados
                          </p>
                          <p className="font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm">
                              {clientData.loansRegistered}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {hasSearched && !clientData && (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-100 text-center animate-fade-in mt-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No se encontraron resultados</h3>
          <p className="text-slate-500">La cédula o documento ingresado no posee registros en Datapréstamos.</p>
        </div>
      )}
    </div>
  );
};

const DataPoint: React.FC<{label: string, value: string, icon: any, highlight?: boolean, color?: string}> = ({label, value, icon: Icon, highlight, color='text-slate-800'}) => (
    <div className={`flex flex-col ${highlight ? 'bg-slate-50 p-4 rounded-xl border border-slate-100' : ''}`}>
        <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-2">
            <Icon className="w-3 h-3" /> {label}
        </p>
        <p className={`font-bold text-lg ${color}`}>{value}</p>
    </div>
);

const DollarSignIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export default CreditInquiry;