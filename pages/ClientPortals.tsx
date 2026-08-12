import React, { useState } from 'react';
import { useClients } from '../context/StoreContext';
import { Search, Link as LinkIcon, RefreshCw, XCircle, ShieldCheck, Copy, ChevronLeft, CheckCircle, ExternalLink, Settings, AlertTriangle, Key, Wand2, Share2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Client } from '../types';

const ClientPortals: React.FC = () => {
    const { clients, updateClient } = useClients();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        portalActive: true,
        portalAlias: '',
        clientPin: ''
    });

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.cedula.includes(searchTerm)
    );

    const handleCopyLink = (client: Client) => {
        const link = `${window.location.origin}/portal/${client.portalAlias || client.id}`;
        navigator.clipboard.writeText(link);
        addToast('Enlace del portal copiado al portapapeles', 'success');
    };

    const handleOpenPortal = (client: Client) => {
        const link = `${window.location.origin}/portal/${client.portalAlias || client.id}`;
        window.open(link, '_blank');
    };

    const handleShareWhatsApp = (client: Client) => {
        const link = `${window.location.origin}/portal/${client.portalAlias || client.id}`;
        const pinText = client.clientPin ? `\n🔑 Tu PIN de seguridad es: *${client.clientPin}*` : '\nAcceso directo sin clave.';
        const text = encodeURIComponent(
            `Hola ${client.name}, aquí puedes consultar tus préstamos y recibos de pago en línea:\n\n` +
            `🌐 Portal Digital: ${link}` +
            pinText
        );
        const phoneClean = client.phone ? client.phone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${phoneClean}?text=${text}`, '_blank');
    };

    const openManageModal = (client: Client) => {
        setSelectedClient(client);
        setFormData({
            portalActive: client.portalActive !== false,
            portalAlias: client.portalAlias || '',
            clientPin: client.clientPin || ''
        });
    };

    const handleGenerateAliasFromName = () => {
        if (!selectedClient) return;
        const fullName = selectedClient.name || '';
        const baseSlug = fullName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        if (!baseSlug) {
            addToast('El nombre del cliente no es válido para generar un enlace', 'error');
            return;
        }

        let finalAlias = baseSlug;
        const aliasTaken = clients.find(c => c.portalAlias === finalAlias && c.id !== selectedClient.id);
        if (aliasTaken) {
            const randDigits = Math.floor(10 + Math.random() * 90);
            finalAlias = `${baseSlug}-${randDigits}`;
        }

        setFormData(prev => ({ ...prev, portalAlias: finalAlias }));
        addToast(`Enlace generado automáticamente: ${finalAlias}`, 'info');
    };

    const handleSaveCredentials = async () => {
        if (!selectedClient) return;

        // Clean alias: strip leading @ and whitespace
        const cleanAlias = (formData.portalAlias || '').trim().replace(/^@+/, '');

        // Alias validation: only alphanumeric and dashes
        const aliasPattern = /^[a-zA-Z0-9-]*$/;
        if (cleanAlias && !aliasPattern.test(cleanAlias)) {
            addToast('El alias solo puede contener letras, números y guiones', 'error');
            return;
        }

        // Check if alias is taken by someone else
        if (cleanAlias) {
            const aliasTaken = clients.find(c => c.portalAlias === cleanAlias && c.id !== selectedClient.id);
            if (aliasTaken) {
                addToast('Este alias ya está en uso por otro cliente', 'error');
                return;
            }
        }

        await updateClient({
            ...selectedClient,
            portalActive: formData.portalActive,
            portalAlias: cleanAlias || undefined,
            clientPin: formData.clientPin || undefined
        });

        addToast('Configuración del portal actualizada', 'success');
        setSelectedClient(null);
    };

    const generatePin = () => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        setFormData(prev => ({ ...prev, clientPin: newPin }));
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
                        <p className="text-slate-500">Gestión de accesos, credenciales y enlaces.</p>
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
                                <th className="px-6 py-4 font-semibold text-center">Estado y Seguridad</th>
                                <th className="px-6 py-4 font-semibold text-center">Alias</th>
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
                                        <div className="flex flex-col items-center gap-1.5">
                                            {client.portalActive === false ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                    <XCircle className="w-3 h-3" /> Desactivado
                                                </span>
                                            ) : client.clientPin ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <ShieldCheck className="w-3 h-3" /> Protegido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    Abierto (Sin PIN)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {client.portalAlias ? (
                                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">@{client.portalAlias}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">Sin alias</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleShareWhatsApp(client)} disabled={client.portalActive === false} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm transition-colors border border-emerald-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed" title="Enviar por WhatsApp">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleCopyLink(client)} disabled={client.portalActive === false} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm transition-colors border border-indigo-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed" title="Copiar Enlace">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleOpenPortal(client)} disabled={client.portalActive === false} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" title="Abrir Portal">
                                                <ExternalLink className="w-4 h-4" /> Abrir
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => openManageModal(client)} 
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Gestionar
                                        </button>
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

            {/* Manage Portal Modal */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-indigo-500" />
                                Accesos del Portal
                            </h3>
                            <button 
                                onClick={() => setSelectedClient(null)} 
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg">
                                    {selectedClient.name.charAt(0)}{selectedClient.lastName?.charAt(0) || ''}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-white">{selectedClient.name} {selectedClient.lastName || ''}</h4>
                                    <p className="text-sm text-slate-500">Cédula: {selectedClient.cedula}</p>
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">Estado del Portal</p>
                                    <p className="text-xs text-slate-500">Habilitar o deshabilitar el acceso para este cliente.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={formData.portalActive}
                                        onChange={(e) => setFormData({...formData, portalActive: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Alias config */}
                            <div className={`space-y-3 transition-opacity ${!formData.portalActive ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Enlace Personalizado del Cliente
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleGenerateAliasFromName}
                                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                                        >
                                            <Wand2 className="w-3 h-3" /> Generar con Nombre
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">Solo letras y números (sin caracteres especiales ni espacios).</p>
                                    <div className="flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-900">
                                        <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold font-mono flex items-center shrink-0">
                                            {window.location.origin}/portal/
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.portalAlias}
                                            onChange={(e) => setFormData({...formData, portalAlias: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                            placeholder="juan-perez"
                                            className="flex-1 block w-full px-3 py-2 font-mono font-bold text-xs bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    {!formData.portalAlias ? (
                                        <p className="text-xs text-slate-400 mt-2 truncate font-mono">
                                            Enlace predeterminado: {window.location.origin}/portal/{selectedClient.id}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 truncate font-mono">
                                            ✓ Enlace personalizado activo: {window.location.origin}/portal/{formData.portalAlias}
                                        </p>
                                    )}
                                </div>

                                {/* PIN config */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        PIN de Seguridad (Opcional)
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">Deja este campo vacío para un enlace de acceso directo, o establece un PIN.</p>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Key className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={10}
                                                value={formData.clientPin}
                                                onChange={(e) => setFormData({...formData, clientPin: e.target.value})}
                                                placeholder="Sin PIN (Acceso Abierto)"
                                                className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <button 
                                            onClick={generatePin}
                                            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                                        >
                                            Generar PIN
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {!formData.portalActive && (
                                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg flex items-start gap-2 text-sm">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p>El portal está desactivado. El cliente no podrá acceder a su estado de cuenta a través de su enlace.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button 
                                onClick={() => setSelectedClient(null)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveCredentials}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                Guardar Configuración
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPortals;
