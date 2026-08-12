-- Migration for Equipment & Item Financing (Con / Sin Inicial)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS item_price NUMERIC(15,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS down_payment NUMERIC(15,2) DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS down_payment_mode TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS financed_amount NUMERIC(15,2);
