-- =====================================================================================
-- 2026-08-22  Recruiting: use the scheduler's projects, not a second list.
--
-- STATUS: TO APPLY.
--
-- WHY.
--
-- The module shipped with its own recruiting_projects table because the build spec asked
-- for a `projects` table and public.projects already existed. The result was two lists of
-- the same thing: "Gorilla gut microbiome" here, "Disney Animal Kingdom" there, joined by
-- a nullable FK. The PI spotted it immediately and it is the right call - the scheduler's
-- project list is the lab's actual vocabulary. Bookings, usage records and analytics all
-- key off it, so recruiting onto the same list is what makes it possible to ask "who did
-- we recruit onto Hippo, and what have they booked since".
--
-- WHERE THE PUBLIC BLURB LIVES NOW: public.projects.description, which already exists, is
-- already editable in Settings -> Projects, and was empty on all 16 rows. The five blurbs
-- written for the recruiting list are copied into it below, and only where the scheduler
-- description was blank, so nothing anyone typed is overwritten.
--
-- WHY A VIEW RATHER THAN AN anon POLICY ON public.projects.
--
-- #/join has to show the project name and blurb to a visitor with no session. The obvious
-- move - add a SELECT policy for anon on public.projects - was rejected. Checked
-- 2026-08-22: `anon` already holds SELECT, INSERT, UPDATE, DELETE and TRUNCATE grants on
-- public.projects, inherited from this project's ALTER DEFAULT PRIVILEGES. RLS with no
-- anon policy is the ONLY thing standing between an anonymous visitor and that table. Any
-- future edit to its policies is one mistake away from a public write, and adding the
-- module's first anon policy there makes that mistake much easier to make.
--
-- So the public page reads a view instead. recruiting_open_positions is owned by postgres
-- and runs with the owner's privileges (security_invoker defaults to false), exposes four
-- project-derived columns and no others, and has a fixed WHERE that a caller cannot widen.
-- public.projects itself stays exactly as locked as it is today.
--
-- Rollback: supabase/rollback/20260822140000_recruiting_use_scheduler_projects_down.sql
-- NOTE: 20260822120000_recruiting_seed_fall_2026.sql writes to recruiting_projects and so
-- can only be replayed BEFORE this migration. On a rebuild, keep them in order.
-- =====================================================================================


-- 1. Move the blurbs onto the scheduler's projects --------------------------------------
--
-- Qualified UPDATE with a WHERE, as everything reachable through PostgREST must be:
-- Supabase preloads `safeupdate` into the authenticator role.

UPDATE public.projects p
   SET description = rp.blurb
  FROM public.recruiting_projects rp
 WHERE rp.scheduler_project_id = p.id
   AND coalesce(btrim(p.description), '') = '';


-- 2. Repoint positions at the scheduler's projects ---------------------------------------

DO $$
DECLARE v_orphans int;
BEGIN
  SELECT count(*) INTO v_orphans
    FROM public.recruiting_positions p
    JOIN public.recruiting_projects rp ON rp.id = p.project_id
   WHERE rp.scheduler_project_id IS NULL;

  IF v_orphans > 0 THEN
    RAISE EXCEPTION
      'Cannot migrate: % position(s) point at a recruiting project with no scheduler project. Link them first.',
      v_orphans;
  END IF;
END $$;

ALTER TABLE public.recruiting_positions
  DROP CONSTRAINT IF EXISTS recruiting_positions_project_id_fkey;

UPDATE public.recruiting_positions p
   SET project_id = rp.scheduler_project_id
  FROM public.recruiting_projects rp
 WHERE rp.id = p.project_id
   AND rp.scheduler_project_id IS NOT NULL;

ALTER TABLE public.recruiting_positions
  ADD CONSTRAINT recruiting_positions_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;


-- 3. The public read surface ---------------------------------------------------------------
--
-- Everything #/join needs about an open listing, and nothing else. In particular NOT
-- mentor_id, NOT max_mentees, and none of public.projects' other columns.
--
-- The WHERE is the whole gate: this view bypasses RLS on both underlying tables because it
-- runs as its owner. It is fixed and cannot be widened by the caller, and every row it can
-- return is already public by definition. Do not add a column to this view without asking
-- whether an anonymous visitor should see it.

DROP VIEW IF EXISTS public.recruiting_open_positions;

CREATE VIEW public.recruiting_open_positions AS
SELECT p.id,
       p.title,
       p.description,
       p.tasks,
       p.requirements,
       p.hours_per_week,
       p.min_block_hours,
       p.semesters_needed,
       p.outcome,
       p.cycle,
       pr.name                                   AS project_name,
       nullif(btrim(coalesce(pr.description, '')), '') AS project_blurb,
       pr.icon                                   AS project_icon
  FROM public.recruiting_positions p
  JOIN public.projects pr ON pr.id = p.project_id
 WHERE p.status = 'open'
   AND p.cycle = public.recruiting_open_cycle();

REVOKE ALL ON public.recruiting_open_positions FROM PUBLIC;
GRANT SELECT ON public.recruiting_open_positions TO anon, authenticated;


-- 4. Retire the second list ----------------------------------------------------------------
--
-- Its policies and grants go with it. Nothing references it after step 2.

DROP TABLE IF EXISTS public.recruiting_projects;
