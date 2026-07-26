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
import { settleWrite } from "@/lib/dbWrite";
import { describeGroupDrift } from "@/lib/bookingGroups";

/**
 * Hard ceilings enforced by the bookings CHECK constraints:
 *   cpu_count_valid: cpu_count IS NULL OR (cpu_count BETWEEN 1 AND 32)
 *   gpu_count_valid: gpu_count IS NULL OR (gpu_count BETWEEN 0 AND 2)
 * The sliders previously defaulted to 128 / 8, letting users pick values Postgres then
 * rejected with a raw constraint-violation message.
 */
const DB_MAX_CPU = 32;
const DB_MAX_GPU = 2;

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
        // Derive from time rather than trusting the stored value. Bookings are only ever
        // written as 'scheduled' or 'cancelled', so the Completed tab was labelling every
        // finished session "Scheduled".
        status: (booking.status === 'cancelled'
          ? 'cancelled'
          : new Date(booking.end_time) < new Date()
            ? 'completed'
            : new Date(booking.start_time) <= new Date()
              ? 'in-progress'
              : 'scheduled') as "scheduled" | "in-progress" | "completed" | "cancelled",
        // ?? not ||: cpu_count/gpu_count of 0 is a real value, and `0 || undefined`
        // collapsed it to undefined, which made the edit form silently skip the field.
        cpuCount: booking.cpu_count ?? undefined,
        gpuCount: booking.gpu_count ?? undefined,
        samplesProcessed: booking.samples_processed || undefined,
        collaborators: booking.collaborators || undefined,
        userId: booking.user_id,
        source: 'booking' as const,
        projectSamples: enrichedProjectSamples,
        bookingGroupId: booking.booking_group_id || undefined
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
        // notes IS the usage_record equivalent of purpose (Schedule.tsx maps it the same
        // way). Hard-coding undefined here left the Edit textarea empty, and because the
        // save path writes `notes = purpose || null`, editing anything at all - even just
        // the sample count - silently wiped the note the student had written.
        purpose: usage.notes || undefined,
        // Derive from the clock rather than assuming a usage record is always in the past.
        // Nothing enforces that: QuickAdd's guard can be bypassed by editing, and Schedule and
        // Index both compute this from the times - History alone hard-coded 'completed', so a
        // record covering right now was mislabelled and landed in the wrong History tab.
        status: (new Date(usage.end_time) < new Date()
          ? 'completed'
          : new Date(usage.start_time) <= new Date()
            ? 'in-progress'
            : 'scheduled') as "scheduled" | "in-progress" | "completed" | "cancelled",
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
        // Keep the denormalised project_id in step with project_samples, exactly as
        // Schedule's edit path does. Omitting it left the column pointing at the OLD
        // project after a reassignment, so Analytics (which keys on project_id) and the
        // sample breakdown (which reads project_samples) attributed the same session to
        // two different projects.
        project_id: project_samples.length > 0 ? project_samples[0].project_id : null,
        project_samples: project_samples,
        // Keep the denormalised total in step with project_samples. Writing only the
        // latter left samples_processed stale, so BookingCard's "Samples" line and every
        // legacy-format Analytics fallback kept reporting the pre-edit number.
        samples_processed: project_samples.reduce((sum, ps) => sum + ps.samples, 0),
        collaborators: selectedCollaborators,
      };

      // Add source-specific fields
      if (selectedBooking.source === 'booking') {
        updateData.purpose = purpose || null;
        // Key off the equipment type, not off whether the stored value was truthy.
        // The old check skipped the write whenever the booking already had 0 GPUs,
        // which is the default - so raising GPUs from 0 never saved.
        if (isHiPerGator) {
          updateData.cpu_count = cpuCount;
          updateData.gpu_count = gpuCount;
        }
      } else {
        updateData.notes = purpose || null;
      }

      // Same rule as Schedule.tsx: a multi-equipment session is N rows sharing a
      // booking_group_id and they describe ONE booking. Editing a single row let them drift,
      // and Analytics credits a group's samples to whichever row sorts first by
      // (start_time, id) - so a sibling edit could vanish from Analytics or move the credit
      // onto a stale row. History edits the very same `bookings` table, so it needs the same
      // handling; fixing only Schedule would have left an identical hole here.
      //
      // updateData deliberately carries no equipment_id, so there is nothing to strip: each
      // row keeps its own machine.
      const groupId = selectedBooking.source === 'booking' ? selectedBooking.bookingGroupId : undefined;

      // cpu_count / gpu_count describe ONE machine's HiPerGator allocation, so they must not be
      // written group-wide - doing so stamps a CPU count onto bench instruments in the same
      // session. (equipment_id is already absent from updateData, so there is nothing to strip
      // there.) They are applied to the clicked row alone, after the shared update.
      let perRowResources: { cpu_count: number; gpu_count: number } | null = null;
      if (groupId && updateData.cpu_count !== undefined) {
        perRowResources = { cpu_count: updateData.cpu_count, gpu_count: updateData.gpu_count };
        delete updateData.cpu_count;
        delete updateData.gpu_count;
      }


      // Applying an edit to the whole group is invisible and correct when the rows already
      // agree. When they have DRIFTED it is destructive - unifying them overwrites a sibling's
      // divergent times and sample count - and two groups on the live database have already
      // drifted this way. So say what will be overwritten and let the user decide.
      if (groupId) {
        const drift = describeGroupDrift(selectedBooking, bookings);
        if (drift) {
          const ok = window.confirm(
            `This session covers ${drift.machines.length + 1} machines and their ` +
            `${drift.differingFields.join(' and ')} currently differ.\n\n` +
            `Saving applies the values in this form to all of them, overwriting what is ` +
            `recorded for ${drift.machines.join(', ')}.\n\n` +
            `Press OK to update the whole session, or Cancel to leave it alone.`
          );
          if (!ok) {
            return;
          }
        }
      }

      const query = supabase.from(tableName).update(updateData);

      const result = await settleWrite(
        (groupId
          ? query.eq('booking_group_id', groupId)
          : query.eq('id', selectedBooking.id)
        ).select('id'),
        selectedBooking.source === 'usage_record'
          ? "You can only edit your own usage records."
          : "You don't have permission to edit this booking."
      );

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      if (groupId && perRowResources) {
        const resourceResult = await settleWrite(
          supabase
            .from('bookings')
            .update(perRowResources)
            .eq('id', selectedBooking.id)
            .select('id'),
          "The session was updated, but the CPU/GPU allocation could not be saved."
        );
        if (!resourceResult.ok) {
          toast.error(resourceResult.message);
          return;
        }
      }

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
    setCpuCount(booking.cpuCount ?? 1);
    setGpuCount(booking.gpuCount ?? 0);
    setSelectedCollaborators(booking.collaborators || []);
    setCollaboratorSearch("");
    
    setIsEditDialogOpen(true);
  };

  // 30-minute granularity: an existing 09:30 booking used to match no option, so the
  // Start Time select rendered its placeholder and the user could not see the real value.
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  const BASE_DURATION_OPTIONS = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
    { value: "240", label: "4 hours" },
    { value: "480", label: "8 hours" },
    { value: "1440", label: "24 hours" },
  ];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} hour${h === 1 ? '' : 's'}` : `${h}h ${m}m`;
  };

  // Quick Add can produce any duration, so a record's real length often matched none of
  // the fixed options and the Duration select rendered blank. Splice the current value in
  // so the user can always see what the booking actually is.
  const durationOptions = (() => {
    if (duration && !BASE_DURATION_OPTIONS.some(o => o.value === duration)) {
      const minutes = parseInt(duration, 10);
      if (!Number.isNaN(minutes)) {
        return [...BASE_DURATION_OPTIONS, { value: duration, label: `${formatDuration(minutes)} (current)` }]
          .sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
      }
    }
    return BASE_DURATION_OPTIONS;
  })();

  const currentEquipment = selectedBooking ? equipment.find(e => e.id === selectedBooking.equipmentId) : null;
  const isHiPerGator = currentEquipment?.type === "HiPerGator";

  const allBookings = bookings;
  // "Future" means it has not finished yet. The old version only looked at status, so a
  // three-week-old booking that was never marked completed sat in this tab forever.
  // Upcoming = not cancelled and not finished yet.
  const futureBookings = bookings.filter(b =>
    b.status !== "cancelled" && b.endTime.getTime() >= Date.now()
  );
  // Anything already finished belongs in Completed, whether or not its stored status was
  // ever updated. Keying only off status === 'completed' meant a three-week-old booking
  // still marked 'scheduled' appeared in NO tab except All.
  const completedBookings = bookings.filter(b =>
    b.status !== "cancelled" && b.endTime.getTime() < Date.now()
  );

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
                      max={Math.min(currentEquipment?.max_cpu_count ?? DB_MAX_CPU, DB_MAX_CPU)}
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
                      max={Math.min(currentEquipment?.max_gpu_count ?? DB_MAX_GPU, DB_MAX_GPU)}
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
