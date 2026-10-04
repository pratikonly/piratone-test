-- Fix: Anyone Can Forge Notifications to Any User
-- Change the notifications INSERT policy to require admin role

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));