export enum LoanStatus {
  PENDING = 'Pendiente',
  ACTIVE = 'Activo',
  PAID = 'Pagado',
  OVERDUE = 'Atrasado',
  REJECTED = 'Rechazado',
  REFINANCED = 'Refinanciado'
}

export type LoanType = 'Amortizado (Cuota Fija)' | 'Amortizado (Capital Fijo)' | 'Rédito (Solo Interés)' | 'Interés Adelantado' | 'Amortización' | 'Rédito';
export type ClosingCostMode = 'Descontado' | 'Financiado' | 'Externo';

export interface Collateral {
  type: 'Vehículo' | 'Propiedad' | 'Electrodoméstico' | 'Joya' | 'Sin Garantía';
  description: string;
  refNumber: string;        // Matrícula, título, serial
  estimatedValue?: number;  // Valor estimado
  documentIds?: string[];   // IDs de ClientDocument adjuntos
  ownerName?: string;       // Nombre del dueño (si es un tercero)
}

export interface ClientReference {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  address?: string;
  type: 'Familiar' | 'Personal' | 'Comercial';
}


export interface Route {
  id: string;
  name: string;
  description?: string;
  collectorId?: string;
  status: 'Activa' | 'Inactiva';
  createdAt: string;
}

export interface Client {
  id: string;
  clientCode?: string;
  name: string;
  lastName?: string;
  sex: 'Masculino' | 'Femenino' | 'Otro';
  birthDate?: string;
  maritalStatus?: 'Soltero/a' | 'Casado/a' | 'Divorciado/a' | 'Viudo/a' | 'Unión Libre';
  occupation: string;
  phone: string; // Celular
  whatsapp?: string; // WhatsApp
  phoneHome?: string; // Teléfono Casa
  cedula: string;
  documentType?: 'Cedula' | 'Pasaporte' | 'Licencia' | 'ID' | 'Otro';
  address: string;
  province?: string;
  municipality?: string;
  sector?: string;
  referenceAddress?: string;
  coordinates?: { lat: number; lng: number }; // Geolocalización
  

  // Informacion laboral
  companyName?: string;
  jobPosition?: string;
  income: number; // Ingresos mensuales
  seniorityYears?: number;

  // Ruta Lógica
  routeId?: string;
  routeSequence?: number;

  creditScore: number; // 0 - 100
  status: 'Activo' | 'Bloqueado' | 'Al Día';
  email?: string;
  joinedDate: string;
  clientPin?: string; // 4-digit PIN para el portal del cliente
  portalAlias?: string;
  portalActive?: boolean;
  avatarUrl?: string;
  references?: ClientReference[];
  guarantors?: any[];
}

export interface BankAccount {
  id: string;
  clientId?: string;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  accountType: 'Ahorro' | 'Corriente';
  holderName?: string;
  currency?: 'DOP' | 'USD';
  status?: 'Activa' | 'Inactiva';
  initialBalance?: number;
}

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  date: string;
  createdBy: string;
}

export interface ClientDocument {
  id: string;
  clientId: string;
  title: string; // e.g., "Cédula Frontal", "Contrato Firmado"
  type: 'Cedula' | 'Contrato' | 'Garantia' | 'Comprobante' | 'Fotografia' | 'Otro';
  fileUrl: string; // URL o DataURI
  fileType: string; // mime type e.g., 'image/jpeg', 'application/pdf'
  uploadDate: string;
  tags?: string[];
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  amount: number; // Capital Inicial
  interestRate: number; // Percentage (e.g., 10 for 10%)
  durationWeeks?: number;
  installments?: number;
  currentInstallment?: number;
  frequency: 'Semanal' | 'Quincenal' | 'Mensual' | 'Diario';
  paymentFrequency?: 'Semanal' | 'Quincenal' | 'Mensual' | 'Diario';
  startDate: string;
  status: LoanStatus;
  loanType: LoanType;
  loanCategory?: 'Personal' | 'Comercial' | 'Microcrédito' | 'Préstamo Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Con Garantía' | 'Hipotecario' | 'Vehículo' | 'Refinanciamiento';
  
  // Specific for Monthly loans
  paymentDay?: number; // 1-31

  // Closing Costs
  closingCost?: number;
  closingCostMode?: ClosingCostMode;

  totalToPay: number;
  lateFeePercentage?: number;
  graceDays?: number;
  remainingBalance: number;
  installmentAmount?: number;
  nextPaymentDate: string;
  // Garantía
  collateral?: Collateral;
  guarantorId?: string;
  note?: string;
}

export interface LoanRequest {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  currency?: 'DOP' | 'USD';
  amount?: number;
  requestedAmount?: number;
  requestedTerm?: number;
  interestRate?: number;
  durationWeeks?: number;
  frequency?: 'Semanal' | 'Quincenal' | 'Mensual' | 'Diario';
  loanType?: LoanType;
  closingCost?: number;
  closingCostMode?: ClosingCostMode;
  paymentDay?: number;
  requestDate: string;
  status: 'Pendiente' | 'Pending' | 'En evaluación' | 'Aprobado' | 'Rechazado' | 'Cancelado';
  collateral?: Collateral;
  loanDestination?: string;
  purpose?: string;
  notes?: string;
  observations?: string;
  lateFeePercentage?: number;
  graceDays?: number;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque';

export function formatLoanId(id?: string | null): string {
  if (!id) return 'No. 000000';
  if (id.startsWith('No. ')) return id;
  const digits = id.replace(/\D/g, '');
  if (digits.length >= 1) {
    const num = parseInt(digits.slice(-6), 10) || 1;
    return `No. ${String(num).padStart(6, '0')}`;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 999999) + 1;
  return `No. ${String(num).padStart(6, '0')}`;
}

export function formatReceiptId(id?: string | null): string {
  if (!id) return 'No. 000000';
  if (id.startsWith('No. ')) return id;
  const clean = id.replace(/^REC-/i, '');
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 1) {
    const num = parseInt(digits.slice(-6), 10) || 1;
    return `No. ${String(num).padStart(6, '0')}`;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 999999) + 1;
  return `No. ${String(num).padStart(6, '0')}`;
}

export interface Transaction {
  id: string;
  type: 'Ingreso' | 'Gasto';
  category: 'Pago Préstamo' | 'Desembolso' | 'Operativo' | 'Nómina' | 'Capital' | 'Cierre' | 'Combustible' | 'Papelería' | 'Servicios' | 'Mantenimiento' | 'Otro';
  amount: number;
  date: string;
  invoiceDate?: string;
  description: string;
  referenceId?: string; // ID of loan or client related
  paymentType?: 'Interes' | 'Capital' | 'Mixto';
  paymentMethod?: PaymentMethod;
}

export interface CashShift {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  currency?: 'DOP' | 'USD';
  initialAmount: number;
  expectedAmount?: number;
  finalCashCount?: number;
  difference?: number;
  status: 'Abierta' | 'Cerrada';
  notes?: string;
}

export interface CashReconciliation {
  bills2000: number;
  bills1000: number;
  bills500: number;
  bills200: number;
  bills100: number;
  bills50: number;
  coins25: number;
  coins10: number;
  coins5: number;
  total: number;
}

export interface Cargo {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  cargoId?: string; // Replaces role
  phone?: string;
  assignedRoute?: string;
  performance: number;
  activeRoutes: number;
  collections: number;
  username?: string;
  employeePin?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  date: string;
  reference: string;
  clientName: string;
  status: 'Emitida' | 'Anulada' | 'Completada';
  paymentStatus: 'Pagado' | 'Pendiente' | 'Parcial';
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  totalPaid: number;
  totalPending: number;
  seller: string;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  warrantyInfo: string;
}

// --- Auth & Settings Types ---

export type Permission = 'manage_loans' | 'manage_clients' | 'manage_users' | 'view_reports' | 'manage_settings' | 'approve_loans' | 'manage_cash';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  password?: string;
  roleIds?: string[];
  employeeId?: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive';
  lastLogin?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export interface CollectorVisit {
  id: string;
  collectorId: string;
  collectorName: string;
  clientId: string;
  clientName: string;
  loanId?: string;
  date: string;
  status: 'Cobrado' | 'Ausente' | 'Promesa de Pago' | 'No Pagó';
  promisedDate?: string;
  amountCollected?: number;
  notes?: string;
  coordinates?: { lat: number; lng: number };
  location?: { lat: number; lng: number };
}

export interface NumberSeriesSettings {
  contractPrefix: string;
  receiptPrefix: string;
  invoicePrefix: string;
  nextContractNumber: number;
  nextReceiptNumber: number;
  nextInvoiceNumber: number;
}

export interface CompanySettings {
  name: string;
  slogan?: string;
  rnc: string;
  address: string;
  phone: string;
  logoUrl?: string;
  email: string;
  currency: 'DOP' | 'USD';
  termsAndConditions: string;
  customLink?: string; // e.g. mi-empresa
  defaultLateFeePercent?: number;
  numberSeries?: NumberSeriesSettings;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestType: 'Fijo' | 'Simple' | 'Compuesto';
  frequency: 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';
  termMonths: number;
  defaultInstallments: number;
  requiresCollateral: boolean;
  collateralType?: string;
  disbursementFee: number;
  lateFeePercentage: number;
  graceDays: number;
  prepaymentAllowed: boolean;
  autoCalculateInterest: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Advanced Financial Engine Fields
  amortizationMethod: 'Amortizado' | 'Flat' | 'DecliningBalance' | 'Open' | 'Bullet' | 'Maturity' | 'CreditLine';
  paymentOrder: 'Mora_Expenses_Interest_Capital' | 'Interest_Capital_Mora_Expenses';
  recalculateInterestOnEarlyPayoff: boolean;
  capitalizationFrequency: 'Diario' | 'Mensual' | 'Ninguno';
}


export interface PdfJob {
    id: string;
    type: 'contrato' | 'pagare' | 'recibo';
    client: Client;
    loan?: Loan;
    transaction?: Transaction;
    cashierName?: string;
}
