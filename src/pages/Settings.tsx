import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@/lib/types";
import { Plus, Trash2, Edit, Loader2, Pencil, User, Mail, Smile } from "lucide-react";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { IconPicker } from "@/components/IconPicker";
import { supabase } from "@/integrations/supabase/client";
import { DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  spirit_animal?: string;
}

const SPIRIT_ANIMALS = [
  { value: "🦁", label: "🦁 Lion" },
  { value: "🐯", label: "🐯 Tiger" },
  { value: "🐻", label: "🐻 Bear" },
  { value: "🦊", label: "🦊 Fox" },
  { value: "🐺", label: "🐺 Wolf" },
  { value: "🦅", label: "🦅 Eagle" },
  { value: "🦉", label: "🦉 Owl" },
  { value: "🐬", label: "🐬 Dolphin" },
  { value: "🦈", label: "🦈 Shark" },
  { value: "🐉", label: "🐉 Dragon" },
  { value: "🦄", label: "🦄 Unicorn" },
  { value: "🐼", label: "🐼 Panda" },
  { value: "🦘", label: "🦘 Kangaroo" },
  { value: "🦒", label: "🦒 Giraffe" },
  { value: "🐘", label: "🐘 Elephant" },
];

const Settings = () => {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectIcon, setProjectIcon] = useState("Beaker");

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchCurrentUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name);
      setProjectDescription(editingProject.description || "");
      setProjectIcon(editingProject.icon || "Beaker");
    } else {
      setProjectName("");
      setProjectDescription("");
      setProjectIcon("Beaker");
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
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge profiles with their roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const fetchCurrentUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error("Error fetching current user profile:", error);
    }
  };

  const handleUpdateSpiritAnimal = async (spiritAnimal: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ spirit_animal: spiritAnimal })
        .eq("id", currentUser.id);

      if (error) throw error;

      setCurrentUserProfile(prev => prev ? { ...prev, spirit_animal: spiritAnimal } : null);
      toast.success("Spirit animal updated!");
    } catch (error) {
      console.error("Error updating spirit animal:", error);
      toast.error("Failed to update spirit animal");
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
            icon: projectIcon
          })
          .eq("id", editingProject.id);

        if (error) throw error;

        setProjects(prev => prev.map(p =>
          p.id === editingProject.id
            ? { ...p, name: projectName, description: projectDescription, icon: projectIcon }
            : p
        ));
        toast.success("Project updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            name: projectName,
            description: projectDescription,
            icon: projectIcon
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
      setProjectIcon("Beaker");
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

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as string;
    const spiritAnimal = formData.get("spiritAnimal") as string;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error("You must be logged in");
      return;
    }

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: {
        action: 'create',
        email,
        fullName,
        role,
        spiritAnimal
      }
    });

    if (error || data?.error) {
      toast.error(data?.error || "Failed to send invitation");
      console.error(error || data?.error);
      return;
    }

    toast.success("Invitation email sent successfully!");
    setIsAddUserDialogOpen(false);
    fetchUsers();
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const spiritAnimal = formData.get("spiritAnimal") as string;
    const newRole = formData.get("role") as string;

    if (!editingUser) return;

    const currentRole = (editingUser as any).user_roles?.[0]?.role;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: fullName,
          spirit_animal: spiritAnimal || null
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      // Update role if changed
      if (newRole && newRole !== currentRole) {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          toast.error("You must be logged in");
          return;
        }

        const { data, error: roleError } = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'updateRole',
            userId: editingUser.id,
            role: newRole
          }
        });

        if (roleError || data?.error) {
          toast.error(data?.error || "Failed to update role");
          console.error(roleError || data?.error);
          return;
        }
      }

      setUsers(prev => prev.map(u => 
        u.id === editingUser.id ? { ...u, full_name: fullName, spirit_animal: spiritAnimal } : u
      ));
      
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      toast.success("User updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
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
          {/* My Profile Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">My Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Personalize your profile with a spirit animal
                </p>
              </div>
            </div>
            
            {currentUserProfile && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
                    {currentUserProfile.spirit_animal || <User className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="font-semibold">{currentUserProfile.full_name || "No name set"}</p>
                    <p className="text-sm text-muted-foreground">{currentUserProfile.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Your Spirit Animal</Label>
                  <Select 
                    value={currentUserProfile.spirit_animal || ""} 
                    onValueChange={handleUpdateSpiritAnimal}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your spirit animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPIRIT_ANIMALS.map(animal => (
                        <SelectItem key={animal.value} value={animal.value}>
                          {animal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Your spirit animal will appear next to your name throughout the app
                  </p>
                </div>
              </div>
            )}
          </Card>

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
                  setProjectIcon("Beaker");
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
                    <Label>Project Icon</Label>
                    <IconPicker value={projectIcon} onChange={setProjectIcon} />
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
                projects.map(project => {
                  const ProjectIcon = project.icon
                    ? (Icons[project.icon as keyof typeof Icons] as LucideIcon)
                    : Icons.Beaker;
                  
                  return (
                    <Card key={project.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                            <ProjectIcon className="w-5 h-5 text-primary" />
                          </div>
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
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Registered Users</h2>
                <p className="text-sm text-muted-foreground">
                  View and manage all users registered in the system
                </p>
              </div>
              <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
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
                      <div className="flex items-start gap-2 flex-1">
                        {user.spirit_animal && (
                          <span className="text-2xl">{user.spirit_animal}</span>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {user.full_name || "No name set"}
                            </h3>
                            {(user as any).user_roles?.[0]?.role && (
                              <Badge variant={(user as any).user_roles[0].role === 'manager' ? 'default' : 'secondary'}>
                                {(user as any).user_roles[0].role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditUserDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
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
          </div>
        )}

        {/* Add User Dialog */}
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Send an email invitation to a new user. They will set their own password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  An invitation email will be sent to this address
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-fullName">Full Name *</Label>
                <Input
                  id="add-fullName"
                  name="fullName"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-role">Role *</Label>
                <Select name="role" defaultValue="user">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-spiritAnimal">Spirit Animal</Label>
                <Select name="spiritAnimal">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose spirit animal (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPIRIT_ANIMALS.map((animal) => (
                      <SelectItem key={animal.value} value={animal.value}>
                        {animal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={editingUser?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={editingUser?.full_name || ""}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={(editingUser as any)?.user_roles?.[0]?.role || "user"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spiritAnimal">Spirit Animal</Label>
                <Select name="spiritAnimal" defaultValue={editingUser?.spirit_animal || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose spirit animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPIRIT_ANIMALS.map(animal => (
                      <SelectItem key={animal.value} value={animal.value}>
                        {animal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Settings;
