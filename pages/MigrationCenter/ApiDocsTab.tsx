import React, { useState } from 'react';
import { 
  Globe, 
  Key, 
  Lock, 
  Code2, 
  Copy, 
  Check, 
  Server, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  X,
  Plus,
  AlertTriangle,
  Edit2,
  Save
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/StoreContext';
import { ApiKey } from '../../types';

export const ApiDocsTab: React.FC = () => {
  const { addToast } = useToast();
  const { apiKeys, generateApiKey, deleteApiKey, updateApiKey } = useAuth();
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
        addToast('Debes ingresar un nombre para la API Key', 'error');
        return;
    }
    
    setIsGenerating(true);
    try {
        await generateApiKey(newKeyName.trim());
        setIsModalOpen(false);
        setNewKeyName('');
    } catch (err: any) {
        addToast('Error generando API Key: ' + err.message, 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('API Key copiada al portapapeles', 'info');
  };

  const toggleVisibility = (id: string) => {
      setVisibleKeys(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  const maskKey = (keyString: string | undefined, isVisible: boolean) => {
      if (!keyString) return '--------------------------';
      if (isVisible) return keyString;
      const prefix = keyString.substring(0, 8); // e.g. sk_ultra_
      const suffix = keyString.substring(keyString.length - 4);
      return `${prefix}${'•'.repeat(16)}${suffix}`;
  };

  const endpointsList = [
    {
      category: 'Conectores',
      endpoints: [
        { method: 'POST', path: '/api/v1/migration/connectors', desc: 'Registrar nuevo conector externo' },
        { method: 'PUT', path: '/api/v1/migration/connectors/:id', desc: 'Editar configuración de conector' },
        { method: 'DELETE', path: '/api/v1/migration/connectors/:id', desc: 'Eliminar conector' },
        { method: 'POST', path: '/api/v1/migration/connectors/:id/test', desc: 'Probar conexión' }
      ]
    },
    {
      category: 'Migraciones',
      endpoints: [
        { method: 'POST', path: '/api/v1/migration/jobs', desc: 'Crear nueva ejecución de migración' },
        { method: 'GET', path: '/api/v1/migration/jobs/:id', desc: 'Obtener estado en tiempo real' },
        { method: 'POST', path: '/api/v1/migration/jobs/:id/cancel', desc: 'Cancelar migración activa' },
        { method: 'POST', path: '/api/v1/migration/jobs/:id/rollback', desc: 'Revertir lote de migración' }
      ]
    },
    {
      category: 'Catálogos & Datos',
      endpoints: [
        { method: 'GET', path: '/api/v1/migration/catalogs/loan-types', desc: 'Obtener tipos de préstamos' },
        { method: 'GET', path: '/api/v1/migration/catalogs/provinces', desc: 'Obtener provincias y sectores' },
        { method: 'POST', path: '/api/v1/migration/data/clients', desc: 'Importar lote de clientes' },
        { method: 'POST', path: '/api/v1/migration/data/loans', desc: 'Importar lote de préstamos' }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <span>Documentación & Credenciales de API de Migración</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Endpoints REST desacoplados para integrar software de terceros directamente con UltraMoney.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-xs font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OAuth 2.0 / Bearer Enabled</span>
          </span>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-indigo-500" /> Historial de API Keys Activas
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Gestiona las llaves para acceder a la API de UltraMoney</p>
              </div>
              <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-indigo-500/20"
              >
                  <Plus className="w-4 h-4" /> Nueva API Key
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de API Key</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Clave Oculta</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Creación</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {apiKeys.length === 0 ? (
                          <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500">
                                  <Key className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                  <p className="font-medium">No hay llaves de API activas</p>
                              </td>
                          </tr>
                      ) : apiKeys.map(key => (
                          <tr key={key.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                  {editingKeyId === key.id ? (
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="text" 
                                              value={editingName} 
                                              onChange={(e) => setEditingName(e.target.value)}
                                              className="px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                          />
                                          <button 
                                              onClick={() => {
                                                  if(editingName.trim()) {
                                                      updateApiKey(key.id, editingName.trim());
                                                      setEditingKeyId(null);
                                                  }
                                              }}
                                              className="text-emerald-600 hover:text-emerald-700"
                                              title="Guardar Nombre"
                                          >
                                              <Save className="w-4 h-4" />
                                          </button>
                                          <button 
                                              onClick={() => setEditingKeyId(null)}
                                              className="text-slate-400 hover:text-slate-600"
                                          >
                                              <X className="w-4 h-4" />
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2">
                                          <p className="font-bold text-slate-800 dark:text-slate-200">{key.name}</p>
                                          <button 
                                              onClick={() => {
                                                  setEditingKeyId(key.id);
                                                  setEditingName(key.name);
                                              }}
                                              className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Editar Nombre"
                                          >
                                              <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                      </div>
                                  )}
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <code className="bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-mono text-sm border border-slate-200 dark:border-slate-800 min-w-[280px]">
                                          {maskKey(key.api_key || key.key, !!visibleKeys[key.id])}
                                      </code>
                                      <button onClick={() => toggleVisibility(key.id)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Mostrar/Ocultar">
                                          {visibleKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                      <button onClick={() => handleCopy(key.api_key || key.key)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Copiar">
                                          <Copy className="w-4 h-4" />
                                      </button>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                      {new Date(key.createdAt).toLocaleDateString()}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button 
                                      onClick={() => setKeyToDelete(key)}
                                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-rose-100 dark:border-rose-900/50"
                                  >
                                      <Trash2 className="w-3.5 h-3.5" /> Revocar
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Documentacion API */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-4">¿Cómo usar la API?</h3>
          
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <p>
                  Para interactuar con la API de UltraMoney, necesitas incluir tu API Key en los headers de tus peticiones HTTP. 
                  Esto garantiza que las solicitudes estén autenticadas de forma segura.
              </p>              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Base URLs</h4>
                  <div className="space-y-3">
                      <div>
                          <p className="text-xs text-slate-500 mb-1">Para acceso directo a la Base de Datos (PostgREST):</p>
                          <code className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg font-mono text-sm font-bold block">
                              https://api.ultramoney.app/rest/v1
                          </code>
                      </div>
                      <div>
                          <p className="text-xs text-slate-500 mb-1">Para lógicas complejas y Edge Functions:</p>
                          <code className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-mono text-sm font-bold block">
                              https://api.ultramoney.app/functions/v1
                          </code>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Autenticación (Headers)</h4>
                  <p className="mb-2">Añade los siguientes headers en todas tus llamadas REST y Edge Functions:</p>
                  <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto text-xs font-mono">
{`apikey: <TU_API_KEY_AQUI>
Authorization: Bearer <TU_API_KEY_AQUI>
Content-Type: application/json`}
                  </pre>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Ejemplo en cURL (Leer Clientes)</h4>
                  <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto text-xs font-mono">
{`curl -X GET "https://api.ultramoney.app/rest/v1/clients?select=*" \\
  -H "apikey: sk_ultra_abc123" \\
  -H "Authorization: Bearer sk_ultra_abc123" \\
  -H "Content-Type: application/json"`}
                  </pre>
              </div>
          </div>
      </div>

      {/* Endpoints Catalog */}
      <div className="space-y-4">
        <h4 className="font-extrabold text-slate-800 dark:text-white text-base">Catálogo de Endpoints REST</h4>

        {endpointsList.map((cat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h5 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{cat.category}</h5>

            <div className="space-y-2">
              {cat.endpoints.map((ep, eIdx) => (
                <div
                  key={eIdx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs gap-2"
                >
                  <div className="flex items-center gap-3 font-mono">
                    <span className={`px-2 py-0.5 rounded font-extrabold ${
                      ep.method === 'GET' ? 'bg-blue-100 text-blue-700' : ep.method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{ep.path}</span>
                  </div>
                  <span className="text-slate-500">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva API Key */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">Generar Nueva API Key</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                  </div>
                  <form onSubmit={handleGenerateKey} className="p-6">
                      <div className="mb-6">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                              Nombre de la Conexión
                          </label>
                          <input 
                              type="text" 
                              required
                              placeholder="Ej. Conector Zapier, CRM Externo..."
                              value={newKeyName}
                              onChange={e => setNewKeyName(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                          />
                          <p className="text-xs text-slate-500 mt-2">
                              Usa un nombre descriptivo para identificar rápidamente el sistema que utilizará esta llave en el futuro.
                          </p>
                      </div>
                      
                      <div className="flex gap-3">
                          <button 
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit"
                              disabled={isGenerating}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                          >
                              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                              {isGenerating ? 'Generando...' : 'Generar Key'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}


      {/* Modal Confirmar Eliminacin */}
      {keyToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 rounded-t-2xl">
                      <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-6 h-6" />
                          <h3 className="font-bold text-lg">Revocar API Key</h3>
                      </div>
                      <button onClick={() => setKeyToDelete(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6">
                      <p className="text-slate-600 dark:text-slate-300 mb-6">
                          Ests seguro de que deseas revocar y eliminar la llave <strong>"{keyToDelete.name}"</strong>?<br/><br/>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Esta accin no se puede deshacer.</span> Cualquier integracin que est utilizando esta llave dejar de funcionar inmediatamente.
                      </p>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setKeyToDelete(null)}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={() => {
                                  deleteApiKey(keyToDelete.id);
                                  setKeyToDelete(null);
                              }}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all flex justify-center items-center gap-2"
                          >
                              <Trash2 className="w-5 h-5" />
                              S, Revocar Llave
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
