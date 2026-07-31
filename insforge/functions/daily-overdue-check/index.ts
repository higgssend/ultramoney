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

    // Get all active loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Activo');

    if (loansError) throw loansError;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueLoans = [];
    let updatedCount = 0;

    for (const loan of (loans || [])) {
      const nextPayment = loan.nextpaymentdate || loan.startdate;
      if (!nextPayment) continue;

      if (nextPayment < todayStr) {
        // Calculate days overdue
        const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(nextPayment).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let severity = 'Leve'; // 1-7 days
        if (diffDays > 30) severity = 'Grave'; // > 30 days
        else if (diffDays > 7) severity = 'Moderado'; // 8-30 days

        overdueLoans.push({
          loan_id: loan.id,
          client_id: loan.clientid,
          client_name: loan.clientname || 'Cliente',
          lender_id: loan.lender_id,
          expected_date: nextPayment,
          days_overdue: diffDays,
          severity,
          amount: loan.installmentamount || 0,
          balance: loan.remainingbalance || 0
        });

        // Update status to Vencido
        await supabase
          .from('loans')
          .update({ status: 'Vencido' })
          .eq('id', loan.id);
          
        updatedCount++;
      }
    }

    // Optional: Log this check in an audit table or send notifications to lenders

    return new Response(JSON.stringify({
      scanned_total: loans?.length || 0,
      overdue_found: overdueLoans.length,
      status_updated: updatedCount,
      report: overdueLoans
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
