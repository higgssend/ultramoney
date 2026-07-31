import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Accounting.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: Add state
if "showSystemSummary" not in content[:2000]:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState<'overview' | 'shift' | 'expense'>('overview');",
        "const [activeTab, setActiveTab] = useState<'overview' | 'shift' | 'expense'>('overview');\n  const [showSystemSummary, setShowSystemSummary] = useState(false);"
    )

# Fix 2: Add imports
if "EyeOff" not in content[:1000]:
    content = content.replace(
        "PlusCircle } from 'lucide-react';",
        "PlusCircle, Eye, EyeOff } from 'lucide-react';"
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Accounting.tsx fixed!")
