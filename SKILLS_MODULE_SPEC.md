# Lab Skills Training & Sign-Off Module — Design Spec

**Project:** `lab-scheduler` (React + Vite + TS + Supabase, HashRouter, GitHub Pages from `docs/`)
**Author:** drafted 2026-08-08 for C. Dutton
**Status:** PLAN — no code written yet. Review and mark up before Phase 1 starts.

---

## 0. What this module is

A catalog of every trainable skill in the lab, and a per-person record of where each
trainee stands on each one. Every skill has three parts, in this order:

1. **Instructions + reading** — a written SOP/procedure held in the app, plus links to
   the vendor doc, protocols.io entry, or paper. The trainee reads it and acknowledges.
2. **Supervised practical** — the trainee performs the skill while a qualified person
   watches, working down a per-skill observable checklist.
3. **Sign-off** — the supervisor attests to the checklist and grants a proficiency level.
   The sign-off is an immutable ledger row, not a mutable flag.

Scope agreed with the PI on 2026-08-08:

| In scope | Out of scope (v1) |
|---|---|
| Wet lab + instrument skills | Field & sampling skills |
| Computational / HiPerGator | Booking-system integration |
| Safety & compliance | |

Booking integration is deliberately deferred. §8 lists the seams to leave open so it can
be added later without a schema rewrite.

---

## 1. Proficiency model

Five stages per person per skill. Stages are ordered; a person is always at exactly one.

| Stage | Meaning | Who can grant it |
|---|---|---|
| `not_started` | No record, or record created but nothing done | — (default) |
| `reading_done` | Trainee has acknowledged reading the instructions | **The trainee themselves** (self-attested, timestamped, records which version of the instructions they read) |
| `trained` | Practical observed; can perform **with supervision** | A signer (see §1.1) |
| `competent` | Signed off to perform **independently** | A signer |
| `trainer` | Independent **and** authorized to sign this skill off for others | **PI or manager only** |

Rules baked into the database:

- **`reading_done` is a prerequisite for a practical sign-off.** You cannot be observed on
  something you have not read. Enforced by the `enforce_signoff_preconditions()` trigger
  in §2.4 — *not* by RLS, because a raised exception gives a usable message and a failed
  `WITH CHECK` does not. Skills flagged `requires_reading = false` skip it (e.g. a UF
  myTraining course where the external course *is* the reading).
- **Nobody signs their own skill.** `skill_signoffs.signed_by <> user_id`, enforced by a
  CHECK constraint *and* by the INSERT policy.
- **`trainer` cannot be self-propagating without a PI in the loop.** Only `pi` and
  `manager` grant `trainer`. A `trainer` can grant up to `competent` on that one skill.
- **Stage only moves up through the sign-off path.** The projection in §2.4 is monotonic:
  a later sign-off at a *lower* stage does not silently demote someone. Demotion happens
  one way only — an explicit revocation, which leaves a ledger record and a reason.
- Prerequisites are advisory in v1: the UI warns loudly and the signer must tick
  "prerequisites waived" with a reason. Hard-blocking prerequisites on ~380 skills will
  produce deadlocks on day one. Revisit after a semester of real data.

### 1.1 Who can sign a given skill

`can_sign_off_skill(signer, skill)` is true when the signer is **active** AND either:

- holds role `pi` or `manager`, **or**
- holds stage `trainer` on **that specific skill**, unexpired.

This is deliberately per-skill, not a blanket role. A grad student who is a `trainer` on
`FLX-21 Labware Position Check` cannot sign off `SEQ-19 Flow cell priming`. This is the
single most important design decision in the module and it is the one most likely to be
softened under pressure — don't.

### 1.2 Expiry and recertification

`user_skills.expires_at` is set at sign-off time from `skills.recert_months`. Null =
never expires. An expired row keeps its stage but the UI renders it as **Expired** and
`can_sign_off_skill` returns false for an expired `trainer`. Nothing is auto-downgraded —
silent state changes are exactly the failure mode the July 2026 audit was about.

Recert intervals in the seed catalog are **proposals, not standards**, except where a
UF course states one (`EHS850G` annual, `EHS852` 2-year, `IRB 803` 3-year, IBC 5-year).

---

## 2. Database schema

Seven tables. Naming, policy shape, and helper-function style follow the conventions
already in `supabase/migrations/20260726000000_harden_roles_deactivation_and_conflicts.sql`.

### 2.1 Enums

```sql
-- MIGRATION 1 of 3 (enum values must be added in their own transaction; this is the
-- same two-file precedent as 20251010130246 adding 'pi_external' before 20251010130316
-- used it).
ALTER TYPE public.entity_type ADD VALUE IF NOT EXISTS 'skill';
ALTER TYPE public.entity_type ADD VALUE IF NOT EXISTS 'user_skill';
```

```sql
-- MIGRATION 2 of 3
CREATE TYPE public.skill_stage AS ENUM (
  'not_started',
  'reading_done',
  'trained',
  'competent',
  'trainer'
);
```

### 2.2 Catalog tables (config — RLS Shape A)

```sql
CREATE TABLE public.skill_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,          -- 'FLX', 'QC', 'HPG'
  name         text NOT NULL,
  description  text,
  icon         text,                          -- emoji, same convention as equipment.icon
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.skills (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        uuid NOT NULL REFERENCES public.skill_categories(id) ON DELETE RESTRICT,
  code               text NOT NULL UNIQUE,    -- 'FLX-21'
  name               text NOT NULL,
  summary            text,                    -- one line: what "competent" looks like
  instructions_md    text,                    -- THE READING COMPONENT. Markdown.
  instructions_version integer NOT NULL DEFAULT 1,
  reading_refs       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{label,url,kind}] kind: vendor|sop|paper|video|course
  equipment_id       uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  requires_reading   boolean NOT NULL DEFAULT true,
  requires_practical boolean NOT NULL DEFAULT true,
  est_train_minutes  integer,                 -- nullable; use ?? not || when reading
  recert_months      integer,                 -- null = no expiry
  external_ref       text,                    -- 'EHS869', 'go.ufl.edu/hpg-training'
  risk_level         text NOT NULL DEFAULT 'standard'
                     CHECK (risk_level IN ('standard','high','critical')),
  sort_order         integer NOT NULL DEFAULT 0,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX skills_category_idx  ON public.skills(category_id);
CREATE INDEX skills_equipment_idx ON public.skills(equipment_id);

CREATE TABLE public.skill_prerequisites (
  skill_id      uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  prereq_id     uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, prereq_id),
  CHECK (skill_id <> prereq_id)
);

-- The observable items a supervisor ticks during the physical check.
CREATE TABLE public.skill_checklist_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  sort_order   integer NOT NULL DEFAULT 0,
  item_text    text NOT NULL,
  is_critical  boolean NOT NULL DEFAULT false, -- a failed critical item blocks sign-off
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX skill_checklist_items_skill_idx ON public.skill_checklist_items(skill_id);

-- Onboarding bundles ("Flex Operator", "Lab Entry Week 1").
CREATE TABLE public.skill_tracks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  description  text,
  icon         text,
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.skill_track_items (
  track_id     uuid NOT NULL REFERENCES public.skill_tracks(id) ON DELETE CASCADE,
  skill_id     uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  sort_order   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (track_id, skill_id)
);
```

### 2.3 Progress tables (owned rows — RLS Shape B)

```sql
-- Current state. One row per person per skill. Maintained by trigger from the ledger,
-- except reading_ack_* which the trainee writes directly.
CREATE TABLE public.user_skills (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id             uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  stage                public.skill_stage NOT NULL DEFAULT 'not_started',
  reading_ack_at       timestamptz,
  reading_ack_version  integer,               -- which instructions_version they read
  last_signoff_id      uuid,                  -- FK added after skill_signoffs exists
  signed_off_at        timestamptz,
  signed_off_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at           timestamptz,
  notes                text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

CREATE INDEX user_skills_user_idx  ON public.user_skills(user_id);
CREATE INDEX user_skills_skill_idx ON public.user_skills(skill_id);
CREATE INDEX user_skills_stage_idx ON public.user_skills(stage);

-- Append-only ledger. This is the record of truth for "who signed what, when".
CREATE TABLE public.skill_signoffs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id          uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  signed_by         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  stage_granted     public.skill_stage NOT NULL
                    CHECK (stage_granted IN ('trained','competent','trainer')),
  observed_at       timestamptz NOT NULL DEFAULT now(),
  -- Snapshot of the checklist AS TICKED, so later edits to the catalog cannot rewrite
  -- history: [{item_id, item_text, passed, comment}]
  checklist_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  prereqs_waived    boolean NOT NULL DEFAULT false,
  waiver_reason     text,
  comments          text,
  expires_at        timestamptz,
  revoked_at        timestamptz,
  revoked_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoke_reason     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (signed_by <> user_id),
  CHECK (revoked_at IS NULL OR revoke_reason IS NOT NULL),
  CHECK (NOT prereqs_waived OR waiver_reason IS NOT NULL)
);

CREATE INDEX skill_signoffs_user_idx  ON public.skill_signoffs(user_id, skill_id);
CREATE INDEX skill_signoffs_signer_idx ON public.skill_signoffs(signed_by);

ALTER TABLE public.user_skills
  ADD CONSTRAINT user_skills_last_signoff_fkey
  FOREIGN KEY (last_signoff_id) REFERENCES public.skill_signoffs(id) ON DELETE SET NULL;
```

**Why a ledger plus a current-state table rather than just one.** The matrix view and the
"can this person book Robin" question (later) both need a fast single-row lookup, and the
compliance question ("show me the signed record for this person on this date") needs the
immutable history. Deriving the matrix from the ledger on every page load means a window
function over every sign-off ever written. Deriving the ledger from the matrix is
impossible. So: both, with the trigger below keeping them consistent in one direction only.

### 2.4 Helper functions and triggers

```sql
CREATE OR REPLACE FUNCTION public.can_sign_off_skill(_signer uuid, _skill_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_signer, ARRAY['pi','manager']::app_role[])
      OR EXISTS (
        SELECT 1
        FROM public.user_skills us
        JOIN public.profiles p ON p.id = us.user_id
        WHERE us.user_id  = _signer
          AND us.skill_id = _skill_id
          AND us.stage    = 'trainer'
          AND (us.expires_at IS NULL OR us.expires_at > now())
          AND p.active    = true
      )
$$;

-- Only PI/manager may mint new trainers.
CREATE OR REPLACE FUNCTION public.can_grant_trainer(_signer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_signer, ARRAY['pi','manager']::app_role[])
$$;
```

Stages are ordered, so the projection needs an ordinal:

```sql
CREATE OR REPLACE FUNCTION public.skill_stage_rank(_s public.skill_stage)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _s
    WHEN 'not_started'  THEN 0
    WHEN 'reading_done' THEN 1
    WHEN 'trained'      THEN 2
    WHEN 'competent'    THEN 3
    WHEN 'trainer'      THEN 4
  END
$$;
```

**Three triggers on `skill_signoffs`, in this order.**

```sql
-- 1. BEFORE INSERT: validate preconditions and stamp expiry.
CREATE OR REPLACE FUNCTION public.enforce_signoff_preconditions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_recert integer;
  v_needs_reading boolean;
  v_acked boolean;
BEGIN
  SELECT recert_months, requires_reading
    INTO v_recert, v_needs_reading
    FROM public.skills WHERE id = NEW.skill_id;

  IF v_needs_reading THEN
    SELECT reading_ack_at IS NOT NULL INTO v_acked
      FROM public.user_skills
      WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
    IF COALESCE(v_acked, false) = false THEN
      RAISE EXCEPTION
        'Cannot sign off: this person has not acknowledged reading the instructions for this skill yet.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  NEW.expires_at := CASE WHEN v_recert IS NULL THEN NULL
                         ELSE NEW.observed_at + (v_recert || ' months')::interval END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_signoff_preconditions_trg
  BEFORE INSERT ON public.skill_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_signoff_preconditions();
```

```sql
-- 2. AFTER INSERT: project onto user_skills. AFTER, not BEFORE, because the row must
-- exist before user_skills.last_signoff_id can reference it. (Verified: a BEFORE trigger
-- does see a populated NEW.id, but the nested INSERT's referential-integrity check fires
-- as an immediate AFTER-row trigger at the end of that nested statement - before the
-- outer tuple is stored - so the non-deferrable FK fails with
-- 'Key (last_signoff_id)=(...) is not present in table "skill_signoffs"'.
-- DEFERRABLE INITIALLY DEFERRED would also work. This split is less clever.)
CREATE OR REPLACE FUNCTION public.apply_skill_signoff()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_skills
    (user_id, skill_id, stage, last_signoff_id, signed_off_at, signed_off_by, expires_at, updated_at)
  VALUES
    (NEW.user_id, NEW.skill_id, NEW.stage_granted, NEW.id, NEW.observed_at, NEW.signed_by, NEW.expires_at, now())
  ON CONFLICT (user_id, skill_id) DO UPDATE SET
    -- MONOTONIC. Without this guard a later sign-off at 'trained' silently demotes
    -- someone already at 'competent' - and silently strips 'trainer', revoking their
    -- per-skill signing authority with no ledger event. Demotion is revocation's job.
    stage = CASE
      WHEN public.skill_stage_rank(EXCLUDED.stage) >= public.skill_stage_rank(public.user_skills.stage)
      THEN EXCLUDED.stage ELSE public.user_skills.stage END,
    last_signoff_id = EXCLUDED.last_signoff_id,
    signed_off_at   = EXCLUDED.signed_off_at,
    signed_off_by   = EXCLUDED.signed_off_by,
    expires_at      = EXCLUDED.expires_at,
    updated_at      = now();
  RETURN NULL;
END;
$$;

CREATE TRIGGER apply_skill_signoff_trg
  AFTER INSERT ON public.skill_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.apply_skill_signoff();
```

```sql
-- 3. BEFORE UPDATE: the ledger is immutable except for revocation.
--    (revocation then recomputes user_skills from the highest non-revoked, unexpired
--     ledger row, falling back to reading_done / not_started if none remains.)
CREATE OR REPLACE FUNCTION public.protect_signoff_columns() ...
```

### 2.5 Protecting `user_skills` from its own owner

**This trigger is not belt-and-braces — it is the only thing standing between a trainee
and their own `signed_off_by` column.** RLS `WITH CHECK` cannot compare against the OLD
row, so it can constrain what a column *is*, not whether it *changed*. A `WITH CHECK` that
only pins `stage` leaves `signed_off_by`, `signed_off_at`, `expires_at` and
`last_signoff_id` freely writable by the row owner. Verified against a live cluster: a
trainee can set all four while leaving `stage = 'reading_done'`, and the update succeeds.

```sql
-- Deliberately NOT security definer: inside a definer function current_user is the owner
-- rather than the caller. See the reasoning block at
-- 20260725180000_fix_profile_trigger_and_role_visibility.sql:9-25.
CREATE OR REPLACE FUNCTION public.protect_user_skill_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- The signoff projection in apply_skill_signoff() runs nested, at depth > 1.
  IF pg_trigger_depth() > 1 THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]) THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- Everyone else may move reading_ack_* and notes. Everything else is pinned to OLD.
  NEW.stage           := OLD.stage;
  NEW.last_signoff_id := OLD.last_signoff_id;
  NEW.signed_off_at   := OLD.signed_off_at;
  NEW.signed_off_by   := OLD.signed_off_by;
  NEW.expires_at      := OLD.expires_at;
  NEW.user_id         := OLD.user_id;
  NEW.skill_id        := OLD.skill_id;

  -- reading_done is a FLOOR, never a ceiling. Re-acknowledging a bumped
  -- instructions_version must not demote someone already trained/competent/trainer.
  IF OLD.stage = 'not_started' AND NEW.reading_ack_at IS NOT NULL THEN
    NEW.stage := 'reading_done';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_user_skill_columns_trg
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_skill_columns();
```

Because this trigger pins the columns, the UPDATE policy in §3.2 does **not** need to
constrain `stage` — and must not, or a `competent` trainee can never re-acknowledge
updated instructions (their NEW row still carries `stage = 'competent'`, which fails a
`stage IN ('not_started','reading_done')` check and rejects the whole update).

### 2.6 `updated_at`

`public.handle_updated_at()` already exists (`20251001155249_…sql:190`) and is attached
elsewhere as `CREATE TRIGGER set_updated_at`. Attach it to `skills` and
`skill_categories` — without it `skills.updated_at` freezes at insert time.
`user_skills.updated_at` is maintained by `protect_user_skill_columns()` above.

### 2.7 Extending `log_activity()` — four blocks, not three

⚠️ **The live definition is migration `20251002145339_6e57a113-4a09-4542-9271-8d2755d500af.sql`**
(*"Update log_activity function to handle tables without user_id column"*), which
superseded the version in `20251002120158` three times over. Read the 2145339 one.

It has **four** blocks that must all be extended:

| Lines | Block | What breaks if you skip it |
|---|---|---|
| 21–28 | `CASE TG_TABLE_NAME` → `v_entity_type` | see below |
| 40–47 | `CASE TG_TABLE_NAME` → `v_entity_name` (DELETE path) | same |
| 49–56 | `CASE TG_TABLE_NAME` → `v_entity_name` (INSERT/UPDATE path) | same |
| ~60–75 | `ELSIF TG_TABLE_NAME IN ('projects','equipment','app_versions') THEN v_user_id := auth.uid();` | **`skills` must be added to this list** |

Two corrections to the obvious assumptions:

1. **The failure is not a NULL.** `CASE … END CASE;` in PL/pgSQL is a *statement*, not an
   expression: with no matching `WHEN` and no `ELSE` it raises **`CASE_NOT_FOUND`
   (SQLSTATE 20000, "case not found / CASE statement is missing ELSE part")** at the CASE
   itself. The INSERT is never reached. Same conclusion — every write to the new table
   fails at runtime — but that is the error text someone will be grepping for.
2. **`skills` has no `user_id` column.** The `ELSE` arm at ~:66 does
   `COALESCE(auth.uid(), CASE WHEN TG_OP='DELETE' THEN OLD.user_id ELSE NEW.user_id END)`,
   which errors with `record "new" has no field "user_id"`. Add `'skills'` (and any other
   catalog table you attach the trigger to) to the `IN (...)` list on that line.

Also: the entity-name blocks use `NEW.name` / `OLD.name`. `user_skills` and
`skill_signoffs` have no `name` column — their `WHEN` arms must build a label some other
way (e.g. subselect the skill code), not reference `.name`.

Entity type mapping:

```
WHEN 'skills'         THEN 'skill'
WHEN 'user_skills'    THEN 'user_skill'
WHEN 'skill_signoffs' THEN 'user_skill'
```

Attach the trigger to `skills`, `user_skills`, and `skill_signoffs`. Do **not** attach it
to `skill_checklist_items` or the track tables — that is noise.

**`src/pages/ActivityLog.tsx` hardcodes the `entity_type` union in FOUR places**, and the
two that look most important are not the ones that matter most:

| Line | What | Consequence if missed |
|---|---|---|
| :20 | `interface ActivityLog` field union | **the only typecheck blocker** |
| :86 | narrowing cast in the filter query | compiles fine against a widened enum — cosmetic |
| :151–158 | `getEntityLabel`'s `labels` map | badge renders the raw string `user_skill` |
| :214–219 | the `<SelectItem>` list | **this is the filter dropdown** — widening :20 and :86 does nothing for it |

---

## 3. RLS policies

House idiom: sentence-case names, always `TO authenticated`, `DROP POLICY IF EXISTS`
immediately before each `CREATE POLICY`.

### 3.1 Catalog tables — Shape A (open read, elevated manage)

Applies to `skill_categories`, `skills`, `skill_prerequisites`,
`skill_checklist_items`, `skill_tracks`, `skill_track_items`.

```sql
CREATE POLICY "Everyone can view skills"
  ON public.skills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Elevated roles can manage skills"
  ON public.skills FOR ALL TO authenticated
  USING      (public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','postdoc','grad_student','manager','pi_external']::app_role[]));
```

> Note this uses the **canonical 5-role elevated set**, *not* the 6-role set that
> `equipment` uses. `undergrad_student` can edit equipment (migration `20260202204759`)
> — a known oddity flagged in `permissions.ts`. Do not propagate it here: an undergrad
> should not be able to edit the definition of the skill they are being assessed on.
>
> Also note: unlike the existing `FOR ALL` policies in this repo, this one carries
> `WITH CHECK` as well as `USING`. The existing omission is drift, not the convention.

### 3.2 `user_skills` — Shape B

```sql
-- Everyone can see everyone's progress. This is deliberate: the point of the matrix is
-- that a trainee can find someone qualified to supervise them.
CREATE POLICY "All authenticated users can view skill progress"
  ON public.user_skills FOR SELECT TO authenticated
  USING (true);

-- The ONLY thing a person writes directly to their own row is the reading
-- acknowledgement (and notes). Everything else is pinned by
-- protect_user_skill_columns() - see §2.5, which is where the real enforcement lives.
-- Note the INSERT check pins expires_at and last_signoff_id too: without them a trainee
-- could seed their own row with a 10-year expiry, or point last_signoff_id at somebody
-- else's sign-off (skill_signoffs SELECT is open).
CREATE POLICY "Active users can start their own skill record"
  ON public.user_skills FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_user(auth.uid())
    AND stage IN ('not_started','reading_done')
    AND signed_off_at   IS NULL
    AND signed_off_by   IS NULL
    AND last_signoff_id IS NULL
    AND expires_at      IS NULL
  );

-- Deliberately does NOT constrain `stage` in WITH CHECK. WITH CHECK is evaluated against
-- the NEW row, so `stage IN ('not_started','reading_done')` would reject any update by a
-- person already at trained/competent/trainer - including re-acknowledging a bumped
-- instructions_version, which is exactly who needs to. The trigger pins stage instead.
CREATE POLICY "Active users can update their own skill record; PI and managers can amend"
  ON public.user_skills FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND public.is_active_user(auth.uid()))
    OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[])
  );

CREATE POLICY "PI can delete skill records"
  ON public.user_skills FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'pi'));
```

> **Do not try to close this with RLS alone.** A `WITH CHECK` can constrain what a column
> *is*, not whether it *changed*, so it cannot stop a trainee writing `signed_off_by`,
> `signed_off_at`, `expires_at` or `last_signoff_id` on their own row, and it cannot stop
> a self-*demotion* from `competent` back to `reading_done` — which would silently strip
> a `trainer`'s signing authority with no ledger event. `protect_user_skill_columns()`
> in §2.5 is the control. This is the same shape as `protect_profile_columns` for
> `profiles`; see the reasoning block at
> `20260725180000_fix_profile_trigger_and_role_visibility.sql:9-25`.

### 3.3 `skill_signoffs` — the authority table

```sql
CREATE POLICY "All authenticated users can view sign-offs"
  ON public.skill_signoffs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Qualified signers can sign off skills"
  ON public.skill_signoffs FOR INSERT TO authenticated
  WITH CHECK (
    signed_by = auth.uid()
    AND signed_by <> user_id
    AND public.is_active_user(auth.uid())
    AND public.can_sign_off_skill(auth.uid(), skill_id)
    AND (stage_granted <> 'trainer' OR public.can_grant_trainer(auth.uid()))
  );

-- Revocation only; the row is otherwise immutable. Column immutability is enforced by
-- a trigger, because a WITH CHECK cannot compare against the OLD row.
CREATE POLICY "PI and managers can revoke sign-offs"
  ON public.skill_signoffs FOR UPDATE TO authenticated
  USING      (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['pi','manager']::app_role[]));

CREATE POLICY "PI can delete sign-offs"
  ON public.skill_signoffs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'pi'));
```

Plus `protect_signoff_columns()` — a `BEFORE UPDATE` trigger that raises unless the only
changed columns are `revoked_at`, `revoked_by`, `revoke_reason`.

---

## 4. `src/lib/permissions.ts`

Three new flags, in the house comment style (every flag names the policy it mirrors,
every surprising `false` gets an inline comment).

```ts
  /**
   * Can create and edit the skill catalog itself. Mirrors skills / skill_categories /
   * skill_checklist_items / skill_tracks ALL:
   *   has_any_role(pi, postdoc, grad_student, manager, pi_external)
   * Note this is the canonical 5-role elevated set, NOT the 6-role set used by equipment
   * - undergrad_student is deliberately excluded so a trainee cannot edit the definition
   * of the skill they are assessed on.
   */
  canManageSkillCatalog: boolean;

  /**
   * Purely a UI affordance: whether to show the "Sign off" tab at all. The real authority
   * is PER SKILL and lives in can_sign_off_skill(auth.uid(), skill_id) - a grad student
   * who is a trainer on FLX-21 can sign FLX-21 and nothing else. This flag must NOT be
   * used as a blanket "can sign anything" check; query the per-skill helper.
   */
  canSignOffSomeSkills: boolean;

  /**
   * Can mint new trainers. Mirrors the stage_granted='trainer' arm of the
   * skill_signoffs INSERT policy: can_grant_trainer() = has_any_role(pi, manager).
   */
  canGrantSkillTrainer: boolean;
```

Per-role values:

| Role | `canManageSkillCatalog` | `canSignOffSomeSkills` | `canGrantSkillTrainer` |
|---|---|---|---|
| `pi` | true | true | true |
| `manager` | true | true | true |
| `pi_external` | true | true¹ | false |
| `postdoc` | true | true¹ | false |
| `grad_student` | true | true¹ | false |
| `undergrad_student` | false² | true¹ | false |
| `user` | false | false | false |

¹ `true` only means "show the tab" — the tab is empty unless they hold `trainer` on
something. Compute the real list client-side from `user_skills where user_id = me and
stage = 'trainer'`.
² undergrad is excluded here even though it *is* included in the equipment ALL policy.

**`src/components/ProtectedRoute.tsx:7`** — `requirePermission` is a hand-maintained
string-literal union of four flags, not `keyof RolePermissions`. Add
`'canManageSkillCatalog'` or the route gate will not typecheck.

---

## 5. UI

### 5.1 Routing

One route, `/skills`, with Tabs — **not** nested routes. `Navigation.tsx` matches the
active item with `location.pathname === item.path` (exact), so `/skills/:id` would
un-highlight the nav item.

Four edits to add the page, per house convention:

1. `src/App.tsx` — import + `<Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />`, above the catch-all
2. `src/components/Navigation.tsx` — `{ path: "/skills", label: "Skills", icon: GraduationCap }`
3. `src/components/MobileNavigation.tsx` — same entry, label `"Skills"`
4. `src/components/ProtectedRoute.tsx` — widen the union (only if the route is gated; the page itself is open to everyone, so this is only needed for the Settings section)

### 5.2 Tabs on `/skills`

| Tab | Audience | Contents |
|---|---|---|
| **My Training** | everyone (default tab) | Progress ring + the person's assigned tracks; each skill as a `Card` row showing stage badge, expiry, and the next action ("Read instructions" → "Request check" → done). Grouped by track, then category. |
| **Catalog** | everyone | Searchable, category-filtered browse of all skills. Click → skill detail Dialog. |
| **Sign Off** | anyone with `trainer` on ≥1 skill, or pi/manager | Pick person → pick skill (list restricted to what the signer may actually sign) → checklist → sign. |
| **Matrix** | everyone | The who-can-do-what grid. People × skills, filtered to one category or track at a time (a 380-column grid is unusable). Cells are colored stage badges. |

### 5.3 Skill detail Dialog

`Dialog` + `ScrollArea`, three sections:

1. **Instructions** — `instructions_md` rendered as markdown, plus the `reading_refs` link
   list (vendor doc, protocols.io, UF course). Bottom of the section: a checkbox
   *"I have read and understood these instructions"* → writes `reading_ack_at` and
   `reading_ack_version` via `settleWrite`.
2. **Practical checklist** — read-only preview of `skill_checklist_items` so the trainee
   knows exactly what they will be observed on. Critical items visually marked.
3. **My record** — stage, who signed, when, expiry, and the full sign-off history for
   this skill including revoked entries (struck through, with the reason).

Add `react-markdown` to render `instructions_md`. It is not currently a dependency.
Alternative if you'd rather not add one: store instructions as sanitized HTML and render
with `dangerouslySetInnerHTML` — **don't**; markdown-in-a-textarea is what the PI will
actually maintain, and an XSS hole in a lab app is still an XSS hole.

### 5.4 Sign-off flow

The one place worth being fussy about.

1. Signer picks a trainee (`Select` of active profiles) and a skill (`Select` restricted
   to `can_sign_off_skill` — computed client-side from their `trainer` rows plus role).
2. The dialog shows **prerequisite status**: each unmet prereq listed in a destructive-
   variant callout. Proceeding requires ticking `prereqs_waived` and typing a reason.
3. The **checklist** renders as one `Checkbox` + optional comment `Input` per item.
   Critical items are marked and cannot be left unticked if granting `competent`.
4. Stage selector: `trained` / `competent` / `trainer`. `trainer` is disabled unless
   `canGrantSkillTrainer`.
5. Confirmation step restates in plain language: *"You are signing off Jane Doe as
   COMPETENT (independent) on FLX-21 Labware Position Check. This expires 2027-08-08.
   Your name goes on this record permanently."*
6. Insert with `settleWrite(... .select("id"), "You are not authorized to sign off this
   skill.")`.

### 5.5 Conventions to match

Confirmed from the existing code — deviating from these will be visible:

- **No TanStack Query.** It is installed and `QueryClientProvider` wraps the app, but
  `useQuery` appears zero times in `src/`. Use `useEffect` + a named `fetchX()` async
  function + `try / if (error) throw error / catch { console.error; toast.error } /
  finally { setIsLoading(false) }`.
- **sonner for toasts** (`import { toast } from "sonner"`). The repo is genuinely mixed —
  both `<Toaster />` and `<Sonner />` are mounted (`App.tsx:60-61`) and `useToast` is used
  by six pages (`ActivityLog`, `Analytics`, `Auth`, `Index`, `QuickAdd`,
  `ResetPasswordVerify`) — but sonner is the majority (15 files) and it is what
  `Equipment.tsx` and `Settings.tsx` use. `settleWrite` returns a bare string message,
  which only works with sonner.
- **`settleWrite()` on every UPDATE/DELETE**, query always ending `.select("id")`, and the
  verbatim `if (!result.ok) { toast.error(result.message); return; }` block.
- **No `Table` component.** Tabular data is raw `<table className="w-full">` with
  `<tr className="border-b hover:bg-muted/50">` and `<th className="text-left py-3 px-4">`.
  The matrix follows this.
- **Destructive confirmation is mixed — copy `Equipment.tsx`, not `BookingCard.tsx`.**
  Native `confirm()` in `Equipment.tsx`, `History.tsx`, `Schedule.tsx` and `Settings.tsx`;
  shadcn `AlertDialog` in `BookingCard.tsx:22` and `Schedule.tsx:19`. Revoking a sign-off
  should follow the `Equipment.tsx:203-284` pattern regardless of which widget: count what
  is affected first, bail entirely if the count query fails, state real numbers in the
  prompt, and warn when the count itself is RLS-incomplete.
- **Layout shell:** `<div className="min-h-screen bg-background"><Navigation /><main
  className="container mx-auto px-6 py-8">…</main><Footer /></div>`, `h1.text-4xl.font-bold`
  plus a muted `p`, card grids `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`,
  mobile tap targets `min-h-[44px]`.
- **Empty states** are a full sentence naming the next action; loading is a centered
  `<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />`.
- **`??` not `||`** for `est_train_minutes` and `recert_months` — 0 is meaningful.
- Catalog CRUD in `Settings.tsx` copies the **Lab Projects** section
  (`Settings.tsx:931-1069`): one `isAddXDialogOpen` flag + one `editingX` target, a prefill
  `useEffect` keyed on the target that also resets on `null`, one `handleSaveX` branching
  on `if (editingX)`, list rows as `<Card className="p-4">` with ghost Edit/Trash buttons.

---

## 6. Build phases

| Phase | Deliverable | Depends on |
|---|---|---|
| **0. Freeze the catalog** | ~~PI answers the open questions~~ **DONE** — inventory read live, workflows confirmed, and `20260808020000_seed_skills_catalog_v1.sql` holds 53 fully-written skills with 304 checklist items. | ✅ |
| **1. Schema** | 3 migrations (enum values → types+tables+RLS+triggers → seed), regenerated `src/integrations/supabase/types.ts`, `permissions.ts` flags, `log_activity()` four-block extension, `ActivityLog.tsx` four-place enum widening. Verify with `npm run typecheck` **and** by writing the RLS probe script in §11 before shipping. | 0 |
| **2. Catalog + editing** | `/skills` with **Catalog** and **My Training** tabs, skill detail Dialog, reading acknowledgement — **plus the Settings catalog CRUD, moved forward from Phase 5.** Enable/disable toggle and instructions editor ship together with the first read-only view, because the seed content will be wrong in places and you need to fix it without waiting for a migration. | 1 |
| **3. Sign-off** | **Sign Off** tab, checklist capture, ledger writes, revocation. PI seeds the first `trainer` rows through Settings. | 2 |
| **4. Matrix & gaps** | **Matrix** tab; "who can supervise X"; expiring-soon list; per-person printable training passport (print stylesheet, not a library). | 3 |
| **5. Track assignment** | Assign a person to a track; progress rings; the onboarding checklist view a new undergrad actually opens on day one. | 3 |
| **6. Deferred** | Booking integration (§8), email/notification reminders for expiring certs, Gator TRACS roster reconciliation export. | 4 |

Phases 2–5 are each shippable on their own.

---

## 6A. The enable / modify contract

You asked to be able to turn skills on and off and edit them. Three mechanisms, and they
have to not fight each other:

**1. `active` on every table.** `skill_categories.active`, `skills.active`,
`skill_tracks.active`. Disabling hides a skill from the catalog, from tracks, and from the
sign-off picker — but **existing `user_skills` rows and `skill_signoffs` history are
untouched**. Nobody loses a sign-off because you retired a skill. The matrix shows disabled
skills only when you tick "include retired".

**Never delete a skill that has sign-offs against it.** Disable it. `skills.category_id`
is `ON DELETE RESTRICT` and the ledger FKs are `ON DELETE CASCADE`, so a delete would take
the history with it. The Settings UI should refuse the delete and offer disable instead,
following the count-first pattern in `Equipment.tsx:203-284`.

**2. Editing instructions.** `instructions_md` is a plain markdown textarea in the Settings
editor. Bump `instructions_version` when the change is material — that is what makes
previously-acknowledged trainees show as "instructions updated since you read them" rather
than silently reading a different document than the one they signed against.

**3. Re-running the seed migration.** The seed is `ON CONFLICT (code) DO UPDATE`, and the
update list **deliberately omits `active`**. So:

| You did this | Re-running the seed |
|---|---|
| Disabled a skill | leaves it disabled |
| Edited instructions in the UI | **overwrites them** — the seed owns `instructions_md` |
| Edited a checklist item | **overwrites it** — checklist items are deleted and re-inserted per skill |
| Added your own skill with a new code | untouched |

That last column is the sharp edge. Once you start editing seeded content in the UI, either
stop re-running the seed, or delete the rows you have taken ownership of from the seed file.
The cleanest long-term pattern: treat the seeded 53 as a starting library, and put
lab-authored content in new skills with your own codes.

**Verified** on a scratch Postgres 16: schema built, seed applied twice, counts unchanged
(53 / 304 / 57 / 7 / 55 / 64), a manually-disabled skill stayed disabled through a re-run,
every practical skill has checklist items, no mutual prerequisite cycles, all 64 equipment
links resolved across 16 machines.

---

## 7. Seeding

No seed data exists anywhere in the repo today (checked: no `INSERT INTO equipment` in any
migration, no `scripts/`, no CSV; `src/lib/mockData.ts` is unrelated placeholder data from
a template and is imported by nothing).

Seed the catalog from a versioned SQL migration using
`INSERT … ON CONFLICT (code) DO UPDATE SET …` so re-running is safe and later catalog
revisions ship as new migrations. Keep `instructions_md` short in the seed — a stub
pointing at the vendor doc — and let the PI fill in real SOP text through the Settings UI
in Phase 5. Trying to author 380 SOPs before shipping is how this project dies.

---

## 8. Seams for later booking integration

Not built in v1. Leave these in place so it is additive:

- `skills.equipment_id` links a skill to an `equipment` row — but see §9: a skill can apply
  to more than one machine (both Flexes, both OT-2s, four nanopore devices), so prefer a
  `skill_equipment(skill_id, equipment_id)` join table over the scalar column.
- A future `equipment_required_skills(equipment_id, skill_id, min_stage, enforcement)`
  join table, with `enforcement IN ('off','warn','block','supervised')`, is all that is
  needed. Nothing in the v1 schema has to change.
- The check itself would be a `STABLE SECURITY DEFINER` function
  `has_required_skills(_user_id, _equipment_id)` called from the existing
  `check_booking_conflicts()` BEFORE trigger — **not** a new trigger, and **not** RLS.
  Booking conflict logic is already centralized there and the audit note explains why.
- Remember `bookings.collaborators` (jsonb) already exists — the "supervised booking"
  option would read from it.

---

## 9. Open questions — mostly RESOLVED 2026-08-08

The live database was read through the **Lovable connector** (project
`f95bec5c-9e0c-4b9e-af6b-762e8f27693f`, workspace `Christopher's Lovable`), which reaches
`ypaobygipbnkvnismhyy` directly. The Supabase MCP connector still cannot — it is scoped to
a different org — but it is no longer needed. **Use `mcp__Lovable__query_database` for
this project.**

### Resolved

| # | Question | Answer |
|---|---|---|
| 1 | Equipment list | 29 rows, read live. Full inventory at the top of `SKILLS_CATALOG_v1.md`. |
| 2 | Is Robin an Opentrons Flex? | **Yes — and there are two Flexes and two OT-2s.** Robin (extractions), Batman (96-head, Zymo full-gene 16S), Alfred + Ethan (OT-2). A new OT2 category was added and `FPY-16` (OT-2→Flex conversion) promoted to core. |
| 3 | Which DeNovix? | **DS-11.** No QFX — those two skills are deleted. The **Qubit is in active use** (11 bookings) and is the lab's stated accuracy reference over the Denovix. |
| 4 | Nanopore in-house or ICBR? | **In-house, four devices: MK1D, MK1c, MK1b-1, MK1b-2. No Illumina at all.** Illumina section cut 9 → 2 skills; all nanopore rows promoted to core. Sign off Mk1B / Mk1C / Mk1D separately — different compute models. |
| 5 | Sizing platform | **TapeStation 2200.** Bioanalyzer 2100 is in `maintenance` ("not hooked up"). No Fragment Analyzer. `QC-20` molarity math has its input. |
| 6 | qPCR model | **QuantStudio 3.** Plus an **Absolute Q dPCR** — microfluidic array, *not* droplet ddPCR; `PCR-21` rewritten. |
| 7 | Culture and biogeochemistry in-house? | **Culture: no** — no incubator, no anaerobic chamber, no microscope. Recommend dropping the MIC category. **Biogeochem: yes, but not as guessed** — Picarro G2508 CRDS + "Tom and Jerry" exetainer evacuation + Shimadzu TOC. **No GC**; that section was rebuilt. |
| 1a | Is `types.ts` stale? | Checked column-by-column against the live schema: **the 10 app tables match exactly.** The only discrepancy was `password_reset_tokens` — see below. |

### Newly discovered, needs your decision

**`password_reset_tokens` still exists in production.** `config.toml` says it was removed;
it was not. The live table holds **44 rows, 0 of them unexpired-and-unused**. So
`supabase/migrations/20260808000000_drop_password_reset_tokens.sql` is **not** the no-op
that migration's header claims — applying it drops a real table. Nothing reads it (all five
`functions.invoke` call sites target `manage-users`; recovery runs on Supabase PKCE), and
44 dead reset tokens are worth clearing out rather than keeping. But it is a live drop, so
it is your call. Fix the header comment when you decide.

### Closed by the PI 2026-08-08

**Module split per robot: don't.** The Flexes are used for **DNA extraction** and
**full-gene 16S library prep**, so trainees are signed off on the *module set* those two
workflows need — Magnetic Block, Heater-Shaker, Temperature Module, Thermocycler GEN2,
HEPA/UV — not per machine. `FLX-09` (96-head) stays Batman-specific because only Batman
has one. The booking note *"Barcoding and Thermocycling T3"* confirms a Thermocycler GEN2
on deck, so `AEX-20` (on-deck barcoding and thermocycling) is a real skill.

Implication for the schema: `skills.equipment_id` is a single FK, which cannot express
"this skill applies to both Flexes." Options, in order of preference:

1. **Leave `equipment_id` null on the shared FLX rows** and let the category carry the
   meaning. Simplest; loses the equipment→skill link for the booking integration later.
2. **Add `skill_equipment(skill_id, equipment_id)`** as a many-to-many and drop the scalar
   column. Costs one table, keeps the §8 booking seam intact, and correctly models "Robin
   or Batman." **Recommended** — it is cheaper to add now than to migrate later.

### Still open

1. **Is `pi_external` allowed to edit the skill catalog?** There is exactly one
   (Kyle McCulloch, 1 booking). They can edit projects and equipment today.
3. **Scale.** 29 active accounts (2 PIs, 1 external PI, 6 postdocs, 12 grad students,
   8 undergrads); 15 have never booked anything. 218 core skills × 29 people = 6,300 cells.
   Recommend seeding tracks T1 + T2 + T3 only (~90 skills) for the first semester.

## 10. Risks

- **Catalog bloat kills adoption.** 380 skills is a reference taxonomy, not a checklist.
  Ship ~110 (the v1 Core set, marked in the catalog) and grow from real gaps.
- **Sign-off theater.** If the checklist is generic ("performed the procedure correctly"),
  the record is worthless. Every checklist item must be something a supervisor can
  *observe*, not something they can *assume*.
- **The `trainer` grade will get diluted.** In year two someone will want to make all grad
  students trainers on everything to clear a backlog. That converts the module into a
  spreadsheet with extra steps.
- **Expiry without notification is worse than no expiry.** Phase 4 must ship the
  expiring-soon view, or people find out they're lapsed at audit time.
- **Two sources of truth for compliance.** UF's Gator TRACS / LATCH roster is the
  institutional record of record. This app must not contradict it. Treat the UF-formal
  rows here as a *mirror with a link*, and put a visible "verify in myTraining" note on
  every `UF-FORMAL` skill.

---

## 11. Required RLS probe before Phase 1 ships

The July 2026 audit exists because RLS and the client's idea of RLS drifted apart. Do not
take §3 on trust. Before merging Phase 1, run these as an ordinary `authenticated`
trainee (in a rolled-back transaction, the same way the audit migration was verified) and
paste the results into the migration's closing verification block:

| # | Attempt | Expected |
|---|---|---|
| 1 | Self-promote own `user_skills.stage` to `competent` | REJECTED |
| 2 | Self-promote own `user_skills.stage` to `trainer` | REJECTED |
| 3 | Self-demote own `stage` from `competent` to `reading_done` | pinned — stage unchanged |
| 4 | Set own `signed_off_by` / `signed_off_at` / `expires_at` while leaving `stage` alone | pinned — all unchanged |
| 5 | INSERT own row with `expires_at = now() + 10 years` | REJECTED |
| 6 | INSERT own row with `last_signoff_id` = someone else's sign-off | REJECTED |
| 7 | Set `reading_ack_at` while already at `competent` | **ALLOWED, stage stays `competent`** |
| 8 | INSERT a `skill_signoffs` row with `signed_by = user_id` | REJECTED |
| 9 | INSERT a sign-off for a skill they are not a `trainer` on | REJECTED |
| 10 | A `trainer` on skill X grants `trainer` on skill X | REJECTED (PI/manager only) |
| 11 | A `trainer` grants `competent` on a *different* skill | REJECTED |
| 12 | Sign off `trained` on a skill the trainee has not acknowledged reading | REJECTED with a readable message |
| 13 | Sign off `trained` on someone already `competent` | ALLOWED, stage stays `competent` (monotonic) |
| 14 | An expired `trainer` signs anything | REJECTED |
| 15 | A deactivated (`profiles.active = false`) `trainer` signs anything | REJECTED |
| 16 | An undergrad edits a `skills` row | REJECTED |
| 17 | Insert a row into `skills`, then `user_skills`, then `skill_signoffs` | all three write an `activity_logs` row, none raise `CASE_NOT_FOUND` or `record "new" has no field "user_id"` |
