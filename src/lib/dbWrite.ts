import type { PostgrestError } from "@supabase/supabase-js";

export interface WriteResult {
  ok: boolean;
  /** Present when ok === false. Safe to show to the user. */
  message?: string;
  /**
   * How many rows the write actually touched. Only meaningful when ok === true, and only when
   * the query ended in .select(). Useful when one user action legitimately updates several
   * rows - e.g. moving every machine of a multi-equipment booking - so the confirmation can
   * state what really happened instead of guessing.
   */
  rowCount?: number;
}

type WriteQuery = PromiseLike<{ data: unknown[] | null; error: PostgrestError | null }>;

/**
 * Runs a Supabase UPDATE/DELETE and tells you whether it actually changed anything.
 *
 * Why this exists: when a row-level security policy filters an UPDATE or DELETE down to
 * zero rows, PostgREST does NOT report an error - it returns `{ data: [], error: null }`.
 * Code that only checks `error` therefore shows a success toast for a write that did
 * nothing, and the UI silently reverts on the next fetch. Always pass a query with
 * `.select()` on the end so there are rows to count.
 *
 *   const result = await settleWrite(
 *     supabase.from("bookings").delete().eq("id", id).select("id"),
 *     "You don't have permission to delete this booking."
 *   );
 *   if (!result.ok) { toast.error(result.message); return; }
 */
export const settleWrite = async (
  query: WriteQuery,
  deniedMessage: string
): Promise<WriteResult> => {
  const { data, error } = await query;

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data || data.length === 0) {
    // Zero rows changed usually means RLS filtered the write, but it can also mean the
    // row was already deleted by someone else. Say both rather than assert permission.
    return { ok: false, message: `${deniedMessage} (It may also have been changed or removed already - try refreshing.)` };
  }
  return { ok: true, rowCount: data.length };
};

/**
 * Supabase Edge Functions return `{ data: null, error: FunctionsHttpError }` for any
 * non-2xx response, and `error.message` is the useless constant string
 * "Edge Function returned a non-2xx status code". The real payload is on
 * `error.context`, which is the raw Response. This digs the server's message back out.
 */
export const readFunctionError = async (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): Promise<string> => {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.clone().json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      // body was not JSON - fall through
    }
  }
  const message = (error as { message?: string })?.message;
  if (message && !message.includes("non-2xx status code")) return message;
  return fallback;
};

/**
 * Like readFunctionError, but hands back the whole parsed body.
 *
 * The recruiting form needs more than a sentence: submit-application answers a bad
 * submission with `{ ok: false, error, fields: { email: "...", choices: "..." } }` so the
 * form can put each message next to the input it belongs to. readFunctionError throws the
 * field map away, which is right for a toast and wrong for a form.
 *
 * Returns null when the response body was not JSON - callers should fall back to
 * readFunctionError for a human-readable message in that case.
 */
export const readFunctionBody = async (
  error: unknown
): Promise<Record<string, unknown> | null> => {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      return await context.clone().json();
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * The HTTP status behind a failed functions.invoke, or null if it cannot be read.
 * The recruiting form distinguishes 409 (already applied) from 400 (fix a field).
 */
export const readFunctionStatus = (error: unknown): number | null => {
  const context = (error as { context?: Response })?.context;
  return typeof context?.status === "number" ? context.status : null;
};
