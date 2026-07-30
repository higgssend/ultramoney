import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Banknote, CalendarClock, Menu } from 'lucide-react';

interface MobileNavProps {
  onMenuClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onMenuClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 px-4 flex justify-between items-center z-40 md:hidden safe-area-pb">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-medium">Inicio</span>
      </NavLink>

      <NavLink 
        to="/pagos" 
        className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
      >
        <Wallet className="w-6 h-6" />
        <span className="text-[10px] font-medium">Pagos</span>
      </NavLink>

      <div className="-mt-8">
        <NavLink 
          to="/solicitud"
          className="bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 border-4 border-slate-50"
        >
            <Banknote className="w-6 h-6" />
        </NavLink>
      </div>

      <NavLink 
        to="/prestamos" 
        className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
      >
        <CalendarClock className="w-6 h-6" />
        <span className="text-[10px] font-medium">Préstamos</span>
      </NavLink>

      <button 
        onClick={onMenuClick}
        className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-400 hover:text-indigo-600"
      >
        <Menu className="w-6 h-6" />
        <span className="text-[10px] font-medium">Menú</span>
      </button>
    </div>
  );
};

export default MobileNav;