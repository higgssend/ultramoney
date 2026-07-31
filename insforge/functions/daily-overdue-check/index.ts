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

    const today = new Date().toISOString().split('T')[0];

    // Get all active loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'Activo');

    if (loansError) throw loansError;

    const overdueLoans: any[] = [];
    const updatedIds: string[] = [];
    let totalAtRisk = 0;

    for (const loan of (loans || [])) {
      const nextPayment = loan.nextpaymentdate || loan.startdate;
      if (!nextPayment) continue;

      // If the next payment date has passed, this loan is overdue
      if (nextPayment < today) {
        const daysOverdue = Math.floor(
          (new Date(today).getTime() - new Date(nextPayment).getTime()) / (1000 * 60 * 60 * 24)
        );

        const balance = Number(loan.remainingbalance || 0);
        totalAtRisk += balance;

        overdueLoans.push({
          loan_id: loan.id,
          client_id: loan.clientid,
          client_name: loan.clientname || 'Desconocido',
          amount: loan.amount,
          remaining_balance: balance,
          installment_amount: loan.installmentamount,
          next_payment_date: nextPayment,
          days_overdue: daysOverdue,
          loan_type: loan.loantype,
          frequency: loan.frequency
        });

        updatedIds.push(loan.id);
      }
    }

    // Update overdue loans status to 'Vencido' (only if they were 'Activo')
    if (updatedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('loans')
        .update({ status: 'Vencido' })
        .in('id', updatedIds);

      if (updateError) {
        console.error('Error updating overdue loans:', updateError);
      }
    }

    // Build severity breakdown
    const severity = {
      leve: overdueLoans.filter(l => l.days_overdue <= 7).length,       // 1-7 days
      moderado: overdueLoans.filter(l => l.days_overdue > 7 && l.days_overdue <= 30).length, // 8-30 days
      grave: overdueLoans.filter(l => l.days_overdue > 30).length       // 30+ days
    };

    return new Response(JSON.stringify({
      check_date: today,
      total_overdue: overdueLoans.length,
      total_at_risk: totalAtRisk,
      severity,
      status_updated: updatedIds.length,
      overdue_loans: overdueLoans
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
