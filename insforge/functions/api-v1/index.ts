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

    // Get Auth Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.split(' ')[1];

    // Validate token
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', token)
      .single();

    if (keyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Key' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update last_used
    await supabase.from('api_keys').update({ last_used: new Date().toISOString() }).eq('id', apiKeyData.id);

    // Parse URL parameters
    const url = new URL(req.url);
    const resource = url.searchParams.get('resource');
    
    if (!resource) {
      return new Response(JSON.stringify({ 
        message: 'Welcome to UltraMoney API v1', 
        endpoints: ['?resource=clients', '?resource=loans', '?resource=transactions'] 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Allowlist of resources
    const allowedResources = ['clients', 'loans', 'transactions', 'bank_accounts', 'cash_shifts', 'collector_visits'];
    if (!allowedResources.includes(resource)) {
      return new Response(JSON.stringify({ error: `Resource '${resource}' not found or not allowed` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Handle Methods
    if (req.method === 'GET') {
      const { data, error } = await supabase.from(resource).select('*').limit(100);
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from(resource).insert([body]).select();
      if (error) throw error;
      return new Response(JSON.stringify({ data, message: 'Created successfully' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
