import React from 'react';
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
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { insforge } from '../../lib/insforge';
import { useEffect, useState } from 'react';

export const ApiDocsTab: React.FC = () => {
  const { addToast } = useToast();
  const [apiKey, setApiKey] = useState<string>('cargando...');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      const { data } = await insforge.database.from('api_keys').select('key').order('created_at', { ascending: false }).limit(1).single();
      if (data) {
        setApiKey(data.key);
      } else {
        setApiKey('Aún no tienes una clave de API.');
      }
    };
    fetchKey();
  }, []);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error('Usuario no autenticado');
      
      const newKey = 'um_live_mig_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error } = await insforge.database.from('api_keys').insert([{
        user_id: userData.user.id,
        name: 'Producción Key',
        key: newKey
      }]);

      if (error) throw error;
      
      setApiKey(newKey);
      addToast('Nueva API Key generada con éxito', 'success');
    } catch (err: any) {
      addToast('Error generando API Key: ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('Endpoint / Código copiado al portapapeles', 'info');
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
    <div className="space-y-6">
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

      {/* API Key Box */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Clave de API de Migración (Live Key)</h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generando...' : 'Generar Nueva'}</span>
            </button>
            <button
              onClick={() => handleCopy(apiKey)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Key</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800 flex items-center justify-between">
          <span>{apiKey}</span>
          <span className="text-slate-500 text-xs">Cifrado AES-256</span>
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
    </div>
  );
};
