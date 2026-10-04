-- Harden user_sessions so anonymous tracking is safe and reliable

-- 1) Add a per-session token to authorize anonymous updates/deletes
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS session_token text;

-- 2) Ensure RLS is enabled
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 3) Remove broken policies
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.user_sessions;

-- Keep existing admin select policy name if present; don't drop it.

-- 4) Re-create policies
-- Insert: allow anyone to create a session row, but require a session_token
CREATE POLICY "Anyone can insert sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (
  session_token IS NOT NULL AND length(session_token) >= 16
);

-- Update: admins OR owner (authenticated) OR anonymous with matching session_token header
CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id IS NOT NULL AND auth.uid() = user_id)
  OR (
    user_id IS NULL
    AND session_token = COALESCE(
      (current_setting('request.headers', true)::json ->> 'x-session-token'),
      ''
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id IS NOT NULL AND auth.uid() = user_id)
  OR (
    user_id IS NULL
    AND session_token = COALESCE(
      (current_setting('request.headers', true)::json ->> 'x-session-token'),
      ''
    )
  )
);

-- Delete: same rule set as update
CREATE POLICY "Users can delete own sessions"
ON public.user_sessions
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id IS NOT NULL AND auth.uid() = user_id)
  OR (
    user_id IS NULL
    AND session_token = COALESCE(
      (current_setting('request.headers', true)::json ->> 'x-session-token'),
      ''
    )
  )
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions (last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_online ON public.user_sessions (is_online);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions (session_token);