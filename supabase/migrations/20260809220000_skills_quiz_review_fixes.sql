-- =====================================================================================
-- 2026-08-09  Skills quiz: fixes from the QC / technical / code review pass.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09.
--
-- Two independent reviewers, working separately, found the same two defects. Both are
-- fixed here, along with the deadlock, the waiver hole and the privilege leftovers.
--
-- ---------------------------------------------------------------------------------------
-- FIX 1 (CRITICAL). Duplicate question_ids inflated the score.
--
-- `given` was built straight from jsonb_array_elements(_answers) with no de-duplication and
-- then LEFT JOINed to the question set, so repeating a question_id fanned out one row per
-- repeat and inflated BOTH numerator and denominator. Demonstrated end to end by both
-- reviewers: on a 5-question quiz, answering one question correctly twenty times and
-- getting the other four wrong returned
--     {"passed": true, "score_pct": 83.33, "n_questions": 24, "n_correct": 20}
-- against an honest score of 20%, and a PI then signed that person off as `competent`.
-- The critical-question rule inflated the same way.
--
-- Now: DISTINCT ON (qid) collapses repeats, and a submission naming a question that is not
-- in this skill's active set is rejected outright rather than silently ignored, so a
-- malformed or hostile payload fails loudly instead of scoring.
--
-- ---------------------------------------------------------------------------------------
-- FIX 2 (CRITICAL). The grading function handed the answer key to the examinee.
--
-- 20260809200000 went to some trouble to keep the key in a table trainees cannot read, and
-- then returned `correct` and `explanation` for every question in the RPC payload AND
-- persisted the same blob into skill_quiz_attempts.answers, which a trainee can SELECT
-- under their own-attempts policy. With unlimited retakes that is: attempt 1 harvests the
-- whole key, attempt 2 scores 100%. The table-level RLS was correct and irrelevant.
--
-- Now:
--   * FAILED attempt  -> the trainee learns only WHICH questions were wrong. That is enough
--                        to send them back to the right part of the reading, which is the
--                        point of unlimited retakes, without printing the answers.
--   * PASSED attempt  -> full review: correct answers and explanations for everything. They
--                        have already cleared the gate, so there is nothing left to protect
--                        and this is the moment the teaching actually lands.
--   * The full snapshot is still written to skill_quiz_attempts.answers for audit, but
--     SELECT on that column is revoked from authenticated at the column level. PI and
--     manager read it through get_quiz_attempt_detail(). Column privileges cannot tell a PI
--     from a trainee — they are the same database role — so the split has to be a function.
--
-- ---------------------------------------------------------------------------------------
-- FIX 3 (HIGH). A question with no answer key deadlocked its whole skill.
--
-- The gate asked "does this skill have an active question?" while the grader inner-joined
-- the answer key. A question inserted without its key therefore made grade_skill_quiz say
-- "this skill has no quiz questions yet" AND made every sign-off fail with "has not passed
-- the quiz yet" — unresolvable from the UI. Inserting a question before its key is the
-- natural authoring order, so this was one INSERT away at all times. The gate now counts
-- only keyed questions, so the two agree by construction.
--
-- ---------------------------------------------------------------------------------------
-- FIX 4 (HIGH). quiz_waived was unchecked on skills with no questions, and mutable after.
--
-- The authorization and reason checks sat inside `IF v_has_quiz THEN`, so on any skill with
-- no active questions anyone who could insert a sign-off could set quiz_waived = true with
-- no reason and no authority — planting an unauthorised waiver in a permanent audit record.
-- The checks now run unconditionally. The trigger also keyed authorization on
-- NEW.signed_by, a client-supplied column; it now uses auth.uid() and asserts they match.
-- Finally protect_signoff_columns() did not freeze quiz_waived or waiver_reason, so a
-- waiver could be stripped after the fact, leaving a row asserting a quiz pass that never
-- happened. Both columns are now immutable, like the rest of the record.
-- =====================================================================================


-- 1. Grading -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.grade_skill_quiz(_skill_id uuid, _answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user     uuid := auth.uid();
  v_pass_pct integer;
  v_version  integer;
  v_n integer; v_ok integer; v_crit integer; v_critok integer; v_blank integer;
  v_unknown integer;
  v_score numeric(5,2); v_passed boolean; v_attempt integer;
  v_detail jsonb; v_public jsonb; v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to take a quiz.' USING ERRCODE = '28000';
  END IF;
  IF NOT public.is_active_user(v_user) THEN
    RAISE EXCEPTION 'This account is not active.' USING ERRCODE = '28000';
  END IF;
  IF NOT public.can_see_skills_module(v_user) THEN
    RAISE EXCEPTION 'The skills module is not available to this account.' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_answers) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Answers must be submitted as an array.' USING ERRCODE = 'check_violation';
  END IF;
  IF jsonb_array_length(_answers) > 200 THEN
    RAISE EXCEPTION 'That submission is too large.' USING ERRCODE = 'check_violation';
  END IF;

  SELECT quiz_pass_pct, quiz_version INTO v_pass_pct, v_version
    FROM public.skills WHERE id = _skill_id AND active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That skill does not exist or is not active.' USING ERRCODE = 'check_violation';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _grade_scratch (
    id uuid, prompt text, is_critical boolean, sort_order integer,
    correct text[], explanation text, chosen text[], ok boolean
  ) ON COMMIT DROP;
  DELETE FROM _grade_scratch;

  -- DISTINCT ON collapses a repeated question_id to one row. Without it the LEFT JOIN below
  -- fans out and inflates the score — see FIX 1 in the header.
  WITH given AS (
    SELECT DISTINCT ON (qid) qid, chosen FROM (
      SELECT (e->>'question_id')::uuid AS qid,
             COALESCE((SELECT array_agg(DISTINCT x ORDER BY x)
                         FROM jsonb_array_elements_text(
                           CASE WHEN jsonb_typeof(e->'chosen') = 'array'
                                THEN e->'chosen' ELSE '[]'::jsonb END) x), '{}'::text[]) AS chosen
        FROM jsonb_array_elements(_answers) e
       WHERE jsonb_typeof(e) = 'object' AND (e->>'question_id') IS NOT NULL
    ) z ORDER BY qid
  ), q AS (
    SELECT qq.id, qq.prompt, qq.is_critical, qq.sort_order,
           (SELECT array_agg(DISTINCT k ORDER BY k) FROM unnest(a.correct_keys) k) AS correct,
           a.explanation
      FROM public.skill_quiz_questions qq
      JOIN public.skill_quiz_answers a ON a.question_id = qq.id
     WHERE qq.skill_id = _skill_id AND qq.active
  )
  INSERT INTO _grade_scratch
  SELECT q.id, q.prompt, q.is_critical, q.sort_order, q.correct, q.explanation,
         COALESCE(g.chosen, '{}'::text[]),
         COALESCE(g.chosen, '{}'::text[]) = q.correct
    FROM q LEFT JOIN given g ON g.qid = q.id;

  SELECT count(*)::int, count(*) FILTER (WHERE ok)::int,
         count(*) FILTER (WHERE is_critical)::int,
         count(*) FILTER (WHERE is_critical AND ok)::int,
         count(*) FILTER (WHERE cardinality(chosen) = 0)::int
    INTO v_n, v_ok, v_crit, v_critok, v_blank
    FROM _grade_scratch;

  IF COALESCE(v_n, 0) = 0 THEN
    RAISE EXCEPTION 'This skill has no quiz questions yet.' USING ERRCODE = 'check_violation';
  END IF;

  -- A submitted id that is not in the active keyed set is a malformed or hostile payload.
  -- Reject rather than ignore, so it can never be part of a scoring trick.
  SELECT count(*)::int INTO v_unknown FROM (
    SELECT DISTINCT (e->>'question_id')::uuid AS qid
      FROM jsonb_array_elements(_answers) e
     WHERE jsonb_typeof(e) = 'object' AND (e->>'question_id') IS NOT NULL
  ) s WHERE NOT EXISTS (SELECT 1 FROM _grade_scratch g WHERE g.id = s.qid);
  IF v_unknown > 0 THEN
    RAISE EXCEPTION 'That submission does not match the current quiz. Reload and try again.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_blank > 0 THEN
    RAISE EXCEPTION 'Answer every question before submitting (% left).', v_blank
      USING ERRCODE = 'check_violation';
  END IF;

  v_score  := round(100.0 * v_ok / v_n, 2);
  v_passed := (v_critok = v_crit) AND (v_score >= v_pass_pct);

  SELECT jsonb_agg(jsonb_build_object(
           'question_id', id, 'prompt', prompt, 'is_critical', is_critical,
           'chosen', to_jsonb(chosen), 'correct', to_jsonb(correct),
           'was_correct', ok, 'explanation', explanation) ORDER BY sort_order, id)
    INTO v_detail FROM _grade_scratch;

  -- What the examinee is allowed to see. On a fail: which ones were wrong, nothing more.
  SELECT jsonb_agg(jsonb_build_object(
           'question_id', id, 'prompt', prompt, 'is_critical', is_critical,
           'chosen', to_jsonb(chosen), 'was_correct', ok)
           || CASE WHEN v_passed
                   THEN jsonb_build_object('correct', to_jsonb(correct), 'explanation', explanation)
                   ELSE '{}'::jsonb END
           ORDER BY sort_order, id)
    INTO v_public FROM _grade_scratch;

  SELECT COALESCE(max(attempt_no), 0) + 1 INTO v_attempt
    FROM public.skill_quiz_attempts WHERE user_id = v_user AND skill_id = _skill_id;

  INSERT INTO public.skill_quiz_attempts
    (user_id, skill_id, attempt_no, quiz_version, pass_pct_required, n_questions, n_correct,
     score_pct, n_critical, n_critical_correct, passed, answers)
  VALUES
    (v_user, _skill_id, v_attempt, v_version, v_pass_pct, v_n, v_ok,
     v_score, v_crit, v_critok, v_passed, v_detail)
  RETURNING id INTO v_id;

  DELETE FROM _grade_scratch;

  RETURN jsonb_build_object(
    'attempt_id', v_id, 'attempt_no', v_attempt, 'passed', v_passed,
    'score_pct', v_score, 'pass_pct_required', v_pass_pct,
    'n_questions', v_n, 'n_correct', v_ok,
    'n_critical', v_crit, 'n_critical_correct', v_critok,
    'quiz_version', v_version, 'reveals_answers', v_passed, 'questions', v_public);
END $$;

REVOKE ALL ON FUNCTION public.grade_skill_quiz(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.grade_skill_quiz(uuid, jsonb) TO authenticated;


-- 2. The audit snapshot is PI/manager only -----------------------------------------------
-- Column-level privileges cannot distinguish a PI from a trainee, because both are the
-- `authenticated` database role. So: revoke the column from everyone, and hand it back
-- through a function that checks the app role.

-- NOTE: `REVOKE SELECT (answers)` alone does NOTHING here. A table-level SELECT grant already
-- covers every column, and a column-level revoke does not punch a hole in it — Postgres checks
-- the table privilege first and stops. Caught by the regression test, which read the answer key
-- straight out of the column after the revoke "succeeded". The table-level grant has to go, and
-- the allowed columns granted back explicitly. `answers` is simply absent from that list.
REVOKE SELECT ON public.skill_quiz_attempts FROM authenticated;
GRANT SELECT (id, user_id, skill_id, attempt_no, submitted_at, quiz_version, pass_pct_required,
              n_questions, n_correct, score_pct, n_critical, n_critical_correct, passed)
  ON public.skill_quiz_attempts TO authenticated;

CREATE OR REPLACE FUNCTION public.get_quiz_attempt_detail(_attempt_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
     OR NOT public.can_see_skills_module(auth.uid()) THEN
    RAISE EXCEPTION 'Only a PI or lab manager can review answer detail.' USING ERRCODE = '42501';
  END IF;
  SELECT answers INTO v FROM public.skill_quiz_attempts WHERE id = _attempt_id;
  RETURN COALESCE(v, '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.get_quiz_attempt_detail(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_quiz_attempt_detail(uuid) TO authenticated;


-- 3. Privilege leftovers -------------------------------------------------------------------
-- TRUNCATE ignores RLS entirely, and was still granted. Not reachable through PostgREST, but
-- it flatly contradicts "grade_skill_quiz is the only writer".

REVOKE TRUNCATE ON public.skill_quiz_questions FROM authenticated, anon, PUBLIC;
REVOKE TRUNCATE ON public.skill_quiz_answers   FROM authenticated, anon, PUBLIC;
REVOKE TRUNCATE ON public.skill_quiz_attempts  FROM authenticated, anon, PUBLIC;

-- The previous hardening file revoked the view from anon and PUBLIC but not authenticated,
-- repeating the very mistake it existed to correct.
REVOKE ALL ON public.skill_quiz_status FROM authenticated;
GRANT SELECT ON public.skill_quiz_status TO authenticated;


-- 4. Attempt numbering ---------------------------------------------------------------------
-- max(attempt_no)+1 then INSERT races: two concurrent submissions both become attempt 1.

CREATE UNIQUE INDEX IF NOT EXISTS skill_quiz_attempts_user_skill_no_uidx
  ON public.skill_quiz_attempts (user_id, skill_id, attempt_no);


-- 5. The pass mark must not be editable by the people being tested -------------------------
-- skills carries a FOR ALL policy for five elevated roles, which will include grad students
-- and postdocs the moment visible_to_all is flipped. quiz_pass_pct is now load-bearing for
-- sign-off integrity, so freeze it (and quiz_version) to PI/manager regardless of who may
-- otherwise edit the catalog. This deliberately does NOT change who can edit skills
-- generally — that is a policy call, not a bug fix.

CREATE OR REPLACE FUNCTION public.protect_skill_quiz_config()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]) THEN RETURN NEW; END IF;
  NEW.quiz_pass_pct := OLD.quiz_pass_pct;
  NEW.quiz_version  := OLD.quiz_version;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_skill_quiz_config_trg ON public.skills;
CREATE TRIGGER protect_skill_quiz_config_trg
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.protect_skill_quiz_config();


-- 6. Sign-off gate -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_signoff_preconditions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_recert integer; v_needs_reading boolean; v_acked boolean;
  v_has_quiz boolean; v_passed boolean;
BEGIN
  SELECT recert_months, requires_reading INTO v_recert, v_needs_reading
    FROM public.skills WHERE id = NEW.skill_id;

  IF v_needs_reading THEN
    SELECT reading_ack_at IS NOT NULL INTO v_acked FROM public.user_skills
      WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
    IF COALESCE(v_acked, false) = false THEN
      RAISE EXCEPTION 'Cannot sign off: this person has not acknowledged reading the instructions for this skill yet.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Waiver authorisation is checked ALWAYS, not only when a quiz exists. Keyed on auth.uid()
  -- rather than the client-supplied signed_by column.
  IF NEW.quiz_waived THEN
    IF NEW.signed_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'A sign-off must be recorded by the person making it.'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NOT public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]) THEN
      RAISE EXCEPTION 'Only a PI or lab manager can waive the quiz requirement.'
        USING ERRCODE = 'check_violation';
    END IF;
    IF coalesce(btrim(NEW.waiver_reason), '') = '' THEN
      RAISE EXCEPTION 'Waiving the quiz requires a written reason.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Count only KEYED questions, so this agrees with what grade_skill_quiz can actually
  -- score. Counting bare questions deadlocked the skill — see FIX 3 in the header.
  SELECT EXISTS (SELECT 1 FROM public.skill_quiz_questions q
                  JOIN public.skill_quiz_answers a ON a.question_id = q.id
                  WHERE q.skill_id = NEW.skill_id AND q.active)
    INTO v_has_quiz;

  IF v_has_quiz AND NOT NEW.quiz_waived THEN
    SELECT EXISTS (SELECT 1 FROM public.skill_quiz_attempts a
                    WHERE a.user_id = NEW.user_id AND a.skill_id = NEW.skill_id AND a.passed)
      INTO v_passed;
    IF NOT v_passed THEN
      RAISE EXCEPTION 'Cannot sign off: this person has not passed the quiz for this skill yet.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  NEW.expires_at := CASE WHEN v_recert IS NULL THEN NULL
                         ELSE NEW.observed_at + (v_recert || ' months')::interval END;
  RETURN NEW;
END $$;


-- 7. A waiver cannot be edited away after the fact ------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_signoff_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.skill_id IS DISTINCT FROM OLD.skill_id
     OR NEW.signed_by IS DISTINCT FROM OLD.signed_by OR NEW.stage_granted IS DISTINCT FROM OLD.stage_granted
     OR NEW.observed_at IS DISTINCT FROM OLD.observed_at
     OR NEW.checklist_results IS DISTINCT FROM OLD.checklist_results
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.quiz_waived IS DISTINCT FROM OLD.quiz_waived
     OR NEW.waiver_reason IS DISTINCT FROM OLD.waiver_reason
     OR NEW.prereqs_waived IS DISTINCT FROM OLD.prereqs_waived THEN
    RAISE EXCEPTION 'A sign-off record is immutable. Revoke it (set revoked_at and revoke_reason) and issue a new one.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;


-- 8. search_path on the CHECK-constraint helper ---------------------------------------------
ALTER FUNCTION public.skill_quiz_options_valid(jsonb) SET search_path = public, pg_temp;
