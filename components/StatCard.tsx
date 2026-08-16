import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  gradient?: string; // Expects full class string e.g., 'bg-gradient-to-br from-purple-500 to-indigo-600'
  glowColor?: string; // Expects shadow color class e.g., 'shadow-indigo-500/30'
  color?: string; // Fallback for old usage
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon: Icon, gradient, glowColor, color, onClick }) => {
  if (gradient) {
    // Vibrant Gradient Card Style (White Theme + Neon Pop)
    return (
      <div 
        onClick={onClick}
        className={`rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 text-white ${gradient} relative overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-lg sm:shadow-xl ${glowColor || 'shadow-indigo-500/30'} ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] ring-2 ring-transparent hover:ring-white/40' : ''}`}
      >
        {/* Abstract Shapes for Texture */}
        <div className="absolute -right-6 -top-6 w-24 sm:w-32 h-24 sm:h-32 bg-white/20 rounded-full blur-2xl sm:blur-3xl pointer-events-none"></div>
        <div className="absolute -left-6 -bottom-6 w-20 sm:w-24 h-20 sm:h-24 bg-black/10 rounded-full blur-xl sm:blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <p className="text-white/90 text-[11px] sm:text-xs md:text-sm font-semibold tracking-tight mb-1 sm:mb-1.5 truncate">{title}</p>
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate">{value}</h3>
          
          {trend && (
            <div className="mt-2.5 sm:mt-3.5 flex items-center gap-1 sm:gap-2">
              <span className="bg-white/25 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-sm border border-white/15 flex items-center gap-1 truncate max-w-full">
                <span className="truncate">{trend}</span>
              </span>
            </div>
          )}
        </div>
        
        <div className="absolute right-2.5 bottom-2.5 sm:right-4 sm:bottom-4 opacity-20 sm:opacity-25 pointer-events-none">
            <Icon className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" />
        </div>
      </div>
    );
  }

  // Standard Light Card Style (Clean White)
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm p-3.5 sm:p-5 md:p-6 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md ${color || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 sm:mt-1">{value}</h3>
          {trend && (
            <p className={`text-[10px] sm:text-xs font-medium mt-1.5 sm:mt-2 flex items-center ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend}
              <span className="ml-1 text-slate-400 hidden sm:inline">vs mes anterior</span>
            </p>
          )}
        </div>
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;