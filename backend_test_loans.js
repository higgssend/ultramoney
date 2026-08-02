import { createClient } from '@insforge/sdk';

const insforgeUrl = 'https://sxwv82iw.us-east.insforge.app';
const insforgeKey = 'ik_12002a3fd3274a14e562bcce4a015fee';

const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });

import crypto from 'crypto';

async function runTests() {
  console.log('--- Iniciando Tests de Backend (InsForge SDK) ---');
  
  const clientId = crypto.randomUUID();
  const loanId = crypto.randomUUID();

  try {
    // 0. Obtener un lender_id válido
    console.log('\n[Test 0] Obteniendo un lender_id válido...');
    const { data: existingClient, error: fetchError } = await insforge.database
      .from('clients')
      .select('lender_id')
      .limit(1)
      .single();

    if (fetchError || !existingClient) {
      console.error('❌ No se encontró un lender_id válido en la base de datos:', fetchError);
      process.exit(1);
    }
    
    const lenderId = existingClient.lender_id;
    console.log(`✅ Usando lender_id: ${lenderId}`);

    // 1. Crear Cliente
    console.log('\n[Test 1] Creando Cliente...');
    const clientPayload = [{
      id: clientId,
      lender_id: lenderId,
      name: "Test Client " + clientId.slice(-4),
      sex: "Masculino",
      occupation: "Developer",
      phone: "8095551234",
      cedula: "11122233344",
      address: "Calle Test",
      status: "Activo",
      joineddate: new Date().toISOString()
    }];
    
    const { data: clientData, error: clientError } = await insforge.database
      .from('clients')
      .insert(clientPayload);
      
    if (clientError) {
      console.error('❌ Error creando cliente:', clientError);
      process.exit(1);
    }
    console.log('✅ Cliente creado exitosamente.');

    // 2. Crear Préstamo
    console.log('\n[Test 2] Creando Préstamo...');
    const loanPayload = [{
      id: loanId,
      lender_id: lenderId,
      clientid: clientId,
      clientname: "Test Client " + clientId.slice(-4),
      amount: 5000,
      interestrate: 10,
      durationweeks: 4,
      startdate: new Date().toISOString(),
      nextpaymentdate: new Date().toISOString(),
      installmentamount: 1375,
      totalpaid: 0,
      remainingamount: 5500,
      status: "Activo",
      paymentfrequency: "Semanal"
    }];

    const { data: loanData, error: loanError } = await insforge.database
      .from('loans')
      .insert(loanPayload);

    if (loanError) {
      console.error('❌ Error creando préstamo:', loanError);
      process.exit(1);
    }
    console.log('✅ Préstamo creado exitosamente.');

    // 3. Eliminar Préstamo y Cliente
    console.log('\n[Test 3] Limpiando datos (Borrando Préstamo y Cliente)...');
    
    // Primero el préstamo por la clave foránea
    const { error: delLoanError } = await insforge.database
      .from('loans')
      .delete()
      .eq('id', loanId);
      
    if (delLoanError) {
      console.error('❌ Error eliminando préstamo:', delLoanError);
      process.exit(1);
    }
    console.log('✅ Préstamo eliminado.');

    // Luego el cliente
    const { error: delClientError } = await insforge.database
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (delClientError) {
      console.error('❌ Error eliminando cliente:', delClientError);
      process.exit(1);
    }
    console.log('✅ Cliente eliminado.');

    console.log('\n🎉 Todos los tests pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error no controlado durante los tests:', error);
  }
}

runTests();
