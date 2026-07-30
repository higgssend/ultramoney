// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    // Generate a random 4 digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    return new Response(
      JSON.stringify({ pin }),
      { 
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
});
