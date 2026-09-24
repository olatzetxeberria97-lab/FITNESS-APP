/*
# Create avatars storage bucket

1. Storage
- Create a PUBLIC bucket 'avatars' for user profile photos.
- Users can upload, read, and delete their own avatar files (folder = user id).

2. Security
- INSERT: users can upload to their own folder (avatars/<uid>/...)
- SELECT: public read (anyone can view avatars since the bucket is public)
- DELETE: users can delete their own avatar files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "users_upload_own_avatar" ON storage.objects;
CREATE POLICY "users_upload_own_avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "users_delete_own_avatar" ON storage.objects;
CREATE POLICY "users_delete_own_avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
