import subprocess
import json

sql = "DROP POLICY IF EXISTS \\\"Fallback access own api keys\\\" ON public.api_keys; ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY; CREATE POLICY \\\"Fallback access own api keys\\\" ON public.api_keys FOR ALL USING (user_id = auth.uid()); CREATE POLICY \\\"Admins have full access to api keys\\\" ON public.api_keys FOR ALL USING (public.get_user_role() = 'Admin');"

print("Executing SQL...")
result = subprocess.run(
    ["npx.cmd", "@insforge/cli", "db", "query", sql, "--json"],
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print("Success!")
    print(result.stdout)
else:
    print("Error!")
    print(result.stderr)
