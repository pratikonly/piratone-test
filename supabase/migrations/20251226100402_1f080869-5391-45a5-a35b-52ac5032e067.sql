-- Create table for user tags
CREATE TABLE public.user_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    tag_name text NOT NULL,
    tag_color text NOT NULL DEFAULT '#8B5CF6',
    given_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, tag_name)
);

-- Create table for user notifications
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tags
CREATE POLICY "Anyone can view tags"
ON public.user_tags FOR SELECT
USING (true);

CREATE POLICY "Admins can insert tags"
ON public.user_tags FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tags"
ON public.user_tags FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tags"
ON public.user_tags FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tags;