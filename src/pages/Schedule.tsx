import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEquipment, mockBookings, mockProjects } from "@/lib/mockData";
import { Equipment, Project } from "@/lib/types";
import { format, isSameDay } from "date-fns";
import { Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");

  const availableEquipment = mockEquipment.filter(e => 
    e.status === "available" && 
    (!selectedProject || e.compatibleProjects?.includes(selectedProject))
  );

  const dayBookings = selectedDate 
    ? mockBookings.filter(b => isSameDay(b.startTime, selectedDate))
    : [];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Equipment booked successfully! First-come, first-served.");
    setIsBookingDialogOpen(false);
    setSelectedProject("");
    setSelectedEquipment("");
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
    { value: "240", label: "4 hours" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
            />
            
            <div className="mt-6">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setIsBookingDialogOpen(true)}
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
                    {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} today
                  </p>
                </div>
                
                {dayBookings.length > 0 ? (
                  <div className="space-y-4">
                    {dayBookings.map((booking) => (
                      <Card key={booking.id} className="p-4 border-l-4" style={{ borderLeftColor: mockProjects.find(p => p.id === booking.projectId)?.color || '#ccc' }}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{booking.equipmentName}</h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {format(booking.startTime, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                              </span>
                              <span className="text-xs">({booking.duration} min)</span>
                            </div>
                          </div>
                          <Badge className="bg-primary text-primary-foreground">
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">{booking.studentName}</p>
                          <p className="text-muted-foreground">{booking.studentEmail}</p>
                          {booking.projectName && (
                            <p className="mt-2 text-sm">
                              <span className="font-medium">Project:</span> {booking.projectName}
                            </p>
                          )}
                          {booking.purpose && (
                            <p className="mt-1 text-muted-foreground">{booking.purpose}</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No bookings scheduled for this day</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Book Equipment</DialogTitle>
              <DialogDescription>
                First-come, first-served - Your booking is confirmed immediately
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select 
                  value={selectedEquipment} 
                  onValueChange={setSelectedEquipment}
                  disabled={!selectedProject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProject ? "Select equipment" : "Select a project first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProject && availableEquipment.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No compatible equipment available for this project
                  </p>
                )}
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
                <Label>Your Name</Label>
                <Input placeholder="Enter your name" required />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="your.email@ufl.edu" required />
              </div>

              <div className="space-y-2">
                <Label>Purpose (Optional)</Label>
                <Textarea placeholder="Brief description of what you'll be doing" rows={2} />
              </div>

              <Button type="submit" className="w-full" disabled={!selectedProject || !selectedEquipment}>
                <Plus className="w-4 h-4 mr-2" />
                Book Equipment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Schedule;
