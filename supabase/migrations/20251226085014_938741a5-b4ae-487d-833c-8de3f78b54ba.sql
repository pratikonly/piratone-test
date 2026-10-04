-- Create watch_history table
CREATE TABLE public.watch_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  media_title TEXT NOT NULL,
  poster_path TEXT,
  season INTEGER,
  episode INTEGER,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  watch_duration_seconds INTEGER
);

-- Enable RLS
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own watch history
CREATE POLICY "Users can view own watch history"
ON public.watch_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own watch history
CREATE POLICY "Users can insert own watch history"
ON public.watch_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own watch history
CREATE POLICY "Users can update own watch history"
ON public.watch_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all watch history
CREATE POLICY "Admins can view all watch history"
ON public.watch_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX idx_watch_history_watched_at ON public.watch_history(watched_at DESC);