import React, { useState } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Phone, MapPin, X, Edit, User, Eye, Crosshair, ChevronLeft, Globe, Map, Hash } from 'lucide-react';
import { useLoans, useClients } from '../context/StoreContext';
import { Client } from '../types';
import { useNavigate } from 'react-router-dom';
import { maskCedula, maskPhone } from '../utils/masks';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { useToast } from '../context/ToastContext';

const Clients: React.FC = () => {
  const { clients, addClient, updateClient, addClientDocument, routes } = useClients();
  const { loans } = useLoans();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  
  // Document Upload State
  
  const initialClientState: Partial<Client> = {
    name: '', cedula: '', phone: '', phoneHome: '', address: '', 
    creditScore: 80, status: 'Activo', sex: 'Masculino', occupation: '', income: 0
  };

  
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cedula.includes(searchTerm)
  );

  const getClientLoanStats = (clientId: string) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const activeLoans = clientLoans.filter(l => l.status !== 'Pagado' && l.status !== 'Rechazado');
    const activeDebt = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const totalLoansCount = clientLoans.length;
    
    let nextPaymentDate = null;
    let isOverdue = false;
    
    if (activeLoans.length > 0) {
        const sortedLoans = [...activeLoans].sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
        nextPaymentDate = sortedLoans[0].nextPaymentDate;
        
        const daysDiff = Math.ceil((new Date(nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        isOverdue = daysDiff < 0;
    }
    
    return { activeDebt, totalLoansCount, nextPaymentDate, isOverdue };
  };

  const getCreditGrade = (score: number) => {
      if (score >= 90) return { grade: 'A', color: 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' };
      if (score >= 75) return { grade: 'B', color: 'text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
      if (score >= 60) return { grade: 'C', color: 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' };
      return { grade: 'D', color: 'text-rose-700 bg-rose-100 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' };
  };

  const handleOpenCreate = () => {
    navigate('/clientes/nuevo');
  };

  const handleOpenEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    navigate(`/clientes/editar/${client.id}`);
  };

  


  const goToDetails = (id: string) => {
    navigate(`/clientes/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Gestión de Clientes</h2>
        </div>
        <div className="flex gap-2">
          <DataExportToolbar 
            data={filteredClients} 
            title="Directorio de Clientes"
            filename="clientes_ultramoney"
            columns={[
              { header: 'ID', key: 'id' },
              { header: 'Nombre', key: 'name' },
              { header: 'Cédula', key: 'cedula' },
              { header: 'Teléfono', key: 'phone' },
              { header: 'Estado', key: 'status' },
              { header: 'Ingresos', key: 'income', format: (v) => `RD$ ${v?.toLocaleString()}` }
            ]} 
          />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o cédula..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">ID / Cliente</th>
                <th className="px-6 py-4 font-semibold">Ocupación</th>
                <th className="px-6 py-4 font-semibold">Teléfono</th>
                <th className="px-6 py-4 font-semibold text-right">Deuda / Préstamos</th>
                <th className="px-6 py-4 font-semibold text-center">Próximo Pago</th>
                <th className="px-6 py-4 font-semibold">Score</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredClients.map((client) => {
                const stats = getClientLoanStats(client.id);
                return (
                    <tr 
                        key={client.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        onClick={() => goToDetails(client.id)}
                    >
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            {client.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{client.name}</p>
                            <p className="text-xs text-slate-400">ID: {client.id}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">{client.cedula}</p>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{client.occupation}</p>
                        <p className="text-xs text-slate-500">Ingreso: ${client.income?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col text-sm text-slate-600 dark:text-slate-400">
                           <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {client.phone}</span>
                           {client.phoneHome && <span className="flex items-center gap-1 text-slate-400"><MapPin className="w-3 h-3"/> {client.phoneHome}</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <p className="font-bold text-rose-600 dark:text-rose-400">${stats.activeDebt.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{stats.totalLoansCount} préstamos hist.</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {stats.nextPaymentDate ? (
                            <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stats.isOverdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                    {stats.nextPaymentDate}
                                </span>
                                {stats.isOverdue && <span className="text-[10px] text-rose-500 font-bold uppercase">Vencido</span>}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">Sin préstamos activos</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-lg ${getCreditGrade(client.creditScore).color}`}>
                                {getCreditGrade(client.creditScore).grade}
                            </div>
                            <div className="flex flex-col">
                                <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                                    <div 
                                    className={`h-1.5 rounded-full ${client.creditScore > 80 ? 'bg-emerald-500' : client.creditScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                    style={{ width: `${client.creditScore}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{client.creditScore} pts</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); goToDetails(client.id); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                title="Ver Detalles">
                                <Eye className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => handleOpenEdit(e, client)}
                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                title="Editar">
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Client Modal */}
      
    </div>
  );
};

export default Clients;
