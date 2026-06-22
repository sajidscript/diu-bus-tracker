import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useSignalLost(): Set<string> {
  const busLocations = useAppStore((s) => s.busLocations);
  const [staleBusIds, setStaleBusIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const stale = new Set<string>();
      Object.entries(busLocations).forEach(([busId, loc]) => {
        const updatedAt = new Date(loc.updated_at).getTime();
        if (now - updatedAt > 60000) {
          stale.add(busId);
        }
      });
      setStaleBusIds(stale);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [busLocations]);

  return staleBusIds;
}
