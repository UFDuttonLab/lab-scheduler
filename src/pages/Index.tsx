import { Navigation } from "@/components/Navigation";
import { StatsCard } from "@/components/StatsCard";
import { BookingCard } from "@/components/BookingCard";
import { EquipmentCard } from "@/components/EquipmentCard";
import { Footer } from "@/components/Footer";
import { DadJokeCard } from "@/components/DadJokeCard";
import { LabFatePredictor } from "@/components/LabFatePredictor";
import { Calendar, Clock, Settings, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Equipment, Booking } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data including usage_records (like Schedule page does)
      const [equipmentRes, bookingsRes, usageRecordsRes, profilesRes, projectsRes] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('bookings').select('*').order('start_time', { ascending: true }),
        supabase.from('usage_records').select('*').order('start_time', { ascending: true }),
        supabase.from('profiles').select('id, full_name, email, spirit_animal'),
        supabase.from('projects').select('id, name')
      ]);
      
      if (equipmentRes.error) throw equipmentRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      
      const equipmentData = equipmentRes.data;
      const bookingsData = bookingsRes.data || [];
      const usageRecordsData = usageRecordsRes.data || [];
      const profilesData = profilesRes.data;
      const projectsData = projectsRes.data;
      
      // Transform equipment data
      const transformedEquipment: Equipment[] = equipmentData.map(eq => ({
        id: eq.id,
        name: eq.name,
        type: eq.type as "robot" | "equipment",
        status: eq.status as "available" | "in-use" | "maintenance",
        location: eq.location,
        description: eq.description || undefined,
        icon: eq.icon || undefined,
      }));
      
      // Transform bookings data
      const transformedBookings: Booking[] = bookingsData.map(booking => {
        const equipment = equipmentData.find(eq => eq.id === booking.equipment_id);
        const profile = profilesData?.find(p => p.id === booking.user_id);
        const project = projectsData?.find(p => p.id === booking.project_id);
        
        return {
          id: booking.id,
          equipmentId: booking.equipment_id,
          equipmentName: equipment?.name || "Unknown Equipment",
          studentName: profile?.full_name || "Unknown Student",
          studentEmail: profile?.email || "",
          studentSpiritAnimal: profile?.spirit_animal || undefined,
          startTime: new Date(booking.start_time),
          endTime: new Date(booking.end_time),
          duration: Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000),
          projectId: booking.project_id || undefined,
          projectName: project?.name || undefined,
          purpose: booking.purpose || undefined,
          status: booking.status as "scheduled" | "in-progress" | "completed" | "cancelled",
          source: 'booking' as const,
        };
      });
      
      // Transform usage records to booking format (same approach as Schedule page)
      const transformedUsageRecords: Booking[] = usageRecordsData.map(record => {
        const equipment = equipmentData.find(eq => eq.id === record.equipment_id);
        const profile = profilesData?.find(p => p.id === record.user_id);
        const project = projectsData?.find(p => p.id === record.project_id);
        
        return {
          id: record.id,
          equipmentId: record.equipment_id,
          equipmentName: equipment?.name || "Unknown Equipment",
          studentName: profile?.full_name || "Unknown Student",
          studentEmail: profile?.email || "",
          studentSpiritAnimal: profile?.spirit_animal || undefined,
          startTime: new Date(record.start_time),
          endTime: new Date(record.end_time),
          duration: Math.round((new Date(record.end_time).getTime() - new Date(record.start_time).getTime()) / 60000),
          projectId: record.project_id || undefined,
          projectName: project?.name || undefined,
          purpose: record.notes || undefined,
          status: 'completed' as "scheduled" | "in-progress" | "completed" | "cancelled",
          source: 'usage_record' as const,
        };
      });
      
      // Combine both sources
      const allBookings = [...transformedBookings, ...transformedUsageRecords];
      
      setEquipment(transformedEquipment);
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const availableEquipment = equipment.filter(e => e.status === "available").length;
  const totalEquipment = equipment.length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.startTime);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate.getTime() === today.getTime() && b.status !== "cancelled";
  }).length;
  
  const now = new Date();
  const activeBookings = bookings.filter(b => {
    // For usage_records, check if currently in progress based on time
    if (b.source === 'usage_record') {
      return b.startTime <= now && b.endTime >= now;
    }
    // For regular bookings
    return (b.status === "in-progress") || 
           (b.status === "scheduled" && b.startTime <= now && b.endTime >= now);
  }).length;

  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const endingSoon = bookings.filter(b => 
    ((b.status === "in-progress") || (b.status === "scheduled" && b.startTime <= now)) &&
    b.endTime > now && 
    b.endTime <= oneHourFromNow
  ).length;

  const activeTrend = endingSoon > 0 
    ? `${endingSoon} ending soon` 
    : activeBookings > 0 ? "Running smoothly" : "No active sessions";

  // Calculate usage percentage for this week
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  
  const weekBookings = bookings.filter(b => 
    b.startTime >= startOfWeek && 
    b.startTime < endOfWeek && 
    b.status !== "cancelled"
  );
  
  const totalBookedMinutes = weekBookings.reduce((sum, b) => sum + b.duration, 0);
  const totalBookedHours = totalBookedMinutes / 60;

  const upcomingBookings = bookings
    .filter(b => {
      // Exclude cancelled bookings
      if (b.status === "cancelled") return false;
      
      // For usage_records, check if end time is in the future (still ongoing)
      if (b.source === 'usage_record') {
        return b.endTime >= now;
      }
      
      // For regular bookings, exclude completed
      if (b.status === "completed") return false;
      
      // Include in-progress bookings
      if (b.status === "in-progress") return true;
      
      // Include scheduled bookings that haven't ended yet
      if (b.status === "scheduled" && b.endTime >= now) return true;
      
      return false;
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  const recentEquipment = equipment.filter(e => e.status === "available").slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Dutton Lab Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Equipment and robot scheduling
          </p>
        </div>

        <DadJokeCard className="mb-6 sm:mb-8" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Available Equipment"
            value={`${availableEquipment}/${totalEquipment}`}
            icon={Settings}
            trend="+2 from yesterday"
            trendUp
          />
          <StatsCard
            title="Today's Bookings"
            value={todayBookings}
            icon={Calendar}
            trend="First-come, first-served"
          />
          <StatsCard
            title="Active Sessions"
            value={activeBookings}
            icon={Clock}
            trend={activeTrend}
          />
          <StatsCard
            title="Hours Booked This Week"
            value={totalBookedHours.toFixed(1)}
            icon={TrendingUp}
            trend={`${weekBookings.length} bookings this week`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">Current & Upcoming</h2>
              <button
                onClick={() => navigate("/schedule")}
                className="text-xs sm:text-sm text-primary hover:underline min-h-[44px] flex items-center"
              >
                View all
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchData} />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No upcoming bookings</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">Available Equipment</h2>
              <button
                onClick={() => navigate("/equipment")}
                className="text-xs sm:text-sm text-primary hover:underline min-h-[44px] flex items-center"
              >
                Manage all
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentEquipment.length > 0 ? (
                recentEquipment.map(eq => (
                  <EquipmentCard
                    key={eq.id}
                    equipment={eq}
                    onSelect={() => navigate(`/schedule?equipment=${eq.id}`)}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No available equipment</p>
              )}
            </div>
          </div>
        </div>
        
        <LabFatePredictor className="mb-6 sm:mb-8" />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
