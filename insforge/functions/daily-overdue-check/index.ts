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
      // Find the next pending installment from the JSON array
      const installments = loan.installments || [];
      const pendingInstallment = installments.find((inst: any) => inst.status === 'Pendiente');
      const nextPayment = pendingInstallment ? pendingInstallment.dueDate : loan.startdate;
      
      if (!nextPayment) continue;

      if (nextPayment < todayStr) {
        // Calculate days overdue
        const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(nextPayment).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        const graceDays = loan.gracedays || 0;
        
        let penaltyAmount = 0;
        let shouldApplyPenalty = false;
        
        if (diffDays > graceDays) {
           const lateFeePct = loan.latefeepercentage || 0;
           if (lateFeePct > 0) {
               const installmentAmount = loan.installmentamount || 0;
               penaltyAmount = installmentAmount * (lateFeePct / 100);
               shouldApplyPenalty = true;
           }
        }

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
          penalty_applied: penaltyAmount
        });

        // 1. Mark as Atrasado
        const updates: any = { status: 'Atrasado' };
        
        if (shouldApplyPenalty) {
           updates.remainingbalance = (loan.remainingbalance || 0) + penaltyAmount;
           updates.totaltopay = (loan.totaltopay || 0) + penaltyAmount;
        }

        await supabase
          .from('loans')
          .update(updates)
          .eq('id', loan.id);
          
        if (shouldApplyPenalty) {
           // Insert the penalty transaction
           await supabase.from('transactions').insert({
               referenceid: loan.id,
               lender_id: loan.lender_id,
               type: 'Cargo',
               amount: penaltyAmount,
               date: new Date().toISOString(),
               category: 'Mora',
               currency: loan.currency || 'DOP',
               description: `Penalidad automática por mora (${loan.latefeepercentage}% de cuota)`
           });
        }
          
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
