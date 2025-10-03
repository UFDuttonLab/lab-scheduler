-- Drop the existing restrictive policy that blocks all manual inserts
DROP POLICY "Only triggers can insert activity logs" ON activity_logs;

-- Create a new policy that allows login/logout tracking by users
CREATE POLICY "Allow login/logout tracking and trigger inserts"
ON activity_logs FOR INSERT
WITH CHECK (
  -- Allow users to log their own login/logout events
  (
    action_type IN ('login', 'logout') 
    AND user_id = auth.uid()
  )
  -- All other action types (create, update, delete) are handled by triggers
  -- and will fail this check, which is intentional for security
);