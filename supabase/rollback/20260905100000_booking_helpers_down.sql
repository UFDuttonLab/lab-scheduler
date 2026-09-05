-- Rollback for 20260905100000_booking_helpers.sql
-- Ship a frontend that no longer reads booking_helpers / helpers_wanted BEFORE running this;
-- the deployed bundle is a live client of the schema.
DROP TABLE IF EXISTS public.booking_helpers;
DROP INDEX IF EXISTS public.bookings_helpers_wanted_idx;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_helpers_note_length;
ALTER TABLE public.bookings
  DROP COLUMN IF EXISTS helpers_wanted,
  DROP COLUMN IF EXISTS helpers_note;
