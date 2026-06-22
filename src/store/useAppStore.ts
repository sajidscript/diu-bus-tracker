import { create } from 'zustand';
import type { Profile, Role, BusLocation, Toast } from '@/lib/types';

interface AppState {
  session: { user: { id: string } } | null;
  profile: Profile | null;
  role: Role | null;
  authLoading: boolean;
  busLocations: Map<string, BusLocation>;
  selectedRouteId: string;
  toasts: Toast[];

  setSession: (session: { user: { id: string } } | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setBusLocation: (busId: string, location: BusLocation) => void;
  removeBusLocation: (busId: string) => void;
  setAllLocations: (locations: Map<string, BusLocation>) => void;
  setSelectedRouteId: (id: string) => void;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  clearAuth: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  profile: null,
  role: null,
  authLoading: true,
  busLocations: new Map(),
  selectedRouteId: 'all',
  toasts: [],

  setSession: (session) =>
    set((state) => ({
      session,
      role: state.profile?.role ?? null,
    })),

  setProfile: (profile) =>
    set({
      profile,
      role: profile?.role ?? null,
    }),

  setAuthLoading: (authLoading) => set({ authLoading }),

  setBusLocation: (busId, location) =>
    set((state) => {
      const next = new Map(state.busLocations);
      next.set(busId, location);
      return { busLocations: next };
    }),

  removeBusLocation: (busId) =>
    set((state) => {
      const next = new Map(state.busLocations);
      next.delete(busId);
      return { busLocations: next };
    }),

  setAllLocations: (locations) => set({ busLocations: locations }),

  setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),

  addToast: (type, message) =>
    set((state) => {
      const id = crypto.randomUUID();
      const newToast: Toast = { id, type, message };
      const toasts = [...state.toasts, newToast];
      if (type === 'success') {
        setTimeout(() => {
          useAppStore.getState().removeToast(id);
        }, 3000);
      }
      if (type === 'warning') {
        setTimeout(() => {
          useAppStore.getState().removeToast(id);
        }, 5000);
      }
      return { toasts };
    }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAuth: () =>
    set({
      session: null,
      profile: null,
      role: null,
      authLoading: false,
    }),
}));
