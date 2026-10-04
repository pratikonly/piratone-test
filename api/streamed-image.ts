import type { VercelRequest, VercelResponse } from '@vercel/node';

const STREAMED_BASE_URL = 'https://streamed.su';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';

function getImagePath(query: VercelRequest['query']): string | null {
  const { kind, id } = query;
  if (
    typeof kind !== 'string' ||
    typeof id !== 'string' ||
    !/^[A-Za-z0-9+-]{1,180}$/.test(id)
  ) {
    return null;
  }

  if (kind === 'poster') return `/api/images/proxy/${id}.webp`;
  if (kind === 'badge') return `/api/images/badge/${id}.webp`;
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }

  const imagePath = getImagePath(req.query);
  if (!imagePath) {
    return res.status(400).send('Invalid Sports image request');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${STREAMED_BASE_URL}${imagePath}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/webp',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': STREAMED_BASE_URL
      },
      redirect: 'error',
    });

    if (!response.ok) {
      return res.status(response.status === 404 ? 404 : 502).send('Sports image unavailable');
    }

    const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (contentType !== 'image/webp') {
      return res.status(502).send('Unexpected Sports image format');
    }

    const declaredSize = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) {
      return res.status(502).send('Sports image is too large');
    }

    const image = Buffer.from(await response.arrayBuffer());
    if (image.length === 0 || image.length > MAX_IMAGE_BYTES) {
      return res.status(502).send('Invalid Sports image size');
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', image.length);
    res.setHeader('Cache-Control', IMAGE_CACHE_CONTROL);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(image);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).send('Sports image request timed out');
    }
    console.error('Streamed image proxy error:', error);
    return res.status(502).send('Unable to load Sports image');
  } finally {
    clearTimeout(timeout);
  }
}