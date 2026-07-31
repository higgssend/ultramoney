import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\ClientPortals.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add ExternalLink icon to import
content = content.replace(
    "import { Search, Link as LinkIcon, RefreshCw, XCircle, ShieldCheck, Copy, ChevronLeft, CheckCircle } from 'lucide-react';",
    "import { Search, Link as LinkIcon, RefreshCw, XCircle, ShieldCheck, Copy, ChevronLeft, CheckCircle, ExternalLink } from 'lucide-react';"
)

# 2. Add handleOpenPortal function
content = content.replace(
    """    const handleCopyLink = (clientId: string) => {
        const link = `${window.location.origin}/portal/${clientId}`;
        navigator.clipboard.writeText(link);
        addToast('Enlace del portal copiado al portapapeles', 'success');
    };""",
    """    const handleCopyLink = (clientId: string) => {
        const link = `${window.location.origin}/portal/${clientId}`;
        navigator.clipboard.writeText(link);
        addToast('Enlace del portal copiado al portapapeles', 'success');
    };

    const handleOpenPortal = (clientId: string) => {
        const link = `${window.location.origin}/portal/${clientId}`;
        window.open(link, '_blank');
    };"""
)

# 3. Add the button to the table
content = content.replace(
    """                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleCopyLink(client.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm transition-colors border border-indigo-100 font-medium">
                                            <Copy className="w-4 h-4" /> Copiar Enlace
                                        </button>
                                    </td>""",
    """                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleCopyLink(client.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm transition-colors border border-indigo-100 font-medium" title="Copiar Enlace">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleOpenPortal(client.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors shadow-sm font-medium" title="Abrir Portal">
                                                <ExternalLink className="w-4 h-4" /> Abrir
                                            </button>
                                        </div>
                                    </td>"""
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("ClientPortals.tsx patched successfully!")
