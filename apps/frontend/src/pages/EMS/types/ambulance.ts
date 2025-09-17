export interface Ambulance {
  id: string;
  callSign: string;
  plateNumber: string;
  type: 'BASIC' | 'ADVANCED' | 'CRITICAL_CARE';
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  vehicleImei: string;
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
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  equipmentStatus: 'OPERATIONAL' | 'MAINTENANCE_REQUIRED' | 'OUT_OF_SERVICE' | 'REPLACED';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
}

export interface AmbulanceFilters {
  status?: string;
  type?: string;
  equipmentStatus?: string;
  baseStation?: string;
  driverId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateAmbulanceData {
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

export interface UpdateAmbulanceData extends Partial<CreateAmbulanceData> {}
