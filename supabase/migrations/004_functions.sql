-- 004_functions.sql — Database functions and triggers

-- ── 1. handle_new_user() trigger ───────────────────────────────────
-- Fires on auth.users INSERT. Inserts matching profile row using
-- raw_user_meta_data for role and full_name.
-- This is the ONLY way roles are persisted.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role text;
BEGIN
  -- Whitelist: only student or driver can self-sign-up.
  -- Admin must be assigned manually in the database.
  v_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'role', ''),
    'student'
  );
  IF v_role NOT IN ('student', 'driver') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    v_role
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 2. upsert_bus_location() RPC ──────────────────────────────────
-- Drivers call this instead of writing directly to bus_locations.
-- Enforces driver-owns-bus at the DB level.
-- Also writes to bus_location_history and prunes old entries.

CREATE OR REPLACE FUNCTION public.upsert_bus_location(
  p_bus_id    uuid,
  p_lat       float8,
  p_lng       float8,
  p_speed     float8 DEFAULT 0,
  p_heading   float8 DEFAULT 0,
  p_accuracy  float8 DEFAULT NULL,
  p_simulate  boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_is_driver boolean;
  v_max_rows  integer := 500;
  v_count     integer;
BEGIN
  -- Verify the calling user is the assigned driver for this bus
  SELECT EXISTS (
    SELECT 1 FROM public.buses
    WHERE id = p_bus_id AND driver_id = auth.uid()
  ) INTO v_is_driver;

  IF NOT v_is_driver THEN
    RAISE EXCEPTION 'You are not the assigned driver for this bus.';
  END IF;

  -- Upsert bus_locations
  INSERT INTO public.bus_locations (bus_id, lat, lng, speed, heading, accuracy, simulate, updated_at)
  VALUES (p_bus_id, p_lat, p_lng, p_speed, p_heading, p_accuracy, p_simulate, now())
  ON CONFLICT (bus_id) DO UPDATE SET
    lat        = EXCLUDED.lat,
    lng        = EXCLUDED.lng,
    speed      = EXCLUDED.speed,
    heading    = EXCLUDED.heading,
    accuracy   = EXCLUDED.accuracy,
    simulate   = EXCLUDED.simulate,
    updated_at = EXCLUDED.updated_at;

  -- Insert into history
  INSERT INTO public.bus_location_history (bus_id, lat, lng, speed)
  VALUES (p_bus_id, p_lat, p_lng, p_speed);

  -- Prune old history entries (keep last 500 rows per bus)
  SELECT COUNT(*) INTO v_count
  FROM public.bus_location_history
  WHERE bus_id = p_bus_id;

  IF v_count > v_max_rows THEN
    DELETE FROM public.bus_location_history
    WHERE id IN (
      SELECT id FROM public.bus_location_history
      WHERE bus_id = p_bus_id
      ORDER BY recorded_at ASC
      LIMIT (v_count - v_max_rows)
    );
  END IF;
END;
$$;