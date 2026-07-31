import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """        const { error, data } = await insforge.database.from('api_keys').insert({
          lender_id: currentUser.id,
          name,"""

new_code = """        const { error, data } = await insforge.database.from('api_keys').insert({
          user_id: currentUser.id,
          name,"""

if "lender_id: currentUser.id" in content:
    content = content.replace(old_code, new_code)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed lender_id to user_id in StoreContext.tsx")
else:
    print("Already fixed.")
