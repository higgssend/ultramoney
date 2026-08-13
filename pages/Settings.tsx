import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, Building2, Users, Shield, Plus, Trash2, Check, X, Lock, Mail, Phone, MapPin, CreditCard, Upload, Image as ImageIcon, Activity, Smartphone, Key, UserCheck, User as UserIcon, ChevronLeft, Database, Download, FileJson, Eye, EyeOff, Copy, Briefcase, Edit2 } from 'lucide-react';
import { useAuth, useSettings } from '../context/StoreContext';
import { toast } from 'sonner';
import { Permission, User, ApiKey } from '../types';
import { insforge } from '../lib/insforge';
import { LoanProductsTab } from '../components/LoanProductsTab';
import { CustomSelect } from '../components/CustomSelect';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { companySettings, updateCompanySettings, auditLogs, exportSystemBackup, importSystemBackup } = useSettings();
  const { roles, addRole, updateRole, deleteRole, users, registerUser, currentUser, updateUser, apiKeys, generateApiKey, deleteApiKey, cargos, addCargo, updateCargo, deleteCargo, employees } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'products' | 'roles' | 'users' | 'audit' | 'security' | 'backup' | 'api'>('company');

  // Handle incoming navigation state (e.g. from Sidebar edit profile)
  useEffect(() => {
    const state = location.state as { activeTab?: typeof activeTab } | null;
    if (state?.activeTab) {
        setActiveTab(state.activeTab);
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
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<{name: string, description: string, permissions: Permission[]}>({
    name: '', description: '', permissions: []
  });

  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [newCargo, setNewCargo] = useState<{name: string, description: string}>({
    name: '', description: ''
  });

  // User Form State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<{name: string, username: string, password: string, confirmPassword: string, employeeId: string, roleIds: string[]}>({
    name: '', username: '', password: '', confirmPassword: '', employeeId: '', roleIds: []
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

  // Cloud Backup & Restore States
  const [cloudBackups, setCloudBackups] = useState<{ key: string; name: string; size: number; lastModified: string }[]>([]);
  const [isLoadingCloudBackups, setIsLoadingCloudBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [weeklyBackupEnabled, setWeeklyBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('weekly_backup_enabled') !== 'false';
  });

  const fetchCloudBackups = async () => {
    setIsLoadingCloudBackups(true);
    try {
      const { data, error } = await insforge.storage.from('backups').list();
      if (!error && data) {
        setCloudBackups(data.map((item: { name: string; size?: number; created_at?: string }) => ({
          key: item.name,
          name: item.name,
          size: item.size || 0,
          lastModified: item.created_at || new Date().toISOString()
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCloudBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchCloudBackups();
    }
  }, [activeTab]);

  const toggleWeeklyBackup = (enabled: boolean) => {
    setWeeklyBackupEnabled(enabled);
    localStorage.setItem('weekly_backup_enabled', enabled ? 'true' : 'false');
    toast.success(enabled ? 'Respaldo automático semanal ACTIVADO en el bucket backups' : 'Respaldo automático semanal DESACTIVADO');
  };

  const createFullBackup = async (uploadToBucket = false) => {
    setIsCreatingBackup(true);
    try {
      const [clientsRes, loansRes, txRes, productsRes] = await Promise.all([
        insforge.database.from('clients').select('*'),
        insforge.database.from('loans').select('*'),
        insforge.database.from('transactions').select('*'),
        insforge.database.from('loan_products').select('*')
      ]);

      const backupData = {
        version: '2.0.0',
        platform: 'UltraMoney',
        timestamp: new Date().toISOString(),
        company: companySettings,
        clients: clientsRes.data || [],
        loans: loansRes.data || [],
        transactions: txRes.data || [],
        products: productsRes.data || []
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `ultramoney_backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`;

      if (uploadToBucket) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const { error } = await insforge.storage.from('backups').upload(fileName, blob);
        if (!error) {
          toast.success('¡Copia de seguridad guardada con éxito en el bucket InsForge!');
          fetchCloudBackups();
        } else {
          toast.error(`Error al guardar en bucket: ${error.message}`);
        }
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Copia de seguridad descargada exitosamente en formato JSON');
      }
    } catch (err) {
      toast.error('Error al generar la copia de seguridad');
      console.error(err);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('¿Estás seguro de restaurar esta copia de seguridad? Se sincronizarán los registros almacenados en el archivo con tu base de datos.')) {
      if (event.target) event.target.value = '';
      return;
    }

    setIsRestoringBackup(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.clients && !parsed.loans) {
        toast.error('El archivo no contiene un formato de copia de seguridad válido de UltraMoney');
        return;
      }

      let restoredClients = 0;
      let restoredLoans = 0;

      if (parsed.clients && parsed.clients.length > 0) {
        const { error: cErr } = await insforge.database.from('clients').upsert(parsed.clients);
        if (!cErr) restoredClients = parsed.clients.length;
      }

      if (parsed.loans && parsed.loans.length > 0) {
        const { error: lErr } = await insforge.database.from('loans').upsert(parsed.loans);
        if (!lErr) restoredLoans = parsed.loans.length;
      }

      toast.success(`¡Restauración exitosa! (${restoredClients} clientes y ${restoredLoans} préstamos importados/actualizados).`);
    } catch (err) {
      toast.error('Error al procesar o importar el archivo JSON');
      console.error(err);
    } finally {
      setIsRestoringBackup(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(companyForm);
    toast.success("Datos de la empresa actualizados correctamente.");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `logos/logo_${Date.now()}.${ext}`;
      const { error } = await insforge.storage.from('client-documents').upload(fileName, file);
      if (!error) {
        const { data } = insforge.storage.from('client-documents').getPublicUrl(fileName);
        if (data?.publicUrl) {
          setCompanyForm(prev => ({ ...prev, logoUrl: data.publicUrl }));
          toast.success("Logo subido al bucket exitosamente");
          return;
        }
      }
    } catch (err) {
      console.warn("Storage logo upload fallback:", err);
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyForm(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
      if (editingRoleId) {
          // not implemented updateRole in the ui currently, but if it was, it would go here
      } else {
          addRole({
            id: (newRole.name || '').toLowerCase().replace(/\s+/g, '_'),
            name: newRole.name,
            description: newRole.description,
            permissions: newRole.permissions
          });
      }
      setIsRoleModalOpen(false);
      setNewRole({ name: '', description: '', permissions: [] });
    }
  };

  const handleSaveCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCargo.name) {
        if (editingCargoId) {
            updateCargo(editingCargoId, newCargo);
        } else {
            addCargo({
                id: `TEMP-${Date.now()}`,
                name: newCargo.name,
                description: newCargo.description,
                createdAt: new Date().toISOString()
            });
        }
        setIsCargoModalOpen(false);
        setNewCargo({ name: '', description: '' });
        setEditingCargoId(null);
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
        employeeId: newUser.employeeId || undefined,
        roleIds: newUser.roleIds,
        status: 'Active'
      });
      setIsUserModalOpen(false);
      setNewUser({ name: '', username: '', password: '', confirmPassword: '', employeeId: '', roleIds: [] });
    }
  };

  const toggleUserRole = (roleId: string) => {
    setNewUser(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
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
             onClick={() => setActiveTab('cargos')}
             className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 transition-colors ${activeTab === 'cargos' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
             <Briefcase className="w-5 h-5" /> Cargos y Posiciones
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
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Enlace Personalizado (Portal Empleados / Sucursal)</label>
                          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-800">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3.5 py-2.5 text-xs font-bold font-mono border-r border-slate-200 dark:border-slate-700 flex items-center shrink-0">
                              {window.location.origin}/login/
                            </span>
                            <input 
                              type="text" 
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-mono text-sm focus:outline-none font-bold" 
                              value={companyForm.customLink || ''} 
                              onChange={e => setCompanyForm({...companyForm, customLink: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                              placeholder="mi-empresa" 
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Este será el enlace único que le darás a tus empleados o sucursal para iniciar sesión directamente.</p>
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
                  <button onClick={() => { setEditingRoleId(null); setNewRole({ name: '', description: '', permissions: [] }); setIsRoleModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
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
                          <div className="flex gap-2">
                            {role.id !== 'admin' && (
                              <button onClick={() => { setEditingRoleId(role.id); setNewRole({ name: role.name, description: role.description, permissions: role.permissions }); setIsRoleModalOpen(true); }} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                <Edit2 className="w-5 h-5" />
                              </button>
                            )}
                            {role.id !== 'admin' && (
                              <button onClick={() => deleteRole(role.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
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

          {/* Cargos Management */}
          {activeTab === 'cargos' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800">Cargos y Posiciones</h3>
                    <p className="text-sm text-slate-500">Define los cargos para tus empleados (ej: Supervisor, Cajero, Mensajero).</p>
                  </div>
                  <button onClick={() => { setEditingCargoId(null); setNewCargo({ name: '', description: '' }); setIsCargoModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Crear Cargo
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {cargos && cargos.map(cargo => (
                    <div key={cargo.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                       <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                               <Briefcase className="w-5 h-5 text-indigo-500" /> {cargo.name}
                            </h4>
                            <p className="text-sm text-slate-500">{cargo.description || 'Sin descripción'}</p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => { setEditingCargoId(cargo.id); setNewCargo({ name: cargo.name, description: cargo.description || '' }); setIsCargoModalOpen(true); }} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => deleteCargo(cargo.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                          </div>
                       </div>
                    </div>
                  ))}
                  {(!cargos || cargos.length === 0) && (
                    <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-slate-100">
                        <p className="text-slate-500">No hay cargos registrados. Crea uno para poder asignarlo a tus empleados.</p>
                    </div>
                  )}
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
                           <div className="flex flex-wrap gap-1">
                             {user.roleIds?.map(rid => {
                               const roleName = roles.find(r => r.id === rid)?.name;
                               return roleName ? (
                                 <span key={rid} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200 uppercase font-bold">
                                   {roleName}
                                 </span>
                               ) : null;
                             })}
                             {(!user.roleIds || user.roleIds.length === 0) && (
                                 <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded text-xs border border-rose-100 uppercase font-bold">
                                   Sin Rol
                                 </span>
                             )}
                           </div>
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

          {/* BACKUP & RESTORE TAB */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Header card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Respaldos y Copias de Seguridad</h3>
                    <p className="text-xs text-slate-500">Gestión de copias completas de la base de datos, descargas locales y almacenamiento automatizado en la nube (Bucket InsForge).</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={() => createFullBackup(false)}
                    disabled={isCreatingBackup}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all">
                    <Download className="w-4 h-4" /> {isCreatingBackup ? 'Generando...' : 'Descargar Copia (JSON)'}
                  </button>

                  <button 
                    onClick={() => createFullBackup(true)}
                    disabled={isCreatingBackup}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all">
                    <Upload className="w-4 h-4" /> {isCreatingBackup ? 'Guardando...' : 'Guardar en Bucket Nube'}
                  </button>
                </div>
              </div>

              {/* Automatic Weekly Backup Setting Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold uppercase">
                      PROCESO AUTOMÁTICO
                    </span>
                    <h4 className="font-bold text-base text-white">Respaldo Automático Semanal en Bucket</h4>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Sincronización semanal programada todos los domingos a las 00:00 UTC. Guarda la estructura completa de la cartera, transacciones y clientes directamente en el bucket de almacenamiento seguro <code className="text-indigo-300 font-mono">backups</code>.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <span className="text-xs font-bold text-indigo-200">
                    {weeklyBackupEnabled ? 'Programación Activa' : 'Desactivada'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={weeklyBackupEnabled}
                      onChange={e => toggleWeeklyBackup(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Restore Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-indigo-600" /> Restaurar Copia de Seguridad desde Archivo
                </h4>
                <p className="text-xs text-slate-500">
                  Selecciona un archivo de respaldo <code className="text-indigo-600 font-mono">.json</code> generado previamente por UltraMoney para importar clientes, préstamos y movimientos.
                </p>

                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/40 relative">
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleRestoreFromFile}
                    disabled={isRestoringBackup}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <FileJson className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    {isRestoringBackup ? 'Restaurando registros en la base de datos...' : 'Haz clic o arrastra un archivo de respaldo .json aquí'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Soporta backups estructurados de UltraMoney v2.0+</p>
                </div>
              </div>

              {/* Stored Cloud Backups List (InsForge Bucket) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-600" /> Historial de Respaldos Almacenados en el Bucket ("backups")
                    </h4>
                    <p className="text-xs text-slate-500">Archivos guardados en el almacenamiento en la nube de InsForge.</p>
                  </div>
                  <button 
                    onClick={fetchCloudBackups}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200">
                    Actualizar Lista
                  </button>
                </div>

                {isLoadingCloudBackups ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold">Cargando lista de respaldos desde el bucket InsForge...</div>
                ) : cloudBackups.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    No hay copias de seguridad guardadas aún en el bucket <code className="font-mono text-indigo-500 font-bold">backups</code>. Presiona "Guardar en Bucket Nube" para crear la primera.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="px-4 py-3">Nombre del Archivo</th>
                          <th className="px-4 py-3">Tamaño</th>
                          <th className="px-4 py-3">Fecha de Modificación</th>
                          <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cloudBackups.map(b => (
                          <tr key={b.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{b.name}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">{(b.size / 1024).toFixed(1)} KB</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(b.lastModified).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={async () => {
                                  try {
                                    const { data } = insforge.storage.from('backups').getPublicUrl(b.key);
                                    if (data?.publicUrl) {
                                      window.open(data.publicUrl, '_blank');
                                    } else {
                                      toast.error('No se pudo obtener el enlace de descarga');
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs hover:bg-indigo-100">
                                Descargar Archivo
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
               <h3 className="font-bold text-lg text-slate-800">{editingRoleId ? 'Editar Rol' : 'Crear Nuevo Rol'}</h3>
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

      {isCargoModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-800">{editingCargoId ? 'Editar Cargo' : 'Crear Nuevo Cargo'}</h3>
               <button onClick={() => setIsCargoModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             
             <form onSubmit={handleSaveCargo} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cargo</label>
                  <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Oficial de Cobros"
                    value={newCargo.name} onChange={e => setNewCargo({...newCargo, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Breve descripción del puesto"
                    value={newCargo.description} onChange={e => setNewCargo({...newCargo, description: e.target.value})} />
               </div>
               
               <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 mt-4">
                 Guardar Cargo
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
                        <input type="text" required className="w-full pl-9 pr-[120px] py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="ej. juanperez"
                          value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '')})} />
                        {companyForm.customLink && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@{companyForm.customLink}</span>
                        )}
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
                   <label className="block text-sm font-medium text-slate-700 mb-1">Empleado Vinculado (Opcional)</label>
                   <CustomSelect 
                     className="w-full"
                     value={newUser.employeeId || ''} 
                     onChange={e => setNewUser({...newUser, employeeId: e})}
                     options={[
                       { value: '', label: 'Seleccione un empleado...' },
                       ...employees.map(e => ({ value: e.id, label: e.name }))
                     ]}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Roles Asignados</label>
                   <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                     {roles.map(r => (
                       <label key={r.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-slate-50">
                         <input 
                           type="checkbox" 
                           checked={newUser.roleIds.includes(r.id)}
                           onChange={() => toggleUserRole(r.id)}
                           className="rounded text-indigo-600 focus:ring-indigo-500"
                         />
                         <span className="text-sm text-slate-700">{r.name}</span>
                       </label>
                     ))}
                   </div>
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
