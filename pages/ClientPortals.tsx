import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, Link as LinkIcon, RefreshCw, XCircle, ShieldCheck, Copy, ChevronLeft, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const ClientPortals: React.FC = () => {
    const { clients, updateClient } = useStore();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.cedula.includes(searchTerm)
    );

    const handleGeneratePin = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            const newPin = Math.floor(1000 + Math.random() * 9000).toString();
            updateClient({ ...client, clientPin: newPin });
            addToast(`PIN generado para ${client.name}`, 'success');
        }
    };

    const handleRemovePin = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            updateClient({ ...client, clientPin: undefined });
            addToast(`PIN eliminado para ${client.name}. El portal ahora es de acceso directo con su enlace.`, 'info');
        }
    };

    const handleCopyLink = (clientId: string) => {
        const link = `${window.location.origin}/portal/${clientId}`;
        navigator.clipboard.writeText(link);
        addToast('Enlace del portal copiado al portapapeles', 'success');
    };

    const handleOpenPortal = (clientId: string) => {
        const link = `${window.location.origin}/portal/${clientId}`;
        window.open(link, '_blank');
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Portales de Cliente</h2>
                        <p className="text-slate-500">Gestión de accesos, enlaces y seguridad de clientes.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar cliente por nombre o cédula..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                <th className="px-6 py-4 font-semibold text-center">Estado Seguridad</th>
                                <th className="px-6 py-4 font-semibold text-center">PIN Actual</th>
                                <th className="px-6 py-4 font-semibold text-center">Enlace</th>
                                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{client.name} {client.lastName || ''}</p>
                                        <p className="text-xs text-slate-500">{client.cedula}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {client.clientPin ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <ShieldCheck className="w-3 h-3" /> Protegido con PIN
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                Abierto (Sin PIN)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300 font-bold tracking-widest">
                                            {client.clientPin || '----'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleCopyLink(client.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm transition-colors border border-indigo-100 font-medium" title="Copiar Enlace">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleOpenPortal(client.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors shadow-sm font-medium" title="Abrir Portal">
                                                <ExternalLink className="w-4 h-4" /> Abrir
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleGeneratePin(client.id)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-200 transition-all" title="Generar / Cambiar PIN">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            {client.clientPin && (
                                                <button onClick={() => handleRemovePin(client.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-rose-200 transition-all" title="Quitar PIN">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientPortals;
