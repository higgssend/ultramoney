import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# patch addClient
if "portal_alias: client.portalAlias" not in content:
    content = content.replace(
        "clientpin: client.clientPin",
        "clientpin: client.clientPin,\n      portal_alias: client.portalAlias,\n      portal_active: client.portalActive"
    )

    # patch updateClient
    content = content.replace(
        "status: updatedClient.status, clientpin: updatedClient.clientPin",
        "status: updatedClient.status, clientpin: updatedClient.clientPin,\n      portal_alias: updatedClient.portalAlias, portal_active: updatedClient.portalActive"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("StoreContext patched for portalAlias!")
else:
    print("Already patched!")
