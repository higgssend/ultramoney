import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Banknote, CalendarClock, Calculator, Search } from 'lucide-react';

interface MobileNavProps {
  onMenuClick?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeRipple, setActiveRipple] = useState<string | null>(null);

  const handleTabClick = (tabKey: string, path: string) => {
    // Trigger liquid ripple animation
    setActiveRipple(tabKey);
    setTimeout(() => setActiveRipple(null), 500);

    // Tactile haptic vibration if available on iOS/Android WebKit
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Safe fallback
      }
    }

    if (path) {
      navigate(path);
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { key: 'pagos', label: 'Pagos', path: '/pagos', icon: Wallet },
    // Center Floating Action Button handled separately
    { key: 'prestamos', label: 'Préstamos', path: '/prestamos', icon: CalendarClock },
    { key: 'simulador', label: 'Simulador', path: '/simulador', icon: Calculator },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 md:hidden pointer-events-auto">
      
      {/* Apple Floating Liquid Glass Dock Capsule */}
      <nav className="relative bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl backdrop-saturate-200 border border-white/60 dark:border-white/10 rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] flex items-center justify-between overflow-visible transition-all duration-300">
        
        {/* Apple Top Liquid Ambient Reflection Highlight Line */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent rounded-full pointer-events-none" />

        {/* First 2 Items (Left Side) */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isRippling = activeRipple === item.key;

          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key, item.path)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-300 active:scale-90 select-none ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Background Liquid Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-2xl border border-indigo-500/20 dark:border-indigo-400/20 backdrop-blur-md shadow-inner animate-scale-up" />
              )}

              {/* Liquid Ripple Wave Ring Effect on Click */}
              {isRippling && (
                <span className="absolute inset-0 rounded-2xl bg-indigo-500/30 dark:bg-indigo-400/40 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Icon with liquid bounce */}
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              <span className={`relative z-10 text-[10px] mt-0.5 tracking-tight transition-all ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* CENTER HERO FLOATING LIQUID BUTTON (+ Solicitud) */}
        <div className="relative -mt-6 mx-1 z-20 shrink-0">
          <button
            onClick={() => handleTabClick('solicitud', '/solicitud')}
            className={`relative group w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(79,70,229,0.45)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.5)] border-4 border-slate-100 dark:border-slate-900 active:scale-90 transition-all duration-300 overflow-hidden ${
              location.pathname === '/solicitud' ? 'ring-4 ring-indigo-400/50 scale-105' : 'hover:scale-105'
            }`}
          >
            {/* Liquid Surface Gloss Reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 opacity-90 pointer-events-none" />
            
            {/* Click Liquid Ripple Expansion */}
            {activeRipple === 'solicitud' && (
              <span className="absolute inset-0 rounded-full bg-white/50 animate-ping opacity-90 pointer-events-none" />
            )}

            <Banknote className="w-6 h-6 text-white relative z-10 drop-shadow-md transition-transform duration-300 group-hover:rotate-12" />
          </button>
        </div>

        {/* Last 2 Items (Right Side) */}
        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isRippling = activeRipple === item.key;

          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key, item.path)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-300 active:scale-90 select-none ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Background Liquid Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-2xl border border-indigo-500/20 dark:border-indigo-400/20 backdrop-blur-md shadow-inner animate-scale-up" />
              )}

              {/* Liquid Ripple Wave Ring Effect on Click */}
              {isRippling && (
                <span className="absolute inset-0 rounded-2xl bg-indigo-500/30 dark:bg-indigo-400/40 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Icon with liquid bounce */}
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              <span className={`relative z-10 text-[10px] mt-0.5 tracking-tight transition-all ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

      </nav>
    </div>
  );
};

export default MobileNav;