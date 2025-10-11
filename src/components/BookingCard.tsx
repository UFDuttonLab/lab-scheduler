import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Mail, Trash2, Cpu, Server, FlaskConical, Users, Edit, FolderKanban } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
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
  onDelete?: () => void;
  onEdit?: (booking: Booking) => void;
}

export const BookingCard = ({ booking, onDelete, onEdit }: BookingCardProps) => {
  const { user, permissions } = useAuth();
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<UserProfile[]>([]);
  
  const statusConfig = {
    scheduled: { label: "Scheduled", className: "bg-primary text-primary-foreground" },
    "in-progress": { label: "In Progress", className: "bg-warning text-warning-foreground" },
    completed: { label: "Completed", className: "bg-success text-success-foreground" },
    cancelled: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
  };

  const status = statusConfig[booking.status];
  const canEdit = user?.id === booking.userId || permissions.canManageBookings;
  const canDelete = user?.id === booking.userId || permissions.canManageUsers; // Users can delete their own, PI can delete any

  useEffect(() => {
    if (booking.collaborators && booking.collaborators.length > 0) {
      fetchCollaborators();
    }
  }, [booking.collaborators]);

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
    const tableName = booking.source === 'usage_record' ? 'usage_records' : 'bookings';
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', booking.id);

    if (error) {
      toast.error("Failed to delete record");
      return;
    }

    toast.success("Record deleted successfully");
    onDelete?.();
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
          {canEdit && (booking.status === "scheduled" || permissions.canManageBookings) && onEdit && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onEdit(booking)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {booking.source === 'usage_record' ? 'Usage Record' : 'Booking'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this {booking.source === 'usage_record' ? 'usage record' : 'booking'}? This action cannot be undone.
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
