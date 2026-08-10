-- =====================================================================================
-- 2026-08-09  Stop a failed attempt from leaking the answer key one question at a time.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09.
--
-- Found by a final adversarial pass, and demonstrated end to end as an ordinary undergrad
-- with RLS enforced and no ability to read skill_quiz_answers:
--
--     probe "all a"  -> 14.29     probe "all b" -> 42.86     probe "all c" -> 42.86
--     attempt 4      -> 100.00, passed
--     recovered key exactly matched ground truth for all 7 questions
--
-- Every one of the 365 questions is single-answer with exactly four options, retakes are
-- unlimited by design, and the grader was returning per-question `was_correct` on a failed
-- attempt - which the UI helpfully rendered as ticks and crosses. Three sacrificial attempts
-- therefore recover the complete key by elimination, in about five minutes of clicking, and
-- the result is shareable. That defeats SAF-01, SAF-29 and SAF-39 as safety gates, which is
-- the whole reason this system exists.
--
-- The fix keeps unlimited retakes - Chris asked for those deliberately - and removes the
-- oracle instead. A failed attempt now returns the score and nothing more.
--
-- Everything else in the function is carried through unchanged: the DISTINCT ON that closed
-- the score-inflation exploit, the flat 80% pass rule with no critical veto, unknown-id
-- rejection, and keyless-question tolerance.
-- =====================================================================================


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
  -- "Unknown" means an id that is not an active question OF THIS SKILL. An active question
  -- of this skill that has no answer key yet is tolerated and simply not scored: rejecting
  -- those made the quiz permanently unsubmittable, because the client resends the same id
  -- on every retry and "reload and try again" could never clear it. The security property
  -- is unchanged - a foreign or invented id is still rejected outright.
  SELECT count(*)::int INTO v_unknown FROM (
    SELECT DISTINCT (e->>'question_id')::uuid AS qid
      FROM jsonb_array_elements(_answers) e
     WHERE jsonb_typeof(e) = 'object' AND (e->>'question_id') IS NOT NULL
  ) s WHERE NOT EXISTS (
        SELECT 1 FROM public.skill_quiz_questions q
         WHERE q.id = s.qid AND q.skill_id = _skill_id AND q.active);
  IF v_unknown > 0 THEN
    RAISE EXCEPTION 'That submission does not match the current quiz. Reload and try again.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_blank > 0 THEN
    RAISE EXCEPTION 'Answer every question before submitting (% left).', v_blank
      USING ERRCODE = 'check_violation';
  END IF;

  v_score  := round(100.0 * v_ok / v_n, 2);
  -- Pass is the overall percentage ONLY. Critical questions are still identified, counted
  -- and recorded on every attempt so a PI can see who missed one, but they no longer carry
  -- an all-or-nothing veto. Chris's call on 2026-08-09, and it removes a sharp edge: with
  -- 5-7 questions per skill the old rule meant a single wrong answer on a critical question
  -- failed someone who had otherwise scored 86%, and one bad answer key would have locked a
  -- skill for the entire lab with no way through except a per-person PI waiver.
  v_passed := (v_score >= v_pass_pct);

  SELECT jsonb_agg(jsonb_build_object(
           'question_id', id, 'prompt', prompt, 'is_critical', is_critical,
           'chosen', to_jsonb(chosen), 'correct', to_jsonb(correct),
           'was_correct', ok, 'explanation', explanation) ORDER BY sort_order, id)
    INTO v_detail FROM _grade_scratch;

  -- What the examinee is allowed to see.
  --
  -- On a FAIL: the score, and nothing else. Per-question right/wrong used to be returned
  -- here, and an adversarial review proved that hands over the whole answer key: with four
  -- options and unlimited retakes, "all a, then all b, then all c, anything still unmarked
  -- is d" recovers a 7-question key in three failing attempts and passes on the fourth,
  -- with zero knowledge and no tooling beyond clicking. That was demonstrated end to end
  -- against RLS as an undergrad. Returning only an aggregate score drops the information
  -- leaked per attempt from one bit per question to roughly one bit total, which is what
  -- makes the gate mean anything.
  --
  -- On a PASS: everything - each question, what they chose, the right answer and the
  -- explanation. They have cleared the gate, so there is nothing left to protect and this
  -- is the moment the teaching actually lands.
  IF v_passed THEN
    SELECT jsonb_agg(jsonb_build_object(
             'question_id', id, 'prompt', prompt, 'is_critical', is_critical,
             'chosen', to_jsonb(chosen), 'was_correct', ok,
             'correct', to_jsonb(correct), 'explanation', explanation)
             ORDER BY sort_order, id)
      INTO v_public FROM _grade_scratch;
  ELSE
    v_public := '[]'::jsonb;
  END IF;

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


-- CREATE OR REPLACE preserves an existing function's ACL, so on the live database these are
-- no-ops - the lockdown already came from 20260809200000. They are here because this file
-- must also be correct when replayed onto a FRESH database, where the function would
-- otherwise be created with the default PUBLIC EXECUTE grant and the lockdown would silently
-- be missing.
REVOKE ALL ON FUNCTION public.grade_skill_quiz(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.grade_skill_quiz(uuid, jsonb) TO authenticated;
