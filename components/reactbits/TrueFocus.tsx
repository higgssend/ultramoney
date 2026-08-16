import React, { useEffect, useRef, useState } from 'react';

interface TrueFocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

export const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = 'Potencia tu Financiera al Máximo',
  manualMode = false,
  blurAmount = 4,
  borderColor = '#6366f1',
  glowColor = 'rgba(99, 102, 241, 0.4)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = ''
}) => {
  const words = sentence.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex || 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-wrap items-center gap-x-3 gap-y-2 select-none ${className}`}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => { wordRefs.current[index] = el; }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            style={{
              filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
              transition: `filter ${animationDuration}s ease, opacity ${animationDuration}s ease`,
              opacity: isActive ? 1 : 0.4
            }}
            className="cursor-pointer font-black will-change-filter will-change-transform"
          >
            {word}
          </span>
        );
      })}

      <div
        className="pointer-events-none absolute -z-10 rounded-2xl border-2 transition-all"
        style={{
          transform: `translate3d(${focusRect.x - 6}px, ${focusRect.y - 4}px, 0)`,
          width: `${focusRect.width + 12}px`,
          height: `${focusRect.height + 8}px`,
          borderColor: borderColor,
          boxShadow: `0 0 20px ${glowColor}`,
          transitionDuration: `${animationDuration}s`,
          transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      />
    </div>
  );
};

export default TrueFocus;
