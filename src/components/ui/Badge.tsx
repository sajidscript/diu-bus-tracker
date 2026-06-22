import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'grey' | 'red' | 'amber';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  pulse?: boolean;
}

const colorClasses: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-800',
  grey: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
};

export default function Badge({
  label,
  color = 'green',
  pulse = false,
}: BadgeProps): ReactNode {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClasses[color]}`}
    >
      {pulse && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            color === 'green'
              ? 'bg-green-500'
              : color === 'amber'
                ? 'bg-amber-500'
                : color === 'red'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
          } animate-pulse`}
        />
      )}
      {label}
    </span>
  );
}
