import type { ReactNode } from 'react';
import { Polyline } from 'react-leaflet';
import { useReroute } from '@/hooks/useReroute';
import type { BusLocation, Route, LatLng } from '@/lib/types';

interface BusRerouteProps {
  location: BusLocation;
  route: Route | null;
}

export default function BusReroute({ location, route }: BusRerouteProps): ReactNode {
  const destination: LatLng | null =
    route && route.stops.length > 0
      ? { lat: route.stops[route.stops.length - 1].lat, lng: route.stops[route.stops.length - 1].lng }
      : null;

  const { polyline, deviated } = useReroute(location, route?.polyline ?? null, destination);

  if (!deviated || !polyline || polyline.length === 0) return null;

  const positions: [number, number][] = polyline.map((p) => [p.lat, p.lng]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#d97706',
        weight: 3,
        opacity: 0.8,
        dashArray: '8 6',
      }}
    />
  );
}