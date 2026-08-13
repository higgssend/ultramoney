import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BsHouse, 
  BsHouseFill, 
  BsWallet2, 
  BsCreditCard2BackFill, 
  BsPlusLg, 
  BsCalendar4Event, 
  BsCalendarCheckFill, 
  BsList
} from 'react-icons/bs';

interface MobileNavProps {
  onMenuClick?: () => void;
}

type IconComponent = React.ComponentType<{ className?: string; size?: number | string }>;

interface NavItem {
  key: string;
  label: string;
  path: string;
  outlineIcon: IconComponent;
  fillIcon: IconComponent;
}

const PlusIcon = BsPlusLg as IconComponent;

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
      outlineIcon: BsHouse as IconComponent, 
      fillIcon: BsHouseFill as IconComponent 
    },
    { 
      key: 'pagos', 
      label: 'Pagos', 
      path: '/pagos', 
      outlineIcon: BsWallet2 as IconComponent, 
      fillIcon: BsCreditCard2BackFill as IconComponent 
    },
    // Center Floating Action Button handled separately
    { 
      key: 'prestamos', 
      label: 'Préstamos', 
      path: '/prestamos', 
      outlineIcon: BsCalendar4Event as IconComponent, 
      fillIcon: BsCalendarCheckFill as IconComponent 
    },
    { 
      key: 'menu', 
      label: 'Menú', 
      path: '', 
      outlineIcon: BsList as IconComponent, 
      fillIcon: BsList as IconComponent 
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 md:hidden pointer-events-auto">
      
      {/* Apple Floating Liquid Glass Dock Capsule */}
      <nav className="relative liquidglass flex items-center justify-between px-3.5 py-2 overflow-visible transition-all duration-300">
        
        {/* Apple Top Liquid Ambient Reflection Highlight Line */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/40 to-transparent rounded-full pointer-events-none" />

        {/* Uniform 4 Items Dock */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = isActive ? item.fillIcon : item.outlineIcon;
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
                <Icon className="w-5 h-5 transition-all duration-300" />
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