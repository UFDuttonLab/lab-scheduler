-- =====================================================================================
-- 2026-08-22  Recruiting: connect an accepted applicant to their lab account.
--
-- STATUS: TO APPLY.
--
-- WHY.
--
-- Until now an accepted applicant was a dead end: a row in recruiting_applications with no
-- relationship to anything else in the app. The person then appeared separately as a
-- profile created by hand in Settings, and nothing tied the two together. That defeats the
-- point of recruiting inside the scheduler rather than beside it.
--
-- With profile_id set, one join reaches everything the scheduler already tracks about that
-- person - bookings, usage_records, skill_signoffs, activity_logs - from the application
-- they arrived on. For example:
--
--   SELECT a.full_name, a.cycle, count(b.id) AS bookings_since
--     FROM public.recruiting_applications a
--     LEFT JOIN public.bookings b ON b.user_id = a.profile_id
--    WHERE a.status = 'accepted'
--    GROUP BY 1, 2;
--
-- WHO MAY SET IT.
--
-- PI only, enforced by a trigger rather than a policy, because a row-level policy cannot
-- see WHICH column an UPDATE touched. The column-level grant lets a reviewer write
-- `status`; the trigger stops them writing `profile_id` while they are at it.
--
-- Rollback: supabase/rollback/20260822160000_recruiting_link_applicant_to_profile_down.sql
-- =====================================================================================


-- 1. The link ----------------------------------------------------------------------------
--
-- ON DELETE SET NULL, not CASCADE: deactivating or removing someone's account must never
-- delete the record of their application.

ALTER TABLE public.recruiting_applications
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS recruiting_applications_profile_idx
  ON public.recruiting_applications (profile_id) WHERE profile_id IS NOT NULL;

COMMENT ON COLUMN public.recruiting_applications.profile_id IS
  'The lab account created for this applicant once accepted. Set by the PI from #/review. Join through this to reach their bookings, usage records and skill sign-offs.';


-- 2. Only the PI may write it --------------------------------------------------------------
--
-- auth.uid() IS NULL means there is no JWT at all, which for this table can only be a
-- direct database connection - the SQL editor or an admin connector. `anon` never reaches
-- this trigger because it holds no UPDATE grant on the table. Those connections are already
-- trusted, so they are allowed through rather than being locked out of their own database.

CREATE OR REPLACE FUNCTION public.protect_recruiting_application_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
BEGIN
  IF NEW.profile_id IS DISTINCT FROM OLD.profile_id
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'pi'::app_role) THEN
    RAISE EXCEPTION 'Only a PI can link an application to a lab account.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS protect_recruiting_application_link_trg ON public.recruiting_applications;
CREATE TRIGGER protect_recruiting_application_link_trg
  BEFORE UPDATE ON public.recruiting_applications
  FOR EACH ROW EXECUTE FUNCTION public.protect_recruiting_application_link();


-- 3. Grant the column ----------------------------------------------------------------------
--
-- Adds profile_id alongside the existing status grant. Everything else on this table stays
-- unwritable through PostgREST.

GRANT UPDATE (status, profile_id) ON public.recruiting_applications TO authenticated;
