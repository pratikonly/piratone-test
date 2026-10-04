-- Fix the overly permissive feedback INSERT policy
-- Drop the existing policy that allows anyone to insert
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;

-- Create a new policy that allows authenticated users to insert feedback
-- OR allows anonymous feedback but with their user_id being null
CREATE POLICY "Authenticated users can insert feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users (user_id must match auth.uid() if provided)
  (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  OR
  -- Allow anonymous feedback only if user_id is null
  (auth.uid() IS NULL AND user_id IS NULL)
);