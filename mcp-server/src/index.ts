import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "@insforge/sdk";
import * as dotenv from "dotenv";
import * as path from "path";

// Load the root .env.local from the parent directory
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const url = process.env.VITE_INSFORGE_URL;
const key = process.env.VITE_INSFORGE_ANON_KEY; // Replace with service role key if needed for bypass

if (!url || !key) {
    console.error("Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY in ../../.env.local");
    process.exit(1);
}

const db = createClient({ baseUrl: url, anonKey: key });

// Create an MCP server
const server = new McpServer({
  name: "UltraMoney-MCP",
  version: "1.0.0",
});

// 1. Tool: get_dashboard_stats
server.tool("get_dashboard_stats",
    "Obtiene estadísticas financieras del negocio (total de prestamos, morosidad)",
    {},
    async () => {
        const { data: loans } = await db.database.from('loans').select('amount, status, totaltopay, remainingbalance');
        if (!loans) return { content: [{ type: "text", text: "No loans found." }] };

        const totalLent = loans.reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0);
        const totalExpected = loans.reduce((sum: number, l: any) => sum + Number(l.totaltopay || 0), 0);
        const totalRemaining = loans.reduce((sum: number, l: any) => sum + Number(l.remainingbalance || 0), 0);
        
        const overdue = loans.filter((l: any) => l.status === 'Atrasado');

        const report = `
UltraMoney Dashboard Stats:
Total Prestado: $${totalLent.toFixed(2)}
Total Esperado (Capital + Interés): $${totalExpected.toFixed(2)}
Saldo Pendiente en la Calle: $${totalRemaining.toFixed(2)}
Préstamos en Atraso: ${overdue.length} de ${loans.length}
        `;
        return { content: [{ type: "text", text: report }] };
    }
);

// 2. Tool: list_clients
server.tool("list_clients",
    "Busca clientes por nombre, o devuelve los más recientes si no pasas nombre",
    {
        nameQuery: z.string().optional().describe("Texto a buscar en el nombre del cliente")
    },
    async ({ nameQuery }) => {
        let query = db.database.from('clients').select('id, name, phone, cedula').order('created_at', { ascending: false }).limit(20);
        
        if (nameQuery) {
            query = query.ilike('name', `%${nameQuery}%`);
        }

        const { data: clients, error } = await query;
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

        return {
            content: [{ type: "text", text: JSON.stringify(clients, null, 2) }]
        };
    }
);

// 3. Tool: list_active_loans
server.tool("list_active_loans",
    "Lista préstamos activos y atrasados con su saldo pendiente.",
    {
        clientId: z.string().optional().describe("Filtrar por ID de cliente")
    },
    async ({ clientId }) => {
        let query = db.database.from('loans')
            .select('id, clientname, amount, status, remainingbalance, currency')
            .in('status', ['Activo', 'Atrasado'])
            .order('created_at', { ascending: false });

        if (clientId) {
            query = query.eq('clientid', clientId);
        }

        const { data: loans, error } = await query;
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

        return {
            content: [{ type: "text", text: JSON.stringify(loans, null, 2) }]
        };
    }
);

// 4. Tool: get_client_history
server.tool("get_client_history",
    "Obtiene el historial de transacciones (pagos) de un cliente.",
    {
        clientId: z.string().describe("UUID del cliente")
    },
    async ({ clientId }) => {
        const { data: tx, error } = await db.database.from('transactions')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false });

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

        return {
            content: [{ type: "text", text: JSON.stringify(tx, null, 2) }]
        };
    }
);

// 5. Tool: register_payment
server.tool("register_payment",
    "Registra un pago para un préstamo específico.",
    {
        loanId: z.string().describe("ID del préstamo a pagar"),
        amount: z.number().describe("Monto del abono/pago"),
        method: z.string().describe("Método de pago (Ej. Efectivo, Transferencia)"),
        lenderId: z.string().describe("ID del lender/empresa para el RLS")
    },
    async ({ loanId, amount, method, lenderId }) => {
        // En una app real, actualizaríamos el saldo y las cuotas de forma transaccional.
        // Aquí hacemos el log a 'transactions'.
        const payload = {
            referenceid: loanId,
            type: 'Pago',
            amount: amount,
            date: new Date().toISOString(),
            paymenttype: method,
            currency: 'DOP', // Asumido
            category: 'Abono a Cuota',
            lender_id: lenderId
        };

        const { data, error } = await db.database.from('transactions').insert([payload]);
        if (error) return { content: [{ type: "text", text: `Error al registrar pago: ${error.message}` }] };

        return {
            content: [{ type: "text", text: `Pago registrado exitosamente. Verifica la tabla de transacciones.` }]
        };
    }
);

// Start receiving messages on stdin and sending on stdout
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("UltraMoney MCP Server is running...");
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
