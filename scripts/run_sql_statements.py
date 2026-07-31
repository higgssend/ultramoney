import subprocess
import json
import time

statements = [
    "DROP POLICY IF EXISTS \"Fallback access own api keys\" ON public.api_keys;",
    "ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;",
    "CREATE POLICY \"Fallback access own api keys\" ON public.api_keys FOR ALL USING (user_id = auth.uid());",
    "CREATE POLICY \"Admins have full access to api keys\" ON public.api_keys FOR ALL USING (public.get_user_role() = 'Admin');"
]

print("Executing SQL statements one by one...")

for sql in statements:
    print(f"Running: {sql}")
    result = subprocess.run(
        ["npx.cmd", "@insforge/cli", "db", "query", sql, "--json", "--unrestricted"],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print("Success!")
    else:
        print("Error!")
        print(result.stderr)
    time.sleep(1)

print("Done!")
