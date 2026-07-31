import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, Building2, Users, Shield, Plus, Trash2, Check, X, Lock, Mail, Phone, MapPin, CreditCard, Upload, Image as ImageIcon, Activity, Smartphone, Key, UserCheck, User as UserIcon, ChevronLeft, Database, Download, FileJson, Eye, EyeOff, Copy } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { toast } from 'sonner';
import { Permission, User, ApiKey } from '../types';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { companySettings, updateCompanySettings, roles, addRole, deleteRole, users, registerUser, auditLogs, currentUser, updateUser, exportSystemBackup, importSystemBackup, apiKeys, generateApiKey, deleteApiKey } = useStore();
  const [activeTab, setActiveTab] = useState<'company' | 'products' | 'roles' | 'users' | 'audit' | 'security' | 'backup' | 'api'>('company');

  // Handle incoming navigation state (e.g. from Sidebar edit profile)
  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
        setActiveTab((location.state as any).activeTab);
    }
  }, [location]);

  // Company Form State
  const [companyForm, setCompanyForm] = useState(companySettings);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: false // Mock state
  });

  // Role Form State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<{name: string, description: string, permissions: Permission[]}>({
    name: '', description: '', permissions: []
  });

  // User Form State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', username: '', password: '', confirmPassword: '', roleId: 'collector'
  });

  const availablePermissions: {id: Permission, label: string}[] = [
    { id: 'manage_loans', label: 'Gestionar Préstamos' },
    { id: 'manage_clients', label: 'Gestionar Clientes' },
    { id: 'manage_users', label: 'Gestionar Usuarios' },
    { id: 'manage_settings', label: 'Configuración Global' },
    { id: 'view_reports', label: 'Ver Reportes Financieros' },
    { id: 'approve_loans', label: 'Aprobar Solicitudes' },
  ];

  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({...prev, [id]: !prev[id]}));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(companyForm);
    toast.success("Datos de la empresa actualizados correctamente.");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyForm(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Mock validation
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
        toast.error("Las nuevas contraseñas no coinciden.");
        return;
    }

    if (securityForm.newPassword && securityForm.currentPassword !== currentUser.password) {
        toast.error("La contraseña actual es incorrecta.");
        return;
    }

    // Update Logic
    const updatedUser: User = {
        ...currentUser,
        name: securityForm.name,
        email: securityForm.email,
        password: securityForm.newPassword ? securityForm.newPassword : currentUser.password
    };

    updateUser(updatedUser);
    
    // Reset password fields
    setSecurityForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    }));

    toast.success("Perfil y seguridad actualizados correctamente.");
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if(newRole.name) {
      addRole({
        id: newRole.name.toLowerCase().replace(/\s+/g, '_'),
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      });
      setIsRoleModalOpen(false);
      setNewRole({ name: '', description: '', permissions: [] });
    }
  };

  const togglePermission = (perm: Permission) => {
    setNewRole(prev => {
      const hasPerm = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: hasPerm 
          ? prev.permissions.filter(p => p !== perm)
          : [...prev.permissions, perm]
      };
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    
    if(newUser.name && newUser.username && newUser.password) {
      registerUser({
        id: Date.now().toString(),
        name: newUser.name,
        username: newUser.username,
        email: '', // Optional in new type def
        password: newUser.password,
        roleId: newUser.roleId || 'collector',
        status: 'Active'
      });
      setIsUserModalOpen(false);
      setNewUser({ name: '', username: '', password: '', confirmPassword: '', roleId: 'collector' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
            <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Configuración</h2>
            <p className="text-slate-500">Administra los datos de tu negocio y el acceso al sistema.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-2">
           <button 
             onClick={() => setActiveTab('company')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'company' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Building2 className="w-5 h-5" /> Datos del Negocio
           </button>

           <button 
             onClick={() => setActiveTab('products')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Briefcase className="w-5 h-5" /> Productos de Préstamo
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Lock className="w-5 h-5" /> Seguridad y Acceso
           </button>
           <button 
             onClick={() => setActiveTab('roles')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Shield className="w-5 h-5" /> Roles y Permisos
           </button>
           <button 
             onClick={() => setActiveTab('users')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Users className="w-5 h-5" /> Usuarios
           </button>
           <button 
             onClick={() => setActiveTab('audit')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Activity className="w-5 h-5" /> Auditoría del Sistema
           </button>
           <button 
             onClick={() => setActiveTab('backup')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'backup' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Database className="w-5 h-5" /> Respaldo y Copias de Seguridad
           </button>
           <button 
             onClick={() => setActiveTab('api')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'api' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Key className="w-5 h-5" /> API y Desarrolladores
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fade-in">
               <h3 className="font-bold text-lg text-slate-800 mb-6 pb-2 border-b border-slate-100">Información Fiscal y de Contacto</h3>
               <form onSubmit={handleSaveCompany} className="space-y-6">
                  
                  {/* Logo Upload Section */}
                  <div className="flex flex-col items-center sm:flex-row gap-6 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group shrink-0">
                        {companyForm.logoUrl ? (
                            <img src={companyForm.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700">Logo de la Empresa</h4>
                        <p className="text-sm text-slate-500 mb-3">Este logo aparecerá en las facturas y recibos impresos.</p>
                        <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors inline-flex items-center gap-2 shadow-sm">
                            <Upload className="w-4 h-4" /> Seleccionar Imagen
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">RNC / ID Fiscal</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            value={companyForm.rnc} onChange={e => setCompanyForm({...companyForm, rnc: e.target.value})} />
                        </div>
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Eslogan de la Empresa</label>
                        <div className="relative">
                          <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            value={companyForm.slogan || ''} onChange={e => setCompanyForm({...companyForm, slogan: e.target.value})} placeholder="Tu socio financiero de confianza" />
                        </div>
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input type="email" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} />
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Términos y Condiciones (Para Facturas)</label>
                     <textarea className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" rows={4}
                        value={companyForm.termsAndConditions} onChange={e => setCompanyForm({...companyForm, termsAndConditions: e.target.value})} />
                  </div>

                  <div className="flex justify-end">
                     <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-sm">
                        <Save className="w-5 h-5" /> Guardar Cambios
                     </button>
                  </div>
               </form>
            </div>
          )}


          {activeTab === 'products' && (
              <LoanProductsTab />
          )}

          {/* Security & Profile Settings */}
          {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                  {/* Profile Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-indigo-500" /> Perfil de Usuario
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Mostrado</label>
                              <input 
                                  type="text" 
                                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  value={securityForm.name}
                                  onChange={e => setSecurityForm({...securityForm, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Rol del Sistema</label>
                              <input 
                                  type="text" 
                                  disabled 
                                  className="w-full px-4 py-2 border rounded-lg bg-slate-100 text-slate-500 capitalize"
                                  value={currentUser?.roleId || ''}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Credentials Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                          <Key className="w-5 h-5 text-amber-500" /> Credenciales de Acceso
                      </h3>
                      <form onSubmit={handleSaveSecurity} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico (Login)</label>
                              <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                  <input 
                                      type="email" 
                                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      value={securityForm.email}
                                      onChange={e => setSecurityForm({...securityForm, email: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50 mt-4">
                              <div className="md:col-span-2">
                                  <p className="text-sm text-slate-500 mb-2">Cambiar Contraseña (Dejar en blanco para mantener la actual)</p>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña Actual</label>
                                  <input 
                                      type="password" 
                                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      placeholder="••••••••"
                                      value={securityForm.currentPassword}
                                      onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Contraseña</label>
                                  <input 
                                      type="password" 
                                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      placeholder="Nueva contraseña segura"
                                      value={securityForm.newPassword}
                                      onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                                  />
                              </div>
                              <div className="md:col-start-2">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Nueva Contraseña</label>
                                  <input 
                                      type="password" 
                                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      placeholder="Repite la nueva contraseña"
                                      value={securityForm.confirmPassword}
                                      onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div className="flex justify-end pt-4">
                              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                                  <Save className="w-5 h-5" /> Actualizar Credenciales
                              </button>
                          </div>
                      </form>
                  </div>

                  {/* 2FA Card (Mock) */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 opacity-90">
                       <h3 className="font-bold text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-emerald-500" /> Verificación en 2 Pasos (2FA)
                      </h3>
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="font-medium text-slate-700">Autenticación por App (Google Authenticator)</p>
                              <p className="text-sm text-slate-500">Aumenta la seguridad solicitando un código temporal al iniciar sesión.</p>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={securityForm.twoFactorEnabled}
                                onChange={e => setSecurityForm({...securityForm, twoFactorEnabled: e.target.checked})} 
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </div>
                      </div>
                      {securityForm.twoFactorEnabled && (
                          <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 text-sm flex items-center gap-3 animate-fade-in">
                              <Shield className="w-5 h-5" />
                              2FA está activado. Se solicitará un código en el próximo inicio de sesión.
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* Roles Management */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800">Roles y Permisos</h3>
                    <p className="text-sm text-slate-500">Define quién puede hacer qué en el sistema.</p>
                  </div>
                  <button onClick={() => setIsRoleModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Crear Rol
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {roles.map(role => (
                    <div key={role.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                               <Shield className="w-5 h-5 text-indigo-500" /> {role.name}
                            </h4>
                            <p className="text-sm text-slate-500">{role.description}</p>
                          </div>
                          {role.id !== 'admin' && (
                            <button onClick={() => deleteRole(role.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                       </div>
                       
                       <div className="flex flex-wrap gap-2">
                          {role.permissions.map(perm => (
                            <span key={perm} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium border border-slate-200">
                              {availablePermissions.find(p => p.id === perm)?.label || perm}
                            </span>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Users Management */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800">Gestión de Usuarios</h3>
                    <p className="text-sm text-slate-500">Cuentas de acceso para tus empleados.</p>
                  </div>
                  <button onClick={() => setIsUserModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nuevo Usuario
                  </button>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
                     <tr>
                       <th className="px-6 py-4 font-semibold">Usuario</th>
                       <th className="px-6 py-4 font-semibold">Rol</th>
                       <th className="px-6 py-4 font-semibold">Estado</th>
                       <th className="px-6 py-4 font-semibold">Login ID</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {users.map(user => (
                       <tr key={user.id} className="hover:bg-slate-50">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                               {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                             </div>
                             <span className="font-medium text-slate-800">{user.name}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200 uppercase font-bold">
                             {roles.find(r => r.id === user.roleId)?.name}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Active
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-500">{user.username || user.email}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

           {/* Audit Logs */}
           {activeTab === 'audit' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" /> Registro de Auditoría
                  </h3>
                  <p className="text-sm text-slate-500">Historial completo de acciones y cambios en el sistema.</p>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
                        <tr>
                        <th className="px-6 py-4 font-semibold">Fecha / Hora</th>
                        <th className="px-6 py-4 font-semibold">Usuario</th>
                        <th className="px-6 py-4 font-semibold">Acción</th>
                        <th className="px-6 py-4 font-semibold">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-bold text-slate-700 text-sm">{log.userName}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-xs font-medium">
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate" title={log.details}>
                                {log.details}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Key className="w-6 h-6 text-indigo-600" />
                          API y Desarrolladores
                      </h3>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                      <div className="mb-8">
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Generar Nueva API Key</h4>
                          <p className="text-sm text-slate-500 mb-4">Las API Keys te permiten conectar aplicaciones externas, scripts y automatizaciones directamente a tu base de datos y sistema de UltraMoney.</p>
                          <div className="flex gap-4 items-end">
                              <div className="flex-1">
                                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre de la Aplicación/Key</label>
                                  <input 
                                      type="text"
                                      value={newApiKeyName}
                                      onChange={e => setNewApiKeyName(e.target.value)}
                                      placeholder="Ej: Integración Contable"
                                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                              </div>
                              <button 
                                  onClick={() => {
                                      if(newApiKeyName) {
                                          generateApiKey(newApiKeyName);
                                          setNewApiKeyName('');
                                      } else {
                                          toast.error('Ingresa un nombre para la API Key');
                                      }
                                  }}
                                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                              >
                                  Generar Key
                              </button>
                          </div>
                      </div>

                      <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Tus API Keys</h4>
                          {apiKeys.length === 0 ? (
                              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                  <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  <p className="text-slate-500 text-sm">No has generado ninguna API Key todavía.</p>
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  {apiKeys.map(key => (
                                      <div key={key.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl gap-4">
                                          <div>
                                              <p className="font-bold text-slate-800 dark:text-white">{key.name}</p>
                                              <p className="text-xs text-slate-500">Creado: {new Date(key.createdAt).toLocaleString()}</p>
                                          </div>
                                          <div className="flex items-center gap-2 w-full md:w-auto">
                                              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 flex-1 md:w-64 font-mono text-sm text-slate-600 dark:text-slate-300">
                                                  {visibleKeys[key.id] ? key.key : 'sk_ultra_••••••••••••••••••••'}
                                              </div>
                                              <button onClick={() => toggleKeyVisibility(key.id)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                  {visibleKeys[key.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                              </button>
                                              <button onClick={() => copyToClipboard(key.key)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Copiar">
                                                  <Copy className="w-5 h-5" />
                                              </button>
                                              <button onClick={() => deleteApiKey(key.id)} className="p-2 text-rose-400 hover:text-rose-600 transition-colors" title="Revocar">
                                                  <Trash2 className="w-5 h-5" />
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>

      {/* ... (Modals remain unchanged) ... */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-800">Crear Nuevo Rol</h3>
               <button onClick={() => setIsRoleModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             
             <form onSubmit={handleSaveRole} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Rol</label>
                  <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Supervisor de Caja"
                    value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Breve descripción de responsabilidades"
                    value={newRole.description} onChange={e => setNewRole({...newRole, description: e.target.value})} />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Permisos Asignados</label>
                 <div className="grid grid-cols-2 gap-2">
                   {availablePermissions.map(perm => (
                     <div 
                        key={perm.id} 
                        onClick={() => togglePermission(perm.id)}
                        className={`p-2 border rounded-lg cursor-pointer text-sm flex items-center gap-2 transition-colors ${newRole.permissions.includes(perm.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                     >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${newRole.permissions.includes(perm.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                           {newRole.permissions.includes(perm.id) && <Check className="w-3 h-3" />}
                        </div>
                        {perm.label}
                     </div>
                   ))}
                 </div>
               </div>

               <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 mt-4">
                 Guardar Rol
               </button>
             </form>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-800">Registrar Usuario</h3>
               <button onClick={() => setIsUserModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             
             <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                   <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                     value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                </div>
                
                {/* Username Field */}
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Usuario (Login)</label>
                   <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input type="text" required className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="ej. juanperez"
                        value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                   </div>
                </div>

                {/* Password Fields */}
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                     <input type="password" required className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                     <input type="password" required className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={newUser.confirmPassword} onChange={e => setNewUser({...newUser, confirmPassword: e.target.value})} />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Rol Asignado</label>
                   <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                     value={newUser.roleId} onChange={e => setNewUser({...newUser, roleId: e.target.value})}>
                     {roles.map(r => (
                       <option key={r.id} value={r.id}>{r.name}</option>
                     ))}
                   </select>
                </div>

                <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 mt-4">
                  Crear Usuario
                </button>
             </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
