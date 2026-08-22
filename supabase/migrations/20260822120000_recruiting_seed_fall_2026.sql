-- =====================================================================================
-- 2026-08-22  Undergraduate recruiting module: Fall 2026 seed (spec section 6).
--
-- STATUS: APPLIED LIVE 2026-08-22. All four mentor names resolved. Five projects and
-- five positions exist, each linked to a scheduler project.
--
-- NOTE: the cycle was subsequently OPENED by hand - opens_at 2026-08-22, closes_at
-- 2026-09-19, active = true - and all five listings moved from 'draft' to 'open', so
-- the dates and statuses live in the database no longer match the values below. This
-- file remains the record of what was seeded, not of the current state. Read the
-- database for that.
--
-- IDEMPOTENT, and idempotent in the way that matters: every insert is ON CONFLICT DO
-- NOTHING, never DO UPDATE. These rows are placeholders for the mentors to edit. A
-- re-run must not quietly overwrite a mentor's rewritten task list with the draft text
-- below, which is what DO UPDATE would do.
--
-- Everything lands as cycle 'fall-2026' with status 'draft', and the cycle itself is
-- created with active = false. Nothing here is publicly visible until a PI opens the
-- cycle and each mentor moves their own listing to 'open'. See RECRUITING.md.
--
-- MENTORS ARE RESOLVED BY NAME, as the spec asks, not by hard-coded id - so this file
-- stays correct if it is ever replayed against a rebuilt database. All four names were
-- confirmed against the live profiles table on 2026-08-22 and the ids seen then are
-- recorded beside each lookup purely as a cross-check. A name that does not resolve
-- raises and aborts the whole migration rather than seeding a listing with no owner.
--
-- NOTE ON ONE MENTOR: the spec describes mentor_id as "the graduate student who owns the
-- listing". Ava Gabrys, Tavis Goldwire and Suzanna Mickey hold role grad_student; LEE
-- NONNAMAKER HOLDS role postdoc. The listing is seeded to Lee as written - the column has
-- no role constraint and a postdoc mentoring an undergraduate is ordinary - but if the
-- intention was that only grad students appear as mentors, this is the row to revisit.
--
-- Rollback: the rows go with the tables in
-- supabase/rollback/20260822100000_recruiting_schema_down.sql. To remove just the seed,
-- see supabase/rollback/20260822120000_recruiting_seed_fall_2026_down.sql.
-- =====================================================================================

DO $$
DECLARE
  v_ava   uuid;  -- expected 905a9942-95b8-4a6e-885c-a7b92d352e61
  v_tavis uuid;  -- expected ab6c317b-489e-41ce-83e9-b9020de16c3d
  v_suz   uuid;  -- expected 0b5628d1-7a1a-4bc1-85a2-e7f4c94751f8
  v_lee   uuid;  -- expected ae7d8d1a-c1f6-467e-83f1-0980e836bff2
BEGIN
  SELECT id INTO v_ava   FROM public.profiles WHERE full_name = 'Ava Gabrys'      AND active;
  SELECT id INTO v_tavis FROM public.profiles WHERE full_name = 'Tavis Goldwire'  AND active;
  SELECT id INTO v_suz   FROM public.profiles WHERE full_name = 'Suzanna Mickey'  AND active;
  SELECT id INTO v_lee   FROM public.profiles WHERE full_name = 'Lee Nonnamaker'  AND active;

  IF v_ava   IS NULL THEN RAISE EXCEPTION 'Seed aborted: no active profile named "Ava Gabrys"'; END IF;
  IF v_tavis IS NULL THEN RAISE EXCEPTION 'Seed aborted: no active profile named "Tavis Goldwire"'; END IF;
  IF v_suz   IS NULL THEN RAISE EXCEPTION 'Seed aborted: no active profile named "Suzanna Mickey"'; END IF;
  IF v_lee   IS NULL THEN RAISE EXCEPTION 'Seed aborted: no active profile named "Lee Nonnamaker"'; END IF;

  -- 1. The cycle ----------------------------------------------------------------------
  --
  -- PLACEHOLDER DATES. Set the real window before opening the cycle; the #/join header
  -- prints these verbatim. active = false, so nothing is public yet.
  --
  -- The three policy numbers are the answer key for the four comprehension questions in
  -- spec section 5.4 as well as the text of the expectations list - one source, so the
  -- page and the grading cannot disagree. min_hours_per_week is set to 6 because that is
  -- the lowest weekly commitment among the five seeded listings; raise it if the lab has
  -- a firmer floor.
  INSERT INTO public.recruiting_cycles
    (cycle, label, opens_at, closes_at, active,
     min_hours_per_week, min_semesters, trial_weeks, pi_contact_email, intro_md, next_cycle_note)
  VALUES (
    'fall-2026', 'Fall 2026',
    '2026-08-24 09:00:00-04', '2026-09-14 23:59:00-04', false,
    6, 2, 4, 'duttonc@ufl.edu',
    'Undergraduate research in the Dutton Lab means joining a project that is already '
    || 'running and taking real responsibility for part of it. You will be trained on '
    || 'specific bench or computational skills, signed off on them, and then trusted to '
    || 'do that work on samples and data the lab depends on. It is a commitment across '
    || 'semesters rather than a single-term elective, and the people who get the most out '
    || 'of it treat it that way.',
    'Applications for the next cycle usually open a few weeks before the semester starts. '
    || 'If you would like to be told when that happens, email the PI.'
  )
  ON CONFLICT (cycle) DO NOTHING;

  -- 2. Projects -------------------------------------------------------------------------
  --
  -- The blurbs are written here rather than supplied by the spec, which named the projects
  -- but gave the one-sentence text only at position level. Each is the position's own
  -- description sentence, which is already written at the level section 2.1 asks for.
  --
  -- scheduler_project_id links each to the matching row in the scheduler's project list
  -- where one exists, resolved by name and left NULL if it does not, so a renamed
  -- scheduler project cannot abort the seed.
  INSERT INTO public.recruiting_projects (name, blurb, scheduler_project_id) VALUES
    ('Gorilla gut microbiome',
     'We are testing how the gut microbial community of gorillas at Disney''s Animal Kingdom is structured across individuals and over time.',
     (SELECT id FROM public.projects WHERE name = 'Disney Animal Kingdom')),
    ('Kenya water pans',
     'We are characterizing water chemistry and microbial communities in livestock water pans across the Mara ecosystem in Kenya.',
     (SELECT id FROM public.projects WHERE name = 'Kenya Water Pans')),
    ('Herbivore microbiome comparisons',
     'We are comparing gut microbial communities across bovids under managed care and white rhino middens from Kruger National Park.',
     (SELECT id FROM public.projects WHERE name = 'Rhino Middens')),
    ('Cedar Key dolphin respiratory microbiome',
     'We are sampling the blowhole microbiome of wild bottlenose dolphins along Florida''s Nature Coast to establish what a healthy respiratory community looks like.',
     (SELECT id FROM public.projects WHERE name = 'Dolphins')),
    ('Hippo microbiome and stream mesocosms',
     'We are studying how hippo gut microbes survive and function once they enter river water, using Kenya samples and artificial stream experiments.',
     (SELECT id FROM public.projects WHERE name = 'Hippo'))
  ON CONFLICT (name) DO NOTHING;

  -- 3. Positions ------------------------------------------------------------------------

  INSERT INTO public.recruiting_positions
    (project_id, mentor_id, title, description, tasks, requirements,
     hours_per_week, min_block_hours, semesters_needed, outcome, max_mentees, status, cycle)
  VALUES
    ((SELECT id FROM public.recruiting_projects WHERE name = 'Gorilla gut microbiome'), v_ava,
     'Sample processing assistant, gorilla gut microbiome',
     'We are testing how the gut microbial community of gorillas at Disney''s Animal Kingdom is structured across individuals and over time.',
     ARRAY['DNA extraction from fecal samples',
           'Sample logging and metadata entry',
           'Plate setup and PCR',
           'Freezer inventory',
           'Nanopore run prep'],
     ARRAY['BSC2010 and BSC2011',
           'Comfort handling animal fecal material',
           'EHS lab safety and BSL-2 training before bench work'],
     8, 3, 2,
     'Independent competence in extraction and library prep, and a poster at the Undergraduate Research Symposium in year two.',
     2, 'draft', 'fall-2026'),

    ((SELECT id FROM public.recruiting_projects WHERE name = 'Kenya water pans'), v_ava,
     'Data assistant, Kenya water pan chemistry',
     'We are characterizing water chemistry and microbial communities in livestock water pans across the Mara ecosystem in Kenya.',
     ARRAY['Sensor and water chemistry data cleaning in R',
           'QC against field sheets',
           'Figure drafting',
           'Literature screening'],
     ARRAY['One statistics course',
           'Some R exposure',
           'Willingness to work from a written data pipeline'],
     6, 3, 2,
     'A working R skill set and a named contribution to manuscript figures.',
     2, 'draft', 'fall-2026'),

    ((SELECT id FROM public.recruiting_projects WHERE name = 'Herbivore microbiome comparisons'), v_tavis,
     'Bioinformatics assistant, herbivore microbiome comparisons',
     'We are comparing gut microbial communities across bovids under managed care and white rhino middens from Kruger National Park.',
     ARRAY['Sequence file organization and metadata QC',
           'Running the lab 16S pipeline on HiPerGator',
           'Literature screening and reference management',
           'Figure drafting in R'],
     ARRAY['Genetics or equivalent',
           'Command line experience, or willingness to learn it in the first month',
           'One statistics course'],
     8, 3, 2,
     'HiPerGator and command line proficiency, and possible co-authorship for a sustained contribution.',
     2, 'draft', 'fall-2026'),

    ((SELECT id FROM public.recruiting_projects WHERE name = 'Cedar Key dolphin respiratory microbiome'), v_suz,
     'Field and lab assistant, dolphin respiratory microbiome',
     'We are sampling the blowhole microbiome of wild bottlenose dolphins along Florida''s Nature Coast to establish what a healthy respiratory community looks like.',
     ARRAY['Field day support at Cedar Key',
           'Sample logging',
           'DNA extraction',
           'Photo ID catalog matching'],
     ARRAY['BSC2010 and BSC2011',
           'Transportation or carpool',
           'Early morning and boat availability',
           'Animal contact occupational health clearance'],
     8, 3, 2,
     'Marine field experience, bench skills, and a poster in year two.',
     2, 'draft', 'fall-2026'),

    ((SELECT id FROM public.recruiting_projects WHERE name = 'Hippo microbiome and stream mesocosms'), v_lee,
     'Lab assistant, hippo microbiome and stream mesocosms',
     'We are studying how hippo gut microbes survive and function once they enter river water, using Kenya samples and artificial stream experiments.',
     ARRAY['Sample processing and extraction',
           'Mesocosm setup and maintenance',
           'Water chemistry sample prep',
           'Data entry and QC'],
     ARRAY['BSC2010 and BSC2011',
           'General chemistry lab',
           'Comfort with animal-derived samples',
           'EHS lab safety training'],
     10, 3, 2,
     'Experimental setup and bench skills, a poster, and a possible honors thesis question.',
     2, 'draft', 'fall-2026')
  ON CONFLICT (cycle, mentor_id, title) DO NOTHING;

  RAISE NOTICE 'Recruiting seed complete: % cycle, % projects, % positions.',
    (SELECT count(*) FROM public.recruiting_cycles    WHERE cycle = 'fall-2026'),
    (SELECT count(*) FROM public.recruiting_projects),
    (SELECT count(*) FROM public.recruiting_positions WHERE cycle = 'fall-2026');
END $$;
