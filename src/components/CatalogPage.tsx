import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/lib/tmdb';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export interface CatalogPageResult {
  results: Movie[];
  hasNextPage: boolean;
}

export interface CatalogTab {
  id: string;
  label: string;
  fetchPage: (page: number) => Promise<CatalogPageResult>;
}

interface CatalogPageProps {
  /** Unique name used for query keys and remembering the active tab */
  slug: string;
  title: string;
  subtitle: string;
  tabs: CatalogTab[];
  /** Movies shown in the top slider */
  fetchHero: () => Promise<Movie[]>;
  /** Optional search box (anime) */
  search?: (query: string, page: number) => Promise<CatalogPageResult>;
  searchPlaceholder?: string;
}

const STALE_TIME = 10 * 60 * 1000;
const GRID_STYLE = { gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' };

// Remember which tab was open so coming back to a page feels instant
const lastTabBySlug = new Map<string, string>();

const SkeletonGrid = () => (
  <div className="grid gap-2" style={GRID_STYLE}>
    {[...Array(24)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-2.5 w-10 bg-muted rounded animate-pulse" />
      </div>
    ))}
  </div>
);

const uniqueMovies = (items: Movie[]) => {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.media_type || 'movie'}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const CatalogPage = ({
  slug,
  title,
  subtitle,
  tabs,
  fetchHero,
  search,
  searchPlaceholder = 'Search...',
}: CatalogPageProps) => {
  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = lastTabBySlug.get(slug);
    return saved && tabs.some(tab => tab.id === saved) ? saved : tabs[0].id;
  });
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebounce(searchInput.trim(), 400);

  const activeTab = tabs.find(tab => tab.id === activeTabId) ?? tabs[0];
  const isSearching = Boolean(search && searchTerm);

  const selectTab = (id: string) => {
    lastTabBySlug.set(slug, id);
    setSearchInput('');
    setActiveTabId(id);
  };

  // Top slider (cached, so it is already there when you come back)
  const hero = useQuery({
    queryKey: ['catalog', slug, 'hero'],
    queryFn: fetchHero,
    staleTime: STALE_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Grid: every page you scrolled through stays cached, and tab switches keep the old grid on screen
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['catalog', slug, isSearching ? 'search' : activeTab.id, isSearching ? searchTerm : ''],
    queryFn: ({ pageParam }) =>
      isSearching && search ? search(searchTerm, pageParam) : activeTab.fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasNextPage ? allPages.length + 1 : undefined),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(
    () => uniqueMovies((data?.pages ?? []).flatMap(page => page.results)),
    [data],
  );

  useEffect(() => {
    if (isError) console.error(`Failed to load ${slug} catalog:`, error);
  }, [error, isError, slug]);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '500px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const heroMovies = hero.data ?? [];
  const showHero = hero.isLoading || heroMovies.length > 0;

  return (
    <div className="relative isolate overflow-hidden">
      <div className="relative z-10">
        {showHero ? (
          <>
            <HeroBanner
              movies={heroMovies}
              isLoading={hero.isLoading}
              compact
            />

            {/* Soft shadow straddling the hero/content joint to hide any seam (net layout height 0) */}
            <div
              aria-hidden="true"
              className="pointer-events-none relative z-20 -mb-12 -mt-28 h-40"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.35) 50%, transparent 100%)',
              }}
            />
          </>
        ) : (
          // Slider failed to load: keep the content clear of the floating navbar
          <div className="h-24 sm:h-28" aria-hidden="true" />
        )}

        <div className="px-4 pb-0 lg:px-6">
          <h1 className="font-display text-3xl lg:text-4xl">{title}</h1>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{subtitle}</p>

          {/* Pill tabs */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-semibold tracking-[0.04em] transition-colors',
                  !isSearching && activeTab.id === tab.id
                    ? 'border-white bg-white text-black'
                    : 'border-white/20 bg-white/[0.06] text-white/80 hover:bg-white/15',
                )}
              >
                {tab.label}
              </button>
            ))}

            {search && (
              <input
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-8 w-full max-w-xs rounded-full border border-white/20 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-white/50 sm:ml-2"
              />
            )}
          </div>

          {isLoading ? (
            <SkeletonGrid />
          ) : isError && items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Couldn't load this list right now. Please try again in a moment.
              {error instanceof Error && (
                <span className="mt-1 block text-xs opacity-60">{error.message}</span>
              )}
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nothing found.</p>
          ) : (
            <div className="grid gap-2" style={GRID_STYLE}>
              {items.map((movie, i) => (
                <MovieCard
                  key={`${movie.media_type || 'movie'}-${movie.id}`}
                  movie={movie}
                  index={i}
                  className="w-full"
                />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel, always mounted so the observer can fire */}
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {!isLoading && !isFetchingNextPage && !hasNextPage && items.length > 0 && (
              <p className="text-sm text-muted-foreground">You've reached the end</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;