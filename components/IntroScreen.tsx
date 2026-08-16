import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ShinyText } from './reactbits/ShinyText';
import { Particles } from './reactbits/Particles';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user already saw intro in current session
    const hasSeenIntro = sessionStorage.getItem('um_has_seen_intro');
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('um_has_seen_intro', 'true');
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 1.05,
          duration: 0.7,
          ease: 'power3.inOut',
          onComplete: () => {
            setIsVisible(false);
            onComplete();
          }
        });
      }
    });

    // 1. Initial State
    gsap.set(logoRef.current, { scale: 0.5, opacity: 0, rotation: -10 });
    gsap.set(textRef.current, { y: 25, opacity: 0, filter: 'blur(10px)' });
    gsap.set(glowRef.current, { scale: 0.2, opacity: 0 });

    // 2. Intro Sequence
    tl.to(glowRef.current, {
      scale: 1.5,
      opacity: 0.8,
      duration: 1,
      ease: 'power2.out'
    })
    .to(logoRef.current, {
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 0.9,
      ease: 'back.out(1.7)'
    }, '-=0.7')
    .to(textRef.current, {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.7,
      ease: 'power3.out'
    }, '-=0.4')
    .to(logoRef.current, {
      scale: 1.08,
      duration: 0.6,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut'
    }, '+=0.2');

  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem('um_has_seen_intro', 'true');
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        setIsVisible(false);
        onComplete();
      }
    });
  };

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Background Particles & Glow */}
      <Particles quantity={45} color="#818cf8" className="absolute inset-0 opacity-40" />

      <div
        ref={glowRef}
        className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-blue-600/30 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Main Logo Showcase */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 px-6">
        
        {/* Animated Glowing Logo Orb */}
        <div ref={logoRef} className="relative">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 shadow-[0_0_60px_rgba(99,102,241,0.4)] flex items-center justify-center p-6 backdrop-blur-xl relative group">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 animate-pulse pointer-events-none" />
            <img
              src="/logoultramoney.svg"
              alt="UltraMoney Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]"
            />
          </div>
        </div>

        {/* Brand Text & Slogan */}
        <div ref={textRef} className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-black uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <ShinyText text="FINTECH SUITE 2.0" speed={3} className="text-indigo-200" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-sans">
            Ultra<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">Money</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
            Ecosistema Crediticio Inteligente • Nube & Campo
          </p>
        </div>

      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-10 px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5 backdrop-blur-md"
      >
        <span>Entrar directo</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default IntroScreen;
