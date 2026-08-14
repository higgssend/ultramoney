import React, { useState } from 'react';
import { User, MapPin, TrendingUp, Award, Plus, X, ChevronDown, Phone, Briefcase, Trash2, ChevronLeft, Calendar, CheckCircle2, Clock, Crosshair, AlertCircle, Search } from 'lucide-react';
import { useClients, useAuth, useAccounting, useLoans } from '../context/StoreContext';
import { Employee, CollectorVisit } from '../types';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/CustomSelect';

const Employees: React.FC = () => {
  const { employees, addEmployee, deleteEmployee, roles, cargos, registerUser } = useAuth();
  const { clients } = useClients();
  const { loans } = useLoans();
  const { collectorVisits, addCollectorVisit } = useAccounting();
  const [activeTab, setActiveTab] = useState<'employees' | 'visits'>('employees');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const cargoName = (cargos.find(c => c.id === emp.cargoId)?.name || '').toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      (emp.phone && emp.phone.toLowerCase().includes(term)) ||
      (emp.assignedRoute && emp.assignedRoute.toLowerCase().includes(term)) ||
      (emp.username && emp.username.toLowerCase().includes(term)) ||
      cargoName.includes(term)
    );
  });

  const filteredVisits = collectorVisits.filter(v => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.clientName.toLowerCase().includes(term) ||
      v.collectorName.toLowerCase().includes(term) ||
      v.status.toLowerCase().includes(term) ||
      (v.notes && v.notes.toLowerCase().includes(term))
    );
  });
  
  // Form State Employee
  const [newEmp, setNewEmp] = useState<{name: string, cargoId: string, phone: string, assignedRoute: string, username: string, employeePin: string}>({
      name: '',
      cargoId: '',
      phone: '',
      assignedRoute: '',
      username: '',
      employeePin: ''
  });

  const [createSystemAccess, setCreateSystemAccess] = useState(false);
  const [systemRoleIds, setSystemRoleIds] = useState<string[]>([]);

  // Visit Form State
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [visitStatus, setVisitStatus] = useState<'Cobrado' | 'Ausente' | 'Promesa de Pago' | 'No Pagó'>('Promesa de Pago');
  const [promisedDate, setPromisedDate] = useState('');
  const [amountCollected, setAmountCollected] = useState('');
  const [visitCoordinates, setVisitCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [visitNotes, setVisitNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newEmp.name && newEmp.assignedRoute) {
          const employeeId = `EMP-${Date.now()}`;
          const employee: Employee = {
              id: employeeId,
              name: newEmp.name,
              cargoId: newEmp.cargoId,
              assignedRoute: newEmp.assignedRoute,
              phone: newEmp.phone,
              performance: 100,
              activeRoutes: 1,
              collections: 0,
              username: newEmp.username || undefined,
              employeePin: newEmp.employeePin || undefined
          };
          await addEmployee(employee);
          
          if (createSystemAccess && newEmp.username && newEmp.employeePin) {
              await registerUser({
                  id: `usr-${Date.now()}`,
                  name: newEmp.name,
                  username: newEmp.username,
                  password: newEmp.employeePin,
                  employeeId: employeeId,
                  roleIds: systemRoleIds,
                  status: 'Active'
              });
          }

          setIsModalOpen(false);
          setNewEmp({ name: '', cargoId: '', phone: '', assignedRoute: '', username: '', employeePin: '' });
          setCreateSystemAccess(false);
          setSystemRoleIds([]);
      }
  };

  const handleCaptureGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setVisitCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.error(err)
      );
    }
  };

  const handleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const collector = employees.find(e => e.id === selectedCollectorId);
    const client = clients.find(c => c.id === selectedClientId);
    if (!collector || !client) return;

    addCollectorVisit({
      collectorId: collector.id,
      collectorName: collector.name,
      clientId: client.id,
      clientName: client.name,
      date: new Date().toISOString().split('T')[0],
      status: visitStatus,
      promisedDate: visitStatus === 'Promesa de Pago' ? promisedDate : undefined,
      amountCollected: visitStatus === 'Cobrado' ? Number(amountCollected) : 0,
      notes: visitNotes,
      coordinates: visitCoordinates
    });

    setIsVisitModalOpen(false);
    setSelectedClientId('');
    setVisitNotes('');
    setAmountCollected('');
    setPromisedDate('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Cobradores y Personal</h2>
                <p className="text-slate-500">Gestión de equipo, zonas de cobro y registro de visitas de campo.</p>
            </div>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
            <button 
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'employees' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Lista de Personal
            </button>
            <button 
              onClick={() => setActiveTab('visits')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'visits' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Visitas de Campo
            </button>
          </div>

          {activeTab === 'employees' ? (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
                <Plus className="w-5 h-5" /> Nuevo Empleado
            </button>
          ) : (
            <button 
                onClick={() => setIsVisitModalOpen(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
                <Plus className="w-5 h-5" /> Registrar Visita
            </button>
          )}
        </div>
      </div>

      {/* Top Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'employees' ? "Buscar por nombre, cargo, zona o teléfono de personal..." : "Buscar por cliente, cobrador o estado de visita..."}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl">
          {activeTab === 'employees' ? `${filteredEmployees.length} miembros` : `${filteredVisits.length} visitas`}
        </span>
      </div>

      {activeTab === 'employees' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{searchTerm ? `No se encontraron empleados con "${searchTerm}"` : 'No hay empleados registrados.'}</p>
              </div>
          ) : (
              filteredEmployees.map((emp) => (
                  <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative group overflow-hidden hover:shadow-md transition-all">
                      <button 
                          onClick={() => deleteEmployee(emp.id)}
                          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-4 mb-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm bg-indigo-50 text-indigo-600`}>
                              {emp.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-slate-800">{emp.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded border bg-indigo-50 border-indigo-100 text-indigo-700`}>
                                  {cargos.find(c => c.id === emp.cargoId)?.name || 'Sin Cargo'}
                              </span>
                          </div>
                      </div>
                      
                      <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-500">
                                  <MapPin className="w-4 h-4" /> Zona / Ruta
                              </div>
                              <span className="font-medium text-slate-800">{emp.assignedRoute || 'Oficina'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-500">
                                  <Phone className="w-4 h-4" /> Contacto
                              </div>
                              <span className="font-medium text-slate-800">{emp.phone || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-500">
                                  <TrendingUp className="w-4 h-4" /> Recaudado
                              </div>
                              <span className="font-medium text-emerald-600">${emp.collections.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-500">
                                  <Award className="w-4 h-4" /> Rendimiento
                              </div>
                              <span className={`font-bold ${emp.performance > 90 ? 'text-emerald-600' : emp.performance > 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                                  {emp.performance}%
                              </span>
                          </div>
                      </div>
                  </div>
              ))
          )}
        </div>
      ) : (
        /* Visits Tab */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-x-auto">
            {filteredVisits.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>{searchTerm ? `No se encontraron visitas con "${searchTerm}"` : 'No hay visitas registradas aún.'}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Cobrador</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Resultado</th>
                    <th className="p-3">Ubicación</th>
                    <th className="p-3">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{v.date}</td>
                      <td className="p-3 font-bold text-slate-700">{v.collectorName}</td>
                      <td className="p-3 text-slate-800">{v.clientName}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          v.status === 'Cobrado' ? 'bg-emerald-100 text-emerald-700' :
                          v.status === 'Promesa de Pago' ? 'bg-amber-100 text-amber-700' :
                          v.status === 'Ausente' ? 'bg-blue-100 text-blue-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {v.status === 'Cobrado' ? `+RD$ ${v.amountCollected?.toLocaleString()}` : v.promisedDate ? `Promesa: ${v.promisedDate}` : '-'}
                      </td>
                      <td className="p-3">
                        {v.coordinates ? (
                          <a href={`https://maps.google.com/?q=${v.coordinates.lat},${v.coordinates.lng}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs flex items-center gap-1 font-bold">
                            <MapPin className="w-3.5 h-3.5" /> GPS Capturado
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">Sin GPS</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-slate-600 max-w-xs truncate">{v.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* New Employee Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-slate-800">Registrar Empleado</h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label>
                          <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                              <input 
                                type="text" 
                                required 
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="Ej. Juan Pérez"
                                value={newEmp.name}
                                onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Cargo</label>
                              <CustomSelect 
                                  className="w-full"
                                  value={newEmp.cargoId}
                                  onChange={e => setNewEmp({...newEmp, cargoId: e})}
                                  options={[
                                      { value: '', label: 'Selecciona un cargo' },
                                      ...cargos.map(option => ({ value: option.id, label: option.name }))
                                  ]}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="809-..."
                                value={newEmp.phone}
                                onChange={e => setNewEmp({...newEmp, phone: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Zona / Ruta Asignada</label>
                          <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                              <input 
                                type="text" 
                                required 
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="Ej. Ruta Norte, Oficina Central"
                                value={newEmp.assignedRoute}
                                onChange={e => setNewEmp({...newEmp, assignedRoute: e.target.value})}
                              />
                          </div>
                      </div>

                        <div className="border-t pt-4 mt-4">
                            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    checked={createSystemAccess}
                                    onChange={(e) => setCreateSystemAccess(e.target.checked)}
                                />
                                <div>
                                    <span className="block text-sm font-bold text-slate-800">Crear acceso al sistema para este empleado</span>
                                    <span className="block text-xs text-slate-500">Permitir inicio de sesión en el portal y asignar permisos administrativos.</span>
                                </div>
                            </label>
                        </div>

                        {createSystemAccess && (
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de Usuario</label>
                                        <input 
                                          type="text" 
                                          required={createSystemAccess}
                                          className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                                          placeholder="Ej. juanperez"
                                          value={newEmp.username}
                                          onChange={e => setNewEmp({...newEmp, username: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña o PIN</label>
                                        <input 
                                          type="text" 
                                          required={createSystemAccess}
                                          className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-widest" 
                                          placeholder="123456"
                                          value={newEmp.employeePin}
                                          onChange={e => setNewEmp({...newEmp, employeePin: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Roles del Sistema (Permisos)</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {roles.filter(r => r.id !== 'admin').map(role => (
                                            <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={systemRoleIds.includes(role.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSystemRoleIds([...systemRoleIds, role.id]);
                                                        else setSystemRoleIds(systemRoleIds.filter(id => id !== role.id));
                                                    }}
                                                />
                                                {role.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg mt-4">
                            Guardar Registro
                        </button>
                    </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Employees;
