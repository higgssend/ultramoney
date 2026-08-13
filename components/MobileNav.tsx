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
      <nav className="relative liquidglass bg-slate-900/60 dark:bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-200 border border-white/40 dark:border-white/15 rounded-full px-3.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.7)] flex items-center justify-between overflow-visible transition-all duration-300">
        
        {/* SVG Glass Filter definitions if SVG filters are evaluated */}
        <svg className="glass-surface__filter" aria-hidden="true">
          <filter id="glass-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* Apple Top Liquid Ambient Reflection Highlight Line */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/40 to-transparent rounded-full pointer-events-none" />

        {/* First 2 Items (Left Side) */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isRippling = activeRipple === item.key;

          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key, item.path)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-full transition-all duration-300 active:scale-90 hover:bg-white/10 dark:hover:bg-white/5 select-none ${
                isActive 
                  ? 'text-white font-extrabold' 
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              {/* Active Background Liquid Pill (Ultra-rounded & Almost Transparent) */}
              {isActive && (
                <div className="absolute inset-0 bg-white/15 dark:bg-white/10 rounded-full border border-white/30 dark:border-white/20 backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] animate-scale-up" />
              )}

              {/* Liquid Ripple Wave Ring Effect on Click */}
              {isRippling && (
                <span className="absolute inset-0 rounded-full bg-white/25 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Icon with liquid bounce */}
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              <span className={`relative z-10 text-[10px] mt-0.5 tracking-tight transition-all ${isActive ? 'font-bold text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* CENTER HERO FLOATING LIQUID BUTTON (+ Solicitud) */}
        <div className="relative -mt-6 mx-1 z-20 shrink-0">
          <button
            onClick={() => handleTabClick('solicitud', '/solicitud')}
            className={`relative group w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(79,70,229,0.5)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.6)] border-4 border-slate-900/90 active:scale-90 transition-all duration-300 overflow-hidden ${
              location.pathname === '/solicitud' ? 'ring-4 ring-indigo-400/60 scale-105' : 'hover:scale-105'
            }`}
          >
            {/* Liquid Surface Gloss Reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/30 opacity-90 pointer-events-none" />
            
            {/* Click Liquid Ripple Expansion */}
            {activeRipple === 'solicitud' && (
              <span className="absolute inset-0 rounded-full bg-white/60 animate-ping opacity-90 pointer-events-none" />
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
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-full transition-all duration-300 active:scale-90 hover:bg-white/10 dark:hover:bg-white/5 select-none ${
                isActive 
                  ? 'text-white font-extrabold' 
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              {/* Active Background Liquid Pill (Ultra-rounded & Almost Transparent) */}
              {isActive && (
                <div className="absolute inset-0 bg-white/15 dark:bg-white/10 rounded-full border border-white/30 dark:border-white/20 backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] animate-scale-up" />
              )}

              {/* Liquid Ripple Wave Ring Effect on Click */}
              {isRippling && (
                <span className="absolute inset-0 rounded-full bg-white/25 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Icon with liquid bounce */}
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              <span className={`relative z-10 text-[10px] mt-0.5 tracking-tight transition-all ${isActive ? 'font-bold text-white' : ''}`}>
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