import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type MigrationPrimitive = string | number | boolean | null;

export interface ParseResult {
  headers: string[];
  data: Record<string, MigrationPrimitive>[];
}

// Dictionary for smart mapping
const DICTIONARY: Record<string, string[]> = {
  name: ['nombre', 'nombres', 'cliente', 'name', 'full name', 'nombre completo', 'cliente_nombre'],
  cedula: ['cedula', 'identificacion', 'id', 'rnc', 'cedula_rnc', 'documento'],
  phone: ['telefono', 'celular', 'tel', 'phone', 'movil', 'telefono_movil'],
  email: ['correo', 'email', 'e-mail', 'correo electronico', 'correo_electronico'],
  address: ['direccion', 'calle', 'address', 'direccion_calle', 'ubicacion'],
  income: ['ingreso', 'salario', 'sueldo', 'income', 'ingreso_mensual'],
  amount: ['monto', 'cantidad', 'capital', 'prestamo', 'amount', 'capital_otorgado', 'monto_transaccion', 'valor'],
  interestRate: ['interes', 'tasa', 'interest', 'porcentaje', 'porcentaje_interes'],
  frequency: ['frecuencia', 'modalidad', 'frequency', 'modalidad_pago'],
  loanType: ['tipo', 'tipo prestamo', 'tipo_prestamo'],
  date: ['fecha', 'date', 'creado', 'fecha_pago', 'fecha_transaccion'],
  amountCollected: ['cobrado', 'recaudado', 'pago', 'monto cobrado'],
  loanId: ['codigo_prestamo', 'prestamo_id', 'id_prestamo', 'num_prestamo', 'referencia_prestamo'],
  concept: ['concepto', 'descripcion', 'nota', 'motivo', 'detalle'],
  txType: ['tipo_movimiento', 'tipo_transaccion', 'categoria', 'ingreso_gasto']
};

export const parseFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const isCsv = file.name.endsWith('.csv');
    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            data: results.data as Record<string, MigrationPrimitive>[]
          });
        },
        error: (err) => reject(err)
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
          
          if (json.length > 0) {
            resolve({
              headers: Object.keys(json[0] as object),
              data: json as Record<string, MigrationPrimitive>[]
            });
          } else {
            resolve({ headers: [], data: [] });
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
};

export const guessMapping = (header: string): string | null => {
  const normalized = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  for (const [targetField, aliases] of Object.entries(DICTIONARY)) {
    if (aliases.some(alias => {
      const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalized.includes(normAlias) || normAlias.includes(normalized);
    })) {
      return targetField;
    }
  }
  return null;
};
