import type { ReactNode } from 'react';
import BusMap from '@/components/map/BusMap';
import { useAppStore } from '@/store/useAppStore';

export default function StudentPage(): ReactNode {
  const selectedRouteId = useAppStore((s) => s.selectedRouteId);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <BusMap routeId={selectedRouteId} />
    </div>
  );
}
