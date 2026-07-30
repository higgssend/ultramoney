import React from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw,
  Search,
  Filter
} from 'lucide-react';
import { MigrationLog } from './types';
import { useToast } from '../../context/ToastContext';
import { DataExportToolbar } from '../../components/DataExportToolbar';

interface HistoryTabProps {
  logs: MigrationLog[];
  onRollbackClick: (log: MigrationLog) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ logs, onRollbackClick }) => {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Historial Completo de Migraciones & Auditoría</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Registro detallado de todas las ejecuciones, tiempo, usuario y archivos de log para descarga.
          </p>
        </div>
        <DataExportToolbar 
          data={logs} 
          title="Historial de Migraciones"
          filename="auditoria_migraciones"
          columns={[
            { header: 'ID', key: 'id' },
            { header: 'Fecha', key: 'timestamp' },
            { header: 'Usuario', key: 'userName' },
            { header: 'Archivo', key: 'sourceSystem' },
            { header: 'Registros (Exitosos)', key: 'recordsImported' },
            { header: 'Registros (Fallidos)', key: 'recordsFailed' },
            { header: 'Estado', key: 'status' }
          ]} 
        />
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID / Fecha</th>
                <th className="py-3 px-4">Método & Origen</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4 text-center">Registros Importados</th>
                <th className="py-3 px-4 text-center">Rechazados</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{log.id}</p>
                    <p className="text-xs text-slate-400">{log.timestamp}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{log.method}</p>
                    <p className="text-xs text-slate-500">{log.sourceSystem}</p>
                  </td>
                  <td className="py-3 px-4 text-xs">{log.userName}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">{log.recordsImported}</td>
                  <td className="py-3 px-4 text-center font-bold text-rose-500">{log.recordsFailed + log.recordsOmitted}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                      log.status === 'Completada'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                        : log.status === 'Completada con Advertencias'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                        : log.status === 'Revertida'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => addToast(`Descargando log para ${log.id}`, 'info')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title="Descargar Log"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {log.canRollback && log.status !== 'Revertida' && (
                      <button
                        onClick={() => onRollbackClick(log)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
                      >
                        Revertir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
