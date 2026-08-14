import React, { useState } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Database,
  Trash2,
  Lock
} from 'lucide-react';
import { MigrationLog } from './types';
import { useToast } from '../../context/ToastContext';
import { CustomSelect } from '../../components/CustomSelect';

interface RollbackTabProps {
  logs: MigrationLog[];
  onRollbackExecute: (logId: string) => void;
}

export const RollbackTab: React.FC<RollbackTabProps> = ({ logs, onRollbackExecute }) => {
  const { addToast } = useToast();
  const [selectedLogId, setSelectedLogId] = useState<string>(logs.find(l => l.canRollback)?.id || '');
  const [confirmText, setConfirmText] = useState<string>('');

  const targetLog = logs.find(l => l.id === selectedLogId);

  const handleRollback = () => {
    if (confirmText !== 'REVERTIR') {
      addToast('Escriba "REVERTIR" para confirmar la operación de reversión', 'warning');
      return;
    }

    if (targetLog) {
      onRollbackExecute(targetLog.id);
      addToast(`Migración ${targetLog.id} revertida exitosamente. Registros eliminados de la base de datos.`, 'success');
      setConfirmText('');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white rounded-2xl p-6 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-semibold backdrop-blur-md">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Centro de Reversión y Restauración Segura</span>
        </div>
        <h3 className="text-xl font-extrabold">Revertir Migración Completa</h3>
        <p className="text-rose-200 text-xs leading-relaxed">
          Permite deshacer por completo una importación reciente en caso de errores en la información original o inconsistencias.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Seleccione el Lote de Migración a Revertir</label>
          <CustomSelect
            value={selectedLogId}
            onChange={(e) => setSelectedLogId(e)}
            className="w-full font-bold font-mono"
            options={logs.filter(l => l.canRollback && l.status !== 'Revertida').map((l) => ({
              value: l.id,
              label: `${l.id} - ${l.method} (${l.recordsImported} reg. importados el ${l.timestamp})`
            }))}
          />
        </div>

        {targetLog && (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Resumen del Lote Seleccionado</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <p className="text-slate-400">Origen</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{targetLog.sourceSystem}</p>
              </div>
              <div>
                <p className="text-slate-400">Registros Importados</p>
                <p className="font-bold text-emerald-600">{targetLog.recordsImported}</p>
              </div>
              <div>
                <p className="text-slate-400">Usuario</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{targetLog.userName}</p>
              </div>
              <div>
                <p className="text-slate-400">Estado</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{targetLog.status}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Advertencia de Impacto</span>
              </p>
              <p>Al revertir este lote, todos los clientes, préstamos y pagos asociados creados durante esta migración serán eliminados del sistema UltraMoney.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Escriba <span className="text-rose-600 font-mono font-extrabold">REVERTIR</span> para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="REVERTIR"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm uppercase"
              />
            </div>

            <button
              onClick={handleRollback}
              disabled={confirmText !== 'REVERTIR'}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ejecutar Reversión Completa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
