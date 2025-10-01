import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Equipment, Project, Booking } from "@/lib/types";
import { format, isSameDay, parse, addMinutes, addDays } from "date-fns";
import { Plus, Clock, Loader2, List, Grid3x3, Cpu, Server, FlaskConical, Users, X, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "@/components/BookingCard";
import { Input } from "@/components/ui/input";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  spirit_animal?: string;
}

const Schedule = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");
  const [purpose, setPurpose] = useState<string>("");
  const [cpuCount, setCpuCount] = useState<number>(1);
  const [gpuCount, setGpuCount] = useState<number>(0);
  const [samplesCount, setSamplesCount] = useState<number>(1);
  const [collaboratorSearch, setCollaboratorSearch] = useState<string>("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchEquipment();
    fetchBookings();
    fetchUsers();
  }, []);

  // Pre-select equipment if passed via URL, but don't auto-open dialog
  useEffect(() => {
    const equipmentId = searchParams.get('equipment');
    if (equipmentId && equipment.length > 0) {
      setSelectedEquipment(equipmentId);
      // Don't auto-open dialog - let user select date first
    }
  }, [searchParams, equipment]);

  // Reset duration and resource counts when switching equipment types
  useEffect(() => {
    const selectedEq = equipment.find(e => e.id === selectedEquipment);
    if (selectedEq?.type === "HiPerGator") {
      setDuration("60");
      setCpuCount(1);
      setGpuCount(0);
    } else if (selectedEquipment) {
      setDuration("60");
    }
    setSamplesCount(1);
  }, [selectedEquipment, equipment]);

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

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, spirit_animal')
      .order('full_name');
    
    if (error) {
      console.error("Failed to load users:", error);
      return;
    }
    
    setAvailableUsers(data || []);
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
      type: eq.type as "robot" | "equipment" | "quantification" | "PCR" | "HiPerGator",
      status: eq.status as "available" | "in-use" | "maintenance",
      location: eq.location,
      description: eq.description || undefined,
      icon: eq.icon || undefined,
      maxCpuCount: eq.max_cpu_count || undefined,
      maxGpuCount: eq.max_gpu_count || undefined,
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
          status: booking.status as "scheduled" | "in-progress" | "completed" | "cancelled",
          cpuCount: booking.cpu_count || undefined,
          gpuCount: booking.gpu_count || undefined,
          samplesProcessed: booking.samples_processed || undefined,
          collaborators: (booking.collaborators as string[]) || [],
          userId: booking.user_id
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

    if (!bookingDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    const selectedEq = equipment.find(e => e.id === selectedEquipment);
    const isHiPerGator = selectedEq?.type === "HiPerGator";

    setLoading(true);

    try {
      // Parse the time and combine with booking dialog's selected date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(bookingDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(startTime, parseInt(duration));

      // For HiPerGator, check resource availability
      if (isHiPerGator) {
        const overlappingBookings = bookings.filter(b => 
          b.equipmentId === selectedEquipment &&
          b.status !== 'cancelled' &&
          (
            (b.startTime <= startTime && b.endTime > startTime) ||
            (b.startTime < endTime && b.endTime >= endTime) ||
            (b.startTime >= startTime && b.endTime <= endTime)
          )
        );

        const totalCpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.cpuCount || 0), 0);
        const totalGpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.gpuCount || 0), 0);

        const maxCpus = selectedEq.maxCpuCount || 32;
        const maxGpus = selectedEq.maxGpuCount || 4;

        if (totalCpuUsed + cpuCount > maxCpus) {
          toast.error(`Not enough CPUs available. Currently ${maxCpus - totalCpuUsed} CPUs free during this time.`);
          setLoading(false);
          return;
        }

        if (totalGpuUsed + gpuCount > maxGpus) {
          toast.error(`Not enough GPUs available. Currently ${maxGpus - totalGpuUsed} GPUs free during this time.`);
          setLoading(false);
          return;
        }
      }

      // Insert booking into database
      const bookingData: any = {
        equipment_id: selectedEquipment,
        user_id: user.id,
        project_id: selectedProject || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        purpose: purpose || null,
        status: 'scheduled',
        samples_processed: samplesCount,
        collaborators: selectedCollaborators
      };

      // Add resource counts for HiPerGator
      if (isHiPerGator) {
        bookingData.cpu_count = cpuCount;
        bookingData.gpu_count = gpuCount;
      }

      const { error } = await supabase
        .from('bookings')
        .insert(bookingData);

      if (error) throw error;

      toast.success(isHiPerGator 
        ? `HiPerGator booked: ${cpuCount} CPUs, ${gpuCount} GPUs` 
        : "Equipment booked successfully!");
      setIsBookingDialogOpen(false);
      setBookingDate(new Date());
      setSelectedProject("");
      setSelectedEquipment("");
      setSelectedTime("");
      setPurpose("");
      setCpuCount(1);
      setGpuCount(0);
      setSamplesCount(1);
      setSelectedCollaborators([]);
      setCollaboratorSearch("");
      
      // Refresh bookings
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to book equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedBooking) {
      toast.error("Invalid booking");
      return;
    }

    if (!bookingDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    const selectedEq = equipment.find(e => e.id === selectedEquipment);
    const isHiPerGator = selectedEq?.type === "HiPerGator";

    setLoading(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(bookingDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(startTime, parseInt(duration));

      // For HiPerGator, check resource availability (excluding current booking)
      if (isHiPerGator) {
        const overlappingBookings = bookings.filter(b => 
          b.id !== selectedBooking.id &&
          b.equipmentId === selectedEquipment &&
          b.status !== 'cancelled' &&
          (
            (b.startTime <= startTime && b.endTime > startTime) ||
            (b.startTime < endTime && b.endTime >= endTime) ||
            (b.startTime >= startTime && b.endTime <= endTime)
          )
        );

        const totalCpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.cpuCount || 0), 0);
        const totalGpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.gpuCount || 0), 0);

        const maxCpus = selectedEq.maxCpuCount || 32;
        const maxGpus = selectedEq.maxGpuCount || 4;

        if (totalCpuUsed + cpuCount > maxCpus) {
          toast.error(`Not enough CPUs available. Currently ${maxCpus - totalCpuUsed} CPUs free during this time.`);
          setLoading(false);
          return;
        }

        if (totalGpuUsed + gpuCount > maxGpus) {
          toast.error(`Not enough GPUs available. Currently ${maxGpus - totalGpuUsed} GPUs free during this time.`);
          setLoading(false);
          return;
        }
      }

      const bookingData: any = {
        equipment_id: selectedEquipment,
        project_id: selectedProject || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        purpose: purpose || null,
        samples_processed: samplesCount,
        collaborators: selectedCollaborators
      };

      if (isHiPerGator) {
        bookingData.cpu_count = cpuCount;
        bookingData.gpu_count = gpuCount;
      }

      const { error } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast.success("Booking updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedBooking(null);
      setSelectedProject("");
      setSelectedEquipment("");
      setSelectedTime("");
      setPurpose("");
      setCpuCount(1);
      setGpuCount(0);
      setSamplesCount(1);
      setSelectedCollaborators([]);
      setCollaboratorSearch("");
      
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const selectedEq = equipment.find(e => e.id === selectedEquipment);
  const isHiPerGator = selectedEq?.type === "HiPerGator";

  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
    { value: "240", label: "4 hours" },
    { value: "480", label: "8 hours" },
    { value: "1440", label: "1 day" },
    { value: "2880", label: "2 days" },
    { value: "4320", label: "3 days" },
    { value: "5760", label: "4 days" },
    { value: "7200", label: "5 days" },
    { value: "8640", label: "6 days" },
    { value: "10080", label: "7 days" },
  ];

  // Calculate available HiPerGator resources if applicable
  const getAvailableResources = () => {
    if (!isHiPerGator || !bookingDate || !selectedTime) {
      const maxCpus = selectedEq?.maxCpuCount || 32;
      const maxGpus = selectedEq?.maxGpuCount || 4;
      return { availableCpu: maxCpus, availableGpu: maxGpus };
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(bookingDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = addMinutes(startTime, parseInt(duration));

    const overlappingBookings = bookings.filter(b => 
      b.equipmentId === selectedEquipment &&
      b.status !== 'cancelled' &&
      (
        (b.startTime <= startTime && b.endTime > startTime) ||
        (b.startTime < endTime && b.endTime >= endTime) ||
        (b.startTime >= startTime && b.endTime <= endTime)
      )
    );

    const usedCpus = overlappingBookings.reduce((sum, b) => sum + (b.cpuCount || 0), 0);
    const usedGpus = overlappingBookings.reduce((sum, b) => sum + (b.gpuCount || 0), 0);

    const maxCpus = selectedEq?.maxCpuCount || 32;
    const maxGpus = selectedEq?.maxGpuCount || 4;

    return {
      availableCpu: maxCpus - usedCpus,
      availableGpu: maxGpus - usedGpus
    };
  };

  const { availableCpu, availableGpu } = getAvailableResources();

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
                onClick={() => {
                  setBookingDate(selectedDate || new Date());
                  setIsBookingDialogOpen(true);
                }}
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
                                       {format(booking.startTime, "MMM d, h:mm a")} - {format(booking.endTime, "h:mm a")}
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
                                 {booking.cpuCount !== undefined && (
                                   <p className="mt-2 text-sm flex items-center gap-2">
                                     <Cpu className="w-3 h-3" />
                                     <span><span className="font-medium">CPUs:</span> {booking.cpuCount}</span>
                                     {booking.gpuCount !== undefined && (
                                       <>
                                         <Server className="w-3 h-3 ml-2" />
                                         <span><span className="font-medium">GPUs:</span> {booking.gpuCount}</span>
                                       </>
                                     )}
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
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Equipment</DialogTitle>
              <DialogDescription>
                First-come, first-served - Your booking is confirmed immediately
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !bookingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bookingDate ? format(bookingDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

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
                          <span className="text-lg">{project.icon || "🧪"}</span>
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

              {/* Samples Count Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Samples: {samplesCount}
                  </Label>
                </div>
                <Slider
                  value={[samplesCount]}
                  onValueChange={(value) => setSamplesCount(value[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Collaborators */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Collaborators (Optional)
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search by name or email..."
                    value={collaboratorSearch}
                    onChange={(e) => setCollaboratorSearch(e.target.value)}
                  />
                  {collaboratorSearch && (
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {availableUsers
                        .filter(u => 
                          u.id !== user?.id &&
                          !selectedCollaborators.includes(u.id) &&
                          (u.full_name?.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
                           u.email.toLowerCase().includes(collaboratorSearch.toLowerCase()))
                        )
                        .slice(0, 5)
                        .map(u => (
                          <Button
                            key={u.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() => {
                              setSelectedCollaborators([...selectedCollaborators, u.id]);
                              setCollaboratorSearch("");
                            }}
                          >
                            {u.spirit_animal && <span className="mr-2">{u.spirit_animal}</span>}
                            <span className="truncate">{u.full_name || u.email}</span>
                          </Button>
                        ))}
                    </div>
                  )}
                  {selectedCollaborators.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCollaborators.map(collab => {
                        const user = availableUsers.find(u => u.id === collab);
                        return user ? (
                          <Badge key={collab} variant="secondary" className="gap-1">
                            {user.spirit_animal && <span>{user.spirit_animal}</span>}
                            <span>{user.full_name || user.email}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedCollaborators(selectedCollaborators.filter(c => c !== collab))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* HiPerGator Resource Allocation */}
              {isHiPerGator && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Server className="w-4 h-4" />
                      <span>Resource Allocation</span>
                    </div>
                    {(() => {
                      const cpuPercent = ((availableCpu / (selectedEq?.maxCpuCount || 32)) * 100);
                      const gpuPercent = ((availableGpu / (selectedEq?.maxGpuCount || 4)) * 100);
                      const status = cpuPercent > 50 && gpuPercent > 50 ? 'high' : cpuPercent > 20 && gpuPercent > 20 ? 'medium' : 'low';
                      return (
                        <Badge variant={status === 'high' ? 'default' : status === 'medium' ? 'secondary' : 'destructive'} className="text-xs">
                          {availableCpu} CPUs, {availableGpu} GPUs available
                        </Badge>
                      );
                    })()}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Cpu className="w-4 h-4" />
                          CPUs: {cpuCount} of {availableCpu}
                        </Label>
                      </div>
                      <Slider
                        value={[cpuCount]}
                        onValueChange={(value) => setCpuCount(value[0])}
                        min={1}
                        max={Math.max(1, Math.min(selectedEq?.maxCpuCount || 32, availableCpu))}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          GPUs: {gpuCount} of {availableGpu}
                        </Label>
                      </div>
                      <Slider
                        value={[gpuCount]}
                        onValueChange={(value) => setGpuCount(value[0])}
                        min={0}
                        max={Math.max(0, Math.min(selectedEq?.maxGpuCount || 4, availableGpu))}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {(availableCpu < (selectedEq?.maxCpuCount || 32) * 0.2 || availableGpu < (selectedEq?.maxGpuCount || 4) * 0.2) && (
                      <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700 dark:text-amber-400">
                        <Server className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Limited resources available during this time. Consider selecting a different time slot for more capacity.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                onEdit={(booking) => {
                  setSelectedBooking(booking);
                  setIsEditDialogOpen(true);
                  setIsDetailsDialogOpen(false);
                  // Pre-fill form
                  setSelectedProject(booking.projectId || "");
                  setSelectedEquipment(booking.equipmentId);
                  setBookingDate(booking.startTime);
                  setSelectedTime(format(booking.startTime, "HH:mm"));
                  setDuration(booking.duration.toString());
                  setPurpose(booking.purpose || "");
                  setSamplesCount(booking.samplesProcessed || 1);
                  setCpuCount(booking.cpuCount || 1);
                  setGpuCount(booking.gpuCount || 0);
                  setSelectedCollaborators(booking.collaborators || []);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>
                Update your booking details
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !bookingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bookingDate ? format(bookingDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{project.icon || "🧪"}</span>
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Samples: {samplesCount}
                  </Label>
                </div>
                <Slider
                  value={[samplesCount]}
                  onValueChange={(value) => setSamplesCount(value[0])}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>

              {/* Collaborators */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Collaborators (Optional)
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search by name or email..."
                    value={collaboratorSearch}
                    onChange={(e) => setCollaboratorSearch(e.target.value)}
                  />
                  {collaboratorSearch && (
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {availableUsers
                        .filter(u => 
                          u.id !== user?.id &&
                          !selectedCollaborators.includes(u.id) &&
                          (u.full_name?.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
                           u.email.toLowerCase().includes(collaboratorSearch.toLowerCase()))
                        )
                        .slice(0, 5)
                        .map(u => (
                          <Button
                            key={u.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() => {
                              setSelectedCollaborators([...selectedCollaborators, u.id]);
                              setCollaboratorSearch("");
                            }}
                          >
                            {u.spirit_animal && <span className="mr-2">{u.spirit_animal}</span>}
                            <span className="truncate">{u.full_name || u.email}</span>
                          </Button>
                        ))}
                    </div>
                  )}
                  {selectedCollaborators.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCollaborators.map(collab => {
                        const collaboratorUser = availableUsers.find(u => u.id === collab);
                        return collaboratorUser ? (
                          <Badge key={collab} variant="secondary" className="gap-1">
                            {collaboratorUser.spirit_animal && <span>{collaboratorUser.spirit_animal}</span>}
                            <span>{collaboratorUser.full_name || collaboratorUser.email}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedCollaborators(selectedCollaborators.filter(c => c !== collab))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {isHiPerGator && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Server className="w-4 h-4" />
                      <span>Resource Allocation</span>
                    </div>
                    {(() => {
                      const cpuPercent = ((availableCpu / (selectedEq?.maxCpuCount || 32)) * 100);
                      const gpuPercent = ((availableGpu / (selectedEq?.maxGpuCount || 4)) * 100);
                      const status = cpuPercent > 50 && gpuPercent > 50 ? 'high' : cpuPercent > 20 && gpuPercent > 20 ? 'medium' : 'low';
                      return (
                        <Badge variant={status === 'high' ? 'default' : status === 'medium' ? 'secondary' : 'destructive'} className="text-xs">
                          {availableCpu} CPUs, {availableGpu} GPUs available
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Cpu className="w-4 h-4" />
                          CPUs: {cpuCount} of {availableCpu}
                        </Label>
                      </div>
                      <Slider
                        value={[cpuCount]}
                        onValueChange={(value) => setCpuCount(value[0])}
                        min={1}
                        max={Math.max(1, Math.min(selectedEq?.maxCpuCount || 32, availableCpu))}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          GPUs: {gpuCount} of {availableGpu}
                        </Label>
                      </div>
                      <Slider
                        value={[gpuCount]}
                        onValueChange={(value) => setGpuCount(value[0])}
                        min={0}
                        max={Math.max(0, Math.min(selectedEq?.maxGpuCount || 4, availableGpu))}
                        step={1}
                      />
                    </div>
                    {(availableCpu < (selectedEq?.maxCpuCount || 32) * 0.2 || availableGpu < (selectedEq?.maxGpuCount || 4) * 0.2) && (
                      <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700 dark:text-amber-400">
                        <Server className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Limited resources available during this time. Consider selecting a different time slot for more capacity.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : "Update Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Schedule;
