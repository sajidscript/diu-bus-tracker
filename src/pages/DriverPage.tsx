import type { ReactNode } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { useDriverGPS } from '@/hooks/useDriverGPS';
import { useRoutes } from '@/hooks/useRoutes';
import type { Bus } from '@/lib/types';
import BusSelector from '@/components/driver/BusSelector';
import GPSControls from '@/components/driver/GPSControls';
import SimulateToggle from '@/components/driver/SimulateToggle';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

const POLL_INTERVAL = 5000;

export default function DriverPage(): ReactNode {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profile = useAppStore((s) => s.profile);
  const addToast = useAppStore((s) => s.addToast);
  const { routes } = useRoutes();

  const {
    isSharing,
    isSimulating,
    updateCount,
    gpsError,
    wakeLockActive,
    startSharing,
    stopSharing,
    startSimulate,
    stopSimulate,
  } = useDriverGPS();

  const prevBusCountRef = useRef(0);

  const fetchBuses = useCallback(async (): Promise<void> => {
    if (!profile?.id) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('buses')
        .select('*')
        .eq('driver_id', profile.id);
      if (fetchError) throw fetchError;
      const busData = (data as Bus[]) ?? [];

      if (prevBusCountRef.current === 0 && busData.length > 0) {
        addToast('success', 'A bus has been assigned to you! Start sharing your location.');
      }
      prevBusCountRef.current = busData.length;

      setBuses(busData);
      if (busData.length > 0 && !selectedBusId) {
        setSelectedBusId(busData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, selectedBusId, addToast]);

  useEffect(() => {
    fetchBuses();

    const interval = setInterval(fetchBuses, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
    };
  }, [fetchBuses]);

  const selectedBus = buses.find((b) => b.id === selectedBusId) ?? null;
  const busRoute = routes.find((r) => r.id === selectedBus?.route_id) ?? null;

  const handleStartSharing = (): void => {
    if (selectedBusId) {
      startSharing(selectedBusId);
    }
  };

  const handleToggleSimulate = (): void => {
    if (isSimulating) {
      stopSimulate();
    } else {
      if (selectedBusId && busRoute?.polyline) {
        startSimulate(selectedBusId, busRoute.polyline);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4 text-center">
        <span className="text-4xl mb-4" role="img" aria-label="bus">🚌</span>
        <h2 className="text-xl font-semibold text-gray-900">No bus assigned to you yet</h2>
        <p className="mt-2 text-gray-500">Waiting for admin to assign a bus...</p>
        <p className="mt-1 text-sm text-gray-400">This page refreshes automatically.</p>
      </div>
    );
  }

  const showLocationPrompt = buses.length > 0 && !isSharing && !isSimulating;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Driver dashboard</h1>
          {isSimulating && <Badge label="Simulating" color="amber" pulse />}
          {isSharing && !isSimulating && <Badge label="Live" color="green" pulse />}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 flex flex-col gap-6">
        {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

        {showLocationPrompt && (
          <Alert
            type="warning"
            message="You have an assigned bus. Share your location so students can track you."
          />
        )}

        <BusSelector
          buses={buses}
          selectedId={selectedBusId}
          onChange={setSelectedBusId}
        />

        <GPSControls
          isSharing={isSharing}
          updateCount={updateCount}
          gpsError={gpsError}
          wakeLockActive={wakeLockActive}
          onStart={handleStartSharing}
          onStop={stopSharing}
          disabled={!selectedBusId}
        />

        <SimulateToggle
          isSimulating={isSimulating}
          disabled={isSharing}
          onToggle={handleToggleSimulate}
          hasRoute={!!busRoute}
        />
      </main>
    </div>
  );
}
