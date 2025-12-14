export interface EMSAlert {
  id: string;
  type: 'MAINTENANCE_DUE' | 'DRIVER_OVERTIME' | 'SPEED_VIOLATION' | 'EQUIPMENT_FAILURE' | 'EMERGENCY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  ambulanceId?: string;
  driverId?: string;
  equipmentId?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedAt?: Date;
  acknowledgedById?: string;
  resolvedAt?: Date;
  resolvedById?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
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
  equipment?: {
    id: string;
    equipmentType: string;
    serialNumber: string;
  };
  acknowledgedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  resolvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AlertFilters {
  type?: string;
  priority?: string;
  status?: string;
  ambulanceId?: string;
  driverId?: string;
  equipmentId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
}

export interface CreateAlertData {
  type: string;
  priority: string;
  message: string;
  ambulanceId?: string;
  driverId?: string;
  equipmentId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAlertData extends Partial<CreateAlertData> {
  status?: string;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  resolvedAt?: string;
  resolvedById?: string;
}


