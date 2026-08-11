import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Play, 
  Server, 
  RotateCw, 
  FileCode, 
  Clock, 
  History, 
  RotateCcw, 
  Globe, 
  Sparkles,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

import { insforge } from '../../lib/insforge';
import { 
  Connector, 
  MigrationLog, 
  MigrationTemplate, 
  SyncJob, 
  ScheduleJob 
} from './types';
import { DashboardTab } from './DashboardTab';
import { MigrationWizard } from './MigrationWizard';
import { ConnectorsTab } from './ConnectorsTab';
import { SyncTab } from './SyncTab';
import { TemplatesTab } from './TemplatesTab';
import { SchedulesTab } from './SchedulesTab';
import { HistoryTab } from './HistoryTab';
import { RollbackTab } from './RollbackTab';
import { ApiDocsTab } from './ApiDocsTab';
import { useToast } from '../../context/ToastContext';

export type MigrationTabKey = 
  | 'dashboard' 
  | 'wizard' 
  | 'connectors' 
  | 'sync' 
  | 'templates' 
  | 'schedules' 
  | 'history' 
  | 'rollback' 
  | 'api';

const MigrationCenter: React.FC = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<MigrationTabKey>('dashboard');

  // Module persistent local state
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [templates, setTemplates] = useState<MigrationTemplate[]>([]);
  const [schedules, setSchedules] = useState<ScheduleJob[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) return;
      const { data, error } = await insforge.database.from('migration_history').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false });
      if (!error && data) {
        setLogs(data.map(d => ({
          id: d.id,
          timestamp: new Date(d.created_at).toLocaleString(),
          userId: d.user_id,
          userName: 'Admin',
          method: 'CSV/Excel',
          sourceSystem: d.file_name,
          status: d.status,
          durationSeconds: 5,
          recordsRead: d.records_processed + d.records_failed,
          recordsImported: d.records_processed,
          recordsUpdated: 0,
          recordsOmitted: 0,
          recordsFailed: d.records_failed,
          canRollback: false
        })));
      }
    };
    fetchLogs();
  }, []);

  // Actions
  const handleAddConnector = (newConn: Connector) => {
    setConnectors([newConn, ...connectors]);
  };

  const handleToggleSyncStatus = (id: string) => {
    setSyncJobs(syncJobs.map(j => j.id === id ? { ...j, status: j.status === 'Activo' ? 'Pausado' : 'Activo' } : j));
    addToast('Estado de sincronización actualizado', 'info');
  };

  const handleApplyTemplate = (template: MigrationTemplate) => {
    setActiveTab('wizard');
    addToast(`Plantilla "${template.name}" cargada en el Asistente`, 'success');
  };

  const handleRollbackExecute = (logId: string) => {
    setLogs(logs.map(l => l.id === logId ? { ...l, status: 'Revertida', canRollback: false } : l));
  };

  const handleWizardComplete = async (newLog: MigrationLog) => {
    setLogs([newLog, ...logs]);
    setActiveTab('dashboard');
    // Save to DB
    const { data: userData } = await insforge.auth.getCurrentUser();
    if(userData?.user) {
      await insforge.database.from('migration_history').insert([{
        user_id: userData.user.id,
        file_name: newLog.sourceSystem,
        entity_type: 'clientes',
        status: newLog.status,
        records_processed: newLog.recordsImported,
        records_failed: newLog.recordsFailed
      }]);
    }
  };

  const navTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'wizard', label: 'Asistente de Migración', icon: Play, highlight: true },
    { key: 'connectors', label: 'Conectores', icon: Server },
    { key: 'sync', label: 'Sincronización', icon: RotateCw },
    { key: 'templates', label: 'Plantillas', icon: FileCode },
    { key: 'schedules', label: 'Programación', icon: Clock },
    { key: 'history', label: 'Historial', icon: History },
    { key: 'rollback', label: 'Reversión', icon: RotateCcw },
    { key: 'api', label: 'API & Seguridad', icon: Globe }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Administración</span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Centro de Migración</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              <Database className="w-7 h-7" />
            </div>
            <span>Centro de Migración de Datos</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Traslado seguro, rápido y controlado de datos desde cualquier sistema externo hacia UltraMoney.
          </p>
        </div>

        {/* Action Button */}
        {activeTab !== 'wizard' && (
          <button
            onClick={() => setActiveTab('wizard')}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Asistente (8 Pasos)</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide pb-2">
        {navTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.key;
          const highlight = (tab as any).highlight;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as MigrationTabKey)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap
                ${isActive 
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                ${highlight && !isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}
              `}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-600' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View Content */}
      <div className="pt-2">
        {activeTab === 'dashboard' && (
          <DashboardTab
            logs={logs}
            connectors={connectors}
            onStartWizard={() => setActiveTab('wizard')}
            onOpenConnectors={() => setActiveTab('connectors')}
            onOpenSync={() => setActiveTab('sync')}
          />
        )}

        {activeTab === 'wizard' && (
          <MigrationWizard
            onComplete={handleWizardComplete}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'connectors' && (
          <ConnectorsTab
            connectors={connectors}
            onAddConnector={handleAddConnector}
          />
        )}

        {activeTab === 'sync' && (
          <SyncTab
            syncJobs={syncJobs}
            onToggleStatus={handleToggleSyncStatus}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesTab
            templates={templates}
            onApplyTemplate={handleApplyTemplate}
          />
        )}

        {activeTab === 'schedules' && (
          <SchedulesTab
            schedules={schedules}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            logs={logs}
            onRollbackClick={(log) => {
              setActiveTab('rollback');
            }}
          />
        )}

        {activeTab === 'rollback' && (
          <RollbackTab
            logs={logs}
            onRollbackExecute={handleRollbackExecute}
          />
        )}

        {activeTab === 'api' && (
          <ApiDocsTab />
        )}
      </div>
    </div>
  );
};

export default MigrationCenter;
