import { useState } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';

export interface SearchFilterValues {
  genre: string;
  year: string;
  rating: string;
  sortBy: string;
}

interface SearchFiltersProps {
  filters: SearchFilterValues;
  onChange: (filters: SearchFilterValues) => void;
  mediaType: 'movie' | 'tv';
}

const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' },
];

const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' },
];

const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'primary_release_date.asc', label: 'Oldest' },
];

const SelectFilter = ({ label, value, options, onChange, placeholder }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; placeholder: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-muted-foreground font-medium">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 pr-8 rounded-lg bg-muted border border-border text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

const SearchFilters = ({ filters, onChange, mediaType }: SearchFiltersProps) => {
  const [expanded, setExpanded] = useState(false);
  const genres = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const hasFilters = filters.genre || filters.year || filters.rating || filters.sortBy;

  const update = (key: keyof SearchFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onChange({ genre: '', year: '', rating: '', sortBy: '' });
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {hasFilters && (
          <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
            {[filters.genre, filters.year, filters.rating, filters.sortBy].filter(Boolean).length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 border border-border rounded-xl">
          <SelectFilter
            label="Genre"
            value={filters.genre}
            options={genres.map(g => ({ value: String(g.id), label: g.name }))}
            onChange={v => update('genre', v)}
            placeholder="All Genres"
          />
          <SelectFilter
            label="Year"
            value={filters.year}
            options={YEARS.map(y => ({ value: y, label: y }))}
            onChange={v => update('year', v)}
            placeholder="Any Year"
          />
          <SelectFilter
            label="Min Rating"
            value={filters.rating}
            options={[
              { value: '9', label: '9+' }, { value: '8', label: '8+' },
              { value: '7', label: '7+' }, { value: '6', label: '6+' },
              { value: '5', label: '5+' },
            ]}
            onChange={v => update('rating', v)}
            placeholder="Any Rating"
          />
          <SelectFilter
            label="Sort By"
            value={filters.sortBy}
            options={SORT_OPTIONS}
            onChange={v => update('sortBy', v)}
            placeholder="Default"
          />
          {hasFilters && (
            <button onClick={clearAll} className="col-span-2 md:col-span-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
