-- Watch progress table for tracking playback position
CREATE TABLE public.watch_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  vote_average NUMERIC,
  season INTEGER,
  episode INTEGER,
  duration NUMERIC,
  current_time NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  server TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, tmdb_id, media_type, season, episode, server)
);

ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch progress" ON public.watch_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add watch progress" ON public.watch_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watch progress" ON public.watch_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watch progress" ON public.watch_progress FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_watch_progress_updated_at BEFORE UPDATE ON public.watch_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_watch_progress_user_tmdb ON public.watch_progress(user_id, tmdb_id, media_type);
CREATE INDEX idx_watch_progress_updated ON public.watch_progress(user_id, updated_at DESC);
