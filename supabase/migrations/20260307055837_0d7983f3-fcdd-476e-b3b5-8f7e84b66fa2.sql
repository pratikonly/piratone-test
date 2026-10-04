
-- Create a simple site_visits table with a single row for global counting
CREATE TABLE public.site_visits (
  id integer PRIMARY KEY DEFAULT 1,
  total_count bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the initial row
INSERT INTO public.site_visits (id, total_count) VALUES (1, 0);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to read
CREATE POLICY "Anyone can view site visits"
  ON public.site_visits FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create a security definer function to increment the counter (callable by anyone)
CREATE OR REPLACE FUNCTION public.increment_site_visits()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.site_visits
  SET total_count = total_count + 1, updated_at = now()
  WHERE id = 1
  RETURNING total_count INTO new_count;
  RETURN new_count;
END;
$$;
