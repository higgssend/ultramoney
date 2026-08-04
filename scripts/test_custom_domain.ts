import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://api.ultramoney.app',
  anonKey: 'ik_12002a3fd3274a14e562bcce4a015fee'
});

async function testCustomDomain() {
  console.log("=== PROBANDO NUEVO DOMINIO API: https://api.ultramoney.app ===");
  
  try {
    const { data, error } = await client.database.from('loans').select('id, amount').limit(2);
    console.log("✅ Consulta a la Base de Datos vía api.ultramoney.app:");
    if (error) {
      console.error("Error DB:", error);
    } else {
      console.log("Éxito DB Data:", data);
    }
  } catch (e: any) {
    console.error("Error al conectar con custom domain:", e.message);
  }
}

testCustomDomain();
