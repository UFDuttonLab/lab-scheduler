import { Navigation } from "@/components/Navigation";
import { StatsCard } from "@/components/StatsCard";
import { BookingCard } from "@/components/BookingCard";
import { EquipmentCard } from "@/components/EquipmentCard";
import { mockEquipment, mockBookings } from "@/lib/mockData";
import { Calendar, Clock, Settings, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  const availableEquipment = mockEquipment.filter(e => e.status === "available").length;
  const totalEquipment = mockEquipment.length;
  const todayBookings = mockBookings.filter(b => b.status !== "cancelled").length;
  const activeBookings = mockBookings.filter(b => b.status === "in-progress").length;

  const upcomingBookings = mockBookings
    .filter(b => b.status === "scheduled")
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 3);

  const recentEquipment = mockEquipment.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Lab Equipment Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your lab equipment and robot scheduling in one place
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
            trend="3 pending approval"
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
              {upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
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
              {recentEquipment.map(equipment => (
                <EquipmentCard
                  key={equipment.id}
                  equipment={equipment}
                  onSelect={() => navigate("/schedule")}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
