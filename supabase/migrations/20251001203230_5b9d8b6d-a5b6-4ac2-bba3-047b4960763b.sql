-- Add collaborators field to usage_records table
ALTER TABLE public.usage_records 
ADD COLUMN collaborators jsonb DEFAULT '[]'::jsonb;