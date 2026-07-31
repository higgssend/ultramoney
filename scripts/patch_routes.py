import os

# 1. Patch StoreContext.tsx
store_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"
with open(store_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add to interface
content = content.replace(
    "employees: Employee[];\n  auditLogs: AuditLog[];",
    "employees: Employee[];\n  routes: Route[];\n  auditLogs: AuditLog[];"
)

# Add to provider value
content = content.replace(
    "clientNotes, clientDocuments, employees, auditLogs,",
    "clientNotes, clientDocuments, employees, routes, auditLogs,"
)

with open(store_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Patch Clients.tsx
clients_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Clients.tsx"
with open(clients_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Map, Hash to lucide imports
content = content.replace(
    "Crosshair, ChevronLeft, Globe } from 'lucide-react';",
    "Crosshair, ChevronLeft, Globe, Map, Hash } from 'lucide-react';"
)

# Destructure routes from useStore
content = content.replace(
    "const { clients, addClient, updateClient, loans, addClientDocument } = useStore();",
    "const { clients, addClient, updateClient, loans, addClientDocument, routes } = useStore();"
)

with open(clients_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully")
