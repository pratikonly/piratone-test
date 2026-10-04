-- Create watchlist table for cloud sync
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  vote_average NUMERIC,
  overview TEXT,
  release_date TEXT,
  first_air_date TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, media_id, media_type)
);

-- Enable RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own watchlist
CREATE POLICY "Users can view own watchlist" 
ON public.watchlist 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can add to their watchlist
CREATE POLICY "Users can add to own watchlist" 
ON public.watchlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can remove from their watchlist
CREATE POLICY "Users can delete from own watchlist" 
ON public.watchlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlist;