import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import { CreditScoreResult } from '../utils/CreditScoreEngine';

interface CreditRiskSemaphoreProps {
  scoreResult: CreditScoreResult;
  compact?: boolean;
  showMetrics?: boolean;
}

export const CreditRiskSemaphore: React.FC<CreditRiskSemaphoreProps> = ({
  scoreResult,
  compact = false,
  showMetrics = true
}) => {
  const { score, points100, category, label, badgeBg, badgeBorder, badgeColor, dotColor, riskBanner, metrics } = scoreResult;

  const getIcon = () => {
    switch (category) {
      case 'Platino':
        return <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Bueno':
        return <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Regular':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Alto Riesgo':
      default:
        return <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${badgeBg} ${badgeBorder}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-pulse`} />
        <span className={badgeColor}>{label}</span>
        <span className="text-slate-400 font-mono">({score} / 850 • {points100} pts)</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${badgeBg} ${badgeBorder}`}>
      {/* Header with Semaphore & Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-black/5 dark:border-white/5 shrink-0">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-black uppercase tracking-wider ${badgeColor}`}>
                {riskBanner.title}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${dotColor}`}>
                Grado {scoreResult.grade}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
              {riskBanner.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 px-3.5 py-2 rounded-xl border border-black/5 dark:border-white/10 shrink-0 shadow-xs">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Score / Puntos</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{score}</span>
              <span className="text-xs font-bold text-slate-400">/ 850</span>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 ml-1">({points100} pts)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advice / Recommendations Pill */}
      {riskBanner.suggestGuarantor && (
        <div className="mt-3 py-2 px-3 bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>💡 <strong>Recomendación del Sistema:</strong> Se sugiere adjuntar 1 o 2 <strong>Garantes Solidarios</strong> o garantía prendaria para respaldar la operación.</span>
        </div>
      )}

      {riskBanner.allowImmediateDisbursement && (
        <div className="mt-3 py-2 px-3 bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✅ <strong>Aprobación Prioritaria:</strong> Cliente con excelente calificación. Califica para desembolso inmediato.</span>
        </div>
      )}

      {/* Metrics Row */}
      {showMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-xs">
          <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">Puntualidad Histórica</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100">{metrics.punctualityPercentage}%</span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">Préstamos Saldados</span>
            <span className="font-extrabold text-emerald-600">{metrics.paidLoans} completados</span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">Deuda / Ingresos</span>
            <span className={`font-extrabold ${metrics.debtToIncomeRatio > 50 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
              {metrics.debtToIncomeRatio}% {metrics.debtToIncomeRatio > 50 ? '(Alto)' : '(Saludable)'}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">Préstamos en Mora</span>
            <span className={`font-extrabold ${metrics.overdueLoans > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {metrics.overdueLoans > 0 ? `${metrics.overdueLoans} con atraso` : '0 atrasos'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
