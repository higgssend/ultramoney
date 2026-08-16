import React from 'react';

interface StarBorderProps {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}

export const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = 'button',
  className = '',
  color = '#818cf8',
  speed = '5s',
  children,
  ...rest
}) => {
  return (
    <Component
      className={`relative inline-block py-[1px] px-[1px] overflow-hidden rounded-xl ${className}`}
      {...rest}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-75 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-75 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />
      <div className="relative z-1 bg-slate-900/90 dark:bg-slate-950/90 text-white rounded-xl border border-white/10 backdrop-blur-xl">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
