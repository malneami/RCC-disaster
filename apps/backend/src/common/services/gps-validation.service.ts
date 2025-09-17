import { Injectable, Logger } from '@nestjs/common';
import { GpsLocation, VehicleStatus } from './gps-api.service';
import { GpsLoggingService } from './gps-logging.service';

export interface GPSValidationResult {
  isValid: boolean;
  error?: string;
  accuracy?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface RouteValidationResult {
  isValid: boolean;
  deviation?: number;
  error?: string;
}

@Injectable()
export class GpsValidationService {
  private readonly logger = new Logger(GpsValidationService.name);
  
  constructor(private gpsLoggingService: GpsLoggingService) {}
  
  private readonly validationRules = {
    maxAge: 300000, // 5 minutes in milliseconds
    maxSpeed: 120, // km/h
    minAccuracy: 10, // meters
    maxDeviation: 1000, // meters
    // Saudi Arabia bounds
    bounds: {
      minLat: 16.0,
      maxLat: 32.0,
      minLng: 34.0,
      maxLng: 55.0
    }
  };

  /**
   * Validate GPS location data
   */
  async validateLocation(location: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    speed?: number;
    accuracy?: number;
  }): Promise<GPSValidationResult> {
    try {
      // 1. Check coordinate bounds (Saudi Arabia)
      if (!this.isWithinBounds(location.latitude, location.longitude)) {
        return {
          isValid: false,
          error: 'Coordinates outside operational area'
        };
      }

      // 2. Check timestamp freshness
      const age = Date.now() - new Date(location.timestamp).getTime();
      if (age > this.validationRules.maxAge) {
        return {
          isValid: false,
          error: 'GPS data is stale'
        };
      }

      // 3. Check speed reasonableness
      if (location.speed && location.speed > this.validationRules.maxSpeed) {
        return {
          isValid: false,
          error: 'Speed exceeds maximum limit'
        };
      }

      // 4. Check accuracy
      if (location.accuracy && location.accuracy > this.validationRules.minAccuracy) {
        return {
          isValid: false,
          error: 'GPS accuracy insufficient'
        };
      }

      const result = {
        isValid: true,
        accuracy: location.accuracy || 5,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      };

      // Log validation result
      await this.gpsLoggingService.logValidationFailure('unknown', 'Validation failed');

      return result;
    } catch (error) {
      this.logger.error('GPS validation error:', error);
      const result = {
        isValid: false,
        error: `Validation error: ${(error as Error).message}`
      };

      // Log validation error
      await this.gpsLoggingService.logValidationFailure('unknown', 'Validation failed');

      return result;
    }
  }

  /**
   * Validate route adherence
   */
  async validateRoute(
    vehicleId: string,
    currentLocation: { latitude: number; longitude: number },
    plannedRoute: Array<{ latitude: number; longitude: number }>
  ): Promise<RouteValidationResult> {
    try {
      // Calculate distance to nearest point on planned route
      let minDistance = Infinity;
      
      for (const routePoint of plannedRoute) {
        const distance = this.calculateDistance(currentLocation, routePoint);
        minDistance = Math.min(minDistance, distance);
      }

      if (minDistance > this.validationRules.maxDeviation) {
        return {
          isValid: false,
          deviation: minDistance,
          error: 'Significant route deviation detected'
        };
      }

      return {
        isValid: true,
        deviation: minDistance
      };
    } catch (error) {
      this.logger.error('Route validation error:', error);
      return {
        isValid: false,
        error: `Route validation error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Validate vehicle status from GPS API
   */
  async validateVehicleStatus(vehicleStatus: VehicleStatus): Promise<GPSValidationResult> {
    if (!vehicleStatus || !vehicleStatus.location) {
      return {
        isValid: false,
        error: 'Missing GPS location data'
      };
    }

    return this.validateLocation({
      latitude: vehicleStatus.location.latitude,
      longitude: vehicleStatus.location.longitude,
      timestamp: vehicleStatus.location.timestamp,
      speed: vehicleStatus.location.speed,
      accuracy: vehicleStatus.location.accuracy
    });
  }

  /**
   * Get validated vehicle locations
   */
  async getValidatedVehicleLocations(vehicleStatuses: VehicleStatus[]): Promise<Array<VehicleStatus & { validation: GPSValidationResult }>> {
    const validatedVehicles = await Promise.all(
      vehicleStatuses.map(async (vehicle) => {
        const validation = await this.validateVehicleStatus(vehicle);
        
        return {
          ...vehicle,
          validation
        };
      })
    );

    return validatedVehicles;
  }

  // Helper methods
  private isWithinBounds(lat: number, lng: number): boolean {
    return lat >= this.validationRules.bounds.minLat && 
           lat <= this.validationRules.bounds.maxLat && 
           lng >= this.validationRules.bounds.minLng && 
           lng <= this.validationRules.bounds.maxLng;
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}
