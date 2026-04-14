-- Run this in your Supabase SQL Editor to refresh the schema cache
-- if you are getting "Could not find column" errors after a migration.

NOTIFY pgrst, 'reload schema';

-- Also ensure the status column exists just in case
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT FALSE NOT NULL;
