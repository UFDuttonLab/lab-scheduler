-- =====================================================================================
-- 2026-08-22  Undergraduate recruiting module: row level security.
--
-- STATUS: APPLIED LIVE 2026-08-22, verified by the same fingerprint comparison
-- described in the schema migration's header. 20 policies, RLS enabled on all six
-- tables.
--
-- Companion to 20260822100000_recruiting_schema.sql. Apply that first - these policies
-- reference recruiting_can_review() and recruiting_open_cycle().
--
-- READ THE GRANTS TOO. Policies and grants are two different gates and this module needs
-- both. The schema migration REVOKEs everything from anon and authenticated and hands back
-- a minimum; the policies below narrow what is left. Neither alone is sufficient: RLS with
-- a stray grant is how an anonymous INSERT gets through, and a grant with no policy denies
-- everything and looks like a bug.
--
-- This is the first module in this application with any anon-facing surface at all -
-- every pre-existing policy in the database is TO authenticated. The three policies below
-- that name `anon` are worth re-reading whenever this module changes.
--
-- Convention (from 20260726000000 and the skills module): sentence-case policy names,
-- explicit TO, DROP POLICY IF EXISTS before every CREATE POLICY.
--
-- Rollback: supabase/rollback/20260822110000_recruiting_rls_down.sql
-- =====================================================================================

ALTER TABLE public.recruiting_cycles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_positions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_applications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_application_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_reviews              ENABLE ROW LEVEL SECURITY;


-- 1. Cycles ---------------------------------------------------------------------------
--
-- A visitor sees only the cycle that is currently accepting applications. Signed-in lab
-- members see all of them, because a mentor drafting a listing has to pick a cycle that
-- has not opened yet.

DROP POLICY IF EXISTS "Visitors can view the open cycle" ON public.recruiting_cycles;
CREATE POLICY "Visitors can view the open cycle"
  ON public.recruiting_cycles FOR SELECT TO anon
  USING (cycle = public.recruiting_open_cycle());

DROP POLICY IF EXISTS "Lab members can view all cycles" ON public.recruiting_cycles;
CREATE POLICY "Lab members can view all cycles"
  ON public.recruiting_cycles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "PI can manage cycles" ON public.recruiting_cycles;
CREATE POLICY "PI can manage cycles"
  ON public.recruiting_cycles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'pi'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'pi'::app_role));


-- 2. Projects -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Visitors can view active projects" ON public.recruiting_projects;
CREATE POLICY "Visitors can view active projects"
  ON public.recruiting_projects FOR SELECT TO anon
  USING (active = true);

DROP POLICY IF EXISTS "Lab members can view all recruiting projects" ON public.recruiting_projects;
CREATE POLICY "Lab members can view all recruiting projects"
  ON public.recruiting_projects FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "PI can manage recruiting projects" ON public.recruiting_projects;
CREATE POLICY "PI can manage recruiting projects"
  ON public.recruiting_projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'pi'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'pi'::app_role));


-- 3. Positions ------------------------------------------------------------------------
--
-- Public read is narrower than the spec's "status = 'open'": it is open AND in the cycle
-- that is currently accepting applications. Otherwise a listing left at 'open' after a
-- cycle ends stays advertised on a page whose form no longer accepts anything.
--
-- Authenticated read is unrestricted. Positions are job adverts, not personal data, and
-- the review queue has to render "the other positions this applicant ranked", which
-- belong to other mentors and may by then be 'filled'. Restricting this would hide part
-- of an application from the person judging it.
--
-- INSERT is narrower than the spec's plain "authenticated". A position with status='open'
-- is published to the open internet under the lab's name, so creating one is limited to
-- the canonical elevated set - the same five roles that may edit the skills catalogue.
-- undergrad_student and the bare `user` role are deliberately excluded: an undergraduate
-- being mentored should not be able to advertise a position in the lab's name.

DROP POLICY IF EXISTS "Visitors can view open positions" ON public.recruiting_positions;
CREATE POLICY "Visitors can view open positions"
  ON public.recruiting_positions FOR SELECT TO anon
  USING (status = 'open' AND cycle = public.recruiting_open_cycle());

DROP POLICY IF EXISTS "Lab members can view positions" ON public.recruiting_positions;
CREATE POLICY "Lab members can view positions"
  ON public.recruiting_positions FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Mentors can create their own positions" ON public.recruiting_positions;
CREATE POLICY "Mentors can create their own positions"
  ON public.recruiting_positions FOR INSERT TO authenticated
  WITH CHECK (
    mentor_id = auth.uid()
    AND public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::app_role[])
  );

-- WITH CHECK repeats mentor_id = auth.uid() so an UPDATE cannot hand the listing, and the
-- applications ranked to it, to somebody else.
DROP POLICY IF EXISTS "Mentors can update their own positions" ON public.recruiting_positions;
CREATE POLICY "Mentors can update their own positions"
  ON public.recruiting_positions FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() AND public.is_active_user(auth.uid()))
  WITH CHECK (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Mentors can delete their own positions" ON public.recruiting_positions;
CREATE POLICY "Mentors can delete their own positions"
  ON public.recruiting_positions FOR DELETE TO authenticated
  USING (mentor_id = auth.uid() AND public.is_active_user(auth.uid()));

-- The PI may edit or remove any listing, including reassigning mentor_id when someone
-- leaves the lab. A separate permissive policy, so it ORs with the mentor's own.
DROP POLICY IF EXISTS "PI can manage any position" ON public.recruiting_positions;
CREATE POLICY "PI can manage any position"
  ON public.recruiting_positions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'pi'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'pi'::app_role));


-- 4. Applications ---------------------------------------------------------------------
--
-- anon has no policy here and no grant either. There is deliberately no INSERT policy for
-- authenticated: applications arrive only through recruiting_submit_application() under
-- the service role, which bypasses RLS. A signed-in lab member cannot file one by hand.
--
-- The "status only" restriction in the spec is enforced by the column-level
-- GRANT UPDATE (status) in the schema migration, NOT by the policy below - a row policy
-- cannot see which columns an UPDATE touches, so USING/WITH CHECK alone would let a
-- mentor rewrite an applicant's statement while moving them to 'interview'.

DROP POLICY IF EXISTS "Reviewers can view applications ranked to their positions" ON public.recruiting_applications;
CREATE POLICY "Reviewers can view applications ranked to their positions"
  ON public.recruiting_applications FOR SELECT TO authenticated
  USING (public.recruiting_can_review(auth.uid(), id));

DROP POLICY IF EXISTS "Reviewers can set application status" ON public.recruiting_applications;
CREATE POLICY "Reviewers can set application status"
  ON public.recruiting_applications FOR UPDATE TO authenticated
  USING (public.recruiting_can_review(auth.uid(), id))
  WITH CHECK (public.recruiting_can_review(auth.uid(), id));

-- Section 7 retention. PI only, and only for a cycle that is no longer the open one, so
-- a mis-click on #/review cannot delete the cycle currently being reviewed. The UI writes
-- the JSON export before calling this; the policy is the backstop, not the safeguard.
DROP POLICY IF EXISTS "PI can archive a closed cycle" ON public.recruiting_applications;
CREATE POLICY "PI can archive a closed cycle"
  ON public.recruiting_applications FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'pi'::app_role)
    AND cycle IS DISTINCT FROM public.recruiting_open_cycle()
  );


-- 5. Ranked choices -------------------------------------------------------------------
--
-- Same predicate as applications, via the same helper, so the two can never disagree.
-- No write policy for anyone: the choices are part of a submitted application. Deleting
-- the application cascades them away.

DROP POLICY IF EXISTS "Reviewers can view ranked choices" ON public.recruiting_application_positions;
CREATE POLICY "Reviewers can view ranked choices"
  ON public.recruiting_application_positions FOR SELECT TO authenticated
  USING (public.recruiting_can_review(auth.uid(), application_id));


-- 6. Reviews --------------------------------------------------------------------------
--
-- The spec gives reviews no UPDATE policy. Combined with UNIQUE (application_id,
-- reviewer_id) that would make the first save permanent - a mentor who picked the wrong
-- decision could never correct it and could not insert a replacement either. An UPDATE
-- policy scoped to the reviewer's own row is added for that reason.
--
-- INSERT also requires recruiting_can_review(): without it a mentor could file a review
-- against an application they are not entitled to read, which is an existence oracle over
-- application ids and would show up in the PI's queue as a real opinion.

DROP POLICY IF EXISTS "Reviewers can view their own reviews" ON public.recruiting_reviews;
CREATE POLICY "Reviewers can view their own reviews"
  ON public.recruiting_reviews FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR public.has_role(auth.uid(), 'pi'::app_role));

DROP POLICY IF EXISTS "Reviewers can write their own reviews" ON public.recruiting_reviews;
CREATE POLICY "Reviewers can write their own reviews"
  ON public.recruiting_reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND public.is_active_user(auth.uid())
    AND public.recruiting_can_review(auth.uid(), application_id)
  );

DROP POLICY IF EXISTS "Reviewers can revise their own reviews" ON public.recruiting_reviews;
CREATE POLICY "Reviewers can revise their own reviews"
  ON public.recruiting_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid() AND public.is_active_user(auth.uid()))
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Reviewers and the PI can delete a review" ON public.recruiting_reviews;
CREATE POLICY "Reviewers and the PI can delete a review"
  ON public.recruiting_reviews FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid() OR public.has_role(auth.uid(), 'pi'::app_role));
