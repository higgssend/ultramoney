import subprocess

stmt = "UPDATE auth.users SET email_verified = true WHERE email_verified IS FALSE;"
cmd = ["npx", "@insforge/cli", "db", "query", stmt]
res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
