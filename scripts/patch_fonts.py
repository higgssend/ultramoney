import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\index.css"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_layer = """@layer base {
  html, body {
    font-family: 'DM Sans';
  }
}"""

new_layer = """@layer base {
  html, body {
    font-family: 'DM Sans', sans-serif;
  }
  
  select, option, input, textarea, button {
    font-family: 'DM Sans', sans-serif;
  }
}"""

content = content.replace(old_layer, new_layer)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("index.css updated globally for form elements!")
