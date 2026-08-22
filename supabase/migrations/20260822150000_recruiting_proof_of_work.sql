-- =====================================================================================
-- 2026-08-22  Recruiting: a proof-of-work gate on the public application form.
--
-- STATUS: TO APPLY.
--
-- WHY THIS AND NOT A CAPTCHA.
--
-- Cloudflare Turnstile is written and wired on both sides, and it is still the better
-- answer - see recruiting_cycles.require_turnstile. It needs a Cloudflare account, a
-- secret in Supabase, and a deployed edge function. This needs none of those, works the
-- moment the page deploys, and keeps working if the Turnstile config is ever wrong. The
-- PI asked for both.
--
-- WHAT IT ACTUALLY BUYS.
--
-- Not human verification - it cannot tell a person from a script. What it does is make
-- each submission cost measurable CPU. At 18 bits a browser does roughly a quarter of a
-- million SHA-256 hashes, about a second. One applicant will not notice it. Someone
-- filing ten thousand fake applications pays three hours of a core for the privilege, on
-- top of needing ten thousand distinct ufl.edu addresses and beating the hourly cap. That
-- turns "a script ruins the cycle overnight" into "a script is slow, obvious and capped".
--
-- HOW IT IS MADE UNFORGEABLE.
--
-- The challenge id is issued by the server, stored, and single-use. A client cannot mint
-- its own, cannot replay one, and cannot pre-compute before the cycle opens. The work is
-- over the id, so it is worthless for any other challenge.
--
-- Difficulty lives on the cycle row so it can be raised under attack with one UPDATE and
-- no rebuild.
--
-- Rollback: supabase/rollback/20260822150000_recruiting_proof_of_work_down.sql
-- =====================================================================================


-- 1. Difficulty, tunable without a deploy ----------------------------------------------
--
-- 0 disables the gate entirely - the escape hatch if it ever turns out to lock real
-- applicants out on slow phones.

ALTER TABLE public.recruiting_cycles
  ADD COLUMN IF NOT EXISTS pow_difficulty_bits int2 NOT NULL DEFAULT 18;

DO $$ BEGIN
  ALTER TABLE public.recruiting_cycles
    ADD CONSTRAINT recruiting_cycles_pow_ck CHECK (pow_difficulty_bits BETWEEN 0 AND 26);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.recruiting_cycles.pow_difficulty_bits IS
  'Leading zero bits required from the browser''s proof of work. 18 is about a second. 0 disables the gate. Raise it under attack; 26 is roughly a minute and is the ceiling.';


-- 2. Issued challenges -------------------------------------------------------------------
--
-- No RLS policies and no grants for anon or authenticated: this table is reachable only
-- through the two SECURITY DEFINER functions below. RLS is still enabled so that a future
-- accidental grant does not immediately become a read.

CREATE TABLE IF NOT EXISTS public.recruiting_pow_challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty_bits int2 NOT NULL,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  used_at         timestamptz
);

CREATE INDEX IF NOT EXISTS recruiting_pow_challenges_issued_idx
  ON public.recruiting_pow_challenges (issued_at);

ALTER TABLE public.recruiting_pow_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.recruiting_pow_challenges FROM PUBLIC, anon, authenticated;


-- 3. Issue ---------------------------------------------------------------------------------
--
-- Called by #/join when the applicant reaches the last step, so the work happens while
-- they are writing their statement and the wait is invisible.
--
-- Housekeeping is opportunistic and QUALIFIED - an unqualified DELETE would be rejected
-- outright by `safeupdate`, which Supabase preloads into the authenticator role.
--
-- Issuing is deliberately cheap and unthrottled. A flood of unsolved challenges costs one
-- narrow row each and is swept an hour later; throttling issuance would just move the
-- denial-of-service to the applicants.

CREATE OR REPLACE FUNCTION public.recruiting_issue_pow_challenge()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_bits int2;
  v_id   uuid;
BEGIN
  SELECT c.pow_difficulty_bits INTO v_bits
    FROM public.recruiting_cycles c
   WHERE c.cycle = public.recruiting_open_cycle();

  IF v_bits IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Applications are not open at the moment.');
  END IF;

  DELETE FROM public.recruiting_pow_challenges
   WHERE issued_at < now() - interval '1 hour';

  INSERT INTO public.recruiting_pow_challenges (difficulty_bits)
  VALUES (v_bits)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'challenge_id', v_id, 'difficulty_bits', v_bits);
END;
$fn$;


-- 4. Verify -----------------------------------------------------------------------------
--
-- True when sha256('<challenge id>:<nonce>') starts with difficulty_bits zero bits, the
-- challenge exists, is under an hour old, and has not been spent. Marks it spent on the
-- way through, so a solved challenge buys exactly one submission.
--
-- The bit check walks whole bytes first and then masks the remainder, so any difficulty
-- from 1 to 26 works rather than only multiples of eight.

CREATE OR REPLACE FUNCTION public.recruiting_verify_pow(_challenge_id uuid, _nonce text)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_bits    int2;
  v_digest  bytea;
  v_full    int;
  v_rest    int;
  v_i       int;
BEGIN
  IF _challenge_id IS NULL THEN RETURN false; END IF;

  -- Spend it and read its difficulty in one statement, so two submissions racing on the
  -- same challenge cannot both succeed: only one UPDATE finds used_at still NULL.
  UPDATE public.recruiting_pow_challenges c
     SET used_at = now()
   WHERE c.id = _challenge_id
     AND c.used_at IS NULL
     AND c.issued_at > now() - interval '1 hour'
  RETURNING c.difficulty_bits INTO v_bits;

  IF v_bits IS NULL THEN RETURN false; END IF;
  IF v_bits = 0 THEN RETURN true; END IF;

  -- extensions.digest, FULLY QUALIFIED. pgcrypto is installed in the `extensions` schema
  -- on this project, not `public`, and this function pins search_path to public - as every
  -- SECURITY DEFINER function here does, and should. An unqualified digest() therefore does
  -- not resolve and the whole submission errors out. Found by the probe on 2026-08-22, after
  -- the scratch database was corrected to install pgcrypto the same way production does.
  --
  -- If you ever rebuild against a database with pgcrypto in `public`, this raises a loud
  -- "function extensions.digest does not exist" rather than failing quietly. Fix it there.
  v_digest := extensions.digest(_challenge_id::text || ':' || coalesce(_nonce, ''), 'sha256');

  v_full := v_bits / 8;
  v_rest := v_bits % 8;

  FOR v_i IN 0 .. v_full - 1 LOOP
    IF get_byte(v_digest, v_i) <> 0 THEN RETURN false; END IF;
  END LOOP;

  IF v_rest > 0 THEN
    -- Top v_rest bits of the next byte must also be zero.
    IF (get_byte(v_digest, v_full) >> (8 - v_rest)) <> 0 THEN RETURN false; END IF;
  END IF;

  RETURN true;
END;
$fn$;


-- 5. Grants ---------------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.recruiting_issue_pow_challenge() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recruiting_issue_pow_challenge() TO anon, authenticated, service_role;

-- Verification is NOT granted to anon: it is called only from inside
-- recruiting_submit_application_public(), which runs as its owner. Exposing it directly
-- would let a caller burn challenges without submitting anything.
REVOKE ALL ON FUNCTION public.recruiting_verify_pow(uuid, text) FROM PUBLIC, anon, authenticated;


-- 6. Wire it into the public submission ---------------------------------------------------
--
-- The check goes LAST, immediately before the insert, and that ordering is deliberate:
-- verifying spends the challenge, so checking it earlier would burn the applicant's proof
-- on a typo'd email address and leave them unable to retry without reloading. Field errors
-- are cheap to return and reveal nothing, so a bot gains nothing from probing them.
--
-- When the cycle's difficulty is 0 the gate is skipped entirely rather than requiring a
-- challenge that will never be issued.
--
-- This is a CREATE OR REPLACE of the function from 20260822130000. Everything above the
-- proof-of-work block is unchanged; keep the two in step.

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
  v_cycle := public.recruiting_open_cycle();
  IF v_cycle IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Applications are not open at the moment.');
  END IF;

  SELECT * INTO v_row FROM public.recruiting_cycles c WHERE c.cycle = v_cycle;

  IF v_row.require_turnstile THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'This form needs to be reloaded before it can be submitted. Please refresh the page and try again.');
  END IF;

  IF coalesce(btrim(_payload ->> 'website'), '') <> '' THEN
    RETURN jsonb_build_object('ok', true, 'application_id', gen_random_uuid());
  END IF;

  v_elapsed := nullif(_payload ->> 'elapsed_ms', '')::numeric;
  IF v_elapsed IS NULL OR v_elapsed < 20000 THEN
    RETURN jsonb_build_object('ok', false,
      'error', 'That was submitted faster than the form can be filled in. Please reload the page and try again.');
  END IF;

  SELECT count(*) INTO v_recent
    FROM public.recruiting_applications a
   WHERE a.cycle = v_cycle
     AND a.created_at > now() - interval '1 hour';

  IF v_recent >= v_row.max_submissions_per_hour THEN
    RETURN jsonb_build_object('ok', false,
      'error', 'We are getting an unusual number of applications right now. Please try again in a little while, or email '
               || v_row.pi_contact_email || '.');
  END IF;

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

  -- Proof of work. Last, so a field error does not spend it.
  IF v_row.pow_difficulty_bits > 0 THEN
    IF NOT public.recruiting_verify_pow(
             nullif(_payload ->> 'pow_challenge_id', '')::uuid,
             _payload ->> 'pow_nonce') THEN
      RETURN jsonb_build_object('ok', false, 'retry_pow', true,
        'error', 'The check that you are a real browser did not complete. Please try submitting again.');
    END IF;
  END IF;

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
      RETURN jsonb_build_object('ok', false, 'duplicate', true, 'retry_pow', true,
        'error', 'It looks like an application has already been submitted from this address for this cycle. '
                 || 'To change or add to it, email the lab PI at ' || v_row.pi_contact_email || '.');
    WHEN sqlstate '22023' THEN
      RETURN jsonb_build_object('ok', false, 'retry_pow', true,
        'error', 'One of the positions you chose is no longer open.',
        'fields', jsonb_build_object('choices', 'One of the positions you chose is no longer open. Please refresh and pick again.'));
    WHEN others THEN
      RAISE WARNING 'recruiting_submit_application_public failed: % (%)', SQLERRM, SQLSTATE;
      RETURN jsonb_build_object('ok', false, 'retry_pow', true,
        'error', 'Something went wrong saving your application. Please try again.');
  END;

  RETURN jsonb_build_object('ok', true, 'application_id', v_app_id);
END;
$fn$;
