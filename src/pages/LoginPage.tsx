import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-4xl" role="img" aria-label="bus">🚌</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Sign in to DIU Bus Tracker
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your credentials to continue
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-green-600 hover:text-green-700"
          >
            Sign up
          </Link>
        </p>

        <p className="mt-2 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
