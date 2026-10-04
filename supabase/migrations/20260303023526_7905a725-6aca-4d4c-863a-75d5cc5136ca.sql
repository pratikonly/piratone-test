
-- Fix profiles RLS: drop restrictive policies, recreate as permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix watchlist RLS: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can add to their own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can remove from their own watchlist" ON public.watchlist;

CREATE POLICY "Users can view their own watchlist" ON public.watchlist
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist" ON public.watchlist
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own watchlist" ON public.watchlist
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix show_status RLS: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can view their own show statuses" ON public.show_status;
DROP POLICY IF EXISTS "Users can add show statuses" ON public.show_status;
DROP POLICY IF EXISTS "Users can update their own show statuses" ON public.show_status;
DROP POLICY IF EXISTS "Users can delete their own show statuses" ON public.show_status;

CREATE POLICY "Users can view their own show statuses" ON public.show_status
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can add show statuses" ON public.show_status
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own show statuses" ON public.show_status
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own show statuses" ON public.show_status
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix watch_history RLS
DROP POLICY IF EXISTS "Users can view their own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can add to their own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can delete their own watch history" ON public.watch_history;

CREATE POLICY "Users can view their own watch history" ON public.watch_history
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watch history" ON public.watch_history
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch history" ON public.watch_history
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add unique constraint for show_status upsert if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'show_status_user_tmdb_media_unique') THEN
    ALTER TABLE public.show_status ADD CONSTRAINT show_status_user_tmdb_media_unique UNIQUE (user_id, tmdb_id, media_type);
  END IF;
END $$;

-- Add unique constraint for watchlist upsert if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'watchlist_user_tmdb_media_unique') THEN
    ALTER TABLE public.watchlist ADD CONSTRAINT watchlist_user_tmdb_media_unique UNIQUE (user_id, tmdb_id, media_type);
  END IF;
END $$;

-- Add storage policies for avatars bucket
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;
END $$;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for handle_new_user if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
