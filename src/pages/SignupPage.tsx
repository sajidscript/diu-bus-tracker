import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-4xl" role="img" aria-label="bus">🚌</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Join the DIU Bus Tracker community
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <SignupForm />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-green-600 hover:text-green-700"
          >
            Sign in
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
