import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 min-h-[44px] flex items-center transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
