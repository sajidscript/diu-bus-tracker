import type { ReactNode } from 'react';
import type { Route } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';

interface MapOverlayProps {
  busCount: number;
  routes: Route[];
  selectedRouteId: string;
}

export default function MapOverlay({
  busCount,
  routes,
  selectedRouteId,
}: MapOverlayProps): ReactNode {
  const setSelectedRouteId = useAppStore((s) => s.setSelectedRouteId);
  const addToast = useAppStore((s) => s.addToast);

  const handleSignOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      useAppStore.getState().clearAuth();
      window.location.href = '/login';
    } catch {
      addToast('error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] p-3 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl bg-white/95 shadow-lg backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg" role="img" aria-label="bus">🚌</span>
          <h1 className="text-sm font-bold text-gray-900 hidden sm:block">DIU Bus Tracker</h1>
          <h1 className="text-sm font-bold text-gray-900 sm:hidden">DIU</h1>
        </div>

        <Badge
          label={`${busCount} active`}
          color={busCount > 0 ? 'green' : 'grey'}
          pulse={busCount > 0}
        />

        <select
          value={selectedRouteId}
          onChange={(e) => setSelectedRouteId(e.target.value)}
          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
          aria-label="Filter by route"
        >
          <option value="all">All routes</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleSignOut}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
        >
          <span className="hidden sm:inline">Sign out</span>
          <svg className="h-5 w-5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
