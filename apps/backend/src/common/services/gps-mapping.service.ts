import { Injectable } from '@nestjs/common';

interface GPSObject {
  imei: string;
  protocol?: string;
  net_protocol?: string;
  ip?: string;
  port?: string;
  active?: string;
  object_expire?: string;
  object_expire_dt?: string;
  dt_server?: string;
  dt_tracker?: string;
  lat: string;
  lng: string;
  altitude?: string;
  angle?: string;
  speed: string;
  params?: any;
  loc_valid?: string;
  dt_last_stop?: string;
  dt_last_idle?: string;
  dt_last_move?: string;
  fcr?: any;
  name?: string;
  device?: string;
  sim_number?: string;
  model?: string;
  vin?: string;
  plate_number?: string;
  odometer?: string;
  engine_hours?: string;
  icon?: string;
  custom_fields?: any[];
}

export interface MappedGPSAmbulance {
  imei: string;
  name?: string;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  speed: number;
  direction?: number;
  altitude?: number;
  timestamp?: string;
  lastUpdate?: string;
  [key: string]: any;
}

@Injectable()
export class GPSMappingService {
  /**
   * Maps a GPS object from the TawasolMap API to a standardized format
   * @param gpsObject - Raw GPS object from the API
   * @returns Mapped GPS ambulance data
   */
  mapGPSObjectToAmbulance(gpsObject: GPSObject): MappedGPSAmbulance {
    return {
      imei: gpsObject.imei,
      name: gpsObject.name,
      lat: parseFloat(gpsObject.lat),
      lng: parseFloat(gpsObject.lng),
      latitude: parseFloat(gpsObject.lat),
      longitude: parseFloat(gpsObject.lng),
      speed: parseFloat(gpsObject.speed) || 0,
      direction: gpsObject.angle ? parseFloat(gpsObject.angle) : undefined,
      altitude: gpsObject.altitude ? parseFloat(gpsObject.altitude) : undefined,
      timestamp: gpsObject.dt_tracker,
      lastUpdate: gpsObject.dt_tracker,
    };
  }

  /**
   * Maps an array of GPS objects to standardized format
   * @param gpsObjects - Array of raw GPS objects from the API
   * @returns Array of mapped GPS ambulance data
   */
  mapGPSObjects(gpsObjects: GPSObject[]): MappedGPSAmbulance[] {
    return gpsObjects.map(obj => this.mapGPSObjectToAmbulance(obj));
  }
}

