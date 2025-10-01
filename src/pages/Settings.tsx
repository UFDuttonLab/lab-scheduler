import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockProjects, mockStudents } from "@/lib/mockData";
import { Project, Student } from "@/lib/types";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Project added successfully!");
    setIsAddProjectDialogOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    toast.success("Project deleted");
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Student added successfully!");
    setIsAddStudentDialogOpen(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(students.filter(s => s.id !== studentId));
    toast.success("Student removed");
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

        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Lab Projects</h2>
                <p className="text-sm text-muted-foreground">
                  Manage projects that students can select when booking equipment
                </p>
              </div>
              <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription>
                    Create a new lab project that students can select
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input placeholder="e.g., Quantum Computing Research" required />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea 
                      placeholder="Brief description of the project" 
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Calendar Color</Label>
                    <Input type="color" defaultValue="#fb6502" />
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
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
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Registered Students</h2>
                <p className="text-sm text-muted-foreground">
                  Manage students who can book equipment
                </p>
              </div>
              <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Register a student to enable quick booking selection
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Student Name</Label>
                      <Input placeholder="e.g., John Smith" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="john.smith@ufl.edu" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Department (Optional)</Label>
                      <Input placeholder="e.g., Electrical Engineering" />
                    </div>

                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map(student => (
                <Card key={student.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      {student.department && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {student.department}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
