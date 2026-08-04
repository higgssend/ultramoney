import React, { useState, useEffect } from 'react';
import { useAuth, useClients } from '../context/StoreContext';
import { Route, Client } from '../types';
import { Map, Plus, Edit2, Trash2, Search, ArrowRight, User, Hash, Save, AlertCircle, X, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/CustomSelect';

const RoutesPage: React.FC = () => {
    const { routes, clients, addRoute, updateRoute, deleteRoute, updateClient } = useClients();
  const { employees, roles } = useAuth();
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
            const sorted = clients.filter(c => c.routeId === selectedRoute.id).sort((a, b) => (a.routeSequence || 0) - (b.routeSequence || 0));
            setRouteClients(sorted);
        } else {
            setRouteClients([]);
        }
    }, [selectedRoute, clients]);

    const handleNewRoute = () => {
        setFormData({ name: '', description: '', status: 'Activa' });
        setSelectedRoute(null);
        setIsEditing(true);
    };

    const handleEditRoute = (route: Route) => {
        setFormData(route);
        setSelectedRoute(route);
        setIsEditing(true);
    };

    const handleSaveRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRoute && selectedRoute.id) {
            await updateRoute(selectedRoute.id, formData);
        } else {
            await addRoute(formData as Omit<Route, 'id' | 'createdAt'>);
        }
        setIsEditing(false);
        setSelectedRoute(null);
    };

    const handleDelete = (id: string) => {
        setRouteToDelete(id);
    };

    const updateClientSequence = async (clientId: string, newSequence: string) => {
        const num = parseInt(newSequence) || 0;
        await updateClient(clientId, { routeSequence: num });
    };

    const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-100px)] flex gap-8">
            {/* Left Sidebar - Routes List */}
            <div className="w-1/3 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Map className="w-6 h-6 text-indigo-600" />
                            Zonas / Rutas
                        </h2>
                        <button onClick={handleNewRoute} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar ruta..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredRoutes.map(route => (
                        <div 
                            key={route.id}
                            onClick={() => { setSelectedRoute(route); setIsEditing(false); }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedRoute?.id === route.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-100'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800 dark:text-white">{route.name}</h3>
                                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${route.status === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{route.status}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{route.description || 'Sin descripción'}</p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> {clients.filter(c => c.routeId === route.id).length} clientes</span>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleEditRoute(route); }} className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }} className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRoutes.length === 0 && (
                        <div className="text-center py-8 text-slate-500">No hay rutas registradas.</div>
                    )}
                </div>
            </div>

            {/* Right Pane - Detail / Editor */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                {isEditing ? (
                    <div className="p-8">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b pb-4">{selectedRoute ? 'Editar Ruta' : 'Nueva Ruta'}</h2>
                        <form onSubmit={handleSaveRoute} className="space-y-5 max-w-lg">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Ruta / Zona</label>
                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Ruta Centro..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" rows={3}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cobrador Asignado</label>
                                <CustomSelect
                                    className="w-full"
                                    value={formData.collectorId || ''} 
                                    onChange={e => setFormData({...formData, collectorId: e})}
                                    options={[
                                        { value: '', label: '(Sin asignar)' },
                                        ...employees.filter(e => {
                                            const r = roles.find(rl => rl.id === e.role);
                                            return r && r.name.toLowerCase().includes('cobrador');
                                        }).map(emp => ({ value: emp.id, label: emp.name }))
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                                <CustomSelect
                                    className="w-full"
                                    value={formData.status || 'Activa'} 
                                    onChange={e => setFormData({...formData, status: e as any})}
                                    options={[
                                        { value: 'Activa', label: 'Activa' },
                                        { value: 'Inactiva', label: 'Inactiva' }
                                    ]}
                                />
                            </div>
                            <div className="flex gap-4 pt-4 border-t dark:border-slate-700">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"><Save className="w-5 h-5" /> Guardar Ruta</button>
                            </div>
                        </form>
                    </div>
                ) : selectedRoute ? (
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{selectedRoute.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-4">{selectedRoute.description}</p>
                            <div className="flex gap-4 text-sm">
                                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                    <User className="w-4 h-4 text-indigo-500" />
                                    Cobrador: {employees.find(e => e.id === selectedRoute.collectorId)?.name || 'N/A'}
                                </div>
                                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                    <Hash className="w-4 h-4 text-emerald-500" />
                                    {routeClients.length} Clientes Asignados
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 mb-6 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Organización de Clientes</p>
                                    <p>Asigna un número de secuencia a cada cliente. El sistema los ordenará automáticamente de menor a mayor. Esto dictará el orden de visita del cobrador.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {routeClients.map((c, idx) => (
                                    <div key={c.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-indigo-300 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">{c.name} {c.lastName}</h4>
                                                <p className="text-xs text-slate-500">{c.address}, {c.sector}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-bold text-slate-500">Secuencia:</label>
                                            <input 
                                                type="number" 
                                                className="w-20 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-bold text-indigo-600 dark:bg-slate-700"
                                                defaultValue={c.routeSequence || 0}
                                                onBlur={(e) => updateClientSequence(c.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {routeClients.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        No hay clientes en esta ruta. Edita el perfil de un cliente para asignarlo a esta ruta.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <Map className="w-24 h-24 mb-6 text-slate-200 dark:text-slate-700" />
                        <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300 mb-2">Gestión de Rutas Lógicas</h2>
                        <p className="max-w-md">Selecciona una ruta de la lista para ver sus clientes asignados u organizarlos por secuencia de visita.</p>
                    </div>
                )}
            </div>

        {/* Modal Confirmar Eliminacin */}
        {routeToDelete && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 rounded-t-2xl">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="font-bold text-lg">Eliminar Ruta</h3>
                        </div>
                        <button onClick={() => setRouteToDelete(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Ests seguro de que deseas eliminar esta ruta?<br/><br/>
                            <span className="text-rose-600 dark:text-rose-400 font-bold">Esta accin no se puede deshacer.</span> Los clientes asignados a esta ruta quedarn sin ruta.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setRouteToDelete(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={async () => {
                                    await deleteRoute(routeToDelete);
                                    if (selectedRoute?.id === routeToDelete) setSelectedRoute(null);
                                    setRouteToDelete(null);
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all flex justify-center items-center gap-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                S, Eliminar
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
