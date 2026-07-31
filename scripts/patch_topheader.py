import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\components\TopHeader.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Modify notification rendering to support links
old_notif = """                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(n.date).toLocaleString()}</span>
                            {!n.read && (
                              <button onClick={() => markNotificationAsRead(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                Leer
                              </button>
                            )}
                          </div>"""

new_notif = """                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(n.date).toLocaleString()}</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {n.link && (
                                <button onClick={() => { navigate(n.link!); setIsNotifOpen(false); }} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  Ver
                                </button>
                              )}
                              {!n.read && (
                                <button onClick={() => markNotificationAsRead(n.id)} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  Leer
                                </button>
                              )}
                            </div>
                          </div>"""
content = content.replace(old_notif, new_notif)

# 2. Re-arrange Header structure for centering
# Currently:
#      {/* Global Search - Hidden on very small screens, visible on md+ */}
#      <div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchRef}>...</div>
#      {/* Right Actions */}
#      <div className="flex items-center gap-2 md:gap-4 ml-auto">...</div>

# We will combine them.
# The layout container is:
#     <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm">
#       {/* Mobile Menu Toggle & Logo */}
#       <div className="flex items-center gap-3 lg:hidden">...</div>
#       ...
#     </div>

# Let's replace the whole render return statement carefully.

old_render = """  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm">
      
      {/* Mobile Menu Toggle & Logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onMenuClick} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <img src="/logoultramoney_logooriginaldegradadomorado.svg" alt="Ultramoney" className="w-8 h-8" />
      </div>

      {/* Global Search - Hidden on very small screens, visible on md+ */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchRef}>
        <div className="relative w-full">"""

new_render = """  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center px-4 py-3 shadow-sm">
      
      {/* Mobile Menu Toggle & Logo */}
      <div className="flex items-center gap-3 lg:hidden flex-shrink-0">
        <button onClick={onMenuClick} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <img src="/logoultramoney_logooriginaldegradadomorado.svg" alt="Ultramoney" className="w-8 h-8" />
      </div>

      {/* Centered Desktop Layout */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-4">
        
        {/* Global Search */}
        <div className="w-full max-w-xl" ref={searchRef}>
          <div className="relative w-full">"""

content = content.replace(old_render, new_render)

old_right_actions = """        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        
        {/* Global Add Button */}"""

new_right_actions = """        </div>
        
        {/* Global Add Button */}"""
content = content.replace(old_right_actions, new_right_actions)

# At the bottom, remove the closing div of "Right Actions"
old_bottom = """          )}
        </div>
      </div>
    </div>
  );
};"""

new_bottom = """          )}
        </div>
      </div>

      {/* Spacer for Mobile to keep menu on left and actions on right if needed (not needed for this centered layout since actions are inside hidden md:flex) */}
      <div className="md:hidden flex items-center gap-2 ml-auto">
        {/* We keep a mobile version of the buttons here so they don't disappear on phones */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>
      
    </div>
  );
};"""
content = content.replace(old_bottom, new_bottom)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("TopHeader.tsx patched for centering and links")
