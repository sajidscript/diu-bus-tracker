import type { ReactNode } from 'react';
import type { BusLocation, Route } from '@/lib/types';
import { estimateEtaMinutes, findCurrentStopOrder } from '@/lib/geo';
import { formatDistanceToNowStrict } from 'date-fns';
import Badge from '@/components/ui/Badge';

interface BusPopupProps {
  location: BusLocation;
  signalLost: boolean;
  route: Route | null;
}

export default function BusPopup({
  location,
  signalLost,
  route,
}: BusPopupProps): ReactNode {
  const routeStops = route?.stops ?? [];
  const currentStopOrder = findCurrentStopOrder(
    { lat: location.lat, lng: location.lng },
    routeStops,
  );

  const eta = estimateEtaMinutes(
    { lat: location.lat, lng: location.lng },
    location.speed,
    routeStops,
    currentStopOrder,
  );

  const lastUpdate = formatDistanceToNowStrict(new Date(location.updated_at), {
    addSuffix: true,
  });

  return (
    <div className="flex flex-col gap-2 p-1 min-w-[180px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">
          Bus{location.simulate ? ' (demo)' : ''} {route ? `— ${route.name}` : ''}
        </span>
        {signalLost ? (
          <Badge label="Signal lost" color="grey" pulse />
        ) : (
          <Badge label="Live" color="green" pulse />
        )}
      </div>
      <div className="text-xs text-gray-600">
        <p>Speed: {Math.round(location.speed)} km/h</p>
        <p>Last update: {lastUpdate}</p>
      </div>
      {eta && (
        <div className="rounded bg-green-50 px-2 py-1 text-xs text-green-800">
          Next stop: {eta.stopName} — ~{eta.etaMinutes} min
        </div>
      )}
    </div>
  );
}