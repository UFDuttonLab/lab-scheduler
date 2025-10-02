-- Add active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN active boolean NOT NULL DEFAULT true;

-- Add index for performance on active column
CREATE INDEX idx_profiles_active ON public.profiles(active);