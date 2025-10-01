import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Mail, Trash2, Cpu, Server } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface BookingCardProps {
  booking: Booking;
  onDelete?: () => void;
}

export const BookingCard = ({ booking, onDelete }: BookingCardProps) => {
  const { isManager } = useAuth();
  
  const statusConfig = {
    scheduled: { label: "Scheduled", className: "bg-primary text-primary-foreground" },
    "in-progress": { label: "In Progress", className: "bg-warning text-warning-foreground" },
    completed: { label: "Completed", className: "bg-success text-success-foreground" },
    cancelled: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
  };

  const status = statusConfig[booking.status];

  const handleDelete = async () => {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id);

    if (error) {
      toast.error("Failed to delete booking");
      return;
    }

    toast.success("Booking deleted successfully");
    onDelete?.();
  };

  return (
    <Card className="p-4 hover:shadow-md transition-all animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold">{booking.equipmentName}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>
              {format(booking.startTime, "MMM d, h:mm a")} - {format(booking.endTime, "h:mm a")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={status.className}>{status.label}</Badge>
          {isManager && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this booking? This action cannot be undone.
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

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          {booking.studentSpiritAnimal ? (
            <span className="text-lg">{booking.studentSpiritAnimal}</span>
          ) : (
            <User className="w-3 h-3 text-muted-foreground" />
          )}
          <span>{booking.studentName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span>{booking.studentEmail}</span>
        </div>
        
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
      </div>

      {booking.purpose && (
        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
          {booking.purpose}
        </p>
      )}
    </Card>
  );
};
