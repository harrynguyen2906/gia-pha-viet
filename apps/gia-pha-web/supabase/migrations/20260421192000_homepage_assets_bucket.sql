-- Homepage editor storage bucket

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage-assets',
  'homepage-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read access for homepage assets" ON storage.objects;
CREATE POLICY "Public read access for homepage assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'homepage-assets');

DROP POLICY IF EXISTS "Service role write for homepage assets" ON storage.objects;
CREATE POLICY "Service role write for homepage assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'homepage-assets'
  AND (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Service role update for homepage assets" ON storage.objects;
CREATE POLICY "Service role update for homepage assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'homepage-assets'
  AND (auth.role() = 'service_role')
)
WITH CHECK (
  bucket_id = 'homepage-assets'
  AND (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Service role delete for homepage assets" ON storage.objects;
CREATE POLICY "Service role delete for homepage assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'homepage-assets'
  AND (auth.role() = 'service_role')
);
