import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { EquipmentCard } from "@/components/EquipmentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEquipment, mockBookings } from "@/lib/mockData";
import { Equipment } from "@/lib/types";
import { format } from "date-fns";
import { Clock, Plus } from "lucide-react";
import { toast } from "sonner";

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const availableEquipment = mockEquipment.filter(e => e.status === "available");

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8;
    return `${hour}:00 - ${hour + 1}:00`;
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Booking created successfully!");
    setIsBookingDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Schedule Equipment</h1>
          <p className="text-muted-foreground">
            Book available robots and equipment for your lab work
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
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="font-semibold text-xl mb-4">Available Equipment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableEquipment.map(equipment => (
                  <EquipmentCard
                    key={equipment.id}
                    equipment={equipment}
                    onSelect={(eq) => {
                      setSelectedEquipment(eq);
                      setIsBookingDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>

            {selectedDate && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-xl">Time Slots</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {timeSlots.map((slot) => {
                    const isBooked = Math.random() > 0.7;
                    return (
                      <Button
                        key={slot}
                        variant={isBooked ? "outline" : "default"}
                        disabled={isBooked}
                        className="justify-start"
                        onClick={() => setIsBookingDialogOpen(true)}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {slot}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                Book equipment for your lab session
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select defaultValue={selectedEquipment?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>
                          {slot.split(" - ")[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>
                          {slot.split(" - ")[1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input placeholder="Enter your name" required />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="your.email@university.edu" required />
              </div>

              <div className="space-y-2">
                <Label>Purpose (Optional)</Label>
                <Textarea placeholder="Describe the purpose of this booking" rows={3} />
              </div>

              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Booking
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Schedule;
