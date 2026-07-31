import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Settings.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Edit2 to imports
content = content.replace(
    "Copy, Briefcase } from 'lucide-react';",
    "Copy, Briefcase, Edit2 } from 'lucide-react';"
)

# 2. Add updateRole to useStore
content = content.replace(
    "const { companySettings, updateCompanySettings, roles, addRole, deleteRole, users, registerUser, auditLogs, currentUser, updateUser, exportSystemBackup, importSystemBackup, apiKeys, generateApiKey, deleteApiKey } = useStore();",
    "const { companySettings, updateCompanySettings, roles, addRole, updateRole, deleteRole, users, registerUser, auditLogs, currentUser, updateUser, exportSystemBackup, importSystemBackup, apiKeys, generateApiKey, deleteApiKey } = useStore();"
)

# 3. Add editingRoleId state
content = content.replace(
    "const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);",
    "const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);\n  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);"
)

# 4. Update handleSaveRole
old_handle_save = """  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole.name) {
      addRole({
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      });
      setIsRoleModalOpen(false);
      setNewRole({ name: '', description: '', permissions: [] });
    }
  };"""

new_handle_save = """  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole.name) {
      if (editingRoleId) {
        updateRole(editingRoleId, {
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions
        });
      } else {
        addRole({
          id: Date.now().toString(),
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions
        });
      }
      setIsRoleModalOpen(false);
      setEditingRoleId(null);
      setNewRole({ name: '', description: '', permissions: [] });
    }
  };"""

content = content.replace(old_handle_save, new_handle_save)

# 5. Update "Crear Rol" button
old_create_btn = """<button onClick={() => setIsRoleModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Crear Rol
                  </button>"""
new_create_btn = """<button onClick={() => { setEditingRoleId(null); setNewRole({ name: '', description: '', permissions: [] }); setIsRoleModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Crear Rol
                  </button>"""

content = content.replace(old_create_btn, new_create_btn)

# 6. Add Edit button in roles list
old_delete_btn = """                          {role.id !== 'admin' && (
                            <button onClick={() => deleteRole(role.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}"""
new_delete_btn = """                          <div className="flex gap-2">
                            {role.id !== 'admin' && (
                              <button onClick={() => { setEditingRoleId(role.id); setNewRole({ name: role.name, description: role.description, permissions: role.permissions }); setIsRoleModalOpen(true); }} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                <Edit2 className="w-5 h-5" />
                              </button>
                            )}
                            {role.id !== 'admin' && (
                              <button onClick={() => deleteRole(role.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>"""

content = content.replace(old_delete_btn, new_delete_btn)

# 7. Modal title change
old_modal_title = """<h3 className="font-bold text-lg text-slate-800">Crear Nuevo Rol</h3>"""
new_modal_title = """<h3 className="font-bold text-lg text-slate-800">{editingRoleId ? 'Editar Rol' : 'Crear Nuevo Rol'}</h3>"""

content = content.replace(old_modal_title, new_modal_title)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Settings.tsx patched successfully!")
