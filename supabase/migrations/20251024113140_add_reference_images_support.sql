/*
  # Add Reference Images Support

  ## Overview
  This migration adds support for storing reference images instead of just links.
  
  ## Changes
  1. Add new column `reference_images` (text[]) to store image URLs from Supabase Storage
  2. Keep `reference_links` for backward compatibility but it's now optional
  3. Create Supabase Storage bucket for reference images with public access
  4. Set up appropriate RLS policies for the storage bucket

  ## Notes
  - Images will be stored in Supabase Storage bucket 'reference-images'
  - The column stores an array of image URLs
  - Public access is enabled so images can be viewed without authentication
*/

-- Add reference_images column to store array of image URLs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'design_requests' AND column_name = 'reference_images'
  ) THEN
    ALTER TABLE design_requests ADD COLUMN reference_images text[];
  END IF;
END $$;

-- Create storage bucket for reference images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload images (public upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can upload reference images'
  ) THEN
    CREATE POLICY "Anyone can upload reference images"
      ON storage.objects
      FOR INSERT
      TO anon
      WITH CHECK (bucket_id = 'reference-images');
  END IF;
END $$;

-- Allow anyone to view images (public read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view reference images'
  ) THEN
    CREATE POLICY "Anyone can view reference images"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'reference-images');
  END IF;
END $$;

-- Allow authenticated users to delete images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete reference images'
  ) THEN
    CREATE POLICY "Authenticated users can delete reference images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'reference-images');
  END IF;
END $$;