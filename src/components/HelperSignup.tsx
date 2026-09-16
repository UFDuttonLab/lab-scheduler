import { useState } from "react";
import { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandHelping, Loader2, Pencil, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HELPER_NOTE_MAX, useBookingHelpers } from "@/hooks/useBookingHelpers";
import { toast } from "sonner";

interface HelperSignupProps {
  booking: Booking;
  /** Called after any successful change so a parent list can refetch counts. */
  onChange?: () => void;
}

const NOTE_PLACEHOLDER = "Optional note, e.g. leaving at 11:00";

/**
 * The "helpers wanted" block: the owner's note, who has signed up (with each helper's own
 * note), and Sign up / Edit note / Withdraw controls. Rendered on BookingCard (when the
 * booking is flagged) and on the Help Wanted page.
 *
 * Who may do what mirrors the booking_helpers policies: anyone active can add or remove
 * themselves, and edit the note on their own sign-up, on a flagged, unfinished, uncancelled
 * booking they do not own; the owner and pi/postdoc/grad_student/manager can remove anyone.
 * Nobody can edit another person's note.
 */
export const HelperSignup = ({ booking, onChange }: HelperSignupProps) => {
  const { user, permissions } = useAuth();
  const { helpers, loading, busy, signUp, updateNote, remove } = useBookingHelpers(booking.id, !!booking.helpersWanted);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  if (!booking.helpersWanted) return null;

  const uid = user?.id;
  const isOwner = !!uid && uid === booking.userId;
  const me = uid ? helpers.find(h => h.userId === uid) : undefined;
  const finished = booking.endTime.getTime() <= Date.now();
  const open = !finished && booking.status !== "cancelled";
  const canRemoveOthers = isOwner || permissions.canManageBookings;

  const handleSignUp = async () => {
    if (!uid) return;
    const r = await signUp(uid, draft);
    if (r.ok) {
      toast.success("You're signed up to help.");
      setDraft("");
      onChange?.();
    } else {
      toast.error(r.message);
    }
  };

  const startEdit = () => {
    setDraft(me?.note ?? "");
    setEditing(true);
  };

  const handleSaveNote = async () => {
    if (!uid) return;
    const r = await updateNote(uid, draft);
    if (r.ok) {
      toast.success("Note saved.");
      setEditing(false);
      setDraft("");
      onChange?.();
    } else {
      toast.error(r.message);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    const r = await remove(userId);
    if (r.ok) {
      toast.success(userId === uid ? "You've withdrawn from this session." : `${name} removed.`);
      if (userId === uid) {
        setEditing(false);
        setDraft("");
      }
      onChange?.();
    } else {
      toast.error(r.message);
    }
  };

  const noteInput = (onEnter: () => void, autoFocus = false) => (
    <Input
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
        if (e.key === "Escape" && editing) {
          e.preventDefault();
          setEditing(false);
        }
      }}
      maxLength={HELPER_NOTE_MAX}
      placeholder={NOTE_PLACEHOLDER}
      aria-label="Note for the booking owner"
      disabled={busy}
      autoFocus={autoFocus}
      className="h-8 text-sm"
    />
  );

  return (
    <div className="pt-2 border-t mt-2 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <HandHelping className="w-3.5 h-3.5 text-primary" />
        <span className="font-medium">Helpers wanted</span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      {booking.helpersNote && (
        <p className="text-sm text-muted-foreground break-words">{booking.helpersNote}</p>
      )}

      {!loading && helpers.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nobody has signed up yet.</p>
      ) : (
        <ul className="space-y-1">
          {helpers.map(h => {
            const removable = h.userId === uid || canRemoveOthers;
            return (
              <li key={h.userId} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                  {h.spiritAnimal && <span>{h.spiritAnimal}</span>}
                  {h.fullName}
                  {removable && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRemove(h.userId, h.fullName)}
                      className="ml-0.5 rounded-sm hover:text-destructive disabled:opacity-50"
                      aria-label={`Remove ${h.fullName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
                {h.note && (
                  <span className="text-xs text-muted-foreground italic break-words min-w-0">{h.note}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {open && !isOwner && uid && (
        me ? (
          editing ? (
            <div className="space-y-1.5">
              {noteInput(handleSaveNote, true)}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={handleSaveNote}>
                  Save note
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={startEdit}>
                <Pencil className="w-3.5 h-3.5 mr-1" />
                {me.note ? "Edit my note" : "Add a note"}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => handleRemove(uid, "")}>
                Withdraw
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-1.5">
            {noteInput(handleSignUp)}
            <Button size="sm" disabled={busy} onClick={handleSignUp}>
              <HandHelping className="w-4 h-4 mr-1" />
              Sign up to help
            </Button>
          </div>
        )
      )}
    </div>
  );
};
