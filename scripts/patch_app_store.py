import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix HiddenDocumentRenderer order
old_block = """    <ToastProvider>
          <HiddenDocumentRenderer />
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ToastProvider>"""

new_block = """    <ToastProvider>
      <StoreProvider>
        <HiddenDocumentRenderer />
        <AppContent />
      </StoreProvider>
    </ToastProvider>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("App.tsx patched successfully!")
else:
    print("Could not find the exact block in App.tsx")
