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
    let cancelled = false;

    const fetchProfile = async (userId: string, retries = 3): Promise<void> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) {
          if (!cancelled) setProfile(data as Profile);
          return;
        }
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    };

    const getSession = async (): Promise<void> => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(currentSession as { user: { id: string } } | null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      } catch {
        clearAuth();
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession as { user: { id: string } } | null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        if (!cancelled) setAuthLoading(false);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, setAuthLoading, clearAuth]);

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } finally {
      clearAuth();
    }
  };

  const getDashboard = (): string => {
    if (role && role in ROLE_DASHBOARDS) return ROLE_DASHBOARDS[role as keyof typeof ROLE_DASHBOARDS];
    return '/login';
  };

  return { session, profile, role, loading: authLoading, signOut, getDashboard };
}
