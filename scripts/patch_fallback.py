import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the previous mapping with one that includes a fallback
old_map = """    nextPaymentDate: l.nextpaymentdate || l.nextPaymentDate || l.next_payment_date,"""

new_map = """    nextPaymentDate: l.nextpaymentdate || l.nextPaymentDate || l.next_payment_date || (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7); // Default fallback if missing in DB
        return d.toISOString().split('T')[0];
    })(),"""

if old_map in content:
    content = content.replace(old_map, new_map)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fallback nextPaymentDate added!")
else:
    print("Could not find the map to replace.")
