import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Search, FilePlus, Users, Banknote, 
  CalendarClock, AlertTriangle, Wallet, Briefcase, 
  TrendingDown, TrendingUp, UserCog, Tags, 
  BookOpen, Smartphone, FileText, Settings,
  Calculator, Database, ShieldCheck, DollarSign, Package, Landmark, Building2,
  ArrowLeftRight, LineChart, Store, MapPin, Scale, Lock, Activity, ShieldAlert,
  Printer, Check, Play, Sparkles, RefreshCw, ChevronRight, CheckCircle, Percent,
  ArrowRight, Shield, AlertCircle, Clock, FileCheck, Send, Compass
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const VerticalModulesShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate each vertical module block on scroll
      const moduleBlocks = gsap.utils.toArray<HTMLElement>('.vertical-module-card');
      moduleBlocks.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 50, scale: 0.98 },
          {
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none'
            },
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: 'power3.out'
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      id="caracteristicas" 
      className="py-24 bg-gradient-to-b from-white via-slate-50/70 to-white relative overflow-hidden border-t border-slate-200/80"
    >
      {/* Background Ambient Lights */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-tr from-indigo-100/40 via-blue-50/20 to-purple-100/30 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Main Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-black uppercase tracking-widest shadow-2xs">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>ECOSISTEMA INTEGRAL · 22 MÓDULOS INTERACTIVOS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Cada módulo del sistema en una experiencia{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800">
              interactiva en vivo
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Explora verticalmente cómo funciona cada una de las 22 herramientas de UltraMoney. Interactúa directamente con los controles en tiempo real, realiza cálculos y prueba las funciones antes de ingresar.
          </p>
        </div>

        {/* ─── VERTICAL STACK OF 22 INTERACTIVE MODULE SECTIONS ─── */}
        <div className="space-y-12">

          {/* 1. DASHBOARD */}
          <VerticalModuleCard
            index={1}
            title="Dashboard Central & Monitor de KPIs"
            category="Panel Ejecutivo"
            icon={LayoutDashboard}
            desc="Torre de control financiero en tiempo real. Visualiza cobranza diaria, capital colocado, mora activa, liquidez y metas proyectadas."
            kpi={{ label: 'Tiempo Ahorrado en Cierres Diarios', value: '95%', tag: 'Automatización Total' }}
          >
            <InteractiveDashboardDemo />
          </VerticalModuleCard>

          {/* 2. FACTURAS & COMPROBANTES DGII */}
          <VerticalModuleCard
            index={2}
            title="Facturas Electrónicas & Comprobantes NCF (DGII)"
            category="Facturación & Cumplimiento"
            icon={FileText}
            desc="Generación de secuencias fiscales NCF (B01 Crédito Fiscal, B02 Consumidor Final, B14 Régimen Especial) e impresión de recibos térmicos con QR."
            kpi={{ label: 'Cumplimiento Fiscal', value: '100% DGII', tag: 'Reportes 606/607' }}
          >
            <InteractiveFacturasDemo />
          </VerticalModuleCard>

          {/* 3. CONSULTA & SCORING CREDITICIO */}
          <VerticalModuleCard
            index={3}
            title="Consulta Crediticia & Scoring Preventivo"
            category="Evaluación de Riesgo"
            icon={Search}
            desc="Motor de scoring predictivo (Score 300-850). Evalúa historial de pagos, relación deuda/ingreso y calcula el límite de crédito recomendado."
            kpi={{ label: 'Reducción de Cartera Incobrable', value: '-42%', tag: 'Prevención IA' }}
          >
            <InteractiveScoringDemo />
          </VerticalModuleCard>

          {/* 4. SOLICITUD & ORIGINACIÓN */}
          <VerticalModuleCard
            index={4}
            title="Solicitud Digital & Originación de Crédito"
            category="Originación Comercial"
            icon={FilePlus}
            desc="Captura de expedientes desde celular o mostrador, cálculo dinámico de inicial requerida, checklist de documentos y aprobación jerárquica."
            kpi={{ label: 'Tiempo de Aprobación', value: '15 mins', tag: 'Antes 48 horas' }}
          >
            <InteractiveSolicitudDemo />
          </VerticalModuleCard>

          {/* 5. SIMULADOR FINANCIERO */}
          <VerticalModuleCard
            index={5}
            title="Simulador Financiero Avanzado"
            category="Cálculo Comercial"
            icon={Calculator}
            desc="Calculadora interactiva para cuotas fijas, préstamos semanales, quincenales y mensuales con desglose de capital, interés y gastos de cierre."
            kpi={{ label: 'Tasa de Conversión a Préstamo', value: '+35%', tag: 'Ofertas Claras' }}
          >
            <InteractiveSimulatorDemo />
          </VerticalModuleCard>

          {/* 6. EXPEDIENTES DE CLIENTES 360° */}
          <VerticalModuleCard
            index={6}
            title="Gestión de Clientes 360° & Expedientes Digitales"
            category="Gestión de Cartera"
            icon={Users}
            desc="Ficha digital integral con foto, cédula escaneada, garantes principales/solidarios, geolocalización residencial y récord de préstamos."
            kpi={{ label: 'Puntualidad de Clientes Registrados', value: '98%', tag: 'Historial Digital' }}
          >
            <InteractiveClientesDemo />
          </VerticalModuleCard>

          {/* 7. PORTALES DE CLIENTE AUTO-SERVICIO */}
          <VerticalModuleCard
            index={7}
            title="Portales de Auto-Servicio del Cliente (PWA Móvil)"
            category="Experiencia Digital"
            icon={Smartphone}
            desc="Portal web privado donde tus clientes consultan su balance en vivo, fechas de pago, historial y descargan recibos oficiales desde su celular."
            kpi={{ label: 'Reducción de Consultas Telefónicas', value: '-80%', tag: 'Auto-Servicio 24/7' }}
          >
            <InteractivePortalDemo />
          </VerticalModuleCard>

          {/* 8. COMERCIOS AFILIADOS & POS */}
          <VerticalModuleCard
            index={8}
            title="Comercios Afiliados & Terminal POS"
            category="Canal de Ventas B2B"
            icon={Store}
            desc="Permite a tiendas y dealers afiliados originar ventas a crédito con cobro de comisión por venta y liquidación directa desde la plataforma."
            kpi={{ label: 'Crecimiento de Colocación B2B', value: '+60%', tag: 'Red de Comercios' }}
          >
            <InteractiveComerciosDemo />
          </VerticalModuleCard>

          {/* 9. GESTIÓN DE PRÉSTAMOS & PAGARÉS */}
          <VerticalModuleCard
            index={9}
            title="Gestión de Préstamos & Contratos Notariales"
            category="Administración Contractual"
            icon={Banknote}
            desc="Emisión y control de contratos de amortización periódica, pagarés notariales auténticos de solo interés y préstamos prendarios con garantía."
            kpi={{ label: 'Seguridad Jurídica Notarial', value: '100% Válido', tag: 'Pagaré Notarial' }}
          >
            <InteractivePrestamosDemo />
          </VerticalModuleCard>

          {/* 10. INVENTARIO & STOCK DE BIENES */}
          <VerticalModuleCard
            index={10}
            title="Inventario de Bienes & Equipos Financiados"
            category="Control de Stock"
            icon={Package}
            desc="Control de stock de motocicletas (chasis VIN), electrodomésticos y teléfonos celulares en financiamiento con asignación por contrato."
            kpi={{ label: 'Control de Activos Financiados', value: '0 Pérdidas', tag: 'Trazabilidad Serial' }}
          >
            <InteractiveInventarioDemo />
          </VerticalModuleCard>

          {/* 11. BÓVEDA & CUSTODIA DE GARANTÍAS */}
          <VerticalModuleCard
            index={11}
            title="Bóveda Digital & Custodia de Garantías Físicas"
            category="Seguridad de Colaterales"
            icon={Lock}
            desc="Registro de ubicación física de matrículas de vehículos, prendas de oro tasadas, títulos de propiedad y llaves con código de barra."
            kpi={{ label: 'Cobertura Promedio de Colateral', value: '180% LTV', tag: 'Resguardo Físico' }}
          >
            <InteractiveBovedaDemo />
          </VerticalModuleCard>

          {/* 12. PAGOS & EMISIÓN DE RECIBOS TÉRMICOS */}
          <VerticalModuleCard
            index={12}
            title="Cobros Rápidos & Tickets Térmicos Bluetooth"
            category="Caja & Recaudación"
            icon={CalendarClock}
            desc="Registro de abonos en 3 segundos con cálculo automático de capital vs interés, impresión en tickets de 58/80mm y envío a WhatsApp en 1-clic."
            kpi={{ label: 'Velocidad de Registro de Pago', value: '3 segs', tag: 'Ticket Inmediato' }}
          >
            <InteractivePagosDemo />
          </VerticalModuleCard>

          {/* 13. ATRASOS & GESTIÓN DE MORA */}
          <VerticalModuleCard
            index={13}
            title="Control de Atrasos & Penalidades por Mora"
            category="Cobranza Temprana"
            icon={AlertTriangle}
            desc="Monitoreo de deudores vencidos segmentados por tramos de mora (1-30, 31-60, 60+ días) con cálculo automático de recargos y condonaciones."
            kpi={{ label: 'Recuperación de Cartera Vencida', value: '+75%', tag: 'Gestión Oportuna' }}
          >
            <InteractiveAtrasosDemo />
          </VerticalModuleCard>

          {/* 14. ALERTA TEMPRANA EWS */}
          <VerticalModuleCard
            index={14}
            title="Radar de Alerta Temprana (Early Warning System)"
            category="Inteligencia Predictiva"
            icon={Activity}
            desc="Algoritmo de inteligencia que detecta clientes en riesgo de entrar en mora días antes de la fecha de corte analizando patrones de comportamiento."
            kpi={{ label: 'Detección Preventiva Pre-Mora', value: '7 días antes', tag: 'Score Predictivo' }}
          >
            <InteractiveEwsDemo />
          </VerticalModuleCard>

          {/* 15. RADAR ANTIFRAUDE */}
          <VerticalModuleCard
            index={15}
            title="Radar Antifraude & Red de Vinculaciones"
            category="Blindaje de Seguridad"
            icon={ShieldAlert}
            desc="Detecta en vivo solicitantes con números compartidos, garantes con deudas cruzadas y domicilios vinculados a expedientes legales previos."
            kpi={{ label: 'Fraudes y Duplicidades Bloqueados', value: '99.4%', tag: 'Vínculos Cruzados' }}
          >
            <InteractiveAntifraudeDemo />
          </VerticalModuleCard>

          {/* 16. COBRANZA LEGAL */}
          <VerticalModuleCard
            index={16}
            title="Cobranza Legal, Intimaciones & Embargos"
            category="Recuperación Judicial"
            icon={Scale}
            desc="Flujo escalonado automático para préstamos en mora severa: generación de intimación notarial, seguimiento de abogados y ejecución notarial."
            kpi={{ label: 'Recuperación en Vía Notarial', value: '88%', tag: 'Pagaré Ejecutable' }}
          >
            <InteractiveLegalDemo />
          </VerticalModuleCard>

          {/* 17. RUTAS GPS & COBRADORES */}
          <VerticalModuleCard
            index={17}
            title="Rutas GPS Optimizadas para Cobradores"
            category="Logística de Campo"
            icon={MapPin}
            desc="Mapeo geográfico de clientes y optimización automática del recorrido diario de cobradores en calle, reduciendo tiempo y combustible."
            kpi={{ label: 'Ahorro de Tiempo en Calle', value: '-35%', tag: 'Rutas Inteligentes' }}
          >
            <InteractiveRutasDemo />
          </VerticalModuleCard>

          {/* 18. CAJA & CIERRE DE TURNOS */}
          <VerticalModuleCard
            index={18}
            title="Apertura, Turnos & Cuadre Diario de Caja"
            category="Control de Efectivo"
            icon={Wallet}
            desc="Apertura de turno con fondo fijo, conteo físico por denominaciones y conciliación ciega contra cobros registrados para evitar descuadres."
            kpi={{ label: 'Cero Fugas de Efectivo', value: '100% Exacto', tag: 'Cierre Blindado' }}
          >
            <InteractiveCajaDemo />
          </VerticalModuleCard>

          {/* 19. CUENTAS BANCARIAS & CONCILIACIÓN */}
          <VerticalModuleCard
            index={19}
            title="Cuentas Bancarias & Conciliación de Depósitos"
            category="Tesorería Bancaria"
            icon={Landmark}
            desc="Gestión de cuentas en múltiples bancos, registro de transferencias de clientes y conciliación 1 a 1 de depósitos bancarios."
            kpi={{ label: 'Conciliación Bancaria', value: 'Instantánea', tag: 'Cero Depósitos Huérfanos' }}
          >
            <InteractiveBancosDemo />
          </VerticalModuleCard>

          {/* 20. CARTERA & RENTABILIDAD */}
          <VerticalModuleCard
            index={20}
            title="Análisis de Cartera, Ganancias & Gastos Operativos"
            category="Rentabilidad Gerencial"
            icon={TrendingUp}
            desc="Control detallado de ingresos por intereses, gastos operativos, rentabilidad neta mensual y retorno sobre el capital invertido (ROI)."
            kpi={{ label: 'Margen Neto Proyectado', value: '+28% Anual', tag: 'Crecimiento Sostenible' }}
          >
            <InteractiveCarteraDemo />
          </VerticalModuleCard>

          {/* 21. FLUJO DE CAJA PROYECTADO */}
          <VerticalModuleCard
            index={21}
            title="Proyección de Flujo de Caja (Cash Flow Forecast)"
            category="Previsión de Liquidez"
            icon={LineChart}
            desc="Simulación de entradas esperadas por cobros a 30, 60 y 90 días vs compromisos de desembolso para garantizar liquidez operativa continua."
            kpi={{ label: 'Previsión de Liquidez', value: '90 días', tag: 'Flujo Garantizado' }}
          >
            <InteractiveFlujoDemo />
          </VerticalModuleCard>

          {/* 22. CONTABILIDAD PROFUNDA */}
          <VerticalModuleCard
            index={22}
            title="Contabilidad Automática de Doble Entrada"
            category="Contabilidad Financiera"
            icon={BookOpen}
            desc="Generación automática de asientos de partida doble para cada desembolso, cobro, gasto o provisión con balance general y estado de resultados."
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
  index: number;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  desc: string;
  kpi: { label: string; value: string; tag: string };
  children: React.ReactNode;
}

const VerticalModuleCard: React.FC<VerticalModuleCardProps> = ({
  index,
  title,
  category,
  icon: Icon,
  desc,
  kpi,
  children
}) => {
  return (
    <div className="vertical-module-card bg-white rounded-3xl sm:rounded-[2rem] border border-slate-200/90 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      
      {/* Header Bar */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
            {index < 10 ? `0${index}` : index}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
              {category}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-bold block">{kpi.label}</span>
            <span className="text-sm font-black text-emerald-600 font-mono">{kpi.value}</span>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
            {kpi.tag}
          </span>
        </div>
      </div>

      {/* Body Content: Description & Live Interactive Widget */}
      <div className="p-6 sm:p-8 lg:p-10 space-y-6">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          {desc}
        </p>

        {/* Live Interactive Canvas */}
        <div className="bg-slate-50/70 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs">
          {children}
        </div>
      </div>

    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   INDIVIDUAL INTERACTIVE DEMOS FOR EACH OF THE 22 MODULES
   ══════════════════════════════════════════════════════════════ */

/* 1. Dashboard */
const InteractiveDashboardDemo: React.FC = () => {
  const [placed, setPlaced] = useState<number>(150000);
  const [collected, setCollected] = useState<number>(38500);
  const efficiency = Math.round((collected / Math.max(1, placed * 0.3)) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Capital Colocado en Calle:</span>
            <span className="text-indigo-600 font-mono">RD$ {placed.toLocaleString()}</span>
          </div>
          <input type="range" min={50000} max={500000} step={10000} value={placed} onChange={e => setPlaced(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Cobros Realizados Hoy:</span>
            <span className="text-emerald-600 font-mono">RD$ {collected.toLocaleString()}</span>
          </div>
          <input type="range" min={5000} max={100000} step={2500} value={collected} onChange={e => setCollected(Number(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
        </div>
      </div>

      <div className="lg:col-span-6 grid grid-cols-3 gap-2.5 text-center text-xs">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block">Efectividad Cobro</span>
          <span className="text-base font-black text-emerald-600 font-mono">{efficiency}%</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block">Pendiente Hoy</span>
          <span className="text-base font-black text-amber-600 font-mono">RD$ {(Math.max(0, placed * 0.3 - collected)).toLocaleString()}</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block">Proyección 30 Días</span>
          <span className="text-base font-black text-indigo-600 font-mono">RD$ {(collected * 24).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

/* 2. Facturas NCF */
const InteractiveFacturasDemo: React.FC = () => {
  const [ncf, setNcf] = useState<string>('B02');
  const [amount, setAmount] = useState<number>(15000);
  const itbis = Math.round(amount * 0.18);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-3">
        <label className="text-xs font-bold text-slate-700 block">Seleccionar Tipo Comprobante Fiscal DGII:</label>
        <div className="flex gap-2">
          {['B01 (Crédito Fiscal)', 'B02 (Consumidor Final)', 'B14 (Régimen Especial)'].map(t => {
            const key = t.slice(0, 3);
            return (
              <button key={key} type="button" onClick={() => setNcf(key)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${ncf === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                {key}
              </button>
            );
          })}
        </div>
      </div>
      <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs font-mono text-xs space-y-1">
        <div className="flex justify-between"><span>Secuencia NCF Asignada:</span><span className="font-bold text-indigo-600">{ncf}00001928</span></div>
        <div className="flex justify-between"><span>Subtotal:</span><span>RD$ {(amount - itbis).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>ITBIS 18%:</span><span>RD$ {itbis.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold border-t pt-1 text-slate-900"><span>TOTAL FACTURA:</span><span>RD$ {amount.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 3. Scoring */
const InteractiveScoringDemo: React.FC = () => {
  const [income, setIncome] = useState<number>(55000);
  const score = Math.min(850, Math.max(300, 320 + Math.round((income / 150000) * 500)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Ingreso Mensual del Solicitante:</span>
          <span className="text-indigo-600 font-mono">RD$ {income.toLocaleString()}</span>
        </div>
        <input type="range" min={15000} max={200000} step={5000} value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="lg:col-span-6 bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block">Score Evaluado</span>
          <span className="text-2xl font-black font-mono text-emerald-400">{score} / 850 pts</span>
        </div>
        <span className={`text-xs font-black px-3 py-1 rounded-full ${score >= 600 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
          {score >= 600 ? 'APROBADO RECOMENDADO' : 'REQUIERE CO-DEUDOR'}
        </span>
      </div>
    </div>
  );
};

/* 4. Solicitud */
const InteractiveSolicitudDemo: React.FC = () => {
  const [amount, setAmount] = useState<number>(120000);
  const initial = Math.round(amount * 0.2);
  const netLoan = amount - initial;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Valor del Bien a Financiar:</span>
          <span className="text-indigo-600 font-mono">RD$ {amount.toLocaleString()}</span>
        </div>
        <input type="range" min={30000} max={300000} step={10000} value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
        <div className="flex justify-between text-slate-600"><span>Inicial a cobrar (20%):</span><span className="font-bold text-amber-600 font-mono">RD$ {initial.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold text-slate-900 border-t pt-1 text-sm"><span>Monto Neto a Desembolsar:</span><span className="text-indigo-600 font-mono">RD$ {netLoan.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 5. Simulador */
const InteractiveSimulatorDemo: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(40000);
  const [months, setMonths] = useState<number>(6);
  const [rate] = useState<number>(5);

  const interest = Math.round((principal * (rate / 100)) * months);
  const total = principal + interest;
  const quota = Math.round(total / months);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-6 space-y-3">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Capital: RD$ {principal.toLocaleString()}</span>
          <span>Plazo: {months} meses (Tasa: 5%)</span>
        </div>
        <input type="range" min={10000} max={150000} step={5000} value={principal} onChange={e => setPrincipal(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
        <input type="range" min={1} max={18} step={1} value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="lg:col-span-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl text-center space-y-1">
        <span className="text-[10px] text-slate-300 block">Cuota Mensual Fija:</span>
        <span className="text-2xl font-black text-emerald-400 font-mono">RD$ {quota.toLocaleString()}</span>
        <div className="text-[10px] text-slate-400">Total a Pagar: RD$ {total.toLocaleString()}</div>
      </div>
    </div>
  );
};

/* 6. Clientes 360 */
const InteractiveClientesDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">JP</div>
        <div>
          <h4 className="font-bold text-slate-900">Juan Carlos Pérez Gómez</h4>
          <p className="text-slate-500 font-mono text-[11px]">Cédula: 001-1829384-2 · Tel: (809) 555-0144</p>
        </div>
      </div>
      <div className="flex gap-3 text-center">
        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Puntualidad</span><strong className="text-emerald-600">98%</strong></div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Préstamos</span><strong className="text-slate-800">4 Activos</strong></div>
      </div>
    </div>
  );
};

/* 7. Portal Cliente */
const InteractivePortalDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs">
      <div className="space-y-0.5">
        <span className="text-indigo-400 text-[10px] font-bold block">PORTAL MÓVIL ENLACE ÚNICO</span>
        <p className="text-slate-300 font-mono">ultramoney.app/portal/c-9821</p>
      </div>
      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30">
        QR & Acceso PIN Seguro
      </span>
    </div>
  );
};

/* 8. Comercios POS */
const InteractiveComerciosDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5">
        <Store className="w-5 h-5 text-indigo-600" />
        <div>
          <h4 className="font-bold text-slate-900">Dealers San Cristóbal SRL</h4>
          <span className="text-slate-500 text-[10px]">Comisión por Venta: 3.5%</span>
        </div>
      </div>
      <span className="font-mono font-bold text-emerald-600 text-sm">RD$ 350,000 en Calle</span>
    </div>
  );
};

/* 9. Préstamos & Contratos */
const InteractivePrestamosDemo: React.FC = () => {
  return (
    <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs font-serif">
      <div>
        <h4 className="font-bold font-sans text-slate-900">PAGARÉ NOTARIAL LEGAL NO. 2026-089</h4>
        <p className="text-slate-600 text-[11px]">Suscrito ante Notario Público Colegiado con cláusula de ejecución notarial.</p>
      </div>
      <span className="font-sans text-[10px] font-bold bg-amber-200/60 text-amber-900 px-3 py-1 rounded-full">
        SELLO NOTARIAL ✓
      </span>
    </div>
  );
};

/* 10. Inventario */
const InteractiveInventarioDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono">
      <div>
        <h4 className="font-bold text-slate-900 font-sans">Motocicleta Bajaj Boxer 150cc</h4>
        <span className="text-slate-500 text-[10px]">Chasis: VIN-9821839201 · Placa: K-091823</span>
      </div>
      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md font-sans">
        Asignado a Préstamo #PR-401
      </span>
    </div>
  );
};

/* 11. Bóveda */
const InteractiveBovedaDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs">
      <div className="space-y-0.5">
        <span className="text-indigo-300 font-bold">Gaveta de Seguridad Bóveda: B-12</span>
        <p className="text-slate-400">Matrícula Original Toyota Hilux 2020 (Placa L-384910)</p>
      </div>
      <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2.5 py-1 rounded">
        LTV: 190%
      </span>
    </div>
  );
};

/* 12. Pagos & Recibos */
const InteractivePagosDemo: React.FC = () => {
  const [paid, setPaid] = useState<number>(2500);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center text-xs">
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-slate-700">
          <span>Abono de Cuota:</span>
          <span className="text-emerald-600 font-mono">RD$ {paid.toLocaleString()}</span>
        </div>
        <input type="range" min={500} max={10000} step={500} value={paid} onChange={e => setPaid(Number(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs font-mono text-[11px] space-y-0.5">
        <div className="flex justify-between font-bold"><span>RECIBO OFICIAL:</span><span className="text-indigo-600">#REC-8849</span></div>
        <div className="flex justify-between text-emerald-600 font-bold"><span>Cobrado:</span><span>RD$ {paid.toLocaleString()}</span></div>
        <div className="flex justify-between text-slate-500"><span>Saldo Restante:</span><span>RD$ {(30000 - paid).toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 13. Atrasos & Mora */
const InteractiveAtrasosDemo: React.FC = () => {
  const [days, setDays] = useState<number>(14);
  const lateFee = Math.round(days * 75);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center text-xs">
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-slate-700">
          <span>Días de Atraso Transcurridos:</span>
          <span className="text-rose-600 font-mono">{days} días</span>
        </div>
        <input type="range" min={1} max={60} step={1} value={days} onChange={e => setDays(Number(e.target.value))} className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 font-mono text-[11px] flex justify-between items-center">
        <div><span className="text-[10px] text-rose-600 block font-sans font-bold">Recargo por Mora:</span><strong>RD$ {lateFee.toLocaleString()}</strong></div>
        <span className="bg-rose-600 text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded">Tramo {days <= 30 ? '1-30d' : '31-60d'}</span>
      </div>
    </div>
  );
};

/* 14. EWS Alerta Temprana */
const InteractiveEwsDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-amber-400" />
        <div>
          <h4 className="font-bold">Alerta Preventiva de Riesgo EWS</h4>
          <p className="text-slate-400 text-[10px]">Cliente pagó con 4 días de retraso la última cuota. Probabilidad de mora: 68%.</p>
        </div>
      </div>
      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full">ALERTA AMARILLA</span>
    </div>
  );
};

/* 15. Antifraude */
const InteractiveAntifraudeDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-rose-600" />
        <div>
          <h4 className="font-bold text-slate-900">Vínculo Cruzado Detectado</h4>
          <span className="text-slate-500 text-[10px]">Garante Solidario figura como deudor en mora en Sucursal Norte.</span>
        </div>
      </div>
      <span className="text-rose-600 bg-rose-50 border border-rose-200 font-bold text-[10px] px-2.5 py-1 rounded-md">BLOQUEO PREVENTIVO</span>
    </div>
  );
};

/* 16. Cobranza Legal */
const InteractiveLegalDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs">
      <div>
        <h4 className="font-bold text-rose-300">Expediente Legal #LEG-9821</h4>
        <p className="text-slate-400 text-[10px]">Intimación de Pago 48 Horas emitida vía Alguacil Notarial.</p>
      </div>
      <span className="bg-rose-500/20 text-rose-300 font-bold text-[10px] px-2.5 py-1 rounded-full">INTIMACIÓN NOTARIAL</span>
    </div>
  );
};

/* 17. Rutas GPS */
const InteractiveRutasDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5">
        <MapPin className="w-5 h-5 text-indigo-600" />
        <div>
          <h4 className="font-bold text-slate-900">Ruta Cobro Zona Este</h4>
          <span className="text-slate-500 text-[10px]">14 Paradas Optimizadas · Distancia: 18.2 km · Cobrado: RD$ 48,500</span>
        </div>
      </div>
      <span className="text-emerald-600 font-mono font-bold">Progreso: 85%</span>
    </div>
  );
};

/* 18. Caja */
const InteractiveCajaDemo: React.FC = () => {
  return (
    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs font-mono">
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
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono">
      <div>
        <h4 className="font-bold font-sans text-slate-900">Depósito Banco Popular #DEP-4019</h4>
        <span className="text-slate-500 text-[10px]">Transferencia Cliente Pedro Ramos por RD$ 8,000.00</span>
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
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs font-mono">
      <div>
        <span className="text-slate-400 text-[10px] font-sans block">Cartera Total Vigente:</span>
        <strong className="text-base text-indigo-300">RD$ 2,450,000.00</strong>
      </div>
      <div className="text-right">
        <span className="text-slate-400 text-[10px] font-sans block">Rendimiento Mensual:</span>
        <strong className="text-base text-emerald-400">RD$ 147,000 / mes (6.0%)</strong>
      </div>
    </div>
  );
};

/* 21. Flujo de Caja */
const InteractiveFlujoDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono">
      <div>
        <h4 className="font-bold font-sans text-slate-900">Proyección Cobros 30 Días</h4>
        <span className="text-slate-500 text-[10px]">Entradas Estimadas: RD$ 480,000 | Salidas Operativas: RD$ 95,000</span>
      </div>
      <span className="text-emerald-600 font-bold text-sm">Flujo Neto: +RD$ 385,000</span>
    </div>
  );
};

/* 22. Contabilidad Doble Partida */
const InteractiveContabilidadDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl font-mono text-xs space-y-1">
      <div className="text-indigo-400 font-bold text-[10px]">ASIENTO CONTABLE #AST-2026-91</div>
      <div className="flex justify-between text-emerald-300 text-[11px]"><span>[1.1.01] Débito Caja Cobros</span><span>RD$ 6,000.00</span></div>
      <div className="flex justify-between text-slate-300 pl-4 text-[11px]"><span>[1.1.05] Crédito Cartera Capital</span><span>RD$ 4,500.00</span></div>
      <div className="flex justify-between text-indigo-300 pl-4 text-[11px]"><span>[4.1.01] Crédito Intereses Ganados</span><span>RD$ 1,500.00</span></div>
    </div>
  );
};

export default VerticalModulesShowcase;
