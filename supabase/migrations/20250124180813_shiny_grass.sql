/*
  # Simplify Photo Access Policies

  This migration removes all complex policies and replaces them with simple,
  non-recursive policies for photo access.

  1. Changes
    - Remove all existing photo policies
    - Create basic CRUD policies without complex conditions
    - Add necessary indexes for performance

  2. Security
    - Maintains RLS
    - Users can only access their own photos and public photos
    - Users can only modify their own photos
*/

-- First, drop ALL existing policies on photos
DROP POLICY IF EXISTS "select_photos" ON photos;
DROP POLICY IF EXISTS "insert_photos" ON photos;
DROP POLICY IF EXISTS "update_photos" ON photos;
DROP POLICY IF EXISTS "delete_photos" ON photos;
DROP POLICY IF EXISTS "unified_photo_access" ON photos;
DROP POLICY IF EXISTS "photos_insert" ON photos;
DROP POLICY IF EXISTS "photos_update" ON photos;
DROP POLICY IF EXISTS "photos_delete" ON photos;
DROP POLICY IF EXISTS "access_own_photos" ON photos;
DROP POLICY IF EXISTS "access_public_photos" ON photos;
DROP POLICY IF EXISTS "access_shared_photos" ON photos;

-- Create basic, non-recursive policies
CREATE POLICY "view_own_photos"
  ON photos FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "view_public_photos"
  ON photos FOR SELECT
  USING (is_private = false);

CREATE POLICY "modify_own_photos"
  ON photos 
  FOR ALL
  USING (uploaded_by = auth.uid());

-- Create supporting indexes
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_is_private ON photos(is_private);