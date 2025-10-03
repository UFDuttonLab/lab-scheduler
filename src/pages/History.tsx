import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { BookingCard } from "@/components/BookingCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Booking } from "@/lib/types";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
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
          userId: booking.user_id
        };
      });

      // Transform usage records (all completed by definition)
      const transformedUsageRecords: Booking[] = (usageData || []).map((usage: any) => {
        const equipment = equipmentMap.get(usage.equipment_id);
        const project = projectMap.get(usage.project_id);
        const profile = profileMap.get(usage.user_id);

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
          userId: usage.user_id
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

  const allBookings = bookings;
  const futureBookings = bookings.filter(b => 
    b.status === "scheduled" || b.status === "in-progress"
  );
  const completedBookings = bookings.filter(b => b.status === "completed");

  const filteredBookings = (bookingsList: Booking[]) => {
    if (!searchQuery) return bookingsList;
    
    return bookingsList.filter(booking => 
      booking.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchBookings} />
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
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchBookings} />
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
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchBookings} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No future bookings found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default History;
