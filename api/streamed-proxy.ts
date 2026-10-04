import type { VercelRequest, VercelResponse } from '@vercel/node';

const STREAMED_BASE_URL = 'https://streamed.su';

type ProxyRequest =
  | { resource: 'sports' }
  | { resource: 'live-matches' }
  | { resource: 'streams'; source: string; id: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getUpstreamPath(body: unknown): string | null {
  if (!isRecord(body)) return null;

  const request = body as Partial<ProxyRequest>;
  if (request.resource === 'sports') return '/api/sports';
  if (request.resource === 'live-matches') return '/api/matches/live';

  if (
    request.resource === 'streams' &&
    typeof request.source === 'string' &&
    typeof request.id === 'string' &&
    /^[a-zA-Z0-9._:-]{1,160}$/.test(request.source) &&
    /^[a-zA-Z0-9._:-]{1,160}$/.test(request.id) &&
    !request.source.includes('..') &&
    !request.id.includes('..')
  ) {
    return `/api/stream/${encodeURIComponent(request.source)}/${encodeURIComponent(request.id)}`;
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const upstreamPath = getUpstreamPath(req.body);
  if (!upstreamPath) {
    return res.status(400).json({ error: 'Invalid Sports data request' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${STREAMED_BASE_URL}${upstreamPath}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': STREAMED_BASE_URL
      },
    });

    if (!response.ok) {
      console.error('Streamed API error:', response.status, upstreamPath);
      return res.status(response.status).json({
        error: `Sports provider error: ${response.status}`,
      });
    }

    const data: unknown = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Streamed proxy error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({ error: 'Sports provider request timed out' });
    }
    return res.status(502).json({ error: 'Unable to reach Sports provider' });
  } finally {
    clearTimeout(timeout);
  }
}