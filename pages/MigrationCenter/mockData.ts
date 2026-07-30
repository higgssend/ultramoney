import { 
  Connector, 
  MigrationLog, 
  MigrationTemplate, 
  SyncJob, 
  ScheduleJob, 
  FieldMapping,
  PreviewRecord
} from './types';

export const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'conn-1',
    name: 'Púrpura Datos - Servidor Principal',
    category: 'Púrpura Datos',
    driver: 'SQL Server Native',
    server: '192.168.1.150:1433',
    database: 'PurpuraFinance_Prod',
    username: 'sa_migracion',
    status: 'Conectado',
    lastSync: '2026-07-28 14:30',
    mappingsCount: 42,
    rulesCount: 12
  },
  {
    id: 'conn-2',
    name: 'ERP Financiero COOP',
    category: 'ERP Financiero',
    driver: 'PostgreSQL 14',
    server: 'db.coopfinanciera.do',
    database: 'core_banking',
    username: 'read_only_user',
    status: 'Conectado',
    lastSync: '2026-07-25 09:15',
    mappingsCount: 38,
    rulesCount: 8
  },
  {
    id: 'conn-3',
    name: 'API Rest Legada de Cobros',
    category: 'App Web',
    driver: 'REST API v2 (Bearer)',
    apiUrl: 'https://api.sistema-legacy-cobros.com/v1',
    status: 'Conectado',
    lastSync: '2026-07-29 18:00',
    mappingsCount: 25,
    rulesCount: 5
  },
  {
    id: 'conn-4',
    name: 'Sistema Contable FoxPro Desktop',
    category: 'App Desktop',
    driver: 'ODBC DBF / SQLite Bridge',
    server: 'C:\\LegacyData\\CREDIT.DBC',
    status: 'Desconectado',
    lastSync: '2026-06-10 11:20',
    mappingsCount: 18,
    rulesCount: 3
  },
  {
    id: 'conn-5',
    name: 'Software Medida Express Loan',
    category: 'Software a Medida',
    driver: 'MySQL 8.0',
    server: 'localhost:3306',
    database: 'express_loans_db',
    username: 'root',
    status: 'Configuración Pendiente',
    mappingsCount: 0,
    rulesCount: 0
  }
];

export const INITIAL_MIGRATION_LOGS: MigrationLog[] = [
  {
    id: 'MIG-2026-004',
    timestamp: '2026-07-28 14:45:10',
    userId: 'usr-1',
    userName: 'Carlos Rodríguez (Admin)',
    method: 'Base de Datos (SQL Server)',
    sourceSystem: 'Púrpura Datos',
    status: 'Completada',
    durationSeconds: 142,
    recordsRead: 1250,
    recordsImported: 1242,
    recordsUpdated: 8,
    recordsOmitted: 0,
    recordsFailed: 0,
    notes: 'Migración masiva exitosa de cartera histórica 2024-2026.',
    canRollback: true
  },
  {
    id: 'MIG-2026-003',
    timestamp: '2026-07-20 10:12:05',
    userId: 'usr-1',
    userName: 'Carlos Rodríguez (Admin)',
    method: 'Importación Excel',
    sourceSystem: 'Plantilla BHD Cobros.xlsx',
    status: 'Completada con Advertencias',
    durationSeconds: 45,
    recordsRead: 340,
    recordsImported: 332,
    recordsUpdated: 0,
    recordsOmitted: 5,
    recordsFailed: 3,
    notes: '3 registros rechazados por cédula inválida, 5 omitidos por duplicado.',
    canRollback: true
  },
  {
    id: 'MIG-2026-002',
    timestamp: '2026-07-12 16:30:22',
    userId: 'usr-2',
    userName: 'Maria Santos (Supervisora)',
    method: 'API REST',
    sourceSystem: 'Sistema Legado Cobros',
    status: 'Completada',
    durationSeconds: 88,
    recordsRead: 890,
    recordsImported: 890,
    recordsUpdated: 0,
    recordsOmitted: 0,
    recordsFailed: 0,
    notes: 'Sincronización mensual de pagos y cuotas.',
    canRollback: true
  },
  {
    id: 'MIG-2026-001',
    timestamp: '2026-06-30 09:00:15',
    userId: 'usr-1',
    userName: 'Carlos Rodríguez (Admin)',
    method: 'Backup (SQLite)',
    sourceSystem: 'Respaldo_Junio_Ultra.sqlite',
    status: 'Revertida',
    durationSeconds: 62,
    recordsRead: 500,
    recordsImported: 0,
    recordsUpdated: 0,
    recordsOmitted: 0,
    recordsFailed: 0,
    notes: 'Revertida manualmente por el usuario tras inconsistencia en cuotas.',
    canRollback: false
  }
];

export const INITIAL_SYNC_JOBS: SyncJob[] = [
  {
    id: 'sync-1',
    name: 'Sincronización Diaria Púrpura -> UltraMoney',
    sourceSystem: 'Púrpura Datos',
    frequency: 'Diario',
    mode: 'Solo Importar Cambios',
    lastSync: '2026-07-29 04:00 AM',
    nextSync: '2026-07-30 04:00 AM',
    status: 'Activo',
    recordsSynced: 154
  },
  {
    id: 'sync-2',
    name: 'Sync Pagos API Webhook',
    sourceSystem: 'API Rest Legada',
    frequency: 'Cada 15 min',
    mode: 'Bidireccional',
    lastSync: '2026-07-29 22:30 PM',
    nextSync: '2026-07-29 22:45 PM',
    status: 'Activo',
    recordsSynced: 42
  }
];

export const INITIAL_TEMPLATES: MigrationTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Plantilla Púrpura Datos Estándar',
    sourceSystem: 'Púrpura Datos',
    entities: ['clientes', 'prestamos', 'pagos', 'caja'],
    duplicateStrategy: 'update',
    createdDate: '2026-05-15',
    mappings: [
      { id: 'm1', sourceField: 'cliente_nombre', targetField: 'name', entity: 'clientes', transformRule: 'uppercase', sampleValue: 'JUAN PEREZ' },
      { id: 'm2', sourceField: 'ced', targetField: 'cedula', entity: 'clientes', transformRule: 'clean_number', sampleValue: '00112345678' },
      { id: 'm3', sourceField: 'telefono1', targetField: 'phone', entity: 'clientes', transformRule: 'clean_number', sampleValue: '8095550199' },
      { id: 'm4', sourceField: 'capital_prestamo', targetField: 'amount', entity: 'prestamos', transformRule: 'currency_to_decimal', sampleValue: '50000.00' },
      { id: 'm5', sourceField: 'tasa_interes', targetField: 'interestRate', entity: 'prestamos', transformRule: 'clean_number', sampleValue: '12' },
      { id: 'm6', sourceField: 'fecha_inicio', targetField: 'startDate', entity: 'prestamos', transformRule: 'format_date', sampleValue: '2026-01-10' }
    ]
  },
  {
    id: 'tpl-2',
    name: 'Plantilla Excel Generica Clientes',
    sourceSystem: 'Excel / CSV',
    entities: ['clientes'],
    duplicateStrategy: 'ignore',
    createdDate: '2026-06-20',
    mappings: [
      { id: 'm7', sourceField: 'Nombre Completo', targetField: 'name', entity: 'clientes', transformRule: 'uppercase' },
      { id: 'm8', sourceField: 'No. Documento / Cédula', targetField: 'cedula', entity: 'clientes', transformRule: 'clean_number' },
      { id: 'm9', sourceField: 'Celular Contacto', targetField: 'phone', entity: 'clientes', transformRule: 'clean_number' },
      { id: 'm10', sourceField: 'Dirección Residencia', targetField: 'address', entity: 'clientes', transformRule: 'trim' }
    ]
  }
];

export const INITIAL_SCHEDULES: ScheduleJob[] = [
  {
    id: 'sched-1',
    name: 'Respaldo & Migración Nocturna',
    method: 'Base de Datos SQL Server',
    frequency: 'Diaria',
    time: '02:00 AM',
    timezone: 'America/Santo_Domingo (UTC-4)',
    notifyEmail: 'admin@ultramoney.com',
    status: 'Programado'
  },
  {
    id: 'sched-2',
    name: 'Importación Semanal Excel Cobradores',
    method: 'Google Sheets',
    frequency: 'Semanal',
    time: 'Lunes 07:00 AM',
    timezone: 'America/Santo_Domingo (UTC-4)',
    notifyEmail: 'operaciones@ultramoney.com',
    status: 'Programado'
  }
];

export const SAMPLE_SOURCE_FIELDS: Record<string, { field: string; sample: string; suggestedTarget: string }[]> = {
  clientes: [
    { field: 'cli_id', sample: 'CL-9021', suggestedTarget: 'clientCode' },
    { field: 'cliente_nombre', sample: 'JUAN ALBERTO ALMANZAR', suggestedTarget: 'name' },
    { field: 'cedula_rnc', sample: '001-1827364-5', suggestedTarget: 'cedula' },
    { field: 'telefono_movil', sample: '(809) 481-9920', suggestedTarget: 'phone' },
    { field: 'correo_electronico', sample: 'juan.almanzar@email.com', suggestedTarget: 'email' },
    { field: 'direccion_calle', sample: 'Av. Winston Churchill #45, Edif. Blue', suggestedTarget: 'address' },
    { field: 'provincia_sector', sample: 'Santo Domingo / Piantini', suggestedTarget: 'province' },
    { field: 'ocupacion_labor', sample: 'Ingeniero de Software', suggestedTarget: 'occupation' },
    { field: 'ingreso_mensual', sample: 'RD$ 85,000.00', suggestedTarget: 'income' },
    { field: 'fecha_registro', sample: '15/03/2025', suggestedTarget: 'joinedDate' }
  ],
  prestamos: [
    { field: 'cod_prestamo', sample: 'PR-88402', suggestedTarget: 'id' },
    { field: 'cli_cedula', sample: '001-1827364-5', suggestedTarget: 'clientId' },
    { field: 'capital_otorgado', sample: 'RD$ 150,000.00', suggestedTarget: 'amount' },
    { field: 'porcentaje_interes', sample: '10.5%', suggestedTarget: 'interestRate' },
    { field: 'plazo_semanas', sample: '16', suggestedTarget: 'durationWeeks' },
    { field: 'modalidad_pago', sample: 'Quincenal', suggestedTarget: 'frequency' },
    { field: 'tipo_prestamo', sample: 'Amortizado', suggestedTarget: 'loanType' },
    { field: 'fecha_desembolso', sample: '2026-02-01', suggestedTarget: 'startDate' },
    { field: 'gastos_cierre', sample: '3500', suggestedTarget: 'closingCost' }
  ],
  pagos: [
    { field: 'num_recibo', sample: 'REC-99102', suggestedTarget: 'id' },
    { field: 'cod_prestamo', sample: 'PR-88402', suggestedTarget: 'loanId' },
    { field: 'monto_pagado', sample: 'RD$ 12,500.00', suggestedTarget: 'amount' },
    { field: 'fecha_pago', sample: '2026-07-15', suggestedTarget: 'paymentDate' },
    { field: 'tipo_cuota', sample: 'Mixto', suggestedTarget: 'paymentType' },
    { field: 'forma_pago', sample: 'Transferencia', suggestedTarget: 'paymentMethod' },
    { field: 'nota_observacion', sample: 'Pago cuota 4 de 8 por Banreservas', suggestedTarget: 'note' }
  ],
  garantias: [
    { field: 'garantia_tipo', sample: 'Vehículo', suggestedTarget: 'type' },
    { field: 'descripcion_bien', sample: 'Toyota Corolla 2020 Blanco', suggestedTarget: 'description' },
    { field: 'num_matricula_chasis', sample: 'CHAS-9938210392', suggestedTarget: 'refNumber' },
    { field: 'valor_tasacion', sample: 'RD$ 650,000.00', suggestedTarget: 'estimatedValue' }
  ]
};

export const DEFAULT_PREVIEW_RECORDS: PreviewRecord[] = [
  {
    id: 'prev-1',
    rowIndex: 1,
    entity: 'clientes',
    sourceData: {
      cli_id: 'CL-101',
      cliente_nombre: 'RAMON EMILIO MERCEDES',
      cedula_rnc: '001-0982341-2',
      telefono_movil: '809-555-8822',
      correo_electronico: 'ramon.mercedes@gmail.com',
      direccion_calle: 'Calle Del Sol #12, Santiago',
      ingreso_mensual: '45000'
    },
    mappedData: {
      name: 'RAMON EMILIO MERCEDES',
      cedula: '00109823412',
      phone: '8095558822',
      email: 'ramon.mercedes@gmail.com',
      address: 'Calle Del Sol #12, Santiago',
      income: 45000,
      occupation: 'Comerciante',
      sex: 'Masculino',
      creditScore: 85,
      status: 'Activo'
    },
    status: 'valid',
    issues: [],
    isSelected: true
  },
  {
    id: 'prev-2',
    rowIndex: 2,
    entity: 'clientes',
    sourceData: {
      cli_id: 'CL-102',
      cliente_nombre: 'LUISA ALTAGRACIA ROJAS',
      cedula_rnc: '002-0043128-9',
      telefono_movil: '829-432-1100',
      correo_electronico: 'luisa.rojas@hotmail.com',
      direccion_calle: 'Av. Independencia #88, Santo Domingo',
      ingreso_mensual: '60000'
    },
    mappedData: {
      name: 'LUISA ALTAGRACIA ROJAS',
      cedula: '00200431289',
      phone: '8294321100',
      email: 'luisa.rojas@hotmail.com',
      address: 'Av. Independencia #88, Santo Domingo',
      income: 60000,
      occupation: 'Docente',
      sex: 'Femenino',
      creditScore: 90,
      status: 'Activo'
    },
    status: 'valid',
    issues: [],
    isSelected: true
  },
  {
    id: 'prev-3',
    rowIndex: 3,
    entity: 'clientes',
    sourceData: {
      cli_id: 'CL-103',
      cliente_nombre: 'PEDRO JOSE GUZMAN',
      cedula_rnc: '001-0982341-2', // Duplicate cedula warning!
      telefono_movil: '809-999-1212',
      correo_electronico: 'pedro.guzman@gmail.com',
      direccion_calle: 'C/ Principal #4',
      ingreso_mensual: '32000'
    },
    mappedData: {
      name: 'PEDRO JOSE GUZMAN',
      cedula: '00109823412',
      phone: '8099991212',
      email: 'pedro.guzman@gmail.com',
      address: 'C/ Principal #4',
      income: 32000,
      occupation: 'Técnico',
      sex: 'Masculino',
      creditScore: 70,
      status: 'Activo'
    },
    status: 'warning',
    issues: [
      {
        id: 'iss-1',
        rowIndex: 3,
        entity: 'clientes',
        field: 'cedula',
        value: '00109823412',
        severity: 'warning',
        code: 'DUP_CEDULA',
        message: 'Cédula coincide con otro registro en el lote actual (Fila 1).'
      }
    ],
    isSelected: true
  },
  {
    id: 'prev-4',
    rowIndex: 4,
    entity: 'prestamos',
    sourceData: {
      cod_prestamo: 'PR-901',
      cli_cedula: '00109823412',
      capital_otorgado: 'RD$ 100,000.00',
      porcentaje_interes: '10%',
      plazo_semanas: '12',
      modalidad_pago: 'Mensual',
      tipo_prestamo: 'Amortizado',
      fecha_desembolso: '2026-03-01'
    },
    mappedData: {
      id: 'PR-901',
      clientId: '00109823412',
      clientName: 'RAMON EMILIO MERCEDES',
      amount: 100000,
      interestRate: 10,
      durationWeeks: 12,
      frequency: 'Mensual',
      loanType: 'Amortizado',
      startDate: '2026-03-01',
      closingCost: 2500,
      totalToPay: 110000,
      remainingBalance: 110000,
      nextPaymentDate: '2026-04-01'
    },
    status: 'valid',
    issues: [],
    isSelected: true
  },
  {
    id: 'prev-5',
    rowIndex: 5,
    entity: 'prestamos',
    sourceData: {
      cod_prestamo: 'PR-902',
      cli_cedula: '99999999999', // Missing client error!
      capital_otorgado: '-5000', // Invalid amount
      porcentaje_interes: '12',
      plazo_semanas: '4',
      modalidad_pago: 'Semanal',
      tipo_prestamo: 'Rédito',
      fecha_desembolso: '2026-05-10'
    },
    mappedData: {
      id: 'PR-902',
      clientId: '99999999999',
      clientName: 'Cliente No Encontrado',
      amount: -5000,
      interestRate: 12,
      durationWeeks: 4,
      frequency: 'Semanal',
      loanType: 'Rédito',
      startDate: '2026-05-10'
    },
    status: 'error',
    issues: [
      {
        id: 'iss-2',
        rowIndex: 5,
        entity: 'prestamos',
        field: 'clientId',
        value: '99999999999',
        severity: 'error',
        code: 'ORPHAN_LOAN',
        message: 'El cliente asociado no existe en UltraMoney ni en este lote.'
      },
      {
        id: 'iss-3',
        rowIndex: 5,
        entity: 'prestamos',
        field: 'amount',
        value: -5000,
        severity: 'error',
        code: 'INVALID_AMOUNT',
        message: 'El capital debe ser un número positivo mayor que cero.'
      }
    ],
    isSelected: false
  }
];
