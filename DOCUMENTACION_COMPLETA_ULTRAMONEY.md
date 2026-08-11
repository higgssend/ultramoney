# 📘 DOCUMENTACIÓN TÉCNICA EXHAUSTIVA Y MANUAL DEL SISTEMA - ULTRAMONEY

---

## 1. 📌 Visión General del Sistema

**UltraMoney** es una plataforma integral de Gestión Financiera, Control de Préstamos, Cobranza, Contabilidad y Evaluación de Riesgo Crediticio. Diseñada bajo una arquitectura SPA (Single Page Application) e híbrida PWA (Progressive Web App), permite la administración centralizada desde oficinas y la operabilidad en campo para cobradores mediante dispositivos móviles.

El sistema se conecta de forma nativa a la infraestructura de **InsForge BaaS (PostgreSQL)**, ofreciendo sincronización en tiempo real, aislamiento multi-usuario mediante RLS (Row Level Security), almacenamiento de archivos de garantías en la nube e integración con modelos de IA para análisis financiero.

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
Las 18 tablas del sistema tienen habilitado `rowsecurity: true` en PostgreSQL. Esto impide que usuarios de una sucursal o empresa lean o modifiquen datos de otra sucursal.

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
   - `documents` (JSON array con URLs de cédula, contratos y garantías en InsForge Storage)

2. **`loans`**:
   - `id` (UUID / Código Ref)
   - `clientId` (Foreign Key -> `clients.id`)
   - `clientName` (Snapshot de nombre)
   - `amount` (Monto desembolsado / Capital inicial)
   - `interestRate` (Tasa de interés % por periodo)
   - `remainingBalance` (Capital pendiente por cobrar)
   - `totalToPay` (Monto total esperado)
   - `loanType` (`'Amortizado (Cuotas Fijas)'` | `'Solo Intereses (Rédito / Pagaré Abierto)'`)
   - `frequency` (`'Diario'`, `'Semanal'`, `'Quincenal'`, `'Mensual'`)
   - `durationWeeks` / `installments` (Cantidad de cuotas para amortizados)
   - `startDate`, `firstPaymentDate`, `next_payment_date`
   - `status` (`'Vigente'`, `'Atrasado'`, `'Legal'`, `'Saldado'`)

3. **`transactions`**:
   - `id` (UUID)
   - `type` (`'Ingreso'`, `'Egreso'`)
   - `category` (`'Pago Préstamo'`, `'Capital'`, `'Interés'`, `'Desembolso'`, `'Gasto Operativo'`)
   - `amount` (Monto de la transacción)
   - `referenceId` (Foreign Key -> `loans.id`)
   - `description` (Detalle del pago o comprobante)
   - `date` (Fecha YYYY-MM-DD HH:mm:ss)
   - `cashierId` (ID del usuario/cajero que registró)

4. **`loan_requests`**:
   - Solicitudes pendientes con evaluación del comité de crédito, garantías adjuntas y botón de aprobación/conversión a préstamo activo.

5. **`accounting_entries` & `daily_cash_cuts`**:
   - Asientos contables de partida doble y cuadres de caja diarios por turno/cajero.

---

## 3. 🧮 Motor Financiero & Reglas de Negocio (Loan Engine)

Ubicación principal del código: [LoanEngine.ts](file:///c:/Users/Dell/Downloads/ultramoney/utils/LoanEngine.ts) y [LoanContext.tsx](file:///c:/Users/Dell/Downloads/ultramoney/context/modules/LoanContext.tsx).

### A. Préstamos Amortizados (Cuotas Fijas / Francés)
1. **Generación de Amortización**:
   Se divide la deuda en $N$ cuotas. Cada cuota contiene una porción de interés y una de capital.
2. **Redondeo Seguro a 2 Decimales**:
   Para evitar valores tipo `$833.333333333`, el sistema aplica redondeo financiero en cada cálculo:
   ```typescript
   const roundMoney = (val: number) => Math.round(val * 100) / 100;
   ```

### B. Préstamos a Rédito / Pagaré Abierto (`Solo Intereses`)
1. **Naturaleza del Crédito**:
   No tienen cantidad fija de cuotas ($N$ libre). El cliente liquida periódicamente el rendimiento del capital prestado.
2. **Cuota Periódica de Interés**:
   $$\text{Interés Debido} = \text{roundMoney}\left(\text{remainingBalance} \times \frac{\text{interestRate}}{100}\right)$$
3. **Regla del Sobrante / Excedente a Capital (Capital Surplus Logic)**:
   Si el cliente entrega un monto superior al interés debido ($\text{Monto Pago} > \text{Interés Debido}$):
   - La porción equivalente al interés debido liquida la cuota de rédito del periodo (`paymentType: 'Interes'`).
   - El dinero sobrante ($\text{Monto Pago} - \text{Interés Debido}$) **se abona automáticamente al saldo de capital**:
     $$\text{remainingBalance} \leftarrow \text{remainingBalance} - \text{Excedente}$$
   - Se genera una transacción secundaria con descripción: `"Abono a Capital por Excedente"`.
   - **Recálculo Dinámico**: Los intereses de las siguientes fechas de cobro se ajustan automáticamente sobre el nuevo capital reducido.
4. **Acción "Saldar Préstamo Completo"**:
   Un botón de 1 solo clic en el módulo de pagos carga el monto total del capital pendiente para cancelar la deuda y marcar el préstamo como `Saldado`.

---

## 4. 🔤 Formateo Dominicano & Máscaras de Entrada

Ubicación: [masks.ts](file:///c:/Users/Dell/Downloads/ultramoney/utils/masks.ts).

### Máscara de Cédula Dominicana
Formatea cualquier entrada numérica en la estructura oficial `XXX-XXXXXXX-X`:
```typescript
export const maskCedula = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
};
```
Aplicada de manera en vivo en la creación de clientes ([NewClient.tsx](file:///c:/Users/Dell/Downloads/ultramoney/pages/NewClient.tsx)) y en todos los campos de búsqueda por cédula.

---

## 5. 🖥️ Guía de Módulos y Pantallas del Sistema (UI / UX)

### 📊 1. Dashboard Principal (`/`, `Dashboard.tsx`)
- **KPI Cards**: Total Prestado, Total Cobrado, Cartera Pendiente, Total en Mora, Balance de Caja.
- **Gráficos Estadísticos**: Tendencia mensual de ingresos vs desembolsos (Recharts).
- **Accesos Directos**: Registrar Pago, Nueva Solicitud, Registrar Cliente.

### 👤 2. Módulo de Clientes (`/clientes`, `Clients.tsx`, `ClientDetail.tsx`, `NewClient.tsx`)
- **Filtros**: Por nombre, cédula enmascarada o teléfono.
- **Expediente digital**:
  - Foto de perfil del cliente.
  - Cédula, dirección y teléfono.
  - Garante principal y garante solidario.
  - Subida de documentos PDF/Imágenes a InsForge Storage con visor emergente.
  - Historial de créditos pasados y vigentes.

### 📝 3. Solicitud y Creación de Préstamos (`/solicitud`, `LoanRequest.tsx`)
- **Selector de Tipo de Préstamo**:
  - `Amortizado (Cuotas Fijas)`
  - `Solo Intereses (Rédito / Pagaré Abierto)`
- **Fecha de Emisión y Primera Fecha de Pago**: Selector con opción rápido "Hoy".
- **Comportamiento Reactivo**: Si se selecciona Rédito, el input de cantidad de cuotas se oculta automáticamente.
- Resumen interactivo con la cuota estimada antes de registrar.

### 💰 4. Módulo de Cobranza y Pagos (`/pagos`, `Payments.tsx`)
- **Autollenado Automático**: Al seleccionar un préstamo, el campo *Monto a Pagar* se llena inmediatamente con la cuota debida.
- **Botón `[ ⚡ Auto ($X,XXX) ]`**: Recalcula y carga la cuota sugerida o el interés periódico de inmediato.
- **Botón `[ 🏁 Saldar ($X,XXX) ]`**: Carga el saldo total restante para cancelar el préstamo.
- **Barra Lateral de Cobros (`Hoy` vs `Recientes`)**:
  - Alterna entre los cobros del día y las últimas 25 transacciones registradas.
  - **Totalmente cliqueables**: Al hacer clic en cualquier cobro, se despliega el modal del **Recibo de Pago / Comprobante** oficial con opción de imprimir o descargar en PDF.
- **Pestaña Historial**: Búsqueda por cliente o fecha, con opción de reimpresión de comprobantes.

### ⚠️ 5. Monitor de Atrasos & Cobranza (`/atrasos`, `Overdue.tsx`)
- Clasificación de préstamos vencidos por rango de días (1-15 días, 16-30 días, 30+ días).
- Enlace directo de notificación vía WhatsApp con plantilla de cobro pre-redactada.

### 💵 6. Caja y Contabilidad (`/caja`, `/contabilidad`, `Accounting.tsx`, `DeepAccounting.tsx`)
- Control de ingresos, egresos operacionales, pago de nómina y gastos menores.
- Cuadre diario de caja por cajero y estado de resultados.

### 🖨️ 7. Configuración & PWA (`/configuracion`, `Settings.tsx`, `manifest.json`)
- Personalización de datos de la empresa, teléfono y dirección para recibos.
- Configuración para impresoras térmicas de tickets (58mm / 80mm).
- PWA con metadatos completos y logotipos vectoriales de UltraMoney.

---

## 6. 🛠️ Comandos de Desarrollo y Despliegue

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
- **PWA / App Web**: [https://sxwv82iw.insforge.site](https://sxwv82iw.insforge.site)
- **Backend API**: `https://sxwv82iw.us-east.insforge.app`
- **Estado de Producción**: `READY`
