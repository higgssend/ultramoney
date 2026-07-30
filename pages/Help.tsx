import React, { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronRight, BookOpen, Users, CreditCard, DollarSign,
  FileText, Settings, BarChart2, HelpCircle, Shield, Link, Star,
  UserPlus, PlusCircle, ArrowRightLeft, AlertCircle, CheckCircle,
  Phone, Mail, Download, Eye, Terminal, Code, Database
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: React.ReactNode;
  tags?: string[];
}

interface Category {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  articles: Article[];
}

const categories: Category[] = [
  {
    id: 'primeros-pasos',
    icon: <Star className="w-5 h-5" />,
    label: 'Primeros Pasos',
    color: 'from-amber-500 to-orange-500',
    articles: [
      {
        id: 'bienvenida',
        title: '¿Qué es Ultramoney?',
        tags: ['intro', 'plataforma'],
        content: (
          <div className="space-y-4">
            <p>Ultramoney es una plataforma profesional para gestionar tu financiera o prestamista personal. Con ella puedes:</p>
            <ul className="space-y-2">
              {[
                'Registrar y administrar clientes',
                'Crear y hacer seguimiento de préstamos',
                'Registrar pagos y generar recibos',
                'Ver el estado financiero en tiempo real',
                'Compartir un portal con tus clientes para que vean sus préstamos',
                'Crear contratos y adjuntar garantías',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        id: 'registro',
        title: 'Cómo registrarse',
        tags: ['registro', 'cuenta'],
        content: (
          <div className="space-y-4">
            <p>Para comenzar a usar Ultramoney sigue estos pasos:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Ir a la página de Registro', desc: 'Haz clic en "Regístrate gratis" en la pantalla de inicio o ve directamente a /register.' },
                { step: '2', title: 'Llena tus datos', desc: 'Ingresa tu nombre completo, correo electrónico y una contraseña segura (mínimo 8 caracteres, con mayúscula, número y símbolo).' },
                { step: '3', title: 'Acepta las políticas', desc: 'Lee y acepta los Términos de Servicio y la Política de Privacidad.' },
                { step: '4', title: 'Verifica tu correo', desc: 'Recibirás un código de 6 dígitos en tu correo. Introdúcelo en la pantalla de verificación.' },
                { step: '5', title: 'Configura tu negocio', desc: 'Después de verificar, completa los datos de tu prestamista (nombre, teléfono, etc.) en el panel de Onboarding.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'login',
        title: 'Cómo iniciar sesión',
        tags: ['login', 'acceso'],
        content: (
          <div className="space-y-4">
            <p>Para entrar a tu cuenta:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Ve a /login', desc: 'Accede desde la pantalla de inicio haciendo clic en "Iniciar Sesión".' },
                { step: '2', title: 'Ingresa tu correo y contraseña', desc: 'Escribe el correo y contraseña que usaste al registrarte.' },
                { step: '3', title: 'Activa "Recordarme"', desc: 'Si marcas esta opción, la próxima vez tu correo se rellenará automáticamente.' },
                { step: '4', title: 'Alternativas', desc: 'También puedes entrar con Google o Apple si los configuraste.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">Si olvidaste tu contraseña, haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones enviadas a tu correo.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'clientes',
    icon: <Users className="w-5 h-5" />,
    label: 'Clientes',
    color: 'from-blue-500 to-indigo-600',
    articles: [
      {
        id: 'agregar-cliente',
        title: 'Cómo agregar un cliente',
        tags: ['cliente', 'registro', 'nuevo'],
        content: (
          <div className="space-y-4">
            <p>Para registrar un nuevo cliente en el sistema:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Ve a "Clientes"', desc: 'En el menú lateral, haz clic en la sección "Clientes".' },
                { step: '2', title: 'Clic en "Nuevo Cliente"', desc: 'Presiona el botón "Nuevo Cliente" en la esquina superior derecha.' },
                { step: '3', title: 'Llena el formulario', desc: 'Completa nombre, cédula, teléfono, dirección y demás datos del cliente.' },
                { step: '4', title: 'Adjunta documentos (opcional)', desc: 'Puedes subir foto de cédula, comprobantes y otros archivos desde la pestaña de Documentos.' },
                { step: '5', title: 'Guarda el registro', desc: 'Haz clic en "Guardar" y el cliente aparecerá en tu lista.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'portal-cliente',
        title: 'Portal de cliente (link de seguimiento)',
        tags: ['portal', 'link', 'cliente', 'seguimiento'],
        content: (
          <div className="space-y-4">
            <p>Cada cliente tiene un link único para ver el estado de sus préstamos en tiempo real:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Entra al perfil del cliente', desc: 'Haz clic en el nombre del cliente en la lista.' },
                { step: '2', title: 'Genera el PIN del cliente', desc: 'Si el cliente no tiene PIN, haz clic en "Generar PIN". Este es su clave de acceso.' },
                { step: '3', title: 'Comparte el enlace', desc: 'Copia el enlace del portal del cliente y envíaselo por WhatsApp o correo.' },
                { step: '4', title: 'El cliente accede', desc: 'Con su ID y PIN, el cliente puede ver sus préstamos, cuotas y descargar recibos de pago.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
              <Eye className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">El portal se actualiza en tiempo real. Cuando registres un pago, el cliente lo verá inmediatamente.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'prestamos',
    icon: <CreditCard className="w-5 h-5" />,
    label: 'Préstamos',
    color: 'from-purple-500 to-violet-600',
    articles: [
      {
        id: 'crear-prestamo',
        title: 'Cómo crear un préstamo',
        tags: ['préstamo', 'nuevo', 'crear'],
        content: (
          <div className="space-y-4">
            <p>Para crear un nuevo préstamo para un cliente:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Ve a "Préstamos"', desc: 'En el menú lateral, selecciona la sección "Préstamos".' },
                { step: '2', title: 'Clic en "Nuevo Préstamo"', desc: 'Presiona el botón de nuevo préstamo.' },
                { step: '3', title: 'Selecciona el cliente', desc: 'Busca y selecciona el cliente al que le darás el préstamo.' },
                { step: '4', title: 'Define el tipo de préstamo', desc: 'Elige entre Amortizado (cuotas fijas que incluyen capital e interés) o Rédito/Pagaré Abierto (solo pagas intereses hasta que canceles el capital).' },
                { step: '5', title: 'Establece los términos', desc: 'Ingresa el monto, tasa de interés, duración, frecuencia de pago y fecha de inicio.' },
                { step: '6', title: 'Agrega garantías (opcional)', desc: 'Puedes agregar garantías como vehículos (placa/matrícula), bienes inmuebles u otros.' },
                { step: '7', title: 'Desembolsa', desc: 'Haz clic en "Desembolsar" para activar el préstamo.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'tipos-prestamo',
        title: 'Tipos de préstamo: Amortizado vs Rédito',
        tags: ['amortizado', 'rédito', 'pagaré', 'tipos'],
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Préstamo Amortizado
                </h4>
                <p className="text-sm text-indigo-700 mb-3">El cliente paga cuotas fijas que incluyen capital e interés.</p>
                <ul className="text-sm space-y-1 text-slate-600">
                  <li>✓ Cuotas fijas predecibles</li>
                  <li>✓ Balance disminuye cada pago</li>
                  <li>✓ Ideal para préstamos de consumo</li>
                </ul>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" /> Pagaré Abierto (Rédito)
                </h4>
                <p className="text-sm text-amber-700 mb-3">El cliente solo paga intereses periódicamente; el capital se abona cuando puede.</p>
                <ul className="text-sm space-y-1 text-slate-600">
                  <li>✓ Cuotas de solo interés</li>
                  <li>✓ Puede abonar a capital en cualquier momento</li>
                  <li>✓ Ideal para capital de trabajo</li>
                </ul>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-700"><strong>¿Cómo abonar capital en un préstamo de Rédito?</strong><br />Al registrar un pago, selecciona el tipo "Capital" o "Mixto". En "Mixto" puedes indicar cuánto va a capital y cuánto son intereses.</p>
            </div>
          </div>
        ),
      },
      {
        id: 'garantias',
        title: 'Cómo agregar garantías',
        tags: ['garantía', 'colateral', 'vehículo', 'inmueble'],
        content: (
          <div className="space-y-4">
            <p>Al crear un préstamo, puedes asociar garantías para respaldar la deuda:</p>
            <div className="space-y-3">
              {[
                { tipo: '🚗 Vehículo', campos: 'Número de matrícula/placa, modelo, año, marca, color.' },
                { tipo: '🏠 Inmueble', campos: 'Dirección, número de registro catastral, valor estimado.' },
                { tipo: '💍 Joyas / Electrónicos', campos: 'Descripción detallada, valor estimado, número de serie si aplica.' },
                { tipo: '📄 Otros documentos', campos: 'Puedes subir fotos o PDFs del bien como respaldo.' },
              ].map(({ tipo, campos }) => (
                <div key={tipo} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xl">{tipo.split(' ')[0]}</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{tipo.split(' ').slice(1).join(' ')}</p>
                    <p className="text-xs text-slate-500">{campos}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'pagos',
    icon: <DollarSign className="w-5 h-5" />,
    label: 'Pagos',
    color: 'from-emerald-500 to-teal-600',
    articles: [
      {
        id: 'registrar-pago',
        title: 'Cómo registrar un pago',
        tags: ['pago', 'registrar', 'cuota'],
        content: (
          <div className="space-y-4">
            <p>Para registrar un pago de un cliente:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Ve al préstamo del cliente', desc: 'Busca el préstamo en la sección "Préstamos" o desde el perfil del cliente.' },
                { step: '2', title: 'Haz clic en "Registrar Pago"', desc: 'Aparecerá un formulario para ingresar el monto y detalles del pago.' },
                { step: '3', title: 'Selecciona la fecha del pago', desc: 'Importante: puedes elegir la fecha del pago (no tiene que ser hoy). Esto es útil si olvidaste registrar un pago anterior.' },
                { step: '4', title: 'Selecciona la fecha de la factura', desc: 'También puedes indicar la fecha que aparecerá en el recibo/factura.' },
                { step: '5', title: 'Elige el tipo de pago', desc: 'Para préstamos de Rédito: "Interés" (solo paga intereses), "Capital" (abona al principal), o "Mixto" (parte interés, parte capital).' },
                { step: '6', title: 'Confirma el pago', desc: 'El balance del préstamo se actualiza automáticamente y se genera el recibo.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'recibos',
        title: 'Generar y descargar recibos',
        tags: ['recibo', 'factura', 'descargar', 'imprimir'],
        content: (
          <div className="space-y-4">
            <p>Puedes imprimir o descargar recibos de cada pago:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Encuentra el pago', desc: 'Ve al historial de pagos del préstamo.' },
                { step: '2', title: 'Clic en el icono de recibo', desc: 'Junto a cada transacción hay un botón para generar el recibo.' },
                { step: '3', title: 'Elige el formato', desc: 'Puedes descargar como PDF (carta 8.5x11), imagen PNG, o imprimir directamente.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">Los clientes también pueden descargar sus propios recibos desde el portal del cliente, usando su PIN de acceso.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'contratos',
    icon: <FileText className="w-5 h-5" />,
    label: 'Contratos',
    color: 'from-rose-500 to-pink-600',
    articles: [
      {
        id: 'generar-contrato',
        title: 'Cómo generar un contrato',
        tags: ['contrato', 'documento', 'legal'],
        content: (
          <div className="space-y-4">
            <p>Al crear un préstamo, puedes generar automáticamente un contrato legal:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Crea o abre un préstamo', desc: 'Ve al préstamo para el que necesitas el contrato.' },
                { step: '2', title: 'Haz clic en "Contrato"', desc: 'Busca el botón de contrato en el menú del préstamo.' },
                { step: '3', title: 'Revisa el contrato', desc: 'El contrato se genera con todos los datos del préstamo, cliente y garantías.' },
                { step: '4', title: 'Descarga o imprime', desc: 'Puedes exportarlo como PDF (8.5x11), imagen, o imprimirlo directamente para firma.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
    ],
  },
  {
    id: 'configuracion',
    icon: <Settings className="w-5 h-5" />,
    label: 'Configuración',
    color: 'from-slate-500 to-gray-600',
    articles: [
      {
        id: 'datos-empresa',
        title: 'Configurar datos de tu negocio',
        tags: ['configuración', 'empresa', 'logo'],
        content: (
          <div className="space-y-4">
            <p>Para personalizar los datos de tu financiera (nombre, logo, contacto):</p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Ve a Configuración', desc: 'Haz clic en "Configuración" en el menú lateral o en tu avatar de usuario.' },
                { step: '2', title: 'Sección "Mi Negocio"', desc: 'Aquí puedes editar el nombre de tu financiera, eslogan, RNC, teléfono, y dirección.' },
                { step: '3', title: 'Sube tu logo', desc: 'Haz clic en el área de logo y sube una imagen. Aparecerá en todos tus recibos y contratos.' },
                { step: '4', title: 'Guarda los cambios', desc: 'Haz clic en "Guardar" y los cambios se aplicarán en todo el sistema.' },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
    ],
  },
  {
    id: 'api-dev',
    icon: <Terminal className="w-5 h-5" />,
    label: 'API y Desarrolladores',
    color: 'from-slate-600 to-slate-800',
    articles: [
      {
        id: 'api-intro',
        title: 'Introducción a la API de UltraMoney',
        tags: ['api', 'desarrolladores', 'integración'],
        content: (
          <div className="space-y-4">
            <p>La API de UltraMoney (v1) te permite conectar tu software contable, scripts o aplicaciones de terceros directamente con tu base de datos de manera segura.</p>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto">
              <span className="text-slate-500">// URL Base de la API</span><br/>
              <span className="text-emerald-400">GET</span> https://sxwv82iw.us-east.insforge.app/functions/v1/api
            </div>
            <p className="font-bold text-slate-800">Autenticación</p>
            <p>Todas las peticiones deben incluir un header de autorización con tu API Key:</p>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono">
              Authorization: Bearer <span className="text-amber-400">tu_api_key</span>
            </div>
            <p className="text-sm text-slate-500">Puedes generar tus API Keys desde <b>Configuración {'>'} API y Desarrolladores</b>.</p>
          </div>
        )
      },
      {
        id: 'api-endpoints',
        title: 'Endpoints Disponibles',
        tags: ['endpoints', 'get', 'post', 'api'],
        content: (
          <div className="space-y-4">
            <p>Puedes acceder a diferentes recursos enviando el parámetro <code className="bg-slate-100 text-rose-500 px-1 rounded">?resource=nombre_recurso</code>.</p>
            <h4 className="font-bold">Recursos Permitidos:</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><code className="text-xs">clients</code></li>
              <li><code className="text-xs">loans</code></li>
              <li><code className="text-xs">transactions</code></li>
              <li><code className="text-xs">bank_accounts</code></li>
            </ul>
            
            <h4 className="font-bold mt-4">Ejemplo en cURL (Obtener clientes)</h4>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto whitespace-pre">
{`curl -X GET \\
  'https://sxwv82iw.us-east.insforge.app/functions/v1/api?resource=clients' \\
  -H 'Authorization: Bearer sk_ultra_abc123...'`}
            </div>

            <h4 className="font-bold mt-4">Ejemplo en JavaScript (fetch)</h4>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto whitespace-pre">
{`const response = await fetch('https://sxwv82iw.us-east.insforge.app/functions/v1/api?resource=loans', {
  headers: {
    'Authorization': 'Bearer sk_ultra_abc123...'
  }
});
const { data } = await response.json();
console.log(data);`}
            </div>
          </div>
        )
      }
    ]
  }
];

const HelpPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>(categories[0].id);
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.map(cat => ({
      ...cat,
      articles: cat.articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.includes(q))
      ),
    })).filter(cat => cat.articles.length > 0);
  }, [search]);

  const activeCat = filteredCategories.find(c => c.id === selectedCat) || filteredCategories[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Centro de Ayuda</h1>
          <p className="text-indigo-200 text-lg mb-8">Encuentra respuesta a cualquier pregunta sobre Ultramoney</p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenArticle(null); }}
              placeholder="Buscar... (ej: registrar pago, garantía, contrato)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <nav className="space-y-1 sticky top-6">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCat(cat.id); setOpenArticle(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    (activeCat?.id === cat.id)
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <span className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color} text-white`}>
                    {cat.icon}
                  </span>
                  {cat.label}
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${activeCat?.id === cat.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {cat.articles.length}
                  </span>
                </button>
              ))}
              {filteredCategories.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Sin resultados</p>
              )}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile category selector */}
            <div className="md:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeCat?.id === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {activeCat ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className={`p-2 rounded-xl bg-gradient-to-br ${activeCat.color} text-white shadow-md`}>
                    {activeCat.icon}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">{activeCat.label}</h2>
                </div>

                <div className="space-y-3">
                  {activeCat.articles.map(article => (
                    <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                      <button
                        onClick={() => setOpenArticle(openArticle === article.id ? null : article.id)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-800">{article.title}</span>
                        </div>
                        {openArticle === article.id
                          ? <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          : <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        }
                      </button>
                      {openArticle === article.id && (
                        <div className="px-5 pb-6 pt-1 border-t border-slate-100 text-slate-600 text-sm leading-relaxed">
                          {article.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No se encontraron artículos para "{search}"</p>
                <button onClick={() => setSearch('')} className="mt-3 text-indigo-600 text-sm font-semibold hover:underline">
                  Limpiar búsqueda
                </button>
              </div>
            )}

            {/* Contact Box */}
            <div className="mt-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">¿Necesitas más ayuda?</h3>
              <p className="text-indigo-200 text-sm mb-4">Si no encuentras lo que buscas, contáctanos directamente.</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:soporte@ultramoney.com"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Mail className="w-4 h-4" /> soporte@ultramoney.com
                </a>
                <a
                  href="https://wa.me/18095550100"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
