import re

path = r'c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports for Route
content = content.replace("CompanySettings, LoanProduct,", "CompanySettings, LoanProduct, Route,")

# 2. Add routes state
routes_state_str = """
  const [routes, setRoutes] = useState<Route[]>([]);
"""
content = re.sub(r'const \[employees, setEmployees\] = useState<Employee\[\]>\(\[\]\);', r'const [employees, setEmployees] = useState<Employee[]>([]);\n' + routes_state_str, content)

# 3. Add context methods interface
context_type_find = """  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;"""
context_type_replace = context_type_find + """
  routes: Route[];
  addRoute: (route: Omit<Route, 'id' | 'createdAt'>) => Promise<void>;
  updateRoute: (id: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;"""
if "addRoute:" not in content:
    content = content.replace(context_type_find, context_type_replace)

# 4. Fetch routes in fetchData
fetch_data_find = "const { data: empData } = await insforge.database.from('employees').select('*');"
fetch_data_replace = "const { data: routeData } = await insforge.database.from('routes').select('*');\n        " + fetch_data_find
if "from('routes').select('*');" not in content:
    content = content.replace(fetch_data_find, fetch_data_replace)

set_emp_find = "if (empData) setEmployees(empData.map(mapEmployeeFromDB));"
set_emp_replace = "if (routeData) setRoutes(routeData.map(r => ({ id: r.id, name: r.name, description: r.description, collectorId: r.collector_id, status: r.status, createdAt: r.created_at })));\n        " + set_emp_find
if "setRoutes(routeData" not in content:
    content = content.replace(set_emp_find, set_emp_replace)

# 5. Route CRUD functions
route_crud_str = """
  const addRoute = async (route: Omit<Route, 'id' | 'createdAt'>) => {
      try {
          const { data, error } = await insforge.database.from('routes').insert([{
              name: route.name,
              description: route.description,
              collector_id: route.collectorId,
              status: route.status
          }]).select();
          if(error) throw error;
          if(data) {
              setRoutes([...routes, {
                  id: data[0].id,
                  name: data[0].name,
                  description: data[0].description,
                  collectorId: data[0].collector_id,
                  status: data[0].status,
                  createdAt: data[0].created_at
              }]);
              addToast('Ruta creada exitosamente', 'success');
          }
      } catch (e: any) {
          addToast('Error al crear ruta: ' + e.message, 'error');
      }
  };

  const updateRoute = async (id: string, updates: Partial<Route>) => {
      try {
          const dbUpdates: any = {};
          if(updates.name) dbUpdates.name = updates.name;
          if('description' in updates) dbUpdates.description = updates.description;
          if('collectorId' in updates) dbUpdates.collector_id = updates.collectorId;
          if(updates.status) dbUpdates.status = updates.status;
          
          const { error } = await insforge.database.from('routes').update(dbUpdates).eq('id', id);
          if(error) throw error;
          setRoutes(routes.map(r => r.id === id ? { ...r, ...updates } : r));
          addToast('Ruta actualizada', 'success');
      } catch (e: any) {
          addToast('Error al actualizar ruta: ' + e.message, 'error');
      }
  };

  const deleteRoute = async (id: string) => {
      try {
          // Check if clients are assigned
          const hasClients = clients.some(c => c.routeId === id);
          if(hasClients) {
              addToast('No se puede eliminar la ruta porque tiene clientes asignados', 'error');
              return;
          }
          const { error } = await insforge.database.from('routes').delete().eq('id', id);
          if(error) throw error;
          setRoutes(routes.filter(r => r.id !== id));
          addToast('Ruta eliminada', 'success');
      } catch (e: any) {
          addToast('Error al eliminar ruta: ' + e.message, 'error');
      }
  };
"""
if "const addRoute = async" not in content:
    content = content.replace("const addEmployee = async", route_crud_str + "\n  const addEmployee = async")

# 6. Add to context provider value
value_find = "employees,\n    addEmployee,"
value_replace = "routes,\n    addRoute,\n    updateRoute,\n    deleteRoute,\n    " + value_find
if "deleteRoute," not in content:
    content = content.replace(value_find, value_replace)


# 7. Update addClient and updateClient functions to include routeId and routeSequence
db_client_find = """            cedula: client.cedula,
            address: client.address,
            income: client.income,"""
db_client_replace = """            cedula: client.cedula,
            address: client.address,
            income: client.income,
            route_id: client.routeId,
            route_sequence: client.routeSequence,"""
if "route_id: client.routeId" not in content:
    content = content.replace(db_client_find, db_client_replace)
    
db_client_up_find = """        if (updates.coordinates) dbUpdates.coordinates = updates.coordinates;
        if (updates.status) dbUpdates.status = updates.status;"""
db_client_up_replace = db_client_up_find + """
        if ('routeId' in updates) dbUpdates.route_id = updates.routeId;
        if ('routeSequence' in updates) dbUpdates.route_sequence = updates.routeSequence;"""
if "dbUpdates.route_id" not in content:
    content = content.replace(db_client_up_find, db_client_up_replace)

map_client_find = "joinedDate: dbClient.joined_date"
map_client_replace = "joinedDate: dbClient.joined_date,\n    routeId: dbClient.route_id,\n    routeSequence: dbClient.route_sequence"
if "routeId: dbClient.route_id" not in content:
    content = content.replace(map_client_find, map_client_replace)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("StoreContext.tsx patched successfully for Routes!")
