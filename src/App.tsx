import type { ReactNode } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Spinner from '@/components/ui/Spinner';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import StudentPage from '@/pages/StudentPage';
import DriverPage from '@/pages/DriverPage';
import AdminPage from '@/pages/AdminPage';
import NotFoundPage from '@/pages/NotFoundPage';

function AuthRedirect(): ReactNode {
  const { role, loading } = useAuth();
  const ROLE_DASHBOARDS: Record<string, string> = {
    student: '/student',
    driver: '/driver',
    admin: '/admin',
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-green-50">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (role && ROLE_DASHBOARDS[role]) {
    return <Navigate to={ROLE_DASHBOARDS[role]} replace />;
  }

  return <Navigate to="/login" replace />;
}

function ToastContainer(): ReactNode {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  const colorMap: Record<string, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${colorMap[toast.type] ?? 'bg-gray-800'}`}
          role="alert"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-white/80 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
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
      ))}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/dashboard',
    element: <AuthRedirect />,
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute roles={['student']}>
        <StudentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/driver',
    element: (
      <ProtectedRoute roles={['driver']}>
        <DriverPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['admin']}>
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default function App(): ReactNode {
  useAuth();

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
