-- Create table for contact form submissions
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public contact form)
CREATE POLICY "Anyone can submit a contact message" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Only you can read messages (optional: add auth later for admin access)
CREATE POLICY "Messages are not publicly readable" 
ON public.contact_messages 
FOR SELECT 
USING (false);