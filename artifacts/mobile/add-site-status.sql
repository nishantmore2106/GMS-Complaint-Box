-- Add status column to sites table
ALTER TABLE sites ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- Ensure existing sites have 'active' status
UPDATE sites SET status = 'active' WHERE status IS NULL;
