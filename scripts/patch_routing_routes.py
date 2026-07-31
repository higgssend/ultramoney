import re

# Patch App.tsx
path_app = r'c:\Users\Dell\Downloads\ultramoney\App.tsx'
with open(path_app, 'r', encoding='utf-8') as f:
    app_content = f.read()

import_routes = "import RoutesPage from './pages/Routes';\n"
if "import RoutesPage" not in app_content:
    app_content = app_content.replace("import Employees from './pages/Employees';", import_routes + "import Employees from './pages/Employees';")

route_definition = '<Route path="/routes" element={<RoutesPage />} />\n                '
if "/routes" not in app_content:
    app_content = app_content.replace('<Route path="/employees" element={<Employees />} />', route_definition + '<Route path="/employees" element={<Employees />} />')

with open(path_app, 'w', encoding='utf-8') as f:
    f.write(app_content)


# Patch Sidebar.tsx
path_sidebar = r'c:\Users\Dell\Downloads\ultramoney\components\Sidebar.tsx'
with open(path_sidebar, 'r', encoding='utf-8') as f:
    sidebar_content = f.read()

if "import { LayoutDashboard" in sidebar_content and "Map" not in sidebar_content:
    sidebar_content = sidebar_content.replace("import { LayoutDashboard,", "import { LayoutDashboard, Map,")

sidebar_link = """            <SidebarLink to="/routes" icon={<Map className="w-5 h-5" />} label="Rutas de Cobro" collapsed={collapsed} />\n"""
if "/routes" not in sidebar_content:
    sidebar_content = sidebar_content.replace('<SidebarLink to="/employees" icon={<Users className="w-5 h-5" />} label="Empleados" collapsed={collapsed} />', sidebar_link + '            <SidebarLink to="/employees" icon={<Users className="w-5 h-5" />} label="Empleados" collapsed={collapsed} />')

with open(path_sidebar, 'w', encoding='utf-8') as f:
    f.write(sidebar_content)

print("App.tsx and Sidebar.tsx patched successfully!")
