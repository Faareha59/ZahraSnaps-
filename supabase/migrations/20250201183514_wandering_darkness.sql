/*
  # Add media type support
  
  1. Changes
    - Add media_type column to photos table
    - Set default value to 'image' for backward compatibility
    - Add check constraint to ensure valid media types
    
  2. Notes
    - Existing photos will be marked as 'image' type
    - New uploads can be either 'image' or 'video'
*/

-- Add media_type column with safe defaults
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS media_type text 
DEFAULT 'image' 
CHECK (media_type IN ('image', 'video'));

-- Update existing records to have media_type = 'image'
UPDATE photos 
SET media_type = 'image' 
WHERE media_type IS NULL;

-- Make media_type NOT NULL after setting defaults
ALTER TABLE photos 
ALTER COLUMN media_type SET NOT NULL;