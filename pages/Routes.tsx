import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useClients, useLoans } from '../context/StoreContext';
import { Route, Client, LoanStatus } from '../types';
import { 
  Map as MapIcon, Plus, Edit2, Trash2, Search, ArrowRight, User, 
  Hash, Save, AlertCircle, X, AlertTriangle, Navigation, MapPin, 
  Share2, CheckCircle2, Calendar, Phone, DollarSign, Filter, ListOrdered,
  Printer, Compass, Sparkles, Route as RouteIcon, ShieldAlert, TrendingUp,
  Activity, Check, Layers, ExternalLink, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RouteGpsMap } from '../components/RouteGpsMap';
import { 
  GeoPoint, 
  RouteStop, 
  SectorRiskSummary, 
  optimizeCollectionRoute, 
  calculateSectorRiskZoning, 
  DEFAULT_OFFICE_COORDS 
} from '../utils/routeOptimizer';
import { toast } from 'sonner';

export const RoutesPage: React.FC = () => {
  const { routes, clients, addRoute, updateRoute, deleteRoute, updateClient } = useClients();
  const { loans } = useLoans();
  const { employees, currentUser } = useAuth();
  const navigate = useNavigate();

  // Navigation & View Mode State: 'map' | 'optimize' | 'zoning' | 'manage'
  const [viewMode, setViewMode] = useState<'map' | 'optimize' | 'zoning' | 'manage'>('map');
  const [mapFilter, setMapFilter] = useState<'all' | 'today' | 'overdue' | 'current'>('all');

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Route>>({
    name: '', description: '', status: 'Activa'
  });

  const [routeClients, setRouteClients] = useState<Client[]>([]);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  // Optimizer State
  const [optimizerTarget, setOptimizerTarget] = useState<'overdue' | 'today' | 'all'>('overdue');
  const [originType, setOriginType] = useState<'office' | 'gps'>('office');
  const [customOriginCoords, setCustomOriginCoords] = useState<GeoPoint>(DEFAULT_OFFICE_COORDS);
  const [optimizedRouteData, setOptimizedRouteData] = useState<ReturnType<typeof optimizeCollectionRoute> | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Risk Zoning State
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

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

  // Sector Risk Zoning Analysis (Memoized)
  const sectorRiskList: SectorRiskSummary[] = useMemo(() => {
    const target = selectedRoute ? routeClients : clients;
    return calculateSectorRiskZoning(target, loans);
  }, [selectedRoute, routeClients, clients, loans]);

  // Handle GPS coordinate update for a client (1-click without breaking data)
  const handleUpdateClientCoords = async (clientId: string, coords: GeoPoint) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    try {
      await updateClient({
        ...client,
        coordinates: coords,
        lat: coords.lat,
        lng: coords.lng
      });
      toast.success(`Ubicación GPS guardada para ${client.name}`);
    } catch (err) {
      toast.error('Error al guardar coordenadas GPS');
    }
  };

  // Run Route Optimization
  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    let target = selectedRoute ? routeClients : clients;
    const todayStr = new Date().toISOString().split('T')[0];

    if (optimizerTarget === 'overdue') {
      target = target.filter(c => {
        const clientLoans = loans.filter(l => l.clientId === c.id && l.status !== LoanStatus.PAID && l.status !== LoanStatus.REJECTED);
        return clientLoans.some(l => l.status === LoanStatus.OVERDUE || (l.status as string) === 'Vencido');
      });
    } else if (optimizerTarget === 'today') {
      target = target.filter(c => {
        const clientLoans = loans.filter(l => l.clientId === c.id && l.status !== LoanStatus.PAID && l.status !== LoanStatus.REJECTED);
        return clientLoans.some(l => l.nextPaymentDate === todayStr);
      });
    }

    if (target.length === 0) {
      toast.error('No se encontraron clientes para optimizar con los filtros seleccionados.');
      setIsOptimizing(false);
      return;
    }

    const origin = originType === 'office' ? DEFAULT_OFFICE_COORDS : customOriginCoords;
    const originLabel = originType === 'office' ? 'Oficina Central' : 'Mi Ubicación GPS';

    const result = optimizeCollectionRoute(origin, originLabel, target, loans);
    setOptimizedRouteData(result);
    setIsOptimizing(false);
    toast.success(`Ruta optimizada calculada: ${result.stops.length} paradas (~${result.totalDistanceKm} km)`);
  };

  // Acquire collector live GPS for optimization origin
  const handleGetCollectorLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible en este dispositivo');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCustomOriginCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginType('gps');
        toast.success('Ubicación actual del cobrador detectada');
      },
      _err => {
        toast.error('No se pudo obtener la ubicación GPS');
      }
    );
  };

  // Save optimized sequence to database (updates routeSequence of each client)
  const handleSaveOptimizedSequence = async () => {
    if (!optimizedRouteData || optimizedRouteData.stops.length === 0) return;
    try {
      for (const stop of optimizedRouteData.stops) {
        await updateClient({
          ...stop.client,
          routeSequence: stop.order
        });
      }
      toast.success('Secuencia óptima guardada exitosamente en la nube');
    } catch (err) {
      toast.error('Error al guardar la secuencia de clientes');
    }
  };

  // Format and share optimized route via WhatsApp
  const handleShareOptimizedWhatsApp = () => {
    if (!optimizedRouteData || optimizedRouteData.stops.length === 0) return;
    const assignedCollector = employees.find(e => e.id === selectedRoute?.collectorId);

    const lines: string[] = [
      `*HOJA DE RUTA OPTIMIZADA DE COBRANZA*`,
      `Zona: ${selectedRoute ? selectedRoute.name.toUpperCase() : 'GENERAL'}`,
      `Fecha: ${new Date().toLocaleDateString('es-DO')}`,
      `Cobrador: ${assignedCollector?.name || 'Oficial en Ruta'}`,
      `Distancia Total: ~${optimizedRouteData.totalDistanceKm} km (${optimizedRouteData.totalEstimatedTimeMins} mins aprox.)`,
      `Monto Estimado a Cobrar: RD$ ${optimizedRouteData.totalInstallmentsToCollect.toLocaleString()}`,
      `---------------------------------`,
      `*ORDEN DE VISITAS (RUTA MAS CORTA):*`,
      ``
    ];

    optimizedRouteData.stops.forEach(stop => {
      lines.push(`${stop.order}. *${stop.client.name}* ${stop.isOverdue ? `[MORA ${stop.overdueDays} D]` : ''}`);
      lines.push(`   Direccion: ${stop.client.address || stop.client.sector || 'S/D'}`);
      lines.push(`   Cuota: RD$ ${stop.installmentAmount.toLocaleString()} | Bal: RD$ ${stop.totalRemaining.toLocaleString()}`);
      lines.push(`   Tel: ${stop.client.phone || 'S/N'}`);
      lines.push(`   GPS: https://www.google.com/maps/dir/?api=1&destination=${stop.coords.lat},${stop.coords.lng}`);
      lines.push(``);
    });

    if (optimizedRouteData.googleMapsUrl) {
      lines.push(`---------------------------------`);
      lines.push(`*Ruta Completa en Google Maps:*`);
      lines.push(optimizedRouteData.googleMapsUrl);
    }
    lines.push(`---------------------------------`);
    lines.push(`Generado por UltraMoney`);

    const fullText = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
  };

  // KPI Calculations
  const totalDebtorsCount = useMemo(() => {
    return clients.filter(c => {
      const cLoans = loans.filter(l => l.clientId === c.id && l.status !== LoanStatus.PAID && l.status !== LoanStatus.REJECTED);
      return cLoans.length > 0;
    }).length;
  }, [clients, loans]);

  const totalOverdueBalance = useMemo(() => {
    return loans
      .filter(l => l.status === LoanStatus.OVERDUE || (l.status as string) === 'Vencido')
      .reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  }, [loans]);

  const totalDueTodayBalance = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return loans
      .filter(l => l.nextPaymentDate === todayStr && l.status !== LoanStatus.PAID && l.status !== LoanStatus.REJECTED)
      .reduce((sum, l) => sum + (Number(l.installmentAmount) || 0), 0);
  }, [loans]);

  const geolocatedClientsCount = useMemo(() => {
    return clients.filter(c => Boolean(c.coordinates?.lat && c.coordinates?.lng)).length;
  }, [clients]);

  // Route Form Actions
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

  const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Geolocalización & Inteligencia de Campo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-secondary tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <MapIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Mapa de Cartera & Rutas en Vivo
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualiza deudores en tiempo real, optimiza la ruta más corta para cobradores y analiza la zonificación de riesgo.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                viewMode === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Navigation className="w-4 h-4" /> Mapa de Cartera
            </button>

            <button
              onClick={() => {
                setViewMode('optimize');
                if (!optimizedRouteData) handleRunOptimizer();
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                viewMode === 'optimize' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <RouteIcon className="w-4 h-4" /> Ruta Inteligente
            </button>

            <button
              onClick={() => setViewMode('zoning')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                viewMode === 'zoning' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Zonificación de Riesgo
            </button>

            <button
              onClick={() => setViewMode('manage')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapPin className="w-4 h-4" /> Zonas ({routes.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Clientes con Deuda</span>
            <User className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalDebtorsCount} <span className="text-xs font-normal text-slate-400">de {clients.length}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Cobros Para Hoy</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            RD$ {totalDueTodayBalance.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Cartera en Mora</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            RD$ {totalOverdueBalance.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>GPS Exacto Guardado</span>
            <Compass className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {geolocatedClientsCount} <span className="text-xs font-normal text-slate-400">({clients.length > 0 ? Math.round((geolocatedClientsCount / clients.length) * 100) : 0}%)</span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MAPA DE CARTERA INTERACTIVO */}
      {/* ========================================================================= */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Estado:
              </span>
              
              <button
                onClick={() => setMapFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mapFilter === 'all' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Todos ({clients.length})
              </button>

              <button
                onClick={() => setMapFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mapFilter === 'today' 
                    ? 'bg-amber-500 text-white shadow-sm' 
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Vencen Hoy
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
                Mora Crítica
              </button>

              <button
                onClick={() => setMapFilter('current')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mapFilter === 'current' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Al Día
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
                className="w-full sm:w-auto px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="">Todas las Zonas / Rutas</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Map Component */}
          <RouteGpsMap 
            clients={selectedRoute ? routeClients : clients}
            loans={loans}
            filterType={mapFilter}
            selectedClientId={selectedClientForDetail?.id}
            onSelectClient={(c) => setSelectedClientForDetail(c)}
            onUpdateClientCoords={handleUpdateClientCoords}
            height="620px"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPTIMIZADOR DE RUTA INTELIGENTE */}
      {/* ========================================================================= */}
      {viewMode === 'optimize' && (
        <div className="space-y-6">
          {/* Optimizer Configuration Header */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Optimizador de Ruta de Cobranza (Ruta Más Corta)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Calcula la secuencia matemática óptima para recorrer a los clientes ahorrando combustible y tiempo.
                </p>
              </div>

              <button
                onClick={handleRunOptimizer}
                disabled={isOptimizing}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <RouteIcon className="w-4 h-4" />
                {isOptimizing ? 'Calculando Ruta...' : 'Recalcular Ruta Óptima'}
              </button>
            </div>

            {/* Optimizer Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Target filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Clientes a Incluir
                </label>
                <select
                  value={optimizerTarget}
                  onChange={e => setOptimizerTarget(e.target.value as 'overdue' | 'today' | 'all')}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  <option value="overdue">Solo Clientes en Mora (Atrasados)</option>
                  <option value="today">Solo Cuotas que Vencen Hoy</option>
                  <option value="all">Todos los Clientes Activos</option>
                </select>
              </div>

              {/* Origin Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Punto de Partida
                </label>
                <div className="flex gap-2">
                  <select
                    value={originType}
                    onChange={e => setOriginType(e.target.value as 'office' | 'gps')}
                    className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="office">Oficina Central</option>
                    <option value="gps">Ubicación GPS del Cobrador</option>
                  </select>
                  {originType === 'gps' && (
                    <button
                      onClick={handleGetCollectorLocation}
                      className="px-2.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold"
                      title="Detectar GPS actual"
                    >
                      <Compass className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Route Scope */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Zona / Ruta Asignada
                </label>
                <select
                  value={selectedRoute?.id || ''}
                  onChange={e => {
                    const r = routes.find(item => item.id === e.target.value) || null;
                    setSelectedRoute(r);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  <option value="">Todas las Zonas</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Optimized Route Results & Map */}
          {optimizedRouteData && (
            <div className="space-y-4">
              {/* Route Metrics Summary Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 rounded-3xl shadow-xl">
                <div>
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Paradas en Secuencia</span>
                  <span className="text-2xl font-black">{optimizedRouteData.stops.length} Paradas</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Distancia Total</span>
                  <span className="text-2xl font-black">{optimizedRouteData.totalDistanceKm} km</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Tiempo Estimado</span>
                  <span className="text-2xl font-black">~{optimizedRouteData.totalEstimatedTimeMins} mins</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Cobro Proyectado</span>
                  <span className="text-2xl font-black text-emerald-300">RD$ {optimizedRouteData.totalInstallmentsToCollect.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons: Google Maps, WhatsApp, Save Sequence */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  {optimizedRouteData.googleMapsUrl && (
                    <a
                      href={optimizedRouteData.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> Abrir Ruta en Google Maps
                    </a>
                  )}

                  <button
                    onClick={handleShareOptimizedWhatsApp}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Share2 className="w-4 h-4" /> Enviar Ruta por WhatsApp
                  </button>
                </div>

                <button
                  onClick={handleSaveOptimizedSequence}
                  className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" /> Guardar Secuencia en el Sistema
                </button>
              </div>

              {/* Visual Map with Polyline Routing */}
              <RouteGpsMap 
                clients={optimizedRouteData.stops.map(s => s.client)}
                loans={loans}
                optimizedStops={optimizedRouteData.stops}
                originPoint={optimizedRouteData.origin}
                originName={optimizedRouteData.originName}
                onUpdateClientCoords={handleUpdateClientCoords}
                height="560px"
              />

              {/* Step-by-Step Itinerary Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
                <h4 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-indigo-600" />
                  Itinerario de Paradas Ordenadas
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 px-3">#</th>
                        <th className="pb-3 px-3">Cliente</th>
                        <th className="pb-3 px-3">Dirección</th>
                        <th className="pb-3 px-3">Distancia</th>
                        <th className="pb-3 px-3">Llegada Aprox.</th>
                        <th className="pb-3 px-3 text-right">Cuota a Cobrar</th>
                        <th className="pb-3 px-3 text-right">Balance</th>
                        <th className="pb-3 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {optimizedRouteData.stops.map(stop => (
                        <tr key={stop.client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-3 font-black text-indigo-600 text-sm">
                            #{stop.order}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {stop.client.name}
                              {stop.isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                                  Mora {stop.overdueDays}d
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{stop.client.phone}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {stop.client.address || stop.client.sector || 'Sin dirección registrada'}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                            +{stop.distanceFromPreviousKm} km
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-bold">
                            ~{stop.estimatedArrivalMins} min
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                            RD$ {stop.installmentAmount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                            RD$ {stop.totalRemaining.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${stop.coords.lat},${stop.coords.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                title="Navegar con Google Maps"
                              >
                                <Compass className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => {
                                  if (stop.loan) {
                                    navigate('/pagos', { state: { loanId: stop.loan.id } });
                                  } else {
                                    navigate(`/clientes/${stop.client.id}`);
                                  }
                                }}
                                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-colors"
                              >
                                Cobrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ZONIFICACIÓN DE RIESGO POR SECTORES */}
      {/* ========================================================================= */}
      {viewMode === 'zoning' && (
        <div className="space-y-6">
          {/* Header & Explanation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Zonificación de Riesgo & Análisis Territorial de Mora
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Monitorea el comportamiento crediticio agrupado por sectores y barrios para prevenir concentración de morosidad.
            </p>
          </div>

          {/* Map with Risk Circles */}
          <RouteGpsMap 
            clients={clients}
            loans={loans}
            riskZones={sectorRiskList}
            showRiskZones={true}
            onUpdateClientCoords={handleUpdateClientCoords}
            height="520px"
          />

          {/* Sector Risk Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
            <h4 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Semáforo de Morosidad por Sector ({sectorRiskList.length} Zonas Detectadas)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Sector / Barrio</th>
                    <th className="pb-3 px-3">Municipio</th>
                    <th className="pb-3 px-3 text-center">Clientes</th>
                    <th className="pb-3 px-3 text-right">Capital Activo</th>
                    <th className="pb-3 px-3 text-right">Cartera en Mora</th>
                    <th className="pb-3 px-3 text-center">Tasa Morosidad</th>
                    <th className="pb-3 px-3 text-center">Semáforo de Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sectorRiskList.map(zone => (
                    <tr key={zone.sectorName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {zone.sectorName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {zone.municipality}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {zone.totalClients}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        RD$ {zone.totalRemainingBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                        RD$ {zone.totalOverdueBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-black">
                        <span className={`px-2.5 py-1 rounded-lg text-xs ${
                          zone.overduePercentage >= 20 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                            : zone.overduePercentage >= 10
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {zone.overduePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                          zone.riskLevel === 'Critico'
                            ? 'bg-rose-600 text-white'
                            : zone.riskLevel === 'Alto'
                            ? 'bg-orange-500 text-white'
                            : zone.riskLevel === 'Medio'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {zone.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GESTIÓN DE RUTAS Y ASIGNACIÓN DE COBRADORES */}
      {/* ========================================================================= */}
      {viewMode === 'manage' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Catálogo de Zonas & Rutas de Cobranza
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crea zonas geográficas y asigna cobradores para organizar la operativa física de tu financiera.
              </p>
            </div>

            <button
              onClick={handleNewRoute}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Nueva Ruta / Zona
            </button>
          </div>

          {/* Form Modal for Creating / Editing Route */}
          {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedRoute ? 'Editar Ruta / Zona' : 'Nueva Ruta / Zona'}
                  </h4>
                  <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveRoute} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nombre de la Ruta *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Zona Norte - Herrera"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Descripción / Sectores</label>
                    <textarea
                      rows={2}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Sectores que abarca esta ruta..."
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Cobrador Responsable</label>
                    <select
                      value={formData.collectorId || ''}
                      onChange={e => setFormData({ ...formData, collectorId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                    >
                      <option value="">Sin cobrador asignado</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Estado</label>
                    <select
                      value={formData.status || 'Activa'}
                      onChange={e => setFormData({ ...formData, status: e.target.value as 'Activa' | 'Inactiva' })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                    >
                      Guardar Ruta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {routeToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">¿Eliminar esta Ruta?</h4>
                <p className="text-xs text-slate-500">
                  Esta acción eliminará la ruta. Los clientes asignados quedarán sin ruta asignada pero no se borrarán.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setRouteToDelete(null)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      await deleteRoute(routeToDelete);
                      setRouteToDelete(null);
                      toast.success('Ruta eliminada');
                    }}
                    className="flex-1 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Routes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.map(route => {
              const assignedEmp = employees.find(e => e.id === route.collectorId);
              const clientsCount = clients.filter(c => c.routeId === route.id).length;

              return (
                <div
                  key={route.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">{route.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{route.description || 'Sin descripción'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      route.status === 'Activa'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                    }`}>
                      {route.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cobrador:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{assignedEmp?.name || 'No asignado'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clientes Asignados:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{clientsCount}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEditRoute(route)}
                      className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl hover:bg-rose-100"
                      title="Eliminar ruta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default RoutesPage;
