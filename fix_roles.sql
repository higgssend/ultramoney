DROP POLICY IF EXISTS "Admins have full access to roles" ON roles;
DROP POLICY IF EXISTS "Employees can view roles" ON roles;
CREATE POLICY "Enable all for authenticated users on roles" ON roles FOR ALL USING (auth.role() = 'authenticated');
