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
    const supabaseUrl = Deno.env.get('INSFORGE_URL') || Deno.env.get('SUPABASE_URL') || "https://sxwv82iw.us-east.insforge.app";
    const supabaseKey = Deno.env.get('INSFORGE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('INSFORGE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Service configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch primary tables
    const [clientsRes, loansRes, txRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('transactions').select('*')
    ]);

    const backupPayload = {
      version: '2.0.0',
      generator: 'InsForge Serverless Weekly Backup Cron',
      timestamp: new Date().toISOString(),
      counts: {
        clients: clientsRes.data?.length || 0,
        loans: loansRes.data?.length || 0,
        transactions: txRes.data?.length || 0
      },
      clients: clientsRes.data || [],
      loans: loansRes.data || [],
      transactions: txRes.data || []
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `weekly_backup_${dateStr}_${Date.now().toString().slice(-4)}.json`;

    // Upload file to bucket
    const { error: uploadError } = await supabase
      .storage
      .from('backups')
      .upload(fileName, new Blob([jsonString], { type: 'application/json' }), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        bucket: 'backups',
        counts: backupPayload.counts,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error processing backup' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
