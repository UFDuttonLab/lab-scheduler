import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, TrendingUp, Users, FolderKanban, Loader2, Wrench, Beaker } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getProjectColor } from "@/lib/projectColors";

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  // A failed load used to toast and then render every empty state on the page, so a broken
  // query was indistinguishable from an idle lab - and the toast disappeared, taking the only
  // evidence with it. The page now refuses to draw zeroes it does not believe.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      // Fetch all data separately
      const [bookingsRes, usageRecordsRes, equipmentRes, projectsRes, profilesRes] = await Promise.all([
        supabase.from('bookings').select('*'),
        supabase.from('usage_records').select('*'),
        supabase.from('equipment').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('profiles').select('id, email, full_name, spirit_animal')
      ]);

      // Every query must be checked. Previously only two were, so a failure on
      // equipment/projects/profiles produced an empty-but-successful-looking page that
      // read as "nobody used anything" rather than "the query failed".
      const failed = [
        ['bookings', bookingsRes.error],
        ['usage records', usageRecordsRes.error],
        ['equipment', equipmentRes.error],
        ['projects', projectsRes.error],
        ['profiles', profilesRes.error],
      ].filter(([, err]) => err) as [string, { message: string }][];

      if (failed.length > 0) {
        throw new Error(
          `Could not load ${failed.map(([name]) => name).join(', ')}: ${failed[0][1].message}`
        );
      }

      // Create lookup maps
      const equipmentMap = new Map(equipmentRes.data?.map(e => [e.id, e]) || []);
      const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profilesRes.data?.map(u => [u.id, u]) || []);

      // Enrich bookings with related data
      const enrichedBookings = (bookingsRes.data || []).map(booking => {
        const enrichedProjectSamples = (booking.project_samples as any)?.map?.((ps: any) => ({
          projectId: ps.project_id,
          projectName: projectMap.get(ps.project_id)?.name || 'Unknown',
          samples: ps.samples
        }));
        
        return {
          ...booking,
          equipment: equipmentMap.get(booking.equipment_id),
          projectSamples: enrichedProjectSamples,
          project: projectMap.get(booking.project_id),
          profile: profileMap.get(booking.user_id),
          source: 'booking' as const
        };
      });

      // Enrich usage records with related data
      const enrichedUsageRecords = (usageRecordsRes.data || []).map(record => {
        const enrichedProjectSamples = (record.project_samples as any)?.map?.((ps: any) => ({
          projectId: ps.project_id,
          projectName: projectMap.get(ps.project_id)?.name || 'Unknown',
          samples: ps.samples
        }));
        
        return {
          ...record,
          equipment: equipmentMap.get(record.equipment_id),
          projectSamples: enrichedProjectSamples,
          project: projectMap.get(record.project_id),
          profile: profileMap.get(record.user_id),
          source: 'usage_record' as const
        };
      });

      // Combine bookings and usage records for analytics
      const allRecords = [...enrichedBookings, ...enrichedUsageRecords];

      const now = Date.now();

      // Analytics should describe work that actually happened.
      //  - cancelled bookings are released slots, not usage
      //  - bookings that have not started yet are intent, not usage; counting them made
      //    next month's reservations show up in this month's totals
      const realUsage = allRecords.filter(record => {
        // usage_records has no `status` column, hence the cast - only bookings can be
        // cancelled, and a usage_record is by definition something that already happened.
        if ((record as { status?: string }).status === 'cancelled') return false;
        return new Date(record.start_time).getTime() <= now;
      }).map(record => {
        // Clamp an in-progress session to the time actually elapsed. Admitting a record at
        // start_time while every aggregation summed the full end - start meant a booking
        // that had run for five minutes of a seven-day reservation contributed all 168
        // hours to this week's totals the moment it began.
        const end = new Date(record.end_time).getTime();
        if (end <= now) return record;
        return { ...record, end_time: new Date(now).toISOString() };
      });

      // Each record's sample count, resolved ONCE so every aggregate below reads the same
      // number. The old code branched "use projectSamples if present, else samples_processed"
      // separately in five places and two of them disagreed: the Equipment table summed only the
      // legacy samples_processed column while the project and student charts preferred
      // project_samples. Those fields do not always match - on the live data they differ on 2 of
      // 173 rows, 7300 against 7346 - so one session was reported with two different sample
      // counts on two tabs of the same page.
      //
      // An EMPTY project_samples array must fall through to samples_processed. Array.isArray([])
      // is true, so the old checks treated [] as authoritative and silently reported 0 samples
      // for a record shaped that way. No live row is shaped that way today; this is the guard
      // that stops it becoming silent data loss when one is.
      const resolveSamples = (r: { projectSamples?: unknown; samples_processed?: unknown }): number => {
        const ps = r.projectSamples;
        if (Array.isArray(ps) && ps.length > 0) {
          return ps.reduce((sum: number, p: any) => sum + (Number(p?.samples) || 0), 0);
        }
        return Number(r.samples_processed) || 0;
      };

      // Sort first so attribution is stable. Without an explicit order the query has none, so
      // which machine got credited with a multi-equipment session's samples changed between
      // page loads.
      const ordered = [...realUsage].sort((a, b) => {
        const t = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        return t !== 0 ? t : String(a.id).localeCompare(String(b.id));
      });

      // A multi-equipment session writes the SAME sample payload onto EVERY equipment row, so a
      // 100-sample run booked on 3 machines reported 300 samples. booking_group_id links those
      // rows. Keep every row's TIME - all three machines really were occupied - but count the
      // samples once.
      //
      // Deduplicate on (group, payload), NOT on group alone. The previous version credited the
      // group to whichever row sorted first and zeroed the rest, assuming every row in a group
      // carries an identical payload. On the live data 2 of 20 groups violate that: one holds
      // 1 and 24, another 2 and 4, and both have rows with DIFFERENT start times, so they are
      // separate pieces of work rather than one simultaneous run. First-row-wins threw the other
      // row's samples away. Keying on the payload collapses true duplicates and keeps genuinely
      // different counts. Lab-wide this moves the total from 12,117 to 12,145.
      const seenGroupPayloads = new Set<string>();
      const deduped = ordered.map(record => {
        const withSamples = { ...record, effectiveSamples: resolveSamples(record) };
        const groupId = record.booking_group_id;
        if (!groupId) return withSamples;

        const payloadKey = `${groupId}|${JSON.stringify(record.projectSamples ?? null)}|${record.samples_processed ?? 0}`;
        if (seenGroupPayloads.has(payloadKey)) {
          // Already counted on a sibling row of the same session. Zero the samples, keep the time.
          return { ...withSamples, effectiveSamples: 0, samples_processed: 0, projectSamples: undefined };
        }
        seenGroupPayloads.add(payloadKey);
        return withSamples;
      });

      setBookings(deduped);
      setProjects(projectsRes.data || []);
      setUsers(profilesRes.data || []);
      setEquipment(equipmentRes.data || []);
    } catch (error: any) {
      setLoadError(error?.message ?? "Unknown error");
      toast({
        title: "Error fetching analytics data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------------------
  // Derived data. One rule throughout: a figure that describes the LAB is per session, and a
  // figure that describes a MACHINE is per machine-row. A multi-equipment booking is several
  // rows sharing a booking_group_id, and conflating the two is what made this page disagree
  // with itself.
  // ---------------------------------------------------------------------------------------

  /** One logical session. Rows of a multi-equipment booking share a booking_group_id. */
  const sessionKey = (r: any): string => String(r.booking_group_id ?? r.id);

  /**
   * Sessions, not rows. On the live data 263 rows are only 238 sessions, so anything counting
   * rows overstated by 25: "Total Bookings" reported a three-machine extraction run as three
   * bookings, and "Avg Booking Duration" divided total machine-minutes by that inflated count.
   *
   * A session's duration is max(end) - min(start) across its rows, NOT the sum of them. Summing
   * would report a 2-hour run on three machines as a 6-hour booking.
   */
  const sessions = (() => {
    const byKey = new Map<string, { start: number; end: number }>();
    bookings.forEach(r => {
      const k = sessionKey(r);
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      const cur = byKey.get(k);
      if (!cur) byKey.set(k, { start, end });
      else byKey.set(k, { start: Math.min(cur.start, start), end: Math.max(cur.end, end) });
    });
    return [...byKey.values()];
  })();

  const totalSessions = sessions.length;
  const sessionMinutes = sessions.reduce((sum, s) => sum + (s.end - s.start) / 60000, 0);
  const avgSessionMinutes = totalSessions > 0 ? Math.round(sessionMinutes / totalSessions) : 0;

  /** Machine-minutes: every row counted, because every machine really was occupied. */
  const machineMinutes = (records: any[]) =>
    records.reduce((sum, r) => {
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      return sum + (end - start) / 60000;
    }, 0);

  const countSessions = (records: any[]) => new Set(records.map(sessionKey)).size;

  /** Round to 0.1 h. Always from exact minutes - never from an already-rounded value. */
  const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

  // Time per project
  const projectTimeData = projects.map(project => {
    const projectBookings = bookings.filter(b => b.project_id === project.id);
    const totalMinutes = machineMinutes(projectBookings);
    return {
      id: project.id,
      name: project.name,
      hours: toHours(totalMinutes),
      sessions: countSessions(projectBookings),
      totalMinutes,
      color: getProjectColor(project.id, projects),
    };
  }).filter(p => p.hours > 0);

  // Time per student (owner or named collaborator)
  const userRecordsFor = (userId: string) =>
    bookings.filter(b =>
      b.user_id === userId ||
      (Array.isArray(b.collaborators) && b.collaborators.includes(userId))
    );

  const studentTimeData = users.map(user => {
    const userRecords = userRecordsFor(user.id);
    const totalMinutes = machineMinutes(userRecords);
    return {
      id: user.id,
      name: user.full_name || user.email,
      hours: toHours(totalMinutes),
      sessions: countSessions(userRecords),
      totalMinutes,
    };
  }).filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours);

  // Samples per project. project_samples splits one session across projects; a record without
  // that breakdown is attributed whole to its project_id.
  const projectSampleData = projects.map(project => {
    let totalSamples = 0;
    let sessionIds = new Set<string>();

    bookings.forEach(record => {
      const ps = record.projectSamples;
      if (Array.isArray(ps) && ps.length > 0) {
        const entry = ps.find((p: any) => p.projectId === project.id);
        if (entry && (Number(entry.samples) || 0) > 0) {
          totalSamples += Number(entry.samples) || 0;
          sessionIds.add(sessionKey(record));
        }
        return;
      }
      if (record.project_id === project.id && record.effectiveSamples > 0) {
        totalSamples += record.effectiveSamples;
        sessionIds.add(sessionKey(record));
      }
    });

    return {
      id: project.id,
      name: project.name,
      samples: totalSamples,
      sessions: sessionIds.size,
      color: getProjectColor(project.id, projects),
    };
  }).filter(p => p.samples > 0);

  // Samples per student
  const studentSampleData = users.map(user => {
    const userRecords = userRecordsFor(user.id);
    const totalSamples = userRecords.reduce((sum, r) => sum + r.effectiveSamples, 0);
    return {
      id: user.id,
      name: user.full_name || user.email,
      samples: totalSamples,
      sessions: countSessions(userRecords.filter(r => r.effectiveSamples > 0)),
    };
  }).filter(s => s.samples > 0).sort((a, b) => b.samples - a.samples);

  // Summary stats
  const totalMinutes = machineMinutes(bookings);
  const totalHours = toHours(totalMinutes);

  const uniqueStudents = new Set<string>();
  bookings.forEach(b => {
    uniqueStudents.add(b.user_id);
    if (Array.isArray(b.collaborators)) {
      b.collaborators.forEach((collaboratorId: string) => uniqueStudents.add(collaboratorId));
    }
  });
  const activeStudents = uniqueStudents.size;

  const totalSamples = bookings.reduce((sum, r) => sum + r.effectiveSamples, 0);
  const sessionsWithSamples = countSessions(bookings.filter(r => r.effectiveSamples > 0));

  // Equipment. Per machine, so rows are the right unit here - a machine booked as part of a
  // three-machine session was genuinely occupied for that whole window.
  //
  // Machines with ZERO hours are kept. Filtering them out hid exactly the thing a utilization
  // page exists to show: which instruments nobody is using. The charts still drop them (a bar
  // of height 0 is noise); the table lists them.
  const equipmentTimeData = equipment.map(eq => {
    const equipmentRecords = bookings.filter(b => b.equipment_id === eq.id);
    const totalMinutes = machineMinutes(equipmentRecords);

    // usage_records has no cpu_count/gpu_count column, so those rows added 0 to the numerator
    // while still inflating the denominator - two real 16-CPU bookings plus eight usage records
    // reported 3.2 CPUs/session instead of 16. Average over the sessions that can carry an
    // allocation at all.
    const cpuSessions = equipmentRecords.filter(r => r.cpu_count !== null && r.cpu_count !== undefined);
    const gpuSessions = equipmentRecords.filter(r => r.gpu_count !== null && r.gpu_count !== undefined);
    const cpuUsage = cpuSessions.reduce((sum, r) => sum + (r.cpu_count || 0), 0);
    const gpuUsage = gpuSessions.reduce((sum, r) => sum + (r.gpu_count || 0), 0);

    return {
      id: eq.id,
      name: eq.name,
      type: eq.type ?? "Unspecified",
      location: eq.location ?? "Unspecified",
      status: eq.status,
      icon: eq.icon,
      hours: toHours(totalMinutes),
      totalMinutes,
      bookings: equipmentRecords.length,
      scheduledCount: equipmentRecords.filter(r => r.source === 'booking').length,
      quickAddCount: equipmentRecords.filter(r => r.source === 'usage_record').length,
      cpuUsage,
      gpuUsage,
      avgCpuPerSession: cpuSessions.length > 0 ? Math.round((cpuUsage / cpuSessions.length) * 10) / 10 : 0,
      avgGpuPerSession: gpuSessions.length > 0 ? Math.round((gpuUsage / gpuSessions.length) * 10) / 10 : 0,
      // Same resolved figure every other sample number on this page uses. This used to read the
      // legacy samples_processed column alone and disagreed with the project and student charts.
      samplesProcessed: equipmentRecords.reduce((sum, r) => sum + r.effectiveSamples, 0),
    };
  }).sort((a, b) => b.hours - a.hours);

  /** Machines with recorded use. Charts and rankings only. */
  const equipmentChartData = equipmentTimeData.filter(e => e.hours > 0);
  const idleEquipment = equipmentTimeData.filter(e => e.hours === 0);

  // Accumulate raw minutes and round once at the end. Summing values already rounded to 0.1
  // produced float artifacts like "PCR: 0.30000000000000004h" in chart labels.
  const sumBy = (key: 'type' | 'location') =>
    Object.entries(
      equipmentTimeData.reduce((acc, eq) => {
        acc[eq[key]] = (acc[eq[key]] || 0) + eq.totalMinutes;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([name, minutes]) => ({ name, hours: toHours(minutes as number) }))
      .filter(d => d.hours > 0)
      .sort((a, b) => b.hours - a.hours);

  const typeDistributionData = sumBy('type');
  const locationDistributionData = sumBy('location');

  const mostUsedEquipment = equipmentChartData.length > 0 ? equipmentChartData[0].name : "N/A";
  const totalEquipmentPieces = equipment.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          <Card className="p-6 border-destructive">
            <h1 className="text-2xl font-bold mb-2">Analytics could not be loaded</h1>
            <p className="text-muted-foreground mb-4">
              No figures are shown because at least one query failed. Any numbers drawn now would
              be wrong rather than empty.
            </p>
            <p className="font-mono text-sm break-all mb-6">{loadError}</p>
            <Button onClick={fetchData}>Try again</Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Usage Analytics</h1>
          <p className="text-muted-foreground">
            Track equipment usage time by project and student
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Sessions"
            value={totalSessions}
            icon={FolderKanban}
            trend={`${totalHours} machine-hours`}
          />
          <StatsCard
            title="Total Usage Time"
            value={`${totalHours}h`}
            icon={Clock}
            trend="All equipment"
          />
          <StatsCard
            title="Total Samples"
            value={totalSamples}
            icon={Beaker}
            trend={`across ${sessionsWithSamples} sessions`}
          />
          <StatsCard
            title="Active Students"
            value={activeStudents}
            icon={Users}
            trend={`${users.length} registered`}
          />
          <StatsCard
            title="Avg Session Length"
            value={`${avgSessionMinutes}m`}
            icon={TrendingUp}
            trend="Per session, wall clock"
          />
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">By Project</TabsTrigger>
            <TabsTrigger value="students">By Student</TabsTrigger>
            <TabsTrigger value="equipment">By Equipment</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Usage Hours by Project</h3>
                {projectTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="hours">
                        {projectTimeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No project usage data available
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Project Distribution</h3>
                {projectTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={projectTimeData}
                        dataKey="hours"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${entry.hours}h`}
                      >
                        {projectTimeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for distribution chart
                  </div>
                )}
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="font-semibold text-xl mb-4">Samples Processed by Project</h3>
                {projectSampleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectSampleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Samples', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="samples">
                        {projectSampleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No sample data available for projects
                  </div>
                )}
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="font-semibold text-xl mb-4">Project Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Project</th>
                        <th className="text-right py-3 px-4">Total Hours</th>
                        <th className="text-right py-3 px-4">Sessions</th>
                        <th className="text-right py-3 px-4">Total Samples</th>
                        <th className="text-right py-3 px-4">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectTimeData.length > 0 ? (
                        projectTimeData.map((project) => {
                          const sampleData = projectSampleData.find(p => p.id === project.id);
                          return (
                            <tr key={project.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: project.color }}
                                  />
                                  {project.name}
                                </div>
                              </td>
                              <td className="text-right py-3 px-4">{project.hours}h</td>
                              <td className="text-right py-3 px-4">{project.sessions}</td>
                              <td className="text-right py-3 px-4">
                                {sampleData ? sampleData.samples : 0}
                              </td>
                              <td className="text-right py-3 px-4">
                                {project.sessions > 0 
                                  ? Math.round(project.totalMinutes / project.sessions) + 'm'
                                  : '-'
                                }
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">
                            No project data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Usage Hours by Student</h3>
                {studentTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No student usage data available
                  </div>
                )}
              </Card>

              <Card className="p-6 lg:col-span-1">
                <h3 className="font-semibold text-xl mb-4">Student Rankings</h3>
                {studentTimeData.length > 0 ? (
                  <div className="space-y-3">
                    {studentTimeData.slice(0, 5).map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.sessions} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{student.hours}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No student data available
                  </div>
                )}
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="font-semibold text-xl mb-4">Samples Processed by Student</h3>
                {studentSampleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentSampleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Samples', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="samples" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No sample data available for students
                  </div>
                )}
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="font-semibold text-xl mb-4">Student Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student</th>
                        <th className="text-right py-3 px-4">Total Hours</th>
                        <th className="text-right py-3 px-4">Sessions</th>
                        <th className="text-right py-3 px-4">Total Samples</th>
                        <th className="text-right py-3 px-4">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentTimeData.length > 0 ? (
                        studentTimeData.map((student) => {
                          const sampleData = studentSampleData.find(s => s.id === student.id);
                          return (
                            <tr key={student.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">{student.name}</td>
                              <td className="text-right py-3 px-4">{student.hours}h</td>
                              <td className="text-right py-3 px-4">{student.sessions}</td>
                              <td className="text-right py-3 px-4">
                                {sampleData ? sampleData.samples : 0}
                              </td>
                              <td className="text-right py-3 px-4">
                                {student.sessions > 0 
                                  ? Math.round(student.totalMinutes / student.sessions) + 'm'
                                  : '-'
                                }
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">
                            No student data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="equipment">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Usage Hours by Equipment</h3>
                {equipmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={equipmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No equipment usage data available
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Usage by Equipment Type</h3>
                {typeDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeDistributionData}
                        dataKey="hours"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${entry.hours}h`}
                      >
                        {typeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No type distribution data available
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Usage by Location</h3>
                {locationDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={locationDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No location data available
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Top Equipment</h3>
                {equipmentChartData.length > 0 ? (
                  <div className="space-y-3">
                    {equipmentChartData.slice(0, 5).map((eq, index) => (
                      <div key={eq.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              <span>{eq.icon}</span>
                              {eq.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{eq.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{eq.hours}h</p>
                          <p className="text-sm text-muted-foreground">{eq.bookings} sessions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No equipment data available
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-xl mb-4">Equipment Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Equipment</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Location</th>
                        <th className="text-left py-3 px-4">Source</th>
                        <th className="text-right py-3 px-4">Total Hours</th>
                        <th className="text-right py-3 px-4">Sessions</th>
                        <th className="text-right py-3 px-4">Avg Duration</th>
                        <th className="text-right py-3 px-4">Samples</th>
                      </tr>
                    </thead>
                  <tbody>
                    {equipmentTimeData.length > 0 ? (
                      equipmentTimeData.map((eq) => (
                        <tr key={eq.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span>{eq.icon}</span>
                              {eq.name}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-muted rounded text-xs">{eq.type}</span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{eq.location}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {eq.scheduledCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Scheduled: {eq.scheduledCount}
                                </Badge>
                              )}
                              {eq.quickAddCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Usage records: {eq.quickAddCount}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">{eq.hours}h</td>
                          <td className="text-right py-3 px-4">{eq.bookings}</td>
                          <td className="text-right py-3 px-4">
                            {eq.bookings > 0 
                              ? Math.round(eq.totalMinutes / eq.bookings) + 'm'
                              : '-'
                            }
                          </td>
                          <td className="text-right py-3 px-4">
                            {eq.samplesProcessed > 0 ? eq.samplesProcessed : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-muted-foreground">
                          No equipment data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {idleEquipment.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  {idleEquipment.length} of {totalEquipmentPieces} instruments have no recorded
                  use in this data: {idleEquipment.map(e => e.name).join(', ')}.
                </p>
              )}
            </Card>

            {equipmentTimeData.some(eq => eq.type === 'HiPerGator' && (eq.cpuUsage > 0 || eq.gpuUsage > 0)) && (
              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">HiPerGator Resource Usage</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Equipment</th>
                        <th className="text-right py-3 px-4">Total CPU</th>
                        <th className="text-right py-3 px-4">Total GPU</th>
                        <th className="text-right py-3 px-4">Avg CPU/Session</th>
                        <th className="text-right py-3 px-4">Avg GPU/Session</th>
                        <th className="text-right py-3 px-4">Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipmentTimeData
                        .filter(eq => eq.type === 'HiPerGator')
                        .map((eq) => (
                          <tr key={eq.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span>{eq.icon}</span>
                                {eq.name}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-medium">{eq.cpuUsage}</td>
                            <td className="text-right py-3 px-4 font-medium">{eq.gpuUsage}</td>
                            <td className="text-right py-3 px-4">{eq.avgCpuPerSession}</td>
                            <td className="text-right py-3 px-4">{eq.avgGpuPerSession}</td>
                            <td className="text-right py-3 px-4">{eq.bookings}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;
