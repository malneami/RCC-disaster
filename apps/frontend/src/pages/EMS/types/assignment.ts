export interface EMSAssignment {
  id: string;
  ticketId: string;
  ambulanceId: string;
  driverId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
  assignedAt: Date;
  estimatedArrivalTime?: Date;
  actualArrivalTime?: Date;
  journeyStartTime?: Date;
  journeyEndTime?: Date;
  distanceKm?: number;
  notes?: string;

  // ETA Fields
  estimatedArrivalMinutes?: number;
  lastEtaUpdateTime?: Date | string; // Date or string from API
  etaToOrigin?: number;
  etaToDestination?: number;
  routeDistanceKm?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    priority: string;
    status: string;
    patient?: {
      firstName: string;
      lastName: string;
    };
  };
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AssignmentFilters {
  status?: string;
  priority?: string;
  ambulanceId?: string;
  driverId?: string;
  ticketId?: string;
  assignedAfter?: Date;
  assignedBefore?: Date;
  search?: string;
}

export interface CreateAssignmentData {
  ticketId: string;
  ambulanceId: string;
  driverId: string;
  assignedAt: string;
  status: string;
  estimatedArrivalTime?: string;
  notes?: string;
}

export interface UpdateAssignmentData extends Partial<CreateAssignmentData> {}


