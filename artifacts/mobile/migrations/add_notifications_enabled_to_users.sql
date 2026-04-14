-- Add notifications_enabled to public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- Update existing users to have it enabled by default
UPDATE public.users SET notifications_enabled = TRUE WHERE notifications_enabled IS NULL;

-- Enable Realtime for users table if not already (important for real-time toggle reflection)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
-- Note: If 'public.users' is already in the publication, the above might error depending on Postgres version.
-- You can instead use:
-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime FOR TABLE public.system_settings, public.app_issues, public.users;
