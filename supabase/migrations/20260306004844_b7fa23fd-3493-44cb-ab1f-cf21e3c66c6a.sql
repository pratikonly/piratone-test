
CREATE TABLE public.visitor_count (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  count integer NOT NULL DEFAULT 0,
  last_visited_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_count ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX visitor_count_user_id_idx ON public.visitor_count (user_id);

CREATE POLICY "Users can view their own visitor count"
  ON public.visitor_count FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visitor count"
  ON public.visitor_count FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visitor count"
  ON public.visitor_count FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
