import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { EquipmentCard } from "@/components/EquipmentCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment as EquipmentType, Project } from "@/lib/types";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";

interface EquipmentFormData {
  name: string;
  type: "robot" | "equipment";
  location: string;
  status: "available" | "maintenance";
  description?: string;
  projectIds: string[];
}

const Equipment = () => {
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<EquipmentFormData>({
    defaultValues: {
      status: "available",
      type: "robot",
      projectIds: []
    }
  });

  useEffect(() => {
    if (editingEquipment) {
      reset({
        name: editingEquipment.name,
        type: editingEquipment.type,
        location: editingEquipment.location,
        status: editingEquipment.status as "available" | "maintenance",
        description: editingEquipment.description || "",
        projectIds: editingEquipment.compatibleProjects || []
      });
    } else {
      reset({
        name: "",
        type: "robot",
        location: "",
        status: "available",
        description: "",
        projectIds: []
      });
    }
  }, [editingEquipment, reset]);

  const selectedProjects = watch("projectIds") || [];

  useEffect(() => {
    fetchEquipment();
    fetchProjects();
  }, []);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEquipment((data || []) as EquipmentType[]);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error("Failed to load equipment");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const handleAddEquipment = async (formData: EquipmentFormData) => {
    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        // Update equipment
        const { error: equipmentError } = await supabase
          .from("equipment")
          .update({
            name: formData.name,
            type: formData.type,
            location: formData.location,
            status: formData.status,
            description: formData.description || null
          })
          .eq("id", editingEquipment.id);

        if (equipmentError) throw equipmentError;

        // Delete old relationships
        await supabase
          .from("equipment_projects")
          .delete()
          .eq("equipment_id", editingEquipment.id);

        // Insert new relationships
        if (formData.projectIds.length > 0) {
          const relationships = formData.projectIds.map(projectId => ({
            equipment_id: editingEquipment.id,
            project_id: projectId
          }));

          const { error: relationError } = await supabase
            .from("equipment_projects")
            .insert(relationships);

          if (relationError) throw relationError;
        }

        toast.success("Equipment updated successfully!");
        setEquipment(prev => prev.map(eq => 
          eq.id === editingEquipment.id 
            ? { ...eq, ...formData, compatibleProjects: formData.projectIds } as EquipmentType
            : eq
        ));
      } else {
        // Insert equipment
        const { data: newEquipment, error: equipmentError } = await supabase
          .from("equipment")
          .insert({
            name: formData.name,
            type: formData.type,
            location: formData.location,
            status: formData.status,
            description: formData.description || null
          })
          .select()
          .single();

        if (equipmentError) throw equipmentError;

        // Insert equipment-project relationships
        if (formData.projectIds.length > 0) {
          const relationships = formData.projectIds.map(projectId => ({
            equipment_id: newEquipment.id,
            project_id: projectId
          }));

          const { error: relationError } = await supabase
            .from("equipment_projects")
            .insert(relationships);

          if (relationError) throw relationError;
        }

        toast.success("Equipment added successfully!");
        setEquipment(prev => [newEquipment as EquipmentType, ...prev]);
      }
      
      setIsAddDialogOpen(false);
      setEditingEquipment(null);
      reset();
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error(`Failed to ${editingEquipment ? "update" : "add"} equipment`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEquipment = (equipment: EquipmentType) => {
    setEditingEquipment(equipment);
    setIsAddDialogOpen(true);
  };

  const handleDeleteEquipment = async (equipment: EquipmentType) => {
    if (!confirm(`Are you sure you want to delete ${equipment.name}?`)) return;

    try {
      const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", equipment.id);

      if (error) throw error;

      toast.success("Equipment deleted successfully!");
      setEquipment(prev => prev.filter(eq => eq.id !== equipment.id));
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast.error("Failed to delete equipment");
    }
  };

  const robots = equipment.filter(e => e.type === "robot");
  const otherEquipment = equipment.filter(e => e.type === "equipment");

  const toggleProject = (projectId: string) => {
    const current = selectedProjects;
    const updated = current.includes(projectId)
      ? current.filter(id => id !== projectId)
      : [...current, projectId];
    setValue("projectIds", updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2">Equipment Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage your lab equipment and robots
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingEquipment(null);
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingEquipment ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
                <DialogDescription>
                  {editingEquipment ? "Update equipment information" : "Add a new robot or equipment to your lab inventory"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(handleAddEquipment)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name</Label>
                  <Input 
                    id="name"
                    placeholder="e.g., Robotic Arm Delta" 
                    {...register("name", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    onValueChange={(value) => setValue("type", value as "robot" | "equipment")}
                    defaultValue="robot"
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="robot">Robot</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    placeholder="e.g., Lab Room A-101" 
                    {...register("location", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    onValueChange={(value) => setValue("status", value as "available" | "maintenance")}
                    defaultValue="available"
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description"
                    placeholder="Brief description of the equipment" 
                    rows={3}
                    {...register("description")}
                  />
                </div>

                {projects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Compatible Projects</Label>
                    <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`project-${project.id}`}
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={() => toggleProject(project.id)}
                          />
                          <label
                            htmlFor={`project-${project.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {project.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingEquipment ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {editingEquipment ? "Update Equipment" : "Add Equipment"}
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Equipment ({equipment.length})
            </TabsTrigger>
            <TabsTrigger value="robots">
              Robots ({robots.length})
            </TabsTrigger>
            <TabsTrigger value="equipment">
              Equipment ({otherEquipment.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No equipment added yet. Click "Add Equipment" to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.map(item => (
                  <EquipmentCard 
                    key={item.id} 
                    equipment={item}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="robots" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : robots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No robots added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {robots.map(item => (
                  <EquipmentCard 
                    key={item.id} 
                    equipment={item}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : otherEquipment.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No equipment added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherEquipment.map(item => (
                  <EquipmentCard 
                    key={item.id} 
                    equipment={item}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Equipment;
