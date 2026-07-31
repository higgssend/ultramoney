import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\components\TopHeader.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make the left part (mobile menu toggle & logo) have a fixed width block to balance flex
# "flex items-center gap-3 lg:hidden" -> "flex items-center gap-3 lg:hidden md:w-[150px]"
content = content.replace(
    '<div className="flex items-center gap-3 lg:hidden">',
    '<div className="flex items-center gap-3 lg:hidden md:w-[150px]">'
)

# Move search and actions to absolute center on desktop
# We can do this by wrapping the search and actions inside an absolute centered div, but it's easier to just use CSS flex on the main container.
# Currently: "hidden md:flex flex-1 max-w-xl mx-4"
# Change to: "hidden md:flex flex-1 max-w-xl absolute left-1/2 -translate-x-1/2"
# And then move "Right Actions" inside it? No, if we just want them centered, we can use absolute positioning.

# Let's wrap both Search and Right Actions in a div? No, we don't want to mess up HTML tags.
# Instead, let's just make TopHeader `relative` and center the search bar absolutely.
# "hidden md:flex flex-1 max-w-xl mx-4"
content = content.replace(
    '<div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchRef}>',
    '<div className="hidden md:flex flex-1 max-w-xl absolute left-1/2 -translate-x-1/2 pointer-events-auto" ref={searchRef}>'
)

# And move Right actions to sit on the right? Wait, the user wants Right Actions NEXT TO the search bar, IN THE CENTER.
# Ah, if I want them next to the search bar, the easiest way without HTML parsing is:
# 1. Main container: `relative flex justify-between` -> `relative flex justify-between md:justify-center`
# 2. Left side: `lg:hidden md:absolute md:left-4`
# 3. Search bar: remove `flex-1` and make it fixed width `w-full max-w-md`
# 4. Right Actions: remove `ml-auto`

content = content.replace(
    '<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm">',
    '<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between md:justify-center gap-4 px-4 py-3 shadow-sm relative">'
)

content = content.replace(
    '<div className="flex items-center gap-3 lg:hidden md:w-[150px]">',
    '<div className="flex items-center gap-3 lg:hidden md:absolute md:left-4">'
)
content = content.replace(
    '<div className="flex items-center gap-3 lg:hidden">',
    '<div className="flex items-center gap-3 lg:hidden md:absolute md:left-4">'
)

content = content.replace(
    '<div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchRef}>',
    '<div className="hidden md:flex w-full max-w-md" ref={searchRef}>'
)

content = content.replace(
    '<div className="flex items-center gap-2 md:gap-4 ml-auto">',
    '<div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-0 md:absolute md:right-4 lg:relative lg:right-0">'
)
# Wait, if they are `relative` on `lg`, they will sit next to the search bar (which is centered because of `md:justify-center`).
# Yes! `justify-center` will center the Search Bar + Right Actions block. The mobile menu will be `absolute left-4`.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("TopHeader CSS patched safely")
