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
  guarantors?: Record<string, unknown>[] | unknown;
  guarantor?: Record<string, unknown> | unknown;
  collateralref?: string;
  collateral?: Record<string, unknown>;
  item_price?: number;
  down_payment?: number;
  down_payment_mode?: string;
  financed_amount?: number;
  note?: string;
  currency?: string;
  is_in_legal_collection?: boolean;
  legal_case_id?: string;
  legal_fees_added?: number;
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
  name?: string;
  type: string;
  file_url: string;
  url?: string;
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
  item_price?: number;
  down_payment?: number;
  financed_amount?: number;
  down_payment_mode?: string;
  loan_category?: string;
  merchant_id?: string;
  merchant_name?: string;
  product_description?: string;
  merchant_invoice_number?: string;
  merchant_payout_status?: string;
  merchant_payout_date?: string;
  buyer_cedula?: string;
  buyer_id_photo_front?: string;
  buyer_id_photo_back?: string;
  product_invoice_photo?: string;
}

export interface MerchantPartnerDB {
  id: string;
  lender_id: string;
  name: string;
  rnc_or_cedula?: string | null;
  category: string;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  commission_percent?: number;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_type?: string | null;
  bank_holder_name?: string | null;
  portal_slug: string;
  pin_code: string;
  status: string;
  logo_url?: string | null;
  total_financed?: number;
  total_applications?: number;
  created_at?: string;
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
  bankname?: string;
  account_name?: string;
  accountname?: string;
  account_number?: string;
  accountnumber?: string;
  account_type?: string;
  accounttype?: string;
  currency?: string;
  status?: string;
  initial_balance?: number;
  initialbalance?: number;
  balance?: number;
  client_id?: string;
  holder_name?: string;
  holdername?: string;
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

export interface BankDepositDB {
  id: string;
  lender_id: string;
  bank_name: string;
  bank_account_id?: string | null;
  reference_number: string;
  amount: number;
  currency?: string | null;
  sender_name?: string | null;
  deposit_date: string;
  voucher_url?: string | null;
  notes?: string | null;
  status: string;
  matched_loan_id?: string | null;
  matched_client_id?: string | null;
  matched_receipt_id?: string | null;
  matched_transaction_id?: string | null;
  reconciled_at?: string | null;
  reconciled_by?: string | null;
  created_at?: string | null;
}

export interface InventoryItemDB {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  imei2?: string;
  condition?: string;
  color?: string;
  storage?: string;
  cash_price?: number;
  cost_price?: number;
  status?: string;
  lender_id?: string;
  created_at?: string;
}

export interface NotificationDB {
  id: string;
  lender_id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  link?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AccountingPeriodDB {
  id: string;
  lender_id: string;
  period_type: string;
  year: number;
  month?: number | null;
  start_date: string;
  end_date: string;
  status: string;
  total_income?: number;
  total_expense?: number;
  net_income?: number;
  closing_entry_id?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  reopened_at?: string | null;
  reopened_by?: string | null;
  reopen_reason?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface CompanySettingsDB {
  id?: string;
  lender_id?: string;
  name?: string;
  logourl?: string;
  logo_url?: string;
  phone?: string;
  currency?: string;
  locked_until_date?: string | null;
}

export interface LegalLawyerDB {
  id: string;
  lender_id: string;
  name: string;
  firm_name?: string | null;
  rnc_or_cedula?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  fee_percentage?: number;
  fixed_fee?: number;
  status: string;
  created_at?: string;
}

export interface LegalCaseDB {
  id: string;
  lender_id: string;
  loan_id: string;
  client_id: string;
  client_name: string;
  expediente_number: string;
  court_jurisdiction?: string | null;
  lawyer_id?: string | null;
  lawyer_name?: string | null;
  lawyer_firm?: string | null;
  stage: string;
  status: string;
  initial_debt: number;
  legal_fees?: number;
  court_costs?: number;
  total_legal_debt: number;
  recovered_amount?: number;
  start_date: string;
  closed_date?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface LegalEventDB {
  id: string;
  lender_id: string;
  case_id: string;
  event_type: string;
  title: string;
  description?: string | null;
  event_date: string;
  cost?: number;
  add_to_debt?: boolean;
  notary_or_bailiff_name?: string | null;
  document_number?: string | null;
  document_url?: string | null;
  status?: string;
  created_at?: string;
}

export interface LegalAgreementDB {
  id: string;
  lender_id: string;
  case_id: string;
  loan_id: string;
  client_id: string;
  agreement_date: string;
  agreed_total: number;
  down_payment?: number;
  installments_count: number;
  installment_amount: number;
  frequency: string;
  homologated_by_court?: boolean;
  court_reference?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
}

export interface VaultCollateralDB {
  id: string;
  lender_id: string;
  loan_id?: string | null;
  client_id?: string | null;
  client_name: string;
  item_type: string;
  title: string;
  description?: string | null;
  serial_or_ref?: string | null;
  appraised_value: number;
  loan_debt_balance: number;
  vault_location: string;
  drawer_or_shelf?: string | null;
  seal_number?: string | null;
  custody_status: string;
  custodian_name?: string | null;
  entry_date: string;
  exit_date?: string | null;
  has_original_documents?: boolean;
  documents_list?: string | null;
  has_keys?: boolean;
  keys_count?: number;
  adjudication_date?: string | null;
  adjudication_notes?: string | null;
  auction_min_price?: number;
  liquidation_price?: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  liquidation_date?: string | null;
  created_at?: string;
}

export interface VaultCustodyLogDB {
  id: string;
  lender_id: string;
  collateral_id: string;
  movement_type: string;
  movement_date: string;
  authorized_by: string;
  received_by: string;
  seal_number?: string | null;
  keys_delivered?: boolean;
  documents_delivered?: boolean;
  reason?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface ClientRelationshipDB {
  id: string;
  lender_id: string;
  client_id_a: string;
  client_name_a: string;
  client_id_b: string;
  client_name_b: string;
  relationship_type: string;
  notes?: string | null;
  created_at?: string;
}




