-- Reverses 20260822110000_recruiting_rls.sql. Run BEFORE the schema rollback.
--
-- Leaves the tables in place with RLS disabled, which is a state no one should ship -
-- with RLS off, the grants from the schema migration become the only gate and anon
-- regains SELECT on positions/projects/cycles unfiltered. Run the schema rollback
-- immediately after, or re-apply the RLS migration.

DROP POLICY IF EXISTS "Visitors can view the open cycle"                     ON public.recruiting_cycles;
DROP POLICY IF EXISTS "Lab members can view all cycles"                      ON public.recruiting_cycles;
DROP POLICY IF EXISTS "PI can manage cycles"                                 ON public.recruiting_cycles;

DROP POLICY IF EXISTS "Visitors can view active projects"                    ON public.recruiting_projects;
DROP POLICY IF EXISTS "Lab members can view all recruiting projects"         ON public.recruiting_projects;
DROP POLICY IF EXISTS "PI can manage recruiting projects"                    ON public.recruiting_projects;

DROP POLICY IF EXISTS "Visitors can view open positions"                     ON public.recruiting_positions;
DROP POLICY IF EXISTS "Lab members can view positions"                       ON public.recruiting_positions;
DROP POLICY IF EXISTS "Mentors can create their own positions"               ON public.recruiting_positions;
DROP POLICY IF EXISTS "Mentors can update their own positions"               ON public.recruiting_positions;
DROP POLICY IF EXISTS "Mentors can delete their own positions"               ON public.recruiting_positions;
DROP POLICY IF EXISTS "PI can manage any position"                           ON public.recruiting_positions;

DROP POLICY IF EXISTS "Reviewers can view applications ranked to their positions" ON public.recruiting_applications;
DROP POLICY IF EXISTS "Reviewers can set application status"                 ON public.recruiting_applications;
DROP POLICY IF EXISTS "PI can archive a closed cycle"                        ON public.recruiting_applications;

DROP POLICY IF EXISTS "Reviewers can view ranked choices"                    ON public.recruiting_application_positions;

DROP POLICY IF EXISTS "Reviewers can view their own reviews"                 ON public.recruiting_reviews;
DROP POLICY IF EXISTS "Reviewers can write their own reviews"                ON public.recruiting_reviews;
DROP POLICY IF EXISTS "Reviewers can revise their own reviews"               ON public.recruiting_reviews;
DROP POLICY IF EXISTS "Reviewers and the PI can delete a review"             ON public.recruiting_reviews;

ALTER TABLE public.recruiting_cycles                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_projects              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_positions             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_applications          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_application_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_reviews               DISABLE ROW LEVEL SECURITY;
