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
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
  };
}

export interface TrackingFilters {
  ambulanceId?: string;
  startDate?: Date;
  endDate?: Date;
  minSpeed?: number;
  maxSpeed?: number;
  search?: string;
}

export interface CreateTrackingLogData {
  ambulanceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
  timestamp: string;
  engineStatus?: boolean;
  locationAddress?: string;
  accuracy?: number;
}

export interface UpdateTrackingLogData extends Partial<CreateTrackingLogData> {}

export interface AmbulanceLocation {
  id: string;
  callSign: string;
  latitude: number;
  longitude: number;
  status: string;
  speed?: number;
  direction?: number;
  driver?: {
    firstName: string;
    lastName: string;
  };
  lastUpdate: Date;
}


