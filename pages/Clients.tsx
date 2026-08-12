import React, { useState } from 'react';
import { Search, Plus, Phone, MapPin, Eye, Edit, Users, TrendingUp, AlertCircle, CheckCircle, Clock, ChevronRight, LayoutGrid, List, Trash2 } from 'lucide-react';
import { useLoans, useClients } from '../context/StoreContext';
import { Client } from '../types';
import { useNavigate } from 'react-router-dom';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { maskCedula } from '../utils/masks';

const Clients: React.FC = () => {
  const { clients, deleteClient } = useClients();
  const { loans } = useLoans();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cedula.includes(searchTerm) ||
      (c.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientLoanStats = (clientId: string) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const activeLoans = clientLoans.filter(l => l.status !== 'Pagado' && l.status !== 'Rechazado');
    const activeDebt = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
    let nextPaymentDate: string | null = null;
    let isOverdue = false;
    if (activeLoans.length > 0) {
      const sorted = [...activeLoans].sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
      nextPaymentDate = sorted[0].nextPaymentDate;
      const dateObj = nextPaymentDate ? new Date(nextPaymentDate) : null;
      const daysDiff = (dateObj && !isNaN(dateObj.getTime())) ? Math.ceil((dateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
      isOverdue = daysDiff < 0;
    }
    return { activeDebt, activeLoansCount: activeLoans.length, totalLoansCount: clientLoans.length, nextPaymentDate, isOverdue };
  };

  const getCreditGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', bg: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' };
    if (score >= 75) return { grade: 'B', bg: 'bg-blue-500', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
    if (score >= 60) return { grade: 'C', bg: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' };
    return { grade: 'D', bg: 'bg-rose-500', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Al Día': return { icon: <CheckCircle className="w-3 h-3" />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' };
      case 'Atrasado': return { icon: <AlertCircle className="w-3 h-3" />, cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' };
      case 'Activo': return { icon: <CheckCircle className="w-3 h-3" />, cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
      default: return { icon: <Clock className="w-3 h-3" />, cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
    }
  };

  const getInitials = (name: string, lastName?: string) => {
    const first = name.charAt(0).toUpperCase();
    const last = (lastName || '').charAt(0).toUpperCase();
    return last ? `${first}${last}` : first;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    await deleteClient(deleteConfirm.id);
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const avatarColors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
  ];

  const getAvatarColor = (name: string) => {
    const idx = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  };

  // Summary stats
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status !== 'Inactivo').length;
  const overdueClients = clients.filter(c => {
    const stats = getClientLoanStats(c.id);
    return stats.isOverdue;
  }).length;
  const totalDebt = clients.reduce((sum, c) => sum + getClientLoanStats(c.id).activeDebt, 0);

  const statuses = ['Todos', 'Al Día', 'Activo', 'Atrasado', 'Inactivo'];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Clientes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{totalClients} clientes registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <DataExportToolbar
            data={filteredClients}
            title="Directorio de Clientes"
            filename="clientes_ultramoney"
            columns={[
              { header: 'Nombre', key: 'name' },
              { header: 'Apellido', key: 'lastName' },
              { header: 'Cédula', key: 'cedula' },
              { header: 'Teléfono', key: 'phone' },
              { header: 'Estado', key: 'status' },
              { header: 'Ingresos', key: 'income', format: (v) => `RD$ ${v?.toLocaleString()}` }
            ]}
          />
          <button
            onClick={() => navigate('/clientes/nuevo')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', value: totalClients, icon: <Users className="w-5 h-5" />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Clientes Activos', value: activeClients, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Con Mora', value: overdueClients, icon: <AlertCircle className="w-5 h-5" />, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { label: 'Deuda Total Activa', value: `RD$ ${totalDebt.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>{stat.icon}</div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, cédula o teléfono..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {searchTerm ? 'Sin resultados' : 'No hay clientes'}
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              {searchTerm ? `No se encontró ningún cliente con "${searchTerm}"` : 'Empieza registrando tu primer cliente haciendo clic en "Nuevo Cliente"'}
            </p>
            {!searchTerm && (
              <button onClick={() => navigate('/clientes/nuevo')} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Registrar Cliente
              </button>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredClients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-3.5 font-semibold">Cliente</th>
                  <th className="px-5 py-3.5 font-semibold hidden md:table-cell">Contacto</th>
                  <th className="px-5 py-3.5 font-semibold text-right hidden sm:table-cell">Deuda Activa</th>
                  <th className="px-5 py-3.5 font-semibold text-center hidden lg:table-cell">Próximo Pago</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Score</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Estado</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredClients.map((client) => {
                  const stats = getClientLoanStats(client.id);
                  const grade = getCreditGrade(client.creditScore || 0);
                  const statusBadge = getStatusBadge(client.status || '');
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/clientes/${client.id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(client.name)} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700`}>
                            {client.avatarUrl ? (
                              <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(client.name, client.lastName)
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                              {client.name} {client.lastName || ''}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{maskCedula(client.cedula)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {client.phone && <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400"><Phone className="w-3 h-3" /> {client.phone}</span>}
                          {client.address && <span className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-[140px]"><MapPin className="w-3 h-3 shrink-0" /> {client.address}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right hidden sm:table-cell">
                        <p className={`font-bold text-sm ${stats.activeDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {stats.activeDebt > 0 ? `RD$ ${stats.activeDebt.toLocaleString()}` : '—'}
                        </p>
                        <p className="text-xs text-slate-400">{stats.activeLoansCount} préstamo{stats.activeLoansCount !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-5 py-4 text-center hidden lg:table-cell">
                        {stats.nextPaymentDate ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${stats.isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'}`}>
                            {stats.isOverdue && <AlertCircle className="w-3 h-3" />}
                            {stats.nextPaymentDate}
                          </span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs font-bold ${grade.badge}`}>{grade.grade}</span>
                          <div className="hidden sm:flex flex-col items-start gap-0.5">
                            <div className="w-14 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${grade.bg} transition-all`} style={{ width: `${Math.min(client.creditScore || 0, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{client.creditScore || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusBadge.cls}`}>
                          {statusBadge.icon}
                          {client.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${client.id}`); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/clientes/editar/${client.id}`); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(client); }}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredClients.length > 0 && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => {
              const stats = getClientLoanStats(client.id);
              const grade = getCreditGrade(client.creditScore || 0);
              const statusBadge = getStatusBadge(client.status || '');
              return (
                <div
                  key={client.id}
                  onClick={() => navigate(`/clientes/${client.id}`)}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarColor(client.name)} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700`}>
                      {client.avatarUrl ? (
                        <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(client.name, client.lastName)
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold ${statusBadge.cls}`}>
                      {statusBadge.icon} {client.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {client.name} {client.lastName || ''}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mb-3">{maskCedula(client.cedula)}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Deuda</p>
                      <p className={`text-sm font-bold ${stats.activeDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        {stats.activeDebt > 0 ? `RD$ ${stats.activeDebt.toLocaleString()}` : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold ${grade.badge}`}>{grade.grade}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {filteredClients.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span>Mostrando {filteredClients.length} de {totalClients} clientes</span>
            <span>{statusFilter !== 'Todos' ? `Filtro: ${statusFilter}` : 'Todos los estados'}</span>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Eliminar Cliente</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              ¿Estás seguro que deseas eliminar a <span className="font-bold text-slate-800 dark:text-white">{deleteConfirm.name} {deleteConfirm.lastName || ''}</span>? Se eliminarán todos sus datos asociados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-semibold text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {isDeleting ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Eliminando...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Eliminar</>  
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
