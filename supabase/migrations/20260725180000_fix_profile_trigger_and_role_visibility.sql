-- =============================================================================
-- Follow-up to 20260725120000. Already applied to the live database; written
-- idempotently so re-running is safe.
--
-- Both changes fix regressions introduced by that earlier migration.
-- =============================================================================


-- 1. protect_profile_columns must NOT be SECURITY DEFINER ---------------------
--
-- Inside a SECURITY DEFINER function, current_user is the function OWNER (verified
-- empirically on this database: it reports `postgres`, not the SET ROLE'd caller). So
-- the `current_user = 'service_role'` escape hatch could never fire. The second arm
-- failed too, because a service-role JWT has no `sub`, making auth.uid() NULL and
-- has_any_role(NULL, ...) false.
--
-- Net effect of the bug: the trigger reverted active/email on EVERY update, including
-- the manage-users edge function's deactivate and reactivate actions. PostgREST still
-- reported one row updated, so the UI showed "User deactivated successfully" while
-- profiles.active stayed true. Deactivation was silently a no-op.
--
-- As SECURITY INVOKER, current_user correctly reports the caller. has_any_role() is
-- itself SECURITY DEFINER, so the role lookup still works. The privileged roles are
-- listed explicitly so a PI can still repair `active` by hand from the SQL editor -
-- otherwise the trigger would revert direct admin SQL too.
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin', 'supabase_auth_admin')
     OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]) THEN
    RETURN NEW;
  END IF;
  NEW.active := OLD.active;
  NEW.email  := OLD.email;
  RETURN NEW;
END;
$$;

-- Verified against the live database, all in a rolled-back transaction:
--   service_role deactivate .......... PASS
--   service_role reactivate .......... PASS
--   user self-reactivate BLOCKED ..... PASS
--   user email-rewrite BLOCKED ....... PASS
--   user can still edit full_name .... PASS
--   PI can change active ............. PASS


-- 2. Managers must be able to read roles they are allowed to change -----------
--
-- The manage-users edge function authorizes both pi and manager for updateRole, but the
-- user_roles SELECT policy was `own rows OR pi`. A manager therefore read back an empty
-- array for every other user. That is the root cause of the demote-everyone bug fixed in
-- Settings.tsx: currentRole came back undefined, the role dropdown defaulted to "user",
-- and saving a name change pushed role='user'. The client-side guard added alongside it
-- then greyed the dropdown out for managers entirely, trading a data-loss bug for a
-- silently disabled control. Fixing the policy addresses the actual cause.
DROP POLICY IF EXISTS "Users can view own roles and PI can view all" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles; PI and managers can view all" ON public.user_roles;
CREATE POLICY "Users can view own roles; PI and managers can view all"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
  );
