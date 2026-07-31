import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\MigrationCenter\ApiDocsTab.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add AlertTriangle to imports
if "AlertTriangle" not in content:
    content = content.replace("Plus,", "Plus,\n  AlertTriangle,")

# Add state
old_state = "const [editingName, setEditingName] = useState('');"
new_state = "const [editingName, setEditingName] = useState('');\n  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);"
if "keyToDelete" not in content:
    content = content.replace(old_state, new_state)

# Replace window.confirm
old_delete_btn = """                                  <button 
                                      onClick={() => {
                                          if(window.confirm(`Seguro que deseas revocar y eliminar la llave "${key.name}"? Cualquier integracin usando esta llave dejarǭ de funcionar inmediatamente.`)) {
                                              deleteApiKey(key.id);
                                          }
                                      }}
                                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-rose-100 dark:border-rose-900/50"
                                  >"""
new_delete_btn = """                                  <button 
                                      onClick={() => setKeyToDelete(key)}
                                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-rose-100 dark:border-rose-900/50"
                                  >"""
content = content.replace(old_delete_btn, new_delete_btn)

# Add Confirm Delete Modal
new_modal = """
      {/* Modal Confirmar Eliminacin */}
      {keyToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 rounded-t-2xl">
                      <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-6 h-6" />
                          <h3 className="font-bold text-lg">Revocar API Key</h3>
                      </div>
                      <button onClick={() => setKeyToDelete(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6">
                      <p className="text-slate-600 dark:text-slate-300 mb-6">
                          Ests seguro de que deseas revocar y eliminar la llave <strong>"{keyToDelete.name}"</strong>?<br/><br/>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Esta accin no se puede deshacer.</span> Cualquier integracin que est utilizando esta llave dejar de funcionar inmediatamente.
                      </p>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setKeyToDelete(null)}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={() => {
                                  deleteApiKey(keyToDelete.id);
                                  setKeyToDelete(null);
                              }}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all flex justify-center items-center gap-2"
                          >
                              <Trash2 className="w-5 h-5" />
                              S, Revocar Llave
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
"""
content = content.replace("    </div>\n  );\n};\n", new_modal + "  );\n};\n")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("ApiDocsTab.tsx updated with confirm delete modal!")
