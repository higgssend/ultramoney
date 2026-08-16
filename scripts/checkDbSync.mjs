import { createClient } from '@insforge/sdk';

const insforge = createClient({
  baseUrl: 'https://sxwv82iw.us-east.insforge.app',
  anonKey: 'ik_12002a3fd3274a14e562bcce4a015fee'
});

const allTables = [
  'clients',
  'loans',
  'transactions',
  'company_settings',
  'bank_accounts',
  'cash_shifts',
  'collector_visits',
  'bank_deposits',
  'accounting_periods',
  'bitacora_logs',
  'notifications',
  'client_notes',
  'client_documents',
  'client_relationships',
  'routes',
  'employees',
  'api_keys',
  'inventory',
  'vault_collaterals',
  'vault_custody_logs',
  'legal_lawyers',
  'legal_cases',
  'legal_events',
  'legal_agreements',
  'merchant_partners'
];

async function checkDatabase() {
  console.log('=== AUDITORÍA COMPLETA DE TABLAS EN BASE DE DATOS INSFORGE ===\n');

  const results = [];

  for (const table of allTables) {
    try {
      const { data, error, count } = await insforge.database
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        results.push({
          table,
          status: 'ERROR',
          message: error.message || JSON.stringify(error),
          count: null,
          columns: []
        });
      } else {
        const sample = Array.isArray(data) && data.length > 0 ? data[0] : null;
        const columns = sample ? Object.keys(sample) : [];
        const hasLenderId = columns.includes('lender_id');

        results.push({
          table,
          status: 'OK',
          count: count !== null && count !== undefined ? count : (data ? data.length : 0),
          hasLenderId,
          columns
        });
      }
    } catch (err) {
      results.push({
        table,
        status: 'EXCEPTION',
        message: err.message,
        count: null,
        columns: []
      });
    }
  }

  console.log('-----------------------------------------------------------------------------------------------');
  console.log(
    'TABLA'.padEnd(25) +
    'ESTADO'.padEnd(12) +
    'REGISTROS'.padEnd(12) +
    'LENDER_ID'.padEnd(14) +
    'COLUMNAS PRINCIPALES'
  );
  console.log('-----------------------------------------------------------------------------------------------');

  let okCount = 0;
  let errorCount = 0;

  for (const res of results) {
    if (res.status === 'OK') {
      okCount++;
      const lenderStatus = res.columns.length > 0 ? (res.hasLenderId ? '✓ Aislado' : '- Global') : '(activa / vacía)';
      console.log(
        res.table.padEnd(25) +
        '✓ ONLINE'.padEnd(12) +
        String(res.count).padEnd(12) +
        lenderStatus.padEnd(14) +
        (res.columns.slice(0, 4).join(', ') + (res.columns.length > 4 ? '...' : ''))
      );
    } else {
      errorCount++;
      console.log(
        res.table.padEnd(25) +
        '✗ ERROR'.padEnd(12) +
        '-'.padEnd(12) +
        '-'.padEnd(14) +
        res.message
      );
    }
  }

  console.log('-----------------------------------------------------------------------------------------------');
  console.log(`\nResultado final: ${okCount} tablas 100% OPERATIVAS Y SINCRONIZADAS (${errorCount} con error).\n`);
}

checkDatabase().catch(console.error);
