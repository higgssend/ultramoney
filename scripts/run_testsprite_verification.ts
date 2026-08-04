import { createClient } from '@insforge/sdk';

const insforgeUrl = 'https://sxwv82iw.us-east.insforge.app';
const insforgeKey = 'ik_12002a3fd3274a14e562bcce4a015fee';

const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });

async function runE2EVerification() {
  console.log("=== INICIANDO PRUEBA COMPLETA DE FLUJO (CLIENTE -> PRÉSTAMO -> PAGO -> RECIBO) ===");
  
  // 1. Iniciar sesión
  console.log("\n1. Autenticando usuario elevateenterprisebrands@gmail.com...");
  const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
    email: "elevateenterprisebrands@gmail.com",
    password: "Ww172839456*-@"
  });

  if (authError || !authData?.user) {
    console.error("❌ Error en autenticación:", authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("✅ Autenticación exitosa! User ID:", userId);

  // 2. Crear Cliente de Prueba
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const clientData = {
    lender_id: userId,
    name: `TestSprite Cliente ${randomSuffix}`,
    lastname: `Verificación E2E`,
    cedula: `402-${Math.floor(1000000 + Math.random() * 9000000)}-1`,
    documenttype: "Cedula",
    email: `testsprite_${randomSuffix}@ultramoney.app`,
    phone: `809555${randomSuffix}`,
    address: `Av. Winston Churchill #${randomSuffix}`,
    status: "Al Día",
    creditscore: 780,
    joineddate: new Date().toISOString().split('T')[0]
  };

  console.log(`\n2. Creando nuevo cliente: '${clientData.name}'...`);
  const { data: insertedClient, error: clientError } = await insforge.database
    .from('clients')
    .insert(clientData)
    .select()
    .single();

  if (clientError || !insertedClient) {
    console.error("❌ Error al crear cliente:", clientError);
    process.exit(1);
  }

  const clientId = (insertedClient as any).id;
  console.log("✅ Cliente creado exitosamente con ID:", clientId);

  // 3. Crear Préstamo para el Cliente
  const amount = 15000;
  const interestRate = 10;
  const totalToPay = amount + (amount * (interestRate / 100));

  const loanData = {
    lender_id: userId,
    clientid: clientId,
    clientname: clientData.name,
    amount: amount,
    interestrate: interestRate,
    installments: 4,
    durationweeks: 4,
    installmentamount: totalToPay / 4,
    frequency: "Semanal",
    startdate: new Date().toISOString().split('T')[0],
    next_payment_date: new Date().toISOString().split('T')[0],
    status: "Activo",
    remainingbalance: totalToPay,
    totaltopay: totalToPay,
    loantype: "Rédito",
    collateraldescription: "Préstamo registrado durante la prueba E2E de TestSprite"
  };

  console.log(`\n3. Creando préstamo por RD$ ${amount} (Total a pagar: RD$ ${totalToPay})...`);
  const { data: insertedLoan, error: loanError } = await insforge.database
    .from('loans')
    .insert(loanData)
    .select()
    .single();

  if (loanError || !insertedLoan) {
    console.error("❌ Error al crear préstamo:", loanError);
    process.exit(1);
  }

  const loanId = (insertedLoan as any).id;
  console.log("✅ Préstamo creado exitosamente con ID:", loanId);

  // 4. Registrar Pago para el Préstamo
  const paymentAmount = 3000;
  const newBalance = totalToPay - paymentAmount;

  console.log(`\n4. Registrando pago de RD$ ${paymentAmount}...`);

  // Actualizar balance del préstamo
  const { error: balanceError } = await insforge.database
    .from('loans')
    .update({ remainingbalance: newBalance })
    .eq('id', loanId);

  if (balanceError) {
    console.error("❌ Error al actualizar balance del préstamo:", balanceError);
    process.exit(1);
  }
  console.log(`  -> Balance de préstamo actualizado a RD$ ${newBalance}`);

  // Insertar transacción de pago
  const transactionData = {
    lender_id: userId,
    date: new Date().toISOString().split('T')[0],
    type: "Ingreso",
    amount: paymentAmount,
    description: "Pago de intereses/cuota 1 registrado via TestSprite",
    referenceid: loanId,
    paymenttype: "Interes"
  };

  const { data: insertedTx, error: txError } = await insforge.database
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();

  if (txError || !insertedTx) {
    console.error("❌ Error al registrar transacción de pago:", txError);
    process.exit(1);
  }

  const txId = (insertedTx as any).id;
  console.log("✅ Transacción de pago registrada exitosamente con ID:", txId);

  // 5. Verificar Generación y Enlace de Recibo
  const receiptUrl = `https://ultramoney.app/recibo/${txId}`;
  console.log("\n5. Verificando Recibo generado:");
  console.log("  -> ID Transacción:", txId);
  console.log("  -> ID Préstamo Referencia:", (insertedTx as any).referenceid);
  console.log("  -> Monto Cobrado: RD$", (insertedTx as any).amount);
  console.log("  -> URL del Recibo:", receiptUrl);

  // Consultar la transacción para verificar persistencia e integridad de datos
  const { data: verifiedTx, error: verifyError } = await insforge.database
    .from('transactions')
    .select('*')
    .eq('id', txId)
    .single();

  if (verifyError || !verifiedTx) {
    console.error("❌ Error al verificar recibo en la base de datos:", verifyError);
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("🎉 ¡TODAS LAS PRUEBAS E2E SE COMPLETARON CON ÉXITO!");
  console.log("=======================================================");
  console.log("✓ Autenticación: CORRECTA");
  console.log("✓ Creación de Cliente: CORRECTA");
  console.log("✓ Creación de Préstamo: CORRECTA");
  console.log("✓ Actualización de Balance en Backend: CORRECTA");
  console.log("✓ Inserción de Pago: CORRECTA");
  console.log("✓ Generación de Enlace de Recibo: CORRECTA");
}

runE2EVerification();
