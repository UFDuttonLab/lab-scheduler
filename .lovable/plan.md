## Goal
Redeploy all existing backend edge functions without changing their code.

## Functions to redeploy
- `manage-users`
- `request-password-reset`
- `send-password-reset`
- `update-password`

## Steps
1. Deploy all four functions in one batch.
2. Check the deploy result for each; if any fails, read that function's logs and report the error.
3. Report final deployment status back.

## Notes
- No code changes, no database migrations.
- Existing config (`verify_jwt = false` for `send-password-reset` and `configure-smtp`) stays as-is.