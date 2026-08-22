-- Reverses 20260822100000_recruiting_schema.sql, and with it the seed migration - the
-- seeded rows live in these tables and go with them.
--
-- DESTRUCTIVE: this deletes every submitted application. Export first:
--   \copy (SELECT row_to_json(a) FROM public.recruiting_applications a) TO 'applications.json'
--
-- Nothing outside this module is touched. public.projects loses no row; the FK from
-- recruiting_projects is dropped with its own table.

DROP TABLE IF EXISTS public.recruiting_reviews;
DROP TABLE IF EXISTS public.recruiting_application_positions;
DROP TABLE IF EXISTS public.recruiting_applications;
DROP TABLE IF EXISTS public.recruiting_positions;
DROP TABLE IF EXISTS public.recruiting_projects;
DROP TABLE IF EXISTS public.recruiting_cycles;

DROP FUNCTION IF EXISTS public.recruiting_submit_application(jsonb);
DROP FUNCTION IF EXISTS public.recruiting_can_review(uuid, uuid);
DROP FUNCTION IF EXISTS public.recruiting_open_cycle();
DROP FUNCTION IF EXISTS public.recruiting_availability_is_valid(jsonb);
DROP FUNCTION IF EXISTS public.recruiting_text_array_ok(text[], int, int);

-- public.handle_updated_at is NOT dropped: it is shared with profiles, skills,
-- skill_categories and skill_tracks and predates this module.
