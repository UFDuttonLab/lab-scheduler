import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, TrendingUp, Users, FolderKanban, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data separately
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

      if (bookingsError) throw bookingsError;

      const { data: equipmentData } = await supabase.from('equipment').select('*');
      const { data: projectsData } = await supabase.from('projects').select('*');
      const { data: profilesData } = await supabase.from('profiles').select('*');

      // Create lookup maps
      const equipmentMap = new Map(equipmentData?.map(e => [e.id, e]) || []);
      const projectMap = new Map(projectsData?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profilesData?.map(u => [u.id, u]) || []);

      // Enrich bookings with related data
      const enrichedBookings = (bookingsData || []).map(booking => ({
        ...booking,
        equipment: equipmentMap.get(booking.equipment_id),
        project: projectMap.get(booking.project_id),
        profile: profileMap.get(booking.user_id)
      }));

      setBookings(enrichedBookings);
      setProjects(projectsData || []);
      setUsers(profilesData || []);
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
      name: project.name,
      hours: totalHours,
      bookings: projectBookings.length,
      color: project.color || "#8884d8",
    };
  }).filter(p => p.hours > 0);

  // Calculate time per student
  const studentTimeData = users.map(user => {
    const userBookings = bookings.filter(b => b.user_id === user.id);
    const totalMinutes = userBookings.reduce((sum, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    return {
      name: user.full_name || user.email,
      hours: totalHours,
      bookings: userBookings.length,
    };
  }).filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours);

  // Summary stats
  const totalBookings = bookings.length;
  const totalMinutes = bookings.reduce((sum, booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  const activeStudents = new Set(bookings.map(b => b.user_id)).size;
  const avgBookingDuration = totalBookings > 0 ? Math.round(totalMinutes / totalBookings) : 0;

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                      <Bar dataKey="hours" fill="hsl(var(--primary))" />
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
                <h3 className="font-semibold text-xl mb-4">Project Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Project</th>
                        <th className="text-right py-3 px-4">Total Hours</th>
                        <th className="text-right py-3 px-4">Bookings</th>
                        <th className="text-right py-3 px-4">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectTimeData.length > 0 ? (
                        projectTimeData.map((project) => (
                          <tr key={project.name} className="border-b hover:bg-muted/50">
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
                              {project.bookings > 0 
                                ? Math.round(project.hours / project.bookings * 60) + 'm'
                                : '-'
                              }
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">
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
                      <div key={student.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                <h3 className="font-semibold text-xl mb-4">Student Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student</th>
                        <th className="text-right py-3 px-4">Total Hours</th>
                        <th className="text-right py-3 px-4">Bookings</th>
                        <th className="text-right py-3 px-4">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentTimeData.length > 0 ? (
                        studentTimeData.map((student) => (
                          <tr key={student.name} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{student.name}</td>
                            <td className="text-right py-3 px-4">{student.hours}h</td>
                            <td className="text-right py-3 px-4">{student.bookings}</td>
                            <td className="text-right py-3 px-4">
                              {student.bookings > 0 
                                ? Math.round(student.hours / student.bookings * 60) + 'm'
                                : '-'
                              }
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">
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
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;