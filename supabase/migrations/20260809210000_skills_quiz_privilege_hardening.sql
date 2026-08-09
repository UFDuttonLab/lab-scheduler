-- =====================================================================================
-- 2026-08-09  Skills quiz: revoke the table privileges Supabase grants by default.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09.
--
-- WHY THIS EXISTS, and why the previous migration was wrong about itself.
--
-- 20260809200000 claims in its comments that INSERT and UPDATE on skill_quiz_attempts are
-- granted "to nobody", giving two independent barriers against a forged grade: no policy,
-- and no privilege. Only the first was true. That migration issues GRANTs but never a
-- REVOKE, and Supabase ships
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
-- so every new table in public arrives with ALL already granted to both roles. The GRANTs
-- were therefore no-ops and the privilege barrier never existed.
--
-- Checked on the live database immediately after applying it:
--     authenticated INSERT on skill_quiz_attempts .... true   (wanted false)
--     authenticated UPDATE on skill_quiz_attempts .... true   (wanted false)
--     anon          SELECT on skill_quiz_answers ..... true   (wanted false)
--     anon          INSERT on skill_quiz_attempts .... true   (wanted false)
--
-- Nothing was actually exploitable: RLS was doing its job, every policy on these tables is
-- `TO authenticated`, and there is no INSERT or UPDATE policy on the attempts ledger at
-- all, so anon matched no policy and authenticated was filtered to zero rows. The defect
-- was that the defence was one layer deep while the file said two.
--
-- HOW IT GOT PAST THE PROBE. The scratch Postgres used to test 20260809200000 had no
-- ALTER DEFAULT PRIVILEGES, so its new tables arrived with NO privileges, and the two
-- assertions
--     has_table_privilege('authenticated','public.skill_quiz_attempts','INSERT') = false
-- passed for the wrong reason: absence of a grant that production would have supplied.
-- A probe environment that differs from production in a security-relevant way will hand
-- you a false pass. The scratch schema now sets the same default privileges Supabase does,
-- so this class of mistake fails locally in future.
-- =====================================================================================


-- anon is the unauthenticated PostgREST role. The skills module is authenticated-only and
-- every policy on these tables is TO authenticated, so anon has no legitimate use for any
-- of them.
REVOKE ALL ON public.skill_quiz_questions FROM anon;
REVOKE ALL ON public.skill_quiz_answers   FROM anon;
REVOKE ALL ON public.skill_quiz_attempts  FROM anon;

-- The answer key: authenticated keeps table privileges, and the single PI/manager policy
-- is what filters it. Trainees get zero rows, as probed.
-- The attempts ledger: no role may INSERT or UPDATE it by any route. grade_skill_quiz() is
-- SECURITY DEFINER and runs as the owner, so revoking these does not affect grading.
REVOKE INSERT, UPDATE ON public.skill_quiz_attempts FROM authenticated;

-- Belt and braces: PUBIC grants would apply to every role including anon.
REVOKE ALL ON public.skill_quiz_questions FROM PUBLIC;
REVOKE ALL ON public.skill_quiz_answers   FROM PUBLIC;
REVOKE ALL ON public.skill_quiz_attempts  FROM PUBLIC;

-- Re-assert what authenticated legitimately needs, in case a PUBLIC revoke above removed
-- something it was relying on.
GRANT SELECT                         ON public.skill_quiz_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE         ON public.skill_quiz_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_quiz_answers   TO authenticated;
GRANT SELECT, DELETE                 ON public.skill_quiz_attempts  TO authenticated;

-- The view is security_invoker, so it enforces the attempts policy against the caller.
REVOKE ALL ON public.skill_quiz_status FROM anon, PUBLIC;
GRANT SELECT ON public.skill_quiz_status TO authenticated;
