-- Create global_chat table for the chat feature
CREATE TABLE public.global_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.global_chat ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view chat messages" 
ON public.global_chat 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.global_chat 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_global_chat_created_at ON public.global_chat(created_at DESC);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat;