import os

# 1. Patch ClientDetail.tsx
f1 = r"c:\Users\Dell\Downloads\ultramoney\pages\ClientDetail.tsx"
with open(f1, "r", encoding="utf-8") as f:
    c1 = f.read()
c1 = c1.replace(
    "toast.success('Link copiado al portapapeles');",
    "addToast('Link copiado al portapapeles', 'success');"
)
with open(f1, "w", encoding="utf-8") as f:
    f.write(c1)

# 2. Patch LoanRequest.tsx
f2 = r"c:\Users\Dell\Downloads\ultramoney\pages\LoanRequest.tsx"
with open(f2, "r", encoding="utf-8") as f:
    c2 = f.read()
c2 = c2.replace(
    "const { addLoanRequest, createLoan, deleteLoanRequest, updateClient, clients, loanRequests, globalCurrency } = useStore();",
    "const { addLoanRequest, createLoan, deleteLoanRequest, updateClient, clients, loanRequests, globalCurrency, loanProducts } = useStore();"
)
with open(f2, "w", encoding="utf-8") as f:
    f.write(c2)

# 3. Patch Payments.tsx
f3 = r"c:\Users\Dell\Downloads\ultramoney\pages\Payments.tsx"
with open(f3, "r", encoding="utf-8") as f:
    c3 = f.read()
c3 = c3.replace(
    "import { useToast } from '../context/ToastContext';",
    "import { useToast } from '../context/ToastContext';\nimport { toast } from 'sonner';"
)
c3 = c3.replace(
    "addToast(\"Link de recibo copiado al portapapeles\", \"info\");",
    "toast.info(\"Link de recibo copiado al portapapeles\");"
)
with open(f3, "w", encoding="utf-8") as f:
    f.write(c3)

print("TypeScript runtime crashes patched successfully!")
