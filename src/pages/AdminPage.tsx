import type { ReactNode } from 'react';
import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '@/lib/supabase';
import { useRoutes } from '@/hooks/useRoutes';
import { useAppStore } from '@/store/useAppStore';
import type { Bus, Profile, Role } from '@/lib/types';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import DriverAssignModal from '@/components/admin/DriverAssignModal';

type AdminTab = 'buses' | 'drivers' | 'routes' | 'stops' | 'users' | 'map';

const BusMap = lazy(() => import('@/components/map/BusMap'));

export default function AdminPage(): ReactNode {
  const [activeTab, setActiveTab] = useState<AdminTab>('buses');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBus, setShowAddBus] = useState(false);
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusCapacity, setNewBusCapacity] = useState('40');
  const [newBusRouteId, setNewBusRouteId] = useState('');
  const [assigningBusId, setAssigningBusId] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);
  const { routes } = useRoutes();

  const fetchBuses = useCallback(async (): Promise<void> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('buses')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setBuses((data as Bus[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buses');
    }
  }, []);

  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setUsers((data as Profile[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    }
  }, []);

  useEffect(() => {
    const init = async (): Promise<void> => {
      setLoading(true);
      await Promise.all([fetchBuses(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, [fetchBuses, fetchUsers]);

  const handleAddBus = async (): Promise<void> => {
    try {
      const { error: insertError } = await supabase.from('buses').insert({
        bus_number: newBusNumber,
        capacity: parseInt(newBusCapacity, 10),
        route_id: newBusRouteId || null,
      });
      if (insertError) throw insertError;
      addToast('success', 'Bus added successfully');
      setShowAddBus(false);
      setNewBusNumber('');
      setNewBusCapacity('40');
      setNewBusRouteId('');
      await fetchBuses();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to add bus');
    }
  };

  const handleToggleBusActive = async (bus: Bus): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('buses')
        .update({ is_active: !bus.is_active })
        .eq('id', bus.id);
      if (updateError) throw updateError;
      addToast('success', `Bus ${bus.bus_number} ${bus.is_active ? 'deactivated' : 'activated'}`);
      await fetchBuses();
    } catch (err) {
      addToast('error', 'Failed to update bus status');
    }
  };

  const handleAssignDriver = async (busId: string, driverId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('buses')
        .update({ driver_id: driverId || null })
        .eq('id', busId);
      if (updateError) throw updateError;
      addToast('success', 'Driver assigned');
      await fetchBuses();
    } catch (err) {
      addToast('error', 'Failed to assign driver');
    }
  };

  const handleAssignRoute = async (busId: string, routeId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('buses')
        .update({ route_id: routeId || null })
        .eq('id', busId);
      if (updateError) throw updateError;
      addToast('success', 'Route assigned');
      await fetchBuses();
    } catch (err) {
      addToast('error', 'Failed to assign route');
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (updateError) throw updateError;
      addToast('success', 'Role updated');
      await fetchUsers();
    } catch (err) {
      addToast('error', 'Failed to update role');
    }
  };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'buses', label: 'Buses' },
    { key: 'drivers', label: 'Drivers' },
    { key: 'routes', label: 'Routes' },
    { key: 'stops', label: 'Stops' },
    { key: 'users', label: 'Users' },
    { key: 'map', label: 'Map' },
  ];

  const drivers = users.filter((u) => u.role === 'driver');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">Admin dashboard</h1>
      </header>

      <div className="hidden sm:block border-b border-gray-200 bg-white">
        <nav className="mx-auto max-w-4xl flex gap-1 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === tab.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-xs font-medium text-center min-h-[44px] ${
              activeTab === tab.key ? 'text-green-700' : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className={`${activeTab === 'map' ? 'mx-0 max-w-none p-0' : 'mx-auto max-w-4xl px-4 py-6 pb-20 sm:pb-6'}`}>
        {error && activeTab !== 'map' && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

        {activeTab === 'map' && (
          <div className="h-[calc(100vh-128px)] sm:h-[calc(100vh-112px)] w-full">
            <Suspense fallback={
              <div className="flex h-full items-center justify-center bg-gray-100">
                <Spinner size="lg" label="Loading map..." />
              </div>
            }>
              <BusMap routeId="all" />
            </Suspense>
          </div>
        )}

        {activeTab === 'buses' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Buses</h2>
              <Button size="sm" onClick={() => setShowAddBus(true)}>Add bus</Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">Number</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Route</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Driver</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buses.map((bus) => {
                    return (
                      <tr key={bus.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{bus.bus_number}</td>
                        <td className="px-4 py-3">
                          <select
                            value={bus.route_id ?? ''}
                            onChange={(e) => handleAssignRoute(bus.id, e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 text-sm min-h-[36px]"
                          >
                            <option value="">None</option>
                            {routes.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {bus.driver_id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">
                                {drivers.find((d) => d.id === bus.driver_id)?.full_name ?? 'Assigned'}
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setAssigningBusId(bus.id)}
                              >
                                Change
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setAssigningBusId(bus.id)}
                            >
                              Assign driver
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={bus.is_active ? 'Active' : 'Inactive'}
                            color={bus.is_active ? 'green' : 'grey'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant={bus.is_active ? 'danger' : 'primary'}
                            onClick={() => handleToggleBusActive(bus)}
                          >
                            {bus.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-900">Registered drivers</h2>
            {drivers.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">No drivers registered yet.</p>
                <p className="text-sm text-gray-400 mt-1">Drivers can sign up with the invite code, then appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-700">Serial code</th>
                      <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 font-medium text-gray-700">Assigned bus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {drivers.map((driver) => {
                      const assignedBus = buses.find((b) => b.driver_id === driver.id);
                      return (
                        <tr key={driver.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {driver.serial_code ? (
                              <Badge label={driver.serial_code} color="green" />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{driver.full_name ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{driver.email}</td>
                          <td className="px-4 py-3">
                            {assignedBus ? (
                              <Badge label={assignedBus.bus_number} color="green" />
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-900">Routes</h2>
            <p className="text-sm text-gray-500">
              Adding or deleting routes must be done via the Supabase dashboard or a database migration.
            </p>
            {routes.map((route) => (
              <div
                key={route.id}
                className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: route.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{route.name}</p>
                    <p className="text-xs text-gray-500">{route.stops.length} stops</p>
                  </div>
                </div>
                <Badge label={route.description ?? ''} color="grey" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stops' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-900">Stops</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Lat</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Lng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routes.flatMap((r) => r.stops).map((stop) => (
                    <tr key={stop.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{stop.name}</td>
                      <td className="px-4 py-3 text-gray-600">{stop.lat.toFixed(4)}</td>
                      <td className="px-4 py-3 text-gray-600">{stop.lng.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-900">Users</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Role</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{user.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={user.role}
                          color={
                            user.role === 'admin'
                              ? 'amber'
                              : user.role === 'driver'
                                ? 'green'
                                : 'grey'
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                          className="rounded border border-gray-300 px-2 py-1 text-sm min-h-[36px]"
                        >
                          <option value="student">Student</option>
                          <option value="driver">Driver</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal open={showAddBus} onClose={() => setShowAddBus(false)} title="Add bus">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-900">Bus number</label>
            <input
              value={newBusNumber}
              onChange={(e) => setNewBusNumber(e.target.value)}
              placeholder="e.g. DIU-04"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-900">Capacity</label>
            <input
              type="number"
              value={newBusCapacity}
              onChange={(e) => setNewBusCapacity(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-900">Route (optional)</label>
            <select
              value={newBusRouteId}
              onChange={(e) => setNewBusRouteId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
            >
              <option value="">None</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleAddBus} disabled={!newBusNumber.trim()}>
            Add bus
          </Button>
        </div>
      </Modal>

      {assigningBusId && (
        <DriverAssignModal
          open={!!assigningBusId}
          onClose={() => setAssigningBusId(null)}
          drivers={drivers}
          currentDriverId={buses.find((b) => b.id === assigningBusId)?.driver_id ?? null}
          onAssign={(driverId) => handleAssignDriver(assigningBusId, driverId)}
        />
      )}
    </div>
  );
}
