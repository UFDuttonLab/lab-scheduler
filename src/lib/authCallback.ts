/**
 * Supabase auth links come back in the URL FRAGMENT, and this app uses HashRouter.
 *
 * The set-password email sent by `manage-users` is generated server-side, so it cannot be a
 * PKCE link: the code verifier would have to live in the recipient's browser. GoTrue therefore
 * redirects to the site with the result in the fragment:
 *
 *   .../lab-scheduler/#access_token=...&refresh_token=...&type=recovery
 *   .../lab-scheduler/#error=access_denied&error_code=otp_expired&error_description=...
 *
 * HashRouter reads that fragment as a route, matches nothing and renders NotFound - the
 * "404 Oops! Page not found" every new student hit (reproduced 2026-09-11). The client is
 * configured flowType: 'pkce', so supabase-js ignores the fragment too and no session is made.
 *
 * consumeAuthCallback() runs in main.tsx before React mounts: it lifts the tokens out of the
 * fragment, rewrites the URL to a real route, and hands what it found to ResetPasswordVerify.
 * It must stay synchronous - HashRouter reads window.location.hash on its first render.
 */

export interface RecoverySession {
  access_token: string;
  refresh_token: string;
}

let pendingSession: RecoverySession | null = null;
let pendingError: string | null = null;

/** Tokens lifted out of a recovery fragment. Returns them once, then forgets them. */
export const takeRecoverySession = (): RecoverySession | null => {
  const session = pendingSession;
  pendingSession = null;
  return session;
};

/** The reason a recovery link was refused. Returns it once, then forgets it. */
export const takeAuthLinkError = (): string | null => {
  const error = pendingError;
  pendingError = null;
  return error;
};

export const consumeAuthCallback = (): void => {
  const hash = window.location.hash;

  // "#/schedule" is an ordinary route. A GoTrue callback starts straight into query pairs
  // ("#access_token=", "#error="), so anything beginning a path is left alone.
  if (!hash || hash.length < 2 || hash.startsWith("#/")) return;

  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  // URLSearchParams already turns "+" back into spaces.
  const error = params.get("error_description") || params.get("error");

  if (accessToken && refreshToken) {
    // Recovery is the only flow in this app that emits fragment tokens, so anything carrying
    // them belongs on the set-password page.
    pendingSession = { access_token: accessToken, refresh_token: refreshToken };
  } else if (error) {
    pendingError = error;
  } else {
    return;
  }

  // Replace, never push: the tokens are credentials and must not survive in history.
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${window.location.search}#/reset-password`
  );
};
