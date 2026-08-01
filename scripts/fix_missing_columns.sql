ALTER TABLE loans
ADD COLUMN IF NOT EXISTS "next_payment_date" DATE;
