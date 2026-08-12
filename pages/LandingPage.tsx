import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Zap, Shield, Smartphone,
  BarChart3, Users, Menu, X, Play, ChevronRight,
  Search, FileText, Bell, Lock, Cloud, Tag, Star,
  TrendingUp, DollarSign, Globe, ArrowUpRight, Check,
  Calendar, PieChart, UserPlus, CreditCard, Award, ChevronDown,
  HelpCircle, Sparkles, Clock, RefreshCw, MessageSquare, Sliders,
  MapPin, CheckSquare, XCircle, ShieldCheck, Calculator, ThumbsUp,
  Briefcase, Landmark, Navigation, Database, Cpu, Layers, AlertCircle,
  Banknote, FilePlus, Package, TrendingDown, Wallet, BookOpen
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
        scrollTrigger: { trigger: el, start: 'top 95%', once: true },
        onUpdate: () => { el.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`; },
      });
    });
    return () => ctx.revert();
  }, [end, suffix, prefix, duration]);
  return <span ref={ref}>{prefix}{end}{suffix}</span>;
};

/* ─── LANDING PAGE ─── */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 1. Interactive Loan Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(10);
  const [calcTerm, setCalcTerm] = useState<number>(6);
  const [calcFreq, setCalcFreq] = useState<'Semanal' | 'Quincenal' | 'Mensual'>('Mensual');

  // 2. ROI Calculator State
  const [activeLoansCount, setActiveLoansCount] = useState<number>(80);

  // 3. Mobile Showcase Tab State
  const [activeMobileTab, setActiveMobileTab] = useState<'campo' | 'whatsapp' | 'gps' | 'offline'>('campo');

  const heroRef = useRef<HTMLDivElement>(null);

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
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
      tl.from('.hero-badge', { y: 20, opacity: 0, clearProps: 'all' })
        .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, clearProps: 'all' }, '-=0.5')
        .from('.hero-sub', { y: 25, opacity: 0, clearProps: 'all' }, '-=0.6')
        .from('.hero-cta-btn', { y: 20, opacity: 0, stagger: 0.1, clearProps: 'all' }, '-=0.5')
        .from('.hero-mockup', { y: 40, opacity: 0, scale: 0.98, duration: 0.9, clearProps: 'all' }, '-=0.6');
    }, heroRef);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  // Simulator Calculations
  const totalInterest = Math.round((calcAmount * (calcRate / 100)) * (calcFreq === 'Semanal' ? calcTerm / 4 : calcFreq === 'Quincenal' ? calcTerm / 2 : calcTerm));
  const totalToPay = calcAmount + totalInterest;
  const installmentCount = calcFreq === 'Semanal' ? calcTerm * 4 : calcFreq === 'Quincenal' ? calcTerm * 2 : calcTerm;
  const installmentAmount = Math.round(totalToPay / Math.max(1, installmentCount));

  // ROI Calculations
  const hoursSavedPerWeek = Math.round(activeLoansCount * 0.25);
  const moneySavedInArrears = Math.round(activeLoansCount * 450);

  const faqs = [
    {
      q: '¿Cómo funciona la gestión de préstamos en Ultramoney?',
      a: 'Ultramoney te permite crear expedientes de clientes, amortizar préstamos con cálculo automático de intereses, amortizaciones a capital, recargos por mora y condonaciones. Genera automáticamente comprobantes de pago e impresiones térmicas.'
    },
    {
      q: '¿Qué ocurre si el pago de un préstamo abierto supera los intereses?',
      a: 'En préstamos tipo pagaré abierto o cobro de rédito, si el cliente abona un monto superior al interés vencido, el excedente se abona automáticamente al capital principal y el sistema recalcula los futuros intereses.'
    },
    {
      q: '¿Los recibos se pueden enviar por WhatsApp o descargar en imagen?',
      a: '¡Sí! Puedes compartir el enlace web oficial del recibo con código QR por WhatsApp o correo electrónico, e imprimirlo o descargarlo directamente como una imagen PNG de alta calidad en 1 clic.'
    },
    {
      q: '¿Tengo que instalar programas en mi computadora?',
      a: 'No. Ultramoney es una Web App Pro (PWA) segura basada en la nube. Puedes acceder desde cualquier laptop, tablet o celular Android/iPhone sin instalaciones.'
    },
    {
      q: '¿Puedo refinanciar o reestructurar préstamos existentes?',
      a: 'Sí, la plataforma cuenta con consolidación de deudas y refinanciamiento en 1 solo clic. Al crear un nuevo préstamo puedes absorber la deuda activa del cliente de forma transparente.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 overflow-x-hidden" ref={heroRef}>
      
      {/* ─── HEADER / NAVBAR ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 border-b border-slate-200/80' : 'bg-white py-4 border-b border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logoultramoney.svg" alt="Ultramoney Logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black tracking-tight text-indigo-950">ultramoney</span>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <a href="#inicio" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">Inicio</a>
            <a href="#novedades" className="text-sm font-semibold text-indigo-600 font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Novedades 2.0</a>
            <a href="#simulador" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Simulador</a>
            <a href="#caracteristicas" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Características</a>
            <a href="#comparativa" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Excel vs Ultramoney</a>
            <a href="#app-movil" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">App Móvil</a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Preguntas</a>
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Comenzar ahora
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-700 rounded-lg hover:bg-slate-100">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* ─── MOBILE MENU OVERLAY ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col justify-between pb-10 animate-fade-in lg:hidden">
          <div className="space-y-4">
            <a href="#inicio" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Inicio</a>
            <a href="#simulador" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Simulador de Préstamos</a>
            <a href="#caracteristicas" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Características</a>
            <a href="#comparativa" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Comparativa Excel</a>
            <a href="#app-movil" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">App Móvil de Campo</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Preguntas Frecuentes</a>
          </div>
          <div className="space-y-3">
            {currentUser ? (
              <button onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }} className="w-full py-3.5 text-center font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">Ir al Dashboard</button>
            ) : (
              <>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="w-full py-3.5 text-center font-bold text-slate-700 bg-slate-100 rounded-xl">Iniciar sesión</button>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} className="w-full py-3.5 text-center font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">Comenzar gratis</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── HERO SECTION ─── */}
      <section id="inicio" className="pt-28 lg:pt-36 pb-16 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-5 text-left space-y-5 z-10">
              
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Software de gestión de préstamos 2.0
              </div>

              <h1 className="hero-title text-4xl sm:text-5xl lg:text-[3.1rem] font-black tracking-tight leading-[1.12] text-slate-900">
                La plataforma inteligente para{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                  prestamistas modernos
                </span>
              </h1>

              <p className="hero-sub text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
                Administra clientes, préstamos, cobros diarios y contabilidad en un solo sistema centralizado y automatizado.
              </p>

              <div className="hero-cta-btn flex flex-wrap items-center gap-4 pt-2">
                {currentUser ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-base px-7 py-3.5 rounded-full shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    Ir al Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/register')}
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-base px-7 py-3.5 rounded-full shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
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
              <div className="hero-social pt-4 flex items-center gap-4">
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
              <div className="relative rounded-2xl bg-white p-2 shadow-2xl shadow-indigo-500/15 border border-slate-200/80 max-w-2xl mx-auto lg:max-w-none">
                
                {/* Mockup Frame Bar */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden text-left">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-100/70 border-b border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="bg-white px-8 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-slate-400" /> app.ultramoney.com
                    </div>
                    <div className="w-10"></div>
                  </div>

                  {/* Inner UI Preview */}
                  <div className="flex min-h-[360px] bg-slate-50 text-[11px]">
                    <div className="w-36 bg-white border-r border-slate-200/80 p-3 hidden sm:flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1 mb-3">
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
                            <Shield className="w-3.5 h-3.5" /> Cobros
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-hidden bg-slate-50/80">
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
                        <span className="font-bold text-slate-800 text-xs">Dashboard Principal</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-400">Buscar cliente...</div>
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[8px]">UM</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                          <p className="text-[8px] font-medium text-slate-400">Préstamos activos</p>
                          <p className="font-black text-slate-800 text-xs mt-0.5">128</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                          <p className="text-[8px] font-medium text-slate-400">Monto prestado</p>
                          <p className="font-black text-slate-800 text-xs mt-0.5">RD$ 248,750</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                          <p className="text-[8px] font-medium text-slate-400">Cobros del mes</p>
                          <p className="font-black text-slate-800 text-xs mt-0.5">RD$ 47,850</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                          <p className="text-[8px] font-medium text-slate-400">Cartera vencida</p>
                          <p className="font-black text-slate-800 text-xs mt-0.5 text-rose-600">RD$ 14,250</p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800 text-[10px]">Flujo de caja e ingresos</span>
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded">+18% este mes</span>
                        </div>
                        <div className="h-20 w-full relative pt-1">
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
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION: MÓDULOS Y FUNCIONALIDADES DEL SISTEMA (LIGHT THEME) ─── */}
      <section id="caracteristicas" className="py-20 bg-white text-slate-900 border-t border-b border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest">
              <Layers className="w-4 h-4 text-amber-500" /> ECOSISTEMA INTEGRAL ULTRANET 2.0
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Todos los Módulos del Sistema en una Sola Plataforma
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Descubre las 22 herramientas especializadas diseñadas para automatizar el ciclo completo de tus préstamos, cobros, cartera y contabilidad.
            </p>
          </div>

          {/* Grid of 22 Sidebar Modules (Light Theme with Large Direct Icons) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* 1. Dashboard */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <BarChart3 className="w-10 h-10 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Panel Principal
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">1. Dashboard Central</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Panel de control en tiempo real con indicadores KPIs de capital colocado, cobros del día, morosidad acumulada y ganancias netas.
                </p>
              </div>
            </div>

            {/* 2. Facturas */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <FileText className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Facturación
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">2. Facturas & Comprobantes</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Emisión, descarga e impresión en PDF/Ticket de facturas comerciales, comprobantes de ingreso y comprobantes fiscales (NCF).
                </p>
              </div>
            </div>

            {/* 3. Consultar */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Search className="w-10 h-10 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  Evaluación
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">3. Consulta Crediticia</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluación instantánea de historial crediticio, score de morosidad y validación de antecedentes de clientes en 1 clic.
                </p>
              </div>
            </div>

            {/* 4. Solicitud */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <FilePlus className="w-10 h-10 text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Originación
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">4. Solicitud & Créditos</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Originación de préstamos, financiamiento de vehículos o electrodomésticos (con/sin inicial) y aprobación estructurada.
                </p>
              </div>
            </div>

            {/* 5. Simulador */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Calculator className="w-10 h-10 text-amber-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  Cálculo
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">5. Simulador Financiero</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calculadora interactiva para proyectar amortizaciones, cuotas semanales/quincenales/mensuales y tasas de interés.
                </p>
              </div>
            </div>

            {/* 6. Clientes */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Users className="w-10 h-10 text-rose-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  Expedientes
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">6. Gestión de Clientes 360°</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Expediente digital completo, foto de perfil con recortador, cédula, garantes principales, garantes solidarios y ubicación.
                </p>
              </div>
            </div>

            {/* 7. Portales de Cliente */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Smartphone className="w-10 h-10 text-cyan-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-100">
                  Auto-Servicio
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">7. Portales de Cliente</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Acceso web privado para que los clientes consulten sus préstamos activos, fechas de pago y recibos por WhatsApp.
                </p>
              </div>
            </div>

            {/* 8. Préstamos */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Banknote className="w-10 h-10 text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Cartera Activa
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">8. Administración de Préstamos</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Control centralizado de cartera activa, contrato legal oficial, desglose financiero, refinanciamiento y liquidación.
                </p>
              </div>
            </div>

            {/* 9. Inventario */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Package className="w-10 h-10 text-teal-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                  Stock
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">9. Inventario / Stock</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Control de inventario de equipos, vehículos, celulares y artículos dados en crédito con prendas en garantía.
                </p>
              </div>
            </div>

            {/* 10. Pagos */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Calendar className="w-10 h-10 text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Cobros
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">10. Gestión de Pagos</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Registro rápido de cobros, abonos a capital, impresión térmica de tickets y recibos digitales QR por WhatsApp.
                </p>
              </div>
            </div>

            {/* 11. Atrasos */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <AlertCircle className="w-10 h-10 text-rose-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  Morosidad
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">11. Atrasos & Cobranzas</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monitoreo de morosos, cálculo automático de recargos por mora pactada y alertas de seguimiento inmediato.
                </p>
              </div>
            </div>

            {/* 12. Caja */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Wallet className="w-10 h-10 text-amber-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  Efectivo
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">12. Caja Chica</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Apertura, cierre y arqueo diario de caja chica, control de flujos de efectivo en tiempo real y cuadre de ingresos/egresos.
                </p>
              </div>
            </div>

            {/* 13. Bancos */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Landmark className="w-10 h-10 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Bancos & POS
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">13. Cuentas & Bancos</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conciliación de cuentas bancarias (USD/DOP), tarjetas de crédito y terminales Verifone/POS para cobros digitales.
                </p>
              </div>
            </div>

            {/* 14. Cartera */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Briefcase className="w-10 h-10 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  Riesgo
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">14. Cartera & Rutas</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Análisis de salud de cartera, distribución por cobrador, rutas de cobro en terreno y mapa de riesgo crediticio.
                </p>
              </div>
            </div>

            {/* 15. Gastos */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <TrendingDown className="w-10 h-10 text-rose-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  Egresos
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">15. Control de Gastos</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Registro categorizado de gastos operativos, comisiones de cobradores, nómina y costos fijos de la financiera.
                </p>
              </div>
            </div>

            {/* 16. Ganancia */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <TrendingUp className="w-10 h-10 text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  P&L
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">16. Ganancias & Utilidades</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Estado de pérdidas y ganancias, proyección de intereses devengados vs cobrados y análisis de rentabilidad.
                </p>
              </div>
            </div>

            {/* 17. Empleados */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <UserPlus className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Nómina
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">17. Empleados & Permisos</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Control de personal, cobradores, administradores, asignación de permisos RLS y auditoría de rendimiento.
                </p>
              </div>
            </div>

            {/* 18. Clasificación */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Tag className="w-10 h-10 text-amber-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  Scoring
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">18. Clasificación A/B/C/D</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Segmentación automática de clientes por nivel de riesgo (Categorías A, B, C, D) y comportamiento de pago.
                </p>
              </div>
            </div>

            {/* 19. Cont. Profunda */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <BookOpen className="w-10 h-10 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  Contabilidad
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">19. Contabilidad Profunda</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Asientos contables automáticos, catálogo de cuentas, libro diario y balance general sin intervención manual.
                </p>
              </div>
            </div>

            {/* 20. Bitácora */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-10 h-10 text-sky-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  Auditoría
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">20. Bitácora de Auditoría</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Registro inalterable de auditoría que registra cada creación, edición o eliminación realizada en la plataforma.
                </p>
              </div>
            </div>

            {/* 21. Migración */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Database className="w-10 h-10 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Importación
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">21. Centro de Migración</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Importación masiva de datos desde Excel/CSV mediante inteligencia artificial y herramientas de reversión (rollback).
                </p>
              </div>
            </div>

            {/* 22. Configuración */}
            <div className="bg-slate-50/80 hover:bg-white rounded-3xl p-6 border border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-500/5 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <Sliders className="w-10 h-10 text-slate-700 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Ajustes
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1.5">22. Configuración General</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Configuración de nombre comercial, sello notarial, tasas predeterminadas, WhatsApp API y seguridad.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 1: INTERACTIVE LOAN CALCULATOR WIDGET (LIGHT THEME) ─── */}
      <section id="simulador" className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase flex items-center justify-center gap-1.5">
              <Calculator className="w-4 h-4" /> SIMULADOR EN VIVO
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Prueba la potencia de cálculo en tiempo real
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Calcula amortizaciones, cuotas y rendimiento para cualquier tipo de préstamo.</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/80 rounded-3xl p-6 sm:p-10 text-slate-900 shadow-xl border border-indigo-200/80 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Sliders Area */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Amount Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase">Monto a Prestar</label>
                    <span className="text-xl font-black text-indigo-700">RD$ {calcAmount.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min={5000} 
                    max={500000} 
                    step={5000}
                    value={calcAmount} 
                    onChange={e => setCalcAmount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>RD$ 5,000</span>
                    <span>RD$ 500,000</span>
                  </div>
                </div>

                {/* Rate Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase">Tasa de Interés Mensual</label>
                    <span className="text-xl font-black text-amber-600">{calcRate}% / mes</span>
                  </div>
                  <input 
                    type="range" 
                    min={2} 
                    max={25} 
                    step={1}
                    value={calcRate} 
                    onChange={e => setCalcRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Term Slider & Frequency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Plazo del Préstamo</label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-300">
                      <input 
                        type="number" 
                        min={1} 
                        max={36} 
                        value={calcTerm} 
                        onChange={e => setCalcTerm(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-transparent text-slate-900 font-bold text-center focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-bold pr-2">Meses</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Frecuencia de Pago</label>
                    <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-300">
                      {(['Semanal', 'Quincenal', 'Mensual'] as const).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setCalcFreq(f)}
                          className={`py-1.5 text-[10px] font-bold rounded-lg transition-colors ${calcFreq === f ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Live Result Box (Light Theme) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-indigo-100 shadow-md space-y-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Resultado Estimado por Cuota
                </span>
                
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-indigo-700">
                    RD$ {installmentAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {installmentCount} cuotas {calcFreq.toLowerCase()}s
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Capital Prestado:</span>
                    <span className="font-bold text-slate-800">RD$ {calcAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Interés Ganado:</span>
                    <span className="font-bold text-amber-600">+RD$ {totalInterest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-2 text-sm">
                    <span>Total a Retornar:</span>
                    <span className="text-emerald-600">RD$ {totalToPay.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/register')}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20"
                >
                  Probar este Préstamo en Ultramoney
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: COMPARATIVA VS EXCEL / CUADERNOS (LIGHT THEME) ─── */}
      <section id="comparativa" className="py-14 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">DEJA EL PASADO ATRÁS</span>
            <h2 className="text-3xl font-black text-slate-900">
              ¿Por qué cambiar Cuadernos y Excel por Ultramoney?
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 bg-slate-800 text-white p-4 font-bold text-xs uppercase tracking-wider text-center">
              <div className="col-span-5 text-left pl-4">Característica / Proceso</div>
              <div className="col-span-3 text-rose-300">Cuadernos / Excel</div>
              <div className="col-span-4 text-emerald-300">Ultramoney 2.0</div>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              {[
                { f: 'Cálculo de Cuotas y Amortización', old: 'Manual o fórmulas rotas en Excel', new: 'Automático (Francés, Alemana, Réditos)' },
                { f: 'Generación y Envío de Recibos', old: 'Talonario de papel o manual', new: 'Recibo PNG en 1 clic + QR por WhatsApp' },
                { f: 'Abonos Excedentes a Capital', old: 'Re-cálculo manual propenso a errores', new: 'Reducción de capital e interés automática' },
                { f: 'Recargos por Mora y Descuentos', old: 'Olvidos constantes o desacuerdos', new: 'Cálculo transparente con condonación' },
                { f: 'Refinanciamiento y Consolidación', old: 'Complicado de rastrear y liquidar', new: 'Consolidación de deudas en 1 clic' },
                { f: 'Seguridad y Respaldo de Datos', old: 'Riesgo de pérdida de cuadernos o virus', new: 'Nube PostgreSQL con respaldo diario' },
                { f: 'Acceso Móvil para Cobradores', old: 'Sin acceso en la calle', new: 'App PWA ejecutable en cualquier celular' }
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-5 font-bold text-slate-800">{row.f}</div>
                  <div className="col-span-3 text-center text-slate-500 flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="hidden sm:inline">{row.old}</span>
                  </div>
                  <div className="col-span-4 text-center font-bold text-indigo-700 flex items-center justify-center gap-1 bg-indigo-50/60 p-2 rounded-xl border border-indigo-100">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{row.new}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: APP MÓVIL Y COBRANZA EN CAMPO ─── */}
      <section id="app-movil" className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black tracking-widest text-indigo-600 uppercase flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> APP MÓVIL DE CAMPO
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                Diseñado para cobrar en la calle con total soltura
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tus cobradores pueden revisar las cuotas del día, registrar cobros, emitir comprobantes digitales por WhatsApp y consultar direcciones sin depender de una oficina.
              </p>

              {/* Tabs list */}
              <div className="space-y-3">
                {[
                  { id: 'campo', title: 'Cobros en Campo Rápidos', desc: 'Registra un pago en menos de 5 segundos con comprobante inmediato.' },
                  { id: 'whatsapp', title: 'Comprobantes por WhatsApp', desc: 'Envía el recibo oficial con QR directamente al chat del cliente.' },
                  { id: 'gps', title: 'Rutas e Historial de Atrasos', desc: 'Filtra clientes vencidos ordenados por cercanía o frecuencia.' },
                  { id: 'offline', title: 'Modo Offline Garantizado', desc: 'Sigue registrando cobros aun si entras a zonas sin cobertura de internet.' }
                ].map(tab => (
                  <div 
                    key={tab.id}
                    onClick={() => setActiveMobileTab(tab.id as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeMobileTab === tab.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">{tab.title}</h4>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeMobileTab === tab.id ? 'rotate-90 text-white' : 'text-slate-400'}`} />
                    </div>
                    {activeMobileTab === tab.id && (
                      <p className="text-xs text-indigo-100 mt-2 leading-relaxed">{tab.desc}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Visual Interactive Display */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-72 border-8 border-slate-800 bg-slate-800 rounded-[3rem] shadow-2xl p-3 aspect-[9/18]">
                <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col justify-between p-4 relative">
                  
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pb-2 border-b border-slate-100">
                    <span>9:41 AM</span>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[8px]">● EN VIVO</span>
                  </div>

                  {/* Tab Dynamic Content */}
                  <div className="space-y-3 py-2 flex-1 overflow-hidden">
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] text-indigo-600 font-bold uppercase">Cliente Actual</p>
                      <p className="text-sm font-black text-slate-800">Juan Carlos López</p>
                      <p className="text-[10px] text-slate-500">Ref: PRES-9C37D19B</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Cuota regular:</span>
                        <span className="font-bold text-slate-800">RD$ 1,250.00</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Recargo Mora:</span>
                        <span className="font-bold text-rose-600">+RD$ 0.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1">
                        <span>Total Pagado:</span>
                        <span className="text-emerald-600">RD$ 1,250.00</span>
                      </div>
                    </div>

                    <div className="bg-emerald-600 text-white p-3 rounded-2xl text-center shadow-md">
                      <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs font-bold">¡Pago Aplicado!</p>
                      <p className="text-[9px] text-emerald-100">Recibo No. REC-5E08358B</p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <button className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4 text-emerald-400" /> Enviar por WhatsApp
                  </button>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 4: SOLUCIONES POR TIPO DE PRESTAMISTA (LIGHT THEME) ─── */}
      <section className="py-14 bg-slate-100 text-slate-900 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">ADAPTABILIDAD TOTAL</span>
            <h2 className="text-3xl font-black text-slate-900">
              Diseñado para cada tipo de modelo financiero
            </h2>
          </div>

          {/* Use cases grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { id: 'personales', title: 'Préstamos Personales', icon: UserPlus, desc: 'Cobros semanales o mensuales con amortización regular e historial de garantes.' },
              { id: 'vehiculos', title: 'Financiamiento de Vehículos', icon: Landmark, desc: 'Gestión con matrículas, números de chasis en garantía e impresiones de contratos.' },
              { id: 'diario', title: 'Cobro Diario / Ruta', icon: Navigation, desc: 'Optimizado para cobradores de calle con listados rápidos de cobro por manzana.' },
              { id: 'hipotecarios', title: 'Pagarés Notariados', icon: Briefcase, desc: 'Préstamos de rédito abierto a tasa fija con amortización directa al capital principal.' }
            ].map(uc => (
              <div 
                key={uc.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all space-y-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <uc.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{uc.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: CALCULADORA DE ROI / AHORRO (LIGHT THEME) ─── */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-3xl p-8 sm:p-12 border border-indigo-100 shadow-sm text-center space-y-6">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">CALCULA TU IMPACTO</span>
            <h2 className="text-3xl font-black text-slate-900">
              ¿Cuánto tiempo y dinero ahorrarás con Ultramoney?
            </h2>
            
            <div className="max-w-md mx-auto space-y-3">
              <label className="text-xs font-bold text-slate-600 uppercase block">¿Cuántos préstamos activos manejas?</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min={10} 
                  max={500} 
                  step={10}
                  value={activeLoansCount} 
                  onChange={e => setActiveLoansCount(Number(e.target.value))}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-2xl font-black text-indigo-700">{activeLoansCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs">
                <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-black text-slate-900">+{hoursSavedPerWeek}h</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Horas ahorradas por semana</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs">
                <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-black text-emerald-600">+28%</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Incremento en cobranza a tiempo</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs">
                <DollarSign className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-black text-slate-900">RD$ {moneySavedInArrears.toLocaleString()}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Ahorro mensual estimado en moras</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: TESTIMONIOS Y RESEÑAS REALES ─── */}
      <section id="testimonios" className="py-14 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">CASOS DE ÉXITO</span>
            <h2 className="text-3xl font-black text-slate-900">
              Lo que dicen los prestamistas que ya usan Ultramoney
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Roberto Almanzar',
                role: 'Director, Inversiones Almanzar',
                text: 'Pasamos de anotar cobros en cuadernos a controlar 350 préstamos desde el celular. La función de recibo en imagen PNG nos eliminó las impresoras térmicas.',
                rating: 5,
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
              },
              {
                name: 'Lic. Laura Cordero',
                role: 'Gerente, Financiera CrediRápido',
                text: 'El abono directo a capital en pagarés abiertos fue exactamente lo que necesitábamos. Se recalculan los réditos solos y los clientes confían al 100%.',
                rating: 5,
                img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
              },
              {
                name: 'Marcos De la Cruz',
                role: 'Prestamista de Ruta Diario',
                text: 'Mis cobradores salen a la calle con la app en sus celulares. Registran los cobros y envían los recibos por WhatsApp al instante. Increíble servicio.',
                rating: 5,
                img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'
              }
            ].map((t, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex text-amber-400 gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{t.name}</h4>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: SEGURIDAD Y RESPALDO POSTGRESQL ─── */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">PROTECCIÓN TOTAL</span>
            <h2 className="text-3xl font-black text-slate-900">
              Seguridad de grado bancario para tu cartera
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <ShieldCheck className="w-8 h-8 text-indigo-600 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Aislamiento RLS en PostgreSQL</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Cada financiera cuenta con particionamiento estricto de base de datos a nivel de tabla.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <Lock className="w-8 h-8 text-indigo-600 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Encriptación SSL 256-bit</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Todas las conexiones web y transacciones están protegidas con TLS 1.3 de grado financiero.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <Database className="w-8 h-8 text-indigo-600 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Respaldos Diarios Automáticos</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Tus datos se respaldan continuamente en múltiples zonas de disponibilidad en la nube.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <Cpu className="w-8 h-8 text-indigo-600 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Disponibilidad 99.9%</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Infraestructura sobre servidores cloud ultra rápidos sin interrupciones de servicio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION ─── */}
      <section id="caracteristicas" className="py-14 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-10">
          
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">CARACTERÍSTICAS CLAVE</span>
            <h2 className="text-3xl font-black text-slate-900">
              Todo el ciclo de vida del crédito en un solo lugar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clientes & Enmascaramiento</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Expediente de clientes con formato seguro de cédula, garante y Scoring.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Motor de Préstamos y Pagarés</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Soporte completo para francés, alemana, cobro semanal o pagaré abierto.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Comprobantes & PNG 1-Clic</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Imprime tickets o descarga recibos oficial en imagen PNG directamente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section id="faq" className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">RESPUESTAS A TUS DUDAS</span>
            <h2 className="text-3xl font-black text-slate-900">Preguntas Frecuentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-2xs">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-5 py-4 text-left font-bold text-slate-800 text-xs sm:text-sm flex items-center justify-between gap-4 hover:bg-slate-100"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS FOOTER BAR ─── */}
      <footer className="stats-footer border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="stat-item space-y-1">
              <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-2xl font-black text-slate-900"><Counter end={1000} prefix="+" /></p>
              <p className="text-xs font-semibold text-slate-500">Prestamistas activos</p>
            </div>
            <div className="stat-item space-y-1">
              <Calendar className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-2xl font-black text-slate-900"><Counter end={50000} prefix="+" /></p>
              <p className="text-xs font-semibold text-slate-500">Préstamos gestionados</p>
            </div>
            <div className="stat-item space-y-1">
              <DollarSign className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-2xl font-black text-slate-900"><Counter end={200} prefix="+$" suffix="M" /></p>
              <p className="text-xs font-semibold text-slate-500">Monto administrado</p>
            </div>
            <div className="stat-item space-y-1">
              <Shield className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-2xl font-black text-slate-900">99.9%</p>
              <p className="text-xs font-semibold text-slate-500">Disponibilidad</p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-2">
              <img src="/logoultramoney.svg" alt="logo" className="w-4 h-4" />
              <span className="font-bold text-slate-700">ultramoney</span>
              <span>© {new Date().getFullYear()} Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#faq" className="hover:text-slate-600 transition-colors">Términos</a>
              <a href="#faq" className="hover:text-slate-600 transition-colors">Privacidad</a>
              <a href="#faq" className="hover:text-slate-600 transition-colors">Soporte</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
