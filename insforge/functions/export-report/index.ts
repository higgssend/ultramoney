// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(header => {
    let val = obj[header];
    if (val === null || val === undefined) val = '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(','));
  return [headers.join(','), ...rows].join('\n');
}

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

    let body: any = {};
    if (req.method === 'POST') {
      body = await req.json().catch(() => ({}));
    }

    const type = body.type || 'portfolio';
    const format = body.format || 'json'; 
    const lenderId = body.lender_id;

    if (!lenderId) {
      return new Response(JSON.stringify({ error: 'lender_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let reportData: any;

    if (type === 'loans') {
      const { data } = await supabase.from('loans').select('*').eq('lender_id', lenderId);
      reportData = data;
    } else if (type === 'clients') {
      const { data } = await supabase.from('clients').select('*').eq('lender_id', lenderId);
      reportData = data;
    } else if (type === 'transactions') {
      // In a real scenario we need to filter transactions by lender, this might require a join if lender_id is not on transactions directly
      const { data } = await supabase.from('transactions').select('*').order('createdat', { ascending: false }).limit(500);
      reportData = data;
    } else if (type === 'overdue') {
      const { data } = await supabase.from('loans').select('*').eq('lender_id', lenderId).eq('status', 'Vencido');
      reportData = data;
    } else if (type === 'portfolio') {
      const { data: loans } = await supabase.from('loans').select('*').eq('lender_id', lenderId);
      const activeLoans = (loans || []).filter(l => l.status === 'Activo');
      const overdueLoans = (loans || []).filter(l => l.status === 'Vencido');
      
      const totalActiveAmount = activeLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      const totalOverdueAmount = overdueLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      
      reportData = {
        total_loans: loans?.length || 0,
        active_loans: activeLoans.length,
        overdue_loans: overdueLoans.length,
        total_active_capital: totalActiveAmount,
        total_overdue_capital: totalOverdueAmount,
        at_risk_ratio: totalActiveAmount > 0 ? (totalOverdueAmount / (totalActiveAmount + totalOverdueAmount)).toFixed(2) : 0
      };
      
      if (format === 'csv') {
        reportData = [reportData]; // CSV needs array
      }
    } else {
      return new Response(JSON.stringify({ error: 'invalid report type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData || []);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report_${type}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return new Response(JSON.stringify({ type, count: reportData?.length, data: reportData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
