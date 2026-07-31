import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\Clients.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if "import { useStore }" in content and "Map," not in content:
    content = content.replace("import { Users,", "import { Users, Map, Hash,")

# 2. Get routes from useStore
store_find = "const { clients, addClient, updateClient, deleteClient } = useStore();"
store_replace = "const { clients, addClient, updateClient, deleteClient, routes } = useStore();"
if "const { clients, addClient, updateClient, deleteClient, routes }" not in content:
    content = content.replace(store_find, store_replace)

# 3. Add Routes section to the form
route_ui = """
                    {/* Section: Ruta */}
                    <div>
                        <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <Map className="w-4 h-4" /> Ruta de Cobro (Opcional)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zona / Ruta</label>
                                <select className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.routeId || ''} onChange={e => setCurrentClient({...currentClient, routeId: e.target.value})}>
                                    <option value="">-- Sin ruta --</option>
                                    {routes.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1"><Hash className="w-3 h-3 text-slate-400"/> Secuencia / Orden</label>
                                <input type="number" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.routeSequence || 0} onChange={e => setCurrentClient({...currentClient, routeSequence: Number(e.target.value)})} placeholder="Ej. 1" />
                            </div>
                        </div>
                    </div>
"""

insert_point = "{/* Section 4: Documento Adjunto (Opcional, Solo Creación) */}"
if "Ruta de Cobro (Opcional)" not in content:
    content = content.replace(insert_point, route_ui + "\n                    " + insert_point)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Clients.tsx patched successfully for Routes!")
