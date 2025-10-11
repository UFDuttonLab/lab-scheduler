import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Equipment, Project } from "@/lib/types";
import { Clock, FlaskConical, CalendarIcon, Users } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  spirit_animal?: string;
}

export default function QuickAdd() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [collaboratorSearch, setCollaboratorSearch] = useState<string>("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    equipmentIds: [] as string[],
    projectId: "",
    duration: "30",
    samplesProcessed: 1,
    notes: "",
  });

  useEffect(() => {
    fetchEquipment();
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchEquipment = async () => {
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("status", "available")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch equipment",
        variant: "destructive",
      });
    } else {
      setEquipment(data as Equipment[]);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } else {
      setProjects(data as Project[]);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, spirit_animal")
      .eq("active", true)
      .order("full_name");

    if (error) {
      console.error("Failed to fetch users:", error);
    } else {
      setAvailableUsers(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a date and time",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (formData.equipmentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one equipment",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Parse the time and combine with selected date
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    // Validate usage is not in the future (Quick Add is for past usage)
    if (startTime > new Date()) {
      toast({
        title: "Error",
        description: "Quick Add is for logging past usage. Use Schedule for future bookings.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate duration (max 7 days)
    const durationMinutes = parseInt(formData.duration);
    if (durationMinutes > 10080) { // 7 days in minutes
      toast({
        title: "Error",
        description: "Maximum duration is 7 days",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    const endTime = addMinutes(startTime, durationMinutes);

    // Generate a group ID for linking multiple usage records
    const usageGroupId = formData.equipmentIds.length > 1 ? crypto.randomUUID() : null;

    // Create usage records for each equipment
    const usageRecords = formData.equipmentIds.map(equipmentId => ({
      user_id: user.id,
      equipment_id: equipmentId,
      project_id: formData.projectId || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      samples_processed: formData.samplesProcessed,
      notes: formData.notes || null,
      booking_group_id: usageGroupId,
      collaborators: selectedCollaborators
    }));

    const { error } = await supabase.from("usage_records").insert(usageRecords);

    if (error) {
      console.error("Database error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add usage record",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: formData.equipmentIds.length > 1 
          ? `${formData.equipmentIds.length} usage records added successfully`
          : "Usage record added successfully",
      });
      
      // Reset form
      setFormData({
        equipmentIds: [],
        projectId: "",
        duration: "30",
        samplesProcessed: 1,
        notes: "",
      });
      setSelectedDate(new Date());
      setSelectedTime("");
      setSelectedCollaborators([]);
      setCollaboratorSearch("");
    }

    setLoading(false);
  };

  const durationOptions = [
    { value: "15", label: "15 minutes" },
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

  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 6;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-6 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Quick Add Usage
            </CardTitle>
            <CardDescription>
              Log equipment usage that just occurred
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Start Time *</Label>
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
                <Label htmlFor="equipment">Equipment (Select one or more) *</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {equipment.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No equipment available</p>
                  ) : (
                    equipment.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.equipmentIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, equipmentIds: [...formData.equipmentIds, item.id] });
                            } else {
                              setFormData({ ...formData, equipmentIds: formData.equipmentIds.filter(id => id !== item.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">{item.name} - {item.location}</span>
                      </label>
                    ))
                  )}
                </div>
                {formData.equipmentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.equipmentIds.length} equipment piece{formData.equipmentIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project (Optional)</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => {
                      return (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            {project.icon && <span className="text-lg">{project.icon}</span>}
                            <span>{project.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Samples Processed: {formData.samplesProcessed}
                  </Label>
                </div>
                <Slider
                  value={[formData.samplesProcessed]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, samplesProcessed: value[0] })
                  }
                  min={1}
                  max={300}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Collaborators (Optional)
                </Label>
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={collaboratorSearch}
                  onChange={(e) => setCollaboratorSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers
                    .filter(u => 
                      u.full_name?.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(collaboratorSearch.toLowerCase())
                    )
                    .map((profile) => (
                      <label key={profile.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedCollaborators.includes(profile.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollaborators([...selectedCollaborators, profile.id]);
                            } else {
                              setSelectedCollaborators(selectedCollaborators.filter(id => id !== profile.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">
                          {profile.full_name || profile.email}
                          {profile.spirit_animal && (
                            <span className="ml-2 text-muted-foreground">({profile.spirit_animal})</span>
                          )}
                        </span>
                      </label>
                    ))}
                </div>
                {selectedCollaborators.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCollaborators.length} collaborator{selectedCollaborators.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Adding..." : "Add Usage Record"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
