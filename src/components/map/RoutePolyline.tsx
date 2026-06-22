import type { ReactNode } from 'react';
import { Polyline } from 'react-leaflet';
import type { Route } from '@/lib/types';

interface RoutePolylineProps {
  route: Route;
}

export default function RoutePolyline({ route }: RoutePolylineProps): ReactNode {
  const positions: [number, number][] = route.polyline.map((p) => [p.lat, p.lng]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: route.color,
        weight: 4,
        opacity: 0.7,
      }}
    />
  );
}
