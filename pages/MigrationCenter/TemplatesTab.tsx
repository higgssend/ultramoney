import React from 'react';
import { 
  FileCode, 
  Download, 
  Upload, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Trash2
} from 'lucide-react';
import { MigrationTemplate } from './types';
import { useToast } from '../../context/ToastContext';

interface TemplatesTabProps {
  templates: MigrationTemplate[];
  onApplyTemplate: (template: MigrationTemplate) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({ templates, onApplyTemplate }) => {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <span>Plantillas de Mapeo Reutilizables</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Guarde y reutilice mapeos de columnas con 1-clic para repetir importaciones en el futuro sin volver a configurar.
          </p>
        </div>
        <button
          onClick={() => addToast('Importar plantilla JSON desde archivo local', 'info')}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Importar Plantilla JSON</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  {tpl.sourceSystem}
                </span>
                <span className="text-xs text-slate-400 font-mono">Creada: {tpl.createdDate}</span>
              </div>

              <h4 className="font-extrabold text-slate-800 dark:text-white text-base mb-1">{tpl.name}</h4>
              <p className="text-xs text-slate-500 mb-3">{tpl.mappings.length} campos mapeados • Estrategia: {tpl.duplicateStrategy}</p>

              {/* Entity Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tpl.entities.map((e) => (
                  <span key={e} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold capitalize">
                    {e}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => addToast(`Exportando "${tpl.name}" en JSON`, 'info')}
                className="text-xs text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>

              <button
                onClick={() => onApplyTemplate(tpl)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Usar en Asistente</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
