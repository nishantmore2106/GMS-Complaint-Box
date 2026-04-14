-- 1. Update sites table with geofencing coordinates
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS radius_meters integer DEFAULT 500;

-- 2. Update complaints table with anonymous fields
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS anonymous_name text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS floor text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS room_number text;

-- 3. Update RLS policies to allow anonymous inserts
-- We need to allow the 'anon' role to insert into complaints
-- Note: 'anon' role is used by the client for unauthenticated requests.

-- Allow anon to see minimal site info for validation
DROP POLICY IF EXISTS "anon_read_site_geo" ON public.sites;
CREATE POLICY "anon_read_site_geo" ON public.sites
  FOR SELECT TO anon
  USING (status = 'active');

-- Allow anon to insert complaints
DROP POLICY IF EXISTS "anon_insert_complaints" ON public.complaints;
CREATE POLICY "anon_insert_complaints" ON public.complaints
  FOR INSERT TO anon
  WITH CHECK (is_anonymous = true);

-- 4. Update existing sites with placeholder coords if needed (optional)
-- UPDATE public.sites SET latitude = 22.3072, longitude = 73.1812 WHERE latitude IS NULL; -- Vadodara default
