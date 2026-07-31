import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update mapLoan
content = content.replace(
    "    collateralData: l.collateraldata || l.collateralData || l.collateral_data,",
    "    collateralData: l.collateraldata || l.collateralData || l.collateral_data,\n    lateFeePercentage: l.latefeepercentage ?? l.lateFeePercentage,\n    graceDays: l.gracedays ?? l.graceDays,"
)

# 2. Update addLoan (we need to be careful with exact spacing)
# Let's find the addLoan insert
insert_start = "    const { error } = await insforge.database.from('loans').insert({"
insert_end = "      total_to_pay: loan.totalToPay"
content = content.replace(
    "      total_to_pay: loan.totalToPay",
    "      total_to_pay: loan.totalToPay,\n      latefeepercentage: loan.lateFeePercentage ?? 0,\n      gracedays: loan.graceDays ?? 0"
)

# 3. Update updateLoan
update_start = "    const { error } = await insforge.database.from('loans').update({"
update_end = "      total_to_pay: updatedLoan.totalToPay"
content = content.replace(
    "      total_to_pay: updatedLoan.totalToPay",
    "      total_to_pay: updatedLoan.totalToPay,\n      latefeepercentage: updatedLoan.lateFeePercentage,\n      gracedays: updatedLoan.graceDays"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("StoreContext.tsx patched successfully for loans penalty!")
