import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover';
}

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = DEFAULT_CHARS,
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-indigo-400 opacity-70 font-mono',
  animateOn = 'hover'
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrolledIntoView, setIsScrolledIntoView] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLSpanElement>(null);

  const availableChars = useOriginalCharsOnly
    ? Array.from(new Set(text.split(''))).filter(c => c !== ' ')
    : characters.split('');

  const triggerAnimation = () => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (sequential && index < iteration) return char;
            if (!sequential && iteration >= maxIterations) return char;
            return availableChars[Math.floor(Math.random() * availableChars.length)] || char;
          })
          .join('');
      });

      iteration++;
      if (iteration > (sequential ? text.length : maxIterations)) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      triggerAnimation();
    }
  }, [text, animateOn]);

  return (
    <span
      ref={containerRef}
      className={`inline-block cursor-default select-none ${parentClassName}`}
      onMouseEnter={() => {
        if (animateOn === 'hover') {
          triggerAnimation();
        }
      }}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
};

export default DecryptedText;
