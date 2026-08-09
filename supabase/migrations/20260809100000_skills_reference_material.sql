-- =====================================================================================
-- 2026-08-09  Skills module: verified external reference material for all 53 skills.
--
-- APPLIED LIVE to ypaobygipbnkvnismhyy on 2026-08-09 via the Lovable connector.
-- Result: reading_refs went from 32 rows to 161. Zero skills are now without a reference.
--   vendor 70 | guidance 47 | video 34 | paper 5 | protocol 3 | standard 1 | course 1
--
-- EVERY URL BELOW WAS FETCHED AND CONFIRMED before being written. Nothing here is a guess.
--   - 28 YouTube links were verified through the oEmbed endpoint
--       https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json
--     which returns the real title and author_name for a live public video, and a 400 for a
--     bad id. The returned title and channel were checked against what the link claims to
--     be. This matters: fabricated video ids are the single most likely failure mode here,
--     and they stay invisible until a student clicks one.
--   - The other 67 pages and PDFs were fetched, then independently re-fetched. All resolved.
--
-- Deliberately NOT included, having been looked at and rejected:
--   - an Illumina ng/uL-to-nM page for QC-20. The maths is platform-agnostic but this lab
--     has no Illumina instrument, and pointing trainees at Illumina library docs invites
--     exactly the wrong mental model.
--   - an Opentrons Jupyter/advanced-control page proposed for FLX-21. It covers setting
--     offsets by hand in code, not what Labware Position Check does. Off topic.
--   - third-party mirrors of vendor PDFs where the vendor hosts the document itself.
--   - a content-farm page on reading a 96-well plate.
-- FLX-21 (Labware Position Check) is consequently the thinnest skill here: one reference
-- and no video, because Opentrons does not appear to publish an LPC walkthrough.
--
-- IDEMPOTENT. Each statement appends only URLs not already present on that row, so
-- re-running this file cannot duplicate a link or disturb the refs seeded in v1.
-- Ordering is preserved with WITH ORDINALITY: existing refs first, then new ones in
-- video -> protocol/vendor/course -> guidance -> paper/standard order, because the video is
-- the thing an undergraduate will actually click first.
-- =====================================================================================


UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "OSHA: what a Chemical Hygiene Plan must contain", "url": "https://www.osha.gov/sites/default/files/publications/OSHAFACTSHEET-LABORATORY-SAFETY-CHEMICAL-HYGIENE-PLAN.pdf", "kind": "guidance"}, {"label": "Example: the NIH Chemical Hygiene Plan", "url": "https://ors.od.nih.gov/sr/dohs/Documents/chemical-hygiene-plan.pdf", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-01';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Reading a GHS Safety Data Sheet", "url": "https://www.youtube.com/watch?v=vCI7XXExs7s", "kind": "video"}, {"label": "UF: hazard communication and SDS access", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/chemical-safety/chemical-safety-information/", "kind": "guidance"}, {"label": "OSHA: the nine GHS pictograms (one page)", "url": "https://www.osha.gov/sites/default/files/publications/OSHA3491QuickCardPictogram.pdf", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-02';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Cleaning up a biological spill", "url": "https://www.youtube.com/watch?v=gaHTb2C4rzo", "kind": "video"}, {"label": "BMBL 6th edition (CDC/NIH) - the reference manual", "url": "https://www.cdc.gov/labs/bmbl/index.html", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-03';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "UF: needlestick and exposure - what to do, who to call", "url": "https://www.ehs.ufl.edu/emergencies/bloodborne-pathogen-needlestick/", "kind": "guidance"}, {"label": "OSHA bloodborne pathogens standard", "url": "https://www.osha.gov/bloodborne-pathogens/general", "kind": "guidance"}, {"label": "CDC: universal precautions", "url": "https://www.cdc.gov/mmwr/preview/mmwrhtml/00000039.htm", "kind": "paper"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-25';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Biohazardous waste training", "url": "https://www.youtube.com/watch?v=NcOEkZCA3sw", "kind": "video"}, {"label": "UF: biohazardous waste disposal", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/biosafety/biohazardous-waste/", "kind": "guidance"}, {"label": "UF biomedical waste guide (PDF)", "url": "https://webfiles.ehs.ufl.edu/BMW.pdf", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-27';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Satellite accumulation areas", "url": "https://www.youtube.com/watch?v=4cFpktHFpL4", "kind": "video"}, {"label": "UF: chemical waste accumulation rules", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/hazardous-waste-management/chemical-waste/waste-accumulation/", "kind": "guidance"}, {"label": "EPA: why accumulation limits exist", "url": "https://www.epa.gov/hwgenerators/categories-hazardous-waste-generators", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-16';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: BSL-1 and BSL-2 at the bench (Addgene)", "url": "https://www.youtube.com/watch?v=ge8I4fSdbPM", "kind": "video"}, {"label": "NIH BSL-2 laboratory biosafety manual", "url": "https://ors.od.nih.gov/sr/dohs/Documents/bsl-2-lab-safety-manual.pdf", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-29';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Working safely in a biosafety cabinet (Cornell)", "url": "https://www.youtube.com/watch?v=miJn1nhYA8U", "kind": "video"}, {"label": "Video: Using a biosafety cabinet correctly (USC)", "url": "https://www.youtube.com/watch?v=3oMoqCdqG2k", "kind": "video"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-31';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: How to use an autoclave", "url": "https://www.youtube.com/watch?v=UbzIcjA72xs", "kind": "video"}, {"label": "UF autoclave FAQ - cycle choice, why tape is not proof", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/biosafety/autoclaves/autoclave-faq/", "kind": "guidance"}, {"label": "UF autoclave operation and safety (PDF)", "url": "https://www.ehs.ufl.edu/wp-content/uploads/AutoclaveConsolidate.pdf", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-34';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Being safe with liquid nitrogen (UCLA)", "url": "https://www.youtube.com/watch?v=fPLCrlQnDC8", "kind": "video"}, {"label": "UF: cryogen hazards - frostbite, asphyxiation, rupture", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/chemical-safety/cryogens/", "kind": "guidance"}, {"label": "NIH cryogen and compressed gas safety guidelines", "url": "https://ors.od.nih.gov/sr/dohs/Documents/compressed-gas-and-cryogen-safety-guidelines-document.pdf", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-39';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "UF: permits and documentation for shipping", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/biosafety/shipping-and-transport/permits-and-documentation/", "kind": "guidance"}, {"label": "DOT: transporting infectious substances safely", "url": "https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/2024-04/Transporting-Infectious-Substances-Safely-PHH50-0186-0622.pdf", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SAF-43';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: 10 tips to improve your pipetting (Artel)", "url": "https://www.youtube.com/watch?v=NO1dK1zuRSw", "kind": "video"}, {"label": "Gilson: proper pipetting technique", "url": "https://www.gilson.com/default/learninghub/post/helpful-tips-for-ensuring-proper-pipetting-technique.html", "kind": "vendor"}, {"label": "Sartorius: pipetting viscous and foaming liquids", "url": "https://www.sartorius.com/resource/blob/1085646/d4bf11ef41cbbc9c7ebdcc88ecea4846/how-to-pipette-challenging-liquids-application-guide-en-l-sa-1--data.pdf", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-01';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Calculating pipette accuracy and precision", "url": "https://www.integra-biosciences.com/united-states/en/calibration-check-how-calculate-accuracy-and-precision-pipette", "kind": "guidance"}, {"label": "The Z-factor: turning weighed mass into volume", "url": "https://accucal.co.uk/understanding-the-z-factor-in-pipette-calibration/", "kind": "guidance"}, {"label": "ISO 8655-6:2022 - the gravimetric standard", "url": "https://www.iso.org/standard/75211.html", "kind": "standard"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-02';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Multichannel pipetting technique (Addgene)", "url": "https://www.youtube.com/watch?v=uFzlUT8b_XQ", "kind": "video"}, {"label": "Video: Tips for using multichannel pipettes", "url": "https://www.youtube.com/watch?v=ZEjBtAFmb_8", "kind": "video"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-03';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Performing a serial dilution", "url": "https://www.youtube.com/watch?v=mLX7ndoK-eY", "kind": "video"}, {"label": "JoVE: serial dilutions and plating", "url": "https://www.jove.com/v/10507/serial-dilutions-and-plating-microbial-enumeration", "kind": "video"}, {"label": "Serial dilutions, including the calculations", "url": "https://www.integra-biosciences.com/global/en/blog/article/how-do-serial-dilutions-including-calculations", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-07';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Making buffer solutions from first principles", "url": "https://bio.libretexts.org/Courses/Irvine_Valley_College/Biotechnology:_Basic_Lab_Techniques_(BIOT_173_LAB_MANUAL)/11:_Creating_Buffer_Solutions", "kind": "guidance"}, {"label": "Worked exercise: designing a buffer to a target pH", "url": "https://www.bellevuecollege.edu/wp-content/uploads/sites/140/2014/06/Lab-4-Buffers.pdf", "kind": "guidance"}, {"label": "What a complete reagent label looks like", "url": "https://www.labmanager.com/the-dos-and-donts-of-chemical-labeling-20460", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-10';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: SPRI bead cleanup, with fresh 80% ethanol (NEB)", "url": "https://www.neb.com/en/tools-and-resources/video-library/size-selection-and-cleanup-with-nebnext-ultra-ii-and-spri-beads", "kind": "video"}, {"label": "AMPure XP protocol - prepare the ethanol fresh", "url": "https://www.beckman.com/reagents/genomic/cleanup-and-size-selection/pcr/ampure-xp-protocol", "kind": "vendor"}, {"label": "Why ethanol strength drifts, and what it costs you", "url": "https://drk-lo.github.io/lotterhoslabprotocols/molecprot_magbeadwash.html", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-12';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "JoVE: aseptic technique in environmental science", "url": "https://www.jove.com/v/10040/aseptic-technique-in-environmental-science", "kind": "video"}, {"label": "Contamination control in an eDNA lab (Rutgers)", "url": "https://sites.rutgers.edu/edna/standard-practices/", "kind": "guidance"}, {"label": "A perfectionist''s guide to aseptic technique", "url": "https://bitesizebio.com/9263/zero-tolerance-a-perfectionists-guide-to-aseptic-technique/", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-13';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Running a bead mill homogeniser", "url": "https://www.youtube.com/watch?v=8J1FsgxXfGs", "kind": "video"}, {"label": "Bead beating guide - bead type, speed, duration by matrix", "url": "https://opsdiagnostics.com/notes/ranpri/bbguide1.html", "kind": "guidance"}, {"label": "Aerosol and cap-failure risk from homogenisers", "url": "https://researchsafety.gwu.edu/preventing-aerosol-production", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-21';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Magnetic separation and careful aspiration (NEB)", "url": "https://www.neb.com/en/tools-and-resources/video-library/size-selection-and-cleanup-with-nebnext-ultra-ii-and-spri-beads", "kind": "video"}, {"label": "AMPure XP handling protocol (Beckman)", "url": "https://www.beckman.com/reagents/genomic/cleanup-and-size-selection/pcr/ampure-xp-protocol", "kind": "vendor"}, {"label": "7 tips for magnetic bead cleanups", "url": "https://bitesizebio.com/30856/wash-well-use-magnetic-beads-and-good-technique/", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'BEN-25';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Opentrons Flex full demo (30 min)", "url": "https://www.youtube.com/watch?v=8VaR_ePCuA8", "kind": "video"}, {"label": "Video: How the Flex fits your lab", "url": "https://www.youtube.com/watch?v=x5pLxAcglNM", "kind": "video"}, {"label": "Flex components and the A1/D3 coordinate system", "url": "https://docs.opentrons.com/flex/system-description/robot/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-01';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "The E-stop pendant: what stops, and when", "url": "https://docs.opentrons.com/flex/system-description/e-stop/", "kind": "vendor"}, {"label": "Flex safety and regulatory information", "url": "https://docs.opentrons.com/flex/safety-regulatory/", "kind": "vendor"}, {"label": "Flex quickstart - E-stop is mandatory before any run", "url": "https://insights.opentrons.com/hubfs/Products/Flex/Opentrons%20Flex%20Quickstart%20Guide.pdf", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-02';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Flex components and deck orientation", "url": "https://docs.opentrons.com/flex/system-description/robot/", "kind": "vendor"}, {"label": "Deck configuration and reading the deck map", "url": "https://docs.opentrons.com/flex/touchscreen/deck-config/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-16';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Running Labware Position Check", "url": "https://docs.opentrons.com/flex/touchscreen/protocol-setup/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-21';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Partial tip pickup and the sensor limitation", "url": "https://docs.opentrons.com/v2/pipettes/partial_tip_pickup.html", "kind": "vendor"}, {"label": "Flex pipettes and tip rack adapters", "url": "https://docs.opentrons.com/flex/system-description/pipettes/", "kind": "vendor"}, {"label": "How automatic tip tracking works", "url": "https://docs.opentrons.com/python-api/building-block-commands/pipette-tips/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-23';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Flex labware types, including reservoirs", "url": "https://docs.opentrons.com/flex/labware/types/", "kind": "vendor"}, {"label": "A real magnetic-bead extraction deck layout", "url": "https://insights.opentrons.com/hubfs/Applications/Nucleic%20acid%20extraction/Magnetic%20Bead-based%20Nucleic%20Acid%20Extraction%20on%20OT-2%20Application%20Note.pdf", "kind": "vendor"}, {"label": "Why dead volume matters in automated workflows", "url": "https://www.labmate-online.com/article/laboratory-products/3/azenta-life-sciences/understanding-the-importance-of-reagent-lsquodead-volumersquo-in-selecting-labware-for-automated-workflows/3402", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-25';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "The Magnetic Block is unpowered - the gripper does the work", "url": "https://docs.opentrons.com/flex/modules/magnetic-block/", "kind": "vendor"}, {"label": "Neither robot nor app tracks the block''s state", "url": "https://docs.opentrons.com/v2/modules/magnetic_block.html", "kind": "vendor"}, {"label": "How the gripper moves labware onto modules", "url": "https://docs.opentrons.com/flex/system-description/gripper/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-27';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Installing the calibration probe", "url": "https://www.youtube.com/watch?v=6HturwOku8s", "kind": "video"}, {"label": "The pre-run protocol details screen", "url": "https://docs.opentrons.com/flex/touchscreen/protocol-details/", "kind": "vendor"}, {"label": "Attaching and recalibrating instruments", "url": "https://docs.opentrons.com/flex/touchscreen/instruments/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-36';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Turning error recovery on and off", "url": "https://docs.opentrons.com/flex/touchscreen/settings/", "kind": "vendor"}, {"label": "What error recovery covers (App 8.2)", "url": "https://opentrons.com/whats-new-opentrons-app-8-2", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-41';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Flex maintenance schedule - daily to annual", "url": "https://docs.opentrons.com/flex/maintenance/service/", "kind": "vendor"}, {"label": "Flex quickstart - approved cleaning solutions", "url": "https://insights.opentrons.com/hubfs/Products/Flex/Opentrons%20Flex%20Quickstart%20Guide.pdf", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-47';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Flex cleaning, including nucleic acid decontamination", "url": "https://docs.opentrons.com/flex/maintenance/cleaning/", "kind": "vendor"}, {"label": "Why ethanol alone will not remove DNA (SOP)", "url": "https://www.bu.edu/research/files/2021/01/CleaningDisinfection-SOP-for-Research-Laboratories-for-DNA-contamination.pdf", "kind": "guidance"}, {"label": "Validated decontamination on Opentrons plasticware", "url": "https://www.biorxiv.org/content/10.1101/2023.06.09.544400v1.full", "kind": "paper"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'FLX-49';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Introduction to the OT-2", "url": "https://www.youtube.com/watch?v=Plh4KfAzTdc", "kind": "video"}, {"label": "OT-2 components and the numbered deck slots", "url": "https://docs.opentrons.com/ot-2/system-description/robot/", "kind": "vendor"}, {"label": "Every difference between OT-2 and Flex", "url": "https://docs.opentrons.com/v2/adapting_ot2_flex.html", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'OT2-01';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Deck calibration on the OT-2", "url": "https://www.youtube.com/watch?v=bKYmFyJACaU", "kind": "video"}, {"label": "Video: Tip length and pipette offset calibration", "url": "https://www.youtube.com/watch?v=7mMtvdcV-dM", "kind": "video"}, {"label": "The calibration dependency chain", "url": "https://docs.opentrons.com/ot-2/calibration/robot-calibration/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'OT2-04';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Running a protocol on the OT-2", "url": "https://www.youtube.com/watch?v=hiN0EOW3vHM", "kind": "video"}, {"label": "Running protocols from the Opentrons App", "url": "https://docs.opentrons.com/ot-2/opentrons-app/protocol-run/", "kind": "vendor"}, {"label": "What the app can and cannot show mid-run", "url": "https://docs.opentrons.com/ot-2/opentrons-app/features-summary/", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'OT2-10';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "ZymoBIOMICS MagBead kit manual - our actual chemistry", "url": "https://files.zymoresearch.com/protocols/_r2135_r2136_zymobiomics_magbead_dna-rna.pdf", "kind": "vendor"}, {"label": "The Boom method, explained", "url": "https://en.wikipedia.org/wiki/Boom_method", "kind": "guidance"}, {"label": "Boom et al. 1990 - the original silica/chaotrope paper", "url": "https://journals.asm.org/doi/10.1128/jcm.28.3.495-503.1990", "kind": "paper"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'AEX-01';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: DS-11 quick start", "url": "https://www.denovix.com/ds-11-series-quick-start-guide/", "kind": "video"}, {"label": "Video: Cleaning the DS-11 sample surfaces", "url": "https://www.denovix.com/ds-11-series-sample-surface-cleaning/", "kind": "video"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'QC-02';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "DeNovix TN-130: purity ratios explained", "url": "https://www.denovix.com/tn-130-purity-ratios-explained/", "kind": "vendor"}, {"label": "Comparing DeNovix, NanoDrop and Qubit on real extracts", "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0305650", "kind": "paper"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'QC-03';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Running a Qubit assay", "url": "https://www.youtube.com/watch?v=gtSLkbaLlMU", "kind": "video"}, {"label": "Qubit dsDNA HS assay guide - range and standards", "url": "https://documents.thermofisher.com/TFS-Assets/LSG/manuals/Qubit_dsDNA_HS_Assay_UG.pdf", "kind": "vendor"}, {"label": "Why fluorometry and absorbance disagree", "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0305650", "kind": "paper"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'QC-09';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Loading ScreenTape on the 2200", "url": "https://www.youtube.com/watch?v=2BqRucTtLLI", "kind": "video"}, {"label": "DIN on the 2200 TapeStation (Agilent)", "url": "https://www.agilent.com/cs/library/applications/5991-5442EN.pdf", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'QC-14';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: How SPRI actually works (Beckman)", "url": "https://www.youtube.com/watch?v=zGV0SjCe0CU", "kind": "video"}, {"label": "Bead ratio and the size cutoff, with real data", "url": "https://www.beckman.com/reagents/genomic/cleanup-and-size-selection/pcr/bead-ratio", "kind": "vendor"}, {"label": "AMPure XP cleanup protocol", "url": "https://www.beckman.com/reagents/genomic/cleanup-and-size-selection/pcr/ampure-xp-protocol", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'QC-17';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Nanopore input QC - mass to molarity by fragment size", "url": "https://nanoporetech.com/document/input-dna-rna-qc", "kind": "protocol"}, {"label": "Where the 660 g/mol per bp constant comes from", "url": "https://www.biostars.org/p/484114/", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'QC-20';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Take3 Trio plate and the Take3 app (Agilent)", "url": "https://www.youtube.com/watch?v=V7ch3rkbHlU", "kind": "video"}, {"label": "Take3 / Take3 Trio user guide - all three surfaces", "url": "https://cqls.oregonstate.edu/sites/cqls.oregonstate.edu/files/take3-take3_trio_user_guide_sd-xb000181.pdf", "kind": "vendor"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'PLT-01';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Nanopore input DNA/RNA QC protocol", "url": "https://nanoporetech.com/document/input-dna-rna-qc", "kind": "protocol"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SEQ-11';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Preventing DNA shearing during library prep", "url": "https://nanoporetech.com/support/library-prep/general-lab-practice/how-do-i-prevent-dna-shearing-during-library-preparation", "kind": "guidance"}, {"label": "Preserving long fragments in your samples", "url": "https://nanoporetech.com/support/library-prep/extraction-and-input/how-do-i-preserve-long-fragments-in-my-samples", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SEQ-12';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Running a flow cell check", "url": "https://www.youtube.com/watch?v=OyfyU9MfBpw", "kind": "video"}, {"label": "Flow cell check protocol and warranty thresholds", "url": "https://nanoporetech.com/document/flow-cell-check", "kind": "protocol"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SEQ-18';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Priming and loading a flow cell", "url": "https://www.youtube.com/watch?v=IknVaEnuDz0", "kind": "video"}, {"label": "Loading flow cells: a beginner''s guide", "url": "https://nanoporetech.com/blog/loading-oxford-nanopore-flow-cells-a-beginner-s-guide", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SEQ-19';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Video: Washing a flow cell and emptying the waste channel", "url": "https://www.youtube.com/watch?v=KQBOypLcnOE", "kind": "video"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'SEQ-26';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "UF HiPerGator new user training (the course)", "url": "https://docs.rc.ufl.edu/training/new_user_training/", "kind": "course"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'HPG-07';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "UF: do not run analyses on login nodes", "url": "https://docs.rc.ufl.edu/quickstart/development_testing/", "kind": "guidance"}, {"label": "Login node vs compute node, and how to get one", "url": "https://docs.rc.ufl.edu/quickstart/computation", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'HPG-14';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "UF storage policy - what is and is not backed up", "url": "https://www.rc.ufl.edu/documentation/policies/storage", "kind": "guidance"}, {"label": "UF data management and filesystem paths", "url": "https://docs.rc.ufl.edu/quickstart/data_management/", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'HPG-22';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "UF sample SLURM scripts you can copy", "url": "https://docs.rc.ufl.edu/scheduler/sample_job_scripts", "kind": "guidance"}, {"label": "sbatch reference (SchedMD)", "url": "https://slurm.schedmd.com/sbatch.html", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'HPG-30';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "UF scheduling - the cost of over-requesting", "url": "https://docs.rc.ufl.edu/quickstart/scheduling/", "kind": "guidance"}, {"label": "Reading seff output to right-size a job", "url": "https://rc.northeastern.edu/2025/03/27/job-efficiency-historical-seff", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'HPG-40';

UPDATE public.skills s SET reading_refs = (
  SELECT jsonb_agg(x ORDER BY ord, idx)
  FROM (
    SELECT r AS x, 0 AS ord, i AS idx
      FROM jsonb_array_elements(s.reading_refs) WITH ORDINALITY AS a(r, i)
    UNION ALL
    SELECT r AS x, 1 AS ord, i AS idx
      FROM jsonb_array_elements('[{"label": "Globus on HiPerGator", "url": "https://docs.rc.ufl.edu/data_transfer/globus", "kind": "guidance"}, {"label": "Globus transfers are checksum-verified", "url": "https://docs.globus.org/guides/tutorials/manage-files/transfer-files/", "kind": "guidance"}]'::jsonb) WITH ORDINALITY AS b(r, i)
     WHERE NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.reading_refs) e
        WHERE e->>'url' = r->>'url')
  ) t
), updated_at = now()
WHERE s.code = 'HPG-56';