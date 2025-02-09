/*
  # Simplify Photo Access Policies
  
  1. Changes
    - Remove all existing policies
    - Create separate, independent policies for each access type
    - No nested queries or complex conditions
  
  2. Security
    - Maintains data privacy
    - Simpler, more maintainable rules
*/

-- Drop existing policies explicitly
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

-- Create separate, simple policies for each access type
CREATE POLICY "access_own_photos" 
  ON photos FOR ALL 
  USING (auth.uid() = uploaded_by);

CREATE POLICY "access_public_photos" 
  ON photos FOR SELECT 
  USING (is_private = false);

CREATE POLICY "access_shared_photos" 
  ON photos FOR SELECT 
  USING (id IN (
    SELECT photo_id 
    FROM shared_access 
    WHERE user_id = auth.uid()
  ));

-- Create supporting indexes
CREATE INDEX IF NOT EXISTS idx_photos_privacy ON photos(is_private);
CREATE INDEX IF NOT EXISTS idx_photos_uploader ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_shared_access_lookup ON shared_access(photo_id, user_id);