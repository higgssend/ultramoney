import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add to interface
old_interface = """  generateApiKey: (name: string) => void;
  deleteApiKey: (id: string) => void;"""
new_interface = """  generateApiKey: (name: string) => void;
  deleteApiKey: (id: string) => void;
  updateApiKey: (id: string, newName: string) => void;"""

if "updateApiKey" not in content:
    content = content.replace(old_interface, new_interface)

    # Add implementation
    old_impl = """      deleteApiKey: async (id: string) => {
        if (!currentUser) return;
        const { error } = await insforge.database.from('api_keys').delete().eq('id', id);"""
    
    new_impl = """      updateApiKey: async (id: string, newName: string) => {
        if (!currentUser) return;
        const { error } = await insforge.database.from('api_keys').update({ name: newName }).eq('id', id);
        if (!error) {
          setApiKeys(prev => prev.map(k => k.id === id ? { ...k, name: newName } : k));
          addToast('API Key actualizada correctamente', 'success');
        } else {
          addToast('Error al actualizar API Key', 'error');
        }
      },
      deleteApiKey: async (id: string) => {
        if (!currentUser) return;
        const { error } = await insforge.database.from('api_keys').delete().eq('id', id);"""

    content = content.replace(old_impl, new_impl)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("StoreContext.tsx updated with updateApiKey!")
else:
    print("Already updated.")
