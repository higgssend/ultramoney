import os

app_path = r"c:\Users\Dell\Downloads\ultramoney\App.tsx"

with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "import NewClient from './pages/NewClient';" not in content:
    content = content.replace(
        "import ClientDetail from './pages/ClientDetail';",
        "import ClientDetail from './pages/ClientDetail';\nimport NewClient from './pages/NewClient';"
    )

# Add routes
if '<Route path="/clientes/nuevo"' not in content:
    content = content.replace(
        '<Route path="/clientes/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />',
        '<Route path="/clientes/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />\n            <Route path="/clientes/nuevo" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />\n            <Route path="/clientes/editar/:id" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />'
    )

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx patched")
