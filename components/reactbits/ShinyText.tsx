import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shimmerColor?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = '',
  shimmerColor
}) => {
  const isLightText = className.includes('text-white') || className.includes('text-indigo-200') || className.includes('text-slate-200') || className.includes('text-indigo-300');

  const defaultGradient = isLightText
    ? 'linear-gradient(120deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%)'
    : 'linear-gradient(120deg, #4f46e5 0%, #9333ea 50%, #4f46e5 100%)';

  return (
    <span
      className={`inline-block relative overflow-hidden bg-clip-text text-transparent font-black ${
        disabled ? 'text-slate-700' : 'animate-shine'
      } ${className}`}
      style={{
        backgroundImage: disabled ? undefined : (shimmerColor || defaultGradient),
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationDuration: disabled ? undefined : `${speed}s`
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
