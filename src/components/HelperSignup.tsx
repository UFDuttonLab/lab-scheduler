import { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HandHelping, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookingHelpers } from "@/hooks/useBookingHelpers";
import { toast } from "sonner";

interface HelperSignupProps {
  booking: Booking;
  /** Called after any successful change so a parent list can refetch counts. */
  onChange?: () => void;
}

/**
 * The "helpers wanted" block: the owner's note, who has signed up, and a Sign up / Withdraw
 * button. Rendered on BookingCard (when the booking is flagged) and on the Help Wanted page.
 *
 * Who may do what mirrors the booking_helpers policies: anyone active can add or remove
 * themselves on a flagged, unfinished, uncancelled booking they do not own; the owner and
 * pi/postdoc/grad_student/manager can remove anyone.
 */
export const HelperSignup = ({ booking, onChange }: HelperSignupProps) => {
  const { user, permissions } = useAuth();
  const { helpers, loading, busy, signUp, remove } = useBookingHelpers(booking.id, !!booking.helpersWanted);

  if (!booking.helpersWanted) return null;

  const uid = user?.id;
  const isOwner = !!uid && uid === booking.userId;
  const iAmHelping = !!uid && helpers.some(h => h.userId === uid);
  const finished = booking.endTime.getTime() <= Date.now();
  const open = !finished && booking.status !== "cancelled";
  const canRemoveOthers = isOwner || permissions.canManageBookings;

  const handleSignUp = async () => {
    if (!uid) return;
    const r = await signUp(uid);
    if (r.ok) {
      toast.success("You're signed up to help.");
      onChange?.();
    } else {
      toast.error(r.message);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    const r = await remove(userId);
    if (r.ok) {
      toast.success(userId === uid ? "You've withdrawn from this session." : `${name} removed.`);
      onChange?.();
    } else {
      toast.error(r.message);
    }
  };

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

      <div className="flex flex-wrap items-center gap-1">
        {!loading && helpers.length === 0 && (
          <span className="text-xs text-muted-foreground">Nobody has signed up yet.</span>
        )}
        {helpers.map(h => {
          const removable = h.userId === uid || canRemoveOthers;
          return (
            <Badge key={h.userId} variant="secondary" className="text-xs gap-1">
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
          );
        })}
      </div>

      {open && !isOwner && uid && (
        iAmHelping ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => handleRemove(uid, "")}>
            Withdraw
          </Button>
        ) : (
          <Button size="sm" disabled={busy} onClick={handleSignUp}>
            <HandHelping className="w-4 h-4 mr-1" />
            Sign up to help
          </Button>
        )
      )}
    </div>
  );
};
