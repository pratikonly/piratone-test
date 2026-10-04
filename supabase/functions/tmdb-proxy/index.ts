import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
};

const TMDB_API_KEY = Deno.env.get('VITE_TMDB_API_KEY') || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Simple in-memory rate limiting (resets on function cold start)
// In production, consider using Redis or Supabase table for persistent storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS_GUEST = 30; // 30 requests per minute for guests
const RATE_LIMIT_MAX_REQUESTS_AUTH = 100; // 100 requests per minute for authenticated users

function getClientIP(req: Request): string {
  // Try to get the real IP from headers (in order of preference)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, the first one is the client
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default identifier
  return 'unknown';
}

function checkRateLimit(identifier: string, maxRequests: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  // Clean up expired records periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authentication (optional)
    const authHeader = req.headers.get('Authorization');
    let isAuthenticated = false;
    let userId: string | null = null;
    
    if (authHeader) {
      // If auth header is present, we can give them higher rate limits
      // But we don't require authentication
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          isAuthenticated = true;
          userId = user.id;
        }
      } catch (e) {
        // Auth failed, treat as guest
        console.log('Auth check failed, treating as guest:', e);
      }
    }
    
    // Rate limiting based on IP for guests, user ID for authenticated
    const clientIP = getClientIP(req);
    const rateLimitKey = isAuthenticated && userId ? `user:${userId}` : `ip:${clientIP}`;
    const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_REQUESTS_AUTH : RATE_LIMIT_MAX_REQUESTS_GUEST;
    
    const rateLimit = checkRateLimit(rateLimitKey, maxRequests);
    
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    if (!TMDB_API_KEY) {
      console.error('VITE_TMDB_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Movie database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { endpoint, params } = await req.json();

    // Validate endpoint format - must start with /
    if (!endpoint || typeof endpoint !== 'string' || !endpoint.startsWith('/')) {
      console.error('Invalid endpoint:', endpoint);
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist allowed endpoints to prevent abuse
    const allowedPatterns = [
      /^\/trending\/(movie|tv|all)\/(day|week)$/,
      /^\/movie\/popular$/,
      /^\/movie\/top_rated$/,
      /^\/movie\/now_playing$/,
      /^\/tv\/popular$/,
      /^\/tv\/top_rated$/,
      /^\/movie\/\d+$/,
      /^\/tv\/\d+$/,
      /^\/tv\/\d+\/season\/\d+$/,
      /^\/search\/multi$/,
      /^\/search\/movie$/,
      /^\/search\/tv$/,
      /^\/movie\/\d+\/recommendations$/,
      /^\/tv\/\d+\/recommendations$/,
      /^\/movie\/\d+\/similar$/,
      /^\/tv\/\d+\/similar$/,
      /^\/movie\/\d+\/images$/,
      /^\/tv\/\d+\/images$/,
      /^\/movie\/\d+\/videos$/,
      /^\/tv\/\d+\/videos$/,
      /^\/movie\/\d+\/reviews$/,
      /^\/tv\/\d+\/reviews$/,
      /^\/collection\/\d+$/,
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(endpoint));
    if (!isAllowed) {
      console.error('Endpoint not allowed:', endpoint);
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query parameters
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      ...(params || {}),
    });

    const tmdbUrl = `${TMDB_BASE_URL}${endpoint}?${searchParams}`;
    console.log('Proxying request to TMDB:', endpoint, 'client:', rateLimitKey, 'remaining:', rateLimit.remaining);

    const response = await fetch(tmdbUrl);

    if (!response.ok) {
      console.error('TMDB API error:', response.status);
      return new Response(
        JSON.stringify({ error: `TMDB API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
        } 
      }
    );
  } catch (error) {
    console.error('TMDB proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch movie data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
