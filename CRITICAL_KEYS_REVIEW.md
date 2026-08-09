# Critical quiz answer keys — PI review

Dutton Lab, University of Florida — prepared for Chris Dutton, 9 August 2026

Every question below is flagged `is_critical` in the training system. Critical questions are not
scored on a curve: a trainee must answer **100% of them correctly** to pass the skill at all, no
matter how well they do on the rest of the quiz. That makes each answer key load-bearing. If a key
is wrong, the correct real-world answer is marked wrong, every trainee who knows the material fails,
and the skill stays locked for the whole lab — there is no appeal path in the software and no way
round it except a PI waiver granted one person at a time. This review is the last line of defence
before that happens.

Work through the checkboxes and tick the ones you agree with. Where you disagree, **strike through
or annotate the line in this document rather than editing the database** — leave the wrong key
visible with your correction beside it, so the whole set of changes can be applied and re-checked
in one reviewed batch instead of drifting in one edit at a time. Prompts, options and explanations
below are reproduced verbatim from the database; the only thing added is the `✓` marking which
option the key currently treats as correct.

There are **167 critical questions across 51 skills**. The 17 with the worst failure mode are
listed first.

---

## Review these first

A wrong key on any of these causes physical harm, a regulatory violation, or destroys expensive
hardware. Everything else can wait for the second sitting.

| Skill | Question | Why it matters most |
| --- | --- | --- |
| [SAF-25 Q10](#saf-25) | A tube of animal sample splashes into your eye. What is the first thing you do? | Wrong key here teaches a delay before flushing a splashed eye. |
| [SAF-29 Q10](#saf-29) | Your protocol calls for bead beating rhino midden samples. Where must that step happen? | Bead beating outside the BSC aerosolises BSL-2 material across the room. |
| [SAF-31 Q10](#saf-31) | The BSC's certification sticker expired three months ago. What do you do? | An uncertified cabinet gives no containment; this key is the stop rule. |
| [SAF-34 Q10](#saf-34) | You need to autoclave two litres of media in a bottle. Which cycle do you select? | The wrong autoclave cycle flash-boils two litres of media into your face. |
| [SAF-34 Q30](#saf-34) | A labmate adds a tightly sealed bottle to your load. What do you do? | A sealed bottle in an autoclave is a pressure vessel. |
| [SAF-34 Q40](#saf-34) | A bag of waste has had bleach poured into it. Can it be autoclaved? | Bleach in an autoclave releases chlorine gas and destroys the chamber. |
| [SAF-39 Q10](#saf-39) | You need to move an open LN2 dewar to another floor. A colleague suggests you both ride up with it. What do you do? | Riding a lift with an open dewar is the classic cryogen asphyxiation death. |
| [SAF-39 Q20](#saf-39) | What PPE do you put on before opening a dewar? | Safety glasses instead of a face shield is a permanent eye injury. |
| [SAF-39 Q40](#saf-39) | You need to get dry ice to another building. A labmate suggests a sealed cooler in your car. What is wrong? | Dry ice sealed in a car cabin asphyxiates the driver. |
| [SAF-43 Q30](#saf-43) | You are shipping on dry ice. What must be true of the package and the paperwork? | Undeclared or unvented dry ice is a DOT/IATA violation and a burst package. |
| [SAF-43 Q40](#saf-43) | You need to get a Category B package to the airport. Can you drive it in your own car? | Dangerous goods in a personal vehicle is a personal regulatory liability. |
| [FLX-02 Q10](#flx-02) | Where should the E-stop pendant be before you start a run? | If the key says the pendant can live in a drawer, the E-stop is useless. |
| [FLX-02 Q50](#flx-02) | A tube has shifted and you want to straighten it while the gantry is moving. What is the correct action? | Reaching into a live gantry is the crush injury this whole skill exists to prevent. |
| [SEQ-19 Q30](#seq-19) | You have opened the priming port. What must happen before any priming mix goes in? | Skipping bubble removal destroys a flow cell before the library is even loaded. |
| [SEQ-19 Q70](#seq-19) | Mid-priming you see a bubble travelling toward the sensor array. What do you do? | A bubble reaching the array is irreversible loss of the whole flow cell. |
| [SEQ-26 Q70](#seq-26) | The washed cell will not be used again for a week. How do you store it? | Freezing or wash-mix storage writes off a reusable flow cell. |
| [QC-20 Q40](#qc-20) | A library is 10 ng/µL with a measured average length of 1500 bp. What is its molarity? | A wrong molarity key mis-loads every library the lab ever prepares. |

---

## Safety & Compliance

*38 critical questions across 11 skills.*

<a id="saf-01"></a>

### SAF-01 — Chemical Hygiene Plan (EHS869)  `critical risk`

- [ ] **Q10** A new undergrad wants to start pipetting tomorrow but has not taken EHS869 yet. What does the lab require?
  - a. They can start now as long as someone signs off later
  - b. They can start now if a trained person is in the room
  - **✓ c.** **They must complete EHS869 before any wet-lab work begins**
  - d. They only need it if they will handle chemicals
  - *Why: UF states it plainly: all researchers working in wet lab spaces must complete EHS869 before beginning work in the lab. It is the gate, backed by OSHA 29 CFR 1910.1450.*

- [ ] **Q30** You have your EHS869 certificate in hand. What still has to happen before you touch a bench?
  - a. Nothing further; the certificate alone clears you for bench work
  - b. You must first complete a second online EHS course
  - **✓ c.** **Roster entry in Gator TRACS, plus reading the lab CHP**
  - d. You must be issued a respirator and fit-tested for it
  - *Why: Two things follow the course before bench work: roster entry in Gator TRACS / LATCH with two emergency contacts, and reading the lab-specific CHP and the SOPs for the hazards you will handle.*

<a id="saf-02"></a>

### SAF-02 — Hazard Communication (EHS814)  `standard risk`

- [ ] **Q10** A labmate is about to pour bleach into the carboy holding Zymo MagBead lysis waste. What do you do?
  - a. Let them; the bleach neutralises the guanidinium
  - **✓ b.** **Stop them; guanidinium plus hypochlorite releases cyanide gas**
  - c. Let them, as long as it is done in a fume hood
  - d. Stop them; the mixture will foam over the carboy
  - *Why: Guanidinium thiocyanate mixed with hypochlorite releases cyanide gas. That is why bleach never goes into a lysis-waste container.*

- [ ] **Q50** You pick up an unfamiliar bottle from a shared shelf. What on the label tells you fastest what it can do to you?
  - a. The volume and the concentration
  - b. The supplier's catalogue number
  - **✓ c.** **The pictograms and the signal word**
  - d. The expiry date printed on the cap
  - *Why: The point of GHS training is being able to look at a bottle and know what it will do to you. The pictograms and signal word carry that at a glance.*

- [ ] **Q60** Which lab reagents are the guanidinium thiocyanate source that makes bleach contact dangerous?
  - **✓ a.** **The Zymo MagBead lysis and binding buffers**
  - b. The `70% ethanol` wash bottles
  - c. The agarose gel running buffer
  - d. The nuclease-free water stocks
  - *Why: Guanidinium thiocyanate is in the Zymo MagBead lysis and binding buffers. Knowing which reagents carry the hazard is what keeps bleach out of that waste stream.*

<a id="saf-03"></a>

### SAF-03 — General Biosafety (EHS853)  `standard risk`

- [ ] **Q10** A new wetland soil sample arrives and nobody knows whether it carries pathogens. How should primary handling be done?
  - a. BSL-1, since soil is environmental rather than clinical
  - b. No containment is needed until a pathogen is identified
  - **✓ c.** **BSL-2 practices, because infectious status is unknown**
  - d. BSL-3 practices until the sample has been screened
  - *Why: We handle animal-associated and environmental material of unknown infectious status, so BSL-2 practices are the default for primary sample handling.*

- [ ] **Q20** A labmate says the PI told them in the hallway that fish gut samples can be handled at BSL-1. Is that enough?
  - a. Yes, the PI's word is sufficient authorisation
  - b. Yes, provided a second person also heard it
  - c. Yes, if you note it in your lab notebook afterwards
  - **✓ d.** **No, it must be in writing for that sample type**
  - *Why: The default is BSL-2 unless the PI has ruled otherwise in writing for that specific sample type. A verbal comment does not lower containment.*

<a id="saf-25"></a>

### SAF-25 — Bloodborne Pathogens (EHS850G)  `critical risk`

- [ ] **Q10** A tube of animal sample splashes into your eye. What is the first thing you do?
  - a. Call your supervisor and wait for instructions
  - **✓ b.** **Flush immediately at the eyewash**
  - c. Drive yourself to the nearest urgent care
  - d. Make the bench safe first, then rinse
  - *Why: The post-exposure procedure is time-sensitive and starts with washing or flushing immediately. Reporting and medical evaluation come after.*

- [ ] **Q20** You have flushed the exposure site and you feel fine. What is required next?
  - a. Nothing further, as long as you have no symptoms
  - b. Write it up at the next lab meeting
  - c. Wait 48 hours and report only if symptoms appear
  - **✓ d.** **Report to your supervisor the same day**
  - *Why: Reporting to your supervisor the same day is part of the post-exposure procedure. Feeling fine does not remove that step.*

- [ ] **Q30** After reporting an exposure, where should you go for medical evaluation?
  - **✓ a.** **The designated occupational-medicine provider**
  - b. The nearest walk-in clinic
  - c. Your own primary care doctor next week
  - d. The campus student health pharmacy
  - *Why: Go to the designated occupational-medicine provider, not a walk-in clinic that has no idea what you were handling.*

- [ ] **Q50** You have occupational exposure but do not want the hepatitis B vaccine. What must happen?
  - a. You are barred from all sample handling work
  - **✓ b.** **A signed declination must be on file**
  - c. Nothing; the vaccine is optional and undocumented
  - d. You must repeat EHS850G instead of vaccinating
  - *Why: The departmental BBP program offers free hepatitis B vaccination, and either documented vaccination or a documented declination must be on file.*

<a id="saf-27"></a>

### SAF-27 — Biomedical Waste (EHS851)  `high risk`

- [ ] **Q10** You finish a Zymo MagBead extraction and have a bottle of binding waste. Which stream does it go to?
  - a. Red bag, because the sample was biological
  - b. Sharps container, because the tubes are rigid
  - **✓ c.** **Chemical waste, because it is chaotropic**
  - d. Regular trash once the beads have settled
  - *Why: MagBead binding waste is both biological and chaotropic, and it goes to chemical waste even though the sample was biological.*

- [ ] **Q20** You break a Pasteur pipette at the bench. Where does it go?
  - a. The sharps container
  - **✓ b.** **The glass box**
  - c. The regular trash, wrapped in paper towel
  - d. The red bag with other contaminated plastics
  - *Why: Broken glass and Pasteur pipettes go in the glass box. Not the sharps container, and not the regular trash.*

- [ ] **Q30** You have just finished with a needle. What is the correct next move?
  - a. Recap it carefully using one hand
  - b. Recap it using a bench-top recapping block
  - c. Bend the tip over before disposing of it
  - **✓ d.** **Put it straight into the sharps container uncapped**
  - *Why: Never recap a needle. It goes straight into the sharps container along with blades and anything else that can puncture.*

<a id="saf-16"></a>

### SAF-16 — Hazardous Waste Management (EHS809)  `high risk`

- [ ] **Q10** You start a fresh chemical waste container with the first millilitre of ethanol rinse. When must the label go on?
  - **✓ a.** **Now, when the first waste goes in**
  - b. Once the container is about half full
  - c. Once the container is full
  - d. When you submit the pickup request
  - *Why: Label the container when the first waste goes in, not when it is full. This is one of the most commonly broken rules.*

- [ ] **Q20** You find a waste carboy with a funnel resting in its neck between additions. How should you read that?
  - a. Fine; the funnel keeps the neck clean between additions
  - b. Fine, as long as someone is working in the room
  - **✓ c.** **It is an open container and must be closed**
  - d. Acceptable, provided it sits in secondary containment
  - *Why: Containers stay closed except when actively adding waste, and a funnel left in the neck counts as an open container.*

- [ ] **Q30** A waste container is labelled EtOH + GITC waste. What is wrong with it?
  - a. Nothing; those are standard chemical abbreviations
  - b. The two wastes belong in separate containers
  - c. The label is missing a start date field
  - **✓ d.** **Abbreviations are not labels; full chemical names are required**
  - *Why: GITC and EtOH are not labels. Guanidinium thiocyanate and ethanol are. Full chemical names are required.*

- [ ] **Q40** You have 20 mL of leftover ethanol rinse. Can it go down the sink because the volume is small?
  - a. Yes, if you flush it with plenty of water
  - **✓ b.** **No, nothing goes down the drain without explicit approval**
  - c. Yes, ethanol is exempt from the drain rules
  - d. Yes, if you dilute it below 10% first
  - *Why: Nothing goes down the drain without explicit approval, regardless of volume or dilution.*

<a id="saf-29"></a>

### SAF-29 — BSL-2 practices  `critical risk`

- [ ] **Q10** Your protocol calls for bead beating rhino midden samples. Where must that step happen?
  - a. On the open bench with a sash lowered nearby
  - **✓ b.** **Inside the biosafety cabinet**
  - c. On the bench, behind a splash shield
  - d. In a fume hood with the sash at working height
  - *Why: A biosafety cabinet is required for any aerosol-generating procedure, and bead beating is named as one.*

- [ ] **Q20** A labmate is aliquoting raw water in a lab coat and gloves but no eye protection. Is that acceptable?
  - a. Yes, eye protection is discretionary for small liquid volumes
  - b. Yes, if they are wearing prescription glasses
  - c. Yes, provided the volume is under one millilitre
  - **✓ d.** **No, eye protection is mandatory at BSL-2**
  - *Why: At BSL-2 the lab coat, gloves and eye protection are mandatory, not discretionary.*

- [ ] **Q30** You need to carry tubes of bird caeca slurry to a room down the hall. How do you move them?
  - **✓ a.** **In a leak-proof secondary container**
  - b. In an open rack held with both hands
  - c. In a cardboard tray lined with paper towel
  - d. In your gloved hands, one tube at a time
  - *Why: BSL-2 requires leak-proof secondary containers for both storage and transport.*

<a id="saf-31"></a>

### SAF-31 — Biosafety cabinet operation  `high risk`

- [ ] **Q10** The BSC's certification sticker expired three months ago. What do you do?
  - a. Use it but keep the sash lower than usual
  - b. Use it only for clean molecular setup
  - **✓ c.** **Stop and report it; do not use the cabinet**
  - d. Use it after running the blower for 30 minutes
  - *Why: UF requires annual certification for BSCs used at BSL-2. If the date has passed, stop and report it.*

- [ ] **Q20** Where should your hands and materials sit while you work in the BSC?
  - **✓ a.** **Four to six inches inside the sash**
  - b. Right at the front edge of the sash
  - c. Pressed up against the rear wall
  - d. Wherever the overhead light is brightest
  - *Why: Work four to six inches inside the sash, never at the very front edge, where containment is weakest.*

- [ ] **Q30** A labmate wants to flame a loop inside the BSC. Why is that not allowed?
  - a. It will set off the smoke detector in the room
  - b. It burns off the ethanol you used to wipe the surface
  - c. It automatically voids the cabinet's annual certification
  - **✓ d.** **The thermal plume disrupts laminar flow and can damage the HEPA**
  - *Why: No open flames in the BSC. The thermal plume wrecks the laminar flow and can damage the HEPA filter.*

- [ ] **Q40** You lay an absorbent pad across the work surface so that it covers the front grille. What is the problem?
  - a. The pad will wick ethanol down into the plenum below
  - **✓ b.** **Blocking the grille destroys the air curtain that gives containment**
  - c. The pad makes the surface too slippery for tube racks
  - d. Absorbent pads are not permitted at BSL-2 at all
  - *Why: Never block the front or rear grilles. That is what destroys the air curtain protecting you and the sample.*

<a id="saf-34"></a>

### SAF-34 — Autoclave operation  `high risk`

- [ ] **Q10** You need to autoclave two litres of media in a bottle. Which cycle do you select?
  - a. Gravity, because it is faster for bottled loads
  - **✓ b.** **The liquid or slow-exhaust cycle**
  - c. Either one; the cycle only changes the run time
  - d. Gravity, with the door cracked at the end
  - *Why: Liquids run on a liquid or slow-exhaust cycle. A gravity cycle will flash-boil them and you open the door onto a scalding mess.*

- [ ] **Q30** A labmate adds a tightly sealed bottle to your load. What do you do?
  - a. Run it, but choose a longer cycle
  - b. Run it, but stand it in a secondary tray
  - c. Run it, but reduce the chamber temperature
  - **✓ d.** **Reject it; sealed containers become pressure vessels**
  - *Why: Never autoclave sealed containers of any kind. They become pressure vessels.*

- [ ] **Q40** A bag of waste has had bleach poured into it. Can it be autoclaved?
  - **✓ a.** **No; it releases chlorine gas and corrodes the chamber**
  - b. Yes, if it is double-bagged first
  - c. Yes, but on a gravity cycle only
  - d. Yes, if it is diluted with water first
  - *Why: Chlorinated plastics and anything containing bleach are never autoclaved. They release chlorine gas and corrode the chamber.*

- [ ] **Q60** The cycle just finished and you need your flasks of media right away. What is the safe move?
  - a. Open the door immediately; the cycle is over
  - b. Crack the door and reach in with nitrile gloves
  - **✓ c.** **Wait for depressurisation and cooling**
  - d. Pull them out quickly using folded paper towels
  - *Why: Superheated liquid can boil over minutes after the cycle ends. Wait for full depressurisation, then use heat gloves and face protection.*

<a id="saf-39"></a>

### SAF-39 — Liquid nitrogen and cryogens (EHS866)  `critical risk`

- [ ] **Q10** You need to move an open LN2 dewar to another floor. A colleague suggests you both ride up with it. What do you do?
  - a. Ride with it but hold your breath near the top
  - b. Ride with it if the trip takes under a minute
  - **✓ c.** **Send the dewar up alone and meet it upstairs**
  - d. Ride with it with the lid resting loosely on top
  - *Why: Never ride in a lift with an open dewar. One litre of LN2 becomes about 700 litres of gas, which displaces oxygen fast in a small space. Send it alone and meet it.*

- [ ] **Q20** What PPE do you put on before opening a dewar?
  - a. Safety glasses and nitrile gloves
  - b. A face shield and nitrile gloves
  - c. Safety glasses and cryo gloves
  - **✓ d.** **A face shield and cryo gloves**
  - *Why: PPE is cryo gloves plus a face shield. Safety glasses are not enough because the hazard is splash to the face.*

- [ ] **Q30** You must retrieve vials that were stored in the liquid phase of a dewar. What do you do after pulling them out?
  - a. Warm them quickly in your gloved hand
  - **✓ b.** **Let them vent behind a shield before handling**
  - c. Open them at once to release any pressure
  - d. Put them straight into a warm water bath
  - *Why: A vial stored in liquid phase can take LN2 in past the seal and burst on warming. Let vials vent behind a shield before handling.*

- [ ] **Q40** You need to get dry ice to another building. A labmate suggests a sealed cooler in your car. What is wrong?
  - **✓ a.** **Dry ice must never be sealed or carried in a car cabin**
  - b. Dry ice must be double-bagged before it goes in a cooler
  - c. Coolers are fine but the trip must stay under ten minutes
  - d. Only the sealing is a problem; the car cabin is fine
  - *Why: Dry ice carries the same asphyxiation risk: never in a sealed container, never in a walk-in cold room, and never in a car cabin.*

- [ ] **Q50** You get a cold burn on a finger from a splash of LN2. What is the correct first aid?
  - a. Rub the area briskly to restore circulation
  - b. Immerse it in hot water to rewarm it quickly
  - **✓ c.** **Flush with lukewarm water and get medical attention**
  - d. Apply ice to numb the area first
  - *Why: Cold burns look like thermal burns. Flush with lukewarm water, not hot, and get medical attention.*

<a id="saf-43"></a>

### SAF-43 — Shipping biological materials (EHS852)  `critical risk`

- [ ] **Q10** You pack a shipment but a labmate hands it to the courier. Do you need current EHS852 certification?
  - a. No, only the person who hands it over needs it
  - **✓ b.** **Yes, it applies to anyone who prepares or transports**
  - c. No, if the PI holds certification for the lab
  - d. Only if the shipment is leaving the country
  - *Why: The requirement applies to anyone who transports or prepares dangerous goods, not just whoever hands the box to the courier.*

- [ ] **Q20** You are shipping typical research specimens from a field site back to the lab. Which classification usually applies?
  - a. Category A, UN2814
  - b. Exempt animal specimen
  - c. Not regulated
  - **✓ d.** **Category B, UN3373**
  - *Why: Category B, UN3373, Biological Substance Category B, covers most diagnostic and research specimens. Category A is rare for this lab.*

- [ ] **Q30** You are shipping on dry ice. What must be true of the package and the paperwork?
  - **✓ a.** **Net mass of dry ice declared, and the package able to vent**
  - b. The package fully sealed so no gas escapes in transit
  - c. The dry ice mass noted on the inner bag only
  - d. No dry ice declaration needed for domestic shipments
  - *Why: Dry ice is separately regulated as UN1845, Class 9. The net mass goes on the airway bill and the package must vent, never fully sealed.*

- [ ] **Q40** You need to get a Category B package to the airport. Can you drive it in your own car?
  - a. Yes, if it rides in the boot and not the cabin
  - b. Yes, as long as the trip stays on campus
  - **✓ c.** **No, dangerous goods may not travel in a personal vehicle**
  - d. Yes, if you hold current EHS852 certification
  - *Why: Dangerous goods may not travel in a personal vehicle. Use a state vehicle.*

---

## Core Bench Technique

*29 critical questions across 9 skills.*

<a id="ben-01"></a>

### BEN-01 — Air-displacement pipetting  `critical risk`

- [ ] **Q10** You are aliquoting a master mix containing a lot of enzyme into eight tubes. Which technique, and why?
  - a. Forward pipetting, because master mix is not a viscous liquid
  - b. Reverse pipetting, because it uses less master mix per tube
  - c. Forward pipetting, because the blow-out step guarantees full delivery
  - **✓ d.** **Reverse pipetting, because it removes blow-out variability between replicates**
  - *Why: Reverse pipetting is the method for master mixes: it removes the blow-out variability that shows up as inter-replicate scatter in qPCR.*

- [ ] **Q20** You need to transfer 80 uL. A P1000 sits on the bench; a P200 is in the drawer. Which do you use?
  - a. The P1000, set carefully and pre-wetted twice
  - **✓ b.** **The P200, because 80 uL sits better within its range**
  - c. Either one, because both cover 80 uL
  - d. The P1000, since 80 uL is within its stated range
  - *Why: A P1000 set to 80 uL is worse than a P200 at 80 uL. Pick the pipette whose range fits the volume, not the nearest one to hand.*

- [ ] **Q50** Volumes are consistently a little short and you can see spray inside the tip. Which fault best explains this?
  - a. Using reverse pipetting for glycerol
  - b. Pausing a beat before withdrawing the tip
  - c. Immersing the tip 2-3 mm into the liquid
  - **✓ d.** **Releasing the plunger too fast**
  - *Why: Fast plunger release is the single biggest cause of aerosol and short draws. Release slowly and pause before withdrawing.*

<a id="ben-02"></a>

### BEN-02 — Gravimetric pipette verification  `high risk`

- [ ] **Q30** Ten dispenses at a 100 uL setting give a mean measured volume of 98.2 uL. What is the systematic error?
  - **✓ a.** **-1.8%**
  - b. -18%
  - c. -0.18%
  - d. +1.8%
  - *Why: Accuracy is mean measured minus nominal, as a percentage: (98.2 - 100) / 100 = -1.8%.*

- [ ] **Q50** Your P200 fails at its low volume, and it is the only P200 free today. What do you do?
  - **✓ a.** **Tag it, take it out of service, and log the result**
  - b. Note it in your own notebook and keep using it
  - c. Use it carefully, at the top of its range only
  - d. Re-run the check until it passes once
  - *Why: A failing pipette is tagged, removed from service and logged. An out-of-spec pipette quietly contaminates months of data.*

<a id="ben-03"></a>

### BEN-03 — Multichannel pipetting into plates  `high risk`

- [ ] **Q30** When do you confirm A1 orientation against the plate map?
  - a. At the end, when the plate is sealed
  - **✓ b.** **Out loud, before dispensing anything into the plate**
  - c. Only for plates that have no printed A1 marker or notch
  - d. After the first column, using the fill pattern
  - *Why: A1 is confirmed out loud, every plate, every time, against the notch or printed marker before anything is dispensed.*

- [ ] **Q50** You are adding master mix to wells that already contain sample. Where do you dispense it?
  - **✓ a.** **Against the well wall above the liquid**
  - b. Onto the well bottom, underneath the sample
  - c. Into the liquid, then mix by pipetting up and down
  - d. Against the well wall, just touching the liquid surface
  - *Why: Dispensing against the wall above the liquid keeps the tip out of the sample, so no sample is carried back into the master mix.*

- [ ] **Q60** The protocol says nothing about tips. What is the default when moving between columns?
  - a. Rinse the tips in buffer between columns
  - **✓ b.** **Change tips between columns**
  - c. Keep the same tips to reduce plastic waste
  - d. Change tips only after the final column
  - *Why: Tips are changed between columns unless the protocol explicitly says otherwise; carryover between columns is a real contamination route.*

<a id="ben-07"></a>

### BEN-07 — Serial dilution  `high risk`

- [ ] **Q10** Your written dilution plan needs a 0.5 uL transfer at one step. What do you do?
  - **✓ a.** **Redesign that step using larger intermediate volumes**
  - b. Accept it, since errors average out across the series
  - c. Pipette 0.5 uL twice and average the error
  - d. Use the smallest pipette available and go slowly
  - *Why: No step should require a volume below your pipette's reliable range; scale the step up rather than pipetting 0.5 uL.*

- [ ] **Q20** Why change tips at every step of a 10-fold series?
  - **✓ a.** **Liquid on the outside of the tip carries concentrate forward**
  - b. Tips warm up during handling and change the volume they hold
  - c. A used tip can no longer be pre-wetted
  - d. Tips lose their filter after a single use
  - *Why: Carryover on the outside of the tip is a real error source in a 10-fold series, so tips change at every step.*

- [ ] **Q30** How do you mix each dilution before drawing the next aliquot?
  - a. Flick the tube gently a few times before drawing
  - b. Invert the tube twice and proceed immediately
  - c. Let it stand for five minutes so the tube contents equilibrate
  - **✓ d.** **Pipette up and down 8-10 times, or vortex and spin down**
  - *Why: Complete mixing at every step is required; incomplete mixing at step 1 propagates through the whole curve.*

<a id="ben-10"></a>

### BEN-10 — Buffer and reagent preparation  `standard risk`

- [ ] **Q10** You need 50 mL of 10 mM Tris from a 1 M stock. How much stock do you take?
  - a. 0.05 mL
  - b. 1 mL
  - **✓ c.** **0.5 mL**
  - d. 5 mL
  - *Why: C1V1 = C2V2: (10 mM x 50 mL) / 1000 mM = 0.5 mL of stock, made up to 50 mL.*

- [ ] **Q20** How much NaCl (formula weight 58.44 g/mol) do you weigh for 250 mL of 1 M NaCl?
  - **✓ a.** **14.61 g**
  - b. 58.44 g
  - c. 29.22 g
  - d. 5.84 g
  - *Why: Mass = molarity x volume x formula weight = 1 mol/L x 0.25 L x 58.44 g/mol = 14.61 g.*

- [ ] **Q60** What must the label on a buffer you prepared carry?
  - **✓ a.** **Contents, concentration, date, initials and expiry**
  - b. Contents and date only
  - c. Contents, concentration and the source of the recipe used
  - d. Contents, your initials and the lot number
  - *Why: Every prepared reagent is labelled with contents, concentration, date prepared, initials and an expiry.*

<a id="ben-12"></a>

### BEN-12 — Fresh 80% ethanol for bead work  `high risk`

- [ ] **Q10** Why must the `80% ethanol` be made on the day you use it?
  - **✓ a.** **Ethanol absorbs water from the air and drifts weaker**
  - b. Diluted ethanol grows bacteria in the bottle overnight
  - c. Ethanol evaporates and the bottle runs low
  - d. Nuclease-free water degrades within a day
  - *Why: Ethanol is hygroscopic; an open bottle of 80% absorbs atmospheric water and drifts down over days.*

- [ ] **Q20** Your wash ethanol has drifted to about 68%. What happens on the beads?
  - **✓ a.** **DNA re-dissolves and is lost with the supernatant**
  - b. DNA binds even more tightly and will not elute later
  - c. Nothing, because 68% and 80% behave the same
  - d. Beads clump and no pellet forms
  - *Why: Below roughly 70% the DNA comes back off the beads and washes away with the supernatant.*

- [ ] **Q60** The bead pellet has gone cracked and chalky before you add elution buffer. What follows?
  - a. Residual ethanol will inhibit the next enzyme step
  - **✓ b.** **It will not fully re-elute, giving a bad A260/230**
  - c. Nothing, since dryness only matters during the wash
  - d. It re-elutes faster because it is fully dry
  - *Why: Air-dry only until the pellet loses its sheen; cracked, chalky pellets do not fully re-elute and that shows as a bad A260/230.*

<a id="ben-13"></a>

### BEN-13 — Aseptic technique at the bench  `high risk`

- [ ] **Q10** You spray the bench with `10% bleach` and immediately wipe it off with ethanol. What went wrong?
  - a. Bleach is only used after a run, not before
  - b. `70% ethanol` alone is required for biological decontamination
  - **✓ c.** **Bleach needs minutes of contact time to work**
  - d. Bleach must never be followed by ethanol
  - *Why: Contact time has to be honoured: bleach needs minutes, not a wipe, before the ethanol step.*

- [ ] **Q20** How should a PCR setup be sequenced and laid out?
  - a. Master mix after template, but with fresh gloves
  - b. Both at once, to keep handling time short
  - **✓ c.** **Master mix first, in a space away from template**
  - d. Template first, then master mix in the same space
  - *Why: Work clean-to-dirty: master mix is set up before template is handled, and in a different space.*

- [ ] **Q30** When are filter tips required?
  - a. Only when handling template DNA or extracted sample
  - b. Only inside the biosafety cabinet
  - c. Only for volumes above 100 uL
  - **✓ d.** **For anything touching sample or master mix**
  - *Why: Filter tips are used for anything touching sample or master mix.*

- [ ] **Q40** Why aliquot reagents instead of pipetting from the stock bottle?
  - a. Aliquots reach room temperature faster than a full stock bottle
  - **✓ b.** **One contaminated stock appears in every sample for months**
  - c. Aliquots are easier to label with an expiry
  - d. Stock bottles are too heavy to handle safely
  - *Why: A single contaminated stock bottle turns up in every sample you process for months, and it looks exactly like a real result.*

<a id="ben-21"></a>

### BEN-21 — Bead beating and mechanical homogenisation  `high risk`

- [ ] **Q30** The kit's bead tubes have run out, but a different bead type is on the shelf. What is the correct call?
  - **✓ a.** **Do not substitute; bead type changes the community profile**
  - b. Substitute; beads are interchangeable consumables
  - c. Substitute, and record it in the notebook as a minor deviation
  - d. Substitute, but halve the beating time
  - *Why: Swapping bead types changes what lyses and therefore your community profile, so it is a protocol change, not a substitution.*

- [ ] **Q40** Why check that every cap is fully seated before starting a run?
  - a. The instrument will not start with a loose cap
  - b. Loose caps let beads escape and throw the holder out of balance
  - **✓ c.** **A tube can open mid-run and cross-contaminate the whole holder**
  - d. A loose cap lets the sample cool too quickly
  - *Why: A tube that opens mid-run cross-contaminates the whole holder and creates a BSL-2 aerosol.*

- [ ] **Q50** The bead-beating run has just stopped. What do you do next?
  - a. Vortex the tubes briefly, then open them at the bench
  - **✓ b.** **Let the holder settle for a minute, then open it in the BSC**
  - c. Put the holder straight on ice and open it at the bench
  - d. Open the holder immediately to stop the heating
  - *Why: Let the holder settle for a minute so aerosols drop, then open it inside the biosafety cabinet.*

- [ ] **Q70** You have three tubes for a holder that takes a balanced load. What do you do?
  - **✓ a.** **Add a balance tube of equal mass opposite the odd sample**
  - b. Load them into the centre positions only
  - c. Run them; three tubes is a light load anyway
  - d. Run at half speed to compensate
  - *Why: The holder is always balanced; an unbalanced bead beater damages itself and can throw a tube.*

<a id="ben-25"></a>

### BEN-25 — Manual magnetic stand and bead handling  `high risk`

- [ ] **Q10** You take beads from the fridge, flick the tube once and pipette straight away. What are the two problems?
  - a. The beads clump permanently and the tube cannot be used
  - b. The ethanol wash will not wet the pellet
  - **✓ c.** **Cold beads bind poorly and the volume drawn is wrong**
  - d. Cold beads bind too tightly and will not elute
  - *Why: Beads are vortexed to full homogeneity and brought to room temperature: cold beads bind poorly, and settling beads mean the volume you pipette is wrong.*

- [ ] **Q30** Where do you put the tip to remove the supernatant?
  - a. Straight onto the bead pellet, drawing slowly
  - b. At the liquid surface, following it down quickly
  - **✓ c.** **Opposite the pellet, near the bottom, drawing slowly**
  - d. Anywhere, as long as the plate stays on the magnet
  - *Why: Approach from the side opposite the pellet with the tip near the bottom: beads you remove are yield thrown away, liquid you leave is carryover.*

- [ ] **Q50** The pellet still looks shiny, and you add elution buffer anyway. What is the consequence?
  - a. The pellet will not resuspend at all
  - b. Nothing, as long as the elution volume is correct for the plate
  - **✓ c.** **Residual ethanol carries over and inhibits downstream enzymes**
  - d. DNA elutes faster from a wet pellet
  - *Why: Shiny means residual ethanol, which inhibits downstream enzymes; dry until the pellet loses its sheen but is not cracked.*

- [ ] **Q70** What does the elution step require?
  - a. On the magnet, add buffer and wait
  - **✓ b.** **Off the magnet, resuspend fully, full incubation**
  - c. Off the magnet, a brief flick, then transfer at once
  - d. On the magnet, resuspend and then re-separate
  - *Why: Elution happens off the magnet with the beads fully resuspended and the full incubation time given.*

---

## Opentrons Flex (Robin & Batman)

*34 critical questions across 11 skills.*

<a id="flx-01"></a>

### FLX-01 — Flex orientation and nomenclature  `standard risk`

- [ ] **Q20** Mid-run you slide the front window open to nudge a tube back into place. What does the robot do?
  - a. Pauses until the window is closed
  - **✓ b.** **Keeps moving; windows are not an interlock**
  - c. Homes the gantry and waits
  - d. Cuts power to the gantry motors
  - *Why: The front and side windows are not a safety interlock, so the gantry keeps moving with the window open.*

<a id="flx-02"></a>

### FLX-02 — Flex safety and E-stop  `critical risk`

- [ ] **Q10** Where should the E-stop pendant be before you start a run?
  - a. Locked in the tool drawer
  - b. Anywhere in the room; runs are monitored
  - **✓ c.** **Within reach of where you stand**
  - d. Behind the robot, clear of the deck
  - *Why: The pendant should be within reach of wherever you stand while the robot runs, and you should find it before you need it.*

- [ ] **Q20** You have pressed the E-stop. What does it take to get the robot moving again?
  - **✓ a.** **Twist to release, then let the robot re-home**
  - b. Press the pendant a second time
  - c. Power-cycle the robot at the mains
  - d. Nothing; motion resumes automatically
  - *Why: You twist the pendant to release it, and the robot then needs to re-home before it can move again.*

- [ ] **Q40** Which of these is a pinch or crush point on the Flex?
  - a. The touchscreen mounting arm
  - **✓ b.** **Under the z-axis carriage as it descends**
  - c. The tip ejector on the 96-channel head
  - d. The lip of a reservoir slot
  - *Why: The named crush points are gantry-to-frame at travel extremes, the gripper jaws, and under the descending z-axis carriage.*

- [ ] **Q50** A tube has shifted and you want to straighten it while the gantry is moving. What is the correct action?
  - a. Reach in between gantry passes
  - b. Open a window, which halts motion
  - **✓ c.** **Pause the run properly, then intervene**
  - d. Hit the E-stop, fix it, then resume
  - *Why: Keep hands out of the deck while the gantry is live; if you must intervene, pause the run properly rather than reaching around a moving arm.*

<a id="flx-16"></a>

### FLX-16 — Labware placement and seating verification  `high risk`

- [ ] **Q10** A plate is resting on the lip of its slot rather than dropped in. What is the consequence?
  - a. The software refuses to start the run
  - b. Nothing; the LPC offset absorbs it
  - **✓ c.** **It sits millimetres high — crash or wrong depth**
  - d. Only the gripper is affected, not the pipettes
  - *Why: A plate on the slot lip is a few millimetres too high, which is enough to crash the pipette or aspirate from the wrong depth all run.*

- [ ] **Q20** A sample plate is loaded 180° out of orientation. What makes this especially dangerous?
  - **✓ a.** **The run finishes normally, hiding the mix-up**
  - b. The gripper cannot lift a rotated plate
  - c. The first aspiration throws an overpressure error
  - d. The deck map turns red at run start
  - *Why: Every sample ends up where the protocol thinks a different sample is, and the run still completes successfully, so nothing flags it.*

- [ ] **Q30** The protocol expects a 96-channel tip rack on its adapter, but you put the rack straight onto the deck. What happens?
  - a. Tip tracking resets to position A1
  - b. The rack sits a few millimetres too high
  - c. Nothing; the adapter is only for stability
  - **✓ d.** **The stack height is wrong and the pipette crashes**
  - *Why: The adapter is part of the stack height, so labware placed directly where an adapter should be will crash.*

- [ ] **Q50** Which of these is a crash waiting to happen?
  - a. A reservoir covered during setup, uncovered before start
  - b. An empty slot the protocol never uses
  - **✓ c.** **A lid left on a plate the protocol pipettes into**
  - d. A full tip rack seated in its adapter
  - *Why: Leaving a lid on something the protocol wants to pipette into is a crash; know which items are lidded at run start.*

<a id="flx-21"></a>

### FLX-21 — Labware Position Check (LPC)  `critical risk`

- [ ] **Q20** During LPC the tip is clearly off-centre over well A1, close to the well wall. What do you do?
  - a. Accept it; x/y error washes out at aspiration
  - b. Cancel LPC and reseat the plate
  - c. Note it and lower z to compensate
  - **✓ d.** **Jog x/y until the tip is centred, then save**
  - *Why: LPC exists to correct exactly this: jog in x/y until the tip is centred in the well, not against a wall, then save.*

- [ ] **Q30** What is the z target when you are jogging during LPC?
  - **✓ a.** **Tip just touching the well bottom**
  - b. Tip pressed firmly into the well bottom
  - c. Tip about 1 mm above the bottom
  - d. Tip level with the top of the well
  - *Why: Z is correct when the tip is just touching the well bottom, neither pressed into it nor hovering above it.*

- [ ] **Q60** A protocol validated on Robin is moved to Batman with the same labware in the same slots. What about the offsets?
  - a. They transfer with the protocol file
  - b. They apply once the robot has re-homed
  - c. Only the z values need re-checking
  - **✓ d.** **Re-run LPC; offsets are machine-specific**
  - *Why: Offsets are not global and not transferable between machines — Robin's offsets are not Batman's, so LPC must be re-run.*

- [ ] **Q70** You jog every labware item correctly but close the screen without saving. What is the effect on the run?
  - a. Offsets save automatically when LPC completes
  - b. The run refuses to start without saved offsets
  - **✓ c.** **The run uses uncorrected default positions**
  - d. The previous protocol's offsets are applied
  - *Why: The correction only exists once you save it; unsaved jogging leaves the robot running on nominal positions.*

<a id="flx-23"></a>

### FLX-23 — Tip racks, tip tracking and partial pickup  `high risk`

- [ ] **Q20** Your protocol picks up two tips at a time with the 96-channel head. Why must you watch the run?
  - a. Partial pickup wears the ejector faster
  - b. Tip tracking resets after each pickup
  - **✓ c.** **The tip-presence sensor is off for 1–3 tips**
  - d. The gripper must reposition the rack each time
  - *Why: With the sensor disabled for 1–3 tip pickup, a failed pickup is neither detected nor recoverable and the run carries on pipetting air.*

- [ ] **Q40** Resuming after a pause, the software's next tip is A1 but the first three columns of the rack are empty. What do you do?
  - a. Let it run; missing tips will be detected
  - **✓ b.** **Reset tip tracking to match the physical rack**
  - c. Slide the rack so a full column sits at A1
  - d. Abort and restart the whole protocol
  - *Why: Reconcile software state with reality before resuming, otherwise the pipette picks from an empty position or reuses a used tip.*

- [ ] **Q50** A colleague offers cheaper third-party tips that fit the Flex fine. Why refuse them?
  - a. The gripper cannot handle unfamiliar racks
  - b. The software will not recognise the rack
  - **✓ c.** **Different length and seal cause volume errors**
  - d. They cannot be autoclaved before use
  - *Why: Consumables must be the automation-compliant part numbers; tips that merely fit have different lengths and seals and produce volume errors.*

<a id="flx-25"></a>

### FLX-25 — Reservoir and bulk reagent deck prep  `high risk`

- [ ] **Q10** How do you work out how much reagent to put in a reservoir?
  - a. Per-well volume × wells, rounded up
  - b. Per-well volume × wells, plus 1 mL
  - c. Fill to the reservoir's maximum line
  - **✓ d.** **Per-well × wells + dead volume + overage**
  - *Why: Volume is per-well × number of wells plus the reservoir's dead volume plus 10–20% overage, and you write the number down before pouring.*

- [ ] **Q40** A 12-column reservoir is placed with its column-1 end at the wrong side of the slot. What is the result?
  - a. The pipette cannot reach column 12
  - b. Only the dead volume changes
  - **✓ c.** **Every reagent is drawn from the wrong column**
  - d. The gripper refuses to move it
  - *Why: A reversed reservoir puts every reagent in the wrong place, so orientation must be checked against the protocol.*

- [ ] **Q50** What must you do to the MagBead suspension before pouring it into the reservoir?
  - a. Chill it on ice for ten minutes
  - b. Dilute it with binding buffer
  - c. Filter it to remove any clumps
  - **✓ d.** **Resuspend it and warm to room temperature**
  - *Why: Beads must be resuspended to homogeneity and equilibrated to room temperature before pouring, and they will still settle during a long run.*

<a id="flx-27"></a>

### FLX-27 — Magnetic Block  `standard risk`

- [ ] **Q40** You are converting an OT-2 bead protocol to the Flex. What becomes of `magdeck.engage()` and `disengage()`?
  - a. They still work, mapped onto the block
  - **✓ b.** **They are rewritten as `move_labware()` gripper moves**
  - c. They are replaced by a delay
  - d. They only need a new slot number
  - *Why: There is no engage command on the Flex, so those calls become gripper moves of the plate on and off the block.*

<a id="flx-36"></a>

### FLX-36 — Prepare-to-run workflow  `high risk`

- [ ] **Q10** Instruments shows green. The right pipette was taken off and refitted yesterday and not recalibrated. Acceptable?
  - a. Yes, green means the calibration is current
  - **✓ b.** **No, reattachment makes the calibration untrustworthy**
  - c. Yes, if it went back on the same mount
  - d. No, but only for the 96-channel head
  - *Why: A pipette reattached since its last calibration shows as attached but is not trustworthy; confirm calibration status, not just attachment.*

- [ ] **Q20** Which of these counts as deck hardware that must match the software deck configuration?
  - a. The tip racks
  - b. The runtime parameters
  - c. The labware offsets
  - **✓ d.** **The trash bin and waste chute**
  - *Why: Modules and fixtures must be physically present and matching the software configuration, and the trash bin and waste chute count as deck hardware.*

- [ ] **Q40** You are extracting 48 samples but the run was set up for 96. Which checklist item should have caught it?
  - a. The Liquids item
  - **✓ b.** **The Runtime parameters item**
  - c. The Labware item
  - d. The Deck hardware item
  - *Why: Runtime parameters cover sample count, volumes and any CSV input, and must be set for the run you actually intend.*

<a id="flx-41"></a>

### FLX-41 — Error recovery mode  `critical risk`

- [ ] **Q10** A "no liquid detected" error fires and you can see the reservoir has run dry. Which recovery option?
  - a. Ignore and skip
  - b. Retry with new tips
  - **✓ c.** **Refill and retry**
  - d. Cancel the run
  - *Why: If a reservoir ran dry, refilling it and retrying is the option that restores the intended chemistry.*

- [ ] **Q30** Why is choosing "ignore and skip" on a reagent addition step so dangerous?
  - **✓ a.** **The well silently misses reagent and looks real**
  - b. It leaves tips attached to the pipette
  - c. It clears the software's tip-tracking model
  - d. The run log cannot record which wells were skipped
  - *Why: The run finishes with a well that never got its reagent, and the failure then looks like a biological result in the data.*

- [ ] **Q40** An overpressure error fires during aspiration. What is the right response?
  - a. Retry with new tips and hope it clears
  - b. Skip the step with the same tips
  - c. Switch to the dispense recovery options
  - **✓ d.** **Find and clear the blockage, then retry**
  - *Why: Overpressure means something is blocked, and retrying without fixing the cause simply fails again.*

- [ ] **Q50** An error stops a bead wash step and salvaging it will take twenty minutes. What must you weigh before choosing?
  - **✓ a.** **Whether the beads dry out in the meantime**
  - b. Whether the tips are still sterile
  - c. Whether the gripper needs re-homing
  - d. Whether the offsets survive the pause
  - *Why: Ask what state the well's chemistry is in and whether it can survive the delay; beads drying out during a long pause is a real failure mode.*

- [ ] **Q60** You recovered from an error affecting three wells. What must be recorded, and where?
  - a. Nothing; the run log captures it
  - b. Only the number of errors seen
  - **✓ c.** **Option, step and wells, in the batch record**
  - d. A note left on the robot's touchscreen
  - *Why: Always record which recovery option was taken, at which step, for which wells; the person interpreting the sequencing data needs it.*

<a id="flx-47"></a>

### FLX-47 — Routine cleaning of the Flex  `standard risk`

- [ ] **Q10** A visitor suggests acetone for a stubborn mark on the Flex window. What do you say?
  - a. Use it sparingly, on the frame only
  - b. Use it, then rinse with distilled water
  - c. Use it on the deck surface only
  - **✓ d.** **Refuse; acetone attacks plastics and coatings**
  - *Why: Acetone is never approved on the Flex because it attacks the plastics and the window coating.*

- [ ] **Q40** How far do you go when cleaning a pipette?
  - a. Remove the shroud and wipe inside
  - b. Autoclave it between batches
  - **✓ c.** **Exterior body, ejector and nozzles only**
  - d. Flush the internal channel with ethanol
  - *Why: Clean pipette exterior body, ejector and nozzles only, and the gripper body, jaws and paddles; never disassemble and never autoclave.*

- [ ] **Q60** You cleaned the deck with `70% ethanol` after a 16S run. Is the deck ready for the next amplicon batch?
  - a. Yes; ethanol destroys residual DNA
  - b. Yes, if the windows were wiped too
  - c. Yes, provided the paddles are clean
  - **✓ d.** **No; decontamination is a separate procedure**
  - *Why: Cleaning is not decontamination; DNA decontamination between amplicon-sensitive batches is FLX-49 and uses bleach with full contact time.*

<a id="flx-49"></a>

### FLX-49 — Nucleic acid decontamination of the deck  `critical risk`

- [ ] **Q10** What triggers a deck decontamination on Batman?
  - a. Every Friday afternoon
  - b. After every run, without exception
  - **✓ c.** **Before an amplicon-sensitive batch**
  - d. Monthly, with the service check
  - *Why: Run it between amplicon-sensitive batches; the trigger is the workflow, not the calendar.*

- [ ] **Q20** What does the bleach step need in order to actually destroy residual DNA?
  - a. A quick swipe across every slot
  - b. Undiluted bleach, wiped straight off
  - c. Bleach followed immediately by ethanol
  - **✓ d.** **`10% bleach` left for the full contact time**
  - *Why: Bleach needs minutes of contact to destroy DNA, not a swipe, so the full contact time is honoured on all deck surfaces and slots.*

- [ ] **Q30** Your Flex has a HEPA/UV module fitted. How is the UV cycle run?
  - **✓ a.** **Deck cleared, with nobody exposed**
  - b. Deck loaded, so the labware is treated too
  - c. With people watching through the window
  - d. In place of the bleach step, to save time
  - *Why: All labware comes off the deck first and the UV cycle is run with nobody exposed.*

---

## Opentrons OT-2 (Alfred & Ethan)

*9 critical questions across 3 skills.*

<a id="ot2-01"></a>

### OT2-01 — OT-2 orientation and how it differs from the Flex  `critical risk`

- [ ] **Q40** A tip pickup fails halfway through a run on Ethan. What does the OT-2 App offer you?
  - a. Retry with new tips, refill and retry, or skip the step
  - b. Automatic retry, with a report at the end of the run
  - **✓ c.** **A pause: fix the problem, or cancel the protocol**
  - d. Immediate cancellation, with no pause at all
  - *Why: The OT-2 has no structured error recovery: the app pauses and offers only fix-or-cancel. The named recovery options are Flex features.*

- [ ] **Q50** In what order must the OT-2's manual calibrations be performed?
  - a. Pipette offset, then deck, then tip length
  - b. Tip length, then deck, then pipette offset
  - **✓ c.** **Deck, then tip length, then pipette offset**
  - d. Any order, provided all three are completed
  - *Why: The dependency chain is deck, then tip length, then pipette offset. Anything upstream invalidates everything downstream.*

<a id="ot2-04"></a>

### OT2-04 — OT-2 deck calibration  `critical risk`

- [ ] **Q20** Deck calibration asks you to jog the tip to how many cross-hair points?
  - a. One
  - b. Two
  - **✓ c.** **Three**
  - d. Six
  - *Why: Deck calibration jogs to three cross-hair points on the deck. Skipping a point leaves the deck position wrong.*

- [ ] **Q30** You are on the final approach to a cross-hair. What is the correct jogging technique?
  - a. Use the largest increment to reach contact quickly
  - b. Press down until the tip visibly flexes, then stop
  - c. Stop roughly a millimetre above the deck surface
  - **✓ d.** **Use the smallest increment; stop when the tip just touches**
  - *Why: Eye level with the deck, smallest increment for the final approach, and contact without deflecting the tip. A deflected tip means you have gone too far.*

- [ ] **Q40** You remove the P300 from Ethan and reattach it. What calibration must you redo?
  - a. Nothing; the calibration is stored with the pipette
  - **✓ b.** **Tip length and pipette offset for that pipette**
  - c. Deck calibration only
  - d. All three, beginning again with deck calibration
  - *Why: Reattaching a pipette invalidates tip length and pipette offset. Deck calibration is upstream and stays valid.*

<a id="ot2-10"></a>

### OT2-10 — Running and monitoring an OT-2 protocol  `high risk`

- [ ] **Q10** You have modified an existing OT-2 protocol. What happens before you run real samples?
  - **✓ a.** **A water-only dry run on the real deck and labware**
  - b. A software simulation in the App is enough on its own
  - c. Nothing extra, since the original protocol worked
  - d. A run with a single well filled, to check the volumes
  - *Why: Any new or changed protocol gets a water-only dry run with real labware on the real deck; that is where collisions and bad offsets are caught.*

- [ ] **Q20** How much reagent should you put in a reservoir for an OT-2 run?
  - a. Exactly the calculated volume, to avoid waste
  - b. Half now, topping up when the robot pauses
  - **✓ c.** **The calculated volume plus dead volume plus generous overage**
  - d. Whatever fits; the robot detects a dry reservoir
  - *Why: Over-provision with dead volume plus overage. Running a reservoir dry on an OT-2 ends the run and loses the plate.*

- [ ] **Q30** The run has started on Ethan. What should you do next?
  - a. Leave at once so vibration does not disturb it
  - b. Check in halfway; early steps rarely cause trouble
  - c. Return only when the App reports completion
  - **✓ d.** **Watch the opening steps and the first plate move**
  - *Why: Most failures declare themselves early, so the opening steps and the first plate move are what you watch.*

- [ ] **Q40** A run has paused with an error. What is the first thing you do?
  - a. Resume and see whether it recovers by itself
  - b. Cancel and restart the protocol from the beginning
  - c. Open the deck and re-mix the affected plate by hand
  - **✓ d.** **Write down the step, plate states and chemistry status**
  - *Why: Record the step it stopped at, the state of each plate and what the chemistry tolerates before touching anything; you will not remember it accurately later.*

---

## Automated Extraction

*3 critical questions across 1 skills.*

<a id="aex-01"></a>

### AEX-01 — Magnetic-bead extraction theory  `high risk`

- [ ] **Q20** A plate gives low yield and a community skewed toward Gram-negatives. Which stage most likely failed?
  - **✓ a.** **Lysis, because tough-walled cells never opened**
  - b. Binding, from the wrong alcohol concentration
  - c. Washing, leaving chaotrope behind
  - d. Elution, with too little buffer added
  - *Why: Incomplete lysis biases the community toward easy-to-lyse organisms, so Gram-negatives are over-represented relative to Gram-positives.*

- [ ] **Q30** An eluate reads A260/280 of 1.83 and A260/230 of 0.5. What is the likely cause?
  - a. Protein carryover from incomplete digestion
  - b. RNA contamination inflating the 260 reading
  - c. The sample was eluted in water rather than TE
  - **✓ d.** **Insufficient washing, or an over-dried pellet**
  - *Why: A normal A260/280 with a low A260/230 points at residual chaotrope or ethanol, meaning the wash was insufficient or the pellet was over-dried.*

- [ ] **Q60** An eluate looks cloudy. What follows from that observation?
  - a. The DNA is degraded and the whole plate must be re-extracted
  - b. Yield will be higher than expected
  - **✓ c.** **Quantification will be wrong and enzymes may be inhibited**
  - d. The A260/280 will read below 1.7
  - *Why: Cloudiness is bead carryover, which distorts quantification and inhibits downstream enzymes.*

---

## Quantification & Sizing

*20 critical questions across 6 skills.*

<a id="qc-02"></a>

### QC-02 — Denovix DS-11 microvolume operation  `high risk`

- [ ] **Q10** Your samples are eluted in TE. What do you blank the DS-11 with?
  - **✓ a.** **The same TE the samples are eluted in**
  - b. dH2O, which has no absorbance of its own
  - c. A dry pedestal with the arm lowered
  - d. The most dilute sample in the set
  - *Why: Blank with the matching elution buffer. Blanking a TE-eluted sample against water gives a wrong A260/230 and a purity problem that does not exist.*

- [ ] **Q20** How often do you wipe the DS-11 pedestals, and with what?
  - a. After every tenth sample, with a damp wipe
  - b. At the start and end of the session, with ethanol
  - c. Only when residue is visible on the lower pedestal
  - **✓ d.** **After every reading including the blank, with a dry wipe**
  - *Why: Both surfaces get a dry lab wipe after every single reading, blanks included. Skipping this is the top cause of bad data on this instrument.*

- [ ] **Q30** A labmate offers you `70% ethanol` to clean the pedestal. What do you do?
  - **✓ a.** **Decline; routine cleaning uses dH2O only**
  - b. Use it, since it is standard for optics
  - c. Use it on the upper surface only
  - d. Dilute it with dH2O first, then use it
  - *Why: Routine cleaning is dH2O only. Detergents and alcohol are not used on this instrument.*

- [ ] **Q40** What does a correctly loaded DS-11 sample look like before you lower the arm?
  - a. A 2 µL drop spread across the pedestal
  - **✓ b.** **A 1 µL bead centred on the lower pedestal**
  - c. A 1 µL drop placed on the upper surface
  - d. Enough volume to fill the gap when the arm closes
  - *Why: 1 µL on the centre of the lower pedestal, forming a clean bead with no bubble, so a proper liquid column forms when the arm closes.*

<a id="qc-03"></a>

### QC-03 — DS-11 purity ratios and interpretation  `high risk`

- [ ] **Q10** A MagBead extract reads 60 ng/µL, A260/280 of 1.84, A260/230 of 0.7. What is the most likely cause?
  - a. Protein carryover from the lysis step
  - **✓ b.** **Residual guanidinium or ethanol from an incomplete wash**
  - c. The sample is too dilute for meaningful ratios
  - d. RNA carryover inflating the 260 reading
  - *Why: A clean A260/280 with a low A260/230 on a MagBead extract almost always means residual chaotrope or ethanol from an incomplete wash or poor drying.*

- [ ] **Q50** You read an RNA sample with the DS-11 still set to dsDNA. What is the consequence?
  - **✓ a.** **The concentration is wrong; RNA uses 40, not 50**
  - b. The ratios are wrong but the concentration is fine
  - c. Nothing, because the conversion factors are identical
  - d. The instrument refuses to report a concentration
  - *Why: dsDNA, ssDNA and RNA use conversion factors of 50, 33 and 40 ng·cm/µL, so reading RNA as dsDNA reports a wrong concentration.*

- [ ] **Q60** A gDNA extract gives an A260/280 of 1.55. What does that indicate?
  - a. Clean double-stranded DNA
  - **✓ b.** **Protein or phenol carryover**
  - c. RNA carryover in the extract
  - d. Residual guanidinium from the binding buffer
  - *Why: Clean dsDNA sits near 1.8; below about 1.7 indicates protein or phenol carryover. Salt and chaotrope show up in A260/230 instead.*

<a id="qc-09"></a>

### QC-09 — Qubit fluorometry  `high risk`

- [ ] **Q10** How often do you run the Qubit standards?
  - **✓ a.** **Both standards, fresh, for every assay**
  - b. Once per kit, then reuse the stored curve
  - c. Only when the sample readings look implausible
  - d. Once a day is enough on a busy schedule
  - *Why: Both standards are run fresh with every assay. Reusing yesterday's curve invalidates every number that comes off it.*

- [ ] **Q20** You are quantifying a low-input library. Which Qubit assay do you choose?
  - a. dsDNA BR, the usual choice for libraries
  - b. RNA HS, since libraries are single-stranded
  - **✓ c.** **dsDNA HS, the low-input assay**
  - d. Either dsDNA assay; the ranges overlap enough
  - *Why: dsDNA HS is for low-input material and libraries; BR is for extracts. Matching the assay to the expected range is what keeps the number valid.*

<a id="qc-14"></a>

### QC-14 — TapeStation 2200  `high risk`

- [ ] **Q10** You need the average fragment size of a ~1.5 kb full-gene 16S library. Which TapeStation assay?
  - a. Genomic DNA ScreenTape, for anything from an extraction
  - b. D1000 or HS D1000, matched to the concentration
  - **✓ c.** **D5000 for a 16S amplicon; Genomic DNA for HMW gDNA**
  - d. Any assay, because sizing is assay-independent
  - *Why: Match the assay to the size you expect. D1000 and HS D1000 only size 35-1000 bp, so a 1.5 kb amplicon reads pinned near the ceiling and that wrong size propagates straight into the QC-20 molarity conversion. D5000 covers 100-5000 bp; Genomic DNA ScreenTape covers 200 bp upward for HMW gDNA.*

- [ ] **Q20** Where does the average fragment size used in the nM conversion come from?
  - a. The DIN value reported for the sample
  - b. The position of the tallest peak in the trace
  - c. The expected amplicon size from the primer design
  - **✓ d.** **Smear analysis across the defined region**
  - *Why: Smear analysis over a defined region gives the average fragment size, and that number feeds directly into the ng/µL to nM conversion.*

<a id="qc-17"></a>

### QC-17 — SPRI / AMPure bead cleanup and ratio control  `critical risk`

- [ ] **Q10** A step calls for a higher bead-to-sample ratio than the previous one. What does that change?
  - **✓ a.** **More small fragments are retained**
  - b. Only the largest fragments are retained
  - c. The final elution volume increases
  - d. The binding incubation can be shortened
  - *Why: Ratio is bead volume divided by sample volume, and it sets the size cutoff: a higher ratio keeps smaller fragments, a lower ratio keeps only larger ones.*

- [ ] **Q20** A cleanup specifies a 0.8x bead ratio and you have 50 µL of sample. What bead volume do you add?
  - a. 0.8 µL
  - b. 62.5 µL
  - **✓ c.** **40 µL**
  - d. 50 µL
  - *Why: Bead volume = ratio x sample volume = 0.8 x 50 µL = 40 µL. Dividing instead of multiplying gives 62.5 µL and the wrong size cutoff.*

- [ ] **Q40** How are the two `80% ethanol` washes performed?
  - a. Off the magnet, resuspending the beads each time
  - **✓ b.** **On the magnet, added down the opposite wall, no resuspension**
  - c. On the magnet, using ethanol made up last month
  - d. Off the magnet, with a brief vortex between washes
  - *Why: The plate stays on the magnet, fresh `80% ethanol` is added down the opposite wall, and the pellet is not resuspended.*

- [ ] **Q50** When do you stop air-drying the bead pellet?
  - a. As soon as the last ethanol is aspirated
  - **✓ b.** **When the pellet loses its sheen**
  - c. When the pellet has visibly cracked
  - d. After it has dried on the magnet overnight
  - *Why: Dry only until the sheen is gone. A cracked pellet will not fully re-elute, and the lost yield looks like a bad extraction.*

- [ ] **Q60** Your eluate looks faintly cloudy after transfer. What do you do?
  - a. Carry on; the cloudiness settles out on its own
  - b. Dilute it twofold before quantifying
  - **✓ c.** **Return it to the magnet and re-transfer**
  - d. Add more elution buffer and incubate again
  - *Why: Cloudiness means carried-over beads, which interfere with quantification and downstream enzymes, so re-magnetise and transfer again.*

<a id="qc-20"></a>

### QC-20 — ng/µL to nM molarity conversion  `critical risk`

- [ ] **Q20** Which concentration value belongs in the molarity conversion, and why?
  - a. The DS-11 value, because it reads a full spectrum
  - b. The mean of the Qubit and DS-11 values
  - c. The Take3 value, since the plate is read at once
  - **✓ d.** **The Qubit value, because absorbance over-reads**
  - *Why: The concentration must be fluorometric. Absorbance counts RNA and free nucleotides as DNA, so a DS-11 number inflates the calculated molarity.*

- [ ] **Q30** Which fragment length belongs in the conversion?
  - a. The expected amplicon size from the primers
  - **✓ b.** **The TapeStation smear-analysis average**
  - c. The size of the tallest peak on the trace
  - d. The upper size limit of the assay used
  - *Why: Use the measured average from TapeStation smear analysis over the correct region, never the expected amplicon size or a guess.*

- [ ] **Q40** A library is 10 ng/µL with a measured average length of 1500 bp. What is its molarity?
  - a. 1.0 nM
  - **✓ b.** **10.1 nM**
  - c. 15.2 nM
  - d. 101 nM
  - *Why: nM = (10 x 10^6) / (660 x 1500) = 10,000,000 / 990,000 = 10.1 nM.*

- [ ] **Q60** Your 20 ng/µL library with a 1600 bp average comes out at 1900 nM. What went wrong?
  - a. Nothing; that is the expected value
  - b. The Qubit reading must have been taken wrongly
  - c. The length should have been entered in kb
  - **✓ d.** **A factor-of-100 error; it should be about 19 nM**
  - *Why: (20 x 10^6) / (660 x 1600) = 20,000,000 / 1,056,000 = 18.9, so about 19 nM. Getting 1900 or 0.19 signals a factor-of-100 slip.*

---

## Plate Readers & Take3

*4 critical questions across 1 skills.*

<a id="plt-01"></a>

### PLT-01 — Synergy HTX with Take3 Trio plate  `standard risk`

- [ ] **Q10** You have just finished a Take3 read. What do you do with the surfaces?
  - **✓ a.** **Clean all three with dH2O and a lint-free wipe**
  - b. Clean only the surfaces you actually loaded
  - c. Leave them until the end of the session
  - d. Rinse them with ethanol and let them air-dry
  - *Why: All three surfaces are cleaned with dH2O and a lint-free wipe before and immediately after reading, because carryover is the main failure mode.*

- [ ] **Q20** How do you load the Take3 plate?
  - a. 1 µL per spot, as on the DS-11 pedestal
  - b. 5 µL per spot, to compensate for the short pathlength
  - c. 2 µL per spot, closing the lid straight away
  - **✓ d.** **2 µL per spot, checking every drop before closing**
  - *Why: 2 µL per spot, and you look at every drop first: a missed or spread drop reads as garbage and you will not know which well it was.*

- [ ] **Q30** How do you blank a Take3 run?
  - a. With dH2O in a single spot
  - b. With the blank values from the previous batch
  - c. With an empty, dry spot
  - **✓ d.** **With the matching elution buffer, on the plate**
  - *Why: Blank with the matching elution buffer, loaded on the plate the same way as the samples.*

- [ ] **Q40** Before reading, what must be selected in Gen5?
  - a. The 96-well definition and any DNA protocol
  - **✓ b.** **The correct protocol and the Take3 plate definition**
  - c. The kinetic read mode
  - d. The dsDNA conversion factor used by the DS-11
  - *Why: Select the correct Gen5 protocol together with the Take3 plate definition; the wrong plate definition invalidates the pathlength the reader assumes.*

---

## Library Prep & Sequencing

*20 critical questions across 5 skills.*

<a id="seq-11"></a>

### SEQ-11 — Input DNA QC for nanopore  `critical risk`

- [ ] **Q20** Which measurement should set the DNA mass you load for a nanopore prep, and why?
  - a. NanoDrop, because absorbance is more reproducible than fluorescence
  - **✓ b.** **Qubit, because absorbance over-reads and you would under-load**
  - c. TapeStation, because it reports mass and size together
  - d. Either one, provided you use the same instrument every time
  - *Why: Measure with the Qubit, never absorbance: absorbance over-reads, so you would under-load without knowing it.*

- [ ] **Q50** What A260/230 range does the page require before you start a prep?
  - a. 1.6–1.8
  - b. 2.2–2.6
  - c. Anything above 1.5
  - **✓ d.** **1.8–2.2**
  - *Why: The purity criteria are A260/280 near 1.8 and A260/230 in 1.8–2.2.*

- [ ] **Q60** Your extract has a low A260/230 from residual guanidinium. What happens if you load it anyway?
  - **✓ a.** **Available pore count collapses over the first hour**
  - b. MinKNOW refuses to start the run
  - c. Reads come out short but pore count holds up
  - d. Only basecalling accuracy is affected
  - *Why: Residual guanidinium, ethanol or protein fouls pores directly: you watch the available pore count collapse over the first hour and there is nothing you can do once loaded.*

- [ ] **Q70** Length and purity both pass, but the Qubit shows about half the mass the kit requires. What do you do?
  - a. Load it and sequence for longer to compensate
  - b. Re-measure on the NanoDrop to confirm the Qubit reading
  - c. Proceed, since length and purity are what damage pores
  - **✓ d.** **Stop; clean up or re-extract before proceeding**
  - *Why: All three criteria must pass, and one good number does not rescue the other two. If any fails, stop and clean up, re-extract or re-plan.*

<a id="seq-12"></a>

### SEQ-12 — Gentle DNA handling for long reads  `high risk`

- [ ] **Q10** How should HMW gDNA destined for nanopore be mixed?
  - a. A brief low-speed vortex, followed by a quick spin
  - b. Pipette up and down about ten times to homogenise
  - **✓ c.** **Flick the tube base, or invert slowly, then spin down**
  - d. Vortex, but only while the tube sits on ice
  - *Why: Never vortex DNA destined for nanopore, not briefly and not gently. Flick the base of the tube sharply or invert slowly, then spin down briefly.*

- [ ] **Q20** There are no wide-bore tips in the drawer and you need to move HMW gDNA. What do you do?
  - **✓ a.** **Cut the end off a standard tip with a clean blade**
  - b. Use a standard tip but pipette fast to shorten contact
  - c. Dilute the sample so a standard tip becomes safe
  - d. Switch to a smaller-volume pipette instead
  - *Why: A standard tip forces DNA through a narrow orifice at speed, which is exactly the shear you are avoiding. With no wide-bore tips, cut the end off a standard one with a clean blade.*

- [ ] **Q40** You will draw on one HMW gDNA stock across several preps over the next month. How should you handle it?
  - a. Keep one tube and thaw it each time you need some
  - **✓ b.** **Aliquot once so the stock is not repeatedly freeze-thawed**
  - c. Hold it at room temperature to avoid freezing at all
  - d. Refreeze it quickly after each use to limit damage
  - *Why: Avoid repeated freeze-thaw: aliquot once and do not cycle the stock.*

<a id="seq-18"></a>

### SEQ-18 — Flow cell platform QC / pore count  `critical risk`

- [ ] **Q10** How often should the MinKNOW flow cell check be run?
  - a. Only on cells that have already been washed and reused
  - **✓ b.** **Before every experiment, on every flow cell**
  - c. Once, when the cells arrive from ONT
  - d. Whenever a run returns less data than expected
  - *Why: Run it before every experiment, on every flow cell, without exception. It takes minutes and it is the difference between a failed run you can claim for and one you paid for.*

- [ ] **Q30** What is ONT's warranty threshold for a MinION-format flow cell?
  - a. At least 400 pores
  - b. At least 1200 pores
  - c. At least 1600 pores
  - **✓ d.** **At least 800 pores**
  - *Why: ONT's warranty for MinION-format flow cells is 800 pores or more, and that number is the go/no-go line for loading a library.*

- [ ] **Q40** Your flow cell check comes back at 640 pores. What do you do?
  - a. Load the library anyway and extend the run to compensate
  - b. Wash the cell and re-check before deciding anything
  - **✓ c.** **Do not load; file a warranty claim quoting the cell ID**
  - d. Load half the library so the rest of the sample survives
  - *Why: Below the threshold you do not load: you would get a poor run and spend the sample. File a warranty claim with ONT quoting the flow cell ID and the check result, and record it in the flow cell log.*

<a id="seq-19"></a>

### SEQ-19 — Flow cell priming  `critical risk`

- [ ] **Q10** A flow cell comes out of the fridge. What happens before you do anything else?
  - **✓ a.** **20 minutes at room temperature, because cold cells outgas**
  - b. 5 minutes at room temperature to reach running temperature
  - c. Nothing, provided you prime slowly and steadily
  - d. An hour at room temperature so the tether can settle
  - *Why: Leave the flow cell at room temperature for 20 minutes before you do anything: cold flow cells outgas and form bubbles.*

- [ ] **Q20** What goes into the priming mix?
  - a. Flow Cell Flush plus Storage Buffer
  - **✓ b.** **Flow Cell Flush, BSA to `0.2 mg/mL`, and Flow Cell Tether**
  - c. Flow Cell Flush, Wash Diluent, and Flow Cell Tether
  - d. Sequencing Buffer plus BSA to `2 mg/mL`
  - *Why: Priming mix is Flow Cell Flush plus BSA to `0.2 mg/mL` plus Flow Cell Tether, mixed gently and never vortexed.*

- [ ] **Q30** You have opened the priming port. What must happen before any priming mix goes in?
  - a. Flush 200 µL of buffer through to clear the channel
  - b. Open the SpotON port so the pressure equalises
  - **✓ c.** **Draw back slowly to remove the air bubble under the port**
  - d. Pipette the BSA straight into the port
  - *Why: The critical step is removing the air bubble first: draw back slowly until a small volume of buffer enters the tip and the bubble under the port is gone.*

- [ ] **Q40** While drawing back at the priming port, how much actual buffer may you pull into the tip?
  - **✓ a.** **No more than 20–30 µL**
  - b. About 200 µL
  - c. About 100 µL
  - d. As much as it takes to clear the bubble
  - *Why: Never draw back more than 20–30 µL of actual buffer, or you will pull buffer off the array.*

- [ ] **Q50** The bubble is gone. How much priming mix goes in first, and how long do you wait afterwards?
  - a. 200 µL, then wait 20 minutes
  - b. 500 µL, then wait 1 hour
  - c. 1000 µL, with no wait needed
  - **✓ d.** **800 µL, then wait 5 minutes**
  - *Why: Load 800 µL of priming mix into the priming port, slowly and steadily, then wait 5 minutes.*

- [ ] **Q70** Mid-priming you see a bubble travelling toward the sensor array. What do you do?
  - a. Push the remaining mix through quickly to flush it past
  - **✓ b.** **Stop what you are doing and get someone**
  - c. Tilt the flow cell to steer it into the waste channel
  - d. Carry on; bubbles dissipate before they reach the array
  - *Why: An air bubble that reaches the sensor array irreversibly destroys pores and there is no recovery, so the instruction is to stop and get someone.*

<a id="seq-26"></a>

### SEQ-26 — Flow cell wash and reuse (EXP-WSH004)  `high risk`

- [ ] **Q10** How is the wash mix prepared?
  - a. 20 µL Wash Mix plus 380 µL Wash Diluent at room temperature
  - b. 2 µL Wash Mix plus 198 µL Wash Diluent, on ice
  - **✓ c.** **2 µL Wash Mix plus 398 µL Wash Diluent, on ice**
  - d. 200 µL Wash Mix plus 200 µL Wash Diluent, on ice
  - *Why: Wash mix is 2 µL Wash Mix plus 398 µL Wash Diluent, prepared on ice.*

- [ ] **Q20** There is leftover wash mix in the fridge from last week. Do you use it?
  - a. Yes, provided it was kept on ice the whole time
  - b. Yes, but use double the volume to compensate
  - c. Yes, wash mix is stable for about a month
  - **✓ d.** **No, old mix will not digest the library**
  - *Why: Wash mix must be fresh and not stored for more than a day. Old wash mix does not digest the library, so you carry the previous run's reads into the next one.*

- [ ] **Q40** What is the first action of each wash load cycle?
  - a. Open the SpotON port
  - **✓ b.** **Remove accumulated waste from waste port 1**
  - c. Run a flow cell check and record the pore count
  - d. Load 500 µL of Storage Buffer
  - *Why: Each cycle starts by removing accumulated waste from waste port 1 with a P1000, before the 200 µL of wash mix goes in.*

- [ ] **Q70** The washed cell will not be used again for a week. How do you store it?
  - **✓ a.** **Load 500 µL of Storage Buffer and hold at 2–8 °C**
  - b. Leave the wash mix on the array and hold at 2–8 °C
  - c. Load 500 µL of Storage Buffer and freeze at -20 °C
  - d. Leave it dry on the device at room temperature
  - *Why: Store by loading 500 µL of Storage Buffer and keeping the cell at 2–8 °C. Never store a flow cell with wash mix sitting on the array. Never freeze a flow cell — ice crystals destroy the membrane and the array. Storage is 2-8 °C, always.*

---

## HiPerGator & Computing

*10 critical questions across 4 skills.*

<a id="hpg-07"></a>

### HPG-07 — HiPerGator User Training  `high risk`

- [ ] **Q10** You have worked through every module of the HiPerGator course but not taken the final quiz. Are you done?
  - a. Yes, working through the modules is what counts
  - b. Yes, as long as your PI confirms you attended
  - **✓ c.** **No, you must pass the final quiz**
  - d. No, and the quiz may only be attempted once
  - *Why: The course is required and you must pass the final quiz; module completion alone is not the sign-off.*

- [ ] **Q50** A collaborator wants to bring a human-subject project involving PHI onto HiPerGator. What is your first move?
  - **✓ a.** **Contact UFIT Research Computing before any data moves**
  - b. Refuse, since UF never permits PHI on HiPerGator
  - c. Put it on `/blue` with tightened directory permissions
  - d. Decide with your PI whether it really counts as regulated
  - *Why: Regulated data is never your call alone. UF supports categories such as PHI/HIPAA under its compliance posture, but only once UFIT Research Computing has placed you in the right environment, so you contact them first.*

- [ ] **Q60** Export-controlled work (ITAR/EAR, CUI, CDI) must run where?
  - a. Standard HiPerGator, with the data encrypted at rest
  - **✓ b.** **HiPerGator-RV**
  - c. ResShield
  - d. `/orange`, because it is archival storage
  - *Why: UF policy requires export-controlled work to run on HiPerGator-RV. ResShield is for CMS IS2P2 data, not export-controlled work.*

<a id="hpg-14"></a>

### HPG-14 — Login-node etiquette  `critical risk`

- [ ] **Q10** In UF's own words, what are login nodes for?
  - a. Any job short enough to finish inside about an hour
  - **✓ b.** **Non-computational interactive work and very short script tests**
  - c. Single-threaded work of any duration, as long as it is niced
  - d. Anything that does not require a GPU
  - *Why: UF's rule is that login nodes are for non-computational interactive work and very short tests of job scripts. That is all.*

- [ ] **Q20** You SSH in and are about to launch Dorado basecalling in that shell. What should you do instead?
  - a. Run it under nice so it yields to other users
  - b. Start it inside `tmux` so it survives disconnection
  - **✓ c.** **Submit it as a batch job with `sbatch`**
  - d. Break it into several short login-node runs
  - *Why: Basecalling is named as something never to run on a login node. The node is shared by everyone at UF, Research Computing will kill the process, and batch work belongs in `sbatch`.*

- [ ] **Q30** You want to use VS Code against HiPerGator. What is the trap, and what is the fix?
  - a. Remote-SSH cannot handle MFA, so use a terminal editor
  - b. Remote-SSH is fine on a login node if you close the terminal
  - c. VS Code is blocked at UF, so use Jupyter instead
  - **✓ d.** **Remote-SSH spawns heavy language servers; use Remote Tunnel**
  - *Why: UF specifically calls out misusing IDE SSH connections: Remote-SSH silently spawns language servers and file watchers on whatever node it connects to. Use UF's documented VS Code Remote Tunnel workflow.*

<a id="hpg-22"></a>

### HPG-22 — Filesystems: /home vs /blue vs /orange  `critical risk`

- [ ] **Q20** Which statement about backups on HiPerGator is correct?
  - a. `/orange` holds the backup copy of `/blue`
  - b. `/blue` is snapshotted nightly by Research Computing
  - c. The `~/.snapshot/` directory covers everything under `/blue`
  - **✓ d.** **`/blue` is not backed up unless backup was purchased**
  - *Why: This is the single most important sentence on the page: `/blue` is not backed up unless backup was separately purchased. `/orange` is not backed up by default either, and the `~/.snapshot/` snapshots belong to `/home`.*

- [ ] **Q60** The only copy of a raw nanopore run is in `/blue`. What does the lab's backup rule require?
  - a. Nothing more, since `/blue` is redundant by design
  - **✓ b.** **At least one more independent copy, off HiPerGator**
  - c. A second copy in `/home`, which has snapshots
  - d. A restore point saved under `~/.snapshot/`
  - *Why: Every dataset needs at least two independent copies, and raw sequencing data needs an off-HiPerGator copy plus, eventually, an archive submission.*

<a id="hpg-56"></a>

### HPG-56 — Data transfer: rsync and Globus  `high risk`

- [ ] **Q50** The transfer has finished and the sequencing laptop is nearly full. When may you delete the local copy?
  - a. As soon as `rsync` exits without an error
  - b. Once the first analysis job has run successfully
  - c. After a week, if nobody has reported a problem
  - **✓ d.** **Once checksums verify and the data is filed and logged**
  - *Why: "It looked like it copied" is not verification. Run `md5sum` or compare checksums generated at source, file and protect the data, and only then delete the local copy.*

- [ ] **Q60** The run has arrived on `/blue` and the `md5sum`s match. What do you do next?
  - a. Start basecalling straight away and tidy the files up later
  - **✓ b.** **File it into `00_raw/`, set it read-only, log it in the manifest**
  - c. Move it to `/orange` and clear it off `/blue`
  - d. Compress it and keep a second copy in `/home`
  - *Why: On arrival you verify, then protect: file it into `/blue/<group>/.../00_raw/`, set it read-only, and log it against the sample manifest.*

---

## Known content gaps — these need the READING fixed, not the questions

In these three cases the answer key looks right to me and the underlying practice is right, but the
skill's `instructions_md` never teaches it. A trainee can read the page carefully, understand it
fully, and still fail — which reads to them as an unfair quiz rather than a gap in the reading.
The fix belongs in the instructions, not in the question.

- **[SAF-01](#saf-01) — Chemical Hygiene Plan (EHS869).** The critical checklist item on locating
  the eyewash, safety shower, spill kit and fire extinguisher before starting work is never
  mentioned in the instructions. A trainee can pass the reading and then fail the practical for not
  knowing where the eyewash is — the one thing SAF-25 assumes they can reach in seconds.
- **[SAF-29](#saf-29) — BSL-2 practices.** Glove doffing technique and disinfectant surface contact
  time are assessed but not taught. Someone who has read the page still has no idea how long the
  bleach has to sit, and will fail the practical on a step the reading never named.
- **[SAF-39](#saf-39) — Liquid nitrogen and cryogens (EHS866).** The requirement to move dewars on a
  proper transport cart is not in the reading. The instructions cover the lift rule and the PPE but
  stop short of how the dewar physically gets down the corridor, so the trainee is marked down for
  something they were never told.

