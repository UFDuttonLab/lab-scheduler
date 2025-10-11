import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, X, FlaskConical } from "lucide-react";
import { Project, ProjectSample } from "@/lib/types";

interface ProjectSampleSelectorProps {
  projects: Project[];
  value: ProjectSample[];
  onChange: (value: ProjectSample[]) => void;
  maxTotal?: number;
}

export const ProjectSampleSelector = ({ 
  projects, 
  value, 
  onChange, 
  maxTotal = 300 
}: ProjectSampleSelectorProps) => {
  const [error, setError] = useState<string>("");

  const totalSamples = value.reduce((sum, ps) => sum + ps.samples, 0);
  const usedProjectIds = new Set(value.map(ps => ps.projectId));
  const availableProjects = projects.filter(p => !usedProjectIds.has(p.id));

  const addProjectSample = () => {
    if (availableProjects.length === 0) {
      setError("All projects have been added");
      return;
    }
    const firstAvailable = availableProjects[0];
    onChange([
      ...value,
      { projectId: firstAvailable.id, projectName: firstAvailable.name, samples: 1 }
    ]);
    setError("");
  };

  const removeProjectSample = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setError("");
  };

  const updateProjectId = (index: number, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      projectId,
      projectName: project?.name
    };
    onChange(newValue);
    setError("");
  };

  const updateSamples = (index: number, samples: number) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], samples };
    
    const newTotal = newValue.reduce((sum, ps) => sum + ps.samples, 0);
    if (newTotal > maxTotal) {
      setError(`Total samples cannot exceed ${maxTotal}`);
      return;
    }
    
    onChange(newValue);
    setError("");
  };

  const hasError = value.length === 0 || totalSamples < 1 || totalSamples > maxTotal;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {value.map((ps, index) => (
          <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select
                  value={ps.projectId}
                  onValueChange={(projectId) => updateProjectId(index, projectId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {projects
                      .filter(p => p.id === ps.projectId || !usedProjectIds.has(p.id))
                      .map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Samples</label>
                  <span className="text-sm font-semibold text-primary">{ps.samples}</span>
                </div>
                <Slider
                  value={[ps.samples]}
                  onValueChange={(val) => updateSamples(index, val[0])}
                  min={1}
                  max={maxTotal}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {value.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeProjectSample(index)}
                className="mt-7 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addProjectSample}
        disabled={availableProjects.length === 0}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
        <div className="flex items-center gap-2 font-semibold">
          <FlaskConical className="w-5 h-5 text-primary" />
          <span>Total Samples:</span>
        </div>
        <span className={`text-lg font-bold ${hasError ? 'text-destructive' : 'text-primary'}`}>
          {totalSamples} / {maxTotal}
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {hasError && !error && (
        <p className="text-sm text-destructive">
          {value.length === 0 
            ? "Please add at least one project" 
            : totalSamples < 1 
            ? "Total samples must be at least 1" 
            : `Total samples cannot exceed ${maxTotal}`}
        </p>
      )}
    </div>
  );
};
