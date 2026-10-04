import { supabase } from '@/integrations/supabase/client';

export interface WatchHistoryEntryDb {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  season: number | null;
  episode: number | null;
  watched_at: string;
}

export const saveWatchHistoryDb = async (entry: {
  mediaId: number;
  mediaType: string;
  mediaTitle: string;
  posterPath: string | null;
  season?: number;
  episode?: number;
}): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Delete existing entry for same media to move it to top
  await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', user.id)
    .eq('tmdb_id', entry.mediaId)
    .eq('media_type', entry.mediaType);

  const { error } = await supabase.from('watch_history').insert({
    user_id: user.id,
    tmdb_id: entry.mediaId,
    media_type: entry.mediaType,
    title: entry.mediaTitle,
    poster_path: entry.posterPath,
    season: entry.season || null,
    episode: entry.episode || null,
  });

  if (error) console.error('Failed to save watch history:', error);
};

export const getWatchHistoryDb = async (): Promise<WatchHistoryEntryDb[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};

export const clearWatchHistoryDb = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('watch_history').delete().eq('user_id', user.id);
};
