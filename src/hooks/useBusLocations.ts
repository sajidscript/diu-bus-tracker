import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { BusLocation } from '@/lib/types';

export function useBusLocations(): {
  locations: BusLocation[];
  loading: boolean;
  error: string | null;
} {
  const { busLocations, setBusLocation, setAllLocations, removeBusLocation } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async (): Promise<void> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('bus_locations')
          .select('*');
        if (fetchError) throw fetchError;
        if (!cancelled && data) {
          const map: Record<string, BusLocation> = {};
          for (const loc of data as BusLocation[]) {
            map[loc.bus_id] = loc;
          }
          setAllLocations(map);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch bus locations');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitial();

    const channel = supabase
      .channel('bus-locations-realtime')
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'bus_locations',
        },
        (payload) => {
          if (cancelled) return;
          if (payload.eventType === 'DELETE') {
            if (payload.old?.bus_id) {
              removeBusLocation(payload.old.bus_id);
            }
          } else {
            const newLocation = payload.new as BusLocation;
            if (newLocation?.bus_id) {
              setBusLocation(newLocation.bus_id, newLocation);
            }
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [setBusLocation, setAllLocations, removeBusLocation]);

  return {
    locations: Object.values(busLocations),
    loading,
    error,
  };
}
