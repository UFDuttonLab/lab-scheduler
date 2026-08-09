-- ---------------------------------------------------------------------------
-- Skills quiz content: 353 questions and their answer keys, covering all
-- 53 skills in public.skills.
--
-- WHERE THIS CAME FROM
-- This file was generated on 2026-08-09 by reading the content back out of the
-- live database, after the QC review pass had been applied. It therefore
-- reflects the corrected content as it actually stands in production, not the
-- content as it was originally authored. Where the review changed an answer key
-- or altered whether a question is flagged critical, the corrected value is what
-- you see below. Earlier scratch files and the original authoring migrations are
-- not authoritative and should not be used to reconstruct this content.
--
-- IDEMPOTENCY
-- This migration is safe to replay. Each skill's block begins by deleting that
-- skill's existing questions; the matching rows in public.skill_quiz_answers are
-- removed by the foreign key's ON DELETE CASCADE, so the answer keys go with
-- them. The questions are then re-inserted from scratch. Running the file twice
-- converges on the same 353 questions rather than duplicating them.
--
-- PORTABILITY
-- Questions are attached to their skill by looking up public.skills.code, never
-- by hard-coded uuid. The same file can therefore be applied to any environment
-- whose skills table carries the same set of skill codes, regardless of the
-- primary keys that environment happens to have generated.
--
-- DRIFT WARNING
-- Editing quiz content through the application writes to the database only. It
-- does not touch this file. Any such edit will make this migration stale, and
-- replaying a stale migration will silently revert the edit. If you change quiz
-- content in the app and want to keep it, regenerate this file from the live
-- database rather than hand-editing it.
-- ---------------------------------------------------------------------------

BEGIN;

-- ---------------------------------------------------------------------------
-- AEX-01 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'AEX-01');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'What is the order of stages in a MagBead extraction?', '[{"key":"a","text":"Bind, lyse, wash, elute, dry"},{"key":"b","text":"Lyse, wash, bind, dry, elute"},{"key":"c","text":"Lyse, bind, wash, dry, elute"},{"key":"d","text":"Lyse, bind, dry, wash, elute"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'AEX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The chemistry runs lyse, bind, wash, dry, elute. Washing must happen while the DNA is still bound, and drying comes after the last wash.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'A plate gives low yield and a community skewed toward Gram-negatives. Which stage most likely failed?', '[{"key":"a","text":"Lysis, because tough-walled cells never opened"},{"key":"b","text":"Binding, from the wrong alcohol concentration"},{"key":"c","text":"Washing, leaving chaotrope behind"},{"key":"d","text":"Elution, with too little buffer added"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'AEX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Incomplete lysis biases the community toward easy-to-lyse organisms, so Gram-negatives are over-represented relative to Gram-positives.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'An eluate reads A260/280 of 1.83 and A260/230 of 0.5. What is the likely cause?', '[{"key":"a","text":"Protein carryover from incomplete digestion"},{"key":"b","text":"RNA contamination inflating the 260 reading"},{"key":"c","text":"The sample was eluted in water rather than TE"},{"key":"d","text":"Insufficient washing, or an over-dried pellet"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'AEX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'A normal A260/280 with a low A260/230 points at residual chaotrope or ethanol, meaning the wash was insufficient or the pellet was over-dried.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Yield is low in every well of a plate, but community composition looks normal. Which failure fits best?', '[{"key":"a","text":"Poor binding from bad mixing or wrong alcohol"},{"key":"b","text":"Incomplete lysis in all wells at once"},{"key":"c","text":"Bead carryover into the eluate"},{"key":"d","text":"Over-drying of a handful of pellets"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'AEX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Poor binding gives low yield across the whole plate without a compositional signature; incomplete lysis would also skew the community.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Why must residual ethanol be removed before elution?', '[{"key":"a","text":"It dissolves the silica coating on the beads"},{"key":"b","text":"It inhibits every downstream enzyme"},{"key":"c","text":"It pushes A260/280 above 2.0"},{"key":"d","text":"It makes DNA bind the beads more tightly"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'AEX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Carried-over ethanol inhibits downstream enzymatic reactions, which is why the dry step exists at all.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'An eluate looks cloudy. What follows from that observation?', '[{"key":"a","text":"The DNA is degraded and the whole plate must be re-extracted"},{"key":"b","text":"Yield will be higher than expected"},{"key":"c","text":"Quantification will be wrong and enzymes may be inhibited"},{"key":"d","text":"The A260/280 will read below 1.7"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'AEX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Cloudiness is bead carryover, which distorts quantification and inhibits downstream enzymes.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Why not simply dry the beads longer than needed, to be safe?', '[{"key":"a","text":"The beads permanently lose their magnetism"},{"key":"b","text":"An over-dried pellet cracks and will not fully re-elute"},{"key":"c","text":"The DNA denatures into single strands"},{"key":"d","text":"Chaotrope crystallises onto the plate walls"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'AEX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Over-drying cracks the pellet, and a cracked pellet will not fully re-elute, so yield and A260/230 both drop.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-01 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-01');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You are aliquoting a master mix containing a lot of enzyme into eight tubes. Which technique, and why?', '[{"key":"a","text":"Forward pipetting, because master mix is not a viscous liquid"},{"key":"b","text":"Reverse pipetting, because it uses less master mix per tube"},{"key":"c","text":"Forward pipetting, because the blow-out step guarantees full delivery"},{"key":"d","text":"Reverse pipetting, because it removes blow-out variability between replicates"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Reverse pipetting is the method for master mixes: it removes the blow-out variability that shows up as inter-replicate scatter in qPCR.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You need to transfer 80 uL. A P1000 sits on the bench; a P200 is in the drawer. Which do you use?', '[{"key":"a","text":"The P1000, set carefully and pre-wetted twice"},{"key":"b","text":"The P200, because 80 uL sits better within its range"},{"key":"c","text":"Either one, because both cover 80 uL"},{"key":"d","text":"The P1000, since 80 uL is within its stated range"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A P1000 set to 80 uL is worse than a P200 at 80 uL. Pick the pipette whose range fits the volume, not the nearest one to hand.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'In reverse pipetting, where does the plunger stop on aspiration and on dispensing?', '[{"key":"a","text":"Aspirate and dispense both to the second stop"},{"key":"b","text":"Aspirate to the second stop; dispense only to the first stop"},{"key":"c","text":"Aspirate to the first stop; dispense to the first stop, then re-aspirate"},{"key":"d","text":"Aspirate to the first stop; dispense to the second stop"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Reverse pipetting aspirates past the target to the second stop and dispenses only to the first, leaving a residual that is discarded.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A trainee''s first draw with each new tip reads low; later draws with the same tip are fine. What did they skip?', '[{"key":"a","text":"Pre-wetting the fresh tip before the first measured draw"},{"key":"b","text":"Holding the pipette vertical during aspiration"},{"key":"c","text":"Pausing a beat before withdrawing the tip"},{"key":"d","text":"Blowing out to the second stop at the end of each dispense"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'An unwetted fresh tip makes the first draw short by a percent or two; pre-wetting conditions the tip so the first measured volume matches the rest.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Volumes are consistently a little short and you can see spray inside the tip. Which fault best explains this?', '[{"key":"a","text":"Using reverse pipetting for glycerol"},{"key":"b","text":"Pausing a beat before withdrawing the tip"},{"key":"c","text":"Immersing the tip 2-3 mm into the liquid"},{"key":"d","text":"Releasing the plunger too fast"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Fast plunger release is the single biggest cause of aerosol and short draws. Release slowly and pause before withdrawing.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You immerse the tip deep into the tube, well past 2-3 mm. What error does that introduce?', '[{"key":"a","text":"The plunger cannot reach the second stop"},{"key":"b","text":"Air is aspirated instead of liquid at the first stop"},{"key":"c","text":"The tip works loose from the barrel"},{"key":"d","text":"Liquid is dragged along on the outside of the tip"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Too deep drags liquid on the outside of the tip and adds volume; too shallow aspirates air. Immerse only 2-3 mm.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Readings drift over a long run with a small-volume pipette. Which named cause is under your control?', '[{"key":"a","text":"Tips from a different lot"},{"key":"b","text":"Using filter tips rather than plain tips"},{"key":"c","text":"Storing the pipette vertically between uses"},{"key":"d","text":"Warm hands on the pipette barrel"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Warm hands on the barrel of a small-volume pipette during a long run is listed as a quiet source of drift.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-02 — 7 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-02');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'How many measurements does a gravimetric verification require?', '[{"key":"a","text":"Five replicates at the low and nominal volumes"},{"key":"b","text":"Three replicates at each of ten volumes"},{"key":"c","text":"Ten replicates at each of three volumes"},{"key":"d","text":"Ten replicates at the nominal volume only"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The method calls for ten replicate dispenses at each of three volumes: nominal, mid, and low.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'For a P200, which three test volumes does the method call for?', '[{"key":"a","text":"100, 50 and 10 uL"},{"key":"b","text":"200, 100 and 20 uL"},{"key":"c","text":"200, 20 and 2 uL"},{"key":"d","text":"200, 150 and 100 uL"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Nominal is 100% of range (200 uL), mid is about 50% (100 uL), and low is 10% of range or the minimum (20 uL).' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Ten dispenses at a 100 uL setting give a mean measured volume of 98.2 uL. What is the systematic error?', '[{"key":"a","text":"-1.8%"},{"key":"b","text":"-18%"},{"key":"c","text":"-0.18%"},{"key":"d","text":"+1.8%"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Accuracy is mean measured minus nominal, as a percentage: (98.2 - 100) / 100 = -1.8%.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Those same ten dispenses have a mean of 99.4 uL and a standard deviation of 0.8 uL. What is the %CV?', '[{"key":"a","text":"0.08%"},{"key":"b","text":"0.80%"},{"key":"c","text":"8.0%"},{"key":"d","text":"1.25%"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], '%CV is standard deviation divided by mean, times 100: 0.8 / 99.4 x 100 = 0.80%.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Your P200 fails at its low volume, and it is the only P200 free today. What do you do?', '[{"key":"a","text":"Tag it, take it out of service, and log the result"},{"key":"b","text":"Note it in your own notebook and keep using it"},{"key":"c","text":"Use it carefully, at the top of its range only"},{"key":"d","text":"Re-run the check until it passes once"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'A failing pipette is tagged, removed from service and logged. An out-of-spec pipette quietly contaminates months of data.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why must you record the water temperature during the check?', '[{"key":"a","text":"To select the water density used to convert mass to volume"},{"key":"b","text":"To decide how many replicates are needed"},{"key":"c","text":"To choose between distilled and nuclease-free water for the check"},{"key":"d","text":"To prove the water had equilibrated on the balance"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Mass is converted to volume using the density of water at the recorded temperature, about 0.9982 g/mL at 20 C.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Under ISO 8655-style limits, why is working at the bottom of a pipette''s range a problem?', '[{"key":"a","text":"The limits do not apply below 10% of range"},{"key":"b","text":"A balance cannot resolve masses that small"},{"key":"c","text":"Tolerances tighten there, so the pipette always fails"},{"key":"d","text":"Tolerances widen there, so far more error is allowed"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Tolerances widen at the low end: a P200 at 20 uL is permitted far more error than at 200 uL, which is why you do not work there.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-03 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-03');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You dispense a column and one single well is visibly short. What is the most likely cause?', '[{"key":"a","text":"The plate having been rotated 180 degrees"},{"key":"b","text":"Failing to change tips between columns"},{"key":"c","text":"A tip that was not seated fully on its channel"},{"key":"d","text":"A reservoir that had run dry part way through the column"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'One loose tip gives you one short well, and it usually goes unnoticed until QC. Check visually that every tip is seated to the same depth.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You hold the multichannel tilted while aspirating from the reservoir. What happens?', '[{"key":"a","text":"Only the dispense step is affected"},{"key":"b","text":"The outer channels aspirate air or hit the bottom"},{"key":"c","text":"The tips seat more firmly on the barrels"},{"key":"d","text":"Every channel aspirates slightly more than it should"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'All tips must reach the same depth; tilting makes the outer channels either draw air or bottom out.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'When do you confirm A1 orientation against the plate map?', '[{"key":"a","text":"At the end, when the plate is sealed"},{"key":"b","text":"Out loud, before dispensing anything into the plate"},{"key":"c","text":"Only for plates that have no printed A1 marker or notch"},{"key":"d","text":"After the first column, using the fill pattern"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A1 is confirmed out loud, every plate, every time, against the notch or printed marker before anything is dispensed.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A plate was run 180 degrees rotated, and the samples have since been pooled. What is the situation?', '[{"key":"a","text":"Recoverable by re-running the plate on the TapeStation"},{"key":"b","text":"Harmless, since every well received the same reagent"},{"key":"c","text":"Recoverable by reversing the plate map during analysis"},{"key":"d","text":"Unrecoverable, and it can look like a biological result"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'A 180-degree rotation is unrecoverable once samples are pooled, and the artefact reads as a biological result.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You are adding master mix to wells that already contain sample. Where do you dispense it?', '[{"key":"a","text":"Against the well wall above the liquid"},{"key":"b","text":"Onto the well bottom, underneath the sample"},{"key":"c","text":"Into the liquid, then mix by pipetting up and down"},{"key":"d","text":"Against the well wall, just touching the liquid surface"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Dispensing against the wall above the liquid keeps the tip out of the sample, so no sample is carried back into the master mix.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The protocol says nothing about tips. What is the default when moving between columns?', '[{"key":"a","text":"Rinse the tips in buffer between columns"},{"key":"b","text":"Change tips between columns"},{"key":"c","text":"Keep the same tips to reduce plastic waste"},{"key":"d","text":"Change tips only after the final column"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Tips are changed between columns unless the protocol explicitly says otherwise; carryover between columns is a real contamination route.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'How much reagent do you put into the multichannel reservoir?', '[{"key":"a","text":"The plate''s requirement, topping up part way through"},{"key":"b","text":"The plate''s requirement plus dead volume and overage"},{"key":"c","text":"Exactly the volume the plate requires"},{"key":"d","text":"A full reservoir, whatever the plate needs"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Reservoirs have dead volume that cannot be reached; running one dry mid-plate is a common cause of partial plate failure.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-07 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-07');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Your written dilution plan needs a 0.5 uL transfer at one step. What do you do?', '[{"key":"a","text":"Redesign that step using larger intermediate volumes"},{"key":"b","text":"Accept it, since errors average out across the series"},{"key":"c","text":"Pipette 0.5 uL twice and average the error"},{"key":"d","text":"Use the smallest pipette available and go slowly"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'No step should require a volume below your pipette''s reliable range; scale the step up rather than pipetting 0.5 uL.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Why change tips at every step of a 10-fold series?', '[{"key":"a","text":"Liquid on the outside of the tip carries concentrate forward"},{"key":"b","text":"Tips warm up during handling and change the volume they hold"},{"key":"c","text":"A used tip can no longer be pre-wetted"},{"key":"d","text":"Tips lose their filter after a single use"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Carryover on the outside of the tip is a real error source in a 10-fold series, so tips change at every step.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'How do you mix each dilution before drawing the next aliquot?', '[{"key":"a","text":"Flick the tube gently a few times before drawing"},{"key":"b","text":"Invert the tube twice and proceed immediately"},{"key":"c","text":"Let it stand for five minutes so the tube contents equilibrate"},{"key":"d","text":"Pipette up and down 8-10 times, or vortex and spin down"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Complete mixing at every step is required; incomplete mixing at step 1 propagates through the whole curve.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Your qPCR standard curve comes back with a poor R squared. Which execution error is blamed first?', '[{"key":"a","text":"Labelling the tubes after setting up"},{"key":"b","text":"Using one tube rack for all the standards"},{"key":"c","text":"Incomplete mixing early in the series"},{"key":"d","text":"Preparing the series at room temperature"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Incomplete mixing at step 1 propagates through the whole curve and shows up as a bad R squared.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Adjacent standards in your 10-fold series sit about 3.3 cycles apart. What does that tell you?', '[{"key":"a","text":"Amplification efficiency is about 33%"},{"key":"b","text":"The standards were cross-contaminated during setup"},{"key":"c","text":"The series was accidentally made 2-fold instead of 10-fold"},{"key":"d","text":"The series behaves as expected, near 100% efficiency"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'A 10-fold series gives roughly 3.32 cycles per step at 100% efficiency, so 3.3 is the expected spacing.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why set the series up working from most dilute to most concentrated?', '[{"key":"a","text":"It saves the concentrated stock until last"},{"key":"b","text":"Dilute solutions mix faster than concentrated ones"},{"key":"c","text":"A splash then travels in the harmless direction"},{"key":"d","text":"It keeps the tips cleaner for longer"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Working dilute to concentrated means an accidental splash goes the harmless way, rather than spiking a dilute tube.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You have finished the series. How do you show it is right?', '[{"key":"a","text":"Compare the tube volumes by eye"},{"key":"b","text":"Trust the arithmetic, since the plan was written and checked first"},{"key":"c","text":"Re-quantify at least the endpoints, or check the curve slope"},{"key":"d","text":"Re-read the most concentrated tube twice"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'A dilution series you cannot verify is a guess: re-quantify the endpoints or check the standard curve slope.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-10 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-10');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You need 50 mL of 10 mM Tris from a 1 M stock. How much stock do you take?', '[{"key":"a","text":"0.05 mL"},{"key":"b","text":"1 mL"},{"key":"c","text":"0.5 mL"},{"key":"d","text":"5 mL"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'C1V1 = C2V2: (10 mM x 50 mL) / 1000 mM = 0.5 mL of stock, made up to 50 mL.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'How much NaCl (formula weight 58.44 g/mol) do you weigh for 250 mL of 1 M NaCl?', '[{"key":"a","text":"14.61 g"},{"key":"b","text":"58.44 g"},{"key":"c","text":"29.22 g"},{"key":"d","text":"5.84 g"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Mass = molarity x volume x formula weight = 1 mol/L x 0.25 L x 58.44 g/mol = 14.61 g.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'The recipe calls for a pH adjustment. When do you do it?', '[{"key":"a","text":"Before topping up, because adjusting changes the volume"},{"key":"b","text":"Before dissolving the solids"},{"key":"c","text":"After bringing to final volume, then re-check the reading"},{"key":"d","text":"At any point, since pH does not affect volume"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'pH is adjusted before topping up, because adding acid or base changes the volume.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You have dissolved the solids in about 80% of the final volume and adjusted pH. What next?', '[{"key":"a","text":"Leave it; 80% of volume is close enough"},{"key":"b","text":"Pipette the remaining water into the beaker"},{"key":"c","text":"Bring to final volume in a volumetric flask"},{"key":"d","text":"Bring to final volume in a graduated beaker"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Final volume is made up in a volumetric flask, which is the only vessel accurate enough for the stated concentration.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Which water do you use for a buffer that will touch a nanopore library?', '[{"key":"a","text":"Autoclaved deionised water"},{"key":"b","text":"Nuclease-free water, aliquoted"},{"key":"c","text":"Deionised water from the bench system"},{"key":"d","text":"Molecular-biology-grade water from the shared bottle"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Anything touching RNA or a sequencing library uses nuclease-free water, aliquoted so the stock never sees a used tip.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'What must the label on a buffer you prepared carry?', '[{"key":"a","text":"Contents, concentration, date, initials and expiry"},{"key":"b","text":"Contents and date only"},{"key":"c","text":"Contents, concentration and the source of the recipe used"},{"key":"d","text":"Contents, your initials and the lot number"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Every prepared reagent is labelled with contents, concentration, date prepared, initials and an expiry.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You find an unlabelled bottle of clear solution in the buffer cupboard. What do you do?', '[{"key":"a","text":"Use it only for non-critical rinses"},{"key":"b","text":"Discard it, because it cannot be trusted"},{"key":"c","text":"Label it as unknown and keep it for washing"},{"key":"d","text":"Check its pH to work out what it is"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'An unlabelled bottle is waste: it cannot be trusted and must be discarded.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-12 — 6 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-12');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Why must the 80% ethanol be made on the day you use it?', '[{"key":"a","text":"Ethanol absorbs water from the air and drifts weaker"},{"key":"b","text":"Diluted ethanol grows bacteria in the bottle overnight"},{"key":"c","text":"Ethanol evaporates and the bottle runs low"},{"key":"d","text":"Nuclease-free water degrades within a day"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Ethanol is hygroscopic; an open bottle of 80% absorbs atmospheric water and drifts down over days.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Your wash ethanol has drifted to about 68%. What happens on the beads?', '[{"key":"a","text":"DNA re-dissolves and is lost with the supernatant"},{"key":"b","text":"DNA binds even more tightly and will not elute later"},{"key":"c","text":"Nothing, because 68% and 80% behave the same"},{"key":"d","text":"Beads clump and no pellet forms"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Below roughly 70% the DNA comes back off the beads and washes away with the supernatant.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'What do you prepare the 80% ethanol from?', '[{"key":"a","text":"Absolute ethanol and TE buffer"},{"key":"b","text":"Absolute ethanol and nuclease-free water"},{"key":"c","text":"Yesterday''s 80%, topped up with absolute ethanol"},{"key":"d","text":"95% ethanol and deionised water"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'It is made fresh from absolute ethanol and nuclease-free water.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You are about to clean up a plate of samples. How much 80% ethanol do you make?', '[{"key":"a","text":"Enough for one wash per sample"},{"key":"b","text":"A fixed 50 mL, whatever the plate size"},{"key":"c","text":"Whatever is left over in yesterday''s ethanol bottle"},{"key":"d","text":"Enough for two washes per sample plus overage"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Size it for two washes per sample plus overage, so you never run out part way through a plate.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You run out of 80% ethanol halfway through the plate. What is the right move?', '[{"key":"a","text":"Make fresh 80% and carry on"},{"key":"b","text":"Finish the remaining wells with absolute ethanol"},{"key":"c","text":"Finish the remaining wells with nuclease-free water"},{"key":"d","text":"Top up from yesterday''s labelled 80% bottle"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Topping up from an old bottle is exactly the failure this skill exists to prevent; make fresh 80% instead.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The bead pellet has gone cracked and chalky before you add elution buffer. What follows?', '[{"key":"a","text":"Residual ethanol will inhibit the next enzyme step"},{"key":"b","text":"It will not fully re-elute, giving a bad A260/230"},{"key":"c","text":"Nothing, since dryness only matters during the wash"},{"key":"d","text":"It re-elutes faster because it is fully dry"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Air-dry only until the pellet loses its sheen; cracked, chalky pellets do not fully re-elute and that shows as a bad A260/230.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-13 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-13');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You spray the bench with 10% bleach and immediately wipe it off with ethanol. What went wrong?', '[{"key":"a","text":"Bleach is only used after a run, not before"},{"key":"b","text":"70% ethanol alone is required for biological decontamination"},{"key":"c","text":"Bleach needs minutes of contact time to work"},{"key":"d","text":"Bleach must never be followed by ethanol"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-13'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Contact time has to be honoured: bleach needs minutes, not a wipe, before the ethanol step.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'How should a PCR setup be sequenced and laid out?', '[{"key":"a","text":"Master mix after template, but with fresh gloves"},{"key":"b","text":"Both at once, to keep handling time short"},{"key":"c","text":"Master mix first, in a space away from template"},{"key":"d","text":"Template first, then master mix in the same space"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-13'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Work clean-to-dirty: master mix is set up before template is handled, and in a different space.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'When are filter tips required?', '[{"key":"a","text":"Only when handling template DNA or extracted sample"},{"key":"b","text":"Only inside the biosafety cabinet"},{"key":"c","text":"Only for volumes above 100 uL"},{"key":"d","text":"For anything touching sample or master mix"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-13'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Filter tips are used for anything touching sample or master mix.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Why aliquot reagents instead of pipetting from the stock bottle?', '[{"key":"a","text":"Aliquots reach room temperature faster than a full stock bottle"},{"key":"b","text":"One contaminated stock appears in every sample for months"},{"key":"c","text":"Aliquots are easier to label with an expiry"},{"key":"d","text":"Stock bottles are too heavy to handle safely"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-13'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A single contaminated stock bottle turns up in every sample you process for months, and it looks exactly like a real result.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Part way through a setup you answer your phone, then return to the bench. What must you do?', '[{"key":"a","text":"Change gloves before touching anything else"},{"key":"b","text":"Change gloves once the plate is finished"},{"key":"c","text":"Wipe the gloves with 70% ethanol and carry on"},{"key":"d","text":"Nothing, as long as you touched only the phone"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-13'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Touching a phone, door, keyboard or your face is a defined glove-change trigger point.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Which tube-handling habit does the page rule out?', '[{"key":"a","text":"Holding the lid rather than setting it down"},{"key":"b","text":"Setting an open lid face-up on the bench"},{"key":"c","text":"Opening tubes inside the clean work zone"},{"key":"d","text":"Opening the tube with a gloved hand"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-13'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Lids are never put down face-up, and you avoid touching the inner rim or the underside of the lid.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Why is contamination treated as a competing hypothesis in this lab?', '[{"key":"a","text":"Nanopore reads cannot resolve contaminant taxa"},{"key":"b","text":"Reagent blanks are used to subtract contaminants during analysis"},{"key":"c","text":"Low-biomass samples make every introduced organism a data point"},{"key":"d","text":"Contaminants reliably fail the sequencing QC step"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-13'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'In a low-biomass microbiome lab, every bacterium you introduce becomes a data point someone may later try to interpret.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-21 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-21');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Your soil communities look Gram-negative-skewed against expectation. Which bead-beating fault fits?', '[{"key":"a","text":"Beating without the cooling intervals"},{"key":"b","text":"Over-beating, which shears Gram-positive DNA into fragments"},{"key":"c","text":"Under-beating, which leaves tough-walled cells intact"},{"key":"d","text":"Beating with zirconia rather than silica beads"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Under-beating leaves tough-walled Gram-positives unlysed, so the community reads as Gram-negative-skewed.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Nanopore read lengths are much shorter than usual across a whole batch. Which fault fits?', '[{"key":"a","text":"Under-beating the samples"},{"key":"b","text":"Over-beating, which shears long fragments"},{"key":"c","text":"Failing to balance the holder"},{"key":"d","text":"Opening the holder too soon after the run"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Over-beating shears DNA and destroys the long fragments that full-length 16S and nanopore depend on.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'The kit''s bead tubes have run out, but a different bead type is on the shelf. What is the correct call?', '[{"key":"a","text":"Do not substitute; bead type changes the community profile"},{"key":"b","text":"Substitute; beads are interchangeable consumables"},{"key":"c","text":"Substitute, and record it in the notebook as a minor deviation"},{"key":"d","text":"Substitute, but halve the beating time"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Swapping bead types changes what lyses and therefore your community profile, so it is a protocol change, not a substitution.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Why check that every cap is fully seated before starting a run?', '[{"key":"a","text":"The instrument will not start with a loose cap"},{"key":"b","text":"Loose caps let beads escape and throw the holder out of balance"},{"key":"c","text":"A tube can open mid-run and cross-contaminate the whole holder"},{"key":"d","text":"A loose cap lets the sample cool too quickly"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'A tube that opens mid-run cross-contaminates the whole holder and creates a BSL-2 aerosol.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'The bead-beating run has just stopped. What do you do next?', '[{"key":"a","text":"Vortex the tubes briefly, then open them at the bench"},{"key":"b","text":"Let the holder settle for a minute, then open it in the BSC"},{"key":"c","text":"Put the holder straight on ice and open it at the bench"},{"key":"d","text":"Open the holder immediately to stop the heating"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Let the holder settle for a minute so aerosols drop, then open it inside the biosafety cabinet.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why beat, rest on ice, then beat again rather than running one long cycle?', '[{"key":"a","text":"Beating generates heat that degrades nucleic acid"},{"key":"b","text":"Cooling improves how well the caps seat"},{"key":"c","text":"The motor overheats and cuts out during a long cycle"},{"key":"d","text":"Beads need time to resettle for even lysis"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Beating generates real heat, which degrades nucleic acid, so the protocol''s cooling intervals are followed.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You have three tubes for a holder that takes a balanced load. What do you do?', '[{"key":"a","text":"Add a balance tube of equal mass opposite the odd sample"},{"key":"b","text":"Load them into the centre positions only"},{"key":"c","text":"Run them; three tubes is a light load anyway"},{"key":"d","text":"Run at half speed to compensate"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The holder is always balanced; an unbalanced bead beater damages itself and can throw a tube.' FROM ins;

-- ---------------------------------------------------------------------------
-- BEN-25 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'BEN-25');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You take beads from the fridge, flick the tube once and pipette straight away. What are the two problems?', '[{"key":"a","text":"The beads clump permanently and the tube cannot be used"},{"key":"b","text":"The ethanol wash will not wet the pellet"},{"key":"c","text":"Cold beads bind poorly and the volume drawn is wrong"},{"key":"d","text":"Cold beads bind too tightly and will not elute"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Beads are vortexed to full homogeneity and brought to room temperature: cold beads bind poorly, and settling beads mean the volume you pipette is wrong.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Your timer is up but the supernatant is still faintly cloudy. What do you do?', '[{"key":"a","text":"Wait until it is completely clear"},{"key":"b","text":"Lift the plate off the magnet and re-mix"},{"key":"c","text":"Aspirate anyway; the timer is the standard"},{"key":"d","text":"Add more beads and re-incubate"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'You wait for a completely clear supernatant, not a mostly clear one, and judge it by eye rather than by a fixed timer.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Where do you put the tip to remove the supernatant?', '[{"key":"a","text":"Straight onto the bead pellet, drawing slowly"},{"key":"b","text":"At the liquid surface, following it down quickly"},{"key":"c","text":"Opposite the pellet, near the bottom, drawing slowly"},{"key":"d","text":"Anywhere, as long as the plate stays on the magnet"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Approach from the side opposite the pellet with the tip near the bottom: beads you remove are yield thrown away, liquid you leave is carryover.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'How do you add the ethanol wash?', '[{"key":"a","text":"Off the magnet, resuspending the pellet each time"},{"key":"b","text":"On the magnet, down the wall opposite the pellet"},{"key":"c","text":"Off the magnet, then return the plate to separate"},{"key":"d","text":"On the magnet, straight onto the pellet to rinse it"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The plate stays on the magnet and ethanol goes down the opposite wall; you never resuspend during a wash.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'The pellet still looks shiny, and you add elution buffer anyway. What is the consequence?', '[{"key":"a","text":"The pellet will not resuspend at all"},{"key":"b","text":"Nothing, as long as the elution volume is correct for the plate"},{"key":"c","text":"Residual ethanol carries over and inhibits downstream enzymes"},{"key":"d","text":"DNA elutes faster from a wet pellet"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Shiny means residual ethanol, which inhibits downstream enzymes; dry until the pellet loses its sheen but is not cracked.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'A Robin run gives poor yield, and the binding incubation had been cut short. How does that explain it?', '[{"key":"a","text":"Short binding leaves DNA unbound, so yield is lost directly"},{"key":"b","text":"Short binding leaves ethanol behind in the wells"},{"key":"c","text":"Short binding over-dries the pellet"},{"key":"d","text":"Short binding slows how fast the supernatant clears on the magnet"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'BEN-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Binding off the magnet is where DNA actually attaches to the beads; cutting that incubation short costs yield directly.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'What does the elution step require?', '[{"key":"a","text":"On the magnet, add buffer and wait"},{"key":"b","text":"Off the magnet, resuspend fully, full incubation"},{"key":"c","text":"Off the magnet, a brief flick, then transfer at once"},{"key":"d","text":"On the magnet, resuspend and then re-separate"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'BEN-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Elution happens off the magnet with the beads fully resuspended and the full incubation time given.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-01 — 6 questions (1 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-01');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A protocol needs a plate parked somewhere only the gripper will reach until later in the run. Which deck location is that?', '[{"key":"a","text":"Slot D3"},{"key":"b","text":"The waste chute"},{"key":"c","text":"The extension mount"},{"key":"d","text":"The staging area, column 4"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Column 4 is the staging area and is gripper-access only; the pipettes cannot reach it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Mid-run you slide the front window open to nudge a tube back into place. What does the robot do?', '[{"key":"a","text":"Pauses until the window is closed"},{"key":"b","text":"Keeps moving; windows are not an interlock"},{"key":"c","text":"Homes the gantry and waits"},{"key":"d","text":"Cuts power to the gantry motors"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The front and side windows are not a safety interlock, so the gantry keeps moving with the window open.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A protocol written for the OT-2 loads a tip rack into "slot 7". Why will that not work on a Flex?', '[{"key":"a","text":"Flex slots are lettered rows A–D with columns 1–3"},{"key":"b","text":"Slot 7 is reserved for the trash bin"},{"key":"c","text":"The Flex numbers its slots 1–11 in reverse"},{"key":"d","text":"Slot 7 exists but is gripper-access only"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The Flex deck is an A1–D3 grid of lettered rows and numbered columns, not the OT-2''s numbered slots.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You are scheduled to run the Zymo 96 full-gene 16S library prep. Which of our two Flexes, and why?', '[{"key":"a","text":"Robin, because it does the extractions"},{"key":"b","text":"Either; they are configured identically"},{"key":"c","text":"Batman, because it has the 96-head pipette"},{"key":"d","text":"Robin, because Batman has no gripper"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Batman carries the 96-channel pipette and runs the Zymo 96 full-gene 16S library prep; Robin does DNA extractions.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Pipettes already occupy the left and right mounts. Where does the gripper attach?', '[{"key":"a","text":"It replaces the right-mount pipette"},{"key":"b","text":"The extension mount"},{"key":"c","text":"The staging area, column 4"},{"key":"d","text":"The left mount, alongside the pipette"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The gripper rides on the extension mount, which is separate from the left and right pipette mounts.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You were signed off on FLX-01 while standing at Robin. Does that sign-off cover Batman as well?', '[{"key":"a","text":"No, each robot needs its own sign-off"},{"key":"b","text":"Only if Batman has the same pipettes"},{"key":"c","text":"No, because Batman has the 96-channel head"},{"key":"d","text":"Yes; it covers vocabulary, not one machine"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The sign-off covers the shared vocabulary rather than one specific machine, even though Robin and Batman are configured differently.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-02 — 6 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-02');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Where should the E-stop pendant be before you start a run?', '[{"key":"a","text":"Locked in the tool drawer"},{"key":"b","text":"Anywhere in the room; runs are monitored"},{"key":"c","text":"Within reach of where you stand"},{"key":"d","text":"Behind the robot, clear of the deck"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The pendant should be within reach of wherever you stand while the robot runs, and you should find it before you need it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You have pressed the E-stop. What does it take to get the robot moving again?', '[{"key":"a","text":"Twist to release, then let the robot re-home"},{"key":"b","text":"Press the pendant a second time"},{"key":"c","text":"Power-cycle the robot at the mains"},{"key":"d","text":"Nothing; motion resumes automatically"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'You twist the pendant to release it, and the robot then needs to re-home before it can move again.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'After an E-stop, why should you not simply hit resume?', '[{"key":"a","text":"The gantry needs a warm-up cycle first"},{"key":"b","text":"Resuming is blocked until LPC is re-run"},{"key":"c","text":"The touchscreen loses the protocol file"},{"key":"d","text":"The deck is left in an undefined state"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'An E-stop can leave a plate mid-transfer in the gripper, tips attached or a module mid-cycle, so assess the chemistry first.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Which of these is a pinch or crush point on the Flex?', '[{"key":"a","text":"The touchscreen mounting arm"},{"key":"b","text":"Under the z-axis carriage as it descends"},{"key":"c","text":"The tip ejector on the 96-channel head"},{"key":"d","text":"The lip of a reservoir slot"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The named crush points are gantry-to-frame at travel extremes, the gripper jaws, and under the descending z-axis carriage.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A tube has shifted and you want to straighten it while the gantry is moving. What is the correct action?', '[{"key":"a","text":"Reach in between gantry passes"},{"key":"b","text":"Open a window, which halts motion"},{"key":"c","text":"Pause the run properly, then intervene"},{"key":"d","text":"Hit the E-stop, fix it, then resume"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Keep hands out of the deck while the gantry is live; if you must intervene, pause the run properly rather than reaching around a moving arm.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'What must you confirm about the E-stop before every run?', '[{"key":"a","text":"That it is not already engaged"},{"key":"b","text":"That it stays engaged until loading is finished"},{"key":"c","text":"That it has been re-homed since the last run"},{"key":"d","text":"That it is unplugged during Prepare-to-run"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Before every run you confirm the E-stop is not already engaged and that nothing is resting on the deck that shouldn''t be.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-16 — 6 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-16');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A plate is resting on the lip of its slot rather than dropped in. What is the consequence?', '[{"key":"a","text":"The software refuses to start the run"},{"key":"b","text":"Nothing; the LPC offset absorbs it"},{"key":"c","text":"It sits millimetres high — crash or wrong depth"},{"key":"d","text":"Only the gripper is affected, not the pipettes"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'A plate on the slot lip is a few millimetres too high, which is enough to crash the pipette or aspirate from the wrong depth all run.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'A sample plate is loaded 180° out of orientation. What makes this especially dangerous?', '[{"key":"a","text":"The run finishes normally, hiding the mix-up"},{"key":"b","text":"The gripper cannot lift a rotated plate"},{"key":"c","text":"The first aspiration throws an overpressure error"},{"key":"d","text":"The deck map turns red at run start"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Every sample ends up where the protocol thinks a different sample is, and the run still completes successfully, so nothing flags it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'The protocol expects a 96-channel tip rack on its adapter, but you put the rack straight onto the deck. What happens?', '[{"key":"a","text":"Tip tracking resets to position A1"},{"key":"b","text":"The rack sits a few millimetres too high"},{"key":"c","text":"Nothing; the adapter is only for stability"},{"key":"d","text":"The stack height is wrong and the pipette crashes"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The adapter is part of the stack height, so labware placed directly where an adapter should be will crash.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'How should you verify the deck immediately before starting a run?', '[{"key":"a","text":"Glance over it once the checklist is green"},{"key":"b","text":"Walk the deck map against the deck, slot by slot"},{"key":"c","text":"Photograph the deck and compare afterwards"},{"key":"d","text":"Trust the offsets from the last identical run"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A slot-by-slot walk of the on-screen deck map against the physical deck takes thirty seconds and catches almost everything.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Which of these is a crash waiting to happen?', '[{"key":"a","text":"A reservoir covered during setup, uncovered before start"},{"key":"b","text":"An empty slot the protocol never uses"},{"key":"c","text":"A lid left on a plate the protocol pipettes into"},{"key":"d","text":"A full tip rack seated in its adapter"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Leaving a lid on something the protocol wants to pipette into is a crash; know which items are lidded at run start.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'What tells you a tip rack is properly seated in its slot?', '[{"key":"a","text":"It drops into the slot and sits flat"},{"key":"b","text":"It resists a gentle sideways nudge"},{"key":"c","text":"The touchscreen labware item turns green"},{"key":"d","text":"The gripper can lift it without slipping"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Press each item down into the slot until it drops in and sits flat; anything perched higher pipettes at the wrong depth.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-21 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-21');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'What does a saved labware offset actually apply to?', '[{"key":"a","text":"That protocol, on any Flex in the lab"},{"key":"b","text":"That labware type in that specific slot or module"},{"key":"c","text":"That slot, whatever labware you put in it"},{"key":"d","text":"That labware type, anywhere on the deck"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'An offset is an x/y/z correction for a labware type in a specific slot or module; change any of those three and it no longer applies.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'During LPC the tip is clearly off-centre over well A1, close to the well wall. What do you do?', '[{"key":"a","text":"Accept it; x/y error washes out at aspiration"},{"key":"b","text":"Cancel LPC and reseat the plate"},{"key":"c","text":"Note it and lower z to compensate"},{"key":"d","text":"Jog x/y until the tip is centred, then save"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'LPC exists to correct exactly this: jog in x/y until the tip is centred in the well, not against a wall, then save.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'What is the z target when you are jogging during LPC?', '[{"key":"a","text":"Tip just touching the well bottom"},{"key":"b","text":"Tip pressed firmly into the well bottom"},{"key":"c","text":"Tip about 1 mm above the bottom"},{"key":"d","text":"Tip level with the top of the well"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Z is correct when the tip is just touching the well bottom, neither pressed into it nor hovering above it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Which jog increment do you use for the final z adjustment?', '[{"key":"a","text":"10 mm"},{"key":"b","text":"1 mm"},{"key":"c","text":"0.1 mm"},{"key":"d","text":"Whatever increment the screen opens with"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Jogging offers 0.1 / 1 / 10 mm; the finest 0.1 mm step is what you use to settle the final z.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'How should you look at the tip while judging alignment?', '[{"key":"a","text":"Standing, looking down at the deck"},{"key":"b","text":"Crouched at eye level, from two angles"},{"key":"c","text":"From the touchscreen camera view"},{"key":"d","text":"By the sound of the tip touching plastic"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Judge by eye at eye level from two angles; a glance down from standing hides both x/y and z error.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'A protocol validated on Robin is moved to Batman with the same labware in the same slots. What about the offsets?', '[{"key":"a","text":"They transfer with the protocol file"},{"key":"b","text":"They apply once the robot has re-homed"},{"key":"c","text":"Only the z values need re-checking"},{"key":"d","text":"Re-run LPC; offsets are machine-specific"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Offsets are not global and not transferable between machines — Robin''s offsets are not Batman''s, so LPC must be re-run.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You jog every labware item correctly but close the screen without saving. What is the effect on the run?', '[{"key":"a","text":"Offsets save automatically when LPC completes"},{"key":"b","text":"The run refuses to start without saved offsets"},{"key":"c","text":"The run uses uncorrected default positions"},{"key":"d","text":"The previous protocol''s offsets are applied"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-21'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The correction only exists once you save it; unsaved jogging leaves the robot running on nominal positions.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-23 — 6 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-23');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You are doing partial tip pickup with the 96-channel pipette. Where does the tip rack go?', '[{"key":"a","text":"Directly on the deck, not in the adapter"},{"key":"b","text":"In the tip rack adapter, as usual"},{"key":"c","text":"In the staging area, column 4"},{"key":"d","text":"Stacked on a second rack for height"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-23'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], '96-channel racks normally sit in the adapter, but for partial pickup the rack must go directly on the deck or the API raises an error.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Your protocol picks up two tips at a time with the 96-channel head. Why must you watch the run?', '[{"key":"a","text":"Partial pickup wears the ejector faster"},{"key":"b","text":"Tip tracking resets after each pickup"},{"key":"c","text":"The tip-presence sensor is off for 1–3 tips"},{"key":"d","text":"The gripper must reposition the rack each time"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-23'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'With the sensor disabled for 1–3 tip pickup, a failed pickup is neither detected nor recoverable and the run carries on pipetting air.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'When can the software''s model of remaining tips drift from what is physically in the racks?', '[{"key":"a","text":"Whenever a run passes two hours"},{"key":"b","text":"Only if you swap in another brand of rack"},{"key":"c","text":"After the gripper moves any labware"},{"key":"d","text":"After a pause, abort or manual intervention"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-23'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'A pause, abort, error recovery or any manual intervention can leave the internal tip model out of step with the physical rack.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Resuming after a pause, the software''s next tip is A1 but the first three columns of the rack are empty. What do you do?', '[{"key":"a","text":"Let it run; missing tips will be detected"},{"key":"b","text":"Reset tip tracking to match the physical rack"},{"key":"c","text":"Slide the rack so a full column sits at A1"},{"key":"d","text":"Abort and restart the whole protocol"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-23'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Reconcile software state with reality before resuming, otherwise the pipette picks from an empty position or reuses a used tip.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A colleague offers cheaper third-party tips that fit the Flex fine. Why refuse them?', '[{"key":"a","text":"The gripper cannot handle unfamiliar racks"},{"key":"b","text":"The software will not recognise the rack"},{"key":"c","text":"Different length and seal cause volume errors"},{"key":"d","text":"They cannot be autoclaved before use"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-23'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Consumables must be the automation-compliant part numbers; tips that merely fit have different lengths and seals and produce volume errors.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why load complete tip racks unless the protocol explicitly handles partial ones?', '[{"key":"a","text":"The software counts tips; it does not look"},{"key":"b","text":"Partial racks unbalance the adapter"},{"key":"c","text":"The sensor needs a full column to calibrate"},{"key":"d","text":"Partial racks void the robot''s warranty"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-23'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Tip position is tracked by an internal count, not by looking at the rack, so a partly full rack desynchronises immediately.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-25 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-25');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'How do you work out how much reagent to put in a reservoir?', '[{"key":"a","text":"Per-well volume × wells, rounded up"},{"key":"b","text":"Per-well volume × wells, plus 1 mL"},{"key":"c","text":"Fill to the reservoir''s maximum line"},{"key":"d","text":"Per-well × wells + dead volume + overage"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Volume is per-well × number of wells plus the reservoir''s dead volume plus 10–20% overage, and you write the number down before pouring.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'What is dead volume?', '[{"key":"a","text":"Liquid lost to evaporation during the run"},{"key":"b","text":"Volume the pipette can never reach"},{"key":"c","text":"The 10–20% margin you add on top"},{"key":"d","text":"Liquid left in the tips after dispensing"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Dead volume is what the reservoir geometry never lets the pipette reach; it is reservoir-specific and often larger than people expect.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You are pouring a detergent-containing binding buffer into a reservoir. What is the right technique?', '[{"key":"a","text":"Slowly down the wall, then clear the foam"},{"key":"b","text":"Quickly down the middle to avoid drips"},{"key":"c","text":"Pipette it in column by column"},{"key":"d","text":"Pour, then vortex the reservoir on the deck"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Detergent buffers foam readily and a bubble under the aspiration point makes the pipette draw air, so pour slowly down the wall and clear surface foam.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A 12-column reservoir is placed with its column-1 end at the wrong side of the slot. What is the result?', '[{"key":"a","text":"The pipette cannot reach column 12"},{"key":"b","text":"Only the dead volume changes"},{"key":"c","text":"Every reagent is drawn from the wrong column"},{"key":"d","text":"The gripper refuses to move it"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'A reversed reservoir puts every reagent in the wrong place, so orientation must be checked against the protocol.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'What must you do to the MagBead suspension before pouring it into the reservoir?', '[{"key":"a","text":"Chill it on ice for ten minutes"},{"key":"b","text":"Dilute it with binding buffer"},{"key":"c","text":"Filter it to remove any clumps"},{"key":"d","text":"Resuspend it and warm to room temperature"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Beads must be resuspended to homogeneity and equilibrated to room temperature before pouring, and they will still settle during a long run.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why cover and label reservoirs while you finish the rest of the deck setup?', '[{"key":"a","text":"The gripper needs a lid to grip"},{"key":"b","text":"To stop evaporation and contamination"},{"key":"c","text":"To keep the deck map accurate"},{"key":"d","text":"To stop bleach residue settling into them"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'An open reservoir sitting on the deck during setup is both an evaporation and a contamination problem; label it with reagent name and lot.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You poured exactly the per-well total. Late in the plate the last columns receive nothing. What went wrong?', '[{"key":"a","text":"The buffer evaporated during the run"},{"key":"b","text":"The reservoir was 180° out"},{"key":"c","text":"Dead volume was left out of the calculation"},{"key":"d","text":"Bubbles blocked the aspiration point"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The last of the liquid sits below the reachable level, so without dead volume plus overage the reservoir runs dry mid-plate.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-27 — 5 questions (1 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-27');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'On a Flex, what actually brings the beads under magnetic force?', '[{"key":"a","text":"An engage() command raises the magnets"},{"key":"b","text":"The block lowers the plate onto the magnets"},{"key":"c","text":"The gripper moves the plate onto the block"},{"key":"d","text":"The pipette presses the plate down"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The Magnetic Block is a passive slab of fixed magnets with no engage command; moving the plate onto it with the gripper is what engagement means.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'How is bead separation time controlled on the Flex Magnetic Block?', '[{"key":"a","text":"By how long the protocol leaves the plate on"},{"key":"b","text":"By a dwell parameter sent to the module"},{"key":"c","text":"By the magnet height setting"},{"key":"d","text":"By the gripper''s grip force"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'With fixed magnets and no software control, separation time is simply how long the plate stays on the block.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'How does the OT-2''s Magnetic Module differ from the Flex Magnetic Block?', '[{"key":"a","text":"It is passive too, but stronger"},{"key":"b","text":"It also needs a gripper to load plates"},{"key":"c","text":"It cannot take 96-well plates"},{"key":"d","text":"Its magnets rise and fall under software control"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The OT-2 module is active: the magnets physically move under software control while the plate stays put.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You are converting an OT-2 bead protocol to the Flex. What becomes of magdeck.engage() and disengage()?', '[{"key":"a","text":"They still work, mapped onto the block"},{"key":"b","text":"They are rewritten as move_labware() gripper moves"},{"key":"c","text":"They are replaced by a delay"},{"key":"d","text":"They only need a new slot number"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'There is no engage command on the Flex, so those calls become gripper moves of the plate on and off the block.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Why does plate geometry matter more on the Flex block than on the OT-2 module?', '[{"key":"a","text":"The block''s magnets are weaker than the OT-2''s"},{"key":"b","text":"The gripper needs a particular plate flange"},{"key":"c","text":"Bead-to-magnet distance is fixed by the plate"},{"key":"d","text":"Thick plates make the block overheat"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Because the magnets cannot move, the plate''s own geometry sets the distance from beads to magnet.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-36 — 6 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-36');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Instruments shows green. The right pipette was taken off and refitted yesterday and not recalibrated. Acceptable?', '[{"key":"a","text":"Yes, green means the calibration is current"},{"key":"b","text":"No, reattachment makes the calibration untrustworthy"},{"key":"c","text":"Yes, if it went back on the same mount"},{"key":"d","text":"No, but only for the 96-channel head"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-36'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A pipette reattached since its last calibration shows as attached but is not trustworthy; confirm calibration status, not just attachment.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Which of these counts as deck hardware that must match the software deck configuration?', '[{"key":"a","text":"The tip racks"},{"key":"b","text":"The runtime parameters"},{"key":"c","text":"The labware offsets"},{"key":"d","text":"The trash bin and waste chute"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-36'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Modules and fixtures must be physically present and matching the software configuration, and the trash bin and waste chute count as deck hardware.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'The Labware Offsets checklist item is green. What does that actually guarantee?', '[{"key":"a","text":"That an offset exists for each item"},{"key":"b","text":"That the offsets suit this labware lot"},{"key":"c","text":"That LPC was run today"},{"key":"d","text":"That the plates are seated correctly"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-36'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Green here only means an offset exists, not that the offset is right for this labware lot.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You are extracting 48 samples but the run was set up for 96. Which checklist item should have caught it?', '[{"key":"a","text":"The Liquids item"},{"key":"b","text":"The Runtime parameters item"},{"key":"c","text":"The Labware item"},{"key":"d","text":"The Deck hardware item"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-36'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Runtime parameters cover sample count, volumes and any CSV input, and must be set for the run you actually intend.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Prepare-to-run is all green. Which of these can the checklist still not tell you?', '[{"key":"a","text":"Whether a module is missing from the deck"},{"key":"b","text":"Whether an offset exists for a plate"},{"key":"c","text":"Whether you loaded the wrong buffer"},{"key":"d","text":"Whether a pipette is attached"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-36'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'All-green is necessary but not sufficient: it cannot know you poured the wrong reagent or that your plate map is rotated.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The touchscreen checklist has gone all green. What do you do next?', '[{"key":"a","text":"Start immediately; the checks are complete"},{"key":"b","text":"Re-run LPC as a precaution"},{"key":"c","text":"Re-seat every plate once more"},{"key":"d","text":"Do your own slot-by-slot pass, then start"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-36'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Because all-green is not sufficient, you still do an independent slot-by-slot check of the deck before starting.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-41 — 7 questions (5 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-41');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A "no liquid detected" error fires and you can see the reservoir has run dry. Which recovery option?', '[{"key":"a","text":"Ignore and skip"},{"key":"b","text":"Retry with new tips"},{"key":"c","text":"Refill and retry"},{"key":"d","text":"Cancel the run"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-41'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'If a reservoir ran dry, refilling it and retrying is the option that restores the intended chemistry.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'A "no liquid detected" error fires on a well the plate map says is deliberately empty. Which option?', '[{"key":"a","text":"Refill and retry"},{"key":"b","text":"Ignore and skip"},{"key":"c","text":"Cancel the run"},{"key":"d","text":"Retry with the same tips"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-41'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A well that was already empty by design is exactly the case where ignore and skip is correct.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Why is choosing "ignore and skip" on a reagent addition step so dangerous?', '[{"key":"a","text":"The well silently misses reagent and looks real"},{"key":"b","text":"It leaves tips attached to the pipette"},{"key":"c","text":"It clears the software''s tip-tracking model"},{"key":"d","text":"The run log cannot record which wells were skipped"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-41'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The run finishes with a well that never got its reagent, and the failure then looks like a biological result in the data.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'An overpressure error fires during aspiration. What is the right response?', '[{"key":"a","text":"Retry with new tips and hope it clears"},{"key":"b","text":"Skip the step with the same tips"},{"key":"c","text":"Switch to the dispense recovery options"},{"key":"d","text":"Find and clear the blockage, then retry"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-41'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Overpressure means something is blocked, and retrying without fixing the cause simply fails again.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'An error stops a bead wash step and salvaging it will take twenty minutes. What must you weigh before choosing?', '[{"key":"a","text":"Whether the beads dry out in the meantime"},{"key":"b","text":"Whether the tips are still sterile"},{"key":"c","text":"Whether the gripper needs re-homing"},{"key":"d","text":"Whether the offsets survive the pause"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-41'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Ask what state the well''s chemistry is in and whether it can survive the delay; beads drying out during a long pause is a real failure mode.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You recovered from an error affecting three wells. What must be recorded, and where?', '[{"key":"a","text":"Nothing; the run log captures it"},{"key":"b","text":"Only the number of errors seen"},{"key":"c","text":"Option, step and wells, in the batch record"},{"key":"d","text":"A note left on the robot''s touchscreen"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-41'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Always record which recovery option was taken, at which step, for which wells; the person interpreting the sequencing data needs it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Which set of options does the software offer for an overpressure error on dispense?', '[{"key":"a","text":"Refill and retry, ignore and skip, or cancel"},{"key":"b","text":"Skip with same tips, skip with new tips, or cancel"},{"key":"c","text":"Retry with new tips, or cancel"},{"key":"d","text":"Retry, ignore, or re-home"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-41'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'On dispense the choices are skip with the same tips, skip with new tips, or cancel; retry with new tips or cancel is the aspiration case.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-47 — 6 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-47');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A visitor suggests acetone for a stubborn mark on the Flex window. What do you say?', '[{"key":"a","text":"Use it sparingly, on the frame only"},{"key":"b","text":"Use it, then rinse with distilled water"},{"key":"c","text":"Use it on the deck surface only"},{"key":"d","text":"Refuse; acetone attacks plastics and coatings"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-47'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Acetone is never approved on the Flex because it attacks the plastics and the window coating.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Which of these is an approved cleaning agent for the Flex?', '[{"key":"a","text":"Acetone"},{"key":"b","text":"10% bleach"},{"key":"c","text":"Xylene"},{"key":"d","text":"Undiluted bleach"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-47'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Approved agents are 70% ethyl alcohol, isopropyl alcohol, methanol, 10% bleach, or distilled water.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You have just wiped the deck surface with 10% bleach. What comes next?', '[{"key":"a","text":"Rinse with distilled water, then air dry"},{"key":"b","text":"Wipe over with 70% ethanol"},{"key":"c","text":"Leave it to dry as it is"},{"key":"d","text":"Buff dry with a paper towel at once"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-47'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The method is wipe, rinse with distilled water, air dry; bleach residue corrodes and leaves a film that interferes with the gripper''s grip.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'How far do you go when cleaning a pipette?', '[{"key":"a","text":"Remove the shroud and wipe inside"},{"key":"b","text":"Autoclave it between batches"},{"key":"c","text":"Exterior body, ejector and nozzles only"},{"key":"d","text":"Flush the internal channel with ethanol"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-47'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Clean pipette exterior body, ejector and nozzles only, and the gripper body, jaws and paddles; never disassemble and never autoclave.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'While cleaning you notice the gripper paddles look glazed and worn. What do you do?', '[{"key":"a","text":"Nothing; wear there is cosmetic"},{"key":"b","text":"Report or replace them; grip gets unreliable"},{"key":"c","text":"Wipe them with acetone to restore tack"},{"key":"d","text":"Lower the gripper''s force in software"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-47'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Paddles are wear items; glazed or worn paddles make grip unreliable and plates get dropped, so they are replaced.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You cleaned the deck with 70% ethanol after a 16S run. Is the deck ready for the next amplicon batch?', '[{"key":"a","text":"Yes; ethanol destroys residual DNA"},{"key":"b","text":"Yes, if the windows were wiped too"},{"key":"c","text":"Yes, provided the paddles are clean"},{"key":"d","text":"No; decontamination is a separate procedure"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-47'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Cleaning is not decontamination; DNA decontamination between amplicon-sensitive batches is FLX-49 and uses bleach with full contact time.' FROM ins;

-- ---------------------------------------------------------------------------
-- FLX-49 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'FLX-49');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'What triggers a deck decontamination on Batman?', '[{"key":"a","text":"Every Friday afternoon"},{"key":"b","text":"After every run, without exception"},{"key":"c","text":"Before an amplicon-sensitive batch"},{"key":"d","text":"Monthly, with the service check"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-49'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Run it between amplicon-sensitive batches; the trigger is the workflow, not the calendar.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'What does the bleach step need in order to actually destroy residual DNA?', '[{"key":"a","text":"A quick swipe across every slot"},{"key":"b","text":"Undiluted bleach, wiped straight off"},{"key":"c","text":"Bleach followed immediately by ethanol"},{"key":"d","text":"10% bleach left for the full contact time"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-49'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Bleach needs minutes of contact to destroy DNA, not a swipe, so the full contact time is honoured on all deck surfaces and slots.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Your Flex has a HEPA/UV module fitted. How is the UV cycle run?', '[{"key":"a","text":"Deck cleared, with nobody exposed"},{"key":"b","text":"Deck loaded, so the labware is treated too"},{"key":"c","text":"With people watching through the window"},{"key":"d","text":"In place of the bleach step, to save time"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'FLX-49'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'All labware comes off the deck first and the UV cycle is run with nobody exposed.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Can the UV cycle replace the bleach wipe?', '[{"key":"a","text":"Yes; UV destroys DNA more completely"},{"key":"b","text":"No; UV misses shadowed slots and under labware"},{"key":"c","text":"Yes, if you double the cycle time"},{"key":"d","text":"No; UV would damage the deck surface"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-49'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'UV does not penetrate under labware or into shadowed slots, so it supplements the bleach step rather than replacing it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'The bleach has had its full contact time on the deck. What is the next step?', '[{"key":"a","text":"Reload the labware straight away"},{"key":"b","text":"Wipe with acetone to remove streaks"},{"key":"c","text":"Rinse with distilled water and wipe dry"},{"key":"d","text":"Leave the bleach on until the next run"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-49'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Rinse and dry after bleach, because bleach residue corrodes and interferes with the gripper.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'What goes into the decontamination record?', '[{"key":"a","text":"Date, who did it, and the batch it preceded"},{"key":"b","text":"Just the date it was done"},{"key":"c","text":"The bleach lot and the room temperature"},{"key":"d","text":"Everyone who was in the lab that day"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-49'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Document the date, who performed it, and which batch it preceded, so the decontamination can be tied to a specific run.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Why is amplicon carryover treated as a worse risk than ordinary contamination?', '[{"key":"a","text":"It is resistant to bleach"},{"key":"b","text":"It shows up only in negative controls"},{"key":"c","text":"It degrades the gripper paddles"},{"key":"d","text":"Copy number is huge; it mimics a real taxon"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'FLX-49'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Amplicon is present at astronomically high copy number next to a low-biomass template, so one droplet can appear as a real-looking community member.' FROM ins;

-- ---------------------------------------------------------------------------
-- HPG-07 — 6 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'HPG-07');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You have worked through every module of the HiPerGator course but not taken the final quiz. Are you done?', '[{"key":"a","text":"Yes, working through the modules is what counts"},{"key":"b","text":"Yes, as long as your PI confirms you attended"},{"key":"c","text":"No, you must pass the final quiz"},{"key":"d","text":"No, and the quiz may only be attempted once"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The course is required and you must pass the final quiz; module completion alone is not the sign-off.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You cannot find the HiPerGator course anywhere in myTraining. Why not?', '[{"key":"a","text":"It is a Canvas course, so there is no myTraining code"},{"key":"b","text":"It is visible only to PIs and group sponsors"},{"key":"c","text":"It is released only after your account is created"},{"key":"d","text":"It was retired and replaced by a written test"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'It is a Canvas course delivered through UF Professional and Workforce Development, not a myTraining item, so there is no EHS-style course code to look up and completion is recorded here instead.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Where do you register for the HiPerGator user training?', '[{"key":"a","text":"hpg.rc.ufl.edu"},{"key":"b","text":"The myTraining catalog"},{"key":"c","text":"jhub.rc.ufl.edu"},{"key":"d","text":"go.ufl.edu/hpg-training"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Registration is at go.ufl.edu/hpg-training; the course is free and self-paced.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Before you can submit your own HiPerGator account request, what must already be in place?', '[{"key":"a","text":"Your own purchase of at least 1 NCU of compute and storage"},{"key":"b","text":"A completed EHS lab safety course"},{"key":"c","text":"Your PI''s account as sponsor, plus group compute and storage"},{"key":"d","text":"A published dataset produced by the group"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The PI must already have an account as group sponsor, and the group needs at least 1 NCU of compute and 1 BlSU of blue storage allocated. Then you submit your own account request.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A collaborator wants to bring a human-subject project involving PHI onto HiPerGator. What is your first move?', '[{"key":"a","text":"Contact UFIT Research Computing before any data moves"},{"key":"b","text":"Refuse, since UF never permits PHI on HiPerGator"},{"key":"c","text":"Put it on /blue with tightened directory permissions"},{"key":"d","text":"Decide with your PI whether it really counts as regulated"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Regulated data is never your call alone. UF supports categories such as PHI/HIPAA under its compliance posture, but only once UFIT Research Computing has placed you in the right environment, so you contact them first.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Export-controlled work (ITAR/EAR, CUI, CDI) must run where?', '[{"key":"a","text":"Standard HiPerGator, with the data encrypted at rest"},{"key":"b","text":"HiPerGator-RV"},{"key":"c","text":"ResShield"},{"key":"d","text":"/orange, because it is archival storage"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-07'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'UF policy requires export-controlled work to run on HiPerGator-RV. ResShield is for CMS IS2P2 data, not export-controlled work.' FROM ins;

-- ---------------------------------------------------------------------------
-- HPG-14 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'HPG-14');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'In UF''s own words, what are login nodes for?', '[{"key":"a","text":"Any job short enough to finish inside about an hour"},{"key":"b","text":"Non-computational interactive work and very short script tests"},{"key":"c","text":"Single-threaded work of any duration, as long as it is niced"},{"key":"d","text":"Anything that does not require a GPU"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'UF''s rule is that login nodes are for non-computational interactive work and very short tests of job scripts. That is all.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You SSH in and are about to launch Dorado basecalling in that shell. What should you do instead?', '[{"key":"a","text":"Run it under nice so it yields to other users"},{"key":"b","text":"Start it inside tmux so it survives disconnection"},{"key":"c","text":"Submit it as a batch job with sbatch"},{"key":"d","text":"Break it into several short login-node runs"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Basecalling is named as something never to run on a login node. The node is shared by everyone at UF, Research Computing will kill the process, and batch work belongs in sbatch.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You want to use VS Code against HiPerGator. What is the trap, and what is the fix?', '[{"key":"a","text":"Remote-SSH cannot handle MFA, so use a terminal editor"},{"key":"b","text":"Remote-SSH is fine on a login node if you close the terminal"},{"key":"c","text":"VS Code is blocked at UF, so use Jupyter instead"},{"key":"d","text":"Remote-SSH spawns heavy language servers; use Remote Tunnel"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'UF specifically calls out misusing IDE SSH connections: Remote-SSH silently spawns language servers and file watchers on whatever node it connects to. Use UF''s documented VS Code Remote Tunnel workflow.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You need about an hour of hands-on interactive testing of a pipeline. What is the right route?', '[{"key":"a","text":"Run it on the login node, since you are watching it"},{"key":"b","text":"Use srun with --pty bash -i, or the hpg-dev partition"},{"key":"c","text":"Submit it with sbatch and read the logs afterwards"},{"key":"d","text":"Open a second SSH session so the load is split"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Interactive testing goes through srun ... --pty bash -i or the hpg-dev partition, which allows up to 12 hours.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You need to rsync a 40 GB nanopore run onto /blue. Can that run from a login server?', '[{"key":"a","text":"No, wrap the transfer in an sbatch job"},{"key":"b","text":"Only through Globus, since rsync is blocked there"},{"key":"c","text":"Yes, file transfers are permitted from login servers"},{"key":"d","text":"Only for transfers smaller than 10 GB"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'File transfers with rsync, cp and mv are explicitly permitted from login servers.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You want an interactive RStudio session on HiPerGator. What is the documented way?', '[{"key":"a","text":"Start R on the login node and keep the session small"},{"key":"b","text":"Through Open OnDemand with an explicit resource request"},{"key":"c","text":"Through VS Code Remote-SSH to a login node"},{"key":"d","text":"Interactive R is unavailable, so use a batch script"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'RStudio goes through Open OnDemand with an explicit resource request, not R on the login node. Someone in this lab already had to move a JSDM model fit from interactive RStudio to batch submission.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'What should you understand about jhub.rc.ufl.edu?', '[{"key":"a","text":"It is a login node set aside for notebooks"},{"key":"b","text":"It is UF''s Globus transfer endpoint"},{"key":"c","text":"It is Jupyter, running as a job with a resource allocation"},{"key":"d","text":"It is where the required training course is hosted"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Jupyter runs at jhub.rc.ufl.edu, and you should understand it as a job with a resource allocation rather than a free-for-all shell.' FROM ins;

-- ---------------------------------------------------------------------------
-- HPG-22 — 7 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'HPG-22');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'How large is your /home directory, and what belongs in it?', '[{"key":"a","text":"40 GB, for config, scripts and documents"},{"key":"b","text":"400 GB, for active project data"},{"key":"c","text":"4 TB, for anything not yet archived"},{"key":"d","text":"Investment-based, like /blue"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-22'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], '/home is 40 GB per user and holds config, shell setup, scripts and documents. UF says not to use it for job input and output.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Which statement about backups on HiPerGator is correct?', '[{"key":"a","text":"/orange holds the backup copy of /blue"},{"key":"b","text":"/blue is snapshotted nightly by Research Computing"},{"key":"c","text":"The ~/.snapshot/ directory covers everything under /blue"},{"key":"d","text":"/blue is not backed up unless backup was purchased"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-22'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'This is the single most important sentence on the page: /blue is not backed up unless backup was separately purchased. /orange is not backed up by default either, and the ~/.snapshot/ snapshots belong to /home.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Where should a job read its inputs and write its outputs?', '[{"key":"a","text":"/home, so the daily snapshots protect them"},{"key":"b","text":"/orange, keeping /blue free for other people"},{"key":"c","text":"/blue, the primary location for job-time file access"},{"key":"d","text":"Whichever filesystem has the most free space today"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-22'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'UF calls /blue the primary location that should be used for all files read or written during job execution, and says not to use /home for job input and output.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You run ls /blue and your group''s directory is not listed. What is going on?', '[{"key":"a","text":"It mounts on demand, so cd into it directly"},{"key":"b","text":"Your account has not been added to the group"},{"key":"c","text":"The filesystem is full and hiding directories"},{"key":"d","text":"You need to run module load ufrc first"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-22'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'ls /blue will not show your group directory because it mounts on demand. Change directory to /blue/<group> directly.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A dataset sits on /orange and you want to run a job that reads it repeatedly. What is wrong with that?', '[{"key":"a","text":"Nothing, /orange is tuned for repeated reads"},{"key":"b","text":"/orange is read-only from compute nodes"},{"key":"c","text":"/orange cannot take intensive concurrent job I/O"},{"key":"d","text":"/orange has no quota reporting command"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-22'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], '/orange is archival, near-line storage for inactive data and gentle sequential access. It cannot take intensive concurrent job I/O, so do not run jobs against it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The only copy of a raw nanopore run is in /blue. What does the lab''s backup rule require?', '[{"key":"a","text":"Nothing more, since /blue is redundant by design"},{"key":"b","text":"At least one more independent copy, off HiPerGator"},{"key":"c","text":"A second copy in /home, which has snapshots"},{"key":"d","text":"A restore point saved under ~/.snapshot/"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-22'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Every dataset needs at least two independent copies, and raw sequencing data needs an off-HiPerGator copy plus, eventually, an archive submission.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'A job dies with a "No Space Left" error. What is your first move?', '[{"key":"a","text":"Move the project into /home, which has more headroom"},{"key":"b","text":"Delete your old job logs and resubmit right away"},{"key":"c","text":"Ask your PI to buy a larger compute allocation"},{"key":"d","text":"Read the path in the error, check quota, then run ncdu"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-22'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'A "No Space Left" error names a path, so read it to work out which filesystem is full. Then use blue_quota, home_quota or orange_quota, and ncdu to find what is eating space.' FROM ins;

-- ---------------------------------------------------------------------------
-- HPG-30 — 7 questions (0 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'HPG-30');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'What values belong in the --account and --qos directives?', '[{"key":"a","text":"Your GatorLink username"},{"key":"b","text":"Your group''s account and QOS"},{"key":"c","text":"The name of the partition you are using"},{"key":"d","text":"Your PI''s email address"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-30'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], '--account and --qos are your group''s, not your username. The burst variant of the QOS is the group name with -b appended.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Which partition does a Dorado basecalling job belong on?', '[{"key":"a","text":"bigmem"},{"key":"b","text":"hpg-dev"},{"key":"c","text":"gpu"},{"key":"d","text":"hwgui"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-30'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The partition list assigns gpu to Dorado; bigmem is for assembly and Kraken2 database loading, hpg-dev is for interactive testing and hwgui is for accelerated GUI work.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Your job has to load a large Kraken2 database. Which partition do you request?', '[{"key":"a","text":"bigmem"},{"key":"b","text":"gpu"},{"key":"c","text":"hpg-default"},{"key":"d","text":"hpg-dev"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-30'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'bigmem is for assembly and Kraken2 database loading. hpg-default and hpg2-compute are the general CPU partitions.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Your job vanishes seconds after submission and there is no .out file at all. What is the most likely cause?', '[{"key":"a","text":"The --time request was too short"},{"key":"b","text":"The wrong QOS was specified"},{"key":"c","text":"The conda environment was never activated"},{"key":"d","text":"The logs/ directory did not exist"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-30'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Make the logs/ directory before you submit, or the job fails instantly with no output at all.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You set --time well below what the job actually needs. What happens?', '[{"key":"a","text":"SLURM extends the limit automatically"},{"key":"b","text":"The job is killed at the wall clock limit"},{"key":"c","text":"The job is requeued at a lower priority"},{"key":"d","text":"The job runs, but more slowly"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-30'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A --time that is too short kills the job at the wall; one that is too long delays scheduling. Estimate, then refine from seff.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Your submitted script fails with "module: command not found". What do you add?', '[{"key":"a","text":"source /etc/profile.d/modules.sh before the module load"},{"key":"b","text":"A conda install of the modules package"},{"key":"c","text":"The absolute path to every executable you call"},{"key":"d","text":"A second submission issued from a login node"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-30'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'If module is not found in a scripted context, source /etc/profile.d/modules.sh first.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'How do you submit the script and confirm it is queued?', '[{"key":"a","text":"srun script.sh, then seff"},{"key":"b","text":"bash script.sh, then squeue"},{"key":"c","text":"sbatch script.sh, then squeue -u $USER"},{"key":"d","text":"sbatch script.sh, then seff"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-30'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Submit with sbatch script.sh and check with squeue -u $USER. seff is for after a job has finished.' FROM ins;

-- ---------------------------------------------------------------------------
-- HPG-40 — 7 questions (0 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'HPG-40');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You request 200 GB of memory and the job peaks at 12 GB. What does your group get billed for?', '[{"key":"a","text":"12 GB, the amount actually used"},{"key":"b","text":"200 GB, the amount you reserved"},{"key":"c","text":"Nothing, because memory is not billed"},{"key":"d","text":"The average across the whole run"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-40'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Over-requesting burns the group''s NCU allocation because you are billed for what you reserve, not what you use, and that is shared, finite money.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'seff reports 4% CPU efficiency on a job you gave 32 cores. What do you change next time?', '[{"key":"a","text":"Nothing; efficiency figures fluctuate between runs"},{"key":"b","text":"Request more memory so the cores are kept fed"},{"key":"c","text":"Move the job onto the bigmem partition"},{"key":"d","text":"Drop the request to about 4 cores"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-40'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The competent version of this skill sounds like "I requested 32 cores, seff showed 4% CPU efficiency, I''m dropping to 4."' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, '"Ask for lots, just to be safe." What is actually wrong with that reasoning?', '[{"key":"a","text":"It lengthens your own queue time"},{"key":"b","text":"It lowers the CPU efficiency that seff reports"},{"key":"c","text":"It affects billing but never scheduling"},{"key":"d","text":"It reduces the accuracy of your results"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-40'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'A job asking for 32 cores and 200 GB waits for a node that can satisfy it, while the same job asking for 4 cores and 16 GB starts far sooner. It also burns the group allocation and starves labmates.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'seff is unavailable on the cluster one day. What do you use instead?', '[{"key":"a","text":"ncdu and blue_quota"},{"key":"b","text":"sacct, sstat, squeue or slurmInfo"},{"key":"c","text":"Only the job-completion email"},{"key":"d","text":"Nothing else reports job resource use"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-40'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'seff is a standard Slurm utility on the cluster but is not in UFIT Research Computing''s own documentation; their documented tools are sacct, sstat, squeue and slurmInfo.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You doubled --cpus-per-task to 16 and the runtime did not budge. What do you check?', '[{"key":"a","text":"Whether /blue was under heavy load at the time"},{"key":"b","text":"Whether the QOS was burst rather than standard"},{"key":"c","text":"Whether the tool is multithreaded and got the thread flag"},{"key":"d","text":"Whether the partition had any free nodes"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-40'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Threads are not speed. Applications often require specific configuration to use multiple cores, so 16 cores does nothing if the tool is single-threaded or you never passed it the thread count.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'What does seff report for a finished job?', '[{"key":"a","text":"Queue position and scheduling priority"},{"key":"b","text":"CPU efficiency, peak versus requested memory, wall time used"},{"key":"c","text":"The filesystem quota consumed by the job"},{"key":"d","text":"The hardware specification of the node it ran on"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-40'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'seff reports CPU efficiency, peak memory used versus requested, and wall time used versus requested. The job-completion email includes a memory estimate too.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Which statement describes Kraken2''s resource shape?', '[{"key":"a","text":"GPU-bound, in the way Dorado is"},{"key":"b","text":"Comparatively light, in the way Emu is"},{"key":"c","text":"Memory-bound, because of database loading"},{"key":"d","text":"Limited mainly by network throughput to /blue"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-40'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Kraken2 is memory-bound by database loading, Dorado is GPU-bound, and Emu is comparatively light. Learn each pipeline''s shape once and encode it in your job scripts.' FROM ins;

-- ---------------------------------------------------------------------------
-- HPG-56 — 7 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'HPG-56');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'In rsync -avP, what does the -P flag give you?', '[{"key":"a","text":"Preservation of file permissions and timestamps"},{"key":"b","text":"Progress output and resumable partial transfers"},{"key":"c","text":"Parallel transfer streams"},{"key":"d","text":"A prompt before each overwrite"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-56'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], '-a is archive, -v is verbose, and -P gives progress plus resume of partial transfers.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'What is the difference between rsync source/ and rsync source?', '[{"key":"a","text":"There is none; the trailing slash is cosmetic"},{"key":"b","text":"source/ copies the directory, source copies its contents"},{"key":"c","text":"The slash only matters on the destination path"},{"key":"d","text":"source/ copies the contents, source copies the directory"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-56'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The trailing slash matters: source/ copies the contents, while source copies the directory itself. This trips everyone up once.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A 40 GB nanopore run has to move from the sequencing laptop to /blue. What does UF advise?', '[{"key":"a","text":"Try Globus first"},{"key":"b","text":"scp the whole run folder in one command"},{"key":"c","text":"rsync without --partial so it restarts cleanly"},{"key":"d","text":"Compress it first, then send it with FileZilla"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-56'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'UF calls Globus optimal for large files and advises trying Globus first for anything from hundreds of MB upward, which is every nanopore run. It survives dropped connections in a way scp does not.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Why does the lab avoid FileZilla for HiPerGator transfers?', '[{"key":"a","text":"It cannot resume an interrupted transfer"},{"key":"b","text":"It is not licensed for use by UF staff"},{"key":"c","text":"It does not work well with HiPerGator''s MFA setup"},{"key":"d","text":"It corrupts binary files such as raw signal data"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-56'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'UF states explicitly that FileZilla does not work well with the MFA setup on HiPerGator. Use Cyberduck, WinSCP, BitVise or MobaXterm instead.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'The transfer has finished and the sequencing laptop is nearly full. When may you delete the local copy?', '[{"key":"a","text":"As soon as rsync exits without an error"},{"key":"b","text":"Once the first analysis job has run successfully"},{"key":"c","text":"After a week, if nobody has reported a problem"},{"key":"d","text":"Once checksums verify and the data is filed and logged"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-56'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], '"It looked like it copied" is not verification. Run md5sum or compare checksums generated at source, file and protect the data, and only then delete the local copy.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The run has arrived on /blue and the md5sums match. What do you do next?', '[{"key":"a","text":"Start basecalling straight away and tidy the files up later"},{"key":"b","text":"File it into 00_raw/, set it read-only, log it in the manifest"},{"key":"c","text":"Move it to /orange and clear it off /blue"},{"key":"d","text":"Compress it and keep a second copy in /home"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'HPG-56'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'On arrival you verify, then protect: file it into /blue/<group>/.../00_raw/, set it read-only, and log it against the sample manifest.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You are not certain your rsync command will do what you intend. What do you do first?', '[{"key":"a","text":"Run it with --dry-run"},{"key":"b","text":"Run it with --checksum"},{"key":"c","text":"Run it and cancel if the output looks wrong"},{"key":"d","text":"Run it with -v but drop the -a"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'HPG-56'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Use --dry-run first when you are not sure. --checksum is for when you need certainty over speed, not for previewing what a command will do.' FROM ins;

-- ---------------------------------------------------------------------------
-- OT2-01 — 7 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'OT2-01');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You are moving a protocol from a Flex onto Alfred. How is the OT-2 deck laid out?', '[{"key":"a","text":"Eleven numbered slots, with trash fixed in slot 12"},{"key":"b","text":"An A1-D3 grid plus a staging area"},{"key":"c","text":"Twelve numbered slots; trash goes wherever you like"},{"key":"d","text":"Twelve lettered slots plus a dedicated gripper bay"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The OT-2 deck is slots 1-11 with a fixed trash in slot 12. The A1-D3 grid and staging area belong to the Flex.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Your protocol needs a plate moved off the magnetic module partway through a run on Alfred. What happens?', '[{"key":"a","text":"The gripper moves it automatically"},{"key":"b","text":"The magnetic module slides the plate across"},{"key":"c","text":"The run pauses and you move the plate by hand"},{"key":"d","text":"Plates cannot be moved once a run has started"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The OT-2 has no gripper, so all plate movement is by hand. Only the Flex can reposition labware itself.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'How does the OT-2''s Magnetic Module differ from the Flex''s magnetic block?', '[{"key":"a","text":"It is active and engages in software"},{"key":"b","text":"It is passive; a gripper lifts the plate onto it"},{"key":"c","text":"It is a heated block that also holds magnets"},{"key":"d","text":"It is stronger but must be engaged by hand"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The OT-2 uses an active Magnetic Module that engages and disengages under software control; the Flex uses a passive block plus a gripper.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A tip pickup fails halfway through a run on Ethan. What does the OT-2 App offer you?', '[{"key":"a","text":"Retry with new tips, refill and retry, or skip the step"},{"key":"b","text":"Automatic retry, with a report at the end of the run"},{"key":"c","text":"A pause: fix the problem, or cancel the protocol"},{"key":"d","text":"Immediate cancellation, with no pause at all"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The OT-2 has no structured error recovery: the app pauses and offers only fix-or-cancel. The named recovery options are Flex features.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'In what order must the OT-2''s manual calibrations be performed?', '[{"key":"a","text":"Pipette offset, then deck, then tip length"},{"key":"b","text":"Tip length, then deck, then pipette offset"},{"key":"c","text":"Deck, then tip length, then pipette offset"},{"key":"d","text":"Any order, provided all three are completed"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The dependency chain is deck, then tip length, then pipette offset. Anything upstream invalidates everything downstream.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Which statement matches how this lab uses its two OT-2s?', '[{"key":"a","text":"Alfred does clean-and-concentrate; Ethan does dilutions and pooling"},{"key":"b","text":"Alfred does equimolar pooling; Ethan does clean-and-concentrate"},{"key":"c","text":"Both run the same extraction protocol in parallel"},{"key":"d","text":"Alfred is training-only; Ethan handles all production work"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Alfred is the clean-and-concentrate robot; Ethan does dilutions, normalisation and equimolar library pooling.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'A protocol written for Robin uses the 96-channel head. Can it run on Alfred as written?', '[{"key":"a","text":"Yes, the OT-2 8-channel emulates the 96-channel head"},{"key":"b","text":"Yes, provided you recalibrate the deck and tip length first"},{"key":"c","text":"No; the OT-2 has only GEN2 P20, P300 and P1000"},{"key":"d","text":"Yes, after selecting 96-channel mode in the App"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'OT-2 pipettes are GEN2 P20/P300/P1000. The 96-channel head exists only on the Flex, so the protocol must be rewritten.' FROM ins;

-- ---------------------------------------------------------------------------
-- OT2-04 — 6 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'OT2-04');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Which statement about the OT-2 calibration chain is correct?', '[{"key":"a","text":"Deck calibration comes last, once the pipettes are set"},{"key":"b","text":"Pipette offset is only needed on the left mount"},{"key":"c","text":"Tip length is calibrated once per robot, not per rack"},{"key":"d","text":"Deck calibration comes first; the rest depends on it"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-04'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Deck calibration establishes the deck''s position relative to the gantry, and tip length and pipette offset are both calibrated on top of it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Deck calibration asks you to jog the tip to how many cross-hair points?', '[{"key":"a","text":"One"},{"key":"b","text":"Two"},{"key":"c","text":"Three"},{"key":"d","text":"Six"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-04'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Deck calibration jogs to three cross-hair points on the deck. Skipping a point leaves the deck position wrong.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You are on the final approach to a cross-hair. What is the correct jogging technique?', '[{"key":"a","text":"Use the largest increment to reach contact quickly"},{"key":"b","text":"Press down until the tip visibly flexes, then stop"},{"key":"c","text":"Stop roughly a millimetre above the deck surface"},{"key":"d","text":"Use the smallest increment; stop when the tip just touches"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-04'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Eye level with the deck, smallest increment for the final approach, and contact without deflecting the tip. A deflected tip means you have gone too far.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You remove the P300 from Ethan and reattach it. What calibration must you redo?', '[{"key":"a","text":"Nothing; the calibration is stored with the pipette"},{"key":"b","text":"Tip length and pipette offset for that pipette"},{"key":"c","text":"Deck calibration only"},{"key":"d","text":"All three, beginning again with deck calibration"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-04'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Reattaching a pipette invalidates tip length and pipette offset. Deck calibration is upstream and stays valid.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Why is a poor deck calibration more dangerous than a tip that obviously crashes?', '[{"key":"a","text":"It voids the robot''s service warranty"},{"key":"b","text":"It disables the Magnetic Module until reset"},{"key":"c","text":"It gives subtly wrong volumes across every protocol"},{"key":"d","text":"It only shows up in the Flex''s error log"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-04'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'A crash announces itself. A bad deck calibration quietly shifts volumes on every protocol that runs afterwards.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Alfred has been carried to a different bench. What calibration work is needed before the next run?', '[{"key":"a","text":"All three calibrations, in the standard order"},{"key":"b","text":"None, provided the pipettes were not touched"},{"key":"c","text":"Deck calibration only"},{"key":"d","text":"Tip length and pipette offset only"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-04'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Moving the robot requires redoing all three: deck, then tip length, then pipette offset.' FROM ins;

-- ---------------------------------------------------------------------------
-- OT2-10 — 6 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'OT2-10');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You have modified an existing OT-2 protocol. What happens before you run real samples?', '[{"key":"a","text":"A water-only dry run on the real deck and labware"},{"key":"b","text":"A software simulation in the App is enough on its own"},{"key":"c","text":"Nothing extra, since the original protocol worked"},{"key":"d","text":"A run with a single well filled, to check the volumes"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Any new or changed protocol gets a water-only dry run with real labware on the real deck; that is where collisions and bad offsets are caught.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'How much reagent should you put in a reservoir for an OT-2 run?', '[{"key":"a","text":"Exactly the calculated volume, to avoid waste"},{"key":"b","text":"Half now, topping up when the robot pauses"},{"key":"c","text":"The calculated volume plus dead volume plus generous overage"},{"key":"d","text":"Whatever fits; the robot detects a dry reservoir"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Over-provision with dead volume plus overage. Running a reservoir dry on an OT-2 ends the run and loses the plate.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'The run has started on Ethan. What should you do next?', '[{"key":"a","text":"Leave at once so vibration does not disturb it"},{"key":"b","text":"Check in halfway; early steps rarely cause trouble"},{"key":"c","text":"Return only when the App reports completion"},{"key":"d","text":"Watch the opening steps and the first plate move"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Most failures declare themselves early, so the opening steps and the first plate move are what you watch.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A run has paused with an error. What is the first thing you do?', '[{"key":"a","text":"Resume and see whether it recovers by itself"},{"key":"b","text":"Cancel and restart the protocol from the beginning"},{"key":"c","text":"Open the deck and re-mix the affected plate by hand"},{"key":"d","text":"Write down the step, plate states and chemistry status"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'OT2-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Record the step it stopped at, the state of each plate and what the chemistry tolerates before touching anything; you will not remember it accurately later.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Why does running a reservoir dry matter more on an OT-2 than on a Flex?', '[{"key":"a","text":"OT-2 reservoirs hold far less liquid"},{"key":"b","text":"There is no recovery option, so the plate is lost"},{"key":"c","text":"The OT-2 cannot pause partway through a protocol"},{"key":"d","text":"It damages the pipette''s internal seal"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'On a Flex an empty reservoir is a recoverable annoyance; on the OT-2 there is no refill-and-retry, so the run ends.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why does dry-run validation matter more on the OT-2 than on the Flex?', '[{"key":"a","text":"OT-2 protocols run more slowly than Flex protocols"},{"key":"b","text":"Water behaves like reagent in every respect"},{"key":"c","text":"Recalibration after a crash takes longer on the OT-2"},{"key":"d","text":"It is the only cheap place to catch collisions and offsets"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'OT2-10'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Because errors at run time usually mean cancelling, the dry run is the only inexpensive opportunity to find collisions, offsets and volume errors.' FROM ins;

-- ---------------------------------------------------------------------------
-- PLT-01 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'PLT-01');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You have just finished a Take3 read. What do you do with the surfaces?', '[{"key":"a","text":"Clean all three with dH2O and a lint-free wipe"},{"key":"b","text":"Clean only the surfaces you actually loaded"},{"key":"c","text":"Leave them until the end of the session"},{"key":"d","text":"Rinse them with ethanol and let them air-dry"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'PLT-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'All three surfaces are cleaned with dH2O and a lint-free wipe before and immediately after reading, because carryover is the main failure mode.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'How do you load the Take3 plate?', '[{"key":"a","text":"1 µL per spot, as on the DS-11 pedestal"},{"key":"b","text":"5 µL per spot, to compensate for the short pathlength"},{"key":"c","text":"2 µL per spot, closing the lid straight away"},{"key":"d","text":"2 µL per spot, checking every drop before closing"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'PLT-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], '2 µL per spot, and you look at every drop first: a missed or spread drop reads as garbage and you will not know which well it was.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'How do you blank a Take3 run?', '[{"key":"a","text":"With dH2O in a single spot"},{"key":"b","text":"With the blank values from the previous batch"},{"key":"c","text":"With an empty, dry spot"},{"key":"d","text":"With the matching elution buffer, on the plate"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'PLT-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Blank with the matching elution buffer, loaded on the plate the same way as the samples.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Before reading, what must be selected in Gen5?', '[{"key":"a","text":"The 96-well definition and any DNA protocol"},{"key":"b","text":"The correct protocol and the Take3 plate definition"},{"key":"c","text":"The kinetic read mode"},{"key":"d","text":"The dsDNA conversion factor used by the DS-11"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'PLT-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Select the correct Gen5 protocol together with the Take3 plate definition; the wrong plate definition invalidates the pathlength the reader assumes.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A re-extraction batch is coming in around 5 ng/µL. What should you do?', '[{"key":"a","text":"Read on the Take3 and trust the purity ratios"},{"key":"b","text":"Load 4 µL per spot to boost the signal"},{"key":"c","text":"Read on the Take3 twice and average the results"},{"key":"d","text":"Quantify on the Qubit instead"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'PLT-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The short pathlength makes numbers unreliable below roughly 10 to 15 ng/µL, so a low-yield batch falls back to the Qubit.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why export Take3 results already mapped to your plate map?', '[{"key":"a","text":"Gen5 deletes unlabelled data after a week"},{"key":"b","text":"An unlabelled 48-cell grid is useless later"},{"key":"c","text":"It is required before any Qubit comparison"},{"key":"d","text":"The reader cannot store sample identifiers"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'PLT-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Attach sample IDs at the time of reading, because an unlabelled 48-cell grid is almost useless a week later.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'How does purity-ratio interpretation on the Take3 compare with the DS-11?', '[{"key":"a","text":"It uses different target ranges for both ratios"},{"key":"b","text":"Gen5 does not report purity ratios at all"},{"key":"c","text":"The same interpretation applies; it is the same chemistry"},{"key":"d","text":"Only A260/280 is meaningful on the Take3"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'PLT-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The Take3 is the same absorbance chemistry at 260/280/230, parallelised, so purity-ratio interpretation and the same artifacts carry over unchanged.' FROM ins;

-- ---------------------------------------------------------------------------
-- QC-02 — 6 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'QC-02');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Your samples are eluted in TE. What do you blank the DS-11 with?', '[{"key":"a","text":"The same TE the samples are eluted in"},{"key":"b","text":"dH2O, which has no absorbance of its own"},{"key":"c","text":"A dry pedestal with the arm lowered"},{"key":"d","text":"The most dilute sample in the set"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Blank with the matching elution buffer. Blanking a TE-eluted sample against water gives a wrong A260/230 and a purity problem that does not exist.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'How often do you wipe the DS-11 pedestals, and with what?', '[{"key":"a","text":"After every tenth sample, with a damp wipe"},{"key":"b","text":"At the start and end of the session, with ethanol"},{"key":"c","text":"Only when residue is visible on the lower pedestal"},{"key":"d","text":"After every reading including the blank, with a dry wipe"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Both surfaces get a dry lab wipe after every single reading, blanks included. Skipping this is the top cause of bad data on this instrument.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A labmate offers you 70% ethanol to clean the pedestal. What do you do?', '[{"key":"a","text":"Decline; routine cleaning uses dH2O only"},{"key":"b","text":"Use it, since it is standard for optics"},{"key":"c","text":"Use it on the upper surface only"},{"key":"d","text":"Dilute it with dH2O first, then use it"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Routine cleaning is dH2O only. Detergents and alcohol are not used on this instrument.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'What does a correctly loaded DS-11 sample look like before you lower the arm?', '[{"key":"a","text":"A 2 µL drop spread across the pedestal"},{"key":"b","text":"A 1 µL bead centred on the lower pedestal"},{"key":"c","text":"A 1 µL drop placed on the upper surface"},{"key":"d","text":"Enough volume to fill the gap when the arm closes"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], '1 µL on the centre of the lower pedestal, forming a clean bead with no bubble, so a proper liquid column forms when the arm closes.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Three replicate readings of one sample scatter widely. What does that tell you?', '[{"key":"a","text":"The DNA in the sample is degraded"},{"key":"b","text":"The blank buffer was too concentrated"},{"key":"c","text":"You have a loading or cleaning problem"},{"key":"d","text":"The sample is single-stranded rather than double-stranded"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Replicates that disagree point at technique: a bad drop, a bubble, or residue left from the previous reading.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You need a concentration to decide library input. Which number governs?', '[{"key":"a","text":"The DS-11 value, because it is a full spectrum"},{"key":"b","text":"The mean of the DS-11 and Qubit values"},{"key":"c","text":"The Take3 value, since 48 wells are read at once"},{"key":"d","text":"The Qubit value"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The DS-11 gives a good purity picture and a rough concentration, but the Qubit governs for anything going into a library.' FROM ins;

-- ---------------------------------------------------------------------------
-- QC-03 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'QC-03');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A MagBead extract reads 60 ng/µL, A260/280 of 1.84, A260/230 of 0.7. What is the most likely cause?', '[{"key":"a","text":"Protein carryover from the lysis step"},{"key":"b","text":"Residual guanidinium or ethanol from an incomplete wash"},{"key":"c","text":"The sample is too dilute for meaningful ratios"},{"key":"d","text":"RNA carryover inflating the 260 reading"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A clean A260/280 with a low A260/230 on a MagBead extract almost always means residual chaotrope or ethanol from an incomplete wash or poor drying.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'A sample reads 4 ng/µL with an A260/230 of 0.4. What should you conclude first?', '[{"key":"a","text":"The wash step of the extraction failed"},{"key":"b","text":"The sample contains phenol"},{"key":"c","text":"The ratio is meaningless at this concentration"},{"key":"d","text":"The pedestal is scratched and needs service"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Purity ratios become meaningless below roughly 10 ng/µL, so rule out the low concentration before blaming the chemistry.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A trace shows a rising baseline across the whole spectrum. What is the right next step?', '[{"key":"a","text":"Re-blank with water and read again"},{"key":"b","text":"Spin the sample down and re-read"},{"key":"c","text":"Report the ratios with a note about phenol"},{"key":"d","text":"Switch the sample type to ssDNA"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A baseline rising across all wavelengths is particulates or turbidity, so centrifuge the sample and read it again.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A spectrum shows a distinct shoulder near 270 nm. What does that suggest?', '[{"key":"a","text":"Guanidinium carryover"},{"key":"b","text":"Particulates suspended in the sample"},{"key":"c","text":"Protein from incomplete digestion"},{"key":"d","text":"Phenol carryover"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'A shoulder near 270 nm is the phenol signature; chaotrope instead shows as a peak climbing at 230 nm.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You read an RNA sample with the DS-11 still set to dsDNA. What is the consequence?', '[{"key":"a","text":"The concentration is wrong; RNA uses 40, not 50"},{"key":"b","text":"The ratios are wrong but the concentration is fine"},{"key":"c","text":"Nothing, because the conversion factors are identical"},{"key":"d","text":"The instrument refuses to report a concentration"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'dsDNA, ssDNA and RNA use conversion factors of 50, 33 and 40 ng·cm/µL, so reading RNA as dsDNA reports a wrong concentration.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'A gDNA extract gives an A260/280 of 1.55. What does that indicate?', '[{"key":"a","text":"Clean double-stranded DNA"},{"key":"b","text":"Protein or phenol carryover"},{"key":"c","text":"RNA carryover in the extract"},{"key":"d","text":"Residual guanidinium from the binding buffer"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Clean dsDNA sits near 1.8; below about 1.7 indicates protein or phenol carryover. Salt and chaotrope show up in A260/230 instead.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Why should you check the baseline correction setting before trusting a run?', '[{"key":"a","text":"It resets to the default after every sample"},{"key":"b","text":"It persists for the rest of the measurement session"},{"key":"c","text":"It changes the dsDNA conversion factor"},{"key":"d","text":"It is applied only to RNA sample types"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The baseline correction setting persists for the remainder of the measurement session, so whatever it was set to applies to all your readings.' FROM ins;

-- ---------------------------------------------------------------------------
-- QC-09 — 7 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'QC-09');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'How often do you run the Qubit standards?', '[{"key":"a","text":"Both standards, fresh, for every assay"},{"key":"b","text":"Once per kit, then reuse the stored curve"},{"key":"c","text":"Only when the sample readings look implausible"},{"key":"d","text":"Once a day is enough on a busy schedule"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-09'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Both standards are run fresh with every assay. Reusing yesterday''s curve invalidates every number that comes off it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You are quantifying a low-input library. Which Qubit assay do you choose?', '[{"key":"a","text":"dsDNA BR, the usual choice for libraries"},{"key":"b","text":"RNA HS, since libraries are single-stranded"},{"key":"c","text":"dsDNA HS, the low-input assay"},{"key":"d","text":"Either dsDNA assay; the ranges overlap enough"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-09'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'dsDNA HS is for low-input material and libraries; BR is for extracts. Matching the assay to the expected range is what keeps the number valid.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'What happens if you read a sample that falls outside the assay''s range?', '[{"key":"a","text":"The instrument reports an error and no value"},{"key":"b","text":"You get a number that looks fine and is wrong"},{"key":"c","text":"The value is low but still proportionally correct"},{"key":"d","text":"The standards correct for it automatically"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-09'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Out-of-range readings return a plausible-looking but incorrect number, which is why the assay is chosen from the expected concentration.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A sample reads 80 ng/µL on the DS-11 and 25 ng/µL on the Qubit. Why the gap?', '[{"key":"a","text":"The Qubit tube was not incubated long enough"},{"key":"b","text":"The DS-11 was blanked with the wrong buffer"},{"key":"c","text":"The Qubit assay range was exceeded"},{"key":"d","text":"Absorbance also counts RNA, nucleotides and protein"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-09'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'A260 counts everything that absorbs, while the Qubit dye fluoresces only when bound to double-stranded DNA, so the Qubit reports usable template.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'How much Qubit working solution do you prepare for a run?', '[{"key":"a","text":"Enough for samples, both standards and overage"},{"key":"b","text":"Enough for the samples only; standards take neat dye"},{"key":"c","text":"A full kit''s worth, stored for the month ahead"},{"key":"d","text":"Twice the sample volume, left out on the bench"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-09'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Make it fresh at the kit''s dye:buffer ratio, enough for every sample plus both standards plus overage, protect it from light and discard leftovers.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You have vortexed the assay tubes briefly. What comes next?', '[{"key":"a","text":"Read at once, before the signal fades"},{"key":"b","text":"Chill on ice for two minutes, then read"},{"key":"c","text":"Incubate the full 2 minutes at room temperature"},{"key":"d","text":"Spin down and read after about 30 seconds"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-09'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The full 2 minute room-temperature incubation happens before reading; a short incubation gives an under-developed signal.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Which detail matters for the Qubit read itself?', '[{"key":"a","text":"Amber tubes, to protect the dye during the read"},{"key":"b","text":"Thin-walled clear tubes, with no bubbles"},{"key":"c","text":"Filling the tube to the top of the barrel"},{"key":"d","text":"A hard vortex immediately before inserting the tube"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-09'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Thin-walled clear 0.5 mL tubes at the kit''s total volume, mixed without bubbles, because a bubble in the read path gives a bad reading.' FROM ins;

-- ---------------------------------------------------------------------------
-- QC-14 — 6 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'QC-14');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You need the average fragment size of a ~1.5 kb full-gene 16S library. Which TapeStation assay?', '[{"key":"a","text":"Genomic DNA ScreenTape, for anything from an extraction"},{"key":"b","text":"D1000 or HS D1000, matched to the concentration"},{"key":"c","text":"D5000 for a 16S amplicon; Genomic DNA for HMW gDNA"},{"key":"d","text":"Any assay, because sizing is assay-independent"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Match the assay to the size you expect. D1000 and HS D1000 only size 35-1000 bp, so a 1.5 kb amplicon reads pinned near the ceiling and that wrong size propagates straight into the QC-20 molarity conversion. D5000 covers 100-5000 bp; Genomic DNA ScreenTape covers 200 bp upward for HMW gDNA.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Where does the average fragment size used in the nM conversion come from?', '[{"key":"a","text":"The DIN value reported for the sample"},{"key":"b","text":"The position of the tallest peak in the trace"},{"key":"c","text":"The expected amplicon size from the primer design"},{"key":"d","text":"Smear analysis across the defined region"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Smear analysis over a defined region gives the average fragment size, and that number feeds directly into the ng/µL to nM conversion.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'What are the two most common causes of a failed TapeStation lane?', '[{"key":"a","text":"Bubbles and unmixed sample"},{"key":"b","text":"Cold reagents and a worn needle"},{"key":"c","text":"Overloaded sample and a dirty pedestal"},{"key":"d","text":"A stale blank and the wrong plate definition"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Bubbles and unmixed sample top the list, which is why you vortex at the specified speed and then centrifuge before loading.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A gDNA sample comes back with a low DIN. What does that mean for nanopore sequencing?', '[{"key":"a","text":"Yield will be fine but base accuracy will fall"},{"key":"b","text":"Read lengths will be short whatever the prep does"},{"key":"c","text":"It matters only for the RNA workstream"},{"key":"d","text":"The library must then be quantified by absorbance"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'DIN scores gDNA intactness from 1 to 10, and a low DIN means short reads no matter how good the library prep is.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A library trace shows your expected peak plus a sharp peak at the very low end. What is that peak?', '[{"key":"a","text":"Degradation across the whole library"},{"key":"b","text":"An over-fragmented insert population"},{"key":"c","text":"Carryover from the previous lane"},{"key":"d","text":"Primer dimer"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Primer-dimer shows as a peak at the low end; degradation or over-fragmentation appears instead as a broad smear.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why is the TapeStation described as load-bearing for every pooled sequencing run?', '[{"key":"a","text":"It is the only instrument that measures concentration"},{"key":"b","text":"It replaces the Qubit for library input"},{"key":"c","text":"It is the lab''s only working sizing platform"},{"key":"d","text":"It sets the DIN threshold required for sequencing"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-14'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'With the Bioanalyzer 2100 in maintenance, the TapeStation is the sole source of the average fragment size that every molarity calculation needs.' FROM ins;

-- ---------------------------------------------------------------------------
-- QC-17 — 7 questions (5 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'QC-17');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A step calls for a higher bead-to-sample ratio than the previous one. What does that change?', '[{"key":"a","text":"More small fragments are retained"},{"key":"b","text":"Only the largest fragments are retained"},{"key":"c","text":"The final elution volume increases"},{"key":"d","text":"The binding incubation can be shortened"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-17'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Ratio is bead volume divided by sample volume, and it sets the size cutoff: a higher ratio keeps smaller fragments, a lower ratio keeps only larger ones.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'A cleanup specifies a 0.8x bead ratio and you have 50 µL of sample. What bead volume do you add?', '[{"key":"a","text":"0.8 µL"},{"key":"b","text":"62.5 µL"},{"key":"c","text":"40 µL"},{"key":"d","text":"50 µL"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-17'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Bead volume = ratio x sample volume = 0.8 x 50 µL = 40 µL. Dividing instead of multiplying gives 62.5 µL and the wrong size cutoff.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You intended a 0.7x cleanup on 50 µL of sample but added 45 µL of beads. What did you actually run?', '[{"key":"a","text":"0.45x, retaining only the largest fragments"},{"key":"b","text":"1.4x, retaining essentially everything"},{"key":"c","text":"0.7x; that volume difference does not matter"},{"key":"d","text":"0.9x, retaining more small fragments"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-17'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], '45 µL / 50 µL = 0.9x. The higher-than-intended ratio shifts the cutoff down, so smaller fragments carry through.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'How are the two 80% ethanol washes performed?', '[{"key":"a","text":"Off the magnet, resuspending the beads each time"},{"key":"b","text":"On the magnet, added down the opposite wall, no resuspension"},{"key":"c","text":"On the magnet, using ethanol made up last month"},{"key":"d","text":"Off the magnet, with a brief vortex between washes"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-17'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The plate stays on the magnet, fresh 80% ethanol is added down the opposite wall, and the pellet is not resuspended.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'When do you stop air-drying the bead pellet?', '[{"key":"a","text":"As soon as the last ethanol is aspirated"},{"key":"b","text":"When the pellet loses its sheen"},{"key":"c","text":"When the pellet has visibly cracked"},{"key":"d","text":"After it has dried on the magnet overnight"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-17'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Dry only until the sheen is gone. A cracked pellet will not fully re-elute, and the lost yield looks like a bad extraction.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Your eluate looks faintly cloudy after transfer. What do you do?', '[{"key":"a","text":"Carry on; the cloudiness settles out on its own"},{"key":"b","text":"Dilute it twofold before quantifying"},{"key":"c","text":"Return it to the magnet and re-transfer"},{"key":"d","text":"Add more elution buffer and incubate again"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-17'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Cloudiness means carried-over beads, which interfere with quantification and downstream enzymes, so re-magnetise and transfer again.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Before aspirating the supernatant on the magnet, what must be true?', '[{"key":"a","text":"The supernatant is completely clear"},{"key":"b","text":"The beads are fully resuspended"},{"key":"c","text":"The plate has cooled below room temperature"},{"key":"d","text":"The eluate has been added already"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-17'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Wait until the supernatant is completely clear, then remove it without touching the pellet.' FROM ins;

-- ---------------------------------------------------------------------------
-- QC-20 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'QC-20');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'In the ng/µL to nM conversion, what does the constant 660 represent?', '[{"key":"a","text":"The average molecular weight of a base pair"},{"key":"b","text":"The molecular weight of a single nucleotide"},{"key":"c","text":"A unit conversion between ng and pg"},{"key":"d","text":"The wavelength at which concentration is read"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-20'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], '660 g/mol/bp is the average molecular weight of one base pair of double-stranded DNA.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Which concentration value belongs in the molarity conversion, and why?', '[{"key":"a","text":"The DS-11 value, because it reads a full spectrum"},{"key":"b","text":"The mean of the Qubit and DS-11 values"},{"key":"c","text":"The Take3 value, since the plate is read at once"},{"key":"d","text":"The Qubit value, because absorbance over-reads"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-20'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The concentration must be fluorometric. Absorbance counts RNA and free nucleotides as DNA, so a DS-11 number inflates the calculated molarity.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Which fragment length belongs in the conversion?', '[{"key":"a","text":"The expected amplicon size from the primers"},{"key":"b","text":"The TapeStation smear-analysis average"},{"key":"c","text":"The size of the tallest peak on the trace"},{"key":"d","text":"The upper size limit of the assay used"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-20'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Use the measured average from TapeStation smear analysis over the correct region, never the expected amplicon size or a guess.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A library is 10 ng/µL with a measured average length of 1500 bp. What is its molarity?', '[{"key":"a","text":"1.0 nM"},{"key":"b","text":"10.1 nM"},{"key":"c","text":"15.2 nM"},{"key":"d","text":"101 nM"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-20'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'nM = (10 x 10^6) / (660 x 1500) = 10,000,000 / 990,000 = 10.1 nM.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A 300 bp library also reads 10 ng/µL. What is its molarity?', '[{"key":"a","text":"10.1 nM"},{"key":"b","text":"30.3 nM"},{"key":"c","text":"50.5 nM"},{"key":"d","text":"505 nM"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-20'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'nM = (10 x 10^6) / (660 x 300) = 10,000,000 / 198,000 = 50.5 nM, five times the molarity of a 1500 bp library at the same mass concentration.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Your 20 ng/µL library with a 1600 bp average comes out at 1900 nM. What went wrong?', '[{"key":"a","text":"Nothing; that is the expected value"},{"key":"b","text":"The Qubit reading must have been taken wrongly"},{"key":"c","text":"The length should have been entered in kb"},{"key":"d","text":"A factor-of-100 error; it should be about 19 nM"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'QC-20'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], '(20 x 10^6) / (660 x 1600) = 20,000,000 / 1,056,000 = 18.9, so about 19 nM. Getting 1900 or 0.19 signals a factor-of-100 slip.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Your library trace shows a primer-dimer shoulder. What does that mean for the length you use?', '[{"key":"a","text":"The true average is lower than you would guess"},{"key":"b","text":"Nothing; use the expected amplicon size"},{"key":"c","text":"The true average is higher than you would guess"},{"key":"d","text":"Use the size of the dimer peak instead"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'QC-20'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Dimers pull the measured average down, so the true average is lower than the expected amplicon size and only the smear value is trustworthy.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-01 — 6 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-01');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A new undergrad wants to start pipetting tomorrow but has not taken EHS869 yet. What does the lab require?', '[{"key":"a","text":"They can start now as long as someone signs off later"},{"key":"b","text":"They can start now if a trained person is in the room"},{"key":"c","text":"They must complete EHS869 before any wet-lab work begins"},{"key":"d","text":"They only need it if they will handle chemicals"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'UF states it plainly: all researchers working in wet lab spaces must complete EHS869 before beginning work in the lab. It is the gate, backed by OSHA 29 CFR 1910.1450.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You completed EHS869 two years ago and have worked here since. Does the lab expect you to retake it this year?', '[{"key":"a","text":"Yes, it renews annually like the waste courses"},{"key":"b","text":"No, EHS869 is one-time with no annual renewal"},{"key":"c","text":"Yes, it renews every two years"},{"key":"d","text":"Only if you have changed labs since taking it"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'EHS869 is an online, one-time course in myTraining. Unlike the waste and bloodborne pathogen courses, it has no annual renewal.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You have your EHS869 certificate in hand. What still has to happen before you touch a bench?', '[{"key":"a","text":"Nothing further; the certificate alone clears you for bench work"},{"key":"b","text":"You must first complete a second online EHS course"},{"key":"c","text":"Roster entry in Gator TRACS, plus reading the lab CHP"},{"key":"d","text":"You must be issued a respirator and fit-tested for it"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Two things follow the course before bench work: roster entry in Gator TRACS / LATCH with two emergency contacts, and reading the lab-specific CHP and the SOPs for the hazards you will handle.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'The page names the hazards whose SOPs you must read at minimum before bench work. Which one is on that list?', '[{"key":"a","text":"Liquid nitrogen"},{"key":"b","text":"Hydrofluoric acid"},{"key":"c","text":"Radioisotopes"},{"key":"d","text":"Formaldehyde"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The minimum SOP reading list for this lab is guanidinium lysis buffers, ethanol, bleach and liquid nitrogen.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A labmate calls EHS869 just a UF formality. What is the accurate response?', '[{"key":"a","text":"It is a lab preference that the PI can waive"},{"key":"b","text":"It is backed by an OSHA standard, 29 CFR 1910.1450"},{"key":"c","text":"It is recommended by UF but not actually required"},{"key":"d","text":"It is only required for paid staff, not students"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The requirement is not local preference. It is backed by OSHA 29 CFR 1910.1450, so no one in the lab can waive it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why does the lab ask you to record your EHS869 completion date here rather than leave it in myTraining?', '[{"key":"a","text":"myTraining deletes completion records after one year"},{"key":"b","text":"The PI has no way to access myTraining at all"},{"key":"c","text":"This record replaces the official myTraining record"},{"key":"d","text":"So the lab has it at audit time without digging through myTraining"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-01'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Recording it here means the lab can produce the completion date at audit time without having to dig through myTraining.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-02 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-02');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A labmate is about to pour bleach into the carboy holding Zymo MagBead lysis waste. What do you do?', '[{"key":"a","text":"Let them; the bleach neutralises the guanidinium"},{"key":"b","text":"Stop them; guanidinium plus hypochlorite releases cyanide gas"},{"key":"c","text":"Let them, as long as it is done in a fume hood"},{"key":"d","text":"Stop them; the mixture will foam over the carboy"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Guanidinium thiocyanate mixed with hypochlorite releases cyanide gas. That is why bleach never goes into a lysis-waste container.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You need to know what a new solvent must never be mixed with. Which SDS section do you open?', '[{"key":"a","text":"Section 2"},{"key":"b","text":"Section 7"},{"key":"c","text":"Section 10"},{"key":"d","text":"Section 8"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Section 10 covers incompatibilities. This is where do not mix with bleach lives, including for guanidinium thiocyanate.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A reagent splashes onto a coworker''s arm and you need immediate treatment guidance from the SDS. Which section?', '[{"key":"a","text":"Section 4"},{"key":"b","text":"Section 8"},{"key":"c","text":"Section 10"},{"key":"d","text":"Section 2"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Section 4 of the SDS is first aid. Section 8 covers exposure controls and PPE, which is what you read before starting work, not during a splash.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Which of these is a GHS label element the course teaches you to read?', '[{"key":"a","text":"The CAS registry number"},{"key":"b","text":"The manufacturer''s lot number"},{"key":"c","text":"The NFPA diamond rating"},{"key":"d","text":"The signal word"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'GHS gives you pictograms, a signal word (Danger or Warning), hazard statements (H-codes) and precautionary statements (P-codes).' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You pick up an unfamiliar bottle from a shared shelf. What on the label tells you fastest what it can do to you?', '[{"key":"a","text":"The volume and the concentration"},{"key":"b","text":"The supplier''s catalogue number"},{"key":"c","text":"The pictograms and the signal word"},{"key":"d","text":"The expiry date printed on the cap"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The point of GHS training is being able to look at a bottle and know what it will do to you. The pictograms and signal word carry that at a glance.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Which lab reagents are the guanidinium thiocyanate source that makes bleach contact dangerous?', '[{"key":"a","text":"The Zymo MagBead lysis and binding buffers"},{"key":"b","text":"The 70% ethanol wash bottles"},{"key":"c","text":"The agarose gel running buffer"},{"key":"d","text":"The nuclease-free water stocks"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Guanidinium thiocyanate is in the Zymo MagBead lysis and binding buffers. Knowing which reagents carry the hazard is what keeps bleach out of that waste stream.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'How often must EHS814 be repeated?', '[{"key":"a","text":"Every year, like the waste courses"},{"key":"b","text":"Never; it is a one-time course"},{"key":"c","text":"Every two years, like the shipping course"},{"key":"d","text":"Every three years, on a fixed cycle"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-02'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'EHS814 is online in myTraining and one-time.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-03 — 6 questions (2 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-03');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A new wetland soil sample arrives and nobody knows whether it carries pathogens. How should primary handling be done?', '[{"key":"a","text":"BSL-1, since soil is environmental rather than clinical"},{"key":"b","text":"No containment is needed until a pathogen is identified"},{"key":"c","text":"BSL-2 practices, because infectious status is unknown"},{"key":"d","text":"BSL-3 practices until the sample has been screened"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'We handle animal-associated and environmental material of unknown infectious status, so BSL-2 practices are the default for primary sample handling.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'A labmate says the PI told them in the hallway that fish gut samples can be handled at BSL-1. Is that enough?', '[{"key":"a","text":"Yes, the PI''s word is sufficient authorisation"},{"key":"b","text":"Yes, provided a second person also heard it"},{"key":"c","text":"Yes, if you note it in your lab notebook afterwards"},{"key":"d","text":"No, it must be in writing for that sample type"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The default is BSL-2 unless the PI has ruled otherwise in writing for that specific sample type. A verbal comment does not lower containment.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Which of these is one of the exposure routes the course covers?', '[{"key":"a","text":"Absorption through intact skin"},{"key":"b","text":"Mucous membrane contact"},{"key":"c","text":"Radiation exposure"},{"key":"d","text":"Thermal contact"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The four routes covered are inhalation of aerosols, ingestion, percutaneous and mucous membrane.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You vortex an open tube of raw water on the bench. Which exposure route does that mainly create?', '[{"key":"a","text":"Inhalation of aerosols"},{"key":"b","text":"Ingestion"},{"key":"c","text":"Percutaneous injury"},{"key":"d","text":"Skin absorption"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Vortexing an open tube throws up aerosols, and inhalation of aerosols is one of the four routes of exposure.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'EHS853 is listed as a prerequisite for which two sign-offs?', '[{"key":"a","text":"Autoclave operation and cryogen handling"},{"key":"b","text":"Shipping and hazardous waste management"},{"key":"c","text":"Biomedical waste and BSL-2 practices"},{"key":"d","text":"Chemical hygiene and hazard communication"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'EHS853 is the prerequisite for the biomedical-waste and BSL-2 sign-offs.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why does most work in this lab fall under UF''s biohazard registration triggers?', '[{"key":"a","text":"Because the lab maintains human cell lines"},{"key":"b","text":"Because our samples may carry infectious agents"},{"key":"c","text":"Because we use recombinant DNA in every project"},{"key":"d","text":"Because the lab holds a select-agent permit"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-03'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'One of UF''s biohazard-registration triggers is analysis of samples potentially contaminated with infectious agents, which describes most of what comes through this lab.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-16 — 6 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-16');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You start a fresh chemical waste container with the first millilitre of ethanol rinse. When must the label go on?', '[{"key":"a","text":"Now, when the first waste goes in"},{"key":"b","text":"Once the container is about half full"},{"key":"c","text":"Once the container is full"},{"key":"d","text":"When you submit the pickup request"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Label the container when the first waste goes in, not when it is full. This is one of the most commonly broken rules.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You find a waste carboy with a funnel resting in its neck between additions. How should you read that?', '[{"key":"a","text":"Fine; the funnel keeps the neck clean between additions"},{"key":"b","text":"Fine, as long as someone is working in the room"},{"key":"c","text":"It is an open container and must be closed"},{"key":"d","text":"Acceptable, provided it sits in secondary containment"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Containers stay closed except when actively adding waste, and a funnel left in the neck counts as an open container.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A waste container is labelled EtOH + GITC waste. What is wrong with it?', '[{"key":"a","text":"Nothing; those are standard chemical abbreviations"},{"key":"b","text":"The two wastes belong in separate containers"},{"key":"c","text":"The label is missing a start date field"},{"key":"d","text":"Abbreviations are not labels; full chemical names are required"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'GITC and EtOH are not labels. Guanidinium thiocyanate and ethanol are. Full chemical names are required.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You have 20 mL of leftover ethanol rinse. Can it go down the sink because the volume is small?', '[{"key":"a","text":"Yes, if you flush it with plenty of water"},{"key":"b","text":"No, nothing goes down the drain without explicit approval"},{"key":"c","text":"Yes, ethanol is exempt from the drain rules"},{"key":"d","text":"Yes, if you dilute it below 10% first"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Nothing goes down the drain without explicit approval, regardless of volume or dilution.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'How often must EHS809 be renewed?', '[{"key":"a","text":"It is a one-time course"},{"key":"b","text":"Every two years"},{"key":"c","text":"Every year"},{"key":"d","text":"Every three years"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'EHS809 renews every year, online in myTraining.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'A new liquid waste bottle is set directly on the bench shelf. What is missing?', '[{"key":"a","text":"Secondary containment under the container"},{"key":"b","text":"A fume hood over the container"},{"key":"c","text":"A spill pillow taped to the shelf"},{"key":"d","text":"A grounding strap on the bottle"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-16'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Secondary containment goes under every liquid waste container.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-25 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-25');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A tube of animal sample splashes into your eye. What is the first thing you do?', '[{"key":"a","text":"Call your supervisor and wait for instructions"},{"key":"b","text":"Flush immediately at the eyewash"},{"key":"c","text":"Drive yourself to the nearest urgent care"},{"key":"d","text":"Make the bench safe first, then rinse"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The post-exposure procedure is time-sensitive and starts with washing or flushing immediately. Reporting and medical evaluation come after.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You have flushed the exposure site and you feel fine. What is required next?', '[{"key":"a","text":"Nothing further, as long as you have no symptoms"},{"key":"b","text":"Write it up at the next lab meeting"},{"key":"c","text":"Wait 48 hours and report only if symptoms appear"},{"key":"d","text":"Report to your supervisor the same day"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Reporting to your supervisor the same day is part of the post-exposure procedure. Feeling fine does not remove that step.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'After reporting an exposure, where should you go for medical evaluation?', '[{"key":"a","text":"The designated occupational-medicine provider"},{"key":"b","text":"The nearest walk-in clinic"},{"key":"c","text":"Your own primary care doctor next week"},{"key":"d","text":"The campus student health pharmacy"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Go to the designated occupational-medicine provider, not a walk-in clinic that has no idea what you were handling.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A labmate says they glove up only for samples that look dirty. What does universal precautions actually require?', '[{"key":"a","text":"Gloves only for human-derived samples"},{"key":"b","text":"Gloves only when a sample is known to be infectious"},{"key":"c","text":"Treating every sample as infectious"},{"key":"d","text":"Gloves only when the PI is in the room"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Universal precautions means you treat every sample as infectious, not just the ones that look dirty.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You have occupational exposure but do not want the hepatitis B vaccine. What must happen?', '[{"key":"a","text":"You are barred from all sample handling work"},{"key":"b","text":"A signed declination must be on file"},{"key":"c","text":"Nothing; the vaccine is optional and undocumented"},{"key":"d","text":"You must repeat EHS850G instead of vaccinating"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The departmental BBP program offers free hepatitis B vaccination, and either documented vaccination or a documented declination must be on file.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'How often is EHS850G required?', '[{"key":"a","text":"One time only"},{"key":"b","text":"Every two years"},{"key":"c","text":"Every three years"},{"key":"d","text":"Every year"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The UF Biosafety Manual requires initial and annual BBP training, so this renews every year.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You never handle human blood, only dolphin blow and bird caeca. Does bloodborne pathogen training apply to you?', '[{"key":"a","text":"Yes, it extends to the animal-derived material we handle"},{"key":"b","text":"No, it covers human blood only"},{"key":"c","text":"No, unless you also work with cell lines"},{"key":"d","text":"Only if you are paid staff rather than a student"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-25'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The standard covers human blood and other potentially infectious material, and applies by extension to animal-derived material handled under the Animal Contact Program.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-27 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-27');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You finish a Zymo MagBead extraction and have a bottle of binding waste. Which stream does it go to?', '[{"key":"a","text":"Red bag, because the sample was biological"},{"key":"b","text":"Sharps container, because the tubes are rigid"},{"key":"c","text":"Chemical waste, because it is chaotropic"},{"key":"d","text":"Regular trash once the beads have settled"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'MagBead binding waste is both biological and chaotropic, and it goes to chemical waste even though the sample was biological.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You break a Pasteur pipette at the bench. Where does it go?', '[{"key":"a","text":"The sharps container"},{"key":"b","text":"The glass box"},{"key":"c","text":"The regular trash, wrapped in paper towel"},{"key":"d","text":"The red bag with other contaminated plastics"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Broken glass and Pasteur pipettes go in the glass box. Not the sharps container, and not the regular trash.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You have just finished with a needle. What is the correct next move?', '[{"key":"a","text":"Recap it carefully using one hand"},{"key":"b","text":"Recap it using a bench-top recapping block"},{"key":"c","text":"Bend the tip over before disposing of it"},{"key":"d","text":"Put it straight into the sharps container uncapped"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Never recap a needle. It goes straight into the sharps container along with blades and anything else that can puncture.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Pipette tips used to aliquot raw water samples go where?', '[{"key":"a","text":"Red bag or biohazard box"},{"key":"b","text":"Glass box"},{"key":"c","text":"Chemical waste"},{"key":"d","text":"Regular trash"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'The red bag or biohazard box takes anything contaminated with biological material, including tips, plates, tubes and gloves from sample handling.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'A gel stained with SYBR has been imaged and is no longer needed. Which stream?', '[{"key":"a","text":"Red bag"},{"key":"b","text":"Regular trash"},{"key":"c","text":"Chemical waste"},{"key":"d","text":"Sharps container"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'EtBr and SYBR gel waste is a chemical stream, alongside guanidinium lysis and binding waste and ethanol.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'You open a new container for guanidinium lysis waste. How should it be labelled and kept?', '[{"key":"a","text":"Formula abbreviations are fine if the SOP defines them"},{"key":"b","text":"Full chemical names at first use, and kept closed"},{"key":"c","text":"Labelled once it is about two-thirds full"},{"key":"d","text":"Labelled biohazard and left open to vent"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'It is labelled with full chemical names at the moment the first drop goes in, no formulas or abbreviations, and the container stays closed.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'How often must the biomedical waste course be renewed?', '[{"key":"a","text":"One time only"},{"key":"b","text":"Every three years"},{"key":"c","text":"Every two years"},{"key":"d","text":"Every year"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-27'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'EHS851 renews every year. EHS854 is the satellite-campus variant of the same course.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-29 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-29');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'Your protocol calls for bead beating rhino midden samples. Where must that step happen?', '[{"key":"a","text":"On the open bench with a sash lowered nearby"},{"key":"b","text":"Inside the biosafety cabinet"},{"key":"c","text":"On the bench, behind a splash shield"},{"key":"d","text":"In a fume hood with the sash at working height"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-29'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A biosafety cabinet is required for any aerosol-generating procedure, and bead beating is named as one.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'A labmate is aliquoting raw water in a lab coat and gloves but no eye protection. Is that acceptable?', '[{"key":"a","text":"Yes, eye protection is discretionary for small liquid volumes"},{"key":"b","text":"Yes, if they are wearing prescription glasses"},{"key":"c","text":"Yes, provided the volume is under one millilitre"},{"key":"d","text":"No, eye protection is mandatory at BSL-2"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-29'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'At BSL-2 the lab coat, gloves and eye protection are mandatory, not discretionary.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You need to carry tubes of bird caeca slurry to a room down the hall. How do you move them?', '[{"key":"a","text":"In a leak-proof secondary container"},{"key":"b","text":"In an open rack held with both hands"},{"key":"c","text":"In a cardboard tray lined with paper towel"},{"key":"d","text":"In your gloved hands, one tube at a time"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-29'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'BSL-2 requires leak-proof secondary containers for both storage and transport.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You are setting up PCR from purified DNA extracts. What containment level does that work fall under?', '[{"key":"a","text":"BSL-2, because the DNA came from environmental samples"},{"key":"b","text":"BSL-2, because the work happens in a BSL-2 room"},{"key":"c","text":"BSL-1, because the DNA is purified"},{"key":"d","text":"BSL-3, if the source sample was of unknown status"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-29'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Primary handling of animal- and environment-derived material is BSL-2, but downstream work on purified DNA is BSL-1.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You show your EHS853 completion certificate as proof you can work at BSL-2. Is that enough?', '[{"key":"a","text":"Yes, the completion certificate is the required record"},{"key":"b","text":"No, a supervisor-signed proficiency record is also required"},{"key":"c","text":"Yes, as long as it is less than a year old"},{"key":"d","text":"No, you need to pass a second online course too"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-29'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'UF requires personnel to demonstrate proficiency, which means a documented, agent-specific, supervisor-signed competency, not just a completion certificate.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Which of these protocol steps counts as aerosol-generating?', '[{"key":"a","text":"Labelling tubes before an extraction"},{"key":"b","text":"Loading a PCR plate with purified DNA"},{"key":"c","text":"Reading a gel image at the bench"},{"key":"d","text":"Pouring a sediment slurry between tubes"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-29'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Pouring is listed as aerosol-generating, along with vortexing open tubes, bead beating, sonicating and anything that can splash.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Under BSL-2, where must biohazard signage appear?', '[{"key":"a","text":"On all containers and at the lab entry"},{"key":"b","text":"On the lab entry door only"},{"key":"c","text":"On the freezer doors only"},{"key":"d","text":"On outgoing shipping boxes only"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-29'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'BSL-2 adds biohazard signage on all containers as well as at the lab entry.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-31 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-31');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'The BSC''s certification sticker expired three months ago. What do you do?', '[{"key":"a","text":"Use it but keep the sash lower than usual"},{"key":"b","text":"Use it only for clean molecular setup"},{"key":"c","text":"Stop and report it; do not use the cabinet"},{"key":"d","text":"Use it after running the blower for 30 minutes"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-31'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'UF requires annual certification for BSCs used at BSL-2. If the date has passed, stop and report it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Where should your hands and materials sit while you work in the BSC?', '[{"key":"a","text":"Four to six inches inside the sash"},{"key":"b","text":"Right at the front edge of the sash"},{"key":"c","text":"Pressed up against the rear wall"},{"key":"d","text":"Wherever the overhead light is brightest"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-31'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Work four to six inches inside the sash, never at the very front edge, where containment is weakest.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A labmate wants to flame a loop inside the BSC. Why is that not allowed?', '[{"key":"a","text":"It will set off the smoke detector in the room"},{"key":"b","text":"It burns off the ethanol you used to wipe the surface"},{"key":"c","text":"It automatically voids the cabinet''s annual certification"},{"key":"d","text":"The thermal plume disrupts laminar flow and can damage the HEPA"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-31'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'No open flames in the BSC. The thermal plume wrecks the laminar flow and can damage the HEPA filter.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You lay an absorbent pad across the work surface so that it covers the front grille. What is the problem?', '[{"key":"a","text":"The pad will wick ethanol down into the plenum below"},{"key":"b","text":"Blocking the grille destroys the air curtain that gives containment"},{"key":"c","text":"The pad makes the surface too slippery for tube racks"},{"key":"d","text":"Absorbent pads are not permitted at BSL-2 at all"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-31'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Never block the front or rear grilles. That is what destroys the air curtain protecting you and the sample.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You wiped the BSC surface with 10% bleach after handling biological material. What must follow?', '[{"key":"a","text":"Nothing; bleach is the final step"},{"key":"b","text":"A rinse with sterile water, then air drying"},{"key":"c","text":"A wipe with 70% ethanol"},{"key":"d","text":"A UV cycle of at least fifteen minutes"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-31'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Bleach corrodes stainless steel and must be wiped off, so a bleach decontamination is followed by ethanol.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Halfway through your work you realise a reagent rack is still outside the cabinet. Why is fetching it a problem?', '[{"key":"a","text":"The blower has to be restarted from cold afterwards"},{"key":"b","text":"The cabinet must be recertified after any interruption"},{"key":"c","text":"The surface decontamination you did is invalidated"},{"key":"d","text":"Every in-and-out is a breach; load everything in one pass"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-31'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Load everything you need before you start. Every in-and-out through the air curtain is a breach of containment.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Why should arm movements inside the BSC be slow and deliberate?', '[{"key":"a","text":"Rapid movements pull room air in over your samples"},{"key":"b","text":"Rapid movements overheat the blower motor"},{"key":"c","text":"Slow movements keep the HEPA filter from clogging"},{"key":"d","text":"Slow movements stop the sash alarm from sounding"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-31'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Rapid arm movements drag room air in across the work zone, contaminating your samples and breaking the air curtain.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-34 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-34');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You need to autoclave two litres of media in a bottle. Which cycle do you select?', '[{"key":"a","text":"Gravity, because it is faster for bottled loads"},{"key":"b","text":"The liquid or slow-exhaust cycle"},{"key":"c","text":"Either one; the cycle only changes the run time"},{"key":"d","text":"Gravity, with the door cracked at the end"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-34'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Liquids run on a liquid or slow-exhaust cycle. A gravity cycle will flash-boil them and you open the door onto a scalding mess.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'The indicator tape on your load has changed colour. What does that prove?', '[{"key":"a","text":"The load is sterile and ready to use"},{"key":"b","text":"The load got hot, not that it is sterile"},{"key":"c","text":"The chamber held pressure for the whole cycle"},{"key":"d","text":"The biological spore indicator has passed"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-34'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Indicator tape tells you the load got hot, not that it got sterile. Periodic biological spore indicators are what prove sterilisation.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'A labmate adds a tightly sealed bottle to your load. What do you do?', '[{"key":"a","text":"Run it, but choose a longer cycle"},{"key":"b","text":"Run it, but stand it in a secondary tray"},{"key":"c","text":"Run it, but reduce the chamber temperature"},{"key":"d","text":"Reject it; sealed containers become pressure vessels"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-34'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Never autoclave sealed containers of any kind. They become pressure vessels.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'A bag of waste has had bleach poured into it. Can it be autoclaved?', '[{"key":"a","text":"No; it releases chlorine gas and corrodes the chamber"},{"key":"b","text":"Yes, if it is double-bagged first"},{"key":"c","text":"Yes, but on a gravity cycle only"},{"key":"d","text":"Yes, if it is diluted with water first"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-34'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Chlorinated plastics and anything containing bleach are never autoclaved. They release chlorine gas and corrode the chamber.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'How should liquid containers be prepared for the autoclave?', '[{"key":"a","text":"Filled to the shoulder, caps tightened, placed in a tray"},{"key":"b","text":"Filled to the top, caps loosened, straight onto the shelf"},{"key":"c","text":"Half full, caps tightened, straight onto the shelf"},{"key":"d","text":"No more than two-thirds full, caps loosened, in a tray"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-34'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Leave headspace: liquid containers no more than two-thirds full, caps loosened, and standing in a secondary tray.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The cycle just finished and you need your flasks of media right away. What is the safe move?', '[{"key":"a","text":"Open the door immediately; the cycle is over"},{"key":"b","text":"Crack the door and reach in with nitrile gloves"},{"key":"c","text":"Wait for depressurisation and cooling"},{"key":"d","text":"Pull them out quickly using folded paper towels"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-34'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Superheated liquid can boil over minutes after the cycle ends. Wait for full depressurisation, then use heat gloves and face protection.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'You want to know how often biological spore indicators must be run. Where does the page tell you to get that answer?', '[{"key":"a","text":"Confirm with bso@ehs.ufl.edu and record it in the lab SOP"},{"key":"b","text":"It is fixed at once per month by UF policy"},{"key":"c","text":"It is printed on the indicator tape packaging"},{"key":"d","text":"The autoclave manufacturer sets it automatically"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-34'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'UF does not publish a BI frequency, so the page says to confirm it with the biosafety office and record the answer in the lab SOP.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-39 — 7 questions (5 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-39');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You need to move an open LN2 dewar to another floor. A colleague suggests you both ride up with it. What do you do?', '[{"key":"a","text":"Ride with it but hold your breath near the top"},{"key":"b","text":"Ride with it if the trip takes under a minute"},{"key":"c","text":"Send the dewar up alone and meet it upstairs"},{"key":"d","text":"Ride with it with the lid resting loosely on top"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-39'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Never ride in a lift with an open dewar. One litre of LN2 becomes about 700 litres of gas, which displaces oxygen fast in a small space. Send it alone and meet it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'What PPE do you put on before opening a dewar?', '[{"key":"a","text":"Safety glasses and nitrile gloves"},{"key":"b","text":"A face shield and nitrile gloves"},{"key":"c","text":"Safety glasses and cryo gloves"},{"key":"d","text":"A face shield and cryo gloves"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-39'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'PPE is cryo gloves plus a face shield. Safety glasses are not enough because the hazard is splash to the face.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You must retrieve vials that were stored in the liquid phase of a dewar. What do you do after pulling them out?', '[{"key":"a","text":"Warm them quickly in your gloved hand"},{"key":"b","text":"Let them vent behind a shield before handling"},{"key":"c","text":"Open them at once to release any pressure"},{"key":"d","text":"Put them straight into a warm water bath"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-39'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'A vial stored in liquid phase can take LN2 in past the seal and burst on warming. Let vials vent behind a shield before handling.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You need to get dry ice to another building. A labmate suggests a sealed cooler in your car. What is wrong?', '[{"key":"a","text":"Dry ice must never be sealed or carried in a car cabin"},{"key":"b","text":"Dry ice must be double-bagged before it goes in a cooler"},{"key":"c","text":"Coolers are fine but the trip must stay under ten minutes"},{"key":"d","text":"Only the sealing is a problem; the car cabin is fine"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-39'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Dry ice carries the same asphyxiation risk: never in a sealed container, never in a walk-in cold room, and never in a car cabin.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You get a cold burn on a finger from a splash of LN2. What is the correct first aid?', '[{"key":"a","text":"Rub the area briskly to restore circulation"},{"key":"b","text":"Immerse it in hot water to rewarm it quickly"},{"key":"c","text":"Flush with lukewarm water and get medical attention"},{"key":"d","text":"Apply ice to numb the area first"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-39'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Cold burns look like thermal burns. Flush with lukewarm water, not hot, and get medical attention.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Why does the page say oxygen displacement by nitrogen happens without warning?', '[{"key":"a","text":"Nitrogen alarms are not installed in most lab spaces"},{"key":"b","text":"Nitrogen is odourless and you pass out before feeling breathless"},{"key":"c","text":"Nitrogen gas is only visible at very low temperatures"},{"key":"d","text":"The dewar''s pressure gauge does not register slow leaks"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-39'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Nitrogen is odourless and you do not feel short of breath before you pass out, which is why the hazard gives no warning.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Why does the lab prefer vapour-phase storage over liquid-phase for cryovials?', '[{"key":"a","text":"Vapour phase keeps samples colder than liquid phase"},{"key":"b","text":"Vapour phase consumes less nitrogen over a year"},{"key":"c","text":"Liquid phase makes vial labels peel off faster"},{"key":"d","text":"Liquid nitrogen can seep past the seal and burst the vial"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-39'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'In liquid phase, LN2 can get in past the vial seal, and on warming the vial becomes a pressure vessel that can burst.' FROM ins;

-- ---------------------------------------------------------------------------
-- SAF-43 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SAF-43');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'You pack a shipment but a labmate hands it to the courier. Do you need current EHS852 certification?', '[{"key":"a","text":"No, only the person who hands it over needs it"},{"key":"b","text":"Yes, it applies to anyone who prepares or transports"},{"key":"c","text":"No, if the PI holds certification for the lab"},{"key":"d","text":"Only if the shipment is leaving the country"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-43'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The requirement applies to anyone who transports or prepares dangerous goods, not just whoever hands the box to the courier.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'You are shipping typical research specimens from a field site back to the lab. Which classification usually applies?', '[{"key":"a","text":"Category A, UN2814"},{"key":"b","text":"Exempt animal specimen"},{"key":"c","text":"Not regulated"},{"key":"d","text":"Category B, UN3373"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-43'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Category B, UN3373, Biological Substance Category B, covers most diagnostic and research specimens. Category A is rare for this lab.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You are shipping on dry ice. What must be true of the package and the paperwork?', '[{"key":"a","text":"Net mass of dry ice declared, and the package able to vent"},{"key":"b","text":"The package fully sealed so no gas escapes in transit"},{"key":"c","text":"The dry ice mass noted on the inner bag only"},{"key":"d","text":"No dry ice declaration needed for domestic shipments"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-43'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Dry ice is separately regulated as UN1845, Class 9. The net mass goes on the airway bill and the package must vent, never fully sealed.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You need to get a Category B package to the airport. Can you drive it in your own car?', '[{"key":"a","text":"Yes, if it rides in the boot and not the cabin"},{"key":"b","text":"Yes, as long as the trip stays on campus"},{"key":"c","text":"No, dangerous goods may not travel in a personal vehicle"},{"key":"d","text":"Yes, if you hold current EHS852 certification"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SAF-43'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Dangerous goods may not travel in a personal vehicle. Use a state vehicle.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'You are shipping preserved DNA extracts. How are these usually classified?', '[{"key":"a","text":"Not regulated in most cases"},{"key":"b","text":"Category B, UN3373"},{"key":"c","text":"Category A, UN2900"},{"key":"d","text":"Exempt human specimen"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-43'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Preserved DNA extracts are not regulated in most cases.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'How long does EHS852 certification stay valid?', '[{"key":"a","text":"One year"},{"key":"b","text":"Three years"},{"key":"c","text":"Two years"},{"key":"d","text":"It does not expire"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-43'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'It expires every two years, matching the DOT and IATA recurrent training rule.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'A collaborator asks how to avoid the dry ice and customs problems on a sample shipment. What does the page suggest?', '[{"key":"a","text":"Ship in smaller batches spread over several days"},{"key":"b","text":"Preserve in DNA/RNA Shield, ethanol or on FTA cards"},{"key":"c","text":"Declare the shipment as Category A to be safe"},{"key":"d","text":"Send it by sea freight rather than by air"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SAF-43'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'DNA/RNA Shield, ethanol or FTA cards can move a shipment to ambient temperature and sometimes out of Category B, removing the dry ice problem and most customs friction.' FROM ins;

-- ---------------------------------------------------------------------------
-- SEQ-11 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SEQ-11');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'TapeStation smear analysis puts your gDNA at about 3 kb, but the Qubit mass and the purity ratios are ideal. What does that mean for the run?', '[{"key":"a","text":"Only the total yield suffers; read length is unaffected"},{"key":"b","text":"Dorado can reassemble the fragments into long reads"},{"key":"c","text":"Read length is capped by the input DNA length"},{"key":"d","text":"Pores will foul during the first hour of sequencing"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-11'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Nanopore read length is capped by the length of the DNA you put in. If the gDNA is sheared to 3 kb, no prep and no basecaller recovers it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'Which measurement should set the DNA mass you load for a nanopore prep, and why?', '[{"key":"a","text":"NanoDrop, because absorbance is more reproducible than fluorescence"},{"key":"b","text":"Qubit, because absorbance over-reads and you would under-load"},{"key":"c","text":"TapeStation, because it reports mass and size together"},{"key":"d","text":"Either one, provided you use the same instrument every time"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-11'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Measure with the Qubit, never absorbance: absorbance over-reads, so you would under-load without knowing it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You are running SQK-LSK114 on high molecular weight gDNA. What input mass does the protocol call for?', '[{"key":"a","text":"1 µg"},{"key":"b","text":"200 ng"},{"key":"c","text":"100 ng"},{"key":"d","text":"5 µg"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-11'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'SQK-LSK114 asks for 1 µg of HMW gDNA. About 200 ng is the SQK-RBK114 figure, and >100 ng is the documented floor when you are fragmenting rather than running HMW.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'The LSK114 protocol lists both 1 µg and 100–200 fmol. How should you read the two figures?', '[{"key":"a","text":"You must meet 1 µg and then add 100–200 fmol on top"},{"key":"b","text":"The fmol figure applies only to the rapid kit"},{"key":"c","text":"They are equivalents for one requirement, not two thresholds"},{"key":"d","text":"Whichever number is larger for your sample is the real requirement"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-11'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The page states the two figures in the protocol are equivalents, not separate thresholds. A mass only corresponds to a molar amount for a given fragment length, which is why the protocol pairs them.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'What A260/230 range does the page require before you start a prep?', '[{"key":"a","text":"1.6–1.8"},{"key":"b","text":"2.2–2.6"},{"key":"c","text":"Anything above 1.5"},{"key":"d","text":"1.8–2.2"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-11'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'The purity criteria are A260/280 near 1.8 and A260/230 in 1.8–2.2.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'Your extract has a low A260/230 from residual guanidinium. What happens if you load it anyway?', '[{"key":"a","text":"Available pore count collapses over the first hour"},{"key":"b","text":"MinKNOW refuses to start the run"},{"key":"c","text":"Reads come out short but pore count holds up"},{"key":"d","text":"Only basecalling accuracy is affected"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-11'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Residual guanidinium, ethanol or protein fouls pores directly: you watch the available pore count collapse over the first hour and there is nothing you can do once loaded.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Length and purity both pass, but the Qubit shows about half the mass the kit requires. What do you do?', '[{"key":"a","text":"Load it and sequence for longer to compensate"},{"key":"b","text":"Re-measure on the NanoDrop to confirm the Qubit reading"},{"key":"c","text":"Proceed, since length and purity are what damage pores"},{"key":"d","text":"Stop; clean up or re-extract before proceeding"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-11'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'All three criteria must pass, and one good number does not rescue the other two. If any fails, stop and clean up, re-extract or re-plan.' FROM ins;

-- ---------------------------------------------------------------------------
-- SEQ-12 — 6 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SEQ-12');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'How should HMW gDNA destined for nanopore be mixed?', '[{"key":"a","text":"A brief low-speed vortex, followed by a quick spin"},{"key":"b","text":"Pipette up and down about ten times to homogenise"},{"key":"c","text":"Flick the tube base, or invert slowly, then spin down"},{"key":"d","text":"Vortex, but only while the tube sits on ice"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Never vortex DNA destined for nanopore, not briefly and not gently. Flick the base of the tube sharply or invert slowly, then spin down briefly.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'There are no wide-bore tips in the drawer and you need to move HMW gDNA. What do you do?', '[{"key":"a","text":"Cut the end off a standard tip with a clean blade"},{"key":"b","text":"Use a standard tip but pipette fast to shorten contact"},{"key":"c","text":"Dilute the sample so a standard tip becomes safe"},{"key":"d","text":"Switch to a smaller-volume pipette instead"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'A standard tip forces DNA through a narrow orifice at speed, which is exactly the shear you are avoiding. With no wide-bore tips, cut the end off a standard one with a clean blade.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Why does the page insist on slow pipetting on both aspirate and dispense?', '[{"key":"a","text":"It improves volumetric accuracy at low volumes"},{"key":"b","text":"Shear rate scales with flow velocity"},{"key":"c","text":"It prevents bubbles forming inside the tip"},{"key":"d","text":"It keeps the sample closer to bench temperature"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'The shear rate scales with flow velocity, so slowing both the aspirate and the dispense reduces how much length you lose.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'You will draw on one HMW gDNA stock across several preps over the next month. How should you handle it?', '[{"key":"a","text":"Keep one tube and thaw it each time you need some"},{"key":"b","text":"Aliquot once so the stock is not repeatedly freeze-thawed"},{"key":"c","text":"Hold it at room temperature to avoid freezing at all"},{"key":"d","text":"Refreeze it quickly after each use to limit damage"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Avoid repeated freeze-thaw: aliquot once and do not cycle the stock.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Two workflows reach the same final yield: one involves six transfers, the other three. Which do you choose?', '[{"key":"a","text":"Six, because the extra cleanups give purer DNA"},{"key":"b","text":"Either one; transfers do not shear DNA"},{"key":"c","text":"Six, as long as wide-bore tips are used throughout"},{"key":"d","text":"Three, because every transfer costs read length"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Minimise handling. Every transfer costs you length, so design the workflow to have fewer steps rather than more.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'From what point in the workflow does gentle handling apply?', '[{"key":"a","text":"From the moment of extraction through to loading"},{"key":"b","text":"Only once the library has been adapter-ligated"},{"key":"c","text":"Only during SpotON loading of the flow cell"},{"key":"d","text":"Only for samples expected to exceed 50 kb"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-12'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'It applies from the moment of extraction through to loading, which is why the extraction method matters as much as the prep kit.' FROM ins;

-- ---------------------------------------------------------------------------
-- SEQ-18 — 7 questions (3 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SEQ-18');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'How often should the MinKNOW flow cell check be run?', '[{"key":"a","text":"Only on cells that have already been washed and reused"},{"key":"b","text":"Before every experiment, on every flow cell"},{"key":"c","text":"Once, when the cells arrive from ONT"},{"key":"d","text":"Whenever a run returns less data than expected"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-18'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Run it before every experiment, on every flow cell, without exception. It takes minutes and it is the difference between a failed run you can claim for and one you paid for.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'What does the flow cell check actually report?', '[{"key":"a","text":"The estimated total bases the run will produce"},{"key":"b","text":"The concentration of library on the array"},{"key":"c","text":"The pores available in each of the four groups"},{"key":"d","text":"How long the cell''s ONT warranty still has to run"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-18'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The check reports the number of pores available in each of the four groups.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'What is ONT''s warranty threshold for a MinION-format flow cell?', '[{"key":"a","text":"At least 400 pores"},{"key":"b","text":"At least 1200 pores"},{"key":"c","text":"At least 1600 pores"},{"key":"d","text":"At least 800 pores"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-18'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'ONT''s warranty for MinION-format flow cells is 800 pores or more, and that number is the go/no-go line for loading a library.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'Your flow cell check comes back at 640 pores. What do you do?', '[{"key":"a","text":"Load the library anyway and extend the run to compensate"},{"key":"b","text":"Wash the cell and re-check before deciding anything"},{"key":"c","text":"Do not load; file a warranty claim quoting the cell ID"},{"key":"d","text":"Load half the library so the rest of the sample survives"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-18'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Below the threshold you do not load: you would get a poor run and spend the sample. File a warranty claim with ONT quoting the flow cell ID and the check result, and record it in the flow cell log.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'Your check returns 850 pores. What is the right call?', '[{"key":"a","text":"It is below warranty, so claim it and do not load"},{"key":"b","text":"Treat it as a fresh cell and load a full library"},{"key":"c","text":"Retire the cell, because 850 counts as a failure"},{"key":"d","text":"It will work, but expect proportionally less data"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-18'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], '800 is the warranty floor, not a target. A cell at 850 works but gives proportionally less data, so plan your loading and expectations accordingly, or use it for a smaller run.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'What pore count would you expect a fresh MinION flow cell to report?', '[{"key":"a","text":"1200–1600"},{"key":"b","text":"800–900"},{"key":"c","text":"400–800"},{"key":"d","text":"2000–2500"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-18'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'A fresh cell should be well above the warranty floor, typically 1200–1600 for a MinION cell.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Why record the pore count at every check on a cell you are reusing?', '[{"key":"a","text":"ONT requires the full log before any warranty claim is accepted"},{"key":"b","text":"It determines which basecalling model Dorado uses"},{"key":"c","text":"Reused cells lose pores each cycle; the log shows when to retire"},{"key":"d","text":"It sets the storage temperature after the next wash"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-18'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'A washed and reused cell loses pores each cycle. Logging the count every time is how you decide when to retire it rather than discovering mid-run.' FROM ins;

-- ---------------------------------------------------------------------------
-- SEQ-19 — 7 questions (6 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SEQ-19');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'A flow cell comes out of the fridge. What happens before you do anything else?', '[{"key":"a","text":"20 minutes at room temperature, because cold cells outgas"},{"key":"b","text":"5 minutes at room temperature to reach running temperature"},{"key":"c","text":"Nothing, provided you prime slowly and steadily"},{"key":"d","text":"An hour at room temperature so the tether can settle"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-19'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Leave the flow cell at room temperature for 20 minutes before you do anything: cold flow cells outgas and form bubbles.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'What goes into the priming mix?', '[{"key":"a","text":"Flow Cell Flush plus Storage Buffer"},{"key":"b","text":"Flow Cell Flush, BSA to 0.2 mg/mL, and Flow Cell Tether"},{"key":"c","text":"Flow Cell Flush, Wash Diluent, and Flow Cell Tether"},{"key":"d","text":"Sequencing Buffer plus BSA to 2 mg/mL"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-19'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Priming mix is Flow Cell Flush plus BSA to 0.2 mg/mL plus Flow Cell Tether, mixed gently and never vortexed.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'You have opened the priming port. What must happen before any priming mix goes in?', '[{"key":"a","text":"Flush 200 µL of buffer through to clear the channel"},{"key":"b","text":"Open the SpotON port so the pressure equalises"},{"key":"c","text":"Draw back slowly to remove the air bubble under the port"},{"key":"d","text":"Pipette the BSA straight into the port"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-19'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'The critical step is removing the air bubble first: draw back slowly until a small volume of buffer enters the tip and the bubble under the port is gone.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'While drawing back at the priming port, how much actual buffer may you pull into the tip?', '[{"key":"a","text":"No more than 20–30 µL"},{"key":"b","text":"About 200 µL"},{"key":"c","text":"About 100 µL"},{"key":"d","text":"As much as it takes to clear the bubble"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-19'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Never draw back more than 20–30 µL of actual buffer, or you will pull buffer off the array.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'The bubble is gone. How much priming mix goes in first, and how long do you wait afterwards?', '[{"key":"a","text":"200 µL, then wait 20 minutes"},{"key":"b","text":"500 µL, then wait 1 hour"},{"key":"c","text":"1000 µL, with no wait needed"},{"key":"d","text":"800 µL, then wait 5 minutes"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-19'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Load 800 µL of priming mix into the priming port, slowly and steadily, then wait 5 minutes.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The 5-minute wait after the first priming load is up. What is the next step?', '[{"key":"a","text":"Open the SpotON port, then load 200 µL more via the priming port"},{"key":"b","text":"Open the SpotON port and pipette 200 µL of mix into it"},{"key":"c","text":"Close the priming port and begin SpotON library loading"},{"key":"d","text":"Repeat the full 800 µL load and wait another 5 minutes"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-19'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'After the wait you open the SpotON port and load a further 200 µL of priming mix through the priming port, again slowly. Only then are you ready for SpotON loading.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'Mid-priming you see a bubble travelling toward the sensor array. What do you do?', '[{"key":"a","text":"Push the remaining mix through quickly to flush it past"},{"key":"b","text":"Stop what you are doing and get someone"},{"key":"c","text":"Tilt the flow cell to steer it into the waste channel"},{"key":"d","text":"Carry on; bubbles dissipate before they reach the array"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-19'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'An air bubble that reaches the sensor array irreversibly destroys pores and there is no recovery, so the instruction is to stop and get someone.' FROM ins;

-- ---------------------------------------------------------------------------
-- SEQ-26 — 7 questions (4 critical)
-- ---------------------------------------------------------------------------
DELETE FROM public.skill_quiz_questions
 WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'SEQ-26');

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 10, 'How is the wash mix prepared?', '[{"key":"a","text":"20 µL Wash Mix plus 380 µL Wash Diluent at room temperature"},{"key":"b","text":"2 µL Wash Mix plus 198 µL Wash Diluent, on ice"},{"key":"c","text":"2 µL Wash Mix plus 398 µL Wash Diluent, on ice"},{"key":"d","text":"200 µL Wash Mix plus 200 µL Wash Diluent, on ice"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-26'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['c']::text[], 'Wash mix is 2 µL Wash Mix plus 398 µL Wash Diluent, prepared on ice.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 20, 'There is leftover wash mix in the fridge from last week. Do you use it?', '[{"key":"a","text":"Yes, provided it was kept on ice the whole time"},{"key":"b","text":"Yes, but use double the volume to compensate"},{"key":"c","text":"Yes, wash mix is stable for about a month"},{"key":"d","text":"No, old mix will not digest the library"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-26'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Wash mix must be fresh and not stored for more than a day. Old wash mix does not digest the library, so you carry the previous run''s reads into the next one.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 30, 'Where is the flow cell while you wash it?', '[{"key":"a","text":"On the device throughout"},{"key":"b","text":"Removed and laid flat on the bench"},{"key":"c","text":"Removed and held at 2–8 °C between steps"},{"key":"d","text":"On the device only during the incubations"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-26'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Keep the flow cell on the device throughout; do not remove it to wash it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 40, 'What is the first action of each wash load cycle?', '[{"key":"a","text":"Open the SpotON port"},{"key":"b","text":"Remove accumulated waste from waste port 1"},{"key":"c","text":"Run a flow cell check and record the pore count"},{"key":"d","text":"Load 500 µL of Storage Buffer"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-26'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'Each cycle starts by removing accumulated waste from waste port 1 with a P1000, before the 200 µL of wash mix goes in.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 50, 'How is the 200 µL of wash mix delivered?', '[{"key":"a","text":"Into the SpotON port in one push"},{"key":"b","text":"Into waste port 1 over about a minute"},{"key":"c","text":"Into the priming port as quickly as possible"},{"key":"d","text":"Into the priming port slowly, over at least 5 seconds"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-26'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['d']::text[], 'Load 200 µL of wash mix through the priming port slowly, taking at least 5 seconds over it.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 60, 'The second 5-minute incubation has finished. What comes next?', '[{"key":"a","text":"Clear the waste and load the next library straight away"},{"key":"b","text":"Close the port, wait 1 hour, then clear the waste"},{"key":"c","text":"Load Storage Buffer immediately and refrigerate the cell"},{"key":"d","text":"Run a flow cell check before touching anything else"}]'::jsonb, false, true
    FROM public.skills WHERE code = 'SEQ-26'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['b']::text[], 'After the second load and incubation you close the port, wait 1 hour, and only then clear the waste.' FROM ins;

WITH ins AS (
  INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical, active)
  SELECT id, 70, 'The washed cell will not be used again for a week. How do you store it?', '[{"key":"a","text":"Load 500 µL of Storage Buffer and hold at 2–8 °C"},{"key":"b","text":"Leave the wash mix on the array and hold at 2–8 °C"},{"key":"c","text":"Load 500 µL of Storage Buffer and freeze at -20 °C"},{"key":"d","text":"Leave it dry on the device at room temperature"}]'::jsonb, true, true
    FROM public.skills WHERE code = 'SEQ-26'
  RETURNING id)
INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
SELECT id, ARRAY['a']::text[], 'Store by loading 500 µL of Storage Buffer and keeping the cell at 2–8 °C. Never store a flow cell with wash mix sitting on the array. Never freeze a flow cell — ice crystals destroy the membrane and the array. Storage is 2-8 °C, always.' FROM ins;

COMMIT;
