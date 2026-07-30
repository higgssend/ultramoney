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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon: Icon, gradient, glowColor, color }) => {
  if (gradient) {
    // Vibrant Gradient Card Style (White Theme + Neon Pop)
    return (
      <div className={`rounded-3xl p-6 text-white ${gradient} relative overflow-hidden transition-transform hover:-translate-y-1 shadow-xl ${glowColor || 'shadow-indigo-500/30'}`}>
        {/* Abstract Shapes for Texture */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/10 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <p className="text-white/90 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          
          {trend && (
            <div className="mt-4 flex items-center gap-2">
              <span className="bg-white/25 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md shadow-sm border border-white/10">
                {trend}
              </span>
            </div>
          )}
        </div>
        
        <div className="absolute right-5 bottom-5 opacity-25">
            <Icon className="w-14 h-14 text-white" />
        </div>
      </div>
    );
  }

  // Standard Light Card Style (Clean White)
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md ${color || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
          {trend && (
            <p className={`text-xs font-medium mt-2 flex items-center ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend}
              <span className="ml-1 text-slate-400">vs mes anterior</span>
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;