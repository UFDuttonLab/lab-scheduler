# Restore own-domain recovery email (Resend hook replacement)

## Findings (current state)

- `RESEND_API_KEY` is still stored as an edge-function secret. `SEND_EMAIL_HOOK_SECRET` is NOT configured.
- The `send-password-reset` edge function was deleted on 2026-08-09; only `manage-users` and `submit-application` remain.
- Auth mail currently goes out through the built-in mailer; no functioning Send Email Hook intercepts it.
- Lovable Cloud does not expose Supabase Auth Hook configuration (endpoint or hook secret) through any tool available here, and there is no Supabase dashboard access on Lovable Cloud. Restoring the exact old Resend hook setup is therefore **not executable** from this environment.

## Recommended approach: Lovable custom emails + auth templates

This achieves the same goals — recovery email from your own domain (`marariverresearch.org`) and full control over the Reset Password link format — through the supported mechanism:

1. **User action:** set up the sender domain via the email setup dialog (Cloud → Emails). Requires owning the domain and adding NS records at the registrar. (If DNS is managed by a provider without NS record support, e.g. Shopify DNS, transfer the domain to Lovable or move DNS hosting to Cloudflare first.)
2. Generate the six auth email templates (signup, magic link, recovery, invite, email change, reauthentication) plus the email-sending infrastructure — this installs an auth email hook automatically.
3. Edit **only** the Reset Password template: change the action link `href` to
   `{{ .SiteURL }}#/reset-password?token_hash={{ .TokenHash }}&type=recovery`
   (unencoded `#`; visible link text unchanged or set to "Set your password"). Leave the other five templates exactly as generated.
4. Deploy the generated email functions.
5. Optionally brand the templates (logo, colors, `noreply@marariverresearch.org` sender).
6. Verify: trigger a password reset for a test account and confirm the email arrives from the custom domain with the new link format.

## Notes

- `RESEND_API_KEY` would become unused under this approach and can be left in place or removed.
- No files under `src/` are touched; no schema changes or migrations.

## Technical details

- Step 2 uses the built-in email scaffolding which creates `supabase/functions/auth-email-hook/` and templates under `supabase/functions/_shared/email-templates/`, and updates `supabase/config.toml`.
- Emails are queued (pgmq) and sent by a cron-driven processor once DNS verifies; progress is visible in Cloud → Emails.
- Blocked on step 1 (user must complete domain setup dialog); everything after that is executable by the agent.
