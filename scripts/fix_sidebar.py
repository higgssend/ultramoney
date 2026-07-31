import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\components\Sidebar.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: Add DollarSign import
if "DollarSign" not in content[:1000]:
    content = content.replace(
        "Edit, Calculator, Moon, Sun, Database, ShieldCheck\n} from 'lucide-react';",
        "Edit, Calculator, Moon, Sun, Database, ShieldCheck, DollarSign\n} from 'lucide-react';"
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Sidebar.tsx fixed!")
