import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Routes.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add X to lucide-react imports
if " X," not in content and "X " not in content:
    content = content.replace("Save, AlertCircle }", "Save, AlertCircle, X, AlertTriangle }")

# Add state
old_state = "const [isEditing, setIsEditing] = useState(false);"
new_state = "const [isEditing, setIsEditing] = useState(false);\n    const [routeToDelete, setRouteToDelete] = useState<string | null>(null);"
if "routeToDelete" not in content:
    content = content.replace(old_state, new_state)

# Replace handleDelete
old_handle = """    const handleDelete = async (id: string) => {
        if(window.confirm('Eliminar esta ruta?')) {
            await deleteRoute(id);
            if (selectedRoute?.id === id) setSelectedRoute(null);
        }
    };"""
# Note: The original file has "Eliminar esta ruta?", we should replace it safely by matching start and end
import re
content = re.sub(
    r"    const handleDelete = async \(id: string\) => {\n\s*if\(window\.confirm\('.*?'\)\) {\n\s*await deleteRoute\(id\);\n\s*if \(selectedRoute\?\.id === id\) setSelectedRoute\(null\);\n\s*}\n\s*};",
    "    const handleDelete = (id: string) => {\n        setRouteToDelete(id);\n    };",
    content
)

# Add Confirm Delete Modal
new_modal = """
        {/* Modal Confirmar Eliminacin */}
        {routeToDelete && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 rounded-t-2xl">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="font-bold text-lg">Eliminar Ruta</h3>
                        </div>
                        <button onClick={() => setRouteToDelete(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Ests seguro de que deseas eliminar esta ruta?<br/><br/>
                            <span className="text-rose-600 dark:text-rose-400 font-bold">Esta accin no se puede deshacer.</span> Los clientes asignados a esta ruta quedarn sin ruta.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setRouteToDelete(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={async () => {
                                    await deleteRoute(routeToDelete);
                                    if (selectedRoute?.id === routeToDelete) setSelectedRoute(null);
                                    setRouteToDelete(null);
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all flex justify-center items-center gap-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                S, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
"""
if "{/* Modal Confirmar" not in content:
    content = content.replace("        </div>\n    );\n};\n", new_modal + "        </div>\n    );\n};\n")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Routes.tsx patched")
