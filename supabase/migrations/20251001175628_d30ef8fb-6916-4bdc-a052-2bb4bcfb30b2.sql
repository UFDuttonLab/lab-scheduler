-- Fix Profile Privacy: Users can only view their own profile, managers can view all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile and managers can view all" 
ON public.profiles
FOR SELECT 
USING (
  auth.uid() = id OR has_role(auth.uid(), 'manager'::app_role)
);

-- Fix Role Information Exposure: Users can only view their own roles, managers can view all
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles and managers can view all" 
ON public.user_roles
FOR SELECT 
USING (
  user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role)
);