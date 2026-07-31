import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\MigrationCenter\ApiDocsTab.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add edit state
old_state = """  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});"""
new_state = """  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');"""
if "editingKeyId" not in content:
    content = content.replace(old_state, new_state)

# Replace useStore to get updateApiKey
old_use_store = """  const { apiKeys, generateApiKey, deleteApiKey } = useStore();"""
new_use_store = """  const { apiKeys, generateApiKey, deleteApiKey, updateApiKey } = useStore();"""
if "updateApiKey" not in content:
    content = content.replace(old_use_store, new_use_store)

# Add Edit/Save icons imports
old_imports = """  Plus
} from 'lucide-react';"""
new_imports = """  Plus,
  Edit2,
  Save
} from 'lucide-react';"""
if "Edit2" not in content:
    content = content.replace(old_imports, new_imports)

# Replace table row to include Edit functionality
old_row = """                              <td className="px-6 py-4">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{key.name}</p>
                              </td>"""
new_row = """                              <td className="px-6 py-4">
                                  {editingKeyId === key.id ? (
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="text" 
                                              value={editingName} 
                                              onChange={(e) => setEditingName(e.target.value)}
                                              className="px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                          />
                                          <button 
                                              onClick={() => {
                                                  if(editingName.trim()) {
                                                      updateApiKey(key.id, editingName.trim());
                                                      setEditingKeyId(null);
                                                  }
                                              }}
                                              className="text-emerald-600 hover:text-emerald-700"
                                              title="Guardar Nombre"
                                          >
                                              <Save className="w-4 h-4" />
                                          </button>
                                          <button 
                                              onClick={() => setEditingKeyId(null)}
                                              className="text-slate-400 hover:text-slate-600"
                                          >
                                              <X className="w-4 h-4" />
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2">
                                          <p className="font-bold text-slate-800 dark:text-slate-200">{key.name}</p>
                                          <button 
                                              onClick={() => {
                                                  setEditingKeyId(key.id);
                                                  setEditingName(key.name);
                                              }}
                                              className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Editar Nombre"
                                          >
                                              <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                      </div>
                                  )}
                              </td>"""

content = content.replace(old_row, new_row)
content = content.replace('<tr key={key.id} className="hover:bg-slate-50', '<tr key={key.id} className="group hover:bg-slate-50')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("ApiDocsTab.tsx updated with rename functionality!")
