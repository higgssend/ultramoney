-- Migration: Add balance and detailed financial breakdown columns to transactions table
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS previous_balance NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS new_balance NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_debt NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS capital_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2);
