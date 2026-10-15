```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigError } from './supabase';
import type { Profile } from './types';
import { isPremiumTier } from './types';

export type AuthInitializationError = {
  kind: 'session' | 'profile' | 'profile_missing';
  message: string;
};

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initializationError: AuthInitializationError | null;
  isPremium: boolean;
  refreshProfile: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] =
    useState<AuthInitializationError | null>(null);

  const loadProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      if (supabaseConfigError) {
        throw new Error(supabaseConfigError);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Profile | null;
    },
    [],
  );

  const initialize = useCallback(async () => {
    setLoading(true);
    setInitializationError(null);

    let phase: 'session' | 'profile' = 'session';

    try {
      if (supabaseConfigError) {
        setInitializationError({
          kind: 'session',
          message: supabaseConfigError,
        });
        setSession(null);
        setProfile(null);
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const nextSession = data.session;
      setSession(nextSession);

      if (!nextSession?.user) {
        setProfile(null);
        return;
      }

      phase = 'profile';

      const nextProfile = await loadProfile(nextSession.user.id);
      setProfile(nextProfile);

      if (!nextProfile) {
        setInitializationError({
          kind: 'profile_missing',
          message:
            'No encontramos los datos de tu perfil. Puedes volver a intentarlo sin cerrar tu sesión.',
        });
      }
    } catch {
      setProfile(null);

      setInitializationError({
        kind: phase,
        message:
          phase === 'session'
            ? 'No se pudo comprobar tu sesión. Comprueba tu conexión y vuelve a intentarlo.'
            : 'No se pudo cargar tu perfil. Comprueba tu conexión y vuelve a intentarlo.',
      });
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    void initialize();

    if (supabaseConfigError) {
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
          setInitializationError(null);
          setLoading(false);
          return;
        }

        if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED') {
          return;
        }

        setSession(nextSession);

        if (!nextSession?.user) {
          return;
        }

        setLoading(true);
        setInitializationError(null);

        void (async () => {
          try {
            const nextProfile = await loadProfile(nextSession.user.id);
            setProfile(nextProfile);

            if (!nextProfile) {
              setInitializationError({
                kind: 'profile_missing',
                message:
                  'No encontramos los datos de tu perfil. Puedes volver a intentarlo sin cerrar tu sesión.',
              });
            }
          } catch {
            setProfile(null);
            setInitializationError({
              kind: 'profile',
              message:
                'No se pudo cargar tu perfil. Comprueba tu conexión y vuelve a intentarlo.',
            });
          } finally {
            setLoading(false);
          }
        })();
      },
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [initialize, loadProfile]);

  async function refreshProfile(): Promise<void> {
    if (!session?.user) {
      return;
    }

    try {
      const nextProfile = await loadProfile(session.user.id);
      setProfile(nextProfile);

      setInitializationError(
        nextProfile
          ? null
          : {
              kind: 'profile_missing',
              message:
                'No encontramos los datos de tu perfil. Puedes volver a intentarlo sin cerrar tu sesión.',
            },
      );
    } catch {
      setInitializationError({
        kind: 'profile',
        message:
          'No se pudo actualizar tu perfil. Comprueba tu conexión y vuelve a intentarlo.',
      });

      throw new Error('No se pudo actualizar el perfil.');
    }
  }

  async function signOut(): Promise<void> {
    if (!supabaseConfigError) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    }

    setProfile(null);
    setSession(null);
    setInitializationError(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        initializationError,
        isPremium:
          isPremiumTier(profile?.subscription_tier) ||
          (profile?.is_premium ?? false),
        refreshProfile,
        retryInitialization: initialize,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}
```
