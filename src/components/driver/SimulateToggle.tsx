import type { ReactNode } from 'react';
import Badge from '@/components/ui/Badge';

interface SimulateToggleProps {
  isSimulating: boolean;
  disabled: boolean;
  onToggle: () => void;
  hasRoute: boolean;
}

export default function SimulateToggle({
  isSimulating,
  disabled,
  onToggle,
  hasRoute,
}: SimulateToggleProps): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-900">Simulate GPS (demo mode)</h3>

      {!hasRoute && (
        <p className="text-xs text-gray-500">
          Simulate mode requires a route assigned to your bus.
          Contact the admin to assign a route.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isSimulating}
          onClick={onToggle}
          disabled={disabled || !hasRoute}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] min-w-[44px] ${
            isSimulating ? 'bg-amber-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
              isSimulating ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>

        <span className="text-sm text-gray-700">
          {isSimulating ? 'Simulating' : 'Off'}
        </span>

        {isSimulating && (
          <Badge label="Simulating" color="amber" pulse />
        )}
      </div>
    </div>
  );
}
