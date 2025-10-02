-- Fix profiles SELECT policy to prevent public access to emails
DROP POLICY IF EXISTS "Users can view own profile and PI can view all" ON public.profiles;

CREATE POLICY "Users can view own profile and PI can view all" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'pi'::app_role)
);