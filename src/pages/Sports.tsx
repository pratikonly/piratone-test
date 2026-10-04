import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowLeft, ChevronLeft, ChevronRight, CircleDot, Languages, Monitor, Play, Radio, RefreshCw, Search, Signal, Trophy } from 'lucide-react';
import {
  badgeUrl, fetchLiveMatches, fetchSports, fetchStreams, posterUrl, SportMatch,
} from '@/lib/streamedApi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sportsEmbedSrc = (embedUrl: string) => {
  try {
    const url = new URL(embedUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'embed.st' || !url.pathname.startsWith('/embed/')) {
      return embedUrl;
    }

    return `/e/${url.pathname.slice('/embed/'.length)}${url.search}${url.hash}`;
  } catch {
    return embedUrl;
  }
};

const TeamBadge = ({ badge, name }: { badge?: string; name?: string }) => {
  const url = badgeUrl(badge);
  return url ? (
    <img src={url} alt={name ?? ''} loading="lazy" className="h-10 w-10 object-contain drop-shadow" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
      {name?.slice(0, 2).toUpperCase() ?? '?'}
    </div>
  );
};

const MatchCard = ({ match, sportName, onSelect }: { match: SportMatch; sportName: string; onSelect: () => void }) => {
  const poster = posterUrl(match);
  const { home, away } = match.teams ?? {};
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {poster ? (
          <img src={poster} alt={match.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center gap-4">
            <TeamBadge badge={home?.badge} name={home?.name} />
            <span className="text-sm font-bold text-muted-foreground">VS</span>
            <TeamBadge badge={away?.badge} name={away?.name} />
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive-foreground" /> Live
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
          {sportName}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{match.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {match.sources.length} source{match.sources.length === 1 ? '' : 's'}
          {match.popular && ' · Popular'}
        </p>
      </div>
    </button>
  );
};

const SportsHero = ({ matches, sportName, onSelect }: { matches: SportMatch[]; sportName: Map<string, string>; onSelect: (m: SportMatch) => void }) => {
  const slides = useMemo(() => matches.filter(m => posterUrl(m)).slice(0, 6), [matches]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => { if (index >= slides.length) setIndex(0); }, [slides.length, index]);

  if (slides.length === 0) return null;
  const current = slides[Math.min(index, slides.length - 1)];
  const poster = posterUrl(current)!;
  const { home, away } = current.teams ?? {};

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative h-[300px] sm:h-[380px] md:h-[440px]">
        {slides.map((m, i) => (
          <img
            key={m.id}
            src={posterUrl(m)!}
            alt=""
            aria-hidden={i !== index}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive-foreground" /> Live
            </span>
            <span className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium text-foreground backdrop-blur">
              {sportName.get(current.category) ?? current.category}
            </span>
            {current.popular && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">Popular</span>
            )}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-3">
                <TeamBadge badge={home?.badge} name={home?.name} />
                <span className="text-xs font-bold text-muted-foreground">VS</span>
                <TeamBadge badge={away?.badge} name={away?.name} />
              </div>
              <h2 className="line-clamp-2 max-w-xl text-xl font-bold text-foreground sm:text-2xl md:text-3xl">{current.title}</h2>
              <button
                onClick={() => onSelect(current)}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
              >
                <Play className="h-4 w-4 fill-current" /> Watch Live
              </button>
            </div>

            {slides.length > 1 && (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <button
                  onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)}
                  aria-label="Previous match"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur transition-colors hover:border-primary/60"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIndex(i => (i + 1) % slides.length)}
                  aria-label="Next match"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur transition-colors hover:border-primary/60"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {slides.length > 1 && (
            <div className="flex gap-1.5">
              {slides.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/30 hover:bg-foreground/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchPlayer = ({
  match,
  sportName,
  related,
  onBack,
  onSelect,
}: {
  match: SportMatch;
  sportName: string;
  related: SportMatch[];
  onBack: () => void;
  onSelect: (match: SportMatch) => void;
}) => {
  const [sourceIdx, setSourceIdx] = useState(0);
  const [streamIdx, setStreamIdx] = useState(0);
  const src = match.sources[sourceIdx];
  const { home, away } = match.teams ?? {};

  const { data: streams, isLoading, isError, refetch } = useQuery({
    queryKey: ['streamed-streams', src?.source, src?.id],
    queryFn: ({ signal }) => fetchStreams(src.source, src.id, signal),
    enabled: !!src,
    staleTime: 60_000,
  });

  useEffect(() => { setStreamIdx(0); }, [sourceIdx]);
  const stream = streams?.[streamIdx];

  return (
    <div className="mx-auto max-w-[1500px]">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All live matches
      </Button>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-background shadow-card">
            {stream ? (
              <iframe
                key={stream.embedUrl}
                src={sportsEmbedSrc(stream.embedUrl)}
                title={match.title}
                className="absolute inset-0 h-full w-full"
                sandbox="allow-scripts allow-forms allow-presentation"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen *"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center text-sm text-muted-foreground">
                {isLoading ? (
                  <><RefreshCw className="h-7 w-7 animate-spin" /> Loading stream…</>
                ) : isError || (streams && streams.length === 0) ? (
                  <>
                    No stream available from this provider right now.
                    <Button size="sm" onClick={() => refetch()}>Retry</Button>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h1 className="mr-1 text-lg font-bold text-foreground sm:text-xl">{match.title}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-1 text-[10px] font-bold uppercase text-destructive">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> Live
            </span>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">{sportName}</span>
          </div>

          <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
            {(streams ?? []).map((item, i) => (
              <Button
                key={item.embedUrl}
                variant={i === streamIdx ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStreamIdx(i)}
                className="h-9 shrink-0 gap-1.5 px-3"
              >
                <Monitor className="h-3.5 w-3.5" /> Stream {item.streamNo}
                {item.hd && <span className="rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">HD</span>}
                {item.language && <span className="inline-flex items-center gap-1 text-[10px] opacity-70"><Languages className="h-3 w-3" />{item.language}</span>}
              </Button>
            ))}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">If the player shows an ad or redirects, close it and come back here.</p>

          {related.length > 0 && (
            <section className="mt-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                <h2 className="text-xs font-bold uppercase text-muted-foreground">More {sportName} matches</h2>
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">{related.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {related.map(item => {
                  const itemHome = item.teams?.home;
                  const itemAway = item.teams?.away;
                  return (
                    <Button
                      key={item.id}
                      variant="outline"
                      onClick={() => onSelect(item)}
                      className="h-14 justify-start overflow-hidden px-2 text-left"
                    >
                      <span className="flex shrink-0 -space-x-2">
                        <TeamBadge badge={itemHome?.badge} name={itemHome?.name} />
                        <TeamBadge badge={itemAway?.badge} name={itemAway?.name} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-foreground">{item.title}</span>
                        <span className="mt-0.5 block text-[10px] font-bold uppercase text-destructive">• Live · {item.sources.length} source{item.sources.length === 1 ? '' : 's'}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-3 xl:sticky xl:top-24">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><Activity className="h-4 w-4 text-primary" /> Match Info</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <TeamBadge badge={home?.badge} name={home?.name} />
                <span className="line-clamp-2 text-xs font-bold text-foreground">{home?.name ?? match.title.split(' vs ')[0]}</span>
              </div>
              <div className="shrink-0 text-center">
                <span className="block text-xs font-black text-muted-foreground">VS</span>
                <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase text-destructive"><span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Live</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <TeamBadge badge={away?.badge} name={away?.name} />
                <span className="line-clamp-2 text-xs font-bold text-foreground">{away?.name ?? match.title.split(' vs ')[1] ?? 'Opponent'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-card p-3"><span className="text-[9px] font-semibold uppercase text-muted-foreground">Sources</span><strong className="mt-1 block text-sm text-foreground">{match.sources.length}</strong></div>
            <div className="rounded-lg border border-border bg-card p-3"><span className="text-[9px] font-semibold uppercase text-muted-foreground">Category</span><strong className="mt-1 block truncate text-sm capitalize text-foreground">{sportName}</strong></div>
            <div className="rounded-lg border border-border bg-card p-3"><span className="text-[9px] font-semibold uppercase text-muted-foreground">Status</span><strong className="mt-1 block text-sm text-destructive">Live</strong></div>
            <div className="rounded-lg border border-border bg-card p-3"><span className="text-[9px] font-semibold uppercase text-muted-foreground">Streams</span><strong className="mt-1 block text-sm text-foreground">{streams?.length ?? 0}{streams?.some(item => item.hd) ? ' HD' : ''}</strong></div>
          </div>

          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase text-muted-foreground">Providers</p>
            <div className="space-y-1.5">
              {match.sources.map((source, i) => (
                <Button
                  key={`${source.source}-${source.id}`}
                  variant={i === sourceIdx ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSourceIdx(i)}
                  className="w-full justify-between capitalize"
                >
                  <span>{source.source}</span><span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                </Button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Sports = () => {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SportMatch | null>(null);

  const { data: sports } = useQuery({ queryKey: ['streamed-sports'], queryFn: ({ signal }) => fetchSports(signal), staleTime: 60 * 60_000 });
  const { data: matches, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['streamed-live'],
    queryFn: ({ signal }) => fetchLiveMatches(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const sportName = useMemo(() => new Map((sports ?? []).map(s => [s.id, s.name])), [sports]);
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    (matches ?? []).forEach(m => c.set(m.category, (c.get(m.category) ?? 0) + 1));
    return c;
  }, [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (matches ?? [])
      .filter(m => m.sources?.length)
      .filter(m => category === 'all' || m.category === category)
      .filter(m => !q || m.title.toLowerCase().includes(q) || m.category.includes(q))
      .sort((a, b) => Number(!!b.popular) - Number(!!a.popular));
  }, [matches, category, query]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [selected]);

  return (
    <div className="min-h-screen px-4 pb-16 pt-[76px] sm:pt-24 md:px-8">
      {selected ? (
        <MatchPlayer
          key={selected.id}
          match={selected}
          sportName={sportName.get(selected.category) ?? selected.category}
          related={(matches ?? []).filter(match => match.category === selected.category && match.id !== selected.id).slice(0, 10)}
          onBack={() => setSelected(null)}
          onSelect={setSelected}
        />
      ) : (
        <>
          {isLoading ? (
            <div className="mb-8 h-[300px] animate-pulse rounded-2xl border border-border bg-muted sm:h-[380px] md:h-[440px]" />
          ) : (
            <SportsHero matches={matches ?? []} sportName={sportName} onSelect={setSelected} />
          )}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
                <Trophy className="h-7 w-7 text-primary" /> Live Sports
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Radio className="h-4 w-4 text-destructive" />
                {matches ? `${filtered.length} live now` : 'Loading live matches…'} · updates every minute
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search team or match…"
                  className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={() => refetch()} aria-label="Refresh" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-primary/60">
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              </button>
            </div>
          </div>

          <div className="scrollbar-hide -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {[{ id: 'all', name: 'All' }, ...(sports ?? []).filter(s => counts.has(s.id))].map(s => (
              <button key={s.id} onClick={() => setCategory(s.id)}
                className={cn('shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors',
                  category === s.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/60')}>
                {s.name}
                <span className="ml-1.5 text-xs opacity-70">{s.id === 'all' ? matches?.length ?? 0 : counts.get(s.id)}</span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="aspect-video animate-pulse bg-muted" />
                  <div className="space-y-2 p-3"><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /><div className="h-3 w-1/3 animate-pulse rounded bg-muted" /></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Couldn't load live matches.{' '}
              <button onClick={() => refetch()} className="font-semibold text-primary">Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No live matches right now. Check back soon.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(m => (
                <MatchCard key={m.id} match={m} sportName={sportName.get(m.category) ?? m.category} onSelect={() => setSelected(m)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Sports;
