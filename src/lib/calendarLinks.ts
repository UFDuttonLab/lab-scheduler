import { Booking } from "@/lib/types";

/**
 * "Add to calendar" for a booking: a prefilled Google Calendar event, a prefilled Outlook
 * (Office 365, which UF uses) event, and a downloadable .ics for Apple Calendar or desktop
 * Outlook. All three are built client-side from the booking already in memory; nothing is
 * stored and no calendar is written to. Times are sent as UTC so every calendar shows them
 * in the viewer's own zone.
 */

const SITE = "https://ufduttonlab.github.io/lab-scheduler/";

const pad = (n: number) => String(n).padStart(2, "0");

/** 20260905T140000Z */
const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

export const calendarTitle = (b: Booking) => `${b.equipmentName}: lab booking`;

export const calendarDetails = (b: Booking) => {
  const lines: string[] = [];
  if (b.projectName) lines.push(`Project: ${b.projectName}`);
  if (b.samplesProcessed) lines.push(`Samples: ${b.samplesProcessed}`);
  if (b.cpuCount || b.gpuCount) lines.push(`Resources: ${b.cpuCount ?? 0} CPU, ${b.gpuCount ?? 0} GPU`);
  if (b.purpose) lines.push(`Purpose: ${b.purpose}`);
  if (b.helpersWanted) lines.push(`Helpers wanted${b.helpersNote ? `: ${b.helpersNote}` : ""}`);
  lines.push(`Booked by ${b.studentName}`);
  lines.push(`Dutton Lab Scheduler: ${SITE}#/schedule`);
  return lines.join("\n");
};

export const CALENDAR_LOCATION = "Dutton Lab, University of Florida";

export const googleCalendarUrl = (b: Booking) => {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: calendarTitle(b),
    dates: `${utcStamp(b.startTime)}/${utcStamp(b.endTime)}`,
    details: calendarDetails(b),
    location: CALENDAR_LOCATION,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

export const outlookCalendarUrl = (b: Booking) => {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: calendarTitle(b),
    startdt: b.startTime.toISOString(),
    enddt: b.endTime.toISOString(),
    body: calendarDetails(b),
    location: CALENDAR_LOCATION,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p.toString()}`;
};

// RFC 5545: escape backslash, semicolon, comma, newline in TEXT values; fold long lines.
const icsText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
};

export const bookingIcs = (b: Booking) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dutton Lab//Lab Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${b.id}@ufduttonlab.github.io`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(b.startTime)}`,
    `DTEND:${utcStamp(b.endTime)}`,
    `SUMMARY:${icsText(calendarTitle(b))}`,
    `DESCRIPTION:${icsText(calendarDetails(b))}`,
    `LOCATION:${icsText(CALENDAR_LOCATION)}`,
    `URL:${SITE}#/schedule`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
};

export const downloadBookingIcs = (b: Booking) => {
  const blob = new Blob([bookingIcs(b)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const day = b.startTime.toISOString().slice(0, 10);
  a.download = `${b.equipmentName.replace(/[^\w.-]+/g, "_")}_${day}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
