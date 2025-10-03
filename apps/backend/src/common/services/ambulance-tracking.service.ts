import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HospitalBoundsService, AmbulancePosition } from './hospital-bounds.service';

export interface AmbulanceLocationUpdate {
  ambulanceId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  assignmentId?: string;
}

export interface AmbulanceStatus {
  ambulanceId: string;
  currentPosition: AmbulancePosition;
  isWithinHospital: boolean;
  nearbyHospitals: Array<{
    hospitalId: string;
    hospitalName: string;
    distance: number;
  }>;
  nearestHospital?: {
    hospitalId: string;
    hospitalName: string;
    distance: number;
  };
  lastUpdated: Date;
}

@Injectable()
export class AmbulanceTrackingService {
  private readonly logger = new Logger(AmbulanceTrackingService.name);

  constructor(
    private prisma: PrismaService,
    private hospitalBoundsService: HospitalBoundsService
  ) {}

  /**
   * Update ambulance location and check hospital proximity
   */
  async updateAmbulanceLocation(update: AmbulanceLocationUpdate): Promise<AmbulanceStatus> {
    try {
      this.logger.log(`Updating location for ambulance ${update.ambulanceId}`);

      // Validate ambulance exists
      const ambulance = await this.prisma.ambulance.findFirst({
        where: {
          id: update.ambulanceId,
          deletedAt: null
        }
      });

      if (!ambulance) {
        throw new Error(`Ambulance ${update.ambulanceId} not found`);
      }

      // Check hospital proximity
      const validation = await this.hospitalBoundsService.validateAmbulancePosition({
        latitude: update.latitude,
        longitude: update.longitude
      });

      // Store location update (you might want to create a location_history table)
      await this.storeLocationUpdate(update);

      // Build response
      const status: AmbulanceStatus = {
        ambulanceId: update.ambulanceId,
        currentPosition: {
          latitude: update.latitude,
          longitude: update.longitude
        },
        isWithinHospital: validation.isWithinAnyHospital,
        nearbyHospitals: validation.nearbyHospitals.map(nh => ({
          hospitalId: nh.hospital.hospitalId,
          hospitalName: nh.hospital.hospitalName,
          distance: nh.distance
        })),
        nearestHospital: validation.nearestHospital ? {
          hospitalId: validation.nearestHospital.hospital.hospitalId,
          hospitalName: validation.nearestHospital.hospital.hospitalName,
          distance: validation.nearestHospital.distance
        } : undefined,
        lastUpdated: update.timestamp
      };

      // Log the result
      if (validation.isWithinAnyHospital) {
        this.logger.log(
          `Ambulance ${update.ambulanceId} is within ${validation.nearbyHospitals.length} hospital(s)`
        );
        validation.nearbyHospitals.forEach(nh => {
          this.logger.log(
            `  - Within ${nh.hospital.hospitalName} (${nh.distance.toFixed(2)}km)`
          );
        });
      } else {
        this.logger.log(
          `Ambulance ${update.ambulanceId} is not within any hospital zone. ` +
          `Nearest: ${validation.nearestHospital?.hospital.hospitalName} ` +
          `(${validation.nearestHospital?.distance.toFixed(2)}km)`
        );
      }

      return status;
    } catch (error) {
      this.logger.error(`Failed to update ambulance location: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Get current status of an ambulance
   */
  async getAmbulanceStatus(ambulanceId: string): Promise<AmbulanceStatus | null> {
    try {
      // Get latest location from database (you might want to create a location_history table)
      const latestLocation = await this.getLatestLocation(ambulanceId);
      
      if (!latestLocation) {
        return null;
      }

      // Check hospital proximity
      const validation = await this.hospitalBoundsService.validateAmbulancePosition(latestLocation);

      return {
        ambulanceId,
        currentPosition: latestLocation,
        isWithinHospital: validation.isWithinAnyHospital,
        nearbyHospitals: validation.nearbyHospitals.map(nh => ({
          hospitalId: nh.hospital.hospitalId,
          hospitalName: nh.hospital.hospitalName,
          distance: nh.distance
        })),
        nearestHospital: validation.nearestHospital ? {
          hospitalId: validation.nearestHospital.hospital.hospitalId,
          hospitalName: validation.nearestHospital.hospital.hospitalName,
          distance: validation.nearestHospital.distance
        } : undefined,
        lastUpdated: new Date() // You might want to store this in the database
      };
    } catch (error) {
      this.logger.error(`Failed to get ambulance status: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Get all active ambulances and their statuses
   */
  async getAllAmbulanceStatuses(): Promise<AmbulanceStatus[]> {
    try {
      const ambulances = await this.prisma.ambulance.findMany({
        where: {
          deletedAt: null,
          status: { in: ['ACTIVE', 'ASSIGNED', 'EN_ROUTE'] as any[] }
        },
        select: {
          id: true
        }
      });

      const statuses: AmbulanceStatus[] = [];
      
      for (const ambulance of ambulances) {
        const status = await this.getAmbulanceStatus(ambulance.id);
        if (status) {
          statuses.push(status);
        }
      }

      return statuses;
    } catch (error) {
      this.logger.error(`Failed to get all ambulance statuses: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Store location update in database
   * Note: You might want to create a dedicated location_history table for this
   */
  private async storeLocationUpdate(update: AmbulanceLocationUpdate): Promise<void> {
    try {
      // For now, we'll just log it. In a real implementation, you'd store this in a location_history table
      this.logger.debug(`Storing location update for ambulance ${update.ambulanceId}: ${update.latitude}, ${update.longitude}`);
      
      // Example of how you might store it:
      // await this.prisma.ambulanceLocationHistory.create({
      //   data: {
      //     ambulanceId: update.ambulanceId,
      //     latitude: update.latitude,
      //     longitude: update.longitude,
      //     timestamp: update.timestamp,
      //     assignmentId: update.assignmentId
      //   }
      // });
    } catch (error) {
      this.logger.error(`Failed to store location update: ${(error as Error).message}`, error);
    }
  }

  /**
   * Get latest location for an ambulance
   * Note: This is a placeholder - you'd implement this based on your location storage strategy
   */
  private async getLatestLocation(ambulanceId: string): Promise<AmbulancePosition | null> {
    try {
      // This is a placeholder implementation
      // In a real system, you'd query your location_history table
      this.logger.debug(`Getting latest location for ambulance ${ambulanceId}`);
      
      // For now, return null - you'd implement this based on your data storage
      return null;
    } catch (error) {
      this.logger.error(`Failed to get latest location: ${(error as Error).message}`, error);
      return null;
    }
  }

  /**
   * Check if an ambulance is within a specific hospital's radius
   */
  async isAmbulanceWithinHospital(
    ambulanceId: string,
    hospitalId: string,
    radiusKm: number = 1
  ): Promise<{ isWithin: boolean; distance?: number }> {
    try {
      const ambulanceStatus = await this.getAmbulanceStatus(ambulanceId);
      if (!ambulanceStatus) {
        return { isWithin: false };
      }

      const hospitalBounds = await this.hospitalBoundsService.getHospitalBounds(hospitalId, radiusKm);
      if (!hospitalBounds) {
        return { isWithin: false };
      }

      // Calculate distance using the public method
      const distance = this.hospitalBoundsService.calculateDistance(
        ambulanceStatus.currentPosition.latitude,
        ambulanceStatus.currentPosition.longitude,
        hospitalBounds.centerLat,
        hospitalBounds.centerLng
      );

      return {
        isWithin: distance <= radiusKm,
        distance
      };
    } catch (error) {
      this.logger.error(`Failed to check ambulance-hospital proximity: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const EARTH_RADIUS_KM = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return EARTH_RADIUS_KM * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
