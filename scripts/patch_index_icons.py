import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace favicon lines with the svg logo
if "favicon.ico" in content:
    content = re.sub(r'<link rel="icon" href="/favicon\.ico">', '<link rel="icon" href="/logoultramoney_logooriginaldegradadomorado.svg">', content)
    content = re.sub(r'<link rel="apple-touch-icon".*?>', '', content)
    content = re.sub(r'<link rel="mask-icon".*?>', '', content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("index.html patched!")
else:
    print("Already patched index.html!")
