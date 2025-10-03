-- Extend action_type enum to include login and logout
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'login';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'logout';

-- Update RLS policy on profiles to allow all authenticated users to view active profiles
DROP POLICY IF EXISTS "Users can view own profile and PI can view all" ON profiles;

CREATE POLICY "All users can view active profiles"
ON profiles FOR SELECT
USING (active = true);