-- Create a public storage bucket named 'complaints'
insert into storage.buckets
  (id, name, public)
values
  ('complaints', 'complaints', true)
on conflict (id) do nothing;

-- Allow public access to view files in the 'complaints' bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'complaints' );

-- Allow authenticated users to upload files to the 'complaints' bucket
create policy "Allow Auth Uploads"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'complaints' );

-- Allow authenticated users to update their files (optional)
create policy "Allow Auth Updates"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'complaints' );

-- Allow authenticated users to delete their files (optional)
create policy "Allow Auth Deletes"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'complaints' );
