-- First, remove the default value temporarily
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Drop all policies that depend on the old enum
DROP POLICY IF EXISTS "Only managers can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles and managers can view all" ON public.user_roles;
DROP POLICY IF EXISTS "Only managers can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Only managers can manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Only managers can manage equipment projects" ON public.equipment_projects;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Managers can delete any booking" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own profile and managers can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own usage records" ON public.usage_records;
DROP POLICY IF EXISTS "Users can delete own usage records" ON public.usage_records;

-- Drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Rename old enum
ALTER TYPE public.app_role RENAME TO app_role_old;

-- Create new enum with expanded roles
CREATE TYPE public.app_role AS ENUM ('pi', 'postdoc', 'grad_student', 'undergrad_student', 'manager', 'user');

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;

-- Set the new default
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Drop the old enum (now that nothing depends on it)
DROP TYPE public.app_role_old;

-- Recreate the has_role function with the new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create a new function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- Recreate all RLS policies with new role hierarchy
-- Equipment policies
CREATE POLICY "Only PI, Post-Docs, and Grad Students can manage equipment" ON public.equipment
FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['pi', 'postdoc', 'grad_student', 'manager']::app_role[]));

-- Projects policies
CREATE POLICY "Only PI, Post-Docs, and Grad Students can manage projects" ON public.projects
FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['pi', 'postdoc', 'grad_student', 'manager']::app_role[]));

-- Equipment Projects policies
CREATE POLICY "Only PI, Post-Docs, and Grad Students can manage equipment projects" ON public.equipment_projects
FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['pi', 'postdoc', 'grad_student', 'manager']::app_role[]));

-- User roles policies - Only PI can manage
CREATE POLICY "Only PI can manage roles" ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'pi'::app_role));

CREATE POLICY "Users can view own roles and PI can view all" ON public.user_roles
FOR SELECT
USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'pi'::app_role));

-- Profiles policies
CREATE POLICY "Users can view own profile and PI can view all" ON public.profiles
FOR SELECT
USING ((auth.uid() = id) OR public.has_role(auth.uid(), 'pi'::app_role));

-- Bookings policies
CREATE POLICY "PI can delete any booking" ON public.bookings
FOR DELETE
USING (public.has_role(auth.uid(), 'pi'::app_role));

CREATE POLICY "Users can update their own bookings or PI/Post-Docs/Grad Students can update any" ON public.bookings
FOR UPDATE
USING ((user_id = auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['pi', 'postdoc', 'grad_student', 'manager']::app_role[]));

CREATE POLICY "Users can view their own bookings or PI/Post-Docs/Grad Students can view all" ON public.bookings
FOR SELECT
USING ((user_id = auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['pi', 'postdoc', 'grad_student', 'manager']::app_role[]));

-- Usage records policies
CREATE POLICY "Users can view own usage records or PI/Post-Docs/Grad Students can view all" ON public.usage_records
FOR SELECT
USING ((user_id = auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['pi', 'postdoc', 'grad_student', 'manager']::app_role[]));

CREATE POLICY "Users can delete own usage records or PI can delete any" ON public.usage_records
FOR DELETE
USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'pi'::app_role));