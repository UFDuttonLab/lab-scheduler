import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Equipment, Project } from "@/lib/types";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";

export default function QuickAdd() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    equipmentId: "",
    projectId: "",
    duration: "30",
    samplesProcessed: "",
    notes: "",
  });

  useEffect(() => {
    fetchEquipment();
    fetchProjects();
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

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - parseInt(formData.duration) * 60000);

    const { error } = await supabase.from("usage_records").insert({
      user_id: user.id,
      equipment_id: formData.equipmentId,
      project_id: formData.projectId || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      samples_processed: formData.samplesProcessed ? parseInt(formData.samplesProcessed) : null,
      notes: formData.notes || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add usage record",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Usage record added successfully",
      });
      
      // Reset form
      setFormData({
        equipmentId: "",
        projectId: "",
        duration: "30",
        samplesProcessed: "",
        notes: "",
      });
    }

    setLoading(false);
  };

  const durationOptions = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
    { value: "240", label: "4 hours" },
  ];

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
                <Label htmlFor="equipment">Equipment *</Label>
                <Select
                  value={formData.equipmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, equipmentId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {item.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      const Icon = project.icon
                        ? (Icons[project.icon as keyof typeof Icons] as LucideIcon)
                        : null;
                      return (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4" />}
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
                <Label htmlFor="samples">Samples Processed (Optional)</Label>
                <Input
                  id="samples"
                  type="number"
                  min="0"
                  value={formData.samplesProcessed}
                  onChange={(e) =>
                    setFormData({ ...formData, samplesProcessed: e.target.value })
                  }
                  placeholder="Enter number of samples"
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
    </div>
  );
}
