// Project color palette and utilities

export const PROJECT_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#84cc16", // Lime
  "#06b6d4", // Cyan
  "#a855f7", // Purple
  "#eab308", // Yellow
  "#f43f5e", // Rose
  "#22c55e", // Emerald
  "#d946ef", // Fuchsia
  "#0ea5e9", // Sky
  "#64748b", // Slate
  "#dc2626", // Red (darker)
  "#059669", // Green (darker)
  "#ca8a04", // Yellow (darker)
  "#9333ea", // Purple (darker)
  "#db2777", // Pink (darker)
  "#0891b2", // Cyan (darker)
];

export interface ProjectWithColor {
  id: string;
  color?: string | null;
}

/**
 * Get the next available color from the palette that is not used by existing projects
 */
export function getNextAvailableColor(projects: ProjectWithColor[]): string {
  const usedColors = new Set(
    projects
      .map(p => p.color)
      .filter((color): color is string => color != null)
  );
  
  // Find first color not in use
  const availableColor = PROJECT_COLORS.find(color => !usedColors.has(color));
  
  // If all colors are used, return the first color (allow reuse)
  return availableColor || PROJECT_COLORS[0];
}

/**
 * Get a consistent color for a project (with fallback)
 */
export function getProjectColor(projectId: string, projects: ProjectWithColor[]): string {
  const project = projects.find(p => p.id === projectId);
  return project?.color || "#8884d8"; // Default fallback color
}

/**
 * Get colors that are already in use by projects
 */
export function getUsedColors(projects: ProjectWithColor[]): Set<string> {
  return new Set(
    projects
      .map(p => p.color)
      .filter((color): color is string => color != null)
  );
}
