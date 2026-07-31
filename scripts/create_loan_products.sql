-- Table: public.loan_products
-- Description: Stores loan configuration templates (products) to standardize loan creation.

CREATE TABLE IF NOT EXISTS public.loan_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    max_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    
    interest_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
    interest_type TEXT NOT NULL CHECK (interest_type IN ('Fijo', 'Simple', 'Compuesto')),
    
    frequency TEXT NOT NULL CHECK (frequency IN ('Diario', 'Semanal', 'Quincenal', 'Mensual', 'Anual')),
    term_months INTEGER NOT NULL DEFAULT 1,
    default_installments INTEGER NOT NULL DEFAULT 1,
    
    requires_collateral BOOLEAN NOT NULL DEFAULT false,
    collateral_type TEXT,
    
    disbursement_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    late_fee_percentage NUMERIC(10, 4) NOT NULL DEFAULT 0,
    grace_days INTEGER NOT NULL DEFAULT 0,
    
    prepayment_allowed BOOLEAN NOT NULL DEFAULT true,
    auto_calculate_interest BOOLEAN NOT NULL DEFAULT true,
    
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- RLS Policies
ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loan products"
    ON public.loan_products FOR SELECT
    USING (auth.uid() = lender_id);

CREATE POLICY "Users can create their own loan products"
    ON public.loan_products FOR INSERT
    WITH CHECK (auth.uid() = lender_id);

CREATE POLICY "Users can update their own loan products"
    ON public.loan_products FOR UPDATE
    USING (auth.uid() = lender_id);

CREATE POLICY "Users can delete their own loan products"
    ON public.loan_products FOR DELETE
    USING (auth.uid() = lender_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_loan_products_modtime
    BEFORE UPDATE ON public.loan_products
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
