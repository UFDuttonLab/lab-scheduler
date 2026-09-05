-- =====================================================================================
-- 2026-09-05  Booking helpers: lab members sign up to assist on a booking.
--
-- STATUS: APPLIED LIVE 2026-09-05 via the Lovable connector. Verified: columns, constraint, both
-- indexes, RLS on, grants (authenticated SELECT/INSERT/DELETE only; anon none), three
-- policies; and a 15-case role-switching probe (insert/delete/update/select as undergrad,
-- owner, PI, anon) passed inside a rolled-back transaction.
--
-- WHAT.
--
-- A booking owner can flag a booking as "helpers wanted" and leave a note about the work.
-- Any active lab member can then add their own name to that booking, and remove it again.
-- The owner (or an elevated role) can remove a helper. Undergrads scan the Help Wanted page
-- on Monday morning and sign up for the sessions they can make.
--
-- Two columns on bookings, one join table. The existing `collaborators` JSONB array stays
-- what it is (people the OWNER names when creating the booking); helpers are self-service
-- and need their own rows so a policy can say "you may only insert or delete your own".
--
-- Rollback: supabase/rollback/20260905100000_booking_helpers_down.sql
-- =====================================================================================


-- 1. Flag and note on the booking ----------------------------------------------------------

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS helpers_wanted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS helpers_note   text;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_helpers_note_length;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_helpers_note_length
  CHECK (helpers_note IS NULL OR char_length(helpers_note) <= 500);

COMMENT ON COLUMN public.bookings.helpers_wanted IS
  'Owner is asking for lab members to sign up and help during this booking (see booking_helpers).';
COMMENT ON COLUMN public.bookings.helpers_note IS
  'What the helpers will be doing, e.g. "plate setup and labelling, 2 people ideal".';

-- The Help Wanted page lists upcoming flagged bookings; keep that scan cheap.
CREATE INDEX IF NOT EXISTS bookings_helpers_wanted_idx
  ON public.bookings (start_time)
  WHERE helpers_wanted;


-- 2. The sign-up rows ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.booking_helpers (
  booking_id  uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (booking_id, user_id)
);

CREATE INDEX IF NOT EXISTS booking_helpers_user_id_idx ON public.booking_helpers (user_id);

COMMENT ON TABLE public.booking_helpers IS
  'One row per person who has signed up to help on a booking. Self-service: insert/delete your own row; the booking owner or an elevated role may remove anyone.';

ALTER TABLE public.booking_helpers ENABLE ROW LEVEL SECURITY;

-- ALTER DEFAULT PRIVILEGES hands anon and authenticated ALL on every new table in public.
-- anon has no business here at all; authenticated needs read, sign up, withdraw. No UPDATE:
-- a sign-up is created or removed, never edited.
REVOKE ALL ON TABLE public.booking_helpers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.booking_helpers TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view booking helpers" ON public.booking_helpers;
CREATE POLICY "Authenticated users can view booking helpers"
  ON public.booking_helpers
  FOR SELECT
  TO authenticated
  USING (true);

-- You may sign yourself up (only yourself), while active, on a booking that is flagged,
-- not cancelled, not yet finished, and not your own.
DROP POLICY IF EXISTS "Active users can sign up to help on flagged bookings" ON public.booking_helpers;
CREATE POLICY "Active users can sign up to help on flagged bookings"
  ON public.booking_helpers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_user(auth.uid())
    AND EXISTS (
      SELECT 1
        FROM public.bookings b
       WHERE b.id = booking_helpers.booking_id
         AND b.helpers_wanted
         AND b.status <> 'cancelled'
         AND b.end_time > now()
         AND b.user_id <> auth.uid()
    )
  );

-- Withdraw yourself; or, as the booking owner or an elevated role, remove anyone.
-- The elevated set mirrors the bookings UPDATE policy.
DROP POLICY IF EXISTS "Helpers can withdraw and owners can remove helpers" ON public.booking_helpers;
CREATE POLICY "Helpers can withdraw and owners can remove helpers"
  ON public.booking_helpers
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM public.bookings b
       WHERE b.id = booking_helpers.booking_id
         AND b.user_id = auth.uid()
    )
    OR public.has_any_role(
         auth.uid(),
         ARRAY['pi', 'postdoc', 'grad_student', 'manager']::public.app_role[]
       )
  );
