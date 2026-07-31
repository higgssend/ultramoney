// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('INSFORGE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('INSFORGE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Service configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const url = new URL(req.url);
    let body: any = {};
    if (req.method === 'POST') {
      body = await req.json().catch(() => ({}));
    }

    const reportType = body.type || url.searchParams.get('type') || 'loans';
    const format = body.format || url.searchParams.get('format') || 'json';
    const dateFrom = body.date_from || url.searchParams.get('date_from');
    const dateTo = body.date_to || url.searchParams.get('date_to');
    const lenderId = body.lender_id || url.searchParams.get('lender_id');

    if (!lenderId) {
      return new Response(JSON.stringify({ error: 'lender_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const allowedTypes = ['loans', 'transactions', 'clients', 'overdue', 'portfolio'];
    if (!allowedTypes.includes(reportType)) {
      return new Response(JSON.stringify({
        error: `Invalid report type. Allowed: ${allowedTypes.join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let data: any[] = [];
    let summary: any = {};

    if (reportType === 'loans') {
      let query = supabase.from('loans').select('*').eq('lender_id', lenderId);
      if (dateFrom) query = query.gte('startdate', dateFrom);
      if (dateTo) query = query.lte('startdate', dateTo);
      const { data: loans, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      data = (loans || []).map((l: any) => ({
        id: l.id,
        cliente: l.clientname,
        monto: l.amount,
        tasa: l.interestrate,
        plazo: l.durationweeks,
        frecuencia: l.frequency,
        tipo: l.loantype,
        estado: l.status,
        balance: l.remainingbalance,
        total_a_pagar: l.totaltopay,
        fecha_inicio: l.startdate,
        garantia: l.collateraltype
      }));
      const activeLoans = data.filter(l => l.estado === 'Activo');
      summary = {
        total_prestamos: data.length,
        activos: activeLoans.length,
        capital_activo: activeLoans.reduce((s: number, l: any) => s + Number(l.monto || 0), 0),
        balance_pendiente: activeLoans.reduce((s: number, l: any) => s + Number(l.balance || 0), 0)
      };

    } else if (reportType === 'transactions') {
      let query = supabase.from('transactions').select('*').eq('lender_id', lenderId);
      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);
      const { data: trx, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      data = (trx || []).map((t: any) => ({
        id: t.id,
        fecha: t.date,
        tipo: t.type,
        monto: t.amount,
        descripcion: t.description,
        metodo_pago: t.paymentmethod || t.paymentMethod || 'N/A',
        tipo_pago: t.paymenttype || t.paymentType || 'N/A'
      }));
      const ingresos = data.filter(t => t.tipo === 'Ingreso');
      const gastos = data.filter(t => t.tipo === 'Gasto');
      summary = {
        total_transacciones: data.length,
        total_ingresos: ingresos.reduce((s: number, t: any) => s + Number(t.monto || 0), 0),
        total_gastos: gastos.reduce((s: number, t: any) => s + Number(t.monto || 0), 0),
        ganancia_neta: ingresos.reduce((s: number, t: any) => s + Number(t.monto || 0), 0) - gastos.reduce((s: number, t: any) => s + Number(t.monto || 0), 0)
      };

    } else if (reportType === 'clients') {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('lender_id', lenderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      data = (clients || []).map((c: any) => ({
        id: c.id,
        nombre: c.name,
        cedula: c.cedula,
        telefono: c.phone,
        email: c.email,
        direccion: c.address,
        ocupacion: c.occupation,
        ingreso: c.income,
        estado: c.status,
        fecha_registro: c.created_at
      }));
      summary = {
        total_clientes: data.length,
        activos: data.filter(c => c.estado === 'Activo').length
      };

    } else if (reportType === 'overdue') {
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('lender_id', lenderId)
        .eq('status', 'Vencido');
      if (error) throw error;
      data = (loans || []).map((l: any) => ({
        id: l.id,
        cliente: l.clientname,
        monto: l.amount,
        balance: l.remainingbalance,
        tipo: l.loantype,
        fecha_inicio: l.startdate
      }));
      summary = {
        total_vencidos: data.length,
        monto_en_riesgo: data.reduce((s: number, l: any) => s + Number(l.balance || 0), 0)
      };

    } else if (reportType === 'portfolio') {
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('lender_id', lenderId);
      if (error) throw error;
      const all = loans || [];
      const active = all.filter((l: any) => l.status === 'Activo');
      const paid = all.filter((l: any) => l.status === 'Pagado');
      const overdue = all.filter((l: any) => l.status === 'Vencido');
      summary = {
        total_prestamos: all.length,
        activos: active.length,
        pagados: paid.length,
        vencidos: overdue.length,
        capital_colocado: active.reduce((s: number, l: any) => s + Number(l.amount || 0), 0),
        balance_por_cobrar: active.reduce((s: number, l: any) => s + Number(l.remainingbalance || 0), 0),
        monto_en_riesgo: overdue.reduce((s: number, l: any) => s + Number(l.remainingbalance || 0), 0),
        tasa_morosidad: all.length > 0 ? ((overdue.length / all.length) * 100).toFixed(2) + '%' : '0%'
      };
      data = []; // Portfolio is summary-only
    }

    // Format output
    if (format === 'csv') {
      if (data.length === 0) {
        return new Response('No data to export', {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      for (const row of data) {
        csvRows.push(headers.map(h => {
          const val = (row as any)[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(','));
      }
      return new Response(csvRows.join('\n'), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report_${reportType}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Default: JSON
    return new Response(JSON.stringify({
      report_type: reportType,
      generated_at: new Date().toISOString(),
      filters: { date_from: dateFrom, date_to: dateTo },
      summary,
      records: data.length,
      data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
