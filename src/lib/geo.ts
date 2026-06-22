import type { LatLng } from '@/lib/types';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function bearing(a: LatLng, b: LatLng): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const toDeg = (rad: number): number => (rad * 180) / Math.PI;
  const dLng = toRad(b.lng - a.lng);
  const y =
    Math.sin(dLng) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

interface StopForEta {
  lat: number;
  lng: number;
  stop_order: number;
  name: string;
}

export function estimateEtaMinutes(
  busPos: LatLng,
  busSpeedKmh: number,
  stops: StopForEta[],
  currentStopOrder: number,
): { stopName: string; etaMinutes: number } | null {
  const upcoming = stops
    .filter((s) => s.stop_order > currentStopOrder)
    .sort((a, b) => a.stop_order - b.stop_order);

  if (upcoming.length === 0) return null;

  let nearest: StopForEta | null = null;
  let nearestDist = Infinity;

  for (const stop of upcoming) {
    const dist = haversineKm(busPos, { lat: stop.lat, lng: stop.lng });
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = stop;
    }
  }

  if (!nearest) return null;

  const effectiveSpeed = Math.max(busSpeedKmh, 10);
  const eta = (nearestDist / effectiveSpeed) * 60;
  const rounded = Math.min(Math.round(eta), 99);

  return { stopName: nearest.name, etaMinutes: rounded };
}

export function interpolatePolyline(
  polyline: LatLng[],
  stepIndex: number,
): { pos: LatLng; heading: number; speedKmh: number; nextIndex: number } {
  const safeIndex = stepIndex % polyline.length;
  const current = polyline[safeIndex];
  const nextIdx = (safeIndex + 1) % polyline.length;
  const next = polyline[nextIdx];

  const distance = haversineKm(current, next);
  const STEP_SECONDS = 5;
  const speedKmh = (distance / STEP_SECONDS) * 3600;
  const headingDeg = bearing(current, next);

  return {
    pos: { lat: current.lat, lng: current.lng },
    heading: headingDeg,
    speedKmh,
    nextIndex: safeIndex + 1,
  };
}

export function findCurrentStopOrder(
  busPos: LatLng,
  stops: StopForEta[],
): number {
  if (stops.length === 0) return 0;
  const sorted = [...stops].sort((a, b) => a.stop_order - b.stop_order);
  let closestStop = sorted[0];
  let closestDist = Infinity;

  for (const stop of sorted) {
    const dist = haversineKm(busPos, { lat: stop.lat, lng: stop.lng });
    if (dist < closestDist) {
      closestDist = dist;
      closestStop = stop;
    }
  }
  return closestStop.stop_order;
}
