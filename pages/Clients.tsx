import React, { useState } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Phone, MapPin, X, Edit, User, Eye, Crosshair, ChevronLeft, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Client } from '../types';
import { useNavigate } from 'react-router-dom';
import { maskCedula, maskPhone } from '../utils/masks';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { useToast } from '../context/ToastContext';

const Clients: React.FC = () => {
  const { clients, addClient, updateClient, loans, addClientDocument } = useStore();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Document Upload State
  const [docType, setDocType] = useState<'Cedula' | 'Pasaporte' | 'Otro'>('Cedula');
  const [docNumber, setDocNumber] = useState('');
  const [docFile, setDocFile] = useState<string>('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setDocFile(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const initialClientState: Partial<Client> = {
    name: '', cedula: '', phone: '', phoneHome: '', address: '', 
    creditScore: 80, status: 'Activo', sex: 'Masculino', occupation: '', income: 0
  };

  const [currentClient, setCurrentClient] = useState<Partial<Client>>(initialClientState);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cedula.includes(searchTerm)
  );

  const getClientLoanStats = (clientId: string) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const activeDebt = clientLoans
      .filter(l => l.status !== 'Pagado' && l.status !== 'Rechazado')
      .reduce((sum, l) => sum + l.remainingBalance, 0);
    const totalLoansCount = clientLoans.length;
    return { activeDebt, totalLoansCount };
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setCurrentClient(initialClientState);
    setDocType('Cedula');
    setDocNumber('');
    setDocFile('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setIsEditMode(true);
    setCurrentClient({ ...client });
    setIsModalOpen(true);
  };

  const handleCaptureLocation = () => {
      if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  setCurrentClient(prev => ({
                      ...prev,
                      coordinates: { lat: latitude, lng: longitude }
                  }));
                  addToast("Ubicación capturada", "success");
              },
              (error) => {
                  console.error(error);
                  addToast("Error al obtener ubicación", "error");
              }
          );
      } else {
          addToast("Geolocalización no soportada", "error");
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentClient.name && currentClient.cedula) {
        if (isEditMode && currentClient.id) {
            updateClient(currentClient as Client);
        } else {
            // Generate Random ID (5 digits)
            const randomId = Math.floor(10000 + Math.random() * 90000).toString();
            addClient({
                ...currentClient as Client,
                id: randomId,
                joinedDate: new Date().toISOString().split('T')[0]
            });
            
            // Adjuntar Documento si lo hay
            if (docFile && addClientDocument) {
                addClientDocument({
                    id: `DOC-${Date.now()}`,
                    clientId: randomId,
                    title: `Documento: ${docType} ${docNumber ? '- ' + docNumber : ''}`,
                    type: docType as any,
                    fileUrl: docFile,
                    fileType: docFile.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
                    uploadDate: new Date().toISOString().split('T')[0]
                });
            }
        }
        setIsModalOpen(false);
    }
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
                    <td className="px-6 py-4">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 w-20">
                            <div 
                            className={`h-1.5 rounded-full ${client.creditScore > 80 ? 'bg-emerald-500' : client.creditScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${client.creditScore}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-slate-400">{client.creditScore} pts</span>
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="bg-indigo-600 p-4 flex justify-between items-center text-white sticky top-0 z-10">
                    <h3 className="font-bold text-lg">{isEditMode ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Section 1: Datos Personales */}
                    <div>
                        <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" /> Datos Personales
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                <input required type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.name} onChange={e => setCurrentClient({...currentClient, name: e.target.value})} placeholder="Ej. Juan" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apellido</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.lastName || ''} onChange={e => setCurrentClient({...currentClient, lastName: e.target.value})} placeholder="Ej. Pérez" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cédula / Documento ID</label>
                                <input required type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.cedula} onChange={e => setCurrentClient({...currentClient, cedula: maskCedula(e.target.value)})} placeholder="000-0000000-0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha Nacimiento</label>
                                <input type="date" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.birthDate || ''} onChange={e => setCurrentClient({...currentClient, birthDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado Civil</label>
                                <select className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                    value={currentClient.maritalStatus || 'Soltero/a'} onChange={e => setCurrentClient({...currentClient, maritalStatus: e.target.value as any})}>
                                    <option value="Soltero/a">Soltero/a</option>
                                    <option value="Casado/a">Casado/a</option>
                                    <option value="Divorciado/a">Divorciado/a</option>
                                    <option value="Viudo/a">Viudo/a</option>
                                    <option value="Unión Libre">Unión Libre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sexo</label>
                                <select className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                    value={currentClient.sex} onChange={e => setCurrentClient({...currentClient, sex: e.target.value as any})}>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contacto y Ubicación */}
                    <div>
                         <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Contacto y Ubicación
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono Principal</label>
                                <input required type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.phone} onChange={e => setCurrentClient({...currentClient, phone: maskPhone(e.target.value)})} placeholder="(809) 000-0000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.whatsapp || ''} onChange={e => setCurrentClient({...currentClient, whatsapp: maskPhone(e.target.value)})} placeholder="(809) 000-0000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono Casa</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.phoneHome} onChange={e => setCurrentClient({...currentClient, phoneHome: maskPhone(e.target.value)})} placeholder="(809) 000-0000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provincia</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.province || ''} onChange={e => setCurrentClient({...currentClient, province: e.target.value})} placeholder="Santo Domingo" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Municipio / Sector</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.sector || ''} onChange={e => setCurrentClient({...currentClient, sector: e.target.value})} placeholder="Ensanche Naco" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Punto de Referencia</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.referenceAddress || ''} onChange={e => setCurrentClient({...currentClient, referenceAddress: e.target.value})} placeholder="Frente al supermercado" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección Completa</label>
                                <div className="flex gap-2">
                                    <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                        value={currentClient.address} onChange={e => setCurrentClient({...currentClient, address: e.target.value})} />
                                    <button type="button" onClick={handleCaptureLocation} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="Usar mi ubicación actual GPS">
                                        <Crosshair className="w-5 h-5" />
                                    </button>
                                </div>
                                {currentClient.coordinates && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Ubicación GPS capturada</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Info Laboral y Financiera */}
                    <div>
                         <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Información Laboral y Financiera
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa / Trabajo</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.companyName || ''} onChange={e => setCurrentClient({...currentClient, companyName: e.target.value})} placeholder="Nombre de empresa" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo / Puesto</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.jobPosition || ''} onChange={e => setCurrentClient({...currentClient, jobPosition: e.target.value})} placeholder="Ej. Contador" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ingresos Mensuales</label>
                                <input type="number" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white font-bold" 
                                    value={currentClient.income} onChange={e => setCurrentClient({...currentClient, income: Number(e.target.value)})} />
                            </div>
                        </div>
                    </div>

                    
                    {/* Section: Ruta */}
                    <div>
                        <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <Map className="w-4 h-4" /> Ruta de Cobro (Opcional)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zona / Ruta</label>
                                <select className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.routeId || ''} onChange={e => setCurrentClient({...currentClient, routeId: e.target.value})}>
                                    <option value="">-- Sin ruta --</option>
                                    {routes.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1"><Hash className="w-3 h-3 text-slate-400"/> Secuencia / Orden</label>
                                <input type="number" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.routeSequence || 0} onChange={e => setCurrentClient({...currentClient, routeSequence: Number(e.target.value)})} placeholder="Ej. 1" />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Documento Adjunto (Opcional, Solo Creación) */}
                    {!isEditMode && (
                        <div>
                            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                                <Crosshair className="w-4 h-4" /> Adjuntar Documento (Opcional)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Doc.</label>
                                    <select className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                        value={docType} onChange={e => setDocType(e.target.value as any)}>
                                        <option value="Cedula">Cédula</option>
                                        <option value="Pasaporte">Pasaporte</option>
                                        <option value="Contrato">Contrato</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Numeración (Opcional)</label>
                                    <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                        value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="000-0000000-0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Imagen / PDF</label>
                                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-600 dark:file:text-white cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3 justify-end">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
                            Cancelar
                        </button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md">
                            {isEditMode ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Clients;