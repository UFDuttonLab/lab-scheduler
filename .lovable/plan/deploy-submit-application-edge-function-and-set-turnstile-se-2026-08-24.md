# Deploy submit-application edge function and set TURNSTILE_SECRET

This is a deployment-and-secrets task only. No code, schema, or migration changes.

## Steps

1. **Set the Edge Function secret**
   - Prompt for `TURNSTILE_SECRET` (Cloudflare Turnstile secret key) via the secure secrets form.
   - Store it as a Supabase Edge Function secret for this project.
   - Do not print the value, do not write it to any file, and do not give it a `VITE_` prefix.

2. **Deploy the `submit-application` edge function**
   - Deploy `supabase/functions/submit-application/index.ts` to Supabase.
   - The function must deploy with JWT verification disabled.
   - `supabase/config.toml` already declares `[functions.submit-application] verify_jwt = false`; confirm this setting survives the deploy.

## Report back after deployment

- Deployed function URL.
- Whether `TURNSTILE_SECRET` is set.
- Whether `verify_jwt` is false.
