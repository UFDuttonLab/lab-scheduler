-- =============================================================================
-- Audit fixes, 2026-07-25
--
-- This migration has ALREADY been applied to the live database. It is written
-- idempotently (DROP ... IF EXISTS / CREATE OR REPLACE) so re-running it is safe.
--
-- Context: the UI gated actions on src/lib/permissions.ts while Postgres gated the
-- actual writes, and the two had drifted. Because PostgREST returns error:null when
-- RLS filters an UPDATE/DELETE to zero rows, every disagreement surfaced as a success
-- toast over a write that did nothing.
-- =============================================================================


-- 1. Let a user read their OWN profile row even when deactivated ---------------
--
-- Migration 20251003101759 dropped the `auth.uid() = id` self-read policy, leaving only
-- "active = true" and "pi/manager". A deactivated grad student therefore could not read
-- their own row at all, so AuthContext.checkUserRole() got PGRST116, jumped to its catch
-- block, and never ran the deactivation check - deactivated accounts stayed logged in
-- indefinitely with full read access.

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);


-- 2. Let PI/manager update any profile ----------------------------------------
--
-- The only UPDATE policy was `auth.uid() = id`, so a PI correcting a student's misspelled
-- name matched zero rows, got no error, showed "User updated successfully", and then
-- visibly snapped back to the old name on the next fetch.

DROP POLICY IF EXISTS "PI and managers can update any profile" ON public.profiles;
CREATE POLICY "PI and managers can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]));


-- 3. Stop users editing their own `active` flag or email ----------------------
--
-- profiles UPDATE is `auth.uid() = id` with no column restriction, so a user could
-- reactivate themselves with update({active: true}) or rewrite their email out of sync
-- with auth.users. A WITH CHECK cannot compare against the OLD row, so this is a trigger.
-- Edge functions connect as service_role and are unaffected.

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user = 'service_role'
     OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]) THEN
    RETURN NEW;
  END IF;
  NEW.active := OLD.active;
  NEW.email  := OLD.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns_trigger ON public.profiles;
CREATE TRIGGER protect_profile_columns_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();


-- 4. Server-side double-booking and HiPerGator capacity enforcement -----------
--
-- Conflict detection lived only in the browser, checked against a `bookings` array
-- fetched on mount. Two students booking the same instrument at the same moment both
-- passed and both inserted; a tab left open all afternoon checked stale state.
--
-- A trigger rather than an EXCLUDE constraint, deliberately:
--   * HiPerGator is intentionally shared, so a blanket exclusion is wrong for it;
--     it needs a CPU/GPU capacity check instead.
--   * Three overlapping pairs already exist in production (two genuine Oct-2025
--     double-bookings on Robin and the Denovix, plus one legitimate HiPerGator
--     overlap). EXCLUDE does not support NOT VALID, so a constraint could not be
--     created without editing that history. A BEFORE trigger only validates rows
--     being written and leaves the past alone.
--
-- Note: editing one of those historical overlapping rows will now be rejected. That is
-- intentional - it forces the conflict to be resolved at the point someone touches it.

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
  -- A cancelled booking has released its slot and never conflicts.
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'Booking end time must be after its start time';
  END IF;

  SELECT type, COALESCE(max_cpu_count, 32), COALESCE(max_gpu_count, 2)
    INTO v_type, v_max_cpu, v_max_gpu
  FROM public.equipment WHERE id = NEW.equipment_id;

  IF v_type = 'HiPerGator' THEN
    -- Shared resource: overlapping bookings are fine until capacity runs out.
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
    -- Exclusive resource: any overlap is a conflict. Note tstzrange is half-open, so
    -- back-to-back bookings that merely touch endpoints do NOT collide.
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


-- 5. Backstop constraint and supporting indexes -------------------------------
--
-- usage_records already had valid_time_range; bookings did not, so a booking ending
-- before it started was storable.

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_valid_time_range;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_valid_time_range CHECK (end_time > start_time);

-- The conflict trigger range-scans by equipment on every write, and every calendar view
-- filters by equipment and date. Neither had an index.
CREATE INDEX IF NOT EXISTS idx_bookings_equipment_start ON public.bookings(equipment_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id        ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status         ON public.bookings(status);


-- =============================================================================
-- Deliberately NOT changed, for the record:
--
--   * bookings DELETE stays PI-only. Everyone else now cancels instead (status =
--     'cancelled'), which the existing UPDATE policy already permits and which keeps
--     the record for usage stats.
--   * The two historical Oct-2025 overlaps on Robin and the Denovix are left in place.
--   * bookings.gpu_count stays capped at 2, matching the HiPerGator row's
--     max_gpu_count = 2. The client defaults of 4 and 8 were the bug, not the CHECK.
-- =============================================================================
