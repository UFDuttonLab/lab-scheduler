import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

      // A multi-equipment session writes the FULL sample payload onto EVERY equipment row
      // (see QuickAdd/Schedule), so a 100-sample run on 3 machines used to report 300
      // samples. booking_group_id links those rows. Keep every row's time - all three
      // machines really were occupied - but attribute the samples to only the first row
      // of each group.
      // Sort first so "the first row of each group" is stable. Without this the query has
      // no ORDER BY, so which machine got credited with a multi-equipment session's samples
      // changed between page loads.
      const ordered = [...realUsage].sort((a, b) => {
        const t = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        return t !== 0 ? t : String(a.id).localeCompare(String(b.id));
      });

      const seenSampleGroups = new Set<string>();
      const deduped = ordered.map(record => {
        const groupId = record.booking_group_id;
        if (!groupId) return record;
        if (seenSampleGroups.has(groupId)) {
          return { ...record, samples_processed: 0, projectSamples: undefined };
        }
        seenSampleGroups.add(groupId);
        return record;
      });

      setBookings(deduped);
      setProjects(projectsRes.data || []);
      setUsers(profilesRes.data || []);
      setEquipment(equipmentRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching analytics data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate time per project
  const projectTimeData = projects.map(project => {
    const projectBookings = bookings.filter(b => b.project_id === project.id);
    const totalMinutes = projectBookings.reduce((sum, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    return {
      id: project.id,
      name: project.name,
      hours: totalHours,
      bookings: projectBookings.length,
      // keep exact minutes so "avg duration" isn't derived from an already-rounded value
      totalMinutes,
      color: getProjectColor(project.id, projects),
    };
  }).filter(p => p.hours > 0);

  // Calculate time per student (including collaborators)
  const studentTimeData = users.map(user => {
    // Find bookings/usage records where user is either primary user or collaborator
    const userRecords = bookings.filter(b => {
      const isOwner = b.user_id === user.id;
      const isCollaborator = Array.isArray(b.collaborators) && b.collaborators.includes(user.id);
      return isOwner || isCollaborator;
    });
    
    const totalMinutes = userRecords.reduce((sum, record) => {
      const start = new Date(record.start_time);
      const end = new Date(record.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    return {
      id: user.id,
      name: user.full_name || user.email,
      hours: totalHours,
      bookings: userRecords.length,
      totalMinutes,
    };
  }).filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours);

  // Calculate samples per project
  const projectSampleData = projects.map(project => {
    let totalSamples = 0;
    const projectRecords: any[] = [];
    
    bookings.forEach(record => {
      // Check new format first
      if (record.projectSamples && Array.isArray(record.projectSamples)) {
        const projectEntry = record.projectSamples.find((ps: any) => ps.projectId === project.id);
        if (projectEntry) {
          totalSamples += projectEntry.samples;
          projectRecords.push(record);
        }
      } else if (record.project_id === project.id) {
        // Fallback to old format
        totalSamples += (record.samples_processed || 0);
        projectRecords.push(record);
      }
    });
    
    return {
      id: project.id,
      name: project.name,
      samples: totalSamples,
      sessions: projectRecords.length,
      color: getProjectColor(project.id, projects),
    };
  }).filter(p => p.samples > 0);

  // Calculate samples per student (including collaborators)
  const studentSampleData = users.map(user => {
    const userRecords = bookings.filter(b => {
      const isOwner = b.user_id === user.id;
      const isCollaborator = Array.isArray(b.collaborators) && 
                            b.collaborators.includes(user.id);
      return isOwner || isCollaborator;
    });
    
    const totalSamples = userRecords.reduce((sum, record) => {
      // Use new format if available
      if (record.projectSamples && Array.isArray(record.projectSamples)) {
        return sum + record.projectSamples.reduce((pSum: number, ps: any) => pSum + ps.samples, 0);
      }
      // Fallback to old format
      return sum + (record.samples_processed || 0);
    }, 0);
    
    return {
      id: user.id,
      name: user.full_name || user.email,
      samples: totalSamples,
      sessions: userRecords.length,
    };
  }).filter(s => s.samples > 0).sort((a, b) => b.samples - a.samples);

  // Summary stats
  const totalBookings = bookings.length;
  const totalMinutes = bookings.reduce((sum, booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  // Count unique students including collaborators
  const uniqueStudents = new Set<string>();
  bookings.forEach(b => {
    uniqueStudents.add(b.user_id);
    if (Array.isArray(b.collaborators)) {
      b.collaborators.forEach(collaboratorId => uniqueStudents.add(collaboratorId));
    }
  });
  const activeStudents = uniqueStudents.size;
  const avgBookingDuration = totalBookings > 0 ? Math.round(totalMinutes / totalBookings) : 0;
  
  // Calculate total samples
  const totalSamples = bookings.reduce((sum, record) => {
    // Use new format if available
    if (record.projectSamples && Array.isArray(record.projectSamples)) {
      return sum + record.projectSamples.reduce((pSum: number, ps: any) => pSum + ps.samples, 0);
    }
    // Fallback to old format
    return sum + (record.samples_processed || 0);
  }, 0);
  const sessionsWithSamples = bookings.filter(r => {
    // Check if record has samples in new format
    if (r.projectSamples && Array.isArray(r.projectSamples) && r.projectSamples.length > 0) {
      return r.projectSamples.some((ps: any) => ps.samples > 0);
    }
    // Fallback to old format
    return r.samples_processed && r.samples_processed > 0;
  }).length;

  // Calculate equipment analytics
  const equipmentTimeData = equipment.map(eq => {
    const equipmentRecords = bookings.filter(b => b.equipment_id === eq.id);
    const totalMinutes = equipmentRecords.reduce((sum, record) => {
      const start = new Date(record.start_time);
      const end = new Date(record.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    // Calculate CPU/GPU stats for HiPerGator
    const cpuSessions = equipmentRecords.filter(r => r.cpu_count !== null && r.cpu_count !== undefined);
    const gpuSessions = equipmentRecords.filter(r => r.gpu_count !== null && r.gpu_count !== undefined);
    const cpuUsage = cpuSessions.reduce((sum, r) => sum + (r.cpu_count || 0), 0);
    const gpuUsage = gpuSessions.reduce((sum, r) => sum + (r.gpu_count || 0), 0);
    const samplesProcessed = equipmentRecords.reduce((sum, r) => sum + (r.samples_processed || 0), 0);
    
    // Calculate source breakdown
    const scheduledCount = equipmentRecords.filter(r => r.source === 'booking').length;
    const quickAddCount = equipmentRecords.filter(r => r.source === 'usage_record').length;
    
    return {
      id: eq.id,
      name: eq.name,
      type: eq.type,
      location: eq.location,
      icon: eq.icon,
      hours: totalHours,
      bookings: equipmentRecords.length,
      scheduledCount,
      quickAddCount,
      cpuUsage: cpuUsage,
      gpuUsage: gpuUsage,
      // Average over the sessions that can actually carry a CPU/GPU allocation.
      // usage_records has no cpu_count/gpu_count column, so those rows added 0 to the
      // numerator while still inflating the denominator - two real 16-CPU bookings plus
      // eight Quick Adds reported 3.2 CPUs/session instead of 16.
      avgCpuPerSession: cpuSessions.length > 0 ? Math.round(cpuUsage / cpuSessions.length * 10) / 10 : 0,
      avgGpuPerSession: gpuSessions.length > 0 ? Math.round(gpuUsage / gpuSessions.length * 10) / 10 : 0,
      samplesProcessed: samplesProcessed,
    };
  }).filter(e => e.hours > 0).sort((a, b) => b.hours - a.hours);

  // Equipment type distribution
  const typeDistribution = equipment.reduce((acc, eq) => {
    const records = bookings.filter(b => b.equipment_id === eq.id);
    const minutes = records.reduce((sum, record) => {
      const start = new Date(record.start_time);
      const end = new Date(record.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    // Accumulate raw minutes and round once at the end. Summing values that were already
    // rounded to 0.1 produced float artifacts like "PCR: 0.30000000000000004h" in labels.
    acc[eq.type] = (acc[eq.type] || 0) + minutes;
    return acc;
  }, {} as Record<string, number>);

  const typeDistributionData = Object.entries(typeDistribution)
    .map(([type, minutes]) => ({ name: type, hours: Math.round((minutes as number) / 60 * 10) / 10 }))
    .filter(d => d.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  // Location distribution
  const locationDistribution = equipment.reduce((acc, eq) => {
    const records = bookings.filter(b => b.equipment_id === eq.id);
    const minutes = records.reduce((sum, record) => {
      const start = new Date(record.start_time);
      const end = new Date(record.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    // Accumulate raw minutes and round once at the end, same reason as typeDistribution.
    acc[eq.location] = (acc[eq.location] || 0) + minutes;
    return acc;
  }, {} as Record<string, number>);

  const locationDistributionData = Object.entries(locationDistribution)
    .map(([location, minutes]) => ({ name: location, hours: Math.round((minutes as number) / 60 * 10) / 10 }))
    .filter(d => d.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  const mostUsedEquipment = equipmentTimeData.length > 0 ? equipmentTimeData[0].name : "N/A";
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
            title="Total Bookings"
            value={totalBookings}
            icon={FolderKanban}
            trend={`${totalHours} hours total`}
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
            trend={`${sessionsWithSamples} sessions`}
          />
          <StatsCard
            title="Active Students"
            value={activeStudents}
            icon={Users}
            trend={`${users.length} registered`}
          />
          <StatsCard
            title="Avg Booking Duration"
            value={`${avgBookingDuration}m`}
            icon={TrendingUp}
            trend="Per session"
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
                        <th className="text-right py-3 px-4">Bookings</th>
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
                              <td className="text-right py-3 px-4">{project.bookings}</td>
                              <td className="text-right py-3 px-4">
                                {sampleData ? sampleData.samples : 0}
                              </td>
                              <td className="text-right py-3 px-4">
                                {project.bookings > 0 
                                  ? Math.round(project.totalMinutes / project.bookings) + 'm'
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
                            <p className="text-sm text-muted-foreground">{student.bookings} bookings</p>
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
                        <th className="text-right py-3 px-4">Bookings</th>
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
                              <td className="text-right py-3 px-4">{student.bookings}</td>
                              <td className="text-right py-3 px-4">
                                {sampleData ? sampleData.samples : 0}
                              </td>
                              <td className="text-right py-3 px-4">
                                {student.bookings > 0 
                                  ? Math.round(student.totalMinutes / student.bookings) + 'm'
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
                {equipmentTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={equipmentTimeData}>
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
                {equipmentTimeData.length > 0 ? (
                  <div className="space-y-3">
                    {equipmentTimeData.slice(0, 5).map((eq, index) => (
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
                                  Quick Add: {eq.quickAddCount}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">{eq.hours}h</td>
                          <td className="text-right py-3 px-4">{eq.bookings}</td>
                          <td className="text-right py-3 px-4">
                            {eq.bookings > 0 
                              ? Math.round(eq.hours / eq.bookings * 60) + 'm'
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
