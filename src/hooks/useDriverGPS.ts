import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { interpolatePolyline } from '@/lib/geo';
import type { LatLng } from '@/lib/types';

interface UseDriverGPSReturn {
  isSharing: boolean;
  isSimulating: boolean;
  updateCount: number;
  gpsError: string | null;
  startSharing: (busId: string) => Promise<void>;
  stopSharing: () => void;
  startSimulate: (busId: string, polyline: LatLng[]) => void;
  stopSimulate: () => void;
  wakeLockActive: boolean;
}

export function useDriverGPS(): UseDriverGPSReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const simulateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulateIndexRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const retryCountRef = useRef(0);

  const addToast = useAppStore((s) => s.addToast);

  const sendLocation = useCallback(
    async (
      busId: string,
      lat: number,
      lng: number,
      speed: number,
      heading: number,
      accuracy: number,
      simulate: boolean,
    ): Promise<void> => {
      try {
        const { error } = await supabase.rpc('upsert_bus_location', {
          p_bus_id: busId,
          p_lat: lat,
          p_lng: lng,
          p_speed: speed,
          p_heading: heading,
          p_accuracy: accuracy,
          p_simulate: simulate,
        });
        if (error) throw error;
        retryCountRef.current = 0;
        setUpdateCount((c) => c + 1);
      } catch (err) {
        if (retryCountRef.current < 3) {
          retryCountRef.current += 1;
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          setTimeout(() => {
            sendLocation(busId, lat, lng, speed, heading, accuracy, simulate);
          }, delay);
        } else {
          addToast('error', 'Failed to send location update. Please check your connection.');
          retryCountRef.current = 0;
        }
      }
    },
    [addToast],
  );

  const requestWakeLock = useCallback(async (): Promise<void> => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        lock.addEventListener('release', () => {
          setWakeLockActive(false);
          wakeLockRef.current = null;
        });
      }
    } catch {
      addToast('warning', 'Screen wake lock was denied. Your screen may turn off.');
    }
  }, [addToast]);

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  const stopSharing = useCallback((): void => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    setIsSharing(false);
    setUpdateCount(0);
  }, [releaseWakeLock]);

  const startSharing = useCallback(
    async (busId: string): Promise<void> => {
      setGpsError(null);
      if (!navigator.geolocation) {
        setGpsError('Geolocation is not supported by your browser.');
        return;
      }

      await requestWakeLock();

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          sendLocation(
            busId,
            latitude,
            longitude,
            speed ?? 0,
            heading ?? 0,
            accuracy,
            false,
          );
        },
        (err) => {
          setGpsError(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied. Please enable location access in your browser settings and try again.'
              : 'Unable to get your location. Please check your device settings.',
          );
          stopSharing();
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );

      setIsSharing(true);
    },
    [sendLocation, requestWakeLock, stopSharing],
  );

  const startSimulate = useCallback(
    (busId: string, polyline: LatLng[]): void => {
      if (polyline.length < 2) return;
      simulateIndexRef.current = 0;

      simulateIntervalRef.current = setInterval(() => {
        const result = interpolatePolyline(polyline, simulateIndexRef.current);
        simulateIndexRef.current = result.nextIndex;
        if (simulateIndexRef.current >= polyline.length) {
          simulateIndexRef.current = 0;
        }
        sendLocation(
          busId,
          result.pos.lat,
          result.pos.lng,
          result.speedKmh,
          result.heading,
          0,
          true,
        );
      }, 5000);

      setIsSimulating(true);
    },
    [sendLocation],
  );

  const stopSimulate = useCallback((): void => {
    if (simulateIntervalRef.current) {
      clearInterval(simulateIntervalRef.current);
      simulateIntervalRef.current = null;
    }
    simulateIndexRef.current = 0;
    setIsSimulating(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simulateIntervalRef.current) {
        clearInterval(simulateIntervalRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    isSharing,
    isSimulating,
    updateCount,
    gpsError,
    startSharing,
    stopSharing,
    startSimulate,
    stopSimulate,
    wakeLockActive,
  };
}
