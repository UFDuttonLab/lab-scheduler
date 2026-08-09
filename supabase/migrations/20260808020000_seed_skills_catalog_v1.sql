-- =====================================================================================
-- 2026-08-08  Skills module: seed catalog v1
--
-- Idempotent. Every INSERT is ON CONFLICT ... DO UPDATE keyed on the natural code, so
-- re-running this file updates content in place rather than duplicating it. Later
-- catalog revisions ship as new migrations of the same shape.
--
-- IMPORTANT - what this file does NOT touch:
--   * skills.active is only set on INSERT, never on UPDATE. If you disable a skill in
--     the UI, re-running this migration will NOT re-enable it. Your enable/disable
--     decisions win over the seed.
--   * instructions_md IS updated on conflict, because that is the content this file
--     exists to deliver. If you have edited instructions in the UI and want to keep
--     them, bump instructions_version in the UI first and remove that row here.
--
-- Content provenance: every skill below is written from vendor documentation (Opentrons
-- Flex, DeNovix DS-11, Oxford Nanopore) or the UF EHS / Research Computing sites, fetched
-- 2026-08-08. Skills that need a lab-specific SOP are seeded as active=false stubs.
-- =====================================================================================

BEGIN;

-- ---------------------------------------------------------------- categories

INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('SAF', 'Safety & Compliance', 'UF EHS courses, biosafety, cryogens, shipping and permits.', '🦺', 10)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('BEN', 'Core Bench Technique', 'Pipetting, balances, centrifuges, mixing, sealing.', '🧪', 20)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('SAM', 'Sample Management', 'IDs, cold chain, plate maps, controls.', '🏷️', 30)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('FLX', 'Opentrons Flex (Robin & Batman)', 'Deck, labware, modules, running and recovering.', '🤖', 40)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('OT2', 'Opentrons OT-2 (Alfred & Ethan)', 'Cleanup, dilution, normalization and pooling.', '🦾', 45)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('FPY', 'Flex Protocol Authoring', 'Protocol Designer, Python API, simulation and change control.', '🐍', 50)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('AEX', 'Automated Extraction', 'Zymo MagBead on Robin; bead handling, controls, batch release.', '🧲', 60)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('MEX', 'Manual Extraction', 'Spin column, filters, RNA, HMW, inhibitor removal.', '🧬', 70)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('QC', 'Quantification & Sizing', 'Denovix DS-11, Qubit, TapeStation, SPRI, pooling math.', '🔍', 80)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('PLT', 'Plate Readers & Take3', 'Synergy HTX, EPOCH, Eon; 48-sample microvolume QC.', '📊', 85)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('PCR', 'Amplification', 'PCR, full-gene 16S, ONT barcoding, qPCR and dPCR.', '🌡️', 90)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('SEQ', 'Library Prep & Sequencing', 'Oxford Nanopore MK1b / MK1c / MK1D.', '📱', 100)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('BGC', 'Biogeochemistry', 'Picarro G2508, exetainers, Shimadzu TOC.', '💨', 110)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('HPG', 'HiPerGator & Computing', 'Access, filesystems, SLURM, environments, transfer.', '🖥️', 120)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('BIX', 'Bioinformatics Pipelines', 'Dorado, Emu, Kraken2, MAGs, MICOM.', '🧮', 130)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
INSERT INTO public.skill_categories (code, name, description, icon, sort_order) VALUES
  ('DAT', 'Data, R & Reproducibility', 'R, git, metadata, archiving, conduct.', '📈', 140)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;

-- ---------------------------------------------------------------- skills

-- SAF-01  Chemical Hygiene Plan (EHS869)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-01', 'Chemical Hygiene Plan (EHS869)', 'Completed UF''s EHS869 online course before any wet-lab work.',
       '**This is the gate.** UF states it plainly: *"All researchers working in wet lab spaces
must complete EH&S''s Chemical Hygiene Plan (EHS869) training prior to beginning work in
the lab."* It is backed by OSHA 29 CFR 1910.1450.

Take it in **myTraining**. It is online and one-time — no annual renewal.

Once you have completed it, two things must follow before you touch a bench:
1. You are added to the lab''s roster in **Gator TRACS / LATCH**, with two emergency contacts.
2. You read the lab-specific Chemical Hygiene Plan and the SOPs for the hazards you will
   actually handle — for us that means guanidinium lysis buffers, ethanol, bleach and
   liquid nitrogen at minimum.

Upload or note your completion date here so the lab has it without digging through
myTraining at audit time.',
       '[{"label": "UF EHS course catalog", "url": "https://www.ehs.ufl.edu/training/ehs-courses/", "kind": "vendor"}, {"label": "UF Chemical Hygiene Plan", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/chemical-safety/chemical-hygiene-plan/", "kind": "vendor"}]'::jsonb, true, false, NULL, 'EHS869',
       'critical', 0, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-01');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-01'), 0, 'Shows a myTraining completion record for EHS869', true),
  ((SELECT id FROM public.skills WHERE code='SAF-01'), 10, 'Is listed on the lab roster in Gator TRACS with two emergency contacts', true),
  ((SELECT id FROM public.skills WHERE code='SAF-01'), 20, 'Can state where the lab-specific CHP and SOPs live', false),
  ((SELECT id FROM public.skills WHERE code='SAF-01'), 30, 'Can point to the eyewash, safety shower, spill kit, extinguisher and nearest exit without prompting', false);

-- SAF-02  Hazard Communication (EHS814)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-02', 'Hazard Communication (EHS814)', 'GHS labels and pictograms; can retrieve and read an SDS in under a minute.',
       'Online in myTraining, one-time.

What it actually buys you: the ability to look at a bottle and know what it will do to
you. GHS gives you **pictograms**, a **signal word** (Danger vs Warning), **hazard
statements** (H-codes) and **precautionary statements** (P-codes).

The Safety Data Sheet has a fixed 16-section structure. In practice you will use:
- **Section 2** — hazard identification
- **Section 4** — first aid
- **Section 7** — handling and storage
- **Section 8** — exposure controls and the right PPE
- **Section 10** — incompatibilities (this is where "do not mix with bleach" lives)

Our highest-consequence example: **guanidinium thiocyanate** in the Zymo MagBead lysis and
binding buffers. Mixed with hypochlorite it releases cyanide gas. That fact is in Section
10 of the SDS, and it is why bleach never goes into a lysis-waste container.',
       '[{"label": "UF EHS course catalog", "url": "https://www.ehs.ufl.edu/training/ehs-courses/", "kind": "vendor"}]'::jsonb, true, true, NULL, 'EHS814',
       'standard', 10, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-02');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-02'), 0, 'Shows a myTraining completion record for EHS814', true),
  ((SELECT id FROM public.skills WHERE code='SAF-02'), 10, 'Given an unfamiliar bottle, names the hazard from the pictogram and signal word', true),
  ((SELECT id FROM public.skills WHERE code='SAF-02'), 20, 'Retrieves the SDS for a named lab chemical in under one minute', false),
  ((SELECT id FROM public.skills WHERE code='SAF-02'), 30, 'Finds the incompatibility section and states what must not be mixed with it', false),
  ((SELECT id FROM public.skills WHERE code='SAF-02'), 40, 'States the guanidinium + bleach incompatibility unprompted', false);

-- SAF-03  General Biosafety (EHS853)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-03', 'General Biosafety (EHS853)', 'Core biosafety principles, exposure routes, containment and decontamination.',
       'Online in myTraining, one-time. Prerequisite for the biomedical-waste and BSL-2 sign-offs.

Covers routes of exposure (inhalation of aerosols, ingestion, percutaneous, mucous
membrane), the containment hierarchy, biohazard signage, and decontamination.

Relevant to us specifically: we handle **animal-associated and environmental material of
unknown infectious status** — dolphin blow, rhino middens, bird caeca, fish guts, wetland
soil, raw water. UF''s own biohazard-registration triggers include *"analysis of samples
potentially contaminated with infectious agents"*, which describes most of what comes
through this lab. Assume BSL-2 practices for primary sample handling unless the PI has
ruled otherwise in writing for that sample type.',
       '[{"label": "UF Biosafety", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/biosafety/", "kind": "vendor"}, {"label": "UF Biosafety Manual (PDF)", "url": "https://webfiles.ehs.ufl.edu/BioMan.pdf", "kind": "vendor"}]'::jsonb, true, false, NULL, 'EHS853',
       'standard', 20, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-03');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-03'), 0, 'Shows a myTraining completion record for EHS853', true),
  ((SELECT id FROM public.skills WHERE code='SAF-03'), 10, 'Names the four routes of exposure and gives a lab example of each', true),
  ((SELECT id FROM public.skills WHERE code='SAF-03'), 20, 'Explains why our environmental and animal samples default to BSL-2 handling', false),
  ((SELECT id FROM public.skills WHERE code='SAF-03'), 30, 'Identifies biohazard signage and knows what it obliges them to do', false);

-- SAF-25  Bloodborne Pathogens (EHS850G)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-25', 'Bloodborne Pathogens (EHS850G)', 'Annual. OSHA BBP standard, universal precautions, post-exposure procedure.',
       '**Renews every year.** Verified in two places: the UF EHS course catalog and the UF
Biosafety Manual, which requires *"initial and annual BBP training"*.

Applies to anyone with occupational exposure to human blood or other potentially
infectious material. It also applies by extension to the animal-derived material we
handle under the Animal Contact Program.

Two things people forget:
- **Universal precautions** means you treat every sample as infectious. Not "the ones that
  look dirty."
- The **post-exposure procedure** is time-sensitive. Know it *before* you need it: wash or
  flush immediately, report to your supervisor the same day, and go to the designated
  occupational-medicine provider — not a walk-in clinic that has no idea what you were
  handling.

If you have occupational exposure you should also be enrolled in the departmental BBP
program, which offers **free hepatitis B vaccination**, with either documented vaccination
or a documented declination on file.',
       '[{"label": "UF BBP program", "url": "https://www.ehs.ufl.edu/departments/occupational-safety-risk/occupational-medicine/medical-monitoring/bloodborne-pathogen/", "kind": "vendor"}]'::jsonb, true, false, 12, 'EHS850G',
       'critical', 30, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-25');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-25'), 0, 'Shows a myTraining completion record for EHS850G dated within the last 12 months', true),
  ((SELECT id FROM public.skills WHERE code='SAF-25'), 10, 'States the post-exposure steps in order, without looking them up', true),
  ((SELECT id FROM public.skills WHERE code='SAF-25'), 20, 'Names the designated occupational medicine contact', false),
  ((SELECT id FROM public.skills WHERE code='SAF-25'), 30, 'Has hepatitis B vaccination or a signed declination on file', false),
  ((SELECT id FROM public.skills WHERE code='SAF-25'), 40, 'Explains universal precautions in their own words', false);

-- SAF-27  Biomedical Waste (EHS851)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-27', 'Biomedical Waste (EHS851)', 'Annual. Correct segregation, red bags, sharps, labelling, storage limits.',
       '**Renews every year.** Main campus is EHS851 (EHS854 is the satellite-campus variant).

The practical content is segregation. Getting it wrong is the single most common finding
in a lab safety survey.

- **Red bag / biohazard box** — anything contaminated with biological material: tips,
  plates, tubes, gloves from sample handling.
- **Sharps container** — needles, blades, anything that can puncture. **Never recap a
  needle.**
- **Glass box** — broken glass and Pasteur pipettes. **Not** the sharps container, **not**
  regular trash.
- **Chemical waste** — guanidinium-containing lysis and binding waste, ethanol, EtBr or
  SYBR gel waste. This is a *chemical* stream even though the sample was biological.

The last one is where our workflows bite: Zymo MagBead binding waste is both biological
and chaotropic. It goes to chemical waste, labelled with full chemical names at the moment
the first drop goes in — no formulas, no abbreviations — and the container stays closed.',
       '[{"label": "UF EHS course catalog", "url": "https://www.ehs.ufl.edu/training/ehs-courses/", "kind": "vendor"}]'::jsonb, true, true, 12, 'EHS851',
       'high', 40, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-27');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-27'), 0, 'Shows a myTraining completion record for EHS851 dated within the last 12 months', true),
  ((SELECT id FROM public.skills WHERE code='SAF-27'), 10, 'Correctly sorts a mixed handful of real lab waste into the right streams', true),
  ((SELECT id FROM public.skills WHERE code='SAF-27'), 20, 'States where guanidinium-containing extraction waste goes and why', false),
  ((SELECT id FROM public.skills WHERE code='SAF-27'), 30, 'Labels a fresh waste container correctly at the moment of first use', false),
  ((SELECT id FROM public.skills WHERE code='SAF-27'), 40, 'Knows glass does not go in the sharps container', false);

-- SAF-16  Hazardous Waste Management (EHS809)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-16', 'Hazardous Waste Management (EHS809)', 'Annual. Chemical waste identification, containers, labelling, pickup requests.',
       '**Renews every year.** Online in myTraining.

Covers waste identification, compatible container selection, labelling, satellite
accumulation area rules, and how to submit a pickup request.

The rules that get broken most often:
- Label the container **when the first waste goes in**, not when it is full.
- Full chemical names. "GITC" and "EtOH" are not labels. "Guanidinium thiocyanate" and
  "ethanol" are.
- **Keep the container closed** except when actively adding waste. A funnel left in the
  neck is an open container.
- Nothing goes down the drain without explicit approval.
- Secondary containment under every liquid waste container.',
       '[{"label": "UF EHS course catalog", "url": "https://www.ehs.ufl.edu/training/ehs-courses/", "kind": "vendor"}]'::jsonb, true, true, 12, 'EHS809',
       'high', 50, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-16');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-16'), 0, 'Shows a myTraining completion record for EHS809 dated within the last 12 months', true),
  ((SELECT id FROM public.skills WHERE code='SAF-16'), 10, 'Labels a new waste container correctly and completely at first use', true),
  ((SELECT id FROM public.skills WHERE code='SAF-16'), 20, 'Container is closed and in secondary containment when observed', false),
  ((SELECT id FROM public.skills WHERE code='SAF-16'), 30, 'Can locate the satellite accumulation area and state its limits', false),
  ((SELECT id FROM public.skills WHERE code='SAF-16'), 40, 'Submits a pickup request correctly', false);

-- SAF-29  BSL-2 practices
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-29', 'BSL-2 practices', 'Documented, PI-signed proficiency in BSL-2 containment — not just the online course.',
       'UF is explicit that BSL-2 requires personnel to *"take training and demonstrate proficiency
in handling materials"* — a **documented, agent-specific, supervisor-signed competency**,
not a completion certificate. This sign-off is that record.

BSL-2 is everything in BSL-1 **plus**:
- Biohazard signage on **all containers** and at the lab entry
- Leak-proof secondary containers for storage and transport
- Restricted access while work is in progress
- **Lab coat, gloves and eye protection are mandatory** — not discretionary
- **A biosafety cabinet is required for any aerosol-generating procedure** — vortexing
  open tubes, bead beating, sonicating, pouring, or anything that can splash

For this lab that means primary handling of animal- and environment-derived material
(middens, caeca, gut contents, blow, raw water, wetland soil) happens under BSL-2
practice. Downstream work on purified DNA is BSL-1.',
       '[{"label": "UF Biosafety Levels", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/biosafety/biosafety-levels/", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'critical', 60, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-29');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-29'), 0, 'Wears lab coat, gloves and eye protection throughout, without being asked', true),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), 10, 'Identifies which steps in their own protocol are aerosol-generating', true),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), 20, 'Performs those steps in the BSC rather than on the open bench', false),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), 30, 'Uses leak-proof secondary containment to move samples between rooms', false),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), 40, 'Decontaminates the work surface before and after with correct contact time', false),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), 50, 'Doffs gloves before touching door handles, keyboards or a phone', false);

-- SAF-31  Biosafety cabinet operation
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-31', 'Biosafety cabinet operation', 'Correct BSC technique, and can verify the cabinet''s certification is current.',
       'The BSC is one of the most-booked pieces of equipment in this lab (RNA extractions,
sediment extractions, clean molecular setup). It protects the sample as much as it
protects you — and only if it is used correctly.

**Before you start:** check the certification sticker. **UF requires annual certification
for BSCs used at BSL-2.** If the date has passed, stop and report it. Run the blower for
a few minutes, then wipe the work surface with 70% ethanol (or 10% bleach followed by
ethanol if you are decontaminating biological material — bleach corrodes stainless steel
and must be wiped off).

**While you work:**
- Work **4–6 inches inside** the sash, never at the very front edge
- **Never block the front or rear grilles** — that is what destroys the air curtain
- Move slowly. Rapid arm movements pull room air in over your samples
- Load everything you need before you start; every in-and-out is a breach
- No open flames — the thermal plume wrecks the laminar flow and can damage the HEPA
- Work clean-to-dirty, left to right, and keep a waste container inside

**After:** decontaminate the surface, remove everything, let the blower run.',
       '[{"label": "UF Biosafety Levels", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/biosafety/biosafety-levels/", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'high', 70, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-31');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-31'), 0, 'Checks and reads the certification sticker date before starting', true),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), 10, 'Runs the blower and decontaminates the surface before loading', true),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), 20, 'Loads all materials in one pass, arranged clean-to-dirty', false),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), 30, 'Works 4–6 inches inside the sash with grilles unobstructed', false),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), 40, 'Arm movements are slow and perpendicular to the sash', false),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), 50, 'No open flame used at any point', false),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), 60, 'Decontaminates and clears the cabinet on finishing', false);

-- SAF-34  Autoclave operation
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-34', 'Autoclave operation', 'Correct cycle, safe loading, verified sterilisation, logged run.',
       'UF lists Autoclave Training as in-person, renewal "Recommended" — we mandate it annually.

**Cycle choice is not cosmetic.** Liquids run on a **liquid/slow-exhaust cycle**; a gravity
cycle will flash-boil them and you will open the door onto a scalding mess. Dry goods run
gravity.

**Never autoclave:**
- Sealed containers of any kind — they become pressure vessels
- Chlorinated plastics or anything containing bleach — releases chlorine gas and corrodes
  the chamber
- Flammables, or volatile solvents
- Radioactive material

**Loading:** don''t over-pack; steam has to reach every surface. Loosen caps. Use a
secondary tray for liquids. Leave headspace — liquid containers no more than 2/3 full.

**Verification:** indicator tape tells you the load got hot, **not** that it got sterile.
Periodic **biological (spore) indicators** are what prove sterilisation. Our BI frequency
is not published by UF — confirm with `bso@ehs.ufl.edu` and record the answer in the lab
SOP.

**Unloading:** wait for the chamber to fully depressurise and for liquids to drop below
boiling. Heat gloves and face protection. Superheated liquid can boil over minutes after
the cycle ends. Log every run.',
       '[]'::jsonb, true, true, 12, NULL,
       'high', 80, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-34');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-34'), 0, 'Selects liquid vs gravity cycle correctly for the load and explains why', true),
  ((SELECT id FROM public.skills WHERE code='SAF-34'), 10, 'Loads without over-packing; caps loosened; liquids ≤2/3 full in a secondary tray', true),
  ((SELECT id FROM public.skills WHERE code='SAF-34'), 20, 'Rejects a load containing a sealed container or chlorinated plastic', false),
  ((SELECT id FROM public.skills WHERE code='SAF-34'), 30, 'Applies indicator tape and can explain what it does and does not prove', false),
  ((SELECT id FROM public.skills WHERE code='SAF-34'), 40, 'Waits for full depressurisation and uses heat gloves plus face protection', false),
  ((SELECT id FROM public.skills WHERE code='SAF-34'), 50, 'Records the run in the autoclave log', false);

-- SAF-39  Liquid nitrogen and cryogens (EHS866)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-39', 'Liquid nitrogen and cryogens (EHS866)', 'Safe LN2 and dry ice handling; understands asphyxiation and vial-explosion risk.',
       'Online in myTraining. UF lists renewal as "Recommended" — we mandate every 3 years for
anyone touching LN2 or a vapour-phase dewar.

**PPE is cryo gloves plus a face shield.** Safety glasses are not enough — the hazard is
splash to the face.

**Asphyxiation is the thing that actually kills people.** One litre of liquid nitrogen
becomes about 700 litres of gas. In a small unventilated room, a walk-in cold room, or a
lift, that displaces oxygen fast and without warning — nitrogen is odourless and you do not
feel short of breath before you pass out. **Never ride in a lift with an open dewar.** Send
it up alone and meet it.

**Cryovial explosion.** A vial stored in *liquid* phase can take LN2 in past the seal.
On warming it becomes a pressure vessel and can burst. Prefer **vapour-phase storage**;
if you must retrieve from liquid phase, let vials vent behind a shield before handling.

**Cold burns** look like thermal burns. Flush with lukewarm — not hot — water and get
medical attention.

**Dry ice** is the same asphyxiation story: never in a sealed container, never in a walk-in
cold room, never in a car cabin.',
       '[]'::jsonb, true, true, 36, 'EHS866',
       'critical', 90, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-39');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-39'), 0, 'Shows a myTraining completion record for EHS866', true),
  ((SELECT id FROM public.skills WHERE code='SAF-39'), 10, 'Puts on cryo gloves and a face shield before opening the dewar', true),
  ((SELECT id FROM public.skills WHERE code='SAF-39'), 20, 'States the lift rule and the small-room asphyxiation risk unprompted', false),
  ((SELECT id FROM public.skills WHERE code='SAF-39'), 30, 'Transports the dewar on the correct cart, not carried', false),
  ((SELECT id FROM public.skills WHERE code='SAF-39'), 40, 'Explains vapour- vs liquid-phase storage and the vial explosion risk', false),
  ((SELECT id FROM public.skills WHERE code='SAF-39'), 50, 'States the cold-burn first aid correctly', false);

-- SAF-43  Shipping biological materials (EHS852)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SAF-43', 'Shipping biological materials (EHS852)', 'Required, 2-year certificate, for anyone who ships OR prepares a shipment.',
       '**This is required, and it expires every 2 years** — matching the DOT/IATA recurrent
training rule. It applies to anyone who **transports or prepares** dangerous goods, not
just whoever hands the box to the courier.

Register by emailing **`bso@ehs.ufl.edu`** with your first name, last name and UFID.

Why it matters here: this lab moves material from **Kenya, South Africa and Greenland**.
Misdeclaring a shipment is the most common and most expensive error in the whole process —
UF publishes the exposure as civil penalties of $250–$27,500 per violation per day, and up
to $500,000 and 5 years imprisonment for wilful violations.

Classification you must get right:
- **Category A** (UN2814 / UN2900) — capable of causing permanent disability or fatal
  disease. Rare for us.
- **Category B** (UN3373, "Biological Substance, Category B") — most diagnostic and
  research specimens.
- **Exempt human/animal specimen** — minimal likelihood of pathogens present.
- **Not regulated** — preserved DNA extracts in most cases.

**Dry ice is separately regulated**: UN1845, Class 9, net mass declared on the airway
bill, and the package must vent — never fully sealed.

Practical mitigation worth knowing: DNA/RNA Shield, ethanol or FTA cards can move a
shipment to ambient temperature and sometimes out of Category B entirely, which removes
the dry ice problem and most of the customs friction.

**Dangerous goods may not travel in a personal vehicle.** Use a state vehicle.',
       '[{"label": "UF Shipping and Transport", "url": "https://www.ehs.ufl.edu/departments/research-safety-services/biosafety/shipping-and-transport/", "kind": "vendor"}]'::jsonb, true, true, 24, 'EHS852',
       'critical', 100, true
FROM public.skill_categories c WHERE c.code = 'SAF'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SAF-43');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-43'), 0, 'Holds a current EHS852 certificate dated within the last 24 months', true),
  ((SELECT id FROM public.skills WHERE code='SAF-43'), 10, 'Correctly classifies three example shipments (Cat A / Cat B / exempt / not regulated)', true),
  ((SELECT id FROM public.skills WHERE code='SAF-43'), 20, 'Builds a compliant triple-pack: primary, absorbent, leak-proof secondary, rigid outer', false),
  ((SELECT id FROM public.skills WHERE code='SAF-43'), 30, 'Declares dry ice net mass on the airway bill and leaves the package able to vent', false),
  ((SELECT id FROM public.skills WHERE code='SAF-43'), 40, 'States that dangerous goods cannot go in a personal vehicle', false),
  ((SELECT id FROM public.skills WHERE code='SAF-43'), 50, 'Attaches permits and the declaration to the outside of the package', false);

-- BEN-01  Air-displacement pipetting
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-01', 'Air-displacement pipetting', 'Consistent, accurate volumes; correct technique for viscous and foaming reagents.',
       'Everything downstream is built on this. A 5% pipetting error compounds through extraction,
normalisation and pooling into a sequencing run where half your samples are underrepresented.

**Forward pipetting** (the default): press to the **first stop**, immerse the tip 2–3 mm,
release the plunger **slowly**, pause a beat, withdraw. To dispense, press to the first
stop, then to the second to blow out.

**Reverse pipetting** — for viscous, foaming or volatile liquids (glycerol, detergent-
containing buffers, master mix with a lot of enzyme). Press to the **second** stop to
aspirate, dispense only to the **first** stop, and discard the residual. This is what you
use for master mixes; it removes the blow-out variability that shows up as inter-replicate
scatter in qPCR.

**Things that quietly ruin accuracy:**
- Not pre-wetting a fresh tip — the first draw is short by a percent or two
- Holding the pipette at an angle instead of vertical
- Immersing too deep (drags liquid on the outside) or too shallow (aspirates air)
- Releasing the plunger fast — the single biggest cause of aerosol and short draws
- Working outside the pipette''s range. A P1000 set to 80 µL is worse than a P200 at 80 µL
- Warm hands on the barrel of a small-volume pipette during a long run',
       '[]'::jsonb, true, true, 12, NULL,
       'critical', 110, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-01');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-01'), 0, 'Selects the correct pipette for the volume, not the nearest one to hand', true),
  ((SELECT id FROM public.skills WHERE code='BEN-01'), 10, 'Pre-wets a fresh tip before the first measured draw', true),
  ((SELECT id FROM public.skills WHERE code='BEN-01'), 20, 'Holds the pipette vertical and immerses 2–3 mm', false),
  ((SELECT id FROM public.skills WHERE code='BEN-01'), 30, 'Releases the plunger slowly and pauses before withdrawing', false),
  ((SELECT id FROM public.skills WHERE code='BEN-01'), 40, 'Uses reverse pipetting for a master mix or viscous reagent and explains why', false),
  ((SELECT id FROM public.skills WHERE code='BEN-01'), 50, 'Eight replicate 10 µL dispenses are visibly even in a strip', false),
  ((SELECT id FROM public.skills WHERE code='BEN-01'), 60, 'Changes tips at every point where carryover would matter', false);

-- BEN-02  Gravimetric pipette verification
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-02', 'Gravimetric pipette verification', 'Runs and interprets a 10-replicate gravimetric check; quarantines out-of-spec pipettes.',
       '**Annual, per pipette, per user.** Do it on your own pipettes at the start of each academic
year, and any time results go strange.

**Method.** On an analytical balance, in a weighing vessel with a little water in it to
reduce evaporation:
1. Use distilled water at room temperature. Record the temperature.
2. Pre-wet the tip. Dispense and record **10 replicates** at each of three volumes:
   nominal (100% of range), mid (~50%), and low (10% of range, or the pipette''s minimum).
3. Convert mass to volume with the density of water at your recorded temperature
   (≈0.9982 g/mL at 20 °C; use a Z-factor table for anything more careful).

**Interpret:**
- **Accuracy (systematic error)** = mean measured volume − nominal, as a %
- **Precision (%CV)** = standard deviation / mean × 100

Compare against ISO 8655-style limits for the pipette''s class and volume. Tolerances widen
at the low end of the range — a P200 at 20 µL is allowed far more error than at 200 µL,
which is exactly why you don''t use a pipette at the bottom of its range.

**If it fails:** tag it, take it out of service, and log it. Do not "just be careful with
that one." A quietly out-of-spec P200 will contaminate months of data before anyone
notices.',
       '[]'::jsonb, true, true, 12, NULL,
       'high', 120, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-02');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-02'), 0, 'Records water temperature and uses the correct density conversion', true),
  ((SELECT id FROM public.skills WHERE code='BEN-02'), 10, 'Pre-wets and runs 10 replicates at each of three volumes', true),
  ((SELECT id FROM public.skills WHERE code='BEN-02'), 20, 'Calculates both %error and %CV correctly', false),
  ((SELECT id FROM public.skills WHERE code='BEN-02'), 30, 'Compares against a written acceptance limit rather than eyeballing', false),
  ((SELECT id FROM public.skills WHERE code='BEN-02'), 40, 'Correctly decides pass/fail and tags a failing pipette out of service', false),
  ((SELECT id FROM public.skills WHERE code='BEN-02'), 50, 'Logs the result where the next person can find it', false);

-- BEN-03  Multichannel pipetting into plates
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-03', 'Multichannel pipetting into plates', 'Even loading across all channels; A1 orientation confirmed every time.',
       'The 96-well plate is where our extraction and library prep live, so this is a production
skill, not a nicety.

**Tip loading.** Press down firmly and evenly across all channels — rock slightly if
needed and check visually that every tip is seated to the same depth. One loose tip gives
you one short well, and you will not see it until QC.

**Depth.** All 8 or 12 tips must reach the same depth in the source. Tilting means the
outer channels aspirate air or hit the bottom. Rest the tips lightly on the well bottom if
you need a repeatable reference.

**A1 orientation.** Confirm it out loud, every plate, every time. Check the notch or the
printed A1 marker against your plate map before you dispense anything. A 180° plate rotation
is unrecoverable once the samples are pooled — and it looks like a biological result.

**Carryover.** Change tips between columns unless the protocol explicitly says otherwise.
When adding master mix to samples, dispense against the well wall above the liquid, not
into it.

**Reagent reservoirs.** Account for dead volume plus overage. Running a reservoir dry
mid-plate is one of the most common causes of a partial plate failure.',
       '[]'::jsonb, true, true, 6, NULL,
       'high', 130, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-03');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-03'), 0, 'Seats all tips evenly and checks visually before aspirating', true),
  ((SELECT id FROM public.skills WHERE code='BEN-03'), 10, 'Confirms A1 orientation against the plate map aloud before dispensing', true),
  ((SELECT id FROM public.skills WHERE code='BEN-03'), 20, 'All channels reach the same depth; no tilting observed', false),
  ((SELECT id FROM public.skills WHERE code='BEN-03'), 30, 'Changes tips between columns where carryover would matter', false),
  ((SELECT id FROM public.skills WHERE code='BEN-03'), 40, 'Calculates reservoir volume as dead volume plus overage before starting', false),
  ((SELECT id FROM public.skills WHERE code='BEN-03'), 50, 'Finished plate shows visually even volumes across all columns', false);

-- BEN-07  Serial dilution
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-07', 'Serial dilution', 'Designs and executes a dilution series to a target, and can prove it by measurement.',
       'We use this constantly — qPCR standard curves, dPCR input optimisation (the lab has tested
0.5, 1, 2 and 3 ng loaded into dPCR wells), and normalising extracts to 1 ng/µL before
library prep.

**Design first, pipette second.** Write out the series: starting concentration, dilution
factor per step, number of steps, final volume needed at each step. Check that no step
requires a volume below your pipette''s reliable range — if it does, use a larger
intermediate volume rather than pipetting 0.5 µL.

**Execute:**
- **Change tips at every step.** Carryover on the outside of a tip is a real error source
  in a 10-fold series.
- **Mix completely at every step** before drawing the next aliquot — pipette up and down
  8–10 times, or vortex and spin down. Incomplete mixing at step 1 propagates through the
  whole curve and shows up as a bad R².
- Work from most dilute to most concentrated when setting up, so a splash goes the harmless
  direction.
- Label every tube before you start, not after.

**Prove it.** A dilution series you cannot verify is a guess. Re-quantify at least the
endpoints, or check the standard curve slope: a 10-fold series should give ~3.32 cycles
per step at 100% efficiency.',
       '[]'::jsonb, true, true, 6, NULL,
       'high', 140, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-07');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-07'), 0, 'Writes the dilution plan before touching a pipette', true),
  ((SELECT id FROM public.skills WHERE code='BEN-07'), 10, 'No step requires a volume below the pipette''s reliable range', true),
  ((SELECT id FROM public.skills WHERE code='BEN-07'), 20, 'Changes tips at every step', false),
  ((SELECT id FROM public.skills WHERE code='BEN-07'), 30, 'Mixes completely at each step and can say how they know it is mixed', false),
  ((SELECT id FROM public.skills WHERE code='BEN-07'), 40, 'Labels all tubes before starting', false),
  ((SELECT id FROM public.skills WHERE code='BEN-07'), 50, 'Verifies the result by re-quantification or by standard-curve slope', false);

-- BEN-10  Buffer and reagent preparation
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-10', 'Buffer and reagent preparation', 'Prepares standard buffers from first principles; labels completely.',
       'Prepare TE, TBE/TAE, PBS, ethanol dilutions and kit adjuncts from first principles rather
than following a recipe card you cannot check.

**Calculate.** Mass = molarity × volume × formula weight. For a dilution, C1V1 = C2V2. Do
the arithmetic before you weigh anything, and sanity-check the order of magnitude.

**Prepare.** Weigh on a levelled, tared balance. Dissolve in ~80% of the final volume,
adjust pH if the recipe calls for it (**pH before topping up**, because adjusting changes
the volume), then bring to final volume in a volumetric flask.

**Water grade matters.** Nuclease-free is not the same as molecular-biology-grade is not
the same as DI. For anything touching RNA or a sequencing library, use nuclease-free and
aliquot it so the stock bottle never sees a used tip.

**Label completely**, every time: contents, concentration, date prepared, your initials,
and an expiry. An unlabelled bottle is waste — it cannot be trusted and must be discarded,
which wastes both the reagent and your time.

**Filter-sterilise or autoclave** as the application requires, and record which you did.',
       '[]'::jsonb, true, true, NULL, NULL,
       'standard', 150, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-10');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-10'), 0, 'Does the molarity or C1V1 calculation unaided and gets it right', true),
  ((SELECT id FROM public.skills WHERE code='BEN-10'), 10, 'Dissolves in partial volume, adjusts pH before topping up', true),
  ((SELECT id FROM public.skills WHERE code='BEN-10'), 20, 'Brings to final volume in a volumetric flask, not a beaker', false),
  ((SELECT id FROM public.skills WHERE code='BEN-10'), 30, 'Selects the correct water grade for the application and can justify it', false),
  ((SELECT id FROM public.skills WHERE code='BEN-10'), 40, 'Labels with contents, concentration, date, initials and expiry', false),
  ((SELECT id FROM public.skills WHERE code='BEN-10'), 50, 'Records preparation in the notebook with lot numbers', false);

-- BEN-12  Fresh 80% ethanol for bead work
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-12', 'Fresh 80% ethanol for bead work', 'Prepares 80% EtOH the day of use and knows why weaker ethanol loses DNA.',
       'Small skill, disproportionate consequences. It applies to every SPRI cleanup and every
nanopore library prep we run.

**Prepare it the day you use it**, from absolute ethanol and nuclease-free water. Ethanol
is hygroscopic — an open bottle of "80%" left on the bench absorbs water from the air and
drifts down over days.

**Why the number matters.** DNA stays bound to the magnetic beads only while the ethanol
concentration is high enough. Below roughly 70% the DNA starts to re-dissolve and washes
away with the supernatant. You get a clean-looking prep with a fraction of the yield you
expected, and the loss is silently size-biased. Oxford Nanopore call this out explicitly in
their protocols: use freshly prepared **80%**, never weaker.

**Make enough.** Two washes per sample plus overage. Running out halfway through a plate
and topping up with yesterday''s bottle is exactly the failure this skill exists to prevent.

**Don''t over-dry the other way either.** Once the second wash is off, air-dry only until
the pellet loses its sheen — cracked, chalky pellets do not fully re-elute, and that shows
up as a bad A260/230.',
       '[{"label": "ONT ligation sequencing SQK-LSK114", "url": "https://nanoporetech.com/document/genomic-dna-by-ligation-sqk-lsk114", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'high', 160, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-12');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-12'), 0, 'Prepares 80% EtOH fresh, from absolute ethanol and nuclease-free water, on the day', true),
  ((SELECT id FROM public.skills WHERE code='BEN-12'), 10, 'Calculates enough for all washes plus overage before starting', true),
  ((SELECT id FROM public.skills WHERE code='BEN-12'), 20, 'States why <70% ethanol loses DNA off the beads', false),
  ((SELECT id FROM public.skills WHERE code='BEN-12'), 30, 'Does not top up from an old or unlabelled ethanol bottle', false),
  ((SELECT id FROM public.skills WHERE code='BEN-12'), 40, 'Judges dryness by loss of sheen rather than a fixed timer', false);

-- BEN-13  Aseptic technique at the bench
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-13', 'Aseptic technique at the bench', 'Maintains a clean work zone and can articulate their own contamination vectors.',
       'For a low-biomass microbiome lab, contamination is not a nuisance — it is a competing
hypothesis. Every bacterium you introduce becomes a data point someone may later try to
interpret.

**The mindset that matters:** you should be able to name, out loud, the three most likely
routes by which *you specifically* could contaminate the sample you are handling right now.
People who can do that stay clean. People who follow a checklist without that model do not.

**Practice:**
- Decontaminate the bench before and after — 70% ethanol, or 10% bleach then ethanol for
  biological decontamination. Honour the contact time; bleach needs minutes, not a wipe.
- Filter tips for anything touching sample or master mix.
- Open tubes and plates without touching the inner rim or the underside of the lid. Never
  put a lid down face-up on the bench.
- Work clean-to-dirty. Set up master mix before you handle template, in a different space.
- Change gloves at defined trigger points — after touching your face, a door, a keyboard,
  a phone, or anything outside the clean zone.
- Keep your own hair, sleeves and reagent bottles out of the airspace above open tubes.

**Reagent hygiene:** aliquot. A single contaminated stock bottle of water or buffer will
appear in every sample you process for months, and it looks exactly like a real result.',
       '[]'::jsonb, true, true, 12, NULL,
       'high', 170, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-13');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-13'), 0, 'Names three specific contamination vectors for the task in hand, unprompted', true),
  ((SELECT id FROM public.skills WHERE code='BEN-13'), 10, 'Decontaminates the work zone before and after with correct contact time', true),
  ((SELECT id FROM public.skills WHERE code='BEN-13'), 20, 'Uses filter tips throughout', false),
  ((SELECT id FROM public.skills WHERE code='BEN-13'), 30, 'Opens tubes and plates without touching interiors; lids never face-up', false),
  ((SELECT id FROM public.skills WHERE code='BEN-13'), 40, 'Works clean-to-dirty with master mix set up away from template', false),
  ((SELECT id FROM public.skills WHERE code='BEN-13'), 50, 'Changes gloves at appropriate trigger points during the observation', false),
  ((SELECT id FROM public.skills WHERE code='BEN-13'), 60, 'Uses aliquoted reagents rather than the stock bottle', false);

-- BEN-21  Bead beating and mechanical homogenisation
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-21', 'Bead beating and mechanical homogenisation', 'Correct bead type, speed and duration for the matrix; no cross-contamination or cap failure.',
       'The front end of every Zymo MagBead extraction from a solid matrix — wetland soil,
sediment, faeces, middens, gut contents, caeca.

**Bead and matrix selection.** Bead size and material determine what lyses. Small silica or
zirconia beads for bacterial cells; larger or mixed beads for fibrous or tough tissue.
Using the kit''s supplied tubes is usually right; swapping bead types changes your community
profile, so it is a protocol change, not a substitution.

**This is a lysis-bias step.** Under-beating leaves tough-walled Gram-positives intact and
your community looks Gram-negative-skewed. Over-beating shears DNA and destroys the long
fragments that full-length 16S and nanopore need. There is one correct setting for a given
matrix and kit, it must be written down, and it must not drift between people.

**Balance the holder.** Always. An unbalanced bead beater damages itself and can throw a
tube.

**Heat.** Beating generates real heat, which degrades nucleic acid. Follow the protocol''s
cooling intervals — beat, rest on ice, beat again — rather than running one long cycle.

**Cap failure and aerosol.** Check caps are fully seated before you start. A tube that
opens mid-run cross-contaminates the whole holder and creates a BSL-2 aerosol. Let the
holder settle for a minute before opening, then open in the BSC.',
       '[]'::jsonb, true, true, 12, NULL,
       'high', 180, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-21');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-21'), 0, 'Selects the correct bead type and tube for the matrix and can justify it', true),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), 10, 'Uses the written speed and duration for that matrix rather than from memory', true),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), 20, 'Balances the holder correctly', false),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), 30, 'Applies cooling intervals rather than one continuous run', false),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), 40, 'Checks all caps are seated before starting', false),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), 50, 'Lets the holder settle before opening, and opens in the BSC', false),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), 60, 'Explains the lysis-bias trade-off between under- and over-beating', false);

-- BEN-25  Manual magnetic stand and bead handling
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'BEN-25', 'Manual magnetic stand and bead handling', 'Aspirates cleanly without disturbing the bead ring; judges dryness by eye.',
       'Underpins manual SPRI cleanups and is the conceptual foundation for everything the robots
do on the Magnetic Block. Learn it by hand before you trust it automated — when a Robin run
gives poor yield, this is the model you use to work out why.

**Resuspension before use.** Beads settle fast. Vortex the stock until completely
homogeneous and let it come to room temperature — cold beads bind poorly and the volume
you pipette is wrong if they are still settling.

**Binding.** Mix sample and beads thoroughly, then incubate off the magnet for the full
time. This is where DNA actually binds; cutting it short costs yield directly.

**Separation.** On the magnet, wait until the supernatant is **completely clear**, not
mostly clear. Plate geometry and bead load change how long that takes — judge it by eye
every time rather than by a fixed timer.

**Aspiration.** Approach from the side **opposite** the bead pellet, tip near the bottom,
draw slowly. Any beads you take out are yield you have thrown away. Any liquid you leave
behind is carryover into your elution.

**Washing.** Keep the plate on the magnet. Add ethanol down the opposite wall without
disturbing the pellet. Do not resuspend during a wash.

**Drying.** Until the pellet loses its sheen. Shiny means residual ethanol, which will
inhibit downstream enzymes. Cracked and chalky means over-dried, which will not fully
re-elute. There is a window and it is visual.

**Elution.** Off the magnet, resuspend fully, give it the full incubation.',
       '[]'::jsonb, true, true, NULL, NULL,
       'high', 190, true
FROM public.skill_categories c WHERE c.code = 'BEN'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='BEN-25');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='BEN-25'), 0, 'Vortexes beads to homogeneity and brings them to room temperature first', true),
  ((SELECT id FROM public.skills WHERE code='BEN-25'), 10, 'Incubates off-magnet for the full binding time', true),
  ((SELECT id FROM public.skills WHERE code='BEN-25'), 20, 'Waits for a completely clear supernatant before aspirating', false),
  ((SELECT id FROM public.skills WHERE code='BEN-25'), 30, 'Aspirates from the side opposite the pellet without removing beads', false),
  ((SELECT id FROM public.skills WHERE code='BEN-25'), 40, 'Adds wash ethanol without disturbing the pellet, plate stays on magnet', false),
  ((SELECT id FROM public.skills WHERE code='BEN-25'), 50, 'Correctly identifies the dryness endpoint by appearance', false),
  ((SELECT id FROM public.skills WHERE code='BEN-25'), 60, 'Resuspends fully off-magnet for elution', false);

-- FLX-01  Flex orientation and nomenclature
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-01', 'Flex orientation and nomenclature', 'Names and points to every part of the machine using the correct terms.',
       'You cannot follow a protocol or report a fault if you don''t share vocabulary with it.
Learn these on the machine, not from a diagram.

- **Gantry** — the moving bridge carrying the pipettes
- **Mounts** — left and right pipette mounts; the **extension mount** carries the gripper
- **Deck slots** — the A1–D3 grid (rows A–D front to back, columns 1–3 left to right)
- **Staging area** — column 4. **Gripper access only** — the pipettes cannot reach it
- **Trash bin** and **waste chute** — configured in software; they must match the physical deck
- **Touchscreen** — on the robot; runs Prepare-to-run and Quick Transfer
- **Front and side windows** — these are *not* a safety interlock

Both of our Flexes are named: **Robin** does DNA extractions, **Batman** has the 96-head
pipette and runs the Zymo 96 full-gene 16S library prep. They are configured differently.
A sign-off here covers the vocabulary, not one specific machine.',
       '[{"label": "Opentrons Flex glossary", "url": "https://docs.opentrons.com/flex/glossary/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'standard', 200, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-01');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-01'), 0, 'Points to and names gantry, mounts, extension mount, deck slots, staging area, trash bin, waste chute', true),
  ((SELECT id FROM public.skills WHERE code='FLX-01'), 10, 'States the deck grid convention (A–D front to back, 1–3 left to right)', true),
  ((SELECT id FROM public.skills WHERE code='FLX-01'), 20, 'Knows the staging area is gripper-access-only', false),
  ((SELECT id FROM public.skills WHERE code='FLX-01'), 30, 'States that the windows are not an interlock', false),
  ((SELECT id FROM public.skills WHERE code='FLX-01'), 40, 'Knows which of Robin and Batman does what', false);

-- FLX-02  Flex safety and E-stop
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-02', 'Flex safety and E-stop', 'Can reach and use the E-stop from any working position; knows the pinch points.',
       'The Flex gantry moves fast and has real force behind it. The enclosure is **not** an
interlock — the robot will keep moving with the window open.

**The E-stop pendant.** Find it now, before you need it. It should be within reach of
wherever you stand while the robot runs. Pressing it cuts motion immediately.

**Resetting** after an E-stop: twist to release, then the robot needs to re-home. Understand
that an E-stop leaves the deck in an undefined state — a plate may be mid-transfer in the
gripper, tips may be attached, a module may be mid-cycle. Do not assume you can just resume;
assess what state the chemistry is in first.

**Pinch and crush points:** between the gantry and the frame at the extremes of travel;
between the gripper jaws; under the z-axis carriage as it descends. Keep your hands out of
the deck while the gantry is live, and if you must intervene, pause the run properly rather
than reaching around a moving arm.

**Before every run**, confirm the E-stop is not already engaged and that nothing is resting
on the deck that shouldn''t be.',
       '[{"label": "Opentrons Flex documentation", "url": "https://docs.opentrons.com/flex/", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'critical', 210, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-02');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-02'), 0, 'Locates and reaches the E-stop from their normal working position', true),
  ((SELECT id FROM public.skills WHERE code='FLX-02'), 10, 'Demonstrates pressing and correctly releasing/resetting it', true),
  ((SELECT id FROM public.skills WHERE code='FLX-02'), 20, 'States that the enclosure is not an interlock', false),
  ((SELECT id FROM public.skills WHERE code='FLX-02'), 30, 'Names the pinch and crush points', false),
  ((SELECT id FROM public.skills WHERE code='FLX-02'), 40, 'Explains why you assess deck state before resuming after an E-stop', false);

-- FLX-16  Labware placement and seating verification
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-16', 'Labware placement and seating verification', 'Every item fully seated, correct A1 orientation, verified against the on-screen deck map.',
       'Most Flex crashes are a labware problem, not a software problem.

**Fully seated.** Press each item down into the slot until it drops in and sits flat. A
plate resting on the lip of a slot is a few millimetres too high, which is enough for the
pipette to crash or to aspirate from the wrong depth all run.

**A1 orientation.** Every plate, tip rack and reservoir has an orientation. Check the notch
or the A1 marker. Getting a plate 180° out means every sample is where the protocol thinks
a different sample is — and the run completes successfully, which is what makes it
dangerous.

**Verify against the deck map.** Before you start, walk the on-screen deck map against the
physical deck, slot by slot, out loud. Not a glance — a slot-by-slot check. This takes
thirty seconds and catches almost everything.

**Adapters.** Some labware needs an adapter (96-channel tip racks, module thermal blocks).
The adapter is part of the stack height; a plate placed directly where an adapter should be
will crash.

**Lids.** Know which items the protocol expects to be lidded and which the gripper will
move. Leaving a lid on something the protocol wants to pipette into is a crash.',
       '[]'::jsonb, true, true, NULL, NULL,
       'high', 220, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-16');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-16'), 0, 'Presses every item fully into its slot and confirms it sits flat', true),
  ((SELECT id FROM public.skills WHERE code='FLX-16'), 10, 'Checks A1 orientation on every plate, rack and reservoir', true),
  ((SELECT id FROM public.skills WHERE code='FLX-16'), 20, 'Walks the on-screen deck map against the physical deck slot by slot before starting', false),
  ((SELECT id FROM public.skills WHERE code='FLX-16'), 30, 'Uses the correct adapter where one is required', false),
  ((SELECT id FROM public.skills WHERE code='FLX-16'), 40, 'Correctly decides which items are lidded at run start', false);

-- FLX-21  Labware Position Check (LPC)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-21', 'Labware Position Check (LPC)', 'Runs LPC end to end and judges tip alignment by eye; saves offsets correctly.',
       'LPC is how the robot learns exactly where your labware sits. It is the highest-value
twenty minutes you will spend on a new protocol.

**What an offset is.** A saved x/y/z correction for a specific **labware type in a specific
slot (or on a specific module)**. Change any of those three and the offset no longer
applies. Offsets are not global and they are not transferable between machines.

**Running it.** The robot moves a tip to each labware in turn. You jog in **0.1 / 1 / 10 mm**
increments until the tip is right. Judge by eye, at eye level, from two angles:
- **Z** — tip just touching the well bottom, not pressed into it, not hovering
- **X/Y** — tip centred in the well, not against a wall

Get down and look. Do not do this from a standing position glancing down.

**Save** when you are happy. The offset applies to that protocol run and can be reused.

**Re-run LPC when:**
- The protocol or its labware changes
- You move to the other Flex — Robin''s offsets are not Batman''s
- Labware lot or vendor changes (moulding varies between lots)
- A pipette has been reattached or recalibrated
- The robot has been moved or re-levelled
- Anything crashes',
       '[]'::jsonb, true, true, 12, NULL,
       'critical', 230, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-21');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-21'), 0, 'Explains what an offset is and the three things that invalidate it', true),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), 10, 'Runs LPC through every labware item without skipping', true),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), 20, 'Uses 0.1 mm increments for the final z adjustment', false),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), 30, 'Views alignment at eye level from two angles', false),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), 40, 'Achieves tip just touching the well bottom, centred in the well', false),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), 50, 'Saves offsets and confirms they applied', false),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), 60, 'Lists at least four situations that require re-running LPC', false);

-- FLX-23  Tip racks, tip tracking and partial pickup
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-23', 'Tip racks, tip tracking and partial pickup', 'Loads racks correctly and reconciles software tip state with physical reality.',
       '**Full racks.** Load complete racks unless the protocol explicitly handles partial ones.
The software counts tips; it does not look at them.

**96-channel racks** need the tip rack adapter. **Partial tip pickup requires racks placed
directly on the deck, not in the adapter** — this catches people out.

**Tip tracking is the thing that bites.** The robot maintains an internal model of which
tips remain. After a pause, an abort, an error recovery, or any manual intervention, that
model can diverge from the physical rack. Before resuming, physically look at the racks and
confirm the software''s next-tip position matches. If it doesn''t, reset tip tracking rather
than letting it pick up from an empty position or re-use a used tip.

**The sensor limitation.** The tip-presence sensor is **disabled for partial pickup of 1–3
tips**. A failed pickup there is *not* detected and *not* recoverable — the run continues
pipetting air. If your protocol does 1–3 tip partial pickup, you must watch it, or design
around it.

**Consumables must be the automation-compliant part numbers.** Third-party tips that "fit"
have different lengths and seal differently, and produce volume errors you will chase for
weeks.',
       '[]'::jsonb, true, true, 6, NULL,
       'high', 240, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-23');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-23'), 0, 'Loads full racks in the correct orientation', true),
  ((SELECT id FROM public.skills WHERE code='FLX-23'), 10, 'Uses the adapter for 96-channel work and places racks directly on deck for partial pickup', true),
  ((SELECT id FROM public.skills WHERE code='FLX-23'), 20, 'After a pause, physically checks racks against the software tip position before resuming', false),
  ((SELECT id FROM public.skills WHERE code='FLX-23'), 30, 'States the 1–3 tip sensor limitation and its consequence', false),
  ((SELECT id FROM public.skills WHERE code='FLX-23'), 40, 'Verifies tips are the specified automation-compliant part number', false);

-- FLX-25  Reservoir and bulk reagent deck prep
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-25', 'Reservoir and bulk reagent deck prep', 'Calculates dead volume plus overage; fills without bubbles; correct slot and orientation.',
       'Running a reservoir dry mid-plate is one of the most common causes of a half-failed run,
and it is entirely preventable arithmetic.

**Volume = (per-well volume × number of wells) + dead volume + overage.** Dead volume is
the amount the geometry will never let the pipette reach — it is reservoir-specific and
often larger than people expect. Overage of 10–20% on top is normal. Write the number down
before you pour.

**Bubbles are a real error source.** A bubble under the aspiration point means the pipette
draws air. Pour down the wall, slowly. Tap or briefly spin to clear surface foam. Detergent-
containing buffers (most lysis and binding buffers) foam readily — pour these especially
slowly.

**Orientation and slot.** 12-column reservoirs have a column-1 end. Check it against the
protocol. A reversed reservoir puts every reagent in the wrong place.

**Cover and label during setup.** An open reservoir of binding buffer sitting on the deck
while you finish the rest of the setup is both an evaporation problem and a contamination
problem. Label with the reagent name and lot.

**Beads specifically:** resuspend to homogeneity and bring to room temperature *before*
pouring, and be aware they will start settling in the reservoir during a long run — that is
what AEX-02 is about.',
       '[]'::jsonb, true, true, NULL, NULL,
       'high', 250, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-25');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-25'), 0, 'Calculates required volume as per-well × wells + dead volume + overage, in writing', true),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), 10, 'Pours down the wall without generating foam or trapped bubbles', true),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), 20, 'Checks reservoir orientation against the protocol', false),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), 30, 'Covers and labels reservoirs during setup', false),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), 40, 'Resuspends and equilibrates beads before pouring', false);

-- FLX-27  Magnetic Block
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-27', 'Magnetic Block', 'Understands the block is passive and that the gripper does the engaging.',
       'The single most common conceptual error for anyone coming from an OT-2.

The Flex **Magnetic Block is passive** — a slab of fixed neodymium magnets with no moving
parts, no cable and no software control. There is no "engage" command. **The plate is moved
on and off the block by the gripper.** That is what engagement means on a Flex.

The OT-2''s **Magnetic Module is active** — the magnets physically rise and fall under
software control, and the plate stays put. If you have trained on Alfred or Ethan, this is
the thing to unlearn.

Consequences:
- Separation time is controlled by how long the protocol leaves the plate on the block
- Plate geometry matters more, because bead-to-magnet distance is fixed by the plate
- The block occupies a deck slot and needs no power or USB
- Any protocol converted from OT-2 must have its `magdeck.engage()` / `disengage()` calls
  rewritten as `move_labware()` gripper moves — this is the crux of FPY-16',
       '[{"label": "Opentrons Flex modules", "url": "https://docs.opentrons.com/flex/modules/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'standard', 260, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-27');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-27'), 0, 'States that the Magnetic Block is passive with no software control', true),
  ((SELECT id FROM public.skills WHERE code='FLX-27'), 10, 'Explains that the gripper moving the plate is what engages and disengages', true),
  ((SELECT id FROM public.skills WHERE code='FLX-27'), 20, 'Contrasts it correctly with the OT-2''s active Magnetic Module', false),
  ((SELECT id FROM public.skills WHERE code='FLX-27'), 30, 'Identifies which plate types are compatible', false),
  ((SELECT id FROM public.skills WHERE code='FLX-27'), 40, 'Explains what must change when converting an OT-2 magnetic protocol', false);

-- FLX-36  Prepare-to-run workflow
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-36', 'Prepare-to-run workflow', 'Works the touchscreen checklist to all-green and understands each item.',
       'The touchscreen walks you through this. The skill is understanding *why* each item is
there, so you notice when one is green but wrong.

1. **Instruments** — correct pipettes attached and calibrated. A pipette that was
   reattached since its last calibration will show as attached but is not trustworthy.
2. **Deck hardware** — modules and fixtures physically present and matching the software
   deck configuration. Trash bin and waste chute count as deck hardware.
3. **Labware** — every item placed, seated, and in A1 orientation (FLX-16).
4. **Labware offsets** — applied from a previous LPC, or LPC run now (FLX-21). Green here
   only means "an offset exists", not "the offset is right for this labware lot".
5. **Liquids** — reservoirs and plates filled to the calculated volumes (FLX-25).
6. **Runtime parameters** — sample count, volumes, CSV input if the protocol takes one.

**All-green is necessary, not sufficient.** The checklist cannot tell you that you loaded
the wrong buffer or that your plate map is rotated. Do your own slot-by-slot pass as well.',
       '[{"label": "Flex protocol setup", "url": "https://docs.opentrons.com/flex/touchscreen/protocol-setup/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'high', 270, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-36');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-36'), 0, 'Works through every checklist item rather than dismissing them', true),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), 10, 'Confirms pipette calibration status, not just attachment', true),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), 20, 'Verifies software deck configuration matches the physical deck', false),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), 30, 'Sets runtime parameters correctly for the intended sample count', false),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), 40, 'Does an independent slot-by-slot check after the checklist is green', false),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), 50, 'Can explain what all-green does not guarantee', false);

-- FLX-41  Error recovery mode
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-41', 'Error recovery mode', 'Chooses the right recovery option for the chemistry, and can justify it.',
       'Requires robot software ≥8.0.0. The recovery options are genuinely different in their
consequences, and picking the convenient one can silently ruin a plate.

**No liquid detected.** Options: refill and retry with the same tips / retry with new tips /
refill and skip / ignore and skip / cancel.
- If a reservoir ran dry, **refill and retry** is right.
- If it is a single well that was already empty by design, **ignore and skip**.
- **Never "ignore and skip" a reagent addition step** and let the run finish — you now have
  a well that silently missed a reagent, and it will look like a biological result.

**Pipette overpressure.** On aspiration: retry with new tips, or cancel. On dispense: skip
with the same tips, skip with new tips, or cancel.
- Overpressure means something is blocked. **Retrying without fixing the cause just fails
  again** — see FLX-42.

**General errors:** retry / skip / cancel.

**The judgement.** Before choosing, ask: what state is this specific well''s chemistry in,
and can it survive the delay? Beads drying out during a long recovery pause is a real
failure mode. Sometimes cancelling and re-extracting is cheaper than salvaging.

**Always record** which recovery option you took, at which step, for which wells. That note
belongs with the batch record — the person interpreting the sequencing data needs it.',
       '[{"label": "Flex protocol run and error recovery", "url": "https://docs.opentrons.com/flex/touchscreen/protocol-run/", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'critical', 280, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-41');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-41'), 0, 'Names the recovery options for no-liquid-detected and for overpressure', true),
  ((SELECT id FROM public.skills WHERE code='FLX-41'), 10, 'Given a scenario, selects the correct option and justifies it by the chemistry', true),
  ((SELECT id FROM public.skills WHERE code='FLX-41'), 20, 'States why ''ignore and skip'' on a reagent addition is dangerous', false),
  ((SELECT id FROM public.skills WHERE code='FLX-41'), 30, 'Considers whether the chemistry can survive the recovery delay', false),
  ((SELECT id FROM public.skills WHERE code='FLX-41'), 40, 'Records the recovery action, step and affected wells in the batch record', false);

-- FLX-47  Routine cleaning of the Flex
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-47', 'Routine cleaning of the Flex', 'Cleans the right surfaces with the right agents; never uses acetone.',
       'Opentrons'' rule, worth memorising: **"if you can see it, you can clean it — if you can''t
see it, don''t clean it."** You are not servicing the machine; you are keeping the visible
surfaces clean.

**Clean:** frame, windows, touchscreen, deck surface, deck slots, trash bin, waste chute,
gantry exterior.

**Agents:** 70% ethyl alcohol, isopropyl alcohol, methanol, 10% bleach, or distilled water.
**Never acetone** — it attacks the plastics and the window coating.

**Method:** wipe → rinse with distilled water → air dry. The rinse matters after bleach;
bleach residue corrodes and leaves a film that interferes with the gripper''s grip.

**Pipettes and gripper:** exterior body, ejector and nozzles only. Gripper body, jaws and
paddles. **Never disassemble. Never autoclave.** Module exteriors only.

**Gripper paddles are wear items.** Inspect them while you are cleaning — if they look
glazed or worn, grip becomes unreliable and plates get dropped. Replace them.

This is separate from **FLX-49**, which is DNA decontamination between amplicon-sensitive
batches. Cleaning ≠ decontamination.',
       '[{"label": "Flex cleaning and maintenance", "url": "https://docs.opentrons.com/flex/maintenance/cleaning/", "kind": "vendor"}]'::jsonb, true, true, 3, NULL,
       'standard', 290, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-47');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-47'), 0, 'Cleans all listed surfaces without touching anything internal', true),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), 10, 'Uses an approved agent; rejects acetone if offered', true),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), 20, 'Follows wipe → distilled water rinse → air dry, especially after bleach', false),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), 30, 'Cleans pipette and gripper exteriors only; does not disassemble', false),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), 40, 'Inspects gripper paddles for wear and reports or replaces them', false),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), 50, 'Distinguishes routine cleaning from DNA decontamination', false);

-- FLX-49  Nucleic acid decontamination of the deck
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'FLX-49', 'Nucleic acid decontamination of the deck', 'Runs and documents DNA decontamination between amplicon-sensitive batches.',
       'Different from routine cleaning. Cleaning removes dirt; this destroys residual DNA.

**Why it matters here specifically.** We run full-gene 16S amplicon prep on Batman. Amplicon
is present at astronomically high copy number compared to a low-biomass template. A single
aerosolised droplet of yesterday''s PCR product on the deck can appear in today''s samples as
a real-looking community member. Amplicon contamination is the hardest kind to detect and
the most expensive to discover late.

**Procedure:**
1. Remove all labware and consumables from the deck.
2. Wipe all deck surfaces and slots with **10% bleach**, and leave the full contact time —
   bleach needs minutes to destroy DNA, not a swipe.
3. Rinse with distilled water and wipe dry. Bleach residue corrodes and interferes with
   the gripper.
4. If a HEPA/UV module is fitted, run a **UV decontamination cycle** — with nobody exposed.
   Understand UV does **not** penetrate under labware or into shadowed slots, so it
   supplements the bleach step, it does not replace it.
5. **Document it** — date, who, which batch it preceded.

**Run this between amplicon-sensitive batches, not on a calendar.** The trigger is the
workflow, not the week.',
       '[]'::jsonb, true, true, 12, NULL,
       'critical', 300, true
FROM public.skill_categories c WHERE c.code = 'FLX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='FLX-49');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-49'), 0, 'Clears the deck completely before starting', true),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), 10, 'Uses 10% bleach and honours the full contact time', true),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), 20, 'Rinses with distilled water and dries', false),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), 30, 'Runs a UV cycle where fitted, with nobody exposed', false),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), 40, 'States that UV does not penetrate under labware', false),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), 50, 'Records the decontamination against the batch it preceded', false),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), 60, 'Explains why amplicon contamination is a special category of risk', false);

-- OT2-01  OT-2 orientation and how it differs from the Flex
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'OT2-01', 'OT-2 orientation and how it differs from the Flex', 'Names the differences that actually cause errors for Flex-trained users.',
       'Alfred and Ethan are OT-2s. They are **not small Flexes**, and every difference below is a
place a Flex-trained person makes a mistake.

| | OT-2 | Flex |
|---|---|---|
| Deck | **11 numbered slots** (1–11) + fixed trash in 12 | A1–D3 grid + staging area |
| Calibration | **Manual deck calibration** — you jog to cross-hairs | Automated probe routine |
| Plate movement | **By hand** — there is no gripper | Gripper |
| Magnets | **Active Magnetic Module** — engages in software | Passive Magnetic Block + gripper |
| Pipettes | GEN2 P20 / P300 / P1000 | Flex 1-ch, 8-ch, 96-ch |
| Error recovery | **None** — an error ends the run | Recovery mode |
| Thermocycler | GEN1 supported | GEN2 only |

**The two that cost the most:**
- **No error recovery.** If a Flex hits a problem you get options. If an OT-2 hits one, the
  run is over. This is why dry-run validation matters *more* on the OT-2, not less.
- **Manual deck calibration** is the OT-2''s largest single source of crashes and
  mis-aspirations, and it has a dependency order: deck → tip length → pipette offset.

**What ours are used for:** Alfred does clean-and-concentrate; Ethan does dilutions,
normalisation and equimolar library pooling.',
       '[]'::jsonb, true, true, NULL, NULL,
       'critical', 310, true
FROM public.skill_categories c WHERE c.code = 'OT2'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='OT2-01');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='OT2-01'), 0, 'States the deck slot numbering and that trash is fixed in slot 12', true),
  ((SELECT id FROM public.skills WHERE code='OT2-01'), 10, 'Explains that there is no gripper and plates move by hand', true),
  ((SELECT id FROM public.skills WHERE code='OT2-01'), 20, 'Contrasts the active Magnetic Module with the Flex''s passive block', false),
  ((SELECT id FROM public.skills WHERE code='OT2-01'), 30, 'States that the OT-2 has no error recovery mode and what that implies', false),
  ((SELECT id FROM public.skills WHERE code='OT2-01'), 40, 'Gives the calibration dependency order: deck → tip length → pipette offset', false),
  ((SELECT id FROM public.skills WHERE code='OT2-01'), 50, 'Knows Alfred''s and Ethan''s respective roles', false);

-- OT2-04  OT-2 deck calibration
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'OT2-04', 'OT-2 deck calibration', 'Runs deck calibration accurately; understands the dependency chain.',
       '**The OT-2''s most consequential routine.** Everything else sits on top of it, and a bad
deck calibration produces subtly wrong volumes across every protocol rather than an obvious
crash.

**Order matters — do not skip or reorder:**
1. **Deck calibration** — establishes the deck''s position relative to the gantry. Uses the
   calibration block or a tip, jogging to three cross-hair points on the deck.
2. **Tip length calibration** — per pipette, per tip-rack type. Different tips are
   different lengths; the robot must know.
3. **Pipette offset calibration** — per pipette, per mount.

Changing anything upstream invalidates everything downstream. Reattach a pipette and you
redo tip length and offset. Move the robot and you redo all three.

**Jogging accurately:** get your eye level with the deck. Use the smallest increment for
the final approach. The tip should just touch — you are looking for the point where it
makes contact without deflecting.

**When to redo:** after moving the robot, after any pipette reattachment, after a crash,
if volumes drift, or annually as routine.',
       '[]'::jsonb, true, true, 12, NULL,
       'critical', 320, true
FROM public.skill_categories c WHERE c.code = 'OT2'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='OT2-04');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='OT2-04'), 0, 'States the three-stage dependency order correctly', true),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), 10, 'Runs deck calibration to all three cross-hair points', true),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), 20, 'Views the tip at eye level and uses the finest increment for final contact', false),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), 30, 'Achieves just-touching contact without deflecting the tip', false),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), 40, 'Runs tip length and pipette offset calibration afterwards', false),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), 50, 'Lists the situations that require recalibration', false);

-- OT2-10  Running and monitoring an OT-2 protocol
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'OT2-10', 'Running and monitoring an OT-2 protocol', 'Runs from the App and understands that a failure ends the run.',
       '**There is no error recovery on the OT-2.** If the run hits a problem, it stops and the run
is over. You cannot retry a step, swap tips, or refill a reservoir and continue.

Everything else follows from that:

**Dry-run first, always,** for any protocol that is new or has changed. Water only, real
labware, real deck. This is where you catch collisions, wrong offsets and reagent volume
errors — and on the OT-2 it is the *only* place you get to catch them cheaply.

**Over-provision reagents.** On a Flex, running a reservoir dry is a recoverable annoyance.
Here it ends the run and you lose the plate. Calculate dead volume plus generous overage.

**Watch the run**, particularly the first few steps and the first plate move. Most failures
declare themselves early.

**If it does fail:** record which step it stopped at, what state each plate is in, and what
the chemistry can tolerate. Then decide whether to salvage or restart. Write it down before
you touch anything — you will not remember accurately in ten minutes.',
       '[]'::jsonb, true, true, NULL, NULL,
       'high', 330, true
FROM public.skill_categories c WHERE c.code = 'OT2'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='OT2-10');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='OT2-10'), 0, 'Runs a water-only dry run before any new or modified protocol', true),
  ((SELECT id FROM public.skills WHERE code='OT2-10'), 10, 'Calculates reagent volumes with dead volume and generous overage', true),
  ((SELECT id FROM public.skills WHERE code='OT2-10'), 20, 'Observes the opening steps of the run rather than walking away', false),
  ((SELECT id FROM public.skills WHERE code='OT2-10'), 30, 'States that a failure ends the run and cannot be recovered', false),
  ((SELECT id FROM public.skills WHERE code='OT2-10'), 40, 'On a failure, records step, plate states and chemistry status before acting', false);

-- QC-02  Denovix DS-11 microvolume operation
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'QC-02', 'Denovix DS-11 microvolume operation', 'Loads and reads 1 µL cleanly, blanks correctly, wipes both surfaces every time.',
       'The second most-booked instrument in the lab. Everyone calls it "the nanodrop"; it is a
DeNovix DS-11 and the technique is the same idea.

**Blank with the matching buffer.** Not water — the *same* buffer your sample is eluted in.
A TE-eluted sample blanked against water gives you a wrong A260/230 and you will chase a
purity problem that does not exist.

**Loading.** Pipette 1 µL onto the centre of the lower pedestal. Look at it — you want a
clean bead, not a spread film and not a bubble. Lower the arm gently; the liquid should
form a column between the two surfaces.

**Wipe both surfaces** — upper and lower — with a **dry lab wipe** immediately after every
single reading, including the blank. This is the number one cause of bad data on this
instrument. Residue from the previous sample carries directly into the next reading.

**Read.** Take two or three replicate readings of the same sample and see whether they
agree. If they scatter, you have a loading or cleaning problem, not a sample problem.

**Cleaning:** dH₂O only for routine cleaning. **Not detergents, not alcohol.**

Remember what this measurement is and isn''t: it gives you a good purity picture and a rough
concentration. For anything going into a library, **the Qubit governs** (QC-09, QC-10).',
       '[{"label": "DeNovix DS-11 user guide (PDF)", "url": "https://www.denovix.com/pdf/ds-11-series-user-guide.pdf", "kind": "vendor"}]'::jsonb, true, true, 6, NULL,
       'high', 340, true
FROM public.skill_categories c WHERE c.code = 'QC'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='QC-02');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='QC-02'), 0, 'Blanks with the same buffer the sample is eluted in', true),
  ((SELECT id FROM public.skills WHERE code='QC-02'), 10, 'Loads 1 µL as a clean bead on the pedestal centre, no bubbles', true),
  ((SELECT id FROM public.skills WHERE code='QC-02'), 20, 'Wipes both upper and lower surfaces with a dry wipe after every reading', false),
  ((SELECT id FROM public.skills WHERE code='QC-02'), 30, 'Takes replicate readings and checks they agree', false),
  ((SELECT id FROM public.skills WHERE code='QC-02'), 40, 'Uses dH₂O only for cleaning; rejects alcohol or detergent', false),
  ((SELECT id FROM public.skills WHERE code='QC-02'), 50, 'States that fluorometry governs for library input', false);

-- QC-03  DS-11 purity ratios and interpretation
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'QC-03', 'DS-11 purity ratios and interpretation', 'Reads A260/280 and A260/230 and correctly attributes a bad ratio to its cause.',
       '**Pick the right sample type** first — dsDNA, ssDNA or RNA. They use different conversion
factors (50, 33 and 40 ng·cm/µL). Reading RNA as dsDNA gives you a wrong concentration.

**A260/280** — protein contamination.
- ~1.8 is clean dsDNA. ~2.0 is clean RNA.
- Low (<1.7) means protein or phenol carryover.

**A260/230** — salt, chaotrope and organic contamination. This is the one that matters most
for us.
- 1.8–2.2 is clean.
- **Low A260/230 after a MagBead extraction almost always means residual guanidinium or
  ethanol** — an incomplete wash or insufficient drying. It is a direct readout of AEX-04.
- It predicts downstream inhibition: low A260/230 samples inhibit PCR and foul nanopore
  pores.

**Before you blame the sample, rule out the instrument:**
1. Dirty pedestal surfaces (did you wipe after the last reading?)
2. Wrong blank buffer
3. Sample too dilute — ratios become meaningless below roughly 10 ng/µL
4. Bubble or poor column formation

**The full spectrum tells you more than the numbers.** Look at the curve shape. A peak
climbing at 230 is chaotrope. A shoulder near 270 is phenol. A rising baseline across the
whole spectrum is particulates or turbidity — spin the sample and re-read.

Note the **baseline correction setting (typically 750 nm) persists** to subsequent
measurements. Check it is what you expect.',
       '[{"label": "DeNovix DS-11 user guide (PDF)", "url": "https://www.denovix.com/pdf/ds-11-series-user-guide.pdf", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'high', 350, true
FROM public.skill_categories c WHERE c.code = 'QC'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='QC-03');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='QC-03'), 0, 'Selects the correct sample type and states its conversion factor', true),
  ((SELECT id FROM public.skills WHERE code='QC-03'), 10, 'Interprets A260/280 and A260/230 against the right target ranges', true),
  ((SELECT id FROM public.skills WHERE code='QC-03'), 20, 'Given a low A260/230 on a MagBead extract, names residual chaotrope or ethanol as the likely cause', false),
  ((SELECT id FROM public.skills WHERE code='QC-03'), 30, 'Rules out dirty surfaces, wrong blank and low concentration before blaming the sample', false),
  ((SELECT id FROM public.skills WHERE code='QC-03'), 40, 'Reads the spectrum shape and identifies a 230 nm or 270 nm signature', false),
  ((SELECT id FROM public.skills WHERE code='QC-03'), 50, 'Checks the baseline correction setting', false);

-- QC-09  Qubit fluorometry
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'QC-09', 'Qubit fluorometry', 'Runs a fresh standard curve per assay and selects the right assay for the range.',
       'The Qubit governs for library input. The lab''s own equipment note says it plainly: more
accurate than the Denovix.

**Why it differs from the DS-11.** Absorbance at 260 nm counts *everything* that absorbs —
RNA, free nucleotides, degraded fragments, protein. Qubit uses a dye that fluoresces only
when bound to **double-stranded DNA specifically**. So a sample can read 80 ng/µL on the
Denovix and 25 ng/µL on the Qubit, and the Qubit is the one that tells you how much usable
template you actually have. That gap is the point of QC-10.

**Working solution.** Prepare fresh at the kit''s dye:buffer ratio. Make enough for all
samples **plus both standards** plus overage. Protect from light. Discard leftovers.

**Standards.** Run **both standards, fresh, every assay.** Not yesterday''s curve. This is
the step people skip and it invalidates everything.

**Assay choice by expected concentration** — dsDNA HS for low-input and libraries, BR for
extracts. Reading a sample outside the assay range gives a number that looks fine and is
wrong.

**Technique.** Thin-walled clear 0.5 mL tubes. Sample plus working solution to the total
volume the kit specifies. Vortex briefly, **avoid bubbles** — a bubble in the read path is
a bad reading. Incubate the full 2 minutes at room temperature before reading.',
       '[]'::jsonb, true, true, 6, NULL,
       'high', 360, true
FROM public.skill_categories c WHERE c.code = 'QC'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='QC-09');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='QC-09'), 0, 'Prepares working solution fresh with enough for samples, standards and overage', true),
  ((SELECT id FROM public.skills WHERE code='QC-09'), 10, 'Runs both standards fresh for this assay, not a stored curve', true),
  ((SELECT id FROM public.skills WHERE code='QC-09'), 20, 'Selects HS vs BR appropriately for the expected concentration', false),
  ((SELECT id FROM public.skills WHERE code='QC-09'), 30, 'Uses thin-walled clear tubes and the correct total volume', false),
  ((SELECT id FROM public.skills WHERE code='QC-09'), 40, 'Mixes without introducing bubbles', false),
  ((SELECT id FROM public.skills WHERE code='QC-09'), 50, 'Waits the full incubation before reading', false),
  ((SELECT id FROM public.skills WHERE code='QC-09'), 60, 'Explains why Qubit and Denovix disagree and which governs for library input', false);

-- QC-14  TapeStation 2200
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'QC-14', 'TapeStation 2200', 'Runs the right assay, interprets DIN/RIN, and extracts average fragment size.',
       'The lab''s only working sizing platform — the Bioanalyzer 2100 is in maintenance. That makes
this the sole source of the average fragment size that QC-20''s molarity conversion depends
on, which makes it load-bearing for every pooled sequencing run.

**Assay choice:** genomic for gDNA integrity, D1000 or HS D1000 for libraries and amplicons,
RNA assays for RIN. Match the assay to your expected size range and concentration — outside
the range the sizing is unreliable.

**Preparation is where it goes wrong.** Sample and buffer must be mixed thoroughly and
**spun down**. Vortex at the speed the protocol specifies, then centrifuge — bubbles and
unmixed sample are the top two causes of failed lanes. Let reagents come to room
temperature.

**Loading.** Load the ScreenTape correctly oriented. Handle it by the edges. Check the
needle condition periodically; a worn needle gives erratic results.

**Interpreting:**
- **DIN** (DNA Integrity Number) — 1–10, how intact your gDNA is. For nanopore, low DIN
  means short reads no matter how good the prep is.
- **RIN** — the RNA equivalent. Relevant to the JGI RNA workstream.
- **Smear analysis** — this is what gives you **average fragment size** across a defined
  region. That number goes straight into the ng/µL → nM conversion.
- Look for the shape, not just the number: primer-dimer peaks at the low end, a tight peak
  where you expect your amplicon, a broad smear meaning degradation or over-fragmentation.',
       '[]'::jsonb, true, true, 12, NULL,
       'high', 370, true
FROM public.skill_categories c WHERE c.code = 'QC'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='QC-14');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='QC-14'), 0, 'Selects the correct assay for the sample type and expected size range', true),
  ((SELECT id FROM public.skills WHERE code='QC-14'), 10, 'Brings reagents to room temperature, mixes at specified speed, and spins down', true),
  ((SELECT id FROM public.skills WHERE code='QC-14'), 20, 'Loads ScreenTape correctly and handles it by the edges', false),
  ((SELECT id FROM public.skills WHERE code='QC-14'), 30, 'Runs smear analysis to extract average fragment size over the correct region', false),
  ((SELECT id FROM public.skills WHERE code='QC-14'), 40, 'Interprets DIN or RIN and states what it implies for the downstream application', false),
  ((SELECT id FROM public.skills WHERE code='QC-14'), 50, 'Identifies primer-dimer, a clean amplicon peak, and degradation from the trace shape', false);

-- QC-17  SPRI / AMPure bead cleanup and ratio control
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'QC-17', 'SPRI / AMPure bead cleanup and ratio control', 'Executes a cleanup at a specified ratio reproducibly, with no bead carryover.',
       'Every library prep depends on this, and it is where yield quietly disappears.

**The ratio is the whole thing.** Bead volume ÷ sample volume determines the size cutoff.
Higher ratio keeps smaller fragments; lower ratio keeps only larger ones. Our Zymo 96
library prep uses defined ratios at defined steps — follow them exactly. Pipette the bead
volume accurately; "about right" changes your size distribution.

**Sequence:**
1. Beads **fully resuspended and at room temperature** before use
2. Mix sample and beads thoroughly; incubate off the magnet for the full binding time
3. On the magnet until the supernatant is **completely clear**
4. Remove supernatant without touching the pellet
5. Two washes with **fresh 80% ethanol** (BEN-12), plate stays on the magnet, add down the
   opposite wall, do not resuspend
6. Air-dry only until the pellet loses its sheen — **not** cracked
7. Elute off the magnet, resuspend fully, full incubation
8. Return to magnet, transfer the eluate **without carrying beads**

**Bead carryover into the eluate** is the failure people miss. Carried-over beads interfere
with quantification and with downstream enzymatic steps. If you see any cloudiness in your
eluate, put it back on the magnet and re-transfer.

**Over-drying** is the other one. A cracked pellet will not fully re-elute, and you lose
yield in a way that looks like a bad extraction rather than a bad cleanup.',
       '[]'::jsonb, true, true, 6, NULL,
       'critical', 380, true
FROM public.skill_categories c WHERE c.code = 'QC'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='QC-17');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='QC-17'), 0, 'Pipettes the bead volume accurately and states what the ratio controls', true),
  ((SELECT id FROM public.skills WHERE code='QC-17'), 10, 'Resuspends beads to homogeneity at room temperature before use', true),
  ((SELECT id FROM public.skills WHERE code='QC-17'), 20, 'Waits for a completely clear supernatant before aspirating', false),
  ((SELECT id FROM public.skills WHERE code='QC-17'), 30, 'Uses fresh 80% ethanol, added without disturbing the pellet, plate on magnet', false),
  ((SELECT id FROM public.skills WHERE code='QC-17'), 40, 'Stops drying at loss of sheen, not at cracking', false),
  ((SELECT id FROM public.skills WHERE code='QC-17'), 50, 'Elutes off-magnet with full resuspension and full incubation', false),
  ((SELECT id FROM public.skills WHERE code='QC-17'), 60, 'Transfers a clear eluate with no visible bead carryover', false);

-- QC-20  ng/µL to nM molarity conversion
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'QC-20', 'ng/µL to nM molarity conversion', 'Converts correctly using measured average fragment size.',
       '**The single most common source of pooling error**, and it is pure arithmetic.

You cannot pool equimolar amounts using ng/µL. Mass concentration says nothing about how
many *molecules* you have — a 1.5 kb full-length 16S amplicon at 10 ng/µL contains far
fewer molecules than a 300 bp fragment at 10 ng/µL. Sequencers count molecules.

**The conversion:**

```
nM = (ng/µL × 10^6) / (660 g/mol/bp × average fragment length in bp)
```

660 g/mol/bp is the average molecular weight of a base pair in dsDNA.

**Three inputs, three ways to get it wrong:**
1. **Concentration** — must be **fluorometric** (Qubit, QC-09), not absorbance. The Denovix
   over-reads because it counts RNA and free nucleotides as DNA.
2. **Average fragment length** — must be **measured on the TapeStation** (QC-14) via smear
   analysis over the correct region. Not the expected amplicon size, not a guess. If your
   prep has a primer-dimer shoulder, the true average is lower than you think.
3. **The arithmetic itself** — check your order of magnitude. A full-length 16S library at
   ~20 ng/µL and ~1600 bp should come out around 19 nM. If you get 1900 or 0.19, you have
   a factor-of-100 error.

Do the calculation, write it in the notebook, and have someone check it the first few times.',
       '[]'::jsonb, true, true, 12, NULL,
       'critical', 390, true
FROM public.skill_categories c WHERE c.code = 'QC'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='QC-20');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='QC-20'), 0, 'States the formula and what the 660 constant represents', true),
  ((SELECT id FROM public.skills WHERE code='QC-20'), 10, 'Uses a fluorometric concentration, not an absorbance reading, and says why', true),
  ((SELECT id FROM public.skills WHERE code='QC-20'), 20, 'Uses a TapeStation-measured average size, not the expected amplicon size', false),
  ((SELECT id FROM public.skills WHERE code='QC-20'), 30, 'Correctly computes nM for a worked example', false),
  ((SELECT id FROM public.skills WHERE code='QC-20'), 40, 'Sanity-checks the order of magnitude of the answer', false),
  ((SELECT id FROM public.skills WHERE code='QC-20'), 50, 'Records the calculation and its inputs in the notebook', false);

-- PLT-01  Synergy HTX with Take3 Trio plate
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'PLT-01', 'Synergy HTX with Take3 Trio plate', 'Runs 48-sample microvolume DNA QC and cleans all three surfaces between reads.',
       'The lab''s fast path for assessing a whole extraction batch — up to **48 samples at 2 µL**
each. Used, for example, to assess a re-extraction plate before committing to library prep.

**It is the same chemistry as the Denovix**, just parallelised: absorbance at 260/280/230
through a fixed short pathlength. So everything in QC-03 about purity-ratio interpretation
applies unchanged, and so do the same artifacts.

**Procedure:**
1. Clean all three Take3 surfaces with dH₂O and a lint-free wipe, and dry
2. Load 2 µL per spot. Look at every drop before closing — a missed or spread drop reads
   as garbage and you will not know which well it was
3. Blank with the **matching elution buffer**, on the plate, in the same way
4. Close the lid, select the correct Gen5 protocol and the Take3 plate definition
5. Read
6. **Clean all three surfaces again immediately** — carryover is the main failure mode, the
   same as on the Denovix pedestal

**Know its limits.** Short pathlength means **lower sensitivity at low concentration** than
the Denovix pedestal or a cuvette. Below roughly 10–15 ng/µL the numbers get unreliable, and
purity ratios become meaningless earlier than that. When the batch is low-yield, fall back
to the Qubit.

**Export with sample IDs attached.** A Gen5 export that is an unlabelled 48-cell grid is
almost useless a week later. Map it to your plate map at the time of reading.',
       '[]'::jsonb, true, true, 6, NULL,
       'standard', 400, true
FROM public.skill_categories c WHERE c.code = 'PLT'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='PLT-01');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='PLT-01'), 0, 'Cleans all three Take3 surfaces before and immediately after reading', true),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), 10, 'Loads 2 µL per spot and visually checks every drop before closing', true),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), 20, 'Blanks with the matching elution buffer on the plate', false),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), 30, 'Selects the correct Gen5 protocol and Take3 plate definition', false),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), 40, 'States the low-concentration limit and falls back to Qubit appropriately', false),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), 50, 'Exports results with sample IDs attached to the plate map', false);

-- SEQ-11  Input DNA QC for nanopore
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SEQ-11', 'Input DNA QC for nanopore', 'Confirms length, quantity and purity against kit spec before starting a prep.',
       '**Skipping this is the leading cause of failed nanopore runs.** ONT say so in their own
documentation, and it remains true. A flow cell costs more than the hour this takes.

Three things, and you need all three — one good number does not rescue the other two.

**Length.** Nanopore read length is capped by the length of the DNA you put in. If your
gDNA is sheared to 3 kb, no prep or basecaller recovers it. Check on the TapeStation
(QC-14) — DIN for gDNA integrity, smear analysis for the size distribution. For LSK114 you
want fragments **>10 kb** to hit the kit''s intent.

**Quantity.** Kit-specific and non-negotiable:
- **SQK-LSK114** — about **1 µg**, or **100–200 fmol** for >10 kb fragments
- **SQK-RBK114** — about **200 ng** gDNA

Measure with the **Qubit** (QC-09), never absorbance. Absorbance over-reads and you will
under-load without knowing.

**Purity.** A260/280 near 1.8 and **A260/230 in 1.8–2.2**. Residual guanidinium, ethanol or
protein fouls pores directly — you will watch your available pore count collapse over the
first hour of the run and there is nothing you can do about it once loaded.

**If any of the three fails, stop.** Clean up (QC-17), re-extract, or re-plan. Proceeding
with marginal input is how a flow cell gets wasted.',
       '[{"label": "ONT SQK-LSK114", "url": "https://nanoporetech.com/document/genomic-dna-by-ligation-sqk-lsk114", "kind": "vendor"}, {"label": "ONT SQK-RBK114", "url": "https://nanoporetech.com/document/rapid-sequencing-gdna-barcoding-sqk-rbk114", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'critical', 410, true
FROM public.skill_categories c WHERE c.code = 'SEQ'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SEQ-11');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), 0, 'Checks length on the TapeStation and states the size distribution', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), 10, 'Quantifies with Qubit, not absorbance, and states the kit''s input requirement', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), 20, 'Checks A260/230 and states what a low value will do to the pores', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), 30, 'Correctly decides go/no-go against all three criteria', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), 40, 'On a marginal sample, chooses cleanup or re-extraction rather than proceeding', false);

-- SEQ-12  Gentle DNA handling for long reads
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SEQ-12', 'Gentle DNA handling for long reads', 'Handles HMW DNA without shearing it.',
       'Long DNA is fragile in a way that short DNA is not. Every mechanical stress shears it, and
shearing is irreversible.

**Never vortex** DNA destined for nanopore. Not briefly, not "gently".

**Flick or invert to mix.** Hold the tube and flick the base sharply with a finger, or
invert slowly several times. Then spin down briefly.

**Wide-bore tips** for anything HMW. A standard tip forces the DNA through a narrow orifice
at speed, which is exactly the shear you are avoiding. If you have no wide-bore tips, cut
the end off a standard tip with a clean blade.

**Pipette slowly.** Both aspirate and dispense. The shear rate scales with flow velocity.

**Minimise handling.** Every transfer costs you length. Design the workflow to have fewer
steps rather than more.

**Avoid repeated freeze-thaw.** Aliquot once; do not cycle the stock.

This applies from the moment of extraction (MEX-11) through to loading, and it is why the
extraction method matters as much as the prep kit.',
       '[{"label": "ONT SQK-LSK114", "url": "https://nanoporetech.com/document/genomic-dna-by-ligation-sqk-lsk114", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'high', 420, true
FROM public.skill_categories c WHERE c.code = 'SEQ'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SEQ-12');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), 0, 'Uses flicking or inversion to mix; does not vortex at any point', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), 10, 'Uses wide-bore tips for HMW DNA, or cuts standard tips', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), 20, 'Pipettes slowly on both aspirate and dispense', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), 30, 'Minimises the number of transfers', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), 40, 'Aliquots to avoid repeated freeze-thaw of the stock', false);

-- SEQ-18  Flow cell platform QC / pore count
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SEQ-18', 'Flow cell platform QC / pore count', 'Runs the flow cell check before every experiment and applies the warranty threshold.',
       '**Run this before every experiment, on every flow cell, without exception.** It takes
minutes and it is the difference between a failed run you can claim for and a failed run
you paid for.

**Procedure.** Insert the flow cell, let it come to temperature, and run the flow cell
check from MinKNOW. It reports the number of pores available in each of the four groups.

**The threshold.** ONT''s warranty for MinION-format flow cells is **≥800 pores**. If the
check comes back below that:
- **Do not load your library.** You will get a poor run and you will have spent the sample.
- **File a warranty claim** with ONT, quoting the flow cell ID and the check result.
- Record it in the flow cell log.

**Interpreting above threshold.** 800 is the warranty floor, not a target. A fresh cell
should be well above it — typically 1200–1600 for a MinION cell. A cell at 850 will work
but will give you proportionally less data, so plan your loading and expectations
accordingly, or use it for a smaller run.

**Track pore count over reuse.** A washed and reused cell (SEQ-26) loses pores each cycle.
Logging the count every time is how you decide when to retire it rather than discovering
mid-run.',
       '[]'::jsonb, true, true, NULL, NULL,
       'critical', 430, true
FROM public.skill_categories c WHERE c.code = 'SEQ'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SEQ-18');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), 0, 'Runs the flow cell check before loading, every time', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), 10, 'States the ≥800 pore warranty threshold for MinION-format cells', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), 20, 'Correctly decides go/no-go and does not load a sub-threshold cell', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), 30, 'Files a warranty claim with the flow cell ID when below threshold', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), 40, 'Records the pore count in the flow cell log against the cell ID', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), 50, 'Adjusts run expectations for a cell that is above threshold but low', false);

-- SEQ-19  Flow cell priming
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SEQ-19', 'Flow cell priming', 'Primes without introducing an air bubble to the array.',
       '**The single most destructive mistake in nanopore work.** An air bubble that reaches the
sensor array **irreversibly destroys pores**. There is no recovery. Slow down for this step.

**Equilibrate.** Take the flow cell out of the fridge and leave it at room temperature for
**20 minutes** before you do anything. Cold flow cells outgas and form bubbles.

**Prepare priming mix:** Flow Cell Flush + **BSA to 0.2 mg/mL** + Flow Cell Tether. Mix
gently, do not vortex.

**The critical step — remove the air bubble first.** Open the priming port. Set a P1000 to
**~200 µL**, insert the tip into the priming port, and **draw back slowly** until you see a
small volume of buffer entering the tip and the bubble under the port is gone. Never draw
back more than 20–30 µL of actual buffer — you will pull buffer off the array.

Only once the bubble is gone:

**Prime:** load **800 µL** of priming mix into the priming port, slowly and steadily.
**Wait 5 minutes.**

Then open the SpotON port and load a further **200 µL** of priming mix through the priming
port, again slowly.

**Then** you are ready for SpotON loading (SEQ-20).

If you see a bubble travelling toward the array at any point, stop and get someone.',
       '[{"label": "ONT SQK-LSK114", "url": "https://nanoporetech.com/document/genomic-dna-by-ligation-sqk-lsk114", "kind": "vendor"}]'::jsonb, true, true, 12, NULL,
       'critical', 440, true
FROM public.skill_categories c WHERE c.code = 'SEQ'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SEQ-19');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), 0, 'Equilibrates the flow cell at room temperature for 20 minutes', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), 10, 'Prepares priming mix with BSA at 0.2 mg/mL, mixed gently', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), 20, 'Draws back at the priming port to remove the bubble before priming', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), 30, 'Draws back no more than 20–30 µL of buffer', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), 40, 'Loads 800 µL slowly, waits the full 5 minutes, then loads 200 µL more', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), 50, 'States that a bubble reaching the array causes irreversible pore damage', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), 60, 'No bubbles observed entering the array at any point', false);

-- SEQ-26  Flow cell wash and reuse (EXP-WSH004)
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'SEQ-26', 'Flow cell wash and reuse (EXP-WSH004)', 'Washes a flow cell correctly so it can be reused, and logs the cycle.',
       'Flow cells are the largest consumable cost in this lab. A correctly washed cell gives
typically 3–6 usable runs. A badly washed one gives none.

**Wash mix must be fresh.** 2 µL Wash Mix + 398 µL Wash Diluent, prepared **on ice**, and
**not stored for more than a day**. Old wash mix does not digest the library and you carry
the previous run''s reads into the next one.

**Keep the flow cell on the device throughout.** Do not remove it to wash it.

**Procedure:**
1. Remove accumulated waste from **waste port 1** with a P1000
2. Load **200 µL** of wash mix through the **priming port**, slowly — take at least
   **5 seconds** over it
3. Incubate **5 minutes**
4. Repeat: remove waste, load another 200 µL, incubate 5 minutes
5. Close the port and **wait 1 hour**
6. Clear the waste

**Then either** load the next library, **or** store: load **500 µL of Storage Buffer** and
keep at **2–8 °C**. **Never store a flow cell with wash mix sitting on the array.**

**When checking for bubbles, never remove more than 20–30 µL** — the same rule as priming.

**Log it.** Flow cell ID, wash number, and the pore count from the next flow cell check.
That log is how you decide when to retire the cell.',
       '[{"label": "ONT Flow Cell Wash Kit EXP-WSH004", "url": "https://nanoporetech.com/document/flow-cell-wash-kit-exp-wsh004", "kind": "vendor"}]'::jsonb, true, true, 6, 'EXP-WSH004',
       'high', 450, true
FROM public.skill_categories c WHERE c.code = 'SEQ'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='SEQ-26');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), 0, 'Prepares wash mix fresh on ice at the correct ratio', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), 10, 'Leaves the flow cell on the device throughout', true),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), 20, 'Removes waste from port 1 before each wash load', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), 30, 'Loads 200 µL slowly over at least 5 seconds, twice, with 5-minute incubations', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), 40, 'Waits the full 1 hour before clearing waste', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), 50, 'Stores with 500 µL Storage Buffer at 2–8 °C, never with wash mix on the array', false),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), 60, 'Records the wash cycle and subsequent pore count in the flow cell log', false);

-- HPG-07  HiPerGator User Training
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'HPG-07', 'HiPerGator User Training', 'Completed UF''s required HiPerGator course and passed the final quiz.',
       '**UF states plainly: "Taking the Course is Required."** It is free, self-paced, and
delivered through UF Professional & Workforce Development on Canvas. Register at
**`go.ufl.edu/hpg-training`**. You must **pass the final quiz**.

Note this is a **Canvas course, not a myTraining item** — there is no EHS-style course code
to look up, so record your completion here.

It covers Research Computing''s role, how to get access, login-server etiquette, SLURM
basics, and — usefully — the common mistakes HiPerGator users make.

**Before you can get an account:** the PI must already have one as group sponsor, and the
group needs at least 1 NCU of compute and 1 BlSU of blue storage allocated. Then you submit
your own account request.

Also know from day one: **HIPAA, FERPA, PII, PHI, ITAR and EAR data must not go on standard
HiPerGator.** Regulated work runs on HiPerGator-RV and you must contact Research Computing
first. Our data is environmental and animal-associated, so this is unlikely to bite — but
if a human-subject project ever starts, this is the rule that governs it.',
       '[{"label": "UF RC HiPerGator training", "url": "https://docs.rc.ufl.edu/training/HiPerGator_training/", "kind": "vendor"}]'::jsonb, true, false, NULL, 'go.ufl.edu/hpg-training',
       'high', 460, true
FROM public.skill_categories c WHERE c.code = 'HPG'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='HPG-07');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='HPG-07'), 0, 'Shows completion of the HiPerGator User Training course including the passed quiz', true),
  ((SELECT id FROM public.skills WHERE code='HPG-07'), 10, 'Knows the lab''s group name and its compute and storage allocations', true),
  ((SELECT id FROM public.skills WHERE code='HPG-07'), 20, 'States that regulated data must not go on standard HiPerGator', false),
  ((SELECT id FROM public.skills WHERE code='HPG-07'), 30, 'Can log in and reach a shell', false);

-- HPG-14  Login-node etiquette
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'HPG-14', 'Login-node etiquette', 'Never runs computational work on a login node; knows the IDE trap.',
       'The rule, in UF''s own words: login nodes are for *"non-computational interactive work and
very short tests of job scripts."* That is all.

**Never run on a login node:** Dorado basecalling, Emu, Kraken2, an assembly, a BLAST, an
alignment, an R model fit, or anything that will take more than a moment. The login node is
shared by everyone at UF. Loading it up slows down hundreds of people, and Research
Computing will kill your process and email you.

**The trap UF specifically calls out: "misusing IDE SSH connections."** VS Code
Remote-SSH silently spawns heavy language servers and file watchers on whatever node it
connects to. Pointed at a login node it is exactly the load pattern that gets you
throttled. Use UF''s documented **VS Code Remote Tunnel** workflow instead.

**What to do instead:**
- Batch work → `sbatch` (HPG-30)
- Interactive testing → `srun ... --pty bash -i`, or the `hpg-dev` partition (12 h max)
- RStudio → through **Open OnDemand** with an explicit resource request, not R on the login
  node. Someone in this lab already hit this: *"testing JSDM model with interactive R
  studio on hipergator. will need to switch to batch submit for future."*
- Jupyter → `jhub.rc.ufl.edu`, understanding it is a job with a resource allocation

File transfers (`rsync`, `cp`, `mv`) **are** permitted from login servers.',
       '[{"label": "UF RC policies", "url": "https://docs.rc.ufl.edu/quickstart/policies_procedures/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'critical', 470, true
FROM public.skill_categories c WHERE c.code = 'HPG'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='HPG-14');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='HPG-14'), 0, 'States the login-node rule in their own words', true),
  ((SELECT id FROM public.skills WHERE code='HPG-14'), 10, 'Given examples, correctly sorts them into login-node-ok vs must-be-a-job', true),
  ((SELECT id FROM public.skills WHERE code='HPG-14'), 20, 'Knows the VS Code Remote-SSH trap and the Remote Tunnel alternative', false),
  ((SELECT id FROM public.skills WHERE code='HPG-14'), 30, 'Launches an interactive session with srun or OOD instead of running on the login node', false),
  ((SELECT id FROM public.skills WHERE code='HPG-14'), 40, 'Knows file transfers are permitted from login servers', false);

-- HPG-22  Filesystems: /home vs /blue vs /orange
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'HPG-22', 'Filesystems: /home vs /blue vs /orange', 'Puts data in the right place and knows what is and isn''t backed up.',
       'Getting this wrong loses data or grinds jobs to a halt. Three filesystems, three purposes.

**`/home`** — **40 GB per user**. Config, shell setup, scripts, documents. Has **daily
snapshots kept about a week** at `~/.snapshot/`, which is the closest thing to a backup you
get for free. UF: *"Do not use /home job input and output (reading or writing files)."*

**`/blue`** — the group''s high-performance parallel filesystem, investment-based quota.
UF: *"the primary location that should be used for all files read or written during job
execution."* **All computational work reads and writes here.** Your data, your conda envs,
your container images.

⚠️ **`/blue` is NOT backed up** unless backup was separately purchased. This is the single
most important sentence on this page. Treat it as fast scratch that happens to be large.

**`/orange`** — group archival / near-line storage. For inactive data and gentle sequential
access. **Cannot take intensive concurrent job I/O** — do not run jobs against it. Also
**not backed up by default**.

**Two gotchas:**
- `ls /blue` will not show your group directory. It mounts on demand — `cd /blue/<group>`
  directly.
- Quotas: `module load ufrc`, then `blue_quota`, `home_quota`, `orange_quota`. Use `ncdu`
  to find what is eating space. A "No Space Left" error names a path — read it to work out
  *which* filesystem is full.

**Backup rule of three.** Every dataset needs at least two independent copies. Raw
sequencing data needs an off-HiPerGator copy plus, eventually, an archive submission.',
       '[{"label": "UF RC practical storage", "url": "https://docs.rc.ufl.edu/quickstart/practical_storage/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'critical', 480, true
FROM public.skill_categories c WHERE c.code = 'HPG'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='HPG-22');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='HPG-22'), 0, 'States the purpose and quota of each of /home, /blue and /orange', true),
  ((SELECT id FROM public.skills WHERE code='HPG-22'), 10, 'States that /blue and /orange are not backed up by default', true),
  ((SELECT id FROM public.skills WHERE code='HPG-22'), 20, 'Runs jobs that read and write from /blue, not /home or /orange', false),
  ((SELECT id FROM public.skills WHERE code='HPG-22'), 30, 'Checks quota with blue_quota / home_quota and finds large directories with ncdu', false),
  ((SELECT id FROM public.skills WHERE code='HPG-22'), 40, 'Knows /blue mounts on demand and cd''s directly', false),
  ((SELECT id FROM public.skills WHERE code='HPG-22'), 50, 'Can say where the second independent copy of their raw data lives', false);

-- HPG-30  Writing a SLURM job script
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'HPG-30', 'Writing a SLURM job script', 'Writes a complete, correct sbatch script and submits it.',
       'The unit of work on HiPerGator. Get the header right and most other things follow.

```bash
#!/bin/bash
#SBATCH --job-name=emu_run1
#SBATCH --account=<group>
#SBATCH --qos=<group>              # or <group>-b for burst
#SBATCH --partition=hpg-default    # bigmem / gpu / hpg-dev as needed
#SBATCH --cpus-per-task=8
#SBATCH --mem=32gb
#SBATCH --time=08:00:00
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err
#SBATCH --mail-type=END,FAIL
#SBATCH --mail-user=you@ufl.edu

module load conda
conda activate /blue/<group>/<user>/conda/envs/emu
cd /blue/<group>/<user>/project
emu abundance ...
```

**Points that matter:**
- `--account` and `--qos` are your group''s, not your username
- **Everything reads and writes from `/blue`** (HPG-22)
- Ask for what you need. Over-requesting burns the group''s allocation and lengthens your
  own queue time (HPG-40)
- `--time` too short kills the job at the wall; too long delays scheduling. Estimate, then
  refine from `seff`
- If `module` is not found in a scripted context, `source /etc/profile.d/modules.sh` first
- Make the `logs/` directory before you submit, or the job fails instantly with no output

**Partitions:** `hpg-default`/`hpg2-compute` general CPU · `bigmem` for assembly and
Kraken2 database loading · `hpg-dev` interactive testing, 12 h max · `gpu` for Dorado ·
`hwgui` for accelerated GUI, 4 days.

**Submit** with `sbatch script.sh`. Check with `squeue -u $USER`.',
       '[{"label": "UF RC SLURM", "url": "https://docs.rc.ufl.edu/scheduler/", "kind": "vendor"}, {"label": "UF RC partition limits", "url": "https://docs.rc.ufl.edu/scheduler/partition_limits/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'high', 490, true
FROM public.skill_categories c WHERE c.code = 'HPG'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='HPG-30');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='HPG-30'), 0, 'Writes a script with all required SBATCH directives', true),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), 10, 'Uses the correct account and QOS for the group', true),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), 20, 'Selects an appropriate partition and justifies it', false),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), 30, 'Paths point at /blue, not /home', false),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), 40, 'Creates the log directory before submitting', false),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), 50, 'Submits with sbatch and confirms the job is queued with squeue', false);

-- HPG-40  seff and right-sizing jobs
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'HPG-40', 'seff and right-sizing jobs', 'Uses seff to adjust resource requests; understands the cost of over-requesting.',
       'UF names over-requesting resources as one of the top mistakes users make. It is worth
understanding *why*, because the intuition ("ask for lots, be safe") is exactly backwards.

**What over-requesting actually costs:**
1. It **burns the group''s NCU allocation** — you are billed for what you reserve, not what
   you use. That is shared money and it is finite.
2. It **lengthens your own queue time**. A job asking for 32 cores and 200 GB waits for a
   node that can satisfy it. The same job asking for 4 cores and 16 GB starts far sooner.
3. It **starves your labmates**, who are drawing on the same allocation.

**The tool.** After a job finishes:

```
seff <jobid>
```

It reports CPU efficiency, peak memory used vs requested, and wall time used vs requested.
The job-completion email includes a memory estimate too.

**Then act on it.** The competent version of this skill sounds like: *"I requested 32
cores, `seff` showed 4% CPU efficiency, I''m dropping to 4."*

**Threads ≠ speed.** UF''s warning: *"applications often require specific configurations to
utilize multiple cores effectively."* Asking for 16 cores does nothing if the tool is
single-threaded, or if you didn''t actually pass `-t 16` to it. Check both.

**Right-size per pipeline, then reuse.** Kraken2 is memory-bound by database loading.
Dorado is GPU-bound. Emu is comparatively light. Learn each one''s shape once and encode it
in your job scripts.',
       '[{"label": "UF RC SLURM commands", "url": "https://docs.rc.ufl.edu/scheduler/slurm_commands/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'high', 500, true
FROM public.skill_categories c WHERE c.code = 'HPG'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='HPG-40');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='HPG-40'), 0, 'Runs seff on a completed job and reads CPU efficiency and peak memory', true),
  ((SELECT id FROM public.skills WHERE code='HPG-40'), 10, 'Adjusts the next submission''s request based on what seff reported', true),
  ((SELECT id FROM public.skills WHERE code='HPG-40'), 20, 'States the three costs of over-requesting', false),
  ((SELECT id FROM public.skills WHERE code='HPG-40'), 30, 'Checks that the tool was actually given the thread count requested', false),
  ((SELECT id FROM public.skills WHERE code='HPG-40'), 40, 'Can describe the resource shape of at least one pipeline they run', false);

-- HPG-56  Data transfer: rsync and Globus
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'HPG-56', 'Data transfer: rsync and Globus', 'Moves sequencing data reliably and verifies integrity.',
       'Nanopore runs produce a lot of data and it has to move from the sequencing laptop to
`/blue` intact. "It looked like it copied" is not verification.

**`rsync` for most things:**
```
rsync -avP --partial source/ user@hpg.rc.ufl.edu:/blue/<group>/<user>/dest/
```
- `-a` archive, `-v` verbose, `-P` progress + resume partial transfers
- **Trailing slash matters**: `source/` copies the *contents*; `source` copies the
  *directory*. This trips everyone up once.
- `--dry-run` first when you are not sure
- `--checksum` when you need certainty over speed

**Globus for large transfers.** UF calls it *"optimal for large files"* and advises trying
**"Globus first"** for anything in the hundreds of MB to GB range — which is every nanopore
run. Set up a collection, install Globus Connect Personal on the sequencing laptop, and let
it manage retries. It survives dropped connections in a way scp does not.

**Avoid FileZilla.** UF states explicitly that it *"does not work well with the MFA setup
on HiPerGator."* Use Cyberduck, WinSCP, BitVise or MobaXterm instead.

**Verify, then protect.** On arrival: run `md5sum` (or compare checksums generated at
source), file it into `/blue/<group>/.../00_raw/`, **set it read-only**, and log it against
the sample manifest. Only then delete the local copy.',
       '[{"label": "UF RC data transfer", "url": "https://docs.rc.ufl.edu/data_transfer/overview/", "kind": "vendor"}]'::jsonb, true, true, NULL, NULL,
       'high', 510, true
FROM public.skill_categories c WHERE c.code = 'HPG'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='HPG-56');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='HPG-56'), 0, 'Uses rsync -avP correctly and explains the trailing-slash behaviour', true),
  ((SELECT id FROM public.skills WHERE code='HPG-56'), 10, 'Uses Globus for a multi-GB transfer rather than scp', true),
  ((SELECT id FROM public.skills WHERE code='HPG-56'), 20, 'Does not use FileZilla, and knows why', false),
  ((SELECT id FROM public.skills WHERE code='HPG-56'), 30, 'Verifies checksums on arrival before deleting the source', false),
  ((SELECT id FROM public.skills WHERE code='HPG-56'), 40, 'Files raw data into 00_raw/, sets it read-only, and logs it in the manifest', false);

-- AEX-01  Magnetic-bead extraction theory
INSERT INTO public.skills
  (category_id, code, name, summary, instructions_md, reading_refs, requires_reading,
   requires_practical, recert_months, external_ref, risk_level, sort_order, active)
SELECT c.id, 'AEX-01', 'Magnetic-bead extraction theory', 'Explains lyse-bind-wash-dry-elute and predicts each failure mode''s effect.',
       'Understand the chemistry before you run the robot. When a plate comes back with poor yield,
this model is how you work out which step failed.

**Lyse** — break cells open. Mechanical (bead beating, BEN-21) plus chemical (a chaotropic
lysis buffer, usually guanidinium-based). Incomplete lysis biases your community toward
easy-to-lyse organisms — Gram-negatives over Gram-positives.

**Bind** — the chaotrope disrupts the water shell around the DNA and around the bead
surface, so DNA adsorbs to the silica-coated magnetic beads. Needs the right salt and
alcohol concentration; needs mixing; needs time.

**Wash** — ethanolic washes remove protein, salt and chaotrope while the DNA stays bound.
Ethanol concentration is critical: too weak and DNA elutes off the beads and is lost
(BEN-12).

**Dry** — residual ethanol must go, because it inhibits every downstream enzyme. But
over-drying cracks the pellet and it will not fully re-elute.

**Elute** — a low-salt buffer (water or TE) reverses the binding and the DNA comes off.

**Failure modes and their signatures:**

| What went wrong | What you see |
|---|---|
| Incomplete lysis | Low yield, skewed community composition |
| Poor bind (bad mixing, wrong alcohol) | Low yield across the whole plate |
| Insufficient wash | **Low A260/230**, PCR inhibition, fouled nanopore pores |
| Over-dried pellet | Low yield, low A260/230, poor elution |
| Insufficient elution time | Low yield, more DNA left on the beads |
| Bead carryover into eluate | Cloudy eluate, wrong quantification, enzyme inhibition |',
       '[]'::jsonb, true, true, NULL, NULL,
       'high', 520, true
FROM public.skill_categories c WHERE c.code = 'AEX'
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, summary=EXCLUDED.summary, instructions_md=EXCLUDED.instructions_md,
  reading_refs=EXCLUDED.reading_refs, requires_practical=EXCLUDED.requires_practical,
  recert_months=EXCLUDED.recert_months, external_ref=EXCLUDED.external_ref,
  risk_level=EXCLUDED.risk_level, sort_order=EXCLUDED.sort_order,
  instructions_version = public.skills.instructions_version + 1,
  updated_at = now();
  -- NOTE: active deliberately absent - your enable/disable choice is preserved.

DELETE FROM public.skill_checklist_items WHERE skill_id = (SELECT id FROM public.skills WHERE code='AEX-01');
INSERT INTO public.skill_checklist_items (skill_id, sort_order, item_text, is_critical) VALUES
  ((SELECT id FROM public.skills WHERE code='AEX-01'), 0, 'Explains each of the five stages and what it accomplishes chemically', true),
  ((SELECT id FROM public.skills WHERE code='AEX-01'), 10, 'Given a low A260/230 result, identifies insufficient wash or over-drying', true),
  ((SELECT id FROM public.skills WHERE code='AEX-01'), 20, 'Given low yield across a whole plate, distinguishes bind failure from lysis failure', false),
  ((SELECT id FROM public.skills WHERE code='AEX-01'), 30, 'Explains why incomplete lysis biases community composition', false),
  ((SELECT id FROM public.skills WHERE code='AEX-01'), 40, 'States why residual ethanol matters downstream', false);

-- ---------------------------------------------------------------- prerequisites

DELETE FROM public.skill_prerequisites WHERE skill_id IN (SELECT id FROM public.skills WHERE code = ANY(ARRAY['SAF-02', 'SAF-03', 'SAF-16', 'SAF-27', 'SAF-29', 'SAF-31', 'SAF-34', 'SAF-39', 'SAF-43', 'BEN-02', 'BEN-03', 'BEN-07', 'BEN-12', 'BEN-13', 'BEN-21', 'BEN-25', 'FLX-02', 'FLX-16', 'FLX-21', 'FLX-23', 'FLX-25', 'FLX-27', 'FLX-36', 'FLX-41', 'FLX-47', 'FLX-49', 'OT2-04', 'OT2-10', 'QC-03', 'QC-09', 'QC-14', 'QC-17', 'QC-20', 'PLT-01', 'SEQ-11', 'SEQ-12', 'SEQ-18', 'SEQ-19', 'SEQ-26', 'HPG-14', 'HPG-22', 'HPG-30', 'HPG-40', 'HPG-56', 'AEX-01']));
INSERT INTO public.skill_prerequisites (skill_id, prereq_id) VALUES
  ((SELECT id FROM public.skills WHERE code='SAF-02'), (SELECT id FROM public.skills WHERE code='SAF-01')),
  ((SELECT id FROM public.skills WHERE code='SAF-03'), (SELECT id FROM public.skills WHERE code='SAF-01')),
  ((SELECT id FROM public.skills WHERE code='SAF-16'), (SELECT id FROM public.skills WHERE code='SAF-01')),
  ((SELECT id FROM public.skills WHERE code='SAF-16'), (SELECT id FROM public.skills WHERE code='SAF-02')),
  ((SELECT id FROM public.skills WHERE code='SAF-27'), (SELECT id FROM public.skills WHERE code='SAF-03')),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), (SELECT id FROM public.skills WHERE code='SAF-03')),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), (SELECT id FROM public.skills WHERE code='SAF-25')),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), (SELECT id FROM public.skills WHERE code='SAF-29')),
  ((SELECT id FROM public.skills WHERE code='SAF-34'), (SELECT id FROM public.skills WHERE code='SAF-27')),
  ((SELECT id FROM public.skills WHERE code='SAF-39'), (SELECT id FROM public.skills WHERE code='SAF-01')),
  ((SELECT id FROM public.skills WHERE code='SAF-43'), (SELECT id FROM public.skills WHERE code='SAF-03')),
  ((SELECT id FROM public.skills WHERE code='SAF-43'), (SELECT id FROM public.skills WHERE code='SAF-39')),
  ((SELECT id FROM public.skills WHERE code='BEN-02'), (SELECT id FROM public.skills WHERE code='BEN-01')),
  ((SELECT id FROM public.skills WHERE code='BEN-03'), (SELECT id FROM public.skills WHERE code='BEN-01')),
  ((SELECT id FROM public.skills WHERE code='BEN-07'), (SELECT id FROM public.skills WHERE code='BEN-01')),
  ((SELECT id FROM public.skills WHERE code='BEN-12'), (SELECT id FROM public.skills WHERE code='BEN-10')),
  ((SELECT id FROM public.skills WHERE code='BEN-13'), (SELECT id FROM public.skills WHERE code='SAF-03')),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), (SELECT id FROM public.skills WHERE code='SAF-29')),
  ((SELECT id FROM public.skills WHERE code='BEN-21'), (SELECT id FROM public.skills WHERE code='BEN-13')),
  ((SELECT id FROM public.skills WHERE code='BEN-25'), (SELECT id FROM public.skills WHERE code='BEN-01')),
  ((SELECT id FROM public.skills WHERE code='FLX-02'), (SELECT id FROM public.skills WHERE code='FLX-01')),
  ((SELECT id FROM public.skills WHERE code='FLX-16'), (SELECT id FROM public.skills WHERE code='FLX-01')),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), (SELECT id FROM public.skills WHERE code='FLX-16')),
  ((SELECT id FROM public.skills WHERE code='FLX-23'), (SELECT id FROM public.skills WHERE code='FLX-16')),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), (SELECT id FROM public.skills WHERE code='BEN-01')),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), (SELECT id FROM public.skills WHERE code='FLX-16')),
  ((SELECT id FROM public.skills WHERE code='FLX-27'), (SELECT id FROM public.skills WHERE code='FLX-01')),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), (SELECT id FROM public.skills WHERE code='FLX-16')),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), (SELECT id FROM public.skills WHERE code='FLX-21')),
  ((SELECT id FROM public.skills WHERE code='FLX-41'), (SELECT id FROM public.skills WHERE code='FLX-36')),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), (SELECT id FROM public.skills WHERE code='FLX-01')),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), (SELECT id FROM public.skills WHERE code='SAF-02')),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), (SELECT id FROM public.skills WHERE code='FLX-47')),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), (SELECT id FROM public.skills WHERE code='OT2-01')),
  ((SELECT id FROM public.skills WHERE code='OT2-10'), (SELECT id FROM public.skills WHERE code='OT2-04')),
  ((SELECT id FROM public.skills WHERE code='QC-03'), (SELECT id FROM public.skills WHERE code='QC-02')),
  ((SELECT id FROM public.skills WHERE code='QC-09'), (SELECT id FROM public.skills WHERE code='BEN-01')),
  ((SELECT id FROM public.skills WHERE code='QC-09'), (SELECT id FROM public.skills WHERE code='BEN-07')),
  ((SELECT id FROM public.skills WHERE code='QC-14'), (SELECT id FROM public.skills WHERE code='BEN-01')),
  ((SELECT id FROM public.skills WHERE code='QC-17'), (SELECT id FROM public.skills WHERE code='BEN-12')),
  ((SELECT id FROM public.skills WHERE code='QC-17'), (SELECT id FROM public.skills WHERE code='BEN-25')),
  ((SELECT id FROM public.skills WHERE code='QC-20'), (SELECT id FROM public.skills WHERE code='QC-09')),
  ((SELECT id FROM public.skills WHERE code='QC-20'), (SELECT id FROM public.skills WHERE code='QC-14')),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), (SELECT id FROM public.skills WHERE code='QC-03')),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), (SELECT id FROM public.skills WHERE code='QC-09')),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), (SELECT id FROM public.skills WHERE code='QC-14')),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), (SELECT id FROM public.skills WHERE code='SEQ-11')),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), (SELECT id FROM public.skills WHERE code='SEQ-11')),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), (SELECT id FROM public.skills WHERE code='SEQ-18')),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), (SELECT id FROM public.skills WHERE code='SEQ-19')),
  ((SELECT id FROM public.skills WHERE code='HPG-14'), (SELECT id FROM public.skills WHERE code='HPG-07')),
  ((SELECT id FROM public.skills WHERE code='HPG-22'), (SELECT id FROM public.skills WHERE code='HPG-07')),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), (SELECT id FROM public.skills WHERE code='HPG-14')),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), (SELECT id FROM public.skills WHERE code='HPG-22')),
  ((SELECT id FROM public.skills WHERE code='HPG-40'), (SELECT id FROM public.skills WHERE code='HPG-30')),
  ((SELECT id FROM public.skills WHERE code='HPG-56'), (SELECT id FROM public.skills WHERE code='HPG-22')),
  ((SELECT id FROM public.skills WHERE code='AEX-01'), (SELECT id FROM public.skills WHERE code='BEN-25'))
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------- tracks

INSERT INTO public.skill_tracks (code, name, description, icon, sort_order) VALUES
  ('T1', 'Lab Entry — Week 1', 'Everyone, before touching a bench.', '🚪', 10)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
DELETE FROM public.skill_track_items WHERE track_id=(SELECT id FROM public.skill_tracks WHERE code='T1');
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order) VALUES
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-01'), 0),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-02'), 10),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-03'), 20),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-16'), 30),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-25'), 40),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-27'), 50),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-29'), 60),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-31'), 70),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-34'), 80),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='SAF-39'), 90),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='BEN-01'), 100),
  ((SELECT id FROM public.skill_tracks WHERE code='T1'), (SELECT id FROM public.skills WHERE code='BEN-13'), 110)
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_tracks (code, name, description, icon, sort_order) VALUES
  ('T2', 'Molecular Bench Core', 'All molecular trainees.', '🧪', 20)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
DELETE FROM public.skill_track_items WHERE track_id=(SELECT id FROM public.skill_tracks WHERE code='T2');
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order) VALUES
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='BEN-02'), 0),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='BEN-03'), 10),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='BEN-07'), 20),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='BEN-10'), 30),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='BEN-12'), 40),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='BEN-21'), 50),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='BEN-25'), 60),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='QC-02'), 70),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='QC-03'), 80),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='QC-09'), 90),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='QC-14'), 100),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='QC-17'), 110),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='QC-20'), 120),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='PLT-01'), 130),
  ((SELECT id FROM public.skill_tracks WHERE code='T2'), (SELECT id FROM public.skills WHERE code='AEX-01'), 140)
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_tracks (code, name, description, icon, sort_order) VALUES
  ('T3', 'Flex Operator — run existing protocols', 'Undergrads running Robin or Batman.', '🤖', 30)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
DELETE FROM public.skill_track_items WHERE track_id=(SELECT id FROM public.skill_tracks WHERE code='T3');
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order) VALUES
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-01'), 0),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-02'), 10),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-16'), 20),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-21'), 30),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-23'), 40),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-25'), 50),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-27'), 60),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-36'), 70),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-41'), 80),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-47'), 90),
  ((SELECT id FROM public.skill_tracks WHERE code='T3'), (SELECT id FROM public.skills WHERE code='FLX-49'), 100)
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_tracks (code, name, description, icon, sort_order) VALUES
  ('T3b', 'OT-2 Operator', 'Anyone using Alfred or Ethan.', '🦾', 35)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
DELETE FROM public.skill_track_items WHERE track_id=(SELECT id FROM public.skill_tracks WHERE code='T3b');
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order) VALUES
  ((SELECT id FROM public.skill_tracks WHERE code='T3b'), (SELECT id FROM public.skills WHERE code='OT2-01'), 0),
  ((SELECT id FROM public.skill_tracks WHERE code='T3b'), (SELECT id FROM public.skills WHERE code='OT2-04'), 10),
  ((SELECT id FROM public.skill_tracks WHERE code='T3b'), (SELECT id FROM public.skills WHERE code='OT2-10'), 20)
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_tracks (code, name, description, icon, sort_order) VALUES
  ('T8', 'Nanopore Sequencing', 'The lab''s only sequencing route.', '📱', 80)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
DELETE FROM public.skill_track_items WHERE track_id=(SELECT id FROM public.skill_tracks WHERE code='T8');
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order) VALUES
  ((SELECT id FROM public.skill_tracks WHERE code='T8'), (SELECT id FROM public.skills WHERE code='SEQ-11'), 0),
  ((SELECT id FROM public.skill_tracks WHERE code='T8'), (SELECT id FROM public.skills WHERE code='SEQ-12'), 10),
  ((SELECT id FROM public.skill_tracks WHERE code='T8'), (SELECT id FROM public.skills WHERE code='SEQ-18'), 20),
  ((SELECT id FROM public.skill_tracks WHERE code='T8'), (SELECT id FROM public.skills WHERE code='SEQ-19'), 30),
  ((SELECT id FROM public.skill_tracks WHERE code='T8'), (SELECT id FROM public.skills WHERE code='SEQ-26'), 40),
  ((SELECT id FROM public.skill_tracks WHERE code='T8'), (SELECT id FROM public.skills WHERE code='QC-14'), 50),
  ((SELECT id FROM public.skill_tracks WHERE code='T8'), (SELECT id FROM public.skills WHERE code='QC-20'), 60)
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_tracks (code, name, description, icon, sort_order) VALUES
  ('T9', 'HiPerGator Onboarding', 'Everyone doing analysis.', '🖥️', 90)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
DELETE FROM public.skill_track_items WHERE track_id=(SELECT id FROM public.skill_tracks WHERE code='T9');
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order) VALUES
  ((SELECT id FROM public.skill_tracks WHERE code='T9'), (SELECT id FROM public.skills WHERE code='HPG-07'), 0),
  ((SELECT id FROM public.skill_tracks WHERE code='T9'), (SELECT id FROM public.skills WHERE code='HPG-14'), 10),
  ((SELECT id FROM public.skill_tracks WHERE code='T9'), (SELECT id FROM public.skills WHERE code='HPG-22'), 20),
  ((SELECT id FROM public.skill_tracks WHERE code='T9'), (SELECT id FROM public.skills WHERE code='HPG-30'), 30),
  ((SELECT id FROM public.skill_tracks WHERE code='T9'), (SELECT id FROM public.skills WHERE code='HPG-40'), 40),
  ((SELECT id FROM public.skill_tracks WHERE code='T9'), (SELECT id FROM public.skills WHERE code='HPG-56'), 50)
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_tracks (code, name, description, icon, sort_order) VALUES
  ('T11', 'Shipping & Import Compliance', 'Anyone shipping or importing samples.', '📦', 110)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order;
DELETE FROM public.skill_track_items WHERE track_id=(SELECT id FROM public.skill_tracks WHERE code='T11');
INSERT INTO public.skill_track_items (track_id, skill_id, sort_order) VALUES
  ((SELECT id FROM public.skill_tracks WHERE code='T11'), (SELECT id FROM public.skills WHERE code='SAF-43'), 0)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------- equipment links
--
-- Uses the skill_equipment join table (see spec 9). A skill can apply to more than one
-- machine - both Flexes, both OT-2s, all four nanopore devices - which the scalar
-- skills.equipment_id column cannot express. Matched by equipment.name, so this is a
-- no-op for any row that has been renamed.

INSERT INTO public.skill_equipment (skill_id, equipment_id)
SELECT * FROM (VALUES
  ((SELECT id FROM public.skills WHERE code='FLX-01'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-02'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-16'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-23'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-27'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-41'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='AEX-01'), (SELECT id FROM public.equipment WHERE name='Robin - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-01'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-02'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-16'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-21'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-23'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-25'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-27'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-36'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-41'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-47'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='FLX-49'), (SELECT id FROM public.equipment WHERE name='Batman - Opentrons Flex')),
  ((SELECT id FROM public.skills WHERE code='OT2-01'), (SELECT id FROM public.equipment WHERE name='Alfred - Opentrons OT-2')),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), (SELECT id FROM public.equipment WHERE name='Alfred - Opentrons OT-2')),
  ((SELECT id FROM public.skills WHERE code='OT2-10'), (SELECT id FROM public.equipment WHERE name='Alfred - Opentrons OT-2')),
  ((SELECT id FROM public.skills WHERE code='OT2-01'), (SELECT id FROM public.equipment WHERE name='Ethan - Opentrons OT-2')),
  ((SELECT id FROM public.skills WHERE code='OT2-04'), (SELECT id FROM public.equipment WHERE name='Ethan - Opentrons OT-2')),
  ((SELECT id FROM public.skills WHERE code='OT2-10'), (SELECT id FROM public.equipment WHERE name='Ethan - Opentrons OT-2')),
  ((SELECT id FROM public.skills WHERE code='QC-02'), (SELECT id FROM public.equipment WHERE name='Denovix DS-11')),
  ((SELECT id FROM public.skills WHERE code='QC-03'), (SELECT id FROM public.equipment WHERE name='Denovix DS-11')),
  ((SELECT id FROM public.skills WHERE code='QC-09'), (SELECT id FROM public.equipment WHERE name='Qubit')),
  ((SELECT id FROM public.skills WHERE code='QC-14'), (SELECT id FROM public.equipment WHERE name='Tape Station 2200')),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), (SELECT id FROM public.equipment WHERE name='Synergy HTX Plate Reader')),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), (SELECT id FROM public.equipment WHERE name='EPOCH Plate Reader')),
  ((SELECT id FROM public.skills WHERE code='PLT-01'), (SELECT id FROM public.equipment WHERE name='Eon Plate Reader')),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-1')),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-1')),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-1')),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-1')),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-1')),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-2')),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-2')),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-2')),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-2')),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1b-2')),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1c')),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1c')),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1c')),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1c')),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1c')),
  ((SELECT id FROM public.skills WHERE code='SEQ-11'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1D')),
  ((SELECT id FROM public.skills WHERE code='SEQ-12'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1D')),
  ((SELECT id FROM public.skills WHERE code='SEQ-18'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1D')),
  ((SELECT id FROM public.skills WHERE code='SEQ-19'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1D')),
  ((SELECT id FROM public.skills WHERE code='SEQ-26'), (SELECT id FROM public.equipment WHERE name='Nanopore MK1D')),
  ((SELECT id FROM public.skills WHERE code='HPG-07'), (SELECT id FROM public.equipment WHERE name='Compute Power')),
  ((SELECT id FROM public.skills WHERE code='HPG-14'), (SELECT id FROM public.equipment WHERE name='Compute Power')),
  ((SELECT id FROM public.skills WHERE code='HPG-22'), (SELECT id FROM public.equipment WHERE name='Compute Power')),
  ((SELECT id FROM public.skills WHERE code='HPG-30'), (SELECT id FROM public.equipment WHERE name='Compute Power')),
  ((SELECT id FROM public.skills WHERE code='HPG-40'), (SELECT id FROM public.equipment WHERE name='Compute Power')),
  ((SELECT id FROM public.skills WHERE code='HPG-56'), (SELECT id FROM public.equipment WHERE name='Compute Power')),
  ((SELECT id FROM public.skills WHERE code='SAF-31'), (SELECT id FROM public.equipment WHERE name='Biological Safety Cabinet')),
  ((SELECT id FROM public.skills WHERE code='SAF-29'), (SELECT id FROM public.equipment WHERE name='Biological Safety Cabinet'))
) AS v(skill_id, equipment_id)
WHERE v.equipment_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------- verification
--
-- Expected after applying:
--   skill_categories .......... 16
--   skills (active) ........... 53
--   checklist items ........... 304
--   tracks .................... 7
--
--   SELECT c.code, count(s.id) FROM skill_categories c
--     LEFT JOIN skills s ON s.category_id=c.id GROUP BY c.code ORDER BY c.code;
--
--   -- every skill has at least one checklist item
--   SELECT s.code FROM skills s LEFT JOIN skill_checklist_items i ON i.skill_id=s.id
--    WHERE s.requires_practical GROUP BY s.code HAVING count(i.id)=0;   -- expect 0 rows
--
--   -- no prerequisite cycles at depth 1
--   SELECT a.code FROM skill_prerequisites p
--     JOIN skills a ON a.id=p.skill_id JOIN skills b ON b.id=p.prereq_id
--     JOIN skill_prerequisites q2 ON q2.skill_id=p.prereq_id AND q2.prereq_id=p.skill_id;
--                                                                       -- expect 0 rows

COMMIT;
