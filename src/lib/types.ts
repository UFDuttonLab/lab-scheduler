export interface Equipment {
  id: string;
  name: string;
  type: "robot" | "equipment";
  status: "available" | "in-use" | "maintenance";
  location: string;
  description?: string;
}

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  studentName: string;
  studentEmail: string;
  startTime: Date;
  endTime: Date;
  purpose?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
}

export interface TimeSlot {
  time: string;
  available: boolean;
  booking?: Booking;
}
