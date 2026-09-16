-- =====================================================================================
-- 2026-09-16  Booking helpers: a helper's own note on their sign-up.
--
-- STATUS: APPLIED LIVE 2026-09-16 via the Lovable connector. Verified by catalog query: column,
-- CHECK constraint, column-level UPDATE(note) grant to authenticated, UPDATE policy. An
-- 18-case role-switching probe (supabase/tests/booking_helpers_note_probe.sql) passed inside a
-- DO block that raised at the end, so every fixture was rolled back (checked afterwards).
--
-- WHAT.
--
-- A helper can attach a short free-text note to their sign-up, e.g. "can only stay until
-- 11:00". The note is set when signing up and can be edited afterwards by that helper only.
--
-- booking_helpers had no UPDATE grant at all (20260905100000). This adds a column-level
-- UPDATE grant on `note` alone, so booking_id, user_id and created_at stay immutable, and an
-- UPDATE policy limited to your own row on a booking that is still open.
--
-- The deployed bundle selects named columns and inserts (booking_id, user_id) only, so the
-- new nullable column does not affect it.
--
-- Rollback: supabase/rollback/20260916100000_booking_helpers_note_down.sql
-- =====================================================================================

ALTER TABLE public.booking_helpers
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.booking_helpers
  DROP CONSTRAINT IF EXISTS booking_helpers_note_length;
ALTER TABLE public.booking_helpers
  ADD CONSTRAINT booking_helpers_note_length
  CHECK (note IS NULL OR char_length(note) <= 200);

COMMENT ON COLUMN public.booking_helpers.note IS
  'Helper''s own note on the sign-up, e.g. "can only stay until 11:00". Max 200 characters.';

-- Table-level SELECT and INSERT (already granted) cover the new column. UPDATE is granted on
-- `note` only.
GRANT UPDATE (note) ON TABLE public.booking_helpers TO authenticated;

-- Edit the note on your own sign-up while the booking is flagged, not cancelled and not
-- finished (same booking conditions as the INSERT policy, minus the not-the-owner test,
-- which the INSERT policy already enforced for this row).
DROP POLICY IF EXISTS "Helpers can edit their own note" ON public.booking_helpers;
CREATE POLICY "Helpers can edit their own note"
  ON public.booking_helpers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
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
    )
  );
