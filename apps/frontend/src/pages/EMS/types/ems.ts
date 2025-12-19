export interface Ambulance {
  id: string;
  callSign: string;
  plateNumber: string;
  type: 'BASIC' | 'ADVANCED' | 'CRITICAL_CARE';
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  vehicleImei: string;
  capacity: number;
  equipment?: string;
  currentLocationLat?: number;
  currentLocationLng?: number;
  currentLocationAddress?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  driverId?: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

export interface EMSAssignment {
  id: string;
  ticketId: string;
  ambulanceId: string;
  driverId: string;
  status: 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
  assignedAt: Date;
  emsContactTime?: Date;
  actualArrivalTime?: Date;
  journeyStartTime?: Date;
  journeyEndTime?: Date;
  distanceKm?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    priority: string;
    status: string;
    pathway?: string;
    createdAt?: string;
    isEmergency?: boolean;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    originHospital?: {
      id: string;
      name: string;
    };
    destinationHospital?: {
      id: string;
      name: string;
    };
  };
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
    type: string;
    status: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

export interface GPSTrackingLog {
  id: string;
  ambulanceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
  timestamp: Date;
  engineStatus?: boolean;
  locationAddress?: string;
  accuracy?: number;
  createdAt: Date;
  ambulance?: {
    id: string;
    callSign: string;
  };
}

export interface DriverSchedule {
  id: string;
  driverId: string;
  ambulanceId: string;
  shiftType: 'DAY' | 'NIGHT' | 'OVERTIME';
  shiftStart: Date;
  shiftEnd: Date;
  date: Date;
  status: 'SCHEDULED' | 'ACTIVE' | 'ON_BREAK' | 'COMPLETED' | 'CANCELLED';
  breakStart?: Date;
  breakEnd?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
  };
}

export interface EMSPerformanceMetric {
  id: string;
  ambulanceId: string;
  date: Date;
  totalTransfers: number;
  averageResponseTime: number;
  averageTransferTime: number;
  totalDistanceKm: number;
  maintenanceHours: number;
  driverRating: number;
  patientSatisfactionScore: number;
  onTimeArrivals: number;
  delayedArrivals: number;
  cancelledTransfers: number;
  equipmentFailures: number;
  createdAt: Date;
  updatedAt: Date;
  ambulance?: {
    id: string;
    callSign: string;
  };
}

export interface EMSAlert {
  id: string;
  type: 'MAINTENANCE_DUE' | 'DRIVER_OVERTIME' | 'SPEED_VIOLATION' | 'EQUIPMENT_FAILURE' | 'EMERGENCY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  ambulanceId?: string;
  driverId?: string;
  assignmentId?: string;
  acknowledgedAt?: Date;
  acknowledgedById?: string;
  resolvedAt?: Date;
  resolvedById?: string;
  createdAt: Date;
  updatedAt: Date;
  ambulance?: {
    id: string;
    callSign: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface EMSDashboardData {
  summary: {
    totalAmbulances: number;
    activeAmbulances: number;
    availableAmbulances: number;
    activeAssignments: number;
    activeSchedules: number;
    totalAssignments?: number;
    todayCompletedAssignments?: number;
    responseTime?: number;
    averageResponseTime?: number;
    pendingTickets?: number;
    assignedAssignments?: number;
    inTransportAssignments?: number;
    totalCompletedAssignments?: number;
  };
  recentAlerts: EMSAlert[];
  recentAssignments?: Array<{
    id: string;
    ticketNumber?: string;
    status: string;
    assignedAt: Date | string;
    patientName: string;
    ambulanceCallSign?: string;
    driverName?: string | null;
    priority?: string;
  }>;
  upcomingSchedules?: Array<{
    id: string;
    shiftStart: Date | string;
    shiftEnd: Date | string;
    driverName: string;
  }>;
  assignmentsByStatus?: Record<string, number>;
  timestamp: string;
}

export interface CreateAmbulanceDto {
  vehicleImei: string;
  callSign: string;
  plateNumber: string;
  type: string;
  status: string;
  manufacturer?: string;
  model: string;
  year: number;
  vin?: string;
  baseStation: string;
  currentLocationLat?: number;
  currentLocationLng?: number;
  currentLocationAddress?: string;
  driverName?: string;
  driverPhone?: string;
  driverId?: string;
  equipmentStatus: string;
  isActive: boolean;
}

export interface UpdateAmbulanceDto extends Partial<CreateAmbulanceDto> {}

export interface CreateEMSAssignmentDto {
  ticketId: string;
  ambulanceId: string;
  driverId: string;
  assignedAt: string;
  status: 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
  emsContactTime?: string;
  actualArrivalTime?: string;
  journeyStartTime?: string;
  journeyEndTime?: string;
  distanceKm?: number;
  notes?: string;
}

export interface UpdateEMSAssignmentDto {
  ambulanceId?: string;
  driverId?: string;
  status?: 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
  assignedAt?: string;
  emsContactTime?: string;
  actualArrivalTime?: string;
  journeyStartTime?: string;
  journeyEndTime?: string;
  distanceKm?: number;
  notes?: string;
}

export interface CreateDriverScheduleDto {
  driverId: string;
  ambulanceId: string;
  shiftType: 'DAY' | 'NIGHT' | 'OVERTIME';
  shiftStart: string;
  shiftEnd: string;
  date: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ON_BREAK' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface UpdateDriverScheduleDto {
  shiftType?: 'DAY' | 'NIGHT' | 'OVERTIME';
  shiftStart?: string;
  shiftEnd?: string;
  date?: string;
  status?: 'SCHEDULED' | 'ACTIVE' | 'ON_BREAK' | 'COMPLETED' | 'CANCELLED';
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

export interface AmbulanceFilter {
  status?: string;
  type?: string;
  isActive?: boolean;
  search?: string;
}

export interface AssignmentFilter {
  status?: string;
  priority?: string;
  ambulanceId?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GPSTrackingFilter {
  ambulanceId?: string;
  dateFrom?: string;
  dateTo?: string;
  minSpeed?: number;
  maxSpeed?: number;
}
