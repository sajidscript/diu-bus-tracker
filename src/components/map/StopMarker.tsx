import type { ReactNode } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { StopWithOrder } from '@/lib/types';

interface StopMarkerProps {
  stop: StopWithOrder;
}

function createStopIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:white;border:3px solid #16a34a;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    className: 'stop-marker-icon',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function StopMarker({ stop }: StopMarkerProps): ReactNode {
  const icon = createStopIcon();

  return (
    <Marker position={[stop.lat, stop.lng]} icon={icon}>
      <Popup>
        <div className="p-1">
          <p className="font-semibold text-gray-900 text-sm">{stop.name}</p>
          {stop.address && (
            <p className="text-xs text-gray-500 mt-1">{stop.address}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
