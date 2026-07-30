import { createClient } from '@insforge/sdk';
// removed dotenv

async function run() {
  const url = process.env.VITE_INSFORGE_URL || process.env.INSFORGE_URL;
  const key = process.env.VITE_INSFORGE_ANON_KEY || process.env.INSFORGE_ANON_KEY;
  
  if (!url || !key) {
    console.error("Missing InsForge credentials in .env.local");
    return;
  }
  
  const insforge = createClient({ baseUrl: url, anonKey: key });

  const rolesToInsert = [
    {
      name: 'Administrador',
      description: 'Acceso total al sistema',
      permissions: ["manage_loans", "manage_clients", "manage_users", "view_reports", "manage_settings", "approve_loans", "manage_cash"]
    },
    {
      name: 'Gerente',
      description: 'Gestión operativa completa sin configuración del sistema',
      permissions: ["manage_loans", "manage_clients", "view_reports", "approve_loans", "manage_cash"]
    },
    {
      name: 'Cajero',
      description: 'Registro de pagos y manejo de caja',
      permissions: ["manage_cash", "manage_clients"]
    },
    {
      name: 'Auditor',
      description: 'Lectura de reportes y auditoría',
      permissions: ["view_reports"]
    },
    {
      name: 'Cobrador de App',
      description: 'Para uso desde el celular en rutas',
      permissions: ["manage_cash", "view_reports"]
    }
  ];

  try {
    const { data, error } = await insforge.database
      .from('roles')
      .upsert(rolesToInsert, { onConflict: 'name' })
      .select();

    if (error) {
      console.error("Error inserting roles:", error);
    } else {
      console.log("Roles inserted successfully:", data);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

run();
