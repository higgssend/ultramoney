-- Migration: Sync all equipment financing, pricing margin, laptop/PC/tablet fields and flexible non-null defaults
ALTER TABLE loans 
  ADD COLUMN IF NOT EXISTS cash_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS financed_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS financing_interest_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS financing_margin_percent NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS financing_calc_mode TEXT DEFAULT 'financed_price',
  ADD COLUMN IF NOT EXISTS item_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS down_payment NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS down_payment_mode TEXT,
  ADD COLUMN IF NOT EXISTS financed_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS collateral JSONB,
  ADD COLUMN IF NOT EXISTS guarantors JSONB,
  ADD COLUMN IF NOT EXISTS closing_cost NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_cost_mode TEXT DEFAULT 'Descontado';

ALTER TABLE loan_requests
  ADD COLUMN IF NOT EXISTS cash_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS financed_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS financing_interest_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS financing_margin_percent NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS financing_calc_mode TEXT DEFAULT 'financed_price',
  ADD COLUMN IF NOT EXISTS item_price NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS down_payment NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS down_payment_mode TEXT,
  ADD COLUMN IF NOT EXISTS financed_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS collateral JSONB,
  ADD COLUMN IF NOT EXISTS guarantors JSONB,
  ADD COLUMN IF NOT EXISTS closing_cost NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_cost_mode TEXT DEFAULT 'Descontado';

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS previous_balance NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS new_balance NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_debt NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS capital_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;

-- Inventory table support if not present
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Teléfono / Celular',
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  imei2 TEXT,
  condition TEXT DEFAULT 'Excelente / Como Nuevo',
  color TEXT,
  storage TEXT,
  cash_price NUMERIC(15,2) DEFAULT 0,
  cost_price NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'Disponible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS on inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Users can manage own inventory'
  ) THEN
    CREATE POLICY "Users can manage own inventory" ON inventory
      FOR ALL USING (auth.uid() = lender_id);
  END IF;
END $$;
