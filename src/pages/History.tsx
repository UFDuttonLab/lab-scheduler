import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
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
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        equipment:equipment_id (name),
        project:project_id (name, color),
        user:user_id (email, full_name)
      `)
      .order('start_time', { ascending: false });
    
    if (error) {
      toast.error("Failed to load bookings");
      setLoading(false);
      return;
    }
    
    // Transform the data to match our Booking type
    const transformedBookings: Booking[] = (data || []).map((booking: any) => ({
      id: booking.id,
      equipmentId: booking.equipment_id,
      equipmentName: booking.equipment?.name || 'Unknown',
      studentName: booking.user?.full_name || 'Unknown',
      studentEmail: booking.user?.email || 'Unknown',
      startTime: new Date(booking.start_time),
      endTime: new Date(booking.end_time),
      duration: Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000),
      projectId: booking.project_id || undefined,
      projectName: booking.project?.name || undefined,
      purpose: booking.purpose || undefined,
      status: booking.status as "scheduled" | "in-progress" | "completed" | "cancelled"
    }));
    
    setBookings(transformedBookings);
    setLoading(false);
  };

  const allBookings = bookings;
  const completedBookings = bookings.filter(b => b.status === "completed");
  const cancelledBookings = bookings.filter(b => b.status === "cancelled");

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
            <TabsTrigger value="completed">
              Completed ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
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

          <TabsContent value="cancelled" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBookings(cancelledBookings).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings(cancelledBookings).map(booking => (
                  <BookingCard key={booking.id} booking={booking} onDelete={fetchBookings} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No cancelled bookings found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default History;
