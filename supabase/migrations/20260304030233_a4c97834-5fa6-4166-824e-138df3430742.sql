
CREATE TABLE public.watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tmdb_id integer NOT NULL,
  media_type text NOT NULL,
  title text,
  poster_path text,
  backdrop_path text,
  overview text,
  vote_average numeric,
  season integer,
  episode integer,
  duration numeric DEFAULT 0,
  progress_time numeric DEFAULT 0,
  completed boolean DEFAULT false,
  server text NOT NULL DEFAULT 'videasy',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX watch_progress_unique ON public.watch_progress (user_id, tmdb_id, media_type, COALESCE(season, 0), COALESCE(episode, 0), server);

ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch progress" ON public.watch_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watch progress" ON public.watch_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watch progress" ON public.watch_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watch progress" ON public.watch_progress FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_watch_progress_updated_at BEFORE UPDATE ON public.watch_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
