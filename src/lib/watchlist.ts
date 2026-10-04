import { Movie } from './tmdb';

const WATCHLIST_KEY = 'pirateone_watchlist';

// Get watchlist from localStorage
export const getWatchlist = (): Movie[] => {
  const stored = localStorage.getItem(WATCHLIST_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save watchlist to localStorage
const saveWatchlist = (watchlist: Movie[]): void => {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
};

// Add to watchlist (localStorage only)
export const addToWatchlist = (movie: Movie): void => {
  const watchlist = getWatchlist();
  if (!watchlist.some(m => m.id === movie.id && m.media_type === movie.media_type)) {
    watchlist.push(movie);
    saveWatchlist(watchlist);
  }
};

// Remove from watchlist (localStorage only)
export const removeFromWatchlist = (id: number, mediaType: 'movie' | 'tv'): void => {
  const watchlist = getWatchlist();
  const filtered = watchlist.filter(m => !(m.id === id && m.media_type === mediaType));
  saveWatchlist(filtered);
};

// Check if in watchlist
export const isInWatchlist = (id: number, mediaType?: 'movie' | 'tv'): boolean => {
  const watchlist = getWatchlist();
  return watchlist.some(m => m.id === id && (!mediaType || m.media_type === mediaType));
};

// Clear entire watchlist
export const clearWatchlist = (): void => {
  localStorage.removeItem(WATCHLIST_KEY);
};
