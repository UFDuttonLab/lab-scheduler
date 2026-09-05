-- Rollback for 20260905130000_lab_calendar_feed.sql. Ship a frontend without the feed card first.
DROP FUNCTION IF EXISTS public.lab_calendar_ics(text);
DROP FUNCTION IF EXISTS public.rotate_calendar_feed_key();
DROP FUNCTION IF EXISTS public.ics_escape(text);
DROP FUNCTION IF EXISTS public.ics_fold(text);
DROP FUNCTION IF EXISTS public.ics_stamp(timestamptz);
DROP TABLE IF EXISTS public.calendar_feed_settings;
DROP DOMAIN IF EXISTS public."*/*";
NOTIFY pgrst, 'reload schema';
