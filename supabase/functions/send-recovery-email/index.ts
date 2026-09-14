import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { setPasswordUrl, sendRecoveryEmail } from "../_shared/recoveryEmail.ts"

/**
 * Self-service password recovery, sent from THIS LAB'S domain with a scanner-proof link.
 *
 * WHY THIS EXISTS
 * ---------------
 * `supabase.auth.resetPasswordForEmail()` from the browser makes Supabase mail the link. That
 * link resolves to `${SUPABASE_URL}/auth/v1/verify?token=...`, and FETCHING that URL is what
 * redeems the one-time token. Corporate mail filters pre-fetch every link in every message, so
 * the token is routinely spent seconds after sending and the recipient gets "invalid or expired
 * link". Measured on the live system, from auth.audit_log_entries:
 *
 *   shea.granger@opentrons.com  created 19:56:49, mail sent 19:56:50, `login` at 19:57:16.
 *   26 seconds, traits null, no password ever set. That login is the scanner, not the person.
 *   sydneytu@ufl.edu shows the same 26-second gap, so UF's Microsoft 365 does it too.
 *
 * This function never hands GoTrue's verify endpoint to a mail system. It mints the token with
 * generateLink(), which sends nothing, and emails a link to the APP carrying `token_hash`. The
 * token is then redeemed only by the verifyOtp() call in src/pages/ResetPasswordVerify.tsx.
 * A scanner fetching that URL receives static HTML and does not execute the page's JavaScript,
 * so it cannot spend it.
 *
 * It also sidesteps two things we do not control: Supabase's email templates (editable only from
 * a dashboard that does not exist for a Lovable Cloud project) and Lovable's own mailer, which
 * wraps every link in an `email.auth.lovable.cloud` click tracker.
 *
 * SECURITY
 * --------
 * verify_jwt = false, because someone who has forgotten their password has no JWT. Everything
 * the gateway would normally establish is re-established here:
 *
 *   - Cloudflare Turnstile, FAIL CLOSED. No TURNSTILE_SECRET means every request is refused.
 *     The alternative is a public unauthenticated endpoint that sends mail from a verified
 *     sending domain with no bot check, which is an open relay in all but name.
 *   - A per-address cooldown in `recovery_email_requests`, so this cannot be used to flood one
 *     person's inbox.
 *   - It only ever mails the address in the request, with a fixed body. No caller-supplied
 *     content or destination reaches the message.
 *   - It never reveals whether an account exists: unknown addresses get the same generic success
 *     as known ones, having sent nothing.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Minimum gap between recovery emails to one address. */
const COOLDOWN_SECONDS = 120

/** The same generic answer for every outcome a stranger is allowed to observe. */
const GENERIC_OK = {
  success: true,
  message: "If an account exists with that email, a password reset link has been sent.",
}

async function verifyTurnstile(token: string, ip: string | null): Promise<string | null> {
  const secret = Deno.env.get('TURNSTILE_SECRET')
  if (!secret) {
    console.error('TURNSTILE_SECRET is not set. Refusing every recovery request until it is.')
    return 'Password reset is not fully configured yet. Please contact the lab PI.'
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
    console.error('Turnstile rejected a recovery request:', body?.['error-codes'])
    return 'That check did not pass. Please try again.'
  } catch (err) {
    console.error('Turnstile verification threw:', err)
    return 'Could not complete the robot check. Please try again shortly.'
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const { email, turnstileToken } = await req.json()

    if (typeof email !== 'string' || !email.includes('@') || email.length > 320) {
      return json({ error: 'A valid email address is required.' }, 400)
    }
    const address = email.trim().toLowerCase()

    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')
    const turnstileError = await verifyTurnstile(turnstileToken ?? '', ip)
    if (turnstileError) return json({ error: turnstileError }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!supabaseUrl || !serviceKey || !resendKey) {
      console.error('Missing env:', {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
        RESEND_API_KEY: !!resendKey,
      })
      return json({ error: 'Password reset is not configured. Please contact the lab PI.' }, 500)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Cooldown. Checked BEFORE generateLink, because generateLink invalidates any token minted
    // earlier - without this, two rapid requests would leave the first (already delivered)
    // email holding a dead link.
    const { data: prior } = await admin
      .from('recovery_email_requests')
      .select('last_sent_at')
      .eq('email', address)
      .maybeSingle()

    if (prior?.last_sent_at) {
      const elapsed = (Date.now() - new Date(prior.last_sent_at).getTime()) / 1000
      if (elapsed < COOLDOWN_SECONDS) {
        // Generic on purpose: a distinguishable "too soon" reply is an account oracle.
        console.log('Recovery request inside cooldown for', address)
        return json(GENERIC_OK)
      }
    }

    // generateLink returns "User not found" for an unknown address. Swallow it and answer the
    // same way as success - the caller must not be able to enumerate accounts.
    const { data: linkData, error: genError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: address,
    })

    if (genError || !linkData?.properties?.hashed_token) {
      console.log('No recovery link generated for', address, genError?.message ?? 'no hashed_token')
      return json(GENERIC_OK)
    }

    const resetUrl = setPasswordUrl(linkData.properties.hashed_token)

    const sendError = await sendRecoveryEmail(resendKey, address, resetUrl)
    if (sendError) {
      // A send failure IS worth telling the caller about - it is not an account oracle, it
      // happens regardless of whether the address exists, and silence would leave someone
      // waiting forever for mail that is never coming.
      return json({ error: sendError }, 502)
    }

    await admin
      .from('recovery_email_requests')
      .upsert({ email: address, last_sent_at: new Date().toISOString() }, { onConflict: 'email' })

    console.log('Recovery email sent to', address)
    return json(GENERIC_OK)
  } catch (err) {
    console.error('send-recovery-email failed:', err)
    return json({ error: 'Something went wrong. Please try again shortly.' }, 500)
  }
})
