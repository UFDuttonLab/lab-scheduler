import { Navigation } from "@/components/Navigation";
import { StatsCard } from "@/components/StatsCard";
import { BookingCard } from "@/components/BookingCard";
import { EquipmentCard } from "@/components/EquipmentCard";
import { Footer } from "@/components/Footer";
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
      
      // Fetch equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');
      
      if (equipmentError) throw equipmentError;
      
      // Fetch bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (bookingsError) throw bookingsError;

      // Fetch profiles separately
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name');
      
      // Transform equipment data
      const transformedEquipment: Equipment[] = equipmentData.map(eq => ({
        id: eq.id,
        name: eq.name,
        type: eq.type as "robot" | "equipment",
        status: eq.status as "available" | "in-use" | "maintenance",
        location: eq.location,
        description: eq.description || undefined,
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
          startTime: new Date(booking.start_time),
          endTime: new Date(booking.end_time),
          duration: Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000),
          projectId: booking.project_id || undefined,
          projectName: project?.name || undefined,
          purpose: booking.purpose || undefined,
          status: booking.status as "scheduled" | "in-progress" | "completed" | "cancelled",
        };
      });
      
      setEquipment(transformedEquipment);
      setBookings(transformedBookings);
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
  
  const activeBookings = bookings.filter(b => b.status === "in-progress").length;

  const upcomingBookings = bookings
    .filter(b => b.status === "scheduled" && b.startTime >= new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 3);

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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Dutton Lab Dashboard</h1>
          <p className="text-muted-foreground">
            Equipment and robot scheduling for the University of Florida
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            trend="1 ending soon"
          />
          <StatsCard
            title="Usage This Week"
            value="87%"
            icon={TrendingUp}
            trend="+12% from last week"
            trendUp
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Upcoming Bookings</h2>
              <button
                onClick={() => navigate("/schedule")}
                className="text-sm text-primary hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-4">
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
              <h2 className="text-2xl font-bold">Available Equipment</h2>
              <button
                onClick={() => navigate("/equipment")}
                className="text-sm text-primary hover:underline"
              >
                Manage all
              </button>
            </div>
            <div className="space-y-4">
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
