import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Route, Stop, StopWithOrder } from '@/lib/types';

interface RouteWithStops extends Route {
  stops: StopWithOrder[];
}

export function useRoutes(): {
  routes: RouteWithStops[];
  stops: Stop[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = (): void => setRefetchKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const [routesRes, stopsRes, routeStopsRes] = await Promise.all([
          supabase.from('routes').select('*'),
          supabase.from('stops').select('*'),
          supabase.from('route_stops').select('*').order('stop_order'),
        ]);

        if (routesRes.error) throw routesRes.error;
        if (stopsRes.error) throw stopsRes.error;
        if (routeStopsRes.error) throw routeStopsRes.error;

        if (cancelled) return;

        const routesData = routesRes.data as Route[];
        const stopsData = stopsRes.data as Stop[];
        const rsData = routeStopsRes.data as { route_id: string; stop_id: string; stop_order: number }[];

        const stopMap = new Map<string, Stop>();
        for (const s of stopsData) {
          stopMap.set(s.id, s);
        }

        const routeStopsMap = new Map<string, StopWithOrder[]>();
        for (const rs of rsData) {
          const list = routeStopsMap.get(rs.route_id) ?? [];
          const stop = stopMap.get(rs.stop_id);
          if (stop) {
            list.push({ ...stop, stop_order: rs.stop_order });
          }
          routeStopsMap.set(rs.route_id, list);
        }

        const enriched: RouteWithStops[] = routesData.map((r) => ({
          ...r,
          stops: (routeStopsMap.get(r.id) ?? []).sort((a, b) => a.stop_order - b.stop_order),
        }));

        setRoutes(enriched);
        setStops(stopsData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch routes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [refetchKey]);

  return { routes, stops, loading, error, refetch };
}
