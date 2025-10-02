-- Update RLS policies to check for active status

-- Drop old policy and create new one for bookings insert
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Active users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND active = true
  )
);

-- Update profiles SELECT policy to hide inactive users from non-admins
DROP POLICY IF EXISTS "Users can view own profile and PI can view all" ON public.profiles;
CREATE POLICY "Users can view own profile and PI can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'pi'::app_role)
  OR (active = true)
);