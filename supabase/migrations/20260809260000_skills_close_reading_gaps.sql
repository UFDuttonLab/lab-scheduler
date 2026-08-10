-- =====================================================================================
-- 2026-08-09  Close the three gaps where a critical checklist item was gated but never taught.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09.
--
-- A QC review of the 353 quiz questions found three skills whose sign-off checklist has a
-- CRITICAL item that the skill's own instructions never cover. A trainee could read the page
-- carefully, pass the quiz, and still be failed at the practical for something the reading
-- never told them. The right fix is to teach it, not to delete the checklist item - all three
-- items are things a supervisor should genuinely be checking.
--
--   SAF-01  "Can point to the eyewash, safety shower, spill kit, extinguisher and nearest
--           exit without prompting" - the page never mentioned emergency equipment at all.
--   SAF-29  "Doffs gloves before touching door handles, keyboards or a phone" and
--           "Decontaminates the work surface before and after with correct contact time" -
--           neither doffing nor contact time appeared anywhere in the text.
--   SAF-39  "Transports the dewar on the correct cart, not carried" - the page covered the
--           lift rule but said nothing about how a dewar actually gets moved.
--
-- Figures used below were verified against ANSI/ISEA Z358.1 rather than written from memory:
-- emergency equipment reachable in no more than 10 seconds (~55 ft / 16.8 m), path free of
-- obstructions, on the same level as the hazard, 15-minute minimum irrigation period, tepid
-- flushing fluid 60-100 F (16-38 C), weekly activation. No UF-specific locations, room
-- numbers or equipment models are invented here - the text tells the trainee to go and find
-- them, which is what the checklist item actually tests.
--
-- instructions_version is bumped on all three, so anyone who already acknowledged the old
-- text is asked to read it again. That is the intended behaviour of that column.
--
-- REPLAY SAFETY. These are appends (`instructions_md || ...`), which are NOT naturally
-- idempotent - running the file twice would append each paragraph twice and bump the version
-- twice. Each statement therefore carries a NOT LIKE guard on a phrase unique to its own
-- paragraph, so a second run matches zero rows and does nothing. coalesce() is there because
-- `NULL || text` is NULL: without it, replaying against an environment where the column had
-- never been populated would silently blank the instructions and still bump the version.
-- =====================================================================================

UPDATE public.skills SET
  instructions_md = coalesce(instructions_md,'') || E'\n\n**Know where the emergency equipment is, before you need it.** On your first day, find the eyewash, the safety shower, the spill kit, the fire extinguisher and the nearest exit, and be able to point to all five without stopping to think. You will be asked to point, not asked whether you know. The reason is in the standard this equipment is installed to (ANSI/ISEA Z358.1): it must be reachable in **no more than 10 seconds** — about **55 feet** — along a path that is **free of obstructions** and **on the same floor as the hazard**. Ten seconds is not enough time to go looking for something.\n\nIf you get chemical in your eyes, hold your eyelids open and flush for a **full 15 minutes**. That is the standard irrigation period and it is much longer than instinct suggests, so set a timer or have someone time it for you, and get someone to call for help while you stay at the station. The water is meant to feel tepid (60–100 °F) precisely because you have to tolerate it for that long. If an eyewash or shower is blocked by boxes, a cart or a bench, that is a finding in itself — clear it or report it. A blocked eyewash is the same as no eyewash.',
  instructions_version = instructions_version + 1, updated_at = now()
WHERE code = 'SAF-01'
  AND coalesce(instructions_md,'') NOT LIKE '%Know where the emergency equipment is%';

UPDATE public.skills SET
  instructions_md = coalesce(instructions_md,'') || E'\n\n**Contact time is the whole point of disinfecting.** A surface is only decontaminated if the disinfectant stays *visibly wet* for the contact time on the product label. For 10% bleach that is usually around 10 minutes; 70% ethanol evaporates in well under a minute, which is why a quick ethanol wipe is a cleaning step, not a disinfection step. Wipe it on, leave it wet, come back to it — do not wipe it straight off. Bleach then has to be removed with ethanol or water afterwards, because it corrodes stainless steel. Do this before you start as well as after, so you are not working on top of somebody else''s contamination.\n\n**Doffing gloves is the step people get wrong.** Most self-contamination happens on the way *out* of PPE, not on the way in. Take them off glove-to-glove, skin-to-skin: pinch the outside of one glove at the wrist, peel it off inside-out and hold it balled in your gloved hand; then slide a bare finger *under* the cuff of the second glove and peel that one off over the first, so both end up inside-out as a single bundle. Into the biohazard waste, then wash your hands. **Gloves come off before you touch a door handle, a keyboard, a phone, or your face** — those are the surfaces that carry contamination out of the lab and onto people who never opted into it. If you need a door opened mid-procedure, ask someone or use your elbow. Never wear used gloves in the corridor.',
  instructions_version = instructions_version + 1, updated_at = now()
WHERE code = 'SAF-29'
  AND coalesce(instructions_md,'') NOT LIKE '%Doffing gloves is the step people get wrong%';

UPDATE public.skills SET
  instructions_md = coalesce(instructions_md,'') || E'\n\n**Moving a dewar.** A full dewar is heavy, top-heavy, and holds a liquid that expands roughly 700-fold as it boils. **Never carry one.** Move it on a wheeled cart made for cryogenic dewars — the kind with a cradle or a retaining strap — and *push* the cart rather than pulling it, so it cannot roll back into you. Go slowly over thresholds and door strips; that is where a dewar tips. Do not walk a dewar on the edge of its base, and do not lay one on its side.\n\nThe lift rule applies to moving a dewar just as much as to storing one: **you do not ride in a lift with an open dewar.** Send it up on its own and meet it at the other end, or use the freight lift the same way, and put a sign on it if one is available. A lift car is a small sealed room with no ventilation and doors you cannot force — if the dewar vents while you are shut in there with it, the nitrogen displaces the air and there is nowhere for either of you to go. This is the classic cryogen fatality and it is entirely avoidable by letting the dewar travel alone.',
  instructions_version = instructions_version + 1, updated_at = now()
WHERE code = 'SAF-39'
  AND coalesce(instructions_md,'') NOT LIKE '%Moving a dewar%';
