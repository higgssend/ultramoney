import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
}

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  className = '',
  delay = 0.2,
  duration = 0.9,
  stagger = 0.04,
  animateBy = 'words',
  direction = 'bottom'
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.blur-unit');
    if (elements.length === 0) return;

    const yOffset = direction === 'bottom' ? 35 : -35;

    gsap.fromTo(
      elements,
      {
        opacity: 0,
        filter: 'blur(16px)',
        y: yOffset,
        scale: 0.95
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        scale: 1,
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        clearProps: 'all'
      }
    );
  }, [text, delay, duration, stagger, animateBy, direction]);

  if (animateBy === 'words') {
    const words = text.split(' ');
    return (
      <span ref={containerRef} className={`inline-block ${className}`}>
        {words.map((word, idx) => (
          <span key={idx} className="inline-block whitespace-nowrap mr-[0.3em]">
            <span className="blur-unit inline-block will-change-transform will-change-filter">{word}</span>
          </span>
        ))}
      </span>
    );
  }

  const chars = text.split('');
  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {chars.map((char, idx) => (
        <span
          key={idx}
          className={`blur-unit inline-block will-change-transform will-change-filter ${char === ' ' ? 'mr-[0.25em]' : ''}`}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default BlurText;
