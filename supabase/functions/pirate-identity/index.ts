import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIRATE_API_BASE = 'https://pratik-pirate-api.vercel.app';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch random pirate from the API
    const response = await fetch(`${PIRATE_API_BASE}/api/pirates/random`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ensure imagePath is a full URL
    const pirate = {
      ...data,
      imagePath: data.imagePath?.startsWith('http') 
        ? data.imagePath 
        : `${PIRATE_API_BASE}${data.imagePath}`,
    };
    
    return new Response(JSON.stringify(pirate), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching pirate:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch pirate identity' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
