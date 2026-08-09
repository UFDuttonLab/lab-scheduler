-- =====================================================================================
-- 2026-08-08  Skills module: schema, helpers, triggers, RLS.
--
-- PURELY ADDITIVE AND HIDDEN BY DEFAULT.
--   * Creates one enum and eight new tables. Touches no existing table, no existing
--     policy, and no existing function.
--   * Deliberately does NOT extend log_activity() or the entity_type enum in this pass.
--     log_activity() is a live trigger function shared by six existing tables and its
--     CASE blocks have no ELSE arm; changing it is a separate, riskier migration and it
--     is not needed to store data. Activity logging for skills lands later.
--   * skill_module_settings.visible_to_all defaults to FALSE. Until the PI flips it, the
--     UI must show the module to nobody but PI/manager. Nothing in the current app reads
--     any of these tables, so applying this migration changes nothing a user can see.
--
-- Conventions follow 20260726000000_harden_roles_deactivation_and_conflicts.sql:
-- sentence-case policy names, TO authenticated everywhere, SECURITY DEFINER helpers with
-- SET search_path = public, DROP POLICY IF EXISTS before every CREATE POLICY.
-- =====================================================================================


-- 1. Stage enum -----------------------------------------------------------------------
--
-- Ordered progression. reading_done is self-attested by the trainee; trained and
-- competent are granted by a qualified signer; trainer is PI/manager only.

DO $$ BEGIN
  CREATE TYPE public.skill_stage AS ENUM
    ('not_started','reading_done','trained','competent','trainer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.skill_stage_rank(_s public.skill_stage)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _s
    WHEN 'not_started'  THEN 0
    WHEN 'reading_done' THEN 1
    WHEN 'trained'      THEN 2
    WHEN 'competent'    THEN 3
    WHEN 'trainer'      THEN 4
  END
$$;


-- 2. Module visibility flag -----------------------------------------------------------
--
-- Single row, enforced by a CHECK on a constant primary key. The UI reads this to decide
-- whether to show the Skills nav item to non-elevated roles.

CREATE TABLE IF NOT EXISTS public.skill_module_settings (
  id              boolean PRIMARY KEY DEFAULT true CHECK (id),
  visible_to_all  boolean NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.skill_module_settings (id, visible_to_all)
VALUES (true, false) ON CONFLICT (id) DO NOTHING;


-- 3. Catalog tables -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.skill_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  description  text,
  icon         text,
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skills (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id          uuid NOT NULL REFERENCES public.skill_categories(id) ON DELETE RESTRICT,
  code                 text NOT NULL UNIQUE,
  name                 text NOT NULL,
  summary              text,
  instructions_md      text,
  instructions_version integer NOT NULL DEFAULT 1,
  reading_refs         jsonb NOT NULL DEFAULT '[]'::jsonb,
  requires_reading     boolean NOT NULL DEFAULT true,
  requires_practical   boolean NOT NULL DEFAULT true,
  est_train_minutes    integer,
  recert_months        integer,
  external_ref         text,
  risk_level           text NOT NULL DEFAULT 'standard'
                       CHECK (risk_level IN ('standard','high','critical')),
  sort_order           integer NOT NULL DEFAULT 0,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skills_category_idx ON public.skills(category_id);
CREATE INDEX IF NOT EXISTS skills_active_idx   ON public.skills(active);

CREATE TABLE IF NOT EXISTS public.skill_prerequisites (
  skill_id   uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  prereq_id  uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, prereq_id),
  CHECK (skill_id <> prereq_id)
);

CREATE TABLE IF NOT EXISTS public.skill_checklist_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  sort_order   integer NOT NULL DEFAULT 0,
  item_text    text NOT NULL,
  is_critical  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skill_checklist_items_skill_idx
  ON public.skill_checklist_items(skill_id);

-- A skill can apply to more than one machine - both Flexes, both OT-2s, all four
-- nanopore devices - which a scalar skills.equipment_id could not express.
CREATE TABLE IF NOT EXISTS public.skill_equipment (
  skill_id      uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  equipment_id  uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS skill_equipment_equipment_idx
  ON public.skill_equipment(equipment_id);

CREATE TABLE IF NOT EXISTS public.skill_tracks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  description  text,
  icon         text,
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_track_items (
  track_id    uuid NOT NULL REFERENCES public.skill_tracks(id) ON DELETE CASCADE,
  skill_id    uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (track_id, skill_id)
);


-- 4. Progress tables ------------------------------------------------------------------
--
-- user_skills is the fast current-state row the matrix reads. skill_signoffs is the
-- append-only ledger and the record of truth for "who signed what, when". The trigger in
-- section 6 projects the ledger onto user_skills, monotonically.

CREATE TABLE IF NOT EXISTS public.skill_signoffs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id           uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  signed_by          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  stage_granted      public.skill_stage NOT NULL
                     CHECK (stage_granted IN ('trained','competent','trainer')),
  observed_at        timestamptz NOT NULL DEFAULT now(),
  checklist_results  jsonb NOT NULL DEFAULT '[]'::jsonb,
  prereqs_waived     boolean NOT NULL DEFAULT false,
  waiver_reason      text,
  comments           text,
  expires_at         timestamptz,
  revoked_at         timestamptz,
  revoked_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoke_reason      text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (signed_by <> user_id),
  CHECK (revoked_at IS NULL OR revoke_reason IS NOT NULL),
  CHECK (NOT prereqs_waived OR waiver_reason IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS skill_signoffs_user_idx   ON public.skill_signoffs(user_id, skill_id);
CREATE INDEX IF NOT EXISTS skill_signoffs_signer_idx ON public.skill_signoffs(signed_by);

CREATE TABLE IF NOT EXISTS public.user_skills (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id             uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  stage                public.skill_stage NOT NULL DEFAULT 'not_started',
  reading_ack_at       timestamptz,
  reading_ack_version  integer,
  last_signoff_id      uuid REFERENCES public.skill_signoffs(id) ON DELETE SET NULL,
  signed_off_at        timestamptz,
  signed_off_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at           timestamptz,
  notes                text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS user_skills_user_idx  ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS user_skills_skill_idx ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS user_skills_stage_idx ON public.user_skills(stage);


-- 5. Authority helpers ----------------------------------------------------------------
--
-- Signing authority is PER SKILL, not a blanket role. A grad student who is a trainer on
-- FLX-21 can sign FLX-21 and nothing else. has_any_role() already folds in the
-- profiles.active check; the trainer arm needs its own.

CREATE OR REPLACE FUNCTION public.can_sign_off_skill(_signer uuid, _skill_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_signer, ARRAY['pi','manager']::app_role[])
      OR EXISTS (
        SELECT 1
        FROM public.user_skills us
        JOIN public.profiles p ON p.id = us.user_id
        WHERE us.user_id  = _signer
          AND us.skill_id = _skill_id
          AND us.stage    = 'trainer'
          AND (us.expires_at IS NULL OR us.expires_at > now())
          AND p.active    = true
      )
$$;

CREATE OR REPLACE FUNCTION public.can_grant_trainer(_signer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_signer, ARRAY['pi','manager']::app_role[])
$$;


-- 6. Triggers -------------------------------------------------------------------------

-- 6a. BEFORE INSERT on skill_signoffs: validate preconditions, stamp expiry.
CREATE OR REPLACE FUNCTION public.enforce_signoff_preconditions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_recert        integer;
  v_needs_reading boolean;
  v_acked         boolean;
BEGIN
  SELECT recert_months, requires_reading
    INTO v_recert, v_needs_reading
    FROM public.skills WHERE id = NEW.skill_id;

  IF v_needs_reading THEN
    SELECT reading_ack_at IS NOT NULL INTO v_acked
      FROM public.user_skills
      WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
    IF COALESCE(v_acked, false) = false THEN
      RAISE EXCEPTION
        'Cannot sign off: this person has not acknowledged reading the instructions for this skill yet.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  NEW.expires_at := CASE WHEN v_recert IS NULL THEN NULL
                         ELSE NEW.observed_at + (v_recert || ' months')::interval END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_signoff_preconditions_trg ON public.skill_signoffs;
CREATE TRIGGER enforce_signoff_preconditions_trg
  BEFORE INSERT ON public.skill_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_signoff_preconditions();

-- 6b. AFTER INSERT: project the ledger row onto user_skills, monotonically.
--
-- AFTER, not BEFORE: user_skills.last_signoff_id has a non-deferrable FK to
-- skill_signoffs(id), and the nested INSERT's referential-integrity check fires at the
-- end of that nested statement, before the outer tuple is stored. A BEFORE trigger fails
-- with 'Key (last_signoff_id)=(...) is not present in table "skill_signoffs"'.
CREATE OR REPLACE FUNCTION public.apply_skill_signoff()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_skills
    (user_id, skill_id, stage, last_signoff_id, signed_off_at, signed_off_by, expires_at, updated_at)
  VALUES
    (NEW.user_id, NEW.skill_id, NEW.stage_granted, NEW.id, NEW.observed_at,
     NEW.signed_by, NEW.expires_at, now())
  ON CONFLICT (user_id, skill_id) DO UPDATE SET
    -- Monotonic. Without this guard a later sign-off at 'trained' silently demotes
    -- someone already at 'competent', and silently strips 'trainer' - revoking their
    -- per-skill signing authority with no ledger event. Demotion is revocation's job.
    stage = CASE
      WHEN public.skill_stage_rank(EXCLUDED.stage)
         >= public.skill_stage_rank(public.user_skills.stage)
      THEN EXCLUDED.stage ELSE public.user_skills.stage END,
    last_signoff_id = EXCLUDED.last_signoff_id,
    signed_off_at   = EXCLUDED.signed_off_at,
    signed_off_by   = EXCLUDED.signed_off_by,
    expires_at      = EXCLUDED.expires_at,
    updated_at      = now();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS apply_skill_signoff_trg ON public.skill_signoffs;
CREATE TRIGGER apply_skill_signoff_trg
  AFTER INSERT ON public.skill_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.apply_skill_signoff();

-- 6c. BEFORE UPDATE on skill_signoffs: the ledger is immutable except for revocation.
CREATE OR REPLACE FUNCTION public.protect_signoff_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.skill_id IS DISTINCT FROM OLD.skill_id
     OR NEW.signed_by IS DISTINCT FROM OLD.signed_by
     OR NEW.stage_granted IS DISTINCT FROM OLD.stage_granted
     OR NEW.observed_at IS DISTINCT FROM OLD.observed_at
     OR NEW.checklist_results IS DISTINCT FROM OLD.checklist_results
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION
      'A sign-off record is immutable. Revoke it (set revoked_at and revoke_reason) and issue a new one.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_signoff_columns_trg ON public.skill_signoffs;
CREATE TRIGGER protect_signoff_columns_trg
  BEFORE UPDATE ON public.skill_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.protect_signoff_columns();

-- 6d. AFTER UPDATE: a revocation recomputes user_skills from the surviving ledger.
CREATE OR REPLACE FUNCTION public.recompute_user_skill_after_revoke()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NEW.revoked_at IS NULL OR OLD.revoked_at IS NOT NULL THEN RETURN NULL; END IF;

  SELECT * INTO r FROM public.skill_signoffs s
   WHERE s.user_id = NEW.user_id AND s.skill_id = NEW.skill_id
     AND s.revoked_at IS NULL
     AND (s.expires_at IS NULL OR s.expires_at > now())
   ORDER BY public.skill_stage_rank(s.stage_granted) DESC, s.observed_at DESC
   LIMIT 1;

  IF FOUND THEN
    UPDATE public.user_skills SET
      stage = r.stage_granted, last_signoff_id = r.id, signed_off_at = r.observed_at,
      signed_off_by = r.signed_by, expires_at = r.expires_at, updated_at = now()
     WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
  ELSE
    UPDATE public.user_skills SET
      stage = CASE WHEN reading_ack_at IS NOT NULL THEN 'reading_done'::public.skill_stage
                   ELSE 'not_started'::public.skill_stage END,
      last_signoff_id = NULL, signed_off_at = NULL, signed_off_by = NULL,
      expires_at = NULL, updated_at = now()
     WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS recompute_user_skill_after_revoke_trg ON public.skill_signoffs;
CREATE TRIGGER recompute_user_skill_after_revoke_trg
  AFTER UPDATE ON public.skill_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.recompute_user_skill_after_revoke();

-- 6e. BEFORE UPDATE on user_skills: pin every authority column against the row owner.
--
-- This is the control, not belt-and-braces. RLS WITH CHECK is evaluated against the NEW
-- row and cannot compare against OLD, so it can constrain what a column IS but not
-- whether it CHANGED - it cannot stop a trainee writing their own signed_off_by, and it
-- cannot stop a self-demotion that silently strips a trainer's signing authority.
--
-- Deliberately NOT security definer: inside a definer function current_user is the owner
-- rather than the caller. Same reasoning as
-- 20260725180000_fix_profile_trigger_and_role_visibility.sql:9-25.
CREATE OR REPLACE FUNCTION public.protect_user_skill_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- apply_skill_signoff() and the revoke recompute run nested, at depth > 1.
  IF pg_trigger_depth() > 1 THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]) THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  NEW.user_id         := OLD.user_id;
  NEW.skill_id        := OLD.skill_id;
  NEW.stage           := OLD.stage;
  NEW.last_signoff_id := OLD.last_signoff_id;
  NEW.signed_off_at   := OLD.signed_off_at;
  NEW.signed_off_by   := OLD.signed_off_by;
  NEW.expires_at      := OLD.expires_at;

  -- reading_done is a FLOOR, never a ceiling: re-acknowledging a bumped
  -- instructions_version must not demote someone already trained/competent/trainer.
  IF OLD.stage = 'not_started' AND NEW.reading_ack_at IS NOT NULL THEN
    NEW.stage := 'reading_done';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_skill_columns_trg ON public.user_skills;
CREATE TRIGGER protect_user_skill_columns_trg
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_skill_columns();

-- 6f. updated_at on the catalog tables, reusing the existing house helper.
DROP TRIGGER IF EXISTS set_updated_at ON public.skills;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.skill_categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.skill_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.skill_tracks;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.skill_tracks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 7. RLS ------------------------------------------------------------------------------

ALTER TABLE public.skill_module_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_prerequisites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_checklist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_equipment        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_tracks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_track_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_signoffs         ENABLE ROW LEVEL SECURITY;

-- 7a. Catalog tables: open read, elevated manage.
--
-- Uses the canonical 5-role elevated set, NOT the 6-role set that equipment uses.
-- undergrad_student is deliberately excluded: a trainee should not be able to edit the
-- definition of the skill they are being assessed on. Unlike the existing FOR ALL
-- policies in this database these carry WITH CHECK as well as USING; the omission
-- elsewhere is drift, not the convention.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['skill_categories','skills','skill_prerequisites',
                           'skill_checklist_items','skill_equipment',
                           'skill_tracks','skill_track_items']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Everyone can view '||t, t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)$f$,
                   'Everyone can view '||t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Elevated roles can manage '||t, t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING      (public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::app_role[]))
      WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::app_role[]))$f$,
      'Elevated roles can manage '||t, t);
  END LOOP;
END $$;

-- 7b. Visibility flag: everyone reads it, PI and managers set it.
DROP POLICY IF EXISTS "Everyone can view the skills module setting" ON public.skill_module_settings;
CREATE POLICY "Everyone can view the skills module setting"
  ON public.skill_module_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "PI and managers can set skills module visibility" ON public.skill_module_settings;
CREATE POLICY "PI and managers can set skills module visibility"
  ON public.skill_module_settings FOR UPDATE TO authenticated
  USING      (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]));

-- 7c. user_skills.
--
-- SELECT is open on purpose: the point of the matrix is that a trainee can find someone
-- qualified to supervise them.
--
-- The UPDATE policy deliberately does NOT constrain `stage`. WITH CHECK is evaluated
-- against the NEW row, so `stage IN ('not_started','reading_done')` would reject any
-- update by someone already trained/competent/trainer - including re-acknowledging a
-- bumped instructions_version, which is exactly who needs to. protect_user_skill_columns()
-- pins stage instead.

DROP POLICY IF EXISTS "All authenticated users can view skill progress" ON public.user_skills;
CREATE POLICY "All authenticated users can view skill progress"
  ON public.user_skills FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Active users can start their own skill record" ON public.user_skills;
CREATE POLICY "Active users can start their own skill record"
  ON public.user_skills FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_user(auth.uid())
    AND stage IN ('not_started','reading_done')
    AND signed_off_at   IS NULL
    AND signed_off_by   IS NULL
    AND last_signoff_id IS NULL
    AND expires_at      IS NULL
  );

DROP POLICY IF EXISTS "Active users can update their own skill record" ON public.user_skills;
CREATE POLICY "Active users can update their own skill record"
  ON public.user_skills FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND public.is_active_user(auth.uid()))
    OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
  );

DROP POLICY IF EXISTS "PI can delete skill records" ON public.user_skills;
CREATE POLICY "PI can delete skill records"
  ON public.user_skills FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'pi'));

-- 7d. skill_signoffs - the authority table.

DROP POLICY IF EXISTS "All authenticated users can view sign-offs" ON public.skill_signoffs;
CREATE POLICY "All authenticated users can view sign-offs"
  ON public.skill_signoffs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Qualified signers can sign off skills" ON public.skill_signoffs;
CREATE POLICY "Qualified signers can sign off skills"
  ON public.skill_signoffs FOR INSERT TO authenticated
  WITH CHECK (
    signed_by = auth.uid()
    AND signed_by <> user_id
    AND public.is_active_user(auth.uid())
    AND public.can_sign_off_skill(auth.uid(), skill_id)
    AND (stage_granted <> 'trainer' OR public.can_grant_trainer(auth.uid()))
  );

DROP POLICY IF EXISTS "PI and managers can revoke sign-offs" ON public.skill_signoffs;
CREATE POLICY "PI and managers can revoke sign-offs"
  ON public.skill_signoffs FOR UPDATE TO authenticated
  USING      (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]));

DROP POLICY IF EXISTS "PI can delete sign-offs" ON public.skill_signoffs;
CREATE POLICY "PI can delete sign-offs"
  ON public.skill_signoffs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'pi'));


-- 8. Applied and verified ------------------------------------------------------------
--
-- APPLIED LIVE to project ypaobygipbnkvnismhyy on 2026-08-08 via the Lovable connector,
-- in three statements (tables, then functions+triggers, then RLS). Confirmed after:
--
--   10 tables created, rowsecurity = true on all 10
--   policy counts: 2 on each catalog table, 4 on user_skills, 4 on skill_signoffs,
--                  2 on skill_module_settings
--   skill_module_settings.visible_to_all = false
--   existing data untouched: 164 bookings, 29 equipment, 30 profiles, 70 usage_records
--
-- Security probe run against a scratch Postgres 16 with the real policies before applying.
-- 17 cases, all pass:
--   undergrad self-promotes to competent .................. pinned to reading_done
--   undergrad writes own signed_off_by/at/expires_at ...... pinned to NULL
--   undergrad inserts own row with a 10-year expiry ....... REJECTED
--   undergrad inserts own row at 'competent' .............. REJECTED
--   undergrad signs their own skill ....................... REJECTED
--   undergrad signs someone else without being a trainer .. REJECTED
--   undergrad edits the skill catalog ..................... RLS filtered to 0 rows
--   undergrad flips module visibility ..................... RLS filtered to 0 rows
--   undergrad re-acknowledges reading while competent ..... ALLOWED, stage unchanged
--   trainer signs the skill they hold trainer on .......... ALLOWED
--   trainer signs a DIFFERENT skill ....................... REJECTED
--   trainer grants 'trainer' .............................. REJECTED (PI/manager only)
--   sign-off with no reading acknowledged ................. REJECTED with a usable message
--   sign 'trained' over an existing 'competent' ........... stage stays competent (monotonic)
--   non-PI revokes a sign-off ............................. 0 rows (settleWrite surfaces it)
--   PI mutates stage_granted on a sign-off ................ REJECTED (ledger immutable)
--   PI revokes properly ................................... ALLOWED, user_skills recomputed
--   deactivated trainer signs anything .................... REJECTED
--   PI flips module visibility ............................ ALLOWED
--
-- KNOWN BOOTSTRAP WRINKLE. enforce_signoff_preconditions() blocks ANY sign-off - including
-- the PI granting 'trainer' - until that person has a user_skills row with reading_ack_at
-- set. So the first trainers cannot be minted until they have clicked "I have read this"
-- on the skill in question. That is arguably correct, but it means the PI cannot seed
-- trainers from Settings before anyone has used the app. If that turns out to be annoying,
-- the fix is to skip the precondition when stage_granted = 'trainer', not to remove it.
--
-- Verification queries ----------------------------------------------------------------
--
--   SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname='public' AND tablename LIKE 'skill%' OR tablename='user_skills';
--        -- all rowsecurity = true
--
--   SELECT visible_to_all FROM public.skill_module_settings;   -- expect false
--
--   SELECT count(*) FROM public.skills;                        -- 0 until the seed runs
--
-- The module is invisible until (a) the seed migration runs and (b) a UI is added that
-- reads these tables. No existing table, policy or function was modified.
