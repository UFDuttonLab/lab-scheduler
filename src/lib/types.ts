export interface Equipment {
  id: string;
  name: string;
  type: "robot" | "equipment" | "quantification" | "PCR" | "HiPerGator" | "Sequencer";
  status: "available" | "in-use" | "maintenance";
  location: string;
  description?: string;
  icon?: string;
  maxCpuCount?: number;
  maxGpuCount?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string; // Icon name from Lucide
  color?: string; // Deprecated, kept for backwards compatibility
}

export interface UsageRecord {
  id: string;
  userId: string;
  equipmentId: string;
  equipmentName?: string;
  projectId?: string;
  projectName?: string;
  startTime: Date;
  endTime: Date;
  samplesProcessed?: number;
  notes?: string;
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  studentName: string;
  studentEmail: string;
  studentSpiritAnimal?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Duration in minutes
  projectId?: string;
  projectName?: string;
  purpose?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  cpuCount?: number; // For HiPerGator bookings
  gpuCount?: number; // For HiPerGator bookings
  samplesProcessed?: number; // Number of samples (1-100)
  collaborators?: string[]; // Array of user IDs
  userId?: string; // Owner of the booking
  source?: 'booking' | 'usage_record'; // Source table for proper deletion
}

export interface TimeSlot {
  time: string;
  available: boolean;
  booking?: Booking;
}
