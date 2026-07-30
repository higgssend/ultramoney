import React, { useState } from 'react';
import { User, MapPin, TrendingUp, Award, Plus, X, Phone, Briefcase, Trash2, ChevronLeft, Calendar, CheckCircle2, Clock, Crosshair, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Employee, CollectorVisit } from '../types';
import { useNavigate } from 'react-router-dom';

const Employees: React.FC = () => {
  const { employees, addEmployee, deleteEmployee, clients, loans, collectorVisits, addCollectorVisit } = useStore();
  const [activeTab, setActiveTab] = useState<'employees' | 'visits'>('employees');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Form State Employee
  const [newEmp, setNewEmp] = useState<{name: string, role: Employee['role'], phone: string, assignedRoute: string, username: string, employeePin: string}>({
      name: '',
      role: 'Collector',
      phone: '',
      assignedRoute: '',
      username: '',
      employeePin: ''
  });

  // Visit Form State
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [visitStatus, setVisitStatus] = useState<'Cobrado' | 'Ausente' | 'Promesa de Pago' | 'No Pagó'>('Promesa de Pago');
  const [promisedDate, setPromisedDate] = useState('');
  const [amountCollected, setAmountCollected] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitCoordinates, setVisitCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newEmp.name && newEmp.assignedRoute) {
          const employee: Employee = {
              id: `EMP-${Date.now()}`,
              name: newEmp.name,
              role: newEmp.role,
              assignedRoute: newEmp.assignedRoute,
              phone: newEmp.phone,
              performance: 100,
              activeRoutes: 1,
              collections: 0,
              username: newEmp.username || undefined,
              employeePin: newEmp.employeePin || undefined
          };
          addEmployee(employee);
          setIsModalOpen(false);
          setNewEmp({ name: '', role: 'Collector', phone: '', assignedRoute: '', username: '', employeePin: '' });
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

      {activeTab === 'employees' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No hay empleados registrados.</p>
              </div>
          ) : (
              employees.map((emp) => (
                  <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative group overflow-hidden hover:shadow-md transition-all">
                      <button 
                          onClick={() => deleteEmployee(emp.id)}
                          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-4 mb-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${
                              emp.role === 'Collector' ? 'bg-indigo-50 text-indigo-600' : 
                              emp.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                              {emp.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-slate-800">{emp.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded border ${
                                  emp.role === 'Collector' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                                  emp.role === 'Admin' ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              }`}>
                                  {emp.role === 'Collector' ? 'Cobrador' : emp.role === 'Admin' ? 'Administrador' : 'Secretaria'}
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
            <h3 className="font-bold text-slate-800 mb-4">Historial de Visitas de Campo</h3>
            {collectorVisits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No hay visitas registradas aún.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Cobrador</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Estatus</th>
                    <th className="p-3">Monto / Promesa</th>
                    <th className="p-3">Ubicación GPS</th>
                    <th className="p-3">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {collectorVisits.map((v) => (
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
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
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
                              <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                              <div className="relative">
                                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                  <select 
                                    className="w-full pl-10 pr-2 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    value={newEmp.role}
                                    onChange={e => setNewEmp({...newEmp, role: e.target.value as any})}
                                  >
                                      <option value="Collector">Cobrador</option>
                                      <option value="Secretary">Secretaria</option>
                                      <option value="Admin">Admin</option>
                                  </select>
                              </div>
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

                      <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Usuario de Acceso</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="Ej. jperez"
                                value={newEmp.username}
                                onChange={e => setNewEmp({...newEmp, username: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">PIN de Acceso</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-widest" 
                                placeholder="1234"
                                maxLength={6}
                                value={newEmp.employeePin}
                                onChange={e => setNewEmp({...newEmp, employeePin: e.target.value})}
                              />
                          </div>
                      </div>

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
