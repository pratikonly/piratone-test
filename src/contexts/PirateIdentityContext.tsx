import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getGuestIdentity, getStoredIdentity, regenerateIdentity as regenerateFromAPI, type PirateIdentity } from '@/lib/pirateIdentity';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

interface PirateIdentityContextType {
  identity: PirateIdentity | null;
  isLoading: boolean;
  isRegenerating: boolean;
  regenerateIdentity: () => Promise<void>;
  refreshFromDb: () => Promise<void>;
}

const PirateIdentityContext = createContext<PirateIdentityContextType | undefined>(undefined);

export function PirateIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<PirateIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { user } = useAuth();

  // Load identity: from DB if authenticated, else from localStorage/API
  useEffect(() => {
    const loadIdentity = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Load from profiles table
          const { data, error } = await supabase
            .from('profiles')
            .select('pirate_name, pirate_role, pirate_bounty, pirate_image_path, custom_avatar_url')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            setIdentity({
              id: 0,
              name: data.pirate_name || 'Guest Pirate',
              role: data.pirate_role || 'Pirate',
              bounty: data.pirate_bounty || '0',
              imagePath: data.custom_avatar_url || data.pirate_image_path || '',
              fetchedAt: new Date().toISOString(),
            });
          } else {
            // Fallback to local identity
            const pirateIdentity = await getGuestIdentity();
            setIdentity(pirateIdentity);
          }
        } else {
          if (isSupabaseConfigured) {
            const pirateIdentity = await getGuestIdentity();
            setIdentity(pirateIdentity);
          } else {
            setIdentity(getStoredIdentity() || {
              id: 0,
              name: 'Guest Pirate',
              role: 'Pirate',
              bounty: '0',
              imagePath: '',
              fetchedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Failed to load pirate identity:', error);
        // Final fallback
        try {
          const pirateIdentity = await getGuestIdentity();
          setIdentity(pirateIdentity);
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };
    loadIdentity();
  }, [user]);

  const refreshFromDb = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('pirate_name, pirate_role, pirate_bounty, pirate_image_path, custom_avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setIdentity({
        id: 0,
        name: data.pirate_name || 'Guest Pirate',
        role: data.pirate_role || 'Pirate',
        bounty: data.pirate_bounty || '0',
        imagePath: data.custom_avatar_url || data.pirate_image_path || '',
        fetchedAt: new Date().toISOString(),
      });
    }
  }, [user]);

  const regenerateIdentity = useCallback(async () => {
    setIsRegenerating(true);
    try {
      const newIdentity = await regenerateFromAPI();
      
      if (user) {
        // Check if user has a custom avatar or custom name — preserve them
        const { data: profile } = await supabase
          .from('profiles')
          .select('custom_avatar_url, pirate_name')
          .eq('user_id', user.id)
          .maybeSingle();

        // Only update pirate_role, pirate_bounty, and pirate_image_path
        // Keep custom_avatar_url and pirate_name untouched if user set them
        await supabase.from('profiles').update({
          pirate_role: newIdentity.role,
          pirate_bounty: newIdentity.bounty,
          pirate_image_path: newIdentity.imagePath,
        }).eq('user_id', user.id);

        // Update local state preserving user's custom name/avatar
        setIdentity({
          ...newIdentity,
          name: profile?.pirate_name && profile.pirate_name !== 'Guest Pirate' ? profile.pirate_name : newIdentity.name,
          imagePath: profile?.custom_avatar_url || newIdentity.imagePath,
        });
        await refreshFromDb();
      } else {
        setIdentity(newIdentity);
      }
    } catch (error) {
      console.error('Failed to regenerate identity:', error);
      throw error;
    } finally {
      setIsRegenerating(false);
    }
  }, [user, refreshFromDb]);

  return (
    <PirateIdentityContext.Provider value={{ identity, isLoading, isRegenerating, regenerateIdentity, refreshFromDb }}>
      {children}
    </PirateIdentityContext.Provider>
  );
}

export function usePirateIdentity() {
  const context = useContext(PirateIdentityContext);
  if (context === undefined) {
    throw new Error('usePirateIdentity must be used within a PirateIdentityProvider');
  }
  return context;
}
