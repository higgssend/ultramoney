import re

path = r'c:\Users\Dell\Downloads\ultramoney\types.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Route Interface
route_interface = """
export interface Route {
  id: string;
  name: string;
  description?: string;
  collectorId?: string;
  status: 'Activa' | 'Inactiva';
  createdAt: string;
}

"""

if "export interface Route" not in content:
    # Prepend it before Client
    content = content.replace("export interface Client {", route_interface + "export interface Client {")

# 2. Add route properties to Client
if "routeId?: string;" not in content:
    client_replace = """
  // Informacion laboral
  companyName?: string;
  jobPosition?: string;
  income: number; // Ingresos mensuales
  seniorityYears?: number;

  // Ruta Lógica
  routeId?: string;
  routeSequence?: number;

  creditScore: number; // 0 - 100"""
    content = re.sub(r'  // Informacion laboral.*?creditScore: number; // 0 - 100', client_replace, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("types.ts patched successfully for Routes!")
