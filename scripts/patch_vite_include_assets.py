import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\vite.config.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace includeAssets in vite.config.ts
if "favicon.ico" in content:
    content = re.sub(r"includeAssets: \['favicon\.ico', 'apple-touch-icon\.png', 'mask-icon\.svg', 'logoultramoney_logooriginaldegradadomorado\.svg', 'og-image\.svg', 'pwa-icon\.svg'\],", 
                     "includeAssets: ['logoultramoney_logooriginaldegradadomorado.svg', 'og-image.svg', 'pwa-icon.svg'],", content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("vite.config.ts includeAssets patched!")
else:
    print("Already patched vite.config.ts includeAssets!")
