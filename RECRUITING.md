# Undergraduate recruiting module

A public application page for undergraduate research positions, plus an authenticated
review queue for the mentors who own the listings.

- `#/join` — public. Policies, open positions, the four-step application form.
- `#/positions` — mentors create and manage their own listings.
- `#/review` — mentors read the applications ranked to their listings.

Everything is additive. No existing table, policy, function or route was changed.

---

## Current state — read this first

**This is live.** All four migrations are applied to production and verified, the Fall 2026
cycle is open, and all five listings are public. `#/join` accepts applications the moment
the site is deployed.

| | |
| --- | --- |
| Cycle | `fall-2026`, open **22 Aug 2026 → 19 Sep 2026** |
| Listings | 5, all `open`, owned by Ava Gabrys (×2), Tavis Goldwire, Suzanna Mickey, Lee Nonnamaker |
| Submission path | direct to the database — `recruiting_submit_application_public()` |
| Bot protection | **proof of work** + honeypot + minimum time-on-form + hourly cap + one-per-address |
| Projects | the scheduler's own list. There is no second project table. |
| Mentors | assigned by the PI on `#/positions`, per listing |
| Emails | none, by design. `#/review` is the notification. |

## Adding a project

**In Settings → Projects, the same place you always have.** There is no separate
recruiting project list any more — a listing points at the scheduler's project, which is
what makes "who did we recruit onto Hippo, and what have they booked since" a single join.

Two fields matter for recruiting:

- **Name** — appears as the small label above the role title on the public page.
- **Description** — becomes the public blurb. One sentence a second-year could follow. It
  is only ever shown for a project that has an open listing.

The **icon** shows up on the public listing card too.

## Assigning a mentor

On `#/positions`, in the listing dialog. As PI you get a **Mentor** picker listing every
active person with their role; whoever is named there is the only person besides you who
can edit that listing, and the only one who sees its applications. Anyone else creating a
listing owns it automatically and cannot reassign it — that is enforced by RLS, not just
by the UI.

Reassigning is how you hand a project over when someone leaves: change the mentor and the
applications follow.

## Bot protection

### What is running now

A **proof of work**. The database issues a single-use challenge; the applicant's browser
must find a nonce whose SHA-256 begins with 18 zero bits, which is about a quarter of a
million hashes. It runs in the background from the moment they reach the last step, so in
practice they never wait for it — measured at ~300 ms in headless Chromium, and a second
or two on a slow phone.

It is not a human check. What it does is make every submission cost measurable CPU: ten
thousand fake applications is hours of a core, on top of needing ten thousand distinct
ufl.edu addresses and beating the hourly cap.

Alongside it: one application per address per cycle (a unique index, not a
check-then-insert), a honeypot field, a 20-second minimum time-on-form, and a cap of 40
applications an hour.

Two dials, both on the cycle row, both effective immediately with no rebuild:

```sql
-- Under attack: 22 bits is about 15 seconds of work per submission.
UPDATE public.recruiting_cycles SET pow_difficulty_bits = 22 WHERE cycle = 'fall-2026';

-- Locking real applicants out on slow devices? 0 disables the gate entirely.
UPDATE public.recruiting_cycles SET pow_difficulty_bits = 0  WHERE cycle = 'fall-2026';

-- Expecting a rush after an announcement email:
UPDATE public.recruiting_cycles SET max_submissions_per_hour = 120 WHERE cycle = 'fall-2026';
```

### Turnstile is still the better answer

Proof of work costs an attacker CPU; Turnstile actually tells a person from a script. It is
written and wired on both sides. To turn it on:

1. Cloudflare dashboard → Turnstile → **Add site**, hostname `ufduttonlab.github.io`.
2. Put the **site key** in `.env` as `VITE_TURNSTILE_SITE_KEY`, and rebuild.
3. Put the **secret** in Supabase → Edge Functions → Secrets as `TURNSTILE_SECRET`.
4. Deploy the edge function: `supabase functions deploy submit-application`.
5. Flip the switch:

   ```sql
   UPDATE public.recruiting_cycles SET require_turnstile = true WHERE cycle = 'fall-2026';
   ```

Step 5 is what makes it real. From then on the database **refuses** every direct
submission, and `#/join` posts to the edge function instead. The flag lives on the cycle
row rather than in the bundle so the client cannot choose the weaker door once the stronger
one exists — and so turning it on takes effect for everyone immediately, with no rebuild.

To back out, set the flag to `false` again.

## Turning an accepted applicant into a lab member

On `#/review`, open an application and use **Create lab account** (PI only). It calls the
same `manage-users` function Settings uses — so accounts still come into existence exactly
one way, and it writes its own `activity_logs` entry — creates the profile with role
Undergraduate Student, hands you the one-time password to pass on, and records the link.

If an account already uses that address it offers **Link to the existing account** instead
of creating a duplicate.

Once linked, the application is joined to everything else the scheduler knows:

```sql
SELECT a.full_name, a.cycle,
       count(DISTINCT b.id)  AS bookings,
       count(DISTINCT s.id)  AS skill_signoffs
  FROM public.recruiting_applications a
  LEFT JOIN public.bookings b       ON b.user_id = a.profile_id
  LEFT JOIN public.skill_signoffs s ON s.user_id = a.profile_id
 WHERE a.profile_id IS NOT NULL
 GROUP BY 1, 2;
```

Only a PI can set that link — enforced by a trigger, because a row policy cannot see which
column an UPDATE touched.

## Two doors, one insert

```
#/join
  │
  ├── require_turnstile = false  ──▶  recruiting_submit_application_public()   [anon may call]
  │                                     honeypot · time-on-form · hourly cap
  │                                     full field validation → { ok, error, fields }
  │                                     proof of work (last, so a typo does not spend it)
  │                                                │
  └── require_turnstile = true   ──▶  submit-application (edge fn)             [Turnstile]
                                        full field validation → { ok, error, fields }
                                                │
                                                ▼
                                   recruiting_submit_application()   [service_role only]
                                     one transaction: application + ranked choices
                                                │
                                                ▼
                                      CHECK constraints, unique index
```

Both doors end at the same insert, so every constraint applies either way. The public
function is `SECURITY DEFINER` and calls the service-role one from inside that context;
`anon` and `authenticated` cannot call the inner function directly.

### Deployment

`.github/workflows/build-docs.yml` builds the site and publishes it straight to GitHub
Pages. It commits nothing — `permissions: contents: read`, so it *cannot* push even if
someone later edits it carelessly.

**It needs Settings → Pages → Source set to "GitHub Actions".** Until that is flipped the
deploy step fails, which is the one expected red X on the run that introduces it. Flip the
setting, then Actions → Deploy to GitHub Pages → Run workflow.

`docs/` is dead weight once that is done and can be deleted from the repo. Nothing reads it.

#### Why it works this way

The first version of this workflow rebuilt `docs/` and committed it back to `main`. It
worked, and it was wrong: it gave `main` two authors. On 2026-08-22 it pushed
`20d2cb0a "Rebuild docs/ from b72e819"` 42 seconds after a human push, moved `origin/main`
under work in progress, and forced a merge commit on the next push. Compounding it, a
`docs/` built by hand elsewhere and one built in CI never hash the same — different Node
versions — so `docs/` changed on *every* run and the churn was guaranteed.

**One artifact, one producer.** Do not reintroduce a workflow that commits build output,
and do not hand-build `docs/` alongside one that does.

## Rebuilding the database from scratch

All four migrations are applied. This section exists for a rebuild, in this order. Each is
idempotent enough to re-run; the seed is the only one designed for it.

```
supabase/migrations/20260822100000_recruiting_schema.sql
supabase/migrations/20260822110000_recruiting_rls.sql
supabase/migrations/20260822120000_recruiting_seed_fall_2026.sql
supabase/migrations/20260822130000_recruiting_direct_submit.sql
```

Apply them the way the rest of this project's migrations are applied — through the Lovable
connector against project `f95bec5c-9e0c-4b9e-af6b-762e8f27693f`, or from the Supabase SQL
editor. The Supabase MCP connector is authorised for a different org and cannot reach this
project.

### Verify before writing "APPLIED LIVE" on anything

A header is a claim about the past, not an intention. These are the queries that were run
on 2026-08-22 before the headers were changed.

```sql
-- 1. Six tables, RLS on, and the policy counts the RLS migration creates.
SELECT c.relname, c.relrowsecurity,
       (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS policies
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relname LIKE 'recruiting%' AND c.relkind = 'r'
 ORDER BY 1;
-- expect: application_positions 1, applications 3, cycles 3, positions 6, projects 3,
--         reviews 4 — and relrowsecurity true on all six.

-- 2. anon holds SELECT on exactly three tables and nothing else anywhere.
SELECT table_name, string_agg(privilege_type, ',' ORDER BY privilege_type)
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public' AND grantee = 'anon' AND table_name LIKE 'recruiting%'
 GROUP BY table_name ORDER BY 1;
-- expect exactly: recruiting_cycles SELECT, recruiting_positions SELECT,
--                 recruiting_projects SELECT.  Anything else is a hole.

-- 3. anon may call exactly two functions: the open-cycle lookup and the public submit.
--    In particular recruiting_submit_application must be false for both anon and
--    authenticated — that is the inner, service-role-only insert.
SELECT p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname LIKE 'recruiting%' ORDER BY 1;

-- 4. UPDATE on applications is granted on the `status` column and no other.
SELECT column_name FROM information_schema.column_privileges
 WHERE table_schema='public' AND table_name='recruiting_applications'
   AND grantee='authenticated' AND privilege_type='UPDATE';
-- expect exactly one row: status.
```

### Deploying the edge function — only when you turn Turnstile on

`supabase/functions/submit-application/index.ts` is **not deployed**, and does not need to
be while `require_turnstile` is false. When you do deploy it, note the
`[functions.submit-application] verify_jwt = false` entry in `supabase/config.toml`. That
entry is not optional: without it the function inherits `verify_jwt = true`, an applicant
has no JWT, and every submission returns 401 with nothing in the logs to explain it.

### Rebuilding `docs/` by hand

The workflow does this now. If you ever need to do it manually: after `npm run build`, copy
the new `index.html` and the new hashed `assets/*.js` and `assets/*.css` into `docs/`,
**make `docs/404.html` a byte-identical copy of `docs/index.html`**, and leave
`docs/.nojekyll` alone.

## Running a cycle

### Open one

**Fall 2026 is already open** — 22 Aug to 19 Sep 2026, all five listings public. This is
the recipe for the next one, and for adjusting this one.

If the mentors want to edit their listings before students see them, pull everything back
to draft with a single statement and reverse it when they are ready:

```sql
UPDATE public.recruiting_positions SET status = 'draft'
 WHERE cycle = 'fall-2026' AND status = 'open';
```

1. Set the dates.

   ```sql
   UPDATE public.recruiting_cycles
      SET opens_at  = '2026-08-22 00:00:00-04',
          closes_at = '2026-09-19 23:59:00-04'
    WHERE cycle = 'fall-2026';
   ```

2. Check the three policy numbers on that row — `min_hours_per_week`, `min_semesters`,
   `trial_weeks`. They are printed in the expectations list on `#/join` **and** used as
   the answer key for the four comprehension questions, so the page and the grading can
   never disagree. `min_hours_per_week` was seeded to 6 because that is the lowest weekly
   commitment among the five seeded listings; raise it if the lab has a firmer floor.

3. Have each mentor open `#/positions`, edit their listing, and set it to **Open**. A
   draft is visible only to its owner and the PI. The seeded text is verbatim from the
   build spec, so it is accurate but nobody has reviewed it as advertising copy yet — this
   is the step where Ava, Tavis, Suzanna and Lee should read their own.

4. Flip the cycle live:

   ```sql
   UPDATE public.recruiting_cycles SET active = true WHERE cycle = 'fall-2026';
   ```

   Only one cycle can be active at a time — a partial unique index enforces it. "Open"
   also requires today to be inside the window, so a cycle left flagged `active` past its
   closing date still stops accepting applications.

5. Load `#/join` in a private window and confirm you see the open listings and no drafts.

### Close one

```sql
UPDATE public.recruiting_cycles SET active = false WHERE cycle = 'fall-2026';
```

`#/join` immediately shows the "no positions open right now" panel with the PI contact
address, and `submit-application` starts answering 422. Mentors keep full access to the
applications already received; nothing about reviewing changes.

Mentors should also set their own listings to **Filled** or **Closed** as they resolve.

### Archive one

PI only, on `#/review` → **Archive a closed cycle**. It downloads every application in the
cycle as JSON — including the ranked choices and every review — and then deletes the rows.

Two safeguards, both in the database rather than only in the button:

- the DELETE policy is `has_role(auth.uid(),'pi') AND cycle IS DISTINCT FROM
  recruiting_open_cycle()`, so the cycle currently accepting applications cannot be
  deleted at all;
- if the export query fails or returns nothing, the delete is not attempted.

**Check the downloaded file before closing the tab.** The rows are gone afterwards.

---

## Environment variables

| Name | Where | Public? | Purpose |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env` | yes | already present |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` | yes | already present |
| `VITE_TURNSTILE_SITE_KEY` | `.env` | **yes** | Turnstile widget on `#/join`. Currently empty — unused while `require_turnstile` is false |
| `TURNSTILE_SECRET` | Supabase function secrets | **no** | server-side Turnstile verification. Currently unset |
| `RECRUITING_PI_EMAIL` | Supabase function secrets | no | optional; address quoted in the duplicate-submission message. Defaults to `duttonc@ufl.edu` |
| `SUPABASE_SERVICE_ROLE_KEY` | injected by Supabase | **no** | already available to every edge function |

Nothing secret was added under a `VITE_` prefix. Verified against the built bundle: the
only JWT in `dist/` is the `anon` publishable key, and `service_role`, `TURNSTILE_SECRET`
and `recruiting_submit_application` appear zero times.

---

## How this was tested, and what is still untested

### Done — 84 automated checks against a scratch PostgreSQL

`supabase/tests/` holds a reproducible probe. `scratch_base.sql` builds a minimal mirror of
production — the roles, the `app_role` enum, `profiles`, `user_roles`, `projects`,
`has_role`/`has_any_role`/`is_active_user`, and, critically, **the `ALTER DEFAULT
PRIVILEGES` entries that grant `anon` full access to every new table in `public`**. Without
mirroring those, every privilege assertion passes on the absence of a grant that production
would have supplied.

Three probes run against it, 84 cases in total, all passing:

- `recruiting_rls_probe.py` — 49 cases on the policies and grants;
- `recruiting_public_submit_probe.py` — 18 cases on the public submission door;
- `recruiting_pow_probe.py` — 17 cases on the proof of work, the public view, and the
  application-to-account link.

The RLS probe runs as `anon` and as five different signed-in users. It covers, among
others:

- `anon` cannot select, insert or update `recruiting_applications`,
  `recruiting_application_positions` or `recruiting_reviews`, and cannot execute the submit
  RPC;
- `anon` sees exactly the open listings in the open cycle, and no drafts;
- **Mentor A cannot see an application that ranked only Mentor B's positions**, while
  Mentor B sees both;
- a mentor can set `status` but cannot rewrite `statement` or `email` on the same row;
- a mentor cannot hand their listing to another mentor, review an application they cannot
  read, or file a review in someone else's name;
- an `undergrad_student` cannot create a listing;
- a deactivated mentor loses access entirely;
- the PI cannot delete applications in the open cycle, and can in a closed one;
- the submit RPC rejects four ranked positions, duplicate ranks, a draft position, a
  non-`ufl.edu` address, a 1501-character statement, malformed availability, an unknown
  coursework value, and a second submission from the same address in the same cycle;
- a solved proof of work is accepted; the same challenge cannot be spent twice; a wrong
  nonce, no nonce at all, a nonce solved for a *different* challenge, and an hour-old
  challenge are all rejected; difficulty 0 skips the gate; `anon` can neither call the
  verifier directly nor read the challenge table;
- `anon` reads open listings through the view but still **cannot read `public.projects`**,
  and the view hides drafts;
- a mentor cannot link an application to a lab account, but can still set its status; the
  PI can do both.

To re-run — migrations in order, fixtures last, then each probe against a fresh database
(they commit rows, so running two against the same database inflates the counts):

```bash
psql -d scratch -f supabase/tests/scratch_base.sql
for m in supabase/migrations/202608221*.sql supabase/migrations/2026082210*.sql; do
  psql -d scratch -f "$m"
done
psql -d scratch -f supabase/tests/scratch_fixtures.sql
python3 supabase/tests/recruiting_rls_probe.py
```

`scratch_base.sql` is not decoration and two of its lines were written in blood:
**pgcrypto is installed in the `extensions` schema, not `public`**, and `projects`,
`profiles` and `user_roles` carry RLS. Getting the first wrong produced a false failure
that turned out to be a real bug — `digest()` unqualified inside a `search_path = public`
function does not resolve, and the live form would have broken. Getting the second wrong
produced a false pass: an assertion that "anon cannot read public.projects" against a table
that had no RLS to enforce it.

### Done — the form, driven end to end in a real browser

Headless Chromium at 375px and 1280px, with the Supabase endpoints and the Turnstile
script stubbed: all four steps completed, submitted, and the confirmation state reached.
No JavaScript errors, no horizontal overflow at either width, `aria-describedby` and
`aria-invalid` confirmed wired on a failing field, focus confirmed moving to the new step
heading, a `gmail.com` address confirmed rejected, and a position confirmed to disappear
from the rank-2 menu once chosen at rank 1.

The payload the browser produced was then fed verbatim into the real
`recruiting_submit_application()` and accepted — so the TypeScript validation and the SQL
validation agree on the same input rather than being merely similar.

### Done — the full workflow, driven through the live site

On 2026-08-22, in a real browser against the deployed site and the production database:

- **The acceptance-criterion-2 `curl` finally ran.** With the public anon key:
  `recruiting_applications`, `recruiting_application_positions`, `recruiting_reviews` and
  `rpc/recruiting_submit_application` all returned **401 permission denied**; `profiles` and
  `projects` returned 200 with an empty array (RLS, no rows); the `recruiting_open_positions`
  view and `rpc/recruiting_issue_pow_challenge` returned data. That is the guarantee the
  whole module rests on, verified end to end rather than argued from grants.
- Two applications filed through the public form, one accepted and one declined: proof of
  work solved in the browser, insert, review queue, score, decision, notes, status change.
  Availability round-tripped as `{"mon":[[9,13]]}`; the policy questions graded 4/4 and 2/4
  server-side from deliberately different answers. Queue went to "0 waiting on you" with the
  "New to you" badges cleared. No console errors anywhere in the run.

**It found two real bugs, both now fixed:**

1. **The proof of work stalled in a backgrounded tab.** It yielded with `setTimeout(0)`,
   which Chrome clamps in a hidden tab — measured on the live site at **5 yields a second,
   224 ms each**, against 13,007 a second for a `MessageChannel` yield. A student who tabbed
   away mid-form would have watched "Checking your browser" for minutes and then hit the
   60-second timeout. `recruitingPow.ts` now yields via `MessageChannel`, which browsers do
   not throttle, and uses larger batches so it needs ~10 yields instead of 32.
2. **The availability grid lost clicks made in the same tick.** `toggle` computed its result
   from the `value` prop captured at render, so four cells clicked before React re-rendered
   all started from the same snapshot and only the last survived — four hours became one.
   The grid now takes an updater, `onChange(prev => next)`, so each toggle builds on the
   real previous state. A fast clicker or a click-drag would have hit this.

Also fixed: a failed browser check left the submit button reading "Submit application" and
enabled, identical to a ready one. It is now disabled, with the retry link beside it.

### Done — live, against production

- All four migrations applied, then **verified after the fact rather than assumed**:
  production's columns, constraints, indexes, policies, table grants, column grants,
  function privileges and RLS flags were fingerprinted and compared category by category
  against the scratch database the probe runs on. All eight categories matched exactly, and
  all six function bodies matched once comments and whitespace were normalised. That is
  what lets the 49-case probe result be claimed for production.
- The exact payload the built page produces (captured from headless Chromium) was submitted
  through the live `recruiting_submit_application_public()`. The application and both
  ranked choices landed in one transaction, `policy_check_score` was graded server-side to
  4, and the availability grid round-tripped as `{"mon":[[9,13]]}`.
- A second submission from the same address came back as a duplicate rather than a second
  row. **The test rows were then deleted** — the applications table is empty.
- An 18-case probe of the public submission function: honeypot accepted-but-not-inserted,
  a 3-second submission refused, a missing `elapsed_ms` refused, a forged
  `policy_check_score` ignored and regraded to 0, `require_turnstile = true` closing the
  door, the hourly cap engaging, and `anon` still unable to select, insert, or call the
  inner service-role function. Reproducible as
  `supabase/tests/recruiting_public_submit_probe.py`.
- `anon` was confirmed to see the open cycle, 5 positions and 5 projects — and nothing else.

### Not done — and why

- **The `curl` in acceptance criterion 2 was never run.** This session's container allows
  outbound traffic only to package registries; `supabase.co` is unreachable, which is also
  why the edge function could not be deployed from here. The same guarantee was instead
  established at the database level, which is where it is actually enforced: `anon` holds
  no grant of any kind on `recruiting_applications` or `recruiting_application_positions`,
  and a probe as `anon` gets `permission denied for table` on both. Worth running the curl
  once anyway:
  ```bash
  curl -s -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
    "https://ypaobygipbnkvnismhyy.supabase.co/rest/v1/recruiting_applications?select=id"
  curl -s -X POST -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" -H "Content-Type: application/json" \
    -d '{}' "https://ypaobygipbnkvnismhyy.supabase.co/rest/v1/rpc/recruiting_submit_application"
  ```
- **Acceptance criterion 5 was proved with synthetic users, not two real accounts.** Mentor
  A cannot see an application that ranked only mentor B's positions — established against
  the scratch database with five synthetic users, which exercises the policies but not
  PostgREST and not real JWTs. To repeat it for real, create two throwaway `grad_student`
  accounts, give each one open listing, submit an application ranking only the first, and
  confirm the second mentor's `#/review` is empty.
- **The edge function has never run.** It is unused while `require_turnstile` is false.
- **`safeupdate` cannot be simulated.** Supabase preloads it into the `authenticator` role,
  where it rejects an unqualified `UPDATE`/`DELETE` even inside a `SECURITY DEFINER`
  function — the 2026-08-09 quiz-grader outage. Nothing in this module contains an
  unqualified `UPDATE` or `DELETE`; that was checked by grep, not by execution.
- **Scratch PostgreSQL was 16.13; production is 17.6.** The PGDG repository is outside this
  environment's egress allowlist. Nothing used here is version-specific, and the fingerprint
  comparison above is the real check — but the gap is stated rather than assumed away.
- **The GitHub Action has never run.** It cannot be tested from here. If the first run
  fails, the likely cause is org-level restrictions on `GITHUB_TOKEN` write access
  (Settings → Actions → Workflow permissions → *Read and write permissions*).

## Notes for whoever changes this next

**Three copies of every option list.** The allowed values for `coursework`, `credit_type`,
`year`, `status` and the rest exist as CHECK constraints in the schema migration, as arrays
in the edge function, and as exported constants in `src/lib/recruiting.ts`. The database
cannot import TypeScript and the Deno function has no path to `src/`. Change all three in
the same commit — otherwise the database rejects the value, the edge function returns a
generic 500, and the form simply looks broken.

**`src/lib/permissions.ts` mirrors policies, not intentions.** Each new flag names the exact
policy it reflects. If you change one, change the other in the same commit. Supabase returns
`error: null` for a write that RLS filtered to zero rows, so a disagreement shows up as a
success toast over nothing — which is what the 2026-07-25 audit was about. Every write in
this module goes through `settleWrite()` for that reason.

**`canAdminRecruiting` is PI-only**, where the rest of `permissions.ts` pairs `pi` with
`manager`. Deliberate: applications hold personal statements and contact details, `manager`
is a legacy full-access role, and no account currently holds it.

**`recruiting_can_review()` is the single predicate** behind who sees which application. It
is used identically on `recruiting_applications` and `recruiting_application_positions`, so
a half-visible application is not expressible. It is `SECURITY DEFINER` to break the
recursion those two policies would otherwise have.

**Dialogs use `max-h-[90vh] overflow-y-auto`, never `ScrollArea`.** Radix's ScrollArea
viewport is `height: 100%`, which does not resolve inside a flex `DialogContent` in this
repo — it clips with no scrollbar, and `min-h-0` does not fix it.

**There are two submission doors and one insert.** `recruiting_submit_application_public()`
duplicates the edge function's field validation in SQL, on purpose, because either door may
be the live one. A rule added to one and not the other is a rule that stops applying the
moment `require_turnstile` is flipped. Change both, and the CHECK constraints too — that is
now four places, and yes, that is the cost of having a door that works without secrets.

**`src/integrations/supabase/types.ts` was hand-edited** to add the six tables and two
functions. It says it is generated; if it is ever regenerated from the live database before
these migrations are applied, those entries vanish and the module stops compiling.
`recruiting_submit_application` is deliberately absent from it — `EXECUTE` is revoked from
`anon` and `authenticated`, so typing it would advertise a call the browser can never make.
