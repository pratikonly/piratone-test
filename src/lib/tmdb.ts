const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv' | 'anime';
  genre_ids?: number[];
  /** Anime only: YouTube key of the AniList trailer */
  trailer_key?: string | null;
  /** Anime only: matching TMDB title, used for hero logo/trailer lookups */
  tmdb_ref?: { id: number; media_type: 'movie' | 'tv' } | null;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  overview: string;
  still_path: string | null;
  runtime?: number;
  air_date?: string;
}

export interface SeasonDetails {
  id: number;
  name: string;
  season_number: number;
  episodes: Episode[];
  overview: string;
  poster_path: string | null;
}

export interface MovieDetails extends Movie {
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: { id: number; name: string }[];
  tagline?: string;
  status: string;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  credits?: Credits;
  seasons?: { id: number; name: string; season_number: number; episode_count: number; poster_path: string | null }[];
  belongs_to_collection?: Collection | null;
  imdb_id?: string;
  external_ids?: { imdb_id?: string | null };
}

export interface Logo {
  file_path: string;
  iso_639_1: string | null;
  width: number;
  height: number;
}

export interface ImagesResponse {
  logos: Logo[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface VideosResponse {
  results: Video[];
}

export interface TMDBReview {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  url: string;
}

export interface ReviewsResponse {
  results: TMDBReview[];
  total_results: number;
}

export interface Collection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}

// AniList (anime) images are already absolute URLs, so pass them through untouched
const isAbsoluteUrl = (path: string) => /^https?:\/\//i.test(path);

export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return null;
  if (isAbsoluteUrl(path)) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') => {
  if (!path) return null;
  if (isAbsoluteUrl(path)) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

const TMDB_CACHE_TTL = 5 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const fetchTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const cacheKey = JSON.stringify([endpoint, Object.entries(params).sort(([a], [b]) => a.localeCompare(b))]);
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  responseCache.delete(cacheKey);

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) return inFlight as Promise<T>;

  const localKey = import.meta.env.VITE_TMDB_API_KEY;

  let requestPromise: Promise<T>;

  if (localKey) {
    const searchParams = new URLSearchParams({ ...params, api_key: localKey });
    requestPromise = fetch(`https://api.themoviedb.org/3${endpoint}?${searchParams.toString()}`)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`);
        }
        return response.json() as Promise<T>;
      });
  } else {
    requestPromise = fetch('/api/tmdb-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, params }),
    })
      .then(async response => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? `TMDB API error: ${response.status}`);
        }
        return response.json() as Promise<T>;
      });
  }

  const request = requestPromise
    .then(data => {
      responseCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + TMDB_CACHE_TTL,
      });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
};

export const getTrending = async (mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') => {
  const data = await fetchTMDB<{ results: Movie[] }>(`/trending/${mediaType}/${timeWindow}`);
  return data.results;
};

export const getPopularMovies = async (page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/movie/popular', { page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'movie' as const })), totalPages: data.total_pages };
};

export const getTopRatedMovies = async (page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/movie/top_rated', { page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'movie' as const })), totalPages: data.total_pages };
};

export const getNowPlayingMovies = async (page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/movie/now_playing', { page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'movie' as const })), totalPages: data.total_pages };
};

export const getPopularTV = async (page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/tv/popular', { page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'tv' as const })), totalPages: data.total_pages };
};

export const getTopRatedTV = async (page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/tv/top_rated', { page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'tv' as const })), totalPages: data.total_pages };
};

export const getOnTheAirTV = async (page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/tv/on_the_air', { page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'tv' as const })), totalPages: data.total_pages };
};

export const getDiscoverByGenre = async (mediaType: 'movie' | 'tv', genreId: number, page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>(`/discover/${mediaType}`, {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    'vote_count.gte': '100',
    page: String(page),
  });
  return { results: data.results.map(m => ({ ...m, media_type: mediaType })), totalPages: data.total_pages };
};

export const searchMultiPaginated = async (query: string, page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/search/multi', { query, page: String(page) });
  return { 
    results: data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv'),
    totalPages: data.total_pages 
  };
};

export const getMovieDetails = async (id: number): Promise<MovieDetails> => {
  return fetchTMDB<MovieDetails>(`/movie/${id}`, { append_to_response: 'credits,external_ids' });
};

export const getTVDetails = async (id: number): Promise<MovieDetails> => {
  return fetchTMDB<MovieDetails>(`/tv/${id}`, { append_to_response: 'credits,external_ids' });
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number): Promise<SeasonDetails> => {
  return fetchTMDB<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
};

export const searchMulti = async (query: string) => {
  const data = await fetchTMDB<{ results: Movie[] }>('/search/multi', { query });
  return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
};

export const discoverMovies = async (params: Record<string, string> = {}, page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/discover/movie', { ...params, page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'movie' as const })), totalPages: data.total_pages };
};

export const discoverTV = async (params: Record<string, string> = {}, page = 1) => {
  const data = await fetchTMDB<{ results: Movie[]; total_pages: number }>('/discover/tv', { ...params, page: String(page) });
  return { results: data.results.map(m => ({ ...m, media_type: 'tv' as const })), totalPages: data.total_pages };
};

export const searchMovies = async (query: string) => {
  const data = await fetchTMDB<{ results: Movie[] }>('/search/movie', { query });
  return data.results.map(m => ({ ...m, media_type: 'movie' as const }));
};

export const searchTV = async (query: string) => {
  const data = await fetchTMDB<{ results: Movie[] }>('/search/tv', { query });
  return data.results.map(m => ({ ...m, media_type: 'tv' as const }));
};

export const getMovieRecommendations = async (id: number) => {
  const data = await fetchTMDB<{ results: Movie[] }>(`/movie/${id}/recommendations`);
  return data.results.map(m => ({ ...m, media_type: 'movie' as const }));
};

export const getTVRecommendations = async (id: number) => {
  const data = await fetchTMDB<{ results: Movie[] }>(`/tv/${id}/recommendations`);
  return data.results.map(m => ({ ...m, media_type: 'tv' as const }));
};

export const getSimilarMovies = async (id: number) => {
  const data = await fetchTMDB<{ results: Movie[] }>(`/movie/${id}/similar`);
  return data.results.map(m => ({ ...m, media_type: 'movie' as const }));
};

export const getSimilarTV = async (id: number) => {
  const data = await fetchTMDB<{ results: Movie[] }>(`/tv/${id}/similar`);
  return data.results.map(m => ({ ...m, media_type: 'tv' as const }));
};

export const getMovieImages = async (id: number): Promise<ImagesResponse> => {
  return fetchTMDB<ImagesResponse>(`/movie/${id}/images`, { include_image_language: 'en,null' });
};

export const getTVImages = async (id: number): Promise<ImagesResponse> => {
  return fetchTMDB<ImagesResponse>(`/tv/${id}/images`, { include_image_language: 'en,null' });
};

export const getLogoUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getMovieVideos = async (id: number): Promise<VideosResponse> => {
  return fetchTMDB<VideosResponse>(`/movie/${id}/videos`);
};

export const getTVVideos = async (id: number): Promise<VideosResponse> => {
  return fetchTMDB<VideosResponse>(`/tv/${id}/videos`);
};

export const getMovieReviews = async (id: number): Promise<ReviewsResponse> => {
  return fetchTMDB<ReviewsResponse>(`/movie/${id}/reviews`);
};

export const getTVReviews = async (id: number): Promise<ReviewsResponse> => {
  return fetchTMDB<ReviewsResponse>(`/tv/${id}/reviews`);
};

export const getCollectionDetails = async (id: number): Promise<CollectionDetails> => {
  return fetchTMDB<CollectionDetails>(`/collection/${id}`);
};

export const getYouTubeEmbedUrl = (key: string) => {
  return `https://www.youtube.com/embed/${key}?autoplay=1&rel=0`;
};

export type ServerType = 'vidstuck' | 'videasy' | 'autoembed' | 'vidsrc' | 'movies111' | 'twoembed' | 'vidrock' | 'vidfast' | 'vidlink' | 'vidsrcsu' | 'vidnest' | 'vidup' | 'vidsrccc' | 'vidzee' | 'vidking';

export interface ServerInfo {
  id: ServerType;
  name: string;
  supportsMovies: boolean;
  supportsTV: boolean;
  supportsAnime: boolean;
}

// Movie & TV servers (no anime support)
export const MOVIE_TV_SERVERS: ServerInfo[] = [
  { id: 'autoembed', name: 'Hanna', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'vidsrc', name: 'VidSrc', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'movies111', name: '111Movies', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'twoembed', name: '2Embed', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'vidrock', name: 'VidRock', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'vidfast', name: 'VidFast', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'vidlink', name: 'VidLink', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'vidsrcsu', name: 'VidSrc.su', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'vidup', name: 'VidUp', supportsMovies: true, supportsTV: true, supportsAnime: false },
  { id: 'vidking', name: 'VidKing', supportsMovies: true, supportsTV: true, supportsAnime: false },
];

// Anime servers (also support movies & TV)
export const ANIME_SERVERS: ServerInfo[] = [
  { id: 'vidstuck', name: 'VIDSTUCK', supportsMovies: true, supportsTV: true, supportsAnime: true },
  { id: 'videasy', name: 'Videasy', supportsMovies: true, supportsTV: true, supportsAnime: true },
  { id: 'vidnest', name: 'VidNest', supportsMovies: true, supportsTV: true, supportsAnime: true },
  { id: 'vidsrccc', name: 'VidSrc.cc', supportsMovies: true, supportsTV: true, supportsAnime: true },
  { id: 'vidzee', name: 'VidZee', supportsMovies: true, supportsTV: true, supportsAnime: true },
];

// Servers whose anime embeds use AniList ids (VIDSTUCK only understands TMDB ids)
export const ANIME_ID_SERVERS: ServerType[] = ['videasy', 'vidnest', 'vidzee', 'vidsrccc'];

// Combined list for backward compatibility
export const SERVER_LIST: ServerInfo[] = [...ANIME_SERVERS, ...MOVIE_TV_SERVERS];

export const getPlayerUrl = (
  id: number,
  type: 'movie' | 'tv' | 'anime',
  server: ServerType = 'vidnest',
  season?: number,
  episode?: number,
  isDub: boolean = false,
  progressSeconds?: number,
  imdbId?: string
) => {
  const accent = 'FD105E';

  // Anime ids are AniList ids: fall back to a server that understands them
  if (type === 'anime' && !ANIME_ID_SERVERS.includes(server)) server = 'videasy';

  // VIDSTUCK — primary server for movies, TV, and anime titles using TMDB IDs.
  if (server === 'vidstuck') {
    const contentType = type === 'movie' ? 'movie' : 'tv';
    const path = contentType === 'movie'
      ? `/embed/movie/${id}`
      : `/embed/tv/${id}/${season || 1}/${episode || 1}`;
    const qs = new URLSearchParams({
      branding: 'PirateOne',
      color: accent,
      overlay: 'true',
    });
    if (contentType === 'tv') {
      qs.set('nextEpisode', 'true');
      qs.set('episodeSelector', 'true');
      qs.set('autoplayNextEpisode', 'true');
    }
    if (progressSeconds && progressSeconds > 0) qs.set('progress', String(Math.floor(progressSeconds)));
    return `https://vidstuck.xyz${path}?${qs.toString()}`;
  }

  // VidKing (movies & TV only)
  if (server === 'vidking') {
    if (type === 'movie') return `https://www.vidking.net/embed/movie/${id}`;
    return `https://www.vidking.net/embed/tv/${id}`;
  }

  // VidZee
  if (server === 'vidzee') {
    if (type === 'movie') return `https://player.vidzee.wtf/embed/movie/${id}`;
    if (type === 'anime') return `https://player.vidzee.wtf/embed/anime/${id}${episode ? '/' + episode : ''}`;
    return `https://player.vidzee.wtf/embed/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // VidSrc.cc (v2 embed)
  if (server === 'vidsrccc') {
    if (type === 'movie') return `https://vidsrc.cc/v2/embed/movie/${id}`;
    if (type === 'anime') return `https://vidsrc.cc/v2/embed/anime/ani${id}/${episode || 1}/sub`;
    return `https://vidsrc.cc/v2/embed/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // VidUp
  if (server === 'vidup') {
    if (type === 'movie') return `https://vidup.to/movie/${id}`;
    return `https://vidup.to/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // VidNest
  if (server === 'vidnest') {
    if (type === 'movie') return `https://vidnest.fun/movie/${id}`;
    if (type === 'anime') return `https://vidnest.fun/anime/${id}/${episode || 1}/${isDub ? 'dub' : 'sub'}`;
    return `https://vidnest.fun/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // VidSrc.su
  if (server === 'vidsrcsu') {
    if (type === 'movie') return `https://vidsrc.su/movie/${id}`;
    return `https://vidsrc.su/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // VidLink
  if (server === 'vidlink') {
    if (type === 'movie') return `https://vidlink.pro/movie/${id}`;
    return `https://vidlink.pro/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // VidFast
  if (server === 'vidfast') {
    if (type === 'movie') return `https://vidfast.pro/movie/${id}`;
    return `https://vidfast.pro/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // VidRock
  if (server === 'vidrock') {
    if (type === 'movie') return `https://vidrock.net/movie/${id}`;
    return `https://vidrock.net/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // Hanna (IMDb-id based)
  if (server === 'autoembed') {
    if (imdbId) return `https://hanna427def.com/play/${imdbId}`;
    return `https://hanna427def.com/play/`;
  }

  // VidSrc (old)
  if (server === 'vidsrc') {
    if (type === 'movie') {
      return `https://vidsrc-embed.ru/embed/movie?tmdb=${id}`;
    }
    return `https://vidsrc-embed.ru/embed/tv?tmdb=${id}&season=${season || 1}&episode=${episode || 1}`;
  }

  // 111Movies
  if (server === 'movies111') {
    if (type === 'movie') {
      return `https://111movies.com/movie/${id}`;
    }
    return `https://111movies.com/tv/${id}/${season || 1}/${episode || 1}`;
  }

  // 2Embed
  if (server === 'twoembed') {
    if (type === 'movie') {
      return `https://www.2embed.cc/embed/${id}`;
    }
    return `https://www.2embed.cc/embedtv/${id}&s=${season || 1}&e=${episode || 1}`;
  }

  // Primary: Videasy
  if (type === 'movie') {
    const qs = new URLSearchParams({ overlay: 'true', color: accent });
    if (progressSeconds && progressSeconds > 0) qs.set('progress', String(Math.floor(progressSeconds)));
    return `https://player.videasy.net/movie/${id}?${qs.toString()}`;
  }

  if (type === 'anime') {
    const qs = new URLSearchParams({ color: accent });
    if (isDub) qs.set('dub', 'true');
    if (progressSeconds && progressSeconds > 0) qs.set('progress', String(Math.floor(progressSeconds)));
    const ep = episode ? `/${episode}` : '';
    const url = `https://player.videasy.net/anime/${id}${ep}`;
    const q = qs.toString();
    return q ? `${url}?${q}` : url;
  }

  // TV shows
  const qs = new URLSearchParams({
    overlay: 'true',
    nextEpisode: 'true',
    autoplayNextEpisode: 'true',
    episodeSelector: 'true',
    color: accent,
  });
  if (progressSeconds && progressSeconds > 0) qs.set('progress', String(Math.floor(progressSeconds)));
  return `https://player.videasy.net/tv/${id}/${season || 1}/${episode || 1}?${qs.toString()}`;
};

// Keep backward compatibility
export const getVideasyUrl = (
  id: number,
  type: 'movie' | 'tv' | 'anime',
  season?: number,
  episode?: number,
  isDub: boolean = false
) => getPlayerUrl(id, type, 'videasy', season, episode, isDub);