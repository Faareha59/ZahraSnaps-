/*
  # Fix Photos Policy Recursion

  1. Changes
    - Simplify photos policy to prevent recursion
    - Remove complex joins that may cause recursion
  
  2. Security
    - Maintain security while simplifying policy logic
*/

-- Drop all existing policies on photos table to start fresh
DROP POLICY IF EXISTS "Users can view photos" ON photos;
DROP POLICY IF EXISTS "Users can view public photos and their own private photos" ON photos;

-- Create simplified policies that avoid recursion
CREATE POLICY "View own photos"
  ON photos FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "View public photos"
  ON photos FOR SELECT
  USING (NOT is_private);

CREATE POLICY "View shared photos"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM shared_access 
      WHERE shared_access.photo_id = photos.id 
      AND shared_access.user_id = auth.uid()
    )
  );