-- Allow public/anonymous users to upload files to the 'complaints' bucket
CREATE POLICY "Allow Anon Uploads"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK ( bucket_id = 'complaints' );
