-- 001_schema.sql — All tables, indexes, and RLS policies
-- Idempotent: uses CREATE IF NOT EXISTS and DROP IF EXISTS

-- ── Extensions ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Helper function for RLS (SECURITY DEFINER to bypass RLS during lookup) ──
-- Uses auth.uid() directly so it works even when RLS policies are evaluated.
-- auth.uid() is never NULL inside a RLS policy context since the policy only
-- runs for authenticated calls; an anonymous call sees all rows (per anon policy)
-- or no rows (if no anon policy).  For admin checks we query profiles; the
-- SECURITY DEFINER set_path='' wrapper ensures this does not recurse.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Allow auth.uid() to be used in policies without a separate anon-policy.
-- anon users still get "SQL ERROR:  2026:  JWT expired" or "No JWT" in practice
-- because Supabase rejects anonymous calls that lack a valid JWT before RLS runs.

-- ── TABLE: profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  full_name  text,
  role       text NOT NULL CHECK (role IN ('student', 'driver', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- ── TABLE: routes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  color       text DEFAULT '#16a34a',
  polyline    jsonb NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── TABLE: stops ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stops (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  lat        float8 NOT NULL,
  lng        float8 NOT NULL,
  address    text,
  created_at timestamptz DEFAULT now()
);

-- ── TABLE: route_stops ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.route_stops (
  route_id    uuid REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_id     uuid REFERENCES public.stops(id) ON DELETE CASCADE,
  stop_order  integer NOT NULL,
  PRIMARY KEY (route_id, stop_id)
);

-- ── TABLE: buses ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.buses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number  text NOT NULL UNIQUE,
  capacity    integer DEFAULT 40,
  route_id    uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  driver_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ── TABLE: bus_locations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bus_locations (
  bus_id      uuid PRIMARY KEY REFERENCES public.buses(id) ON DELETE CASCADE,
  lat         float8 NOT NULL,
  lng         float8 NOT NULL,
  speed       float8 DEFAULT 0,
  heading     float8 DEFAULT 0,
  accuracy    float8,
  simulate    boolean DEFAULT false,
  updated_at  timestamptz DEFAULT now()
);

-- ── TABLE: bus_location_history ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bus_location_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id      uuid REFERENCES public.buses(id) ON DELETE CASCADE,
  lat         float8 NOT NULL,
  lng         float8 NOT NULL,
  speed       float8,
  recorded_at timestamptz DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_route_stops_route  ON public.route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_stop    ON public.route_stops(stop_id);
CREATE INDEX IF NOT EXISTS idx_buses_route         ON public.buses(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_driver        ON public.buses(driver_id);
CREATE INDEX IF NOT EXISTS idx_history_bus_time    ON public.bus_location_history(bus_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email      ON public.profiles(email);

-- ── Enable Row Level Security on ALL tables ────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_location_history ENABLE ROW LEVEL SECURITY;

-- ── RLS POLICIES ───────────────────────────────────────────────────

-- profiles
DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT USING (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_service_role_all" ON public.profiles
    FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- routes
DO $$ BEGIN
  CREATE POLICY "routes_select_authenticated" ON public.routes
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "routes_admin_all" ON public.routes
    FOR ALL USING (get_my_role() = 'admin')
    WITH CHECK (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- stops
DO $$ BEGIN
  CREATE POLICY "stops_select_authenticated" ON public.stops
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "stops_admin_all" ON public.stops
    FOR ALL USING (get_my_role() = 'admin')
    WITH CHECK (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- route_stops
DO $$ BEGIN
  CREATE POLICY "route_stops_select_authenticated" ON public.route_stops
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "route_stops_admin_all" ON public.route_stops
    FOR ALL USING (get_my_role() = 'admin')
    WITH CHECK (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- buses
DO $$ BEGIN
  CREATE POLICY "buses_select_active" ON public.buses
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "buses_admin_all" ON public.buses
    FOR ALL USING (get_my_role() = 'admin')
    WITH CHECK (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "buses_select_driver_own" ON public.buses
    FOR SELECT USING (driver_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- bus_locations
DO $$ BEGIN
  CREATE POLICY "bus_locations_select_authenticated" ON public.bus_locations
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bus_locations_admin_select" ON public.bus_locations
    FOR SELECT USING (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bus_locations_insert_own_bus" ON public.bus_locations
    FOR INSERT WITH CHECK (
      bus_id IN (SELECT id FROM public.buses WHERE driver_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bus_locations_update_own_bus" ON public.bus_locations
    FOR UPDATE USING (
      bus_id IN (SELECT id FROM public.buses WHERE driver_id = auth.uid())
    )
    WITH CHECK (
      bus_id IN (SELECT id FROM public.buses WHERE driver_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- bus_location_history
DO $$ BEGIN
  CREATE POLICY "history_admin_select" ON public.bus_location_history
    FOR SELECT USING (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "history_insert_own_bus" ON public.bus_location_history
    FOR INSERT WITH CHECK (
      bus_id IN (SELECT id FROM public.buses WHERE driver_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;