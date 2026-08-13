import React from 'react';

interface CreditScoreGaugeProps {
  score: number; // 300 to 850
  minScore?: number;
  maxScore?: number;
  size?: number; // width/height in px, default 220
  riskLevel?: string;
  riskColor?: string;
  showLabels?: boolean;
}

export const CreditScoreGauge: React.FC<CreditScoreGaugeProps> = ({
  score,
  minScore = 300,
  maxScore = 850,
  size = 240,
  riskLevel,
  showLabels = true
}) => {
  // Normalize score between 0 and 1
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const percentage = (clampedScore - minScore) / (maxScore - minScore);

  // SVG Semi-circle dimensions
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle arc length
  const strokeDashoffset = circumference * (1 - percentage);

  // Color determination based on score
  let scoreColor = '#F43F5E'; // Rose (Critical)
  let scoreText = 'Crítico';
  let gradientId = 'scoreGradientRose';

  if (clampedScore >= 740) {
    scoreColor = '#10B981'; // Emerald
    scoreText = 'Excelente';
    gradientId = 'scoreGradientEmerald';
  } else if (clampedScore >= 670) {
    scoreColor = '#6366F1'; // Indigo
    scoreText = 'Bueno';
    gradientId = 'scoreGradientIndigo';
  } else if (clampedScore >= 580) {
    scoreColor = '#F59E0B'; // Amber
    scoreText = 'Regular';
    gradientId = 'scoreGradientAmber';
  }

  const finalRiskText = riskLevel || scoreText;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size / 1.75 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-180 overflow-visible"
        >
          <defs>
            {/* Emerald Gradient */}
            <linearGradient id="scoreGradientEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            {/* Indigo Gradient */}
            <linearGradient id="scoreGradientIndigo" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            {/* Amber Gradient */}
            <linearGradient id="scoreGradientAmber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            {/* Rose Gradient */}
            <linearGradient id="scoreGradientRose" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#FB7185" />
            </linearGradient>
            {/* Background Arc Shadow */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={scoreColor} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Active Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 text-center pointer-events-none">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400">
            SCORE CREDITICIO
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-secondary">
              {clampedScore}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 850</span>
          </div>
          
          <span 
            className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: scoreColor }}
          >
            {finalRiskText}
          </span>
        </div>
      </div>

      {/* Axis Scale Labels (300 ... 850) */}
      {showLabels && (
        <div className="w-full flex justify-between px-3 text-[10px] font-bold text-slate-400 dark:text-slate-400 mt-1">
          <span>300 (Bajo)</span>
          <span>580</span>
          <span>670</span>
          <span>740</span>
          <span>850 (Alto)</span>
        </div>
      )}
    </div>
  );
};
