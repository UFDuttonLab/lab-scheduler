-- =====================================================================================
-- 2026-09-05  LAB-01 General Lab Common Sense: the things a new person is not told.
--
-- STATUS: APPLIED LIVE 2026-09-05 via the Lovable connector. Verified: instructions_md md5
-- matches this file byte for byte, 6 checklist items (3 critical), 7 questions with 7 keys
-- each pointing at the intended option (keys b a b c b d a), LAB-01 first in track T1.
--
-- Requested by the PI: a skill that covers shutting down equipment you ran, putting reagents
-- and samples back where they live, cleaning up after yourself, waste, and telling someone
-- when something is low or broken. Reading + quiz + a short practical checklist that a
-- trainer confirms after watching the person finish a real session.
--
-- New category LAB (sort_order 5, so it lists first). One skill. Added to track T1 (Lab
-- Entry - Week 1) at sort_order 0 so it is the first thing a new person sees.
--
-- Idempotent: the skill's questions and checklist are deleted and re-inserted, keyed by
-- skill code, so re-running converges. Answer rows go with the questions via CASCADE.
--
-- Rollback: supabase/rollback/20260905110000_skill_lab01_common_sense_down.sql
-- =====================================================================================

INSERT INTO public.skill_categories (code, name, description, icon, sort_order)
VALUES ('LAB', 'General Lab Practice', 'How the lab is left when you finish: equipment, reagents, bench, waste, communication.', '🧹', 5)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO public.skills (category_id, code, name, summary, instructions_md, reading_refs, requires_reading, requires_practical, est_train_minutes, recert_months, risk_level, sort_order, active)
SELECT c.id, 'LAB-01', 'General Lab Common Sense',
  'Leaving equipment, reagents, bench and shared spaces the way the next person needs them.',
  $md$
Nobody will tell you most of this, and everyone will notice when it is not done. Read it once, then it is a habit.

## 1. Before you start

- **Book the equipment** in the scheduler, even for a short session. A booking is how the next person knows the machine is taken and how the lab knows what gets used.
- **Check you have everything** before you open a kit: enough tips, plates, tubes, reagent volume for the whole run. Stopping halfway to hunt for tips is how samples sit at room temperature.
- **If you do not know where something lives or how something works, ask.** Guessing costs more than asking.

## 2. While you work

- **Label everything you make** with contents, your initials and the date. An unlabelled tube is trash to everyone else.
- **Keep lids on** tubes, plates and reagent bottles when you are not pipetting from them. Open containers evaporate, get contaminated, and get knocked over.
- **Gloves stay at the bench.** Take them off before touching door handles, keyboards, phones, the fridge door, your face. If you must carry something through a door with gloves on, use one bare hand for the handle.
- **No food or drink** anywhere in the lab, including sealed bottles.
- **Enzymes and master mixes live on ice** while out, and go back to the freezer the moment you have added them. Never leave an enzyme on the bench "for a minute".
- **Never pour unused reagent back into the stock bottle.** Discard the excess.

## 3. When you finish: equipment

Everything you turned on, you turn off or return to the state you found it in.

- **Heat blocks, water baths, hot plates, shakers, vortexers, magnetic stirrers:** off.
- **Centrifuges:** rotor emptied, lid closed, any spill wiped out of the rotor bowl.
- **Thermocyclers and plate readers:** run finished, block empty, lid closed, instrument left as the machine's own skill says (some stay on, some go to standby).
- **Liquid handlers (Robin, Batman, Ethan, Alfred):** deck cleared of your labware and tips, waste chute emptied, lights and shutdown as the Flex or OT-2 skill describes.
- **Biological safety cabinet:** surface wiped, sash and UV as SAF-31 describes. Nothing of yours left inside.
- **Computers attached to instruments:** your data saved to the lab location, the software closed, you logged out. Do not leave a run window open for the next user to close.
- **Balances:** brushed clean, doors closed, tared to zero.
- **Ice buckets:** emptied into the sink, left upside down to dry.

If you are unsure whether something should stay on, ask. Do not leave it on because you are unsure.

## 4. When you finish: reagents and samples

- **Every reagent goes back to its storage temperature** (-80, -20, 4, room temperature) and to the box or shelf it came from, not the nearest empty space.
- **Samples go back into their labelled box** in the correct freezer, and the sample log or spreadsheet is updated the same day.
- **Kits stay together.** If a kit has components at two temperatures, both go back to the right place.
- **Running low means telling someone now.** If you open the last box of tips, the last plate, the last tube of a reagent, or notice a kit has one run left, write it on the lab's ordering list and tell the lab manager or PI. "I thought someone else would" is the most expensive sentence in a lab.
- **Something broken or not working right:** tell the PI or lab manager the same day, and put a note on the instrument so nobody else wastes a sample finding out.

## 5. When you finish: bench and shared spaces

- **Wipe your bench** with 70% ethanol. If DNA decontamination is needed, use 10% bleach followed by ethanol, **but never bleach anything that has touched guanidinium** (Zymo lysis and binding buffers): hypochlorite plus guanidinium thiocyanate releases cyanide gas. Guanidinium waste goes into the chemical waste container.
- **Consumables go into the right stream** (see SAF-16 and SAF-27): sharps into the sharps bin, biohazard into the red bag, chemical waste into the labelled container, plain plastic into the regular bin. Nothing liquid down the sink unless you know it is allowed.
- **Pipettes back on the rack**, set to their maximum volume is not required, but clean and in the right place is.
- **Shared items** (timers, racks, tube openers, the good scissors) go back where they came from.
- **Shared spaces** (ice machine, DI water, autoclave area, -80 room) left as you found them, and the -80 door open for as short a time as possible.

## 6. Leaving the lab

- Last person out: **gas and water off, equipment as above, lights off, door locked.**
- If you have a run going overnight, **your name and phone number on a note on the instrument**, and the PI knows.

## 7. Mistakes

Spilled a sample, dropped a plate, ran the wrong program, contaminated a stock? **Say so immediately.** Everyone has done it. Nobody is upset about the mistake; they are upset about finding out a week later from bad data. Clean up per the spill procedure (SAF-03 for biological material), then tell the PI or lab manager what happened and what was affected.
$md$,
  '[]'::jsonb, true, true, 20, NULL, 'standard', 1, true
FROM public.skill_categories c WHERE c.code = 'LAB'
ON CONFLICT (code) DO UPDATE SET
  category_id = EXCLUDED.category_id, name = EXCLUDED.name, summary = EXCLUDED.summary,
  instructions_md = EXCLUDED.instructions_md, requires_reading = EXCLUDED.requires_reading,
  requires_practical = EXCLUDED.requires_practical, est_train_minutes = EXCLUDED.est_train_minutes,
  risk_level = EXCLUDED.risk_level, sort_order = EXCLUDED.sort_order, active = EXCLUDED.active,
  instructions_version = public.skills.instructions_version + 1, updated_at = now();

-- Checklist: signed by a trainer after watching the person finish a real session.
DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'LAB-01');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical)
SELECT id, v.ord, v.txt, v.crit FROM public.skills, (VALUES
  (10, 'Turned off or returned to standby every instrument they used, cleared it of their labware, and logged out of its computer', true),
  (20, 'Returned every reagent and sample to the correct storage temperature and location, labelled with contents, initials and date', true),
  (30, 'Wiped the bench, put consumables into the correct waste streams, and did not bleach anything that had touched guanidinium', true),
  (40, 'Removed gloves before touching door handles, keyboards, phones or the fridge', false),
  (50, 'Reported a low-stock, broken, or not-quite-right item through the lab''s ordering list or to the lab manager/PI', false),
  (60, 'Left shared items and shared spaces (ice, BSC, centrifuge, DI water) as they found them', false)
) AS v(ord, txt, crit) WHERE code = 'LAB-01';

-- Quiz: 7 questions, pass at 80% (default), so one wrong is allowed.
DELETE FROM public.skill_quiz_questions WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'LAB-01');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You have finished using the heat block, which is still at 65 °C. Nobody has said they need it next. What do you do?',
    '[{"key":"a","text":"Leave it on so it is ready for whoever comes next"},{"key":"b","text":"Turn it off"},{"key":"c","text":"Lower it to 37 °C to save energy"},{"key":"d","text":"Unplug it from the wall"}]'::jsonb, false, true
  FROM public.skills WHERE code = 'LAB-01' RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b'], 'Everything you turned on, you turn off. Anyone who needs it next can turn it on in seconds.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You have just added polymerase to your master mix. Where does the enzyme tube go now?',
    '[{"key":"a","text":"Straight back to the -20 °C freezer"},{"key":"b","text":"On the bench until you have finished setting up the plate"},{"key":"c","text":"In the 4 °C fridge for the day"},{"key":"d","text":"In the ice bucket until the end of the session"}]'::jsonb, true, true
  FROM public.skills WHERE code = 'LAB-01' RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a'], 'Enzymes go back to the freezer the moment you have added them. On the bench, or even on ice for hours, they lose activity and the whole tube is affected.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You are cleaning up after a Zymo extraction. The tubes contained lysis and binding buffer (guanidinium). How do you deal with the waste and the bench?',
    '[{"key":"a","text":"Pour the liquid waste into a beaker of 10% bleach, then wipe the bench with bleach"},{"key":"b","text":"Liquid waste into the labelled chemical waste container; wipe the bench with 70% ethanol; no bleach on anything that touched guanidinium"},{"key":"c","text":"Liquid waste down the sink with plenty of water; bleach the bench"},{"key":"d","text":"Tubes into the biohazard bag; bench wiped with bleach then ethanol"}]'::jsonb, true, true
  FROM public.skills WHERE code = 'LAB-01' RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b'], 'Hypochlorite plus guanidinium thiocyanate releases cyanide gas. Guanidinium waste goes to chemical waste, and the bench gets ethanol, not bleach.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You open the last box of 200 µL filter tips. What do you do?',
    '[{"key":"a","text":"Nothing; someone will notice when the box is empty"},{"key":"b","text":"Order a case yourself from the supplier''s website"},{"key":"c","text":"Write it on the lab''s ordering list and tell the lab manager or PI"},{"key":"d","text":"Borrow a box from the lab next door and say nothing"}]'::jsonb, false, true
  FROM public.skills WHERE code = 'LAB-01' RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c'], 'Running low means telling someone now, through the ordering list and the person who orders. Ordering yourself or borrowing quietly both leave the lab not knowing.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You are wearing gloves and need to open the lab door to get a plate from the fridge in the hallway. What is correct?',
    '[{"key":"a","text":"Open the door with a gloved hand; the gloves are clean"},{"key":"b","text":"Take the gloves off before touching the door handle, or use one bare hand for the handle"},{"key":"c","text":"Use your elbow on the handle and keep both gloves on"},{"key":"d","text":"Put on a fresh pair of gloves first, then open the door"}]'::jsonb, false, true
  FROM public.skills WHERE code = 'LAB-01' RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b'], 'Gloves stay at the bench. Door handles, keyboards, phones and fridge doors are touched with bare hands so that whatever is on your gloves stays in the lab.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You drop a plate of extracted DNA on the floor and the seal comes off. Six wells are lost. What do you do?',
    '[{"key":"a","text":"Clean it up, re-extract those six samples quietly, and say nothing"},{"key":"b","text":"Clean it up and mention it at the next lab meeting"},{"key":"c","text":"Leave a note on the plate and let the PI find it"},{"key":"d","text":"Clean it up following the spill procedure, then tell the PI or lab manager the same day which samples were affected"}]'::jsonb, true, true
  FROM public.skills WHERE code = 'LAB-01' RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d'], 'Mistakes are reported immediately, with what was affected. Finding out later from bad data is the problem; the spill itself is not.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You made up 50 mL of buffer and used 30 mL. The stock bottle is right there. What happens to the remaining 20 mL?',
    '[{"key":"a","text":"Label it with contents, your initials and the date, and keep it for your own next use, or discard it; never return it to stock"},{"key":"b","text":"Pour it back into the stock bottle so nothing is wasted"},{"key":"c","text":"Leave it unlabelled on the bench for whoever needs buffer next"},{"key":"d","text":"Pour it into the nearest waste container regardless of what it is"}]'::jsonb, false, true
  FROM public.skills WHERE code = 'LAB-01' RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a'], 'Nothing goes back into a stock bottle: one contaminated aliquot would contaminate the whole stock. Label it and keep it, or discard it correctly.' FROM ins;

-- First item in the Week 1 track.
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order)
SELECT t.id, s.id, 0 FROM public.skill_tracks t, public.skills s WHERE t.code = 'T1' AND s.code = 'LAB-01'
ON CONFLICT DO NOTHING;
