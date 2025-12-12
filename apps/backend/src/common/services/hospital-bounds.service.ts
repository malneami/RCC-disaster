import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface HospitalBounds {
  hospitalId: string;
  hospitalName: string;
  centerLat: number;
  centerLng: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  radiusKm: number;
}

export interface AmbulancePosition {
  latitude: number;
  longitude: number;
}

@Injectable()
export class HospitalBoundsService {
  private readonly logger = new Logger(HospitalBoundsService.name);
  private readonly EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers
  private readonly DEFAULT_RADIUS_KM = 2.5; // Default 2.5km radius

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate bounds for a hospital with a given radius
   */
  calculateBounds(
    hospitalLat: number,
    hospitalLng: number,
    radiusKm: number = this.DEFAULT_RADIUS_KM
  ): Omit<HospitalBounds, 'hospitalId' | 'hospitalName'> {
    // Convert radius from km to degrees (approximate)
    const latDelta = radiusKm / this.EARTH_RADIUS_KM * (180 / Math.PI);
    const lngDelta = radiusKm / (this.EARTH_RADIUS_KM * Math.cos(hospitalLat * Math.PI / 180)) * (180 / Math.PI);

    return {
      centerLat: hospitalLat,
      centerLng: hospitalLng,
      minLat: hospitalLat - latDelta,
      maxLat: hospitalLat + latDelta,
      minLng: hospitalLng - lngDelta,
      maxLng: hospitalLng + lngDelta,
      radiusKm
    };
  }

  /**
   * Get bounds for all hospitals with coordinates
   */
  async getAllHospitalBounds(radiusKm: number = this.DEFAULT_RADIUS_KM): Promise<HospitalBounds[]> {
    try {
      const hospitals = await this.prisma.hospital.findMany({
        where: {
          deletedAt: null,
          latitude: { not: null },
          longitude: { not: null }
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true
        }
      });

      return hospitals.map(hospital => ({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        ...this.calculateBounds(hospital.latitude!, hospital.longitude!, radiusKm)
      }));
    } catch (error) {
      this.logger.error('Failed to get hospital bounds:', error);
      throw error;
    }
  }

  /**
   * Get bounds for a specific hospital
   */
  async getHospitalBounds(hospitalId: string, radiusKm: number = this.DEFAULT_RADIUS_KM): Promise<HospitalBounds | null> {
    try {
      const hospital = await this.prisma.hospital.findFirst({
        where: {
          id: hospitalId,
          deletedAt: null,
          latitude: { not: null },
          longitude: { not: null }
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true
        }
      });

      if (!hospital) {
        return null;
      }

      return {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        ...this.calculateBounds(hospital.latitude!, hospital.longitude!, radiusKm)
      };
    } catch (error) {
      this.logger.error(`Failed to get bounds for hospital ${hospitalId}:`, error);
      throw error;
    }
  }

  /**
   * Check if an ambulance position is within hospital bounds using bounding box
   */
  isWithinBounds(
    ambulancePos: AmbulancePosition,
    bounds: HospitalBounds
  ): boolean {
    return (
      ambulancePos.latitude >= bounds.minLat &&
      ambulancePos.latitude <= bounds.maxLat &&
      ambulancePos.longitude >= bounds.minLng &&
      ambulancePos.longitude <= bounds.maxLng
    );
  }

  /**
   * Check if an ambulance position is within a hospital's radius using precise distance calculation
   */
  isWithinRadius(
    ambulancePos: AmbulancePosition,
    hospitalLat: number,
    hospitalLng: number,
    radiusKm: number = this.DEFAULT_RADIUS_KM
  ): boolean {
    const distance = this.calculateDistance(
      ambulancePos.latitude,
      ambulancePos.longitude,
      hospitalLat,
      hospitalLng
    );
    return distance <= radiusKm;
  }

  /**
   * Find which hospital an ambulance is closest to within radius
   */
  async findNearestHospitalWithinRadius(
    ambulancePos: AmbulancePosition,
    radiusKm: number = this.DEFAULT_RADIUS_KM
  ): Promise<{ hospital: HospitalBounds; distance: number } | null> {
    try {
      const bounds = await this.getAllHospitalBounds(radiusKm);
      let nearestHospital: HospitalBounds | null = null;
      let nearestDistance = Number.MAX_VALUE;

      for (const hospital of bounds) {
        const distance = this.calculateDistance(
          ambulancePos.latitude,
          ambulancePos.longitude,
          hospital.centerLat,
          hospital.centerLng
        );

        if (distance <= radiusKm && distance < nearestDistance) {
          nearestHospital = hospital;
          nearestDistance = distance;
        }
      }

      return nearestHospital ? { hospital: nearestHospital, distance: nearestDistance } : null;
    } catch (error) {
      this.logger.error('Failed to find nearest hospital:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.EARTH_RADIUS_KM * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate ambulance position against all hospital bounds
   */
  async validateAmbulancePosition(ambulancePos: AmbulancePosition): Promise<{
    isWithinAnyHospital: boolean;
    nearbyHospitals: Array<{ hospital: HospitalBounds; distance: number }>;
    nearestHospital: { hospital: HospitalBounds; distance: number } | null;
  }> {
    try {
      const bounds = await this.getAllHospitalBounds();
      const nearbyHospitals: Array<{ hospital: HospitalBounds; distance: number }> = [];
      let nearestHospital: { hospital: HospitalBounds; distance: number } | null = null;
      let nearestDistance = Number.MAX_VALUE;

      for (const hospital of bounds) {
        const distance = this.calculateDistance(
          ambulancePos.latitude,
          ambulancePos.longitude,
          hospital.centerLat,
          hospital.centerLng
        );

        if (distance <= hospital.radiusKm) {
          nearbyHospitals.push({ hospital, distance });
        }

        if (distance < nearestDistance) {
          nearestHospital = { hospital, distance };
          nearestDistance = distance;
        }
      }

      return {
        isWithinAnyHospital: nearbyHospitals.length > 0,
        nearbyHospitals,
        nearestHospital
      };
    } catch (error) {
      this.logger.error('Failed to validate ambulance position:', error);
      throw error;
    }
  }
}
