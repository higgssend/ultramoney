-- bank_accounts RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage own bank accounts" ON bank_accounts;
CREATE POLICY "Lenders manage own bank accounts" ON bank_accounts
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());

-- collector_visits RLS
ALTER TABLE collector_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage own collector visits" ON collector_visits;
CREATE POLICY "Lenders manage own collector visits" ON collector_visits
  FOR ALL
  TO public
  USING (lender_id = auth.uid())
  WITH CHECK (lender_id = auth.uid());

-- cash_shifts RLS
DROP POLICY IF EXISTS "Employees can update cash shifts" ON cash_shifts;
DROP POLICY IF EXISTS "Employees can create cash shifts" ON cash_shifts;
DROP POLICY IF EXISTS "Employees can view cash shifts" ON cash_shifts;
DROP POLICY IF EXISTS "Admins have full access to cash shifts" ON cash_shifts;
DROP POLICY IF EXISTS "Lenders manage own cash shifts" ON cash_shifts;

CREATE POLICY "Lenders manage own cash shifts" ON cash_shifts
  FOR ALL
  TO public
  USING (lender_id = auth.uid() OR user_id = auth.uid()::text)
  WITH CHECK (lender_id = auth.uid() OR user_id = auth.uid()::text);
