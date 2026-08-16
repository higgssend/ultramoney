import React, { useRef, useState } from 'react';

interface MagnetProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export const Magnet: React.FC<MagnetProps> = ({
  children,
  className = '',
  strength = 30
}) => {
  const magnetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!magnetRef.current) return;
    const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    const pullX = (distanceX / width) * strength;
    const pullY = (distanceY / height) * strength;

    setPosition({ x: pullX, y: pullY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={magnetRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 && position.y === 0 ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.1s ease-out'
      }}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};

export default Magnet;
