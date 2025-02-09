/*
  # Fix Storage Access

  1. Changes
    - Ensure storage bucket exists
    - Set up proper storage policies
    - Enable public access for viewing photos
    - Allow authenticated users to upload

  2. Security
    - Maintain RLS for storage
    - Allow authenticated users to upload
    - Allow public access for viewing
*/

-- Ensure photos bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to start fresh
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Create simplified storage policies
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Authenticated Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Owner Access"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'photos'
    AND owner = auth.uid()
  );