import type { ReactNode } from 'react';
import { useState } from 'react';

type AlertType = 'error' | 'warning' | 'success';

interface AlertProps {
  type: AlertType;
  message: string;
  onDismiss?: () => void;
}

const typeClasses: Record<AlertType, string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-green-50 border-green-200 text-green-800',
};

const iconPaths: Record<AlertType, string> = {
  error:
    'M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z',
  warning:
    'M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z',
  success:
    'M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z',
};

export default function Alert({ type, message, onDismiss }: AlertProps): ReactNode {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = (): void => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${typeClasses[type]}`}
      role="alert"
    >
      <svg
        className="mt-0.5 h-5 w-5 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fillRule="evenodd" d={iconPaths[type]} clipRule="evenodd" />
      </svg>
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 hover:bg-black/5 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
