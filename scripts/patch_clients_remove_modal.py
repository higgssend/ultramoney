import re

clients_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Clients.tsx"

with open(clients_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Nuevo Cliente button click
content = re.sub(
    r"onClick=\{\(\) => \{\s*setCurrentClient\(\{[^}]*\}\);\s*setIsEditMode\(false\);\s*setIsModalOpen\(true\);\s*\}\}",
    "onClick={() => navigate('/clientes/nuevo')}",
    content
)

# Replace Edit button click
content = re.sub(
    r"onClick=\{\(\) => \{\s*setCurrentClient\(client\);\s*setIsEditMode\(true\);\s*setIsModalOpen\(true\);\s*\}\}",
    "onClick={() => navigate('/clientes/editar/' + client.id)}",
    content
)

# Remove modal render block
content = re.sub(
    r"\{isModalOpen\s*&&\s*\(\s*<div className=\"fixed inset-0.*?</form>\s*</div>\s*</div>\s*\)\}",
    "",
    content,
    flags=re.DOTALL
)

# Remove unnecessary state hooks
content = re.sub(r"const \[isModalOpen, setIsModalOpen\] = useState\(false\);\n\s*const \[isEditMode, setIsEditMode\] = useState\(false\);", "", content)
content = re.sub(r"const \[docType, setDocType\].*?\n\s*const \[docNumber, setDocNumber\].*?\n\s*const \[docFile, setDocFile\].*?\n", "", content)
content = re.sub(r"const handleFileChange = \(e: React.ChangeEvent<HTMLInputElement>\) => \{.*?\n\s*\};\n", "", content, flags=re.DOTALL)
content = re.sub(r"const handleCaptureLocation = \(\) => \{.*?\n\s*\};\n", "", content, flags=re.DOTALL)
content = re.sub(r"const handleSubmit = async \(e: React.FormEvent\) => \{.*?\n\s*\};\n", "", content, flags=re.DOTALL)
content = re.sub(r"const \[currentClient, setCurrentClient\] = useState<Partial<Client>>\(.*?\);\n", "", content, flags=re.DOTALL)

with open(clients_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Clients.tsx patched")
