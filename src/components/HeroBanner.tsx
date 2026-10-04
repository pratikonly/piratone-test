import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Volume2, VolumeX } from 'lucide-react';
import { Movie, getBackdropUrl, getImageUrl, getMovieImages, getTVImages, getLogoUrl, getMovieVideos, getTVVideos, Video } from '@/lib/tmdb';
import { addToWatchlist, isInWatchlist } from '@/lib/watchlist';
import { addToWatchlistDb, isInWatchlistDb } from '@/lib/watchlistDb';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import TrailerModal from './TrailerModal';
import HeroTrailerBackground from './HeroTrailerBackground';
import { useSetBackdropUrl } from '@/contexts/BackdropContext';

const preloadImage = (src: string | null) => {
  if (!src) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
};

// Module-level caches so logos/trailers survive page changes (no skeleton flash on return)
const logoCache: Record<string, string | null> = {};
const trailerCache: Record<string, Video | null> = {};

// Which TMDB title to use for logo/trailer lookups (anime uses its matched TMDB title, if any)
const getTmdbRef = (movie: Movie): { id: number; media_type: 'movie' | 'tv' } | null => {
  if (movie.media_type === 'anime') return movie.tmdb_ref ?? null;
  return { id: movie.id, media_type: movie.media_type === 'tv' ? 'tv' : 'movie' };
};

interface HeroBannerProps {
  movies: Movie[];
  isLoading?: boolean;
  onArtworkChange?: (artworkUrl: string | null) => void;
  /** Slightly shorter hero for catalog pages (Movies / Series / Anime) */
  compact?: boolean;
}

const HeroBanner = ({ movies, isLoading = false, onArtworkChange, compact = false }: HeroBannerProps) => {
  const navigate = useNavigate();
  const setBackdropUrl = useSetBackdropUrl();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'previous'>('next');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [logos, setLogos] = useState<Record<string, string | null>>(() => ({ ...logoCache }));
  const [trailers, setTrailers] = useState<Record<string, Video | null>>(() => ({ ...trailerCache }));
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [canAutoplayVideo, setCanAutoplayVideo] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const handleVideoPlayingChange = useCallback((playing: boolean) => setVideoPlaying(playing), []);

  // Background trailers: desktop only, respects reduced motion and data saver
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => setCanAutoplayVideo(query.matches && !connection?.saveData);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Pause (unmount) the background video while the tab is hidden
  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  const requestedLogoKeys = useRef(new Set<string>());
  const requestedTrailerKeys = useRef(new Set<string>());
  const transitionTimeout = useRef<number | null>(null);
  const featuredMovies = useMemo(() => movies.slice(0, 5), [movies]);
  const currentMovie = featuredMovies[currentIndex];
  const logoKey = currentMovie
    ? `${currentMovie.media_type || 'movie'}-${currentMovie.id}`
    : '';
  const logoPath = logos[logoKey];
  const logoUrl = logoPath ? getLogoUrl(logoPath, 'w500') : null;
  const isLogoReady = !currentMovie || logos[logoKey] !== undefined;
  const currentTrailer = trailers[logoKey];
  const heroHeight = compact
    ? 'h-[68svh] min-h-[460px] max-h-[680px] sm:h-[82svh] sm:min-h-[540px] sm:max-h-[880px]'
    : 'h-[62svh] min-h-[430px] max-h-[620px] sm:h-[85svh] sm:min-h-[500px] sm:max-h-none';
  const currentArtworkUrl = currentMovie
    ? getBackdropUrl(currentMovie.backdrop_path, 'original') ||
      (currentMovie.poster_path ? getImageUrl(currentMovie.poster_path, 'w780') : null)
    : null;

  useEffect(() => {
    onArtworkChange?.(currentArtworkUrl);

    return () => onArtworkChange?.(null);
  }, [currentArtworkUrl, onArtworkChange]);

  useEffect(() => {
    if (currentMovie?.backdrop_path) {
      setBackdropUrl(getBackdropUrl(currentMovie.backdrop_path, 'original'));
    }

    return () => {
      setBackdropUrl(null);
    };
  }, [currentMovie, setBackdropUrl]);

  useEffect(() => {
    const fetchLogos = async () => {
      const logoPromises = featuredMovies.map(async (movie) => {
        const key = `${movie.media_type || 'movie'}-${movie.id}`;
        if (requestedLogoKeys.current.has(key) || key in logoCache) return;
        requestedLogoKeys.current.add(key);

        const ref = getTmdbRef(movie);
        if (!ref) {
          logoCache[key] = null;
          setLogos(prev => ({ ...prev, [key]: null }));
          return;
        }

        try {
          const images = ref.media_type === 'tv'
            ? await getTVImages(ref.id)
            : await getMovieImages(ref.id);

          const englishLogos = images.logos
            .filter(l => l.iso_639_1 === 'en' || l.iso_639_1 === null)
            .sort((a, b) => b.width - a.width);

          const logoPath = englishLogos[0]?.file_path || null;
          await preloadImage(logoPath ? getLogoUrl(logoPath, 'w500') : null);
          logoCache[key] = logoPath;
          setLogos(prev => ({ ...prev, [key]: logoPath }));
        } catch {
          logoCache[key] = null;
          setLogos(prev => ({ ...prev, [key]: null }));
        }
      });

      await Promise.all(logoPromises);
    };

    if (featuredMovies.length > 0) {
      fetchLogos();
    }
  }, [featuredMovies]);

  useEffect(() => {
    const fetchTrailers = async () => {
      const trailerPromises = featuredMovies.map(async (movie) => {
        const key = `${movie.media_type || 'movie'}-${movie.id}`;
        if (requestedTrailerKeys.current.has(key) || key in trailerCache) return;
        requestedTrailerKeys.current.add(key);

        const anilistTrailer: Video | null = movie.trailer_key
          ? { id: `anilist-${movie.id}`, key: movie.trailer_key, name: 'Trailer', site: 'YouTube', type: 'Trailer', official: true }
          : null;
        const ref = getTmdbRef(movie);

        if (!ref) {
          trailerCache[key] = anilistTrailer;
          setTrailers(prev => ({ ...prev, [key]: anilistTrailer }));
          return;
        }

        try {
          const videos = ref.media_type === 'tv'
            ? await getTVVideos(ref.id)
            : await getMovieVideos(ref.id);

          const trailer = videos.results.find(
            v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
          ) || videos.results.find(
            v => v.site === 'YouTube' && v.type === 'Trailer'
          ) || videos.results.find(
            v => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip')
          );

          const finalTrailer = trailer || anilistTrailer;
          trailerCache[key] = finalTrailer;
          setTrailers(prev => ({ ...prev, [key]: finalTrailer }));
        } catch {
          trailerCache[key] = anilistTrailer;
          setTrailers(prev => ({ ...prev, [key]: anilistTrailer }));
        }
      });

      await Promise.all(trailerPromises);
    };

    if (featuredMovies.length > 0) {
      fetchTrailers();
    }
  }, [featuredMovies]);

  const goToSlide = useCallback((nextIndex: number, direction: 'next' | 'previous') => {
    if (featuredMovies.length <= 1 || nextIndex === currentIndex || isTransitioning) return;

    if (transitionTimeout.current) {
      window.clearTimeout(transitionTimeout.current);
    }

    setSlideDirection(direction);
    setIsTransitioning(true);
    transitionTimeout.current = window.setTimeout(() => {
      setCurrentIndex(nextIndex);
      setIsTransitioning(false);
      transitionTimeout.current = null;
    }, 480);
  }, [currentIndex, featuredMovies.length, isTransitioning]);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;

    const interval = window.setInterval(() => {
      goToSlide((currentIndex + 1) % featuredMovies.length, 'next');
    }, videoPlaying ? 24000 : 8500);

    return () => window.clearInterval(interval);
  }, [currentIndex, featuredMovies.length, goToSlide, videoPlaying]);

  useEffect(() => () => {
    if (transitionTimeout.current) {
      window.clearTimeout(transitionTimeout.current);
    }
  }, []);

  useEffect(() => {
    const syncWatchlistState = async () => {
      if (!currentMovie) return;
      const mediaType = currentMovie.media_type || 'movie';
      const wlType = mediaType as 'movie' | 'tv';

      if (user) {
        let inDb = false;
        try {
          inDb = await isInWatchlistDb(currentMovie.id, wlType);
        } catch {
          inDb = false;
        }
        setInWatchlist(inDb || (mediaType === 'anime' && isInWatchlist(currentMovie.id, wlType)));
        return;
      }

      setInWatchlist(isInWatchlist(currentMovie.id, wlType));
    };

    syncWatchlistState();
  }, [currentMovie, user]);

  if (isLoading || !currentMovie || !isLogoReady) {
    return (
      <div
        className={cn("hero-banner relative mb-8 overflow-hidden bg-background", heroHeight)}
        style={{ '--hero-navbar-clearance': '5.75rem' } as React.CSSProperties}
        role="status"
        aria-label="Loading featured titles"
      >
        <div className="absolute inset-0 bg-muted/40 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/50" />
        <div className="absolute inset-0 flex items-center pt-[var(--hero-navbar-clearance)] sm:pt-0">
          <div className="container mx-auto w-full px-5 py-8 sm:px-8 sm:py-24 lg:px-10">
            <div className="max-w-3xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-20 rounded-full bg-muted animate-shimmer" />
                <div className="h-7 w-14 rounded-full bg-muted animate-shimmer" />
                <div className="h-7 w-12 rounded-full bg-muted animate-shimmer" />
              </div>
              <div className="h-14 w-[72%] max-w-lg rounded-md bg-muted animate-shimmer sm:h-16 md:h-20" />
              <div className="flex gap-3 pt-1">
                <div className="h-11 w-28 rounded-md bg-primary/15 animate-shimmer" />
                <div className="h-11 w-28 rounded-md bg-muted animate-shimmer" />
                <div className="h-11 w-24 rounded-md bg-muted animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
        <span className="sr-only">Loading featured titles</span>
      </div>
    );
  }

  const backdropUrl = getBackdropUrl(currentMovie.backdrop_path, 'original');
  const title = currentMovie.title || currentMovie.name || 'Untitled';
  const rating = currentMovie.vote_average?.toFixed(1) || 'N/A';
  const year = (currentMovie.release_date || currentMovie.first_air_date)?.split('-')[0] || '';
  const mediaType = currentMovie.media_type || 'movie';

  const handlePlay = () => {
    navigate(`/watch/${mediaType}/${currentMovie.id}`);
  };

  const handleAddToList = async () => {
    if (inWatchlist) return;

    const item = { ...currentMovie, media_type: mediaType };
    if (user) {
      try {
        await addToWatchlistDb(item);
      } catch (error) {
        if (mediaType !== 'anime') throw error;
        addToWatchlist(item); // anime falls back to this device's list
      }
    } else {
      addToWatchlist(item);
    }

    setInWatchlist(true);
  };

  const handleTrailerClick = () => {
    if (currentTrailer) {
      setTrailerOpen(true);
    }
  };


  return (
    <div
      className={cn("hero-banner relative mb-8 overflow-hidden", heroHeight)}
      style={{ '--hero-navbar-clearance': '5.75rem' } as React.CSSProperties}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      <div className="absolute inset-0">
        {featuredMovies.map((movie, index) => {
          const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, 'w780') : null;
          const backdropUrl = getBackdropUrl(movie.backdrop_path, 'original');
          const artworkUrl = backdropUrl || posterUrl;
          return (
            <div
              key={movie.id}
              className={cn(
                'hero-slide absolute inset-0 overflow-hidden transition-[opacity,transform] duration-700 ease-out',
                index === currentIndex
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : cn(
                    'pointer-events-none opacity-0 translate-y-6',
                    slideDirection === 'next' ? 'translate-x-10' : '-translate-x-10'
                  )
              )}
            >
              {artworkUrl && (
                  <div className="absolute inset-x-0 bottom-0 top-[var(--hero-navbar-clearance)] overflow-hidden sm:top-20 [mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_86%,transparent_100%)]">
                    <img
                      src={artworkUrl}
                      alt=""
                      className={cn(
                        'h-full w-full object-cover object-top transition-opacity duration-1000 ease-out motion-reduce:transition-none',
                        videoPlaying && index === currentIndex && !isTransitioning && !trailerOpen && pageVisible
                          ? 'opacity-0'
                          : 'opacity-80'
                      )}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      onError={(event) => {
                        const image = event.currentTarget;
                        if (posterUrl && image.dataset.posterFallback !== 'true' && artworkUrl !== posterUrl) {
                          image.dataset.posterFallback = 'true';
                          image.src = posterUrl;
                        } else {
                          image.style.display = 'none';
                        }
                      }}
                    />
                    {index === currentIndex && canAutoplayVideo && currentTrailer?.site === 'YouTube' && (
                      <HeroTrailerBackground
                        key={currentTrailer.key}
                        videoKey={currentTrailer.key}
                        active={!isTransitioning && !trailerOpen && pageVisible}
                        muted={isMuted}
                        onPlayingChange={handleVideoPlayingChange}
                      />
                    )}
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overlays fade out toward the bottom so they never end in a hard line */}
      <div
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
      </div>
      <div className="relative z-10 flex h-full items-center pt-[var(--hero-navbar-clearance)] sm:pt-0">
        <div className="container mx-auto w-full px-5 py-8 sm:px-8 sm:py-24 lg:px-10">
            <div className={cn(
              'max-w-3xl min-w-0 transition-all duration-500',
              isTransitioning ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
            )}>
              <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-4 md:gap-3">
                <span className="rounded-full border border-white/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-lg">
                  {mediaType === 'tv' ? 'TV Series' : mediaType === 'anime' ? 'Anime' : 'Movie'}
                </span>
                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-white backdrop-blur-sm">
                  <svg className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span className="text-xs font-semibold">{rating}</span>
                </div>
                <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs text-white/70 backdrop-blur-sm">
                  {year}
                </span>
              </div>

              {logoUrl ? (
                <div className="mb-2 sm:mb-4">
                  <img
                    src={logoUrl}
                    alt={title}
                    className="max-h-16 w-auto object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,0.95)] filter brightness-110 sm:max-h-24 md:max-h-28 lg:max-h-32"
                    loading="eager"
                  />
                </div>
              ) : (
                <h1 className="mb-3 text-4xl font-black leading-[0.95] tracking-[-0.045em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-5xl md:mb-4 md:text-6xl lg:text-7xl">
                  {title}
                </h1>
              )}

              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <Button
                  size="default"
                  className="h-9 rounded-full border border-white bg-white px-3.5 text-xs font-bold uppercase tracking-[0.08em] text-black shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:bg-zinc-200 md:h-10 md:px-4 md:text-sm"
                  onClick={handlePlay}
                >
                  <Play className="mr-1.5 h-4 w-4 fill-current md:mr-2 md:h-5 md:w-5" />
                  Watch
                </Button>
                {currentTrailer && (
                  <Button
                    size="default"
                    variant="outline"
                    onClick={handleTrailerClick}
                    className="h-9 rounded-full border-white/35 bg-black/25 px-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm hover:bg-white hover:text-black md:h-10 md:px-4 md:text-sm"
                  >
                    <Play className="mr-1.5 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
                    Trailer
                  </Button>
                )}
                <Button
                  size="default"
                  variant="secondary"
                  onClick={handleAddToList}
                  disabled={inWatchlist}
                  className="h-9 rounded-full border border-white/20 bg-white/[0.08] px-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm hover:bg-white/15 md:h-10 md:px-4 md:text-sm"
                >
                  {inWatchlist ? (
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <Plus className="mr-1.5 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
                  )}
                  {inWatchlist ? 'Added' : 'My List'}
                </Button>
              </div>
            </div>
        </div>
      </div>

      {videoPlaying && (
        <button
          type="button"
          onClick={() => setIsMuted(muted => !muted)}
          aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
          className="absolute bottom-16 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-10"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}

      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        videoKey={currentTrailer?.key || null}
        title={title}
      />

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .hero-slide {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroBanner;