-- =====================================================================================
-- 2026-08-22  Recruiting: a submission path that works without an edge function.
--
-- STATUS: APPLIED LIVE 2026-08-22. Verified end to end against production: the exact
-- payload the built page produces was submitted through this function, the row and
-- both ranked choices landed, policy_check_score was graded server-side to 4, a
-- second submission from the same address came back as a duplicate, and the test rows
-- were deleted afterwards.
--
-- WHY THIS EXISTS.
--
-- The specced path is #/join -> submit-application (edge function, verifies a Cloudflare
-- Turnstile token) -> recruiting_submit_application() (service_role only). That path is
-- correct and is still in the repo. It needs two things this project does not have yet: a
-- deployed edge function, and a Turnstile site key/secret pair.
--
-- Until both exist the form cannot accept anything, which is not an acceptable state for a
-- page that is supposed to be live. So this migration adds a SECOND door, chosen by a flag
-- on the cycle row:
--
--   recruiting_cycles.require_turnstile = false  ->  #/join calls
--       recruiting_submit_application_public() directly with the publishable key.
--       No edge function, no secrets, works the moment the site is deployed.
--
--   recruiting_cycles.require_turnstile = true   ->  this function REFUSES every call and
--       #/join switches to the edge function. One flag, enforced in the database, so the
--       client cannot pick the weaker door once the stronger one is configured.
--
-- WHAT IS GIVEN UP WHILE THE FLAG IS FALSE: there is no CAPTCHA. `anon` can call this
-- function with the publishable key, which is in every visitor's bundle. That is a real
-- exposure and it is deliberate, with the PI's agreement. What stands in for a CAPTCHA:
--
--   1. one application per ufl.edu address per cycle (the unique index, unchanged);
--   2. a honeypot field that real browsers leave empty;
--   3. a minimum time-on-form, because the four-step form cannot be filled honestly in
--      seconds;
--   4. a per-cycle hourly throughput cap, so a script cannot fill the table overnight.
--
-- None of those defeat a determined attacker. They defeat a drive-by bot, and they bound
-- the damage to something a PI can spot and delete. Turn the flag on as soon as Turnstile
-- exists; RECRUITING.md has the two commands.
--
-- Rollback: supabase/rollback/20260822130000_recruiting_direct_submit_down.sql
-- =====================================================================================


-- 1. The switch, and the tunable cap --------------------------------------------------

ALTER TABLE public.recruiting_cycles
  ADD COLUMN IF NOT EXISTS require_turnstile boolean NOT NULL DEFAULT false;

ALTER TABLE public.recruiting_cycles
  ADD COLUMN IF NOT EXISTS max_submissions_per_hour int2 NOT NULL DEFAULT 40;

DO $$ BEGIN
  ALTER TABLE public.recruiting_cycles
    ADD CONSTRAINT recruiting_cycles_rate_ck CHECK (max_submissions_per_hour BETWEEN 1 AND 500);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.recruiting_cycles.require_turnstile IS
  'true = recruiting_submit_application_public() refuses everything and #/join must use the submit-application edge function. Set this the moment TURNSTILE_SECRET and VITE_TURNSTILE_SITE_KEY exist.';


-- 2. The public submission function ---------------------------------------------------
--
-- Returns jsonb rather than raising, because the form needs a field-level error map and a
-- raised exception reaches PostgREST as one opaque message. Shape:
--
--   { "ok": true,  "application_id": "..." }
--   { "ok": false, "error": "...", "fields": { "email": "...", "choices": "..." } }
--
-- SECURITY DEFINER, and it calls recruiting_submit_application() - which anon may NOT call
-- directly - from inside that definer context. So the single insert path is unchanged and
-- every CHECK constraint still applies; this function only decides who is allowed to reach
-- it and gives better answers when they are not.
--
-- No unqualified UPDATE or DELETE. Supabase preloads `safeupdate` into the authenticator
-- role and would reject one even here.

CREATE OR REPLACE FUNCTION public.recruiting_submit_application_public(_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_cycle       text;
  v_row         public.recruiting_cycles%ROWTYPE;
  v_fields      jsonb := '{}'::jsonb;
  v_app_id      uuid;
  v_recent      int;
  v_elapsed     numeric;
  v_email       text;
  v_statement   text;
  v_hours       int;
  v_block       int;
  v_semesters   int;
  v_choices     jsonb;
  v_n           int;
  v_ranks       int[];
  v_ids         text[];
BEGIN
  -- ---- which cycle, and is this door open at all -------------------------------------
  v_cycle := public.recruiting_open_cycle();
  IF v_cycle IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Applications are not open at the moment.');
  END IF;

  SELECT * INTO v_row FROM public.recruiting_cycles c WHERE c.cycle = v_cycle;

  IF v_row.require_turnstile THEN
    -- The stronger door is configured. Refuse rather than quietly accepting a submission
    -- that skipped the bot check.
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'This form needs to be reloaded before it can be submitted. Please refresh the page and try again.');
  END IF;

  -- ---- honeypot ------------------------------------------------------------------------
  -- A field that is visually hidden and aria-hidden, so no human and no screen reader ever
  -- fills it in. Anything that does is a form-filling bot. Answer with a plausible success
  -- and insert nothing: telling a bot it failed just invites a retry with the field removed.
  IF coalesce(btrim(_payload ->> 'website'), '') <> '' THEN
    RETURN jsonb_build_object('ok', true, 'application_id', gen_random_uuid());
  END IF;

  -- ---- time on form --------------------------------------------------------------------
  -- Four steps, a weekly availability grid and a written statement. Nobody completes that
  -- honestly in under 20 seconds. Client-supplied and therefore forgeable, which is why it
  -- is one of four checks rather than the only one.
  v_elapsed := nullif(_payload ->> 'elapsed_ms', '')::numeric;
  IF v_elapsed IS NULL OR v_elapsed < 20000 THEN
    RETURN jsonb_build_object('ok', false,
      'error', 'That was submitted faster than the form can be filled in. Please reload the page and try again.');
  END IF;

  -- ---- throughput cap ------------------------------------------------------------------
  SELECT count(*) INTO v_recent
    FROM public.recruiting_applications a
   WHERE a.cycle = v_cycle
     AND a.created_at > now() - interval '1 hour';

  IF v_recent >= v_row.max_submissions_per_hour THEN
    RETURN jsonb_build_object('ok', false,
      'error', 'We are getting an unusual number of applications right now. Please try again in a little while, or email '
               || v_row.pi_contact_email || '.');
  END IF;

  -- ---- field validation ------------------------------------------------------------------
  -- Deliberately the same rules, in the same order, as the TypeScript in
  -- supabase/functions/submit-application/index.ts. If you change one, change both.

  IF length(btrim(coalesce(_payload ->> 'full_name', ''))) NOT BETWEEN 2 AND 120 THEN
    v_fields := v_fields || jsonb_build_object('full_name', 'Please give your full name.');
  END IF;

  v_email := lower(btrim(coalesce(_payload ->> 'email', '')));
  IF v_email !~* '^[^@[:space:]]+@([a-z0-9-]+\.)*ufl\.edu$' THEN
    v_fields := v_fields || jsonb_build_object('email', 'Please use your UF email address, ending in ufl.edu.');
  END IF;

  IF coalesce(_payload ->> 'year', '') NOT IN ('freshman','sophomore','junior','senior','post-bacc') THEN
    v_fields := v_fields || jsonb_build_object('year', 'Please choose your year.');
  END IF;

  IF length(btrim(coalesce(_payload ->> 'major', ''))) NOT BETWEEN 2 AND 120 THEN
    v_fields := v_fields || jsonb_build_object('major', 'Please give your major.');
  END IF;

  IF length(btrim(coalesce(_payload ->> 'expected_graduation', ''))) NOT BETWEEN 4 AND 40 THEN
    v_fields := v_fields || jsonb_build_object('expected_graduation', 'Please give a term and year, for example "Spring 2028".');
  END IF;

  IF NOT (ARRAY(SELECT jsonb_array_elements_text(coalesce(_payload -> 'coursework', '[]'::jsonb)))
          <@ ARRAY['bsc2010','bsc2011','genetics','gen_chem_lab','organic_chem','statistics','microbiology','ecology']::text[]) THEN
    v_fields := v_fields || jsonb_build_object('coursework', 'Please choose from the listed courses.');
  END IF;

  IF coalesce(_payload ->> 'r_experience', '') NOT IN ('none','coursework','independent') THEN
    v_fields := v_fields || jsonb_build_object('r_experience', 'Please choose one.');
  END IF;

  v_hours := nullif(_payload ->> 'hours_available', '')::int;
  IF v_hours IS NULL OR v_hours NOT BETWEEN 1 AND 40 THEN
    v_fields := v_fields || jsonb_build_object('hours_available', 'Please give a number of hours between 1 and 40.');
  END IF;

  v_block := nullif(_payload ->> 'longest_block_hours', '')::int;
  IF v_block IS NULL OR v_block NOT BETWEEN 1 AND 12 THEN
    v_fields := v_fields || jsonb_build_object('longest_block_hours', 'Please give a block length between 1 and 12 hours.');
  ELSIF v_hours IS NOT NULL AND v_block > v_hours THEN
    v_fields := v_fields || jsonb_build_object('longest_block_hours', 'Your longest block cannot be longer than your weekly total.');
  END IF;

  IF NOT public.recruiting_availability_is_valid(coalesce(_payload -> 'availability', 'null'::jsonb)) THEN
    v_fields := v_fields || jsonb_build_object('availability', 'Please mark when you are free.');
  END IF;

  v_semesters := nullif(_payload ->> 'semesters_available', '')::int;
  IF v_semesters IS NULL OR v_semesters NOT BETWEEN 1 AND 8 THEN
    v_fields := v_fields || jsonb_build_object('semesters_available', 'Please give a number of semesters between 1 and 8.');
  END IF;

  IF coalesce(_payload ->> 'credit_type', '') NOT IN ('volunteer','course_credit','work_study','paid','any') THEN
    v_fields := v_fields || jsonb_build_object('credit_type', 'Please choose one.');
  END IF;

  IF jsonb_typeof(_payload -> 'animal_samples_ok')   <> 'boolean' THEN v_fields := v_fields || jsonb_build_object('animal_samples_ok',   'Please answer yes or no.'); END IF;
  IF jsonb_typeof(_payload -> 'field_local_ok')      <> 'boolean' THEN v_fields := v_fields || jsonb_build_object('field_local_ok',      'Please answer yes or no.'); END IF;
  IF jsonb_typeof(_payload -> 'field_intl_interest') <> 'boolean' THEN v_fields := v_fields || jsonb_build_object('field_intl_interest', 'Please answer yes or no.'); END IF;
  IF jsonb_typeof(_payload -> 'has_transportation')  <> 'boolean' THEN v_fields := v_fields || jsonb_build_object('has_transportation',  'Please answer yes or no.'); END IF;

  v_statement := btrim(coalesce(_payload ->> 'statement', ''));
  IF length(v_statement) = 0 THEN
    v_fields := v_fields || jsonb_build_object('statement', 'Please write a short statement.');
  ELSIF length(v_statement) > 1500 THEN
    v_fields := v_fields || jsonb_build_object('statement', 'Please keep this under 1500 characters.');
  END IF;

  -- ---- ranked choices --------------------------------------------------------------------
  v_choices := coalesce(_payload -> 'choices', '[]'::jsonb);
  v_n := jsonb_array_length(v_choices);
  IF v_n < 1 OR v_n > 3 THEN
    v_fields := v_fields || jsonb_build_object('choices', 'Please choose between one and three positions.');
  ELSE
    SELECT array_agg((c ->> 'rank')::int ORDER BY (c ->> 'rank')::int),
           array_agg(c ->> 'position_id')
      INTO v_ranks, v_ids
      FROM jsonb_array_elements(v_choices) AS c;

    IF array_length(ARRAY(SELECT DISTINCT unnest(v_ids)), 1) <> v_n THEN
      v_fields := v_fields || jsonb_build_object('choices', 'Each position can only be ranked once.');
    ELSIF v_ranks <> ARRAY(SELECT generate_series(1, v_n)) THEN
      v_fields := v_fields || jsonb_build_object('choices', 'Please rank your choices 1, 2, 3 with no gaps.');
    END IF;
  END IF;

  IF v_fields <> '{}'::jsonb THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Please check the highlighted answers.', 'fields', v_fields);
  END IF;

  -- ---- grade the policy questions ----------------------------------------------------------
  -- Graded here, against the cycle row, rather than trusting a score sent by the browser.
  -- Wrong answers do not block submission; the count is stored for the reviewer to see.

  -- ---- insert ------------------------------------------------------------------------------
  BEGIN
    v_app_id := public.recruiting_submit_application(
      _payload || jsonb_build_object('policy_check_score',
        (CASE WHEN (_payload #> '{policy_answers,min_hours}')::text     = to_jsonb(v_row.min_hours_per_week)::text THEN 1 ELSE 0 END)
      + (CASE WHEN (_payload #> '{policy_answers,min_semesters}')::text = to_jsonb(v_row.min_semesters)::text      THEN 1 ELSE 0 END)
      + (CASE WHEN (_payload #> '{policy_answers,trial_weeks}')::text   = to_jsonb(v_row.trial_weeks)::text        THEN 1 ELSE 0 END)
      + (CASE WHEN (_payload #> '{policy_answers,ehs_required}') = to_jsonb(true)                                  THEN 1 ELSE 0 END)
      ));
  EXCEPTION
    WHEN sqlstate '23505' THEN
      RETURN jsonb_build_object('ok', false, 'duplicate', true,
        'error', 'It looks like an application has already been submitted from this address for this cycle. '
                 || 'To change or add to it, email the lab PI at ' || v_row.pi_contact_email || '.');
    WHEN sqlstate '22023' THEN
      RETURN jsonb_build_object('ok', false,
        'error', 'One of the positions you chose is no longer open.',
        'fields', jsonb_build_object('choices', 'One of the positions you chose is no longer open. Please refresh and pick again.'));
    WHEN others THEN
      -- Log the detail server-side; return nothing about it. A CHECK violation message
      -- names columns and values, and section 7 forbids leaking application data through
      -- an error message.
      RAISE WARNING 'recruiting_submit_application_public failed: % (%)', SQLERRM, SQLSTATE;
      RETURN jsonb_build_object('ok', false,
        'error', 'Something went wrong saving your application. Please try again.');
  END;

  RETURN jsonb_build_object('ok', true, 'application_id', v_app_id);
END;
$fn$;


-- 3. Grants ---------------------------------------------------------------------------
--
-- This is the one function in the module an unauthenticated visitor may call. It is
-- deliberately the only new public surface: recruiting_submit_application() stays
-- service_role-only underneath it.

REVOKE ALL ON FUNCTION public.recruiting_submit_application_public(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recruiting_submit_application_public(jsonb) TO anon, authenticated, service_role;
