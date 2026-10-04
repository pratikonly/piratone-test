import { supabase } from '@/integrations/supabase/client';
import { Movie } from './tmdb';

export type ShowStatusType = 'watching' | 'completed' | 'dropped';

export interface ShowStatusEntry {
  id: string;
  tmdb_id: number;
  media_type: string;
  status: ShowStatusType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  vote_average: number | null;
  last_season: number | null;
  last_episode: number | null;
  updated_at: string;
  created_at: string;
}

// Coerce "" | 0 | null | undefined → null, valid positive integers → number
// The DB stores empty strings for last_season/last_episode on old rows.
const toIntOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Normalise raw DB rows to fix empty-string last_season/last_episode
const normalize = (rows: unknown[]): ShowStatusEntry[] =>
  (rows as ShowStatusEntry[]).map(row => ({
    ...row,
    last_season:  toIntOrNull(row.last_season),
    last_episode: toIntOrNull(row.last_episode),
  }));

// ── Helper: get authed user_id ───────────────────────────────────────────────
const getUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

// ─────────────────────────────────────────────────────────────────────────────

export const setShowStatus = async (
  movie: Movie,
  status: ShowStatusType,
  lastSeason?: number,
  lastEpisode?: number,
): Promise<void> => {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase.from('show_status').upsert({
    user_id:      userId,
    tmdb_id:      movie.id,
    media_type:   movie.media_type || 'movie',
    status,
    title:        movie.title || (movie as any).name || 'Unknown',
    poster_path:  movie.poster_path  ?? null,
    backdrop_path: movie.backdrop_path ?? null,
    overview:     movie.overview     ?? null,
    vote_average: movie.vote_average ?? null,
    // FIX: never write 0 or "" — write null for missing season/episode
    last_season:  toIntOrNull(lastSeason),
    last_episode: toIntOrNull(lastEpisode),
  }, { onConflict: 'user_id,tmdb_id,media_type' });

  if (error) throw error;
};

export const getShowStatus = async (
  tmdbId: number,
  mediaType: string,
): Promise<ShowStatusEntry | null> => {
  const userId = await getUserId();
  if (!userId) return null;

  // FIX: original code had NO user_id filter — RLS blocks it or returns wrong rows
  const { data, error } = await supabase
    .from('show_status')
    .select('*')
    .eq('user_id', userId)      // ← was missing
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .limit(1)
    .maybeSingle();

  if (error) { console.error('[showStatus] getShowStatus failed:', error); return null; }
  if (!data) return null;

  return normalize([data])[0];
};

export const getShowsByStatus = async (
  status: ShowStatusType,
): Promise<ShowStatusEntry[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  // FIX: was missing user_id filter
  const { data, error } = await supabase
    .from('show_status')
    .select('*')
    .eq('user_id', userId)      // ← was missing
    .eq('status', status)
    .order('updated_at', { ascending: false });

  if (error) { console.error('[showStatus] getShowsByStatus failed:', error); return []; }
  return normalize(data || []);
};

export const getAllShowStatuses = async (): Promise<ShowStatusEntry[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  // FIX: was missing user_id filter
  const { data, error } = await supabase
    .from('show_status')
    .select('*')
    .eq('user_id', userId)      // ← was missing
    .order('updated_at', { ascending: false });

  if (error) { console.error('[showStatus] getAllShowStatuses failed:', error); return []; }
  return normalize(data || []);
};

export const removeShowStatus = async (
  tmdbId: number,
  mediaType: string,
): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // FIX: was missing user_id filter — could accidentally delete other users' rows
  const { error } = await supabase
    .from('show_status')
    .delete()
    .eq('user_id', userId)      // ← was missing
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (error) throw error;
};
