import CatalogPage, { CatalogTab } from '@/components/CatalogPage';
import { getAnimeList, getAnimeSpotlights, searchAnime } from '@/lib/anilist';

const TABS: CatalogTab[] = [
  { id: 'trending', label: 'Trending', fetchPage: page => getAnimeList('TRENDING_DESC', page) },
  { id: 'popular', label: 'Popular', fetchPage: page => getAnimeList('POPULARITY_DESC', page) },
  { id: 'top-rated', label: 'Top Rated', fetchPage: page => getAnimeList('SCORE_DESC', page) },
];

const Anime = () => (
  <CatalogPage
    slug="anime"
    title="Anime"
    subtitle="Trending anime series and movies"
    tabs={TABS}
    fetchHero={() => getAnimeSpotlights(5)}
    search={searchAnime}
    searchPlaceholder="Search anime..."
  />
);

export default Anime;