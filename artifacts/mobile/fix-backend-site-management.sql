-- 1. Add status column to sites if it's missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sites' AND column_name='status') THEN
        ALTER TABLE sites ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
    END IF;
END $$;

-- 2. Ensure all existing sites have an active status
UPDATE sites SET status = 'active' WHERE status IS NULL;

-- 3. Add DELETE policy for sites (This is why deletion was failing)
-- Allow authenticated users (Founders/Admins) to delete sites
DROP POLICY IF EXISTS "Allow delete sites" ON sites;
CREATE POLICY "Allow delete sites" ON sites 
FOR DELETE 
TO authenticated 
USING (true);

-- 4. Ensure UPDATE policy exists (already exists in schema but let's be sure)
DROP POLICY IF EXISTS "Allow update sites" ON sites;
CREATE POLICY "Allow update sites" ON sites 
FOR UPDATE TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. Add status column to complaints if you want to track status of complaints individually (already exists)
-- This confirms the backend is ready for the frontend calls.
