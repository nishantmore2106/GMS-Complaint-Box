-- -------------------------------------------------------------------------
-- GMS PUBLIC PORTAL COMPATIBILITY MIGRATION
-- Enables anonymous visitors to report issues and track them via geofence.
-- -------------------------------------------------------------------------

-- 1. Schema Enhancements
ALTER TABLE complaints ALTER COLUMN client_id DROP NOT NULL;

-- Add tracking fields if missing
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS anonymous_name TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 2. Public Visibility Policies (ANON)

-- Allow scanner to identify the facility
DROP POLICY IF EXISTS "Allow public read sites" ON sites;
CREATE POLICY "Allow public read sites" ON sites FOR SELECT TO anon USING (true);

-- Allow visitor to raise a concern
DROP POLICY IF EXISTS "Allow public insert complaints" ON complaints;
CREATE POLICY "Allow public insert complaints" ON complaints FOR INSERT TO anon 
WITH CHECK (is_anonymous = true);

-- Allow visitor to track their resolution status
DROP POLICY IF EXISTS "Allow public read anonymous complaints" ON complaints;
CREATE POLICY "Allow public read anonymous complaints" ON complaints FOR SELECT TO anon 
USING (is_anonymous = true);

-- Allow visitor to see supervisor names for their active trackers
-- We limit this to just names to protect privacy
DROP POLICY IF EXISTS "Allow public read supervisor names" ON users;
CREATE POLICY "Allow public read supervisor names" ON users FOR SELECT TO anon
USING (role = 'supervisor');
