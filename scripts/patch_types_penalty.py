import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\types.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "  totalToPay: number;",
    "  totalToPay: number;\n  lateFeePercentage?: number;\n  graceDays?: number;"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("types.ts patched successfully!")
