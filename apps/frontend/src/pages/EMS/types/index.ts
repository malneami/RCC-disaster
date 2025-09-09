// Export all EMS types from individual files
export * from './ambulance';
export * from './assignment';
export * from './schedule';
export * from './tracking';
export * from './performance';
export * from './alerts';

// Common types used across multiple modules
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  phoneNumber?: string;
  email?: string;
}

export interface EquipmentInventory {
  id: string;
  ambulanceId: string;
  equipmentType: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  status: 'OPERATIONAL' | 'MAINTENANCE_REQUIRED' | 'OUT_OF_SERVICE' | 'REPLACED';
  lastInspectionDate?: Date;
  nextInspectionDue?: Date;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  location: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
  };
}

export interface MaintenanceRecord {
  id: string;
  ambulanceId: string;
  equipmentId?: string;
  type: 'ROUTINE' | 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  description: string;
  workPerformed?: string;
  scheduledDate?: Date;
  startDate?: Date;
  endDate?: Date;
  cost?: number;
  technician?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
  };
  equipment?: {
    id: string;
    equipmentType: string;
    serialNumber: string;
  };
}


