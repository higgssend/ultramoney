/**
 * types.db.ts
 * Representa exactamente como llegan los datos de la base de datos (snake_case / lowercase).
 * Usado en los mapeos de contexto para eliminar el uso de `any`.
 */

export interface LoanDB {
  id: string;
  clientid: string;
  client_id?: string;
  clientname: string | null;
  client_name?: string | null;
  amount: number;
  interestrate?: number;
  interest_rate?: number;
  duration_weeks?: number;
  durationweeks?: number;
  installments?: number;
  current_installment?: number;
  frequency?: string;
  payment_frequency?: string;
  startdate?: string;
  start_date?: string;
  next_payment_date?: string;
  nextpaymentdate?: string;
  status: string;
  loantype?: string;
  loan_type?: string;
  loancategory?: string;
  loan_category?: string;
  closing_cost?: number;
  closing_cost_mode?: string;
  totaltopay?: number;
  total_to_pay?: number;
  remainingbalance?: number;
  remaining_balance?: number;
  installmentamount?: number;
  installment_amount?: number;
  late_fee_percentage?: number;
  grace_days?: number;
  payment_day?: number;
  lender_id?: string;
  guarantor_id?: string;
  collateralref?: string;
  collateral?: Record<string, unknown>;
  item_price?: number;
  down_payment?: number;
  down_payment_mode?: string;
  financed_amount?: number;
  note?: string;
  currency?: string;
  created_at?: string;
}

export interface ClientDB {
  id: string;
  name: string;
  lastname?: string;
  last_name?: string;
  sex?: string;
  birth_date?: string;
  occupation?: string;
  phone?: string;
  whatsapp?: string;
  phonehome?: string;
  cedula?: string;
  documenttype?: string;
  document_type?: string;
  email?: string;
  address?: string;
  province?: string;
  municipality?: string;
  sector?: string;
  referenceaddress?: string;
  companyname?: string;
  jobposition?: string;
  coordinates?: { lat: number; lng: number } | null;
  routeid?: string;
  routesequence?: number;
  income?: number;
  creditscore?: number;
  credit_score?: number;
  status?: string;
  joineddate?: string;
  clientpin?: string;
  guarantors?: string[];
  clientcode?: string;
  client_code?: string;
  portal_alias?: string;
  portal_active?: boolean;
  avatarurl?: string;
  avatar_url?: string;
  photo_url?: string;
  lender_id?: string;
  currency?: string;
  created_at?: string;
}

export interface ClientNoteDB {
  id: string;
  client_id: string;
  content: string;
  date: string;
  created_by: string;
}

export interface ClientDocumentDB {
  id: string;
  client_id: string;
  title: string;
  type: string;
  file_url: string;
  file_type?: string;
  upload_date: string;
  tags?: string[];
}

export interface RouteDB {
  id: string;
  name: string;
  description?: string;
  collector_id?: string;
  status?: string;
  created_at?: string;
}

export interface TransactionDB {
  id: string;
  type: string;
  category?: string;
  amount: number;
  date: string;
  description: string;
  referenceid?: string;
  reference_id?: string;
  paymenttype?: string;
  payment_type?: string;
  paymentmethod?: string;
  payment_method?: string;
  invoicedate?: string;
  invoice_date?: string;
  bank_account_id?: string;
  proof_url?: string;
  lender_id?: string;
  currency?: string;
  created_at?: string;
}

export interface LoanRequestDB {
  id: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  requested_amount?: number;
  amount?: number;
  requested_term?: number;
  interest_rate?: number;
  duration_weeks?: number;
  frequency?: string;
  loan_type?: string;
  loan_destination?: string;
  closing_cost?: number;
  closing_cost_mode?: string;
  payment_day?: number;
  purpose?: string;
  notes?: string;
  observations?: string;
  collateral?: Record<string, unknown>;
  status: string;
  created_at?: string;
  request_date?: string;
  lender_id?: string;
}

export interface LoanProductDB {
  id: string;
  name: string;
  description?: string;
  min_amount?: number;
  max_amount?: number;
  interest_rate?: number;
  interestrate?: number;
  interest_type?: string;
  frequency?: string;
  payment_frequency?: string;
  term_months?: number;
  default_installments?: number;
  installments?: number;
  requires_collateral?: boolean;
  collateral_type?: string;
  disbursement_fee?: number;
  late_fee_percentage?: number;
  grace_days?: number;
  prepayment_allowed?: boolean;
  auto_calculate_interest?: boolean;
  is_active?: boolean;
  amortization_method?: string;
  payment_order?: string;
  requirements?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CashShiftDB {
  id: string;
  user_id: string;
  user_name: string;
  opened_at: string;
  closed_at?: string;
  currency?: string;
  initial_amount: number;
  expected_amount?: number;
  final_cash_count?: number;
  difference?: number;
  status: string;
  notes?: string;
  lender_id?: string;
}

export interface BankAccountDB {
  id: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  account_type?: string;
  currency?: string;
  status?: string;
  initial_balance?: number;
  client_id?: string;
  holder_name?: string;
  cedula_or_rnc?: string;
  show_in_payment_link?: boolean;
  bank_logo_url?: string;
}

export interface CollectorVisitDB {
  id: string;
  collector_id: string;
  collector_name?: string;
  client_id: string;
  client_name?: string;
  loan_id?: string;
  date: string;
  status: string;
  promised_date?: string;
  amount_collected?: number;
  notes?: string;
  location?: { lat: number; lng: number } | null;
}

export interface UserProfileDB {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  employee_id?: string;
  status?: string;
  avatar_url?: string;
  created_at?: string;
  usuario_roles?: { role_id: string }[];
}

export interface ApiKeyDB {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
}

export interface AuditLogDB {
  id: string;
  user_id?: string;
  user_name?: string | null;
  action?: string | null;
  details?: string | null;
  timestamp: string;
  ip_address?: string;
}

export interface EmployeeDB {
  id: string;
  name: string;
  cargo_id?: string;
  phone?: string;
  assigned_route?: string;
  performance?: number;
  active_routes?: number;
  collections?: number;
  username?: string;
  employee_pin?: string;
}
