-- Migration: Accounting Periods, Period Locking and Fiscal Year Closings
CREATE TABLE IF NOT EXISTS accounting_periods (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  period_type TEXT NOT NULL, -- 'Mensual' | 'Anual'
  year INTEGER NOT NULL,
  month INTEGER, -- 1-12 or NULL for annual closing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Cerrado', -- 'Cerrado' | 'Abierto'
  total_income NUMERIC DEFAULT 0,
  total_expense NUMERIC DEFAULT 0,
  net_income NUMERIC DEFAULT 0,
  closing_entry_id TEXT,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  closed_by TEXT,
  reopened_at TIMESTAMPTZ,
  reopened_by TEXT,
  reopen_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Lenders manage their accounting periods" ON accounting_periods;
CREATE POLICY "Lenders manage their accounting periods"
  ON accounting_periods
  FOR ALL
  USING (lender_id = auth.uid() OR auth.uid() IS NULL);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_accounting_periods_lender ON accounting_periods(lender_id, year, status);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_dates ON accounting_periods(start_date, end_date);

-- Add locked_until_date column to company_settings if missing
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS locked_until_date DATE;
