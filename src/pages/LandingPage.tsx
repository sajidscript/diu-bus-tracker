import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-green-50">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="bus">🚌</span>
          <span className="text-lg font-bold text-gray-900">DIU Bus Tracker</span>
        </div>
        <nav className="flex gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white min-h-[44px] flex items-center transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 min-h-[44px] flex items-center transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Track your campus bus in real time
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Know exactly where your DIU campus bus is. Live GPS tracking,
            estimated arrival times, and route information — all from your phone.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="rounded-lg bg-green-600 px-8 py-3 text-base font-semibold text-white hover:bg-green-700 min-h-[48px] flex items-center justify-center transition-colors"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 min-h-[48px] flex items-center justify-center transition-colors"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-8 grid max-w-3xl gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">📍</div>
            <h3 className="font-semibold text-gray-900">Live tracking</h3>
            <p className="mt-1 text-sm text-gray-500">
              See bus positions updated in real time on the map.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">⏱️</div>
            <h3 className="font-semibold text-gray-900">ETA estimates</h3>
            <p className="mt-1 text-sm text-gray-500">
              Know when the bus will arrive at your stop.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">🚍</div>
            <h3 className="font-semibold text-gray-900">Multiple routes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Track all DIU campus bus routes at a glance.
            </p>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-sm text-gray-500">
        Daffodil International University — Campus Bus Tracking System
      </footer>
    </div>
  );
}
