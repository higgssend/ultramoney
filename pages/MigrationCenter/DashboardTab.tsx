import React from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  FileCheck, 
  FileX, 
  Wrench, 
  Zap, 
  Sparkles,
  Play,
  RotateCw,
  Server,
  Download,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { MigrationLog, Connector } from './types';

interface DashboardTabProps {
  logs: MigrationLog[];
  connectors: Connector[];
  onStartWizard: () => void;
  onOpenConnectors: () => void;
  onOpenSync: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  logs,
  connectors,
  onStartWizard,
  onOpenConnectors,
  onOpenSync
}) => {
  // Compute KPI statistics
  const totalMigrations = logs.length;
  const successfulMigrations = logs.filter(l => l.status === 'Completada').length;
  const errorMigrations = logs.filter(l => l.status === 'Completada con Advertencias' || l.status === 'Fallida').length;
  const lastMigration = logs.length > 0 ? logs[0].timestamp : 'Sin registros';
  
  const totalImported = logs.reduce((acc, l) => acc + l.recordsImported, 0);
  const totalRejected = logs.reduce((acc, l) => acc + l.recordsFailed + l.recordsOmitted, 0);
  const totalCorrected = logs.reduce((acc, l) => acc + l.recordsUpdated, 0);
  
  const avgTimeSeconds = logs.length > 0
    ? Math.round(logs.reduce((acc, l) => acc + l.durationSeconds, 0) / logs.length)
    : 0;

  const connectedCount = connectors.filter(c => c.status === 'Conectado').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Callout */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Centro Universal de Migración & Sync</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Traslade toda su información a UltraMoney
            </h2>
            <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
              Importación rápida, segura y controlada desde Excel, CSV, SQL Server, MySQL, PostgreSQL, APIs REST o conectores de mercado como Púrpura Datos.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onStartWizard}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Nueva Migración</span>
            </button>
            <button
              onClick={onOpenConnectors}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Server className="w-4 h-4 text-indigo-300" />
              <span>Ver Conectores</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (8 Specific Indicators from PRD) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Migraciones */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Migraciones</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{totalMigrations}</p>
          <p className="text-xs text-slate-500 mt-1">Ejecutadas en el sistema</p>
        </div>

        {/* Migraciones Exitosas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Exitosas</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{successfulMigrations}</p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            {totalMigrations > 0 ? Math.round((successfulMigrations / totalMigrations) * 100) : 0}% de efectividad
          </p>
        </div>

        {/* Migraciones con Errores */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Con Errores/Obs</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{errorMigrations}</p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Requieren atención</p>
        </div>

        {/* Última Migración */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Última Migración</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{lastMigration}</p>
          <p className="text-xs text-slate-500 mt-1">Fecha & Hora</p>
        </div>

        {/* Registros Importados */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reg. Importados</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{totalImported.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Clientes, préstamos, pagos</p>
        </div>

        {/* Registros Rechazados */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reg. Rechazados</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <FileX className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{totalRejected.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Duplicados o inválidos</p>
        </div>

        {/* Registros Corregidos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reg. Corregidos</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{totalCorrected.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Actualizados por reglas</p>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tiempo Promedio</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">{avgTimeSeconds}s</p>
          <p className="text-xs text-slate-500 mt-1">Por lote de migración</p>
        </div>
      </div>

      {/* Middle Grid: System Status & Connectors Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Connectors Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-800 dark:text-white">Conectores Activos</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              {connectedCount} / {connectors.length} Conectados
            </span>
          </div>
          
          <div className="space-y-3">
            {connectors.slice(0, 3).map((conn) => (
              <div 
                key={conn.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm"
              >
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{conn.name}</p>
                  <p className="text-xs text-slate-500">{conn.category} • {conn.driver}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  conn.status === 'Conectado'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {conn.status}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenConnectors}
            className="w-full mt-4 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Gestionar Conectores y Credenciales</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Security & Integrity Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-800 dark:text-white">Garantía de Seguridad</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Copia de Seguridad Automática</p>
                <p className="text-slate-500">Se genera un punto de restauración pre-migración automáticamente.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Integridad Referencial</p>
                <p className="text-slate-500">Validación en cascada: Cliente → Préstamos → Cuotas → Pagos → Caja.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Detección de Duplicados</p>
                <p className="text-slate-500">Comparación multinivel por Cédula, RNC, Código, Teléfono y Email.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Utilities / Download Templates */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-slate-800 dark:text-white">Plantillas Oficiales</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Descargue los archivos de ejemplo en formato Excel o CSV listos para estructurar su información.
          </p>

          <div className="space-y-2">
            <a
              href="#excel-template"
              onClick={() => {
                toast.success('Descargando Plantilla Excel Oficial UltraMoney_Migracion_Plantilla.xlsx');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Plantilla Excel (.xlsx) Clientes & Préstamos</span>
              <Download className="w-4 h-4" />
            </a>

            <a
              href="#csv-template"
              onClick={() => {
                toast.success('Descargando Plantilla CSV Oficial UltraMoney_Clientes_CSV.csv');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Plantilla CSV UTF-8 (Separador Coma / Punto y coma)</span>
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={onOpenSync}
              className="w-full mt-2 py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Configurar Sincronización Temporal</span>
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Migrations History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Historial Reciente de Migraciones</h3>
            <p className="text-xs text-slate-500">Últimas ejecuciones de importación y sincronización</p>
          </div>
          <button
            onClick={onStartWizard}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Iniciar Asistente</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3 px-4">ID / Fecha</th>
                <th className="py-3 px-4">Método & Origen</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4 text-center">Registros (Imp/Error)</th>
                <th className="py-3 px-4">Tiempo</th>
                <th className="py-3 px-4 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{log.id}</p>
                    <p className="text-xs text-slate-400">{log.timestamp}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{log.method}</p>
                    <p className="text-xs text-slate-500">{log.sourceSystem}</p>
                  </td>
                  <td className="py-3 px-4 text-xs">{log.userName}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{log.recordsImported}</span>
                    {log.recordsFailed > 0 && (
                      <span className="text-rose-500 font-bold ml-1">/ {log.recordsFailed} err</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">{log.durationSeconds}s</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                      log.status === 'Completada'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : log.status === 'Completada con Advertencias'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : log.status === 'Revertida'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {log.status}
                    </span>
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
