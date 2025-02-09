/*
  # Initial Schema Setup for Zahra's Photo Gallery

  1. New Tables
    - `folders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
      - `is_private` (boolean)
    
    - `photos`
      - `id` (uuid, primary key)
      - `url` (text)
      - `folder_id` (uuid, references folders)
      - `uploaded_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `description` (text)
      - `is_private` (boolean)
    
    - `shared_access`
      - `photo_id` (uuid, references photos)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create folders table
CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL,
  is_private boolean DEFAULT false
);

-- Create photos table
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  folder_id uuid REFERENCES folders,
  uploaded_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  description text,
  is_private boolean DEFAULT false
);

-- Create shared_access table
CREATE TABLE shared_access (
  photo_id uuid REFERENCES photos NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (photo_id, user_id)
);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;

-- Folders policies
CREATE POLICY "Users can view public folders"
  ON folders FOR SELECT
  USING (NOT is_private OR user_id = auth.uid());

CREATE POLICY "Users can create folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Photos policies
CREATE POLICY "Users can view public photos and their own private photos"
  ON photos FOR SELECT
  USING (
    NOT is_private 
    OR uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_access 
      WHERE photo_id = photos.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Shared access policies
CREATE POLICY "Users can view their shared access"
  ON shared_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Photo owners can manage sharing"
  ON shared_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM photos 
      WHERE id = shared_access.photo_id 
      AND uploaded_by = auth.uid()
    )
  );