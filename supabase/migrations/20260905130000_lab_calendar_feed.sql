-- =====================================================================================
-- 2026-09-05  Lab-wide calendar feed: one .ics anyone in the lab can subscribe to.
--
-- STATUS: APPLIED LIVE 2026-09-05 via the Lovable connector. Verified from a browser: 200
-- text/calendar with 7 events, every line <= 75 chars, CRLF, Cache-Control set; wrong or
-- missing key -> 403; anon cannot read the settings table, rotate, or call the helpers.
--
-- WHY THIS SHAPE.
--
-- Calendar apps (Google, Outlook, Apple) subscribe to a plain URL and re-fetch it on their
-- own schedule; they cannot send auth headers. Supabase already exposes Postgres functions
-- over PostgREST, and PostgREST 12 serves a function that returns the "*/*" media-type
-- domain as raw bytes with whatever Content-Type the function sets in `response.headers`.
-- Verified on this project on 2026-09-05 from a browser: Accept */*, text/html and
-- text/calendar all came back as text/calendar. So the feed is one SQL function, no edge
-- function and nothing to deploy.
--
-- URL:  <SUPABASE_URL>/rest/v1/rpc/lab_calendar_ics?key=<feed_key>&apikey=<publishable key>
--
-- ACCESS. The publishable key is public (it is in the site bundle). What keeps strangers
-- out is `feed_key`, a random string in calendar_feed_settings that pi/manager can rotate
-- from the app. Anyone with the full URL sees the lab schedule: machine, who booked, project
-- name, helpers. The free-text `purpose` is deliberately NOT included.
--
-- CONTENT. Bookings from 14 days ago to 120 days ahead, not cancelled. A multi-machine
-- session (shared booking_group_id) is ONE event listing every machine. Helpers are read
-- live on every fetch, so they appear in the event as people sign up. Times are UTC; the
-- calendar app renders them in the viewer's zone.
--
-- Rollback: supabase/rollback/20260905130000_lab_calendar_feed_down.sql
-- =====================================================================================

-- 1. Media-type domains PostgREST recognises ------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE t.typname = '*/*' AND n.nspname = 'public') THEN
    CREATE DOMAIN public."*/*" AS bytea;
  END IF;
END $$;

-- 2. Settings: the key and the switch -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_feed_settings (
  id          boolean PRIMARY KEY DEFAULT true CHECK (id),   -- single row
  feed_key    text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid
);
INSERT INTO public.calendar_feed_settings (id, feed_key)
VALUES (true, encode(extensions.gen_random_bytes(18), 'hex'))
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.calendar_feed_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.calendar_feed_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.calendar_feed_settings TO authenticated;

DROP POLICY IF EXISTS "Lab members can read the feed settings" ON public.calendar_feed_settings;
CREATE POLICY "Lab members can read the feed settings"
  ON public.calendar_feed_settings FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));

DROP POLICY IF EXISTS "PI and manager can rotate or disable the feed" ON public.calendar_feed_settings;
CREATE POLICY "PI and manager can rotate or disable the feed"
  ON public.calendar_feed_settings FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['pi','manager']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::public.app_role[]));

-- Rotate from the app without the client inventing the key.
CREATE OR REPLACE FUNCTION public.rotate_calendar_feed_key()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['pi','manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'Only a PI or lab manager can rotate the calendar feed key.' USING ERRCODE = '42501';
  END IF;
  v := encode(extensions.gen_random_bytes(18), 'hex');
  UPDATE public.calendar_feed_settings SET feed_key = v, updated_at = now(), updated_by = auth.uid() WHERE id;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.rotate_calendar_feed_key() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rotate_calendar_feed_key() TO authenticated;

-- 3. iCalendar helpers ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ics_escape(t text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT replace(replace(replace(replace(coalesce(t, ''), E'\\', E'\\\\'), ';', E'\\;'), ',', E'\\,'), E'\n', E'\\n');
$$;

-- RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + one space. Folding on
-- characters rather than octets keeps multibyte text intact; 60 chars stays under 75 octets
-- for anything the lab types.
CREATE OR REPLACE FUNCTION public.ics_fold(line text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE out text := ''; rest text := line;
BEGIN
  WHILE length(rest) > 60 LOOP
    out := out || substr(rest, 1, 60) || E'\r\n ';
    rest := substr(rest, 61);
  END LOOP;
  RETURN out || rest;
END $$;

CREATE OR REPLACE FUNCTION public.ics_stamp(t timestamptz)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT to_char(t AT TIME ZONE 'UTC', 'YYYYMMDD"T"HH24MISS"Z"');
$$;

REVOKE ALL ON FUNCTION public.ics_escape(text), public.ics_fold(text), public.ics_stamp(timestamptz) FROM PUBLIC, anon, authenticated;

-- 4. The feed --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lab_calendar_ics(key text DEFAULT NULL)
RETURNS public."*/*"
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ok boolean;
  v_body text;
  v_site constant text := 'https://ufduttonlab.github.io/lab-scheduler/';
BEGIN
  SELECT enabled AND key IS NOT NULL AND feed_key = key INTO v_ok FROM public.calendar_feed_settings WHERE id;
  IF NOT coalesce(v_ok, false) THEN
    -- PTnnn SQLSTATEs become that HTTP status in PostgREST.
    RAISE EXCEPTION 'Calendar feed: unknown key or feed disabled.' USING ERRCODE = 'PT403';
  END IF;

  PERFORM set_config('response.headers',
    '[{"Content-Type": "text/calendar; charset=utf-8"},'
    || '{"Content-Disposition": "inline; filename=\"dutton-lab.ics\""},'
    || '{"Cache-Control": "public, max-age=900"}]', true);

  WITH grp AS (
    SELECT coalesce(b.booking_group_id, b.id) AS gid,
           min(b.id::text) AS any_id,
           min(b.start_time) AS start_time,
           max(b.end_time) AS end_time,
           b.user_id,
           string_agg(DISTINCT e.name, ' + ' ORDER BY e.name) AS machines,
           bool_or(b.helpers_wanted) AS helpers_wanted,
           max(b.helpers_note) AS helpers_note,
           max(pr.name) AS project
      FROM public.bookings b
      JOIN public.equipment e ON e.id = b.equipment_id
      LEFT JOIN public.projects pr ON pr.id = b.project_id
     WHERE b.status <> 'cancelled'
       AND b.end_time > now() - interval '14 days'
       AND b.start_time < now() + interval '120 days'
     GROUP BY coalesce(b.booking_group_id, b.id), b.user_id
  ), ev AS (
    SELECT g.*,
           coalesce(p.full_name, p.email, 'Unknown') AS owner,
           (SELECT string_agg(coalesce(hp.full_name, hp.email), ', ' ORDER BY bh.created_at)
              FROM public.booking_helpers bh
              JOIN public.bookings b2 ON b2.id = bh.booking_id
              JOIN public.profiles hp ON hp.id = bh.user_id
             WHERE coalesce(b2.booking_group_id, b2.id) = g.gid) AS helpers
      FROM grp g
      LEFT JOIN public.profiles p ON p.id = g.user_id
  )
  SELECT string_agg(
           public.ics_fold('BEGIN:VEVENT') || E'\r\n' ||
           public.ics_fold('UID:booking-' || gid::text || '@ufduttonlab.github.io') || E'\r\n' ||
           public.ics_fold('DTSTAMP:' || public.ics_stamp(now())) || E'\r\n' ||
           public.ics_fold('DTSTART:' || public.ics_stamp(start_time)) || E'\r\n' ||
           public.ics_fold('DTEND:' || public.ics_stamp(end_time)) || E'\r\n' ||
           public.ics_fold('SUMMARY:' || public.ics_escape(
             machines || ': ' || owner || CASE WHEN helpers_wanted THEN ' (helpers wanted)' ELSE '' END)) || E'\r\n' ||
           public.ics_fold('DESCRIPTION:' || public.ics_escape(
             'Booked by ' || owner
             || CASE WHEN project IS NOT NULL THEN E'\nProject: ' || project ELSE '' END
             || CASE WHEN helpers_wanted THEN E'\nHelpers wanted' || CASE WHEN helpers_note IS NOT NULL THEN ': ' || helpers_note ELSE '' END ELSE '' END
             || CASE WHEN helpers IS NOT NULL THEN E'\nHelpers signed up: ' || helpers ELSE '' END
             || E'\n' || v_site || '#/schedule')) || E'\r\n' ||
           public.ics_fold('LOCATION:' || public.ics_escape('Dutton Lab, University of Florida')) || E'\r\n' ||
           public.ics_fold('URL:' || v_site || '#/schedule') || E'\r\n' ||
           'END:VEVENT',
           E'\r\n' ORDER BY start_time)
    INTO v_body
    FROM ev;

  RETURN convert_to(
    'BEGIN:VCALENDAR' || E'\r\n' ||
    'VERSION:2.0' || E'\r\n' ||
    'PRODID:-//Dutton Lab//Lab Scheduler//EN' || E'\r\n' ||
    'CALSCALE:GREGORIAN' || E'\r\n' ||
    'METHOD:PUBLISH' || E'\r\n' ||
    'X-WR-CALNAME:Dutton Lab Equipment' || E'\r\n' ||
    'X-WR-CALDESC:Dutton Lab equipment bookings and help-wanted sessions' || E'\r\n' ||
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H' || E'\r\n' ||
    'X-PUBLISHED-TTL:PT1H' || E'\r\n' ||
    coalesce(v_body || E'\r\n', '') ||
    'END:VCALENDAR' || E'\r\n', 'UTF8')::public."*/*";
END $$;

REVOKE ALL ON FUNCTION public.lab_calendar_ics(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lab_calendar_ics(text) TO anon, authenticated;

-- 5. Remove the probe used to verify the PostgREST behaviour --------------------------------
DROP FUNCTION IF EXISTS public.ics_probe();
DROP DOMAIN IF EXISTS public."text/calendar";

NOTIFY pgrst, 'reload schema';
