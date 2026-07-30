# Elevate Project - Sistema de Gestión Financiera

## 1. Descripción General
**Elevate Project** es una solución integral basada en la web (SPA) diseñada para la administración eficiente de empresas de préstamos, financieras y gestión de cobros. El sistema centraliza el ciclo de vida del crédito, desde la solicitud y evaluación del cliente hasta la gestión de cobros, contabilidad y análisis de rentabilidad.

El sistema está construido con una arquitectura moderna "Mobile-First", asegurando que los cobradores y administradores puedan utilizar todas las funcionalidades tanto desde dispositivos móviles en ruta como desde escritorios en oficina.

---

## 2. Ficha Técnica

### Stack Tecnológico
*   **Frontend Core:** React 18 (Hooks, Functional Components).
*   **Lenguaje:** TypeScript (Tipado estático estricto para modelos financieros).
*   **Estilos & UI:** 
    *   Tailwind CSS (Motor de estilos utilitarios).
    *   Diseño Responsivo (Mobile, Tablet, Desktop).
    *   Animaciones CSS nativas para transiciones de interfaz.
*   **Enrutamiento:** React Router DOM v6+.
*   **Gestión de Estado:** React Context API (StoreContext) para manejo global de datos sin dependencias externas pesadas (Redux/Zustand).
*   **Visualización de Datos:** Recharts para gráficos financieros y estadísticos.
*   **Iconografía:** Lucide React.

### Arquitectura de Software
*   **Patrón:** Single Page Application (SPA).
*   **Estructura de Directorios:**
    *   `/components`: Componentes reutilizables (UI Kit, Sidebar, Modales).
    *   `/pages`: Vistas principales correspondientes a las rutas.
    *   `/context`: Lógica de negocio y persistencia de estado volátil.
    *   `/types`: Definiciones de interfaces TypeScript (Modelos de Datos).
*   **Seguridad:** Validación de formularios y manejo seguro de tipos. (Nota: En producción, requiere integración con Backend seguro para Auth y BD).

### Modelos de Datos Principales
*   **Client:** Perfil completo, score crediticio, documentos digitales.
*   **Loan:** Motor financiero (Cálculo de amortización, interés simple/compuesto, frecuencias).
*   **Transaction:** Libro mayor de contabilidad (Ingresos/Gastos).

---

## 3. Módulos y Funcionalidades

### A. Dashboard Ejecutivo (`/`)
*   **KPIs en Tiempo Real:** Visualización de Cartera por Cobrar, Clientes Activos, Mora Total y Balance en Caja.
*   **Gráficos:** Flujo de caja anual (Ingresos vs Gastos).
*   **Actividad Reciente:** Feed de las últimas transacciones realizadas en el sistema.

### B. Gestión de Clientes (`/clientes`)
*   **Expediente Digital:**
    *   Datos personales, contacto, laborales y financieros.
    *   **Score Crediticio:** Barra visual de calificación del cliente.
    *   **Documentos:** Carga y visualización (con zoom) de Cédulas, Contratos y Garantías (Imágenes/PDF).
    *   **Historial:** Visualización unificada de préstamos históricos y pagos.
*   **CRUD Completo:** Creación, Edición y Bloqueo de clientes.

### C. Motor de Préstamos (`/solicitud`, `/prestamos`)
*   **Calculadora de Amortización:**
    *   Soporte para frecuencias: Diario, Semanal, Quincenal, Mensual.
    *   Cálculo automático de intereses y cuotas.
*   **Estado de Préstamos:**
    *   Indicadores visuales de estado: Al día (Azul), Atrasado (Ámbar), Vencido (Rojo), Pagado (Verde).
    *   Barra de progreso de pago (Capital vs Interés).

### D. Módulo de Cobranza y Pagos (`/pagos`)
*   **Dos Modos de Operación:**
    1.  **Registro Manual:** Pago por monto libre o selección específica de cuotas en la tabla de amortización.
    2.  **Monitor de Cuotas:** Vista agrupada por cliente para ver rápidamente quién debe pagar hoy o quién está en mora.
*   **Recibos:** Generación automática de recibos de pago digitales listos para imprimir o compartir.

### E. Contabilidad y Caja (`/caja`, `/contabilidad`)
*   **Control de Caja Chica:** Monitoreo de entradas y salidas diarias.
*   **Libro Mayor (Contabilidad Profunda):** Registro inmutable de todas las transacciones financieras con filtros por categoría (Capital, Operativo, Nómina, etc.).
*   **Reporte de Ganancias (`/ganancia`):** Análisis de rentabilidad neta (Ingresos Operativos - Gastos Operativos).

### F. Herramientas Auxiliares
*   **Datapréstamos (`/consultar`):** Simulación de consulta a buró de crédito externo.
*   **Facturación (`/facturas`):** Generación de facturas por servicios o venta de artículos recuperados.
*   **App Clientes (`/app-clientes`):** Vista previa de cómo el cliente final visualiza su estado de cuenta desde su móvil.
*   **Clasificación (`/clasificacion`):** Reglas de negocio para categorización automática de clientes (A, B, C).

---

## 4. Instalación y Despliegue

Este proyecto utiliza una estructura estándar de React.

### Requisitos
*   Node.js v16.0.0 o superior.
*   NPM o Yarn.

### Pasos de Instalación
1.  Clonar el repositorio.
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```
4.  Construir para producción:
    ```bash
    npm run build
    ```

### Estructura de Archivos Clave
```text
src/
├── components/
│   ├── Sidebar.tsx       # Navegación principal
│   ├── StatCard.tsx      # Tarjetas de métricas
│   └── MobileNav.tsx     # Navegación inferior móvil
├── pages/
│   ├── ClientDetail.tsx  # Lógica compleja de perfil de cliente
│   ├── Payments.tsx      # Lógica de amortización y cobros
│   └── Dashboard.tsx     # Vista principal
├── context/
│   └── StoreContext.tsx  # "Base de datos" en memoria y lógica de negocio
└── types.ts              # Contratos de datos (Interfaces)
```

---

## 5. Notas del Desarrollador (Senior)

*   **Escalabilidad:** El sistema está diseñado modularmente. Para escalar a miles de usuarios, se recomienda migrar `StoreContext` a un backend (Node.js/Python) y usar React Query para el manejo de estado servidor.
*   **UX/UI:** Se priorizó la legibilidad y la rapidez de acción (pocos clics para registrar un pago), crucial para el entorno operativo de los cobradores.
*   **Manejo de Errores:** Se implementaron validaciones en los formularios críticos (creación de préstamos y pagos) para asegurar la integridad financiera de los datos.
