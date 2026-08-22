-- Reverses 20260822120000_recruiting_seed_fall_2026.sql without dropping the module.
--
-- Refuses to run if any application has been filed against the cycle - deleting the
-- positions would take the ranked choices with them and orphan real submissions.
-- Every statement is qualified: Supabase preloads `safeupdate` into the authenticator
-- role, and an unqualified DELETE is rejected even inside a definer context.

DO $$
DECLARE v_apps int;
BEGIN
  SELECT count(*) INTO v_apps FROM public.recruiting_applications WHERE cycle = 'fall-2026';
  IF v_apps > 0 THEN
    RAISE EXCEPTION 'Refusing to unseed: % application(s) exist for cycle fall-2026. Archive them first.', v_apps;
  END IF;

  DELETE FROM public.recruiting_positions WHERE cycle = 'fall-2026';

  DELETE FROM public.recruiting_projects
   WHERE name IN ('Gorilla gut microbiome','Kenya water pans','Herbivore microbiome comparisons',
                  'Cedar Key dolphin respiratory microbiome','Hippo microbiome and stream mesocosms')
     AND NOT EXISTS (SELECT 1 FROM public.recruiting_positions p WHERE p.project_id = recruiting_projects.id);

  DELETE FROM public.recruiting_cycles WHERE cycle = 'fall-2026';
END $$;
