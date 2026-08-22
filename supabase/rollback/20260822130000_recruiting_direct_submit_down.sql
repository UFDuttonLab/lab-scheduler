-- Reverses 20260822130000_recruiting_direct_submit.sql.
--
-- AFTER THIS RUNS, #/join CANNOT SUBMIT ANYTHING unless the submit-application edge
-- function is deployed and TURNSTILE_SECRET is set. Do not run it as a tidy-up.
--
-- The two columns are dropped last so that anything still reading require_turnstile fails
-- loudly rather than silently defaulting to "no Turnstile needed".

DROP FUNCTION IF EXISTS public.recruiting_submit_application_public(jsonb);

ALTER TABLE public.recruiting_cycles DROP CONSTRAINT IF EXISTS recruiting_cycles_rate_ck;
ALTER TABLE public.recruiting_cycles DROP COLUMN IF EXISTS max_submissions_per_hour;
ALTER TABLE public.recruiting_cycles DROP COLUMN IF EXISTS require_turnstile;
