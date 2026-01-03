-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Allow anyone to view files in the media bucket
CREATE POLICY "Media files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated admins to upload files
CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update their uploads
CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete media
CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);