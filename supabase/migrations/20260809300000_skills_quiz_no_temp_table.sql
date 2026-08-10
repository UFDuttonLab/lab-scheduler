-- =====================================================================================
-- 2026-08-09  URGENT FIX: grading failed for every real user with
--             "DELETE requires a WHERE clause".
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09.
--
-- WHAT BROKE. Chris pressed Submit on a quiz and got `DELETE requires a WHERE clause`.
-- grade_skill_quiz used a temp table (`_grade_scratch`) so the scored set could be read
-- twice, and cleared it with two unqualified `DELETE FROM _grade_scratch;` statements.
--
-- Supabase preloads the **safeupdate** library into the `authenticator` role:
--
--   select rolname, setconfig from pg_db_role_setting s join pg_roles r on r.oid=s.setrole;
--   authenticator | {session_preload_libraries=safeupdate, statement_timeout=8s, ...}
--
-- authenticator is the role PostgREST connects as before it SETs ROLE to `authenticated`,
-- so safeupdate is in force for every statement that arrives through the REST API -
-- including statements inside a SECURITY DEFINER function. It rejects any DELETE or UPDATE
-- without a WHERE clause. The function was therefore guaranteed to fail for 100% of real
-- users, on the very first Submit.
--
-- WHY NO TEST CAUGHT IT, and this is the important part. Every automated check ran either
-- against a scratch Postgres 16 (no safeupdate) or through the Lovable connector, which
-- connects as an admin role that has no session_preload_libraries. The 48-case RLS probe,
-- the 20-case exploit suite and four rounds of adversarial review all executed the grader
-- successfully, because none of them ever crossed the one boundary that matters: the
-- PostgREST `authenticator` path. `safeupdate` does not appear in pg_extension either - it
-- is a preloaded library, not an extension - so an extension inventory does not reveal it.
--
-- This is the third time in this project that a scratch database differing from production
-- produced a false pass (the earlier two: missing ALTER DEFAULT PRIVILEGES, and a missing
-- protect_signoff_columns trigger). The lesson has now been paid for three times: a probe is
-- only worth what its fidelity to production is worth, and role-level settings are part of
-- production.
--
-- THE FIX. The temp table is gone entirely. Everything is computed in one CTE chain, so
-- there is no DELETE and no UPDATE anywhere in the function - nothing for safeupdate to
-- object to, under any role.
--
-- That also closes a separate finding from the adversarial pass: with a temp table and
-- pg_temp on the search_path, anyone holding direct Postgres credentials could pre-create
-- `_grade_scratch` with a BEFORE INSERT trigger and make the grader return
-- `passed: true` on wrong answers while dumping every correct answer and explanation. No
-- temp table, no hijack.
--
-- Behaviour is otherwise IDENTICAL and every earlier fix is carried through unchanged:
--   * DISTINCT ON (qid) de-duplication, which closed the score-inflation exploit
--   * flat 80% pass rule, no critical veto
--   * a FAILED attempt returns the score and nothing else; a PASS returns full detail
--   * unknown question ids rejected; keyless questions tolerated but not scored
--   * the full snapshot still written to skill_quiz_attempts.answers for PI review
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

  -- One statement, no scratch table. `given` de-duplicates repeated question_ids with
  -- DISTINCT ON - without that the LEFT JOIN below fans out and inflates the score, which
  -- was a live exploit (see 20260809220000).
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
  ), scored AS (
    SELECT q.id, q.prompt, q.is_critical, q.sort_order, q.correct, q.explanation,
           COALESCE(g.chosen, '{}'::text[]) AS chosen,
           COALESCE(g.chosen, '{}'::text[]) = q.correct AS ok
      FROM q LEFT JOIN given g ON g.qid = q.id
  ), unknown AS (
    -- "Unknown" = not an active question OF THIS SKILL. A question of this skill that has no
    -- answer key yet is tolerated and simply not scored; rejecting those once made a quiz
    -- permanently unsubmittable. A foreign or invented id is still rejected outright.
    SELECT count(*)::int AS n FROM (SELECT DISTINCT qid FROM given) s
     WHERE NOT EXISTS (SELECT 1 FROM public.skill_quiz_questions qq
                        WHERE qq.id = s.qid AND qq.skill_id = _skill_id AND qq.active)
  )
  SELECT count(*)::int,
         count(*) FILTER (WHERE ok)::int,
         count(*) FILTER (WHERE is_critical)::int,
         count(*) FILTER (WHERE is_critical AND ok)::int,
         count(*) FILTER (WHERE cardinality(chosen) = 0)::int,
         (SELECT n FROM unknown),
         jsonb_agg(jsonb_build_object(
             'question_id', id, 'prompt', prompt, 'is_critical', is_critical,
             'chosen', to_jsonb(chosen), 'correct', to_jsonb(correct),
             'was_correct', ok, 'explanation', explanation) ORDER BY sort_order, id)
    INTO v_n, v_ok, v_crit, v_critok, v_blank, v_unknown, v_detail
    FROM scored;

  IF COALESCE(v_n, 0) = 0 THEN
    RAISE EXCEPTION 'This skill has no quiz questions yet.' USING ERRCODE = 'check_violation';
  END IF;
  IF COALESCE(v_unknown, 0) > 0 THEN
    RAISE EXCEPTION 'That submission does not match the current quiz. Reload and try again.'
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_blank > 0 THEN
    RAISE EXCEPTION 'Answer every question before submitting (% left).', v_blank
      USING ERRCODE = 'check_violation';
  END IF;

  v_score  := round(100.0 * v_ok / v_n, 2);
  v_passed := (v_score >= v_pass_pct);

  -- A FAILED attempt returns the score and nothing else. Per-question right/wrong was an
  -- answer-key oracle: three sacrificial attempts recovered a whole key by elimination.
  -- A PASS returns everything, which is where the teaching lands.
  v_public := CASE WHEN v_passed THEN v_detail ELSE '[]'::jsonb END;

  SELECT COALESCE(max(attempt_no), 0) + 1 INTO v_attempt
    FROM public.skill_quiz_attempts WHERE user_id = v_user AND skill_id = _skill_id;

  INSERT INTO public.skill_quiz_attempts
    (user_id, skill_id, attempt_no, quiz_version, pass_pct_required, n_questions, n_correct,
     score_pct, n_critical, n_critical_correct, passed, answers)
  VALUES
    (v_user, _skill_id, v_attempt, v_version, v_pass_pct, v_n, v_ok,
     v_score, v_crit, v_critok, v_passed, v_detail)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'attempt_id', v_id, 'attempt_no', v_attempt, 'passed', v_passed,
    'score_pct', v_score, 'pass_pct_required', v_pass_pct,
    'n_questions', v_n, 'n_correct', v_ok,
    'n_critical', v_crit, 'n_critical_correct', v_critok,
    'quiz_version', v_version, 'reveals_answers', v_passed, 'questions', v_public);
END $$;

REVOKE ALL ON FUNCTION public.grade_skill_quiz(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.grade_skill_quiz(uuid, jsonb) TO authenticated;
