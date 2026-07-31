import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Payments.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add useToast to imports
if "useToast" not in content:
    content = content.replace("import { useLocation, useNavigate } from 'react-router-dom';", "import { useLocation, useNavigate } from 'react-router-dom';\nimport { useToast } from '../context/ToastContext';")

# Add useToast hook inside the component. We need to find the main component, which is probably Payments
# Let's check where to inject it. We can find `const navigate = useNavigate();` or `const { ... } = useStore();`
if "const { addToast } = useToast();" not in content:
    content = content.replace("const { globalCurrency", "const { addToast } = useToast();\n    const { globalCurrency")

# Replace alert with addToast
content = content.replace('alert("Link de recibo copiado al portapapeles");', 'addToast("Link de recibo copiado al portapapeles", "info");')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Payments.tsx patched")
