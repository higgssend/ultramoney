-- Migration: Partner Merchants and POS In-Store Financing
CREATE TABLE IF NOT EXISTS merchant_partners (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  name TEXT NOT NULL,
  rnc_or_cedula TEXT,
  category TEXT NOT NULL DEFAULT 'Otro', -- 'Mueblería' | 'Celulares & Tecnología' | 'Taller & Repuestos' | 'Electrodomésticos' | 'Ferretería' | 'Salud & Clínica' | 'Otro'
  contact_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  commission_percent NUMERIC DEFAULT 0,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_type TEXT DEFAULT 'Corriente',
  bank_holder_name TEXT,
  portal_slug TEXT NOT NULL,
  pin_code TEXT NOT NULL DEFAULT '1234',
  status TEXT NOT NULL DEFAULT 'Activo',
  logo_url TEXT,
  total_financed NUMERIC DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE merchant_partners ENABLE ROW LEVEL SECURITY;

-- RLS Policy for Lenders & Public POS
DROP POLICY IF EXISTS "Lenders manage their merchant partners" ON merchant_partners;
CREATE POLICY "Lenders manage their merchant partners"
  ON merchant_partners
  FOR ALL
  USING (lender_id = auth.uid() OR auth.uid() IS NULL);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_merchants_lender ON merchant_partners(lender_id, status);
CREATE INDEX IF NOT EXISTS idx_merchants_slug ON merchant_partners(portal_slug);

-- Add merchant columns to loan_requests
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS merchant_id TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS merchant_invoice_number TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS merchant_payout_status TEXT DEFAULT 'Pendiente';
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS merchant_payout_date DATE;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS buyer_cedula TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS buyer_id_photo_front TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS buyer_id_photo_back TEXT;
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS product_invoice_photo TEXT;
