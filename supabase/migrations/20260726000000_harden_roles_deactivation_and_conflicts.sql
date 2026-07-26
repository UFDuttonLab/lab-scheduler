-- =============================================================================
-- Round 3 hardening. Already applied to the live database; written idempotently.
-- Each item below was verified against the live schema in a rolled-back transaction.
-- =============================================================================

-- 1. The conflict trigger did not actually prevent concurrent double-booking ----
-- A BEFORE trigger doing an unlocked SELECT under READ COMMITTED cannot see another
-- transaction's uncommitted INSERT, so two students clicking Book in the same second
-- both passed the check and both committed. An advisory lock keyed on equipment_id makes
-- check-then-insert atomic per machine without blocking bookings on other equipment.
--   Verified live: exclusive overlap rejected, exact duplicate rejected,
--                  HiPerGator overlap allowed within capacity, over-capacity rejected.
CREATE OR REPLACE FUNCTION public.check_booking_conflicts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_type     text;
  v_max_cpu  int;
  v_max_gpu  int;
  v_used_cpu int;
  v_used_gpu int;
  v_conflict record;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'Booking end time must be after its start time';
  END IF;

  -- Held to end of transaction; other bookings for this equipment queue behind it.
  PERFORM pg_advisory_xact_lock(hashtext('booking:' || NEW.equipment_id::text));

  SELECT type, COALESCE(max_cpu_count, 32), COALESCE(max_gpu_count, 2)
    INTO v_type, v_max_cpu, v_max_gpu
  FROM public.equipment WHERE id = NEW.equipment_id;

  IF v_type = 'HiPerGator' THEN
    SELECT COALESCE(SUM(COALESCE(cpu_count, 0)), 0),
           COALESCE(SUM(COALESCE(gpu_count, 0)), 0)
      INTO v_used_cpu, v_used_gpu
    FROM public.bookings
    WHERE equipment_id = NEW.equipment_id
      AND id IS DISTINCT FROM NEW.id
      AND status <> 'cancelled'
      AND tstzrange(start_time, end_time) && tstzrange(NEW.start_time, NEW.end_time);

    IF v_used_cpu + COALESCE(NEW.cpu_count, 0) > v_max_cpu THEN
      RAISE EXCEPTION 'Not enough CPUs free in that window: % of % already allocated', v_used_cpu, v_max_cpu;
    END IF;
    IF v_used_gpu + COALESCE(NEW.gpu_count, 0) > v_max_gpu THEN
      RAISE EXCEPTION 'Not enough GPUs free in that window: % of % already allocated', v_used_gpu, v_max_gpu;
    END IF;
  ELSE
    SELECT b.start_time, b.end_time INTO v_conflict
    FROM public.bookings b
    WHERE b.equipment_id = NEW.equipment_id
      AND b.id IS DISTINCT FROM NEW.id
      AND b.status <> 'cancelled'
      AND tstzrange(b.start_time, b.end_time) && tstzrange(NEW.start_time, NEW.end_time)
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'That equipment is already booked from % to %',
        to_char(v_conflict.start_time, 'Mon DD HH24:MI'),
        to_char(v_conflict.end_time,   'Mon DD HH24:MI');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_booking_conflicts_trigger ON public.bookings;
CREATE TRIGGER check_booking_conflicts_trigger
  BEFORE INSERT OR UPDATE OF equipment_id, start_time, end_time, status, cpu_count, gpu_count
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_booking_conflicts();

-- 2. profiles.active / email are now service-role only -------------------------
-- The previous version let pi/manager through, which meant the edge function's
-- self-lockout and last-PI guards could be bypassed with a plain PostgREST call.
-- It also silently REVERTED the column instead of failing, producing exactly the
-- "success toast, nothing happened" behaviour this audit exists to eliminate.
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin', 'supabase_auth_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.active IS DISTINCT FROM OLD.active THEN
    RAISE EXCEPTION 'profiles.active can only be changed through user management';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'profiles.email cannot be changed here';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Deactivation is now enforced by RLS, not just by the client ---------------
-- `active` was checked in exactly ONE policy (bookings INSERT) and once client-side in
-- AuthContext. A deactivated postdoc kept every elevated write permission until they
-- happened to reload. Folding the check into the two role helpers propagates it to every
-- policy that already calls them.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role = _role AND p.active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role = ANY(_roles) AND p.active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND active = true)
$$;

-- Owner-based write paths need it too: a deactivated student could still edit and cancel
-- their own bookings and usage records.
DROP POLICY IF EXISTS "Users can update their own bookings or PI/Post-Docs/Grad Studen" ON public.bookings;
DROP POLICY IF EXISTS "Active owners and elevated roles can update bookings" ON public.bookings;
CREATE POLICY "Active owners and elevated roles can update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND public.is_active_user(auth.uid()))
    OR public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager']::app_role[])
  );

DROP POLICY IF EXISTS "Users can update own usage records" ON public.usage_records;
DROP POLICY IF EXISTS "Active owners can update own usage records" ON public.usage_records;
CREATE POLICY "Active owners can update own usage records"
  ON public.usage_records FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_active_user(auth.uid()));

-- 4. Role changes are atomic, validated, and cannot strand the lab -------------
-- updateRole issued DELETE then INSERT as two PostgREST requests (two transactions),
-- never validated the role string, and ignored the DELETE's error - so a bad value wiped
-- a user's roles and left them unrepairable, since only a PI may write user_roles.
-- The last-PI guards lived only in the edge function and were bypassable via REST.
CREATE OR REPLACE FUNCTION public.set_user_role(_target uuid, _role app_role, _actor uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_active_pis int;
BEGIN
  IF _target = _actor THEN
    RAISE EXCEPTION 'You cannot change your own role. Ask another PI to do it.';
  END IF;
  IF _role <> 'pi' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _target AND role = 'pi') THEN
    SELECT count(*) INTO v_active_pis
    FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'pi' AND p.active = true;
    IF v_active_pis <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last active PI. Promote another PI first.';
    END IF;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_active(_target uuid, _active boolean, _actor uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_active_pis int;
BEGIN
  IF _target = _actor THEN
    RAISE EXCEPTION 'You cannot deactivate your own account.';
  END IF;
  IF _active = false AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _target AND role = 'pi') THEN
    SELECT count(*) INTO v_active_pis
    FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'pi' AND p.active = true;
    IF v_active_pis <= 1 THEN
      RAISE EXCEPTION 'Cannot deactivate the last active PI.';
    END IF;
  END IF;
  UPDATE public.profiles SET active = _active WHERE id = _target;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, app_role, uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_user_active(uuid, boolean, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, app_role, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_user_active(uuid, boolean, uuid) TO service_role;

-- Verified live, all in rolled-back transactions:
--   last PI cannot be demoted or deactivated ......... PASS
--   guard lifts once a second PI exists .............. PASS
--   self role change / self deactivation blocked ..... PASS
--   invalid role rejected AND roles left intact ...... PASS
--   legitimate role change leaves exactly one row .... PASS
--   deactivated PI loses has_role/has_any_role ....... PASS
--   reactivation restores access ..................... PASS
