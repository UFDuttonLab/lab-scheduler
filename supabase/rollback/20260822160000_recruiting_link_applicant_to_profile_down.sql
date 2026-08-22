-- Reverses 20260822160000_recruiting_link_applicant_to_profile.sql.
--
-- Dropping the column discards every application-to-account link. Export first if you
-- want to keep them:
--   \copy (SELECT id, full_name, email, profile_id FROM public.recruiting_applications
--          WHERE profile_id IS NOT NULL) TO 'applicant_links.csv' CSV HEADER

DROP TRIGGER IF EXISTS protect_recruiting_application_link_trg ON public.recruiting_applications;
DROP FUNCTION IF EXISTS public.protect_recruiting_application_link();

ALTER TABLE public.recruiting_applications DROP COLUMN IF EXISTS profile_id;

-- Restore the narrower column grant.
GRANT UPDATE (status) ON public.recruiting_applications TO authenticated;
