import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  className = '',
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#3b82f6'],
  animationSpeed = 6,
  showBorder = false
}) => {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: `gradientMove ${animationSpeed}s linear infinite`
  };

  return (
    <span className={`relative inline-block font-black ${className}`}>
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <span style={gradientStyle} className="inline-block">
        {children}
      </span>
      {showBorder && (
        <span
          className="absolute inset-0 rounded-full border border-indigo-500/30 pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${colors.join(', ')}) border-box`,
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude'
          }}
        />
      )}
    </span>
  );
};

export default GradientText;
