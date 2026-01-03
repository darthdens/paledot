-- Add content columns to projects table for rich article-like content
ALTER TABLE public.projects
ADD COLUMN content_en text,
ADD COLUMN content_fr text;