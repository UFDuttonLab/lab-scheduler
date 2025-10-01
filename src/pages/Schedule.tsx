import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Equipment, Project, Booking } from "@/lib/types";
import { format, isSameDay, parse, addMinutes } from "date-fns";
import { Plus, Clock, Loader2, List, Grid3x3 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "@/components/BookingCard";

const Schedule = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");
  const [purpose, setPurpose] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchEquipment();
    fetchBookings();
  }, []);

  // Pre-select equipment if passed via URL, but don't auto-open dialog
  useEffect(() => {
    const equipmentId = searchParams.get('equipment');
    if (equipmentId && equipment.length > 0) {
      setSelectedEquipment(equipmentId);
      // Don't auto-open dialog - let user select date first
    }
  }, [searchParams, equipment]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error("Failed to load projects");
      return;
    }
    
    setProjects(data || []);
  };

  const fetchEquipment = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error("Failed to load equipment");
      return;
    }
    
    // Transform to match Equipment type
    const transformedEquipment: Equipment[] = (data || []).map(eq => ({
      id: eq.id,
      name: eq.name,
      type: eq.type as "robot" | "equipment",
      status: eq.status as "available" | "in-use" | "maintenance",
      location: eq.location,
      description: eq.description || undefined,
    }));
    
    setEquipment(transformedEquipment);
  };

  const fetchBookings = async () => {
    try {
      // Fetch all data separately to avoid nested join issues
      const [bookingsRes, equipmentRes, projectsRes, profilesRes] = await Promise.all([
        supabase.from('bookings').select('*').order('start_time'),
        supabase.from('equipment').select('id, name'),
        supabase.from('projects').select('id, name, color'),
        supabase.from('profiles').select('id, email, full_name, spirit_animal')
      ]);

      if (bookingsRes.error) throw bookingsRes.error;

      // Create lookup maps
      const equipmentMap = new Map(equipmentRes.data?.map(e => [e.id, e]) || []);
      const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);

      // Enrich booking data
      const transformedBookings: Booking[] = (bookingsRes.data || []).map((booking: any) => {
        const equipment = equipmentMap.get(booking.equipment_id);
        const project = booking.project_id ? projectMap.get(booking.project_id) : null;
        const profile = profileMap.get(booking.user_id);

        return {
          id: booking.id,
          equipmentId: booking.equipment_id,
          equipmentName: equipment?.name || 'Unknown',
          studentName: profile?.full_name || 'Unknown',
          studentEmail: profile?.email || 'Unknown',
          studentSpiritAnimal: profile?.spirit_animal || undefined,
          startTime: new Date(booking.start_time),
          endTime: new Date(booking.end_time),
          duration: Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000),
          projectId: booking.project_id || undefined,
          projectName: project?.name || undefined,
          purpose: booking.purpose || undefined,
          status: booking.status as "scheduled" | "in-progress" | "completed" | "cancelled"
        };
      });

      setBookings(transformedBookings);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    }
  };

  const availableEquipment = equipment.filter(e => {
    if (e.status !== "available") return false;
    if (!selectedProject) return true;
    
    // Check if this equipment is compatible with the selected project
    // Note: We need to fetch equipment_projects relationships
    return true; // For now, show all available equipment
  });

  const dayBookings = selectedDate 
    ? bookings.filter(b => isSameDay(b.startTime, selectedDate))
    : [];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to book equipment");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    setLoading(true);

    try {
      // Parse the time and combine with selected date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(startTime, parseInt(duration));

      // Insert booking into database
      const { error } = await supabase
        .from('bookings')
        .insert({
          equipment_id: selectedEquipment,
          user_id: user.id,
          project_id: selectedProject || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          purpose: purpose || null,
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success("Equipment booked successfully!");
      setIsBookingDialogOpen(false);
      setSelectedProject("");
      setSelectedEquipment("");
      setSelectedTime("");
      setPurpose("");
      
      // Refresh bookings
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to book equipment");
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
    { value: "240", label: "4 hours" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Equipment Schedule</h1>
          <p className="text-muted-foreground">
            View the unified calendar and book equipment - First come, first served
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6 lg:col-span-1">
            <h3 className="font-semibold mb-4">Select Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            
            <div className="mt-6">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setIsBookingDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2">
            {selectedDate && (
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-xl mb-1">
                    Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} today
                  </p>
                </div>

                <Tabs defaultValue="list" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="list">
                      <List className="w-4 h-4 mr-2" />
                      List View
                    </TabsTrigger>
                    <TabsTrigger value="timeline">
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Timeline View
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="list">
                    {dayBookings.length > 0 ? (
                      <div className="space-y-4">
                        {dayBookings.map((booking) => {
                          const project = projects.find(p => p.id === booking.projectId);
                          return (
                            <Card key={booking.id} className="p-4 border-l-4" style={{ borderLeftColor: project?.color || '#ccc' }}>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">{booking.equipmentName}</h4>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {format(booking.startTime, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                                    </span>
                                    <span className="text-xs">({booking.duration} min)</span>
                                  </div>
                                </div>
                                <Badge className="bg-primary text-primary-foreground">
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                <div className="flex items-center gap-2">
                                  {booking.studentSpiritAnimal && (
                                    <span className="text-lg">{booking.studentSpiritAnimal}</span>
                                  )}
                                  <p className="font-medium">{booking.studentName}</p>
                                </div>
                                <p className="text-muted-foreground">{booking.studentEmail}</p>
                                {booking.projectName && (
                                  <p className="mt-2 text-sm">
                                    <span className="font-medium">Project:</span> {booking.projectName}
                                  </p>
                                )}
                                {booking.purpose && (
                                  <p className="mt-1 text-muted-foreground">{booking.purpose}</p>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No bookings scheduled for this day</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline">
                    {(() => {
                      // Assign tracks to bookings to avoid visual overlap
                      const bookingsWithTracks = dayBookings.map(booking => {
                        const startMinutes = booking.startTime.getHours() * 60 + booking.startTime.getMinutes();
                        const endMinutes = booking.endTime.getHours() * 60 + booking.endTime.getMinutes();
                        return { ...booking, startMinutes, endMinutes, track: 0 };
                      }).sort((a, b) => a.startMinutes - b.startMinutes);

                      // Simple track assignment algorithm
                      const tracks: Array<{ endMinutes: number }> = [];
                      bookingsWithTracks.forEach(booking => {
                        // Find first available track
                        let assignedTrack = -1;
                        for (let i = 0; i < tracks.length; i++) {
                          if (tracks[i].endMinutes <= booking.startMinutes) {
                            assignedTrack = i;
                            tracks[i].endMinutes = booking.endMinutes;
                            break;
                          }
                        }
                        
                        // No available track found, create new one
                        if (assignedTrack === -1) {
                          assignedTrack = tracks.length;
                          tracks.push({ endMinutes: booking.endMinutes });
                        }
                        
                        booking.track = assignedTrack;
                      });

                      const numTracks = tracks.length;
                      const hours = Array.from({ length: 13 }, (_, i) => i + 8);

                      return (
                        <div className="relative">
                          {/* Timeline grid */}
                          <div className="flex">
                            {/* Time column */}
                            <div className="w-20 flex-shrink-0">
                              {hours.map(hour => (
                                <div 
                                  key={hour} 
                                  className="h-16 flex items-start text-sm font-medium text-muted-foreground border-b border-border"
                                >
                                  {format(new Date().setHours(hour, 0), "h:mm a")}
                                </div>
                              ))}
                            </div>

                            {/* Tracks container */}
                            <div className="flex-1 relative border-l-2 border-border">
                              {numTracks === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                  <div className="text-center">
                                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No bookings scheduled</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-full">
                                  {/* Hour grid lines */}
                                  <div className="absolute inset-0 pointer-events-none">
                                    {hours.map((hour, idx) => (
                                      <div 
                                        key={hour}
                                        className="border-b border-border/50"
                                        style={{ 
                                          position: 'absolute',
                                          top: `${idx * 64}px`,
                                          left: 0,
                                          right: 0,
                                          height: '64px'
                                        }}
                                      />
                                    ))}
                                  </div>

                                  {/* Booking tracks */}
                                  {Array.from({ length: numTracks }, (_, trackIdx) => (
                                    <div 
                                      key={trackIdx}
                                      className="relative flex-1 border-r border-border/30 last:border-r-0"
                                      style={{ minWidth: '200px' }}
                                    >
                                      {bookingsWithTracks
                                        .filter(b => b.track === trackIdx)
                                        .map(booking => {
                                          const project = projects.find(p => p.id === booking.projectId);
                                          // Calculate position and height
                                          const startHour = 8; // First hour is 8am
                                          const pixelsPerMinute = 64 / 60; // 64px per hour
                                          const top = (booking.startMinutes - (startHour * 60)) * pixelsPerMinute;
                                          const height = (booking.endMinutes - booking.startMinutes) * pixelsPerMinute;

                                           return (
                                            <Card
                                              key={booking.id}
                                              onClick={() => {
                                                setSelectedBooking(booking);
                                                setIsDetailsDialogOpen(true);
                                              }}
                                              className="absolute left-1 right-1 p-3 border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                                              style={{
                                                borderLeftColor: project?.color || 'hsl(var(--primary))',
                                                top: `${top}px`,
                                                height: `${height}px`,
                                              }}
                                            >
                                              <div className="flex flex-col h-full">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                  <p className="font-semibold text-sm leading-tight line-clamp-2">
                                                    {booking.equipmentName}
                                                  </p>
                                                  <Badge variant="secondary" className="text-xs shrink-0">
                                                    {booking.duration}m
                                                  </Badge>
                                                </div>
                                                
                                                <div className="text-xs text-muted-foreground space-y-0.5">
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                      {format(booking.startTime, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    {booking.studentSpiritAnimal && (
                                                      <span>{booking.studentSpiritAnimal}</span>
                                                    )}
                                                    <span className="truncate">{booking.studentName}</span>
                                                  </div>
                                                  {booking.projectName && (
                                                    <div className="truncate font-medium">
                                                      {booking.projectName}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </Card>
                                          );
                                        })}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Book Equipment</DialogTitle>
              <DialogDescription>
                First-come, first-served - Your booking is confirmed immediately
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select 
                  value={selectedEquipment} 
                  onValueChange={setSelectedEquipment}
                  disabled={!selectedProject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProject ? "Select equipment" : "Select a project first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProject && availableEquipment.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No compatible equipment available for this project
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Purpose (Optional)</Label>
                <Textarea 
                  placeholder="Brief description of what you'll be doing" 
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!selectedProject || !selectedEquipment || !selectedTime || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Book Equipment
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Booking Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <BookingCard 
                booking={selectedBooking} 
                onDelete={() => {
                  setIsDetailsDialogOpen(false);
                  fetchBookings();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Schedule;
