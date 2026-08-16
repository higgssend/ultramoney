import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = ''
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block relative overflow-hidden bg-clip-text text-transparent ${
        disabled
          ? 'text-slate-400'
          : 'bg-gradient-to-r from-slate-400 via-white to-slate-400 animate-shine'
      } ${className}`}
      style={{
        backgroundImage: disabled
          ? undefined
          : 'linear-gradient(120deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.4) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: disabled ? undefined : animationDuration
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
