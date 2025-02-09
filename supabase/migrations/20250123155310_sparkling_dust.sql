/*
  # Fix Photo Access Policies
  
  1. Changes
    - Remove all existing policies
    - Create a single unified policy for SELECT
    - Separate policies for INSERT/UPDATE/DELETE
    - Fix column reference from photo_id to id
  
  2. Security
    - Maintains same access rules
    - Uses correct column references
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view photos" ON photos;
DROP POLICY IF EXISTS "Users can view public photos and their own private photos" ON photos;
DROP POLICY IF EXISTS "View own photos" ON photos;
DROP POLICY IF EXISTS "View public photos" ON photos;
DROP POLICY IF EXISTS "View shared photos" ON photos;
DROP POLICY IF EXISTS "Users can upload photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;
DROP POLICY IF EXISTS "access_own_photos" ON photos;
DROP POLICY IF EXISTS "access_public_photos" ON photos;
DROP POLICY IF EXISTS "access_shared_photos" ON photos;

-- Create a single unified SELECT policy
CREATE POLICY "unified_photo_access"
  ON photos FOR SELECT
  USING (
    uploaded_by = auth.uid() OR
    is_private = false OR
    id IN (
      SELECT photo_id
      FROM shared_access
      WHERE user_id = auth.uid()
    )
  );

-- Separate policies for modifications
CREATE POLICY "photos_insert"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "photos_update"
  ON photos FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "photos_delete"
  ON photos FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Create supporting indexes
CREATE INDEX IF NOT EXISTS idx_photos_privacy ON photos(is_private);
CREATE INDEX IF NOT EXISTS idx_photos_uploader ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_shared_access_lookup ON shared_access(photo_id, user_id);