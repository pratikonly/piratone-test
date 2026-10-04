
-- User ratings and reviews
CREATE TABLE public.user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tmdb_id integer NOT NULL,
  media_type text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tmdb_id, media_type)
);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.user_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.user_reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.user_reviews FOR DELETE USING (auth.uid() = user_id);

-- Custom collections
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- Collection items
CREATE TABLE public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  tmdb_id integer NOT NULL,
  media_type text NOT NULL,
  title text NOT NULL,
  poster_path text,
  backdrop_path text,
  vote_average numeric,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_id, tmdb_id, media_type)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collection items" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.user_id = auth.uid() OR c.is_public = true))
);
CREATE POLICY "Users can insert collection items" ON public.collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can delete collection items" ON public.collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
