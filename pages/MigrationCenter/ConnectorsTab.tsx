import React, { useState } from 'react';
import { 
  Server, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  Key, 
  Database, 
  Globe, 
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Connector } from './types';
import { useToast } from '../../context/ToastContext';

interface ConnectorsTabProps {
  connectors: Connector[];
  onAddConnector: (connector: Connector) => void;
}

export const ConnectorsTab: React.FC<ConnectorsTabProps> = ({ connectors, onAddConnector }) => {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Software a Medida' as const,
    driver: 'SQL Server Native',
    server: '',
    database: '',
    username: '',
    apiUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newConn: Connector = {
      id: `conn-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      driver: formData.driver,
      server: formData.server,
      database: formData.database,
      username: formData.username,
      apiUrl: formData.apiUrl,
      status: 'Conectado',
      lastSync: 'Ahora mismo',
      mappingsCount: 15,
      rulesCount: 4
    };

    onAddConnector(newConn);
    setIsModalOpen(false);
    addToast(`Conector "${formData.name}" registrado y conectado exitosamente`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <span>Centro Universal de Conectores de Software</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Conectores desacoplados para integrarse a cualquier software financiero del mercado (Púrpura Datos, ERPs, Apps Web, Sistemas Desktop).
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Conector</span>
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((conn) => (
          <div
            key={conn.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                  {conn.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                  conn.status === 'Conectado'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${conn.status === 'Conectado' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {conn.status}
                </span>
              </div>

              <h4 className="font-extrabold text-slate-800 dark:text-white text-base mb-1">{conn.name}</h4>
              <p className="text-xs text-slate-500 font-mono mb-4">{conn.driver}</p>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-mono mb-4">
                {conn.server && <p><span className="text-slate-400">Servidor:</span> {conn.server}</p>}
                {conn.database && <p><span className="text-slate-400">BD:</span> {conn.database}</p>}
                {conn.apiUrl && <p className="truncate"><span className="text-slate-400">API:</span> {conn.apiUrl}</p>}
                {conn.lastSync && <p><span className="text-slate-400">Última Sync:</span> {conn.lastSync}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium">{conn.mappingsCount} mapeos guardados</span>
              <button
                onClick={() => addToast(`Conexión con "${conn.name}" probada exitosamente`, 'success')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Probar Conexión
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Register Connector */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Registrar Conector Personalizado</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre del Conector</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Púrpura Datos Sucursal Este"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="Púrpura Datos">Púrpura Datos</option>
                    <option value="ERP Financiero">ERP Financiero</option>
                    <option value="Software a Medida">Software a Medida</option>
                    <option value="Sistema Contable">Sistema Contable</option>
                    <option value="App Web">App Web</option>
                    <option value="App Desktop">App Desktop</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Driver / Motor</label>
                  <input
                    type="text"
                    value={formData.driver}
                    onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Servidor / Host</label>
                  <input
                    type="text"
                    placeholder="192.168.1.100:1433"
                    value={formData.server}
                    onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Base de Datos</label>
                  <input
                    type="text"
                    placeholder="db_finance"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                >
                  Guardar Conector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
