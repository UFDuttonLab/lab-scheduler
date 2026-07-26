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
import { useAuth } from "@/contexts/AuthContext";
import { settleWrite } from "@/lib/dbWrite";
import { useForm } from "react-hook-form";
import { EquipmentIconPicker } from "@/components/EquipmentIconPicker";

/**
 * Hard ceilings enforced by the bookings CHECK constraints (cpu_count 1-32, gpu_count 0-2).
 * Advertising a higher max here just produces equipment nobody can actually book at that
 * size - the insert dies on a raw Postgres constraint error.
 */
const DB_MAX_CPU = 32;
const DB_MAX_GPU = 2;

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
  const { permissions } = useAuth();
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("🤖");
  const [selectedType, setSelectedType] = useState<string>("robot");
  const [selectedStatus, setSelectedStatus] = useState<string>("available");
  const [cpuCount, setCpuCount] = useState<number>(32);
  const [gpuCount, setGpuCount] = useState<number>(DB_MAX_GPU);
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
      setSelectedStatus(editingEquipment.status);
      setCpuCount(editingEquipment.maxCpuCount ?? DB_MAX_CPU);
      setGpuCount(editingEquipment.maxGpuCount ?? DB_MAX_GPU);
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
      setSelectedStatus("available");
      setCpuCount(DB_MAX_CPU);
      setGpuCount(DB_MAX_GPU);
      reset({
        name: "",
        type: "robot",
        location: "",
        status: "available",
        description: "",
        icon: "🤖",
        maxCpuCount: DB_MAX_CPU,
        maxGpuCount: DB_MAX_GPU
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
        // ?? not ||: a max of 0 is meaningful and `0 || undefined` erased it
        maxCpuCount: eq.max_cpu_count ?? undefined,
        maxGpuCount: eq.max_gpu_count ?? undefined,
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
        // settleWrite + .select(): an UPDATE that RLS filters to zero rows comes back as
        // error:null, so this used to report "Equipment updated successfully!" for a change
        // that never happened - including a status change to Maintenance, which is exactly
        // the kind of thing you need to trust.
        const result = await settleWrite(
          supabase
            .from("equipment")
            .update(equipmentData)
            .eq("id", editingEquipment.id)
            .select("id"),
          "You don't have permission to change this equipment."
        );

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

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
    // Both bookings.equipment_id and usage_records.equipment_id are ON DELETE CASCADE
    // (verified against the live database), so removing one machine permanently destroys
    // every reservation AND every usage record ever logged against it. The old prompt was
    // "Are you sure you want to delete <name>?", which reads like tidying up an inventory
    // list. On this lab's real data that button sits on 31 records for Robin and 22 for the
    // Denovix - and the Denovix is in maintenance, which is exactly the state that invites
    // someone to decide the machine is finished with and clear it out.
    //
    // So: count first, state the real number, and name the safer alternative.
    let bookingCount = 0;
    let usageCount = 0;
    try {
      const [b, u] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("equipment_id", equipment.id),
        supabase.from("usage_records").select("id", { count: "exact", head: true }).eq("equipment_id", equipment.id),
      ]);
      if (b.error) throw b.error;
      if (u.error) throw u.error;
      bookingCount = b.count ?? 0;
      usageCount = u.count ?? 0;
    } catch (error) {
      console.error("Could not count attached records:", error);
      toast.error("Could not check what else would be deleted. Nothing has been changed.");
      return;
    }

    const total = bookingCount + usageCount;

    if (total > 0) {
      const parts = [
        bookingCount > 0 ? `${bookingCount} booking${bookingCount === 1 ? '' : 's'}` : null,
        usageCount > 0 ? `${usageCount} usage record${usageCount === 1 ? '' : 's'}` : null,
      ].filter(Boolean).join(' and ');

      // The counts above are RLS-filtered, and the two policies do NOT line up: the equipment
      // ALL policy includes undergrad_student, while the usage_records SELECT policy does not.
      // So an undergrad sees only their OWN usage records here while the cascade removes
      // everyone's. Never let an incomplete figure read as a complete one.
      const countsMayBeIncomplete = !permissions.canViewAllUsageRecords;
      const confirmed = confirm(
        `Delete ${equipment.name} permanently?\n\n` +
        `This will ALSO delete ${parts} attached to it` +
        (countsMayBeIncomplete
          ? `, and probably more - you can only see your own usage records, so the real total ` +
            `is likely higher.`
          : `.`) +
        ` That history disappears from History and from Analytics and cannot be recovered.\n\n` +
        `If the machine is only out of service for now, set its status to "Maintenance" ` +
        `instead - that stops new bookings and keeps the history.\n\n` +
        `Press OK to delete the machine and ${total} record${total === 1 ? '' : 's'}.`
      );
      if (!confirmed) return;
    } else if (!confirm(
      permissions.canViewAllUsageRecords
        ? `Delete ${equipment.name}? It has no bookings or usage records.`
        : `Delete ${equipment.name}? It has no bookings, and no usage records that you can see - ` +
          `but you cannot see other people's, and deleting the machine removes theirs too.`
    )) {
      return;
    }

    // .select() so an RLS-filtered delete is detectable: without it PostgREST returns
    // error:null for zero rows changed, so this reported success on a delete that never
    // happened - and then optimistically dropped the row from the list anyway.
    const result = await settleWrite(
      supabase.from("equipment").delete().eq("id", equipment.id).select("id"),
      "You don't have permission to delete equipment."
    );

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(
      total > 0
        ? `${equipment.name} deleted, along with ${total} attached record${total === 1 ? '' : 's'}`
        : `${equipment.name} deleted`
    );
    setEquipment(prev => prev.filter(eq => eq.id !== equipment.id));
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
                        max={DB_MAX_CPU}
                        step={1}
                        value={[cpuCount]}
                        onValueChange={(value) => setCpuCount(value[0])}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of CPUs a single booking may request (1-32)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gpuCount">
                        Max GPU Count: {gpuCount}
                      </Label>
                      <Slider
                        id="gpuCount"
                        min={0}
                        max={DB_MAX_GPU}
                        step={1}
                        value={[gpuCount]}
                        onValueChange={(value) => setGpuCount(value[0])}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of GPUs a single booking may request (0-2)
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
                  {/* Controlled, like the Type select above. With only defaultValue, Radix
                      remounts on every dialog open and always showed "Available", so editing
                      a machine that was in maintenance displayed the wrong status and picking
                      "Available" fired no onValueChange. */}
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => {
                      setSelectedStatus(value as "available" | "in-use" | "maintenance");
                      setValue("status", value as "available" | "maintenance");
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
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
