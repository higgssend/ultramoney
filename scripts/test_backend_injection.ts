import { createClient } from '@insforge/sdk';

const insforgeUrl = 'https://sxwv82iw.us-east.insforge.app';
const insforgeKey = 'ik_12002a3fd3274a14e562bcce4a015fee';

const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });

async function main() {
    console.log("Iniciando sesión...");
    const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
        email: "elevateenterprisebrands@gmail.com",
        password: "Ww172839456*-@"
    });

    if (authError || !authData?.user) {
        console.error("Error en login:", authError);
        return;
    }

    const userId = authData.user.id;
    console.log("Sesión iniciada exitosamente! User ID:", userId);

    for (let i = 1; i <= 3; i++) {
        console.log(`Creando cliente de prueba ${i}...`);
        
        const clientData = {
            lender_id: userId,
            name: `Cliente de Prueba ${i}`,
            cedula: `402-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(1 + Math.random() * 9)}`,
            email: `cliente${i}@test.com`,
            phone: `809-555-${Math.floor(1000 + Math.random() * 9000)}`,
            address: `Calle Falsa ${i}, Santo Domingo`,
            occupation: "Empleado",
            income: Math.floor(15000 + Math.random() * 35000),
            status: "Activo",
            joineddate: new Date().toISOString().split('T')[0]
        };

        const { data: insertedClient, error: clientError } = await insforge.database
            .from('clients')
            .insert(clientData)
            .select()
            .single();

        if (clientError || !insertedClient) {
            console.error("Error creando cliente:", clientError);
            continue;
        }

        const clientId = (insertedClient as any).id;
        
        console.log(`Creando préstamo para Cliente de Prueba ${i}...`);
        
        const amount = Math.floor(5000 + Math.random() * 15000);
        const durationWeeks = [12, 24, 36][Math.floor(Math.random() * 3)];
        const interestRate = [5, 10, 15][Math.floor(Math.random() * 3)];
        const totalToPay = amount + (amount * (interestRate / 100));

        const loanData = {
            lender_id: userId,
            clientid: clientId,
            clientname: `Cliente de Prueba ${i}`,
            amount: amount,
            interestrate: interestRate,
            durationweeks: durationWeeks,
            frequency: "Mensual",
            startdate: new Date().toISOString().split('T')[0],
            status: "Activo",
            installmentamount: totalToPay / durationWeeks,
            remainingbalance: totalToPay,
            totaltopay: totalToPay,
            loantype: "Amortizado",
            collateraltype: "Sin Garantía"
        };

        const { error: loanError } = await insforge.database
            .from('loans')
            .insert(loanData);

        if (loanError) {
            console.error("Error creando préstamo:", loanError);
        } else {
            console.log("Préstamo creado con éxito!");
        }
    }
    
    console.log("¡Inyección de datos finalizada correctamente!");
}

main();
