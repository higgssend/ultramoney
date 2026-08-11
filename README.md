# 💳 ULTRAMONEY - Sistema de Gestión Financiera, Préstamos y Cobranza

---

## 📌 1. Descripción General del Sistema

**UltraMoney** es un sistema integral de administración financiera, préstamos, cobros, contabilidad y control de morosidad desarrollado bajo arquitectura SPA (Single Page Application) y PWA (Progressive Web App). 

Está diseñado para operar tanto en estaciones de trabajo fijas (escritorio en oficina) como en dispositivos móviles (cobradores en ruta), con capacidades de sincronización en tiempo real, emisión de recibos en impresoras térmicas, control de seguridad por RLS en **InsForge PostgreSQL**, y recálculo inteligente de excedentes a capital para préstamos a rédito/pagaré abierto.

---

## 🏗️ 2. Ficha Técnica & Arquitectura de Software

### Stack Tecnológico
* **Frontend Core:** React 18, TypeScript (tipado estático estricto).
* **Build Tool:** Vite 6+.
* **Backend-as-a-Service (BaaS):** InsForge PostgreSQL 15, PostgREST API, WebSockets Realtime, Edge File Storage.
* **Seguridad Database:** Row-Level Security (RLS) activo en las 18 tablas del esquema (`rowsecurity: true`).
* **Estilos & UI:** Tailwind CSS 3.4, Lucide React Icons.
* **PWA:** Manifest PWA nativo con iconos vectoriales (`/logoultramoney.svg`, `/pwa-icon.svg`), instalable en Android, iOS y Desktop.
* **Visualización de Datos:** Recharts para gráficos de ingresos y cartera.

---

## 🗄️ 3. Base de Datos & Seguridad (InsForge PostgreSQL)

### A. Conexión SDK
```typescript
import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: 'https://sxwv82iw.us-east.insforge.app',
  anonKey: 'v1.public.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});
```

### B. Esquema de Tablas
1. `clients`: Perfil del cliente, cédula dominicana formateada (`XXX-XXXXXXX-X`), fotos, garante principal y garante solidario.
2. `loans`: Préstamos amortizados o a rédito, capital desembolsado, tasa de interés, balance pendiente (`remainingBalance`), frecuencia y fechas.
3. `transactions`: Libro diario de ingresos (`Pago Préstamo`, `Interés`, `Capital`) y egresos (`Desembolso`, `Gasto Operativo`).
4. `loan_requests`: Solicitudes de crédito en proceso de evaluación y aprobación.
5. `accounting_entries` & `daily_cash_cuts`: Entradas contables y cierres diarios de caja.

---

## 🧮 4. Motor Financiero & Reglas de Negocio

### Préstamos Amortizados (Cuotas Fijas / Francés)
- Distribución de capital e interés por cada cuota.
- Redondeo seguro a 2 decimales (`Math.round(val * 100) / 100`).

### Préstamos a Rédito / Pagaré Abierto (`Solo Intereses`)
- **Cuota Periódica de Interés**: $\text{remainingBalance} \times \frac{\text{interestRate}}{100}$.
- **Regla del Sobrante a Capital (Capital Surplus Rule)**:
  - Cuando un pago excede el interés debido del periodo, el dinero sobrante **se abona automáticamente al saldo de capital** (`remainingBalance -= Excedente`).
  - Se genera un registro automático de `"Abono a Capital por Excedente"`.
  - **Recálculo Dinámico**: Los intereses de los siguientes periodos se calculan de inmediato sobre el nuevo capital reducido.
- **Acción Rápida "Saldar Préstamo Completo"**: Botón de 1 clic para liquidar todo el capital restante y cerrar la deuda.

---

## 📱 5. Guía Completa de Módulos (UI / UX)

### 📊 Dashboard Ejecutivo (`/`)
KPIs de cartera, ingresos de hoy/mes, mora acumulada y balance de caja.

### 👤 Gestión de Clientes (`/clientes`, `/clientes/:id`, `NewClient.tsx`)
- Formateo de Cédula Dominicana (`001-0982341-2`).
- Adjuntos digitalizados en InsForge Storage (contratos, fotos, garantias).

### 📝 Solicitudes y Préstamos (`/solicitud`, `/prestamos`)
- Formulario reactivo con fechas flexibles de emisión y primer pago.
- Resumen informativo previo a desembolso.

### 💰 Cobranza & Pagos (`/pagos`, `Payments.tsx`)
- Autollenado automático del monto a pagar al seleccionar un préstamo.
- Botón inteligente **`⚡ Auto`** y **`🏁 Saldar`**.
- Barra lateral de cobros **`[Hoy]`** y **`[Recientes]`** 100% cliqueable para abrir/imprimir el Recibo de Pago oficial.
- Pestaña de Historial con filtros y reimpresión.

### ⚠️ Monitor de Atrasos (`/atrasos`, `Overdue.tsx`)
Filtros de días en mora y notificaciones directas por WhatsApp.

---

## 🛠️ 6. Comandos de Instalación y Despliegue

```bash
# Instalación
npm install

# Desarrollo Local
npm run dev

# Compilar Producción
npm run build

# Despliegue en InsForge Cloud
npx @insforge/cli deployments deploy . --json
```

---

## 📄 Documentación Extensa Adicional
Para ver el manual técnico paso a paso con todos los detalles de esquemas y código, consulta:
👉 **[DOCUMENTACION_COMPLETA_ULTRAMONEY.md](file:///c:/Users/Dell/Downloads/ultramoney/DOCUMENTACION_COMPLETA_ULTRAMONEY.md)**
