import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\components\Sidebar.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update useStore destructuring
if "globalCurrency, setGlobalCurrency" not in content:
    content = content.replace(
        "const { currentUser, logout, companySettings } = useStore();",
        "const { currentUser, logout, companySettings, globalCurrency, setGlobalCurrency } = useStore();"
    )

# 2. Add currency toggle button next to theme toggle
old_toggle = """        <div className="p-4 border-t border-slate-100 dark:border-slate-800 mb-16 md:mb-0 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preferencia</span>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
          </div>"""

new_toggle = """        <div className="p-4 border-t border-slate-100 dark:border-slate-800 mb-16 md:mb-0 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preferencia</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setGlobalCurrency(globalCurrency === 'DOP' ? 'USD' : 'DOP')}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                >
                  <DollarSign className="w-3 h-3" /> {globalCurrency}
                </button>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
          </div>"""

content = content.replace(old_toggle, new_toggle)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Sidebar.tsx patched successfully for Multicurrency toggle!")
