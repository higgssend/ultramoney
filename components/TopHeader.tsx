import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, Menu, X, Check, CheckCircle2, User, FileText, Banknote, ShieldAlert, Landmark } from 'lucide-react';
import { useClients, useLoans, useSettings } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { BankAccountsModal } from './BankAccountsModal';

interface TopHeaderProps {
  onMenuClick?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useSettings();
  const { clients } = useClients();
  const { loans } = useLoans();
  const navigate = useNavigate();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  interface SearchResultItem {
    type: 'client' | 'loan';
    id: string;
    title: string;
    subtitle: string;
  }

  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const mobileAddRef = useRef<HTMLDivElement>(null);
  const desktopAddRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideNotif = (mobileNotifRef.current && mobileNotifRef.current.contains(target)) ||
                            (desktopNotifRef.current && desktopNotifRef.current.contains(target));
      if (!isInsideNotif) setIsNotifOpen(false);

      const isInsideAdd = (mobileAddRef.current && mobileAddRef.current.contains(target)) ||
                          (desktopAddRef.current && desktopAddRef.current.contains(target));
      if (!isInsideAdd) setIsAddOpen(false);

      if (searchRef.current && !searchRef.current.contains(target)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    
    // Search Clients
    const foundClients: SearchResultItem[] = clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.cedula && c.cedula.includes(q)) ||
      (c.phone && c.phone.includes(q))
    ).map(c => ({ type: 'client' as const, id: c.id, title: c.name, subtitle: `Cédula: ${c.cedula || 'N/A'}` })).slice(0, 3);
    
    // Search Loans
    const foundLoans: SearchResultItem[] = loans.filter(l => 
      (l.clientName || '').toLowerCase().includes(q)
    ).map(l => ({ type: 'loan' as const, id: l.id, title: `Préstamo de ${l.clientName}`, subtitle: `Balance: $${l.remainingBalance}` })).slice(0, 3);
    
    setSearchResults([...foundClients, ...foundLoans]);
  }, [searchQuery, clients, loans]);

  const handleSearchResultClick = (result: SearchResultItem) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    if (result.type === 'client') navigate(`/clientes/${result.id}`);
    if (result.type === 'loan') navigate(`/prestamos`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-4 py-2.5 lg:py-3 shadow-sm">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
        
        {/* Top Mobile Row / Desktop Left Block */}
        <div className="flex items-center justify-between w-full lg:w-auto shrink-0 gap-2">
          {/* Brand Logo & Name (Mobile Only) */}
          <div className="flex items-center gap-2 cursor-pointer lg:hidden" onClick={() => navigate('/')}>
            <img src="/logoultramoney.svg" alt="Ultramoney" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
            <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Ultramoney</span>
          </div>

          {/* Mobile Action Buttons (Add + Notif + Menu) */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {/* Mobile Add Button */}
            <div className="relative" ref={mobileAddRef}>
              <button 
                onClick={() => setIsAddOpen(!isAddOpen)}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center border border-indigo-600"
                title="Crear nuevo"
                aria-label="Crear nuevo"
              >
                <Plus className="w-4 h-4" />
              </button>

              {isAddOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crear Nuevo</p>
                  </div>
                  <button onClick={() => { navigate('/clientes'); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Cliente
                  </button>
                  <button onClick={() => { navigate('/solicitud'); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Préstamo
                  </button>
                  <button onClick={() => { navigate('/pagos'); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                    <Banknote className="w-4 h-4" /> Pago
                  </button>
                  <button onClick={() => { setIsBankModalOpen(true); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                    <Landmark className="w-4 h-4" /> Cuentas / Cajas
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Notifications Button */}
            <div className="relative" ref={mobileNotifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all relative flex items-center justify-center active:scale-95"
                title="Notificaciones"
                aria-label="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[8px] font-bold text-white items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="fixed right-2 top-16 w-[calc(100vw-1rem)] max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notificaciones</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            markAllNotificationsAsRead();
                          }} 
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Leídas
                        </button>
                      )}
                      <button onClick={() => setIsNotifOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No tienes notificaciones por el momento
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 relative group transition-colors ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${n.type === 'error' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : n.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                              {n.type === 'warning' ? <ShieldAlert className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-slate-400 font-medium">{new Date(n.date).toLocaleString()}</span>
                                <div className="flex items-center gap-2">
                                  {n.link && (
                                    <button onClick={() => { navigate(n.link!); setIsNotifOpen(false); }} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                      Ver
                                    </button>
                                  )}
                                  {!n.read && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        markNotificationAsRead(n.id);
                                      }} 
                                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 rounded-md transition-colors"
                                    >
                                      Marcar leída
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button 
              onClick={onMenuClick} 
              className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 active:scale-95 border border-slate-200 dark:border-slate-700"
              aria-label="Abrir Menú"
              title="Abrir Menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Search Bar (Full Width on Mobile Row 2, Middle on Desktop) */}
        <div className="w-full flex-1 max-w-2xl mx-auto" ref={searchRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Buscar clientes, préstamos o cédulas..."
              className="block w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-xs sm:text-sm text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Search Dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">No se encontraron resultados para "{searchQuery}"</div>
                ) : (
                  searchResults.map((res, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSearchResultClick(res)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="mt-0.5 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        {res.type === 'client' ? <User className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{res.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{res.subtitle}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Right Block: Add & Notifications Buttons (Only visible on Desktop lg) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Desktop Add Button */}
          <div className="relative" ref={desktopAddRef}>
            <button 
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center border border-indigo-600"
              title="Crear nuevo"
              aria-label="Crear nuevo"
            >
              <Plus className="w-5 h-5" />
            </button>

            {isAddOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crear Nuevo</p>
                </div>
                <button onClick={() => { navigate('/clientes'); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> Cliente
                </button>
                <button onClick={() => { navigate('/solicitud'); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Préstamo
                </button>
                <button onClick={() => { navigate('/pagos'); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                  <Banknote className="w-4 h-4" /> Pago
                </button>
                <button onClick={() => { setIsBankModalOpen(true); setIsAddOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> Cuentas / Cajas
                </button>
              </div>
            )}
          </div>

          {/* Desktop Notifications Button */}
          <div className="relative" ref={desktopNotifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all relative flex items-center justify-center active:scale-95"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[9px] font-bold text-white items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notificaciones</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          markAllNotificationsAsRead();
                        }} 
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Leídas
                      </button>
                    )}
                    <button onClick={() => setIsNotifOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[380px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No tienes notificaciones por el momento
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 relative group transition-colors ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${n.type === 'error' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : n.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {n.type === 'warning' ? <ShieldAlert className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-400 font-medium">{new Date(n.date).toLocaleString()}</span>
                              <div className="flex items-center gap-2">
                                {n.link && (
                                  <button onClick={() => { navigate(n.link!); setIsNotifOpen(false); }} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                    Ver
                                  </button>
                                )}
                                {!n.read && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      markNotificationAsRead(n.id);
                                    }} 
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 rounded-md transition-colors"
                                  >
                                    Marcar leída
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      <BankAccountsModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} />
    </div>
  );
};

export default TopHeader;
