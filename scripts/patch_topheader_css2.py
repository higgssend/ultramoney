import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\components\TopHeader.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Restore main container
content = content.replace(
    '<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between md:justify-center gap-4 px-4 py-3 shadow-sm relative">',
    '<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm h-[72px]">'
)

# Restore left menu
content = content.replace(
    '<div className="flex items-center gap-3 lg:hidden md:absolute md:left-4">',
    '<div className="flex items-center gap-3 lg:hidden w-1/3">'
)

# Center Group Wrap (We need to group the search and the buttons in the center).
# The current Search:
# <div className="hidden md:flex flex-1 max-w-xl absolute left-1/2 -translate-x-1/2 pointer-events-auto" ref={searchRef}>
# Let's change it to just `w-full max-w-md` and we will wrap it and the buttons in a new flex container? No, we can't easily add wrappers via script.

# Better idea: Instead of wrappers, use Grid layout on TopHeader.
# Grid 3 columns: Left (Mobile Menu), Center (Search + Actions), Right (Spacer).
# On Mobile: flex between. On Desktop: grid.

# Let's completely rewrite the layout classes for these 3 main divs.
# Left:
content = content.replace(
    '<div className="flex items-center gap-3 lg:hidden w-1/3">',
    '<div className="flex items-center gap-3 lg:hidden flex-1 md:flex-none">'
)

# Search:
# From: '<div className="hidden md:flex flex-1 max-w-xl absolute left-1/2 -translate-x-1/2 pointer-events-auto" ref={searchRef}>'
content = content.replace(
    '<div className="hidden md:flex flex-1 max-w-xl absolute left-1/2 -translate-x-1/2 pointer-events-auto" ref={searchRef}>',
    '<div className="hidden md:flex w-full max-w-lg" ref={searchRef}>'
)

# Actions:
# From: '<div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-0 md:absolute md:right-4 lg:relative lg:right-0">'
content = content.replace(
    '<div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-0 md:absolute md:right-4 lg:relative lg:right-0">',
    '<div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-0">'
)

# If we just change the main container to:
# `<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between md:justify-center md:gap-6 px-4 py-3 shadow-sm h-[72px]">`
# Then on Desktop, they will all be centered in the flow: `[ Search ] [ Buttons ]` because `md:justify-center` will center all children.
# BUT on mobile we need `justify-between` so the logo is on the left and buttons on the right.

content = content.replace(
    '<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm h-[72px]">',
    '<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between md:justify-center md:gap-6 px-4 py-3 shadow-sm h-[72px]">'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("TopHeader CSS patched safely")
