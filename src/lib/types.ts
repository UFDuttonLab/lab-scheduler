export interface Equipment {
  id: string;
  name: string;
  type: "robot" | "equipment";
  status: "available" | "in-use" | "maintenance";
  location: string;
  description?: string;
  compatibleProjects?: string[]; // Array of project IDs
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string; // For calendar color coding
}

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  studentName: string;
  studentEmail: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Duration in minutes
  projectId?: string;
  projectName?: string;
  purpose?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
}

export interface TimeSlot {
  time: string;
  available: boolean;
  booking?: Booking;
}
