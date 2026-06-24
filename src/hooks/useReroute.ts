import { useEffect, useRef, useState } from 'react';
import type { BusLocation, LatLng } from '@/lib/types';

interface RerouteResult {
  polyline: LatLng[] | null;
  deviated: boolean;
  loading: boolean;
  error: string | null;
}

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const cosLatA = Math.cos(toRad(a.lat));
  const cosLatB = Math.cos(toRad(b.lat));
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat * sinDLat + cosLatA * cosLatB * sinDLng * sinDLng,
      ),
    );
  return R * c;
}

function findNearestPoint(point: LatLng, polyline: LatLng[]): { index: number; distance: number } {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < polyline.length; i++) {
    const dist = haversine(point, polyline[i]);
    if (dist < minDist) {
      minDist = dist;
      minIdx = i;
    }
  }
  return { index: minIdx, distance: minDist };
}

const DEVIATION_THRESHOLD = 50;
const CACHE_TTL = 30000;

const rerouteCache = new Map<string, { polyline: LatLng[]; timestamp: number }>();

export function useReroute(
  location: BusLocation | null,
  routePolyline: LatLng[] | null,
  destination: LatLng | null,
): RerouteResult {
  const [polyline, setPolyline] = useState<LatLng[] | null>(null);
  const [deviated, setDeviated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkDeviation = async (): Promise<void> => {
      if (!location || !routePolyline || routePolyline.length === 0 || !destination) {
        setDeviated(false);
        setPolyline(null);
        return;
      }

      const { distance } = findNearestPoint(
        { lat: location.lat, lng: location.lng },
        routePolyline,
      );

      if (distance <= DEVIATION_THRESHOLD) {
        setDeviated(false);
        setPolyline(null);
        return;
      }

      setDeviated(true);

      const cacheKey = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
      const cached = rerouteCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (!cancelled) setPolyline(cached.polyline);
        return;
      }

      if (fetchedRef.current === cacheKey) return;
      fetchedRef.current = cacheKey;

      setLoading(true);
      setError(null);

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${location.lng},${location.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`OSRM responded with ${res.status}`);
        const json = await res.json();

        if (!json.routes || json.routes.length === 0) {
          throw new Error('No reroute found');
        }

        const coords: LatLng[] = json.routes[0].geometry.coordinates.map(
          (c: [number, number]) => ({ lng: c[0], lat: c[1] }),
        );

        rerouteCache.set(cacheKey, { polyline: coords, timestamp: Date.now() });

        if (!cancelled) setPolyline(coords);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Reroute failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkDeviation();

    return () => {
      cancelled = true;
    };
  }, [location?.lat, location?.lng, routePolyline, destination]);

  return { polyline, deviated, loading, error };
}