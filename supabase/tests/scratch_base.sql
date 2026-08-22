-- Scratch mirror of the production lab-scheduler database, restricted to what the
-- recruiting migrations touch. Built 2026-08-22 from live introspection, not from memory.
--
-- MIRRORED DELIBERATELY (each of these has produced a false pass in this project before):
--   * ALTER DEFAULT PRIVILEGES granting ALL on tables and EXECUTE on functions in public
--     to anon and authenticated, from BOTH the postgres and supabase_admin grantors.
--   * has_role / has_any_role / is_active_user requiring profiles.active = true.
--   * handle_updated_at, the shared updated_at trigger function.
--
-- CANNOT BE MIRRORED:
--   * `safeupdate`, preloaded into the authenticator role in production, which rejects an
--     unqualified UPDATE/DELETE arriving through PostgREST - including inside a SECURITY
--     DEFINER function. No test here can exercise it. Checked separately by grep.
--   * PostgreSQL version: production is 17.6, this is 16.13.
--
-- ADDED 2026-08-22 after it caused a false failure that turned out to be a REAL bug:
-- pgcrypto is installed in the `extensions` schema on this project, not `public`. A
-- SECURITY DEFINER function with `SET search_path = public` cannot see an unqualified
-- digest(). Mirror the schema, not just the extension.

-- Roles are cluster-wide, so a DROP DATABASE does not remove them.
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticator NOINHERIT LOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT anon, authenticated, service_role TO authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- auth.uid() stub: production reads the JWT claim. Here it reads a GUC the tests set.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE public.app_role AS ENUM
  ('pi','postdoc','grad_student','undergrad_student','manager','user','pi_external');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  spirit_animal text,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  icon text
);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id
                  WHERE ur.user_id = _user_id AND ur.role = _role AND p.active = true)
$function$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id
                  WHERE ur.user_id = _user_id AND ur.role = ANY(_roles) AND p.active = true)
$function$;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND active = true)
$function$;


-- RLS as production has it. Added 2026-08-22: without this, `projects`, `profiles` and
-- `user_roles` were wide open in scratch and a probe asserting "anon cannot read
-- public.projects" passed against a table that had no RLS to enforce it. The policies below
-- are copied from production, not invented.
ALTER TABLE public.projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view projects"
  ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only PI, Post-Docs, Grad Students, and External PIs can manage "
  ON public.projects FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::public.app_role[]));

CREATE POLICY "Users can view active profiles"
  ON public.profiles FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "PI and managers can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['pi','manager']::public.app_role[]));
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "PI and managers can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['pi','manager']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::public.app_role[]));

CREATE POLICY "Users can view own roles; PI and managers can view all"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::public.app_role[]));
CREATE POLICY "Only PI can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'pi'::public.app_role));

