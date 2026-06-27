-- 005_driver_assignment.sql
-- Fix RLS so admin can update profiles, add serial_code, update trigger

-- 1. Add serial_code column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS serial_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_serial_code
  ON public.profiles(serial_code)
  WHERE serial_code IS NOT NULL;

-- 2. Backfill existing drivers with serial codes
DO $$
DECLARE
  driver_row RECORD;
  counter integer := 0;
BEGIN
  counter := 0;
  FOR driver_row IN
    SELECT id FROM public.profiles
    WHERE role = 'driver' AND serial_code IS NULL
    ORDER BY created_at ASC
  LOOP
    counter := counter + 1;
    UPDATE public.profiles
    SET serial_code = 'DRV-' || LPAD(counter::text, 3, '0')
    WHERE id = driver_row.id;
  END LOOP;
END $$;

-- 3. Fix profiles_update_own: remove role-locking WITH CHECK
--   Old: WITH CHECK (id = auth.uid() AND role = (SELECT role ...))
--   New: WITH CHECK (id = auth.uid())  — user can update own profile but NOT change role
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- 4. Add profiles_update_admin: admin can update ANY profile (including role changes)
DO $$ BEGIN
  CREATE POLICY profiles_update_admin ON public.profiles
    FOR UPDATE USING (get_my_role() = 'admin')
    WITH CHECK (get_my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Update handle_new_user() trigger: allow 'admin' role + auto-generate serial_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role text;
  v_serial text;
  v_count integer;
BEGIN
  v_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'role', ''),
    'student'
  );
  IF v_role NOT IN ('student', 'driver', 'admin') THEN
    v_role := 'student';
  END IF;

  IF v_role = 'driver' THEN
    SELECT COALESCE(MAX(
      CAST(NULLIF(REGEXP_REPLACE(serial_code, '^DRV-', ''), '') AS integer)
    ), 0) + 1 INTO v_count
    FROM public.profiles
    WHERE serial_code ~ '^DRV-\d{3}$';

    v_serial := 'DRV-' || LPAD(v_count::text, 3, '0');
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, serial_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    v_role,
    v_serial
  );
  RETURN NEW;
END;
$$;
