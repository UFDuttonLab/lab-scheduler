-- =====================================================================================
-- 2026-08-09  Quiz coverage for the material added by 20260809260000 / 270000.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09.
--
-- 260000 added paragraphs to SAF-01, SAF-29 and SAF-39 to close three gaps where a CRITICAL
-- sign-off checklist item was gated but never taught. That fixed the reading and left the
-- quiz untouched, which is only half a fix: the trainee could still pass the quiz without
-- ever meeting the thing the supervisor is about to check them on. These 12 questions close
-- it. Added now, before anyone has taken a single attempt, so nobody's record is disturbed.
--
-- Every answer is derivable from the skill's own instructions_md as it now stands. Nothing
-- here introduces a figure that is not in the text: the 15-minute irrigation period, the
-- 10 s / ~55 ft reachability rule (eyewash and drench shower ONLY - ANSI/ISEA Z358.1 does
-- not govern extinguishers or egress, and one question tests exactly that distinction),
-- tepid 60-100 F, ~10 min contact time for 10% bleach, glove-to-glove / skin-to-skin
-- doffing, the guanidinium-plus-hypochlorite cyanide hazard, and LN2's ~700-fold expansion.
--
-- 7 of the 12 are critical: chemical in the eye, a blocked shower, bleach on guanidinium,
-- when gloves come off, how they come off, how a dewar is moved, and riding a lift with one.
--
-- Sort orders start at 70/80 so these append after each skill's existing questions rather
-- than renumbering them. IDEMPOTENT: each insert is guarded on its own prompt text, so
-- replaying the file adds nothing. Inserting the question and its key in one statement means
-- a keyless question can never be left behind.
-- =====================================================================================

DO $mig$
DECLARE
  r record;
  v_qid uuid;
  v_rows jsonb := $j$[
   {"code":"SAF-01","ord":70,"crit":true,
    "prompt":"You get a splash of chemical in your eye. How long do you hold your eyelids open and flush?",
    "opts":[{"key":"a","text":"Until the stinging eases off"},{"key":"b","text":"One minute, then go to the clinic"},{"key":"c","text":"A full 15 minutes"},{"key":"d","text":"Five minutes"}],
    "ans":"c","why":"Fifteen minutes is the standard irrigation period and it is far longer than instinct suggests. Set a timer, and have someone else call for help while you stay at the station."},
   {"code":"SAF-01","ord":80,"crit":true,
    "prompt":"Boxes have been stacked in front of the safety shower. What is that?",
    "opts":[{"key":"a","text":"Fine, as long as they can be moved quickly"},{"key":"b","text":"A finding - clear it or report it"},{"key":"c","text":"Acceptable while the eyewash is still clear"},{"key":"d","text":"Only a problem during an inspection"}],
    "ans":"b","why":"The path to emergency equipment has to be free of obstructions. A blocked shower is the same as no shower."},
   {"code":"SAF-01","ord":90,"crit":false,
    "prompt":"The 10-second, roughly 55-foot reachability rule applies to which equipment?",
    "opts":[{"key":"a","text":"Every piece of safety equipment in the lab"},{"key":"b","text":"The eyewash and the safety shower"},{"key":"c","text":"The fire extinguisher and the nearest exit"},{"key":"d","text":"The spill kit"}],
    "ans":"b","why":"ANSI/ISEA Z358.1 covers emergency eyewash and drench showers. Extinguishers and egress fall under different codes with their own distances - but learn where all five are on day one regardless."},
   {"code":"SAF-01","ord":100,"crit":false,
    "prompt":"Why is eyewash flushing fluid delivered tepid rather than cold?",
    "opts":[{"key":"a","text":"Cold water damages the cornea"},{"key":"b","text":"To stop the pipes freezing"},{"key":"c","text":"It slows bacterial growth in the line"},{"key":"d","text":"So you can tolerate the full 15-minute flush"}],
    "ans":"d","why":"Flushing fluid is specified at 60-100 F precisely because you have to stay under it for fifteen minutes. Cold water gets abandoned early."},
   {"code":"SAF-29","ord":80,"crit":true,
    "prompt":"Guanidinium lysis buffer has spilled on the bench. Do you reach for the bleach?",
    "opts":[{"key":"a","text":"Yes, bleach is the default for any spill"},{"key":"b","text":"Yes, once it is diluted to 10%"},{"key":"c","text":"No - hypochlorite and guanidinium release cyanide gas"},{"key":"d","text":"No, but only because bleach corrodes steel"}],
    "ans":"c","why":"Hypochlorite plus guanidinium thiocyanate releases cyanide gas (see SAF-02), and guanidinium is the chemistry most of our extractions run on. Absorb the spill and dispose of it per the SDS, keeping bleach away from it and its waste."},
   {"code":"SAF-29","ord":90,"crit":true,
    "prompt":"You have finished at the bench and are about to leave. When do the gloves come off?",
    "opts":[{"key":"a","text":"Before touching a door handle, keyboard or phone"},{"key":"b","text":"At the door of the lab"},{"key":"c","text":"Once you are out in the corridor"},{"key":"d","text":"After carrying your samples to the next room"}],
    "ans":"a","why":"Handles, keyboards and phones are the surfaces that carry contamination out of the lab and onto people who never opted into it. Ask someone to open the door, or use your elbow."},
   {"code":"SAF-29","ord":100,"crit":true,
    "prompt":"What is the correct way to take gloves off?",
    "opts":[{"key":"a","text":"Pull both off by the fingertips"},{"key":"b","text":"Glove-to-glove, then skin-to-skin, ending inside-out"},{"key":"c","text":"Peel from the wrist down with your bare hand"},{"key":"d","text":"Snap them off, then wash your hands"}],
    "ans":"b","why":"Pinch the outside of the first glove at the wrist and peel it inside-out into your gloved hand, then slide a bare finger under the cuff of the second and peel it over the first. Most self-contamination happens on the way out of PPE, not the way in."},
   {"code":"SAF-29","ord":110,"crit":false,
    "prompt":"You wipe the bench with 70% ethanol and start work straight away. Is that a disinfection step?",
    "opts":[{"key":"a","text":"Yes, ethanol is a disinfectant"},{"key":"b","text":"Yes, as long as you wipe it twice"},{"key":"c","text":"No - it evaporates too fast to meet a contact time"},{"key":"d","text":"No, ethanol is only for glassware"}],
    "ans":"c","why":"A surface is disinfected only if the agent stays visibly wet for the contact time on the label - around 10 minutes for 10% bleach. Ethanol dries in well under a minute, so a quick wipe is cleaning, not disinfection."},
   {"code":"SAF-39","ord":80,"crit":true,
    "prompt":"You need to move a full dewar to another room on the same floor. How?",
    "opts":[{"key":"a","text":"Carry it, with a second person helping"},{"key":"b","text":"On a wheeled cart made for cryogenic dewars"},{"key":"c","text":"Walk it along on the edge of its base"},{"key":"d","text":"On any flatbed trolley, laid on its side"}],
    "ans":"b","why":"A full dewar is heavy and top-heavy. Never carry one, never lay one down, and never walk it on its base edge - use a cart with a cradle or a retaining strap."},
   {"code":"SAF-39","ord":90,"crit":false,
    "prompt":"Why push the dewar cart rather than pull it?",
    "opts":[{"key":"a","text":"Pulling scuffs the floor"},{"key":"b","text":"Pushing is faster"},{"key":"c","text":"It keeps the dewar upright"},{"key":"d","text":"So it cannot roll back into you"}],
    "ans":"d","why":"Pushed, the cart stays ahead of you and under control. Take thresholds and door strips slowly - that is where a dewar tips."},
   {"code":"SAF-39","ord":100,"crit":true,
    "prompt":"The freight lift is free and you have a dewar to get upstairs. What is the safe arrangement?",
    "opts":[{"key":"a","text":"Ride with it; freight lifts are ventilated"},{"key":"b","text":"Ride with it if the trip is short"},{"key":"c","text":"Send it up alone and meet it there"},{"key":"d","text":"Ride with it and hold the door open"}],
    "ans":"c","why":"A lift car is a small sealed space with doors you cannot force. If the dewar vents while you are shut in with it, nitrogen displaces the air. Send it alone, and sign it if you can."},
   {"code":"SAF-39","ord":110,"crit":false,
    "prompt":"Roughly how much does liquid nitrogen expand as it boils off?",
    "opts":[{"key":"a","text":"About 700-fold"},{"key":"b","text":"About 70-fold"},{"key":"c","text":"About 7-fold"},{"key":"d","text":"About 7000-fold"}],
    "ans":"a","why":"Roughly 700-fold. That is why a small spill in an enclosed space is an asphyxiation risk rather than just a mess to mop up."}
  ]$j$::jsonb;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset(v_rows)
      AS x(code text, ord int, crit boolean, prompt text, opts jsonb, ans text, why text)
  LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.skill_quiz_questions q
        JOIN public.skills s ON s.id = q.skill_id
       WHERE s.code = r.code AND q.prompt = r.prompt);

    INSERT INTO public.skill_quiz_questions (skill_id, sort_order, prompt, options, is_critical)
    SELECT id, r.ord, r.prompt, r.opts, r.crit FROM public.skills WHERE code = r.code
    RETURNING id INTO v_qid;

    IF v_qid IS NULL THEN
      RAISE EXCEPTION 'No skill with code %', r.code;
    END IF;

    INSERT INTO public.skill_quiz_answers (question_id, correct_keys, explanation)
    VALUES (v_qid, ARRAY[r.ans]::text[], r.why);
  END LOOP;
END $mig$;
