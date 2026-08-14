-- Migration: Vault Collateral Custody, Physical Seals, and Auction/Liquidation
-- File: migrations/20260814220000_vault-custody.sql

CREATE TABLE IF NOT EXISTS vault_collaterals (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  loan_id TEXT,
  client_id TEXT,
  client_name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'Garantía General',
  title TEXT NOT NULL,
  description TEXT,
  serial_or_ref TEXT,
  appraised_value NUMERIC NOT NULL DEFAULT 0,
  loan_debt_balance NUMERIC NOT NULL DEFAULT 0,
  vault_location TEXT NOT NULL DEFAULT 'Bóveda Principal',
  drawer_or_shelf TEXT,
  seal_number TEXT,
  custody_status TEXT NOT NULL DEFAULT 'En Bóveda / Custodia',
  custodian_name TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exit_date DATE,
  has_original_documents BOOLEAN DEFAULT false,
  documents_list TEXT,
  has_keys BOOLEAN DEFAULT false,
  keys_count INTEGER DEFAULT 0,
  adjudication_date DATE,
  adjudication_notes TEXT,
  auction_min_price NUMERIC DEFAULT 0,
  liquidation_price NUMERIC DEFAULT 0,
  buyer_name TEXT,
  buyer_phone TEXT,
  liquidation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vault_custody_logs (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  collateral_id TEXT NOT NULL,
  movement_type TEXT NOT NULL DEFAULT 'Ingreso a Bóveda',
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  authorized_by TEXT NOT NULL,
  received_by TEXT NOT NULL,
  seal_number TEXT,
  keys_delivered BOOLEAN DEFAULT false,
  documents_delivered BOOLEAN DEFAULT false,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for maximum performance
CREATE INDEX IF NOT EXISTS idx_vault_collaterals_lender ON vault_collaterals(lender_id, custody_status);
CREATE INDEX IF NOT EXISTS idx_vault_collaterals_loan ON vault_collaterals(loan_id);
CREATE INDEX IF NOT EXISTS idx_vault_custody_logs_collateral ON vault_custody_logs(collateral_id, movement_date);
CREATE INDEX IF NOT EXISTS idx_vault_custody_logs_lender ON vault_custody_logs(lender_id);

-- Enable RLS
ALTER TABLE vault_collaterals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_custody_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "vault_collaterals_policy" ON vault_collaterals;
CREATE POLICY "vault_collaterals_policy" ON vault_collaterals
  FOR ALL USING (auth.uid() = lender_id) WITH CHECK (auth.uid() = lender_id);

DROP POLICY IF EXISTS "vault_custody_logs_policy" ON vault_custody_logs;
CREATE POLICY "vault_custody_logs_policy" ON vault_custody_logs
  FOR ALL USING (auth.uid() = lender_id) WITH CHECK (auth.uid() = lender_id);
