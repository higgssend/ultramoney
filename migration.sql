-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    assigned_route TEXT,
    performance INTEGER DEFAULT 0,
    active_routes INTEGER DEFAULT 0,
    collections NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own employees" ON public.employees FOR ALL USING (auth.uid() = lender_id);

-- 2. Collector Visits
CREATE TABLE IF NOT EXISTS public.collector_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    collector_id TEXT,
    collector_name TEXT,
    client_id TEXT,
    client_name TEXT,
    loan_id TEXT,
    date TEXT,
    status TEXT,
    promised_date TEXT,
    amount_collected NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.collector_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own collector visits" ON public.collector_visits FOR ALL USING (auth.uid() = lender_id);

-- 3. Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    client_id TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_type TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bank accounts" ON public.bank_accounts FOR ALL USING (auth.uid() = lender_id);

-- 4. Client Notes
CREATE TABLE IF NOT EXISTS public.client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    client_id TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own client notes" ON public.client_notes FOR ALL USING (auth.uid() = lender_id);

-- 5. Client Documents
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    upload_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own client documents" ON public.client_documents FOR ALL USING (auth.uid() = lender_id);

-- 6. Cash Shifts
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    initial_amount NUMERIC NOT NULL,
    expected_amount NUMERIC,
    final_cash_count NUMERIC,
    difference NUMERIC,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cash shifts" ON public.cash_shifts FOR ALL USING (auth.uid() = lender_id);

-- 7. Loan Requests
CREATE TABLE IF NOT EXISTS public.loan_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL,
    duration_weeks INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    loan_type TEXT NOT NULL,
    closing_cost NUMERIC,
    closing_cost_mode TEXT,
    payment_day INTEGER,
    request_date TEXT NOT NULL,
    status TEXT NOT NULL,
    collateral JSONB,
    loan_destination TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own loan requests" ON public.loan_requests FOR ALL USING (auth.uid() = lender_id);

-- Publication for Realtime
-- Adding the new tables to the 'insforge_realtime' publication so we can subscribe to changes
BEGIN;
  DROP PUBLICATION IF EXISTS insforge_realtime;
  CREATE PUBLICATION insforge_realtime FOR TABLE 
    public.clients, 
    public.loans, 
    public.transactions, 
    public.company_settings,
    public.employees,
    public.collector_visits,
    public.bank_accounts,
    public.client_notes,
    public.client_documents,
    public.cash_shifts,
    public.loan_requests;
COMMIT;
