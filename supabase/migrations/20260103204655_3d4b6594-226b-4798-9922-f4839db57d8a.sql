-- Add gallery_images column to projects table
ALTER TABLE public.projects 
ADD COLUMN gallery_images text[] DEFAULT '{}'::text[];