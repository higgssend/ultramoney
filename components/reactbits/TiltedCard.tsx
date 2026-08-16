import React, { useRef, useState } from 'react';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxAngle?: number;
  scale?: number;
  glareEffect?: boolean;
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  className = '',
  maxAngle = 12,
  scale = 1.02,
  glareEffect = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rX = ((mouseY - height / 2) / height) * -maxAngle;
    const rY = ((mouseX - width / 2) / width) * maxAngle;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className={`inline-block ${className}`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
          transformStyle: 'preserve-3d'
        }}
        className="relative rounded-2xl overflow-hidden will-change-transform"
      >
        {children}
        {glareEffect && isHovered && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-overlay transition-opacity"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.35) 0%, transparent 60%)`
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TiltedCard;
