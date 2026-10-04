import { supabase } from '@/integrations/supabase/client';
import { Movie } from './tmdb';

// Helper: get current user id from session (no extra API call)
const getUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

export const getWatchlistDb = async (): Promise<Movie[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    id: item.tmdb_id,
    title: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: Number(item.vote_average) || 0,
    release_date: item.release_date || undefined,
    first_air_date: item.first_air_date || undefined,
    media_type: item.media_type as 'movie' | 'tv',
  }));
};

export const addToWatchlistDb = async (movie: Movie): Promise<void> => {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase.from('watchlist').upsert({
    user_id: userId,
    tmdb_id: movie.id,
    media_type: movie.media_type || 'movie',
    title: movie.title || movie.name || 'Unknown',
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    overview: movie.overview,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    first_air_date: movie.first_air_date,
  }, { onConflict: 'user_id,tmdb_id,media_type' });

  if (error) throw error;
};

export const removeFromWatchlistDb = async (tmdbId: number, mediaType: 'movie' | 'tv'): Promise<void> => {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (error) throw error;
};

export const isInWatchlistDb = async (tmdbId: number, mediaType?: 'movie' | 'tv'): Promise<boolean> => {
  const userId = await getUserId();
  if (!userId) return false;

  let query = supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId);

  if (mediaType) query = query.eq('media_type', mediaType);

  const { data } = await query.limit(1);
  return (data?.length || 0) > 0;
};

export const clearWatchlistDb = async (): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('watchlist').delete().eq('user_id', userId);
};
