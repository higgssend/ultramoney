import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Zap, Shield, Smartphone,
  BarChart3, Users, Menu, X, Play, ChevronRight,
  Search, FileText, Bell, Lock, Cloud, Tag, Star,
  TrendingUp, DollarSign, Globe, ArrowUpRight, Check,
  Calendar, PieChart, UserPlus, CreditCard, Award
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/StoreContext';

gsap.registerPlugin(ScrollTrigger);

/* ─── Animated Counter ─── */
const Counter: React.FC<{ end: number; suffix?: string; prefix?: string; duration?: number }> = ({ end, suffix = '', prefix = '', duration = 2 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: end,
        duration,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`; },
      });
    });
    return () => ctx.revert();
  }, [end, suffix, prefix, duration]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
};

/* ─── LANDING PAGE ─── */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── GSAP Animations ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Hero Entrance */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
      tl.from('.hero-badge', { y: 25, opacity: 0 })
        .from('.hero-title', { y: 40, opacity: 0, duration: 0.9 }, '-=0.5')
        .from('.hero-sub', { y: 30, opacity: 0 }, '-=0.6')
        .from('.hero-cta-btn', { y: 25, opacity: 0, stagger: 0.15 }, '-=0.5')
        .from('.hero-social', { y: 20, opacity: 0 }, '-=0.4')
        .from('.hero-mockup', { y: 60, opacity: 0, scale: 0.96, duration: 1.1 }, '-=0.7');

      /* Features entrance */
      gsap.from('.feature-card', {
        y: 50, opacity: 0, stagger: 0.1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
      });

      /* Steps entrance */
      gsap.from('.step-card', {
        y: 40, opacity: 0, stagger: 0.15, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: stepsRef.current, start: 'top 80%' },
      });

      /* Stats bar */
      gsap.from('.stat-item', {
        y: 30, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: '.stats-footer', start: 'top 90%' },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900" ref={heroRef}>
      
      {/* ─── HEADER / NAVBAR ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3.5 border-b border-slate-100' : 'bg-white py-5 border-b border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logoultramoney.svg" alt="Ultramoney Logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black tracking-tight text-indigo-950">ultramoney</span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-9">
            <a href="#inicio" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">Inicio</a>
            <a href="#caracteristicas" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Características</a>
            <a href="#beneficios" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Beneficios</a>
            <a href="#precios" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Precios</a>
            <a href="/ayuda" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Contacto</a>
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Ir al Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors px-3 py-2"
                >
                  Iniciar sesión
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Comenzar ahora
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-700 rounded-lg hover:bg-slate-100">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* ─── MOBILE MENU OVERLAY ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col justify-between pb-10 animate-fade-in md:hidden">
          <div className="space-y-6">
            <a href="#inicio" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-slate-800">Inicio</a>
            <a href="#caracteristicas" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-slate-800">Características</a>
            <a href="#beneficios" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-slate-800">Beneficios</a>
            <a href="#precios" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-slate-800">Precios</a>
            <a href="/ayuda" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-slate-800">Contacto / Ayuda</a>
          </div>
          <div className="space-y-3">
            {currentUser ? (
              <button onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }} className="w-full py-3.5 text-center font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">Ir al Dashboard</button>
            ) : (
              <>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="w-full py-3.5 text-center font-bold text-slate-700 bg-slate-100 rounded-xl">Iniciar sesión</button>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} className="w-full py-3.5 text-center font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">Comenzar ahora</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── HERO SECTION ─── */}
      <section id="inicio" className="pt-36 lg:pt-44 pb-20 bg-gradient-to-b from-indigo-50/50 via-slate-50 to-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-5 text-left space-y-6 z-10">
              
              {/* Badge Pill */}
              <div className="hero-badge inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 font-bold text-xs">
                Software de gestión de préstamos
              </div>

              {/* Title */}
              <h1 className="hero-title text-4xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.12] text-slate-900">
                La plataforma inteligente para{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                  prestamistas modernos
                </span>
              </h1>

              {/* Subtitle */}
              <p className="hero-sub text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
                Administra tus clientes, préstamos y cobros desde un solo lugar.
              </p>

              {/* Action Buttons */}
              <div className="hero-cta-btn flex flex-wrap items-center gap-4 pt-2">
                {currentUser ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-base px-7 py-3.5 rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    Ir al Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/register')}
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-base px-7 py-3.5 rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                      Comenzar gratis
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200/80 font-bold text-base px-7 py-3.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                      Ver demo
                    </button>
                  </>
                )}
              </div>

              {/* Social Proof */}
              <div className="hero-social pt-6 flex items-center gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="User" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="User" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="User" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="User" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-slate-900 text-sm">4.9/5</span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Más de 1,000 prestamistas confían en Ultramoney</p>
                </div>
              </div>

            </div>

            {/* Right Column: High Fidelity Dashboard Mockup */}
            <div className="lg:col-span-7 hero-mockup relative">
              <div className="relative rounded-2xl bg-white p-2.5 shadow-2xl shadow-indigo-500/15 border border-slate-200/80 max-w-2xl mx-auto lg:max-w-none">
                
                {/* Mockup Frame Bar */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden text-left">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-100/70 border-b border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="bg-white px-8 py-0.5 rounded-md border border-slate-200 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-slate-400" /> app.ultramoney.com
                    </div>
                    <div className="w-10"></div>
                  </div>

                  {/* Inner UI Preview */}
                  <div className="flex min-h-[380px] bg-slate-50 text-[11px]">
                    
                    {/* App Mini Sidebar */}
                    <div className="w-36 bg-white border-r border-slate-200/80 p-3 hidden sm:flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1 mb-4">
                          <img src="/logoultramoney.svg" alt="logo" className="w-5 h-5" />
                          <span className="font-bold text-indigo-950 text-xs tracking-tight">ultramoney</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold">
                            <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <Users className="w-3.5 h-3.5" /> Clientes
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <DollarSign className="w-3.5 h-3.5" /> Préstamos
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <CreditCard className="w-3.5 h-3.5" /> Pagos
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <PieChart className="w-3.5 h-3.5" /> Cartera
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <Shield className="w-3.5 h-3.5" /> Cobros
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 px-1">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px]">U</div>
                        <span className="font-medium text-slate-600 text-[10px]">Configuración</span>
                      </div>
                    </div>

                    {/* App Main Area */}
                    <div className="flex-1 p-4 space-y-3.5 overflow-hidden bg-slate-50/80">
                      
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
                        <span className="font-bold text-slate-800 text-xs">Dashboard</span>
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 px-2.5 py-1 rounded-md text-[10px] text-slate-400 flex items-center gap-1.5">
                            <Search className="w-3 h-3" /> Buscar...
                          </div>
                          <Bell className="w-3.5 h-3.5 text-slate-400" />
                          <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300"></div>
                        </div>
                      </div>

                      {/* 4 Stat Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                          <p className="text-[9px] font-medium text-slate-400">Préstamos activos</p>
                          <p className="font-black text-slate-800 text-sm mt-0.5">128</p>
                          <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">+12% vs mes anterior</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                          <p className="text-[9px] font-medium text-slate-400">Monto prestado</p>
                          <p className="font-black text-slate-800 text-sm mt-0.5">$248,750</p>
                          <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">+8% vs mes anterior</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                          <p className="text-[9px] font-medium text-slate-400">Cobros del mes</p>
                          <p className="font-black text-slate-800 text-sm mt-0.5">$47,850</p>
                          <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">+15% vs mes anterior</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                          <p className="text-[9px] font-medium text-slate-400">Cartera vencida</p>
                          <p className="font-black text-slate-800 text-sm mt-0.5">$14,250</p>
                          <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">-5% vs mes anterior</span>
                        </div>
                      </div>

                      {/* Middle Row: Graph + Donut */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        
                        {/* Area Chart Card */}
                        <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 text-[10px]">Resumen de cartera</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Este mes</span>
                          </div>
                          
                          {/* Smooth Curve Mock Chart */}
                          <div className="h-20 w-full relative pt-2">
                            <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <path d="M 0 50 Q 30 45, 60 25 T 120 15 T 180 35 L 200 10 L 200 60 L 0 60 Z" fill="url(#grad)" />
                              <path d="M 0 50 Q 30 45, 60 25 T 120 15 T 180 35 L 200 10" fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                            </svg>
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                            <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
                          </div>
                        </div>

                        {/* Donut Chart Card */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs flex flex-col justify-between">
                          <span className="font-bold text-slate-800 text-[10px]">Distribución de préstamos</span>
                          <div className="flex items-center justify-center py-1">
                            <div className="relative w-14 h-14 rounded-full border-4 border-indigo-500 border-t-rose-400 border-r-indigo-400 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-slate-700">100%</span>
                            </div>
                          </div>
                          <div className="space-y-0.5 text-[8px]">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Vigentes</span>
                              <span className="font-bold text-slate-700">70%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Vencidos</span>
                              <span className="font-bold text-slate-700">20%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Pagados</span>
                              <span className="font-bold text-slate-700">10%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Loans Table Card */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-800 text-[10px]">Préstamos recientes</span>
                          <span className="text-[8px] text-indigo-600 font-bold cursor-pointer">Ver todos</span>
                        </div>
                        <div className="space-y-1.5 text-[9px]">
                          <div className="flex items-center justify-between py-1 border-b border-slate-50">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[7px]">MG</div>
                              <span className="font-semibold text-slate-700">María González</span>
                            </div>
                            <span className="font-bold text-slate-800">$5,000</span>
                            <span className="text-slate-400 text-[8px]">15 May 2024</span>
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded text-[8px] font-bold">Vigente</span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-50">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[7px]">CR</div>
                              <span className="font-semibold text-slate-700">Carlos Ramírez</span>
                            </div>
                            <span className="font-bold text-slate-800">$3,200</span>
                            <span className="text-slate-400 text-[8px]">14 May 2024</span>
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded text-[8px] font-bold">Vigente</span>
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[7px]">AM</div>
                              <span className="font-semibold text-slate-700">Ana Martínez</span>
                            </div>
                            <span className="font-bold text-slate-800">$2,800</span>
                            <span className="text-slate-400 text-[8px]">13 May 2024</span>
                            <span className="bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded text-[8px] font-bold">Vencido</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION ─── */}
      <section id="caracteristicas" className="py-24 bg-white border-t border-slate-100" ref={featuresRef}>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          
          {/* Section Header */}
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">TODO LO QUE NECESITAS</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Gestión completa de tu negocio de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                préstamos
              </span>
            </h2>
          </div>

          {/* 3x2 Grid (Matching Mockup Image) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            {/* Card 1 */}
            <div className="feature-card bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Gestión de clientes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Centraliza la información de tus clientes y mantén todo organizado.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Control de préstamos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Crea, edita y da seguimiento a cada préstamo con total facilidad.
              </p>
            </div>

            {/* Card 3 */}
            <div className="feature-card bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Seguimiento de pagos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Registra pagos, envía recordatorios y controla atrasos automáticamente.
              </p>
            </div>

            {/* Card 4 */}
            <div className="feature-card bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Reportes inteligentes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Obtén reportes claros y detallados para tomar mejores decisiones.
              </p>
            </div>

            {/* Card 5 */}
            <div className="feature-card bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Gestión de cobros</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Organiza tu proceso de cobros y reduce la cartera vencida.
              </p>
            </div>

            {/* Card 6 */}
            <div className="feature-card bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Seguridad avanzada</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tus datos y los de tus clientes están protegidos con los más altos estándares.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── CTA BANNER SECTION ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-indigo-500/20">
            
            <div className="flex items-center gap-6 text-left">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Impulsa tu negocio de préstamos</h3>
                <p className="text-indigo-100 text-sm sm:text-base font-normal max-w-xl">
                  Ultramoney te ayuda a ahorrar tiempo, minimizar riesgos y aumentar tu rentabilidad.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="bg-white hover:bg-slate-50 text-indigo-700 font-bold text-base px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 flex-shrink-0"
            >
              Comenzar ahora <ArrowRight className="w-5 h-5" />
            </button>

          </div>
        </div>
      </section>

      {/* ─── 4-STEP PROCESS SECTION ─── */}
      <section id="beneficios" className="py-24 bg-slate-50/60" ref={stepsRef}>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          
          {/* Header */}
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">SIMPLE, RÁPIDO Y EFECTIVO</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Así de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                fácil
              </span>{' '}
              es empezar
            </h2>
          </div>

          {/* 4 Steps Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="step-card bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-4 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <UserPlus className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Crea tu cuenta</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Regístrate en minutos y comienza a configurar tu negocio.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-4 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Agrega tus clientes</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Importa o agrega tus clientes de forma rápida y sencilla.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-4 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Crea préstamos</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Registra préstamos, define condiciones y plazos.
              </p>
            </div>

            {/* Step 4 */}
            <div className="step-card bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-4 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                4
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Haz crecer tu negocio</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Administra, cobra y toma decisiones con información en tiempo real.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── STATS FOOTER BAR ─── */}
      <footer className="stats-footer border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="stat-item space-y-1">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                <Counter end={1000} prefix="+" />
              </p>
              <p className="text-xs font-semibold text-slate-500">Prestamistas activos</p>
            </div>

            <div className="stat-item space-y-1">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                <Counter end={50000} prefix="+" />
              </p>
              <p className="text-xs font-semibold text-slate-500">Préstamos gestionados</p>
            </div>

            <div className="stat-item space-y-1">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                <Counter end={200} prefix="+$" suffix="M" />
              </p>
              <p className="text-xs font-semibold text-slate-500">Monto administrado</p>
            </div>

            <div className="stat-item space-y-1">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                99.9%
              </p>
              <p className="text-xs font-semibold text-slate-500">Disponibilidad</p>
            </div>

          </div>

          {/* Copyright bar */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-2">
              <img src="/logoultramoney.svg" alt="logo" className="w-4 h-4" />
              <span className="font-bold text-slate-700">ultramoney</span>
              <span>© {new Date().getFullYear()} Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/ayuda" className="hover:text-slate-600 transition-colors">Términos</a>
              <a href="/ayuda" className="hover:text-slate-600 transition-colors">Privacidad</a>
              <a href="/ayuda" className="hover:text-slate-600 transition-colors">Soporte</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
