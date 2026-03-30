-- Storage buckets + policies for workshop header images and speaker avatars

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'workshop-media') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('workshop-media', 'workshop-media', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'speaker-avatars') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('speaker-avatars', 'speaker-avatars', true);
  END IF;
END $$;

-- Make sure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Workshop images bucket policies
DROP POLICY IF EXISTS "Public read workshop-media" ON storage.objects;
DROP POLICY IF EXISTS "Public insert workshop-media" ON storage.objects;
DROP POLICY IF EXISTS "Public update workshop-media" ON storage.objects;
DROP POLICY IF EXISTS "Public delete workshop-media" ON storage.objects;

CREATE POLICY "Public read workshop-media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'workshop-media');

CREATE POLICY "Public insert workshop-media"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'workshop-media');

CREATE POLICY "Public update workshop-media"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'workshop-media')
  WITH CHECK (bucket_id = 'workshop-media');

CREATE POLICY "Public delete workshop-media"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'workshop-media');

-- Speaker avatar bucket policies
DROP POLICY IF EXISTS "Public read speaker-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public insert speaker-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public update speaker-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public delete speaker-avatars" ON storage.objects;

CREATE POLICY "Public read speaker-avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'speaker-avatars');

CREATE POLICY "Public insert speaker-avatars"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'speaker-avatars');

CREATE POLICY "Public update speaker-avatars"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'speaker-avatars')
  WITH CHECK (bucket_id = 'speaker-avatars');

CREATE POLICY "Public delete speaker-avatars"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'speaker-avatars');

