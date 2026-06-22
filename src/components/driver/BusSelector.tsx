import type { ReactNode } from 'react';
import type { Bus } from '@/lib/types';

interface BusSelectorProps {
  buses: Bus[];
  selectedId: string | null;
  onChange: (busId: string) => void;
}

export default function BusSelector({
  buses,
  selectedId,
  onChange,
}: BusSelectorProps): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-900">Select bus</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
        disabled={buses.length === 0}
      >
        <option value="" disabled>
          {buses.length === 0 ? 'No buses assigned' : 'Choose a bus'}
        </option>
        {buses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.bus_number} (capacity: {b.capacity})
          </option>
        ))}
      </select>
    </div>
  );
}
