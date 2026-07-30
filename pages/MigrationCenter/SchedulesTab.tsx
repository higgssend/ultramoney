import React from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Bell, 
  Play, 
  CheckCircle2, 
  XCircle,
  Sliders
} from 'lucide-react';
import { ScheduleJob } from './types';
import { useToast } from '../../context/ToastContext';

interface SchedulesTabProps {
  schedules: ScheduleJob[];
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({ schedules }) => {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Programación de Migraciones Automáticas</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Programe tareas periódicas (Diarias, Semanales, Mensuales) con notificaciones automáticas.
          </p>
        </div>
        <button
          onClick={() => addToast('Nueva programación creada', 'success')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Programación</span>
        </button>
      </div>

      {/* Schedules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((sch) => (
          <div
            key={sch.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  {sch.frequency}
                </span>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-base mt-2">{sch.name}</h4>
                <p className="text-xs text-slate-500">Método: {sch.method}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-xs font-bold">
                {sch.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-mono">
              <p><span className="text-slate-400">Hora / Horario:</span> {sch.time}</p>
              <p><span className="text-slate-400">Zona Horaria:</span> {sch.timezone}</p>
              <p><span className="text-slate-400">Notificar a:</span> {sch.notifyEmail}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => addToast(`Ejecutando tarea programada "${sch.name}"...`, 'info')}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-indigo-600" />
                <span>Ejecutar Ahora</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
