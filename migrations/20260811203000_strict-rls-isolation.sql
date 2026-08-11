-- 1. company_settings
DROP POLICY IF EXISTS "Admins have full access to settings" ON company_settings;
DROP POLICY IF EXISTS "Employees can view settings" ON company_settings;
DROP POLICY IF EXISTS "Public can view company settings by slug" ON company_settings;
DROP POLICY IF EXISTS "Lenders can manage their own settings" ON company_settings;

CREATE POLICY "Lenders can manage their own settings" ON company_settings
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());

-- 2. clients
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Fallback read own data" ON clients;
DROP POLICY IF EXISTS "Employees can update clients" ON clients;
DROP POLICY IF EXISTS "Employees can create clients" ON clients;
DROP POLICY IF EXISTS "Employees can view clients" ON clients;
DROP POLICY IF EXISTS "Admins have full access to clients" ON clients;
DROP POLICY IF EXISTS "Lenders manage own clients" ON clients;

CREATE POLICY "Lenders manage own clients" ON clients
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());

-- 3. loans
DROP POLICY IF EXISTS "Users can delete own loans" ON loans;
DROP POLICY IF EXISTS "Users can update own loans" ON loans;
DROP POLICY IF EXISTS "Users can insert own loans" ON loans;
DROP POLICY IF EXISTS "Fallback read own loans" ON loans;
DROP POLICY IF EXISTS "Employees can update loans" ON loans;
DROP POLICY IF EXISTS "Employees can create loans" ON loans;
DROP POLICY IF EXISTS "Employees can view loans" ON loans;
DROP POLICY IF EXISTS "Admins have full access to loans" ON loans;
DROP POLICY IF EXISTS "Lenders manage own loans" ON loans;

CREATE POLICY "Lenders manage own loans" ON loans
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());

-- 4. transactions
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Fallback read own transactions" ON transactions;
DROP POLICY IF EXISTS "Employees can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Employees can view transactions" ON transactions;
DROP POLICY IF EXISTS "Admins have full access to transactions" ON transactions;
DROP POLICY IF EXISTS "Lenders manage own transactions" ON transactions;

CREATE POLICY "Lenders manage own transactions" ON transactions
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());

-- 5. user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own profile" ON user_profiles;
CREATE POLICY "Users manage own profile" ON user_profiles
  FOR ALL
  TO public
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 6. employees
DROP POLICY IF EXISTS "Lenders manage own employees" ON employees;
CREATE POLICY "Lenders manage own employees" ON employees
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());

-- 7. loan_requests
DROP POLICY IF EXISTS "Employees can update loan requests" ON loan_requests;
DROP POLICY IF EXISTS "Employees can insert loan requests" ON loan_requests;
DROP POLICY IF EXISTS "Employees can view loan requests" ON loan_requests;
DROP POLICY IF EXISTS "Admins have full access to loan requests" ON loan_requests;
DROP POLICY IF EXISTS "Lenders manage own loan requests" ON loan_requests;

CREATE POLICY "Lenders manage own loan requests" ON loan_requests
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());
