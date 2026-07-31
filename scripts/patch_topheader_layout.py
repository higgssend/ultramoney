import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\components\TopHeader.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the 'flex-1 max-w-xl mx-4' from Search container, and the 'ml-auto' from Right Actions
# Wrap both inside a centered flex container
# We also need a dummy div on the right so flex-between keeps the centered block in the center?
# No, if the left side has the logo, the center has Search+Actions, we need a right side placeholder, or we can just use absolute centering.
# Or `justify-between` with left: logo, middle: search+actions, right: empty div with same width as logo.

old_search = """      {/* Global Search - Hidden on very small screens, visible on md+ */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchRef}>"""

new_search = """      {/* Centered Desktop Layout: Search + Actions */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-4">
        
        {/* Global Search */}
        <div className="flex-1 max-w-xl" ref={searchRef}>"""

content = content.replace(old_search, new_search)

old_right_actions = """        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">"""

new_right_actions = """        </div>

        {/* Right Actions (Centered with Search on Desktop) */}
        <div className="flex items-center gap-2 md:gap-4">"""
content = content.replace(old_right_actions, new_right_actions)

old_bottom = """          )}
        </div>
      </div>
    </div>
  );
};"""

new_bottom = """          )}
        </div>
      </div>

      {/* Spacer for Mobile: Ensures hamburger/logo are on left and these icons on right */}
      <div className="md:hidden flex items-center gap-2 ml-auto">
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
  );
};"""
content = content.replace(old_bottom, new_bottom)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("TopHeader.tsx patched for centering layout")
