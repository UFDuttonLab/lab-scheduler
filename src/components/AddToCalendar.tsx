import { Booking } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus, Download } from "lucide-react";
import { googleCalendarUrl, outlookCalendarUrl, downloadBookingIcs } from "@/lib/calendarLinks";

interface AddToCalendarProps {
  booking: Booking;
  /** "icon" for the compact button on cards; "button" for a labelled button. */
  variant?: "icon" | "button";
}

/** Google / Outlook open a prefilled event in a new tab; .ics downloads for Apple Calendar or desktop Outlook. */
export const AddToCalendar = ({ booking, variant = "icon" }: AddToCalendarProps) => {
  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Add to calendar">
            <CalendarPlus className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <CalendarPlus className="h-4 w-4 mr-2" /> Add to calendar
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => open(googleCalendarUrl(booking))}>Google Calendar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(outlookCalendarUrl(booking))}>Outlook (UF Office 365)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadBookingIcs(booking)}>
          <Download className="h-4 w-4 mr-2" /> Download .ics (Apple, desktop Outlook)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
