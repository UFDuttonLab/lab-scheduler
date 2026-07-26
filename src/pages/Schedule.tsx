import { useState, useEffect, useRef, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useDeviceMotion } from "@/hooks/useDeviceMotion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Equipment, Project, Booking, ProjectSample } from "@/lib/types";
import { format, isSameDay, parse, addMinutes, addDays } from "date-fns";
import { Plus, Clock, Loader2, List, Grid3x3, Cpu, Server, Users, X, CalendarIcon } from "lucide-react";
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
import { ProjectSampleSelector } from "@/components/ProjectSampleSelector";
import { settleWrite } from "@/lib/dbWrite";
import { describeGroupDrift } from "@/lib/bookingGroups";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  spirit_animal?: string;
}

/**
 * Fallbacks used only when an equipment row has NULL max_cpu_count / max_gpu_count.
 * These MUST NOT exceed the bookings CHECK constraints:
 *   cpu_count_valid: cpu_count IS NULL OR (cpu_count BETWEEN 1 AND 32)
 *   gpu_count_valid: gpu_count IS NULL OR (gpu_count BETWEEN 0 AND 2)
 * Previously this file used 4 in some places and 2 in others, so the sliders let users
 * pick 3-4 GPUs and the insert then died on a raw Postgres constraint error.
 */
const DEFAULT_MAX_CPU = 32;
const DEFAULT_MAX_GPU = 2;

/** Hard ceilings enforced by the database. Never offer more than these. */
const DB_MAX_CPU = 32;
const DB_MAX_GPU = 2;

/**
 * Total capacity of the shared resource. This is whatever the equipment row declares -
 * it must NOT be clamped to the per-booking CHECK ceiling, or a HiPerGator with 8 GPUs
 * would only ever offer 2 to the whole lab.
 */
const poolCpuMax = (value?: number | null) => value ?? DEFAULT_MAX_CPU;
const poolGpuMax = (value?: number | null) => value ?? DEFAULT_MAX_GPU;

/** Ceiling for a SINGLE booking, which is what the CHECK constraints actually bound. */
const clampCpuMax = (value?: number | null) => Math.min(value ?? DEFAULT_MAX_CPU, DB_MAX_CPU);
const clampGpuMax = (value?: number | null) => Math.min(value ?? DEFAULT_MAX_GPU, DB_MAX_GPU);

const BASE_DURATION_OPTIONS = [
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

const isBookable = (e: Equipment) => e.status === "available" || e.status === "in-use";

const unbookableReason = (e: Equipment) =>
  e.status === "maintenance" ? "Under maintenance" : null;

const formatMinutes = (total: number) => {
  if (total < 60) return `${total} minutes`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hLabel = `${h} hour${h === 1 ? '' : 's'}`;
  return m === 0 ? hLabel : `${hLabel} ${m} min`;
};

const Schedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Shake detection for AR game unlock
  const [shakeProgress, setShakeProgress] = useState(0);
  const totalShakeTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const isARUnlocked = sessionStorage.getItem('arMicrobeUnlocked') === 'true';
  const [isShakeDetectionActive, setIsShakeDetectionActive] = useState(!isARUnlocked);
  const { isShaking, requestPermission: requestMotionPermission } = useDeviceMotion(15);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [projectSamples, setProjectSamples] = useState<ProjectSample[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");
  const [purpose, setPurpose] = useState<string>("");
  const [cpuCount, setCpuCount] = useState<number>(1);
  const [gpuCount, setGpuCount] = useState<number>(0);
  const [collaboratorSearch, setCollaboratorSearch] = useState<string>("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  // fetchUsers() is async, so availableUsers is [] on the first renders. Without this flag the
  // collaborator chips would label every real collaborator a former lab member for a moment
  // (and permanently, if the profiles fetch failed) - a false claim about a colleague.
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchEquipment();
    fetchBookings();
    fetchUsers();
    
    // Request motion permission on mount for shake detection
    requestMotionPermission();
  }, []);

  // Shake detection logic
  useEffect(() => {
    if (!isShakeDetectionActive || isARUnlocked) return;

    if (isShaking) {
      // Open dialog immediately when shaking starts
      if (!showUnlockDialog) {
        setShowUnlockDialog(true);
      }
      
      const now = Date.now();
      
      if (lastFrameTimeRef.current === null) {
        // First shake - just initialize
        console.log('Starting shake timer');
        lastFrameTimeRef.current = now;
      } else {
        // Accumulate the time delta
        const frameDelta = now - lastFrameTimeRef.current;
        totalShakeTimeRef.current += frameDelta;
        lastFrameTimeRef.current = now;
        
        const progress = Math.min((totalShakeTimeRef.current / 5000) * 100, 100);
        console.log('Shake detected! Progress:', Math.round(progress), '% | Total time:', totalShakeTimeRef.current, 'ms');
        setShakeProgress(progress);
        
        if (progress >= 100) {
          sessionStorage.setItem('arMicrobeUnlocked', 'true');
          setIsShakeDetectionActive(false);
        }
      }
    }
  }, [isShaking, navigate, isShakeDetectionActive, isARUnlocked]);

  // Pre-select equipment if passed via URL, but don't auto-open dialog
  useEffect(() => {
    const equipmentId = searchParams.get('equipment');
    if (equipmentId && equipment.some(e => e.id === equipmentId && isBookable(e))) {
      setSelectedEquipment([equipmentId]);
      // Don't auto-open dialog - let user select date first
    }
  }, [searchParams, equipment]);

  // Reset the HiPerGator resource counts when the selection STARTS including a HiPerGator -
  // not on every selection change.
  //
  // This effect keyed on the identity of `selectedEquipment`, a new array every time a
  // checkbox is ticked, and it also re-ran whenever fetchEquipment() produced a fresh
  // `equipment` array. So "pick the Thermocycler, set Duration to 4 hours, then also tick the
  // Qubit" silently snapped Duration back to 1 hour, and CPU/GPU counts back to 1/0 on
  // HiPerGator. The user's explicit choice was discarded by an unrelated interaction and the
  // booking under-reserved the machine with no warning.
  //
  // Duration is no longer touched at all: it is the user's to set, and nothing about adding a
  // second machine makes their chosen length wrong.
  const hadHiPerGatorRef = useRef(false);
  useEffect(() => {
    if (isEditDialogOpen) return;

    const nowHasHiPerGator = selectedEquipment.some(eqId => {
      const eq = equipment.find(e => e.id === eqId);
      return eq?.type === "HiPerGator";
    });

    if (nowHasHiPerGator !== hadHiPerGatorRef.current) {
      hadHiPerGatorRef.current = nowHasHiPerGator;
      if (nowHasHiPerGator) {
        setCpuCount(1);
        setGpuCount(0);
      }
    }
  }, [selectedEquipment, equipment, isEditDialogOpen]);

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
      .eq('active', true)
      .order('full_name');
    
    if (error) {
      console.error("Failed to load users:", error);
      return;
    }
    
    setAvailableUsers(data || []);
    setUsersLoaded(true);
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
      type: eq.type as "robot" | "equipment" | "quantification" | "PCR" | "HiPerGator" | "Sequencer",
      status: eq.status as "available" | "in-use" | "maintenance",
      location: eq.location,
      description: eq.description || undefined,
      icon: eq.icon || undefined,
      // ?? not ||: the DB trigger reads these columns verbatim via COALESCE(col, default),
      // so a legitimate 0 ceiling must survive. `0 || undefined` made the client substitute
      // 32/2 and offer resources the trigger then refused. Equipment.tsx was already fixed;
      // this copy was missed.
      maxCpuCount: eq.max_cpu_count ?? undefined,
      maxGpuCount: eq.max_gpu_count ?? undefined,
    }));
    
    setEquipment(transformedEquipment);
  };

  // Monotonic request id. fetchBookings() is fired without await from several places
  // (mount, after create, after edit, after delete), so two calls can be in flight at once and
  // the SLOWER, EARLIER one used to land last and overwrite fresher data. That state is what the
  // client-side conflict check and the HiPerGator availability badge read, so staleness there is
  // not merely cosmetic. Only the newest request is allowed to publish its result.
  const bookingsRequestRef = useRef(0);

  const fetchBookings = async () => {
    const requestId = ++bookingsRequestRef.current;
    try {
      // Fetch all data separately to avoid nested join issues
      const [bookingsRes, usageRecordsRes, equipmentRes, projectsRes, profilesRes] = await Promise.all([
        supabase.from('bookings').select('*').order('start_time'),
        supabase.from('usage_records').select('*').order('start_time'),
        supabase.from('equipment').select('id, name'),
        supabase.from('projects').select('id, name, color'),
        supabase.from('profiles').select('id, email, full_name, spirit_animal')
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (usageRecordsRes.error) throw usageRecordsRes.error;

      // Create lookup maps
      const equipmentMap = new Map(equipmentRes.data?.map(e => [e.id, e]) || []);
      const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);

      // Enrich booking data
      const transformedBookings: Booking[] = (bookingsRes.data || []).map((booking: any) => {
        const equipment = equipmentMap.get(booking.equipment_id);
        const project = booking.project_id ? projectMap.get(booking.project_id) : null;
        const profile = profileMap.get(booking.user_id);

        // Enrich project_samples if available
        const enrichedProjectSamples = booking.project_samples?.map((ps: any) => ({
          projectId: ps.project_id,
          projectName: projectMap.get(ps.project_id)?.name || 'Unknown',
          samples: ps.samples
        }));

        const startTime = new Date(booking.start_time);
        const endTime = new Date(booking.end_time);
        const now = new Date();
        
        // Calculate actual status based on time
        let calculatedStatus: "scheduled" | "in-progress" | "completed" | "cancelled" = booking.status as "scheduled" | "in-progress" | "completed" | "cancelled";
        if (booking.status !== "cancelled") {
          if (endTime < now) {
            calculatedStatus = "completed";
          } else if (startTime <= now && endTime >= now) {
            calculatedStatus = "in-progress";
          } else {
            calculatedStatus = "scheduled";
          }
        }

        return {
          id: booking.id,
          equipmentId: booking.equipment_id,
          equipmentName: equipment?.name || 'Unknown',
          studentName: profile?.full_name || 'Unknown',
          studentEmail: profile?.email || 'Unknown',
          studentSpiritAnimal: profile?.spirit_animal || undefined,
          startTime: startTime,
          endTime: endTime,
          duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
          projectId: booking.project_id || undefined,
          projectName: project?.name || undefined,
          purpose: booking.purpose || undefined,
          status: calculatedStatus,
          cpuCount: booking.cpu_count || undefined,
          gpuCount: booking.gpu_count || undefined,
          samplesProcessed: booking.samples_processed || undefined,
          collaborators: (booking.collaborators as string[]) || [],
          userId: booking.user_id,
          source: 'booking',
          projectSamples: enrichedProjectSamples,
          bookingGroupId: booking.booking_group_id || undefined
        };
      });

      // Transform usage records to booking format
      const transformedUsageRecords: Booking[] = (usageRecordsRes.data || []).map((record: any) => {
        const equipment = equipmentMap.get(record.equipment_id);
        const project = record.project_id ? projectMap.get(record.project_id) : null;
        const profile = profileMap.get(record.user_id);

        // Enrich project_samples if available
        const enrichedProjectSamples = record.project_samples?.map((ps: any) => ({
          projectId: ps.project_id,
          projectName: projectMap.get(ps.project_id)?.name || 'Unknown',
          samples: ps.samples
        }));

        const startTime = new Date(record.start_time);
        const endTime = new Date(record.end_time);
        const now = new Date();
        
        // Calculate actual status based on time
        let calculatedStatus: "scheduled" | "in-progress" | "completed" | "cancelled";
        if (endTime < now) {
          calculatedStatus = "completed";
        } else if (startTime <= now && endTime >= now) {
          calculatedStatus = "in-progress";
        } else {
          calculatedStatus = "scheduled";
        }

        return {
          id: record.id,
          equipmentId: record.equipment_id,
          equipmentName: equipment?.name || 'Unknown',
          studentName: profile?.full_name || 'Unknown',
          studentEmail: profile?.email || 'Unknown',
          studentSpiritAnimal: profile?.spirit_animal || undefined,
          startTime: startTime,
          endTime: endTime,
          duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
          projectId: record.project_id || undefined,
          projectName: project?.name || undefined,
          purpose: record.notes || undefined,
          status: calculatedStatus,
          samplesProcessed: record.samples_processed || undefined,
          collaborators: (record.collaborators as string[]) || [],
          userId: record.user_id,
          source: 'usage_record',
          projectSamples: enrichedProjectSamples
        };
      });

      // Combine and sort by start time
      const allBookings = [...transformedBookings, ...transformedUsageRecords]
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      if (requestId !== bookingsRequestRef.current) return; // a newer fetch already won
      setBookings(allBookings);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      if (requestId === bookingsRequestRef.current) toast.error("Failed to load bookings");
    }
  };

  /**
   * Clears every field shared by the Book and Edit dialogs.
   *
   * The two dialogs render from ONE set of state variables, and closing a dialog with
   * Escape / the X / an overlay click never ran the reset that lives at the end of the submit
   * handlers. So abandoning an edit and then pressing "New Booking" opened the create form
   * pre-loaded with that booking's equipment, start time, duration, purpose and CPU/GPU
   * counts - a student could book the wrong machine, with someone else's purpose text, in two
   * clicks. `duration` leaked even through the successful-submit resets, which reset
   * everything except it.
   */
  const resetBookingForm = () => {
    setSelectedBooking(null);
    setBookingDate(new Date());
    setProjectSamples([]);
    // Keep the machine the user arrived with from Equipment -> "Book this equipment"
    // (?equipment=<id>). That effect only runs on mount, so clearing the selection here
    // unconditionally would silently drop the pre-selection the link exists to provide.
    const preselected = searchParams.get('equipment');
    // Only honour the link if that machine can actually be booked - otherwise the checkbox
    // for it renders disabled, so the user could neither keep it nor untick it.
    const preselectable =
      preselected && equipment.some(e => e.id === preselected && isBookable(e));
    setSelectedEquipment(preselectable ? [preselected!] : []);
    setSelectedTime("");
    setDuration("60");
    setPurpose("");
    setCpuCount(1);
    setGpuCount(0);
    setSelectedCollaborators([]);
    setCollaboratorSearch("");
  };

  /**
   * Which machines can actually be reserved.
   *
   * 'in-use' is now BOOKABLE. It means "somebody is on it right now", which says nothing at
   * all about next Tuesday, yet it used to veto every future booking: a PI flipping the Qubit
   * to "In Use" because a student was mid-run made it unreservable for everyone, forever,
   * until somebody thought to flip it back. Nothing in the database enforces that veto and
   * nothing in the app ever sets the status automatically, so it was purely an accident of
   * this filter. Real overlap is still prevented by the conflict trigger.
   *
   * 'maintenance' genuinely means the machine is down, so it stays unbookable - but the row is
   * still RENDERED, greyed out with the reason. Filtering it out silently was its own bug: the
   * machine simply vanished from the list, indistinguishable from having been deleted, with no
   * hint anywhere as to why.
   */
  const bookableEquipment = equipment.filter(isBookable);

  const dayBookings = selectedDate
    ? bookings.filter(b => {
        // Half-open day window: [00:00 today, 00:00 tomorrow).
        //
        // This used to be an INCLUSIVE test against 23:59:59.999, which counted a booking
        // that ends exactly at midnight as belonging to the NEXT day too. That is reachable
        // straight from the booking form (16:00 + "8 hours", or 20:00 + "4 hours"), and it
        // produced a phantom entry: the header said "1 booking today" on a day with none,
        // and the timeline drew a zero-height, invisible card that still consumed a track.
        // A booking touching midnight belongs to the day it runs in, not the one it ends on -
        // the same half-open convention the database conflict trigger uses via tstzrange.
        const selectedDayStart = new Date(selectedDate);
        selectedDayStart.setHours(0, 0, 0, 0);
        const nextDayStart = addDays(selectedDayStart, 1);

        return b.startTime < nextDayStart && b.endTime > selectedDayStart;
      })
    : [];

  /**
   * dayBookings minus cancelled rows.
   *
   * Timeline View is what students read to find a free slot, and it drew cancelled bookings
   * exactly like live ones - so a released slot still looked taken, defeating the entire point
   * of Cancel ("the time slot is now free"). The day-count header was inflated the same way.
   *
   * The List View deliberately keeps showing cancelled rows: that is where the Restore button
   * lives, and only a PI can delete, so hiding them would strand a mis-clicked cancellation.
   */
  const activeDayBookings = dayBookings.filter(b => b.status !== 'cancelled');

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

    if (selectedEquipment.length === 0) {
      toast.error("Please select at least one equipment");
      return;
    }

    if (projectSamples.length === 0) {
      toast.error("Please add at least one project with samples");
      return;
    }

    const totalSamples = projectSamples.reduce((sum, ps) => sum + ps.samples, 0);
    if (totalSamples < 1 || totalSamples > 300) {
      toast.error("Total samples must be between 1 and 300");
      return;
    }

    // Calculate start and end times
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(bookingDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = addMinutes(startTime, parseInt(duration));
    
    // Allow past start times if the booking extends into the future
    if (endTime < new Date()) {
      toast.error("Cannot create a booking that ends in the past. Use Quick Add for past usage.");
      return;
    }

    // Validate duration (max 7 days)
    const durationMinutes = parseInt(duration);
    if (durationMinutes > 10080) { // 7 days in minutes
      toast.error("Maximum booking duration is 7 days");
      return;
    }

    // Belt and braces: the checkbox for a machine under maintenance is disabled, but
    // selectedEquipment can also come from a ?equipment= link or from a machine that was put
    // into maintenance while this dialog sat open. Name the machine rather than failing vaguely.
    const blocked = selectedEquipment
      .map(id => equipment.find(e => e.id === id))
      .filter((e): e is Equipment => !!e && !isBookable(e));
    if (blocked.length > 0) {
      toast.error(
        `${blocked.map(e => e.name).join(', ')} ${blocked.length > 1 ? 'are' : 'is'} under maintenance and cannot be booked.`
      );
      return;
    }

    setLoading(true);

    try {
      // Parse the time and combine with booking dialog's selected date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(bookingDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(startTime, parseInt(duration));

      // Generate a booking group ID for linking multiple bookings
      const bookingGroupId = crypto.randomUUID();

      // Build project_samples array for database
      const project_samples = projectSamples.map(ps => ({
        project_id: ps.projectId,
        samples: ps.samples
      }));

      // For backward compatibility
      const total_samples = projectSamples.reduce((sum, ps) => sum + ps.samples, 0);
      const primary_project_id = projectSamples.length > 0 ? projectSamples[0].projectId : null;

      // Validate and prepare bookings for each equipment
      const bookingRecords = [];
      
      for (const equipmentId of selectedEquipment) {
        const selectedEq = equipment.find(e => e.id === equipmentId);
        const isHiPerGator = selectedEq?.type === "HiPerGator";

        // Check for overlapping bookings for ALL equipment types
        // Only real bookings reserve a machine. usage_records are retroactive logs of work
        // that already happened; overlapping entries there are normal and the database has
        // no constraint against them, so counting them here rejected legitimate bookings.
        const overlappingBookings = bookings.filter(b =>
          b.source !== 'usage_record' &&
          b.equipmentId === equipmentId &&
          b.status !== 'cancelled' &&
          (
            (b.startTime <= startTime && b.endTime > startTime) ||
            (b.startTime < endTime && b.endTime >= endTime) ||
            (b.startTime >= startTime && b.endTime <= endTime)
          )
        );

        // For regular equipment (not HiPerGator), reject if ANY overlap exists
        if (!isHiPerGator && overlappingBookings.length > 0) {
          toast.error(`${selectedEq?.name} is already booked during this time period`);
          setLoading(false);
          return;
        }

        // For HiPerGator, check resource availability
        if (isHiPerGator) {
          const totalCpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.cpuCount || 0), 0);
          const totalGpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.gpuCount || 0), 0);

          const maxCpus = poolCpuMax(selectedEq.maxCpuCount);
          const maxGpus = poolGpuMax(selectedEq.maxGpuCount);

          if (totalCpuUsed + cpuCount > maxCpus) {
            toast.error(`${selectedEq.name}: Not enough CPUs available. Currently ${maxCpus - totalCpuUsed} CPUs free during this time.`);
            setLoading(false);
            return;
          }

          if (totalGpuUsed + gpuCount > maxGpus) {
            toast.error(`${selectedEq.name}: Not enough GPUs available. Currently ${maxGpus - totalGpuUsed} GPUs free during this time.`);
            setLoading(false);
            return;
          }
        }

        // Prepare booking data
        const bookingData: any = {
          equipment_id: equipmentId,
          user_id: user.id,
          project_id: primary_project_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          purpose: purpose || null,
          status: 'scheduled',
          samples_processed: total_samples,
          project_samples: project_samples,
          collaborators: selectedCollaborators,
          booking_group_id: selectedEquipment.length > 1 ? bookingGroupId : null
        };

        // Add resource counts for HiPerGator
        if (isHiPerGator) {
          bookingData.cpu_count = cpuCount;
          bookingData.gpu_count = gpuCount;
        }

        bookingRecords.push(bookingData);
      }

      // Insert all bookings
      const { error } = await supabase
        .from('bookings')
        .insert(bookingRecords);

      if (error) throw error;

      const hasHiPerGator = selectedEquipment.some(eqId => {
        const eq = equipment.find(e => e.id === eqId);
        return eq?.type === "HiPerGator";
      });

      toast.success(
        selectedEquipment.length > 1 
          ? `${selectedEquipment.length} equipment pieces booked successfully!` 
          : hasHiPerGator 
            ? `HiPerGator booked: ${cpuCount} CPUs, ${gpuCount} GPUs` 
            : "Equipment booked successfully!"
      );
      
      setIsBookingDialogOpen(false);
      resetBookingForm();

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

    if (selectedEquipment.length === 0) {
      toast.error("Please select equipment");
      return;
    }

    if (projectSamples.length === 0) {
      toast.error("Please add at least one project with samples");
      return;
    }

    const totalSamples = projectSamples.reduce((sum, ps) => sum + ps.samples, 0);
    if (totalSamples < 1 || totalSamples > 300) {
      toast.error("Total samples must be between 1 and 300");
      return;
    }

    // For editing, we only support single equipment
    const equipmentId = selectedEquipment[0];
    const selectedEq = equipment.find(e => e.id === equipmentId);
    const isHiPerGator = selectedEq?.type === "HiPerGator";

    setLoading(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(bookingDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(startTime, parseInt(duration));

      // usage_records are retroactive logs of work that already happened; overlapping
      // entries on a shared instrument are legitimate and the DB has no constraint against
      // them. Only real bookings are checked for conflicts.
      const editingUsageRecord = selectedBooking.source === 'usage_record';

      // A usage record logs work that ALREADY happened, so it must not be pushed into the
      // future: the conflict trigger only guards `bookings`, so a future-dated usage record
      // appears on the schedule as a reservation that reserves nothing. QuickAdd enforces this
      // on create; the edit path did not.
      //
      // There is deliberately NO matching "must not end in the past" guard for bookings here,
      // even though the CREATE path has one. Creating a booking in the past is meaningless, but
      // EDITING one in the past is the normal case: every one of this lab's 160 bookings has
      // already finished, and correcting a sample count or a project on last week's session is
      // exactly what the Edit dialog is for. An earlier version of this guard rejected any
      // booking ending before now, which made all 160 of them unsavable.
      if (editingUsageRecord && endTime.getTime() > Date.now()) {
        toast.error("A usage record logs work that already happened, so it cannot end in the future. Use Schedule to book upcoming time.");
        setLoading(false);
        return;
      }

      // Check for overlapping bookings (excluding current booking)
      const overlappingBookings = editingUsageRecord ? [] : bookings.filter(b =>
        b.source !== 'usage_record' &&
        b.id !== selectedBooking.id &&
        b.equipmentId === equipmentId &&
        b.status !== 'cancelled' &&
        (
          (b.startTime <= startTime && b.endTime > startTime) ||
          (b.startTime < endTime && b.endTime >= endTime) ||
          (b.startTime >= startTime && b.endTime <= endTime)
        )
      );

      // For regular equipment (not HiPerGator), reject if ANY overlap exists
      if (!isHiPerGator && overlappingBookings.length > 0) {
        toast.error(`${selectedEq?.name} is already booked during this time period`);
        setLoading(false);
        return;
      }

      // For HiPerGator, check resource availability
      if (isHiPerGator) {
        const totalCpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.cpuCount || 0), 0);
        const totalGpuUsed = overlappingBookings.reduce((sum, b) => sum + (b.gpuCount || 0), 0);

        const maxCpus = selectedEq.maxCpuCount ?? DEFAULT_MAX_CPU;
        const maxGpus = selectedEq.maxGpuCount ?? DEFAULT_MAX_GPU;

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

      // Build project_samples array for database
      const project_samples = projectSamples.map(ps => ({
        project_id: ps.projectId,
        samples: ps.samples
      }));

      // For backward compatibility
      const total_samples = projectSamples.reduce((sum, ps) => sum + ps.samples, 0);
      const primary_project_id = projectSamples.length > 0 ? projectSamples[0].projectId : null;

      const bookingData: any = {
        equipment_id: equipmentId,
        project_id: primary_project_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        purpose: purpose || null,
        samples_processed: total_samples,
        project_samples: project_samples,
        collaborators: selectedCollaborators
      };

      if (isHiPerGator) {
        bookingData.cpu_count = cpuCount;
        bookingData.gpu_count = gpuCount;
      }

      // selectedBooking may be a usage_record: fetchBookings() merges both tables into one
      // list. Writing a usage_record id into `bookings` matched zero rows and reported
      // success, so the edit silently vanished. Route to the table the row actually lives in.
      const isUsageRecord = selectedBooking.source === 'usage_record';

      if (isUsageRecord) {
        // usage_records has no purpose/status/cpu_count/gpu_count columns; notes is its
        // equivalent of purpose.
        delete bookingData.purpose;
        delete bookingData.cpu_count;
        delete bookingData.gpu_count;
        bookingData.notes = purpose || null;
      }

      // A multi-equipment session is stored as N rows sharing a booking_group_id, and they
      // describe ONE logical booking. Editing just the clicked row let them drift apart, and
      // Analytics credits a group's samples to whichever row sorts first by (start_time, id) -
      // so editing a sibling's sample count made the change invisible in Analytics, and
      // changing its start time could move "first" onto a different row and make the reported
      // figure jump to a stale value. Move the whole session together.
      //
      // equipment_id is deliberately NOT written for a group: each row is a different machine,
      // and applying one machine's id across the group would collapse the whole session onto it.
      const groupId = !isUsageRecord ? selectedBooking.bookingGroupId : undefined;

      // Fields that belong to ONE machine must never be written group-wide.
      //   equipment_id - obvious: it would collapse the whole session onto one machine.
      //   cpu_count / gpu_count - these describe a HiPerGator allocation. Editing the
      //     HiPerGator row of a mixed session (HiPerGator + a bench instrument) would otherwise
      //     stamp "16 CPUs" onto the Qubit row too: the CHECK constraint accepts it, so it
      //     succeeds silently and BookingCard then renders a CPU/GPU line on a bench booking.
      // They are applied to the clicked row alone, after the shared update.
      let perRowResources: { cpu_count: number; gpu_count: number } | null = null;
      if (groupId) {
        delete bookingData.equipment_id;
        if (bookingData.cpu_count !== undefined) {
          perRowResources = { cpu_count: bookingData.cpu_count, gpu_count: bookingData.gpu_count };
          delete bookingData.cpu_count;
          delete bookingData.gpu_count;
        }
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
            setLoading(false);
            return;
          }
        }
      }


      const query = supabase
        .from(isUsageRecord ? 'usage_records' : 'bookings')
        .update(bookingData);

      const result = await settleWrite(
        (groupId
          ? query.eq('booking_group_id', groupId)
          : query.eq('id', selectedBooking.id)
        ).select('id'),
        isUsageRecord
          ? "You can only edit your own usage records."
          : "You don't have permission to edit this booking."
      );

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      // Machine-specific resources, scoped to the row the user actually opened.
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
          fetchBookings();
          return;
        }
      }

      const machinesUpdated = result.rowCount ?? 0;
      toast.success(
        isUsageRecord
          ? "Usage record updated successfully!"
          : groupId
            ? `Session updated on ${machinesUpdated} machine${machinesUpdated === 1 ? '' : 's'}`
            : "Booking updated successfully!"
      );
      setIsEditDialogOpen(false);
      resetBookingForm();

      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 06:00 to 21:30 in half-hour steps.
   *
   * Duration has always offered "30 minutes", but start times were whole hours only, so two
   * back-to-back half-hour sessions were impossible to book: the 09:30 one had no slot to
   * select. Half-hour starts make the two dropdowns agree. Nothing downstream assumes a whole
   * hour - setHours(h, m) already takes minutes and the timeline reads getMinutes().
   */
  const baseTimeSlots = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => {
        const hour = 6 + Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      }),
    []
  );

  /**
   * The HiPerGator row actually being booked.
   *
   * The resource panel used to read `equipment.find(e => e.type === "HiPerGator")` - the FIRST
   * HiPerGator-type row in the list - while the availability figure was computed from the one
   * the user had selected. With more than one such row those are different machines, so the
   * slider ceiling and the "N CPUs available" badge could describe different hardware, and the
   * slider could physically block a booking both the validator and the DB trigger accept.
   * Falls back to the first one only when nothing is selected, purely for the idle display.
   */
  const selectedHiPerGator =
    equipment.find(e => selectedEquipment.includes(e.id) && e.type === "HiPerGator") ??
    equipment.find(e => e.type === "HiPerGator");

  const hasHiPerGator = selectedEquipment.some(eqId => {
    const eq = equipment.find(e => e.id === eqId);
    return eq?.type === "HiPerGator";
  });

  // The resource panel is meaningless for a usage_record: that table has no cpu_count /
  // gpu_count columns, so handleEditBooking deletes both before writing. Offering editable
  // sliders whose values are then silently dropped is the same offer-then-discard bug this
  // audit has been clearing out everywhere else.
  const isHiPerGator = hasHiPerGator && selectedBooking?.source !== 'usage_record';


  /**
   * A Radix Select renders its placeholder when `value` is not among its items, so any
   * booking whose start or duration is not on the standard grid opened the Edit dialog with
   * BLANK Start Time and Duration fields - the real values were still in state and were
   * saved correctly, but the form looked broken and there was no way to see what the current
   * duration was. QuickAdd offers 15-minute sessions and can log any minute value, so this is
   * routine for usage records. Injecting the live value keeps every existing booking editable
   * and honestly displayed without widening what can be picked for a NEW booking.
   */
  const timeSlots = useMemo(() => {
    if (!selectedTime || baseTimeSlots.includes(selectedTime)) return baseTimeSlots;
    return [...baseTimeSlots, selectedTime].sort();
  }, [baseTimeSlots, selectedTime]);


  const durationOptions = useMemo(() => {
    if (!duration || BASE_DURATION_OPTIONS.some(o => o.value === duration)) return BASE_DURATION_OPTIONS;
    const parsed = parseInt(duration, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return BASE_DURATION_OPTIONS;
    return [...BASE_DURATION_OPTIONS, { value: duration, label: formatMinutes(parsed) }]
      .sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
  }, [duration]);

  // Calculate available HiPerGator resources if applicable
  const getAvailableResources = (excludeBookingId?: string) => {
    if (!isHiPerGator || !bookingDate || !selectedTime) {
      // Same machine the sliders read - see selectedHiPerGator.
      const maxCpus = poolCpuMax(selectedHiPerGator?.maxCpuCount);
      const maxGpus = poolGpuMax(selectedHiPerGator?.maxGpuCount);
      return { availableCpu: maxCpus, availableGpu: maxGpus };
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(bookingDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = addMinutes(startTime, parseInt(duration));

    // Find the HiPerGator equipment ID
    const hiPerGatorId = selectedEquipment.find(eqId => {
      const eq = equipment.find(e => e.id === eqId);
      return eq?.type === "HiPerGator";
    });

    if (!hiPerGatorId) {
      return { availableCpu: DEFAULT_MAX_CPU, availableGpu: DEFAULT_MAX_GPU };
    }

    const overlappingBookings = bookings.filter(b =>
      // Must match handleBooking / handleEditBooking exactly. Those two skip usage_records
      // (retroactive logs never reserve capacity); this display path did not, so the badge
      // and the slider ceiling could report 0 CPUs free while the validator would happily
      // have accepted 32 - the slider physically prevented a booking the rules allowed.
      b.source !== 'usage_record' &&
      b.id !== excludeBookingId &&
      b.equipmentId === hiPerGatorId &&
      b.status !== 'cancelled' &&
      (
        (b.startTime <= startTime && b.endTime > startTime) ||
        (b.startTime < endTime && b.endTime >= endTime) ||
        (b.startTime >= startTime && b.endTime <= endTime)
      )
    );

    const usedCpus = overlappingBookings.reduce((sum, b) => sum + (b.cpuCount || 0), 0);
    const usedGpus = overlappingBookings.reduce((sum, b) => sum + (b.gpuCount || 0), 0);

    const selectedEq = equipment.find(e => e.id === hiPerGatorId);
    const maxCpus = poolCpuMax(selectedEq?.maxCpuCount);
    const maxGpus = poolGpuMax(selectedEq?.maxGpuCount);

    return {
      availableCpu: maxCpus - usedCpus,
      availableGpu: maxGpus - usedGpus
    };
  };

  const { availableCpu, availableGpu } = getAvailableResources(
    isEditDialogOpen ? selectedBooking?.id : undefined
  );

  // Pull the requested counts back down when the window's availability shrinks.
  //
  // availableCpu/availableGpu are derived values, recomputed from bookingDate + selectedTime +
  // duration on every render, while cpuCount/gpuCount are independent state that nothing
  // re-synchronised. So picking 32 CPUs in a quiet window and then moving the booking to a busy
  // one left the label reading "CPUs: 32 of 8" with the slider pinned past its own maximum, and
  // submitting produced a rejection the user had no way to make sense of. Safe from feedback
  // loops: availability does not depend on these counts.
  useEffect(() => {
    if (!isHiPerGator) return;
    setCpuCount(c => Math.min(c, Math.max(1, availableCpu)));
    setGpuCount(g => Math.min(g, Math.max(0, availableGpu)));
  }, [isHiPerGator, availableCpu, availableGpu]);

  // Memoised: this walks every booking day by day, and it used to be called inline from
  // JSX, so it re-ran on every render - including every keystroke in the booking dialogs.
  const daysWithBookings = useMemo(() => {
    const daysSet = new Set<string>();
    bookings.forEach(booking => {
      if (booking.status === 'cancelled') return; // a freed slot shouldn't mark the calendar

      const endDate = new Date(booking.endTime);
      const currentDate = new Date(booking.startTime);
      currentDate.setHours(0, 0, 0, 0);

      // Strictly `<`: a booking that ends at exactly 00:00 does not occupy that day, so it
      // must not put a dot on it. Same half-open rule as dayBookings above - previously
      // `<=` highlighted an extra day on the calendar for every booking ending at midnight.
      let cursor = currentDate;
      while (cursor < endDate) {
        daysSet.add(cursor.toDateString());
        cursor = addDays(cursor, 1);
      }
    });

    return Array.from(daysSet).map(dateStr => new Date(dateStr));
  }, [bookings]);

  const isARGameUnlocked = sessionStorage.getItem('arMicrobeUnlocked') === 'true';

  return (
    <div className="min-h-screen bg-background">
      {/* Shake Progress Indicator */}
      {shakeProgress > 0 && shakeProgress < 100 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary/95 backdrop-blur-sm text-primary-foreground px-6 py-3 rounded-full shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎮</span>
            <div>
              <p className="font-semibold">Keep shaking...</p>
              <div className="w-48 h-2 bg-primary-foreground/20 rounded-full mt-1">
                <div 
                  className="h-full bg-primary-foreground rounded-full transition-all duration-100"
                  style={{ width: `${shakeProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Action Button for AR Game */}
      {isARGameUnlocked && (
        <Button
          onClick={() => navigate('/ar-microbe-shooter')}
          className="fixed bottom-20 right-4 z-40 h-16 w-16 rounded-full shadow-2xl animate-pulse bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 border-2 border-primary-foreground/20"
          size="icon"
        >
          <span className="text-3xl">🦠</span>
        </Button>
      )}
      
      {/* AR Game Unlock Dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={(open) => {
        if (!open && shakeProgress < 100) {
          // Allow closing and reset if not yet unlocked
          setShowUnlockDialog(false);
          setShakeProgress(0);
          totalShakeTimeRef.current = 0;
          lastFrameTimeRef.current = null;
        } else if (!open && shakeProgress >= 100) {
          // Allow closing after unlock
          setShowUnlockDialog(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-center">
              {shakeProgress >= 100 ? '🦠 Secret AR Game Unlocked!' : '🤳 Keep Shaking!'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              {shakeProgress >= 100 
                ? "You've discovered the AR Microbe Shooter game! Use your device's camera and motion sensors to blast microbes in augmented reality."
                : "Shake your device to unlock a secret AR game..."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-4">
            <Progress value={shakeProgress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">
              {shakeProgress >= 100 
                ? '🎉 Unlocked!' 
                : isShaking
                  ? `${Math.round(shakeProgress)}% - Keep shaking!`
                  : `Paused at ${Math.round(shakeProgress)}% - Shake again to continue!`
              }
            </p>
          </div>
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            {shakeProgress >= 100 ? (
              <>
                <AlertDialogCancel onClick={() => setShowUnlockDialog(false)}>
                  Play Later
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  setShowUnlockDialog(false);
                  navigate('/ar-microbe-shooter');
                }}>
                  Play Now
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogCancel onClick={() => setShowUnlockDialog(false)}>
                Cancel
              </AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
              modifiers={{
                hasBookings: daysWithBookings
              }}
              modifiersClassNames={{
                hasBookings: "bg-primary/10 font-semibold text-primary"
              }}
            />
            
            <div className="mt-6">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                  // Always start from a clean form - see resetBookingForm().
                  resetBookingForm();
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
                    {activeDayBookings.length} booking{activeDayBookings.length !== 1 ? 's' : ''} today
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
                        {dayBookings.map((booking) => (
                          <BookingCard 
                            key={booking.id}
                            booking={booking}
                            onDelete={fetchBookings}
                            onEdit={(booking) => {
                              // Reset first, then prefill: the prefill below does not touch
                              // every shared field, so without this the Edit dialog could open
                              // carrying leftovers from a previous booking.
                              resetBookingForm();
                              setSelectedBooking(booking);
                              setIsEditDialogOpen(true);
                              // Pre-fill form - load project samples or fallback
                              if (booking.projectSamples && booking.projectSamples.length > 0) {
                                setProjectSamples(booking.projectSamples);
                              } else if (booking.projectId && booking.samplesProcessed) {
                                setProjectSamples([{
                                  projectId: booking.projectId,
                                  projectName: booking.projectName,
                                  samples: booking.samplesProcessed
                                }]);
                              } else {
                                // No else branch here meant a booking with no project data
                                // inherited whatever was last in the form, and saving it
                                // silently reattributed that booking to another project.
                                setProjectSamples([]);
                              }
                              setSelectedEquipment([booking.equipmentId]);
                              setBookingDate(booking.startTime);
                              setSelectedTime(format(booking.startTime, "HH:mm"));
                              setDuration(booking.duration.toString());
                              setPurpose(booking.purpose || "");
                              setCpuCount(booking.cpuCount || 1);
                              setGpuCount(booking.gpuCount || 0);
                              setSelectedCollaborators(booking.collaborators || []);
                            }}
                          />
                        ))}
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
                      const bookingsWithTracks = activeDayBookings.map(booking => {
                        // For timeline view, we need to handle multiday bookings
                        // Half-open end, matching dayBookings and the DB trigger. isSameDay
                        // compares the closed end instant, so a 16:00-00:00 evening session was
                        // labelled a two-day range ("Jul 27 - Jul 28") and its actual times were
                        // hidden - the one thing the card most needs to show.
                        const endInstantIsMidnight =
                          booking.endTime.getHours() === 0 &&
                          booking.endTime.getMinutes() === 0 &&
                          booking.endTime.getSeconds() === 0;
                        const effectiveEnd = endInstantIsMidnight
                          ? new Date(booking.endTime.getTime() - 1)
                          : booking.endTime;
                        const isMultiday = !isSameDay(booking.startTime, effectiveEnd);
                        const selectedDayStart = new Date(selectedDate!);
                        selectedDayStart.setHours(0, 0, 0, 0);
                        const selectedDayEnd = new Date(selectedDate!);
                        selectedDayEnd.setHours(23, 59, 59, 999);
                        
                        // Calculate display start: either booking start or beginning of selected day
                        const displayStart = booking.startTime > selectedDayStart ? booking.startTime : selectedDayStart;
                        // Calculate display end: either booking end or end of selected day, whichever is earlier
                        const displayEnd = booking.endTime < selectedDayEnd ? booking.endTime : selectedDayEnd;
                        
                        const startMinutes = displayStart.getHours() * 60 + displayStart.getMinutes();
                        const endMinutes = displayEnd.getHours() * 60 + displayEnd.getMinutes();
                        return { ...booking, startMinutes, endMinutes, track: 0, isMultiday };
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
                      
                      // Calculate dynamic hour range based on bookings
                      let startHour = 8;
                      let endHour = 20;
                      
                      if (bookingsWithTracks.length > 0) {
                        const minMinutes = Math.min(...bookingsWithTracks.map(b => b.startMinutes));
                        const maxMinutes = Math.max(...bookingsWithTracks.map(b => b.endMinutes));
                        
                        // Round down to nearest hour and add 1 hour padding
                        startHour = Math.max(0, Math.floor(minMinutes / 60) - 1);
                        // Round up to nearest hour and add 1 hour padding
                        endHour = Math.min(23, Math.ceil(maxMinutes / 60) + 1);
                      }
                      
                      const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

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
                                  {/* Labelled from the hour INDEX, not from any Date.
                                      These are row headings for a fixed 24-row grid, so they
                                      must be 24 distinct labels. Formatting a real timestamp
                                      breaks that on a DST boundary: on the US spring-forward
                                      date setHours(2) normalises to 03:00, so hours 2 and 3 both
                                      render "3:00 AM" (verified under TZ=America/New_York).
                                      Deriving from `hour` is immune and always distinct. */}
                                  {`${((hour + 11) % 12) + 1}:00 ${hour < 12 ? 'AM' : 'PM'}`}
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
                                                      {booking.isMultiday 
                                                        ? `${format(booking.startTime, "MMM d")} - ${format(booking.endTime, "MMM d")}`
                                                        : `${format(booking.startTime, "h:mm a")} - ${format(booking.endTime, "h:mm a")}`
                                                      }
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
                                                   {booking.collaborators && booking.collaborators.length > 0 && (
                                                     <div className="flex items-center gap-1">
                                                       <Users className="w-3 h-3" />
                                                       <span>+{booking.collaborators.length}</span>
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

        <Dialog
          open={isBookingDialogOpen}
          onOpenChange={setIsBookingDialogOpen}
        >
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
                <Label>Projects & Samples *</Label>
                <ProjectSampleSelector
                  projects={projects}
                  value={projectSamples}
                  onChange={setProjectSamples}
                  maxTotal={300}
                />
              </div>

              <div className="space-y-2">
                <Label>Equipment (Select one or more)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {equipment.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No equipment has been added yet
                    </p>
                  ) : bookableEquipment.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Every machine is currently under maintenance
                    </p>
                  ) : (
                    // Every machine is listed, including the ones that cannot be booked, so a
                    // missing instrument is never a mystery.
                    equipment.map(eq => {
                      const bookable = isBookable(eq);
                      const reason = unbookableReason(eq);
                      return (
                        <label
                          key={eq.id}
                          title={reason ?? undefined}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded",
                            bookable ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-60"
                          )}
                        >
                          <input
                            type="checkbox"
                            disabled={!bookable}
                            checked={selectedEquipment.includes(eq.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEquipment([...selectedEquipment, eq.id]);
                              } else {
                                setSelectedEquipment(selectedEquipment.filter(id => id !== eq.id));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{eq.name}</span>
                          <span className="ml-auto flex items-center gap-1">
                            {eq.type === "HiPerGator" && (
                              <Badge variant="secondary" className="text-xs">HiPerGator</Badge>
                            )}
                            {reason ? (
                              <Badge variant="outline" className="text-xs">{reason}</Badge>
                            ) : eq.status === "in-use" ? (
                              // Informational only - busy now, still reservable for later.
                              <Badge variant="secondary" className="text-xs">In use now</Badge>
                            ) : null}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                {selectedEquipment.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedEquipment.length} equipment piece{selectedEquipment.length > 1 ? 's' : ''} selected
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
                    // A lone text input inside a <form> triggers implicit submission on
                    // Enter. Typing a labmate's name and pressing Enter - the reflex - used
                    // to book the equipment there and then, before duration or purpose were
                    // set. This is a search box, so Enter should do nothing.
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
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
                            // Without this the shadcn Button renders a bare <button>, whose
                            // HTML default type is "submit". Sitting inside the booking form,
                            // picking a collaborator SUBMITTED it - creating the booking on the
                            // spot, before the user had set duration or purpose. The adjacent
                            // remove-collaborator control already guarded itself this way.
                            type="button"
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
                        // `return user ? ... : null` meant a collaborator missing from
                        // availableUsers rendered NOTHING - and availableUsers only holds
                        // profiles where active = true. So once someone left the lab and was
                        // deactivated, their id stayed in the array, invisible, with no chip and
                        // therefore no X to remove it. Saving rewrote it back every time and no
                        // screen in the app could drop them. Render a chip regardless: an id we
                        // cannot resolve is still something the user must be able to remove.
                        return (
                          <Badge
                            key={collab}
                            variant="secondary"
                            className={cn("gap-1", !user && "opacity-70 italic")}
                            title={user || !usersLoaded ? undefined : "This account is deactivated. Remove it with the X."}
                          >
                            {user?.spirit_animal && <span>{user.spirit_animal}</span>}
                            <span>{user ? (user.full_name || user.email) : (usersLoaded ? "Former lab member" : "Loading...")}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedCollaborators(selectedCollaborators.filter(c => c !== collab))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
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
                      <span>HiPerGator Resource Allocation</span>
                    </div>
                    {(() => {
                      const hiPerGatorEq = selectedHiPerGator;
                      const maxCpus = poolCpuMax(hiPerGatorEq?.maxCpuCount);
                      const maxGpus = poolGpuMax(hiPerGatorEq?.maxGpuCount);
                      const cpuPercent = ((availableCpu / maxCpus) * 100);
                      const gpuPercent = ((availableGpu / maxGpus) * 100);
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
                        max={Math.max(1, Math.min(clampCpuMax(selectedHiPerGator?.maxCpuCount), availableCpu))}
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
                        max={Math.max(0, Math.min(clampGpuMax(selectedHiPerGator?.maxGpuCount), availableGpu))}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {(() => {
                      const hiPerGatorEq = selectedHiPerGator;
                      const maxCpus = poolCpuMax(hiPerGatorEq?.maxCpuCount);
                      const maxGpus = poolGpuMax(hiPerGatorEq?.maxGpuCount);
                      return (availableCpu < maxCpus * 0.2 || availableGpu < maxGpus * 0.2) && (
                        <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700 dark:text-amber-400">
                          <Server className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>Limited resources available during this time. Consider selecting a different time slot for more capacity.</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <Button
                type="submit" 
                className="w-full" 
                disabled={projectSamples.length === 0 || selectedEquipment.length === 0 || !selectedTime || loading}
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
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto p-6">
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
                  // Reset first, then prefill - see the matching call in the list view.
                  resetBookingForm();
                  setSelectedBooking(booking);
                  setIsEditDialogOpen(true);
                  setIsDetailsDialogOpen(false);
                  // Pre-fill form - editing keeps single equipment
                  if (booking.projectSamples && booking.projectSamples.length > 0) {
                    setProjectSamples(booking.projectSamples);
                  } else if (booking.projectId && booking.samplesProcessed) {
                    setProjectSamples([{
                      projectId: booking.projectId,
                      projectName: booking.projectName,
                      samples: booking.samplesProcessed
                    }]);
                  } else {
                    // See the matching branch in the list view above.
                    setProjectSamples([]);
                  }
                  setSelectedEquipment([booking.equipmentId]);
                  setBookingDate(booking.startTime);
                  setSelectedTime(format(booking.startTime, "HH:mm"));
                  setDuration(booking.duration.toString());
                  setPurpose(booking.purpose || "");
                  setCpuCount(booking.cpuCount || 1);
                  setGpuCount(booking.gpuCount || 0);
                  setSelectedCollaborators(booking.collaborators || []);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          // Deliberately does NOT clear the form. Both dialogs reset when they OPEN, which is
          // the invariant that matters; resetting on close as well would wipe a half-typed
          // booking the moment someone clicks the overlay by accident.
          if (!open) setSelectedBooking(null);
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Booking
                {selectedBooking && ` - ${equipment.find(e => e.id === selectedBooking.equipmentId)?.name || 'Unknown Equipment'}`}
              </DialogTitle>
              <DialogDescription>
                Update your booking details for {selectedBooking && format(selectedBooking.startTime, "PPP 'at' p")}
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Projects & Samples *</Label>
                <ProjectSampleSelector
                  projects={projects}
                  value={projectSamples}
                  onChange={setProjectSamples}
                  maxTotal={300}
                />
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
                    // A lone text input inside a <form> triggers implicit submission on
                    // Enter. Typing a labmate's name and pressing Enter - the reflex - used
                    // to book the equipment there and then, before duration or purpose were
                    // set. This is a search box, so Enter should do nothing.
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
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
                            // Without this the shadcn Button renders a bare <button>, whose
                            // HTML default type is "submit". Sitting inside the booking form,
                            // picking a collaborator SUBMITTED it - creating the booking on the
                            // spot, before the user had set duration or purpose. The adjacent
                            // remove-collaborator control already guarded itself this way.
                            type="button"
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
                        // `return user ? ... : null` meant a collaborator missing from
                        // availableUsers rendered NOTHING - and availableUsers only holds
                        // profiles where active = true. So once someone left the lab and was
                        // deactivated, their id stayed in the array, invisible, with no chip and
                        // therefore no X to remove it. Saving rewrote it back every time and no
                        // screen in the app could drop them. Render a chip regardless: an id we
                        // cannot resolve is still something the user must be able to remove.
                        return (
                          <Badge
                            key={collab}
                            variant="secondary"
                            className={cn("gap-1", !collaboratorUser && "opacity-70 italic")}
                            title={collaboratorUser || !usersLoaded ? undefined : "This account is deactivated. Remove it with the X."}
                          >
                            {collaboratorUser?.spirit_animal && <span>{collaboratorUser.spirit_animal}</span>}
                            <span>{collaboratorUser ? (collaboratorUser.full_name || collaboratorUser.email) : (usersLoaded ? "Former lab member" : "Loading...")}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedCollaborators(selectedCollaborators.filter(c => c !== collab))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
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
                      const hiPerGatorEq = selectedHiPerGator;
                      const maxCpus = poolCpuMax(hiPerGatorEq?.maxCpuCount);
                      const maxGpus = poolGpuMax(hiPerGatorEq?.maxGpuCount);
                      const cpuPercent = ((availableCpu / maxCpus) * 100);
                      const gpuPercent = ((availableGpu / maxGpus) * 100);
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
                        max={Math.max(1, Math.min(clampCpuMax(selectedHiPerGator?.maxCpuCount), availableCpu))}
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
                        max={Math.max(0, Math.min(clampGpuMax(selectedHiPerGator?.maxGpuCount), availableGpu))}
                        step={1}
                      />
                    </div>
                    {(() => {
                      const hiPerGatorEq = selectedHiPerGator;
                      const maxCpus = poolCpuMax(hiPerGatorEq?.maxCpuCount);
                      const maxGpus = poolGpuMax(hiPerGatorEq?.maxGpuCount);
                      return (availableCpu < maxCpus * 0.2 || availableGpu < maxGpus * 0.2) && (
                        <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700 dark:text-amber-400">
                          <Server className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>Limited resources available during this time. Consider selecting a different time slot for more capacity.</p>
                        </div>
                      );
                    })()}
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
      <Footer />
    </div>
  );
};

export default Schedule;
