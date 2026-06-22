import type { ReactNode } from 'react';
import { Suspense, lazy, Component } from 'react';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface ErrorFallbackProps {
  onRetry: () => void;
}

function MapErrorFallback({ onRetry }: ErrorFallbackProps): ReactNode {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-100 p-8 text-center">
      <svg className="h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <p className="text-gray-700 font-medium">Map failed to load.</p>
      <p className="text-gray-500 text-sm">Try refreshing the page.</p>
      <Button variant="primary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const BusMapImpl = lazy(() => import('@/components/map/BusMapImpl'));

interface BusMapProps {
  routeId: string;
}

export default function BusMap({ routeId }: BusMapProps): ReactNode {
  return (
    <MapErrorBoundary
      fallback={<MapErrorFallback onRetry={() => window.location.reload()} />}
    >
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center bg-gray-100">
            <Spinner size="lg" label="Loading map..." />
          </div>
        }
      >
      <BusMapImpl routeId={routeId} />
    </Suspense>
    </MapErrorBoundary>
  );
}
