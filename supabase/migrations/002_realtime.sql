-- 002_realtime.sql — Enable Supabase Realtime on bus_locations only
-- Minimises bandwidth — students only need live bus positions.
-- Other tables are NOT added to realtime.

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;