-- Reverses 20260822150000_recruiting_proof_of_work.sql.
--
-- Sets the difficulty to 0 FIRST, so that between dropping the verifier and the client
-- being rebuilt the form still accepts submissions instead of rejecting every one of them.
-- Only then are the objects removed.

UPDATE public.recruiting_cycles SET pow_difficulty_bits = 0 WHERE pow_difficulty_bits <> 0;

-- Re-create the submit function without the proof-of-work block by re-running
-- 20260822130000_recruiting_direct_submit.sql after this script.

DROP FUNCTION IF EXISTS public.recruiting_verify_pow(uuid, text);
DROP FUNCTION IF EXISTS public.recruiting_issue_pow_challenge();
DROP TABLE IF EXISTS public.recruiting_pow_challenges;

ALTER TABLE public.recruiting_cycles DROP CONSTRAINT IF EXISTS recruiting_cycles_pow_ck;
ALTER TABLE public.recruiting_cycles DROP COLUMN IF EXISTS pow_difficulty_bits;
