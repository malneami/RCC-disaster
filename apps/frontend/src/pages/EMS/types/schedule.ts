export interface DriverSchedule {
  id: string;
  driverId: string;
  ambulanceId: string;
  shiftStart: Date;
  shiftEnd: Date;
  shiftType: 'DAY' | 'NIGHT' | 'OVERTIME';
  status: 'SCHEDULED' | 'ACTIVE' | 'ON_BREAK' | 'COMPLETED' | 'CANCELLED';
  breakStart?: Date;
  breakEnd?: Date;
  overtimeHours?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
  };
}

export interface ScheduleFilters {
  driverId?: string;
  ambulanceId?: string;
  shiftType?: string;
  status?: string;
  shiftStartAfter?: Date;
  shiftStartBefore?: Date;
  search?: string;
}

export interface CreateScheduleData {
  driverId: string;
  ambulanceId: string;
  shiftStart: string;
  shiftEnd: string;
  shiftType: string;
  status: string;
  breakStart?: string;
  breakEnd?: string;
  overtimeHours?: number;
  notes?: string;
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {}


