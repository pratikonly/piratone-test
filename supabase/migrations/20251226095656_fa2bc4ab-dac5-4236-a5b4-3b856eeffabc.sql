-- Enable realtime for chat settings and bans
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_bans;

-- Allow admins to delete chat messages
CREATE POLICY "Admins can delete chat messages"
ON public.global_chat FOR DELETE
USING (has_role(auth.uid(), 'admin'));