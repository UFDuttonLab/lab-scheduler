import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@/lib/types";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
}

const Settings = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#fb6502");

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name);
      setProjectDescription(editingProject.description || "");
      setProjectColor(editingProject.color || "#fb6502");
    } else {
      setProjectName("");
      setProjectDescription("");
      setProjectColor("#fb6502");
    }
  }, [editingProject]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update({
            name: projectName,
            description: projectDescription,
            color: projectColor
          })
          .eq("id", editingProject.id);

        if (error) throw error;

        setProjects(prev => prev.map(p =>
          p.id === editingProject.id
            ? { ...p, name: projectName, description: projectDescription, color: projectColor }
            : p
        ));
        toast.success("Project updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            name: projectName,
            description: projectDescription,
            color: projectColor
          })
          .select()
          .single();

        if (error) throw error;

        setProjects(prev => [...prev, data]);
        toast.success("Project added successfully!");
      }

      setIsAddProjectDialogOpen(false);
      setEditingProject(null);
      setProjectName("");
      setProjectDescription("");
      setProjectColor("#fb6502");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(`Failed to ${editingProject ? "update" : "add"} project`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success("Project deleted");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success("User removed");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to remove user");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2">Lab Configuration</h1>
            <p className="text-muted-foreground">
              Manage lab projects and equipment settings
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Lab Projects</h2>
                <p className="text-sm text-muted-foreground">
                  Manage projects that students can select when booking equipment
                </p>
              </div>
              <Dialog open={isAddProjectDialogOpen} onOpenChange={(open) => {
                setIsAddProjectDialogOpen(open);
                if (!open) {
                  setEditingProject(null);
                  setProjectName("");
                  setProjectDescription("");
                  setProjectColor("#fb6502");
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
                  <DialogDescription>
                    {editingProject ? "Update project information" : "Create a new lab project that students can select"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input 
                      placeholder="e.g., Quantum Computing Research" 
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea 
                      placeholder="Brief description of the project" 
                      rows={3}
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Calendar Color</Label>
                    <Input 
                      type="color" 
                      value={projectColor}
                      onChange={(e) => setProjectColor(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingProject ? "Update Project" : "Add Project"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.length === 0 ? (
                <p className="col-span-2 text-center text-muted-foreground py-8">
                  No projects yet. Add your first project to get started.
                </p>
              ) : (
                projects.map(project => (
                  <Card key={project.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div 
                          className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-muted-foreground">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingProject(project);
                            setIsAddProjectDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Registered Users</h2>
                <p className="text-sm text-muted-foreground">
                  View all users registered in the system
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.length === 0 ? (
                <p className="col-span-2 text-center text-muted-foreground py-8">
                  No users registered yet.
                </p>
              ) : (
                users.map(user => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {user.full_name || "No name set"}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
