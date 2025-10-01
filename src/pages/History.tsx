import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { BookingCard } from "@/components/BookingCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { mockBookings } from "@/lib/mockData";
import { Search } from "lucide-react";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const allBookings = mockBookings;
  const completedBookings = mockBookings.filter(b => b.status === "completed");
  const cancelledBookings = mockBookings.filter(b => b.status === "cancelled");

  const filteredBookings = (bookings: typeof mockBookings) => {
    if (!searchQuery) return bookings;
    
    return bookings.filter(booking => 
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings(allBookings).map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings(completedBookings).map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings(cancelledBookings).map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default History;
