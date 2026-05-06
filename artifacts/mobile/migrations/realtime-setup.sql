-- -------------------------------------------------------------------------
-- ENABLE REAL-TIME FOR COMPLAINTS
-- This allows the public portal and supervisor apps to receive live updates.
-- -------------------------------------------------------------------------

-- 1. Add complaints table to the realtime publication
-- If the publication doesn't exist, this might fail, but standard Supabase projects have it.
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;

-- 2. (Optional) Set replica identity to FULL if we need to see previous values in updates
-- For now, we only need the ID to trigger a refresh, so the default is fine.
-- ALTER TABLE complaints REPLICA IDENTITY FULL;
