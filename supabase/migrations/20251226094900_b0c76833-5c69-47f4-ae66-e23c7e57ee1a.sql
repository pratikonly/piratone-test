-- Create table for global chat settings
CREATE TABLE public.chat_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text NOT NULL UNIQUE,
    setting_value boolean NOT NULL DEFAULT true,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Insert default global chat enabled setting
INSERT INTO public.chat_settings (setting_key, setting_value) VALUES ('global_chat_enabled', true);

-- Create table for user chat bans
CREATE TABLE public.chat_bans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    reason text,
    banned_by uuid REFERENCES auth.users(id),
    banned_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_bans ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_settings
CREATE POLICY "Anyone can view chat settings"
ON public.chat_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update chat settings"
ON public.chat_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for chat_bans
CREATE POLICY "Admins can view all bans"
ON public.chat_bans FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own ban status"
ON public.chat_bans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert bans"
ON public.chat_bans FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bans"
ON public.chat_bans FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bans"
ON public.chat_bans FOR DELETE
USING (has_role(auth.uid(), 'admin'));