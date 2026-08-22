import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/recruiting";

/**
 * Cloudflare Turnstile, rendered explicitly.
 *
 * Explicit rendering rather than the automatic `cf-turnstile` class scan, because the
 * widget lives inside a multi-step form: the container mounts and unmounts as the
 * applicant moves between steps, and the automatic scanner only looks once at load.
 *
 * If VITE_TURNSTILE_SITE_KEY is not set this renders nothing and reports no token. The
 * form treats that as "cannot submit" and says so - which matches the edge function,
 * which fails closed without TURNSTILE_SECRET. Both halves have to be configured; see
 * RECRUITING.md.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const loadScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile script failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("turnstile script failed")));
    document.head.appendChild(script);
  });

interface Props {
  onToken: (token: string | null) => void;
}

export const TurnstileWidget = ({ onToken }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Held in a ref so the effect does not re-run - and re-render the widget - every time
  // the parent re-renders with a new closure.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // The widget may already be gone if the script was torn down first.
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} />;
};
