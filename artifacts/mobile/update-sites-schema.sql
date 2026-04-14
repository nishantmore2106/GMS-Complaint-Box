-- Add metadata columns to sites table
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS authority_name TEXT;

-- Make client_id optional if we are using manual metadata
ALTER TABLE sites ALTER COLUMN client_id DROP NOT NULL;

-- Refresh PostgREST cache (run this in Supabase SQL Editor)
NOTIFY pgrst, 'reload schema';
