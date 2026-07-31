-- UltraMoney RLS Policies Update

-- Helper function to get roleId from user metadata
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'roleId', '');
END;
$$ LANGUAGE plpgsql STABLE;

-- Drop old strict policies if they exist (to replace with role-based ones)
DO $$ 
DECLARE 
  t text;
  pol record;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- 1. CLients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to clients" ON public.clients FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Employees can view clients" ON public.clients FOR SELECT USING (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can create clients" ON public.clients FOR INSERT WITH CHECK (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can update clients" ON public.clients FOR UPDATE USING (public.get_user_role() = 'Employee');

-- 2. Loans
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to loans" ON public.loans FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Employees can view loans" ON public.loans FOR SELECT USING (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can create loans" ON public.loans FOR INSERT WITH CHECK (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can update loans" ON public.loans FOR UPDATE USING (public.get_user_role() = 'Employee');

-- 3. Transactions (Payments)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to transactions" ON public.transactions FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Employees can view transactions" ON public.transactions FOR SELECT USING (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can insert transactions" ON public.transactions FOR INSERT WITH CHECK (public.get_user_role() = 'Employee');
-- Employees CANNOT delete or update transactions!

-- 4. Cash Shifts
ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to cash shifts" ON public.cash_shifts FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Employees can view cash shifts" ON public.cash_shifts FOR SELECT USING (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can create cash shifts" ON public.cash_shifts FOR INSERT WITH CHECK (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can update cash shifts" ON public.cash_shifts FOR UPDATE USING (public.get_user_role() = 'Employee');

-- 5. Loan Requests
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to loan requests" ON public.loan_requests FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Employees can view loan requests" ON public.loan_requests FOR SELECT USING (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can insert loan requests" ON public.loan_requests FOR INSERT WITH CHECK (public.get_user_role() = 'Employee');
CREATE POLICY "Employees can update loan requests" ON public.loan_requests FOR UPDATE USING (public.get_user_role() = 'Employee');

-- 6. System Settings & Roles
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to settings" ON public.company_settings FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Employees can view settings" ON public.company_settings FOR SELECT USING (public.get_user_role() = 'Employee');

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to roles" ON public.roles FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Employees can view roles" ON public.roles FOR SELECT USING (public.get_user_role() = 'Employee');

-- If no roleId is found, fallback to lender_id check for backward compatibility or let them see their own data
CREATE POLICY "Fallback read own data" ON public.clients FOR SELECT USING (lender_id = auth.uid());
CREATE POLICY "Fallback read own loans" ON public.loans FOR SELECT USING (lender_id = auth.uid());
CREATE POLICY "Fallback read own transactions" ON public.transactions FOR SELECT USING (lender_id = auth.uid());


-- 7. API Keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to api keys" ON public.api_keys FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Fallback access own api keys" ON public.api_keys FOR ALL USING (lender_id = auth.uid());
