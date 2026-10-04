
-- Allow anonymous (non-authenticated) users to read visitor counts
CREATE POLICY "Anyone can view visitor counts anon"
  ON public.visitor_count FOR SELECT
  TO anon
  USING (true);
