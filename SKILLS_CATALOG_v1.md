# Dutton Lab — Skill Catalog v1 (draft for review)

Companion to `SKILLS_MODULE_SPEC.md`. This is the seed content for the `skills` table.

**Scope:** wet lab + instruments, computational/HiPerGator, safety & compliance.
Field & sampling skills were excluded by the PI on 2026-08-08 and are not listed, except
where a field practice has a bench consequence (sample intake, shipping, permits).

## Legend

| Mark | Meaning |
|---|---|
| **★** | **v1 Core** — seed these first (~112 skills). Everything else is expansion. |
| ✅ | Grounded in vendor / UF documentation actually fetched (sources at the end) |
| ⚠️ | Inferred from standard practice — **review before publishing to trainees** |
| ❓ | Instrument ownership unconfirmed — should now be rare, see the inventory below. |
| 🔒 | `risk_level = critical` — a failure here loses samples, contaminates a project, or hurts someone |

**Recert** column: `—` none · `Ann` annual · `2y`/`3y`/`5y` · `L6`/`L12` lapse-based
(requalify if not performed in 6/12 months) · `Run` per-run · `Evt` event-based.

---

## CONFIRMED INSTRUMENT INVENTORY

Read live from the database on 2026-08-08 via the Lovable connector (project
`f95bec5c-9e0c-4b9e-af6b-762e8f27693f`). 29 equipment rows, booking counts since Oct 2025.
**This replaces the guesswork in the first draft — several categories were wrong.**

### Liquid handlers — four, not one

| Instrument | Type | Bookings | Users | Note |
|---|---|---:|---:|---|
| **Robin — Opentrons Flex** | robot | 22 | 6 | DNA extractions. Most-booked instrument in the lab. |
| **Batman — Opentrons Flex** | robot | 16 | 5 | **96-head pipette**, currently set up for Zymo full-gene 16S library prep |
| **Ethan — Opentrons OT-2** | robot | 9 | 4 | |
| **Alfred — Opentrons OT-2** | robot | 3 | 3 | |

Consequences: the whole FLX block applies to **two** Flexes, not one. `FLX-09` (96-channel
pipette installation) is a **real, core** skill because of Batman. `FPY-16` (OT-2 → Flex
conversion) is real and load-bearing, not hypothetical. And the OT-2s need **their own
category** — the first draft had none. See §4A.

### Sequencing — all Oxford Nanopore, all in-house, no Illumina

| Instrument | Bookings | Note |
|---|---:|---|
| **Nanopore MK1D** | 6 | "The newest sequencer from Nanopore" |
| **Nanopore MK1c** | 2 | Mk1C — standalone, onboard compute |
| **Nanopore MK1b-1 / MK1b-2** | 1 / 1 | MinION Mk1B — host-computer-dependent |

**There is no Illumina instrument and no evidence of ICBR submission in the booking data.**
§10a (Illumina, 9 skills) collapses to a two-skill stub. Every §10b nanopore row is
promoted to core. `PCR-10` (Illumina two-step dual-index) is replaced by ONT barcoding.
Batman being set up for **Zymo full-gene 16S** confirms the amplicon path is full-length
16S on nanopore, not V4 on Illumina — which changes `PCR-07` and all of §14a.

### Quantification and sizing

| Instrument | Bookings | Status |
|---|---:|---|
| **Denovix DS-11** | 20 | **DS-11, not a QFX.** Second most-booked instrument. |
| **Qubit** | 11 | In active use — *not* redundant. Lab description: "more accurate than Nanodrop/Denovix." |
| **Tape Station 2200** | 4 | The sizing platform. `QC-20` molarity math has its input. |
| **Synergy HTX Plate Reader** | 2 | **With a Take3 Trio plate** — 48 samples, 2 µL, DNA quality + quantity. A whole workflow the first draft missed. |
| **EPOCH Plate Reader** | 1 | Backup for the Synergy |
| **Eon Plate Reader** | 0 | Backup for the Synergy and Epoch |
| **Bioanalyzer 2100** | 0 | **maintenance** — "functional, but not currently hooked up or in-service" |

Consequences: delete `QC-07`/`QC-08` (DeNovix QFX — they don't have one) and `QC-16`
(Fragment Analyzer — doesn't exist). Promote `QC-09` (Qubit) and `QC-14` (TapeStation) to
core. Park `QC-15` (Bioanalyzer). **Add a plate-reader / Take3 category** — see §8A.

### Amplification

| Instrument | Bookings | Note |
|---|---:|---|
| **Quantstudio 3 qPCR** | 9 | Write `PCR-15` against QuantStudio specifically |
| **Absolute Q dPCR** | 4 | **Microfluidic-array digital PCR, not droplet ddPCR.** 4 samples min, 16 max, 20 min prep, 90 min run. `PCR-21` must be rewritten. |
| **PCR Hood #1 / #2** | 0 / 0 | Two dead-air hoods — `PCR-11` clean-room practice is physically supported |

### Biogeochemistry — real and in-house, but not the instruments I guessed

| Instrument | Location | Note |
|---|---|---|
| **Picarro G2508 Gas Analyzer** | Carr 518 | CRDS analysis of gas samples in exetainers (CH₄, CO₂, N₂O, NH₃, H₂O) |
| **"Tom and Jerry"** | Carr 518 | Evacuating exetainers — the sample-prep front end for the Picarro |
| **Shimadzu TOC Analyzer** | Subalusky Lab, Carr 518 | DOC / TN |

**There is no gas chromatograph and no nutrient autoanalyzer.** §12 must be rebuilt around
CRDS, not GC — `BGC-11`/`BGC-12` (GC operation and maintenance) are deleted outright.

### General equipment

| Instrument | Bookings | Note |
|---|---:|---|
| **Biological Safety Cabinet** | 14 | Heavily used — `SAF-31` / `BEN-14` are core, not conditional |
| **Misc. Bench top work** | 12 | A booking category, not an instrument ("DNA extractions or cleaning kit use by hand") |
| **Hulu Mixer** | 3 | HulaMixer-style rotating sample mixer |
| **Glowforge Laser Cutter** | 1 | Needs its own safety skill — enclosed Class 4 laser, fume extraction |
| **Boat / Ford Escape Vehicle** | 1 / 1 | Field assets. Out of the agreed scope, but bookable — flagged, not catalogued. |

### Not present — delete these skills

No anaerobic chamber, no incubator, no shaking incubator, no microscope, no gel imager or
electrophoresis rig as bookable equipment, no MiSeq/iSeq, no GridION/PromethION, no
Flongle, no droplet ddPCR, no Fragment Analyzer, no DeNovix QFX, no GC, no autoanalyzer.
**§11 (MIC, culture microbiology) has no instrument support at all** — drop the category
unless culture work happens on shared equipment elsewhere.

### What the lab actually does — from 262 booking purposes and usage notes

The free-text on real bookings names the kits and pipelines. This is more useful than the
equipment list and it settles most of what was guesswork.

**Two production workflows on the Flexes** (the PI confirmed these are the main use):

1. **DNA extraction — Zymo MagBead.** Booking notes: *"Zymo Magbead re-extraction of July
   samples"*, *"Gibbons extraction"*, *"Extract last of Faith's samples"*. So **AEX-11 /
   AEX-12 (Zymo MagBead) is THE extraction kit skill** — seed it and drop AEX-13…16
   (Omega, MagMAX, MagAttract, NucleoMag) to expansion.
2. **Full-gene 16S library prep — Zymo 96.** Notes: *"Zymo 96 library prep"*,
   *"library prep v13 / v14 / v15 / v22 wet run"*, *"Barcoding and Thermocycling T3"*,
   and from the QuantStudio: *"PCR step for Zymo 96 library prep. ~1/2 of samples
   amplified."* Two things follow: **Batman has a Thermocycler GEN2** (it barcodes and
   thermocycles on deck), and **the QuantStudio 3 doubles as the bench thermocycler** for
   the amplification step. The versioned protocol numbering (v13 → v22) means `FPY-13`
   protocol version control and `FPY-17` change control are **live practice**, not aspiration.

**The two OT-2s have distinct jobs** — this is why they need their own sign-offs:

- **Ethan** = dilution, normalization and pooling. *"Library pooling"*, *"equimolar
  pooling T3"*, *"Dilutions"*, *"Using Ethan to dilute 4 wetland DNA extracts… testing
  0.5, 1, 2, 3 ng loaded into the dPCR wells"*. `AEX-19` (automated normalization and
  pooling) is **real and core**, on the OT-2.
- **Alfred** = cleanup. *"Clean and concentrate"*, *"Cleaning"* — Zymo Clean & Concentrator.

**Inhibitor removal is routine bench work.** *"OneStep PCR Inhibitor Removal kit"* appears
repeatedly under Misc. Bench top work. `MEX-13` is core and should name Zymo OneStep and
Clean & Concentrator specifically.

**RNA is a major workstream, not a side line.** Eight separate BSC bookings for RNA
extraction, several *"prepping for JGI project"*. So `MEX-02` (RNase-free practice) and
`MEX-10` (RNA extraction) are **core**, and there **is** an external sequencing path after
all — **JGI** — so `SEQ-09` (core-facility submission) earns its place.

**Shotgun metagenomics runs alongside 16S.** *"Shotgun metagenomics on 5 DNA extracts from
wetland soils"*, *"PCR shotgun"* on the MK1D, *"Kraken and AMR identification"*,
*"processing MAGs from Princeton"*. §14b is real, not speculative.

**The bioinformatics stack is named:**

| Tool | Evidence | Consequence |
|---|---|---|
| **Emu** | *"Rerun emu with new database"*, *"Emu combine output"*, *"Rerunning Emu with Silva database"*, *"Reprocessing DisneyRun2 with new emu database"* | **`BIX-26` is the lab's primary taxonomy step and must be core.** DADA2 and QIIME2 (`BIX-04`, `BIX-05`) drop to expansion — they are Illumina-short-read tools and the lab sequences full-length on nanopore. |
| **Dorado, sup model** | *"Superaccuracy basecalling"*, *"Processing the pod5 files"* | `BIX-19` core, on a GPU partition |
| **Kraken2 + AMR** | *"Kraken and AMR identification 5 shotgun samples"*, *"Kraken last waterpans samples"* | `BIX-13` core |
| **MICOM** | *"Gorilla micom modelling"*, *"convert the MICOM database over to zoo animals for metabolic modelling"* | New skill — genome-scale metabolic modelling of communities. Not in the first draft. |
| **JSDM in R on HiPerGator** | *"testing JSDM model with interactive R studio on hipergator. will need to switch to batch submit for future"* | `HPG-18` (RStudio via OOD) and `HPG-14` (login-node etiquette) are being learned the hard way right now. `DAT-09` core. |

**qPCR targets are functional genes, not just 16S.** *"pmoA mcrA qPCR test run"*,
*"~3 days of quantstudio 3 usage for pmoA and mcrA abundances, 2-3 replicates each"* —
methanotrophy and methanogenesis marker genes, which tie directly to the Picarro CH₄ work.
`PCR-13`/`PCR-14`/`PCR-16` are core and the standard-curve discipline matters.

**Sample matrices are overwhelmingly animal- and wetland-associated.** Projects by booking
volume: Florida Wetlandscapes (35), Giraffes (15), Gibbons (14), Hippo (12), Kenya Water
Pans (12), Disney Animal Kingdom (10), Dolphins (6), South Africa (5), Bird Caeca (3),
Greenland (3), Rhino Middens (2), Kenya Fish Guts (1), plus Python Microbiome, Horse
Rewilding and "Rabots" queued. Also snails, sediment, and wetland soils in the notes.

⚠️ **This makes `SAF-61` (IACUC) and `SAF-62` (Animal Contact Program) very likely
mandatory, not conditional.** ACP is required for anyone handling *"unfixed animal tissues
or body fluids, including animal waste"* — dolphin blow, rhino middens, bird caeca and
fish guts are squarely that, even when the animals are handled by zoo staff. Conversely
there is **no sign of human-subject samples**, so `SAF-57`/`SAF-58` (IRB) stay conditional.
And with Kenya, South Africa and Greenland material moving, the `SAF-43`…`SAF-53`
shipping-and-permits block is live.

### The people this is for

29 active accounts: 2 PIs (you and Amanda Subalusky), 1 external PI, 6 postdocs,
12 grad students, 8 undergrads. 15 have never made a booking.

**29 people × 183 core skills = 5,300 cells.** That is the strongest argument in this
document for cutting the seed set hard. Tracks T1 + T2 + T3 + T9 (~130 skills) is still
3,800 cells. Consider seeding T1 and T2 only for the first semester.

---

**Type** column (safety only): `UF` = UF-mandated formal course with an institutional
record · `LAB` = in-lab competency · `EXT` = third-party certification.

---

# 1. SAF — Safety & Compliance
**42 skills · 21 core.** UF course codes read off the live EHS catalog 2026-08-08. None
are invented; where no code was found the cell says so. Re-verify in myTraining before
these reach trainees.

## 1a. Gating — before badge/key access

| ID | Skill | Competent means | Type | Recert | ★ |
|---|---|---|---|---|---|
| SAF-01 | **Chemical Hygiene Plan `EHS869`** ✅🔒 | The gating requirement. UF: *"All researchers working in wet lab spaces must complete EH&S's Chemical Hygiene Plan (EHS869) training prior to beginning work in the lab."* Online. | UF | Initial | ★ |
| SAF-02 | **Hazard Communication `EHS814`** ✅ | GHS labels, pictograms, signal words; SDS 16-section structure and retrieval. Online. | UF | Initial | ★ |
| SAF-03 | **General Biosafety `EHS853`** ✅ | Biosafety principles, exposure routes, containment, biohazard signage, decontamination. Online. | UF | Initial | ★ |
| SAF-04 | **Fire Extinguisher / Safety `EHS827`** ✅ | PASS technique and when *not* to fight a fire. In-person or online. UF lists renewal as "Recommended" — lab should mandate on a 3-year cycle. | UF | 3y (lab rule) | ★ |
| SAF-05 | Emergency & evacuation ⚠️ | Building route, assembly point, alarm pulls, UF Alert enrolled, 911 vs UFPD 352-392-1111. | LAB | Ann | ★ |
| SAF-06 | **Gator TRACS / LATCH roster entry** ✅ | Listed on the lab roster with two emergency contacts and current training documentation. A trainee not on the roster is an audit finding. | UF | Ann | ★ |
| SAF-07 | **Annual hazard assessment signature** ✅ | Reads and signs the lab's annual hazard assessment in LATCH — a named LATCH requirement. | UF | **Ann** | ★ |
| SAF-08 | Gator TRACS Tutorial `EHS883` ✅ | Zoom-delivered tutorial on the Gator TRACS system. Listed as Recommended. | UF | rec. | |

## 1b. Before touching a bench

| ID | Skill | Competent means | Type | Recert | ★ |
|---|---|---|---|---|---|
| SAF-09 | Lab-specific CHP & SOPs ✅ | Has read the lab's LATCH-held plan and the SOPs for the hazards they will actually touch. | UF+LAB | Ann | ★ |
| SAF-10 | SDS retrieval ✅ | Pulls an SDS for any chemical in the lab inside a minute, from Gator TRACS or the manufacturer. | LAB | — | ★ |
| SAF-11 | PPE selection & doffing ✅⚠️ | Correct glove material for the chemistry (nitrile vs chloroprene for chloroform/phenol); changes at defined trigger points; removes gloves before door handles, keyboards, phones; doffs without self-contamination. | LAB | Ann | ★ |
| SAF-12 | Eyewash & safety shower ✅ | Knows locations, can operate them, knows the weekly-flush responsibility. | LAB | wkly check | ★ |
| SAF-13 | Chemical storage & segregation ✅ | Acids/bases/oxidizers/flammables segregated; flammables cabinet; secondary containment; nothing on the floor or above eye level; peroxide-formers dated on receipt and disposed before expiry. | LAB | — | ★ |
| SAF-14 | **Chemical spill response** ✅🔒 | Distinguishes minor (self-cleanup with the lab kit) from major (evacuate, secure, call); knows kit location and contents. | LAB | Ann drill | ★ |
| SAF-15 | Fume hood use ⚠️ | Sash height, airflow verification sticker, no storage in the hood, works 6″ inside the sash. | LAB | — | ★ |
| SAF-16 | **Hazardous Waste Management `EHS809`** ✅ | Waste identification, compatible containers, labeling, satellite accumulation rules, pickup requests. Online. | UF | **Ann** | ★ |
| SAF-17 | Chemical waste at the bench ⚠️ | Labels containers **at the moment waste is first added** with full chemical names — no formulas, no abbreviations; keeps them closed; nothing down the drain without approval. | LAB | — | ★ |
| SAF-18 | Guanidinium / chaotrope handling ⚠️🔒 | Handles GITC lysis and binding buffers (Zymo, Qiagen, MagMAX) with correct PPE and ventilation; **never mixes with hypochlorite**; routes waste correctly. | LAB | Ann | ★ |
| SAF-19 | Sharps & broken glass ⚠️ | Never recaps needles; rigid approved sharps container; **glass goes in a glass box, not sharps and not regular trash**; knows the post-injury reporting path. | LAB | — | ★ |
| SAF-20 | Injury / incident / near-miss reporting ⚠️ | Reports every injury, exposure, spill and near-miss to the PI and EHS same-day. | LAB | — | ★ |
| SAF-21 | Chemical inventory in Gator TRACS ✅ | Adds/edits/disposes chemicals in LATCH; knows every container is logged individually regardless of volume, and what is in scope vs out (biologicals, kits, enzyme preps and non-hazardous buffers are out). | UF+LAB | **Ann** | |
| SAF-22 | Electrical safety around fluids ⚠️ | No daisy-chained strips, GFCI near water, no liquid above powered instruments, panels clear. (`EHS844` lockout/tagout applies to maintenance work, not this lab.) | LAB | — | |
| SAF-23 | Ergonomics for high-repetition pipetting ✅⚠️ | Recognizes RSI risk; offloads to multichannel/electronic pipettes and to the robot; can request a UF EHS ergonomic evaluation. | LAB | — | |
| SAF-24 | Lab notebook / ELN discipline ⚠️ | Records lot numbers, deviations, instrument settings, raw-data file paths and timestamps contemporaneously; another member could reproduce the run from the entry alone. Notebook content is UF property and stays at UF on departure. | LAB | Ann review | ★ |

## 1c. Before biological samples

| ID | Skill | Competent means | Type | Recert | ★ |
|---|---|---|---|---|---|
| SAF-25 | **Bloodborne Pathogens `EHS850G`** ✅🔒 | OSHA BBP standard, universal precautions, exposure control plan, post-exposure procedure. Annual renewal confirmed in both the EHS catalog and the UF Biosafety Manual. | UF | **Ann** | ★ |
| SAF-26 | BBP program enrolment / Hep B ✅ | In the departmental BBP program with **documented vaccination or documented declination** on file. | UF | once | ★ |
| SAF-27 | **Biomedical Waste `EHS851`** ✅ | Segregation, red bags, biohazard labeling, sharps, storage limits, treatment. Main campus; `EHS854` is the satellite variant. | UF | **Ann** | ★ |
| SAF-28 | BSL-1 practices ✅ | Mechanical pipetting only (UF: *"never mouth pipette"*), minimize splashes, disinfect after use, handwashing after handling microorganisms. | LAB | — | ★ |
| SAF-29 | **BSL-2 practices** ✅🔒 | BSL-1 plus: biohazard signage on all containers and at entry, leak-proof storage, restricted access, lab coat + gloves + eye protection mandatory, **BSC required for aerosol-generating procedures**. UF requires *documented, agent-specific, PI-signed proficiency* — not just the online course. | UF+LAB | Ann re-verify | ★ |
| SAF-30 | Environmental / unknown-pathogen risk posture ⚠️ | Understands that raw environmental water, sediment and animal- or human-associated samples of unknown status are exactly the *"samples potentially contaminated with infectious agents"* case UF flags — so primary handling likely defaults to BSL-2 even when downstream DNA work is BSL-1. **Needs an explicit PI ruling written into the lab SOP.** | LAB | — | ★ |
| SAF-31 | Biosafety cabinet use ✅❓ | Works 4–6″ inside, no rapid arm movements, doesn't block grilles, no open flames, surface-decontaminates in and out, purges before and after. Can find the certification sticker and check the date — **UF requires annual certification for BSCs used at BSL-2**. | LAB | BSC cert Ann | ★ |
| SAF-32 | Disinfection & decontamination ⚠️ | Right disinfectant for the agent (10% bleach freshly made, 70% ethanol, quat) and honors **contact time**; knows bleach corrodes stainless and must be wiped off. | LAB | — | ★ |
| SAF-33 | Biological spill response ✅⚠️🔒 | Cover with absorbent, apply disinfectant outside-in, full contact time, forceps for sharps, dispose as biomedical waste, report. Knows the different procedure inside vs outside a BSC. | LAB | Ann drill | ★ |
| SAF-34 | Autoclave training ✅ | UF lists "Autoclave Training" — in-person, **no course code found**, renewal "Recommended". Cycle selection (liquid vs gravity vs dry), load size, no sealed containers, no chlorinated plastics, heat gloves + face protection, superheated boil-over hazard, waiting for depressurization, run logs. BI/spore validation frequency is unpublished — **ask `bso@ehs.ufl.edu`**. | UF+LAB | Ann (lab rule) | ★ |
| SAF-35 | **IBC / Biohazard Project Registration** ✅ | Knows the lab's IBC registration number and that they must be listed on it. Triggers that apply here: culturing an uncharacterized pathogen, analysis of samples potentially contaminated with infectious agents, **recombinant or synthetic nucleic acids**, and *"projects requiring federal or state permits."* Registrations run 5 years. IBC meets 1st and 3rd Wednesday; approval takes 2 to 6+ weeks. | UF | **5y** | ★ |
| SAF-36 | UV source safety ✅ | Never occupies the room with an unshielded UV cycle running (HEPA/UV module, gel imager, PCR hood); verifies interlocks; knows UV decontaminates but does not sterilize and does not penetrate under labware. | LAB | Ann | |
| SAF-37 | Ethidium bromide & gel stain alternatives ⚠️ | Designated area, dedicated waste stream, or migrated to SYBR-type stains; EtBr waste is chemical waste. | LAB | — | |
| SAF-38 | BioPath / medical monitoring ✅ | Knows UF Biosafety runs a BioPath medical monitoring program via Occupational Medicine. *(Their site notes it is mid-reconstruction — verify the current process.)* | UF | per program | |

## 1d. Cryogens & gases

| ID | Skill | Competent means | Type | Recert | ★ |
|---|---|---|---|---|---|
| SAF-39 | **Liquid Nitrogen `EHS866`** ✅🔒 | Cryo gloves **+ face shield**, asphyxiation risk in small rooms and elevators, never ride an elevator with an open dewar, correct transport, cold-burn first aid, **sealed cryovials explode on warming**. UF lists renewal "Recommended" — lab should mandate 3-year. | UF | 3y (lab rule) | ★ |
| SAF-40 | Compressed gas cylinders 🔶 | No dedicated UF course code found; cylinders *are* in scope for the Gator TRACS inventory, so treat as a LAB competency under `EHS869`. Chained upright, valve cap on when not regulator-connected, correct regulator per gas (never adapt), leak-check, cylinder cart only, oxidizers segregated from flammables. | LAB | — | ★ |
| SAF-41 | Dry ice handling ⚠️ | Asphyxiation risk, never in a sealed container, cryo gloves, never in a walk-in cold room or a car cabin. Distinct from the *shipping* requirement (SAF-43). | LAB | — | ★ |
| SAF-42 | Centrifuge safety ⚠️ | Balancing, rotor inspection and rotor logs, rotor-specific speed limits, sealed buckets for biohazards, never opening while spinning. | LAB | — | ★ |

## 1e. Shipping, permits, agreements — high priority for Kenya-sourced material

| ID | Skill | Competent means | Type | Recert | ★ |
|---|---|---|---|---|---|
| SAF-43 | **Shipping & Transport of Biological Materials `EHS852`** ✅🔒 | **The required course — anyone who transports OR prepares dangerous goods must hold it.** Certificate valid **2 years**, matching the DOT/IATA recurrent-training rule. Register by emailing `bso@ehs.ufl.edu` with first name, last name, UFID. Covers infectious substances, toxins, diagnostic specimens, GMOs, and accompanying dry ice and alcohol. | UF | **2y** | ★ |
| SAF-44 | Dangerous-goods classification ⚠️🔒 | Correctly assigns Category A (UN2814/UN2900) vs Category B (UN3373) vs Exempt Specimen vs non-regulated preserved DNA. Misdeclaring is the most common and most expensive error. | LAB | — | ★ |
| SAF-45 | Triple packaging ⚠️ | Primary receptacle → absorbent → leak-proof secondary → rigid outer with correct marks, labels, itemized contents, shipper/consignee. | LAB | — | ★ |
| SAF-46 | Dry ice as a hazard class ⚠️ | UN1845, Class 9; **net dry-ice mass declared on the airway bill**; package must vent; aircraft quantity limits. | LAB | — | ★ |
| SAF-47 | On-campus / intra-UF transport ✅ | Double-contain, absorbent, disinfect the outer container before leaving the lab, label with contact info, freight elevators. **Dangerous goods may not be transported in a personal vehicle — use a state vehicle.** | UF | — | ★ |
| SAF-48 | Import permit landscape ✅ | Names which agency governs which material: CDC (human-infectious, vectors), USDA APHIS VS (livestock-infectious, animal products), **APHIS PPQ (plant pathogens, pests, and SOIL)**, APHIS BRS (GE organisms), FDA (human cells), USFWS/CITES (wildlife). | LAB | per permit | ★ |
| SAF-49 | **Soil and sediment are regulated** ⚠️ | The most-missed item for an aquatic lab: **APHIS PPQ explicitly regulates soil imports.** Sediment from a Kenyan lake very likely needs a PPQ 525 soil permit with facility conditions. | LAB | per permit | ★ |
| SAF-50 | Permits are personal to the PI ✅ | UF: permits are *"personal legal contracts between the PI and government agencies—not shareable across investigators."* A trainee cannot import on someone else's permit. Knows where the lab's permits are filed and when they expire. | LAB | — | ★ |
| SAF-51 | Permit lead time & cost ✅ | 2–8+ weeks. CDC permits are free but **cannot be amended**; USDA permits cost $150 and can be. Agencies may require a facility inspection first. Plans campaigns backward from this. | LAB | — | |
| SAF-52 | Permit ↔ IBC linkage ✅ | *"Projects requiring federal or state permits"* is itself an IBC registration trigger — both must exist. | LAB | — | |
| SAF-53 | **Material Transfer Agreements** ✅ | **No biological material enters or leaves the lab without an executed MTA**, routed through UF Innovate Tech Licensing. MTAs govern permitted use, publication, IP, and onward transfer. | UF | per agreement | ★ |
| SAF-54 | Export control awareness ✅ | ITAR (defense), EAR (dual-use), OFAC (sanctions). UF RISC requires training for anyone working with controlled technology. `exportcontrol@research.ufl.edu`. | UF | verify | |
| SAF-55 | Deemed exports ✅ | *"Any release in the United States of technology or source code to a foreign person is a deemed export."* Directly relevant to international students on controlled projects. | LAB | — | |
| SAF-56 | International travel with UF equipment ✅ | Foreign Travel Request in **myAssets**, approved by both Asset Management and UF RISC; items stay under "effective control". Applies to laptops, MinIONs, field sensors. | UF | per trip | |

## 1f. Conditional — enable only if applicable

| ID | Skill | Condition | Type | Recert |
|---|---|---|---|---|
| SAF-57 | **IRB training `IRB 803`** ✅ | **Any human-associated microbiome sample.** UF's primary human-subjects course for all researchers and study staff. Takes 2–4 business days to appear in myIRB. | UF | **3y** |
| SAF-58 | Human-derived microbiome samples ⚠️🔒 | Human stool, skin, oral and other host-associated samples **are human subjects research** requiring IRB approval and consent — the most commonly missed compliance step in microbiome labs. BBP applies; IBC may apply; public SRA deposition requires consent to unprotected archiving. | LAB+UF | per protocol |
| SAF-59 | International human-subjects work ⚠️ | Kenya: in-country ethics approval and national research authorization typically required **in addition to** UF IRB, and UF IRB will ask for it. | LAB | per protocol |
| SAF-60 | HIPAA `PRV800` ✅ | Role-triggered. UF IRB no longer tracks HIPAA separately; complete PRV800 in myTraining. | UF | **Ann** |
| SAF-61 | IACUC protocol listing ✅ | Named on an approved protocol **before touching any animal**. Exact required CITI module set is behind the IACUC secure site — confirm at `iacuc@research.ufl.edu`. | UF | per protocol |
| SAF-62 | Animal Contact Program ✅ | Mandatory for anyone handling live animals **or unfixed animal tissues/fluids including waste**. Tetanus within 10 years (all); rabies within 2 years for wild/feral/unvaccinated-carnivore handlers. Observational field studies are exempt but must still read the handbook. | UF | tetanus 10y / rabies 2y |
| SAF-63 | Fish / aquatic vertebrate handling ⚠️ | No UF-specific course found — LAB competency: species-appropriate handling, anesthesia and euthanasia per the approved protocol (AVMA), humane endpoints, water quality. | LAB | per protocol |
| SAF-64 | Controlled substances `EHS900` ✅ | Only if using DEA-scheduled substances — e.g. **MS-222/tricaine** where scheduled. | UF | Initial |
| SAF-65 | Zoonoses awareness ⚠️ | Leptospirosis, *M. marinum*, *Aeromonas*, *Vibrio vulnificus*, *Salmonella*, avian influenza. Report febrile illness after field work **and tell the clinician about the exposure**. | LAB | Ann |
| SAF-66 | Heat stress `EHS819` ✅ | Annual. Relevant to Florida and Kenya field crews. | UF | **Ann** |
| SAF-67 | Hydrofluoric acid `EHS901` ✅🔒 | **Only if** the lab does HF-based silica/diatom digestion. Non-negotiable if so, with in-date calcium gluconate gel stocked. In-person. | UF | **2y** |
| SAF-68 | Respiratory protection `EHS843` / `EHS846` ✅ | Only if a risk assessment requires a respirator. Requires medical clearance + fit testing. | UF | **Ann** |
| SAF-69 | Laser safety `EHS833a` ✅ | Confocal microscopes, flow cytometers and some plate readers are Class 3B/4. Confirm whether the lab's instruments are enclosed Class 1. | UF | Initial |
| SAF-70 | Radiation `EHS830` / X-ray `EHS840` ✅ | Only if radioisotopes (³²P/³⁵S/¹⁴C) or an irradiator/XRD are used. | UF | Initial |
| SAF-71 | Responsible Conduct of Research ✅ | UF runs R4I@UF. **NSF and NIH mandate RCR for supported trainees.** Exact course varies by funder and college — confirm with the graduate coordinator. | UF | per funder |
| SAF-72 | First Aid / CPR / AED ⚠️ | **No UF EHS course code found.** Source externally (Red Cross / AHA). Recommend for at least two members of any field team. | EXT | **2y** |

---

# 2. BEN — Core Bench Technique
**27 skills · 17 core.** Nearly everything downstream depends on BEN-01 and BEN-02.

| ID | Skill | Competent means | Prereq | Recert | ★ |
|---|---|---|---|---|---|
| BEN-01 | **Air-displacement pipetting** 🔒 | Pre-wetting, plunger-stop control, immersion depth and angle, dispense technique; reverse pipetting for viscous or foaming reagents; visibly consistent volumes across a strip. | SAF-11 | Ann via BEN-02 | ★ |
| BEN-02 | **Gravimetric pipette verification** | Runs a 10-replicate gravimetric check at nominal / mid / low volume on an analytical balance, computes %error and %CV, compares to ISO 8655-style limits, and quarantines out-of-spec pipettes. | BEN-01, BEN-05 | **Ann, per pipette, per user** | ★ |
| BEN-03 | Multichannel pipetting into 96/384 plates | Even tip loading, no cross-column carryover, consistent depth across all channels, **A1 orientation confirmed every time**. | BEN-01 | L6 | ★ |
| BEN-04 | Positive-displacement / repeater pipettes ⚠️ | Uses repeaters for master mix, positive-displacement tips for viscous or volatile reagents; knows when each is required. | BEN-01 | — | |
| BEN-05 | Analytical & top-loading balance | Levels, tares, uses the draft shield, weighs by difference, recognizes static and buoyancy artifacts, logs daily check-weight results. | SAF-01 | Ann | ★ |
| BEN-06 | Balance check-weight verification ⚠️ | Runs and documents a class-appropriate verification; escalates drift. | BEN-05 | Ann | |
| BEN-07 | Serial dilution design & execution | Designs an n-fold series to a target concentration, executes with tip changes and full mixing at each step, and can prove the result by measurement. | BEN-01, BEN-05 | L6 | ★ |
| BEN-08 | Molarity / %w-v / dilution math | C1V1, molarity, mass-to-molar and dilution-factor calculations without a template; catches unit errors. | — | — | ★ |
| BEN-09 | pH meter calibration & measurement | 2- or 3-point buffer calibration, checks slope, temperature compensation, stores the electrode in KCl **never water**. | BEN-05 | Ann | ★ |
| BEN-10 | Buffer & reagent preparation | Prepares TE, TBE/TAE, PBS, ethanol dilutions and kit adjuncts from first principles; labels with contents, date, preparer, expiry. | BEN-05, -08, -09 | — | ★ |
| BEN-11 | Molecular-grade water & reagent hygiene ⚠️ | Distinguishes nuclease-free / molecular-biology-grade / DI; aliquots to protect stocks; dates opened reagents. | BEN-10 | — | ★ |
| BEN-12 | **Fresh 80% ethanol for bead work** ✅ | Prepares 80% EtOH **the day of use** from absolute ethanol + nuclease-free water; understands why <70% strips DNA off beads during SPRI and ONT washes. | BEN-08, BEN-10 | — | ★ |
| BEN-13 | Aseptic / sterile technique at the bench | Clean work zone, sterile disposables, opens tubes and plates without touching interiors, and **can articulate their own contamination vectors**. | SAF-28 | Ann | ★ |
| BEN-14 | Biosafety cabinet / laminar flow operation ❓ | Verifies airflow and certification date, loads without blocking grilles, works 6″ inside the sash, decontaminates before and after. | SAF-29, -31 | Ann | |
| BEN-15 | Autoclave operation & load validation | Gravity vs liquid cycle, no over-packing, indicator tape plus periodic biological indicators, hot-liquid handling, cycle logs. | SAF-34 | Ann | ★ |
| BEN-16 | Glassware & labware decontamination ⚠️ | Runs the wash-and-rinse SOP; knows what may never be reused — tips, and autoclaved plastics destined for the robot. | BEN-15 | — | |
| BEN-17 | Benchtop microcentrifuge | Balances loads, **RCF vs RPM** and converts between them, respects rotor limits, responds to imbalance or noise. | SAF-42 | — | ★ |
| BEN-18 | Refrigerated / high-speed centrifuge | Pre-cools, seats and locks rotors, bucket-specific speed limits, checks for rotor corrosion, logs use hours. | BEN-17 | Ann | |
| BEN-19 | Plate & strip-tube spin-down | Uses plate carriers to collapse droplets and de-foam without splashing or seal failure. | BEN-17 | — | ★ |
| BEN-20 | Vortexing & plate mixing | Complete resuspension without aerosol or cross-well splash; **knows when vortexing is prohibited** — HMW DNA, nanopore libraries. | BEN-01 | — | ★ |
| BEN-21 | Bead-beating / mechanical homogenization | Selects bead type and matrix for the sample, balances the holder, correct speed and duration, cooling intervals, avoids cap failure and cross-aerosol. | BEN-20, SAF-29 | L12 | ★ |
| BEN-22 | Tissue homogenization (rotor-stator, cryogrinding) ⚠️❓ | Homogenizes animal, plant or sediment tissue with cleaning between samples and documented carryover control. | BEN-21, SAF-39 | L12 | |
| BEN-23 | Heat block / dry bath / water bath | Verifies actual vs setpoint with a thermometer, correct inserts, avoids condensation-driven cross-contamination. | — | — | ★ |
| BEN-24 | Vacuum manifold & pump ⚠️ | Sets and monitors vacuum for spin- or plate-format filtration, uses trap flasks, prevents cross-well aerosol. | — | — | |
| BEN-25 | Manual magnetic stand / plate handling | Positions plates so pellets form on the expected side, aspirates without disturbing the bead ring, judges dryness by eye. | BEN-01 | — | ★ |
| BEN-26 | Plate sealing: adhesive, foil, heat ⚠️ | Right seal for the downstream step (PCR-compatible, solvent-resistant, pierceable); full edge seal; no evaporation or cross-well leakage. | BEN-03 | — | ★ |
| BEN-27 | Multi-plate timing discipline ⚠️ | Runs a staggered multi-plate protocol without losing track; documents actual vs nominal incubation times. | BEN-13, SAF-24 | — | |

---

# 3. SAM — Sample Management, Cold Chain & Provenance
**13 skills · 10 core.** Under-taught and disproportionately responsible for lost projects.
None of this is vendor-documented — all ⚠️, all needs a lab-written SOP.

| ID | Skill | Competent means | Prereq | Recert | ★ |
|---|---|---|---|---|---|
| SAM-01 | **Sample ID scheme & labeling** 🔒 | Applies the lab's convention; uses cryo-rated labels and markers that survive LN2, −80 °C, ethanol and field conditions; never relabels ambiguously. | SAF-24 | — | ★ |
| SAM-02 | Barcode generation, printing, scanning ❓ | Generates 1D/2D barcodes tied to the sample database, prints on cryo-rated stock, scans into worklists without transcription. | SAM-01 | — | |
| SAM-03 | Chain of custody documentation | Records collector, datetime, site, GPS, method, preservative, custody transfers and storage transitions such that a sample's full history is reconstructable years later. | SAM-01, SAF-24 | Ann | ★ |
| SAM-04 | Aliquoting & subsampling strategy | Splits into working and archive aliquots to protect the master stock from freeze-thaw; documents aliquot lineage. | BEN-01, SAM-01 | — | ★ |
| SAM-05 | Freeze-thaw management | Tracks thaw cycles per aliquot; knows the degradation risk per analyte class (RNA > HMW DNA > amplicon > total DNA). | SAM-04 | — | ★ |
| SAM-06 | −20 / −80 freezer operation & etiquette | Locates, retrieves and returns boxes inside the door-open budget; rack/box/position addressing; responds to alarms. | SAM-01 | — | ★ |
| SAM-07 | Freezer inventory maintenance | Keeps the digital inventory synchronized with physical reality; finds any sample in one trip; runs periodic audits. | SAM-06, SAM-02 | Ann audit | ★ |
| SAM-08 | Liquid nitrogen dewar storage & retrieval 🔒 | Charges, monitors and retrieves safely; vapor- vs liquid-phase storage; cryovial explosion risk on warming. | SAF-39, SAM-06 | Ann | |
| SAM-09 | Cold-chain shipping incl. international | Packs, documents and ships under IATA/DOT rules including Kenya↔US permitting and temperature loggers. *(Overlaps SAF-43 to SAF-47 — link, don't duplicate.)* | SAF-43, SAM-03 | Ann | ★ |
| SAM-10 | Cold-chain excursion response | Executes the emergency transfer plan, documents the excursion, flags affected samples in the inventory. | SAM-06, SAM-07 | Ann drill | |
| SAM-11 | MIxS/MIMARKS metadata capture at collection | Captures the environmental and host metadata required for archive submission **at the time of collection, not retroactively**. | SAM-03 | per project | ★ |
| SAM-12 | **Plate map design & worklist generation** | Designs a 96-well layout that randomizes or blocks batch effects, places controls deliberately, and exports a machine-readable map for the robot and the sequencer. | BEN-03, SAM-01 | — | ★ |
| SAM-13 | **Control placement strategy** 🔒 | Places field blanks, extraction blanks, NTCs and mock communities at defensible positions and frequencies in every batch — and can justify the design. | SAM-12 | Ann | ★ |

---

# 4. FLX — Opentrons Flex: Hardware, Setup & Operation
**51 skills · 27 core.** ✅ throughout from Opentrons Flex documentation.
✅ **Confirmed: the lab has TWO Opentrons Flexes** — **Robin** (DNA extractions, 22
bookings, 6 users, the most-booked instrument in the lab) and **Batman** (**96-head
pipette**, set up for Zymo full-gene 16S library prep, 16 bookings, 5 users). Every row
below applies to both. `FLX-09` is core because of Batman.

### 4a. Orientation & safety

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| FLX-01 | System orientation & nomenclature | Names and points to gantry, z-axis carriage, pipette mounts, extension mount, deck slots, staging area (column 4), trash bin, waste chute, touchscreen, windows. | — | ★ |
| FLX-02 | **Safety & E-stop pendant** 🔒 | Can hit the E-stop from any working position; knows how to reset after one; understands pinch and crush points and that the enclosure is not an interlock substitute. | **Ann** | ★ |
| FLX-03 | Power-up, shutdown, recovery from power loss | Boots, shuts down cleanly from the touchscreen, knows what state labware and instruments are left in after an abrupt stop. | — | ★ |
| FLX-04 | Networking & connectivity | Wi-Fi / Ethernet / USB-to-computer; finds the robot IP; troubleshoots "robot not found". | Evt | ★ |
| FLX-05 | Booking, run logging & shared-instrument etiquette ⚠️ | Reserves time in the scheduler, leaves the deck clear and clean, reports faults, never overrides another user's setup. | — | ★ |

### 4b. Instruments — pipettes and gripper

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| FLX-06 | Pipette model literacy | Knows the six models (1-ch 1–50 µL, 1-ch 5–1000 µL, 8-ch 1–50 µL, 8-ch 5–1000 µL, 96-ch 1–200 µL, 96-ch 5–1000 µL), their ranges and mount occupancy; selects correctly for a target volume. | — | ★ |
| FLX-07 | Attach / detach a 1- or 8-channel pipette | Clears the deck, drives the gantry forward via Instruments, seats the pipette, torques with the hex driver, confirms detection. | L6 | ★ |
| FLX-08 | **Automated pipette calibration** 🔒 | Fits the probe to the correct nozzle, runs the guided routine to completion, confirms the saved calibration, and knows when recalibration is required — reattachment, relocation, suspect accuracy. | **Evt + Ann** | ★ |
| FLX-09 | **96-channel pipette installation** 🔒 | Detaches the right-mount z-axis carriage, installs the mounting plate, mounts and secures the pipette, recalibrates. **Core — this is Batman's configuration.** Higher-risk: two-person recommended, `trainer`-only sign-off. | L6 | ★ |
| FLX-10 | **Attach / calibrate the Flex Gripper** | Mounts to the extension mount, runs pin-based calibration (front jaw then back jaw), returns the pin to storage. | **Evt + Ann** | ★ |
| FLX-11 | Gripper labware-compatibility judgement | Knows the gripper handles Opentrons Tough labware, Flex tip racks and lids, well-plate lids, most flat-bottom and PCR plates, and the NEST 195 mL reservoir — and that anything else needs gripper metadata in a custom JSON definition. | — | ★ |
| FLX-12 | Gripper paddle inspection & replacement | Treats paddles as wear items, recognizes grip degradation, replaces them. | quarterly | |
| FLX-13 | Calibration probe / pin custody | Retrieves and returns probe and pin every time; a missing pin blocks gripper calibration. | — | ★ |

### 4c. Deck, labware and positioning

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| FLX-14 | Deck slot addressing & physical layout | Reads and reproduces the A1–D3 deck map, removes and reseats deck slot panels, never mis-slots relative to the protocol. | — | ★ |
| FLX-15 | Deck configuration & fixtures | Configures trash bin, waste chute and staging-area slots in software to match the physical deck; knows the staging area (column 4) is gripper-access-only. | Evt | ★ |
| FLX-16 | Labware placement & seating verification | Every plate, reservoir and tip rack fully seated in correct A1 orientation; verified against the on-screen deck map before starting. | — | ★ |
| FLX-17 | Labware type literacy | Distinguishes Opentrons Tough labware, tip racks, adapters, reservoirs and third-party ANSI/SLAS labware; knows which need adapters. | — | ★ |
| FLX-18 | Using existing labware definitions | Selects the correct definition for a physical consumable and **recognizes when a lookalike plate is not the same definition**. | — | ★ |
| FLX-19 | Creating custom labware definitions | Uses Labware Creator or hand-edits JSON for a non-catalog consumable including gripper metadata; validates by test run before production use. | Evt | |
| FLX-20 | Labware offsets — concept | Explains default vs applied vs hardcoded offsets, and why an offset is specific to a labware/slot/module combination. | — | ★ |
| FLX-21 | **Labware Position Check (LPC)** 🔒 | Runs LPC end to end, jogs in 0.1/1/10 mm increments, judges tip-to-well-bottom and tip-to-well-center alignment by eye, saves offsets. | **per new protocol/labware; Ann skill refresh** | ★ |
| FLX-22 | Deciding when LPC is required | Knows to re-run after moving the robot, changing labware lots or vendors, reattaching a pipette, or changing module configuration. | Ann | ★ |
| FLX-23 | Tip rack loading, tip tracking, partial pickup | Loads full racks; knows the 96-channel adapter requirement; knows partial tip pickup requires racks **directly on the deck, not in the adapter**; reconciles software tip state with physical racks after a pause or abort. | L6 | ★ |
| FLX-24 | Trash bin vs waste chute management | Sets up the disposal path correctly, monitors fill level, clears jams safely. | — | ★ |
| FLX-25 | Reservoir & bulk-reagent deck prep | Calculates dead volume plus overage, fills 1-well and 12-column reservoirs without bubbles, correct slot and orientation, covers and labels during setup. | — | ★ |
| FLX-26 | Consumable qualification for automation ⚠️ | Verifies tips, plates and seals are the automation-compliant part numbers; knows reusing autoclaved labware on the Flex is discouraged. | — | |

### 4d. Modules — **closed; treat as one shared set**

Per the PI: don't split module skills per robot. The two Flexes are used for **DNA
extraction** and **full-gene 16S library prep**, and those two workflows define the module
set a trainee must know:

| Module | Why it's needed | Core? |
|---|---|---|
| **Magnetic Block** (FLX-27) | Zymo MagBead extraction — mandatory | ★ |
| **Heater-Shaker** (FLX-29) | Lysis and bead resuspension in the extraction | ★ |
| **Temperature Module** (FLX-28) | Elution and reagent holds | ★ |
| **Thermocycler GEN2** (FLX-30) | Confirmed by the booking note *"Barcoding and Thermocycling T3"* on Batman — so **on-deck barcoding and thermocycling is a real skill (AEX-20), not a bench one** | ★ |
| **HEPA/UV** (FLX-32) | Amplicon decontamination between batches | ★ |
| Absorbance Plate Reader (FLX-33), Stacker (FLX-34) | No evidence of either | drop |

Sign trainees off on the **module set**, not per machine. The one place a per-machine
sign-off is still warranted is `FLX-09` — only Batman has the 96-head.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| FLX-27 | **Magnetic Block** | Installs in a deck slot; understands it is **passive** — fixed neodymium magnets, unlike the OT-2 Magnetic Module, so engage/disengage is the gripper moving the plate on and off; selects compatible plate geometry. | — | ★ |
| FLX-28 | Temperature Module | Installs, connects, sets 4–95 °C, correct thermal block/adapter for the labware, understands ramp time and condensation. | — | ★ |
| FLX-29 | Heater-Shaker Module | Correct thermal adapter, heating to 95 °C and shaking 200–3000 rpm, latch/unlatch of the labware clamp, slot-adjacency movement restrictions. | — | ★ |
| FLX-30 | Thermocycler Module GEN2 | Occupies multiple slots; lid open/close under software control; lid temperature and profiles; **GEN2 is gripper-compatible and GEN1 is not supported on Flex**. | — | ★ |
| FLX-31 | Thermocycler seal inspection & cleaning | Cleans seals with diluted bleach per the maintenance guidance; inspects for wear and leakage. | quarterly | |
| FLX-32 | HEPA/UV Module | Runs positive-pressure HEPA (ISO-5 in ~15 min) and UV decontamination cycles; **never runs UV with a person exposed**; knows UV does not penetrate under labware. | Ann | ★ |
| FLX-33 | Absorbance Plate Reader Module ❓ | On-deck absorbance reads for normalization or OD; supported plate types; the calibration/reference read step. | — | |
| FLX-34 | Stacker Module ❓ | Loads and unloads the frame-mounted labware stacker; integrates it into high-throughput runs. | — | |
| FLX-35 | Module firmware / connection troubleshooting ⚠️ | Resolves "module not detected", USB and cable ordering issues, firmware update prompts. | Evt | |

### 4e. Running, recovering, maintaining

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| FLX-36 | **Touchscreen "Prepare to run" workflow** | Works the checklist to all-green: instruments attached and calibrated, deck hardware placed, offsets applied, labware and liquids confirmed, runtime parameters set. | — | ★ |
| FLX-37 | Opentrons App (desktop) | Transfers protocols, views the deck map and run preview, controls modules directly, uses the robot camera, manages robot settings. | — | ★ |
| FLX-38 | Touchscreen vs App | Articulates what is touchscreen-only (Quick Transfer), what is App-only, and what is equivalent. | — | |
| FLX-39 | Runtime parameters & CSV input at setup | Sets protocol-exposed parameters and supplies CSV inputs at run setup **without editing code**. | — | ★ |
| FLX-40 | Executing, pausing, monitoring a run | Starts, uses both run views, pauses and resumes safely, monitors step progress, **knows when a pause is safe vs destructive to the chemistry**. | — | ★ |
| FLX-41 | **Error recovery mode** 🔒 | Handles *no-liquid-detected* (refill+retry same tips / retry new tips / refill and skip / ignore and skip / cancel) and *pipette overpressure* (aspiration: retry new tips or cancel; dispense: skip with same or new tips, or cancel), and can justify the choice for the chemistry at hand. Requires software ≥8.0.0. | **Ann** | ★ |
| FLX-42 | Overpressure root-cause diagnosis | Distinguishes clogged tip, bent tip, tip sealed against the well bottom, and viscous reagent — and **corrects the cause rather than repeatedly retrying**. | Ann | ★ |
| FLX-43 | Tip-presence-sensor limitation | Knows the sensor is disabled for partial pickup of 1–3 tips, so pickup failures there are **not recoverable**, and designs and monitors accordingly. | Ann | ★ |
| FLX-44 | Manual intervention mid-run | Opens the enclosure, adds or replaces a reagent, resumes without breaking calibration or tip-tracking assumptions. | Ann | ★ |
| FLX-45 | Aborting a run & salvaging samples ⚠️ | Decides when to abort, recovers plates in a defined chemistry state, documents where in the protocol the abort occurred. | Ann | |
| FLX-46 | Run logs & post-run review | Pulls logs from the App or touchscreen, reads the error detail on a failed run, attaches logs to the batch record. | — | ★ |
| FLX-47 | **Routine cleaning** | *"If you can see it, you can clean it — if you can't see it, don't clean it."* Frame, windows, touchscreen, deck, deck slots, trash bin, waste chute, gantry, with 70% ethyl/isopropyl/methanol, 10% bleach, or distilled water — **never acetone**. Wipe → rinse with distilled water → air dry. | quarterly | ★ |
| FLX-48 | Pipette / gripper / module cleaning limits | Cleans pipette body, ejector and nozzles only; gripper body, jaws, paddles; module exteriors only. **Never disassembles or autoclaves** pipettes, gripper or modules. | quarterly | ★ |
| FLX-49 | **Nucleic acid decontamination of the deck** 🔒 | Runs the DNA-decontamination procedure (bleach, then ethanol/water rinse; UV where available) between amplicon-sensitive batches, and documents it. | **per amplicon batch; Ann recert** | ★ |
| FLX-50 | Relocating / re-levelling the Flex | Follows the relocation procedure; **knows relocation invalidates instrument calibration and all labware offsets**. `trainer`-only. | Evt | |
| FLX-51 | Software / firmware update management ⚠️ | Applies robot and App updates in a controlled window, verifies protocol API compatibility afterward, re-validates a known-good protocol before production. `trainer`-only. | Evt | |

---

# 4A. OT2 — Opentrons OT-2 ("Alfred" and "Ethan")
**12 skills · 8 core.** ✅ from Opentrons OT-2 documentation. **This category did not exist
in the first draft.** The OT-2 is not a small Flex — the differences below are exactly
where a Flex-trained person gets it wrong, so these are separate sign-offs, not a waiver.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| OT2-01 | OT-2 orientation & how it differs from the Flex 🔒 | Names the differences that actually bite: **manual deck calibration instead of the Flex's automated probe routine**; **11 numbered deck slots (1–11) + fixed trash in 12**, not the A1–D3 grid; **no gripper** — every plate move is a human hand; **active Magnetic Module** (engage/disengage in software) rather than the Flex's passive Magnetic Block; GEN2 P20/P300/P1000 pipettes with different volume ranges; no staging area, no waste chute. | — | ★ |
| OT2-02 | Power-up, shutdown, connectivity | Boots, connects over USB or Wi-Fi in the Opentrons App, shuts down cleanly. | — | ★ |
| OT2-03 | Pipette attach / detach | Seats a GEN2 pipette on the mount, torques correctly, confirms detection. | L6 | ★ |
| OT2-04 | **Deck calibration** 🔒 | Runs deck calibration with the calibration block or tip, jogs to the three cross-hairs accurately. **The OT-2's single largest source of crashes and mis-aspirations.** | **Evt + Ann** | ★ |
| OT2-05 | Tip length & pipette offset calibration | Runs tip-length calibration per pipette/tip-rack combination and pipette offset calibration; knows the dependency order (deck → tip length → offset). | OT2-04 | Ann | ★ |
| OT2-06 | Labware placement & labware offsets | Seats labware in slots 1–11 in correct A1 orientation; applies Labware Position Check where supported. | — | ★ |
| OT2-07 | Magnetic Module GEN2 | Installs, engages and disengages **in software** with correct height and dwell for the plate and bead chemistry — the concept that does *not* transfer from the Flex's passive block. | — | ★ |
| OT2-08 | Temperature Module GEN2 | Installs with the correct thermal adapter, sets 4–95 °C. | — | |
| OT2-09 | Thermocycler Module | Lid control, profiles, lid temperature. GEN1 **is** supported on OT-2 (unlike Flex). | — | |
| OT2-10 | Running and monitoring a protocol | Runs from the App, pauses and resumes safely, **understands the OT-2 has no error-recovery mode** — a failure ends the run, so dry-run validation matters more here than on the Flex. | — | ★ |
| OT2-11 | Cleaning & maintenance | Deck, frame and pipette exterior only; never disassembles or autoclaves a pipette. | quarterly | |
| OT2-12 | Deciding OT-2 vs Flex for a job ⚠️ | Routes work by throughput, module set and gripper need; knows Batman's 96-head is the reason to queue rather than fall back to an OT-2 for plate-scale work. | — | ★ |

---

# 5. FPY — Flex Protocol Authoring & Software
**17 skills · 6 core.** Grad-student / method-developer territory.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| FPY-01 | Using the Opentrons Protocol Library | Finds a vendor or kit protocol, reads its deck layout and reagent requirements, adapts sample count safely. | — | ★ |
| FPY-02 | Protocol Designer (no-code) | Builds a working transfer/mix/module protocol, exports it, and articulates what Protocol Designer **cannot** do relative to the Python API. | — | ★ |
| FPY-03 | Python Protocol API — structure & versioning | Valid skeleton: `requirements` dict (`robotType`, `apiLevel`), `metadata`, `run(protocol)`. Knows API level determines available features and must match robot software. | Evt | ★ |
| FPY-04 | Loading instruments, labware, modules, fixtures | Pipettes to mounts, tip racks, labware into slots and onto module adapters, trash bin and waste chute fixtures. | — | ★ |
| FPY-05 | Simple liquid-handling commands | transfer / distribute / consolidate, aspirate / dispense / mix / blow-out / touch-tip, flow rates and well-bottom offsets used deliberately. | — | ★ |
| FPY-06 | Complex liquid handling & bead tuning | Slow-aspiration, off-magnet resuspension and pellet-avoiding routines with tuned flow rates and z-offsets. | — | |
| FPY-07 | Gripper movements (`move_labware`) | Moves plates and lids between deck, modules, magnetic block and staging area with correct `use_gripper` semantics and drop offsets. | — | |
| FPY-08 | Module control in Python | Temperature, shaking, latch state, thermocycler profiles, including concurrent/non-blocking commands. | — | |
| FPY-09 | Partial tip pickup / nozzle configuration | Nozzle layouts for 8- and 96-channel partial pickup, correct rack placement, awareness of the 1–3-tip sensor limitation. | — | |
| FPY-10 | Runtime parameters & CSV-driven protocols | Defines user-adjustable parameters and CSV inputs so one protocol serves many sample counts and plate maps. | — | |
| FPY-11 | Liquid level detection & dynamic pipetting | Python-exclusive: tracks reservoir volume and adapts z-height. | — | |
| FPY-12 | **Simulation & dry-run validation** 🔒 | Simulates, then runs water-only on the real deck to catch collisions, wrong offsets and reagent-volume errors. **Mandatory per new or modified protocol.** | per protocol | ★ |
| FPY-13 | Version control of protocol files ⚠️ | Protocols live in git with a changelog; production runs cite a specific commit. | — | |
| FPY-14 | Quick Transfer (touchscreen) | Creates, saves and runs an ad-hoc transfer without writing a protocol. | — | |
| FPY-15 | Jupyter / SSH control of the robot | Interactive control and debugging; understands the risk of driving hardware outside protocol context. `trainer`-only. | — | |
| FPY-16 | **OT-2 → Flex protocol conversion** ✅ | Adapts deck layout (slots 1–11 → A1–D3), pipette names, trash and chute fixtures, and **active Magnetic Module → passive Magnetic Block + gripper moves**. **Real and load-bearing — the lab runs two OT-2s and two Flexes.** | — | ★ |
| FPY-17 | Protocol change control & re-validation ⚠️ | Any edit triggers simulation, dry run, and a documented re-validation before real samples. | Ann | |

---

# 6. AEX — Automated Nucleic Acid Extraction on the Flex
**20 skills · 11 core.** The core production workflow. AEX-01…10 are chemistry-agnostic;
AEX-11…16 are per-kit sign-offs — **seed only the kits the lab actually runs**.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| AEX-01 | Magnetic-bead extraction theory | Explains lyse → bind (chaotrope + bead surface chemistry) → ethanolic wash → dry → low-salt elute, and predicts what each failure mode does to yield and purity. | — | ★ |
| AEX-02 | Bead handling for automation | Beads fully resuspended and at RT before use; prevents settling in reservoirs during long runs; recognizes bead loss vs bead carryover in the eluate. | L6 | ★ |
| AEX-03 | On-deck magnetic separation timing | Judges and validates adequate separation time for the plate geometry and bead load; recognizes incomplete clearing. | — | ★ |
| AEX-04 | Ethanol wash & over-drying control | Wash volumes and aspiration heights leave no residual ethanol but stop short of over-drying (cracked pellets, poor elution); ties this to downstream A260/230 failures. | — | ★ |
| AEX-05 | Elution optimization | Chooses buffer and volume for the downstream application (sequencing vs qPCR), applies heat/shake/incubation, understands the yield-vs-concentration trade-off. | — | ★ |
| AEX-06 | **Cross-contamination control** 🔒 | Designs and executes tip-change discipline, aspiration-height discipline, lid and seal handling, and deck decontamination between batches — **and can trace a contamination event to a mechanism**. | **Ann** | ★ |
| AEX-07 | Extraction blanks & their interpretation 🔒 | Blanks in every plate, carried all the way through sequencing, with written decision rules for when a blank amplifies. | Ann | ★ |
| AEX-08 | Positive controls & mock communities | Runs a mock and/or known positive per batch and compares recovered composition against expectation as a batch-release criterion. | Ann | ★ |
| AEX-09 | Batch release & troubleshooting | Reviews the whole plate's yield and purity pattern (edge effects, column-wise trends, single-well failures), diagnoses mechanical vs chemical vs sample causes, decides pass or re-extract. | Ann | ★ |
| AEX-10 | Off-deck lysis pre-processing | Bead beating, proteinase K digestion, incubation — so plates enter the robot in a uniform, robot-compatible state. | — | ★ |
| AEX-11 | **Zymo MagBead extraction on Robin** ✅🔒 | **The lab's production extraction chemistry** — booking notes say "Zymo Magbead re-extraction". End-to-end including the DNase step where applicable; reagent layout, module usage, kit-specific failure modes; adapts input for the lab's real matrices (dolphin blow, water, sediment, wetland soil, animal faeces/middens, gut contents). | L6 | ★ |
| AEX-12 | ZymoBIOMICS 96 MagBead DNA on Flex ✅ | The 96-well microbiome-optimized variant with bead-beating front end; understands its lysis-bias profile for Gram-positives. Seed alongside AEX-11 if both are in use. | L6 | ★ |
| AEX-13 | Omega Bio-tek Mag-Bind on Flex ✅ | Environmental DNA / Blood & Tissue HDQ chemistry including its distinctive wash series; adapts input volumes for water-filter vs tissue. | L6 | ¹ |
| AEX-14 | Thermo MagMAX on Flex ⚠️ | Microbiome / Viral-Pathogen chemistry with the correct binding-bead mix and wash sequence. | L6 | ¹ |
| AEX-15 | Qiagen MagAttract PowerSoil Pro on Flex ⚠️ | Magnetic PowerSoil chemistry with its inhibitor-removal steps; understands why soil and sediment need them. | L6 | ¹ |
| AEX-16 | MACHEREY-NAGEL NucleoMag on Flex ✅ | NucleoMag chemistry for water and microbiome inputs. | L6 | ¹ |
| AEX-17 | Adapting a manual bead kit to the Flex ⚠️ | Translates a kit insert into an automated protocol: volume scaling, mixing surrogates, magnet timing, and a **documented manual-vs-automated equivalence study**. `trainer`-only. | Evt | |
| AEX-18 | **Automated cleanup / concentration (Alfred, OT-2)** ✅ | Bead-ratio cleanups and Zymo Clean & Concentrator runs with reproducible ratios — Alfred's booked purpose is literally "Clean and concentrate". Left/right size selection where needed. | L6 | ★ |
| AEX-19 | **Automated normalization & pooling (Ethan, OT-2)** ✅ | CSV/runtime-parameter-driven normalization by concentration and **equimolar pooling** — the lab's notes: "Library pooling", "equimolar pooling T3", "Pooling both plates", dilution series to 0.5/1/2/3 ng for dPCR loading. Runs on **Ethan**, so pair with the OT2 category. | — | ★ |
| AEX-20 | **Automated barcoding & thermocycling (Batman)** ✅ | On-deck master mix distribution, template addition, **barcode plate handling and Thermocycler GEN2 profiles** for the Zymo 96 full-gene 16S prep — booking note "Barcoding and Thermocycling T3". Maintains contamination separation from post-PCR material. Confirms Batman carries a Thermocycler GEN2. | — | ★ |

**Resolved: Zymo MagBead is the production chemistry.** AEX-13…16 (Omega Mag-Bind, Thermo
MagMAX, Qiagen MagAttract PowerSoil, MACHEREY-NAGEL NucleoMag) have no evidence of use —
move them to expansion or delete.

---

# 7. MEX — Manual Extraction & Purification
**14 skills · 7 core.**

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| MEX-01 | Nucleic acid chemistry fundamentals | Lysis chemistry, chaotropes, silica binding, ethanol precipitation, DNA vs RNA lability, and inhibitor classes (humics, polysaccharides, heme, urea). | — | ★ |
| MEX-02 | RNase-free working practice | Sets up and maintains an RNase-free zone — dedicated reagents, filter tips, surface decontaminant, glove discipline — and can explain why RNA work fails. | Ann | ★ |
| MEX-03 | Spin-column DNA extraction | Runs a silica spin-column kit to spec; recognizes overloading, incomplete drying and carryover; consistent yield and purity. | L12 | ★ |
| MEX-04 | Manual magnetic-bead extraction | Manual SPRI/mag-bead on a magnetic stand with correct incubation, wash and dry timing. | L12 | ★ |
| MEX-05 | Qiagen DNeasy PowerSoil Pro ✅ | Including bead-beating lysis and inhibitor removal; can explain why environmental matrices need IRT and how to spot residual inhibition downstream. | L12 | ★ |
| MEX-06 | DNeasy 96 PowerSoil Pro plate format ✅ | 96-well version with vacuum or centrifuge manifolds, maintaining plate-map integrity and avoiding cross-well contamination. | L12 | |
| MEX-07 | eDNA extraction from filters / Sterivex ✅ | In-cartridge lysis or membrane excision with sterile cutting tools and filter-blank controls. | L12 | ★ |
| MEX-08 | **Faecal / gut-content / midden extraction** ✅ | Appropriate lysis, inhibitor removal and BSL-2 containment for the lab's real matrices: rhino middens, bird caeca, fish guts, giraffe and gibbon faeces, dolphin blow. | L12 | ★ |
| MEX-09 | Swab-based extraction (skin / oral / host) ⚠️ | Low-biomass swabs with contamination controls appropriate to low-input work. | L12 | |
| MEX-10 | **RNA extraction** ✅ | Intact RNA at acceptable RIN; DNase treatment and verified removal; RIN checked on the TapeStation. **Core** — the BSC booking log shows RNA extraction as a recurring workstream (wetland soils, replicate sets, "prepping for JGI project"). | L12 | ★ |
| MEX-11 | **HMW DNA extraction for long reads** ⚠️🔒 | Wide-bore tips, no vortexing, minimal pipetting; verifies fragment length before nanopore prep. | L12 | ★² |
| MEX-12 | Ethanol / isopropanol precipitation | Correct carrier, salt, temperature and time; visible recoverable pellets. | — | |
| MEX-13 | **Inhibitor removal & rescue (Zymo OneStep)** ✅ | Diagnoses inhibition via qPCR spike or dilution series, then runs the **Zymo OneStep PCR Inhibitor Removal** kit or **Clean & Concentrator** — both appear repeatedly in the lab's bench notes, including a 96-well plate format. Knows when dilution or BSA is the better answer. Essential for wetland soil, sediment and faecal matrices. | Ann | ★ |
| MEX-14 | **Low-biomass extraction discipline** 🔒⚠️ | The extra controls, dedicated reagent lots and clean-space workflow low-biomass water and skin samples require; **can explain the kitome/contaminome problem and how the lab handles it analytically**. | **Ann** | ★ |

² Core — HMW extraction feeds the nanopore path, which is the lab's only sequencing route.

---

# 8. QC — Nucleic Acid QC & Quantification
**22 skills · 12 core.** DeNovix rows ✅ from the DS-11 user guide and TN-145.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| QC-01 | QC strategy: which assay answers which question | Chooses between UV absorbance (purity + rough conc.), fluorometry (accurate dsDNA conc.) and electrophoretic sizing (integrity/length), **and explains why they disagree**. | — | ★ |
| QC-02 | **DeNovix DS-11 microvolume operation** ✅ | Loads 1 µL cleanly on the pedestal, lowers the arm, blanks with the **matching** buffer, measures, and wipes **both** upper and lower surfaces with a dry lab wipe immediately after every reading. | L6 | ★ |
| QC-03 | **DS-11 nucleic acid apps & purity ratios** ✅ | Selects dsDNA / ssDNA / RNA sample type (factors 50 / 33 / 40 ng·cm/µL), reads A260/280 (~1.8 dsDNA, ~2.0 RNA) and A260/230 (1.8–2.2), and correctly attributes a bad ratio to dirty surfaces, wrong blank, carryover chaotrope or phenol, or a genuinely impure sample. | **Ann** | ★ |
| QC-04 | DS-11 baseline correction & spectrum reading ✅ | Sets and uses baseline correction (typically 750 nm), reads the full spectrum shape, recognizes the 230 nm and 270 nm contamination signatures, and knows the baseline setting **persists to subsequent measurements**. | — | ★ |
| QC-05 | DS-11 maintenance, diagnostics & verification ✅ | Cleans with dH₂O (**not** detergents or alcohol), runs Diagnostics self-test and Microvolume Pathlength Verification, understands SmartPath auto-pathlength and Bridge Testing, escalates rather than servicing internally. | **quarterly** | ★ |
| QC-06 | DS-11 cuvette mode & protein apps ✅ | Cuvette mode at the correct 8.5 mm Z-height; Protein A280 and microarray apps where relevant. | — | |
| QC-07 | ~~DeNovix QFX~~ | **DELETED — the lab has a DS-11, not a QFX.** Fluorometry is done on the Qubit (QC-09). | | |
| QC-08 | ~~QFX UHS / RNA / ssDNA assays~~ | **DELETED — same reason.** | | |
| QC-09 | **Qubit fluorometer** ✅ | Prepares working solution fresh at the kit's dye:buffer ratio, runs the two-point standard curve **fresh per assay**, picks the assay (dsDNA BR / HS / RNA) from expected concentration, uses thin-walled clear 0.5 mL tubes, avoids bubbles, incubates the full 2 min. 11 bookings by 4 people — the lab's stated position is that it is **more accurate than the Denovix** and it governs library input. | L6 | ★ |
| QC-10 | Reconciling UV vs fluorometric quantification | Explains why A260 over-reads relative to dsDNA-dye fluorometry (RNA, free nucleotides, protein) and knows **fluorometry governs for library input and pooling**. | — | ★ |
| QC-11 | Agarose gel electrophoresis | Casts at appropriate %, correct ladder, safe V/cm, images, and interprets bands for size, smearing, degradation and primer-dimer. | L12 | ★ |
| QC-12 | Gel documentation & stain handling | Operates the imager, handles intercalating stains with correct PPE and waste stream, archives images with sample IDs. | Ann | ★ |
| QC-13 | Long-fragment sizing awareness ⚠️❓ | Understands when standard agarose cannot resolve HMW DNA and what the alternative is. | — | |
| QC-14 | **TapeStation 2200** ✅ | Loads ScreenTape and reagents, runs genomic / D1000 / HS assays, vortexes and spins samples correctly, interprets DIN and RIN, uses smear analysis to get the **average fragment size that QC-20 depends on**, maintains the needles. The lab's only working sizing platform. | L12 | ★ |
| QC-15 | Bioanalyzer 2100 — **parked** | Status is `maintenance`; the lab's own note says "functional, but not currently hooked up or in-service." Seed as `active = false` and revive if it comes back. | L12 | |
| QC-16 | ~~Fragment Analyzer~~ | **DELETED — not owned.** | | |
| QC-17 | **SPRI / AMPure XP cleanup & ratio control** 🔒 | Executes a cleanup at a specified ratio with correct binding time, magnet clearing, **fresh 80% ethanol** washes, controlled drying and full elution — reproducibly, without bead carryover. | L6 | ★ |
| QC-18 | Size selection by bead ratio | Left-side, right-side and double-sided ratios to remove primer-dimer or select a window; **can predict the cut point from the ratio**. | Ann | ★ |
| QC-19 | Normalization to a target concentration | Computes and executes dilutions to a uniform ng/µL or nM across a plate, verifies by re-quant, documents the normalization table. | — | ★ |
| QC-20 | **ng/µL ↔ nM molarity conversion** 🔒 | Converts using average fragment size from electrophoretic sizing. **The #1 source of pooling error.** Requires a sizing platform (QC-14/15/16) — see open question #5. | Ann | ★ |
| QC-21 | Equimolar pooling | Pools multiplexed libraries to equimolar targets, accounts for pipetting minimums, verifies the pool by re-quant and sizing before sequencing. | L6 | ★ |
| QC-22 | QC acceptance criteria & batch release ⚠️ | Applies written pass/fail thresholds per sample type and documents the disposition of every failing sample. | Ann | ★ |

---

# 8A. PLT — Plate Readers & the Take3 Workflow
**7 skills · 4 core.** ⚠️ New category — the first draft missed this entirely. The Synergy
HTX + Take3 Trio is the lab's high-throughput DNA QC path, and it is *not* the same skill
as the Denovix.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| PLT-01 | **Synergy HTX + Take3 Trio microvolume plate** | Loads 2 µL per well across up to **48 samples**, blanks with the matching buffer, closes the lid, selects the right Gen5 protocol, and cleans **all three** Take3 surfaces between reads. Understands this is the same A260/A280/A230 chemistry as the Denovix, just parallelised — so the same purity-ratio interpretation (QC-03) applies and the same dirty-surface artifacts appear. | L6 | ★ |
| PLT-02 | Gen5 software: protocols, plate types, exports | Selects or builds a read protocol, sets the correct plate definition, exports results with sample IDs attached rather than as an unlabelled grid. | — | ★ |
| PLT-03 | Take3 pathlength & calibration awareness | Knows the Take3 uses a fixed short pathlength with a pathlength-correction step, that it is **less sensitive than a cuvette or the Denovix pedestal at low concentration**, and when to fall back to the Qubit. | — | ★ |
| PLT-04 | Standard 96/384-well absorbance reads | Runs plate-based colorimetric and OD assays with blanks and a standard curve; knows edge effects and evaporation over long kinetic reads. | — | ★ |
| PLT-05 | Fluorescence and luminescence modes ⚠️ | Selects filter cubes / excitation-emission pairs, sets gain, avoids saturation. | — | |
| PLT-06 | EPOCH and Eon as backups | Knows both are absorbance-only backups for the Synergy, and which protocols transfer. | — | |
| PLT-07 | Plate reader maintenance & verification ⚠️ | Runs the self-test, keeps the Take3 plate scratch-free, documents any drift. | quarterly | |

---

# 9. PCR — Amplification: PCR, Amplicon, qPCR
**23 skills · 14 core.**

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| PCR-01 | PCR theory & reaction components | Denature/anneal/extend, role of each component, polymerase choice (hot-start, high-fidelity, inhibitor-tolerant), and predicts the effect of changing each parameter. | — | ★ |
| PCR-02 | Master mix preparation & reaction setup | Correct overage, everything on ice or a cold block, template added last, mixed and spun down, low inter-replicate variance. | L6 | ★ |
| PCR-03 | Primer handling, resuspension, storage | Resuspends lyophilized oligos to a defined stock, makes single-use working aliquots, prevents stock contamination. | — | ★ |
| PCR-04 | Primer design basics | Tm matching, GC content, 3′ stability, hairpins, self- and hetero-dimers, amplicon length; in-silico specificity checks. | — | |
| PCR-05 | Thermocycler operation & programming | Programs and saves profiles, sets heated lid and ramp rates, understands block-position thermal variation, validates a new program before production. | — | ★ |
| PCR-06 | Gradient PCR & annealing optimization | Runs a gradient for a new primer set and interprets the gel or qPCR outcome. | — | ★ |
| PCR-07 | **Full-length 16S amplicon PCR (V1–V9)** ✅ | The lab's actual amplicon path: Batman is set up for **Zymo full-gene 16S library prep**, and sequencing is nanopore. Runs full-length 16S (27F/1492R-class primers, ~1.5 kb) rather than a short V4 region; understands why full-length changes everything downstream — species-level resolution becomes possible, but DADA2's Illumina error model does not apply and amplicon length dominates pooling molarity. Verifies by gel or TapeStation before proceeding. | L6 | ★ |
| PCR-07b | Short-region 16S (V4 / V3–V4) — reference only ⚠️ | Kept for reading the literature and for any outsourced Illumina run: EMP 515F(Parada)/806R(Apprill) V4 (`GTGYCAGCMGCCGCGGTAA` / `GGACTACNVGGGTWTCTAAT`, 25 µL, 35 cycles at 94/50/72, ~390 bp, triplicate reactions pooled per sample). **Not the lab's production protocol.** | L12 | |
| PCR-08 | ITS amplicon PCR (fungal) ⚠️ | ITS1/ITS2 amplification; understands the length-heterogeneity problem it creates for downstream sizing and pooling. | L12 | |
| PCR-09 | COI / 12S / 18S metabarcoding ⚠️ | The lab's metazoan and fish markers; primer degeneracy and host-blocking strategies. | L12 | |
| PCR-10 | **ONT barcoding / indexing for multiplexed amplicons** ✅🔒 | Replaces the Illumina two-step dual-index protocol, which has no instrument behind it here. Attaches ONT barcodes (rapid, native, or the kit's built-in 16S barcodes), manages the barcode plate so **no two samples in a pool share a barcode**, and keeps the barcode-to-sample map machine-readable so MinKNOW demultiplexes automatically. Knows barcode misassignment is this workflow's equivalent of index hopping. | **L6** | ★ |
| PCR-11 | **PCR contamination control / clean-room practice** 🔒 | Strict pre-PCR → post-PCR unidirectional workflow: separate rooms, hoods, pipettes and coats; filter tips; UV and bleach decontamination; **no amplicon ever enters the pre-PCR space**. Can articulate the specific contamination risk of an amplicon lab. | **Ann** | ★ |
| PCR-12 | NTC, extraction blank & positive controls | NTCs on every plate, blanks carried through, a positive control, and the written decision rule when an NTC amplifies — **not "just re-run"**. | Ann | ★ |
| PCR-13 | qPCR — SYBR / intercalating dye | Sets up dye-based qPCR, generates a standard curve, reads melt curves to confirm specificity and detect dimers, **rejects runs on melt-curve or efficiency grounds**. | L6 | ★ |
| PCR-14 | **Functional-gene qPCR assays (pmoA, mcrA)** ✅ | The lab's real qPCR targets are **methanotrophy (pmoA) and methanogenesis (mcrA) marker genes**, not just 16S — run on the QuantStudio 3 with 2–3 replicates per sample, one run per target (a ~3-day campaign per the usage log). Covers probe and dye chemistries, light-sensitive probe handling, and validation against a single-plex baseline. **These abundances are interpreted against the Picarro CH₄ flux data, so the standard-curve discipline in PCR-16 is load-bearing.** | L6 | ★ |
| PCR-15 | qPCR instrument operation ❓ | Programs the cycler, defines plate layout/targets/standards in software, **sets thresholds and baselines deliberately rather than accepting auto-defaults**. Must be written per instrument model — see open question #6. | L6 | ★ |
| PCR-16 | Standard curve & efficiency assessment | Builds a serial-dilution standard from quantified template; reports slope, E%, R²; applies acceptance limits (≈90–110% efficiency). | **Ann** | ★ |
| PCR-17 | eDNA qPCR assay validation: LOD / LOQ ✅ | Determines and reports LOD and LOQ following published eDNA-specific guidance (Klymus et al. / MIQE) rather than eyeballing the lowest standard that amplified. | per assay | ★ |
| PCR-18 | Inhibition testing in qPCR | Internal positive control, spike, or dilution series to detect inhibition in environmental extracts; applies the correct remedy. | Ann | ★ |
| PCR-19 | MIQE-compliant qPCR reporting ✅ | Records and reports the MIQE 2.0 minimum information set so the assay is publishable and reproducible. | Ann | |
| PCR-20 | Absolute quantification & copy-number math | Converts Cq to copies via the standard curve, propagates dilution, elution and filtration volumes back to copies per litre, and states uncertainty. | Ann | ★ |
| PCR-21 | **Absolute Q digital PCR** ✅ | **Microfluidic array plate, not droplet ddPCR** — no droplet generator, no oil, no separate reader; partitioning, thermocycling and imaging all happen in the one instrument on an MAP plate. Loads the plate without bubbles, applies isolation buffer correctly, sets the fluorescence thresholds deliberately rather than accepting auto-gating, and interprets Poisson-based absolute copies with confidence intervals. Knows the practical envelope the lab records: **4 samples minimum, 16 maximum, ~20 min prep, ~90 min run** — so batching decisions are part of the skill. Use for low-concentration eDNA targets where qPCR is at its limit. | L12 | ★ |
| PCR-22 | Reverse transcription / RT-qPCR ⚠️ | cDNA synthesis with appropriate priming, no-RT controls, correct interpretation. | L12 | |
| PCR-23 | PCR troubleshooting | Systematically diagnoses no-product, multiple bands, smears, dimers and NTC contamination, **changing one thing at a time**. | Ann | ★ |

---

# 10. SEQ — Library Preparation & Sequencing
**23 skills · 17 core.** ✅ **Resolved: the lab is nanopore-only, in-house, four devices
(MK1D, MK1c, MK1b-1, MK1b-2). There is no Illumina instrument.** §10a is cut from nine
skills to two; every §10b row is promoted to core.

### 10a. Illumina — reduced to a stub

The lab owns no Illumina sequencer and the booking history shows no core-facility pattern.
Keep two skills so an occasional outsourced run is still competent, and delete the rest.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| SEQ-01 | Short-read sequencing literacy | Explains clustering, paired-end reads, index reads, cluster density, %PF, Q30 and index hopping well enough to read someone else's Illumina data and to specify an outsourced run. | — | ★ |
| SEQ-09 | Core-facility submission workflow ⚠️ | Prepares the submission package (pool, QC data, sample sheet, metadata) to the receiving facility's spec and tracks the run to data delivery. | per facility | ★ |

**Deleted:** SEQ-02 (Illumina amplicon prep), SEQ-03 (DNA Prep/Nextera), SEQ-04 (index-set
management), SEQ-05 (NaOH denaturation), SEQ-06 (PhiX spike-in), SEQ-07 (MiSeq/iSeq run
setup), SEQ-08 (sample sheet / i5 orientation). None have an instrument behind them.

<details><summary>Original Illumina rows, retained for reference if a MiSeq ever arrives</summary>

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| SEQ-01 | Sequencing-by-synthesis fundamentals | Clustering, paired-end reads, index reads, cluster density, %PF, Q30, index hopping. | — | ★ |
| SEQ-02 | **Amplicon library prep to sequencer-ready pool** ✅ | Full amplicon-to-pool pipeline including both AMPure cleanups, fluorometric quant, dilution to a defined nM, and pooling of up to 96 indexed samples. | L6 | ★ |
| SEQ-03 | Illumina DNA Prep / Nextera XT shotgun ⚠️ | Tagmentation, post-tagmentation cleanup, indexing amplification, cleanup — hitting the target insert-size distribution. | L6 | |
| SEQ-04 | Index set management & hopping mitigation ⚠️ | Compatible unique-dual-index sets, colour balance for the platform chemistry, and an index-usage register to prevent reuse collisions. | Ann | ★ |
| SEQ-05 | Library denaturation & dilution ✅ | 0.2 N NaOH (5 µL 4 nM library + 5 µL NaOH, 5 min), neutralize/dilute per platform, load at the recommended concentration (≈4 pM on MiSeq for 800–1000 K/mm²). | L6 | |
| SEQ-06 | PhiX spike-in ✅ | Prepares and adds PhiX at the correct proportion (**≥5% for low-diversity amplicon libraries on MiSeq v3**) and explains why low-diversity runs require it. | Ann | |
| SEQ-07 | MiSeq / iSeq run setup & monitoring ❓ | Maintenance wash, cartridge and flow cell loading, sample sheet entry, run launch, real-time monitoring of cluster density, %PF, Q30 and error rate. | L6 | |
| SEQ-08 | **Sample sheet authoring & index orientation** 🔒 | Valid sample sheet with correctly oriented i5 index for the instrument's chemistry — **the single most common cause of a failed demultiplex**. | **Ann** | ★ |
| SEQ-09 | Core-facility submission workflow ⚠️ | Prepares the submission package (pool, QC data, sample sheet, metadata) to the receiving facility's spec and tracks the run to data delivery. | per facility | ★ |

</details>

### 10b. Oxford Nanopore — ✅ **CONFIRMED IN-HOUSE, four devices.** All rows core.

Platform note for `SEQ-21`: the lab runs **three generations at once** and they are not
interchangeable. **MK1b** (MinION Mk1B) is a dumb USB device — all basecalling happens on
the attached host, so it needs a GPU workstation or an offload path to HiPerGator.
**MK1c** has onboard compute and runs standalone. **MK1D** is the newest and is the one
whose MinKNOW version, basecalling models and flow-cell chemistry will diverge first.
A sign-off on one is **not** a sign-off on the others.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| SEQ-10 | Nanopore fundamentals ✅ | Motor protein, pore array, translocation, real-time basecalling, and **why input DNA length and purity dominate read length and pore longevity**. | — | ★ |
| SEQ-11 | Input QC for nanopore ✅🔒 | Confirms length, quantity and purity before prep; meets kit input specs (~1 µg or 100–200 fmol for LSK114 with >10 kb fragments; 200 ng gDNA for RBK114). **Skipping these checks is the leading cause of failed runs.** | Ann | ★ |
| SEQ-12 | Gentle DNA handling for long reads ✅ | Wide-bore tips; **flicks or inverts rather than pipettes or vortexes**; avoids repeated freeze-thaw. | Ann | ★ |
| SEQ-13 | SQK-LSK114 ligation library prep ✅ | DNA repair + end-prep (20 °C 5 min, 65 °C 5 min) → adapter ligation (LA + LNB + Salt-T4, 10 min RT) → AMPure cleanup choosing **LFB** (enrich >3 kb) vs **SFB** (retain all sizes) → EB elution 10 min → quant and loading-mass calculation. | L6 | ★ |
| SEQ-14 | SQK-RBK114 rapid barcoding ✅ | Transposase fragmentation+barcoding (30 °C 2 min, 80 °C 2 min), pooling, 1:1 AMPure cleanup, RAP adapter 5 min RT; can explain the trade-off vs ligation prep (~60 min vs hours; shorter reads, no end-repair). | L6 | ★ |
| SEQ-15 | SQK-NBD114.24/.96 native barcoding ✅ | End-prep → native barcode ligation → pooling → cleanup → adapter ligation, maintaining barcode-to-sample integrity across a 24- or 96-plate. | L6 | |
| SEQ-16 | 80% ethanol discipline in nanopore prep ✅ | Only freshly prepared **80%** ethanol — never <70%, because weaker ethanol elutes DNA off the beads prematurely. | Ann | ★ |
| SEQ-17 | Library Beads (LIB) handling ✅ | LIB beads settle very quickly and **must be mixed immediately before use**. | Ann | ★ |
| SEQ-18 | **Flow cell platform QC / pore count** ✅🔒 | Runs the flow cell check before every experiment; applies the warranty threshold (**≥800 pores for MinION/GridION**) as a go/no-go; files a warranty claim when below. | **Run** | ★ |
| SEQ-19 | **Flow cell priming** ✅🔒 | 20 min RT equilibration; priming mix (Flow Cell Flush + BSA to 0.2 mg/mL + Flow Cell Tether); **removes air bubbles at the priming port before priming — a bubble reaching the array causes irreversible pore damage**; loads 800 µl, waits 5 min, loads 200 µl more. | **Run + Ann** | ★ |
| SEQ-20 | SpotON library loading ✅ | Library in Sequencing Buffer + Library Beads, 75 µl dropwise via the SpotON port without introducing air. | Run | ★ |
| SEQ-21 | **MinION Mk1B / Mk1C / Mk1D operation** ✅ | Seats the flow cell, confirms thermal and electrical contact, manages device state across runs — **per platform**. Knows Mk1B basecalls on the attached host (needs a GPU box or an offload path), Mk1C is standalone with onboard compute, and Mk1D is the newest with its own MinKNOW and model set. **Sign off each generation separately.** | L6 | ★ |
| SEQ-22 | PromethION operation ✅❓ | Multi-flow-cell loading workflow. | L6 | |
| SEQ-23 | Flongle adapter & flow cell ✅❓ | Smaller-format priming; reduced-yield and no-wash constraints. | L12 | |
| SEQ-24 | MinKNOW run setup ✅ | Selects the correct kit so demultiplexing is automatic; sets run length, output format, basecalling model and barcoding options. | L6 | ★ |
| SEQ-25 | MinKNOW monitoring & intervention ✅ | Reads pore-occupancy, channel-state and translocation-speed plots; decides when to pause and wash vs let a run finish; distinguishes pore exhaustion from library problems. | Ann | ★ |
| SEQ-26 | Flow Cell Wash Kit EXP-WSH004 ✅ | Fresh wash mix (2 µl Wash Mix + 398 µl Wash Diluent, on ice, **not stored >1 day**); waste removal from port 1 with a P1000; 200 µl wash mix loaded slowly (≥5 s) through the priming port; 5 min; repeat; close and **wait 1 hour**; clear waste. Flow cell stays on the device throughout; never remove >20–30 µl when checking bubbles; never store with wash mix on the array. | L6 | ★ |
| SEQ-27 | Flow cell reuse tracking & storage ✅ | 500 µl Storage Buffer, 2–8 °C, logs wash cycles per flow cell (typically 3–6 reuses), retires on pore-count decline. | — | ★ |
| SEQ-28 | Flow cell inventory, warranty, returns ✅ | Tracks lot and expiry, initiates warranty returns for under-spec cells, never lets cells expire unused. | — | |
| SEQ-29 | Adaptive sampling ⚠️ | Reference-based enrichment or depletion (e.g. host depletion) configured in MinKNOW. | Ann | |
| SEQ-30 | Sequencing run failure triage ⚠️ | Given a poor run, distinguishes library, flow cell, loading and sample problems using pore-count history, prep QC and run telemetry. | Ann | ★ |

All nanopore rows are core: the lab owns four ONT devices and no other sequencer.

---

# 11. MIC — Microbiology & Culture — **recommend dropping**
**14 skills · 0 core. Recommend dropping the category entirely.** The live equipment
table has **no incubator, no shaking incubator, no anaerobic chamber, no microscope and no
plate-count workflow** — the only culture-adjacent asset is the Biological Safety Cabinet,
which is booked for clean molecular work. Seed these only if culture work happens on
shared equipment outside the lab's own inventory. Retained below for that case; all ⚠️.

| ID | Skill | Competent means | Recert |
|---|---|---|---|
| MIC-01 | Media preparation (broth and agar) | Weighs, dissolves, pH-adjusts, autoclaves, pours without bubbles or contamination; tracks batch/lot and sterility-check plates. | L12 |
| MIC-02 | Supplement & antibiotic addition | Heat-labile supplements post-autoclave at the right temperature; filter-sterilized stocks; working-concentration math. | — |
| MIC-03 | Aseptic transfer & streak plating | Well-isolated single colonies by quadrant streak, consistently, without contaminating plate or bench. | L12 |
| MIC-04 | Spread and pour plating with dilution series | Plate-count dilution series reported as CFU/mL within the countable range. | L12 |
| MIC-05 | Colony picking & purification | Picks single colonies to purity, re-streaks, documents isolate lineage. | L12 |
| MIC-06 | Colony PCR / isolate identification | Colony PCR (full-length 16S or Sanger-ready) linked back to the isolate record. | L12 |
| MIC-07 | Glycerol stock preparation & archiving | Correct final glycerol concentration, appropriate freezing, registered in the strain inventory. | — |
| MIC-08 | Strain revival from frozen stock | Revives without thawing the whole stock; confirms purity before use. | — |
| MIC-09 | Incubator operation | Sets and verifies temperature, humidity and shaking; loads without shadowing; logs and responds to alarms. | — |
| MIC-10 | Anaerobic chamber ❓🔒 | Airlock use, O₂/H₂ and catalyst monitoring, pre-reduced media, works without breaching anaerobiosis. | **Ann** |
| MIC-11 | Anaerobic jar / sachet methods ❓ | Jar setup with indicator strips as a chamber alternative. | — |
| MIC-12 | OD600 & growth curves | Blanks correctly, dilutes into the linear range, builds and interprets a growth curve. | L12 |
| MIC-13 | Microscopy: wet mount & Gram stain | Slide prep, Gram staining, light microscope through oil immersion. | L12 |
| MIC-14 | Culture waste decontamination | Autoclaves or chemically decontaminates all culture waste per BSL level with documented cycle verification. | Ann |

---

# 12. BGC — Biogeochemistry: Gas, Carbon & Water Chemistry
**16 skills · 7 core.** ✅ **Rebuilt against the real inventory.** The lab runs a **Picarro
G2508 cavity ring-down analyser** (Carr 518) for gas samples in exetainers, **"Tom and
Jerry"** for evacuating exetainers, and a **Shimadzu TOC analyser** (Subalusky Lab, Carr
518). **There is no gas chromatograph and no nutrient autoanalyzer** — the GC rows in the
first draft are deleted outright.

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| BGC-01 | **Exetainer preparation and evacuation ("Tom and Jerry")** 🔒 | Preps, caps and evacuates exetainers to the target vacuum, verifies the vacuum held, checks septum integrity, and labels so a vial's identity survives to the analyser. A leaking or under-evacuated vial is an invisible bad datapoint. | L12 | ★ |
| BGC-02 | Dissolved-gas headspace equilibration (CH₄, CO₂, N₂O) | Bubble-free collection, headspace equilibration with a known-composition gas, correct equilibration time and temperature, preservation, storage in gas-tight vials with correct septa. Records water temperature and barometric pressure — without them the dissolved concentration cannot be back-calculated. | L12 | ★ |
| BGC-03 | **Picarro G2508 operation** ✅ | Starts up, confirms the cavity is at temperature and pressure and the analyser is stable before the first sample, runs the sample-introduction sequence for exetainers, watches for cavity pressure and ring-down alarms, and shuts down properly. Understands CRDS measures **CH₄, CO₂, N₂O, NH₃ and H₂O simultaneously**, and that the water correction matters. | Ann | ★ |
| BGC-04 | Picarro calibration & drift control | Runs certified standards at the start, middle and end of a run, checks drift against acceptance limits, applies the water-vapour correction, and rejects a run on drift rather than correcting it after the fact. | **Ann** | ★ |
| BGC-05 | Picarro data reduction | Turns the raw time-series into per-vial concentrations: peak/plateau selection, carryover and memory-effect awareness between vials, blank subtraction, and propagation back to dissolved concentration and flux. | Ann | ★ |
| BGC-06 | Picarro maintenance & troubleshooting ⚠️ | Recognizes cavity contamination, leak symptoms in the sample line, and pump degradation; escalates rather than opening the optical cavity. | Ann | |
| BGC-07 | **Shimadzu TOC analyser — sample prep** | Filters and acidifies into pre-combusted vials, sparges inorganic carbon, uses the right vial and septum, and prepares blanks and check standards. | L12 | ★ |
| BGC-08 | Shimadzu TOC analyser — operation ⚠️ | Loads the autosampler, builds the calibration curve, monitors injection reproducibility and catalyst condition, interprets NPOC vs TC/IC, and recognizes when the combustion tube needs service. | Ann | ★ |
| BGC-09 | Filtration & preservation for water chemistry | 0.45 / 0.7 µm GF/F into acid-washed bottles, acidify or freeze per analyte, observes hold times. | Ann | ★ |
| BGC-10 | Acid-washing labware for trace analysis | Runs the acid-soak/rinse SOP; keeps trace-clean labware segregated from general labware. | Ann | |
| BGC-11 | Colorimetric nutrient assays on the plate reader | NH₄⁺, NO₃⁻/NO₂⁻, SRP run in 96-well format on the Synergy/Epoch with fresh standard curves, blanks and matrix-matched calibration; reports with detection limits. **Runs on PLT-04, not on an autoanalyzer.** | L12 | |
| BGC-12 | Total N / total P persulfate digestion | Safe digestion in an autoclave or block; quantifies the digest. | L12 | |
| BGC-13 | Chlorophyll-a extraction & determination | Filters, extracts in acetone or methanol dark and cold, reads with acidification correction where applicable. | L12 | |
| BGC-14 | TSS / ash-free dry mass | Pre-combusted pre-weighed filters, dried and combusted to constant mass, reported with method blanks. | L12 | |
| BGC-15 | Stable isotope sample preparation ⚠️❓ | Solids: dry, grind, acidify carbonate-bearing samples, weigh into tin/silver capsules. Water/dissolved: zero-headspace vials. **No IRMS in the equipment table — this is core-facility submission prep.** | L12 | |
| BGC-16 | **Analytical QA/QC: blanks, duplicates, spikes, CRMs** | A QC set in every analytical batch; computes recovery and RPD against written acceptance limits; documents the disposition of every failing sample. | **Ann** | ★ |

**Deleted from the first draft:** GC operation (FID/ECD/TCD), GC maintenance, segmented-flow
autoanalyzer, Winkler DO titration, alkalinity titration, isotope core submission QA — no
instrument and no booking evidence for any of them.

---

# 13. HPG — HiPerGator & Scientific Computing
**48 skills · 20 core.** ✅ throughout from `docs.rc.ufl.edu`, fetched 2026-08-08.

### 13a. Foundations

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| HPG-01 | Unix/Linux shell basics | Paths, `ls/cd/cp/mv/rm/mkdir`, wildcards, pipes and redirects, `grep/awk/sed/sort/uniq/cut`, `less`, `chmod`, absolute vs relative. | — | ★ |
| HPG-02 | Remote text editing | `nano` or `vim` without a GUI; **understands why Windows CRLF line endings break shell scripts** (relevant — this repo already has a CRLF/LF issue). | — | ★ |
| HPG-03 | File formats of the trade | Identifies and inspects FASTQ, FASTA, SAM/BAM, VCF, GFF/GTF, BIOM, TSV/CSV, `.gz`; **never opens a 40 GB FASTQ in Excel**. | — | ★ |
| HPG-04 | Compression, archiving, checksums | `gzip/bgzip`, `tar`, `zcat`, `md5sum`/`sha256sum` to verify transfer integrity. | — | ★ |
| HPG-05 | Terminal multiplexing ✅ | `tmux` or `screen` so a dropped SSH session doesn't kill work. UF documents this as "Persistent Terminal Sessions". | — | ★ |
| HPG-06 | Path & naming discipline | No spaces or special characters in filenames; consistent, sortable, machine-readable names. | — | ★ |

### 13b. Access & account lifecycle

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| HPG-07 | **HiPerGator User Training** ✅ | Completed the online course **and passed the final quiz**. UF states plainly: *"Taking the Course is Required."* Free, via UF Professional & Workforce Development / Canvas; register at `go.ufl.edu/hpg-training`. **Not a myTraining item — it's a Canvas course, so there is no EHS-style code.** | Ann acct check | ★ |
| HPG-08 | Account request & the sponsor model ✅ | The **PI must have an account first** as group sponsor; the group needs ≥1 NCU compute and ≥1 BlSU blue storage allocation before member accounts are approved. | — | ★ |
| HPG-09 | Group & allocation literacy ✅ | Knows the lab's group name and its NCU and BlSU allocations; knows a free 3-month trial allocation exists for new groups. | — | ★ |
| HPG-10 | MFA + SSH login ✅ | `hpg.rc.ufl.edu` — **port 22 for password auth, port 2222 for SSH-key auth**; Duo MFA; generates and deploys a keypair; uses `~/.ssh/config`. | — | ★ |
| HPG-11 | Account expiration & offboarding ⚠️ | Accounts expire when UF affiliation ends; lab data must be migrated to group space before departure. UF documents an inactive-group **data removal** procedure. | at departure | ★ |
| HPG-12 | **Acceptable Use & regulated data** ✅🔒 | All HPG use falls under the UF Acceptable Use Policy. **HIPAA, FERPA, PII, PHI, ITAR or EAR data must NOT go on standard HiPerGator** — contact UFIT RC first; regulated work runs on HiPerGator-RV. | — | ★ |

### 13c. Interfaces

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| HPG-13 | SSH / login nodes ✅ | OpenSSH, PuTTY, Bitvise, MobaXterm, or the browser terminal. | ★ |
| HPG-14 | **Login-node etiquette** ✅🔒 | Can recite the rule: login nodes are for *"non-computational interactive work and very short tests of job scripts"* only. Never runs an assembly, BLAST, alignment or QIIME2 job there. Knows UF explicitly flags **"misusing IDE SSH connections"** (VS Code Remote-SSH spawning heavy language servers on a login node) as a common mistake. | ★ |
| HPG-15 | Open OnDemand ✅ | `https://ood.rc.ufl.edu/`; fills the SLURM resource form; uses "My Interactive Sessions"; knows Console + `module load` is the fallback for anything not listed. | ★ |
| HPG-16 | JupyterHub ✅ | `jhub.rc.ufl.edu` with preset resource profiles; **understands it is a job, not a free service**. | |
| HPG-17 | Galaxy on HiPerGator ✅ | `https://galaxy.rc.ufl.edu/`; knows when Galaxy fits (teaching, one-off, non-programmers) and when to drop to SLURM. | |
| HPG-18 | RStudio Server via OOD ✅ | Launches RStudio through OOD with an explicit memory and time request rather than running R on a login node. | ★ |
| HPG-19 | VS Code Remote Tunnel ✅ | Uses UF's documented Remote Tunnel workflow rather than naive Remote-SSH into a login node. | |
| HPG-20 | Graphical apps / `hwgui` ✅ | GUI apps via OOD or the `hwgui` partition (hardware-accelerated, max 4 days). | |

### 13d. Filesystems, quotas, storage hygiene

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| HPG-21 | `/home` ✅ | **40 GB per-user quota**; **daily snapshots kept ~1 week at `~/.snapshot/`**; for config, shell setup, scripts, documents. UF: *"Do not use `/home` job input and output."* | — | ★ |
| HPG-22 | **`/blue`** ✅ | Group-level, investment-based; the primary high-performance parallel filesystem and *"the primary location that should be used for all files read or written during job execution."* **Not backed up unless backup was separately purchased.** | — | ★ |
| HPG-23 | `/orange` ✅ | Group archival / near-line storage; inactive data or gentle sequential access; **cannot take intensive concurrent job I/O**; not backed up by default. | — | ★ |
| HPG-24 | `/red` 🔶 | Referenced in UF's quota FAQ but **no public page describes it**. Inferred: restricted/regulated storage tied to HiPerGator-RV. **Confirm with RC before publishing.** | — | |
| HPG-25 | Local scratch ✅⚠️ | `/scratch/local` on nodes is fast but ephemeral — **copy results back before job end**. | — | |
| HPG-26 | Quota checking ✅ | `module load ufrc` then `home_quota` / `blue_quota` / `orange_quota`; `ncdu` to find what's eating space; reads a "No Space Left" error, identifies *which* filesystem from the path, fixes it. | — | ★ |
| HPG-27 | Mount-on-demand gotcha ✅ | `ls /blue` won't show the group dir — it *"is automatically connected (mounted) when you try to access it"* — so `cd /blue/<group>` directly. | — | ★ |
| HPG-28 | Backup rule of three ⚠️🔒 | Can state where every dataset's ≥2 independent copies live; **treats `/blue` as not a backup**; raw sequence data has an off-HPG copy plus archive submission. | Ann audit | ★ |
| HPG-29 | Storage hygiene & cleanup ⚠️ | Deletes intermediates, compresses FASTQs, doesn't keep six copies of the same trimmed reads, migrates finished projects to `/orange`. | quarterly | ★ |

### 13e. SLURM

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| HPG-30 | Job script anatomy ✅ | `#!/bin/bash` + `#SBATCH`: `--job-name`, `--account`, `--qos`, `--partition`, `--cpus-per-task`/`--ntasks`, `--mem`/`--mem-per-cpu`, `--time`, `--output`/`--error`, `--mail-type`/`--mail-user`. Knows to `source /etc/profile.d/modules.sh` when `module` isn't available in a scripted context. | — | ★ |
| HPG-31 | `sbatch` ✅ | Submits scripts, passes variables with `--export`, overrides job name and output from the command line. | — | ★ |
| HPG-32 | `srun` interactive sessions ✅ | `srun <resources> --pty bash -i` instead of testing on a login node. | — | ★ |
| HPG-33 | `salloc` ⚠️ | Allocates resources for an interactive session. | — | |
| HPG-34 | **Partitions** ✅ | Chooses among `hpg-default`/`hpg2-compute` (general CPU), `bigmem`, `hpg-dev` (interactive/testing, **12 h max**), `gpu`, `hpg-ai`, `hwgui` (**4 days**). Uses `sinfo`. | — | ★ |
| HPG-35 | **Investment QOS vs Burst QOS** ✅ | Investment QOS = the group's purchased high-priority allocation, **max 744 h (31 days)**. Burst QOS = low-priority borrowing of idle capacity, **~9× the investment size**, **max 96 h (4 days)**, requested with `#SBATCH --qos=<group>-b`. UF warns: *"We do not guarantee that any individual jobs submitted to the Burst QOS will ever start."* | — | ★ |
| HPG-36 | QOS limit diagnostics ✅ | Reads pending reasons — `QOSGrpCpuLimit`, `QOSGrpMemLimit`, `Priority`, `Resources`, `Dependency`, `Reservation` — and knows which mean "wait", which mean "your group is full", and which mean "your script is wrong". | — | ★ |
| HPG-37 | GPU requests ✅ | `--partition=gpu` plus `--gres=gpu:1`, `--gres=gpu:a100:1`, `--gres=gpu:geforce:1`, or `--constraint=rtx6000`. Fleet includes A100 80 GB, RTX 6000, 2080Ti, 1080Ti. GPU/hpg-ai jobs run up to **14 days**; interactive `srun` there caps at 12 h; OOD Jupyter on gpu goes to 72 h. | — | ★⁵ |
| HPG-38 | Job arrays ⚠️ | `--array=1-N%k` with `$SLURM_ARRAY_TASK_ID` to process many samples as one submission; understands `%k` throttling. | — | ★ |
| HPG-39 | Monitoring: `squeue` / `sacct` ✅ | `squeue -u $USER` live; `sacct` historical — including UF-documented `sacct --batch` (recover the submitted script) and `sacct --env-vars`. | — | ★ |
| HPG-40 | **`seff` and right-sizing** ✅🔒 | Runs `seff <jobid>` and reads the job-completion email's memory estimate, then adjusts. **Understands why over-requesting is costly** — UF names it a top user mistake: it burns the group's NCU allocation, lengthens queue time, and starves labmates. Can say *"I requested 32 cores, `seff` showed 4% CPU efficiency, I'm dropping to 4."* | per project | ★ |
| HPG-41 | Threads ≠ speed ✅ | UF's warning that *"applications often require specific configurations to utilize multiple cores effectively"* — 16 cores does nothing if the tool is single-threaded or you didn't pass `-t 16`. | — | ★ |
| HPG-42 | `scancel` ✅ | Cancels by job ID or pattern, single or batch. | — | ★ |
| HPG-43 | Group usage reporting ✅ | `sreport` for group usage over a date range; `sacctmgr` to view allocation, submit limits and max walltime. | — | |
| HPG-44 | Job dependencies ⚠️ | Chains stages with `--dependency=afterok:<jobid>`. | — | |
| HPG-45 | **All work reads and writes from `/blue`** ✅ | UF: *"all computational work must originate from blue storage… This is a fast storage system that can handle the I/O involved in research workloads."* | — | ★ |

### 13f. Environment & software management

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| HPG-46 | **Lmod environment modules** ✅ | `module spider <name>` (the correct first step), `load`, `list`, `unload`, `purge`, the `ml` alias; knows `HPC_*_DIR`/`_BIN` env vars point at installed software. | ★ |
| HPG-47 | Personal modulefiles ✅ | Creates `~/modules`, writes versioned `.lua` modulefiles, activates with `module use ~/modules`. | |
| HPG-48 | Finding installed software ✅ | Searches UF's Installed Applications list before installing anything. | ★ |
| HPG-49 | **Why not bare `pip install`** ✅ | Can explain UF's warning in substance: packages land in one `~/.local/lib/python3.X/site-packages/`, *"will be loaded anytime python is used,"* and *"will interfere with the operation of applications installed by UFIT Research Computing."* | ★ |
| HPG-50 | conda / mamba ✅ | `module load conda`; named project-scoped environments; exports `environment.yml`. UF's conda module also ships mamba, pixi and uv. | ★ |
| HPG-51 | **Where conda envs live** 🔶 | **UF's own docs conflict — the lab must rule on this and write it down.** *Practical Storage* says put envs in `$HOME` for snapshot protection; but `/home` is only 40 GB and a handful of bioinformatics envs will blow it; UF's FAQ advises editing `.condarc` to *"change default directories for packages and environments"*; the container page says images belong on `/blue`. **Proposed lab rule (not UF policy):** set `envs_dirs` and `pkgs_dirs` in `~/.condarc` to `/blue/<group>/<user>/conda/{envs,pkgs}`, keep `environment.yml` in git so envs are rebuildable, accept they aren't snapshotted. | ★ |
| HPG-52 | Containers: Singularity → Apptainer ✅ | **Singularity is deprecated in favour of Apptainer** per UF. `exec`/`shell`/`run`; pulls from Docker Hub. **Images live on `/blue`** — UF: it *"is best suited for container image storage."* Symlinks `~/.singularity` to `/blue` for the Docker layer cache. | ★ |
| HPG-53 | Bind mounts ✅ | Creates `/blue`, `/orange`, `/scratch/local` inside locally-built images; `--bind` for host paths. | |

### 13g. Data transfer

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| HPG-54 | `scp` / `sftp` ✅ | To and from `hpg.rc.ufl.edu` or the dedicated `sftp.rc.ufl.edu`. | ★ |
| HPG-55 | `rsync` ✅ | `-avP`, `--dry-run`, `--partial`, resumable transfers, **trailing-slash semantics**, `--checksum`. | ★ |
| HPG-56 | Globus ✅ | UF calls it *"optimal for large files"* and advises **"Globus first"** for hundreds of MB to GB. Sets up an endpoint, installs Globus Connect Personal, runs a monitored transfer. | ★ |
| HPG-57 | GUI clients & the FileZilla trap ✅ | Cyberduck, WinSCP, BitVise, Tabby or MobaXterm. **UF explicitly states FileZilla "does not work well with the MFA setup on HiPerGator."** Configures SSH multiplexing to avoid repeated MFA prompts. | ★ |
| HPG-58 | **Sequencing-core retrieval** ⚠️🔒 | Pulls data from ICBR or a vendor, **verifies checksums**, files it into `/blue/<group>/…/00_raw/`, sets it read-only, logs it in the manifest. | ★ |

---

# 14. BIX — Bioinformatics Pipelines
**27 skills · 8 core.** Project-dependent; seed the amplicon path first.

### 14a. Amplicon — **full-length 16S on nanopore, taxonomy by Emu**

The lab's pipeline is not the Illumina/DADA2 one. Booking notes name **Emu** repeatedly
(*"Rerun emu with new database"*, *"Emu combine output"*, *"Rerunning Emu with Silva
database"*). `BIX-26` is therefore the **primary** taxonomy skill and `BIX-04`/`BIX-05`
(DADA2, QIIME2) are demoted — they assume short reads and an Illumina error model.

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| BIX-01 | Amplicon experimental design literacy ⚠️ | Primer choice, sequencing depth, **negative and mock-community controls**, batch and plate effects, contamination handling with `decontam`. | ★ |
| BIX-02 | Read QC ⚠️ | `FastQC` + `MultiQC`; interprets per-base quality, adapter content, duplication. | ★ |
| BIX-03 | Primer / adapter trimming ⚠️ | `cutadapt` (or `trimmomatic`/`fastp`); knows **primers must be removed before DADA2**. | ★ |
| BIX-04 | DADA2 — reference only ⚠️ | `filterAndTrim`, `learnErrors`, `dada`, `mergePairs`, `removeBimeraDenovo`, `assignTaxonomy`. **Not the lab's pipeline** — kept for reading the literature and for any outsourced short-read data. | |
| BIX-05 | QIIME2 — reference only ⚠️ | Artifacts (`.qza`) / visualizations (`.qzv`), provenance tracking, `feature-classifier`, diversity metrics, export to phyloseq. **Not the lab's pipeline.** | |
| BIX-06 | mothur ⚠️ | The standard mothur SOP as an alternative or legacy path; OTU clustering vs ASVs. | |
| BIX-07 | Reference databases ⚠️ | SILVA, GTDB, Greengenes2, UNITE (ITS), PR2 (18S), BOLD/MIDORI (COI); **records database name and version in methods**. | ★ |
| BIX-08 | nf-core/ampliseq — reference only ✅ | FastQC + Cutadapt → DADA2 ASVs → taxonomy → QIIME2 diversity → EPA-NG placement → MultiQC + R Markdown report. Prepares a TSV samplesheet, supplies forward and reverse primers, attaches metadata. Runs under Nextflow with Singularity on HPG. | ★ |

### 14b. Shotgun metagenomics

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| BIX-09 | Host / contaminant removal ⚠️ | Maps to host + PhiX and retains unmapped reads (`bowtie2`/`bwa`/`minimap2` + `samtools`). | |
| BIX-10 | Nextflow ⚠️ | Runs an nf-core pipeline end to end; HPG-appropriate config (SLURM executor, Singularity, `/blue` work dir); `-profile singularity`, `-resume`, `-r <version>`; reads the execution report and trace. | ★ |
| BIX-11 | Snakemake ⚠️ | Rules with wildcards, `config.yaml`, a SLURM profile, dry-run `-n`, DAG inspection, `--rerun-incomplete`. | |
| BIX-12 | nf-core/mag ⚠️ | QC → assembly → binning → bin QC → taxonomic annotation; interprets MAG quality (CheckM completeness/contamination, MIMAG tiers). | |
| BIX-13 | Kraken2 + Bracken ⚠️ | Classification then **abundance re-estimation with Bracken** — knows raw Kraken2 read counts are not abundances; sets a confidence threshold; **DB loading is the memory bottleneck and drives `--mem`**. | |
| BIX-14 | MetaPhlAn / HUMAnN ⚠️ | Marker-gene profiling, merged tables, function via HUMAnN; understands why MetaPhlAn and Kraken2 disagree. | |
| BIX-15 | Assembly ⚠️ | metaSPAdes/SPAdes vs MEGAHIT chosen on memory vs sensitivity; QUAST/metaQUAST evaluation; **typically a `bigmem` job**. | |
| BIX-16 | Binning ⚠️ | MetaBAT2 / MaxBin2 / CONCOCT, refinement via DAS Tool or metaWRAP, QC with CheckM2, taxonomy with GTDB-Tk, dereplication with dRep. | |
| BIX-17 | Functional annotation ⚠️ | Prodigal gene calling; eggNOG-mapper, KEGG/KOfam, dbCAN, antiSMASH; interprets pathway completeness. | |
| BIX-18 | Coverage & mapping-based abundance ⚠️ | Maps reads to contigs or MAGs, computes coverage and breadth, **distinguishes presence from abundance**. | |

| BIX-18b | **AMR gene identification** ✅ | Screens shotgun reads or assemblies against an AMR database (CARD / ResFinder / AMRFinderPlus); distinguishes gene presence from expressed resistance; reports database and version. Booking note: *"Kraken and AMR identification 5 shotgun samples"*. | ★ |
| BIX-18c | **MICOM community metabolic modelling** ✅ | Builds community-scale metabolic models from taxonomic abundance tables, runs cooperative trade-off flux balance analysis, interprets growth rates and exchange fluxes. The lab is actively extending the MICOM database to non-human hosts — *"Gorilla micom modelling"*, *"convert the MICOM database over to zoo animals"*. **New skill; the first draft had nothing for this.** | ★ |

### 14c. Nanopore-specific — **the lab's primary analysis path**, not optional

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| BIX-19 | Dorado basecalling ⚠️ | Runs Dorado on POD5 from raw signal; selects fast/hac/sup and understands the accuracy-vs-compute trade-off; **runs on a GPU partition with `--gres=gpu:a100:1`**; demultiplexes and trims adapters/barcodes; can do modified-base calling. | ★ |
| BIX-20 | Guppy (legacy) ⚠️ | Recognizes Guppy as Dorado's deprecated predecessor; reads legacy FAST5 output. | |
| BIX-21 | Long-read QC ⚠️ | NanoPlot / NanoComp / pycoQC; interprets read-length N50 and quality; filters with `filtlong`/`chopper`/NanoFilt. | ★ |
| BIX-22 | Flye ⚠️ | `--nano-hq` / `--meta`; interprets `assembly_info.txt` (circularity, coverage). | |
| BIX-23 | medaka ⚠️ | Consensus polishing with the model matched to the basecaller; knows polishing is often unnecessary with modern `sup` basecalls. | |
| BIX-24 | minimap2 ⚠️ | Correct presets: `-ax map-ont`, `-ax asm5/asm20`, `-x ava-ont`; pipes to samtools. | |
| BIX-25 | samtools ⚠️ | `view`/`sort`/`index`/`flagstat`/`depth`/`coverage`/`faidx`; SAM→sorted BAM in one pipe without an intermediate SAM. | |
| BIX-26 | **Emu — full-length 16S taxonomy** 🔒 | **The lab's primary classifier.** Runs Emu on demultiplexed full-length 16S reads, selects and *records* the database (the notes show both a custom database and **Silva** in use), understands Emu's expectation-maximisation abundance estimation and why it beats naive best-hit assignment on noisy long reads, combines per-sample outputs into one abundance table (`emu combine-outputs`), and knows **DADA2's Illumina error model does not transfer**. Re-running the whole set when the database changes is routine here — version the database in the methods. | ★ |
| BIX-27 | Field-sequencing data ops ⚠️ | Laptop storage planning, offline operation, getting POD5 back to HPG safely. | |

---

# 15. DAT — R, Version Control, Data Management & Reproducibility
**33 skills · 15 core.**

### 15a. R

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| DAT-01 | Base R | Vectors, factors, lists, data.frames, indexing, the `apply` family, functions, `str()`/`summary()`, reading help pages. | ★ |
| DAT-02 | tidyverse | `dplyr` verbs, `tidyr` pivots, `readr`, `stringr`, `purrr`, pipes, tidy-data principles. | ★ |
| DAT-03 | phyloseq | Builds a phyloseq object from ASV table + taxonomy + sample metadata + tree; `tax_glom`, relative abundance, prevalence pruning. | ★ |
| DAT-04 | vegan | Distance matrices (Bray-Curtis, UniFrac via phyloseq), NMDS/PCoA, `adonis2` PERMANOVA, **`betadisper` dispersion check**, `envfit`, alpha diversity; **understands compositional-data pitfalls and the rarefaction vs CLR/DESeq2 debate**. | ★ |
| DAT-05 | ggplot2 | Grammar of graphics; aesthetics, geoms, facets, scales, themes; publication export at correct DPI; colourblind-safe palettes. | ★ |
| DAT-06 | Differential abundance | Applies at least one of ANCOM-BC / ALDEx2 / DESeq2 / MaAsLin2 appropriately and interprets FDR correction. | |
| DAT-07 | **R Markdown / Quarto** | Produces a rendered report from code — **no manual copy-paste of numbers into a document**; parameterized reports; caching. | ★ |
| DAT-08 | renv | `renv::init`, snapshots `renv.lock`, restores elsewhere; explains why this plus git equals a reproducible analysis. | ★ |
| DAT-09 | R on HiPerGator ⚠️ | `module load R` in a batch job, or OOD RStudio with an explicit resource request; installs packages to a group-writable library on `/blue`, not `/home`. | ★ |

### 15b. Python

| ID | Skill | Competent means | ★ |
|---|---|---|---|
| DAT-10 | Python fundamentals ⚠️ | Types, control flow, functions, comprehensions, file I/O, `argparse` CLIs, exceptions. | |
| DAT-11 | pandas ⚠️ | CSV/TSV read-write, indexing and filtering, `groupby`, merge/join, reshape, missing data. | |
| DAT-12 | numpy / scipy / statsmodels ⚠️ | Arrays, vectorized ops, basic statistical tests. | |
| DAT-13 | Biopython / pysam ⚠️ | Parses FASTA/FASTQ, manipulates sequences, reads BAMs programmatically. | |
| DAT-14 | Jupyter discipline ⚠️ | **Restart-and-run-all before sharing**; notebooks for exploration, scripts for pipelines; strips outputs before committing. | |
| DAT-15 | Shell scripting for pipelines ⚠️ | Loops over samples, `set -euo pipefail`, exit codes, logging, parameterization. | ★ |

### 15c. Version control

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| DAT-16 | **UF Git & GitHub course** ✅ | Free self-paced 3-module Canvas course from UFIT RC, self-enrol code **`TWR9LR`** (`ufl.instructure.com/enroll/TWR9LR`). Not university-mandated — recommend the lab mandate it. | — | ★ |
| DAT-17 | Git fundamentals ⚠️ | `init`, `clone`, `status`, `add`, `commit` with a meaningful message, `log`, `diff`, `restore`, `revert`; understands the staging area. | — | ★ |
| DAT-18 | Branching & merging ⚠️ | Feature branches, `merge`, resolving a conflict calmly, `rebase` basics and when not to. | — | ★ |
| DAT-19 | **`.gitignore`; never commit data or secrets** 🔒⚠️ | Code and small metadata only — no FASTQs, no BAMs, no `.env`, no tokens, no participant-identifying files. **A committed secret is compromised even after deletion and must be rotated.** | Ann | ★ |
| DAT-20 | GitHub collaboration ⚠️ | Remotes, push/pull/fetch, forks, pull requests, code review, issues, protected `main`. | — | ★ |
| DAT-21 | Repo standards ⚠️ | Every project repo has a README (what and how to run), a LICENSE, `environment.yml`/`renv.lock`, and a documented directory layout. | per project | ★ |
| DAT-22 | Releases & Zenodo DOI ⚠️ | Tags a release at manuscript submission and mints a Zenodo DOI via the GitHub–Zenodo integration. | per paper | |

### 15d. Data management & archiving

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| DAT-23 | **MIxS / MIMARKS standards** ✅ | Picks the right GSC checklist — **MIMARKS-survey** (environmental marker gene), MIMARKS-specimen, MIMS (metagenome), MIGS, MISAG/MIUViG — applies the correct environmental package (water, sediment, host-associated, soil), and populates `lat_lon`, `collection_date`, `geo_loc_name`, `env_broad_scale`/`env_local_scale`/`env_medium`, `target_gene`, `pcr_primers`, `seq_meth`. | — | ★ |
| DAT-24 | **Sample naming convention** ⚠️🔒 | One documented scheme. IDs unique, sortable, ASCII, no spaces, encoding site/date/replicate. **The same ID travels field sheet → freezer box → extraction plate → sequencing submission → BioSample → analysis with zero renaming.** | — | ★ |
| DAT-25 | Sample manifest / metadata table ⚠️ | One authoritative tidy metadata table, one row per sample, version-controlled, with a data dictionary. **Knows Excel autocorrect mangles dates and gene names.** | continuous | ★ |
| DAT-26 | Raw-data immutability ⚠️🔒 | Raw sequencing data is write-protected, checksummed on arrival, never edited in place; all processing writes to new files. | — | ★ |
| DAT-27 | Directory structure convention ⚠️ | Consistent project skeleton (`00_raw/ 01_meta/ 02_processed/ 03_analysis/ 04_figures/ scripts/ envs/ docs/`) with a root README; raw is read-only. | per project | ★ |
| DAT-28 | Sample-to-sequence traceability audit ⚠️🔒 | Can trace any read file back through library → index → extraction well → aliquot → field sample → collection record, **and detect a plate-map/index mismatch**. | **Ann** | ★ |
| DAT-29 | Run-level QC interpretation ⚠️ | Reads FastQC/MultiQC or MinKNOW run reports well enough to decide **re-sequence vs proceed** — a wet-lab decision, not a bioinformatics one. | Ann | ★ |
| DAT-30 | **NCBI BioProject / BioSample / SRA submission** ✅ | Registers a BioProject, creates BioSamples with the correct MIxS-derived package, prepares the SRA metadata sheet, uploads via Aspera or FTP, tracks the `SUB#`, sets a release date or hold, records accessions in the manifest. **For human-associated work:** knows samples may carry human reads, that donors must have consented to unprotected public archiving, that **SRA can screen and remove human contaminant reads on request**, and that controlled-access human data goes to **dbGaP, not open SRA**. PI co-sign. | per dataset | ★ |
| DAT-31 | ENA submission ⚠️ | ENA as the INSDC mirror and its ERC checklist accessions (`ERC000014` = MIMARKS survey) — relevant with non-US partners. | — | |
| DAT-32 | Data repositories & DOIs ⚠️ | Deposits processed data and derived tables to Dryad or Zenodo, gets a DOI, cites it in the paper. | per paper | |
| DAT-33 | Data Management Plan ⚠️ | Drafts an NSF/NIH-compliant DMP. Knows the **NIH Data Management & Sharing Policy** applies to NIH awards. UF Libraries (ARCS) provides DMP support. | per proposal | |

### 15e. Conduct & reproducibility

| ID | Skill | Competent means | Recert | ★ |
|---|---|---|---|---|
| DAT-34 | End-to-end reproducibility ⚠️ | Can regenerate every figure and number in a manuscript from raw data with one documented command sequence. | per paper | ★ |
| DAT-35 | Methods-section writing ⚠️ | Every tool **with version**, every database **with version or date**, every non-default parameter, and the hardware/environment. | per paper | ★ |
| DAT-36 | Statistical honesty ⚠️ | No p-hacking; pre-specified comparisons; multiple-testing correction; reports effect sizes and n; distinguishes exploratory from confirmatory. | — | ★ |
| DAT-37 | Compute-cost citizenship ⚠️ | Right-sizes jobs, cleans scratch, doesn't camp on interactive sessions, doesn't submit 5,000 array tasks without telling the lab. | — | ★ |
| DAT-38 | **International sample data & sovereignty** ⚠️ | For Kenya-sourced material: an MTA, Nagoya/ABS considerations, in-country permits, and collaborator co-authorship and data-access agreements may govern what can be published or deposited — **settled before sequencing, not after**. Coordinates with UF Innovate (MTA) and UF RISC. | per project | ★ |
| DAT-39 | **AI / LLM tool use policy** ⚠️ | **Drafted from general principles, not a fetched UF policy — cross-check current UF Integrity/IT and Graduate School guidance before sign-off.** Proposed baseline: never paste unpublished data, human-subject data, MTA-covered collaborator data, export-controlled information or credentials into an external AI service; AI-generated code must be read, understood and tested — the trainee owns every line they commit; AI-generated text is disclosed per journal and Graduate School policy; AI is never an author; AI-suggested citations are verified to exist; prefer UF-licensed tools, which carry data protections consumer tiers do not. | Ann review | ★ |

---

# Suggested tracks (seed `skill_tracks`) — revised

| Code | Track | Audience | Contents |
|---|---|---|---|
| **T1** | **Lab Entry — Week 1** ⭐ seed first | Everyone | SAF-01…07, SAF-09…20, SAF-24, SAF-28…34 (BSC + autoclave + bio spill), BEN-01, BEN-05, BEN-17, BEN-20, SAM-01, SAM-06 |
| **T2** | **Molecular Bench Core** ⭐ seed first | All molecular trainees | BEN-02, BEN-07…13, BEN-19, BEN-21, BEN-25, BEN-26, SAM-04, SAM-12, SAM-13, MEX-01…03, QC-01…05, QC-09 (Qubit), QC-11, QC-14 (TapeStation), QC-17, PLT-01…03 (Synergy + Take3) |
| **T3** | **Flex Operator (run-only)** ⭐ seed first | Undergrads running Robin or Batman | FLX-01…06, FLX-13…18, FLX-20…30, FLX-32, FLX-36…49 |
| T3b | **OT-2 Operator** | Anyone using Alfred or Ethan | OT2-01…07, OT2-10, OT2-12 |
| T4 | **Flex Owner / Method Developer** | Grad students, lab manager | T3 + FLX-07…12, FLX-19, FLX-50, FLX-51, FPY-01…17 |
| **T5** | **Extraction Production (Robin — Zymo MagBead)** ⭐ | The lab's #1 workflow | T2 + T3 + AEX-01…12, AEX-18 (Alfred cleanup), MEX-13 (Zymo OneStep) |
| **T6** | **Full-gene 16S Library Prep (Batman — Zymo 96)** ⭐ | The lab's #2 workflow | T2 + T3 + FLX-09, FLX-30 (Thermocycler GEN2), AEX-19 (Ethan pooling), AEX-20 (on-deck barcoding), PCR-01…07, PCR-10…12, PCR-05 on the QuantStudio, QC-18…22 |
| T7 | **Functional-gene qPCR & dPCR** | pmoA/mcrA + bacterial assays | T2 + PCR-01…06, PCR-11…21 (QuantStudio 3 + Absolute Q), MEX-13 |
| T8 | **Nanopore Sequencing** | The lab's only sequencing route | T2 + MEX-11, SEQ-10…21, SEQ-24…28, BIX-19…25. **Sign off Mk1B / Mk1C / Mk1D separately.** |
| T9 | **HiPerGator Onboarding** | Everyone doing analysis | HPG-01…15, HPG-21…23, HPG-26…32, HPG-34…36, HPG-40, HPG-45…50, HPG-54…58, DAT-16…19 |
| **T10** | **Nanopore 16S Bioinformatics (Dorado → Emu)** | Analysis role | T9 + BIX-19…21, BIX-24, BIX-25, **BIX-26 (Emu)**, BIX-01…03, BIX-07, DAT-01…09, DAT-23…30 |
| T11 | **Biosample Compliance** | Anyone shipping or importing | SAF-43…53, SAM-03, SAM-09, SAM-11, DAT-38 |
| T12 | **Biogeochemistry (Picarro + TOC)** | Gas and carbon projects | T1 + BEN-05, BEN-09, BEN-10, BGC-01…09, BGC-16, PLT-04 |
| T13 | **Shotgun metagenomics** | Wetland soils, AMR, modelling | T9 + MEX-10/11, BIX-09…18c (Kraken2, MAGs, AMR, MICOM) |
| T14 | **RNA workstream + JGI submission** | JGI projects | T2 + MEX-02, MEX-10, QC-14 (RIN), SEQ-09, DAT-30 |
| T15 | **Animal-associated sampling compliance** ⚠️ | Anyone touching animal material | SAF-61 IACUC, SAF-62 Animal Contact Program, SAF-65 zoonoses, SAF-29 BSL-2 |
| ~~T12 old~~ | ~~Culture Microbiology~~ | — | **Dropped — no instrument support.** |

⭐ **T1 + T2 + T3 is the recommended first seed.** It maps onto what the booking data shows
people actually use, and it is ~90 skills rather than 218.

# Counts — revised against the live inventory

| Category | Total | v1 Core | Change from first draft |
|---|---:|---:|---|
| SAF Safety & compliance | 72 | 21 | BSC rows promoted (14 bookings) |
| BEN Core bench technique | 27 | 17 | — |
| SAM Sample management | 13 | 10 | — |
| FLX Opentrons Flex (Robin + Batman) | 51 | 27 | FLX-09 promoted — Batman has a 96-head |
| **OT2 Opentrons OT-2 (Alfred + Ethan)** | **12** | **8** | **new category** |
| FPY Flex protocol authoring | 17 | 7 | FPY-16 promoted — 2 OT-2s + 2 Flexes |
| AEX Automated extraction | 20 | 11 | — |
| MEX Manual extraction | 14 | 8 | MEX-11 HMW promoted — nanopore is the only path |
| QC Quantification & sizing | 20 | 12 | −QFX ×2, −Fragment Analyzer; +Qubit, +TapeStation |
| **PLT Plate readers & Take3** | **7** | **4** | **new category** |
| PCR Amplification | 24 | 15 | PCR-07 → full-length 16S; PCR-10 → ONT barcoding; PCR-21 → Absolute Q |
| SEQ Library prep & sequencing | 23 | 17 | Illumina 9 → 2; all nanopore promoted |
| MIC Microbiology — **recommend dropping** | 14 | 0 | no instrument support |
| BGC Biogeochemistry | 16 | 7 | rebuilt on Picarro + TOC + exetainers; GC deleted |
| HPG HiPerGator & computing | 48 | 20 | — |
| BIX Bioinformatics pipelines | 27 | 12 | nanopore path promoted |
| DAT R, git, data management | 39 | 22 | — |
| +BIX-18b AMR, BIX-18c MICOM, PCR-07b | +3 | +2 | from the booking notes |
| **Total** | **447** | **220** | |

**218 core across 29 active people is 6,300 cells.** Do not seed that. Recommended first
pass: **T1 Lab Entry + T2 Molecular Bench Core + T3 Flex Operator** — roughly 90 skills,
which covers what the booking data says people actually touch (Robin, Denovix, Compute
Power, Batman, the BSC, Qubit, QuantStudio). Add T8 Nanopore and T9 HiPerGator next
semester.

---

# Sources

**Opentrons Flex** — docs.opentrons.com/flex/ (index, installation/instruments,
system-description/pipettes, labware/gripper, modules, touchscreen/protocol-setup,
touchscreen/protocol-run, protocols/python-api, glossary, maintenance/cleaning);
opentrons.com/applications/nucleic-acid-extraction.
*(Two pages returned 403 — the deck-configuration page and the Protocol Designer page —
so FLX-15 and FPY-02 are built from glossary definitions and are worth re-verifying.)*

**DeNovix** — DS-11 Series user guide (PDF); TN-145 dsDNA High Sensitivity Assay protocol.

**Oxford Nanopore** — SQK-LSK114 ligation sequencing; SQK-RBK114 rapid barcoding;
EXP-WSH004 Flow Cell Wash Kit.

**Illumina / amplicon** — 16S Metagenomic Sequencing Library Preparation Guide
(15044223 Rev. B); Earth Microbiome Project 16S Illumina Amplicon Protocol.

**Framing, not deep-fetched** — Klymus et al. 2020 (eDNA LOD/LOQ, *Environmental DNA*);
MIQE 2.0 (*Clinical Chemistry* 2025); QIAGEN DNeasy PowerSoil Pro; protocols.io Sterivex
eDNA extraction; Opentrons Mag-Bind and magnetic-bead extraction app notes.

**UF Research Computing** — docs.rc.ufl.edu (training/new_user_training,
training/HiPerGator_training, quickstart/policies_procedures, quickstart/zero_hipergator,
quickstart/interfaces, quickstart/practical_storage, quickstart/computation, support/faq,
scheduler/, scheduler/slurm_commands, scheduler/partition_limits, scheduler/qos_limits,
scheduler/gpu_access, software/environment_modules, software/conda_environments,
software/apps/singularity, data_transfer/overview, interfaces/ood).

**UF EHS** — ehs.ufl.edu (training, **training/ehs-courses** ← the course catalog with all
codes quoted here, lab-safety, safety-surveys, chemical-safety, chemical-hygiene-plan,
chemical-inventory, biosafety, biosafety-levels, biohazard-project-registration,
shipping-and-transport, animal-contact-program, boating-dive-safety, occupational-medicine
medical-monitoring and bloodborne-pathogen); webfiles.ehs.ufl.edu/BioMan.pdf.
