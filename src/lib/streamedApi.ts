const imageProxyUrl = (kind: 'poster' | 'badge', id: string) => {
  if (import.meta.env.DEV) {
    return `/api/streamed-image?kind=${kind}&id=${encodeURIComponent(id)}`;
  }
  return `/api/streamed-image?kind=${kind}&id=${encodeURIComponent(id)}`;
};

export interface SportCategory { id: string; name: string }
export interface MatchTeam { name: string; badge?: string }
export interface SportMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  poster?: string;
  popular?: boolean;
  teams?: { home?: MatchTeam; away?: MatchTeam } | null;
  sources: { source: string; id: string }[];
}
export interface MatchStream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
}

type SportsProxyRequest =
  | { resource: 'sports' }
  | { resource: 'live-matches' }
  | { resource: 'streams'; source: string; id: string };

const get = async <T,>(request: SportsProxyRequest, signal?: AbortSignal): Promise<T> => {
  const res = await fetch('/api/streamed-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Sports request failed (${res.status})`);
  }
  return res.json();
};

export const fetchSports = (signal?: AbortSignal) => get<SportCategory[]>({ resource: 'sports' }, signal);
export const fetchLiveMatches = (signal?: AbortSignal) => get<SportMatch[]>({ resource: 'live-matches' }, signal);
export const fetchStreams = (source: string, id: string, signal?: AbortSignal) =>
  get<MatchStream[]>({ resource: 'streams', source, id }, signal);

export const posterUrl = (m: SportMatch) => {
  const match = m.poster?.match(/^\/api\/images\/proxy\/([A-Za-z0-9+-]{1,180})\.webp$/);
  return match ? imageProxyUrl('poster', match[1]) : null;
};

export const badgeUrl = (badge?: string) =>
  badge && /^[A-Za-z0-9+-]{1,180}$/.test(badge) ? imageProxyUrl('badge', badge) : null;
