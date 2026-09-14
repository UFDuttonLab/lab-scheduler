-- Rate-limit store for send-recovery-email.
--
-- STATUS: TO APPLY. Edit this header to "APPLIED LIVE" only after a verification query confirms
-- the table and its policy exist in production.
--
-- send-recovery-email runs with verify_jwt = false because someone who has forgotten their
-- password has no JWT. Cloudflare Turnstile is the bot gate; this table is the per-address
-- cooldown that stops a solved challenge being replayed to flood one person's inbox.
--
-- The edge function reaches this with the service role, which bypasses RLS. Every other caller
-- must see nothing: the table records which addresses have asked for a password reset and when,
-- which is an account oracle if readable. Hence RLS on, and no policy at all - the default with
-- RLS enabled and zero policies is deny-everything for anon and authenticated.

create table if not exists public.recovery_email_requests (
  email        text primary key,
  last_sent_at timestamptz not null default now()
);

alter table public.recovery_email_requests enable row level security;

-- Deliberately no policies. See above.

-- Belt and braces: even if a policy is added by accident later, no direct grants exist.
revoke all on public.recovery_email_requests from anon, authenticated;

comment on table public.recovery_email_requests is
  'Per-address cooldown for send-recovery-email. Service-role only; RLS on with no policies by design.';
