import React, { useState } from 'react';
import { useSettings } from '../context/StoreContext';
import { ShieldCheck, Search, Filter, Calendar, User, Clock, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';

const Bitacora: React.FC = () => {
  const { auditLogs } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('Todas');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'Todas' || (log.action || '').includes(filterAction);
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueActions = ['Todas', ...new Set(auditLogs.map(log => (log.action || '').split(' ')[0]))];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" /> Bitácora de Auditoría
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Registro inmutable de todas las acciones del sistema.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario o acción..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all"
          />
        </div>
        <div className="flex gap-2">
          <CustomSelect
            value={filterAction}
            onChange={(e) => setFilterAction(e)}
            className="w-48"
            options={uniqueActions.map(action => ({ value: action, label: action }))}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Acción</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No se encontraron registros en la bitácora.</p>
                  </td>
                </tr>
              ) : (
                currentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">
                          {log.timestamp && !isNaN(new Date(log.timestamp).getTime()) ? new Date(log.timestamp).toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('es-DO')}
                        </span>
                        <span className="text-slate-400">·</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {log.timestamp && !isNaN(new Date(log.timestamp).getTime()) ? new Date(log.timestamp).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 w-full max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> de <span className="font-bold text-slate-700">{filteredLogs.length}</span> registros
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bitacora;
