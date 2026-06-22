import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROLE_DASHBOARDS } from '@/lib/types';
import type { Role } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import Spinner from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  roles: Role[];
}

export default function ProtectedRoute({
  children,
  roles,
}: ProtectedRouteProps): ReactNode {
  const { role, authLoading, session } = useAppStore();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role && !roles.includes(role)) {
    const dashboard = ROLE_DASHBOARDS[role] ?? '/login';
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
}
