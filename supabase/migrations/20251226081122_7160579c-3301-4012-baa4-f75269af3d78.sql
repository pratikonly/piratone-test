-- Add unique constraint on session_id for upsert to work
ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_session_id_unique UNIQUE (session_id);