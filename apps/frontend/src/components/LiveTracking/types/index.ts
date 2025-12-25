export interface AmbulanceGPSData {
  id: string;
  vehicleImei: string;
  callSign: string;
  plateNumber: string;
  type: 'BASIC' | 'ADVANCED' | 'CRITICAL_CARE';
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
  address?: string;
  lastUpdate: Date;
  engineStatus?: boolean;
  accuracy?: number;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
  assignment?: {
    id: string;
    ticketId: string;
    status: string;
    priority?: string;
    estimatedArrivalMinutes?: number;
  };
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
}

export interface MapFilters {
  status?: string[];
  type?: string[];
  hasDriver?: boolean;
  searchQuery?: string;
}

export interface MapLegendItem {
  label: string;
  color: string;
  icon?: string;
  count?: number;
}

export interface GPSAPIResponse {
  status: boolean;
  data: any[];
  timestamp?: string;
}

