import React from 'react';

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  className?: string;
}

export const Aurora: React.FC<AuroraProps> = ({
  colorStops = ['#3b82f6', '#8b5cf6', '#ec4899'],
  className = ''
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ filter: 'blur(60px)' }}
    >
      <div
        className="absolute -top-[30%] -left-[10%] w-[120%] h-[120%] opacity-40 animate-aurora mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colorStops[0]} 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, ${colorStops[1]} 0%, transparent 40%),
                       radial-gradient(circle at 20% 80%, ${colorStops[2]} 0%, transparent 50%)`
        }}
      />
    </div>
  );
};

export default Aurora;
