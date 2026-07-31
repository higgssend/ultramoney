// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, message, clientName } = await req.json();

    if (!phone || !message) {
      throw new Error("Missing required parameters: phone or message");
    }

    // Credenciales extraídas de tu panel de Twilio
    // NOTA: Es seguro dejar esto aquí para desarrollo, pero en producción deberías moverlas a Variables de Entorno en InsForge.
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || ''; 
    const TWILIO_API_KEY_SID = Deno.env.get('TWILIO_API_KEY_SID') || '';
    const TWILIO_API_KEY_SECRET = Deno.env.get('TWILIO_API_KEY_SECRET') || '';
    
    // Tu número real de Twilio (mostrado en la captura de pantalla)
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '+19519042839'; 

    // Limpiar el teléfono para que solo tenga números y agregar el prefijo '+'
    const cleanPhone = phone.replace(/\D/g, '');
    const toPhone = `+${cleanPhone}`;

    console.log(`Enviando SMS vía Twilio a ${toPhone}...`);

    // Petición a Twilio API (La URL usa el Account SID, pero la autorización usa el API Key)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const body = new URLSearchParams({
      To: toPhone,
      From: TWILIO_PHONE_NUMBER,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // Basic Auth con API Key SID como usuario y API Secret como contraseña
        'Authorization': `Basic ${btoa(`${TWILIO_API_KEY_SID}:${TWILIO_API_KEY_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Twilio:", data);
      throw new Error(data.message || "Error al enviar mensaje por WhatsApp (Twilio)");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Exception:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
