-- Make user_id nullable in activity_logs to support ON DELETE SET NULL
ALTER TABLE public.activity_logs 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE public.activity_logs 
DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

-- Recreate the constraint with ON DELETE SET NULL
-- This preserves activity logs but sets user_id to NULL when a user is deleted
ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;