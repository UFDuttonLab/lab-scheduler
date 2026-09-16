import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { settleWrite } from "@/lib/dbWrite";

/** Matches the booking_helpers_note_length CHECK constraint. */
export const HELPER_NOTE_MAX = 200;

export interface BookingHelper {
  userId: string;
  fullName: string;
  email: string;
  spiritAnimal?: string;
  /** The helper's own note, e.g. "can only stay until 11:00". */
  note?: string;
  createdAt: string;
}

interface HelperRow {
  user_id: string;
  created_at: string;
  note: string | null;
  profiles: { full_name: string | null; email: string; spirit_animal: string | null } | null;
}

const toHelper = (r: HelperRow): BookingHelper => ({
  userId: r.user_id,
  fullName: r.profiles?.full_name || r.profiles?.email || "Unknown",
  email: r.profiles?.email || "",
  spiritAnimal: r.profiles?.spirit_animal || undefined,
  note: r.note || undefined,
  createdAt: r.created_at,
});

/** Trim, cap at the database limit, and store an empty note as NULL. */
const cleanNote = (note: string | undefined): string | null => {
  const t = (note ?? "").trim().slice(0, HELPER_NOTE_MAX);
  return t.length > 0 ? t : null;
};

/**
 * Who has signed up to help on one booking, plus sign-up / edit note / withdraw / remove.
 *
 * The rows live in booking_helpers, not on the booking, so a card only pays for this query
 * when the booking is actually flagged (pass `enabled: false` otherwise). Every write ends in
 * .select() so an RLS-filtered zero-row write is reported instead of toasting success.
 */
export const useBookingHelpers = (bookingId: string, enabled = true) => {
  const [helpers, setHelpers] = useState<BookingHelper[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const { data, error } = await supabase
      .from("booking_helpers")
      .select("user_id, created_at, note, profiles(full_name, email, spirit_animal)")
      .eq("booking_id", bookingId)
      .order("created_at");
    if (!error && data) {
      setHelpers((data as unknown as HelperRow[]).map(toHelper));
    }
    setLoading(false);
  }, [bookingId, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Add the current user, with an optional note. The INSERT policy decides whether that is allowed. */
  const signUp = async (userId: string, note?: string): Promise<{ ok: boolean; message?: string }> => {
    if (busy) return { ok: false, message: "Please wait." };
    setBusy(true);
    try {
      const { error } = await supabase
        .from("booking_helpers")
        .insert({ booking_id: bookingId, user_id: userId, note: cleanNote(note) })
        .select("booking_id");
      if (error) {
        if (error.code === "23505") return { ok: false, message: "You are already signed up for this session." };
        if (error.code === "23514") return { ok: false, message: `Notes can be at most ${HELPER_NOTE_MAX} characters.` };
        if (error.code === "42501") {
          return {
            ok: false,
            message: "You can't sign up for this session. It may have finished, been cancelled, or no longer be asking for helpers.",
          };
        }
        return { ok: false, message: error.message };
      }
      await refresh();
      return { ok: true };
    } finally {
      setBusy(false);
    }
  };

  /**
   * Change the note on your own sign-up. The UPDATE policy allows only your own row, and only
   * while the booking is flagged, not cancelled and not finished; the column grant allows only
   * `note` to change.
   */
  const updateNote = async (userId: string, note: string): Promise<{ ok: boolean; message?: string }> => {
    if (busy) return { ok: false, message: "Please wait." };
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("booking_helpers")
        .update({ note: cleanNote(note) })
        .eq("booking_id", bookingId)
        .eq("user_id", userId)
        .select("booking_id");
      if (error) {
        if (error.code === "23514") return { ok: false, message: `Notes can be at most ${HELPER_NOTE_MAX} characters.` };
        if (error.code === "42501") {
          return {
            ok: false,
            message: "You can't change this note. The session may have finished, been cancelled, or no longer be asking for helpers.",
          };
        }
        return { ok: false, message: error.message };
      }
      if (!data || data.length === 0) {
        return { ok: false, message: "Your sign-up was not found. It may have been removed; try refreshing." };
      }
      await refresh();
      return { ok: true };
    } finally {
      setBusy(false);
    }
  };

  /** Remove one helper: yourself, or anyone if you own the booking / hold an elevated role. */
  const remove = async (userId: string): Promise<{ ok: boolean; message?: string }> => {
    if (busy) return { ok: false, message: "Please wait." };
    setBusy(true);
    try {
      const result = await settleWrite(
        supabase
          .from("booking_helpers")
          .delete()
          .eq("booking_id", bookingId)
          .eq("user_id", userId)
          .select("booking_id"),
        "Only the helper, the booking owner, or a PI/postdoc/grad student can remove a helper."
      );
      if (result.ok) await refresh();
      return result;
    } finally {
      setBusy(false);
    }
  };

  return { helpers, loading, busy, refresh, signUp, updateNote, remove };
};
