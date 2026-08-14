-- Migration for Inventory / Stock & Credit Card Collateral
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lenders can manage their inventory" ON inventory;
CREATE POLICY "Lenders can manage their inventory" ON inventory
  FOR ALL USING (auth.uid() = lender_id);
