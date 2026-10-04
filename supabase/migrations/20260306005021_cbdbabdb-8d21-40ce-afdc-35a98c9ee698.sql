
-- Allow anyone authenticated to read all visitor counts for global sum
DROP POLICY "Users can view their own visitor count" ON public.visitor_count;
CREATE POLICY "Anyone can view visitor counts"
  ON public.visitor_count FOR SELECT
  TO authenticated
  USING (true);
