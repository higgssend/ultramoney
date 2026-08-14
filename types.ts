export enum LoanStatus {
  PENDING = 'Pendiente',
  ACTIVE = 'Activo',
  PAID = 'Pagado',
  OVERDUE = 'Atrasado',
  REJECTED = 'Rechazado',
  REFINANCED = 'Refinanciado'
}

export type LoanType = 
  | 'Amortizado (Cuota Fija)' 
  | 'Amortizado (Capital Fijo)' 
  | 'Rédito (Solo Interés)' 
  | 'Interés Adelantado' 
  | 'Financiamiento de Equipo (Con/Sin Inicial)'
  | 'Pagaré / Préstamo Abierto'
  | 'Pagaré Abierto'
  | 'Amortización' 
  | 'Rédito';

export type ClosingCostMode = 'Descontado' | 'Financiado' | 'Externo';

export interface Collateral {
  type: 'Teléfono / Celular' | 'Tarjeta de Crédito / Débito' | 'Vehículo' | 'Propiedad' | 'Electrodoméstico' | 'Joya' | 'Otro' | 'Sin Garantía';
  description: string;
  refNumber: string;        // Matrícula, título, serial, IMEI, últimos 4 dígitos
  brand?: string;           // Marca
  model?: string;           // Modelo
  imei2?: string;           // IMEI 2 (Dual SIM)
  condition?: string;       // Estado / Condición
  storage?: string;         // Almacenamiento (128GB, etc.)
  color?: string;           // Color
  defects?: string;         // Defectos o detalles cosméticos
  estimatedValue?: number;  // Valor estimado
  documentIds?: string[];   // IDs de ClientDocument adjuntos
  photoUrls?: string[];     // URLs / fotos / documentos adjuntos a la garantía
  ownerName?: string;       // Nombre del dueño (si es un tercero)

  // Specific for Credit/Debit Card Collateral
  bankName?: string;        // Banreservas, Popular, BHD, Scotia, etc.
  cardType?: string;        // Visa, Mastercard, Amex
  last4?: string;           // Últimos 4 dígitos
  cardHolder?: string;      // Nombre en la tarjeta
  expiryDate?: string;      // Vencimiento MM/AA
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imei2?: string;
  condition?: string;
  color?: string;
  storage?: string;
  cashPrice: number;
  costPrice?: number;
  status: 'Disponible' | 'Financiado' | 'Vendido';
  createdAt?: string;
}

export interface ClientReference {
  id?: string;
  name: string;
  relationship?: string;
  relation?: string;
  phone: string;
  address?: string;
  cedula?: string;
  type?: 'Familiar' | 'Personal' | 'Comercial';
}

export interface Guarantor {
  id: string;
  name: string;
  lastName?: string;
  cedula: string;
  phone: string;
  relationship?: string; // Familiar, Amigo, Cónyuge, Socio, Compañero de Trabajo, Vecino, Otro
  address?: string;
  workplace?: string; // Empresa o negocio
  jobPosition?: string; // Cargo u ocupación
  monthlyIncome?: number; // Ingreso mensual estimado
  photoUrl?: string; // Foto de cédula o documento
  documentType?: 'Cedula' | 'Pasaporte' | 'Licencia' | 'Otro';
  notes?: string;
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
  lat?: number;
  lng?: number;
  documentId?: string;
  

  // Informacion laboral
  companyName?: string;
  jobPosition?: string;
  income: number; // Ingresos mensuales
  seniorityYears?: number;

  // Ruta Lógica
  routeId?: string;
  routeSequence?: number;

  creditScore: number; // 300 - 850 (FICO / Datacrédito scale)
  status: 'Activo' | 'Bloqueado' | 'Al Día';
  email?: string;
  joinedDate: string;
  clientPin?: string; // 4-digit PIN para el portal del cliente
  portalAlias?: string;
  portalActive?: boolean;
  avatarUrl?: string;
  references?: ClientReference[];
  guarantors?: (ClientReference | string)[];
  civilStatus?: string;
  lender_id?: string;
  workplace?: string;
  guarantorName?: string;
  coGuarantorName?: string;
  guarantorCedula?: string;
  guarantorPhone?: string;
  coGuarantorCedula?: string;
  coGuarantorPhone?: string;
}

export interface BankAccount {
  id: string;
  clientId?: string;
  bankName: string;
  accountType: 'Ahorro' | 'Ahorros' | 'Corriente' | 'Empresarial' | 'Nómina' | 'Caja Chica / Efectivo' | 'Inversión' | 'Otro';
  accountNumber: string;
  accountName?: string;
  holderName?: string;
  cedulaOrRnc?: string;
  showInPaymentLink?: boolean;
  bankLogoUrl?: string;
  currency?: 'DOP' | 'USD';
  balance?: number;
  initialBalance?: number;
  isDefault?: boolean;
  isActive?: boolean;
  status?: 'Activa' | 'Inactiva';
  notes?: string;
  createdAt?: string;
}

export interface BankDeposit {
  id: string;
  lenderId?: string;
  bankName: string;
  bankAccountId?: string;
  referenceNumber: string;
  amount: number;
  currency?: 'DOP' | 'USD';
  senderName?: string;
  depositDate: string; // YYYY-MM-DD
  voucherUrl?: string; // photo/screenshot URL
  notes?: string;
  status: 'Pendiente' | 'Conciliado' | 'Rechazado';
  matchedLoanId?: string;
  matchedClientId?: string;
  matchedReceiptId?: string;
  matchedTransactionId?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  createdAt?: string;
}

export interface PaymentLinkConfig {
  title: string;
  instructions: string;
  whatsappPhone: string;
  showCompanyLogo: boolean;
  showCompanyRnc: boolean;
  customNote: string;
  customSlug?: string;
  selectedAccountIds: string[];
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

  // Financiamiento de Equipos / Bienes (Con/Sin Inicial)
  itemPrice?: number;
  downPayment?: number;
  downPaymentMode?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque';
  downPaymentPercentage?: number;
  financedAmount?: number;

  // Closing Costs
  closingCost?: number;
  closingCostMode?: ClosingCostMode;

  totalToPay: number;
  lateFeePercentage?: number;
  graceDays?: number;
  remainingBalance: number;
  installmentAmount?: number;
  nextPaymentDate: string;
  // Garantía & Garantes Solidarios
  collateral?: Collateral;
  collateralType?: string;
  collateralDescription?: string;
  collateralRef?: string;
  collateralref?: string;
  collateralRefNumber?: string;
  collaterals?: Collateral[] | unknown[];
  clientCedula?: string;
  clientPhone?: string;
  clientAddress?: string;
  firstPaymentDate?: string;
  netDisbursementAmount?: number;
  totalPaid?: number;
  clientname?: string;
  remainingbalance?: number;
  nextpaymentdate?: string;
  guarantors?: Guarantor[]; // Hasta 2 garantes o codeudores solidarios
  guarantor?: Guarantor;    // Retrocompatibilidad para garante principal
  guarantorId?: string;
  note?: string;
  currency?: 'DOP' | 'USD';
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

  // Financiamiento de Equipos / Bienes (Con/Sin Inicial)
  itemPrice?: number;
  downPayment?: number;
  downPaymentMode?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque';
  downPaymentPercentage?: number;
  financedAmount?: number;

  closingCost?: number;
  closingCostMode?: ClosingCostMode;
  paymentDay?: number;
  requestDate: string;
  status: 'Pendiente' | 'Pending' | 'En evaluación' | 'Aprobado' | 'Rechazado' | 'Cancelado';
  collateral?: Collateral;
  guarantors?: (ClientReference | string | Guarantor)[];
  loanDestination?: string;
  purpose?: string;
  notes?: string;
  observations?: string;
  lateFeePercentage?: number;
  graceDays?: number;

  // Merchant Partner / BNPL In-Store POS fields
  merchantId?: string;
  merchantName?: string;
  productDescription?: string;
  merchantInvoiceNumber?: string;
  merchantPayoutStatus?: 'Pendiente' | 'Transferido' | 'Liquidado';
  merchantPayoutDate?: string;
  buyerCedula?: string;
  buyerIdPhotoFront?: string;
  buyerIdPhotoBack?: string;
  productInvoicePhoto?: string;
}

export interface MerchantPartner {
  id: string;
  lenderId: string;
  name: string;
  rncOrCedula?: string;
  category: 'Mueblería' | 'Celulares & Tecnología' | 'Taller & Repuestos' | 'Electrodomésticos' | 'Ferretería' | 'Salud & Clínica' | 'Otro';
  contactName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  commissionPercent: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountType?: 'Corriente' | 'Ahorro';
  bankHolderName?: string;
  portalSlug: string;
  pinCode: string;
  status: 'Activo' | 'Inactivo';
  logoUrl?: string;
  totalFinanced: number;
  totalApplications: number;
  createdAt: string;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque';

export function formatLoanId(id?: string | null, _category?: string, _type?: string): string {
  if (!id) return '000000';
  const cleanId = id.replace(/^No\.\s*/i, '');
  const digits = cleanId.replace(/\D/g, '');
  if (digits.length >= 1) {
    const num = parseInt(digits.slice(-6), 10) || 1;
    return String(num).padStart(6, '0');
  }
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = (hash << 5) - hash + cleanId.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 999999) + 1;
  return String(num).padStart(6, '0');
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

export function formatContractId(id?: string | null): string {
  if (!id) return 'CTR-00000000';
  if (id.startsWith('CTR-')) return id;
  return `CTR-${formatLoanId(id)}`;
}



export interface CustomPaymentMethod {
  id: string;
  name: string;
  category: 'Efectivo' | 'Transferencia' | 'POS / Verifone' | 'Pasarela Digital' | 'Cheque' | 'Cripto' | 'Otro';
  description?: string;
  requiresReference?: boolean;
  isActive: boolean;
  isDefault?: boolean;
  createdAt?: string;
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
  paymentType?: 'Interes' | 'Capital' | 'Mixto' | 'Mora' | 'Cierre' | 'Otro';
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  proofUrl?: string;
  currency?: 'DOP' | 'USD';
  note?: string;
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
  permissions?: string[];
  createdAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  role?: string;
  cargoId?: string;
  phone?: string;
  assignedRoute?: string;
  performance: number;
  activeRoutes: number;
  collections: number;
  username?: string;
  employeePin?: string;
  sucursalId?: string;
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
  ncf?: string;
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
  lastName?: string;
  email?: string;
  username?: string;
  password?: string;
  roleId?: string;
  roleIds?: string[];
  employeeId?: string;
  isEmployee?: boolean;
  employeeData?: unknown;
  avatarUrl?: string;
  status: 'Active' | 'Inactive' | 'Activo' | 'Inactivo';
  lastLogin?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    roleId?: string;
    phone?: string;
    cedula?: string;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  api_key?: string;
  createdAt: string;
  lastUsed?: string;
}

export interface CollectorVisit {
  id: string;
  collectorId: string;
  collectorName?: string;
  clientId: string;
  clientName?: string;
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
  companyName?: string;
  slogan?: string;
  rnc: string;
  address: string;
  phone: string;
  logoUrl?: string;
  logourl?: string;
  email: string;
  currency: 'DOP' | 'USD';
  termsAndConditions: string;
  customLink?: string; // e.g. mi-empresa
  defaultLateFeePercent?: number;
  numberSeries?: NumberSeriesSettings;
  lockedUntilDate?: string; // e.g. '2026-06-30'
}

export interface AccountingPeriod {
  id: string;
  lenderId: string;
  periodType: 'Mensual' | 'Anual';
  year: number;
  month?: number; // 1-12 or undefined for annual
  startDate: string;
  endDate: string;
  status: 'Cerrado' | 'Abierto';
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  closingEntryId?: string;
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  notes?: string;
  createdAt: string;
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
  description?: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestType: 'Fijo' | 'Simple' | 'Compuesto';
  frequency: 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';
  termMonths?: number;
  defaultInstallments?: number;
  requiresCollateral?: boolean;
  collateralType?: string;
  disbursementFee?: number;
  lateFeePercentage?: number;
  graceDays?: number;
  prepaymentAllowed?: boolean;
  autoCalculateInterest?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Advanced Financial Engine Fields
  amortizationMethod?: 'Amortizado' | 'Flat' | 'DecliningBalance' | 'Open' | 'Bullet' | 'Maturity' | 'CreditLine';
  paymentOrder?: 'Mora_Expenses_Interest_Capital' | 'Interest_Capital_Mora_Expenses';
  recalculateInterestOnEarlyPayoff?: boolean;
  capitalizationFrequency?: 'Diario' | 'Mensual' | 'Ninguno';
}


export interface PdfJob {
    id: string;
    type: 'contrato' | 'pagare' | 'recibo';
    client: Client;
    loan?: Loan;
    transaction?: Transaction;
    cashierName?: string;
}
