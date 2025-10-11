import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { BookingCard } from "@/components/BookingCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Booking } from "@/lib/types";
import { Search, Loader2, CalendarIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { ProjectSampleSelector } from "@/components/ProjectSampleSelector";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [purpose, setPurpose] = useState("");
  const [projectSamples, setProjectSamples] = useState<Array<{projectId: string, projectName?: string, samples: number}>>([]);
  const [cpuCount, setCpuCount] = useState(1);
  const [gpuCount, setGpuCount] = useState(0);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reference data
  const [projects, setProjects] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchProjects();
    fetchEquipment();
    fetchUsers();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings (scheduled/future)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('start_time', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch usage records (past/completed from Quick Add)
      const { data: usageData, error: usageError } = await supabase
        .from('usage_records')
        .select('*')
        .order('start_time', { ascending: false });

      if (usageError) throw usageError;

      // Fetch reference data once
      const { data: equipmentData } = await supabase.from('equipment').select('*');
      const { data: projectsData } = await supabase.from('projects').select('*');
      const { data: profilesData } = await supabase.from('profiles').select('id, email, full_name, spirit_animal');

      // Create lookup maps
      const equipmentMap = new Map(equipmentData?.map(e => [e.id, e]) || []);
      const projectMap = new Map(projectsData?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profilesData?.map(u => [u.id, u]) || []);

    // Transform bookings
    const transformedBookings: Booking[] = (bookingsData || []).map((booking: any) => {
      const equipment = equipmentMap.get(booking.equipment_id);
      const project = projectMap.get(booking.project_id);
      const profile = profileMap.get(booking.user_id);

      // Enrich project_samples if available
      const enrichedProjectSamples = booking.project_samples?.map((ps: any) => ({
        projectId: ps.project_id,
        projectName: projectMap.get(ps.project_id)?.name || 'Unknown',
        samples: ps.samples
      }));

      return {
        id: booking.id,
        equipmentId: booking.equipment_id,
        equipmentName: equipment?.name || 'Unknown',
        studentName: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
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
        collaborators: booking.collaborators || undefined,
        userId: booking.user_id,
        source: 'booking' as const,
        projectSamples: enrichedProjectSamples
      };
    });

    // Transform usage records (all completed by definition)
    const transformedUsageRecords: Booking[] = (usageData || []).map((usage: any) => {
      const equipment = equipmentMap.get(usage.equipment_id);
      const project = projectMap.get(usage.project_id);
      const profile = profileMap.get(usage.user_id);

      // Enrich project_samples if available
      const enrichedProjectSamples = usage.project_samples?.map((ps: any) => ({
        projectId: ps.project_id,
        projectName: projectMap.get(ps.project_id)?.name || 'Unknown',
        samples: ps.samples
      }));

      return {
        id: usage.id,
        equipmentId: usage.equipment_id,
        equipmentName: equipment?.name || 'Unknown',
        studentName: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
        studentEmail: profile?.email || 'Unknown',
        studentSpiritAnimal: profile?.spirit_animal || undefined,
        startTime: new Date(usage.start_time),
        endTime: new Date(usage.end_time),
        duration: Math.round((new Date(usage.end_time).getTime() - new Date(usage.start_time).getTime()) / 60000),
        projectId: usage.project_id || undefined,
        projectName: project?.name || undefined,
        purpose: undefined,
        status: 'completed' as const,
        samplesProcessed: usage.samples_processed || undefined,
        collaborators: usage.collaborators || undefined,
        userId: usage.user_id,
        source: 'usage_record' as const,
        projectSamples: enrichedProjectSamples
      };
    });

      // Merge and sort by start_time descending
      const allRecords = [...transformedBookings, ...transformedUsageRecords]
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

      setBookings(allRecords);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('active', true)
        .order('full_name');
      
      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBooking || !bookingDate || !selectedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (projectSamples.length === 0 || projectSamples.some(ps => ps.samples <= 0)) {
      toast.error("Please add at least one project with valid sample count");
      return;
    }

    setIsSubmitting(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = setMinutes(setHours(bookingDate, hours), minutes);
      const endTime = addMinutes(startTime, parseInt(duration));

      // Build project_samples array
      const project_samples = projectSamples.map(ps => ({
        project_id: ps.projectId,
        samples: ps.samples
      }));

      const tableName = selectedBooking.source === 'usage_record' ? 'usage_records' : 'bookings';

      // Build update data based on source
      const updateData: any = {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        project_samples: project_samples,
        collaborators: selectedCollaborators,
      };

      // Add source-specific fields
      if (selectedBooking.source === 'booking') {
        updateData.purpose = purpose || null;
        if (selectedBooking.cpuCount !== undefined) {
          updateData.cpu_count = cpuCount;
        }
        if (selectedBooking.gpuCount !== undefined) {
          updateData.gpu_count = gpuCount;
        }
      } else {
        updateData.notes = purpose || null;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast.success(`${selectedBooking.source === 'usage_record' ? 'Usage record' : 'Booking'} updated successfully`);
      setIsEditDialogOpen(false);
      fetchBookings();
    } catch (error: any) {
      console.error("Error updating:", error);
      toast.error(error.message || "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking);
    
    // Pre-fill form
    if (booking.projectSamples && booking.projectSamples.length > 0) {
      setProjectSamples(booking.projectSamples.map(ps => ({
        projectId: ps.projectId,
        projectName: ps.projectName,
        samples: ps.samples
      })));
    } else if (booking.projectId && booking.samplesProcessed) {
      setProjectSamples([{
        projectId: booking.projectId,
        projectName: booking.projectName,
        samples: booking.samplesProcessed
      }]);
    } else {
      setProjectSamples([]);
    }
    
    setBookingDate(booking.startTime);
    setSelectedTime(format(booking.startTime, "HH:mm"));
    setDuration(booking.duration.toString());
    setPurpose(booking.purpose || "");
    setCpuCount(booking.cpuCount || 1);
    setGpuCount(booking.gpuCount || 0);
    setSelectedCollaborators(booking.collaborators || []);
    setCollaboratorSearch("");
    
    setIsEditDialogOpen(true);
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
    { value: "240", label: "4 hours" },
    { value: "480", label: "8 hours" },
    { value: "1440", label: "24 hours" },
  ];

  const currentEquipment = selectedBooking ? equipment.find(e => e.id === selectedBooking.equipmentId) : null;
  const isHiPerGator = currentEquipment?.type === "HiPerGator";

  const allBookings = bookings;
  const futureBookings = bookings.filter(b => 
    b.status === "scheduled" || b.status === "in-progress"
  );
  const completedBookings = bookings.filter(b => b.status === "completed");

  const filteredBookings = (bookingsList: Booking[]) => {
    if (!searchQuery) return bookingsList;
    
    const query = searchQuery.toLowerCase();
    return bookingsList.filter(booking => {
      // Search in basic fields
      if (booking.equipmentName.toLowerCase().includes(query) ||
          booking.studentName.toLowerCase().includes(query) ||
          booking.studentEmail.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in project names from projectSamples
      if (booking.projectSamples?.some(ps => 
        ps.projectName?.toLowerCase().includes(query)
      )) {
        return true;
      }
      
      // Fallback to legacy single project name
      if (booking.projectName?.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Booking History</h1>
          <p className="text-muted-foreground">
            View and track all equipment bookings and usage
          </p>
        </div>

        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by equipment, student name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Bookings ({allBookings.length})
            </TabsTrigger>
            <TabsTrigger value="future">
              Future ({futureBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBookings(allBookings).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings(allBookings).map(booking => (
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchBookings} onEdit={handleEditClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No bookings found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBookings(completedBookings).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings(completedBookings).map(booking => (
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchBookings} onEdit={handleEditClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No completed bookings found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="future" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBookings(futureBookings).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings(futureBookings).map(booking => (
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchBookings} onEdit={handleEditClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No future bookings found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedBooking(null);
            setProjectSamples([]);
            setSelectedCollaborators([]);
            setCollaboratorSearch("");
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit {selectedBooking?.source === 'usage_record' ? 'Usage Record' : 'Booking'}
                {selectedBooking && ` - ${selectedBooking.equipmentName}`}
              </DialogTitle>
              <DialogDescription>
                Update details for {selectedBooking && format(selectedBooking.startTime, "PPP 'at' p")}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Date *</Label>
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
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Projects & Samples *</Label>
                <ProjectSampleSelector
                  projects={projects}
                  value={projectSamples}
                  onChange={setProjectSamples}
                />
              </div>

              <div className="space-y-2">
                <Label>{selectedBooking?.source === 'usage_record' ? 'Notes' : 'Purpose'}</Label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={`What is this ${selectedBooking?.source === 'usage_record' ? 'usage record' : 'booking'} for?`}
                  rows={3}
                />
              </div>

              {isHiPerGator && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold">HiPerGator Resources</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>CPU Count</Label>
                      <span className="text-sm font-medium">{cpuCount}</span>
                    </div>
                    <Slider
                      value={[cpuCount]}
                      onValueChange={([value]) => setCpuCount(value)}
                      min={1}
                      max={currentEquipment?.max_cpu_count || 128}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>GPU Count</Label>
                      <span className="text-sm font-medium">{gpuCount}</span>
                    </div>
                    <Slider
                      value={[gpuCount]}
                      onValueChange={([value]) => setGpuCount(value)}
                      min={0}
                      max={currentEquipment?.max_gpu_count || 8}
                      step={1}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Collaborators</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {selectedCollaborators.length > 0
                        ? `${selectedCollaborators.length} selected`
                        : "Select collaborators"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search users..."
                        value={collaboratorSearch}
                        onValueChange={setCollaboratorSearch}
                      />
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {availableUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => {
                              setSelectedCollaborators(prev =>
                                prev.includes(user.id)
                                  ? prev.filter(id => id !== user.id)
                                  : [...prev, user.id]
                              );
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedCollaborators.includes(user.id)}
                                readOnly
                                className="rounded"
                              />
                              <span>{user.full_name || user.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedCollaborators.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCollaborators.map(userId => {
                      const user = availableUsers.find(u => u.id === userId);
                      return (
                        <Badge key={userId} variant="secondary">
                          {user?.full_name || user?.email}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => setSelectedCollaborators(prev => prev.filter(id => id !== userId))}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default History;
