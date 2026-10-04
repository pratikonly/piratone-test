import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthRequestError = (action: string, error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Supabase ${action} request failed:`, message);

  if (/failed to fetch|network|fetch failed/i.test(message)) {
    return new Error(
      `Could not reach Supabase Auth during ${action}. Check the Supabase project URL, your connection, and the project's allowed origins.`,
    );
  }

  return error instanceof Error ? error : new Error(message);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track last-seen IDs so we only setState when something actually changes.
  // This prevents the User object reference from changing on every auth tick,
  // which was causing Watch.tsx to remount the message handler repeatedly.
  const lastSessionId = useRef<string | null>(null);
  const lastUserId    = useRef<string | null>(null);

  const applySession = (s: Session | null) => {
    const newSessionId = s?.access_token ?? null;
    const newUserId    = s?.user?.id     ?? null;

    // Only update if something genuinely changed
    if (newSessionId !== lastSessionId.current) {
      lastSessionId.current = newSessionId;
      setSession(s);
    }
    if (newUserId !== lastUserId.current) {
      lastUserId.current = newUserId;
      setUser(s?.user ?? null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // A network failure should not leave auth loading forever or produce an
    // unhandled promise rejection.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (isMounted) applySession(session);
      })
      .catch((error: unknown) => {
        getAuthRequestError('session check', error);
        if (isMounted) applySession(null);
      });

    // Listen for auth changes — fires on INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
    // Without deduplication this fires 2-3 times on load with new object references each time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Sign-up is unavailable because authentication is not configured for this app.') };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: getAuthRequestError('sign-up', error) };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Sign-in is unavailable because authentication is not configured for this app.') };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (error) {
      return { error: getAuthRequestError('sign-in', error) };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Password reset is unavailable because authentication is not configured for this app.') };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: getAuthRequestError('password reset', error) };
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
