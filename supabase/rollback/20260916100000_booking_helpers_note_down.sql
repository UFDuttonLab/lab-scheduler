-- Rollback for 20260916100000_booking_helpers_note.sql
-- Ship a frontend that no longer reads or writes booking_helpers.note BEFORE running this;
-- the deployed bundle is a live client of the schema.
DROP POLICY IF EXISTS "Helpers can edit their own note" ON public.booking_helpers;
REVOKE UPDATE (note) ON TABLE public.booking_helpers FROM authenticated;
ALTER TABLE public.booking_helpers DROP CONSTRAINT IF EXISTS booking_helpers_note_length;
ALTER TABLE public.booking_helpers DROP COLUMN IF EXISTS note;
