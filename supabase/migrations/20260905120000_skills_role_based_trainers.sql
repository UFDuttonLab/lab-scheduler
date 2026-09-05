-- =====================================================================================
-- 2026-09-05  Graduate students and postdocs are trainers on every skill.
--
-- STATUS: APPLIED LIVE 2026-09-05 via the Lovable connector. Verified: has_function_privilege
-- (anon/PUBLIC false, authenticated/service_role true); grad_student and postdoc return true,
-- undergrad_student and pi_external false, for LAB-01.
--
-- PI's decision: "all graduate students can be trainers", confirmed to include postdocs,
-- with role alone sufficient (no read/quiz gate on the signer). Before this, signing
-- authority was per skill: only someone holding an unexpired `trainer` stage on that exact
-- skill (or a pi/manager) could sign, and with 0 sign-offs on record and 54 skills that meant
-- the PI personally minting a trainer for every skill before anyone could be signed off.
--
-- Per-skill trainer grants still work and are still what undergrads would need. Only
-- pi/manager may grant the `trainer` stage (can_grant_trainer is unchanged), and only
-- pi/manager may revoke or waive a quiz.
--
-- Privileges are restated because CREATE OR REPLACE keeps existing grants but a fresh
-- replay would leave PUBLIC with EXECUTE via default privileges. This function is called
-- from an RLS policy, so `authenticated` must keep EXECUTE.
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.can_sign_off_skill(_signer uuid, _skill_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_any_role(_signer, ARRAY['pi','manager','postdoc','grad_student']::app_role[])
      OR EXISTS (SELECT 1 FROM public.user_skills us JOIN public.profiles p ON p.id = us.user_id
                  WHERE us.user_id=_signer AND us.skill_id=_skill_id AND us.stage='trainer'
                    AND (us.expires_at IS NULL OR us.expires_at > now()) AND p.active = true)
$$;

REVOKE ALL ON FUNCTION public.can_sign_off_skill(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_sign_off_skill(uuid, uuid) TO authenticated, service_role;
