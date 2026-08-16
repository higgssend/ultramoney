import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  splitBy?: 'words' | 'chars';
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.8,
  stagger = 0.03,
  splitBy = 'words'
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('.split-unit');
    if (elements.length === 0) return;

    gsap.fromTo(
      elements,
      { opacity: 0, y: 30, filter: 'blur(8px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        clearProps: 'all'
      }
    );
  }, [text, delay, duration, stagger, splitBy]);

  if (splitBy === 'words') {
    const words = text.split(' ');
    return (
      <span ref={containerRef} className={`inline-block ${className}`}>
        {words.map((word, idx) => (
          <span key={idx} className="inline-block whitespace-nowrap mr-[0.28em]">
            <span className="split-unit inline-block will-change-transform">{word}</span>
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
          className={`split-unit inline-block will-change-transform ${char === ' ' ? 'mr-[0.25em]' : ''}`}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default SplitText;
