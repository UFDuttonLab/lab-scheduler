/**
 * The set-password email, shared by the two functions that send one:
 *   - send-recovery-email  (self-service "Forgot password")
 *   - manage-users         (PI creates an account)
 *
 * Both must produce the SAME link shape. It points at the app's #/reset-password route carrying
 * `token_hash`, never at `${SUPABASE_URL}/auth/v1/verify`, because fetching the latter is what
 * redeems the one-time token and corporate mail filters pre-fetch every link they see. See the
 * header of send-recovery-email/index.ts for the measured evidence.
 */

/** Where links point. Hardcoded on purpose: a caller-supplied origin makes this a phishing relay. */
export const SITE_URL = 'https://ufduttonlab.github.io/lab-scheduler/'

/**
 * Build the set-password URL from a GoTrue `hashed_token`.
 * The `#` must NOT be percent-encoded - the app uses HashRouter and this has to arrive as a
 * fragment. hashed_token is URL-safe as issued, so it needs no encoding either.
 */
export const setPasswordUrl = (hashedToken: string): string =>
  `${SITE_URL}#/reset-password?token_hash=${hashedToken}&type=recovery`

export function recoveryEmailHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Set your password</title></head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 40px 30px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;">Dutton Lab Scheduler</h1>
            <p style="margin:8px 0 0 0;color:#e0e7ff;font-size:14px;">University of Florida</p>
          </td></tr>
          <tr><td style="padding:40px;">
            <h2 style="margin:0 0 20px 0;color:#333333;font-size:24px;font-weight:600;">Set your password</h2>
            <p style="margin:0 0 30px 0;color:#666666;font-size:16px;line-height:1.5;">
              Use the button below to choose a password for your Dutton Lab Scheduler account.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:30px;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-weight:600;">Set password</a>
            </td></tr></table>
            <p style="margin:0 0 12px 0;color:#666666;font-size:14px;line-height:1.5;">Or paste this into your browser:</p>
            <div style="background-color:#f8f9fa;border:1px solid #e9ecef;border-radius:4px;padding:12px;margin-bottom:30px;word-break:break-all;">
              <a href="${resetUrl}" style="color:#667eea;text-decoration:none;font-size:13px;">${resetUrl}</a>
            </div>
            <div style="border-top:1px solid #e9ecef;padding-top:20px;">
              <p style="margin:0 0 10px 0;color:#999999;font-size:13px;line-height:1.5;">This link expires in 1 hour and can be used once.</p>
              <p style="margin:0;color:#999999;font-size:13px;line-height:1.5;">If you did not request this, ignore this email. Your password will not change.</p>
            </div>
          </td></tr>
          <tr><td style="background-color:#f8f9fa;padding:30px 40px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="margin:0 0 10px 0;color:#666666;font-size:14px;">Dutton Lab, University of Florida</p>
            <p style="margin:0;color:#999999;font-size:12px;">Automated message, please do not reply.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

/**
 * Send it through Resend, from the lab's own verified domain (DKIM/SPF for
 * marariverresearch.org are live). Returns null on success, or a message safe to show a user.
 */
export async function sendRecoveryEmail(
  resendKey: string,
  address: string,
  resetUrl: string,
): Promise<string | null> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Dutton Lab Scheduler <noreply@marariverresearch.org>',
      to: [address],
      subject: 'Set your password - Dutton Lab Scheduler',
      html: recoveryEmailHtml(resetUrl),
    }),
  })

  if (!res.ok) {
    console.error('Resend rejected the message:', res.status, await res.text())
    return 'Could not send the email right now. Please try again shortly.'
  }
  return null
}
