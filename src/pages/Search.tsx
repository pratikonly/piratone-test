import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Film, Tv, Loader2, Hash, X, ChevronDown } from 'lucide-react';
import { searchMulti, getBackdropUrl, getTrending, Movie, getMovieDetails, getTVDetails, discoverMovies, discoverTV } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import SearchFilters, { SearchFilterValues } from '@/components/SearchFilters';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSetBackdropUrl } from '@/contexts/BackdropContext';
import DisclaimerFooter from '@/components/DisclaimerFooter';
import { useDebounce } from '@/hooks/useDebounce';

/* ─── Detect if the query looks like a TMDB ID ─── */
// Formats accepted:
//   123456          → ambiguous, we'll search both movie + tv
//   movie:123456    → movie only
//   tv:123456       → tv only
//   m:123456        → movie only
//   t:123456        → tv only
function parseTmdbId(raw: string): { id: number; type: 'movie' | 'tv' | 'both' } | null {
  const s = raw.trim();
  const movieMatch = s.match(/^(?:movie|m):(\d+)$/i);
  if (movieMatch) return { id: parseInt(movieMatch[1]), type: 'movie' };
  const tvMatch = s.match(/^(?:tv|t):(\d+)$/i);
  if (tvMatch) return { id: parseInt(tvMatch[1]), type: 'tv' };
  const numMatch = s.match(/^\d{1,8}$/);
  if (numMatch) return { id: parseInt(s), type: 'both' };
  return null;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [idMode, setIdMode] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [idType, setIdType] = useState<'both' | 'movie' | 'tv'>('both');
  const [idResult, setIdResult] = useState<Movie | null>(null);
  const [idLoading, setIdLoading] = useState(false);
  const [idError, setIdError] = useState('');
  const [filters, setFilters] = useState<SearchFilterValues>({ genre: '', year: '', rating: '', sortBy: '' });
  const [filterResults, setFilterResults] = useState<Movie[]>([]);
  const [filterMediaType, setFilterMediaType] = useState<'movie' | 'tv'>('movie');
  const currentIndexRef = useRef(0);
  const setBackdropUrl = useSetBackdropUrl();
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 300);
  const debouncedId = useDebounce(idInput.trim(), 500);
  const hasActiveFilters = filters.genre || filters.year || filters.rating || filters.sortBy;

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrending('all', 'week');
        setTrendingMovies(data);
      } catch {}
    };
    fetchTrending();
  }, []);

  // ── Discover with filters ──
  useEffect(() => {
    if (!hasActiveFilters || idMode) return;
    const run = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filters.genre) params.with_genres = filters.genre;
        if (filters.year) {
          if (filterMediaType === 'movie') params.primary_release_year = filters.year;
          else params.first_air_date_year = filters.year;
        }
        if (filters.rating) params['vote_average.gte'] = filters.rating;
        if (filters.sortBy) params.sort_by = filters.sortBy;

        const discoverFn = filterMediaType === 'movie' ? discoverMovies : discoverTV;
        const data = await discoverFn(params);
        setFilterResults(data.results);
      } catch (e) {
        console.error('Discover error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [filters, filterMediaType, hasActiveFilters, idMode]);

  // ── Text search ──
  useEffect(() => {
    if (idMode) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (debouncedQuery.length < 2) { setResults([]); setIsLoading(false); return; }

    const ac = new AbortController();
    abortControllerRef.current = ac;

    const run = async () => {
      setIsLoading(true);
      currentIndexRef.current = 0;
      try {
        const data = await searchMulti(debouncedQuery);
        if (!ac.signal.aborted) setResults(data);
      } catch (e) {
        if (!ac.signal.aborted) console.error(e);
      } finally {
        if (!ac.signal.aborted) setIsLoading(false);
      }
    };
    run();
    return () => ac.abort();
  }, [debouncedQuery, idMode]);

  // ── TMDB ID lookup ──
  useEffect(() => {
    if (!idMode) return;
    if (!debouncedId || isNaN(Number(debouncedId))) {
      setIdResult(null);
      setIdError('');
      return;
    }
    const id = parseInt(debouncedId);
    if (id <= 0) { setIdError('Enter a valid TMDB ID'); return; }

    const run = async () => {
      setIdLoading(true);
      setIdError('');
      setIdResult(null);

      try {
        if (idType === 'movie') {
          const m = await getMovieDetails(id);
          setIdResult({ ...m, media_type: 'movie' } as Movie);
        } else if (idType === 'tv') {
          const t = await getTVDetails(id);
          setIdResult({ ...t, media_type: 'tv' } as Movie);
        } else {
          // Try movie first, then tv
          try {
            const m = await getMovieDetails(id);
            setIdResult({ ...m, media_type: 'movie' } as Movie);
          } catch {
            const t = await getTVDetails(id);
            setIdResult({ ...t, media_type: 'tv' } as Movie);
          }
        }
      } catch {
        setIdError(`No ${idType === 'both' ? 'movie or TV show' : idType} found with ID ${id}`);
      } finally {
        setIdLoading(false);
      }
    };
    run();
  }, [debouncedId, idType, idMode]);

  // ── Backdrop rotation ──
  useEffect(() => {
    const movies = results.length > 0 ? results : trendingMovies;
    if (movies.length === 0) return;
    const update = () => {
      const m = movies[currentIndexRef.current % movies.length];
      if (m?.backdrop_path) setBackdropUrl(getBackdropUrl(m.backdrop_path, 'original'));
    };
    update();
    const iv = setInterval(() => {
      currentIndexRef.current = (currentIndexRef.current + 1) % Math.min(movies.length, 10);
      update();
    }, 8000);
    return () => { clearInterval(iv); setBackdropUrl(null); };
  }, [results, trendingMovies, setBackdropUrl]);

  const movies = results.filter(r => r.media_type === 'movie');
  const tvShows = results.filter(r => r.media_type === 'tv');
  const hasQuery = query.trim().length > 0;
  const isQueryTooShort = query.trim().length > 0 && query.trim().length < 2;

  const MovieGrid = ({ items }: { items: Movie[] }) => (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1 lg:gap-1.5">
      {items.map((movie, index) => (
        <MovieCard key={movie.id} movie={movie} index={index} />
      ))}
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1 lg:gap-1.5">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 bg-muted rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col p-4 lg:p-8 pt-4 lg:pt-8">
      <h1 className="font-display text-3xl lg:text-4xl mb-6 lg:mb-8">Search</h1>

      {/* ── Mode toggle ── */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setIdMode(false); setIdResult(null); setIdError(''); }}
          style={{
            height: 34, padding: '0 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: !idMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: !idMode ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
            color: !idMode ? '#fff' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.2s',
          }}
        >
          <SearchIcon size={13} />
          Search by Name
        </button>
        <button
          onClick={() => { setIdMode(true); setResults([]); }}
          style={{
            height: 34, padding: '0 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: idMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: idMode ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
            color: idMode ? '#fff' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.2s',
          }}
        >
          <Hash size={13} />
          Search by TMDB ID
        </button>
      </div>

      {/* ── Filters ── */}
      {!idMode && (
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setFilterMediaType('movie')} className={`text-xs px-2 py-1 rounded ${filterMediaType === 'movie' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Movies</button>
            <button onClick={() => setFilterMediaType('tv')} className={`text-xs px-2 py-1 rounded ${filterMediaType === 'tv' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>TV Shows</button>
          </div>
          <SearchFilters filters={filters} onChange={setFilters} mediaType={filterMediaType} />
        </div>
      )}

      {/* ── NAME SEARCH INPUT ── */}
      {!idMode && (
        <div className="mb-6 lg:mb-8 max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for movies, TV shows..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 lg:pl-12 pr-10 lg:pr-12 h-12 lg:h-14 text-base lg:text-lg bg-muted border-border focus:border-primary"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-10 lg:right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isLoading && (
              <Loader2 className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-muted-foreground animate-spin" />
            )}
          </div>
          {isQueryTooShort && (
            <p className="text-muted-foreground text-sm mt-2">Type at least 2 characters to search…</p>
          )}
        </div>
      )}

      {/* ── TMDB ID SEARCH INPUT ── */}
      {idMode && (
        <div className="mb-6 lg:mb-8 max-w-2xl">
          <div className="flex gap-2">
            {/* Type selector */}
            <div className="relative">
              <select
                value={idType}
                onChange={e => { setIdType(e.target.value as any); setIdResult(null); setIdError(''); }}
                style={{
                  height: 48, paddingLeft: 12, paddingRight: 32,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer', appearance: 'none', outline: 'none',
                  minWidth: 100,
                }}
              >
                <option value="both" style={{ background: '#111' }}>Auto</option>
                <option value="movie" style={{ background: '#111' }}>Movie</option>
                <option value="tv" style={{ background: '#111' }}>TV Show</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
            </div>

            {/* ID input */}
            <div className="relative flex-1">
              <Hash className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter TMDB ID e.g. 550"
                value={idInput}
                onChange={e => { setIdInput(e.target.value); setIdResult(null); setIdError(''); }}
                className="pl-10 lg:pl-12 pr-10 h-12 lg:h-14 text-base lg:text-lg bg-muted border-border focus:border-primary"
                autoFocus
              />
              {idInput && (
                <button onClick={() => { setIdInput(''); setIdResult(null); setIdError(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              {idLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>

          {/* Helper hint */}
          <p className="text-muted-foreground text-xs mt-2">
            Find the TMDB ID from <span className="text-foreground/70">themoviedb.org</span> URL — e.g. themoviedb.org/movie/<strong>550</strong> or themoviedb.org/tv/<strong>1396</strong>
          </p>

          {/* Error */}
          {idError && (
            <p className="text-destructive text-sm mt-2">{idError}</p>
          )}
        </div>
      )}

      {/* ── RESULTS ── */}
      <div className="flex-1">

        {/* ID mode result */}
        {idMode && idResult && !idLoading && (
          <div>
            {/* Result badge */}
            <div className="flex items-center gap-2 mb-4">
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                background: idResult.media_type === 'movie' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
                border: `1px solid ${idResult.media_type === 'movie' ? 'rgba(59,130,246,0.3)' : 'rgba(168,85,247,0.3)'}`,
                color: idResult.media_type === 'movie' ? '#60a5fa' : '#c084fc',
              }}>
                {idResult.media_type === 'movie' ? <Film size={11} /> : <Tv size={11} />}
                {idResult.media_type === 'movie' ? 'Movie' : 'TV Show'} · ID {idInput}
              </span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1 lg:gap-1.5">
              <MovieCard movie={idResult} index={0} />
            </div>
          </div>
        )}

        {/* ID mode empty */}
        {idMode && !idInput && !idLoading && (
          <div className="text-center py-12 lg:py-16">
            <Hash className="w-12 lg:w-16 h-12 lg:h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-base lg:text-lg">Enter a TMDB ID to look up any title directly</p>
            <p className="text-muted-foreground text-sm mt-1">Use the type dropdown to filter by Movie or TV Show</p>
          </div>
        )}

        {/* Loading skeleton while searching */}
        {!idMode && isLoading && debouncedQuery.length >= 2 && <LoadingSkeleton />}
        {!idMode && isLoading && hasActiveFilters && !hasQuery && <LoadingSkeleton />}

        {/* Text search results */}
        {!idMode && !isLoading && debouncedQuery.length >= 2 && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No results found for "{debouncedQuery}"</p>
                <p className="text-muted-foreground mt-2">Try a different search term or switch to TMDB ID search</p>
              </div>
            ) : results.length > 0 ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-8 bg-muted/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All ({results.length})
                  </TabsTrigger>
                  <TabsTrigger value="movies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Film className="w-4 h-4 mr-2" />Movies ({movies.length})
                  </TabsTrigger>
                  <TabsTrigger value="tv" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Tv className="w-4 h-4 mr-2" />TV Shows ({tvShows.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all"><MovieGrid items={results} /></TabsContent>
                <TabsContent value="movies"><MovieGrid items={movies} /></TabsContent>
                <TabsContent value="tv"><MovieGrid items={tvShows} /></TabsContent>
              </Tabs>
            ) : null}
          </>
        )}

        {/* Filter results */}
        {!idMode && hasActiveFilters && !hasQuery && (
          filterResults.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {filterResults.length} {filterMediaType === 'movie' ? 'movies' : 'TV shows'} found
              </p>
              <MovieGrid items={filterResults} />
            </div>
          ) : !isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No results match your filters</p>
            </div>
          ) : null
        )}

        {/* Initial state */}
        {!idMode && !hasQuery && !hasActiveFilters && (
          <div className="text-center py-12 lg:py-16">
            <SearchIcon className="w-12 lg:w-16 h-12 lg:h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-base lg:text-lg">Search for your favorite movies and TV shows</p>
          </div>
        )}
      </div>

      <DisclaimerFooter />
    </div>
  );
};

export default Search;
