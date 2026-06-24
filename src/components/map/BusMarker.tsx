import type { ReactNode } from 'react';
import { useEffect, useRef, useMemo, useCallback } from 'react';
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function BusMarker({
  location,
  signalLost,
  route,
}: BusMarkerProps): ReactNode {
  const markerRef = useRef<L.Marker>(null);
  const targetRef = useRef<{ lat: number; lng: number } | null>(null);
  const currentRef = useRef<{ lat: number; lng: number } | null>(null);
  const animRef = useRef<number | null>(null);

  const icon = useMemo(
    () => createBusIcon(location.heading, signalLost),
    [location.heading, signalLost],
  );

  const animate = useCallback(() => {
    const marker = markerRef.current;
    const target = targetRef.current;
    const current = currentRef.current;
    if (!marker || !target || !current) return;

    const newLat = lerp(current.lat, target.lat, 0.15);
    const newLng = lerp(current.lng, target.lng, 0.15);

    const dLat = Math.abs(target.lat - newLat);
    const dLng = Math.abs(target.lng - newLng);

    if (dLat < 0.000001 && dLng < 0.000001) {
      marker.setLatLng([target.lat, target.lng]);
      currentRef.current = { lat: target.lat, lng: target.lng };
      animRef.current = null;
      return;
    }

    marker.setLatLng([newLat, newLng]);
    currentRef.current = { lat: newLat, lng: newLng };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    targetRef.current = { lat: location.lat, lng: location.lng };

    if (!currentRef.current) {
      currentRef.current = { lat: location.lat, lng: location.lng };
      markerRef.current?.setLatLng([location.lat, location.lng]);
      return;
    }

    if (!animRef.current) {
      animRef.current = requestAnimationFrame(animate);
    }
  }, [location.lat, location.lng, animate]);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, []);

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