import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM_ORIGIN = new URL('https://embed.st');
const MAX_REQUEST_BODY_BYTES = 1_000_000;
const MAX_REWRITE_BODY_BYTES = 2_000_000;
const ROOT_ASSET_EXTENSION = /\.(?:css|js|mjs|json|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|m3u8|mp4|m4s|ts|vtt|xml)$/i;

export const config = {
  api: { bodyParser: false },
};

type ProxyTarget =
  | { kind: 'upstream'; path: string }
  | { kind: 'ad-frame' };

class PayloadTooLargeError extends Error {}

function getSegments(value: string | string[] | undefined): string[] | null {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split('/')
      : [];

  if (raw.length === 0) return null;
  if (raw.some((segment) => (
    !segment ||
    segment === '.' ||
    segment === '..' ||
    /[\\/?#\u0000-\u001f\u007f]/.test(segment)
  ))) {
    return null;
  }

  return raw;
}

function getTarget(value: string | string[] | undefined): ProxyTarget | null {
  const segments = getSegments(value);
  if (!segments) return null;

  const [route, ...tail] = segments;
  if (route === 'local' && tail.join('/') === 'ad.html') {
    return { kind: 'ad-frame' };
  }

  if (route === 'embed' && tail.length > 0) {
    return {
      kind: 'upstream',
      path: `/embed/${tail.map(encodeURIComponent).join('/')}`,
    };
  }

  if (route === 'root' && tail.length > 0) {
    const rootPath = tail.join('/');
    if (rootPath !== 'fetch' && !ROOT_ASSET_EXTENSION.test(rootPath)) return null;

    return {
      kind: 'upstream',
      path: `/${tail.map(encodeURIComponent).join('/')}`,
    };
  }

  return null;
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  const requestedHeaders = req.headers['access-control-request-headers'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    typeof requestedHeaders === 'string' ? requestedHeaders : 'Content-Type, Range',
  );
  res.setHeader('Access-Control-Max-Age', '600');
}

async function readRequestBody(req: VercelRequest): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return undefined;

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > MAX_REQUEST_BODY_BYTES) throw new PayloadTooLargeError();
    chunks.push(buffer);
  }

  return totalBytes ? Buffer.concat(chunks, totalBytes) : undefined;
}

async function readResponseText(response: Response): Promise<string> {
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = Buffer.from(value);
    totalBytes += chunk.length;
    if (totalBytes > MAX_REWRITE_BODY_BYTES) {
      await reader.cancel();
      throw new PayloadTooLargeError('Embed text response exceeded the rewrite limit');
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks, totalBytes).toString('utf8');
}

function proxyReference(reference: string): string {
  if (
    reference.startsWith('/e/') ||
    reference.startsWith('/ep/') ||
    /^\/(?:fetch|ad\.html)(?:[?#]|$)/.test(reference)
  ) {
    return reference;
  }
  if (!reference.startsWith('/') && !/^https?:\/\//i.test(reference)) return reference;

  let url: URL;
  try {
    url = new URL(reference, UPSTREAM_ORIGIN);
  } catch {
    return reference;
  }

  if (url.origin !== UPSTREAM_ORIGIN.origin) return reference;

  const suffix = `${url.search}${url.hash}`;
  if (url.pathname === '/ad.html') return `/ad.html${suffix}`;
  if (url.pathname === '/fetch') return `/fetch${suffix}`;
  if (url.pathname.startsWith('/embed/')) {
    return `/e/${url.pathname.slice('/embed/'.length)}${suffix}`;
  }
  return `/ep${url.pathname}${suffix}`;
}

function rewriteTextResponse(text: string, contentType: string): string {
  let rewritten = text.replace(
    /https:\/\/embed\.st(\/[^"'`<>\s)]*)/gi,
    (_match, path: string) => proxyReference(`https://embed.st${path}`),
  );

  if (contentType.includes('text/html')) {
    rewritten = rewritten.replace(
      /(\b(?:src|href|action|poster|data-src)\s*=\s*)(["'])(\/(?!\/)[^"']*)\2/gi,
      (_match, prefix: string, quote: string, path: string) =>
        `${prefix}${quote}${proxyReference(path)}${quote}`,
    );
  }

  if (contentType.includes('text/css')) {
    rewritten = rewritten.replace(
      /url\(\s*(["']?)(\/(?!\/)[^)"']+)\1\s*\)/gi,
      (_match, quote: string, path: string) => `url(${quote}${proxyReference(path)}${quote})`,
    );
  }

  if (contentType.includes('javascript')) {
    rewritten = rewritten
      .replace(
        /(\bfetch\s*\(\s*["'`])(\/(?!\/)[^"'`]*)(["'`])/gi,
        (_match, prefix: string, path: string, quote: string) =>
          `${prefix}${proxyReference(path)}${quote}`,
      )
      .replace(
        /(\.open\(\s*["'`][A-Z]+\s*,\s*["'`])(\/(?!\/)[^"'`]*)(["'`])/gi,
        (_match, prefix: string, path: string, quote: string) =>
          `${prefix}${proxyReference(path)}${quote}`,
      );
  }

  if (contentType.includes('mpegurl')) {
    rewritten = rewritten
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${proxyReference(uri)}"`);
        }
        return line.replace(trimmed, proxyReference(trimmed));
      })
      .join('\n');
  }

  return rewritten;
}

function rewriteLocation(location: string): string {
  return proxyReference(location);
}

const RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-range',
  'content-security-policy',
  'content-security-policy-report-only',
  'content-type',
  'etag',
  'expires',
  'last-modified',
  'referrer-policy',
  'vary',
  'x-frame-options',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const target = getTarget(req.query.path);
  if (!target) return res.status(400).json({ error: 'Unsupported embed proxy path' });

  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (target.kind === 'ad-frame') {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    return res.status(204).end();
  }

  const method = req.method ?? 'GET';
  if (!['GET', 'HEAD', 'POST'].includes(method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestUrl = new URL(req.url ?? '/', 'https://proxy.invalid');
  const upstreamUrl = new URL(`${target.path}${requestUrl.search}`, UPSTREAM_ORIGIN);
  const headers = new Headers();

  for (const name of [
    'accept',
    'accept-language',
    'content-type',
    'if-modified-since',
    'if-none-match',
    'if-range',
    'range',
    'referer',
    'origin',
    'user-agent',
  ]) {
    const value = req.headers[name];
    if (typeof value === 'string') headers.set(name, value);
  }
  headers.set('accept-encoding', 'identity');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const body = await readRequestBody(req);
    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : body,
      redirect: 'manual',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }

    const location = upstream.headers.get('location');
    if (location) res.setHeader('Location', rewriteLocation(location));
    res.status(upstream.status);

    const contentType = upstream.headers.get('content-type')?.toLowerCase() ?? '';
    const isTextResponse =
      contentType.includes('text/html') ||
      contentType.includes('text/css') ||
      contentType.includes('javascript') ||
      contentType.includes('mpegurl');

    if (method === 'HEAD' || upstream.status === 204 || upstream.status === 304 || !upstream.body) {
      return res.end();
    }

    if (isTextResponse) {
      const text = await readResponseText(upstream);
      const rewritten = rewriteTextResponse(text, contentType);
      res.removeHeader('content-length');
      res.end(rewritten);
      return;
    }

    await pipeline(Readable.fromWeb(upstream.body as never), res);
  } catch (error) {
    clearTimeout(timeout);
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }
    if (error instanceof PayloadTooLargeError) {
      return res.status(413).json({ error: 'Embed proxy request or text response is too large' });
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({ error: 'Embed provider request timed out' });
    }
    console.error('Embed proxy error:', error);
    return res.status(502).json({ error: 'Unable to reach the embed provider' });
  }
}