-- =====================================================================================
-- 2026-08-09  Two corrections to the paragraphs added by 20260809260000.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09.
--
-- Found by a pre-commit sweep of 20260809260000, which was already applied and so could not
-- simply be edited.
--
-- 1. SAF-01 over-extended ANSI/ISEA Z358.1. That standard governs emergency EYEWASH and
--    DRENCH SHOWER equipment only - the 10 seconds / ~55 ft / unobstructed / same-level rule
--    is theirs. The paragraph attached it to all five items a trainee is asked to point at,
--    including the fire extinguisher (NFPA 10, different distances) and the nearest exit
--    (NFPA 101 / IBC egress, different again). The 10-second habit is still the right thing
--    to teach; the citation just has to point at what it actually covers. Also switches
--    "same floor" to the standard's own word, "same level".
--
-- 2. SAF-29 told trainees to bleach the bench before and after every session with no caveat.
--    This lab's primary lysis chemistry is guanidinium, and the lab's own SAF-02 critical
--    question teaches that hypochlorite plus guanidinium thiocyanate releases cyanide gas.
--    Teaching a routine bleach habit without that exception is the kind of gap that gets
--    somebody hurt. The caveat is now in the same paragraph as the instruction.
--
-- Written as string replacements rather than appends, so re-running is a no-op once the old
-- wording is gone.
-- =====================================================================================

UPDATE public.skills SET
  instructions_md = replace(instructions_md,
    E'The reason is in the standard this equipment is installed to (ANSI/ISEA Z358.1): it must be reachable in **no more than 10 seconds** — about **55 feet** — along a path that is **free of obstructions** and **on the same floor as the hazard**. Ten seconds is not enough time to go looking for something.',
    E'For the eyewash and the safety shower there is a hard rule (ANSI/ISEA Z358.1): they must be reachable in **no more than 10 seconds** — about **55 feet** — along a path that is **free of obstructions** and **on the same level as the hazard**. The extinguisher and the exit fall under different codes with their own distances, but the habit is the same one: ten seconds is not enough time to go looking for something, so learn where all five are on day one.'),
  instructions_version = instructions_version + 1, updated_at = now()
WHERE code = 'SAF-01'
  AND instructions_md LIKE '%the standard this equipment is installed to%';

UPDATE public.skills SET
  instructions_md = replace(instructions_md,
    E'Do this before you start as well as after, so you are not working on top of somebody else''s contamination.',
    E'Do this before you start as well as after, so you are not working on top of somebody else''s contamination. **One exception, and it matters: never put bleach on a guanidinium spill.** Hypochlorite and guanidinium thiocyanate react to release cyanide gas (see SAF-02), and guanidinium lysis buffer is the chemistry most of our extractions run on. Absorb that spill and dispose of it per the SDS, and keep bleach away from it and from its waste stream.'),
  instructions_version = instructions_version + 1, updated_at = now()
WHERE code = 'SAF-29'
  AND instructions_md NOT LIKE '%never put bleach on a guanidinium spill%';
