import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, FilePlus, Users, Banknote, 
  CalendarClock, AlertTriangle, Wallet, Briefcase, 
  TrendingDown, TrendingUp, UserCog, Tags, 
  BookOpen, Smartphone, LogOut, X, FileText, Settings,
  Edit, Calculator, Moon, Sun, Database, ShieldCheck, DollarSign, Package, Landmark, Building2,
  LayoutGrid, List, ChevronUp, ChevronRight, User as UserIcon, ArrowLeftRight, LineChart,
  Store, MapPin, Scale, Lock, Activity, ShieldAlert
} from 'lucide-react';
import { useAuth, useSettings, useAccounting } from '../context/StoreContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { globalCurrency, setGlobalCurrency } = useSettings();
  const { bankDeposits } = useAccounting();
  const pendingDepositsCount = bankDeposits.filter(d => d.status === 'Pendiente').length;
  const navigate = useNavigate();
  const [drawerLayout, setDrawerLayout] = useState<'grid' | 'list'>('grid');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Prevent background body scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems: { name: string; path: string; icon: React.ElementType; highlight?: boolean; badge?: number }[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Facturas', path: '/facturas', icon: FileText },
    { name: 'Consultar', path: '/consultar', icon: Search },
    { name: 'Solicitud', path: '/solicitud', icon: FilePlus },
    { name: 'Simulador', path: '/simulador', icon: Calculator }, 
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Portales de Cliente', path: '/portales-clientes', icon: Smartphone },
    { name: 'Comercios & POS', path: '/comercios', icon: Store },
    { name: 'Préstamos', path: '/prestamos', icon: Banknote },
    { name: 'Inventario / Stock', path: '/inventario', icon: Package },
    { name: 'Bóveda & Garantías', path: '/boveda', icon: Lock },
    { name: 'Pagos', path: '/pagos', icon: CalendarClock },
    { name: 'Atrasos', path: '/atrasos', icon: AlertTriangle },
    { name: 'Alerta Temprana EWS', path: '/alerta-temprana', icon: Activity },
    { name: 'Radar Antifraude', path: '/antifraude', icon: ShieldAlert },
    { name: 'Cobranza Legal', path: '/legal', icon: Scale },
    { name: 'Rutas & Cobradores', path: '/rutas', icon: MapPin },
    { name: 'Caja', path: '/caja', icon: Wallet },
    { name: 'Cuentas & Bancos', path: '/bancos', icon: Landmark },
    { name: 'Conciliación Bancaria', path: '/conciliacion', icon: ArrowLeftRight, badge: pendingDepositsCount },
    { name: 'Cartera', path: '/cartera', icon: Briefcase },
    { name: 'Gastos', path: '/gastos', icon: TrendingDown },
    { name: 'Ganancias', path: '/ganancias', icon: TrendingUp },
    { name: 'Flujo de Caja', path: '/flujo-caja', icon: LineChart },
    { name: 'Empleados', path: '/empleados', icon: UserCog },
    { name: 'Clasificación', path: '/clasificacion', icon: Tags },
    { name: 'Cont. Profunda', path: '/contabilidad', icon: BookOpen },
    { name: 'Bitácora', path: '/bitacora', icon: ShieldCheck },
    { name: 'Buró de Crédito', path: '/buro-credito', icon: Building2 },
    { name: 'Centro de Migración', path: '/migracion', icon: Database },
  ];

  const sidebarClasses = `
    fixed md:relative left-0 top-0 h-screen w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex flex-col z-[9999] md:z-50 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none shrink-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  if (!currentUser) return null;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[9998] md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logoultramoney.svg" alt="Ultramoney Logo" className="w-10 h-10 object-contain" />
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Ultramoney</span>
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95 flex items-center justify-center border border-slate-200 dark:border-slate-700"
            title="Cerrar Menú"
            aria-label="Cerrar Menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y py-4 px-2.5 scrollbar-hide">
          {/* Mobile Drawer View Mode Switcher */}
          <div className="md:hidden flex items-center justify-between px-3 py-2 mb-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Módulos</span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setDrawerLayout('grid')} 
                className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${drawerLayout === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
              <button 
                onClick={() => setDrawerLayout('list')} 
                className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${drawerLayout === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Vista Lista"
              >
                <List className="w-3.5 h-3.5" /> Lista
              </button>
            </div>
          </div>

          <div className={drawerLayout === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 gap-2.5 md:flex md:flex-col md:space-y-1 md:gap-0" : "flex flex-col space-y-1"}>
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) => `
                  flex transition-all duration-200 group active:scale-95
                  ${drawerLayout === 'grid' 
                    ? 'flex-col md:flex-row items-center justify-center md:justify-start min-h-[84px] md:min-h-0 p-2.5 md:p-3 text-center md:text-left rounded-2xl md:rounded-xl border md:border-none shadow-xs md:shadow-none' 
                    : 'flex-row items-center px-3 py-3 rounded-xl border border-transparent'}
                  ${isActive 
                    ? 'bg-indigo-600 text-white border-indigo-600 md:bg-indigo-50 md:dark:bg-indigo-900/30 md:text-indigo-700 md:dark:text-indigo-400 font-bold shadow-md shadow-indigo-200 dark:shadow-none' 
                    : 'bg-slate-50 dark:bg-slate-800/60 md:bg-transparent border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative shrink-0 flex items-center justify-center ${drawerLayout === 'grid' ? 'w-10 h-10 md:w-auto md:h-auto rounded-xl md:rounded-none mb-1 md:mb-0 md:mr-3' : 'mr-3'} ${drawerLayout === 'grid' && !isActive ? 'bg-white dark:bg-slate-800 md:bg-transparent shadow-xs md:shadow-none' : ''}`}>
                      <item.icon className={`${drawerLayout === 'grid' ? 'w-5 h-5 md:w-5 md:h-5' : 'w-5 h-5'} ${isActive ? 'text-white md:text-indigo-600 md:dark:text-indigo-400' : 'text-indigo-600 dark:text-indigo-400 md:text-slate-400 group-hover:text-indigo-500'}`} />
                      {item.badge && item.badge > 0 && drawerLayout === 'grid' ? (
                        <span className="md:hidden absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-900" />
                      ) : null}
                    </div>
                    <span className={`text-[11px] md:text-sm leading-snug font-bold md:font-medium tracking-tight truncate w-full ${drawerLayout === 'grid' ? 'text-center' : 'text-left'}`}>
                      {item.name}
                    </span>
                    {item.badge && item.badge > 0 ? (
                      <span className={`hidden md:inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-extrabold rounded-full ${
                        isActive 
                          ? 'bg-white text-indigo-700' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Footer Profile & Preferences Button (Raised above mobile bottom nav bar) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 mb-24 md:mb-0 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {currentUser?.user_metadata?.avatar_url ? (
                <img src={currentUser.user_metadata.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-indigo-500 shrink-0 object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {currentUser?.user_metadata?.name ? currentUser.user_metadata.name.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                </div>
              )}
              <div className="overflow-hidden text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate w-28 group-hover:text-indigo-600 transition-colors">
                  {currentUser?.user_metadata?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Usuario')}
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold capitalize">{currentUser?.roleId || 'Administrador'}</p>
              </div>
            </div>

            <div className="p-2 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <ChevronUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </aside>

      {/* Profile & Options Action Sheet Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsProfileModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Mi Perfil y Ajustes</h3>
                  <p className="text-xs text-slate-400">Opciones rápidas y configuración</p>
                </div>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info Badge */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                {currentUser?.user_metadata?.name ? currentUser.user_metadata.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{currentUser?.user_metadata?.name || 'Usuario'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase">
                  {currentUser?.roleId || 'Administrador'}
                </span>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="space-y-2">
              <button 
                onClick={() => { navigate('/configuracion'); setIsProfileModalOpen(false); onClose(); }} 
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-all font-semibold text-sm border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  <span>Configuración General</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button 
                onClick={() => { navigate('/configuracion', { state: { activeTab: 'security' } }); setIsProfileModalOpen(false); onClose(); }} 
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-all font-semibold text-sm border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Edit className="w-4 h-4 text-indigo-500" />
                  <span>Editar Perfil y Seguridad</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Currency & Theme Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => setGlobalCurrency(globalCurrency === 'DOP' ? 'USD' : 'DOP')}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 transition-all"
                >
                  <DollarSign className="w-4 h-4 text-indigo-500" /> Moneda: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{globalCurrency}</span>
                </button>

                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 transition-all"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={() => { setIsProfileModalOpen(false); handleLogout(); }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-sm border border-rose-100 dark:border-rose-900/50 transition-all"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
