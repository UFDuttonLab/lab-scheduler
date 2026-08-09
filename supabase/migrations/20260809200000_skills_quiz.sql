-- =====================================================================================
-- 2026-08-09  Skills module: post-reading quiz, graded server-side.
--
-- WHAT THIS IS. A trainee reads a skill's instructions, acknowledges them, then answers a
-- short multiple-choice quiz. Passing is required before anyone can sign them off on the
-- practical. Retakes are unlimited and every attempt is recorded, so the quiz is a learning
-- loop with an audit trail rather than a one-shot exam.
--
-- PASS RULE, as specified: every question tied to a critical checklist item must be right,
-- AND the overall score must be at least skills.quiz_pass_pct (default 80).
--
-- ---------------------------------------------------------------------------------------
-- THE ONE THING THAT MATTERS MOST IN THIS FILE
--
-- The answer key is NOT in a table trainees can read. If `is_correct` lived alongside the
-- options, any authenticated lab member could pull the whole key straight off the PostgREST
-- API with one request and the quiz would be decoration. So:
--
--   public.skill_quiz_questions   prompt + options, readable by anyone who can see the
--                                 module. Contains NO correctness information.
--   public.skill_quiz_answers     correct_keys + explanation. RLS restricts this to PI and
--                                 lab manager only. A trainee gets zero rows, and so does a
--                                 grad student or postdoc.
--
-- Grading therefore cannot happen in the browser. public.grade_skill_quiz() is
-- SECURITY DEFINER: it reads the key, scores the submission, writes the attempt, and
-- returns per-question feedback. It is the ONLY way a row reaches skill_quiz_attempts —
-- that table has no INSERT or UPDATE policy at all, for anyone. A score cannot be forged
-- by hand even by a PI.
--
-- Note the deliberate narrowing: the rest of the catalog is managed by five elevated roles
-- (pi, postdoc, grad_student, manager, pi_external), but the answer key and the question
-- bank are pi/manager only. Grad students and postdocs are people this quiz is meant to
-- assess; they must not be able to read what they are being assessed on.
--
-- ---------------------------------------------------------------------------------------
-- WHY QUIZ STATE IS DERIVED, NOT STORED ON user_skills
--
-- The obvious move is columns like user_skills.quiz_passed_at. That is a trap here.
-- Trainees hold an UPDATE policy on their own user_skills row (they need it to acknowledge
-- reading), so any new column there is writable by them unless protect_user_skill_columns()
-- freezes it — and if it freezes the column, it also reverts the write made by this
-- grading function, because inside the function auth.uid() is still the trainee and
-- pg_trigger_depth() is 1. The workaround would be a transaction-local escape flag, which
-- is one more thing that can be got wrong.
--
-- Instead: skill_quiz_attempts is append-only and unforgeable, and "has passed" is a query
-- against it. No new protected columns, no changes to protect_user_skill_columns(), and
-- the answer is always consistent with the ledger. This matches how skill_signoffs already
-- works. public.skill_quiz_status is a convenience view over the same ledger.
--
-- ---------------------------------------------------------------------------------------
-- BOOTSTRAP SAFETY — read before changing the gate
--
-- The gate fires ONLY when a skill actually has at least one active question. There are
-- currently zero questions in the database, so applying this migration changes nothing
-- about who can be signed off today. Drop the `v_has_quiz` condition and you instantly
-- block sign-off on all 53 skills. Questions become gating for a given skill the moment
-- the first one is added to it, and not before.
--
-- There is an escape hatch for the case where someone is already demonstrably competent:
-- skill_signoffs.quiz_waived, which only a PI or lab manager can set and which requires a
-- written reason. It is recorded on the sign-off, so a waiver is visible forever.
-- =====================================================================================


-- 1. Per-skill quiz configuration ------------------------------------------------------

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS quiz_pass_pct integer NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS quiz_version  integer NOT NULL DEFAULT 1;

DO $$ BEGIN
  ALTER TABLE public.skills ADD CONSTRAINT skills_quiz_pass_pct_ck
    CHECK (quiz_pass_pct BETWEEN 1 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.skill_signoffs
  ADD COLUMN IF NOT EXISTS quiz_waived boolean NOT NULL DEFAULT false;


-- 2. Option-shape validator ------------------------------------------------------------
-- IMMUTABLE so it can be used in a CHECK constraint. Options look like
--   [{"key":"a","text":"..."}, {"key":"b","text":"..."}]
-- Keys must be present, non-blank and unique within the question.

CREATE OR REPLACE FUNCTION public.skill_quiz_options_valid(_o jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(_o) = 'array'
     AND jsonb_array_length(_o) BETWEEN 2 AND 8
     AND NOT EXISTS (
           SELECT 1 FROM jsonb_array_elements(_o) e
            WHERE jsonb_typeof(e) <> 'object'
               OR coalesce(btrim(e->>'key'), '') = ''
               OR coalesce(btrim(e->>'text'), '') = '')
     AND (SELECT count(DISTINCT e->>'key') FROM jsonb_array_elements(_o) e)
         = jsonb_array_length(_o)
$$;


-- 3. Tables ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.skill_quiz_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id    uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL DEFAULT 0,
  prompt      text NOT NULL,
  options     jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Ties this question to the critical checklist items. A critical question must be
  -- answered correctly no matter what the overall percentage is.
  is_critical boolean NOT NULL DEFAULT false,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skill_quiz_questions_prompt_ck  CHECK (length(btrim(prompt)) > 0),
  CONSTRAINT skill_quiz_questions_options_ck CHECK (public.skill_quiz_options_valid(options))
);

CREATE INDEX IF NOT EXISTS skill_quiz_questions_skill_idx
  ON public.skill_quiz_questions (skill_id, sort_order);

-- The answer key. Separate table purely so RLS can lock it away from the people being
-- tested. explanation lives here too: shown after grading, never before.
CREATE TABLE IF NOT EXISTS public.skill_quiz_answers (
  question_id  uuid PRIMARY KEY REFERENCES public.skill_quiz_questions(id) ON DELETE CASCADE,
  correct_keys text[] NOT NULL,
  explanation  text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skill_quiz_answers_keys_ck CHECK (coalesce(array_length(correct_keys, 1), 0) >= 1)
);

-- Append-only ledger of every submission. No INSERT/UPDATE policy exists for any role;
-- only grade_skill_quiz() writes here.
CREATE TABLE IF NOT EXISTS public.skill_quiz_attempts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id           uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  attempt_no         integer NOT NULL,
  submitted_at       timestamptz NOT NULL DEFAULT now(),
  quiz_version       integer NOT NULL,
  pass_pct_required  integer NOT NULL,
  n_questions        integer NOT NULL,
  n_correct          integer NOT NULL,
  score_pct          numeric(5,2) NOT NULL,
  n_critical         integer NOT NULL,
  n_critical_correct integer NOT NULL,
  passed             boolean NOT NULL,
  -- Frozen snapshot of what was asked and answered, so a past attempt still reads
  -- correctly after the question bank is edited.
  answers            jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS skill_quiz_attempts_user_skill_idx
  ON public.skill_quiz_attempts (user_id, skill_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS skill_quiz_attempts_skill_idx
  ON public.skill_quiz_attempts (skill_id) WHERE passed;


-- 4. Integrity triggers ----------------------------------------------------------------

-- An answer key may only name options that exist on its question, and may not mark every
-- option correct. Runs on the key itself, and again when a question's options are edited,
-- so editing options cannot silently orphan a key.
CREATE OR REPLACE FUNCTION public.validate_quiz_answer_keys()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_opts jsonb; v_qid uuid; v_keys text[];
BEGIN
  IF TG_TABLE_NAME = 'skill_quiz_answers' THEN
    v_qid := NEW.question_id; v_keys := NEW.correct_keys;
    SELECT options INTO v_opts FROM public.skill_quiz_questions WHERE id = v_qid;
  ELSE
    v_qid := NEW.id; v_opts := NEW.options;
    SELECT correct_keys INTO v_keys FROM public.skill_quiz_answers WHERE question_id = v_qid;
    IF v_keys IS NULL THEN RETURN NEW; END IF;   -- key not written yet, nothing to check
  END IF;

  IF v_opts IS NULL THEN
    RAISE EXCEPTION 'No such quiz question.' USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM unnest(v_keys) k
              WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_opts) o
                                 WHERE o->>'key' = k)) THEN
    RAISE EXCEPTION 'The answer key names an option that does not exist on this question.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (SELECT count(DISTINCT k) FROM unnest(v_keys) k) >= jsonb_array_length(v_opts) THEN
    RAISE EXCEPTION 'Every option cannot be the correct answer.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_TABLE_NAME = 'skill_quiz_answers' THEN NEW.updated_at := now(); END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS validate_quiz_answer_keys_trg ON public.skill_quiz_answers;
CREATE TRIGGER validate_quiz_answer_keys_trg
  BEFORE INSERT OR UPDATE ON public.skill_quiz_answers
  FOR EACH ROW EXECUTE FUNCTION public.validate_quiz_answer_keys();

DROP TRIGGER IF EXISTS validate_quiz_options_against_key_trg ON public.skill_quiz_questions;
CREATE TRIGGER validate_quiz_options_against_key_trg
  BEFORE UPDATE OF options ON public.skill_quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.validate_quiz_answer_keys();

-- Editing the bank bumps skills.quiz_version, so the UI can tell someone their pass predates
-- the current questions. It is informational: a version bump does NOT revoke a pass, because
-- fixing one typo should not lock the whole lab out of sign-off.
CREATE OR REPLACE FUNCTION public.bump_skill_quiz_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_skill uuid;
BEGIN
  IF TG_TABLE_NAME = 'skill_quiz_questions' THEN
    v_skill := COALESCE(NEW.skill_id, OLD.skill_id);
  ELSE
    SELECT skill_id INTO v_skill FROM public.skill_quiz_questions
     WHERE id = COALESCE(NEW.question_id, OLD.question_id);
  END IF;
  IF v_skill IS NOT NULL THEN
    UPDATE public.skills SET quiz_version = quiz_version + 1, updated_at = now()
     WHERE id = v_skill;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS bump_quiz_version_q_trg ON public.skill_quiz_questions;
CREATE TRIGGER bump_quiz_version_q_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.bump_skill_quiz_version();

DROP TRIGGER IF EXISTS bump_quiz_version_a_trg ON public.skill_quiz_answers;
CREATE TRIGGER bump_quiz_version_a_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_quiz_answers
  FOR EACH ROW EXECUTE FUNCTION public.bump_skill_quiz_version();

CREATE OR REPLACE FUNCTION public.touch_quiz_question()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS touch_quiz_question_trg ON public.skill_quiz_questions;
CREATE TRIGGER touch_quiz_question_trg
  BEFORE UPDATE ON public.skill_quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_quiz_question();


-- 5. Row level security ----------------------------------------------------------------

ALTER TABLE public.skill_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_quiz_answers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_quiz_attempts  ENABLE ROW LEVEL SECURITY;

-- Questions: anyone who can see the module may read them (they have to, to take the quiz).
DROP POLICY IF EXISTS "Everyone can view quiz questions" ON public.skill_quiz_questions;
CREATE POLICY "Everyone can view quiz questions"
  ON public.skill_quiz_questions FOR SELECT TO authenticated
  USING (public.can_see_skills_module(auth.uid()));

-- ...but only PI/manager may write them. Narrower than the rest of the catalog on purpose.
DROP POLICY IF EXISTS "PI and managers can manage quiz questions" ON public.skill_quiz_questions;
CREATE POLICY "PI and managers can manage quiz questions"
  ON public.skill_quiz_questions FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
         AND public.can_see_skills_module(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
         AND public.can_see_skills_module(auth.uid()));

-- The answer key. One policy, PI/manager only. Everyone else gets zero rows on every verb.
-- Remember a FOR ALL policy also grants SELECT — that is intended and sufficient here.
DROP POLICY IF EXISTS "PI and managers can manage the answer key" ON public.skill_quiz_answers;
CREATE POLICY "PI and managers can manage the answer key"
  ON public.skill_quiz_answers FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
         AND public.can_see_skills_module(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
         AND public.can_see_skills_module(auth.uid()));

-- Attempts are grades. You see your own; PI and manager see everyone's. Unlike the skills
-- matrix, these are NOT public to the whole lab.
DROP POLICY IF EXISTS "See your own quiz attempts" ON public.skill_quiz_attempts;
CREATE POLICY "See your own quiz attempts"
  ON public.skill_quiz_attempts FOR SELECT TO authenticated
  USING (public.can_see_skills_module(auth.uid())
         AND (user_id = auth.uid()
              OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])));

-- Deliberately NO insert or update policy. grade_skill_quiz() is SECURITY DEFINER and is
-- the only writer. Deletion is left to the PI for cleanup, matching skill_signoffs.
DROP POLICY IF EXISTS "PI can delete quiz attempts" ON public.skill_quiz_attempts;
CREATE POLICY "PI can delete quiz attempts"
  ON public.skill_quiz_attempts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'pi'::app_role));


-- 5b. Table privileges -----------------------------------------------------------------
-- Supabase's default privileges usually grant these automatically, but spelling them out
-- means the security of this feature does not depend on a project-level setting.
--
-- Note what is NOT granted: INSERT and UPDATE on skill_quiz_attempts, to nobody. Combined
-- with the absence of an INSERT/UPDATE policy that is two independent barriers between a
-- user and a forged grade — remove either one and the other still holds.

GRANT SELECT                         ON public.skill_quiz_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE         ON public.skill_quiz_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_quiz_answers   TO authenticated;
GRANT SELECT, DELETE                 ON public.skill_quiz_attempts  TO authenticated;


-- 6. Grading ---------------------------------------------------------------------------
--
-- _answers is [{"question_id": uuid, "chosen": ["a"]}, ...] covering every active question.
-- Returns a summary plus per-question feedback including the right answer and the
-- explanation. Revealing the answer after submission is intentional: retakes are unlimited,
-- so the quiz is a teaching loop, and hiding the answer would only make it a guessing game.

CREATE OR REPLACE FUNCTION public.grade_skill_quiz(_skill_id uuid, _answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user     uuid := auth.uid();
  v_pass_pct integer;
  v_version  integer;
  v_n integer; v_ok integer; v_crit integer; v_critok integer; v_blank integer;
  v_score numeric(5,2); v_passed boolean; v_attempt integer;
  v_detail jsonb; v_id uuid;
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

  SELECT quiz_pass_pct, quiz_version INTO v_pass_pct, v_version
    FROM public.skills WHERE id = _skill_id AND active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That skill does not exist or is not active.' USING ERRCODE = 'check_violation';
  END IF;

  WITH given AS (
    SELECT (e->>'question_id')::uuid AS qid,
           COALESCE((SELECT array_agg(DISTINCT x ORDER BY x)
                       FROM jsonb_array_elements_text(e->'chosen') x), '{}'::text[]) AS chosen
      FROM jsonb_array_elements(_answers) e
     WHERE (e->>'question_id') IS NOT NULL
  ), q AS (
    SELECT qq.id, qq.prompt, qq.is_critical, qq.sort_order,
           (SELECT array_agg(DISTINCT k ORDER BY k) FROM unnest(a.correct_keys) k) AS correct,
           a.explanation
      FROM public.skill_quiz_questions qq
      JOIN public.skill_quiz_answers a ON a.question_id = qq.id
     WHERE qq.skill_id = _skill_id AND qq.active
  ), scored AS (
    SELECT q.*, COALESCE(g.chosen, '{}'::text[]) AS chosen,
           COALESCE(g.chosen, '{}'::text[]) = q.correct AS ok
      FROM q LEFT JOIN given g ON g.qid = q.id
  )
  SELECT count(*)::int,
         count(*) FILTER (WHERE ok)::int,
         count(*) FILTER (WHERE is_critical)::int,
         count(*) FILTER (WHERE is_critical AND ok)::int,
         count(*) FILTER (WHERE cardinality(chosen) = 0)::int,
         jsonb_agg(jsonb_build_object(
             'question_id', id, 'prompt', prompt, 'is_critical', is_critical,
             'chosen', to_jsonb(chosen), 'correct', to_jsonb(correct),
             'was_correct', ok, 'explanation', explanation) ORDER BY sort_order, id)
    INTO v_n, v_ok, v_crit, v_critok, v_blank, v_detail
    FROM scored;

  IF COALESCE(v_n, 0) = 0 THEN
    RAISE EXCEPTION 'This skill has no quiz questions yet.' USING ERRCODE = 'check_violation';
  END IF;
  IF v_blank > 0 THEN
    RAISE EXCEPTION 'Answer every question before submitting (% left).', v_blank
      USING ERRCODE = 'check_violation';
  END IF;

  v_score  := round(100.0 * v_ok / v_n, 2);
  v_passed := (v_critok = v_crit) AND (v_score >= v_pass_pct);

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
    'quiz_version', v_version, 'questions', v_detail);
END $$;

REVOKE ALL ON FUNCTION public.grade_skill_quiz(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.grade_skill_quiz(uuid, jsonb) TO authenticated;


-- 7. Convenience view over the ledger --------------------------------------------------
-- security_invoker so it inherits the attempts policy: your own rows, or everything if you
-- are PI/manager. Without that flag a view would run as its owner and leak every grade.

CREATE OR REPLACE VIEW public.skill_quiz_status
WITH (security_invoker = true) AS
  SELECT user_id,
         skill_id,
         count(*)::int                                        AS attempts,
         max(score_pct)                                       AS best_pct,
         bool_or(passed)                                      AS passed,
         min(submitted_at) FILTER (WHERE passed)              AS first_passed_at,
         max(submitted_at)                                    AS last_attempt_at,
         max(quiz_version) FILTER (WHERE passed)              AS passed_quiz_version
    FROM public.skill_quiz_attempts
   GROUP BY user_id, skill_id;

GRANT SELECT ON public.skill_quiz_status TO authenticated;


-- 8. The gate --------------------------------------------------------------------------
-- Replaces the function only; enforce_signoff_preconditions_trg is unchanged. The reading
-- check and the expiry calculation below are byte-for-byte the previous behaviour.

CREATE OR REPLACE FUNCTION public.enforce_signoff_preconditions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  -- Quiz gate. Only bites once the skill actually has questions — see BOOTSTRAP SAFETY.
  SELECT EXISTS (SELECT 1 FROM public.skill_quiz_questions q
                  WHERE q.skill_id = NEW.skill_id AND q.active)
    INTO v_has_quiz;

  IF v_has_quiz THEN
    IF NEW.quiz_waived THEN
      IF NOT public.can_grant_trainer(NEW.signed_by) THEN
        RAISE EXCEPTION 'Only a PI or lab manager can waive the quiz requirement.'
          USING ERRCODE = 'check_violation';
      END IF;
      IF coalesce(btrim(NEW.waiver_reason), '') = '' THEN
        RAISE EXCEPTION 'Waiving the quiz requires a written reason.'
          USING ERRCODE = 'check_violation';
      END IF;
    ELSE
      SELECT EXISTS (SELECT 1 FROM public.skill_quiz_attempts a
                      WHERE a.user_id = NEW.user_id AND a.skill_id = NEW.skill_id AND a.passed)
        INTO v_passed;
      IF NOT v_passed THEN
        RAISE EXCEPTION 'Cannot sign off: this person has not passed the quiz for this skill yet.'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  NEW.expires_at := CASE WHEN v_recert IS NULL THEN NULL
                         ELSE NEW.observed_at + (v_recert || ' months')::interval END;
  RETURN NEW;
END $$;
