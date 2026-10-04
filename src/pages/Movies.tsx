import CatalogPage, { CatalogTab } from '@/components/CatalogPage';
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getDiscoverByGenre,
  getTrending,
  Movie,
} from '@/lib/tmdb';

type TmdbPage = { results: Movie[]; totalPages: number };

const toPage = (fetcher: (page: number) => Promise<TmdbPage>) => async (page: number) => {
  const data = await fetcher(page);
  return { results: data.results, hasNextPage: page < Math.min(data.totalPages, 500) };
};

const genreTab = (id: string, label: string, genreId: number): CatalogTab => ({
  id,
  label,
  fetchPage: toPage(page => getDiscoverByGenre('movie', genreId, page)),
});

const TABS: CatalogTab[] = [
  { id: 'popular', label: 'Popular', fetchPage: toPage(getPopularMovies) },
  { id: 'now-playing', label: 'Now Playing', fetchPage: toPage(getNowPlayingMovies) },
  { id: 'top-rated', label: 'Top Rated', fetchPage: toPage(getTopRatedMovies) },
  genreTab('action', 'Action', 28),
  genreTab('comedy', 'Comedy', 35),
  genreTab('drama', 'Drama', 18),
  genreTab('sci-fi', 'Sci-Fi', 878),
];

const fetchHero = async () => {
  const trending = await getTrending('movie', 'week');
  return trending
    .filter(movie => movie.backdrop_path)
    .map(movie => ({ ...movie, media_type: 'movie' as const }))
    .slice(0, 5);
};

const Movies = () => (
  <CatalogPage
    slug="movies"
    title="Movies"
    subtitle="Popular, new and top rated movies"
    tabs={TABS}
    fetchHero={fetchHero}
  />
);

export default Movies;
