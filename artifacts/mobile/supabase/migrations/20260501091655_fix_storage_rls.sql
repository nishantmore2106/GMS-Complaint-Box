CREATE POLICY "Allow Anon Uploads"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK ( bucket_id = 'complaints' );
