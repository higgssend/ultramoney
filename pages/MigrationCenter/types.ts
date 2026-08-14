export type MigrationMethod = 'excel' | 'csv' | 'database' | 'api' | 'backup' | 'sheets' | 'manual';

export type MigrationSourceType = 
  | 'purpura' 
  | 'custom_erp' 
  | 'excel' 
  | 'csv' 
  | 'sqlserver' 
  | 'mysql' 
  | 'postgres' 
  | 'mariadb' 
  | 'sqlite' 
  | 'rest_api' 
  | 'backup_zip' 
  | 'google_sheets' 
  | 'manual';

export type MigrationTargetEntity = 
  | 'clientes' 
  | 'prestamos' 
  | 'pagos' 
  | 'garantias' 
  | 'cobradores' 
  | 'usuarios' 
  | 'caja' 
  | 'gastos' 
  | 'documentos' 
  | 'contratos' 
  | 'referencias' 
  | 'notas' 
  | 'historial'
  | 'rutas'
  | 'cuentas_bancarias'
  | 'solicitudes_prestamo'
  | 'productos_prestamo'
  | 'cargos'
  | 'roles'
  | 'empleados';

export type TransformRule = 
  | 'none' 
  | 'uppercase' 
  | 'lowercase' 
  | 'format_date' 
  | 'currency_to_decimal' 
  | 'clean_number' 
  | 'trim';

export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  entity: MigrationTargetEntity;
  transformRule?: TransformRule;
  sampleValue?: string;
  isRequired?: boolean;
}

export type DuplicateStrategy = 'ignore' | 'update' | 'merge' | 'create_new' | 'ask';

export type MigrationPrimitive = string | number | boolean | null | undefined;

export interface ValidationIssue {
  id: string;
  rowIndex: number;
  entity: string;
  field: string;
  value: MigrationPrimitive;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface PreviewRecord {
  id: string;
  rowIndex: number;
  entity: MigrationTargetEntity;
  sourceData: Record<string, MigrationPrimitive>;
  mappedData: Record<string, MigrationPrimitive>;
  status: 'valid' | 'warning' | 'error';
  issues: ValidationIssue[];
  isSelected: boolean;
}

export interface MigrationLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  method: string;
  sourceSystem: string;
  status: 'Completada' | 'Completada con Advertencias' | 'Fallida' | 'En Progreso' | 'Revertida';
  durationSeconds: number;
  recordsRead: number;
  recordsImported: number;
  recordsUpdated: number;
  recordsOmitted: number;
  recordsFailed: number;
  notes?: string;
  canRollback: boolean;
}

export interface Connector {
  id: string;
  name: string;
  category: 'Software a Medida' | 'ERP Financiero' | 'Sistema Contable' | 'App Web' | 'App Desktop' | 'Púrpura Datos';
  driver: string;
  server?: string;
  database?: string;
  username?: string;
  apiUrl?: string;
  status: 'Conectado' | 'Desconectado' | 'Configuración Pendiente';
  lastSync?: string;
  mappingsCount: number;
  rulesCount: number;
  icon?: string;
}

export interface SyncJob {
  id: string;
  name: string;
  sourceSystem: string;
  frequency: 'Cada 15 min' | 'Cada Hora' | 'Diario' | 'Semanal';
  mode: 'Solo Lectura' | 'Bidireccional' | 'Solo Importar Cambios';
  lastSync: string;
  nextSync: string;
  status: 'Activo' | 'Pausado' | 'Error';
  recordsSynced: number;
}

export interface MigrationTemplate {
  id: string;
  name: string;
  sourceSystem: string;
  entities: MigrationTargetEntity[];
  mappings: FieldMapping[];
  duplicateStrategy: DuplicateStrategy;
  createdDate: string;
}

export interface ScheduleJob {
  id: string;
  name: string;
  method: string;
  frequency: 'Una vez' | 'Diaria' | 'Semanal' | 'Mensual';
  time: string;
  timezone: string;
  notifyEmail: string;
  status: 'Programado' | 'Pausado';
}
