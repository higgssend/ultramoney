import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\scripts\apply_rls_policies.sql"

policy_to_add = """

-- 7. API Keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to api keys" ON public.api_keys FOR ALL USING (public.get_user_role() = 'Admin');
CREATE POLICY "Fallback access own api keys" ON public.api_keys FOR ALL USING (lender_id = auth.uid());
"""

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "api_keys ENABLE ROW LEVEL SECURITY" not in content:
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(policy_to_add)
    print("Added api_keys RLS policy to apply_rls_policies.sql")
else:
    print("api_keys policy already exists.")
