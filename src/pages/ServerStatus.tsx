import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Wifi } from 'lucide-react';
import { ANIME_SERVERS, MOVIE_TV_SERVERS, getPlayerUrl } from '@/lib/tmdb';

const TEST_ID = 68726;

type Status = 'checking' | 'online' | 'slow' | 'offline' | 'timeout';

interface ServerHealth {
  id: string;
  name: string;
  number: number;
  category: 'anime' | 'movie-tv';
  origin: string;
  status: Status;
  ms: number | null;
}

// Ping just the domain root — embed URLs can be slow/redirect-heavy.
// With no-cors: success (opaque response) = server is reachable.
// TypeError = DNS/network failure = server is down.
// AbortError = no response within timeout = timeout.
async function pingOrigin(origin: string, timeoutMs: number): Promise<{ ok: boolean; ms: number; timedOut: boolean }> {
  const start = Date.now();
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetch(`${origin}/`, {
      mode: 'no-cors',
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return { ok: true, ms: Date.now() - start, timedOut: false };
  } catch (e: any) {
    clearTimeout(timer);
    const ms = Date.now() - start;
    if (e?.name === 'AbortError') return { ok: false, ms, timedOut: true };
    return { ok: false, ms, timedOut: false };
  }
}

// Image-based fallback: if fetch fails (blocked by some networks), try loading
// the favicon. If the image request gets any HTTP response (even 404), the server is up.
// We use response timing — a DNS failure resolves < 300ms; a real HTTP error takes longer.
function pingImage(origin: string, timeoutMs: number): Promise<{ ok: boolean; ms: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const img   = new Image();
    const timer = setTimeout(() => {
      img.src = '';
      resolve({ ok: false, ms: Date.now() - start });
    }, timeoutMs);

    const done = (ok: boolean) => {
      clearTimeout(timer);
      resolve({ ok, ms: Date.now() - start });
    };

    img.onload  = () => done(true);
    // onerror: if < 400ms, likely DNS failure (server down); if ≥ 400ms, server sent an HTTP error (still up)
    img.onerror = () => done(Date.now() - start >= 400);
    img.src = `${origin}/favicon.svg?_=${Date.now()}`;
  });
}

async function checkServer(origin: string): Promise<{ status: Status; ms: number }> {
  // Primary: fast no-cors fetch, 7s timeout
  const primary = await pingOrigin(origin, 7000);

  if (primary.ok) {
    const status: Status = primary.ms > 3000 ? 'slow' : 'online';
    return { status, ms: primary.ms };
  }

  if (primary.timedOut) {
    // Retry once with a tighter window to confirm timeout
    const retry = await pingOrigin(origin, 4000);
    if (retry.ok) return { status: retry.ms > 3000 ? 'slow' : 'online', ms: retry.ms };
    return { status: 'timeout', ms: primary.ms };
  }

  // TypeError (network/DNS failure): confirm with image fallback
  const fallback = await pingImage(origin, 5000);
  if (fallback.ok) {
    const status: Status = fallback.ms > 3000 ? 'slow' : 'online';
    return { status, ms: fallback.ms };
  }

  return { status: 'offline', ms: primary.ms };
}

function extractOrigin(url: string): string {
  try { return new URL(url).origin; }
  catch { return url; }
}

const statusConfig: Record<Status, { dot: string; label: string; text: string }> = {
  checking: { dot: 'bg-zinc-500 animate-pulse',                  label: '…',       text: 'text-zinc-500' },
  online:   { dot: 'bg-emerald-400 shadow-[0_0_5px_#34d399]',   label: 'online',   text: 'text-emerald-400' },
  slow:     { dot: 'bg-yellow-400  shadow-[0_0_5px_#facc15]',   label: 'slow',     text: 'text-yellow-400' },
  offline:  { dot: 'bg-red-500',                                 label: 'offline',  text: 'text-red-400' },
  timeout:  { dot: 'bg-orange-500',                              label: 'timeout',  text: 'text-orange-400' },
};

const Dot = ({ status }: { status: Status }) => (
  <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${statusConfig[status].dot}`} />
);

const msColor = (ms: number) =>
  ms < 500 ? 'text-emerald-500' : ms < 2000 ? 'text-yellow-500' : 'text-orange-500';

const ServerRow = ({ srv }: { srv: ServerHealth }) => {
  const cfg = statusConfig[srv.status];
  return (
    <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-700 transition-colors">
      <span className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 flex-shrink-0">
        {srv.number}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white leading-tight">{srv.name}</p>
        <p className="text-[9px] text-zinc-600 truncate leading-tight">{srv.origin}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Dot status={srv.status} />
        <span className={`text-[10px] font-semibold w-10 ${cfg.text}`}>{cfg.label}</span>
        {srv.ms !== null && (srv.status === 'online' || srv.status === 'slow') && (
          <span className={`text-[9px] font-mono w-12 text-right ${msColor(srv.ms)}`}>{srv.ms}ms</span>
        )}
        {srv.ms !== null && (srv.status === 'timeout' || srv.status === 'offline') && (
          <span className="text-[9px] font-mono w-12 text-right text-zinc-600">{srv.ms}ms</span>
        )}
        {srv.status === 'checking' && (
          <span className="w-12 text-right text-[9px] text-zinc-700">—</span>
        )}
      </div>
    </div>
  );
};

const ServerStatus = () => {
  const [servers, setServers] = useState<ServerHealth[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const buildList = useCallback((): ServerHealth[] => [
    ...ANIME_SERVERS.map((s, i) => {
      const url = getPlayerUrl(TEST_ID, 'movie', s.id);
      return { id: s.id, name: s.name, number: i + 1, category: 'anime' as const,
               origin: extractOrigin(url), status: 'checking' as Status, ms: null };
    }),
    ...MOVIE_TV_SERVERS.map((s, i) => {
      const url = getPlayerUrl(TEST_ID, 'movie', s.id);
      return { id: s.id, name: s.name, number: ANIME_SERVERS.length + i + 1, category: 'movie-tv' as const,
               origin: extractOrigin(url), status: 'checking' as Status, ms: null };
    }),
  ], []);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const list = buildList();
    setServers(list);

    await Promise.all(list.map(async (srv) => {
      const result = await checkServer(srv.origin);
      setServers(prev => prev.map(s => s.id === srv.id ? { ...s, ...result } : s));
    }));

    setLastChecked(new Date());
    setRunning(false);
  }, [buildList]);

  useEffect(() => { runChecks(); }, [runChecks]);

  const counts = {
    online:  servers.filter(s => s.status === 'online').length,
    slow:    servers.filter(s => s.status === 'slow').length,
    offline: servers.filter(s => s.status === 'offline' || s.status === 'timeout').length,
  };

  const anime   = servers.filter(s => s.category === 'anime');
  const movieTv = servers.filter(s => s.category === 'movie-tv');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">Server Health</span>
            <span className="text-zinc-600 text-xs hidden sm:inline">— pirateone</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/><span className="text-emerald-400 font-medium">{counts.online}</span></span>
              {counts.slow > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block"/><span className="text-yellow-400 font-medium">{counts.slow}</span></span>}
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/><span className="text-red-400 font-medium">{counts.offline}</span></span>
            </div>
            {lastChecked && <span className="text-zinc-600 hidden md:block">{lastChecked.toLocaleTimeString()}</span>}
            <button onClick={runChecks} disabled={running}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3 h-3 ${running ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-4">
        {/* Summary bar */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total',   val: servers.length, cls: 'text-white' },
            { label: 'Online',  val: counts.online,  cls: 'text-emerald-400' },
            { label: 'Slow',    val: counts.slow,    cls: 'text-yellow-400' },
            { label: 'Down',    val: counts.offline, cls: 'text-red-400' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-center">
              <div className={`text-xl font-bold ${cls}`}>{val}</div>
              <div className="text-zinc-500 text-[10px]">{label}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>online &lt;3s</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block"/>slow &gt;3s</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"/>timeout</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>offline</span>
          <span className="text-zinc-700 ml-auto">pings base domain · image fallback · retry on failure</span>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block"/> Anime + Movies + TV
            </p>
            <div className="space-y-1">
              {anime.map(srv => <ServerRow key={srv.id} srv={srv} />)}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-400 inline-block"/> Movies + TV Only
            </p>
            <div className="space-y-1">
              {movieTv.map(srv => <ServerRow key={srv.id} srv={srv} />)}
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] text-zinc-700 mt-4">
          Method: fetch no-cors → image fallback → retry. Slow = &gt;3 s. Results vary by region.
        </p>
      </div>
    </div>
  );
};

export default ServerStatus;
