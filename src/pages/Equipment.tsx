import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { EquipmentCard } from "@/components/EquipmentCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Equipment as EquipmentType } from "@/lib/types";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { EquipmentIconPicker } from "@/components/EquipmentIconPicker";

interface EquipmentFormData {
  name: string;
  type: "robot" | "equipment" | "quantification" | "PCR" | "HiPerGator" | "Sequencer";
  location: string;
  status: "available" | "maintenance";
  description?: string;
  icon?: string;
  maxCpuCount?: number;
  maxGpuCount?: number;
}

const Equipment = () => {
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("🤖");
  const [selectedType, setSelectedType] = useState<string>("robot");
  const [cpuCount, setCpuCount] = useState<number>(32);
  const [gpuCount, setGpuCount] = useState<number>(4);
  const [secretClicks, setSecretClicks] = useState<string[]>([]);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<EquipmentFormData>({
    defaultValues: {
      status: "available",
      type: "robot",
      icon: "🤖",
      maxCpuCount: 32,
      maxGpuCount: 4
    }
  });

  useEffect(() => {
    if (editingEquipment) {
      setSelectedIcon(editingEquipment.icon || "🤖");
      setSelectedType(editingEquipment.type);
      setCpuCount(editingEquipment.maxCpuCount || 32);
      setGpuCount(editingEquipment.maxGpuCount || 4);
      reset({
        name: editingEquipment.name,
        type: editingEquipment.type,
        location: editingEquipment.location,
        status: editingEquipment.status as "available" | "maintenance",
        description: editingEquipment.description || "",
        icon: editingEquipment.icon,
        maxCpuCount: editingEquipment.maxCpuCount,
        maxGpuCount: editingEquipment.maxGpuCount
      });
    } else {
      setSelectedIcon("🤖");
      setSelectedType("robot");
      setCpuCount(32);
      setGpuCount(4);
      reset({
        name: "",
        type: "robot",
        location: "",
        status: "available",
        description: "",
        icon: "🤖",
        maxCpuCount: 32,
        maxGpuCount: 4
      });
    }
  }, [editingEquipment, reset]);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const transformedEquipment: EquipmentType[] = (data || []).map(eq => ({
        id: eq.id,
        name: eq.name,
        type: eq.type as "robot" | "equipment" | "quantification" | "PCR" | "HiPerGator" | "Sequencer",
        status: eq.status as "available" | "in-use" | "maintenance",
        location: eq.location,
        description: eq.description || undefined,
        icon: eq.icon || undefined,
        maxCpuCount: eq.max_cpu_count || undefined,
        maxGpuCount: eq.max_gpu_count || undefined,
      }));
      
      setEquipment(transformedEquipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error("Failed to load equipment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEquipment = async (formData: EquipmentFormData) => {
    setIsSubmitting(true);
    try {
      const equipmentData: any = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        status: formData.status,
        description: formData.description || null,
        icon: selectedIcon
      };

      // Add HiPerGator resource limits if applicable
      if (formData.type === "HiPerGator") {
        equipmentData.max_cpu_count = cpuCount;
        equipmentData.max_gpu_count = gpuCount;
      }

      if (editingEquipment) {
        // Update equipment
        const { error: equipmentError } = await supabase
          .from("equipment")
          .update(equipmentData)
          .eq("id", editingEquipment.id);

        if (equipmentError) throw equipmentError;

        toast.success("Equipment updated successfully!");
        await fetchEquipment();
      } else {
        // Insert equipment
        const { error: equipmentError } = await supabase
          .from("equipment")
          .insert(equipmentData);

        if (equipmentError) throw equipmentError;

        toast.success("Equipment added successfully!");
        await fetchEquipment();
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

  const handleEquipmentClick = (equipmentName: string) => {
    const sequence = ['Glowforge Laser Cutter', 'Ford Escape Vehicle', 'Boat'];
    const newClicks = [...secretClicks, equipmentName];
    
    // Check if last 3 clicks match the sequence
    if (newClicks.slice(-3).join(',') === sequence.join(',')) {
      sessionStorage.setItem('zombieLunchUnlocked', 'true');
      toast.success("🧟 Secret zombie game unlocked! Head to the Help Center...");
    }
    
    setSecretClicks(newClicks.slice(-3)); // Keep only last 3
  };

  const robots = equipment.filter(e => e.type === "robot");
  const otherEquipment = equipment.filter(e => e.type === "equipment");
  const quantification = equipment.filter(e => e.type === "quantification");
  const pcr = equipment.filter(e => e.type === "PCR");
  const hipergator = equipment.filter(e => e.type === "HiPerGator");
  const sequencers = equipment.filter(e => e.type === "Sequencer");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
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
              <Button size="lg" className="w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEquipment ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
                <DialogDescription>
                  {editingEquipment ? "Update equipment information" : "Add a new robot or equipment to your lab inventory"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(handleAddEquipment)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <EquipmentIconPicker 
                    value={selectedIcon}
                    onChange={setSelectedIcon}
                  />
                </div>

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
                    value={selectedType}
                    defaultValue="robot"
                    onValueChange={(value) => {
                      setSelectedType(value);
                      setValue("type", value as "robot" | "equipment" | "quantification" | "PCR" | "HiPerGator" | "Sequencer");
                    }}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="robot">Robot</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="quantification">Quantification</SelectItem>
                      <SelectItem value="PCR">PCR</SelectItem>
                      <SelectItem value="HiPerGator">HiPerGator</SelectItem>
                      <SelectItem value="Sequencer">Sequencer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedType === "HiPerGator" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cpuCount">
                        Max CPU Count: {cpuCount}
                      </Label>
                      <Slider
                        id="cpuCount"
                        min={1}
                        max={128}
                        step={1}
                        value={[cpuCount]}
                        onValueChange={(value) => setCpuCount(value[0])}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of CPUs available (1-128)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gpuCount">
                        Max GPU Count: {gpuCount}
                      </Label>
                      <Slider
                        id="gpuCount"
                        min={0}
                        max={16}
                        step={1}
                        value={[gpuCount]}
                        onValueChange={(value) => setGpuCount(value[0])}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of GPUs available (0-16)
                      </p>
                    </div>
                  </>
                )}

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
            <TabsTrigger value="quantification">
              Quantification ({quantification.length})
            </TabsTrigger>
            <TabsTrigger value="pcr">
              PCR ({pcr.length})
            </TabsTrigger>
            <TabsTrigger value="hipergator">
              HiPerGator ({hipergator.length})
            </TabsTrigger>
            <TabsTrigger value="sequencer">
              Sequencers ({sequencers.length})
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
                    onClick={handleEquipmentClick}
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
                    onClick={handleEquipmentClick}
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
                    onClick={handleEquipmentClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quantification" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : quantification.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No quantification equipment added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quantification.map(item => (
                  <EquipmentCard 
                    key={item.id} 
                    equipment={item}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                    onClick={handleEquipmentClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pcr" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pcr.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No PCR equipment added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pcr.map(item => (
                  <EquipmentCard 
                    key={item.id} 
                    equipment={item}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                    onClick={handleEquipmentClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hipergator" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : hipergator.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No HiPerGator resources added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hipergator.map(item => (
                  <EquipmentCard 
                    key={item.id} 
                    equipment={item}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                    onClick={handleEquipmentClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sequencer" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sequencers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No sequencers added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sequencers.map(item => (
                  <EquipmentCard 
                    key={item.id} 
                    equipment={item}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                    onClick={handleEquipmentClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Equipment;
