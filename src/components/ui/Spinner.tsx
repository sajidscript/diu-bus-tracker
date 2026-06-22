import type { ReactNode } from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function Spinner({
  size = 'md',
  label = 'Loading...',
}: SpinnerProps): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg
        className={`animate-spin text-green-600 ${sizeClasses[size]}`}
        viewBox="0 0 24 24"
        fill="none"
        role="status"
        aria-label={label}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          fill="currentColor"
        />
      </svg>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}
