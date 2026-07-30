import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, HelpCircle, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import gsap from 'gsap';

const PricingFeature: React.FC = () => {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (headerRef.current) {
        tl.fromTo(headerRef.current.children, 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }
        );
    }

    if (cardsRef.current) {
        tl.fromTo(cardsRef.current.children,
            { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.2 },
            "-=0.4"
        );
    }
    
    if (featuresRef.current) {
        tl.fromTo(featuresRef.current.children,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
            "-=0.4"
        );
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl transition-all duration-300">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors font-bold group">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Volver
            </button>
            <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                Precios
            </span>
            <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/20 hover:scale-105 hover:bg-slate-800 transition-all duration-300">
                Comenzar Gratis
            </button>
        </nav>
      </div>

      <section className="pt-40 pb-20 px-6 text-center max-w-5xl mx-auto relative z-10">
          <div ref={headerRef}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 font-medium text-sm mb-8 border border-rose-200/50 dark:border-rose-800/50">
                  <Sparkles className="w-4 h-4" /> Planes Transparentes
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                  Precios que escalan <br/> con tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-500">negocio</span>.
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed mb-16 max-w-2xl mx-auto font-medium">
                  Empieza completamente gratis. Sin costos ocultos, sin tarjetas de crédito requeridas.
              </p>
          </div>

          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              {/* Free Tier */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Shield className="w-32 h-32 text-slate-900 dark:text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Starter</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Para pequeños prestamistas.</p>
                  <div className="mb-8">
                      <span className="text-5xl font-extrabold text-slate-900 dark:text-white">$0</span>
                      <span className="text-slate-500">/mes</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                      {["Hasta 50 Préstamos Activos", "Gestión de Clientes Básica", "Soporte por Comunidad", "Portal de Cliente Limitado"].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                              <Check className="w-5 h-5 text-emerald-500" /> {item}
                          </li>
                      ))}
                  </ul>
                  <button onClick={() => navigate('/register')} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      Empezar Gratis
                  </button>
              </div>

              {/* Pro Tier */}
              <div className="bg-slate-900 dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl shadow-rose-500/20 border border-slate-800 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap className="w-32 h-32 text-rose-500" />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-indigo-500" />
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold mb-4">
                      MÁS POPULAR
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <p className="text-slate-400 mb-6">Para financieras en crecimiento.</p>
                  <div className="mb-8">
                      <span className="text-5xl font-extrabold text-white">$49</span>
                      <span className="text-slate-400">/mes</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                      {["Préstamos Ilimitados", "Gestión de Contabilidad Avanzada", "Reportes en Tiempo Real", "Portal de Clientes VIP", "Soporte Prioritario 24/7"].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                              <Check className="w-5 h-5 text-rose-400" /> {item}
                          </li>
                      ))}
                  </ul>
                  <button onClick={() => navigate('/register')} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/25">
                      Prueba Gratuita de 14 Días
                  </button>
              </div>
          </div>
      </section>

      <section className="py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-6">
              <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                      <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Transparencia Total.</h3>
                      <ul className="space-y-6">
                          {[
                              { title: "Sin costos de instalación", desc: "No cobramos por darte de alta en la plataforma." },
                              { title: "Actualizaciones gratuitas", desc: "Recibe nuevas funcionalidades sin pagar extra." },
                              { title: "Libre de ataduras", desc: "Cancela o cambia tu plan en cualquier momento." }
                          ].map((item, i) => (
                              <li key={i} className="flex gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shrink-0">
                                      <Check className="w-6 h-6" />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">{item.title}</h4>
                                      <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
                      <div className="flex items-center gap-4 mb-6">
                          <HelpCircle className="w-10 h-10 text-indigo-500" />
                          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Garantía de 30 Días</h4>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                          Si no estás 100% satisfecho con Ultramoney en los primeros 30 días del plan Pro, te devolvemos tu dinero sin preguntas.
                      </p>
                      <button onClick={() => navigate('/register')} className="group flex items-center justify-center gap-2 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-opacity">
                          Crear Cuenta Ahora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
};

export default PricingFeature;

