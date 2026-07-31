ALTER TABLE loan_products 
ADD COLUMN IF NOT EXISTS amortization_method text DEFAULT 'Amortizado',
ADD COLUMN IF NOT EXISTS payment_order text DEFAULT 'Mora_Expenses_Interest_Capital',
ADD COLUMN IF NOT EXISTS recalculate_interest_on_early_payoff boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS capitalization_frequency text DEFAULT 'Mensual';
