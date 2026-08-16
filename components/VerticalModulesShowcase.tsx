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
  Sliders, ChevronDown, CheckSquare, XCircle, Share2, Copy, Zap, ArrowUpRight
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

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.vertical-module-scene');
      cards.forEach((card, index) => {
        // Alternating directional drift + blur reveal
        const isOdd = index % 2 !== 0;
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            scroller: mainScroller,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          x: isOdd ? 40 : -40,
          y: 40,
          opacity: 0.1,
          filter: 'blur(14px)',
          scale: 0.96,
          duration: 0.85,
          ease: 'power3.out',
          clearProps: 'all'
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
      className="py-24 lg:py-32 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden border-t border-b border-slate-200/80"
    >
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-10 w-[700px] h-[700px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-40 left-10 w-[650px] h-[650px] bg-purple-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 lg:space-y-32">
        
        {/* Main Section Header */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200/90 text-indigo-700 text-xs font-black uppercase tracking-widest shadow-2xs">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>ECOSISTEMA INTEGRAL · 22 MÓDULOS INTERACTIVOS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
            Cada módulo con su propia experiencia{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800">
              interactiva en vivo
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-3xl mx-auto">
            Explora de forma alternada (izquierda y derecha) cómo opera cada herramienta del sistema. Prueba los controles, simula desembolsos, inspecciona pagarés y visualiza los datos en tiempo real.
          </p>
        </div>

        {/* ─── ALTERNATING VERTICAL SECTIONS (ZIG-ZAG) ─── */}
        <div className="space-y-16 lg:space-y-28">

          {/* 1. DASHBOARD (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={0}
            number="01"
            title="Dashboard Central & Monitor de KPIs"
            category="Panel Ejecutivo & Rendimiento"
            icon={LayoutDashboard}
            iconBg="from-blue-600 via-indigo-600 to-indigo-700"
            desc="Torre de control financiero en tiempo real. Monitorea cobranza del día, capital activo colocado en calle, cartera en mora, liquidez bancaria disponible y efectividad proyectada a 30 días."
            features={[
              'Cálculo de efectividad diaria en tiempo real',
              'Comparativa contra meta de cobranza del mes',
              'Semáforo de liquidez y saldo disponible en caja'
            ]}
            kpi={{ label: 'Tiempo Ahorrado en Cierres', value: '95%', tag: 'Automatización Total' }}
          >
            <InteractiveDashboardDemo />
          </VerticalScene>

          {/* 2. FACTURAS DGII (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={1}
            number="02"
            title="Facturación Fiscal & Comprobantes NCF (DGII)"
            category="Facturación & Cumplimiento Tributario"
            icon={FileText}
            iconBg="from-indigo-600 via-violet-600 to-purple-700"
            desc="Generación de secuencias fiscales NCF (B01 Crédito Fiscal, B02 Consumidor Final, B14 Régimen Especial). Cumple con las normativas tributarias de la DGII con cálculo automático del 18% ITBIS."
            features={[
              'Control de rangos y secuencias fiscales NCF',
              'Generador de reportes fiscales 606 y 607',
              'Impresión de facturas con código QR legal'
            ]}
            kpi={{ label: 'Cumplimiento Legal DGII', value: '100% Válido', tag: 'Reportes 606/607' }}
          >
            <InteractiveFacturasDemo />
          </VerticalScene>

          {/* 3. SCORING CREDITICIO (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={2}
            number="03"
            title="Consulta Crediticia & Scoring Preventivo"
            category="Evaluación de Riesgo Crediticio"
            icon={Search}
            iconBg="from-violet-600 via-purple-600 to-pink-600"
            desc="Motor predictivo de score crediticio (300 a 850 puntos). Evalúa capacidad de pago real, relación deuda vs ingreso y sugiere límites de crédito para prevenir préstamos incobrables."
            features={[
              'Score propio calibrado para microfinanzas',
              'Detección de sobreendeudamiento comercial',
              'Dictamen sugerido de aprobación o co-deudor'
            ]}
            kpi={{ label: 'Reducción de Cartera Incobrable', value: '-42%', tag: 'Scoring Preventivo' }}
          >
            <InteractiveScoringDemo />
          </VerticalScene>

          {/* 4. SOLICITUD & ORIGINACIÓN (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={3}
            number="04"
            title="Solicitud Digital & Originación de Crédito"
            category="Originación Comercial"
            icon={FilePlus}
            iconBg="from-blue-600 via-cyan-600 to-teal-600"
            desc="Originación digital ágil desde tablet, laptop o mostrador. Calcula automáticamente la inicial mínima requerida, valida documentos del solicitante y aprueba en minutos."
            features={[
              'Checklist digital de documentos y cédula',
              'Cálculo de inicial requerida e interés neto',
              'Aprobación jerárquica con firma digital'
            ]}
            kpi={{ label: 'Tiempo de Originación', value: '10 mins', tag: 'Sin Papeles' }}
          >
            <InteractiveSolicitudDemo />
          </VerticalScene>

          {/* 5. SIMULADOR FINANCIERO (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={4}
            number="05"
            title="Simulador Financiero & Amortización Exacta"
            category="Cálculo Financiero de Préstamos"
            icon={Calculator}
            iconBg="from-emerald-600 via-teal-600 to-cyan-700"
            desc="Calculadora de cuotas fijas periódicas (Semanales, Quincenales, Mensuales) con desglose exacto de amortización a capital, intereses corrientes y políticas de recargos."
            features={[
              'Frecuencias: Semanal, Quincenal y Mensual',
              'Desglose transparente de cuotas periódicas',
              'Exportación instantánea de tabla en PDF'
            ]}
            kpi={{ label: 'Precisión de Amortización', value: '100% Exacta', tag: 'Cuota Fija' }}
          >
            <InteractiveSimulatorDemo />
          </VerticalScene>

          {/* 6. CLIENTES 360° (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={5}
            number="06"
            title="Expediente Digital de Clientes 360°"
            category="Administración de Cartera de Clientes"
            icon={Users}
            iconBg="from-sky-600 via-blue-600 to-indigo-700"
            desc="Ficha digital integral del deudor con foto de perfil, cédula escaneada, garantes solidarios, geolocalización de domicilio laboral/residencial y récord histórico de pagos."
            features={[
              'Historial de puntualidad e índice de riesgo',
              'Vinculación de garantes y referencias laborales',
              'Descarga de estado de cuenta completo'
            ]}
            kpi={{ label: 'Puntualidad en Cartera Registrada', value: '98.2%', tag: 'Expediente Digital' }}
          >
            <InteractiveClientesDemo />
          </VerticalScene>

          {/* 7. PORTALES DE CLIENTE PWA (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={6}
            number="07"
            title="Portales de Auto-Servicio del Cliente (PWA)"
            category="Experiencia Digital de Usuario"
            icon={Smartphone}
            iconBg="from-purple-600 via-pink-600 to-rose-600"
            desc="Portal web privado para tus prestatarios. Pueden consultar su saldo actualizado, fechas límite de cuotas, realizar pagos online y descargar recibos oficiales desde su celular 24/7."
            features={[
              'Acceso rápido por QR y PIN de seguridad',
              'Consulta de balance y tabla de cuotas en vivo',
              'Descarga de comprobantes térmicos en PDF'
            ]}
            kpi={{ label: 'Reducción de Consultas Telefónicas', value: '-80%', tag: 'Auto-Servicio 24/7' }}
          >
            <InteractivePortalDemo />
          </VerticalScene>

          {/* 8. COMERCIOS AFILIADOS & POS (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={7}
            number="08"
            title="Comercios Afiliados & Terminal de Ventas POS"
            category="Canal de Ventas B2B"
            icon={Store}
            iconBg="from-amber-600 via-orange-600 to-red-600"
            desc="Permite a tiendas de electrodomésticos, dealers y talleres afiliados originar créditos directos en mostrador con cobro de comisión porcentual por venta colocada."
            features={[
              'Terminal POS web para cajeros de la tienda',
              'Cálculo de comisión por venta comercial',
              'Liquidación ágil de desembolsos al comercio'
            ]}
            kpi={{ label: 'Crecimiento de Colocación B2B', value: '+60%', tag: 'Red de Afiliados' }}
          >
            <InteractiveComerciosDemo />
          </VerticalScene>

          {/* 9. GESTIÓN DE PRÉSTAMOS & PAGARÉS (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={8}
            number="09"
            title="Gestión de Préstamos & Pagarés Notariales"
            category="Administración Contractual & Legal"
            icon={Banknote}
            iconBg="from-emerald-600 via-green-600 to-teal-700"
            desc="Emisión de contratos de amortización periódica, pagarés notariales auténticos de solo rédito mensual y contratos prendarios legalizados ante Notario Público Colegiado."
            features={[
              'Pagaré Notarial auténtico ejecutable',
              'Cláusula de mora al 5% y gastos legales',
              'Soporte para cobro de rédito a capital libre'
            ]}
            kpi={{ label: 'Seguridad Jurídica Notarial', value: '100% Válido', tag: 'Pagaré Notarial' }}
          >
            <InteractivePrestamosDemo />
          </VerticalScene>

          {/* 10. INVENTARIO & STOCK DE BIENES (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={9}
            number="10"
            title="Inventario de Bienes & Equipos Financiados"
            category="Control de Stock & Trazabilidad"
            icon={Package}
            iconBg="from-indigo-600 via-blue-700 to-slate-800"
            desc="Control de existencias para motocicletas (número de motor y chasis VIN), electrodomésticos y teléfonos celulares financiados con asignación individual por contrato."
            features={[
              'Control de números de chasis VIN y seriales',
              'Asignación directa a préstamos activos',
              'Historial de garantías devueltas o liquidadas'
            ]}
            kpi={{ label: 'Pérdidas de Inventario', value: '0% Pérdidas', tag: 'Control Serial' }}
          >
            <InteractiveInventarioDemo />
          </VerticalScene>

          {/* 11. BÓVEDA & GARANTÍAS (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={10}
            number="11"
            title="Bóveda Digital & Custodia de Garantías Físicas"
            category="Resguardo Físico de Colaterales"
            icon={Lock}
            iconBg="from-slate-700 via-slate-800 to-slate-950"
            desc="Control físico de gavetas de seguridad con registro de matrículas de vehículos, títulos de propiedad y prendas de oro tasadas con ratio Loan-To-Value (LTV)."
            features={[
              'Identificación de gavetas físicas (A, B, C)',
              'Cálculo dinámico de cobertura LTV de garantía',
              'Registro fotográfico de colaterales bajo custodia'
            ]}
            kpi={{ label: 'Cobertura Promedio de Colateral', value: '180% LTV', tag: 'Gaveta Segura' }}
          >
            <InteractiveBovedaDemo />
          </VerticalScene>

          {/* 12. PAGOS & RECIBOS TÉRMICOS (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={11}
            number="12"
            title="Cobros Rápidos & Recibos Térmicos Bluetooth"
            category="Recaudación & Caja en Punto de Venta"
            icon={CalendarClock}
            iconBg="from-blue-600 via-indigo-600 to-indigo-800"
            desc="Registro de cuotas en 3 segundos con cálculo automático de capital vs intereses, impresión en impresoras térmicas de 58/80mm y envío directo a WhatsApp."
            features={[
              'Impresión Bluetooth directa en impresoras POS',
              'Envío de comprobante oficial por WhatsApp en 1-clic',
              'Desglose exacto de cuota cobrada y balance restante'
            ]}
            kpi={{ label: 'Tiempo de Registro de Cobro', value: '3 segs', tag: 'WhatsApp & POS' }}
          >
            <InteractivePagosDemo />
          </VerticalScene>

          {/* 13. ATRASOS & MORA (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={12}
            number="13"
            title="Control de Atrasos & Penalidades por Mora"
            category="Cobranza Temprana & Gestión de Cartera"
            icon={AlertTriangle}
            iconBg="from-rose-600 via-red-600 to-orange-700"
            desc="Monitoreo de deudores en mora clasificados por tramos de vencimiento (1-30, 31-60, 60+ días) con cálculo automático de recargos y condonaciones autorizadas."
            features={[
              'Segmentación por tramos de morosidad',
              'Cálculo de penalidades por días de retraso',
              'Módulo de condonación controlada con autorización'
            ]}
            kpi={{ label: 'Recuperación de Cartera Vencida', value: '+75%', tag: 'Gestión Oportuna' }}
          >
            <InteractiveAtrasosDemo />
          </VerticalScene>

          {/* 14. ALERTA TEMPRANA EWS (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={13}
            number="14"
            title="Radar de Alerta Temprana (Early Warning System)"
            category="Inteligencia Artificial Predictiva"
            icon={Activity}
            iconBg="from-amber-500 via-orange-500 to-rose-600"
            desc="Algoritmo predictivo que detecta prestatarios con alta probabilidad de caer en mora 7 días antes de su fecha de corte analizando patrones de pago y variaciones de ingreso."
            features={[
              'Semáforo de riesgo predictivo Verde/Amarillo/Rojo',
              'Alertas de intervención preventiva para oficiales',
              'Reducción de cartera en mora antes de vencer'
            ]}
            kpi={{ label: 'Detección Preventiva Pre-Mora', value: '7 días antes', tag: 'Semáforo IA' }}
          >
            <InteractiveEwsDemo />
          </VerticalScene>

          {/* 15. RADAR ANTIFRAUDE (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={14}
            number="15"
            title="Radar Antifraude & Red de Vinculaciones"
            category="Blindaje de Seguridad & Prevención"
            icon={ShieldAlert}
            iconBg="from-red-600 via-rose-700 to-red-900"
            desc="Detección en tiempo real de solicitantes con teléfonos compartidos, garantes con deudas cruzadas o domicilios vinculados a cobros judiciales previos."
            features={[
              'Grafo de vinculaciones cruzadas en tiempo real',
              'Bloqueo preventivo de teléfonos y cédulas duplicadas',
              'Historial cruzado entre sucursales de la empresa'
            ]}
            kpi={{ label: 'Fraudes y Duplicidades Bloqueados', value: '99.4%', tag: 'Vínculos Cruzados' }}
          >
            <InteractiveAntifraudeDemo />
          </VerticalScene>

          {/* 16. COBRANZA LEGAL (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={15}
            number="16"
            title="Cobranza Legal, Intimaciones & Embargos"
            category="Recuperación Judicial & Notarial"
            icon={Scale}
            iconBg="from-slate-800 via-indigo-950 to-slate-900"
            desc="Flujo procesal escalonado para préstamos en mora severa: generación de intimación notarial de pago por alguacil, seguimiento de abogados y ejecución notarial."
            features={[
              'Intimación notarial de pago de 48 horas',
              'Control de honorarios y gastos legales de abogados',
              'Expedientes judiciales con orden de embargo'
            ]}
            kpi={{ label: 'Recuperación en Vía Notarial', value: '88%', tag: 'Pagaré Ejecutable' }}
          >
            <InteractiveLegalDemo />
          </VerticalScene>

          {/* 17. RUTAS GPS & COBRADORES (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={16}
            number="17"
            title="Rutas GPS Optimizadas para Cobradores"
            category="Logística de Cobranza en Campo"
            icon={MapPin}
            iconBg="from-indigo-600 via-teal-600 to-emerald-700"
            desc="Mapeo geográfico de clientes y optimización automática del orden de visitas diarias para cobradores de calle, reduciendo tiempos de traslado y consumo de combustible."
            features={[
              'Cálculo de recorrido más corto entre paradas',
              'Monitoreo de avance de cobranza en vivo',
              'Tiempos estimados de llegada (ETA) por cliente'
            ]}
            kpi={{ label: 'Ahorro de Tiempo en Calle', value: '-35%', tag: 'Rutas Inteligentes' }}
          >
            <InteractiveRutasDemo />
          </VerticalScene>

          {/* 18. CAJA & TURNOS (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={17}
            number="18"
            title="Apertura, Turnos & Cuadre Diario de Caja"
            category="Control de Efectivo & Arqueo Ciego"
            icon={Wallet}
            iconBg="from-emerald-600 via-teal-600 to-green-800"
            desc="Apertura de turno con fondo base, conteo ciego de billetes por denominación y conciliación matemática contra cobros para garantizar cero descuadres."
            features={[
              'Arqueo de billetes y monedas por denominación',
              'Cierre ciego sin mostrar total del sistema al cajero',
              'Reporte firmado de cierre de turno con sellado digital'
            ]}
            kpi={{ label: 'Cero Fugas de Efectivo', value: '100% Exacto', tag: 'Cierre Blindado' }}
          >
            <InteractiveCajaDemo />
          </VerticalScene>

          {/* 19. BANCOS & CONCILIACIÓN (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={18}
            number="19"
            title="Cuentas Bancarias & Conciliación de Depósitos"
            category="Tesorería Bancaria & Depósitos"
            icon={Landmark}
            iconBg="from-blue-700 via-indigo-700 to-purple-800"
            desc="Gestión de cuentas en múltiples bancos, registro de transferencias de clientes y conciliación 1 a 1 de depósitos bancarios para evitar transferencias huérfanas."
            features={[
              'Múltiples cuentas bancarias (Banreservas, BHD, Popular)',
              'Conciliación 1-a-1 de recibos contra extracto',
              'Validación de número de referencia de transferencia'
            ]}
            kpi={{ label: 'Conciliación Bancaria', value: 'Instantánea', tag: 'Cero Errores' }}
          >
            <InteractiveBancosDemo />
          </VerticalScene>

          {/* 20. CARTERA & GANANCIAS (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={19}
            number="20"
            title="Análisis de Cartera, Ganancias & Gastos"
            category="Rentabilidad Gerencial & ROI"
            icon={TrendingUp}
            iconBg="from-emerald-600 via-blue-600 to-indigo-700"
            desc="Control financiero de ingresos por intereses cobrados, gastos operativos de oficina y cobradores, rentabilidad mensual y retorno sobre capital invertido (ROI)."
            features={[
              'Margen neto mensual después de gastos operativos',
              'Tasa de rentabilidad real sobre cartera activa',
              'Desglose de gastos por categoría operativa'
            ]}
            kpi={{ label: 'Margen Neto de Cartera', value: '+28% Anual', tag: 'Rentabilidad' }}
          >
            <InteractiveCarteraDemo />
          </VerticalScene>

          {/* 21. FLUJO DE CAJA PROYECTADO (Izquierda: Info / Derecha: Demo) */}
          <VerticalScene
            index={20}
            number="21"
            title="Proyección de Flujo de Caja (Cash Flow)"
            category="Previsión de Liquidez & Tesorería"
            icon={LineChart}
            iconBg="from-indigo-600 via-purple-600 to-pink-700"
            desc="Simulación de entradas esperadas por cobros a 30, 60 y 90 días vs salidas operativas y compromisos de desembolso para garantizar liquidez continua."
            features={[
              'Previsión de ingresos a 30, 60 y 90 días',
              'Balance neto proyectado de liquidez',
              'Planificación de presupuesto para nuevas colocaciones'
            ]}
            kpi={{ label: 'Previsión de Liquidez', value: '90 días', tag: 'Flujo Continuo' }}
          >
            <InteractiveFlujoDemo />
          </VerticalScene>

          {/* 22. CONTABILIDAD PROFUNDA (Derecha: Info / Izquierda: Demo) */}
          <VerticalScene
            index={21}
            number="22"
            title="Contabilidad Automática de Doble Entrada"
            category="Contabilidad Financiera & Partida Doble"
            icon={BookOpen}
            iconBg="from-slate-800 via-indigo-950 to-slate-950"
            desc="Generación en tiempo real de asientos de partida doble (Débitos y Créditos) para cada desembolso, cobro, gasto o provisión de cartera, listos para auditorías."
            features={[
              'Asientos contables automáticos sin intervención manual',
              'Plan de cuentas estructurado según normas contables',
              'Balance general y estado de resultados al instante'
            ]}
            kpi={{ label: 'Cierre Contable Mensual', value: '1 Clic', tag: 'Partida Doble' }}
          >
            <InteractiveContabilidadDemo />
          </VerticalScene>

        </div>

      </div>
    </section>
  );
};

/* ─── ZIG-ZAG VERTICAL SCENE WRAPPER (ALTERNATING LEFT & RIGHT) ─── */
interface VerticalSceneProps {
  index: number;
  number: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconBg: string;
  desc: string;
  features: string[];
  kpi: { label: string; value: string; tag: string };
  children: React.ReactNode;
}

const VerticalScene: React.FC<VerticalSceneProps> = ({
  index,
  number,
  title,
  category,
  icon: Icon,
  iconBg,
  desc,
  features,
  kpi,
  children
}) => {
  const isEven = index % 2 === 0; // Even: Info Left, Demo Right. Odd: Demo Left, Info Right.

  return (
    <div className="vertical-module-scene bg-white rounded-3xl lg:rounded-[2.5rem] border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden p-6 sm:p-8 lg:p-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

        {/* ─── INFO COLUMN (Text, Badge, Features, KPI) ─── */}
        <div className={`lg:col-span-5 space-y-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
          
          {/* Header Tag */}
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${iconBg} text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0`}>
              <Icon className="w-6 h-6" strokeWidth={1.8} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
                MÓDULO {number} · {category}
              </span>
              <span className="text-xs font-bold text-slate-400">Herramienta Especializada</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {desc}
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-2.5 pt-1">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs font-bold text-slate-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{feat}</span>
              </div>
            ))}
          </div>

          {/* KPI Banner */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">{kpi.label}</span>
              <span className="text-lg font-black text-emerald-600 font-mono">{kpi.value}</span>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">
              {kpi.tag}
            </span>
          </div>

        </div>

        {/* ─── LIVE INTERACTIVE DEMO COLUMN (Expanded, tactile canvas) ─── */}
        <div className={`lg:col-span-7 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
          <div className="bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-inner space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                DEMO INTERACTIVA EN VIVO
              </span>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline-block">
                Interactúa con los controles 👇
              </span>
            </div>

            {/* Live Component Widget */}
            <div className="pt-1">
              {children}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   EXPANDED LIVE INTERACTIVE WIDGETS FOR ALL 22 MODULES
   ══════════════════════════════════════════════════════════════ */

/* 1. Dashboard */
const InteractiveDashboardDemo: React.FC = () => {
  const [placed, setPlaced] = useState<number>(250000);
  const [collected, setCollected] = useState<number>(62500);
  const efficiency = Math.min(100, Math.round((collected / Math.max(1, placed * 0.25)) * 100));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Capital Colocado:</span>
            <span className="text-indigo-600 font-mono font-black">RD$ {placed.toLocaleString()}</span>
          </div>
          <input type="range" min={50000} max={600000} step={10000} value={placed} onChange={e => setPlaced(Number(e.target.value))} className="w-full accent-indigo-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Cobros Realizados Hoy:</span>
            <span className="text-emerald-600 font-mono font-black">RD$ {collected.toLocaleString()}</span>
          </div>
          <input type="range" min={5000} max={150000} step={2500} value={collected} onChange={e => setCollected(Number(e.target.value))} className="w-full accent-emerald-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">Efectividad Cobro</span>
          <span className="text-xl font-black text-emerald-600 font-mono">{efficiency}%</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">Meta Diaria</span>
          <span className="text-base font-black text-slate-800 font-mono">RD$ {Math.round(placed * 0.25).toLocaleString()}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">Proyección 30 Días</span>
          <span className="text-base font-black text-indigo-600 font-mono">RD$ {(collected * 24).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

/* 2. Facturas NCF */
const InteractiveFacturasDemo: React.FC = () => {
  const [ncf, setNcf] = useState<string>('B02');
  const [amount, setAmount] = useState<number>(25000);
  const itbis = Math.round(amount * 0.18);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">Tipo de Comprobante Fiscal:</label>
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
              className={`p-2.5 rounded-xl text-center border transition-all ${ncf === t.code ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <strong className="block text-xs">{t.code}</strong>
              <span className="text-[10px] opacity-80 block truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs font-mono text-xs space-y-2">
        <div className="flex justify-between items-center text-slate-500 pb-1.5 border-b">
          <span>Secuencia DGII Asignada:</span>
          <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded font-mono">{ncf}00001928</span>
        </div>
        <div className="flex justify-between text-slate-600"><span>Subtotal Base:</span><span>RD$ {(amount - itbis).toLocaleString()}</span></div>
        <div className="flex justify-between text-slate-600"><span>ITBIS 18% Trasladado:</span><span>RD$ {itbis.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold border-t pt-1.5 text-slate-900 text-sm"><span>TOTAL FACTURA:</span><span className="text-emerald-600">RD$ {amount.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 3. Scoring */
const InteractiveScoringDemo: React.FC = () => {
  const [income, setIncome] = useState<number>(75000);
  const score = Math.min(850, Math.max(300, 340 + Math.round((income / 150000) * 480)));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Ingreso Mensual del Solicitante:</span>
          <span className="text-indigo-600 font-mono font-black">RD$ {income.toLocaleString()}</span>
        </div>
        <input type="range" min={15000} max={200000} step={5000} value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full accent-indigo-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer" />
      </div>

      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">Score Predictivo Calculado</span>
          <span className="text-2xl font-black font-mono text-emerald-400">{score} / 850 pts</span>
        </div>
        <span className={`text-xs font-black px-3.5 py-1.5 rounded-full ${score >= 600 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
          {score >= 600 ? '✓ APROBADO RECOMENDADO' : '⚠ REQUIERE GARANTE'}
        </span>
      </div>
    </div>
  );
};

/* 4. Solicitud */
const InteractiveSolicitudDemo: React.FC = () => {
  const [amount, setAmount] = useState<number>(180000);
  const initial = Math.round(amount * 0.2);
  const netLoan = amount - initial;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Valor del Bien / Monto a Financiar:</span>
          <span className="text-indigo-600 font-mono font-black">RD$ {amount.toLocaleString()}</span>
        </div>
        <input type="range" min={30000} max={400000} step={10000} value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full accent-indigo-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer" />
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2 shadow-2xs">
        <div className="flex justify-between text-slate-600"><span>Inicial a Recibir en Mostrador (20%):</span><span className="font-bold text-amber-600 font-mono">RD$ {initial.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold text-slate-900 border-t pt-2 text-sm"><span>Monto Neto a Desembolsar:</span><span className="text-indigo-600 font-mono">RD$ {netLoan.toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 5. Simulador */
const InteractiveSimulatorDemo: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(60000);
  const [months, setMonths] = useState<number>(6);
  const [freq, setFreq] = useState<'Semanal' | 'Quincenal' | 'Mensual'>('Mensual');

  const rate = 5;
  const totalInterest = Math.round((principal * (rate / 100)) * months);
  const total = principal + totalInterest;
  const installments = freq === 'Semanal' ? months * 4 : freq === 'Quincenal' ? months * 2 : months;
  const quota = Math.round(total / installments);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Capital: RD$ {principal.toLocaleString()}</span>
          <span>Plazo: {months} meses (5% mensual)</span>
        </div>
        <input type="range" min={10000} max={250000} step={5000} value={principal} onChange={e => setPrincipal(Number(e.target.value))} className="w-full accent-indigo-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer" />
        
        <div className="flex gap-2 pt-1">
          {(['Semanal', 'Quincenal', 'Mensual'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFreq(f)} className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${freq === f ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl text-center space-y-1 shadow-md">
        <span className="text-[10px] text-slate-300 font-bold block">Cuota Fija ({installments} pagos):</span>
        <span className="text-2xl font-black text-emerald-400 font-mono">RD$ {quota.toLocaleString()}</span>
        <div className="text-[10px] text-slate-400">Total a Devolver: RD$ {total.toLocaleString()} (Intereses: RD$ {totalInterest.toLocaleString()})</div>
      </div>
    </div>
  );
};

/* 6. Clientes 360 */
const InteractiveClientesDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            JP
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">Juan Carlos Pérez Gómez</h4>
            <p className="text-slate-500 font-mono text-[11px]">Cédula: 001-1829384-2 · Tel: (809) 555-0144</p>
          </div>
        </div>
        <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
          CLIENTE ACTIVO
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold block">Puntualidad</span><strong className="text-emerald-600 font-mono text-sm">98%</strong></div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold block">Historial</span><strong className="text-indigo-600 font-mono text-sm">4 Préstamos</strong></div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold block">Garante</span><strong className="text-slate-700 text-xs">Verificado</strong></div>
      </div>
    </div>
  );
};

/* 7. Portal Cliente */
const InteractivePortalDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 text-xs shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-wider">PORTAL MÓVIL CLIENTE</span>
        <span className="text-[10px] text-slate-400 font-mono">ultramoney.app/portal/c-9821</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block">Próxima Cuota Vence:</span>
          <span className="text-base font-black text-emerald-400 font-mono">RD$ 4,500.00 (en 4 días)</span>
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30">
          ✓ Pagar Ahora Online
        </span>
      </div>
    </div>
  );
};

/* 8. Comercios POS */
const InteractiveComerciosDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900">Dealers San Cristóbal SRL</h4>
            <span className="text-slate-500 text-[11px]">Comisión por Venta: 3.5%</span>
          </div>
        </div>
        <span className="text-emerald-600 font-mono font-black text-sm bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
          RD$ 450,000 Colocado
        </span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between text-slate-600">
        <span>Ventas Originadas este Mes: 18 Créditos</span>
        <span className="font-bold text-slate-800">Comisión Acumulada: RD$ 15,750.00</span>
      </div>
    </div>
  );
};

/* 9. Préstamos & Contratos */
const InteractivePrestamosDemo: React.FC = () => {
  return (
    <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-2 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 font-sans">PAGARÉ NOTARIAL LEGAL NO. 2026-089</h4>
        <span className="text-[10px] font-black bg-amber-200/80 text-amber-950 px-3 py-1 rounded-full border border-amber-300">
          NOTARIAL ✓
        </span>
      </div>
      <p className="text-slate-600 text-[11px] leading-relaxed">
        Suscrito ante Notario Público Colegiado con cláusula de mora al 5% mensual y ejecutoriedad notarial inmediata en caso de incumplimiento.
      </p>
    </div>
  );
};

/* 10. Inventario */
const InteractiveInventarioDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono shadow-2xs">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 font-sans">Motocicleta Bajaj Boxer 150cc</h4>
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded font-sans">
          Asignado a #PR-401
        </span>
      </div>
      <div className="flex justify-between text-slate-500 text-[11px]">
        <span>Chasis VIN: 9821839201</span>
        <span>Placa: K-091823</span>
        <span>Estado: Financiado</span>
      </div>
    </div>
  );
};

/* 11. Bóveda */
const InteractiveBovedaDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-indigo-300 font-bold">Gaveta de Seguridad: B-12</span>
        <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2.5 py-1 rounded border border-emerald-500/30">
          LTV: 190% (Cobertura Total)
        </span>
      </div>
      <p className="text-slate-400 text-[11px]">
        Matrícula Original Toyota Hilux 2020 (Placa L-384910) bajo custodia física.
      </p>
    </div>
  );
};

/* 12. Pagos & Recibos */
const InteractivePagosDemo: React.FC = () => {
  const [paid, setPaid] = useState<number>(3500);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center text-xs">
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-slate-700">
          <span>Abono Registrado:</span>
          <span className="text-emerald-600 font-mono font-black">RD$ {paid.toLocaleString()}</span>
        </div>
        <input type="range" min={500} max={10000} step={500} value={paid} onChange={e => setPaid(Number(e.target.value))} className="w-full accent-emerald-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs font-mono text-[11px] space-y-1">
        <div className="flex justify-between font-bold"><span>RECIBO OFICIAL:</span><span className="text-indigo-600">#REC-8849</span></div>
        <div className="flex justify-between text-emerald-600 font-bold"><span>Cobrado en Caja:</span><span>RD$ {paid.toLocaleString()}</span></div>
        <div className="flex justify-between text-slate-500"><span>Capital Restante:</span><span>RD$ {(40000 - paid).toLocaleString()}</span></div>
      </div>
    </div>
  );
};

/* 13. Atrasos & Mora */
const InteractiveAtrasosDemo: React.FC = () => {
  const [days, setDays] = useState<number>(20);
  const lateFee = Math.round(days * 85);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center text-xs">
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-slate-700">
          <span>Días de Mora:</span>
          <span className="text-rose-600 font-mono font-black">{days} días</span>
        </div>
        <input type="range" min={1} max={60} step={1} value={days} onChange={e => setDays(Number(e.target.value))} className="w-full accent-rose-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer" />
      </div>
      <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-rose-900 font-mono text-[11px] flex justify-between items-center">
        <div><span className="text-[10px] text-rose-600 block font-sans font-bold">Recargo Acumulado:</span><strong className="text-sm">RD$ {lateFee.toLocaleString()}</strong></div>
        <span className="bg-rose-600 text-white font-sans text-[10px] font-bold px-2.5 py-1 rounded-md">Tramo {days <= 30 ? '1-30d' : '31-60d'}</span>
      </div>
    </div>
  );
};

/* 14. EWS Alerta Temprana */
const InteractiveEwsDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold">Alerta Predictiva de Riesgo EWS</h4>
        </div>
        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full">ALERTA AMARILLA</span>
      </div>
      <p className="text-slate-400 text-[11px]">
        Cliente pagó con retraso la última cuota. Probabilidad estimada de mora: 68%. Acción sugerida: contacto telefónico preventivo.
      </p>
    </div>
  );
};

/* 15. Antifraude */
const InteractiveAntifraudeDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h4 className="font-bold text-slate-900">Vínculo Cruzado Detectado</h4>
        </div>
        <span className="text-rose-600 bg-rose-50 border border-rose-200 font-bold text-[10px] px-2.5 py-0.5 rounded-md">BLOQUEO PREVENTIVO</span>
      </div>
      <p className="text-slate-500 text-[11px]">
        El garante solidario propuesto figura como deudor en mora en otra sucursal activa.
      </p>
    </div>
  );
};

/* 16. Cobranza Legal */
const InteractiveLegalDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs shadow-md">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-rose-300">Expediente Legal #LEG-9821</h4>
        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px] px-3 py-0.5 rounded-full">INTIMACIÓN NOTARIAL</span>
      </div>
      <p className="text-slate-400 text-[11px]">
        Intimación de Pago 48 Horas emitida vía Alguacil Notarial con fuerza ejecutiva.
      </p>
    </div>
  );
};

/* 17. Rutas GPS */
const InteractiveRutasDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <h4 className="font-bold text-slate-900">Ruta Cobro Zona Este</h4>
        </div>
        <span className="text-emerald-600 font-mono font-black bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-lg">Avance: 85%</span>
      </div>
      <div className="flex justify-between text-slate-500 text-[11px]">
        <span>14 Paradas Optimizadas</span>
        <span>Distancia: 18.2 km</span>
        <span>Recaudado: RD$ 48,500</span>
      </div>
    </div>
  );
};

/* 18. Caja */
const InteractiveCajaDemo: React.FC = () => {
  return (
    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-xs font-mono shadow-2xs">
      <div className="flex items-center justify-between">
        <h4 className="font-bold font-sans text-emerald-950">CUADRE DE TURNO DE CAJA</h4>
        <span className="font-sans font-black text-emerald-700 bg-white border border-emerald-300 px-3 py-0.5 rounded-full text-[10px]">
          CAJA CUADRADA ✓
        </span>
      </div>
      <div className="flex justify-between text-emerald-800 text-[11px]">
        <span>Efectivo Esperado: RD$ 52,500.00</span>
        <span>Efectivo Contado: RD$ 52,500.00 (Dif: $0.00)</span>
      </div>
    </div>
  );
};

/* 19. Bancos & Conciliación */
const InteractiveBancosDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono shadow-2xs">
      <div className="flex items-center justify-between">
        <h4 className="font-bold font-sans text-slate-900">Depósito Banco Popular #DEP-4019</h4>
        <span className="font-sans text-indigo-600 bg-indigo-50 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
          CONCILIADO 1-A-1
        </span>
      </div>
      <p className="text-slate-500 text-[11px] font-sans">
        Transferencia de cliente Pedro Ramos por RD$ 8,000.00 conciliada contra recibo oficial.
      </p>
    </div>
  );
};

/* 20. Cartera & Rentabilidad */
const InteractiveCarteraDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs font-mono shadow-md">
      <div>
        <span className="text-slate-400 text-[10px] font-sans block">Cartera Total Vigente:</span>
        <strong className="text-lg text-indigo-300 font-mono">RD$ 2,450,000.00</strong>
      </div>
      <div className="text-right">
        <span className="text-slate-400 text-[10px] font-sans block">Rendimiento Mensual:</span>
        <strong className="text-lg text-emerald-400 font-mono">RD$ 147,000 / mes (6.0%)</strong>
      </div>
    </div>
  );
};

/* 21. Flujo de Caja */
const InteractiveFlujoDemo: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono shadow-2xs">
      <div className="flex items-center justify-between">
        <h4 className="font-bold font-sans text-slate-900">Proyección Cobros 30 Días</h4>
        <span className="text-emerald-600 font-bold text-sm bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-lg">Flujo: +RD$ 385,000</span>
      </div>
      <div className="flex justify-between text-slate-500 text-[11px] font-sans">
        <span>Entradas Proyectadas: RD$ 480,000.00</span>
        <span>Salidas Operativas: RD$ 95,000.00</span>
      </div>
    </div>
  );
};

/* 22. Contabilidad Doble Partida */
const InteractiveContabilidadDemo: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl font-mono text-xs space-y-1.5 shadow-md">
      <div className="text-indigo-400 font-bold text-[10px]">ASIENTO CONTABLE AUTOMÁTICO #AST-2026-91</div>
      <div className="flex justify-between text-emerald-300 text-[11px]"><span>[1.1.01] Débito Caja Cobros</span><span>RD$ 6,000.00</span></div>
      <div className="flex justify-between text-slate-300 pl-4 text-[11px]"><span>[1.1.05] Crédito Cartera Capital</span><span>RD$ 4,500.00</span></div>
      <div className="flex justify-between text-indigo-300 pl-4 text-[11px]"><span>[4.1.01] Crédito Intereses Ganados</span><span>RD$ 1,500.00</span></div>
    </div>
  );
};

export default VerticalModulesShowcase;
