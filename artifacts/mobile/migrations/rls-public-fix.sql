-- Allow public read access to sites (needed for QR scanner)
DROP POLICY IF EXISTS "Public can read sites" ON sites;
CREATE POLICY "Public can read sites" ON sites
  FOR SELECT TO anon, authenticated USING (true);

-- Allow public read access to complaints (needed for tracking links)
DROP POLICY IF EXISTS "Allow public read complaints" ON complaints;
CREATE POLICY "Allow public read complaints" ON complaints 
  FOR SELECT TO anon, authenticated USING (true);
