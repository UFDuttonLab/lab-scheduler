import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

/**
 * submit-application - the only way an application enters the database.
 *
 * This is the first PUBLIC edge function in this project. Everything else runs behind
 * verify_jwt = true and can assume a validated caller; this one is reachable by anybody
 * with the URL, so it validates everything itself and trusts nothing in the body.
 *
 * It must be listed in supabase/config.toml with verify_jwt = false. Without that entry
 * it inherits verify_jwt = true and every applicant gets a 401 - the form will look
 * broken with nothing in the function logs to explain it.
 *
 * The database is the backstop, not the only line: recruiting_submit_application()
 * re-checks the same rules in SQL, and CHECK constraints re-check them again. The layers
 * are deliberate. What this function adds on top is the Turnstile check, the field-level
 * error map the form needs, and the HTTP status codes.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const YEARS = ['freshman', 'sophomore', 'junior', 'senior', 'post-bacc']
const R_EXPERIENCE = ['none', 'coursework', 'independent']
const CREDIT_TYPES = ['volunteer', 'course_credit', 'work_study', 'paid', 'any']
const COURSEWORK = [
  'bsc2010', 'bsc2011', 'genetics', 'gen_chem_lab',
  'organic_chem', 'statistics', 'microbiology', 'ecology',
]
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// Any host under ufl.edu. Anchored at both ends so ufl.edu.attacker.com does not pass.
// Kept character-for-character in step with the CHECK constraint on
// recruiting_applications.email - if one changes, change the other in the same commit.
const UFL_EMAIL = /^[^@\s]+@([a-z0-9-]+\.)*ufl\.edu$/i

type Errors = Record<string, string>

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const isInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v)

/** Shape check for the weekly grid, mirroring recruiting_availability_is_valid(). */
function availabilityIsValid(a: unknown): boolean {
  if (a === null || typeof a !== 'object' || Array.isArray(a)) return false
  for (const [day, slots] of Object.entries(a as Record<string, unknown>)) {
    if (!DAYS.includes(day)) return false
    if (!Array.isArray(slots)) return false
    for (const slot of slots) {
      if (!Array.isArray(slot) || slot.length !== 2) return false
      const [from, to] = slot
      if (typeof from !== 'number' || typeof to !== 'number') return false
      if (from < 0 || to > 24 || from >= to) return false
    }
  }
  return true
}

/**
 * Cloudflare Turnstile. Returns null on success or a message on failure.
 *
 * FAILS CLOSED. With no TURNSTILE_SECRET configured this rejects every submission rather
 * than waving them through, because the alternative is a public unauthenticated INSERT
 * endpoint with no bot check that looks like it is working. See RECRUITING.md for the two
 * values to set.
 */
async function verifyTurnstile(token: string, ip: string | null): Promise<string | null> {
  const secret = Deno.env.get('TURNSTILE_SECRET')
  if (!secret) {
    console.error('TURNSTILE_SECRET is not set. Refusing every submission until it is.')
    return 'The application form is not fully configured yet. Please email the lab PI.'
  }
  if (!token) return 'Please complete the "I am not a robot" check.'

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const body = await res.json()
    if (body?.success === true) return null
    console.error('Turnstile rejected a submission:', body?.['error-codes'])
    return 'That check did not pass. Please try again.'
  } catch (e) {
    // A network failure here is not the applicant's fault, but letting it through would
    // turn any Cloudflare outage into an open door.
    console.error('Turnstile verification threw:', e)
    return 'We could not verify that check right now. Please try again in a minute.'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405)

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, error: 'Could not read that submission.' }, 400)
  }

  const turnstileError = await verifyTurnstile(
    str(payload.turnstile_token),
    req.headers.get('CF-Connecting-IP') ?? req.headers.get('x-forwarded-for'),
  )
  if (turnstileError) {
    return json({ ok: false, error: turnstileError, fields: { turnstile: turnstileError } }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Which cycle is open is read from the database, never from the request body.
  const { data: openCycle, error: cycleError } = await supabase.rpc('recruiting_open_cycle')
  if (cycleError) {
    console.error('recruiting_open_cycle failed:', cycleError)
    return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500)
  }
  if (!openCycle) {
    return json({ ok: false, error: 'Applications are not open at the moment.' }, 422)
  }

  const { data: cycleRow, error: cycleRowError } = await supabase
    .from('recruiting_cycles')
    .select('min_hours_per_week, min_semesters, trial_weeks')
    .eq('cycle', openCycle)
    .maybeSingle()
  if (cycleRowError || !cycleRow) {
    console.error('Could not read the open cycle row:', cycleRowError)
    return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500)
  }

  // ---- field validation -------------------------------------------------------------
  const errors: Errors = {}

  const fullName = str(payload.full_name)
  if (fullName.length < 2 || fullName.length > 120) errors.full_name = 'Please give your full name.'

  const email = str(payload.email).toLowerCase()
  if (!UFL_EMAIL.test(email)) errors.email = 'Please use your UF email address (ending in ufl.edu).'

  const year = str(payload.year)
  if (!YEARS.includes(year)) errors.year = 'Please choose your year.'

  const major = str(payload.major)
  if (major.length < 2 || major.length > 120) errors.major = 'Please give your major.'

  const expectedGraduation = str(payload.expected_graduation)
  if (expectedGraduation.length < 4 || expectedGraduation.length > 40) {
    errors.expected_graduation = 'Please give a term and year, for example "Spring 2028".'
  }

  const coursework = Array.isArray(payload.coursework) ? payload.coursework : null
  if (!coursework || coursework.some((c) => typeof c !== 'string' || !COURSEWORK.includes(c))) {
    errors.coursework = 'Please choose from the listed courses.'
  }

  const rExperience = str(payload.r_experience)
  if (!R_EXPERIENCE.includes(rExperience)) errors.r_experience = 'Please choose one.'

  const hoursAvailable = payload.hours_available
  if (!isInt(hoursAvailable) || (hoursAvailable as number) < 1 || (hoursAvailable as number) > 40) {
    errors.hours_available = 'Please give a number of hours between 1 and 40.'
  }

  const longestBlock = payload.longest_block_hours
  if (!isInt(longestBlock) || (longestBlock as number) < 1 || (longestBlock as number) > 12) {
    errors.longest_block_hours = 'Please give a block length between 1 and 12 hours.'
  } else if (isInt(hoursAvailable) && (longestBlock as number) > (hoursAvailable as number)) {
    errors.longest_block_hours = 'Your longest block cannot be longer than your total weekly hours.'
  }

  if (!availabilityIsValid(payload.availability)) {
    errors.availability = 'Please mark when you are free.'
  }

  const semesters = payload.semesters_available
  if (!isInt(semesters) || (semesters as number) < 1 || (semesters as number) > 8) {
    errors.semesters_available = 'Please give a number of semesters between 1 and 8.'
  }

  const creditType = str(payload.credit_type)
  if (!CREDIT_TYPES.includes(creditType)) errors.credit_type = 'Please choose one.'

  for (const flag of ['animal_samples_ok', 'field_local_ok', 'field_intl_interest', 'has_transportation']) {
    if (typeof payload[flag] !== 'boolean') errors[flag] = 'Please answer yes or no.'
  }

  const statement = str(payload.statement)
  if (statement.length < 1) errors.statement = 'Please write a short statement.'
  if (statement.length > 1500) errors.statement = 'Please keep this under 1500 characters.'

  const priorLab = str(payload.prior_lab_experience)
  if (priorLab.length > 1000) errors.prior_lab_experience = 'Please keep this under 1000 characters.'
  const conflicts = str(payload.conflicts)
  if (conflicts.length > 1000) errors.conflicts = 'Please keep this under 1000 characters.'
  const priorContact = str(payload.prior_contact)
  if (priorContact.length > 300) errors.prior_contact = 'Please keep this under 300 characters.'

  // ---- ranked choices ----------------------------------------------------------------
  //
  // Ranks must be exactly 1..n with no gaps. "1 and 3" is a form bug, not a preference,
  // and storing it would make "sorted by rank ascending" on the review queue misleading.
  const rawChoices = Array.isArray(payload.choices) ? payload.choices : []
  const choices: { position_id: string; rank: number }[] = []
  for (const c of rawChoices) {
    if (c && typeof c === 'object') {
      const id = str((c as Record<string, unknown>).position_id)
      const rank = (c as Record<string, unknown>).rank
      if (id && isInt(rank)) choices.push({ position_id: id, rank: rank as number })
    }
  }
  if (choices.length !== rawChoices.length) {
    errors.choices = 'Please choose between one and three positions.'
  } else if (choices.length < 1 || choices.length > 3) {
    errors.choices = 'Please choose between one and three positions.'
  } else if (new Set(choices.map((c) => c.position_id)).size !== choices.length) {
    errors.choices = 'Each position can only be ranked once.'
  } else {
    const ranks = choices.map((c) => c.rank).sort((a, b) => a - b)
    const contiguous = ranks.every((r, i) => r === i + 1)
    if (!contiguous) errors.choices = 'Please rank your choices 1, 2, 3 with no gaps.'
  }

  // ---- policy comprehension ----------------------------------------------------------
  //
  // Graded here against the cycle row rather than trusting a score from the browser.
  // Wrong answers do not block submission (spec 5.4); the count is stored so a reviewer
  // can see whether the applicant read the expectations.
  const answers = (payload.policy_answers ?? {}) as Record<string, unknown>
  let policyScore = 0
  if (answers.min_hours === cycleRow.min_hours_per_week) policyScore++
  if (answers.min_semesters === cycleRow.min_semesters) policyScore++
  if (answers.trial_weeks === cycleRow.trial_weeks) policyScore++
  if (answers.ehs_required === true) policyScore++

  if (Object.keys(errors).length > 0) {
    return json({ ok: false, error: 'Please check the highlighted answers.', fields: errors }, 400)
  }

  // ---- insert --------------------------------------------------------------------------
  const { data: applicationId, error } = await supabase.rpc('recruiting_submit_application', {
    _payload: {
      full_name: fullName,
      email,
      year,
      major,
      expected_graduation: expectedGraduation,
      coursework,
      r_experience: rExperience,
      prior_lab_experience: priorLab || null,
      hours_available: hoursAvailable,
      longest_block_hours: longestBlock,
      availability: payload.availability,
      semesters_available: semesters,
      credit_type: creditType,
      animal_samples_ok: payload.animal_samples_ok,
      field_local_ok: payload.field_local_ok,
      field_intl_interest: payload.field_intl_interest,
      has_transportation: payload.has_transportation,
      conflicts: conflicts || null,
      prior_contact: priorContact || null,
      statement,
      policy_check_score: policyScore,
      choices,
    },
  })

  if (error) {
    const message = error.message ?? ''

    if (message.includes('duplicate_application')) {
      return json({
        ok: false,
        error:
          'It looks like an application has already been submitted from this address for this cycle. '
          + 'To change or add to it, email the lab PI at '
          + (Deno.env.get('RECRUITING_PI_EMAIL') ?? 'duttonc@ufl.edu') + '.',
      }, 409)
    }
    if (message.includes('no_open_cycle')) {
      return json({ ok: false, error: 'Applications are not open at the moment.' }, 422)
    }
    if (message.includes('position_not_open')) {
      return json({
        ok: false,
        error: 'One of the positions you chose is no longer open.',
        fields: { choices: 'One of the positions you chose is no longer open. Please refresh and pick again.' },
      }, 400)
    }
    if (message.includes('choices_out_of_range') || message.includes('duplicate_rank_or_position')) {
      return json({
        ok: false,
        error: 'Please choose between one and three positions, each ranked once.',
        fields: { choices: 'Please choose between one and three positions, each ranked once.' },
      }, 400)
    }

    // Anything else is a constraint the checks above should have caught. Log the detail;
    // do not return it - a CHECK violation message names columns and values, and section
    // 7 forbids leaking application data through an error message.
    console.error('recruiting_submit_application failed:', error)
    return json({ ok: false, error: 'Something went wrong saving your application. Please try again.' }, 500)
  }

  return json({ ok: true, application_id: applicationId }, 200)
})
