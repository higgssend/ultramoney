-- 1. Ensure all users in auth.users have roleId = 'Admin' in metadata
UPDATE auth.users 
SET metadata = coalesce(metadata, '{}'::jsonb) || '{"roleId": "Admin"}'::jsonb 
WHERE metadata->>'roleId' IS NULL;

-- 2. Create trigger to auto-assign Admin roleId to new users in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_metadata()
RETURNS trigger AS $$
BEGIN
  NEW.metadata = coalesce(NEW.metadata, '{}'::jsonb) || '{"roleId": "Admin"}'::jsonb;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_metadata();

-- 3. Add fallback RLS policies for clients, loans, transactions (allow lender_id = auth.uid())
DO $$
BEGIN
    -- clients
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can insert own clients') THEN
        CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can update own clients') THEN
        CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can delete own clients') THEN
        CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;

    -- loans
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Users can insert own loans') THEN
        CREATE POLICY "Users can insert own loans" ON loans FOR INSERT WITH CHECK (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Users can update own loans') THEN
        CREATE POLICY "Users can update own loans" ON loans FOR UPDATE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Users can delete own loans') THEN
        CREATE POLICY "Users can delete own loans" ON loans FOR DELETE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;

    -- transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can insert own transactions') THEN
        CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can update own transactions') THEN
        CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can delete own transactions') THEN
        CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);
    END IF;
END $$;
