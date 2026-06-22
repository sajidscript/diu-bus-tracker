# DIU Bus Tracker

Real-time GPS tracking web application for Daffodil International University campus buses. Students see live bus positions on a map with ETA estimates; drivers share their GPS location; admins manage buses, routes, and users.

## Prerequisites

- Node.js 20+
- Supabase CLI (`npm install -g supabase`)
- Git

## Setup

1. `git clone <repo-url> && cd diu-bus-tracker`
2. `cp .env.example .env` — fill in your Supabase project URL, anon key, and invite code
3. `supabase login`
4. `supabase link --project-ref YOUR_PROJECT_REF`
5. `supabase db push` — runs all migrations in order (schema, realtime, seed data, functions)
6. `npm install`
7. `npm run dev`

## Demo workflow

1. Sign up as admin (any email + invite code from `VITE_INVITE_CODE`)
2. Go to `/admin` → assign a bus to yourself as driver
3. Sign up as driver, get assigned by admin
4. Open `/driver` → toggle "Simulate GPS" → click "Start sharing"
5. Open `/student` in another tab → watch the bus move in real time

## Architecture

React 18 + TypeScript frontend using Leaflet/OpenStreetMap for maps, Zustand for state, Supabase for auth/Postgres/realtime, React Router v6 for routing, and React Hook Form + Zod for validation. The only Supabase Realtime subscription is on `bus_locations` for minimal bandwidth. Drivers send GPS updates via an RPC (`upsert_bus_location`) which also writes to `bus_location_history` and enforces the driver-owns-bus constraint at the database level.

## Known limitations

- The invite code for driver/admin signup is stored as a plaintext environment variable (`VITE_INVITE_CODE`). This is a lightweight guard, not a cryptographic mechanism.
- GPS location sharing requires HTTPS on production. On localhost, browsers may allow insecure contexts for development.
- The Screen Wake Lock API may be denied on some browsers or insecure contexts. A warning is shown when this happens.
- Realtime subscriptions require the Supabase Realtime service to be enabled on the `bus_locations` table (handled by migration `002_realtime.sql`).

## Contributing

Pull requests are welcome. Please run `npm run lint` and `npm test` before submitting.

## License

MIT
