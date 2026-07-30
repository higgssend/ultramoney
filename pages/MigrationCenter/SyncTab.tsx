import React from 'react';
import { 
  RotateCw, 
  Clock, 
  Play, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck, 
  ArrowRightLeft,
  Plus
} from 'lucide-react';
import { SyncJob } from './types';
import { useToast } from '../../context/ToastContext';

interface SyncTabProps {
  syncJobs: SyncJob[];
  onToggleStatus: (id: string) => void;
}

export const SyncTab: React.FC<SyncTabProps> = ({ syncJobs, onToggleStatus }) => {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-purple-600" />
            <span>Sincronización Temporal (Período de Transición)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mantenga UltraMoney y su sistema externo sincronizados automáticamente durante la fase de transición.
          </p>
        </div>
        <button
          onClick={() => addToast('Nueva tarea de sincronización programada', 'info')}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Sincronización</span>
        </button>
      </div>

      {/* Sync Jobs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {syncJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-bold">
                  {job.mode}
                </span>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-base mt-2">{job.name}</h4>
                <p className="text-xs text-slate-500">Origen: {job.sourceSystem}</p>
              </div>
              <button
                onClick={() => onToggleStatus(job.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                  job.status === 'Activo'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {job.status}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-slate-400">Frecuencia</p>
                <p className="font-bold text-slate-800 dark:text-white">{job.frequency}</p>
              </div>
              <div>
                <p className="text-slate-400">Última Sync</p>
                <p className="font-bold text-slate-800 dark:text-white truncate">{job.lastSync}</p>
              </div>
              <div>
                <p className="text-slate-400">Sincronizados</p>
                <p className="font-bold text-indigo-600">{job.recordsSynced} reg</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => addToast(`Ejecutando sincronización inmediata para "${job.name}"...`, 'success')}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-indigo-600" />
                <span>Sincronizar Ahora</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
