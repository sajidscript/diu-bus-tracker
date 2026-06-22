import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { Profile, Role } from '@/lib/types';
import { ROLE_DASHBOARDS } from '@/lib/types';

export function useAuth(): {
  session: { user: { id: string } } | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getDashboard: () => string;
} {
  const { session, profile, role, authLoading, setSession, setProfile, setAuthLoading, clearAuth } =
    useAppStore();

  useEffect(() => {
    const getSession = async (): Promise<void> => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(currentSession as { user: { id: string } } | null);
        if (currentSession?.user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          if (profileError) throw profileError;
          setProfile(data as Profile);
        }
      } catch {
        clearAuth();
      } finally {
        setAuthLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession as { user: { id: string } } | null);
        if (newSession?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
          if (!error && data) {
            setProfile(data as Profile);
          }
        } else {
          setProfile(null);
        }
        setAuthLoading(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, setAuthLoading, clearAuth]);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    clearAuth();
  };

  const getDashboard = (): string => {
    if (role && role in ROLE_DASHBOARDS) return ROLE_DASHBOARDS[role as keyof typeof ROLE_DASHBOARDS];
    return '/login';
  };

  return { session, profile, role, loading: authLoading, signOut, getDashboard };
}
