import re

path = r'c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("toast.success('Producto de préstamo creado.');", "addToast('Producto de préstamo creado.', 'success');")
content = content.replace("toast.error('Error al crear producto: ' + e.message);", "addToast('Error al crear producto: ' + e.message, 'error');")

content = content.replace("toast.success('Producto actualizado.');", "addToast('Producto actualizado.', 'success');")
content = content.replace("toast.error('Error al actualizar producto: ' + e.message);", "addToast('Error al actualizar producto: ' + e.message, 'error');")

content = content.replace("toast.success('Producto eliminado.');", "addToast('Producto eliminado.', 'success');")
content = content.replace("toast.error('Error al eliminar producto: ' + e.message);", "addToast('Error al eliminar producto: ' + e.message, 'error');")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("StoreContext.tsx patched successfully!")
