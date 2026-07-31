import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the preloading link
if "https://fonts.gstatic.com/s/dmsans/v15/" in content:
    content = re.sub(r'<!-- Typography preloading -->\s*<link rel="preload" as="font" href="https://fonts\.gstatic\.com/s/dmsans/v15/rP2Fp2ywxg089UriCZa4hz-D\.woff2".*?>', '', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("index.html font preloading removed!")
else:
    print("Preloading link not found in index.html!")
