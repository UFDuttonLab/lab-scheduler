-- Drop the existing restrictive policy that prevents viewing deactivated users
DROP POLICY IF EXISTS "All users can view active profiles" ON profiles;

-- Create new policy allowing PI and managers to view all profiles (active and inactive)
CREATE POLICY "PI and managers can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['pi'::app_role, 'manager'::app_role])
);

-- Create new policy allowing regular users to view only active profiles
CREATE POLICY "Users can view active profiles"
ON profiles FOR SELECT
TO authenticated
USING (active = true);