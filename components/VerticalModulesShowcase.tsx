import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Search, FilePlus, Users, Banknote, 
  CalendarClock, AlertTriangle, Wallet, Briefcase, 
  TrendingDown, TrendingUp, UserCog, Tags, 
  BookOpen, Smartphone, FileText, Settings,
  Calculator, Database, ShieldCheck, DollarSign, Package, Landmark, Building2,
  ArrowLeftRight, LineChart, Store, MapPin, Scale, Lock, Activity, ShieldAlert,
  Printer, Check, Play, Sparkles, RefreshCw, ChevronRight, CheckCircle, Percent,
  ArrowRight, Shield, AlertCircle, Clock, FileCheck, Send, Compass, Eye,
  Sliders, ChevronDown, CheckSquare, XCircle, Share2, Copy
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const VerticalModulesShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainScroller = document.querySelector('main') || window;

    const handleMainScroll = () => {
      ScrollTrigger.update();
    };
    if (mainScroller instanceof HTMLElement) {
      mainScroller.addEventListener('scroll', handleMainScroll);
    }
    window.addEventListener('scroll', handleMainScroll);

    // Refresh ScrollTrigger so all positions calculate precisely
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.vertical-module-card');
      cards.forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            scroller: mainScroller,
            start: 'top 92%',
            toggleActions: 'play none none none'
          },
          y: 30,
          duration: 0.5,
          ease: 'power2.out',
          clearProps: 'all' // Guarantee no stuck opacity/transform properties
        });
      });
    }, containerRef);

    return () => {
      clearTimeout(timer);
      if (mainScroller instanceof HTMLElement) {
        mainScroller.removeEventListener('scroll', handleMainScroll);
      }
      window.removeEventListener('scroll', handleMainScroll);
      ctx.revert();
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      id="caracteristicas" 
      className="py-20 bg-slate-50/80 relative overflow-hidden border-t border-b border-slate-200/80"
    >
      {/* Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-r from-blue-100/50 via-indigo-100/40 to-purple-100/50 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Main Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-800 text-xs font-black uppercase tracking-widest shadow-2xs">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>ECOSISTEMA COMPLETO · 22 MÓDULOS DEL SISTEMA</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Cada módulo del sistema en una experiencia{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800">
              interactiva y vertical
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Interactúa en vivo con cada una de las 22 herramientas del sidebar de UltraMoney. Prueba los cálculos, controles y flujos reales diseñados para financieras, prestamistas y casas de empeño.
          </p>
        </div>

        {/* ─── VERTICAL STACK OF ALL 22 SIDEBAR MODULES ─── */}
        <div className="space-y-12">

          {/* 1. DASHBOARD */}
          <VerticalModuleCard
            number="01"
            title="Dashboard Central & Monitor de KPIs"
            category="Panel Ejecutivo"
            icon={LayoutDashboard}
            iconBg="from-blue-600 to-indigo-600"
            desc="Panel de control en tiempo real para visualizar cobranza del día, capital activo colocado, cartera en mora, liquidez bancaria y efectividad de cobro."
            kpi={{ label: 'Tiempo Ahorrado en Cierres', value: '95%', tag: 'Automatizado' }}
          >
            <InteractiveDashboardDemo />
          </VerticalModuleCard>

          {/* 2. FACTURAS & NCF */}
          <VerticalModuleCard
            number="02"
            title="Facturas Electrónicas & Comprobantes NCF (DGII)"
            category="Facturación & Cumplimiento Fiscal"
            icon={FileText}
            iconBg="from-indigo-600 to-violet-600"
            desc="Emisión automática de secuencias NCF autorizadas (B01 Crédito Fiscal, B02 Consumidor Final, B14 Régimen Especial) con cálculo de ITBIS 18%."
            kpi={{ label: 'Cumplimiento Legal DGII', value: '100% Válido', tag: 'Reportes 606/607' }}
          >
            <InteractiveFacturasDemo />
          </VerticalModuleCard>

          {/* 3. CONSULTA & SCORING */}
          <VerticalModuleCard
            number="03"
            title="Consulta Crediticia & Scoring Preventivo"
            category="Evaluación de Riesgo"
            icon={Search}
            iconBg="from-violet-600 to-purple-600"
            desc="Motor predictivo de score crediticio (300 a 850 puntos). Evalúa capacidad de pago, nivel de endeudamiento y emite recomendación instantánea."
            kpi={{ label: 'Reducción de Cartera Incobrable', value: '-42%', tag: 'Scoring Preventivo' }}
          >
            <InteractiveScoringDemo />
          </VerticalModuleCard>

          {/* 4. SOLICITUD & ORIGINACIÓN */}
          <VerticalModuleCard
            number="04"
            title="Solicitud Digital & Originación de Crédito"
            category="Originación Comercial"
            icon={FilePlus}
            iconBg="from-blue-600 to-cyan-600"
            desc="Captura ágil de solicitudes desde cualquier dispositivo, cálculo de inicial mínima requerida, checklist de documentos y aprobación jerárquica."
            kpi={{ label: 'Tiempo de Originación', value: '10 mins', tag: 'Sin Papeles' }}
          >
            <InteractiveSolicitudDemo />
          </VerticalModuleCard>

          {/* 5. SIMULADOR FINANCIERO */}
          <VerticalModuleCard
            number="05"
            title="Simulador Financiero & Amortización Exacta"
            category="Cálculo Financiero"
            icon={Calculator}
            iconBg="from-emerald-600 to-teal-600"
            desc="Generador de tablas de amortización con cuota fija periódica (Semanal, Quincenal, Mensual) y desglose transparente de capital vs intereses."
            kpi={{ label: 'Precisión de Amortización', value: '100% Exacta', tag: 'Cuota Fija' }}
          >
            <InteractiveSimulatorDemo />
          </VerticalModuleCard>

          {/* 6. EXPEDIENTES DE CLIENTES 360° */}
          <VerticalModuleCard
            number="06"
            title="Gestión de Clientes 360° & Expediente Digital"
            category="Administración de Cartera"
            icon={Users}
            iconBg="from-sky-600 to-blue-600"
            desc="Ficha digital integral con foto, cédula escaneada, garantes solidarios, historial de puntualidad histórica y geolocalización de domicilio."
            kpi={{ label: 'Puntualidad en Cartera Registrada', value: '98.2%', tag: 'Expediente Digital' }}
          >
            <InteractiveClientesDemo />
          </VerticalModuleCard>

          {/* 7. PORTALES DE CLIENTE AUTO-SERVICIO */}
          <VerticalModuleCard
            number="07"
            title="Portales de Auto-Servicio del Cliente (PWA Móvil)"
            category="Experiencia Digital"
            icon={Smartphone}
            iconBg="from-purple-600 to-pink-600"
            desc="Portal web privado donde el cliente consulta su balance en vivo, fecha límite de pago, historial de abonos y descarga recibos oficiales desde su celular."
            kpi={{ label: 'Reducción de Consultas Telefónicas', value: '-80%', tag: 'Auto-Servicio 24/7' }}
          >
            <InteractivePortalDemo />
          </VerticalModuleCard>

          {/* 8. COMERCIOS AFILIADOS & POS */}
          <VerticalModuleCard
            number="08"
            title="Comercios Afiliados & Terminal de Ventas POS"
            category="Canal de Ventas B2B"
            icon={Store}
            iconBg="from-amber-600 to-orange-600"
            desc="Permite a tiendas, concesionarios y dealers originar ventas a crédito con cobro de comisión porcentual y desembolso inmediato."
            kpi={{ label: 'Crecimiento de Colocación B2B', value: '+60%', tag: 'Red de Afiliados' }}
          >
            <InteractiveComerciosDemo />
          </VerticalModuleCard>

          {/* 9. GESTIÓN DE PRÉSTAMOS & CONTRATOS */}
          <VerticalModuleCard
            number="09"
            title="Gestión de Préstamos & Pagarés Notariales"
            category="Administración Contractual"
            icon={Banknote}
            iconBg="from-emerald-600 to-green-700"
            desc="Emisión y administración de préstamos amortizados, pagarés notariales auténticos de solo rédito mensual y préstamos prendarios con garantía."
            kpi={{ label: 'Seguridad Jurídica Notarial', value: '100% Ejecutable', tag: 'Pagaré Notarial' }}
          >
            <InteractivePrestamosDemo />
          </VerticalModuleCard>

          {/* 10. INVENTARIO & STOCK DE BIENES */}
          <VerticalModuleCard
            number="10"
            title="Inventario de Bienes & Equipos Financiados"
            category="Control de Stock"
            icon={Package}
            iconBg="from-indigo-600 to-blue-700"
            desc="Control de inventario para motocicletas (VIN de chasis), electrodomésticos y teléfonos celulares en financiamiento con asignación por contrato."
            kpi={{ label: 'Pérdidas de Inventario', value: '0% Pérdidas', tag: 'Control Serial' }}
          >
            <InteractiveInventarioDemo />
          </VerticalModuleCard>

          {/* 11. BÓVEDA & CUSTODIA DE GARANTÍAS */}
          <VerticalModuleCard
            number="11"
            title="Bóveda Digital & Custodia de Garantías Físicas"
            category="Resguardo de Colaterales"
            icon={Lock}
            iconBg="from-slate-700 to-slate-900"
            desc="Control de gavetas de seguridad con registro de matrículas de vehículos, títulos de propiedad y prendas tasadas con ratio Loan-To-Value (LTV)."
            kpi={{ label: 'Cobertura Promedio de Colateral', value: '180% LTV', tag: 'Gaveta Segura' }}
          >
            <InteractiveBovedaDemo />
          </VerticalModuleCard>

          {/* 12. PAGOS & RECIBOS TÉRMICOS */}
          <VerticalModuleCard
            number="12"
            title="Cobros Rápidos & Recibos Térmicos Bluetooth (58/80mm)"
            category="Recaudación & Caja"
            icon={CalendarClock}
            iconBg="from-blue-600 to-indigo-700"
            desc="Registro de cuotas en 3 segundos con cálculo automático de capital vs intereses, impresión en impresoras térmicas y envío directo por WhatsApp."
            kpi={{ label: 'Tiempo de Registro de Cobro', value: '3 segs', tag: 'WhatsApp & POS' }}
          >
            <InteractivePagosDemo />
          </VerticalModuleCard>

          {/* 13. ATRASOS & MORA */}
          <VerticalModuleCard
            number="13"
            title="Control de Atrasos & Penalidades por Mora"
            category="Cobranza Temprana"
            icon={AlertTriangle}
            iconBg="from-rose-600 to-red-700"
            desc="Monitoreo de préstamos en mora segmentados por tramos de vencimiento (1-30, 31-60, 60+ días) con cálculo automático de recargos y condonaciones."
            kpi={{ label: 'Recuperación de Cartera Vencida', value: '+75%', tag: 'Gestión Oportuna' }}
          >
            <InteractiveAtrasosDemo />
          </VerticalModuleCard>

          {/* 14. ALERTA TEMPRANA EWS */}
          <VerticalModuleCard
            number="14"
            title="Radar de Alerta Temprana (Early Warning System)"
            category="Inteligencia Predictiva"
            icon={Activity}
            iconBg="from-amber-500 to-rose-600"
            desc="Algoritmo de IA predictiva que detecta clientes en riesgo de entrar en mora días antes de su fecha de pago analizando cambios de comportamiento."
            kpi={{ label: 'Detección Preventiva', value: '7 días antes', tag: 'Semáforo IA' }}
          >
            <InteractiveEwsDemo />
          </VerticalModuleCard>

          {/* 15. RADAR ANTIFRAUDE */}
          <VerticalModuleCard
            number="15"
            title="Radar Antifraude & Red de Vinculaciones Cruzadas"
            category="Blindaje de Seguridad"
            icon={ShieldAlert}
            iconBg="from-red-600 to-rose-700"
            desc="Detección en tiempo real de solicitantes con números de teléfono duplicados, garantes sobreendeudados o domicilios vinculados a moras previas."
            kpi={{ label: 'Fraudes y Duplicidades Bloqueadas', value: '99.4%', tag: 'Vínculos Cruzados' }}
          >
            <InteractiveAntifraudeDemo />
          </VerticalModuleCard>

          {/* 16. COBRANZA LEGAL */}
          <VerticalModuleCard
            number="16"
            title="Cobranza Legal, Intimaciones Notariales & Embargos"
            category="Recuperación Judicial"
            icon={Scale}
            iconBg="from-slate-800 to-indigo-950"
            desc="Flujo procesal automatizado para casos de mora severa: generación de intimación notarial de pago por alguacil y seguimiento de abogados."
            kpi={{ label: 'Tasa de Recuperación Notarial', value: '88%', tag: 'Pagaré Ejecutable' }}
          >
            <InteractiveLegalDemo />
          </VerticalModuleCard>

          {/* 17. RUTAS GPS & COBRADORES */}
          <VerticalModuleCard
            number="17"
            title="Rutas GPS Optimizadas para Cobradores de Calle"
            category="Logística en Terreno"
            icon={MapPin}
            iconBg="from-indigo-600 to-teal-600"
            desc="Geolocalización de clientes y optimización automática del recorrido diario para cobradores de campo, reduciendo combustible y tiempos."
            kpi={{ label: 'Ahorro de Tiempo en Calle', value: '-35%', tag: 'Rutas Inteligentes' }}
          >
            <InteractiveRutasDemo />
          </VerticalModuleCard>

          {/* 18. CAJA & CIERRE DE TURNOS */}
          <VerticalModuleCard
            number="18"
            title="Apertura, Turnos & Cuadre Diario de Caja"
            category="Control de Efectivo"
            icon={Wallet}
            iconBg="from-emerald-600 to-teal-700"
            desc="Apertura con fondo base, conteo ciego por denominaciones físicas y conciliación contra cobros registrados para garantizar cero descuadres."
            kpi={{ label: 'Cero Fugas de Efectivo', value: '100% Exacto', tag: 'Cierre Blindado' }}
          >
            <InteractiveCajaDemo />
          </VerticalModuleCard>

          {/* 19. CUENTAS BANCARIAS & CONCILIACIÓN */}
          <VerticalModuleCard
            number="19"
            title="Cuentas Bancarias & Conciliación de Depósitos"
            category="Tesorería Bancaria"
            icon={Landmark}
            iconBg="from-blue-700 to-indigo-800"
            desc="Control de múltiples cuentas bancarias, registro de depósitos de clientes y conciliación 1 a 1 de transferencias entrantes."
            kpi={{ label: 'Conciliación Bancaria', value: 'Instantánea', tag: 'Cero Errores' }}
          >
            <InteractiveBancosDemo />
          </VerticalModuleCard>

          {/* 20. CARTERA & RENTABILIDAD */}
          <VerticalModuleCard
            number="20"
            title="Análisis de Cartera, Ganancias & Gastos Operativos"
            category="Rentabilidad Gerencial"
            icon={TrendingUp}
            iconBg="from-emerald-600 to-blue-700"
            desc="Control detallado de ingresos financieros por intereses, gastos administrativos, rendimiento porcentual sobre capital y margen neto."
            kpi={{ label: 'Margen Neto de Cartera', value: '+28% Anual', tag: 'Rentabilidad' }}
          >
            <InteractiveCarteraDemo />
          </VerticalModuleCard>

          {/* 21. FLUJO DE CAJA PROYECTADO */}
          <VerticalModuleCard
            number="21"
            title="Proyección de Flujo de Caja (Cash Flow Forecast)"
            category="Previsión de Liquidez"
            icon={LineChart}
            iconBg="from-indigo-600 to-purple-700"
            desc="Proyección de ingresos futuros por cobros a 30, 60 y 90 días vs compromisos de desembolso para garantizar liquidez operativa ininterrumpida."
            kpi={{ label: 'Previsión de Liquidez', value: '90 días', tag: 'Flujo Continuo' }}
          >
            <InteractiveFlujoDemo />
          </VerticalModuleCard>

          {/* 22. CONTABILIDAD PROFUNDA */}
          <VerticalModuleCard
            number="22"
            title="Contabilidad Automática de Doble Entrada"
            category="Contabilidad Financiera"
            icon={BookOpen}
            iconBg="from-slate-800 to-slate-950"
            desc="Generación en tiempo real de asientos contables automáticos (Débitos y Créditos) para cada desembolso, cobro, gasto o provisión de cartera."
            kpi={{ label: 'Cierre Contable Mensual', value: '1 Clic', tag: 'Partida Doble' }}
          >
            <InteractiveContabilidadDemo />
          </VerticalModuleCard>

        </div>

      </div>
    </section>
  );
};

/* ─── GENERIC VERTICAL MODULE CARD WRAPPER ─── */
interface VerticalModuleCardProps {
  number: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconBg: string;
  desc: string;
  kpi: { label: string; value: string; tag: string };
  children: React.ReactNode;
}

const VerticalModuleCard: React.FC<VerticalModuleCardProps> = ({
  number,
  title,
  category,
  icon: Icon,
  iconBg,
  desc,
  kpi,
  children
}) => {
  return (
    <div className="vertical-module-card bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      
      {/* Top Header */}
      <div className="bg-slate-50/90 border-b border-slate-200/90 px-6 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${iconBg} text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/10 shrink-0`}>
            <Icon className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                MÓDULO {number} · {category}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-bold block">{kpi.label}</span>
            <span className="text-sm font-black text-emerald-600 font-mono">{kpi.value}</span>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/90 px-3 py-1 rounded-full">
            {kpi.tag}
          </span>
        </div>
      </div>

      {/* Description & Interactive Canvas */}
      <div className="p-6 sm:p-8 space-y-6">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          {desc}
        </p>

        {/* Live Interactive Canvas */}
        <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
              DEMOSTRACIÓN INTERACTIVA EN VIVO
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              Interactúa con los controles abajo 👇
            </span>
          </div>
          {children}
        </div>
      </div>

    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   22 INDIVIDUAL INTERACTIVE MODULE DEMOS WITH LIVE CONTROLS
   ══════════════════════════════════════════════════════════════ */

/* 1. Dashboard */
const InteractiveDashboardDemo: React.FC = () => {
  const [placed, setPlaced] = useState<number>(180000);
  const [collected, setCollected] = useState<number>(45000);
  const efficiency = Math.min(100, Math.round((collected / Math.max(1, placed * 0.25)) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Capital Colocado en Cartera:</span>
            <span className="text-indigo-600 font-mono font-black">RD$ {placed.toLocaleString()}</span>
          </div>
          <input type="range" min={50000} max={500000} step={10000} value={placed} onChange={e => setPlaced(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Cobros Realizados Hoy:</span>
            <span className="text-emerald-600 font-mono font-black">RD$ {collected.toLocaleString()}</span>
          </div>
          <input type="range" min={5000} max={100000} step={2500} value={collected} onChange={e => setCollected(Number(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
        </div>
      </div>

      <div className="lg:col-span-6 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold block">Efectividad Cobro</span>
          <span className="text-base font-black text-emerald-600 font-mono">{efficiency}%</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold block">Meta Diaria</span>
          <span className="text-base font-black text-slate-800 font-mono">RD$ {Math.round(placed * 0.25).toLocaleString()}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold block">Proyección Mensual</span>
          <span className="text-base font-black text-indigo-600 font-mono">RD$ {(collected * 24).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

/* 2. Facturas NCF */
const InteractiveFacturasDemo: React.FC = () => {
  const [ncf, setNcf] = useState<string>('B02');
  const [amount, setAmount] = useState<number>(20000);
  const itbis = Math.round(amount * 0.18);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-3">
        <label className="text-xs font-bold text-slate-700 block">Seleccionar Tipo Comprobante Fiscal DGII:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'B01', label: 'Crédito Fiscal' },
            { code: 'B02', label: 'Consumidor Final' },
            { code: 'B14', label: 'Régimen Especial' }
          ].map(t => (
            <button 
              key={t.code} 
              type="button" 
              onClick={() => setNcf(t.code)} 
              className={`p-2 rounded-xl text-center border transition-all ${ncf === t.code ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <strong className="block text-xs">{t.code}</strong>
              <span className="text-[9px] opacity-80 block truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs font-mono text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-500">
          <span>Secuencia Fiscal Asignada:</span>
          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">{ncf}00001928</span>
        </div>
        <div className="flex justify-between text-slate-600"><span>Subtotal Neto:</span><span>RD$ {(amount - itbis).toLocaleString()}</span></div>
        <div className="flex justify-between text-slate-600"><span>ITBIS (18%):</span><span>RD$ {itbis.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold border-t pt-1 text-slate-900 text-sm"><span>TOTAL FACTURADO:</span><span className="text-emerald-600">RD$ {amount.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 3. Scoring */
const InteractiveScoringDemo: React.FC = () => {
  const [income, setIncome] = useState<number>(65000);
  const score = Math.min(850, Math.max(300, 340 + Math.round((income / 150000) * 480)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Ingreso Mensual Comprobable:</span>
          <span className="text-indigo-600 font-mono font-black">RD$ {income.toLocaleString()}</span>
        </div>
        <input type="range" min={15000} max={200000} step={5000} value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="lg:col-span-6 bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">Score Predictivo Calculado</span>
          <span className="text-2xl font-black font-mono text-emerald-400">{score} / 850 pts</span>
        </div>
        <span className={`text-xs font-black px-3 py-1.5 rounded-full ${score >= 600 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
          {score >= 600 ? '✓ APROBADO RECOMENDADO' : '⚠ REQUIERE GARANTE SOLIDARIO'}
        </span>
      </div>
    </div>
  );
};

/* 4. Solicitud */
const InteractiveSolicitudDemo: React.FC = () => {
  const [amount, setAmount] = useState<number>(150000);
  const initial = Math.round(amount * 0.2);
  const netLoan = amount - initial;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Valor del Bien / Monto Solicitado:</span>
          <span className="text-indigo-600 font-mono font-black">RD$ {amount.toLocaleString()}</span>
        </div>
        <input type="range" min={30000} max={300000} step={10000} value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
        <div className="flex justify-between text-slate-600"><span>Inicial a Recibir (20%):</span><span className="font-bold text-amber-600 font-mono">RD$ {initial.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold text-slate-900 border-t pt-1 text-sm"><span>Monto Neto a Desembolsar:</span><span className="text-indigo-600 font-mono">RD$ {netLoan.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 5. Simulador */
const InteractiveSimulatorDemo: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(50000);
  const [months, setMonths] = useState<number>(6);
  const [freq, setFreq] = useState<'Semanal' | 'Quincenal' | 'Mensual'>('Mensual');

  const rate = 5;
  const totalInterest = Math.round((principal * (rate / 100)) * months);
  const total = principal + totalInterest;
  const installments = freq === 'Semanal' ? months * 4 : freq === 'Quincenal' ? months * 2 : months;
  const quota = Math.round(total / installments);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-3">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Capital: RD$ {principal.toLocaleString()}</span>
          <span>Plazo: {months} meses (5% mensual)</span>
        </div>
        <input type="range" min={10000} max={200000} step={5000} value={principal} onChange={e => setPrincipal(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
        
        <div className="flex gap-2">
          {(['Semanal', 'Quincenal', 'Mensual'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFreq(f)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${freq === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl text-center space-y-1 shadow-md">
        <span className="text-[10px] text-slate-300 font-bold block">Cuota Fija Periódica ({installments} pagos):</span>
        <span className="text-2xl font-black text-emerald-400 font-mono">RD$ {quota.toLocaleString()}</span>
        <div className="text-[10px] text-slate-400">Total a Devolver: RD$ {total.toLocaleString()} (Interés: RD$ {totalInterest.toLocaleString()})</div>
      </div>
    </div>
  );
};

/* 6. Clientes 360 */
const InteractiveClientesDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
          JP
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm">Juan Carlos Pérez Gómez</h4>
          <p className="text-slate-500 font-mono text-[11px]">Cédula: 001-1829384-2 · Tel: (809) 555-0144</p>
        </div>
      </div>
      <div className="flex gap-2.5 text-center">
        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"><span className="text-[9px] text-slate-400 font-bold block">Puntualidad</span><strong className="text-emerald-600 font-mono">98%</strong></div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"><span className="text-[9px] text-slate-400 font-bold block">Historial</span><strong className="text-indigo-600 font-mono">4 Préstamos</strong></div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"><span className="text-[9px] text-slate-400 font-bold block">Garante</span><strong className="text-slate-700">Verificado</strong></div>
      </div>
    </div>
  );
};

/* 7. Portal Cliente */
const InteractivePortalDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
      <div className="space-y-0.5 text-center sm:text-left">
        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-wider block">ENLACE PWA AUTO-SERVICIO CLIENTE</span>
        <p className="text-slate-300 font-mono text-xs">ultramoney.app/portal/c-9821</p>
      </div>
      <div className="flex gap-2">
        <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Acceso QR & PIN
        </span>
        <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-indigo-500/30">
          Descarga Recibos 24/7
        </span>
      </div>
    </div>
  );
};

/* 8. Comercios POS */
const InteractiveComerciosDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900">Dealers San Cristóbal SRL</h4>
          <span className="text-slate-500 text-[11px]">Comisión por Venta: 3.5% · 18 Ventas a Crédito</span>
        </div>
      </div>
      <span className="font-mono font-black text-emerald-600 text-sm bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
        RD$ 450,000 Colocado
      </span>
    </div>
  );
};

/* 9. Préstamos & Contratos */
const InteractivePrestamosDemo: React.FC = () => {
  return (
    <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
      <div>
        <h4 className="font-bold text-slate-900">PAGARÉ NOTARIAL LEGAL NO. 2026-089</h4>
        <p className="text-slate-600 text-[11px]">Redactado con cláusula de mora al 5% y ejecutoriedad notarial ante Notario Colegiado.</p>
      </div>
      <span className="text-[11px] font-black bg-amber-200/80 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-300 shrink-0">
        SELLO NOTARIAL VÁLIDO ✓
      </span>
    </div>
  );
};

/* 10. Inventario */
const InteractiveInventarioDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono shadow-2xs">
      <div>
        <h4 className="font-bold text-slate-900 font-sans">Motocicleta Bajaj Boxer 150cc</h4>
        <span className="text-slate-500 text-[11px]">Chasis: VIN-9821839201 · Placa: K-091823</span>
      </div>
      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg font-sans">
        Asignado a Préstamo #PR-401
      </span>
    </div>
  );
};

/* 11. Bóveda */
const InteractiveBovedaDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs shadow-md">
      <div className="space-y-0.5">
        <span className="text-indigo-300 font-bold">Gaveta de Seguridad: B-12</span>
        <p className="text-slate-400 text-[11px]">Matrícula Original Toyota Hilux 2020 (Placa L-384910)</p>
      </div>
      <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30">
        LTV: 190% (Cobertura Total)
      </span>
    </div>
  );
};

/* 12. Pagos & Recibos */
const InteractivePagosDemo: React.FC = () => {
  const [paid, setPaid] = useState<number>(3000);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center text-xs">
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-slate-700">
          <span>Abono Registrado:</span>
          <span className="text-emerald-600 font-mono font-black">RD$ {paid.toLocaleString()}</span>
        </div>
        <input type="range" min={500} max={10000} step={500} value={paid} onChange={e => setPaid(Number(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs font-mono text-[11px] space-y-0.5">
        <div className="flex justify-between font-bold"><span>RECIBO OFICIAL:</span><span className="text-indigo-600 font-mono">#REC-8849</span></div>
        <div className="flex justify-between text-emerald-600 font-bold"><span>Cobrado en Caja:</span><span>RD$ {paid.toLocaleString()}</span></div>
        <div className="flex justify-between text-slate-500"><span>Capital Restante:</span><span>RD$ {(35000 - paid).toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 13. Atrasos & Mora */
const InteractiveAtrasosDemo: React.FC = () => {
  const [days, setDays] = useState<number>(18);
  const lateFee = Math.round(days * 85);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center text-xs">
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-slate-700">
          <span>Días de Mora Transcurridos:</span>
          <span className="text-rose-600 font-mono font-black">{days} días</span>
        </div>
        <input type="range" min={1} max={60} step={1} value={days} onChange={e => setDays(Number(e.target.value))} className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 font-mono text-[11px] flex justify-between items-center">
        <div><span className="text-[10px] text-rose-600 block font-sans font-bold">Recargo por Mora:</span><strong className="text-sm">RD$ {lateFee.toLocaleString()}</strong></div>
        <span className="bg-rose-600 text-white font-sans text-[10px] font-bold px-2.5 py-1 rounded-md">Tramo {days <= 30 ? '1-30d' : '31-60d'}</span>
      </div>
    </div>
  );
};

/* 14. EWS Alerta Temprana */
const InteractiveEwsDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs shadow-md">
      <div className="flex items-center gap-2.5">
        <Activity className="w-5 h-5 text-amber-400" />
        <div>
          <h4 className="font-bold">Alerta Predictiva de Riesgo EWS</h4>
          <p className="text-slate-400 text-[11px]">Cliente pagó con retraso la última cuota. Probabilidad de mora: 68%.</p>
        </div>
      </div>
      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full">ALERTA AMARILLA</span>
    </div>
  );
};

/* 15. Antifraude */
const InteractiveAntifraudeDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-rose-600" />
        <div>
          <h4 className="font-bold text-slate-900">Vínculo Cruzado Detectado</h4>
          <span className="text-slate-500 text-[11px]">Garante Solidario figura como deudor en mora en Sucursal Norte.</span>
        </div>
      </div>
      <span className="text-rose-600 bg-rose-50 border border-rose-200 font-bold text-[10px] px-2.5 py-1 rounded-md">BLOQUEO PREVENTIVO</span>
    </div>
  );
};

/* 16. Cobranza Legal */
const InteractiveLegalDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs shadow-md">
      <div>
        <h4 className="font-bold text-rose-300">Expediente Legal #LEG-9821</h4>
        <p className="text-slate-400 text-[11px]">Intimación de Pago 48 Horas emitida vía Alguacil Notarial.</p>
      </div>
      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px] px-3 py-1 rounded-full">INTIMACIÓN NOTARIAL</span>
    </div>
  );
};

/* 17. Rutas GPS */
const InteractiveRutasDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
      <div className="flex items-center gap-2.5">
        <MapPin className="w-5 h-5 text-indigo-600" />
        <div>
          <h4 className="font-bold text-slate-900">Ruta Cobro Zona Este</h4>
          <span className="text-slate-500 text-[11px]">14 Paradas Optimizadas · Distancia: 18.2 km · Cobrado: RD$ 48,500</span>
        </div>
      </div>
      <span className="text-emerald-600 font-mono font-black bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">Avance: 85%</span>
    </div>
  );
};

/* 18. Caja */
const InteractiveCajaDemo: React.FC = () => {
  return (
    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs font-mono shadow-2xs">
      <div>
        <h4 className="font-bold font-sans text-emerald-950">CUADRE DE TURNO DE CAJA</h4>
        <span className="text-emerald-800 text-[11px]">Efectivo Esperado: RD$ 52,500 | Efectivo Contado: RD$ 52,500</span>
      </div>
      <span className="font-sans font-black text-emerald-700 bg-white border border-emerald-300 px-3 py-1 rounded-full text-[10px]">
        CAJA CUADRADA EXACTA ✓
      </span>
    </div>
  );
};

/* 19. Bancos & Conciliación */
const InteractiveBancosDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono shadow-2xs">
      <div>
        <h4 className="font-bold font-sans text-slate-900">Depósito Banco Popular #DEP-4019</h4>
        <span className="text-slate-500 text-[11px]">Transferencia Cliente Pedro Ramos por RD$ 8,000.00</span>
      </div>
      <span className="font-sans text-indigo-600 bg-indigo-50 border border-indigo-200 text-[10px] font-bold px-2.5 py-1 rounded-md">
        CONCILIADO 1-A-1
      </span>
    </div>
  );
};

/* 20. Cartera & Rentabilidad */
const InteractiveCarteraDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs font-mono shadow-md">
      <div>
        <span className="text-slate-400 text-[10px] font-sans block">Cartera Total Vigente:</span>
        <strong className="text-base text-indigo-300 font-mono">RD$ 2,450,000.00</strong>
      </div>
      <div className="text-right">
        <span className="text-slate-400 text-[10px] font-sans block">Rendimiento Mensual:</span>
        <strong className="text-base text-emerald-400 font-mono">RD$ 147,000 / mes (6.0%)</strong>
      </div>
    </div>
  );
};

/* 21. Flujo de Caja */
const InteractiveFlujoDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono shadow-2xs">
      <div>
        <h4 className="font-bold font-sans text-slate-900">Proyección Cobros 30 Días</h4>
        <span className="text-slate-500 text-[11px]">Entradas Estimadas: RD$ 480,000 | Salidas Operativas: RD$ 95,000</span>
      </div>
      <span className="text-emerald-600 font-bold text-sm bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">Flujo Neto: +RD$ 385,000</span>
    </div>
  );
};

/* 22. Contabilidad Doble Partida */
const InteractiveContabilidadDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl font-mono text-xs space-y-1 shadow-md">
      <div className="text-indigo-400 font-bold text-[10px]">ASIENTO CONTABLE #AST-2026-91</div>
      <div className="flex justify-between text-emerald-300 text-[11px]"><span>[1.1.01] Débito Caja Cobros</span><span>RD$ 6,000.00</span></div>
      <div className="flex justify-between text-slate-300 pl-4 text-[11px]"><span>[1.1.05] Crédito Cartera Capital</span><span>RD$ 4,500.00</span></div>
      <div className="flex justify-between text-indigo-300 pl-4 text-[11px]"><span>[4.1.01] Crédito Intereses Ganados</span><span>RD$ 1,500.00</span></div>
    </div>
  );
};

export default VerticalModulesShowcase;
