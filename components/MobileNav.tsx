import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';
import { 
  Home01Icon, 
  Home02Icon, 
  Wallet01Icon, 
  CreditCardIcon, 
  Add01Icon, 
  Calendar01Icon, 
  CalendarCheckIcon, 
  Menu01Icon,
  Menu02Icon
} from '@hugeicons/core-free-icons';

interface MobileNavProps {
  onMenuClick?: () => void;
}

interface NavItem {
  key: string;
  label: string;
  path: string;
  outlineIcon: IconSvgElement;
  activeIcon: IconSvgElement;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onMenuClick }) => {
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

    if (tabKey === 'menu') {
      if (onMenuClick) {
        onMenuClick();
      }
      return;
    }

    if (path) {
      navigate(path);
    }
  };

  const navItems: NavItem[] = [
    { 
      key: 'dashboard', 
      label: 'Inicio', 
      path: '/dashboard', 
      outlineIcon: Home01Icon, 
      activeIcon: Home02Icon 
    },
    { 
      key: 'pagos', 
      label: 'Pagos', 
      path: '/pagos', 
      outlineIcon: Wallet01Icon, 
      activeIcon: CreditCardIcon 
    },
    // Center Floating Action Button handled separately
    { 
      key: 'prestamos', 
      label: 'Préstamos', 
      path: '/prestamos', 
      outlineIcon: Calendar01Icon, 
      activeIcon: CalendarCheckIcon 
    },
    { 
      key: 'menu', 
      label: 'Menú', 
      path: '', 
      outlineIcon: Menu01Icon, 
      activeIcon: Menu02Icon 
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 md:hidden pointer-events-auto">
      
      {/* Apple Floating Liquid Glass Dock Capsule */}
      <nav className="relative liquidglass flex items-center justify-between px-3.5 py-2 overflow-visible transition-all duration-300">
        
        {/* Apple Top Liquid Ambient Reflection Highlight Line */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/40 to-transparent rounded-full pointer-events-none" />

        {/* First 2 Items (Left Side: Inicio, Pagos) */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.path;
          const isRippling = activeRipple === item.key;

          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key, item.path)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-full transition-all duration-300 active:scale-90 hover:bg-slate-900/5 dark:hover:bg-white/10 select-none ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
                  : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white font-medium'
              }`}
            >
              {/* Active Background Liquid Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-indigo-600/10 dark:bg-white/15 rounded-full backdrop-blur-xl animate-scale-up" />
              )}

              {/* Liquid Ripple Wave Ring Effect on Click */}
              {isRippling && (
                <span className="absolute inset-0 rounded-full bg-indigo-500/20 dark:bg-white/20 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Icon */}
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <HugeiconsIcon 
                  icon={isActive ? item.activeIcon : item.outlineIcon} 
                  size={22}
                  strokeWidth={isActive ? 2 : 1.6}
                  className="w-5 h-5 transition-all duration-300" 
                />
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
            className={`relative group w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(79,70,229,0.45)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.6)] border-4 border-white dark:border-slate-900 active:scale-90 transition-all duration-300 overflow-hidden ${
              location.pathname === '/solicitud' ? 'ring-4 ring-indigo-400/60 scale-105' : 'hover:scale-105'
            }`}
            title="Crear Préstamo / Solicitud"
            aria-label="Crear Préstamo / Solicitud"
          >
            {/* Liquid Surface Gloss Reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/30 opacity-90 pointer-events-none" />
            
            {/* Click Liquid Ripple Expansion */}
            {activeRipple === 'solicitud' && (
              <span className="absolute inset-0 rounded-full bg-white/60 animate-ping opacity-90 pointer-events-none" />
            )}

            <HugeiconsIcon 
              icon={Add01Icon} 
              size={28}
              strokeWidth={2.4}
              className="w-7 h-7 text-white relative z-10 drop-shadow-md transition-transform duration-300 group-hover:rotate-90" 
            />
          </button>
        </div>

        {/* Last 2 Items (Right Side: Préstamos, Menú) */}
        {navItems.slice(2, 4).map((item) => {
          const isActive = location.pathname === item.path;
          const isRippling = activeRipple === item.key;

          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key, item.path)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-full transition-all duration-300 active:scale-90 hover:bg-slate-900/5 dark:hover:bg-white/10 select-none ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
                  : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white font-medium'
              }`}
            >
              {/* Active Background Liquid Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-indigo-600/10 dark:bg-white/15 rounded-full backdrop-blur-xl animate-scale-up" />
              )}

              {/* Liquid Ripple Wave Ring Effect on Click */}
              {isRippling && (
                <span className="absolute inset-0 rounded-full bg-indigo-500/20 dark:bg-white/20 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Icon */}
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <HugeiconsIcon 
                  icon={isActive ? item.activeIcon : item.outlineIcon} 
                  size={22}
                  strokeWidth={isActive ? 2 : 1.6}
                  className="w-5 h-5 transition-all duration-300" 
                />
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