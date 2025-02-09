-- Drop all existing policies on photos
DROP POLICY IF EXISTS "unified_photo_access" ON photos;
DROP POLICY IF EXISTS "photos_insert" ON photos;
DROP POLICY IF EXISTS "photos_update" ON photos;
DROP POLICY IF EXISTS "photos_delete" ON photos;
DROP POLICY IF EXISTS "access_own_photos" ON photos;
DROP POLICY IF EXISTS "access_public_photos" ON photos;
DROP POLICY IF EXISTS "access_shared_photos" ON photos;

-- Create simplified policies without recursion
CREATE POLICY "select_photos"
  ON photos FOR SELECT
  USING (
    -- User can see their own photos
    uploaded_by = auth.uid()
    OR
    -- User can see non-private photos
    (is_private = false)
    OR
    -- User can see photos shared with them
    EXISTS (
      SELECT 1
      FROM shared_access
      WHERE shared_access.photo_id = photos.id
      AND shared_access.user_id = auth.uid()
    )
  );

-- Simple policy for inserting photos
CREATE POLICY "insert_photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Simple policy for updating own photos
CREATE POLICY "update_photos"
  ON photos FOR UPDATE
  USING (auth.uid() = uploaded_by);

-- Simple policy for deleting own photos
CREATE POLICY "delete_photos"
  ON photos FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_photos_privacy ON photos(is_private);
CREATE INDEX IF NOT EXISTS idx_photos_uploader ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_shared_access_lookup ON shared_access(photo_id, user_id);