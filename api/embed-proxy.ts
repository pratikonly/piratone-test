import type { VercelRequest, VercelResponse } from '@vercel/node';
import embedProxyHandler from './embed/[...path]';

export const config = {
  api: { bodyParser: false },
};

function queryValue(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length === 1) return value[0];
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const mode = queryValue(req.query.proxyMode);
  const pathValue = req.query.proxyPath;
  const proxyPath = Array.isArray(pathValue) ? pathValue.join('/') : pathValue;

  if (
    !mode ||
    !['embed', 'root', 'local'].includes(mode) ||
    typeof proxyPath !== 'string' ||
    !proxyPath
  ) {
    return res.status(400).json({ error: 'Invalid embed proxy route' });
  }

  const requestUrl = new URL(req.url ?? '/', 'https://proxy.invalid');
  const forwardedQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'proxyMode' || key === 'proxyPath') continue;
    if (typeof value === 'string') {
      forwardedQuery.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => forwardedQuery.append(key, item));
    }
  }

  const originalUrl = req.url;
  const originalQuery = req.query;
  const search = forwardedQuery.toString();
  req.url = `${requestUrl.pathname}${search ? `?${search}` : ''}`;
  req.query = {
    ...req.query,
    path: [mode, ...proxyPath.split('/')],
  };

  try {
    return await embedProxyHandler(req, res);
  } finally {
    req.url = originalUrl;
    req.query = originalQuery;
  }
}