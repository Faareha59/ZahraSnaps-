/*
  # Fix Photos Policy and Create Storage Bucket

  1. Changes
    - Fix infinite recursion in photos policy
    - Add storage bucket creation
  
  2. Security
    - Update RLS policies for photos table
    - Add storage bucket policies
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view public photos and their own private photos" ON photos;

-- Create a clearer, non-recursive policy
CREATE POLICY "Users can view photos"
  ON photos FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR NOT is_private
    OR EXISTS (
      SELECT 1 
      FROM shared_access sa 
      WHERE sa.photo_id = id 
      AND sa.user_id = auth.uid()
    )
  );

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('photos', 'photos')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'photos' 
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos' 
    AND owner = auth.uid()
  );