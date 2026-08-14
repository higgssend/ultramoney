import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useClients, useLoans } from '../context/StoreContext';
import { Route, Client } from '../types';
import { 
  Map as MapIcon, Plus, Edit2, Trash2, Search, ArrowRight, User, 
  Hash, Save, AlertCircle, X, AlertTriangle, Navigation, MapPin, 
  Share2, CheckCircle2, Calendar, Phone, DollarSign, Filter, ListOrdered,
  Printer, Receipt
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/CustomSelect';
import { RouteGpsMap } from '../components/RouteGpsMap';
import { toast } from 'sonner';

export const RoutesPage: React.FC = () => {
  const { routes, clients, addRoute, updateRoute, deleteRoute, updateClient } = useClients();
  const { loans } = useLoans();
  const { employees, roles } = useAuth();
  const navigate = useNavigate();

  // Navigation & View Mode State: 'map' | 'sequence' | 'manage'
  const [viewMode, setViewMode] = useState<'map' | 'sequence' | 'manage'>('map');
  const [mapFilter, setMapFilter] = useState<'all' | 'today' | 'overdue'>('all');

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Route>>({
    name: '', description: '', status: 'Activa'
  });

  const [routeClients, setRouteClients] = useState<Client[]>([]);

  useEffect(() => {
    if (selectedRoute) {
      const sorted = clients
        .filter(c => c.routeId === selectedRoute.id)
        .sort((a, b) => (a.routeSequence || 0) - (b.routeSequence || 0));
      setRouteClients(sorted);
    } else {
      setRouteClients(clients);
    }
  }, [selectedRoute, clients]);

  const handleNewRoute = () => {
    setFormData({ name: '', description: '', status: 'Activa' });
    setSelectedRoute(null);
    setIsEditing(true);
    setViewMode('manage');
  };

  const handleEditRoute = (route: Route) => {
    setFormData(route);
    setSelectedRoute(route);
    setIsEditing(true);
    setViewMode('manage');
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoute && selectedRoute.id) {
      await updateRoute(selectedRoute.id, formData);
      toast.success('Ruta actualizada exitosamente');
    } else {
      await addRoute(formData as Omit<Route, 'id' | 'createdAt'>);
      toast.success('Nueva ruta creada exitosamente');
    }
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    setRouteToDelete(id);
  };

  const updateClientSequence = async (clientId: string, newSequence: string) => {
    const num = parseInt(newSequence) || 0;
    const cl = clients.find(c => c.id === clientId);
    if (cl) {
      await updateClient({ ...cl, routeSequence: num });
      toast.success('Secuencia de visita actualizada');
    }
  };

  // Format and share route via WhatsApp
  const handleShareRouteWhatsApp = (route: Route | null) => {
    const targetClients = route ? routeClients : clients;
    const assignedCollector = employees.find(e => e.id === route?.collectorId);

    const lines: string[] = [
      `🗺️ *HOJA DE RUTA DE COBRANZA - ${route ? route.name.toUpperCase() : 'TODAS LAS ZONAS'}*`,
      `📅 Fecha: ${new Date().toLocaleDateString('es-DO')}`,
      `👤 Cobrador: ${assignedCollector?.name || 'General'}`,
      `---------------------------------`
    ];

    targetClients.forEach((c, idx) => {
      const clientLoans = loans.filter(l => l.clientId === c.id && l.status !== 'Pagado');
      const cuota = clientLoans.reduce((sum, l) => sum + (Number(l.installmentAmount) || 0), 0);
      const isOverdue = clientLoans.some(l => l.status === 'Atrasado');

      lines.push(`${idx + 1}. *${c.name} ${c.lastName || ''}* ${isOverdue ? '⚠️ (MORA)' : ''}`);
      lines.push(`   📍 ${c.address || 'Sin dirección'}`);
      lines.push(`   💵 Cuota: RD$ ${cuota.toLocaleString()}`);
      lines.push(`   📱 Tel: ${c.phone || 'S/N'}`);
      if (c.lat && c.lng) {
        lines.push(`   🧭 GPS: https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`);
      }
      lines.push(``);
    });

    lines.push(`---------------------------------`);
    lines.push(`✓ Generado desde UltraMoney`);

    const fullText = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
  };

  const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Módulo de Campo & GPS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-secondary tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <MapIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Rutas & Mapa de Cobranza
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitorea geográficamente a tus clientes, organiza el orden de visita y navega directo con Waze y Google Maps.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Navigation className="w-4 h-4" /> Mapa GPS
            </button>
            <button
              onClick={() => setViewMode('sequence')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'sequence' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ListOrdered className="w-4 h-4" /> Lista y Orden
            </button>
            <button
              onClick={() => setViewMode('manage')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapPin className="w-4 h-4" /> Zonas ({routes.length})
            </button>
          </div>

          <button
            onClick={() => handleShareRouteWhatsApp(selectedRoute)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            title="Enviar listado de visitas por WhatsApp al cobrador"
          >
            <Share2 className="w-4 h-4" /> Enviar por WhatsApp
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE GPS MAP */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          
          {/* Map Filter Chips Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtrar Mapa:
              </span>
              
              <button
                onClick={() => setMapFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mapFilter === 'all' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Todos los Clientes ({clients.length})
              </button>

              <button
                onClick={() => setMapFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mapFilter === 'today' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Cuotas Que Vencen Hoy
              </button>

              <button
                onClick={() => setMapFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mapFilter === 'overdue' 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                Clientes en Atraso (Mora)
              </button>
            </div>

            {/* Route Selector Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedRoute?.id || ''}
                onChange={e => {
                  const r = routes.find(item => item.id === e.target.value) || null;
                  setSelectedRoute(r);
                }}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="">🗺️ Todas las Rutas / Zonas</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaflet GPS Map Container */}
          <div className="h-[600px] w-full">
            <RouteGpsMap 
              clients={selectedRoute ? routeClients : clients}
              loans={loans}
              filterType={mapFilter}
              onCollectPayment={(client) => navigate(`/pagos?client=${client.id}`)}
            />
          </div>
        </div>
      )}

      {/* VIEW 2: SEQUENCE & LIST ORDER */}
      {viewMode === 'sequence' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedRoute ? `Secuencia de Visita: ${selectedRoute.name}` : 'Secuencia de Visita General'}
              </h3>
              <p className="text-xs text-slate-500">
                Organiza el orden de parada (1, 2, 3...). El sistema ordenará el recorrido del cobrador automáticamente.
              </p>
            </div>

            <select
              value={selectedRoute?.id || ''}
              onChange={e => {
                const r = routes.find(item => item.id === e.target.value) || null;
                setSelectedRoute(r);
              }}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="">Todas las Zonas</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {routeClients.map((c, idx) => {
              const clientLoans = loans.filter(l => l.clientId === c.id && l.status !== 'Pagado');
              const cuota = clientLoans.reduce((sum, l) => sum + (Number(l.installmentAmount) || 0), 0);
              const isOverdue = clientLoans.some(l => l.status === 'Atrasado');

              return (
                <div 
                  key={c.id} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOverdue 
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {c.name} {c.lastName || ''}
                        </h4>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                            Atrasado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {c.address || 'Sin dirección registrada'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right mr-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Cuota a Cobrar</span>
                      <p className="font-black text-sm text-indigo-600 dark:text-indigo-400">RD$ {cuota.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-500">Orden:</label>
                      <input 
                        type="number" 
                        className="w-16 px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-xl text-center font-black text-sm text-indigo-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                        defaultValue={c.routeSequence || (idx + 1)}
                        onBlur={(e) => updateClientSequence(c.id, e.target.value)}
                      />
                    </div>

                    {clientLoans[0] && (
                      <button
                        onClick={() => navigate('/pagos', { state: { loanId: clientLoans[0].id } })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        title="Cobrar cuota e imprimir ticket térmico Bluetooth"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cobrar</span>
                      </button>
                    )}

                    {c.lat && c.lng && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl border border-indigo-100"
                        title="Abrir en Google Maps"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {routeClients.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No hay clientes asignados a esta ruta.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: MANAGE ROUTES & ZONES */}
      {viewMode === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Routes List */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Zonas y Rutas Registradas
                </h2>
                <button onClick={handleNewRoute} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar zona o ruta..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-xs dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[500px]">
              {filteredRoutes.map(route => (
                <div 
                  key={route.id}
                  onClick={() => { setSelectedRoute(route); setIsEditing(false); }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedRoute?.id === route.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">{route.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-lg ${
                      route.status === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {route.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{route.description || 'Sin descripción'}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1 font-semibold">
                      <User className="w-3 h-3 text-indigo-500" /> {clients.filter(c => c.routeId === route.id).length} clientes
                    </span>
                    <div className="flex gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); handleEditRoute(route); }} className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }} className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRoutes.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">No hay rutas registradas.</div>
              )}
            </div>
          </div>

          {/* Right Editor Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              {selectedRoute && isEditing ? 'Editar Ruta / Zona' : 'Nueva Ruta / Zona'}
            </h2>

            <form onSubmit={handleSaveRoute} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Nombre de la Zona o Sector</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                  placeholder="Ej. Ruta Villa Mella / Herrera..." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Descripción / Referencias</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  rows={3}
                  placeholder="Notas de la ruta para el cobrador..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Cobrador Asignado</label>
                <CustomSelect
                  className="w-full"
                  value={formData.collectorId || ''} 
                  onChange={e => setFormData({...formData, collectorId: e})}
                  options={[
                    { value: '', label: '(Sin asignar)' },
                    ...employees.map(emp => ({ value: emp.id, label: emp.name }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                <CustomSelect
                  className="w-full"
                  value={formData.status || 'Activa'} 
                  onChange={e => setFormData({...formData, status: e as 'Activa' | 'Inactiva'})}
                  options={[
                    { value: 'Activa', label: 'Activa' },
                    { value: 'Inactiva', label: 'Inactiva' }
                  ]}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  <Save className="w-4 h-4" /> Guardar Zona
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      {routeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 rounded-t-2xl">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-lg">Eliminar Ruta</h3>
              </div>
              <button onClick={() => setRouteToDelete(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                ¿Estás seguro de que deseas eliminar esta ruta?<br/><br/>
                <span className="text-rose-600 dark:text-rose-400 font-bold">Esta acción no se puede deshacer.</span> Los clientes quedarán sin ruta asignada.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setRouteToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    await deleteRoute(routeToDelete);
                    if (selectedRoute?.id === routeToDelete) setSelectedRoute(null);
                    setRouteToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all flex justify-center items-center gap-2 text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoutesPage;
