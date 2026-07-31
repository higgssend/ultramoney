import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Clients.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Globe to imports
if "Globe" not in content:
    content = content.replace(
        "import { Search, Plus, Filter, MoreHorizontal, Phone, MapPin, X, Edit, User, Eye, Crosshair, ChevronLeft } from 'lucide-react';",
        "import { Search, Plus, Filter, MoreHorizontal, Phone, MapPin, X, Edit, User, Eye, Crosshair, ChevronLeft, Globe } from 'lucide-react';"
    )

portal_html = """
                    {/* Section: Portal Web */}
                    <div>
                        <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Portal Web de Cliente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alias del Enlace (Ej. juan-perez)</label>
                                <input type="text" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={currentClient.portalAlias || ''} onChange={e => setCurrentClient({...currentClient, portalAlias: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} placeholder="juan-perez" />
                                <p className="text-xs text-slate-500 mt-1">/portal/{currentClient.portalAlias || 'alias'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PIN de Acceso</label>
                                <input type="password" maxLength={4} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white font-mono" 
                                    value={currentClient.clientPin || ''} onChange={e => setCurrentClient({...currentClient, clientPin: e.target.value})} placeholder="Ej. 1234" />
                            </div>
                            <div className="flex flex-col justify-center pt-5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" 
                                        checked={currentClient.portalActive !== false} 
                                        onChange={e => setCurrentClient({...currentClient, portalActive: e.target.checked})} />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Activar Portal</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
"""

if "Portal Web de Cliente" not in content:
    content = content.replace(
        """                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">""",
        portal_html
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Clients.tsx patched!")
