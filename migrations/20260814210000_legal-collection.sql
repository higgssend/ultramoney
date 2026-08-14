-- 20260814210000_legal-collection.sql
-- Expediente de Cobranza Legal, Gestión de Abogados, Gastos Judiciales y Bitácora Procesal

-- 1. Tabla de Abogados y Firmas Legales Aliadas
CREATE TABLE IF NOT EXISTS legal_lawyers (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  name TEXT NOT NULL,
  firm_name TEXT,
  rnc_or_cedula TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  fee_percentage NUMERIC DEFAULT 15,
  fixed_fee NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_lawyers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage legal lawyers" ON legal_lawyers;
CREATE POLICY "Lenders manage legal lawyers" ON legal_lawyers FOR ALL USING (lender_id = auth.uid() OR auth.uid() IS NULL);
CREATE INDEX IF NOT EXISTS idx_legal_lawyers_lender ON legal_lawyers(lender_id, status);

-- 2. Tabla de Expedientes de Cobro Legal
CREATE TABLE IF NOT EXISTS legal_cases (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  loan_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  expediente_number TEXT NOT NULL,
  court_jurisdiction TEXT,
  lawyer_id TEXT,
  lawyer_name TEXT,
  lawyer_firm TEXT,
  stage TEXT NOT NULL DEFAULT 'Intimación Extrajudicial',
  status TEXT NOT NULL DEFAULT 'En Trámite',
  initial_debt NUMERIC NOT NULL DEFAULT 0,
  legal_fees NUMERIC DEFAULT 0,
  court_costs NUMERIC DEFAULT 0,
  total_legal_debt NUMERIC NOT NULL DEFAULT 0,
  recovered_amount NUMERIC DEFAULT 0,
  start_date DATE NOT NULL,
  closed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage legal cases" ON legal_cases;
CREATE POLICY "Lenders manage legal cases" ON legal_cases FOR ALL USING (lender_id = auth.uid() OR auth.uid() IS NULL);
CREATE INDEX IF NOT EXISTS idx_legal_cases_lender ON legal_cases(lender_id, status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_loan ON legal_cases(loan_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_client ON legal_cases(client_id);

-- 3. Tabla de Bitácora Procesal (Eventos, Notificaciones, Actos de Alguacil, Audiencias)
CREATE TABLE IF NOT EXISTS legal_events (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  case_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Acto de Alguacil',
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  cost NUMERIC DEFAULT 0,
  add_to_debt BOOLEAN DEFAULT true,
  notary_or_bailiff_name TEXT,
  document_number TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'Completado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage legal events" ON legal_events;
CREATE POLICY "Lenders manage legal events" ON legal_events FOR ALL USING (lender_id = auth.uid() OR auth.uid() IS NULL);
CREATE INDEX IF NOT EXISTS idx_legal_events_case ON legal_events(case_id, event_date);

-- 4. Tabla de Acuerdos de Pago Homologados
CREATE TABLE IF NOT EXISTS legal_agreements (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  case_id TEXT NOT NULL,
  loan_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  agreement_date DATE NOT NULL,
  agreed_total NUMERIC NOT NULL,
  down_payment NUMERIC DEFAULT 0,
  installments_count INTEGER NOT NULL,
  installment_amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Quincenal',
  homologated_by_court BOOLEAN DEFAULT false,
  court_reference TEXT,
  status TEXT NOT NULL DEFAULT 'Cumpliendo',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage legal agreements" ON legal_agreements;
CREATE POLICY "Lenders manage legal agreements" ON legal_agreements FOR ALL USING (lender_id = auth.uid() OR auth.uid() IS NULL);
CREATE INDEX IF NOT EXISTS idx_legal_agreements_case ON legal_agreements(case_id);

-- 5. Agregar campos opcionales en tabla loans
ALTER TABLE loans ADD COLUMN IF NOT EXISTS is_in_legal_collection BOOLEAN DEFAULT false;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS legal_case_id TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS legal_fees_added NUMERIC DEFAULT 0;
