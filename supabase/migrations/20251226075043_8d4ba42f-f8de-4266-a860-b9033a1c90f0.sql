-- Create table for tracking user sessions and activity
CREATE TABLE public.user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    device_info JSONB DEFAULT '{}',
    country TEXT,
    city TEXT,
    browser TEXT,
    os TEXT,
    current_page TEXT,
    current_media_id INTEGER,
    current_media_type TEXT,
    current_media_title TEXT,
    is_online BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own session
CREATE POLICY "Anyone can insert sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (true);

-- Allow users to update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
USING (session_id = session_id);

-- Allow admins to view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON public.user_sessions
FOR DELETE
USING (session_id = session_id);

-- Create index for faster lookups
CREATE INDEX idx_user_sessions_is_online ON public.user_sessions(is_online);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);

-- Enable realtime for user_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;