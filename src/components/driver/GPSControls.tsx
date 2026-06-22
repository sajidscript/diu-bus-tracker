import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

interface GPSControlsProps {
  isSharing: boolean;
  updateCount: number;
  gpsError: string | null;
  wakeLockActive: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}

export default function GPSControls({
  isSharing,
  updateCount,
  gpsError,
  wakeLockActive,
  onStart,
  onStop,
  disabled,
}: GPSControlsProps): ReactNode {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-900">GPS sharing</h3>

      {gpsError && (
        <Alert type="error" message={gpsError} />
      )}

      {!wakeLockActive && isSharing && (
        <Alert
          type="warning"
          message="Screen wake lock is not active. Your screen may turn off."
        />
      )}

      <div className="flex items-center gap-3">
        {!isSharing ? (
          <Button
            variant="primary"
            onClick={onStart}
            disabled={disabled}
          >
            Start sharing
          </Button>
        ) : (
          <Button variant="danger" onClick={onStop}>
            Stop sharing
          </Button>
        )}

        {isSharing && (
          <span className="text-sm text-gray-600">
            Updates sent: {updateCount}
          </span>
        )}

        {isSharing && (
          <Badge label="Sharing" color="green" pulse />
        )}
      </div>
    </div>
  );
}
