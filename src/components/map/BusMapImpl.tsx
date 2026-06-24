import type { ReactNode } from 'react';
import { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useBusLocations } from '@/hooks/useBusLocations';
import { useRoutes } from '@/hooks/useRoutes';
import { useSignalLost } from '@/hooks/useSignalLost';
import { supabase } from '@/lib/supabase';
import type { Bus, Route } from '@/lib/types';
import BusMarker from '@/components/map/BusMarker';
import BusReroute from '@/components/map/BusReroute';
import RoutePolyline from '@/components/map/RoutePolyline';
import StopMarker from '@/components/map/StopMarker';
import MapOverlay from '@/components/map/MapOverlay';
import Spinner from '@/components/ui/Spinner';
import 'leaflet/dist/leaflet.css';

interface BusMapImplProps {
  routeId: string;
}

const DIU_CENTER: [number, number] = [23.8759, 90.3195];
const DEFAULT_ZOOM = 14;

export default function BusMapImpl({ routeId }: BusMapImplProps): ReactNode {
  const { locations } = useBusLocations();
  const { routes } = useRoutes();
  const staleBusIds = useSignalLost();
  const [busRouteMap, setBusRouteMap] = useState<Map<string, Route | null>>(new Map());
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchBuses = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.from('buses').select('*');
        if (error) throw error;
        if (cancelled) return;

        const mapping = new Map<string, Route | null>();
        for (const bus of data as Bus[]) {
          const matchedRoute =
            routes.find((r) => r.id === bus.route_id) ?? null;
          mapping.set(bus.id, matchedRoute);
        }
        setBusRouteMap(mapping);
      } catch {
        if (!cancelled) setBusRouteMap(new Map());
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    };

    if (routes.length > 0) {
      fetchBuses();
    }
    return () => {
      cancelled = true;
    };
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    if (routeId === 'all') return routes;
    return routes.filter((r) => r.id === routeId);
  }, [routes, routeId]);

  const filteredLocations = useMemo(() => {
    if (routeId === 'all') return locations;
    return locations.filter((loc) => {
      const matchedRoute = busRouteMap.get(loc.bus_id);
      return matchedRoute?.id === routeId;
    });
  }, [locations, routeId, busRouteMap]);

  if (mapLoading && routes.length > 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <Spinner size="lg" label="Loading bus data..." />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      <MapContainer
        center={DIU_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredRoutes.map((route) => (
          <RoutePolyline key={route.id} route={route} />
        ))}
        {filteredRoutes.flatMap((route) =>
          route.stops.map((stop) => (
            <StopMarker key={stop.id} stop={stop} />
          )),
        )}
        {filteredLocations.map((loc) => (
          <BusReroute
            key={`reroute-${loc.bus_id}`}
            location={loc}
            route={busRouteMap.get(loc.bus_id) ?? null}
          />
        ))}
        {filteredLocations.map((loc) => (
          <BusMarker
            key={loc.bus_id}
            location={loc}
            signalLost={staleBusIds.has(loc.bus_id)}
            route={busRouteMap.get(loc.bus_id) ?? null}
          />
        ))}
      </MapContainer>
      <MapOverlay
        busCount={filteredLocations.length}
        routes={routes}
        selectedRouteId={routeId}
      />
    </div>
  );
}