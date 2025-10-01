import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockBookings, mockProjects, mockStudents } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, TrendingUp, Users, FolderKanban } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";

const Analytics = () => {
  // Calculate time per project
  const projectTimeData = mockProjects.map(project => {
    const projectBookings = mockBookings.filter(b => b.projectId === project.id);
    const totalMinutes = projectBookings.reduce((sum, b) => sum + b.duration, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    return {
      name: project.name,
      hours: totalHours,
      bookings: projectBookings.length,
      color: project.color || "#8884d8",
    };
  });

  // Calculate time per student
  const studentTimeData = mockStudents.map(student => {
    const studentBookings = mockBookings.filter(b => b.studentName === student.name);
    const totalMinutes = studentBookings.reduce((sum, b) => sum + b.duration, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    return {
      name: student.name,
      hours: totalHours,
      bookings: studentBookings.length,
    };
  }).sort((a, b) => b.hours - a.hours);

  // Summary stats
  const totalBookings = mockBookings.length;
  const totalHours = Math.round(mockBookings.reduce((sum, b) => sum + b.duration, 0) / 60 * 10) / 10;
  const activeStudents = new Set(mockBookings.map(b => b.studentName)).size;
  const avgBookingDuration = Math.round(mockBookings.reduce((sum, b) => sum + b.duration, 0) / totalBookings);

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
            trend={`${mockStudents.length} registered`}
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Project Distribution</h3>
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
                      {projectTimeData.map((project) => (
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
                      ))}
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="hours" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 lg:col-span-1">
                <h3 className="font-semibold text-xl mb-4">Student Rankings</h3>
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
                      {studentTimeData.map((student) => (
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
                      ))}
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
