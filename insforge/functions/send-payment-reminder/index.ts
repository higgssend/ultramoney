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

    // Parse request body (optional filters)
    let body: any = {};
    if (req.method === 'POST') {
      body = await req.json().catch(() => ({}));
    }

    const daysAhead = body.days_ahead ?? 3;
    const lenderId = body.lender_id;

    if (!lenderId) {
      return new Response(JSON.stringify({ error: 'lender_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all active loans for this lender
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('lender_id', lenderId)
      .eq('status', 'Activo');

    if (loansError) throw loansError;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    // Find loans with upcoming payments
    const upcomingPayments: any[] = [];

    for (const loan of (loans || [])) {
      const nextPayment = loan.nextpaymentdate || loan.startdate;
      if (!nextPayment) continue;

      if (nextPayment >= todayStr && nextPayment <= futureStr) {
        // Get client info
        const { data: client } = await supabase
          .from('clients')
          .select('name, phone, whatsapp')
          .eq('id', loan.clientid)
          .single();

        const clientName = client?.name || loan.clientname || 'Cliente';
        const clientPhone = client?.whatsapp || client?.phone || '';
        const amount = loan.installmentamount || 0;
        const balance = loan.remainingbalance || 0;

        const message = `Hola ${clientName}, le recordamos que tiene un pago pendiente de RD$${Number(amount).toLocaleString()} para el ${nextPayment}. Balance restante: RD$${Number(balance).toLocaleString()}. Gracias por su puntualidad. - UltraMoney`;

        const whatsappLink = clientPhone
          ? `https://wa.me/${clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
          : null;

        upcomingPayments.push({
          loan_id: loan.id,
          client_name: clientName,
          client_phone: clientPhone,
          amount,
          payment_date: nextPayment,
          remaining_balance: balance,
          message,
          whatsapp_link: whatsappLink
        });
      }
    }

    return new Response(JSON.stringify({
      total: upcomingPayments.length,
      date_range: { from: todayStr, to: futureStr },
      reminders: upcomingPayments
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
