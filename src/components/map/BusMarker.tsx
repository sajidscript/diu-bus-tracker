import type { ReactNode } from 'react';
import { useEffect, useRef, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { BusLocation, Route } from '@/lib/types';
import BusPopup from '@/components/map/BusPopup';

interface BusMarkerProps {
  location: BusLocation;
  signalLost: boolean;
  route: Route | null;
}

function createBusIcon(heading: number, signalLost: boolean): L.DivIcon {
  const fillColor = signalLost ? '#9ca3af' : '#16a34a';
  const border = signalLost ? 'stroke-dasharray="4 2" stroke="#6b7280"' : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" style="transform:rotate(${heading}deg)">
    <rect x="6" y="4" width="20" height="24" rx="4" fill="${fillColor}" ${border} stroke-width="2"/>
    <rect x="9" y="8" width="14" height="8" rx="1" fill="white" opacity="0.9"/>
    <circle cx="10" cy="26" r="2.5" fill="#333"/>
    <circle cx="22" cy="26" r="2.5" fill="#333"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: 'bus-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function BusMarker({
  location,
  signalLost,
  route,
}: BusMarkerProps): ReactNode {
  const markerRef = useRef<L.Marker>(null);
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const icon = useMemo(
    () => createBusIcon(location.heading, signalLost),
    [location.heading, signalLost],
  );

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const prev = prevPosRef.current;
    if (prev) {
      marker.setLatLng([location.lat, location.lng]);
    }
    prevPosRef.current = { lat: location.lat, lng: location.lng };
  }, [location.lat, location.lng]);

  return (
    <Marker
      ref={markerRef}
      position={[location.lat, location.lng]}
      icon={icon}
    >
      <Popup>
        <BusPopup location={location} signalLost={signalLost} route={route} />
      </Popup>
    </Marker>
  );
}