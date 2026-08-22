-- =====================================================================================
-- 2026-08-22  Undergraduate recruiting module: schema, helpers, grants.
--
-- STATUS: APPLIED LIVE 2026-08-22. Verified after the fact, not before: production's
-- columns, constraints, indexes, policies, table grants, column grants, function
-- privileges and RLS flags were fingerprinted and compared category by category
-- against a scratch database built from this file - all eight categories matched
-- exactly, and all five function bodies matched once comments and whitespace were
-- normalised. The scratch database is the one the 49-case probe in supabase/tests/
-- passes against, so that result carries over to production.
--
-- PURELY ADDITIVE AND INVISIBLE UNTIL A PI OPENS A CYCLE.
--   * Creates six new tables, three functions and one RPC. Touches no existing table, no
--     existing policy and no existing function.
--   * The only reference to an existing table is a nullable FK from recruiting_projects
--     to public.projects, and a mentor/reviewer FK to public.profiles. Neither changes
--     the referenced table.
--   * recruiting_cycles.active defaults to FALSE and the seeded positions are 'draft', so
--     applying this changes nothing a visitor or a signed-in user can see.
--
-- NAMING: every table carries a recruiting_ prefix. public.projects already exists as the
-- scheduler's project list (16 rows, name/description/color/icon), so the spec's bare
-- `projects` could not be created. The skills module set the precedent of prefixing all of
-- a module's tables (skill_*), and the same is done here for all six rather than only for
-- the one that collided - `positions` and `reviews` are names a later module would want.
--
-- Conventions follow 20260808010000_skills_module_schema.sql: sentence-case policy names
-- (RLS lives in the companion migration), SECURITY DEFINER helpers with
-- SET search_path = public, DROP ... IF EXISTS before every CREATE.
--
-- Rollback: supabase/rollback/20260822100000_recruiting_schema_down.sql
-- =====================================================================================


-- 0. Grant hygiene --------------------------------------------------------------------
--
-- READ THIS BEFORE ADDING A TABLE TO THIS MODULE.
--
-- This project carries ALTER DEFAULT PRIVILEGES entries (from both `postgres` and
-- `supabase_admin`) that grant arwdDxtm on every new table in `public` to anon AND
-- authenticated, and EXECUTE on every new function to both as well. Verified 2026-08-22
-- against pg_default_acl. So a new table is INSERT-able by an unauthenticated visitor the
-- moment it exists, and RLS is the only thing standing in the way.
--
-- The spec requires "no table grants insert to anon". Enabling RLS does not satisfy that -
-- the grant is still there. Every table below is therefore explicitly REVOKEd from anon
-- and authenticated and then granted back exactly what it needs. Same for the submit RPC.


-- 1. Cycles ---------------------------------------------------------------------------
--
-- One row per recruiting cycle. Holds the dates and the lab-wide policy numbers that the
-- #/join page states and the four policy-comprehension questions are graded against, so
-- the page copy and the answer key can never drift apart.
--
-- active is the public switch: while no row is active, #/join shows "the next cycle opens
-- ..." and the PI contact address instead of a form.

CREATE TABLE IF NOT EXISTS public.recruiting_cycles (
  cycle              text PRIMARY KEY,
  label              text        NOT NULL,
  opens_at           timestamptz NOT NULL,
  closes_at          timestamptz NOT NULL,
  active             boolean     NOT NULL DEFAULT false,
  min_hours_per_week int2        NOT NULL DEFAULT 6  CHECK (min_hours_per_week BETWEEN 1 AND 40),
  min_semesters      int2        NOT NULL DEFAULT 2  CHECK (min_semesters BETWEEN 1 AND 8),
  trial_weeks        int2        NOT NULL DEFAULT 4  CHECK (trial_weeks BETWEEN 1 AND 26),
  pi_contact_email   text        NOT NULL,
  intro_md           text,
  next_cycle_note    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recruiting_cycles_window_ck CHECK (closes_at > opens_at)
);

-- At most one active cycle. #/join reads "the" open cycle and a second one would make
-- which positions are public depend on row order.
CREATE UNIQUE INDEX IF NOT EXISTS recruiting_cycles_one_active_idx
  ON public.recruiting_cycles (active) WHERE active;

DROP TRIGGER IF EXISTS set_updated_at ON public.recruiting_cycles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recruiting_cycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 2. Projects -------------------------------------------------------------------------
--
-- The recruiting-facing description of a research project: one sentence a sophomore can
-- read. Deliberately separate from public.projects, which is the scheduler's booking
-- category list and whose names ("Disney Animal Kingdom", "Rhino Middens") are internal
-- shorthand. scheduler_project_id links the two where a match exists; it is nullable and
-- ON DELETE SET NULL so removing a scheduler project cannot break a live job listing.

CREATE TABLE IF NOT EXISTS public.recruiting_projects (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL UNIQUE,
  blurb                text NOT NULL CHECK (length(btrim(blurb)) BETWEEN 10 AND 400),
  active               boolean NOT NULL DEFAULT true,
  scheduler_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON public.recruiting_projects;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recruiting_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();



-- 3a. Text-array shape helper --------------------------------------------------------
--
-- A CHECK constraint may not contain a subquery, so the "no empty and no whitespace-only
-- entries" rule cannot be written inline. A function body may, and a CHECK may call a
-- function - so the rule lives here and both array columns call it.
--
-- coalesce(array_length(_a,1),0) because array_length('{}',1) is NULL and a CHECK that
-- evaluates to NULL PASSES; '{}' would otherwise satisfy "3 to 5".

CREATE OR REPLACE FUNCTION public.recruiting_text_array_ok(_a text[], _min int, _max int)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT _a IS NOT NULL
     AND coalesce(array_length(_a, 1), 0) BETWEEN _min AND _max
     AND array_position(_a, NULL) IS NULL
     AND NOT EXISTS (SELECT 1 FROM unnest(_a) AS t WHERE btrim(t) = '')
$$;


-- 3. Positions ------------------------------------------------------------------------
--
-- One row per advertised undergraduate role. mentor_id is the person who owns the listing
-- and reviews the applications ranked to it.
--
-- ON DELETE RESTRICT on both FKs: a listing must not lose its project or its owner while
-- applications point at it. A mentor leaving the lab is handled by reassigning mentor_id,
-- not by cascading a listing away.

CREATE TABLE IF NOT EXISTS public.recruiting_positions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES public.recruiting_projects(id) ON DELETE RESTRICT,
  mentor_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title            text NOT NULL CHECK (length(btrim(title)) BETWEEN 4 AND 120),
  description      text NOT NULL CHECK (length(btrim(description)) BETWEEN 20 AND 400),
  tasks            text[] NOT NULL,
  requirements     text[] NOT NULL,
  hours_per_week   int2 NOT NULL CHECK (hours_per_week BETWEEN 1 AND 40),
  min_block_hours  int2 NOT NULL DEFAULT 3 CHECK (min_block_hours BETWEEN 1 AND 12),
  semesters_needed int2 NOT NULL DEFAULT 2 CHECK (semesters_needed BETWEEN 1 AND 8),
  outcome          text NOT NULL CHECK (length(btrim(outcome)) BETWEEN 10 AND 400),
  max_mentees      int2 NOT NULL DEFAULT 2 CHECK (max_mentees BETWEEN 1 AND 20),
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','open','filled','closed')),
  cycle            text NOT NULL REFERENCES public.recruiting_cycles(cycle) ON UPDATE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT recruiting_positions_tasks_ck
    CHECK (public.recruiting_text_array_ok(tasks, 3, 5)),
  CONSTRAINT recruiting_positions_requirements_ck
    CHECK (public.recruiting_text_array_ok(requirements, 1, 8)),
  -- A minimum block longer than the weekly commitment is not satisfiable.
  CONSTRAINT recruiting_positions_block_ck CHECK (min_block_hours <= hours_per_week),
  -- Natural key for the idempotent seed, and it stops a mentor listing the same role
  -- twice in one cycle by accident.
  CONSTRAINT recruiting_positions_natural_key UNIQUE (cycle, mentor_id, title)
);

CREATE INDEX IF NOT EXISTS recruiting_positions_status_cycle_idx
  ON public.recruiting_positions (status, cycle);
CREATE INDEX IF NOT EXISTS recruiting_positions_mentor_idx
  ON public.recruiting_positions (mentor_id);
CREATE INDEX IF NOT EXISTS recruiting_positions_project_idx
  ON public.recruiting_positions (project_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.recruiting_positions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recruiting_positions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 4. Availability shape validator -----------------------------------------------------
--
-- applications.availability is written by an unauthenticated caller, so its shape is
-- checked in the database rather than trusted from the form. Accepted shape:
--
--   {"mon": [[9,12],[14,17]], "wed": [[13,17]]}
--
-- keys limited to mon..sun, values arrays of [startHour, endHour] with 0 <= start < end
-- <= 24. Missing days mean "not available". IMMUTABLE so it can be used in a CHECK.
--
-- The CASE is not decoration: jsonb_each() raises on a non-object, and SQL does not
-- guarantee AND short-circuits, so the type test has to gate evaluation rather than sit
-- beside it.

CREATE OR REPLACE FUNCTION public.recruiting_availability_is_valid(_a jsonb)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN _a IS NULL OR jsonb_typeof(_a) <> 'object' THEN false
    ELSE NOT EXISTS (
      SELECT 1
        FROM jsonb_each(_a) AS d(day, slots)
       WHERE d.day NOT IN ('mon','tue','wed','thu','fri','sat','sun')
          OR jsonb_typeof(d.slots) <> 'array'
    )
    AND NOT EXISTS (
      SELECT 1
        FROM jsonb_each(_a) AS d(day, slots)
       CROSS JOIN LATERAL jsonb_array_elements(
         CASE WHEN jsonb_typeof(d.slots) = 'array' THEN d.slots ELSE '[]'::jsonb END
       ) AS s(slot)
       WHERE jsonb_typeof(s.slot) <> 'array'
          OR jsonb_array_length(s.slot) <> 2
          OR jsonb_typeof(s.slot -> 0) <> 'number'
          OR jsonb_typeof(s.slot -> 1) <> 'number'
          OR (s.slot ->> 0)::numeric < 0
          OR (s.slot ->> 1)::numeric > 24
          OR (s.slot ->> 0)::numeric >= (s.slot ->> 1)::numeric
    )
  END
$$;


-- 5. Applications ---------------------------------------------------------------------
--
-- Section 7 of the spec: no GPA, no student ID, no date of birth, no transcript. Nothing
-- here collects any of them and nothing should be added later.
--
-- email: any host under ufl.edu, so smith@ufl.edu and smith@shands.ufl.edu both pass and
-- smith@ufl.edu.example.com does not. Anchored at both ends for that reason.

CREATE TABLE IF NOT EXISTS public.recruiting_applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle                text NOT NULL REFERENCES public.recruiting_cycles(cycle) ON UPDATE CASCADE,
  full_name            text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 120),
  email                text NOT NULL
                         CHECK (email ~* '^[^@[:space:]]+@([a-z0-9-]+\.)*ufl\.edu$'),
  year                 text NOT NULL
                         CHECK (year IN ('freshman','sophomore','junior','senior','post-bacc')),
  major                text NOT NULL CHECK (length(btrim(major)) BETWEEN 2 AND 120),
  expected_graduation  text NOT NULL CHECK (length(btrim(expected_graduation)) BETWEEN 4 AND 40),
  coursework           text[] NOT NULL
                         CHECK (coursework <@ ARRAY[
                           'bsc2010','bsc2011','genetics','gen_chem_lab',
                           'organic_chem','statistics','microbiology','ecology'
                         ]::text[]),
  r_experience         text NOT NULL
                         CHECK (r_experience IN ('none','coursework','independent')),
  prior_lab_experience text CHECK (prior_lab_experience IS NULL OR length(prior_lab_experience) <= 1000),
  hours_available      int2 NOT NULL CHECK (hours_available BETWEEN 1 AND 40),
  longest_block_hours  int2 NOT NULL CHECK (longest_block_hours BETWEEN 1 AND 12),
  availability         jsonb NOT NULL
                         CHECK (public.recruiting_availability_is_valid(availability)),
  semesters_available  int2 NOT NULL CHECK (semesters_available BETWEEN 1 AND 8),
  credit_type          text NOT NULL
                         CHECK (credit_type IN ('volunteer','course_credit','work_study','paid','any')),
  animal_samples_ok    boolean NOT NULL,
  field_local_ok       boolean NOT NULL,
  field_intl_interest  boolean NOT NULL,
  has_transportation   boolean NOT NULL,
  conflicts            text CHECK (conflicts IS NULL OR length(conflicts) <= 1000),
  prior_contact        text CHECK (prior_contact IS NULL OR length(prior_contact) <= 300),
  statement            text NOT NULL CHECK (length(statement) BETWEEN 1 AND 1500),
  policy_check_score   int2 NOT NULL CHECK (policy_check_score BETWEEN 0 AND 4),
  status               text NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new','in_review','interview','accepted','declined','withdrawn')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- The 409 in section 4.1 is enforced here, not by a SELECT-then-INSERT in the edge
-- function: two submissions racing would both pass a pre-check and both insert. Lowered
-- so Ada@ufl.edu cannot re-apply as ada@ufl.edu.
CREATE UNIQUE INDEX IF NOT EXISTS recruiting_applications_email_cycle_key
  ON public.recruiting_applications (lower(email), cycle);

CREATE INDEX IF NOT EXISTS recruiting_applications_cycle_status_idx
  ON public.recruiting_applications (cycle, status);

DROP TRIGGER IF EXISTS set_updated_at ON public.recruiting_applications;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recruiting_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 6. Ranked choices -------------------------------------------------------------------
--
-- PK (application_id, position_id) blocks the same position at two ranks; UNIQUE
-- (application_id, rank) blocks two positions at the same rank. Both are needed: neither
-- implies the other.

CREATE TABLE IF NOT EXISTS public.recruiting_application_positions (
  application_id uuid NOT NULL REFERENCES public.recruiting_applications(id) ON DELETE CASCADE,
  position_id    uuid NOT NULL REFERENCES public.recruiting_positions(id) ON DELETE RESTRICT,
  rank           int2 NOT NULL CHECK (rank BETWEEN 1 AND 3),
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id, position_id),
  CONSTRAINT recruiting_application_positions_rank_key UNIQUE (application_id, rank)
);

CREATE INDEX IF NOT EXISTS recruiting_application_positions_position_idx
  ON public.recruiting_application_positions (position_id);


-- 7. Reviews --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.recruiting_reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.recruiting_applications(id) ON DELETE CASCADE,
  reviewer_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score          int2 CHECK (score IS NULL OR score BETWEEN 1 AND 5),
  notes          text CHECK (notes IS NULL OR length(notes) <= 4000),
  decision       text CHECK (decision IS NULL OR decision IN ('advance','hold','decline')),
  interview_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recruiting_reviews_one_per_reviewer UNIQUE (application_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS recruiting_reviews_application_idx
  ON public.recruiting_reviews (application_id);
CREATE INDEX IF NOT EXISTS recruiting_reviews_reviewer_idx
  ON public.recruiting_reviews (reviewer_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.recruiting_reviews;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recruiting_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 7a. The one open cycle --------------------------------------------------------------
--
-- Returns the cycle code that is accepting applications right now, or NULL. "Open" means
-- the row is flagged active AND today falls inside its window - both, so that forgetting
-- to un-flag a cycle does not leave the form live past its closing date.
--
-- SECURITY DEFINER because an unauthenticated visitor evaluates it (it gates which
-- positions #/join may read) and it must not depend on the caller passing the cycles
-- policy first. It returns one short text code and nothing else.
--
-- Single source of truth: the anon positions policy, the submit RPC and the page all call
-- this, so "which cycle is open" cannot be answered three slightly different ways.

CREATE OR REPLACE FUNCTION public.recruiting_open_cycle()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.cycle
    FROM public.recruiting_cycles c
   WHERE c.active
     AND now() >= c.opens_at
     AND now() <  c.closes_at
   LIMIT 1
$$;


-- 8. Review-scope helper --------------------------------------------------------------
--
-- "Can this user see this application?" - true for the PI, and for any mentor who owns a
-- position the application ranked.
--
-- SECURITY DEFINER for a specific reason: the applications policy needs to consult
-- recruiting_application_positions, whose own policy needs to consult applications. Two
-- RLS-checked policies referring to each other recurse. A definer function reads both
-- tables with RLS bypassed and breaks the cycle, which is the same shape
-- can_sign_off_skill() uses in the skills module.
--
-- STABLE, and reads only. Nothing in this module writes from a definer function except
-- the submit RPC below.

CREATE OR REPLACE FUNCTION public.recruiting_can_review(_user_id uuid, _application_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_active_user(_user_id)
     AND (
       public.has_role(_user_id, 'pi'::app_role)
       OR EXISTS (
         SELECT 1
           FROM public.recruiting_application_positions ap
           JOIN public.recruiting_positions p ON p.id = ap.position_id
          WHERE ap.application_id = _application_id
            AND p.mentor_id = _user_id
       )
     )
$$;


-- 9. Submit RPC -----------------------------------------------------------------------
--
-- Section 4.1 requires the application and its ranked choices to land in ONE transaction.
-- Two supabase-js .insert() calls from the edge function are two transactions, and a
-- failure between them would leave an application with no choices - invisible to every
-- mentor and still occupying the applicant's one-per-cycle slot. One RPC call is one
-- transaction, so this does both or neither.
--
-- SECURITY DEFINER *and* revoked from anon and authenticated (see section 10). Without
-- that revoke the ALTER DEFAULT PRIVILEGES entry on functions would let any visitor POST
-- to /rest/v1/rpc/recruiting_submit_application with the publishable key and insert an
-- application directly - bypassing Turnstile, the open-cycle check and every field rule
-- in the edge function. Only service_role may call it.
--
-- It re-validates everything the edge function validated. The edge function is the only
-- caller today, but a validation that lives only in TypeScript is one deploy away from
-- being the validation that did not run.
--
-- No unqualified UPDATE or DELETE appears here. Supabase preloads `safeupdate` into the
-- authenticator role, which rejects those inside a SECURITY DEFINER function too - see
-- the 2026-08-09 quiz-grader outage.

CREATE OR REPLACE FUNCTION public.recruiting_submit_application(_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_constraint   text;
  v_cycle        text;
  v_app_id       uuid;
  v_choice       jsonb;
  v_choices      jsonb;
  v_n_choices    int;
  v_open_count   int;
BEGIN
  v_choices   := coalesce(_payload -> 'choices', '[]'::jsonb);
  v_n_choices := jsonb_array_length(v_choices);

  IF v_n_choices < 1 OR v_n_choices > 3 THEN
    RAISE EXCEPTION 'choices_out_of_range' USING ERRCODE = '22023';
  END IF;

  -- The one open cycle. Read from the database rather than taken from the payload, so a
  -- caller cannot file into a closed cycle by naming it.
  v_cycle := public.recruiting_open_cycle();

  IF v_cycle IS NULL THEN
    RAISE EXCEPTION 'no_open_cycle' USING ERRCODE = '22023';
  END IF;

  -- Every referenced position must be open in that cycle. Counted rather than looped so
  -- a duplicate id cannot inflate the count past the choice list length.
  SELECT count(DISTINCT p.id) INTO v_open_count
    FROM public.recruiting_positions p
   WHERE p.status = 'open'
     AND p.cycle = v_cycle
     AND p.id IN (
       SELECT (c ->> 'position_id')::uuid FROM jsonb_array_elements(v_choices) AS c
     );

  IF v_open_count <> v_n_choices THEN
    RAISE EXCEPTION 'position_not_open' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.recruiting_applications (
    cycle, full_name, email, year, major, expected_graduation, coursework, r_experience,
    prior_lab_experience, hours_available, longest_block_hours, availability,
    semesters_available, credit_type, animal_samples_ok, field_local_ok,
    field_intl_interest, has_transportation, conflicts, prior_contact, statement,
    policy_check_score
  )
  VALUES (
    v_cycle,
    btrim(_payload ->> 'full_name'),
    lower(btrim(_payload ->> 'email')),
    _payload ->> 'year',
    btrim(_payload ->> 'major'),
    btrim(_payload ->> 'expected_graduation'),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(_payload -> 'coursework', '[]'::jsonb))),
    _payload ->> 'r_experience',
    nullif(btrim(coalesce(_payload ->> 'prior_lab_experience', '')), ''),
    (_payload ->> 'hours_available')::int2,
    (_payload ->> 'longest_block_hours')::int2,
    coalesce(_payload -> 'availability', '{}'::jsonb),
    (_payload ->> 'semesters_available')::int2,
    _payload ->> 'credit_type',
    (_payload ->> 'animal_samples_ok')::boolean,
    (_payload ->> 'field_local_ok')::boolean,
    (_payload ->> 'field_intl_interest')::boolean,
    (_payload ->> 'has_transportation')::boolean,
    nullif(btrim(coalesce(_payload ->> 'conflicts', '')), ''),
    nullif(btrim(coalesce(_payload ->> 'prior_contact', '')), ''),
    btrim(_payload ->> 'statement'),
    (_payload ->> 'policy_check_score')::int2
  )
  RETURNING id INTO v_app_id;

  FOR v_choice IN SELECT * FROM jsonb_array_elements(v_choices)
  LOOP
    INSERT INTO public.recruiting_application_positions (application_id, position_id, rank)
    VALUES (v_app_id, (v_choice ->> 'position_id')::uuid, (v_choice ->> 'rank')::int2);
  END LOOP;

  RETURN v_app_id;

EXCEPTION
  WHEN unique_violation THEN
    -- Distinguish "already applied this cycle" (the 409) from a malformed rank set, which
    -- the caller should have caught and which is a 400. Read from the diagnostics rather
    -- than pattern-matching sqlerrm, whose wording is locale-dependent.
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint = 'recruiting_applications_email_cycle_key' THEN
      RAISE EXCEPTION 'duplicate_application' USING ERRCODE = '23505';
    END IF;
    RAISE EXCEPTION 'duplicate_rank_or_position' USING ERRCODE = '22023';
END;
$$;


-- 10. Grants --------------------------------------------------------------------------
--
-- Start from nothing on every table, then hand back the minimum. See section 0 for why
-- this cannot be skipped.

REVOKE ALL ON TABLE
  public.recruiting_cycles,
  public.recruiting_projects,
  public.recruiting_positions,
  public.recruiting_applications,
  public.recruiting_application_positions,
  public.recruiting_reviews
FROM anon, authenticated;

-- Public page: the cycle dates, the project blurbs and the open listings. RLS narrows
-- each of these further (active cycle only, active projects only, open positions only).
GRANT SELECT ON
  public.recruiting_cycles,
  public.recruiting_projects,
  public.recruiting_positions
TO anon;

-- anon gets NOTHING on applications, ranked choices or reviews - not even SELECT.
-- Acceptance criterion 2 depends on this line as much as on the policies.

GRANT SELECT ON
  public.recruiting_cycles,
  public.recruiting_projects,
  public.recruiting_positions,
  public.recruiting_applications,
  public.recruiting_application_positions,
  public.recruiting_reviews
TO authenticated;

-- PI-managed catalogue. RLS restricts the writes to the PI; the grant only makes them
-- reachable.
GRANT INSERT, UPDATE, DELETE ON public.recruiting_cycles   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recruiting_projects TO authenticated;

-- Mentors own their listings.
GRANT INSERT, UPDATE, DELETE ON public.recruiting_positions TO authenticated;

-- Applications are written only by the RPC under service_role. A reviewer may move the
-- status and nothing else - a COLUMN-level grant, because a row-level policy cannot stop
-- an UPDATE that also rewrites `statement` or `email`. PostgREST rejects an update that
-- touches an ungranted column, so this is enforced before RLS is even consulted.
GRANT UPDATE (status) ON public.recruiting_applications TO authenticated;
-- Section 7 archive-and-delete. RLS restricts it to the PI and to a closed cycle.
GRANT DELETE ON public.recruiting_applications TO authenticated;

-- Reviews: a mentor writes and revises their own.
GRANT INSERT, UPDATE, DELETE ON public.recruiting_reviews TO authenticated;

-- No INSERT/UPDATE/DELETE on recruiting_application_positions for anyone but
-- service_role: the ranked choices are part of the submitted application and are not
-- editable afterwards. Deleting an application cascades them away.

-- The submit RPC is service_role only. Without this revoke it is a public insert endpoint.
REVOKE ALL ON FUNCTION public.recruiting_submit_application(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recruiting_submit_application(jsonb) TO service_role;

-- recruiting_can_review is called from the RLS policies below, and a policy expression is
-- evaluated as the querying role, so `authenticated` must hold EXECUTE on it. anon must
-- not: it takes a user id and an application id and answers a question about them, which
-- for an unauthenticated caller is a small oracle and no use to anything on #/join.
-- #/join calls this before a visitor has any session at all.
GRANT EXECUTE ON FUNCTION public.recruiting_open_cycle() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.recruiting_can_review(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recruiting_can_review(uuid, uuid) TO authenticated;

-- The two shape validators are called only from CHECK constraints - but a CHECK that
-- calls a function DOES require the writing role to hold EXECUTE on it, so `authenticated`
-- must keep it. Established the hard way on a scratch instance 2026-08-22: an earlier
-- draft revoked them from anon and authenticated only, a probe insert as `authenticated`
-- succeeded, and that looked like proof that CHECK constraints skip the privilege check.
-- They do not. The revoke had simply missed PUBLIC, which every function is granted
-- EXECUTE on at creation, so `authenticated` still held the privilege by another route.
-- Adding PUBLIC to the revoke made three probe cases fail with "permission denied for
-- function recruiting_text_array_ok" - on an UPDATE as well as an INSERT, because
-- PostgreSQL re-evaluates every CHECK on the row when any column of it is updated. That
-- is what breaks a reviewer setting `status`, whose column grant has nothing to do with
-- availability.
--
-- anon stays revoked: it has no INSERT or UPDATE grant on either table, so it never
-- evaluates these.
REVOKE ALL ON FUNCTION public.recruiting_availability_is_valid(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recruiting_text_array_ok(text[], int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recruiting_availability_is_valid(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recruiting_text_array_ok(text[], int, int) TO authenticated;
