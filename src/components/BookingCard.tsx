import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Mail, Trash2, Cpu, Server, FlaskConical, Users, Edit, FolderKanban, Ban, RotateCcw } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { settleWrite } from "@/lib/dbWrite";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  spirit_animal?: string;
}

interface BookingCardProps {
  booking: Booking;
  /** Called after a successful delete or cancel so the parent can refetch. */
  onDelete?: () => void;
  onEdit?: (booking: Booking) => void;
}

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", className: "bg-primary text-primary-foreground" },
  "in-progress": { label: "In Progress", className: "bg-warning text-warning-foreground" },
  completed: { label: "Completed", className: "bg-success text-success-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
} as const;

export const BookingCard = ({ booking, onDelete, onEdit }: BookingCardProps) => {
  const { user, permissions } = useAuth();
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<UserProfile[]>([]);
  const [busy, setBusy] = useState(false);

  // Fall back rather than crash if an unexpected status ever reaches us.
  const status = STATUS_CONFIG[booking.status] ?? {
    label: booking.status ?? "Unknown",
    className: "bg-muted text-muted-foreground",
  };

  const isOwner = !!user?.id && user.id === booking.userId;
  const isUsageRecord = booking.source === "usage_record";

  // usage_records UPDATE is owner-only; bookings UPDATE also allows pi/postdoc/grad_student/manager.
  const canEdit = isOwner || (!isUsageRecord && permissions.canManageBookings);

  // usage_records DELETE allows owner or pi. bookings DELETE is pi-only - everyone else cancels.
  const canDelete = isUsageRecord
    ? isOwner || permissions.canDeleteBookings
    : permissions.canDeleteBookings;

  // Cancelling is an UPDATE, so anyone who may update this booking may cancel it.
  // Only meaningful for real bookings that aren't already cancelled or finished.
  // Only a session that has not finished yet can be cancelled.
  //
  // Checking status alone was wrong: bookings are only ever written as 'scheduled' or
  // 'cancelled', never 'completed', so Cancel appeared on sessions that already happened. Analytics filters cancelled rows out, so cancelling one silently
  // deleted real usage from the lab's statistics, the opposite of what the dialog promises.
  const hasFinished = booking.endTime.getTime() <= Date.now();
  const canCancel =
    !isUsageRecord &&
    booking.status !== "cancelled" &&
    !hasFinished &&
    (isOwner || permissions.canManageBookings);

  // Cancelling is the only way most people can free a slot, and it used to be a one-way
  // door: Edit is hidden once cancelled and only a PI can delete, so a mis-click stranded
  // the booking. Restoring re-runs the DB conflict trigger, so it correctly fails if
  // someone has taken the slot in the meantime.
  const canRestore =
    !isUsageRecord &&
    booking.status === "cancelled" &&
    !hasFinished &&
    (isOwner || permissions.canManageBookings);

  // booking.collaborators is a fresh array on every parent fetch, so depend on its
  // contents rather than its identity to avoid refetching on every parent render.
  // collaborators comes straight off a JSONB column, so it is not guaranteed to be an
  // array. Calling .join on a non-array would throw during render and blank the whole list.
  const collaboratorKey = useMemo(
    () => (Array.isArray(booking.collaborators) ? booking.collaborators.join(",") : ""),
    [booking.collaborators]
  );

  useEffect(() => {
    if (collaboratorKey) {
      fetchCollaborators();
    } else {
      setCollaboratorProfiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaboratorKey]);

  const fetchCollaborators = async () => {
    if (!booking.collaborators || booking.collaborators.length === 0) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, spirit_animal')
      .in('id', booking.collaborators);
    
    if (!error && data) {
      setCollaboratorProfiles(data);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const tableName = isUsageRecord ? 'usage_records' : 'bookings';

      // .select('id') makes the zero-rows-changed case detectable; without it an
      // RLS-blocked delete returns error:null and looks like success.
      const result = await settleWrite(
        supabase.from(tableName).delete().eq('id', booking.id).select('id'),
        isUsageRecord
          ? "You can only delete your own usage records."
          : "Only a PI can delete a booking. Use Cancel to free up the time slot."
      );

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(isUsageRecord ? "Usage record deleted" : "Booking deleted");
      onDelete?.();
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await settleWrite(
        supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id)
          .select('id'),
        "You don't have permission to cancel this booking."
      );

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Booking cancelled - the time slot is now free");
      onDelete?.();
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await settleWrite(
        supabase
          .from('bookings')
          .update({ status: 'scheduled' })
          .eq('id', booking.id)
          .select('id'),
        "You don't have permission to restore this booking."
      );

      if (!result.ok) {
        // The conflict trigger raises a readable message when the slot was taken.
        toast.error(result.message);
        return;
      }

      toast.success("Booking restored");
      onDelete?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-all animate-fade-in max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base sm:text-lg">{booking.equipmentName}</h4>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {isSameDay(booking.startTime, booking.endTime)
                ? `${format(booking.startTime, "MMM d, h:mm a")} - ${format(booking.endTime, "h:mm a")}`
                : `${format(booking.startTime, "MMM d, h:mm a")} - ${format(booking.endTime, "MMM d, h:mm a")}`
              }
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Badge className={status.className}>{status.label}</Badge>
          {canEdit && booking.status !== "cancelled" && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Edit"
              onClick={() => onEdit(booking)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Cancel booking" disabled={busy}>
                  <Ban className="h-4 w-4 text-warning" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The time slot on {booking.equipmentName} will be released immediately so
                    someone else can book it. The record stays in your history and in the lab's
                    usage stats, marked as cancelled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep booking</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>Cancel booking</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canRestore && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Restore booking"
              disabled={busy}
              onClick={handleRestore}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete permanently" disabled={busy}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {isUsageRecord ? 'Usage Record' : 'Booking'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete this {isUsageRecord ? 'usage record' : 'booking'}?
                    It will disappear from history and from usage stats. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {booking.studentSpiritAnimal ? (
            <span className="text-base sm:text-lg flex-shrink-0">{booking.studentSpiritAnimal}</span>
          ) : (
            <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
          <span className="truncate">{booking.studentName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Mail className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{booking.studentEmail}</span>
        </div>
        
          {booking.projectSamples && booking.projectSamples.length > 0 ? (
            <div className="space-y-1">
              {booking.projectSamples.map((ps, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <FolderKanban className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate font-medium">{ps.projectName || 'Unknown Project'}</span>
                  <span className="ml-auto text-primary font-semibold">{ps.samples} samples</span>
                </div>
              ))}
            </div>
          ) : booking.projectName ? (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <FolderKanban className="w-3 h-3 flex-shrink-0" />
              <span className="truncate font-medium">{booking.projectName}</span>
            </div>
          ) : null}
        
        {booking.samplesProcessed && (
          <div className="flex items-center gap-2 text-sm pt-2">
            <FlaskConical className="w-3 h-3 text-primary" />
            <span className="font-medium">Samples:</span>
            <span>{booking.samplesProcessed}</span>
          </div>
        )}
        
        {booking.cpuCount !== undefined && (
          <div className="flex items-center gap-4 text-sm pt-2 border-t mt-2">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-primary" />
              <span className="font-medium">CPUs:</span>
              <span>{booking.cpuCount}</span>
            </div>
            {booking.gpuCount !== undefined && (
              <div className="flex items-center gap-1">
                <Server className="w-3 h-3 text-primary" />
                <span className="font-medium">GPUs:</span>
                <span>{booking.gpuCount}</span>
              </div>
            )}
          </div>
        )}

        {collaboratorProfiles.length > 0 && (
          <div className="pt-2 border-t mt-2">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Users className="w-3 h-3 text-primary" />
              <span className="font-medium">Collaborators:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {collaboratorProfiles.map(collab => (
                <Badge key={collab.id} variant="secondary" className="text-xs">
                  {collab.spirit_animal && <span className="mr-1">{collab.spirit_animal}</span>}
                  {collab.full_name || collab.email}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {booking.purpose && (
        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t break-words">
          {booking.purpose}
        </p>
      )}
    </Card>
  );
};
