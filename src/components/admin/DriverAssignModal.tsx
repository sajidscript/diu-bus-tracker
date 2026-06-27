import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import type { Profile } from '@/lib/types';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

interface DriverAssignModalProps {
  open: boolean;
  onClose: () => void;
  drivers: Profile[];
  onAssign: (driverId: string) => void;
  currentDriverId: string | null;
}

export default function DriverAssignModal({
  open,
  onClose,
  drivers,
  onAssign,
  currentDriverId,
}: DriverAssignModalProps): ReactNode {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase().trim();
    return drivers.filter((d) => {
      const name = (d.full_name ?? '').toLowerCase();
      const code = (d.serial_code ?? '').toLowerCase();
      const email = d.email.toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [drivers, search]);

  const handleSelect = (driverId: string): void => {
    onAssign(driverId);
    setSearch('');
    onClose();
  };

  const handleRemove = (): void => {
    onAssign('');
    setSearch('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign driver">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search by name, serial code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[44px] w-full"
          autoFocus
        />

        {currentDriverId && (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <span className="text-sm text-green-800 font-medium">Current driver assigned</span>
            <button
              onClick={handleRemove}
              className="text-sm text-red-600 font-medium hover:text-red-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Remove
            </button>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              {drivers.length === 0
                ? 'No drivers registered yet'
                : 'No drivers match your search'}
            </div>
          )}
          {filtered.map((driver) => (
            <button
              key={driver.id}
              onClick={() => handleSelect(driver.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-[44px] ${
                driver.id === currentDriverId ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {driver.full_name || driver.email}
                </span>
                <span className="text-xs text-gray-500">{driver.email}</span>
              </div>
              {driver.serial_code && (
                <Badge label={driver.serial_code} color="green" />
              )}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
