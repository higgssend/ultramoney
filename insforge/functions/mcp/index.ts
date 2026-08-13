import express from "npm:express";
import cors from "npm:cors";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "npm:@modelcontextprotocol/sdk/server/sse.js";
import { z } from "npm:zod";
import { createClient } from "npm:@insforge/sdk";

const app = express();
app.use(cors());

// Se conecta usando las variables automáticas de InsForge (Supabase)
const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_INSFORGE_URL");
const key = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_INSFORGE_ANON_KEY");

const db = createClient({ baseUrl: url, anonKey: key });

const server = new McpServer({
  name: "UltraMoney-MCP-InsForge",
  version: "1.0.0",
});

// 1. Tool: get_dashboard_stats
server.tool("get_dashboard_stats", "Obtiene estadísticas financieras del negocio", {}, async () => {
    const { data: loans } = await db.database.from('loans').select('amount, status, totaltopay, remainingbalance');
    if (!loans) return { content: [{ type: "text", text: "No loans found." }] };
    const totalLent = loans.reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0);
    const totalExpected = loans.reduce((sum: number, l: any) => sum + Number(l.totaltopay || 0), 0);
    const totalRemaining = loans.reduce((sum: number, l: any) => sum + Number(l.remainingbalance || 0), 0);
    const overdue = loans.filter((l: any) => l.status === 'Atrasado');
    const report = `UltraMoney Dashboard Stats:\nTotal Prestado: $${totalLent.toFixed(2)}\nTotal Esperado: $${totalExpected.toFixed(2)}\nSaldo Pendiente: $${totalRemaining.toFixed(2)}\nPréstamos en Atraso: ${overdue.length} de ${loans.length}`;
    return { content: [{ type: "text", text: report }] };
});

// 2. Tool: list_clients
server.tool("list_clients", "Busca clientes por nombre", { nameQuery: z.string().optional() }, async ({ nameQuery }: { nameQuery?: string }) => {
    let query = db.database.from('clients').select('id, name, phone, cedula').order('created_at', { ascending: false }).limit(20);
    if (nameQuery) query = query.ilike('name', `%${nameQuery}%`);
    const { data: clients, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(clients, null, 2) }] };
});

// 3. Tool: list_active_loans
server.tool("list_active_loans", "Lista préstamos activos y atrasados.", { clientId: z.string().optional() }, async ({ clientId }: { clientId?: string }) => {
    let query = db.database.from('loans').select('id, clientname, amount, status, remainingbalance').in('status', ['Activo', 'Atrasado']).order('created_at', { ascending: false });
    if (clientId) query = query.eq('clientid', clientId);
    const { data: loans, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(loans, null, 2) }] };
});

// 4. Tool: get_client_history
server.tool("get_client_history", "Obtiene pagos de un cliente.", { clientId: z.string() }, async ({ clientId }: { clientId: string }) => {
    const { data: tx, error } = await db.database.from('transactions').select('*').eq('client_id', clientId).order('date', { ascending: false });
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(tx, null, 2) }] };
});

// 5. Tool: register_payment
server.tool("register_payment", "Registra un pago.", { loanId: z.string(), amount: z.number(), method: z.string(), lenderId: z.string() }, async ({ loanId, amount, method, lenderId }: { loanId: string; amount: number; method: string; lenderId: string }) => {
    const payload = { referenceid: loanId, type: 'Pago', amount, date: new Date().toISOString(), paymenttype: method, currency: 'DOP', category: 'Abono a Cuota', lender_id: lenderId };
    const { error } = await db.database.from('transactions').insert([payload]);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: `Pago registrado exitosamente.` }] };
});

// Para soportar múltiples conexiones simultáneas, guardamos los transportes
const transports = new Map<string, SSEServerTransport>();

app.get("/mcp", async (req: any, res: any) => {
  const transport = new SSEServerTransport("/mcp/messages", res);
  await server.connect(transport);
  transports.set(transport.sessionId, transport);
});

app.post("/mcp/messages", express.json(), async (req: any, res: any) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(8000, () => {
    console.log("MCP Server running on port 8000");
});
