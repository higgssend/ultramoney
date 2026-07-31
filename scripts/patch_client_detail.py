import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\ClientDetail.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure Globe is imported
if "Globe" not in content:
    content = content.replace(
        "File as FileIcon, Image as ImageIcon, Upload, FileCheck, Edit, Plus, Trash2, X, Save,",
        "File as FileIcon, Image as ImageIcon, Upload, FileCheck, Edit, Plus, Trash2, X, Save, Globe,"
    )

portal_view = """
                 <DetailGroup icon={Globe} title="Portal Web de Cliente">
                     <DetailRow label="Enlace Corto" value={client.portalAlias ? `https://ultramoney.app/portal/${client.portalAlias}` : `https://ultramoney.app/portal/${client.id}`} highlight />
                     <DetailRow label="Alias" value={client.portalAlias || 'No configurado'} />
                     <DetailRow label="PIN" value={client.clientPin || 'Sin PIN'} />
                     <DetailRow label="Estado" value={client.portalActive !== false ? 'Activo' : 'Desactivado'} />
                 </DetailGroup>
"""

# Let's insert it after Contacto DetailGroup
if "Portal Web de Cliente" not in content:
    content = content.replace(
        "<DetailGroup icon={Phone} title=\"Contacto\">",
        portal_view + "\n                 <DetailGroup icon={Phone} title=\"Contacto\">"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("ClientDetail patched with Portal Web details!")
else:
    print("Already patched!")
