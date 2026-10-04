-- Add columns for TV show season and episode tracking
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS current_season INTEGER,
ADD COLUMN IF NOT EXISTS current_episode INTEGER;