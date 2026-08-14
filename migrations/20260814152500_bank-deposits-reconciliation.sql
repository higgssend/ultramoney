-- ============================================================================
-- Migration: Bank Reconciliation and Pending Deposits Module
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_account_id TEXT,
  reference_number TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'DOP',
  sender_name TEXT,
  deposit_date TEXT NOT NULL,
  voucher_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Conciliado', 'Rechazado')),
  matched_loan_id TEXT,
  matched_client_id TEXT,
  matched_receipt_id TEXT,
  matched_transaction_id TEXT,
  reconciled_at TIMESTAMPTZ,
  reconciled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bank_deposits ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists then recreate
DROP POLICY IF EXISTS "Prestamistas gestionan sus propios depositos bancarios" ON bank_deposits;
CREATE POLICY "Prestamistas gestionan sus propios depositos bancarios"
ON bank_deposits FOR ALL TO authenticated
USING (auth.uid() = lender_id)
WITH CHECK (auth.uid() = lender_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bank_deposits_lender ON bank_deposits(lender_id);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_status ON bank_deposits(status);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_reference ON bank_deposits(reference_number);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_matched_loan ON bank_deposits(matched_loan_id);
