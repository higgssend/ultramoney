import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\types.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add currency: 'DOP' | 'USD' to Loan, LoanRequest, Transaction, CashShift

# 1. Loan
content = re.sub(
    r"(export interface Loan \{[^\}]+)(frequency: string;)",
    r"\1currency?: 'DOP' | 'USD';\n  \2",
    content
)

# 2. Transaction
content = re.sub(
    r"(export interface Transaction \{[^\}]+)(method: string;)",
    r"\1currency?: 'DOP' | 'USD';\n  \2",
    content
)

# 3. LoanRequest
content = re.sub(
    r"(export interface LoanRequest \{[^\}]+)(amount: number;)",
    r"\1currency?: 'DOP' | 'USD';\n  \2",
    content
)

# 4. CashShift
content = re.sub(
    r"(export interface CashShift \{[^\}]+)(initialAmount: number;)",
    r"\1currency?: 'DOP' | 'USD';\n  \2",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("types.ts patched successfully for Multicurrency!")
