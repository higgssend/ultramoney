import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "HiddenDocumentRenderer" not in content:
    content = content.replace(
        "import { ReceiptView } from './pages/ReceiptView';",
        "import { ReceiptView } from './pages/ReceiptView';\nimport { HiddenDocumentRenderer } from './components/HiddenDocumentRenderer';"
    )
    
    # Add inside StoreProvider (which is inside <Router>)
    # But StoreProvider is at the root of App return
    content = content.replace(
        "<ToastProvider>",
        "<ToastProvider>\n          <HiddenDocumentRenderer />"
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx patched for HiddenDocumentRenderer!")
