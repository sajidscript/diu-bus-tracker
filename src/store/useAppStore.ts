import { create } from 'zustand';
import type { Profile, Role, BusLocation, Toast } from '@/lib/types';

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

interface AppState {
  session: { user: { id: string } } | null;
  profile: Profile | null;
  role: Role | null;
  authLoading: boolean;
  busLocations: Record<string, BusLocation>;
  selectedRouteId: string;
  toasts: Toast[];

  setSession: (session: { user: { id: string } } | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setBusLocation: (busId: string, location: BusLocation) => void;
  removeBusLocation: (busId: string) => void;
  setAllLocations: (locations: Record<string, BusLocation>) => void;
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
  busLocations: {},
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
    set((state) => ({
      busLocations: { ...state.busLocations, [busId]: location },
    })),

  removeBusLocation: (busId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [busId]: _removed, ...rest } = state.busLocations;
      return { busLocations: rest };
    }),

  setAllLocations: (locations) => set({ busLocations: locations }),

  setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),

  addToast: (type, message) =>
    set((state) => {
      const id = generateId();
      const newToast: Toast = { id, type, message };
      const toasts = [...state.toasts, newToast].slice(-5);
      const delay = type === 'success' ? 3000 : type === 'warning' ? 5000 : null;
      if (delay !== null) {
        const tid = setTimeout(() => {
          toastTimeouts.delete(id);
          useAppStore.getState().removeToast(id);
        }, delay);
        toastTimeouts.set(id, tid);
      }
      return { toasts };
    }),

  removeToast: (id) => {
      const tid = toastTimeouts.get(id);
      if (tid !== undefined) clearTimeout(tid);
      toastTimeouts.delete(id);
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },

  clearAuth: () =>
    set({
      session: null,
      profile: null,
      role: null,
      authLoading: false,
    }),
}));
