import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Plus, Crosshair, Map, Hash, Save, ArrowLeft, Building, Briefcase } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Client } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { maskPhone } from '../utils/masks';
import { useToast } from '../context/ToastContext';

const NewClient: React.FC = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { clients, addClient, updateClient, routes, addClientDocument } = useStore();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [currentClient, setCurrentClient] = useState<Partial<Client>>({
        name: '', lastName: '', sex: 'Masculino', phone: '', whatsapp: '', phoneHome: '', 
        cedula: '', documentType: 'Cedula', address: '', province: '', sector: '', 
        referenceAddress: '', companyName: '', jobPosition: '', income: 0, 
        routeId: '', routeSequence: 0
    });

    const [docFile, setDocFile] = useState<string>('');

    useEffect(() => {
        if (isEditMode && id) {
            const client = clients.find(c => c.id === id);
            if (client) {
                setCurrentClient(client);
            } else {
                addToast('Cliente no encontrado', 'error');
                navigate('/clientes');
            }
        }
    }, [isEditMode, id, clients, navigate, addToast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setDocFile(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCaptureLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setCurrentClient({
                    ...currentClient, 
                    coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }
                });
                addToast('Ubicación capturada correctamente', 'success');
            }, () => addToast('Error al capturar ubicación. Verifique los permisos del navegador.', 'error'));
        } else {
            addToast('Geolocalización no soportada por el navegador', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Safeguard for DB NOT NULL constraints on optional UI fields
        const finalClient = {
            ...currentClient,
            phone: currentClient.phone?.trim() ? currentClient.phone : 'N/A',
            address: currentClient.address?.trim() ? currentClient.address : 'N/A',
            cedula: currentClient.cedula?.trim() ? currentClient.cedula : 'N/A',
            documentType: currentClient.documentType || 'Otro'
        };

        if (isEditMode && finalClient.id) {
            await updateClient(finalClient.id, finalClient);
            navigate('/clientes');
        } else {
            const newClient = await addClient(finalClient as Omit<Client, 'id' | 'joinedDate'>);
            if (newClient && docFile && currentClient.documentType) {
                await addClientDocument(newClient.id, {
                    title: `Documento de Identidad (${currentClient.documentType})`,
                    type: currentClient.documentType === 'Cedula' ? 'Cedula' : 'Otro',
                    fileUrl: docFile,
                    fileType: docFile.startsWith('data:image') ? 'image/jpeg' : 'application/pdf'
                });
            }
            navigate('/clientes');
        }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto pb-24">
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate('/clientes')} 
                    className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isEditMode ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {isEditMode ? 'Modifica los datos del cliente seleccionado' : 'Ingresa la información básica para registrar un nuevo cliente.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Datos Personales */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-900/10">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="font-bold text-slate-800 dark:text-white">Datos Personales</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Nombre(s) <span className="text-rose-500">*</span>
                            </label>
                            <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" 
                                value={currentClient.name} onChange={e => setCurrentClient({...currentClient, name: e.target.value})} placeholder="Ej. Juan Carlos" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Apellidos (Opcional)</label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" 
                                value={currentClient.lastName || ''} onChange={e => setCurrentClient({...currentClient, lastName: e.target.value})} placeholder="Ej. Pérez" />
                        </div>
                        
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Documento de Identidad <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex">
                                <select className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-r-0 rounded-l-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-sm font-medium"
                                    value={currentClient.documentType || 'Cedula'} onChange={e => setCurrentClient({...currentClient, documentType: e.target.value as any})}>
                                    <option value="Cedula">Cédula</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                    <option value="Licencia">Licencia</option>
                                    <option value="ID">ID</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-r-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" 
                                    value={currentClient.cedula} onChange={e => setCurrentClient({...currentClient, cedula: e.target.value})} placeholder="Número de documento..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sexo (Opcional)</label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" 
                                value={currentClient.sex} onChange={e => setCurrentClient({...currentClient, sex: e.target.value as any})}>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        
                        {!isEditMode && (
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Adjuntar Imagen de ID (Opcional)</label>
                            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900" />
                        </div>
                        )}
                    </div>
                </div>

                {/* 2. Contacto y Ubicación */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-900/10">
                        <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h2 className="font-bold text-slate-800 dark:text-white">Contacto y Ubicación</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono Principal (Opcional)</label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all" 
                                value={currentClient.phone} onChange={e => setCurrentClient({...currentClient, phone: maskPhone(e.target.value)})} placeholder="(809) 000-0000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp (Opcional)</label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all" 
                                value={currentClient.whatsapp || ''} onChange={e => setCurrentClient({...currentClient, whatsapp: maskPhone(e.target.value)})} placeholder="(809) 000-0000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono Casa (Opcional)</label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all" 
                                value={currentClient.phoneHome || ''} onChange={e => setCurrentClient({...currentClient, phoneHome: maskPhone(e.target.value)})} placeholder="(809) 000-0000" />
                        </div>
                        
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dirección Física (Opcional)</label>
                            <div className="flex gap-2">
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all" 
                                    value={currentClient.address} onChange={e => setCurrentClient({...currentClient, address: e.target.value})} placeholder="Calle, Número, Sector..." />
                                <button type="button" onClick={handleCaptureLocation} className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap" title="Capturar GPS">
                                    <Crosshair className="w-5 h-5" />
                                    <span className="hidden sm:inline">Capturar GPS</span>
                                </button>
                            </div>
                            {currentClient.coordinates && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-medium bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-1 rounded-md">
                                    <MapPin className="w-3.5 h-3.5"/> Ubicación GPS capturada exitosamente
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Provincia (Opcional)</label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all" 
                                value={currentClient.province || ''} onChange={e => setCurrentClient({...currentClient, province: e.target.value})} placeholder="Ej. Santo Domingo" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Punto de Referencia (Opcional)</label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all" 
                                value={currentClient.referenceAddress || ''} onChange={e => setCurrentClient({...currentClient, referenceAddress: e.target.value})} placeholder="Cerca de..." />
                        </div>
                    </div>
                </div>

                {/* 3. Laboral y Ruta */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-amber-50/50 dark:bg-amber-900/10">
                        <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <h2 className="font-bold text-slate-800 dark:text-white">Laboral y Ruta</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Empresa / Trabajo (Opcional)</label>
                            <div className="relative">
                                <Building className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all" 
                                    value={currentClient.companyName || ''} onChange={e => setCurrentClient({...currentClient, companyName: e.target.value})} placeholder="Nombre de empresa" />
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ingresos Mensuales (Opcional)</label>
                            <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all font-bold text-amber-600 dark:text-amber-400" 
                                value={currentClient.income || ''} onChange={e => setCurrentClient({...currentClient, income: Number(e.target.value)})} placeholder="0.00" />
                        </div>
                        
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Zona / Ruta (Opcional)</label>
                            <div className="relative">
                                <Map className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <select className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all" 
                                    value={currentClient.routeId || ''} onChange={e => setCurrentClient({...currentClient, routeId: e.target.value})}>
                                    <option value="">-- Sin ruta asignada --</option>
                                    {routes.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Orden de Cobro (Secuencia)</label>
                            <div className="relative">
                                <Hash className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="number" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all" 
                                    value={currentClient.routeSequence || 0} onChange={e => setCurrentClient({...currentClient, routeSequence: Number(e.target.value)})} placeholder="Ej. 1" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 justify-end border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => navigate('/clientes')} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-all shadow-sm">
                        Cancelar
                    </button>
                    <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-all">
                        <Save className="w-5 h-5" />
                        {isEditMode ? 'Guardar Cambios' : 'Registrar Cliente'}
                    </button>
                </div>
                
            </form>
        </div>
    );
};

export default NewClient;
