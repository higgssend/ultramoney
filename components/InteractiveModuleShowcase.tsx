import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, Calculator, Users, ShieldCheck, MapPin, Receipt,
  Landmark, RefreshCw, FileText, ArrowRight, CheckCircle, 
  Search, ShieldAlert, Smartphone, Clock, Printer, DollarSign,
  TrendingUp, Layers, ChevronRight, Play, Check, AlertCircle,
  Percent, Sparkles, Navigation, Award, BookOpen, UserCheck,
  Scale, Building2, CreditCard, Compass, Briefcase, FilePlus
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface DemoModule {
  id: string;
  phaseId: number;
  phaseTitle: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  shortDesc: string;
  highlightKpi: { label: string; value: string; trend: string };
  features: string[];
}

export const DEMO_STAGES = [
  {
    phaseId: 1,
    number: '01',
    phaseName: 'Originación & Scoring',
    subtitle: 'Evaluación de riesgo, validación de identidad y scoring predictivo.',
    accentColor: 'indigo',
    modules: ['scoring', 'solicitud', 'fraude']
  },
  {
    phaseId: 2,
    number: '02',
    phaseName: 'Simulación & Contratos',
    subtitle: 'Calculadora de amortización, pagarés notariales y bóveda de colaterales.',
    accentColor: 'blue',
    modules: ['simulador', 'contrato', 'boveda']
  },
  {
    phaseId: 3,
    number: '03',
    phaseName: 'Cobranza en Campo & Caja',
    subtitle: 'Rutas GPS optimizadas, tickets térmicos QR y cuadre de turnos.',
    accentColor: 'emerald',
    modules: ['rutas', 'recibos', 'caja']
  },
  {
    phaseId: 4,
    number: '04',
    phaseName: 'Gestión 360° & Cartera',
    subtitle: 'Expedientes integrales, pagarés abiertos a rédito y refinanciamiento.',
    accentColor: 'amber',
    modules: ['clientes', 'redito', 'refinanciamiento']
  },
  {
    phaseId: 5,
    number: '05',
    phaseName: 'Contabilidad, NCF & Legal',
    subtitle: 'Doble partida automática, facturación DGII y cobranza judicial.',
    accentColor: 'purple',
    modules: ['contabilidad', 'ncf', 'legal']
  }
];

export const InteractiveModuleShowcase: React.FC = () => {
  const [activePhase, setActivePhase] = useState<number>(1);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('scoring');
  const containerRef = useRef<HTMLDivElement>(null);
  const showcaseCardRef = useRef<HTMLDivElement>(null);
  const demoScreenRef = useRef<HTMLDivElement>(null);

  // Synchronize first module when phase changes
  const handlePhaseChange = (phaseId: number) => {
    setActivePhase(phaseId);
    const stage = DEMO_STAGES.find(s => s.phaseId === phaseId);
    if (stage && stage.modules.length > 0) {
      setSelectedModuleId(stage.modules[0]);
    }
  };

  // Animate demo screen transition when selected module changes
  useEffect(() => {
    if (!demoScreenRef.current) return;
    gsap.fromTo(
      demoScreenRef.current,
      { opacity: 0, y: 12, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' }
    );
  }, [selectedModuleId]);

  // GSAP ScrollTrigger for Timeline & Stage Reveal
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal timeline header
      gsap.fromTo(
        '.showcase-header',
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out'
        }
      );

      // Stagger timeline phase badges
      gsap.fromTo(
        '.timeline-step-btn',
        { opacity: 0, y: 20 },
        {
          scrollTrigger: {
            trigger: '.timeline-steps-container',
            start: 'top 90%',
            toggleActions: 'play none none none'
          },
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: 'back.out(1.4)'
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      id="demo-interactivo" 
      className="py-24 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden border-t border-slate-200/80"
    >
      {/* Background Subtle Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-100/50 via-blue-50/30 to-purple-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="showcase-header text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold shadow-2xs">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>DEMO INTERACTIVO EN VIVO POR MÓDULOS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Explora el ciclo completo de tu financiera{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800">
              en tiempo real
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Interactúa con los controles en vivo de cada módulo: ajusta variables, simula scoring, genera contratos, optimiza rutas de cobro y visualiza la contabilidad en tiempo real.
          </p>
        </div>

        {/* ─── CHRONOLOGICAL TIMELINE STEPPER ─── */}
        <div className="timeline-steps-container">
          <div className="bg-white/80 backdrop-blur-md p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
              {DEMO_STAGES.map((stage) => {
                const isActive = activePhase === stage.phaseId;
                return (
                  <button
                    key={stage.phaseId}
                    type="button"
                    onClick={() => handlePhaseChange(stage.phaseId)}
                    className={`timeline-step-btn relative text-left p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-300 flex flex-col justify-between gap-2 border ${
                      isActive
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 border-indigo-600 scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                      }`}>
                        FASE {stage.number}
                      </span>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className={`text-xs sm:text-sm font-black leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {stage.phaseName}
                      </h4>
                      <p className={`text-[10.5px] line-clamp-1 mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {stage.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── MODULE SELECTOR PILLS INSIDE ACTIVE PHASE ─── */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
          {activePhase === 1 && (
            <>
              <ModulePillButton id="scoring" title="1. Scoring & Evaluación IA" icon={Search} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="solicitud" title="2. Solicitud & Originación" icon={FilePlus} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="fraude" title="3. Radar de Fraude" icon={ShieldAlert} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
            </>
          )}

          {activePhase === 2 && (
            <>
              <ModulePillButton id="simulador" title="4. Simulador Financiero" icon={Calculator} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="contrato" title="5. Pagaré Notarial Legal" icon={FileText} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="boveda" title="6. Bóveda de Garantías" icon={Landmark} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
            </>
          )}

          {activePhase === 3 && (
            <>
              <ModulePillButton id="rutas" title="7. Rutas GPS & Cobranza" icon={Navigation} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="recibos" title="8. Recibos Térmicos QR" icon={Printer} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="caja" title="9. Cuadre de Caja & Turnos" icon={DollarSign} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
            </>
          )}

          {activePhase === 4 && (
            <>
              <ModulePillButton id="clientes" title="10. Expediente 360° Cliente" icon={Users} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="redito" title="11. Pagaré a Rédito Abierto" icon={Percent} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="refinanciamiento" title="12. Refinanciación 1-Clic" icon={RefreshCw} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
            </>
          )}

          {activePhase === 5 && (
            <>
              <ModulePillButton id="contabilidad" title="13. Doble Partida Automática" icon={BarChart3} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="ncf" title="14. Facturación DGII & NCF" icon={Receipt} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
              <ModulePillButton id="legal" title="15. Cobranza Legal & Embargos" icon={Scale} activeId={selectedModuleId} onSelect={setSelectedModuleId} />
            </>
          )}
        </div>

        {/* ─── INTERACTIVE LIVE DEMO CANVAS CONTAINER ─── */}
        <div ref={showcaseCardRef} className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-slate-200/90 shadow-xl overflow-hidden">
            
            {/* Top Browser/Window Style Chrome Header */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="text-xs font-mono font-bold text-slate-500 ml-2">
                  ultramoney.app/demo/{selectedModuleId}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  DEMO ACTIVA INTERACTIVA
                </span>
              </div>
            </div>

            {/* Main Interactive Screen Content */}
            <div ref={demoScreenRef} className="p-5 sm:p-8 lg:p-10">
              {renderLiveInteractiveWidget(selectedModuleId)}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

/* ─── MODULE PILL BUTTON COMPONENT ─── */
const ModulePillButton: React.FC<{
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  activeId: string;
  onSelect: (id: string) => void;
}> = ({ id, title, icon: Icon, activeId, onSelect }) => {
  const isSelected = activeId === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
        isSelected
          ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-indigo-600'}`} />
      <span>{title}</span>
    </button>
  );
};

/* ─── RENDER LIVE INTERACTIVE WIDGET SWITCH ─── */
function renderLiveInteractiveWidget(moduleId: string): React.ReactNode {
  switch (moduleId) {
    case 'scoring':
      return <LiveScoringDemo />;
    case 'solicitud':
      return <LiveSolicitudDemo />;
    case 'fraude':
      return <LiveFraudeDemo />;
    case 'simulador':
      return <LiveSimulatorDemo />;
    case 'contrato':
      return <LiveContratoDemo />;
    case 'boveda':
      return <LiveBovedaDemo />;
    case 'rutas':
      return <LiveRutasDemo />;
    case 'recibos':
      return <LiveReciboDemo />;
    case 'caja':
      return <LiveCajaDemo />;
    case 'clientes':
      return <LiveCliente360Demo />;
    case 'redito':
      return <LiveReditoDemo />;
    case 'refinanciamiento':
      return <LiveRefinanceDemo />;
    case 'contabilidad':
      return <LiveContabilidadDemo />;
    case 'ncf':
      return <LiveNcfDemo />;
    case 'legal':
      return <LiveLegalDemo />;
    default:
      return <LiveScoringDemo />;
  }
}

/* ══════════════════════════════════════════════════════════════
   1. LIVE DEMO: SCORING & EVALUACIÓN IA
   ══════════════════════════════════════════════════════════════ */
const LiveScoringDemo: React.FC = () => {
  const [income, setIncome] = useState<number>(65000);
  const [history, setHistory] = useState<'excelente' | 'regular' | 'moroso'>('excelente');
  const [requested, setRequested] = useState<number>(100000);

  const baseScore = history === 'excelente' ? 780 : history === 'regular' ? 620 : 440;
  const ratio = Math.min(1, income / (requested * 0.15));
  const finalScore = Math.round(baseScore * 0.8 + ratio * 160);
  const isApproved = finalScore >= 600;
  const maxApprovedAmount = Math.round(income * 2.5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left interactive controls */}
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 01 · Scoring Automatizado
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Motor de Evaluación & Scoring Crediticio</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Modifica los ingresos y el historial para ver cómo el algoritmo calcula el score FICO/Buró propio y dictamina la aprobación en menos de 1 segundo.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Ingresos Mensuales Demostrables:</span>
              <span className="text-indigo-600 font-mono">RD$ {income.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={15000} max={250000} step={5000} value={income}
              onChange={e => setIncome(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Monto Solicitado:</span>
              <span className="text-indigo-600 font-mono">RD$ {requested.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={20000} max={300000} step={10000} value={requested}
              onChange={e => setRequested(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Comportamiento en Créditos Anteriores:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['excelente', 'regular', 'moroso'] as const).map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHistory(h)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl capitalize transition-all border ${
                    history === h
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {h === 'excelente' ? '✓ Excelente' : h === 'regular' ? '⚠ Regular' : '✕ Moroso'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right live result canvas */}
      <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider">Dictamen de Riesgo</span>
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${
            isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
          }`}>
            {isApproved ? 'APROBADO RECOMENDADO' : 'REQUIERE GARANTE SOLIDARIO'}
          </span>
        </div>

        {/* Score Radial Indicator */}
        <div className="flex items-center justify-around py-2">
          <div className="text-center space-y-1">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              {finalScore} <span className="text-base text-slate-400 font-sans">/ 850</span>
            </div>
            <p className="text-xs text-indigo-200 font-semibold">
              Rango: {finalScore >= 700 ? 'A+ Bajo Riesgo' : finalScore >= 600 ? 'B+ Riesgo Moderado' : 'C- Alto Riesgo'}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl">
            <span className="text-slate-400 block text-[10px]">Límite Máximo Sugerido:</span>
            <span className="text-base font-black text-emerald-400 font-mono">RD$ {maxApprovedAmount.toLocaleString()}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl">
            <span className="text-slate-400 block text-[10px]">Tasa de Interés Sugerida:</span>
            <span className="text-base font-black text-indigo-300 font-mono">{finalScore >= 700 ? '4.0%' : finalScore >= 600 ? '5.5%' : '8.0%'} mensual</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   2. LIVE DEMO: SOLICITUD DIGITAL & ORIGINACIÓN
   ══════════════════════════════════════════════════════════════ */
const LiveSolicitudDemo: React.FC = () => {
  const [loanType, setLoanType] = useState<string>('vehiculo');
  const [amount, setAmount] = useState<number>(180000);
  const [initialPercent, setInitialPercent] = useState<number>(20);

  const initialRequired = Math.round(amount * (initialPercent / 100));
  const financedAmount = amount - initialRequired;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 02 · Originación Digital
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Captura de Solicitud & Inicial</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Permite originar solicitudes desde el celular o mostrador, calcular la inicial requerida y adjuntar expedientes al instante.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Destino / Tipo de Financiamiento:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'personal', label: 'Personal' },
                { id: 'vehiculo', label: 'Vehículo' },
                { id: 'comercial', label: 'Comercial' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLoanType(t.id)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all border ${
                    loanType === t.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Valor Total del Bien / Préstamo:</span>
              <span className="text-indigo-600 font-mono">RD$ {amount.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={30000} max={500000} step={10000} value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Porcentaje de Inicial Requerida:</span>
              <span className="text-indigo-600 font-mono">{initialPercent}%</span>
            </div>
            <input 
              type="range" min={0} max={50} step={5} value={initialPercent}
              onChange={e => setInitialPercent(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-black text-slate-900">Resumen de Originación</h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
            EXPEDIENTE #SOL-8921
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Monto Total del Bien:</span>
            <span className="font-bold text-slate-900 font-mono">RD$ {amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Inicial a Cobrar ({initialPercent}%):</span>
            <span className="font-bold text-amber-600 font-mono">RD$ {initialRequired.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 text-sm font-black">
            <span className="text-slate-900">Monto Neto a Financiar:</span>
            <span className="text-indigo-600 font-mono">RD$ {financedAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 text-xs">
          <p className="font-bold text-slate-700">Checklist Digital Automático:</p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Cédula Identidad</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Carta de Ingresos</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Título / Matrícula</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Garante Verificado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   3. LIVE DEMO: RADAR DE FRAUDE & RELACIONES
   ══════════════════════════════════════════════════════════════ */
const LiveFraudeDemo: React.FC = () => {
  const [crossMatches, setCrossMatches] = useState<number>(3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 03 · Blindaje de Seguridad
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Radar Antifraude & Red de Garantes</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Detecta automáticamente deudores cruzados, números telefónicos compartidos entre solicitantes y sobreendeudamiento oculto.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Coincidencias en Base de Datos:</span>
              <span className="text-rose-600 font-bold">{crossMatches} alertas activas</span>
            </div>
            <input 
              type="range" min={0} max={5} step={1} value={crossMatches}
              onChange={e => setCrossMatches(Number(e.target.value))}
              className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Ajusta el slider para simular cómo el radar identifica vínculos entre deudores y garantes antes de soltar el dinero.
          </p>
        </div>
      </div>

      <div className="lg:col-span-6 bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-black uppercase">Monitor de Alertas Cruzadas</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            crossMatches > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            {crossMatches > 0 ? 'RIESGO DETECTADO' : 'EXPEDIENTE LIMPIO'}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {crossMatches >= 1 && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between">
              <span className="text-rose-200">Mismo Teléfono registrado en otro deudor moroso</span>
              <span className="font-mono text-[10px] bg-rose-900 px-2 py-0.5 rounded text-rose-200">809-555-0199</span>
            </div>
          )}
          {crossMatches >= 2 && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
              <span className="text-amber-200">Garante Solidario ya figura en 2 préstamos activos</span>
              <span className="font-mono text-[10px] bg-amber-900 px-2 py-0.5 rounded text-amber-200">Deuda: RD$ 240k</span>
            </div>
          )}
          {crossMatches >= 3 && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between">
              <span className="text-rose-200">Dirección residencial vinculada a caso legal previo</span>
              <span className="font-mono text-[10px] bg-rose-900 px-2 py-0.5 rounded text-rose-200">Sector Los Mina</span>
            </div>
          )}
          {crossMatches === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl text-center space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-emerald-300">Cero vínculos de riesgo encontrados</p>
              <p className="text-[11px] text-slate-400">El cliente no registra garantes compartidos ni deudas impagas en sucursales.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   4. LIVE DEMO: SIMULADOR FINANCIERO AVANZADO
   ══════════════════════════════════════════════════════════════ */
const LiveSimulatorDemo: React.FC = () => {
  const [amount, setAmount] = useState<number>(50000);
  const [rate, setRate] = useState<number>(5);
  const [months, setMonths] = useState<number>(6);
  const [frequency, setFrequency] = useState<'Mensual' | 'Quincenal' | 'Semanal'>('Mensual');
  const [enableClosingFee, setEnableClosingFee] = useState<boolean>(false);

  const installments = frequency === 'Semanal' ? months * 4 : frequency === 'Quincenal' ? months * 2 : months;
  const totalInterest = Math.round((amount * (rate / 100)) * months);
  const closingFee = enableClosingFee ? Math.round(amount * 0.05) : 0;
  const totalToPay = amount + totalInterest + closingFee;
  const quota = Math.round(totalToPay / Math.max(1, installments));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 04 · Simulador Financiero
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Amortización en Vivo & Cuotas</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Calcula tablas de amortización exactas para cuotas fijas, préstamos semanales y quincenales sin desfases de centavos.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Capital a Prestar:</span>
              <span className="text-indigo-600 font-mono">RD$ {amount.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={5000} max={300000} step={5000} value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Tasa Mensual:</span>
                <span className="text-indigo-600 font-mono">{rate}%</span>
              </div>
              <input 
                type="range" min={1} max={20} step={0.5} value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Plazo:</span>
                <span className="text-indigo-600 font-mono">{months} meses</span>
              </div>
              <input 
                type="range" min={1} max={24} step={1} value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Frecuencia de Pago:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Mensual', 'Quincenal', 'Semanal'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all border ${
                    frequency === f
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-700">Incluir Gastos de Cierre (5%):</span>
            <button
              type="button"
              onClick={() => setEnableClosingFee(!enableClosingFee)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                enableClosingFee ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {enableClosingFee ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-black uppercase text-indigo-300">Resumen de Amortización</span>
          <span className="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded text-white">
            {installments} Cuotas {frequency}es
          </span>
        </div>

        <div className="text-center py-2 space-y-1">
          <span className="text-xs text-slate-300 font-semibold block">Monto de la Cuota {frequency}:</span>
          <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
            RD$ {quota.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-white/10">
          <div className="bg-white/5 p-2.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Capital</span>
            <span className="font-bold text-white font-mono">RD$ {amount.toLocaleString()}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Interés Total</span>
            <span className="font-bold text-indigo-300 font-mono">RD$ {totalInterest.toLocaleString()}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Total a Pagar</span>
            <span className="font-bold text-emerald-300 font-mono">RD$ {totalToPay.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   5. LIVE DEMO: PAGARÉ NOTARIAL LEGAL & CONTRATO
   ══════════════════════════════════════════════════════════════ */
const LiveContratoDemo: React.FC = () => {
  const [notaryName, setNotaryName] = useState<string>('Lic. Fernando Morales Peña');
  const [loanAmount, setLoanAmount] = useState<number>(75000);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 05 · Seguridad Jurídica
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Pagaré Notarial Legal con Código QR</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Emite contratos y pagarés notariales formalizados con sello digital, cláusulas de mora judicial y verificación QR instantánea.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre del Abogado-Notario Público:</label>
            <input 
              type="text" 
              value={notaryName}
              onChange={e => setNotaryName(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-xl font-bold bg-white border-slate-200"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Monto a Legalizar:</span>
              <span className="text-indigo-600 font-mono">RD$ {loanAmount.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={20000} max={250000} step={5000} value={loanAmount}
              onChange={e => setLoanAmount(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-amber-50/40 p-6 sm:p-7 rounded-3xl border border-amber-200/80 shadow-md space-y-3 font-serif text-slate-900 text-xs leading-relaxed">
        <div className="text-center border-b border-amber-200 pb-2 space-y-1 font-sans">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">ACTO NOTARIAL NO. 2026-089</span>
          <h4 className="text-sm font-black uppercase text-slate-900">PAGARÉ NOTARIAL AUTÉNTICO & INCONDICIONAL</h4>
        </div>
        <p className="text-[11px] text-justify text-slate-700">
          EN LA CIUDAD DE SANTO DOMINGO, a los dieciséis (16) días del mes de agosto del año dos mil veintiséis (2026). Por ante mí, <strong>{notaryName}</strong>, Abogado Notario Público de los del Número del Distrito Nacional, matriculado bajo el No. 4921...
        </p>
        <div className="bg-white p-3 rounded-xl border border-amber-200 font-sans text-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 block">Suma Reconocida:</span>
            <strong className="text-sm font-mono text-slate-900">RD$ {loanAmount.toLocaleString()}</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Cláusula de Mora:</span>
            <strong className="text-xs text-rose-600">5% mensual pactado</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   6. LIVE DEMO: BÓVEDA DE GARANTÍAS
   ══════════════════════════════════════════════════════════════ */
const LiveBovedaDemo: React.FC = () => {
  const [itemType, setItemType] = useState<'vehiculo' | 'joya' | 'inmueble'>('vehiculo');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 06 · Control de Custodia
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Bóveda Digital & Resguardo de Colaterales</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Control de ubicación física de matrículas, prendas de oro, contratos firmados y llaves en bóveda con código de barra.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">Seleccionar Tipo de Garantía en Custodia:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'vehiculo', label: 'Matrícula Vehículo' },
              { id: 'joya', label: 'Joyas Oro 14k' },
              { id: 'inmueble', label: 'Título Propiedad' }
            ].map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setItemType(b.id as 'vehiculo' | 'joya' | 'inmueble')}
                className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                  itemType === b.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold uppercase">Ubicación en Bóveda: Gaveta A-04</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
            EN CUSTODIA SEGURA
          </span>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Descripción:</span>
            <span className="font-bold text-white">
              {itemType === 'vehiculo' ? 'Matrícula Honda Civic 2019 (Placa A-918231)' : itemType === 'joya' ? 'Cadena Oro 14k (32.4 gramos tasados)' : 'Título de Solar 420m2 Manzana 12'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tasación Estimada:</span>
            <span className="font-mono font-bold text-emerald-400">RD$ {itemType === 'vehiculo' ? '650,000' : itemType === 'joya' ? '125,000' : '1,800,000'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Ratio Cobertura (LTV):</span>
            <span className="font-mono font-bold text-indigo-300">180% de la deuda</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   7. LIVE DEMO: RUTAS GPS & COBRO EN CALLE
   ══════════════════════════════════════════════════════════════ */
const LiveRutasDemo: React.FC = () => {
  const [activeStop, setActiveStop] = useState<number>(1);

  const stops = [
    { id: 1, name: 'Colmado La Esperanza (Juan)', amount: 1500, time: '09:15 AM', status: 'Cobrado' },
    { id: 2, name: 'Taller San Martín (Pedro)', amount: 2800, time: '10:00 AM', status: 'En Ruta' },
    { id: 3, name: 'Boutique Bella (María)', amount: 3200, time: '10:45 AM', status: 'Pendiente' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 07 · Logística de Calle
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Rutas GPS Optimizadas para Cobradores</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Organiza el recorrido diario de los cobradores por cercanía geográfica, minimizando tiempo y combustible.
          </p>
        </div>

        <div className="space-y-2">
          {stops.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStop(s.id)}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                activeStop === s.id
                  ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  activeStop === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {s.id}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                  <span className="text-[10px] text-slate-500">Hora estimada: {s.time}</span>
                </div>
              </div>
              <span className="font-mono text-xs font-black text-emerald-600">RD$ {s.amount.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-6 bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-black uppercase">Monitor de Ruta en Vivo</span>
          </div>
          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full">
            GPS ACTIVO
          </span>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total a Cobrar en Ruta:</span>
            <span className="font-mono font-black text-emerald-400 text-base">RD$ 7,500</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Cobrado al Momento:</span>
            <span className="font-mono font-bold text-white">RD$ 1,500 (20%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-1/5 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   8. LIVE DEMO: RECIBOS TÉRMICOS & WHATSAPP
   ══════════════════════════════════════════════════════════════ */
const LiveReciboDemo: React.FC = () => {
  const [amountPaid, setAmountPaid] = useState<number>(3500);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 08 · Comprobantes Térmicos
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Emisión de Tickets & Envío WhatsApp</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Genera comprobantes oficiales en impresoras térmicas Bluetooth de 58mm/80mm y compártelos por WhatsApp en 1 solo clic.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Monto Cobrado (RD$):</span>
              <span className="text-indigo-600 font-mono">RD$ {amountPaid.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={500} max={15000} step={500} value={amountPaid}
              onChange={e => setAmountPaid(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 flex justify-center">
        <div className="w-full max-w-sm bg-white text-slate-900 p-5 rounded-3xl border border-slate-300 shadow-xl font-mono text-xs space-y-2.5">
          <div className="text-center border-b border-dashed border-slate-300 pb-2 space-y-0.5">
            <h4 className="font-bold text-sm">ULTRAMONEY FINANCIAL</h4>
            <p className="text-[10px] text-slate-500">RNC: 1-32-45678-9</p>
            <p className="text-[10px] text-slate-500">RECIBO NO.: REC-00892</p>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span>Cliente:</span><span className="font-bold">Juan Pérez</span></div>
            <div className="flex justify-between"><span>Fecha:</span><span>16/08/2026 12:30 PM</span></div>
            <div className="flex justify-between"><span>Método:</span><span>Efectivo</span></div>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-2 flex justify-between font-bold text-sm">
            <span>MONTO PAGADO:</span>
            <span className="text-emerald-600">RD$ {amountPaid.toLocaleString()}</span>
          </div>

          <div className="text-[10px] space-y-0.5 text-slate-600">
            <div className="flex justify-between"><span>Balance Anterior:</span><span>RD$ 45,000</span></div>
            <div className="flex justify-between font-bold text-slate-900"><span>Nuevo Balance:</span><span>RD$ {(45000 - amountPaid).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Próximo Pago:</span><span>16/09/2026</span></div>
          </div>

          <div className="text-center pt-2 text-[9px] text-slate-400">
            [ QR Validación Oficial ]
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   9. LIVE DEMO: CUADRE DE CAJA & TURNOS
   ══════════════════════════════════════════════════════════════ */
const LiveCajaDemo: React.FC = () => {
  const [openingBalance] = useState<number>(10000);
  const [cashCollected, setCashCollected] = useState<number>(42500);
  const [expenses, setExpenses] = useState<number>(2000);

  const theoreticalBalance = openingBalance + cashCollected - expenses;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 09 · Control de Efectivo
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Apertura, Turnos & Cuadre de Caja</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Evita descuadres al cierre del día comparando los cobros registrados en sistema contra el efectivo contado.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Cobros del Turno en Efectivo:</span>
              <span className="text-emerald-600 font-mono">RD$ {cashCollected.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={10000} max={100000} step={2500} value={cashCollected}
              onChange={e => setCashCollected(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Gastos Operativos / Retiros de Caja:</span>
              <span className="text-rose-600 font-mono">RD$ {expenses.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={0} max={10000} step={500} value={expenses}
              onChange={e => setExpenses(Number(e.target.value))}
              className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-black uppercase text-indigo-400">Cuadre de Turno Diario</span>
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
            CAJA CUADRADA ✓
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Fondo Inicial de Apertura:</span>
            <span className="font-mono font-bold">RD$ {openingBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">(+) Cobros Totales:</span>
            <span className="font-mono font-bold text-emerald-400">+ RD$ {cashCollected.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">(-) Gastos Menores:</span>
            <span className="font-mono font-bold text-rose-400">- RD$ {expenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-black">
            <span>Efectivo Esperado en Gaveta:</span>
            <span className="font-mono text-indigo-300">RD$ {theoreticalBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   10. LIVE DEMO: EXPEDIENTE CLIENTE 360°
   ══════════════════════════════════════════════════════════════ */
const LiveCliente360Demo: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-4">
        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
          Módulo 10 · Gestión 360°
        </span>
        <h3 className="text-2xl font-black text-slate-900">Historial & Expediente Integral</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Accede al perfil digital de cada cliente con historial de préstamos, puntualidad en pagos, documentos adjuntos y referencias familiares.
        </p>
      </div>

      <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-lg">
            JP
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Juan Carlos Pérez Gómez</h4>
            <p className="text-xs text-slate-500 font-mono">Cédula: 001-1829384-2 · Tel: (809) 555-0144</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Préstamos Pagados</span>
            <strong className="text-slate-900 font-mono text-sm">6 préstamos</strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Puntualidad</span>
            <strong className="text-emerald-600 font-mono text-sm">98% a tiempo</strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Score FICO</span>
            <strong className="text-indigo-600 font-mono text-sm">765 pts</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   11. LIVE DEMO: PAGARÉ A RÉDITO ABIERTO
   ══════════════════════════════════════════════════════════════ */
const LiveReditoDemo: React.FC = () => {
  const [capital, setCapital] = useState<number>(100000);
  const [abono, setAbono] = useState<number>(20000);
  const rate = 0.05;

  const initialMonthlyInterest = capital * rate;
  const newCapital = Math.max(0, capital - abono);
  const newMonthlyInterest = newCapital * rate;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 11 · Préstamos Abiertos
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Pagaré Abierto / Solo Interés (Rédito)</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Al realizar un abono a capital, el sistema recalcula automáticamente el nuevo interés mensual a pagar.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Capital Actual Prestado:</span>
              <span className="text-indigo-600 font-mono">RD$ {capital.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={30000} max={300000} step={10000} value={capital}
              onChange={e => setCapital(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Abono Extraordinario a Capital:</span>
              <span className="text-emerald-600 font-mono">RD$ {abono.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={5000} max={capital} step={5000} value={abono}
              onChange={e => setAbono(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-4">
        <div className="border-b border-white/10 pb-3">
          <span className="text-xs font-black uppercase text-indigo-300">Recálculo de Rédito Mensual</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-white/5 p-3.5 rounded-2xl">
            <span className="text-slate-400 block text-[10px]">Interés Anterior:</span>
            <span className="text-base font-black text-slate-300 font-mono">RD$ {initialMonthlyInterest.toLocaleString()}/mes</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl">
            <span className="text-emerald-300 block text-[10px]">Nuevo Interés Reducido:</span>
            <span className="text-base font-black text-emerald-400 font-mono">RD$ {newMonthlyInterest.toLocaleString()}/mes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   12. LIVE DEMO: REFINANCIACIÓN 1-CLIC
   ══════════════════════════════════════════════════════════════ */
const LiveRefinanceDemo: React.FC = () => {
  const activeDebt = 35000;
  const [newAmount, setNewAmount] = useState<number>(80000);
  const netDisbursement = Math.max(0, newAmount - activeDebt);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 12 · Reestructuración
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Refinanciamiento & Consolidación en 1-Clic</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Absorbe deudas activas anteriores en un nuevo préstamo unificado, entregando el excedente neto en mano.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Nuevo Monto Solicitado:</span>
              <span className="text-indigo-600 font-mono">RD$ {newAmount.toLocaleString()}</span>
            </div>
            <input 
              type="range" min={40000} max={200000} step={5000} value={newAmount}
              onChange={e => setNewAmount(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-3 text-xs">
        <h4 className="font-black text-slate-900 border-b pb-2">Liquidación de Refinanciamiento</h4>
        <div className="flex justify-between text-slate-600">
          <span>Nuevo Préstamo Aprobado:</span>
          <span className="font-bold text-slate-900 font-mono">RD$ {newAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-rose-600">
          <span>(-) Cancelación Saldo Préstamo Anterior:</span>
          <span className="font-bold font-mono">- RD$ {activeDebt.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-2 border-t text-sm font-black text-emerald-600">
          <span>Dinero Neto a Entregar al Cliente:</span>
          <span className="font-mono">RD$ {netDisbursement.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   13. LIVE DEMO: CONTABILIDAD DOBLE PARTIDA
   ══════════════════════════════════════════════════════════════ */
const LiveContabilidadDemo: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-4">
        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
          Módulo 13 · Contabilidad Profunda
        </span>
        <h3 className="text-2xl font-black text-slate-900">Asientos Automáticos de Partida Doble</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Cada desembolso y cobro de cuota genera el asiento contable correspondiente en tiempo real sin intervención manual.
        </p>
      </div>

      <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-3 font-mono text-xs">
        <div className="text-indigo-400 font-bold border-b border-white/10 pb-2">ASIENTO AUTOMÁTICO #AST-4910</div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-emerald-300">
            <span>[1.1.01] Débito: Caja General / Cobros</span>
            <span>RD$ 5,000.00</span>
          </div>
          <div className="flex justify-between text-slate-300 pl-4">
            <span>[1.1.05] Crédito: Cartera Capital</span>
            <span>RD$ 3,800.00</span>
          </div>
          <div className="flex justify-between text-indigo-300 pl-4">
            <span>[4.1.01] Crédito: Ingresos por Intereses</span>
            <span>RD$ 1,200.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   14. LIVE DEMO: FACTURACIÓN DGII & NCF
   ══════════════════════════════════════════════════════════════ */
const LiveNcfDemo: React.FC = () => {
  const [ncfType, setNcfType] = useState<string>('B02');
  const [amount] = useState<number>(10000);
  const itbis = Math.round(amount * 0.18);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-4">
        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
          Módulo 14 · Cumplimiento Fiscal
        </span>
        <h3 className="text-2xl font-black text-slate-900">Emisión Fiscal NCF (DGII)</h3>
        <div className="flex gap-2 pt-2">
          {['B01', 'B02', 'B14'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setNcfType(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                ncfType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              Tipo {t}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-2 text-xs font-mono">
        <div className="text-center border-b pb-2 font-bold">COMPROBANTE FISCAL VÁLIDO</div>
        <div className="flex justify-between"><span>NCF:</span><span className="font-bold text-indigo-600">{ncfType}00008492</span></div>
        <div className="flex justify-between"><span>Subtotal:</span><span>RD$ {(amount - itbis).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>ITBIS (18%):</span><span>RD$ {itbis.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold border-t pt-1 text-sm"><span>TOTAL:</span><span>RD$ {amount.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   15. LIVE DEMO: COBRANZA LEGAL & EMBARGOS
   ══════════════════════════════════════════════════════════════ */
const LiveLegalDemo: React.FC = () => {
  const [daysLate, setDaysLate] = useState<number>(45);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            Módulo 15 · Cobranza Legal
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">Expedientes Judiciales & Embargos</h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Flujo escalonado automático para préstamos en mora severa con intimaciones de pago y ejecución notarial.
          </p>
        </div>

        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Días de Mora Acumulados:</span>
            <span className="text-rose-600 font-mono font-black">{daysLate} días</span>
          </div>
          <input 
            type="range" min={15} max={120} step={5} value={daysLate}
            onChange={e => setDaysLate(Number(e.target.value))}
            className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-3 text-xs">
        <span className="text-xs font-black uppercase text-rose-400">Etapa Procesal Recomendada</span>
        <div className="p-4 bg-white/5 rounded-2xl space-y-1.5">
          <strong className="text-sm text-white block">
            {daysLate < 30 ? 'Fase 1: Notificación Amistosa / SMS' : daysLate < 60 ? 'Fase 2: Intimación Notarial de Pago (48h)' : 'Fase 3: Ejecución de Pagaré & Embargo Conservatorio'}
          </strong>
          <p className="text-[11px] text-slate-400">
            {daysLate < 30 ? 'Envío automático de recordatorios por WhatsApp y llamada de cobranza preventiva.' : daysLate < 60 ? 'Emisión de intimación notariada formal requiriendo el saldo total de la deuda.' : 'Apoderamiento formal a abogado colegiado para ejecución de colateral en garantía.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveModuleShowcase;
