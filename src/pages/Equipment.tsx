import { useState } from "react";
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
import { mockEquipment, mockProjects } from "@/lib/mockData";
import { Equipment as EquipmentType } from "@/lib/types";
import { Plus, Settings } from "lucide-react";
import { toast } from "sonner";

const Equipment = () => {
  const [equipment, setEquipment] = useState(mockEquipment);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const robots = equipment.filter(e => e.type === "robot");
  const otherEquipment = equipment.filter(e => e.type === "equipment");

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Equipment added successfully!");
    setIsAddDialogOpen(false);
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
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
                <DialogDescription>
                  Add a new robot or equipment to your lab inventory
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddEquipment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Equipment Name</Label>
                  <Input placeholder="e.g., Robotic Arm Delta" required />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="robot">Robot</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="e.g., Lab Room A-101" required />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue="available">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea 
                    placeholder="Brief description of the equipment" 
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Compatible Projects</Label>
                  <div className="space-y-2 border rounded-md p-3">
                    {mockProjects.map(project => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox id={`project-${project.id}`} />
                        <label
                          htmlFor={`project-${project.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {project.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map(item => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="robots" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {robots.map(item => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherEquipment.map(item => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Equipment;
