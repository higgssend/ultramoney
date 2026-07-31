import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\types.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "portalAlias?:" not in content:
    content = content.replace(
        "clientPin?: string; // 4-digit PIN para el portal del cliente",
        "clientPin?: string; // 4-digit PIN para el portal del cliente\n  portalAlias?: string;\n  portalActive?: boolean;"
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("types.ts updated!")
else:
    print("Already updated!")
