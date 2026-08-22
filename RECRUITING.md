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
| Bot protection | honeypot + minimum time-on-form + hourly cap + one-per-address. **No CAPTCHA yet.** |
| Emails | none, by design. `#/review` is the notification. |

### The one thing still worth doing: turn on Turnstile

There is currently **no CAPTCHA** on a public write endpoint. `anon` can call
`recruiting_submit_application_public()` with the publishable key that ships in every
visitor's bundle. What stands in for a CAPTCHA today:

- one application per ufl.edu address per cycle (a unique index, not a check-then-insert);
- a honeypot field that only a form-filling bot fills in;
- a 20-second minimum time-on-form;
- a per-cycle cap of 40 applications an hour (`recruiting_cycles.max_submissions_per_hour`).

That stops drive-by bots and bounds the damage to something you can spot and delete. It
does not stop someone who is trying. To close it properly:

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

### Two doors, one insert

```
#/join
  │
  ├── require_turnstile = false  ──▶  recruiting_submit_application_public()   [anon may call]
  │                                     honeypot · time-on-form · hourly cap
  │                                     full field validation → { ok, error, fields }
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

### Deployment is automatic now

`.github/workflows/build-docs.yml` rebuilds `docs/` on every push to `main` and commits it
back. Pages serves `docs/` from the branch, exactly as before — the workflow just removes
the manual step that was forgotten on 2026-08-09. `docs/` in this commit is already current,
so the site is correct the moment you push; the first workflow run will find nothing to do.

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

### Done — 49 automated checks against a scratch PostgreSQL

`supabase/tests/` holds a reproducible probe. `scratch_base.sql` builds a minimal mirror of
production — the roles, the `app_role` enum, `profiles`, `user_roles`, `projects`,
`has_role`/`has_any_role`/`is_active_user`, and, critically, **the `ALTER DEFAULT
PRIVILEGES` entries that grant `anon` full access to every new table in `public`**. Without
mirroring those, every privilege assertion passes on the absence of a grant that production
would have supplied.

`recruiting_rls_probe.py` then runs 49 hostile and permissive cases as `anon` and as five
different signed-in users. All 49 pass. They cover, among others:

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
  coursework value, and a second submission from the same address in the same cycle.

To re-run:

```bash
psql -d scratch -f supabase/tests/scratch_base.sql
psql -d scratch -f supabase/migrations/20260822100000_recruiting_schema.sql
psql -d scratch -f supabase/migrations/20260822110000_recruiting_rls.sql
psql -d scratch -f supabase/tests/scratch_fixtures.sql
python3 supabase/tests/recruiting_rls_probe.py
```

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
