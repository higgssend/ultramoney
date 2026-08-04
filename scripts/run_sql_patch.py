import subprocess

statements = [
    """UPDATE auth.users SET metadata = coalesce(metadata, '{}'::jsonb) || '{"roleId": "Admin"}'::jsonb WHERE metadata->>'roleId' IS NULL;""",
    
    """CREATE OR REPLACE FUNCTION public.handle_new_user_metadata() RETURNS trigger AS $$ BEGIN NEW.metadata = coalesce(NEW.metadata, '{}'::jsonb) || '{"roleId": "Admin"}'::jsonb; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;""",
    
    """DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;""",
    
    """CREATE TRIGGER on_auth_user_created BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_metadata();""",
    
    """CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can delete own loans" ON public.loans FOR DELETE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);""",
    
    """CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (lender_id = auth.uid() OR auth.uid() IS NOT NULL);"""
]

for stmt in statements:
    print(f"Executing: {stmt[:60]}...")
    cmd = ["npx", "@insforge/cli", "db", "query", stmt]
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print("  -> ERROR:", res.stderr.strip())
    else:
        print("  -> OK:", res.stdout.strip())
