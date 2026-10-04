import CatalogPage, { CatalogTab } from '@/components/CatalogPage';
import {
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
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
  fetchPage: toPage(page => getDiscoverByGenre('tv', genreId, page)),
});

const TABS: CatalogTab[] = [
  { id: 'popular', label: 'Popular', fetchPage: toPage(getPopularTV) },
  { id: 'top-rated', label: 'Top Rated', fetchPage: toPage(getTopRatedTV) },
  { id: 'on-the-air', label: 'On The Air', fetchPage: toPage(getOnTheAirTV) },
  genreTab('action', 'Action', 10759),
  genreTab('comedy', 'Comedy', 35),
  genreTab('drama', 'Drama', 18),
  genreTab('mystery', 'Mystery', 9648),
];

const fetchHero = async () => {
  const trending = await getTrending('tv', 'week');
  return trending
    .filter(show => show.backdrop_path)
    .map(show => ({ ...show, media_type: 'tv' as const }))
    .slice(0, 5);
};

const Series = () => (
  <CatalogPage
    slug="series"
    title="Series"
    subtitle="Popular, airing now and top rated series"
    tabs={TABS}
    fetchHero={fetchHero}
  />
);

export default Series;