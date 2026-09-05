import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HelperSignup } from "@/components/HelperSignup";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Booking } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isSameDay, isToday, isTomorrow } from "date-fns";
import { HandHelping, Loader2, Clock, User, FolderKanban, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface HelperCount {
  booking_id: string;
  user_id: string;
}

/**
 * Every upcoming booking whose owner asked for helpers, soonest first, with sign-up inline.
 * Meant for the Monday-morning scan: bookings get made at the start of the week, undergrads
 * open this page and put their name on the ones they can make.
 */
const HelpWanted = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [helperRows, setHelperRows] = useState<HelperCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();
      const [bookingsRes, equipmentRes, projectsRes, profilesRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("helpers_wanted", true)
          .neq("status", "cancelled")
          .gt("end_time", nowIso)
          .order("start_time"),
        supabase.from("equipment").select("id, name"),
        supabase.from("projects").select("id, name"),
        supabase.from("profiles").select("id, email, full_name, spirit_animal"),
      ]);
      if (bookingsRes.error) throw bookingsRes.error;

      const equipmentMap = new Map(equipmentRes.data?.map(e => [e.id, e]) || []);
      const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);

      const rows = bookingsRes.data || [];
      const transformed: Booking[] = rows.map(b => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        const owner = profileMap.get(b.user_id);
        const project = b.project_id ? projectMap.get(b.project_id) : undefined;
        return {
          id: b.id,
          equipmentId: b.equipment_id,
          equipmentName: equipmentMap.get(b.equipment_id)?.name || "Unknown",
          studentName: owner?.full_name || owner?.email || "Unknown",
          studentEmail: owner?.email || "",
          studentSpiritAnimal: owner?.spirit_animal || undefined,
          startTime: start,
          endTime: end,
          duration: Math.round((end.getTime() - start.getTime()) / 60000),
          projectId: b.project_id || undefined,
          projectName: project?.name,
          purpose: b.purpose || undefined,
          status: start.getTime() <= Date.now() ? "in-progress" : "scheduled",
          userId: b.user_id,
          helpersWanted: true,
          helpersNote: b.helpers_note || undefined,
          bookingGroupId: b.booking_group_id || undefined,
          source: "booking",
        };
      });
      setBookings(transformed);

      // One query for "which of these am I already on", rather than waiting for each card.
      if (rows.length > 0) {
        const { data } = await supabase
          .from("booking_helpers")
          .select("booking_id, user_id")
          .in("booking_id", rows.map(r => r.id));
        setHelperRows(data || []);
      } else {
        setHelperRows([]);
      }
    } catch (e) {
      console.error("HelpWanted fetch failed", e);
      toast.error("Could not load sessions that need helpers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    helperRows.forEach(r => m.set(r.booking_id, (m.get(r.booking_id) || 0) + 1));
    return m;
  }, [helperRows]);

  const mine = useMemo(
    () => new Set(helperRows.filter(r => r.user_id === user?.id).map(r => r.booking_id)),
    [helperRows, user?.id]
  );

  // A multi-equipment session is several rows sharing booking_group_id; show it once, listing
  // every machine, so nobody signs up for "Robin" and "Batman" as if they were two sessions.
  const sessions = useMemo(() => {
    const seen = new Map<string, Booking & { machines: string[] }>();
    const out: (Booking & { machines: string[] })[] = [];
    for (const b of bookings) {
      const key = b.bookingGroupId || b.id;
      const existing = seen.get(key);
      if (existing) {
        existing.machines.push(b.equipmentName);
      } else {
        const entry = { ...b, machines: [b.equipmentName] };
        seen.set(key, entry);
        out.push(entry);
      }
    }
    return out;
  }, [bookings]);

  // Group by day for the scan.
  const days = useMemo(() => {
    const groups: { day: Date; items: typeof sessions }[] = [];
    for (const s of sessions) {
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.day, s.startTime)) last.items.push(s);
      else groups.push({ day: s.startTime, items: [s] });
    }
    return groups;
  }, [sessions]);

  const dayLabel = (d: Date) =>
    isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEEE, MMMM d");

  const mySignups = sessions.filter(s => mine.has(s.id) || (s.bookingGroupId && bookings.some(b => b.bookingGroupId === s.bookingGroupId && mine.has(b.id)))).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <HandHelping className="w-8 h-8 text-primary" />
              Help Wanted
            </h1>
            <p className="text-muted-foreground">
              Upcoming sessions where the person booking has asked for help. Add your name to the
              ones you can make; withdraw if plans change.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchAll(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {!loading && sessions.length > 0 && (
          <div className="flex gap-2 mb-6 text-sm text-muted-foreground">
            <Badge variant="outline">{sessions.length} session{sessions.length === 1 ? "" : "s"} need help</Badge>
            {mySignups > 0 && <Badge variant="secondary">You're on {mySignups}</Badge>}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading sessions
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <HandHelping className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="mb-1">No upcoming sessions are asking for helpers right now.</p>
            <p className="text-sm">
              When you book equipment, tick <strong>Looking for helpers</strong> on the{" "}
              <Link to="/schedule" className="underline">Schedule</Link> page and it will show up here.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {days.map(({ day, items }) => (
              <section key={day.toISOString()}>
                <h2 className="text-lg font-semibold mb-3">{dayLabel(day)}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map(s => {
                    const helperCount = s.machines.length > 1
                      ? bookings.filter(b => b.bookingGroupId === s.bookingGroupId).reduce((n, b) => Math.max(n, counts.get(b.id) || 0), 0)
                      : counts.get(s.id) || 0;
                    return (
                      <Card key={s.id} className={`p-4 ${mine.has(s.id) ? "border-primary" : ""}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="font-semibold">{s.machines.join(" + ")}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              {format(s.startTime, "h:mm a")} to {format(s.endTime, "h:mm a")}
                              <span className="opacity-60">({s.duration >= 60 ? `${Math.round(s.duration / 60 * 10) / 10} h` : `${s.duration} min`})</span>
                            </div>
                          </div>
                          <Badge variant={helperCount > 0 ? "secondary" : "outline"} className="shrink-0">
                            {helperCount} signed up
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {s.studentSpiritAnimal && <span>{s.studentSpiritAnimal}</span>}
                            <span>{s.studentName}</span>
                          </div>
                          {s.projectName && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <FolderKanban className="w-3.5 h-3.5" />
                              {s.projectName}
                            </div>
                          )}
                          {s.purpose && <p className="text-muted-foreground">{s.purpose}</p>}
                        </div>
                        <HelperSignup booking={s} onChange={fetchAll} />
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HelpWanted;
