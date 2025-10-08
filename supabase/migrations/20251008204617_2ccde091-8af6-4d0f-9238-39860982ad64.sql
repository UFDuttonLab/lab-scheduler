-- Drop the restrictive policy that prevents undergrads from seeing all bookings
DROP POLICY IF EXISTS "Users can view their own bookings or PI/Post-Docs/Grad Students" ON public.bookings;

-- Create new policy allowing all authenticated users to view all bookings
-- This is necessary so everyone can see the schedule and avoid conflicts
CREATE POLICY "All authenticated users can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (true);