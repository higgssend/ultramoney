-- Migration to support Mortgage / Hipotecario Loans & Loan Category
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS loancategory TEXT DEFAULT 'Personal';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS loan_category TEXT DEFAULT 'Personal';

ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS loancategory TEXT DEFAULT 'Personal';
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS loan_category TEXT DEFAULT 'Personal';
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS collateral JSONB;
