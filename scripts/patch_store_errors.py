import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix PdfJob import
if "PdfJob" not in content.split("from '../types'")[0]:
    content = content.replace(
        "CompanySettings, AuditLog, LoanRequest, Employee, CashShift, PaymentMethod, CollectorVisit, AppNotification, ApiKey, LoanProduct, Route } from '../types';",
        "CompanySettings, AuditLog, LoanRequest, Employee, CashShift, PaymentMethod, CollectorVisit, AppNotification, ApiKey, LoanProduct, Route, PdfJob } from '../types';"
    )

# Fix newLoan
content = content.replace("loan: newLoan", "loan: insertedLoan as any")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("StoreContext.tsx fixed")
