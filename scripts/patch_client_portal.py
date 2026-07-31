import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\ClientPortal.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Static import of insforge
content = content.replace(
    "import { useParams } from 'react-router-dom';",
    "import { useParams } from 'react-router-dom';\nimport { insforge } from '../lib/insforge';"
)
content = content.replace(
    """                // We use dynamic import for insforge to avoid circular dependencies if any
                const { insforge } = await import('../lib/insforge');
                const { data: cData } = await insforge.database.from('clients').select('*').eq('id', clientId).single();""",
    "                const { data: cData } = await insforge.database.from('clients').select('*').eq('id', clientId).single();"
)

# 2. Fix clientPin mapping and loading state
content = content.replace(
    "const [client, setClient] = useState<Client | null>(null);",
    "const [client, setClient] = useState<Client | null>(null);\n    const [isLoading, setIsLoading] = useState(true);\n    const [notFound, setNotFound] = useState(false);"
)

content = content.replace(
    """                if (cData) {
                    const foundClient = cData as unknown as Client;
                    setClient(foundClient);""",
    """                if (cData) {
                    const foundClient = cData as unknown as Client;
                    foundClient.clientPin = (cData as any).clientpin ?? (cData as any).clientPin;
                    setClient(foundClient);"""
)

content = content.replace(
    """            } catch (err) {
                console.error("Error fetching client for portal:", err);
            }
        }
        fetchClientData();""",
    """            } catch (err) {
                console.error("Error fetching client for portal:", err);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }
        fetchClientData();"""
)

# 3. Fix returning null to a nice error page
content = content.replace(
    "if (!client) return null;",
    """if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">Cargando portal seguro...</p>
            </div>
        );
    }

    if (notFound || !client) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Portal no encontrado</h2>
                    <p className="text-slate-500 mb-6">El enlace de acceso es inválido, ha expirado, o el cliente no existe en nuestra base de datos.</p>
                    <p className="text-xs text-slate-400">Si crees que esto es un error, por favor contacta a tu asesor financiero para que te envíe un nuevo enlace.</p>
                </div>
            </div>
        );
    }"""
)

# We need to import XCircle if it's not imported
content = content.replace(
    "import { Smartphone, CreditCard, Clock, FileText, CheckCircle, ArrowRight, ShieldCheck, Download } from 'lucide-react';",
    "import { Smartphone, CreditCard, Clock, FileText, CheckCircle, ArrowRight, ShieldCheck, Download, XCircle } from 'lucide-react';"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("ClientPortal.tsx patched successfully!")
