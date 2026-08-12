# 📘 DOCUMENTACIÓN TÉCNICA EXHAUSTIVA Y MANUAL DEL SISTEMA - ULTRAMONEY

---

## 1. 📌 Visión General del Sistema

**UltraMoney** es una plataforma integral de Gestión Financiera, Control de Préstamos, Cobranza, Cuentas Bancarias, Puntos de Venta (POS/Verifone), Contabilidad y Evaluación de Riesgo Crediticio. Diseñada bajo una arquitectura SPA (Single Page Application) e híbrida PWA (Progressive Web App), permite la administración centralizada desde oficinas y la operabilidad en campo para cobradores mediante dispositivos móviles.

El sistema se conecta de forma nativa a la infraestructura de **InsForge BaaS (PostgreSQL)**, ofreciendo sincronización en tiempo real, aislamiento multi-usuario mediante RLS (Row Level Security), almacenamiento de archivos de garantías en la nube e integración con modelos de IA para análisis financiero y auditoría continua.

---

## 2. 🗄️ Arquitectura Backend & Base de Datos (InsForge PostgreSQL)

### 🔌 Conexión y Autenticación SDK
La comunicación con el backend se realiza mediante la librería oficial `@insforge/sdk`:
```typescript
import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: 'https://sxwv82iw.us-east.insforge.app',
  anonKey: 'v1.public.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});
```

### 🛡️ Políticas de Seguridad a Nivel de Fila (RLS)
Las tablas del sistema tienen habilitado `rowsecurity: true` en PostgreSQL. Esto impide que usuarios de una sucursal o empresa lean o modifiquen datos de otra sucursal.

Ejemplo de políticas RLS aplicadas:
```sql
-- Aislamiento estricto de préstamos por usuario/sucursal
CREATE POLICY "RLS_Loans_Tenant_Isolation"
ON public.loans
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR branch_id IN (
    SELECT branch_id FROM public.user_branches WHERE user_id = auth.uid()
));
```

### 📑 Esquema de Tablas en PostgreSQL

1. **`clients`**:
   - `id` (UUID, Primary Key)
   - `name`, `lastName` (Nombres y Apellidos)
   - `cedula` (Formato `XXX-XXXXXXX-X`)
   - `phone`, `address`, `workplace`, `monthlyIncome`
   - `creditScore` (Puntuación de crédito 300-850)
   - `guarantorName`, `guarantorCedula`, `guarantorPhone` (Garante principal)
   - `coGuarantorName`, `coGuarantorCedula`, `coGuarantorPhone` (Garante solidario)

2. **`loans`**:
   - `id` (UUID)
   - `clientId` (Foreign Key a `clients.id`)
   - `amount`, `interestRate`, `durationWeeks`, `frequency`
   - `loanType` (`Amortizado (Cuotas Fijas)`, `Solo Intereses (Rédito / Pagaré Abierto)`, `Financiamiento`)
   - `itemPrice`, `downPayment`, `downPaymentMode`, `financedAmount`
   - `closingCost`, `closingCostMode` (`Descontado`, `Financiado`, `Externo`)
   - `remainingBalance`, `totalToPay`, `installmentAmount`, `netDisbursementAmount`
   - `status` (`Vigente`, `Pagado`, `Atrasado`, `Vencido`)
   - `startDate`, `nextPaymentDate`

3. **`bank_accounts`**:
   - `id`, `bankName`, `accountNumber`, `accountType`, `currency` (`DOP` | `USD`), `balance`

4. **`custom_payment_methods`**:
   - `id`, `name`, `type` (`verifone`, `pos`, `gateway`, `custom`), `description`, `isActive`

5. **`transactions`**:
   - `id`, `type` (`Ingreso`, `Egreso`), `amount`, `date`, `category`, `note`, `bankAccountId`, `referenceId`

---

## 3. 🚀 Módulos del Sistema y Funcionalidades Clave

### 🏦 1. Gestión de Cuentas Bancarias, Verifone/POS y Cajas (`/bancos`, `BankAccountsPage.tsx`)
- **Caja Principal (Efectivo)**: Caja por defecto para movimientos en efectivo.
- **Cuentas Bancarias**: Alta y edición de cuentas bancarias de la empresa (Banreservas, BHD, Popular, etc.) en DOP y USD.
- **Terminales POS / Verifone**: Creación de métodos de pago personalizados (terminales de tarjeta, cobro digital, transferencias locales).
- **Desembolsos y Cobros Automáticos**: 
  - Al desembolsar un préstamo, se resta automáticamente el monto neto de la cuenta o caja seleccionada.
  - Al recibir un pago, el monto se acredita inmediatamente a la cuenta o método de pago correspondiente.

### 📜 2. Documento Oficial de Préstamo & Desglose Financiero (`LoanContractModal.tsx`)
- **Desglose Financiero Integral**: Visualización transparente de capital solicitado, gastos de cierre, neto a entregar, tasa de interés, cuotas y total a pagar.
- **Previsualización sin Desembolsar**: Permite ver el borrador en el formulario de solicitud sin crear registros no deseados.
- **Acceso Permanente**: Disponible en todo momento desde el **Perfil del Cliente**, el **Expediente Legal**, la **Lista de Préstamos** y el **Detalle del Préstamo**.
- **Herramientas de Exportación**:
  - 🖨️ Impresión directa optimizada.
  - 📄 Exportación a PDF de alta resolución.
  - 🖼️ Exportación a Imagen PNG.
  - 📱 Compartir recibo por WhatsApp con datos y fechas.

### 👤 3. Perfil de Cliente y Expediente Legal (`/clientes/:id`, `ClientDetail.tsx`)
- Expediente de créditos activos e históricos.
- Vista de documentos oficiales de contratos asociados.
- Historial de transacciones de pago e impresiones de recibos.
- Editor de fotografía con recorte cuadrado automático (`ImageCropperModal`).

### 📝 4. Formulario de Solicitud y Concesión (`/solicitudes/nueva`, `LoanRequest.tsx`)
- **Modos de Operación**: *Crear Solicitud (En Cola)* vs *Desembolso Directo*.
- **Opciones de Financiamiento**: Venta de artículos (vehículos, teléfonos, muebles) con inicial en efectivo/tarjeta.
- **Refinanciamiento en 1 Clic**: Consolidación de préstamos anteriores absorbiendo el saldo pendiente.

### 💰 5. Módulo de Cobranza y Pagos (`/pagos`, `Payments.tsx`)
- Autollenado inteligente de cuotas y saldos finales.
- Integración directa con métodos de pago personalizados (Verifone, Transferencia, Caja).
- Generación instantánea de comprobantes de pago digitales e impresos.

---

## 4. 🤖 Auditoría de Seguridad & Salud del Proyecto

El proyecto cuenta con una suite de **20 Agentes de Auditoría Especializados** en `.agents/skills/`:
- `security-auditor`: Detección de SQL Injection, XSS, CSRF, JWTs e inyecciones.
- `code-reviewer`: Detección de code smells, funciones largas y complejidad ciclomática.
- `bug-hunter`: Pre-ejecución estática para prevenirlos null/undefined pointers y race conditions.
- `typescript-expert`: Verificación de inferencia de tipos y modo estricto.
- `performance-optimizer`: Perfilado de renderizado y bundle chunking.

---

## 5. 🛠️ Comandos de Desarrollo y Despliegue

### Requisitos Locales
- Node.js v18.0+
- NPM v9.0+

### Ejecución Local
```bash
# Instalación de dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar paquete de producción (Vite + TS)
npm run build
```

### Despliegue a Producción (InsForge Cloud)
```bash
npx @insforge/cli deployments deploy . --json
```

---

## 🔗 Datos de Producción
- **App Web / PWA**: [https://sxwv82iw.insforge.site](https://sxwv82iw.insforge.site)
- **Backend API**: `https://sxwv82iw.us-east.insforge.app`
- **Estado de Producción**: `READY`
