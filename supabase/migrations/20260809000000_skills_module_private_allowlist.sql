-- =====================================================================================
-- 2026-08-09  Skills module: private preview by allowlist, enforced in Postgres.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09 via the Lovable connector.
--
-- WHY. The first cut gated the module on "pi or manager". That is too wide: there are two
-- PIs on this project (Christopher Dutton and Amanda Subalusky), so "hidden from everyone
-- but me" was not actually true. It was also only enforced in the UI - every skills table
-- still had SELECT ... USING (true), so any authenticated lab member could read the whole
-- catalog straight off the PostgREST API by guessing a table name.
--
-- This migration fixes both: an explicit allowlist, and the gate moved into RLS so hidden
-- means hidden at the data layer.
--
-- RELEASING IT LATER is one switch, no deploy and no migration: set visible_to_all = true
-- (there is a toggle on the Skills page for exactly this). Everything below then opens up
-- to all authenticated users automatically, because can_see_skills_module() short-circuits
-- on that column.
-- =====================================================================================


-- 1. The allowlist --------------------------------------------------------------------

ALTER TABLE public.skill_module_settings
  ADD COLUMN IF NOT EXISTS allowlist_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- Seeded with duttonc@ufl.edu only. Note there is also an INACTIVE duplicate profile for
-- cldutton@gmail.com (role 'user'); the active pi account is the one that matters here.
UPDATE public.skill_module_settings
   SET allowlist_user_ids = ARRAY['2307b8ac-dc39-4514-9459-8f35f21c54bc'::uuid],
       updated_at = now()
 WHERE id = true;


-- 2. The gate -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_see_skills_module(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.skill_module_settings s
     WHERE s.id = true
       AND (s.visible_to_all OR _user = ANY(s.allowlist_user_ids))
  )
$$;


-- 3. Re-gate every skills table -------------------------------------------------------
--
-- ⚠️ THE TRAP, and it is worth remembering for any future module: a `FOR ALL` policy
-- grants SELECT as well as INSERT/UPDATE/DELETE, and Postgres ORs permissive policies
-- together. Gating only the SELECT policy left every elevated role reading the full
-- catalog through the *manage* policy instead. Caught by probing as a second,
-- non-allowlisted PI - the SELECT-only version returned all 53 skills. Both policies on
-- each table must carry the gate.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['skill_categories','skills','skill_prerequisites',
                           'skill_checklist_items','skill_equipment',
                           'skill_tracks','skill_track_items']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Everyone can view '||t, t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING (public.can_see_skills_module(auth.uid()))$f$, 'Everyone can view '||t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Elevated roles can manage '||t, t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING (public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::app_role[])
             AND public.can_see_skills_module(auth.uid()))
      WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::app_role[])
             AND public.can_see_skills_module(auth.uid()))$f$,
      'Elevated roles can manage '||t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "All authenticated users can view skill progress" ON public.user_skills;
CREATE POLICY "All authenticated users can view skill progress"
  ON public.user_skills FOR SELECT TO authenticated
  USING (public.can_see_skills_module(auth.uid()));

DROP POLICY IF EXISTS "Active users can start their own skill record" ON public.user_skills;
CREATE POLICY "Active users can start their own skill record"
  ON public.user_skills FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_user(auth.uid())
    AND public.can_see_skills_module(auth.uid())
    AND stage IN ('not_started','reading_done')
    AND signed_off_at   IS NULL
    AND signed_off_by   IS NULL
    AND last_signoff_id IS NULL
    AND expires_at      IS NULL
  );

DROP POLICY IF EXISTS "All authenticated users can view sign-offs" ON public.skill_signoffs;
CREATE POLICY "All authenticated users can view sign-offs"
  ON public.skill_signoffs FOR SELECT TO authenticated
  USING (public.can_see_skills_module(auth.uid()));

DROP POLICY IF EXISTS "Qualified signers can sign off skills" ON public.skill_signoffs;
CREATE POLICY "Qualified signers can sign off skills"
  ON public.skill_signoffs FOR INSERT TO authenticated
  WITH CHECK (
    signed_by = auth.uid()
    AND signed_by <> user_id
    AND public.is_active_user(auth.uid())
    AND public.can_see_skills_module(auth.uid())
    AND public.can_sign_off_skill(auth.uid(), skill_id)
    AND (stage_granted <> 'trainer' OR public.can_grant_trainer(auth.uid()))
  );


-- 4. Who may widen access -------------------------------------------------------------
--
-- An elevated role who is THEMSELVES allowlisted, so the other PI cannot add herself.
-- The cardinality clause is an escape hatch: if the allowlist is ever emptied, any
-- pi/manager can get back in rather than the module locking everyone out permanently.
--
-- skill_module_settings SELECT stays open to all authenticated users on purpose - the
-- client hook has to read this row to learn that it may NOT see anything, and the row
-- holds only a boolean, a timestamp and a list of uuids.

DROP POLICY IF EXISTS "PI and managers can set skills module visibility" ON public.skill_module_settings;
CREATE POLICY "PI and managers can set skills module visibility"
  ON public.skill_module_settings FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
    AND (auth.uid() = ANY(allowlist_user_ids) OR cardinality(allowlist_user_ids) = 0)
  )
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]));


-- 5. Verified -------------------------------------------------------------------------
--
-- Probed on a scratch Postgres 16 carrying these exact policies, with a second
-- non-allowlisted PI standing in for the other PI on the project:
--
--   allowlisted PI          sees 53 skills ......................... PASS
--   allowlisted PI          can flip visible_to_all ................ PASS
--   other PI (not listed)   sees 0 skills .......................... PASS
--   other PI                sees 0 checklist items ................. PASS
--   other PI                sees 0 user_skills ..................... PASS
--   other PI                adds self to allowlist -> 0 rows ....... PASS
--   undergrad               sees 0 skills .......................... PASS
--   after visible_to_all=true, undergrad sees 53 skills ............ PASS
--
-- And on the live database, every ALL and SELECT policy across the nine gated tables
-- reports can_see_skills_module in its USING clause. The one intentional exception is
-- "Everyone can view the skills module setting" - see the note in section 4.
