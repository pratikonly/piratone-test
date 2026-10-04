import type { VercelRequest, VercelResponse } from '@vercel/node';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Allowed endpoints to prevent abuse
const ALLOWED_ENDPOINTS = [
  /^\/trending\/(movie|tv|all)\/(day|week)$/,
  /^\/movie\/(popular|top_rated|now_playing)$/,
  /^\/tv\/(popular|top_rated|on_the_air)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/movie\/\d+$/,
  /^\/tv\/\d+$/,
  /^\/tv\/\d+\/season\/\d+$/,
  /^\/search\/(multi|movie|tv)$/,
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

function isAllowedEndpoint(endpoint: string): boolean {
  return ALLOWED_ENDPOINTS.some(pattern => pattern.test(endpoint));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const body = req.body;
    if (!isRecord(body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { endpoint, params = {} } = body;

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    // Validate endpoint
    if (!isAllowedEndpoint(endpoint)) {
      return res.status(403).json({ error: 'Endpoint not allowed' });
    }

    if (!isRecord(params) || Object.keys(params).length > 50) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    // Build URL with params
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    
    // Add additional params
    Object.entries(params).forEach(([key, value]) => {
      if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(key) || typeof value !== 'string' || value.length > 500) {
        throw new Error('Invalid query parameter');
      }
      if (key !== 'api_key') url.searchParams.set(key, value);
    });

    // Fetch from TMDB
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url.toString(), { signal: controller.signal });

      if (!response.ok) {
        console.error('TMDB API error:', response.status);
        return res.status(response.status).json({
          error: `TMDB API error: ${response.status}`,
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('TMDB proxy error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({ error: 'TMDB request timed out' });
    }
    if (error instanceof Error && error.message === 'Invalid query parameter') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
