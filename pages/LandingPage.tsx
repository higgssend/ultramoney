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
  Banknote, FilePlus, Package, TrendingDown, Wallet, BookOpen, Printer, Building2
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/StoreContext';
import { VerticalModulesShowcase } from '../components/VerticalModulesShowcase';

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

interface SystemModule {
  id: number;
  name: string;
  category: string;
  IconComponent: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  exampleConfig: string;
  roiImpact: string;
  route: string;
}

const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 1,
    name: '1. Dashboard Central',
    category: 'Panel Principal',
    IconComponent: BarChart3,
    shortDesc: 'Monitor gerencial en tiempo real de capital colocado, cobranza diaria, mora activa e indicadores KPIs de rentabilidad.',
    fullDesc: 'El Dashboard Central es la torre de control de tu financiera. Muestra en vivo el estado financiero global, permitiendo a los directores y gerentes visualizar el dinero colocado en calle, los cobros esperados del día vs los cobros realizados, la tasa de morosidad en tiempo real y la utilidad proyectada sin necesidad de generar reportes manuales.',
    features: [
      'Monitor de cobros del día en tiempo real',
      'KPIs de capital prestado vs capital recuperado',
      'Gráfica comparativa mensual de flujo de caja',
      'Alerta en vivo de contratos que entran en mora hoy',
      'Indicador de liquidez y disponible para nuevos préstamos',
      'Filtros rápidos por sucursal o gestor de cobros'
    ],
    exampleConfig: 'Configura el panel para mostrar metas diarias de cobro (ej. RD$ 150,000/día). El gráfico cambia a color verde al alcanzar el 100% del objetivo de la jornada.',
    roiImpact: 'Reduce en un 95% el tiempo dedicado a reuniones de cierre diario y consolidación de reportes.',
    route: '/dashboard'
  },
  {
    id: 2,
    name: '2. Facturas & Comprobantes',
    category: 'Facturación DGII',
    IconComponent: FileText,
    shortDesc: 'Emisión automática de facturas de ingreso, recibos impresos y comprobantes fiscales (NCF) con código QR.',
    fullDesc: 'Diseñado para cumplir con las normativas fiscales vigentes y entregar soporte impreso o digital a cada transacción. Genera comprobantes de crédito fiscal (B01), consumidor final (B02) y régimen especial, además de facturas comerciales e impresiones en impresoras térmicas de 80mm o 58mm.',
    features: [
      'Generación automática de secuencias NCF (B01, B02, B14)',
      'Diseño personalizable con logo y sello notarial',
      'Compatibilidad con impresoras térmicas Bluetooth y USB',
      'Envío instantáneo por correo electrónico y WhatsApp',
      'Verificación mediante código QR de autenticidad',
      'Reporte consolidado para declaración mensual (607/608)'
    ],
    exampleConfig: 'Ingresa el rango de NCF autorizado por la DGII (ej. B0200000001 a B0200001000). El sistema alertará cuando queden menos de 50 secuencias disponibles.',
    roiImpact: 'Ahorra más de 20 horas mensuales en la preparación de reportes fiscales para contabilidad.',
    route: '/facturas'
  },
  {
    id: 3,
    name: '3. Consulta Crediticia & Scoring',
    category: 'Evaluación de Riesgo',
    IconComponent: Search,
    shortDesc: 'Análisis preventivo de riesgo crediticio con semáforo inteligente y consulta de comportamiento histórico.',
    fullDesc: 'Este módulo evalúa el nivel de riesgo de un cliente antes de autorizar cualquier desembolso. Calcula un puntaje crediticio propio (Score 300-850) analizando la puntualidad en créditos anteriores, frecuencia de atrasos, relación deuda/ingreso y garantes vinculados.',
    features: [
      'Evaluación por número de cédula o RNC en 1 segundo',
      'Semáforo de riesgo (Verde: Aprobado, Amarillo: Condicionado, Rojo: Rechazado)',
      'Algoritmo de scoring interno basado en historial real',
      'Historial cruzado entre sucursales para evitar doble financiamiento',
      'Límite de crédito máximo recomendado automáticamente',
      'Generación de reporte PDF con justificación del score'
    ],
    exampleConfig: 'Establece que cualquier cliente con Score inferior a 550 requiera obligatoriamente un garante con propiedad inmobiliaria registrada.',
    roiImpact: 'Reduce las pérdidas por cartera incobrable en más de un 40% desde el primer mes.',
    route: '/consultar'
  },
  {
    id: 4,
    name: '4. Solicitud & Originación',
    category: 'Originación',
    IconComponent: FilePlus,
    shortDesc: 'Flujo digital completo desde la captura del solicitante hasta la aprobación y firma del pagaré notarial.',
    fullDesc: 'Gestiona el proceso comercial previo al otorgamiento del crédito. Permite registrar solicitudes presenciales o en línea, capturar la inicial del cliente en préstamos de bienes, adjuntar documentación de respaldo y someter el expediente a aprobación jerárquica.',
    features: [
      'Formulario modular para préstamos personales, vehículos o electrodomésticos',
      'Cálculo de inicial requerida e insumos garantizados',
      'Checklist configurable de documentos obligatorios',
      'Workflow de aprobación multinivel (Oficial -> Gerente)',
      'Borrador digital de contrato pagaré antes del desembolso',
      'Notificación SMS/WhatsApp automática al cliente al ser aprobado'
    ],
    exampleConfig: 'Para financiamiento de motocicletas, exige ingresar un 20% de inicial y adjuntar la copia del título de propiedad o matrícula.',
    roiImpact: 'Agiliza la aprobación de crédito de 48 horas a solo 15 minutos.',
    route: '/solicitud'
  },
  {
    id: 5,
    name: '5. Simulador Financiero Avanzado',
    category: 'Cálculo Comercial',
    IconComponent: Calculator,
    shortDesc: 'Calculadora financiera interactiva para cuotas fijas, amortización a capital y pagarés a rédito abierto.',
    fullDesc: 'La herramienta definitiva para vendedores y oficiales de crédito. Permite proyectar la tabla de amortización completa frente al cliente, mostrando cuotas semanales, quincenales, decenales o mensuales, así como la distribución entre capital, interés y seguro.',
    features: [
      'Soporte para métodos Francés (cuota fija), Alemán y Pagaré Abierto',
      'Cálculo dinámico con cuotas semanales, quincenales, bisemanales y mensuales',
      'Simulación de pagos extraordinarios o abonos directos',
      'Desglose detallado de gastos de cierre y seguro de vida',
      'Impresión y exportación de oferta comercial formal en PDF',
      'Comparativa instantánea entre 2 o más opciones de plazo'
    ],
    exampleConfig: 'Genera una tabla comparativa a 6, 12 y 18 meses para un monto de RD$ 100,000 a una tasa mensual del 5% para que el cliente elija la opción conveniente.',
    roiImpact: 'Aumenta la tasa de conversión de prospectos a préstamos cerrados en un 35%.',
    route: '/simulador'
  },
  {
    id: 6,
    name: '6. Gestión de Clientes 360°',
    category: 'Expedientes Digitales',
    IconComponent: Users,
    shortDesc: 'Perfil integral del cliente con foto, documentos, garantes principales, garantes solidarios y geolocalización.',
    fullDesc: 'Centraliza toda la información personal, laboral y familiar de cada deudor. Permite tomar fotos de perfil con la cámaraweb o celular, recortar la imagen de cédula, guardar teléfonos de trabajo, ubicar la residencia en Google Maps y vincular garantes.',
    features: [
      'Ficha digital 360° con foto recortable y datos personales',
      'Vinculación de Garantes Principales y Solidarios con expedientes propios',
      'Carga de documentos escaneados (Cédula, Carta de trabajo, Títulos)',
      'Geolocalización GPS exacta de la vivienda y lugar de trabajo',
      'Historial completo de préstamos, abonos, recibos y notas de seguimiento',
      'Acceso directo a WhatsApp y llamada telefónica desde la ficha'
    ],
    exampleConfig: 'Sube la cédula frontal/trasera del cliente y el recortador inteligente optimizará el tamaño de la imagen para la impresión del contrato.',
    roiImpact: 'Elimina el uso de carpetas de papel y reduce los tiempos de búsqueda de expedientes a 0.',
    route: '/clientes'
  },
  {
    id: 7,
    name: '7. Portales de Cliente Auto-Servicio',
    category: 'Auto-Servicio Web',
    IconComponent: Smartphone,
    shortDesc: 'Portal web móvil para que tus clientes consulten su saldo, próximas fechas de pago y recibos descargables.',
    fullDesc: 'Un portal de autoservicio 24/7 diseñado para teléfonos móviles. Los clientes ingresan de forma segura con su cédula para ver cuántas cuotas les faltan por pagar, el monto exacto de la próxima cuota, las cuentas bancarias de la empresa y descargar sus recibos.',
    features: [
      'Acceso seguro sin contraseña mediante Cédula + Enlace OTP',
      'Consulta en vivo del estado del préstamo y balance pendiente',
      'Descarga de recibos históricos en formato imagen y PDF',
      'Instrucciones y cuentas bancarias para pago por transferencia',
      'Botón de notificación de pago realizado adjuntando comprobante',
      'Diseño ultra-rápido responsivo tipo App Nativa'
    ],
    exampleConfig: 'Envía el enlace `https://ultramoney.site/portal/cliente` por WhatsApp para que el cliente consulte sus fechas sin llamar a la oficina.',
    roiImpact: 'Disminuye las llamadas telefónicas de consulta de balance en un 80%.',
    route: '/portales-cliente'
  },
  {
    id: 8,
    name: '8. Administración de Préstamos Activos',
    category: 'Cartera Operativa',
    IconComponent: Banknote,
    shortDesc: 'Control de contratos vigentes, emisión de pagarés legales, refinanciamientos, reestructuraciones y desgloses.',
    fullDesc: 'Es el núcleo del sistema Ultramoney. Gestiona cada préstamo desde su creación hasta la cancelación. Permite generar el contrato notarial firmado por el abogado, aplicar reestructuraciones de cuota, realizar saldo anticipado con descuento e imprimir estados de cuenta.',
    features: [
      'Matriz de préstamos activos con búsqueda rápida por cliente o código',
      'Generación e impresión del Pagaré Notarial Legal oficial',
      'Refinanciamiento automático absorbiendo deudas activas en 1 clic',
      'Cálculo de liquidación anticipada con exención de intereses futuros',
      'Ajuste de fechas de vencimiento y cambio de modalidad de pago',
      'Historial cronológico de movimientos financieros del contrato'
    ],
    exampleConfig: 'Selecciona un préstamo activo y presiona "Refinanciar" para crear un nuevo crédito de mayor monto cancelando el saldo anterior automáticamente.',
    roiImpact: 'Automatiza toda la gestión contractual eliminando errores de cálculo manual.',
    route: '/prestamos'
  },
  {
    id: 9,
    name: '9. Inventario / Stock de Garantías',
    category: 'Stock de Prendas',
    IconComponent: Package,
    shortDesc: 'Registro de equipos, vehículos (Chasis/Placa), celulares (IMEI) y electrodomésticos dados en prenda.',
    fullDesc: 'Administra los artículos físicos comercializados a crédito o retenidos como garantía prendaria. Registra datos clave como número de IMEI en teléfonos móviles, número de chasis/VIN en vehículos, marca, modelo, estado físico y valor de tasación comercial.',
    features: [
      'Control de inventario de mercancías para financiamiento con o sin inicial',
      'Campos especializados para IMEI de celulares y Chasis de vehículos',
      'Estado de prenda (En custodia, Entregado a crédito, Incautado)',
      'Asociación directa de artículos al contrato de préstamo correspondiente',
      'Historial de avalúos y depreciación del bien prendado',
      'Reporte de artículos disponibles para reventa por incautación'
    ],
    exampleConfig: 'Registra un iPhone 15 Pro con su número de IMEI `356789101112131`. Al vincularlo al préstamo, el IMEI figurará impreso en el contrato notarial.',
    roiImpact: 'Garantiza un control del 100% sobre las garantías físicas que respaldan tu capital.',
    route: '/inventario'
  },
  {
    id: 10,
    name: '10. Gestión de Pagos & Recibos QR',
    category: 'Caja & Cobranza',
    IconComponent: Calendar,
    shortDesc: 'Módulo ágil para procesar cobros, abonos a capital, impresión de tickets térmicos y envío de recibos QR por WhatsApp.',
    fullDesc: 'Diseñado para realizar cobros en menos de 10 segundos en ventanilla o terreno. Aplica pagos de cuotas completas, cuotas parciales, abonos directos a capital principal, cobro exclusivo de intereses o recargos por mora con emisión de comprobante.',
    features: [
      'Procesamiento express de cobros en 2 clics',
      'Abonos inteligentes (distribución automática mora -> interés -> capital)',
      'Opción de abonar 100% al capital principal deduciendo interés',
      'Impresión instantánea en impresoras térmicas de tickets (80mm/58mm)',
      'Generación de recibo digital HD con QR único de autenticación',
      'Compartir recibo por WhatsApp Web o API en 1 segundo'
    ],
    exampleConfig: 'Configura tu impresora térmica de 80mm por USB/Bluetooth para que al registrar el cobro se imprima el recibo automáticamente.',
    roiImpact: 'Agiliza la atención en caja reduciendo las filas de cobro a segundos por cliente.',
    route: '/pagos'
  },
  {
    id: 11,
    name: '11. Atrasos & Gestión de Morosidad',
    category: 'Cobranza & Mora',
    IconComponent: AlertCircle,
    shortDesc: 'Monitoreo automático de morosos, cálculo de mora pactada y agenda de compromisos de cobro.',
    fullDesc: 'Módulo especializado en la recuperación de cartera vencida. Categoriza automáticamente los préstamos en mora por rangos de días (1-15 días, 16-30 días, 31-60 días, +90 días), calcula la mora exacta pactada en contrato y permite registrar promesas de pago.',
    features: [
      'Panel con semáforo de clientes morosos actualizado al instante',
      'Cálculo automático de mora por porcentaje diario o monto fijo',
      'Registro de bitácora de llamadas y promesas de pago con fecha de cobro',
      'Asignación de casos a gestores de cobro o abogados externos',
      'Condonación autorizada de moras con registro de motivo',
      'Filtro para exportar listas de cobro telefónico o visitas presenciales'
    ],
    exampleConfig: 'Define una mora del 1% diario tras 3 días de gracia. El sistema aplicará el recargo únicamente sobre las cuotas vencidas.',
    roiImpact: 'Recupera hasta un 30% más de capital vencido gracias al seguimiento sistematizado.',
    route: '/atrasos'
  },
  {
    id: 12,
    name: '12. Caja Chica & Cuadre Diario',
    category: 'Control de Efectivo',
    IconComponent: Wallet,
    shortDesc: 'Apertura, cierre y arqueo diario de caja, control de flujos de efectivo y auditoría de billetes.',
    fullDesc: 'Garantiza la transparencia total del dinero físico en posesión de cajeros y sucursales. Permite realizar la apertura con el fondo de caja inicial, registrar salidas por gastos menores o desembolsos, y ejecutar el cuadre de cierre desglosando billetes y monedas.',
    features: [
      'Apertura de caja diaria con monto inicial registrado',
      'Registro inmediato de desembolsos de préstamos y cobros',
      'Plantilla de arqueo físico por denominación de billetes (RD$ 2000, 1000, 500...)',
      'Detección automática de sobrantes o faltantes en el cierre',
      'Cierre ciego (el cajero digita lo que tiene sin ver el sistema)',
      'Impresión y firma digital del reporte de cuadre diario'
    ],
    exampleConfig: 'Activa la función de "Cierre Ciego" para que el cajero deba contar y registrar el dinero físico sin conocer previamente la suma teórica del sistema.',
    roiImpact: 'Elimina descuadres de caja y fugas de efectivo en el punto de cobro.',
    route: '/caja'
  },
  {
    id: 13,
    name: '13. Cuentas Bancarias & Pasarelas POS',
    category: 'Tesorería & POS',
    IconComponent: Landmark,
    shortDesc: 'Conciliación de cuentas bancarias (DOP/USD), depósitos por transferencia y terminales de pago Verifone.',
    fullDesc: 'Administra el flujo de dinero en cuentas de cheques, cuentas de ahorros y procesadores de tarjetas de crédito/débito. Permite registrar cobros recibidos por transferencia bancaria adjuntando el número de confirmación o cobros por Verifone/POS.',
    features: [
      'Soporte para múltiples cuentas bancarias en Pesos (DOP) y Dólares (USD)',
      'Registro de transferencias con número de referencia del banco',
      'Conciliación bancaria entre el extracto del banco y el sistema',
      'Registro de comisiones cobradas por procesadores Verifone/POS',
      'Control de transferencias entre cuentas propias y caja chica',
      'Reporte consolidado de liquidez disponible en bancos'
    ],
    exampleConfig: 'Vincular la cuenta del Banco BHD y Banco Popular para que al registrar un pago el cajero elija la cuenta de destino exacta.',
    roiImpact: 'Garantiza una conciliación bancaria 100% exacta sin diferencias en libros.',
    route: '/bancos'
  },
  {
    id: 14,
    name: '14. Cartera & Rutas de Cobro',
    category: 'Logística de Campo',
    IconComponent: Briefcase,
    shortDesc: 'Asignación de rutas geográficas para cobradores en terreno, zonas de cobro y mapa de riesgo.',
    fullDesc: 'Organiza la logística de cobro en calle para empresas con cobradores motorizados. Permite agrupar a los clientes por sectores o barrios, trazar la ruta de cobro diaria más eficiente y monitorear los cobros realizados en tiempo real.',
    features: [
      'Creación y administración de rutas de cobro personalizadas',
      'Asignación de cartera de clientes por cobrador o zona geográfica',
      'Ordenamiento inteligente de paradas para optimizar el recorrido',
      'Monitoreo en vivo de cuotas cobradas vs pendientes en la ruta',
      'Reasignación rápida de clientes entre cobradores',
      'Reporte de efectividad y comisiones ganadas por gestor de campo'
    ],
    exampleConfig: 'Crea la ruta "Zona Norte - San Francisco" y asigna 45 clientes para que el cobrador recorra la zona en orden geográfico óptimo.',
    roiImpact: 'Reduce los costos de combustible y tiempo de recorrido en terreno en un 35%.',
    route: '/cartera'
  },
  {
    id: 15,
    name: '15. Control de Gastos & Egresos',
    category: 'Egresos Operativos',
    IconComponent: TrendingDown,
    shortDesc: 'Registro categorizado de gastos operativos, pago de nómina, servicios y comisiones de cobradores.',
    fullDesc: 'Mantiene un registro riguroso de todos los fondos que salen de la empresa. Categoriza los egresos en gastos administrativos, alquiler, energía eléctrica, combustible, papelería, comisiones por cobranza y nómina de empleados.',
    features: [
      'Categorización personalizada de tipos de gasto',
      'Registro de comprobantes de compras NCF (B01 / B11)',
      'Cálculo y pago de comisiones automáticas a cobradores',
      'Adjunto de fotos o archivos PDF de facturas de proveedores',
      'Alertas de gastos que superan el presupuesto asignado',
      'Integración directa con el estado de pérdidas y ganancias (P&L)'
    ],
    exampleConfig: 'Crea la categoría "Mantenimiento de Vehículos" para registrar los gastos de combustible y repuestos de los cobradores de calle.',
    roiImpact: 'Permite identificar y recortar gastos innecesarios aumentando el margen de ganancia.',
    route: '/gastos'
  },
  {
    id: 16,
    name: '16. Ganancias, Utilidades & P&L',
    category: 'Reportes Financieros',
    IconComponent: TrendingUp,
    shortDesc: 'Estado de Pérdidas y Ganancias (P&L), proyección de intereses cobrados vs devengados y margen neto.',
    fullDesc: 'El reporte financiero maestro de la empresa. Muestra el ingreso real generado por cobro de intereses, mora y cargos administrativos, resta los gastos operativos y pérdidas por incobrabilidad para entregar la Utilidad Neta Exacta del período.',
    features: [
      'Estado de Resultados P&L en tiempo real',
      'Desglose de ingresos por intereses, recargos por mora y comisiones',
      'Comparativa entre intereses devengados (teóricos) e intereses cobrados (reales)',
      'Margen de rentabilidad sobre el capital colocado (ROI %)',
      'Filtro de ganancias por rango de fechas, sucursal o cartera',
      'Exportación formal a libros de Excel y documentos PDF'
    ],
    exampleConfig: 'Genera el reporte P&L trimestral para evaluar la utilidad neta obtenida sobre una inversión inicial de 5 millones de pesos.',
    roiImpact: 'Visibilidad financiera absoluta para la toma de decisiones e inversionistas.',
    route: '/ganancias'
  },
  {
    id: 17,
    name: '17. Empleados, Permisos & Seguridad RLS',
    category: 'Administración & Roles',
    IconComponent: UserPlus,
    shortDesc: 'Control de personal, cajeros, administradores y asignación de permisos de seguridad granulares.',
    fullDesc: 'Garantiza la máxima seguridad operativa administrando quién puede ver, editar o eliminar información en el sistema. Define perfiles con permisos restringidos para cobradores o cajeros y aplicalos a través de Row Level Security (RLS) en la base de datos.',
    features: [
      'Creación de usuarios ilimitados con credenciales individuales',
      'Roles predeterminados: Administrador, Gerente, Cajero, Cobrador',
      'Permisos granulares por módulo (ej. Cobrar sí, pero ver ganancias no)',
      'Restricción de acceso por dirección IP o horario de trabajo',
      'Bloqueo instantáneo de usuarios por desvinculación laboral',
      'Registro de productividad por cada empleado en el sistema'
    ],
    exampleConfig: 'Asigna al usuario "Cajero 1" permiso exclusivo para ingresar al módulo de Pagos y Caja Chica, bloqueando el acceso a reportes de ganancias.',
    roiImpact: 'Protege la información confidencial y evita la manipulación no autorizada de datos.',
    route: '/empleados'
  },
  {
    id: 18,
    name: '18. Clasificación prudencial A/B/C/D',
    category: 'Scoring de Cartera',
    IconComponent: Tag,
    shortDesc: 'Segmentación automática de clientes según su nivel de cumplimiento y riesgo de mora prudencial.',
    fullDesc: 'Clasifica la cartera total de clientes bajo criterios prudenciales financieros. Categoriza a cada deudor en Clase A (Excelente cumplimiento), Clase B (Riesgo bajo), Clase C (Riesgo medio), Clase D (Alto riesgo) y Clase E (Irrecuperable/Judicial).',
    features: [
      'Clasificación automática actualizada cada noche según días de mora',
      'Matriz visual de distribución de cartera A, B, C, D, E',
      'Cálculo de provisión de reserva requerida por categoría de riesgo',
      'Políticas comerciales diferenciadas según la categoría del cliente',
      'Alertas tempranas de clientes en transición de Categoría A a B',
      'Reporte de comportamiento consolidado para análisis prudencial'
    ],
    exampleConfig: 'Configura la regla para que cualquier cliente que alcance 30 días de mora pase automáticamente a Categoría C exigiendo gestión telefónica intensiva.',
    roiImpact: 'Mantiene reservas de capital saludables ante posibles impagos.',
    route: '/clasificacion'
  },
  {
    id: 19,
    name: '19. Contabilidad Profunda de Doble Entrada',
    category: 'Motor Contable',
    IconComponent: BookOpen,
    shortDesc: 'Asientos contables automáticos, catálogo de cuentas, libro diario, mayor general y balance de comprobación.',
    fullDesc: 'Un motor contable completo integrado nativamente al sistema financiero. Cada vez que se realiza un desembolso, se cobra una cuota o se registra un gasto, el sistema genera automáticamente el asiento contable de partida doble sin necesidad de digitar manuales.',
    features: [
      'Generación 100% automática de asientos contables por cada transacción',
      'Catálogo de cuentas financieras estándar totalmente personalizable',
      'Libro Diario General y Libro Mayor actualizados en tiempo real',
      'Balance de Comprobación de sumas y saldos',
      'Estado de Situación Financiera (Balance General)',
      'Exportación de asientos a archivos para auditores externos'
    ],
    exampleConfig: 'Asocia la cuenta contable `1101-01 Caja General` y `1103-01 Préstamos por Cobrar` para que el desembolso genere el débito y crédito automático.',
    roiImpact: 'Ahorra el sueldo entero de digitación contable manual y elimina descuadres.',
    route: '/contabilidad'
  },
  {
    id: 20,
    name: '20. Bitácora Inalterable de Auditoría',
    category: 'Seguridad & Audit Log',
    IconComponent: ShieldCheck,
    shortDesc: 'Registro inalterable de auditoría que guarda cada creación, modificación o eliminación realizada en la plataforma.',
    fullDesc: 'Registro de seguridad forense que graba de forma imborrable todas las acciones ejecutadas en el sistema. Registra la fecha, hora exacta, usuario responsable, dirección IP y los valores anteriores vs valores nuevos de cada registro editado o borrado.',
    features: [
      'Auditoría imborrable de todas las transacciones del sistema',
      'Rastreo detallado de ediciones en montos, tasas o nombres de clientes',
      'Registro de eliminación de recibos o condonación de moras',
      'Filtros avanzados por usuario, tipo de acción, módulo o rango de fechas',
      'Identificación de la dirección IP y dispositivo utilizado',
      'Exportación de reportes de auditoría para revisiones de seguridad'
    ],
    exampleConfig: 'Filtra la bitácora por la acción "Eliminar Recibo" para revisar qué usuario solicitó anular un cobro y la justificación dada.',
    roiImpact: 'Disuade el fraude interno y proporciona trazabilidad forense del 100%.',
    route: '/bitacora'
  },
  {
    id: 21,
    name: '21. Centro de Migración Masiva AI',
    category: 'Importación de Datos',
    IconComponent: Database,
    shortDesc: 'Carga masiva de clientes, préstamos y balances históricos desde archivos Excel/CSV con inteligencia artificial.',
    fullDesc: 'Facilita la transición a Ultramoney desde hojas de cálculo de Excel u otros sistemas antiguos. Mapea automáticamente las columnas del archivo importado, detecta duplicados por cédula y permite revertir (rollback) toda la importación si encuentras un error.',
    features: [
      'Importación de miles de clientes y préstamos en segundos mediante Excel/CSV',
      'Mapeo inteligente de columnas con auto-detectores de campos',
      'Validación previa de formato de cédula, teléfono y montos',
      'Detección automática e ignorado de registros duplicados',
      'Función de Reversión (Rollback) en 1 clic si el archivo contenía errores',
      'Generación de informe de éxito y errores encontrados durante la carga'
    ],
    exampleConfig: 'Descarga la plantilla Excel oficial, llena las columnas de Cédula, Nombre, Monto y Tasa, y sube el archivo para crear 500 préstamos de golpe.',
    roiImpact: 'Reduce el tiempo de migración de semanas a menos de 10 minutos.',
    route: '/migracion'
  },
  {
    id: 22,
    name: '22. Configuración General & Sello Notarial',
    category: 'Parámetros del Sistema',
    IconComponent: Sliders,
    shortDesc: 'Personalización de datos de la empresa, plantilla de contrato notarial, tasas por defecto y WhatsApp API.',
    fullDesc: 'El panel maestro de configuración comercial e institucional. Permite subir el logotipo oficial de tu empresa, configurar los datos del Abogado-Notario para los pagarés, definir las tasas de interés por defecto y vincular la API de envío automático de mensajes de WhatsApp.',
    features: [
      'Configuración de Nombre Comercial, RNC, Dirección y Teléfonos',
      'Personalización de la plantilla del Contrato Notarial Legal (Pagaré)',
      'Registro de datos del Abogado Notario y número de colegiatura',
      'Establecimiento de tasas de interés y días de gracia por defecto',
      'Configuración de credenciales para pasarela de WhatsApp API',
      'Selección de moneda base (DOP, USD, EUR) y formato de impresión'
    ],
    exampleConfig: 'Configura el texto del contrato en el editor WYSIWYG incluyendo variables como `{NOMBRE_CLIENTE}`, `{MONTO_TEXTO}` y `{CEDULA}`.',
    roiImpact: 'Personaliza el 100% de la plataforma alineada a la identidad de tu negocio.',
    route: '/configuracion'
  }
];

/* ─── INTERACTIVE DEMO SIMULATOR FOR ALL 22 MODULES ─── */
const ModuleInteractiveDemo: React.FC<{ module: SystemModule }> = ({ module }) => {
  const [valA, setValA] = useState<number>(50000);
  const [valB, setValB] = useState<number>(10);
  const [textInput, setTextInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('B02');
  const [demoStatus, setDemoStatus] = useState<string>('ready');

  switch (module.id) {
    case 1: // Dashboard Central
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Monitor KPIs en Vivo
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">EN TIEMPO REAL</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">Ajustar Capital Prestado Hoy:</label>
              <input type="range" min={10000} max={200000} step={5000} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-indigo-500" />
              <div className="text-right font-black text-indigo-300">RD$ {valA.toLocaleString()}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">Ajustar Cobros del Día:</label>
              <input type="range" min={5000} max={valA} step={2500} value={valB} onChange={e => setValB(Number(e.target.value))} className="w-full accent-emerald-500" />
              <div className="text-right font-black text-emerald-400">RD$ {valB.toLocaleString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
            <div className="bg-slate-800/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Eficiencia Cobro</span>
              <span className="text-sm font-black text-emerald-400">{Math.round((valB / Math.max(1, valA)) * 100)}%</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Pendiente Hoy</span>
              <span className="text-sm font-black text-amber-400">RD$ {(valA - valB).toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Proyección Mes</span>
              <span className="text-sm font-black text-indigo-400">RD$ {(valB * 24).toLocaleString()}</span>
            </div>
          </div>
        </div>
      );

    case 2: // Facturas & Comprobantes NCF
      const ncfTotal = valA;
      const itbis = Math.round(ncfTotal * 0.18);
      const subtotal = ncfTotal - itbis;
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Emisor NCF & Recibo QR
            </span>
            <div className="flex gap-1">
              {['B01', 'B02', 'B14'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${activeTab === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-bold block">Monto de la Transacción:</label>
              <input type="range" min={1000} max={50000} step={1000} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-indigo-500" />
              <button 
                onClick={() => { setDemoStatus('generating'); setTimeout(() => setDemoStatus('printed'), 800); }} 
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition-colors shadow flex items-center justify-center gap-1.5"
              >
                {demoStatus === 'generating' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />} Simular Impresión Ticket
              </button>
            </div>
            <div className="bg-white text-slate-900 p-3 rounded-xl shadow font-mono text-[10px] space-y-1 relative">
              {demoStatus === 'printed' && <span className="absolute top-2 right-2 text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-sans font-bold">¡Impreso!</span>}
              <p className="font-bold text-center border-b border-dashed pb-1">ULTRAMONEY FINANCIAL</p>
              <p>NCF: <span className="font-bold text-indigo-600">{activeTab}00008492</span></p>
              <p>Subtotal: RD$ {subtotal.toLocaleString()}</p>
              <p>ITBIS (18%): RD$ {itbis.toLocaleString()}</p>
              <p className="font-bold text-sm text-slate-900 border-t border-dashed pt-1">TOTAL: RD$ {ncfTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      );

    case 3: // Consulta Crediticia & Scoring
      const score = Math.min(850, Math.max(300, 300 + Math.round((valA / 100000) * 550)));
      const isApproved = score >= 580;
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Simulador de Scoring Crediticio
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <label className="text-slate-400 font-bold block">Ajustar Historial de Pagos Previos:</label>
            <input type="range" min={10000} max={100000} step={5000} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-indigo-500" />
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Score Evaluado</span>
                <span className={`text-base font-black ${score >= 700 ? 'text-emerald-400' : score >= 580 ? 'text-amber-400' : 'text-rose-400'}`}>{score} / 850</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Dictamen</span>
                <span className={`text-xs font-bold uppercase ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>{isApproved ? 'APROBADO' : 'RECHAZADO'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Límite Sugerido</span>
                <span className="text-xs font-black text-indigo-300">RD$ {(score * 250).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 4: // Solicitud & Originación
      const inicialReq = Math.round(valA * 0.20);
      const cuotaEst = Math.round((valA - inicialReq) * 1.15 / 12);
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Originación de Crédito
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="text-slate-400 font-bold block">Valor del Bien a Financiar:</label>
              <input type="range" min={20000} max={300000} step={10000} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-indigo-500" />
              <p className="text-right font-black text-indigo-300">RD$ {valA.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/90 p-3 rounded-xl space-y-2 border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Inicial Requerida (20%):</span>
                <span className="font-bold text-amber-400">RD$ {inicialReq.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto a Financiar:</span>
                <span className="font-bold text-indigo-300">RD$ {(valA - inicialReq).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1 font-bold">
                <span className="text-white">Cuota Mensual (12 Meses):</span>
                <span className="text-emerald-400">RD$ {cuotaEst.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 5: // Simulador Financiero Avanzado
      const intSim = Math.round(valA * (valB / 100));
      const cuotaSim = Math.round((valA + intSim) / 6);
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Calculadora de Amortización
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="text-slate-400 font-bold block">Monto Préstamo:</label>
              <input type="range" min={10000} max={150000} step={5000} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-indigo-500" />
              <div className="flex justify-between">
                <span className="text-slate-400">Tasa Interés: {valB}%</span>
                <span className="font-black text-indigo-300">RD$ {valA.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-slate-800/90 p-3 rounded-xl text-[10px] space-y-1 border border-slate-700 font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1 font-bold text-slate-300">
                <span>Mes</span><span>Capital</span><span>Interés</span><span>Cuota</span>
              </div>
              {[1, 2, 3].map(m => (
                <div key={m} className="flex justify-between text-slate-400">
                  <span>Mes {m}</span>
                  <span>RD$ {Math.round(valA / 6).toLocaleString()}</span>
                  <span>RD$ {Math.round(intSim / 6).toLocaleString()}</span>
                  <span className="text-emerald-400 font-bold">RD$ {cuotaSim.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 6: // Gestión de Clientes 360°
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Expediente Digital 360°
            </span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl flex items-center gap-3 text-xs">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Avatar" className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500" />
            <div className="space-y-0.5 flex-1">
              <h5 className="font-bold text-white text-sm">Lic. Laura Cordero</h5>
              <p className="text-[10px] text-slate-400">Cédula: 001-1829304-5 • Tel: (809) 555-0192</p>
              <div className="flex gap-2 pt-1">
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">Cliente VIP</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">Garante Vinc.</span>
              </div>
            </div>
            <button onClick={() => alert('Simulación: Iniciando chat de WhatsApp con Laura Cordero...')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg shadow">WhatsApp</button>
          </div>
        </div>
      );

    case 7: // Portales de Cliente Auto-Servicio
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Portal Móvil de Autoservicio
            </span>
          </div>
          <div className="max-w-xs mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-3 text-center space-y-2 text-xs">
            <div className="w-8 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">PORTAL CLIENTE ULTRANET</span>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 space-y-1">
              <p className="text-[10px] text-slate-400">Próxima Cuota Vence: 15 de este mes</p>
              <p className="text-lg font-black text-emerald-400">RD$ 4,250.00</p>
            </div>
            <button onClick={() => setDemoStatus('downloaded')} className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors">
              {demoStatus === 'downloaded' ? '✓ Recibo PNG Guardado' : 'Descargar Recibo PNG'}
            </button>
          </div>
        </div>
      );

    case 8: // Administración de Préstamos Activos
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Gestor de Contratos & Refinanciación
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400">Contrato Vigente #PR-2026-94</span>
              <p className="font-bold text-white">Saldo Activo: RD$ {valA.toLocaleString()}</p>
              <button onClick={() => setValA(valA + 25000)} className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg">Simular Refinanciamiento (+RD$25,000)</button>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400">Liquidación Anticipada</span>
              <p className="font-bold text-emerald-400">Monto de Cierre con Descuento: RD$ {Math.round(valA * 0.9).toLocaleString()}</p>
              <button onClick={() => setValA(Math.round(valA * 0.9))} className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg">Simular Descuento por Saldo Total</button>
            </div>
          </div>
        </div>
      );

    case 9: // Inventario / Stock de Garantías
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Registro de Garantía Prendaria
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Ej: IMEI 356789101112131 o Chasis Honda Civic" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none" />
              <button onClick={() => setDemoStatus('registered')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">Vincular Prenda</button>
            </div>
            {demoStatus === 'registered' && (
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
                <span>✓ Prenda Registrada: <strong className="text-white">{textInput || 'iPhone 15 Pro IMEI 356789101112131'}</strong></span>
                <span className="bg-emerald-500 text-slate-900 font-black text-[9px] px-2 py-0.5 rounded uppercase">En Custodia</span>
              </div>
            )}
          </div>
        </div>
      );

    case 10: // Gestión de Pagos & Recibos QR
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Terminal Express de Cobro
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs items-center">
            <div className="space-y-2">
              <label className="text-slate-400 font-bold block">Ingresar Monto Recibido:</label>
              <input type="range" min={500} max={15000} step={500} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-emerald-500" />
              <button onClick={() => setDemoStatus('paid')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow">Procesar Cobro Express (RD$ {valA.toLocaleString()})</button>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl space-y-1 text-[11px] border border-slate-700">
              <p className="text-slate-400">Distribución Automática del Pago:</p>
              <p className="text-amber-400">Mora: RD$ 0</p>
              <p className="text-indigo-300">Interés: RD$ {Math.round(valA * 0.3).toLocaleString()}</p>
              <p className="text-emerald-400 font-bold">Abono a Capital: RD$ {Math.round(valA * 0.7).toLocaleString()}</p>
            </div>
          </div>
        </div>
      );

    case 11: // Atrasos & Gestión de Morosidad
      const moraDias = valB;
      const moraCalc = Math.round(valA * (moraDias * 0.005));
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Calculadora de Mora Pactada
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <label className="text-slate-400 font-bold">Días de Atraso Acumulados:</label>
              <span className="font-black text-rose-400 text-sm">{moraDias} Días de Mora</span>
            </div>
            <input type="range" min={1} max={60} value={valB} onChange={e => setValB(Number(e.target.value))} className="w-full accent-rose-500" />
            <div className="grid grid-cols-2 gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Recargo por Mora</span>
                <span className="font-black text-rose-400">RD$ {moraCalc.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Condonar Mora con Permiso</span>
                <button onClick={() => setValB(0)} className="text-[10px] font-bold text-amber-400 underline">Aplicar Condonación 100%</button>
              </div>
            </div>
          </div>
        </div>
      );

    case 12: // Caja Chica & Cuadre Diario
      const totalBilletes = (valA * 2000) + (valB * 1000);
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Arqueo Físico de Billetes
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800 p-2.5 rounded-xl space-y-1">
              <label className="text-slate-400 text-[10px] font-bold">Billetes RD$ 2,000:</label>
              <input type="number" min={0} max={100} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-center font-bold" />
            </div>
            <div className="bg-slate-800 p-2.5 rounded-xl space-y-1">
              <label className="text-slate-400 text-[10px] font-bold">Billetes RD$ 1,000:</label>
              <input type="number" min={0} max={100} value={valB} onChange={e => setValB(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-center font-bold" />
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl flex justify-between items-center text-xs border border-slate-700">
            <span className="text-slate-300">Total Arqueado Físico:</span>
            <span className="text-base font-black text-emerald-400">RD$ {totalBilletes.toLocaleString()}</span>
          </div>
        </div>
      );

    case 13: // Cuentas Bancarias & Pasarelas POS
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Conciliador Bancario Multi-Moneda
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-center">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400">Cuenta Pesos (Banco BHD)</span>
              <p className="font-black text-indigo-300 text-sm">RD$ 1,450,000</p>
              <span className="text-[9px] text-emerald-400 font-bold block">✓ Conciliado</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400">Cuenta Dólares (Popular)</span>
              <p className="font-black text-amber-400 text-sm">USD $ 28,500</p>
              <span className="text-[9px] text-emerald-400 font-bold block">✓ Conciliado</span>
            </div>
          </div>
        </div>
      );

    case 14: // Cartera & Rutas de Cobro
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Asignador de Rutas de Cobro
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Ruta #1 - San Francisco de Macorís:</span>
              <span className="font-bold text-indigo-400">32 Clientes Asignados</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 w-[68%]" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Cobrados: 22</span>
              <span>Pendientes: 10</span>
              <span className="text-emerald-400 font-bold">68% Completado</span>
            </div>
          </div>
        </div>
      );

    case 15: // Control de Gastos & Egresos
      const gastoTotal = valA + 12000;
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Registro de Egresos Operativos
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <label className="text-slate-400 font-bold block">Ajustar Gasto de Combustible & Nómina:</label>
            <input type="range" min={2000} max={40000} step={2000} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-rose-500" />
            <div className="flex justify-between bg-slate-800 p-3 rounded-xl border border-slate-700 font-bold">
              <span className="text-slate-300">Total Gastos Operativos:</span>
              <span className="text-rose-400 text-sm">RD$ {gastoTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );

    case 16: // Ganancias, Utilidades & P&L
      const ingrBruto = valA;
      const gastosOp = valB * 1000;
      const utilNeta = Math.max(0, ingrBruto - gastosOp);
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: P&L & Utilidad Neta Real
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Ingresos por Intereses:</label>
              <input type="range" min={50000} max={300000} step={10000} value={valA} onChange={e => setValA(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Gastos Operativos:</label>
              <input type="range" min={5} max={80} step={5} value={valB} onChange={e => setValB(Number(e.target.value))} className="w-full accent-rose-500" />
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl flex justify-between items-center text-xs border border-slate-700">
            <span className="text-slate-300">Utilidad Neta P&L:</span>
            <span className="text-base font-black text-emerald-400">RD$ {utilNeta.toLocaleString()} ({Math.round((utilNeta / Math.max(1, ingrBruto)) * 100)}% Margen)</span>
          </div>
        </div>
      );

    case 17: // Empleados, Permisos & Seguridad RLS
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Matriz de Permisos RLS
            </span>
            <div className="flex gap-1">
              {['Cajero', 'Cobrador', 'Gerente'].map(r => (
                <button key={r} onClick={() => setActiveTab(r)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${activeTab === r ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-800 p-2 rounded-lg flex items-center justify-between">
              <span>Modulo Cobros:</span>
              <span className="text-emerald-400 font-bold">✓ Permitido</span>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg flex items-center justify-between">
              <span>Ver Ganancias P&L:</span>
              <span className={activeTab === 'Gerente' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{activeTab === 'Gerente' ? '✓ Permitido' : '✗ Bloqueado'}</span>
            </div>
          </div>
        </div>
      );

    case 18: // Clasificación prudencial A/B/C/D
      const moraClass = valB;
      const catLetter = moraClass <= 5 ? 'A' : moraClass <= 15 ? 'B' : moraClass <= 30 ? 'C' : 'D';
      const catColor = moraClass <= 5 ? 'text-emerald-400' : moraClass <= 15 ? 'text-indigo-300' : moraClass <= 30 ? 'text-amber-400' : 'text-rose-400';
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Categorizador de Riesgo
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <label className="text-slate-400 font-bold block">Ajustar Días de Atraso:</label>
            <input type="range" min={0} max={60} value={valB} onChange={e => setValB(Number(e.target.value))} className="w-full accent-indigo-500" />
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
              <span className="text-slate-300">Categoría Prudencial Asignada:</span>
              <span className={`text-lg font-black ${catColor}`}>Categoría {catLetter}</span>
            </div>
          </div>
        </div>
      );

    case 19: // Contabilidad Profunda de Doble Entrada
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Generador de Asiento Contable
            </span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-mono text-[10px] space-y-1.5">
            <p className="text-indigo-400 font-bold border-b border-slate-700 pb-1">Asiento #AST-90231 (Desembolso Préstamo)</p>
            <div className="flex justify-between text-slate-300">
              <span>Dr. 1103-01 Préstamos por Cobrar</span>
              <span className="font-bold text-emerald-400">RD$ 50,000.00</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Cr. 1101-01 Caja Chica General</span>
              <span className="font-bold text-indigo-300">RD$ 50,000.00</span>
            </div>
          </div>
        </div>
      );

    case 20: // Bitácora Inalterable de Auditoría
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Audit Log Forense
            </span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-[10px] font-mono space-y-1">
            <p className="text-indigo-400 font-bold">[2026-08-13 14:02:18] - IP: 190.166.42.10</p>
            <p className="text-slate-300">Usuario: <strong className="text-white">admin@ultramoney.com</strong></p>
            <p className="text-amber-400">Acción: Modificación de Tasa de Interés en Préstamo #PR-102</p>
            <p className="text-slate-400">Valor Anterior: 10% ➔ Nuevo Valor: 8%</p>
          </div>
        </div>
      );

    case 21: // Centro de Migración Masiva AI
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Importador Masivo Excel
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <button onClick={() => setDemoStatus('migrated')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl shadow">Simular Importación de 250 Clientes desde Excel</button>
            {demoStatus === 'migrated' && (
              <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30 text-center font-bold">
                ✓ 250 Registros Importados con Éxito | 0 Duplicados | Rollback Disponible
              </div>
            )}
          </div>
        </div>
      );

    case 22: // Configuración General & Sello Notarial
    default:
      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva: Personalizador de Contrato Legal
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Escribe el Nombre de tu Financiera..." className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white focus:outline-none" />
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-[10px] text-slate-300 font-serif leading-relaxed">
              "En la ciudad de Santo Domingo, la financiera <strong className="text-indigo-300 font-sans">{textInput || 'FINANCIERA ULTRAMONEY S.R.L.'}</strong> otorga el presente préstamo notarial..."
            </div>
          </div>
        </div>
      );
  }
};

/* ─── LANDING PAGE ─── */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedModule, setSelectedModule] = useState<SystemModule | null>(null);

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

  /* ── GSAP ScrollTrigger Animations for ALL Landing Page Sections ── */
  useEffect(() => {
    const mainScroller = document.querySelector('main') || window;
    
    const ctx = gsap.context(() => {
      // 1. Hero Section Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
      tl.from('.hero-badge', { y: 20, opacity: 0, clearProps: 'all' })
        .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, clearProps: 'all' }, '-=0.5')
        .from('.hero-sub', { y: 25, opacity: 0, clearProps: 'all' }, '-=0.6')
        .from('.hero-cta-btn', { y: 20, opacity: 0, stagger: 0.1, clearProps: 'all' }, '-=0.5')
        .from('.hero-social', { y: 15, opacity: 0, clearProps: 'all' }, '-=0.4')
        .from('.hero-mockup', { y: 40, opacity: 0, scale: 0.98, duration: 0.9, clearProps: 'all' }, '-=0.6');

      // 2. Section 22 Modules Ecosistema Grid Reveal
      gsap.fromTo('#caracteristicas .card-3d-wrapper',
        { opacity: 0, y: 40, scale: 0.96 },
        {
          scrollTrigger: {
            trigger: '#caracteristicas',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'all'
        }
      );

      // 3. Tipos de Préstamos Section Reveal
      gsap.fromTo('#tipos-prestamos .card-3d-wrapper',
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: '#tipos-prestamos',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'all'
        }
      );

      // 4. Simulador en Vivo Section Reveal
      gsap.fromTo('#simulador .bg-gradient-to-br',
        { opacity: 0, y: 40, scale: 0.97 },
        {
          scrollTrigger: {
            trigger: '#simulador',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'all'
        }
      );

      // 5. Comparativa Excel Section Reveal
      gsap.fromTo('#comparativa .bg-white',
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: '#comparativa',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'all'
        }
      );

      // 6. App Móvil Section Reveal
      gsap.fromTo('#app-movil .lg\\:col-span-6',
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: '#app-movil',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'all'
        }
      );

      // 7. Testimonios Section Reveal
      gsap.fromTo('#testimonios .bg-white',
        { opacity: 0, y: 35 },
        {
          scrollTrigger: {
            trigger: '#testimonios',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'all'
        }
      );

      // 8. Seguridad Section Reveal
      gsap.fromTo('.security-grid > div',
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: '.security-grid',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'all'
        }
      );

      // 9. FAQ Section Reveal
      gsap.fromTo('#faq .space-y-3 > div',
        { opacity: 0, y: 20 },
        {
          scrollTrigger: {
            trigger: '#faq',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'all'
        }
      );

      // 10. Stats Footer Bar Reveal
      gsap.fromTo('.stats-footer .stat-item',
        { opacity: 0, y: 20, scale: 0.9 },
        {
          scrollTrigger: {
            trigger: '.stats-footer',
            scroller: mainScroller,
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: 'back.out(1.5)',
          clearProps: 'all'
        }
      );

    }, heroRef);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

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
            <a href="#demo-interactivo" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/80">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Demo en Vivo</span>
            </a>
            <a href="#caracteristicas" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">Módulos</a>
            <a href="#tipos-prestamos" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Tipos de Préstamos</a>
            <a href="#simulador" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Simulador</a>
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
            <a href="#demo-interactivo" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-indigo-600">Demo Interactivo en Vivo ✨</a>
            <a href="#caracteristicas" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Características</a>
            <a href="#tipos-prestamos" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Tipos de Préstamos & Negocios</a>
            <a href="#simulador" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-slate-800">Simulador de Préstamos</a>
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

      {/* ─── VERTICAL INTERACTIVE DEMO SHOWCASE FOR ALL SIDEBAR MODULES ─── */}
      <VerticalModulesShowcase />

      {/* ─── NEW SECTION: TIPOS DE PRÉSTAMOS Y MODELOS DE NEGOCIOS SOPORTADOS ─── */}
      <section id="tipos-prestamos" className="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-b border-slate-200/70 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-16">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest">
              <Briefcase className="w-4 h-4 text-indigo-600" /> COBERTURA TOTAL DE MERCADO
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Tipos de Préstamos y Negocios Soportados
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Ultramoney está diseñado para adaptarse a cualquier estructura crediticia y tipo de financiera en República Dominicana y Latinoamérica, desde prestamistas individuales hasta financieras constituidas.
            </p>
          </div>

          {/* Part 1: Grid of 6 Specialized Loan Types (Centered Design) */}
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-1 border-b border-slate-200/80 pb-4">
              <h3 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
                <DollarSign className="w-6 h-6 text-indigo-600" /> Modalidades de Préstamos Gestionables
              </h3>
              <p className="text-xs text-slate-500 font-medium">Soporta amortizaciones periódicas, rédito abierto, prendas y refinanciación.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  title: 'Préstamos Personales a la Firma',
                  category: 'Amortización Regular',
                  desc: 'Créditos de consumo con cuotas fijas (Método Francés o Cuota Constante). Cálculo automático de capital e interés por período.',
                  features: ['Frecuencia Diaria, Semanal, Quincenal o Mensual', 'Historial de Garantes y Referencias', 'Generación instantánea de tabla de amortización'],
                  badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-100'
                },
                {
                  icon: FileText,
                  title: 'Pagarés Notariados / Rédito Fijo',
                  category: 'Interés Fijo + Abonos',
                  desc: 'Préstamos de solo interés mensual (Rédito). Al abonar capital excedente, el saldo principal se reduce y los intereses futuros se recalculan automáticamente.',
                  features: ['Re-cálculo de rédito automático tras abonos', 'Impresión de Pagaré Notarial Legal con sello', 'Opción de liquidación anticipada sin penalidad'],
                  badgeColor: 'text-purple-600 bg-purple-50 border-purple-100'
                },
                {
                  icon: Landmark,
                  title: 'Financiamiento de Vehículos',
                  category: 'Garantía de Matrícula',
                  desc: 'Gestión completa de préstamos con garantía de automóviles, motocicletas o equipos pesados con vinculación de matrícula.',
                  features: ['Registro de Chasis (VIN), Placa, Marca y Año', 'Control de Vencimiento de Póliza de Seguro', 'Contrato de Prenda sin Desposeimiento'],
                  badgeColor: 'text-blue-600 bg-blue-50 border-blue-100'
                },
                {
                  icon: Package,
                  title: 'Préstamos con Garantía Prendaria',
                  category: 'Custodia de Empeños',
                  desc: 'Registro de artículos físicos entregados en custodia (laptops, celulares con IMEI, joyas, electrodomésticos) con comprobante de recepción.',
                  features: ['Asignación de código de custodia en almacén', 'Acta de entrega y devolución de prenda', 'Sistemas de remate por incumplimiento'],
                  badgeColor: 'text-amber-600 bg-amber-50 border-amber-100'
                },
                {
                  icon: Navigation,
                  title: 'Cobro Diario de Ruta Comercial',
                  category: 'App Móvil de Campo',
                  desc: 'Diseñado para cobradores de calle en comercios locales y rutas comerciales. Registro de cobros en menos de 5 segundos desde el celular.',
                  features: ['Rutas organizadas por cercanía o sector', 'Comprobantes por WhatsApp en 1 clic', 'Cuadre diario de cobrador contra caja chica'],
                  badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-100'
                },
                {
                  icon: RefreshCw,
                  title: 'Consolidación & Refinanciación',
                  category: 'Reestructuración 1-Clic',
                  desc: 'Permite absorber deudas activas anteriores en un nuevo préstamo unificado, relanzando los plazos de amortización limpiamente.',
                  features: ['Unificación de múltiples deudas en un saldo', 'Cancelación automática de contratos previos', 'Auditoría inalterable de reestructuración'],
                  badgeColor: 'text-rose-600 bg-rose-50 border-rose-100'
                }
              ].map((item, idx) => {
                const IconC = item.icon;
                return (
                  <div key={idx} className="card-3d-wrapper cursor-pointer">
                    <div className="gradient-border-glow h-full">
                      <div className="card-3d-inner bg-white rounded-[1.35rem] p-7 h-full text-center flex flex-col items-center justify-between group space-y-4">
                        <div className="flex flex-col items-center text-center space-y-3 w-full">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 via-slate-50 to-blue-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-1 group-hover:scale-110 group-hover:from-indigo-600 group-hover:to-blue-600 group-hover:text-white transition-all duration-300 shadow-xs mx-auto">
                            <IconC className="w-8 h-8 shrink-0 aspect-square" strokeWidth={1.5} />
                          </div>
                          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border mx-auto ${item.badgeColor}`}>
                            {item.category}
                          </span>
                          <h4 className="text-lg font-extrabold text-slate-900 text-center group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed text-center font-normal">{item.desc}</p>
                        </div>
                        <div className="w-full pt-4 border-t border-slate-100/90 space-y-2.5 flex flex-col items-center text-center">
                          {item.features.map((feat, fidx) => (
                            <div key={fidx} className="flex items-center justify-center gap-2 text-slate-700 text-[11.5px] font-semibold text-center w-full">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Part 2: Grid of 6 Supported Business Types (Centered Design) */}
          <div className="space-y-8 pt-8 border-t border-slate-200/80">
            <div className="text-center max-w-xl mx-auto space-y-1 border-b border-slate-200/80 pb-4">
              <h3 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
                <Landmark className="w-6 h-6 text-indigo-600" /> Tipos de Negocios y Financieras
              </h3>
              <p className="text-xs text-slate-500 font-medium">Solución modular escalable para cualquier estructura u operaciones.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Prestamistas Independientes & Privados',
                  desc: 'Prestamistas que administran su propio capital desde su celular o laptop sin complicaciones contables excesivas.',
                  impact: 'Elimina libretas en papel y automatiza cobros por WhatsApp.'
                },
                {
                  title: 'Agencias de Cobro Diario / Ruta',
                  desc: 'Financieras con equipos de cobradores en la calle que requieren reportes geográficos y cuadre de caja al cierre del día.',
                  impact: 'Control de cuadre diario por cobrador y rutas optimizadas.'
                },
                {
                  title: 'Dealers & Financieras de Vehículos',
                  desc: 'Empresas de financiamiento automotriz que requieren gestión de matrículas, prendas sin desposeimiento y pólizas de seguro.',
                  impact: 'Contratos notariales automáticos y expediente de vehículos.'
                },
                {
                  title: 'Casas de Empeño & Custodia Prendaria',
                  desc: 'Establecimientos que reciben artículos electrónicos, joyas o bienes físicos como colateral de sus préstamos.',
                  impact: 'Control de stock de prendas y actas de recepción/devolución.'
                },
                {
                  title: 'Cooperativas & Credit Unions Pymes',
                  desc: 'Instituciones financieras comunitarias que necesitan contabilidad de doble entrada, NCF fiscal de la DGII y multiusuario RLS.',
                  impact: 'Comprobantes fiscales NCF y contabilidad de doble entrada.'
                },
                {
                  title: 'Prestamistas Comerciales a Pymes',
                  desc: 'Financieras B2B que conceden avances de capital de trabajo a comerciantes, colmados y pequeñas empresas.',
                  impact: 'Reportes de riesgo prudencial A/B/C/D y scoring de crédito.'
                }
              ].map((biz, idx) => (
                <div key={idx} className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col items-center justify-between text-center space-y-4 group">
                  <div className="flex flex-col items-center text-center space-y-3 w-full">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 mx-auto mb-1 group-hover:scale-110 transition-transform">
                      0{idx + 1}
                    </div>
                    <h4 className="font-extrabold text-base text-slate-900 text-center group-hover:text-indigo-600 transition-colors">{biz.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-center">{biz.desc}</p>
                  </div>
                  <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100/80 text-center">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{biz.impact}</span>
                  </div>
                </div>
              ))}
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
                    onClick={() => setActiveMobileTab(tab.id as typeof activeMobileTab)}
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

          <div className="security-grid grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* ─── MODULE DETAIL MODAL ─── */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={() => setSelectedModule(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden text-left max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <selectedModule.IconComponent className="w-11 h-11 text-indigo-600 shrink-0 aspect-square" strokeWidth={1.5} />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {selectedModule.category}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{selectedModule.name}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedModule(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {selectedModule.fullDesc}
              </p>

              {/* Key Features */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Funcionalidades Principales del Módulo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedModule.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs font-bold text-slate-800 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Interactive Demo Widget */}
              <div className="pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-2.5 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" /> Demo Interactiva del Módulo
                </h4>
                <ModuleInteractiveDemo module={selectedModule} />
              </div>

              {/* Example Config Banner */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100/90 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900 block mb-1">Ejemplo Práctico de Configuración & Uso</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedModule.exampleConfig}</p>
                </div>
              </div>

              {/* ROI & Impact Banner */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/90 flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900 block mb-1">Impacto Operativo & Beneficio Financiero</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedModule.roiImpact}</p>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setSelectedModule(null)} 
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  const route = selectedModule.route;
                  setSelectedModule(null);
                  navigate(currentUser ? route : '/login');
                }}
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {currentUser ? 'Ir al Módulo Ahora' : 'Probar Módulo Gratis'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
