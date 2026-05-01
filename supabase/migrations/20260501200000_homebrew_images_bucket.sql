-- Create a public Supabase Storage bucket for homebrew artwork.
-- Images are served via a public CDN URL so anyone can view them.
-- Uploads are scoped to authenticated users; deletions are restricted
-- to the file owner (matched by the user-id path prefix).

INSERT INTO storage.buckets (id, name, public)
VALUES ('homebrew-images', 'homebrew-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone (including unauthenticated) can read public bucket objects
CREATE POLICY "Public read homebrew images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'homebrew-images');

-- Authenticated users may upload to this bucket
CREATE POLICY "Authenticated users can upload homebrew images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'homebrew-images');

-- Users may only delete their own files (path prefix = their auth UID)
CREATE POLICY "Users can delete their own homebrew images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'homebrew-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
