import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Mail } from "lucide-react";
import { format } from "date-fns";

interface BookingCardProps {
  booking: Booking;
}

export const BookingCard = ({ booking }: BookingCardProps) => {
  const statusConfig = {
    scheduled: { label: "Scheduled", className: "bg-primary text-primary-foreground" },
    "in-progress": { label: "In Progress", className: "bg-warning text-warning-foreground" },
    completed: { label: "Completed", className: "bg-success text-success-foreground" },
    cancelled: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
  };

  const status = statusConfig[booking.status];

  return (
    <Card className="p-4 hover:shadow-md transition-all animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{booking.equipmentName}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>
              {format(booking.startTime, "MMM d, h:mm a")} - {format(booking.endTime, "h:mm a")}
            </span>
          </div>
        </div>
        <Badge className={status.className}>{status.label}</Badge>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-3 h-3 text-muted-foreground" />
          <span>{booking.studentName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span>{booking.studentEmail}</span>
        </div>
      </div>

      {booking.purpose && (
        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
          {booking.purpose}
        </p>
      )}
    </Card>
  );
};
