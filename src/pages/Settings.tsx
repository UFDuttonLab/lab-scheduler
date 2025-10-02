import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@/lib/types";
import { Plus, Trash2, Edit, Loader2, Pencil, User, Mail, Smile, Tag } from "lucide-react";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { IconPicker } from "@/components/IconPicker";
import { supabase } from "@/integrations/supabase/client";
import { DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, AppRole } from "@/lib/permissions";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  spirit_animal?: string;
}

interface AppVersion {
  id: string;
  version: string;
  released_at: string;
  changes: any;
  released_by: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
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
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddVersionDialogOpen, setIsAddVersionDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectIcon, setProjectIcon] = useState("🧪");

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchVersions();
    fetchCurrentUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name);
      setProjectDescription(editingProject.description || "");
      setProjectIcon(editingProject.icon || "🧪");
    } else {
      setProjectName("");
      setProjectDescription("");
      setProjectIcon("🧪");
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

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from("app_versions")
        .select(`
          *,
          profiles:released_by (
            full_name,
            email
          )
        `)
        .order("released_at", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to load versions");
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const version = formData.get("version") as string;
    const changesText = formData.get("changes") as string;

    // Parse changes - expect each line to be a change
    const changes = changesText
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const trimmed = line.trim();
        // Try to detect type from prefix
        if (trimmed.toLowerCase().startsWith("feature:") || trimmed.toLowerCase().startsWith("feat:")) {
          return { type: "feature", description: trimmed.replace(/^(feature|feat):\s*/i, "") };
        } else if (trimmed.toLowerCase().startsWith("fix:") || trimmed.toLowerCase().startsWith("bugfix:")) {
          return { type: "fix", description: trimmed.replace(/^(fix|bugfix):\s*/i, "") };
        } else if (trimmed.toLowerCase().startsWith("improvement:") || trimmed.toLowerCase().startsWith("enhance:")) {
          return { type: "improvement", description: trimmed.replace(/^(improvement|enhance):\s*/i, "") };
        } else {
          return { type: "change", description: trimmed };
        }
      });

    try {
      const { error } = await supabase
        .from("app_versions")
        .insert({
          version,
          changes,
          released_by: currentUser.id
        });

      if (error) throw error;

      toast.success("Version released successfully!");
      setIsAddVersionDialogOpen(false);
      fetchVersions();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error("Error creating version:", error);
      toast.error(error.message || "Failed to create version");
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
      setProjectIcon("🧪");
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
      toast.error(data?.error || "Failed to create user");
      console.error(error || data?.error);
      return;
    }

    const password = data?.password;
    toast.success(
      password 
        ? `User created! Password: ${password}` 
        : "User created successfully",
      { duration: 10000 }
    );
    
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

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user? They will no longer be able to log in or create bookings.")) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("You must be logged in");
        return;
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          userId
        }
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to deactivate user");
        console.error(error || data?.error);
        return;
      }

      toast.success("User deactivated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
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
                  setProjectIcon("🧪");
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
                  return (
                    <Card key={project.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                            {project.icon || "🧪"}
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
                          onClick={() => handleDeactivateUser(user.id)}
                          title="Deactivate user"
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

          {/* Version Management Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Version History</h2>
                <p className="text-sm text-muted-foreground">
                  Track application releases and changelog
                </p>
              </div>
              <Dialog open={isAddVersionDialogOpen} onOpenChange={setIsAddVersionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Tag className="w-4 h-4 mr-2" />
                    Release New Version
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Release New Version</DialogTitle>
                    <DialogDescription>
                      Create a new version release with changelog entries
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddVersion} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="version">Version Number *</Label>
                      <Input
                        id="version"
                        name="version"
                        placeholder="e.g., 1.2.0"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Follow semantic versioning: MAJOR.MINOR.PATCH
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="changes">Changelog *</Label>
                      <Textarea
                        id="changes"
                        name="changes"
                        placeholder="Feature: Added new feature&#10;Fix: Fixed bug&#10;Improvement: Enhanced performance"
                        rows={8}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter one change per line. Prefix with Feature:, Fix:, or Improvement: to categorize
                      </p>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddVersionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Release Version</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {versions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No versions released yet.
                </p>
              ) : (
                versions.map(version => (
                  <Card key={version.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-sm">
                            v{version.version}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(version.released_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {version.profiles && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Released by {version.profiles.full_name || version.profiles.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {version.changes && version.changes.length > 0 ? (
                        version.changes.map((change: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Badge 
                              variant={
                                change.type === 'feature' ? 'default' : 
                                change.type === 'fix' ? 'destructive' : 
                                'secondary'
                              }
                              className="text-xs mt-0.5"
                            >
                              {change.type}
                            </Badge>
                            <span className="flex-1">{change.description}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No changelog entries</p>
                      )}
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
              Create a new user account. A temporary password will be generated that you can provide to them.
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
                  The user's login email address
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
                    <SelectItem value="pi">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.pi}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.pi}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="postdoc">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.postdoc}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.postdoc}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="grad_student">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.grad_student}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.grad_student}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="undergrad_student">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.undergrad_student}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.undergrad_student}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.user}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.user}</span>
                      </div>
                    </SelectItem>
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
                    <SelectItem value="pi">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.pi}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.pi}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="postdoc">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.postdoc}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.postdoc}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="grad_student">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.grad_student}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.grad_student}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="undergrad_student">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.undergrad_student}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.undergrad_student}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS.user}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.user}</span>
                      </div>
                    </SelectItem>
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
      <Footer />
    </div>
  );
};

export default Settings;
