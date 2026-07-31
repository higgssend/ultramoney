import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Employees.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add a state for the custom dropdown if it doesn't exist
if "isRoleDropdownOpen" not in content:
    state_hook = """  const [isModalOpen, setIsModalOpen] = useState(false);"""
    state_hook_new = """  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);"""
    content = content.replace(state_hook, state_hook_new)

    # We also need ChevronDown import
    if "ChevronDown" not in content:
        content = content.replace("User, Phone", "User, Phone, ChevronDown")
        content = content.replace("X,", "X, ChevronDown,")

    old_select = """                              <div className="relative">
                                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                  <select 
                                    className="w-full pl-10 pr-2 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    value={newEmp.role}
                                    onChange={e => setNewEmp({...newEmp, role: e.target.value as any})}
                                  >
                                      <option value="Collector">Cobrador</option>
                                      <option value="Secretary">Secretaria</option>
                                      <option value="Admin">Admin</option>
                                  </select>
                              </div>"""

    new_select = """                              <div className="relative">
                                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 pointer-events-none" />
                                  
                                  <div 
                                      className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl bg-white cursor-pointer hover:border-indigo-300 transition-colors flex items-center justify-between"
                                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                  >
                                      <span className="text-slate-700">
                                          {newEmp.role === 'Collector' ? 'Cobrador' : newEmp.role === 'Secretary' ? 'Secretaria' : 'Admin'}
                                      </span>
                                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                  </div>

                                  {isRoleDropdownOpen && (
                                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                          {[
                                              { value: 'Collector', label: 'Cobrador' },
                                              { value: 'Secretary', label: 'Secretaria' },
                                              { value: 'Admin', label: 'Admin' }
                                          ].map(option => (
                                              <div 
                                                  key={option.value}
                                                  className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${newEmp.role === option.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'}`}
                                                  onClick={() => {
                                                      setNewEmp({...newEmp, role: option.value as any});
                                                      setIsRoleDropdownOpen(false);
                                                  }}
                                              >
                                                  {option.label}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                                  
                                  {/* Overlay invisible para cerrar al hacer click fuera */}
                                  {isRoleDropdownOpen && (
                                      <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)}></div>
                                  )}
                              </div>"""

    content = content.replace(old_select, new_select)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Employees.tsx patched with custom dropdown!")
else:
    print("Already patched or could not find hooks.")
