-- -------------------------------------------------------------------------
-- ENABLE PUBLIC READ ACCESS FOR COMPLAINTS BUCKET
-- This allows anonymous visitors to view evidence photos on the tracker.
-- -------------------------------------------------------------------------

-- 1. Ensure the bucket exists and is public
UPDATE storage.buckets SET public = true WHERE id = 'complaints';

-- 2. Allow public access to read files
DROP POLICY IF EXISTS "Public Access - Complaints Bucket" ON storage.objects;
CREATE POLICY "Public Access - Complaints Bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'complaints');
