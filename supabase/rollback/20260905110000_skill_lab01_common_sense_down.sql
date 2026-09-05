-- Rollback for 20260905110000_skill_lab01_common_sense.sql. Refuses if any sign-off exists.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.skill_signoffs WHERE skill_id = (SELECT id FROM public.skills WHERE code='LAB-01')) THEN
    RAISE EXCEPTION 'LAB-01 has sign-offs; disable it instead of deleting';
  END IF;
END $$;
DELETE FROM public.skill_track_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='LAB-01');
DELETE FROM public.skill_quiz_questions WHERE skill_id = (SELECT id FROM public.skills WHERE code='LAB-01');
DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='LAB-01');
DELETE FROM public.skills WHERE code='LAB-01';
DELETE FROM public.skill_categories WHERE code='LAB' AND NOT EXISTS (SELECT 1 FROM public.skills WHERE category_id = (SELECT id FROM public.skill_categories WHERE code='LAB'));
