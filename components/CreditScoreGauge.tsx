import React from 'react';

interface CreditScoreGaugeProps {
  score: number; // 300 to 850
  minScore?: number;
  maxScore?: number;
  riskLevel?: string;
  showLabels?: boolean;
}

export const CreditScoreGauge: React.FC<CreditScoreGaugeProps> = ({
  score,
  minScore = 300,
  maxScore = 850,
  riskLevel,
  showLabels = true
}) => {
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const percentage = (clampedScore - minScore) / (maxScore - minScore);

  // Perfect Geometry (No Overflow)
  const width = 260;
  const height = 145;
  const cx = 130;
  const cy = 130;
  const radius = 105;
  const strokeWidth = 16;
  const circumference = Math.PI * radius; // ~329.86
  const strokeDashoffset = circumference * (1 - percentage);

  // Score color badge
  let scoreColor = '#f43f5e'; // Red / Critical
  let scoreBg = 'bg-rose-500';
  let defaultRiskText = 'Alto Riesgo';

  if (clampedScore >= 740) {
    scoreColor = '#10b981'; // Green / Excellent
    scoreBg = 'bg-emerald-500';
    defaultRiskText = 'Excelente';
  } else if (clampedScore >= 670) {
    scoreColor = '#6366f1'; // Indigo / Good
    scoreBg = 'bg-indigo-600';
    defaultRiskText = 'Bueno';
  } else if (clampedScore >= 580) {
    scoreColor = '#f59e0b'; // Yellow / Regular
    scoreBg = 'bg-amber-500';
    defaultRiskText = 'Regular';
  }

  const finalRiskText = riskLevel || defaultRiskText;

  // Pointer position on arc for indicator dot
  const angle = Math.PI * (1 - percentage); // 180deg (left) to 0deg (right)
  const px = cx + radius * Math.cos(angle);
  const py = cy - radius * Math.sin(angle);

  return (
    <div className="flex flex-col items-center justify-center select-none w-full max-w-[270px] mx-auto">
      <div className="relative w-[260px] h-[145px] flex items-center justify-center">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          <defs>
            {/* Multi-color Spectrum Gradient (Red -> Orange/Yellow -> Indigo -> Green) */}
            <linearGradient id="scoreSpectrumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />   {/* Red (300) */}
              <stop offset="35%" stopColor="#f59e0b" />  {/* Yellow/Amber (580) */}
              <stop offset="70%" stopColor="#6366f1" />  {/* Indigo (670) */}
              <stop offset="100%" stopColor="#10b981" /> {/* Green (740-850) */}
            </linearGradient>

            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={scoreColor} floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Track Background Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Active Spectrum Progress Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#scoreSpectrumGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Pointer Dot Marker */}
          {percentage > 0.02 && (
            <circle
              cx={px}
              cy={py}
              r={7}
              fill="#ffffff"
              stroke={scoreColor}
              strokeWidth="3.5"
              className="transition-all duration-1000 ease-out drop-shadow-md"
            />
          )}
        </svg>

        {/* Center Score Value & Label */}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            SCORE CREDITICIO
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {clampedScore}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 850</span>
          </div>
          
          <span 
            className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm ${scoreBg}`}
          >
            {finalRiskText}
          </span>
        </div>
      </div>

      {/* Axis Scale Labels (300 ... 850) */}
      {showLabels && (
        <div className="w-full flex justify-between px-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/60 pt-2">
          <span className="text-rose-500 font-extrabold">300 (Alto Riesgo)</span>
          <span className="text-amber-500 font-extrabold">580</span>
          <span className="text-indigo-500 font-extrabold">670</span>
          <span className="text-emerald-500 font-extrabold">740 (Excelente)</span>
        </div>
      )}
    </div>
  );
};
