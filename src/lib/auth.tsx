import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';
import { isPremiumTier } from './types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isPremium: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data as Profile | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        (async () => {
          await loadProfile(s.user.id);
        })();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, isPremium: isPremiumTier(profile?.subscription_tier) || (profile?.is_premium ?? false), refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
