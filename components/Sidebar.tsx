
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, FilePlus, Users, Banknote, 
  CalendarClock, AlertTriangle, Wallet, Briefcase, 
  TrendingDown, TrendingUp, UserCog, Tags, 
  BookOpen, Smartphone, LogOut, X, FileText, Settings,
  Edit, Calculator, Moon, Sun, Database, ShieldCheck, DollarSign, Package, Landmark
} from 'lucide-react';
import { useAuth, useSettings } from '../context/StoreContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { companySettings, globalCurrency, setGlobalCurrency } = useSettings();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
      return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/configuracion', { state: { activeTab: 'security' } });
    if (window.innerWidth < 768) {
        onClose();
    }
  };

  const menuItems: { name: string; path: string; icon: React.ElementType; highlight?: boolean }[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Facturas', path: '/facturas', icon: FileText },
    { name: 'Consultar', path: '/consultar', icon: Search },
    { name: 'Solicitud', path: '/solicitud', icon: FilePlus },
    { name: 'Simulador', path: '/simulador', icon: Calculator }, 
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Portales de Cliente', path: '/portales-clientes', icon: Smartphone },
    { name: 'Préstamos', path: '/prestamos', icon: Banknote },
    { name: 'Inventario / Stock', path: '/inventario', icon: Package },
    { name: 'Pagos', path: '/pagos', icon: CalendarClock },
    { name: 'Atrasos', path: '/atrasos', icon: AlertTriangle },
    { name: 'Caja', path: '/caja', icon: Wallet },
    { name: 'Cuentas & Bancos', path: '/bancos', icon: Landmark },
    { name: 'Cartera', path: '/cartera', icon: Briefcase },
    { name: 'Gastos', path: '/gastos', icon: TrendingDown },
    { name: 'Ganancia', path: '/ganancia', icon: TrendingUp },
    { name: 'Empleados', path: '/empleados', icon: UserCog },
    { name: 'Clasificación', path: '/clasificacion', icon: Tags },
    { name: 'Cont. Profunda', path: '/contabilidad', icon: BookOpen },
    { name: 'Bitácora', path: '/bitacora', icon: ShieldCheck },
    { name: 'Centro de Migración', path: '/migracion', icon: Database },
    { name: 'Configuración', path: '/configuracion', icon: Settings },
  ];

  const sidebarClasses = `
    fixed md:relative left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none shrink-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  if (!currentUser) return null;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logoultramoney.svg" alt="Ultramoney Logo" className="w-10 h-10 object-contain" />
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent hidden sm:block">Ultramoney</span>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-800 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400'}
                ${item.highlight ? 'mt-4 border border-indigo-100 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : (item.highlight ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')}`} />
                  <span className="text-sm">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Dark Mode Toggle & Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 mb-16 md:mb-0 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preferencia</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setGlobalCurrency(globalCurrency === 'DOP' ? 'USD' : 'DOP')}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                >
                  <DollarSign className="w-3 h-3" /> {globalCurrency}
                </button>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-2 group">
            <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={handleEditProfile}>
                {currentUser?.user_metadata?.avatar_url ? (
                  <img src={currentUser.user_metadata.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border border-indigo-200 dark:border-indigo-700 shrink-0 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-700 shrink-0">
                    {currentUser?.user_metadata?.name ? currentUser.user_metadata.name.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                  </div>
                )}
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-32 group-hover:text-indigo-600 transition-colors">
                      {currentUser?.user_metadata?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Usuario')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{currentUser?.roleId || 'Admin'}</p>
                </div>
            </div>
            <button 
                onClick={handleEditProfile}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm"
                title="Editar Perfil"
            >
                <Edit className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
