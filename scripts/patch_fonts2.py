import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\index.css"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_layer = """  select, option, input, textarea, button {
    font-family: 'DM Sans', sans-serif;
  }"""

new_layer = """  select, input, textarea, button {
    font-family: 'DM Sans', sans-serif;
  }
  
  option {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
  }"""

content = content.replace(old_layer, new_layer)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("index.css updated globally for option fallback!")
