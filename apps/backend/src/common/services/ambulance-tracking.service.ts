import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HospitalBoundsService, AmbulancePosition } from './hospital-bounds.service';
import { AmbulancesService } from '../../modules/ambulances/ambulances.service';
import { EMSStatusUpdaterService } from './ems-status-updater.service';

export interface AmbulanceLocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  direction?: number;
  accuracy?: number;
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
    private readonly prisma: PrismaService,
    private readonly hospitalBoundsService: HospitalBoundsService,
    private readonly ambulancesService: AmbulancesService,
    private readonly emsStatusUpdater: EMSStatusUpdaterService
  ) {}

  /**
   * Sync locations from external GPS provider
   */
  async syncLocations() {
    try {
      this.logger.log('Starting GPS sync...');
      
      // 1. Fetch data from external GPS API
      const gpsResponse = await this.ambulancesService.findAllGPS();
      
      if (!gpsResponse.status || !Array.isArray(gpsResponse.data)) {
        this.logger.warn('GPS sync failed: Invalid response from external API');
        return { success: false, message: 'Invalid response from GPS API' };
      }

      const gpsData = gpsResponse.data;
      this.logger.log(`Fetched ${gpsData.length} GPS records`);

      // 2. Get all ambulances to map IMEI to ID
      const allAmbulances = await this.ambulancesService.findAll();
      const imeiMap = new Map<string, string>();
      allAmbulances.forEach(amb => {
        if (amb.vehicleImei) {
          imeiMap.set(amb.vehicleImei, amb.id);
        }
      });

      // 3. Process each GPS record
      let updatedCount = 0;
      const errors: string[] = [];

      for (const record of gpsData) {
        try {
          if (!record.imei) continue;

          const ambulanceId = imeiMap.get(record.imei);
          if (!ambulanceId) {
            // this.logger.debug(`Skipping unknown IMEI: ${record.imei}`);
            continue;
          }

          await this.updateAmbulanceLocation(ambulanceId, {
            latitude: record.latitude,
            longitude: record.longitude,
            timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
            speed: record.speed,
            direction: record.direction,
            accuracy: 0 // Default
          });

          updatedCount++;
        } catch (err) {
          errors.push(`Failed to update ${record.imei}: ${(err as Error).message}`);
        }
      }

      this.logger.log(`GPS sync completed. Updated ${updatedCount} ambulances.`);
      
      return {
        success: true,
        updatedCount,
        totalRecords: gpsData.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      this.logger.error(`GPS sync error: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Update ambulance location and check hospital proximity
   */
  async updateAmbulanceLocation(ambulanceId: string, update: AmbulanceLocationUpdate): Promise<AmbulanceStatus> {
    try {
      this.logger.log(`Updating location for ambulance ${ambulanceId}`);

      // Validate ambulance exists
      const ambulance = await this.prisma.ambulance.findFirst({
        where: {
          id: ambulanceId,
          deletedAt: null
        }
      });

      if (!ambulance) {
        throw new Error(`Ambulance ${ambulanceId} not found`);
      }

      // Store location update and manage rolling window
      await this.storeLocationUpdate(ambulanceId, update);

      // Update the Ambulance entity with the latest location
      await this.prisma.ambulance.update({
        where: { id: ambulanceId },
        data: {
          currentLocationLat: update.latitude,
          currentLocationLng: update.longitude,
          lastUpdated: update.timestamp,
          // Update speed/direction if available?
        }
      });

      // Check hospital proximity
      const validation = await this.hospitalBoundsService.validateAmbulancePosition({
        latitude: update.latitude,
        longitude: update.longitude
      });

      // Handle Zone Logic (Permanent Log)
      await this.handleZoneLogic(ambulanceId, validation);

      // Calculate Direction/Status (Solution 1 & 2)
      // We need at least one previous point to calculate direction
      const previousLocation = await this.getPreviousLocation(ambulanceId);
      
      // Build response
      const status: AmbulanceStatus = {
        ambulanceId: ambulanceId,
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
          `Ambulance ${ambulanceId} is within ${validation.nearbyHospitals.length} hospital(s)`
        );
      } else {
        this.logger.log(
          `Ambulance ${ambulanceId} is not within any hospital zone.`
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
        lastUpdated: new Date() 
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
   * Store location update in database and maintain rolling 20-minute window
   */
  private async storeLocationUpdate(ambulanceId: string, update: AmbulanceLocationUpdate): Promise<void> {
    try {
      // 1. Save new location
      await this.prisma.gPSTrackingLog.create({
        data: {
          ambulanceId: ambulanceId,
          latitude: update.latitude,
          longitude: update.longitude,
          timestamp: update.timestamp,
        }
      });

      // 2. Delete logs older than 24 hours for this ambulance (increased from 20 mins to handle timezone diffs)
      const retentionPeriod = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await this.prisma.gPSTrackingLog.deleteMany({
        where: {
          ambulanceId: ambulanceId,
          timestamp: {
            lt: retentionPeriod
          }
        }
      });
      
    } catch (error) {
      this.logger.error(`Failed to store location update: ${(error as Error).message}`, error);
    }
  }

  /**
   * Handle Zone Entry/Exit Logic and trigger EMS status updates
   */
  private async handleZoneLogic(ambulanceId: string, validation: any): Promise<void> {
    let zoneChanged = false;

    // If within a hospital zone
    if (validation.isWithinAnyHospital) {
      for (const hospital of validation.nearbyHospitals) {
        // Check if we already have an open entry for this hospital
        const openEntry = await this.prisma.ambulanceZoneLog.findFirst({
          where: {
            ambulanceId: ambulanceId,
            hospitalId: hospital.hospital.hospitalId,
            exitTime: null
          }
        });

        // If no open entry, create one
        if (!openEntry) {
          // Classify zone type (origin/destination/other)
          const zoneType = await this.classifyZoneType(ambulanceId, hospital.hospital.hospitalId);
          
          await this.prisma.ambulanceZoneLog.create({
            data: {
              ambulanceId: ambulanceId,
              hospitalId: hospital.hospital.hospitalId,
              zoneType: zoneType,
              entryTime: new Date()
            }
          });
          this.logger.log(`Ambulance ${ambulanceId} entered ${zoneType} zone of ${hospital.hospital.hospitalName}`);
          zoneChanged = true;
          
          // Trigger zone entry status update
          await this.emsStatusUpdater.handleZoneEntry(ambulanceId, hospital.hospital.hospitalId, zoneType);
        }
      }
    }

    // Check for exits (ambulances that were in a zone but are no longer)
    // Find all open entries for this ambulance
    const openEntries = await this.prisma.ambulanceZoneLog.findMany({
      where: {
        ambulanceId: ambulanceId,
        exitTime: null
      },
      include: {
        hospital: true
      }
    });

    for (const entry of openEntries) {
      // Check if this hospital is still in the nearby list
      const isStillNearby = validation.nearbyHospitals.some(
        (h: any) => h.hospital.hospitalId === entry.hospitalId
      );

      if (!isStillNearby) {
        // Close the entry
        const exitTime = new Date();
        const durationMinutes = Math.round((exitTime.getTime() - entry.entryTime.getTime()) / 60000);
        
        await this.prisma.ambulanceZoneLog.update({
          where: { id: entry.id },
          data: {
            exitTime: exitTime,
            durationMinutes: durationMinutes
          }
        });
        this.logger.log(`Ambulance ${ambulanceId} exited zone of ${entry.hospital.name} (duration: ${durationMinutes} mins)`);
        zoneChanged = true;
        
        // Trigger zone exit status update
        await this.emsStatusUpdater.handleZoneExit(ambulanceId, entry.hospitalId, entry.zoneType, durationMinutes);
      }
    }

    // If zone status changed, update EMS assignment statuses
    if (zoneChanged) {
      await this.updateEMSAssignmentStatuses(ambulanceId);
    }
  }

  /**
   * Classify zone type based on active EMS assignments
   * @returns 'ORIGIN_ZONE' | 'DESTINATION_ZONE' | 'HOSPITAL_ZONE'
   */
  private async classifyZoneType(
    ambulanceId: string,
    hospitalId: string
  ): Promise<string> {
    // Check active EMS assignments for this ambulance
    const assignment = await this.prisma.eMSAssignment.findFirst({
      where: {
        ambulanceId,
        status: { in: ['ASSIGNED', 'EMS_CONTACT', 'EN_ROUTE', 'AT_PICKUP', 'PATIENT_LOADED'] }
      },
      include: {
        ticket: {
          select: {
            originHospitalId: true,
            destinationHospitalId: true
          }
        }
      }
    });

    if (!assignment) return 'HOSPITAL_ZONE';

    if (assignment.ticket.originHospitalId === hospitalId) return 'ORIGIN_ZONE';
    if (assignment.ticket.destinationHospitalId === hospitalId) return 'DESTINATION_ZONE';

    return 'HOSPITAL_ZONE';
  }

  /**
   * Get latest location for an ambulance from DB
   */
  private async getLatestLocation(ambulanceId: string): Promise<AmbulancePosition | null> {
    try {
      const log = await this.prisma.gPSTrackingLog.findFirst({
        where: { ambulanceId },
        orderBy: { timestamp: 'desc' }
      });

      if (!log) return null;

      return {
        latitude: log.latitude,
        longitude: log.longitude
      };
    } catch (error) {
      this.logger.error(`Failed to get latest location: ${(error as Error).message}`, error);
      return null;
    }
  }

  /**
   * Get previous location (second most recent) for direction calculation
   */
  private async getPreviousLocation(ambulanceId: string): Promise<AmbulancePosition | null> {
    try {
      const logs = await this.prisma.gPSTrackingLog.findMany({
        where: { ambulanceId },
        orderBy: { timestamp: 'desc' },
        take: 2
      });

      if (logs.length < 2) return null;

      return {
        latitude: logs[1].latitude,
        longitude: logs[1].longitude
      };
    } catch (error) {
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

  /**
   * Update EMS assignment statuses for an ambulance
   */
  private async updateEMSAssignmentStatuses(ambulanceId: string): Promise<void> {
    try {
      const activeAssignments = await this.emsStatusUpdater.getActiveAssignmentsForAmbulance(ambulanceId);
      
      for (const assignment of activeAssignments) {
        await this.emsStatusUpdater.updateStatusForAssignment(assignment.id, ambulanceId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update EMS assignment statuses for ambulance ${ambulanceId}: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Calculate bearing between two GPS coordinates
   * @returns Bearing in degrees (0-360)
   */
  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRadians(lat2));
    const x = Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
              Math.sin(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.cos(dLon);
    const bearing = Math.atan2(y, x);
    return (this.toDegrees(bearing) + 360) % 360;
  }

  /**
   * Determine if ambulance is moving toward a target hospital
   */
  async isMovingToward(
    ambulanceId: string,
    targetHospital: { latitude: number; longitude: number }
  ): Promise<{ isMoving: boolean; confidence: number }> {
    const gpsHistory = await this.prisma.gPSTrackingLog.findMany({
      where: { ambulanceId },
      orderBy: { timestamp: 'desc' },
      take: 3
    });

    if (gpsHistory.length < 2) {
      return { isMoving: false, confidence: 0 };
    }

    const current = gpsHistory[0];
    const previous = gpsHistory[1];

    const currentDistance = this.calculateDistance(
      current.latitude,
      current.longitude,
      targetHospital.latitude,
      targetHospital.longitude
    );

    const previousDistance = this.calculateDistance(
      previous.latitude,
      previous.longitude,
      targetHospital.latitude,
      targetHospital.longitude
    );

    const isMoving = currentDistance < previousDistance;
    let confidence = 0.7;

    // Check third point for consistency
    if (gpsHistory.length >= 3) {
      const third = gpsHistory[2];
      const thirdDistance = this.calculateDistance(
        third.latitude,
        third.longitude,
        targetHospital.latitude,
        targetHospital.longitude
      );

      const consistent = currentDistance < previousDistance && previousDistance < thirdDistance;
      confidence = consistent ? 0.95 : 0.6;
    }

    return { isMoving, confidence };
  }

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Get zone entry logs with filters
   */
  async getZoneLogs(filters: {
    hospitalIds?: string[];
    ambulanceId?: string;
    startTime?: Date;
    endTime?: Date;
    includeActive?: boolean;
  }) {
    try {
      const where: any = {};

      if (filters.hospitalIds && filters.hospitalIds.length > 0) {
        where.hospitalId = { in: filters.hospitalIds };
      }

      if (filters.ambulanceId) {
        where.ambulanceId = filters.ambulanceId;
      }

      if (filters.startTime) {
        where.entryTime = { ...where.entryTime, gte: filters.startTime };
      }

      if (filters.endTime) {
        where.entryTime = { ...where.entryTime, lte: filters.endTime };
      }

      // Filter for active zones (no exit time) or completed zones (with exit time)
      if (filters.includeActive === true) {
        where.exitTime = null; // Only active zones
      } else if (filters.includeActive === false) {
        where.exitTime = { not: null }; // Only completed zones
      }
      // If includeActive is undefined, return both active and completed zones

      return await this.prisma.ambulanceZoneLog.findMany({
        where,
        include: {
          ambulance: true,
          hospital: true
        },
        orderBy: {
          entryTime: 'desc'
        }
      });
    } catch (error) {
      this.logger.error(`Failed to get zone logs: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Get location history for an ambulance (last N minutes)
   */
  async getLocationHistory(ambulanceId: string, minutes: number = 20): Promise<Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
    speed?: number;
    direction?: number;
  }>> {
    try {
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      
      const logs = await this.prisma.gPSTrackingLog.findMany({
        where: {
          ambulanceId,
          timestamp: {
            gte: cutoffTime
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      return logs.map(log => ({
        latitude: log.latitude,
        longitude: log.longitude,
        timestamp: log.timestamp,
        speed: log.speed ?? undefined,
        direction: log.direction ?? undefined
      }));
    } catch (error) {
      this.logger.error(`Failed to get location history: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Get ambulances that entered a hospital zone within the last N minutes
   * This is used for the "Assign Crew" feature to show relevant ambulances
   */
  async getAmbulancesInZoneWithinTimeframe(
    hospitalId: string,
    minutes: number = 60
  ): Promise<Array<{
    ambulanceId: string;
    ambulance: any;
    entryTime: Date;
    exitTime: Date | null;
    durationMinutes: number | null;
    isCurrentlyInZone: boolean;
  }>> {
    try {
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      
      const zoneLogs = await this.prisma.ambulanceZoneLog.findMany({
        where: {
          hospitalId,
          entryTime: {
            gte: cutoffTime
          }
        },
        include: {
          ambulance: {
            select: {
              id: true,
              vehicleImei: true,
              callSign: true,
              plateNumber: true,
              status: true,
              currentLocationLat: true,
              currentLocationLng: true
            }
          }
        },
        orderBy: {
          entryTime: 'desc'
        }
      });

      // Group by ambulance ID and get the most recent entry for each
      const ambulanceMap = new Map<string, typeof zoneLogs[0]>();
      
      for (const log of zoneLogs) {
        const existing = ambulanceMap.get(log.ambulanceId);
        if (!existing || log.entryTime > existing.entryTime) {
          ambulanceMap.set(log.ambulanceId, log);
        }
      }

      return Array.from(ambulanceMap.values()).map(log => ({
        ambulanceId: log.ambulanceId,
        ambulance: log.ambulance,
        entryTime: log.entryTime,
        exitTime: log.exitTime,
        durationMinutes: log.durationMinutes,
        isCurrentlyInZone: log.exitTime === null
      }));
    } catch (error) {
      this.logger.error(`Failed to get ambulances in zone: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Get ambulances that entered either origin or destination hospital zones
   * within the specified timeframe (used for EMS assignment)
   */
  async getAmbulancesForAssignment(
    originHospitalId: string,
    destinationHospitalId: string,
    fromTime: Date
  ): Promise<Array<{
    ambulanceId: string;
    ambulance: any;
    relevantZoneEntries: Array<{
      hospitalId: string;
      hospitalName: string;
      entryTime: Date;
      exitTime: Date | null;
      isOrigin: boolean;
    }>;
  }>> {
    try {
      const zoneLogs = await this.prisma.ambulanceZoneLog.findMany({
        where: {
          hospitalId: {
            in: [originHospitalId, destinationHospitalId]
          },
          entryTime: {
            gte: fromTime
          }
        },
        include: {
          ambulance: {
            select: {
              id: true,
              vehicleImei: true,
              callSign: true,
              plateNumber: true,
              status: true,
              currentLocationLat: true,
              currentLocationLng: true,
              deletedAt: true
            }
          },
          hospital: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          entryTime: 'desc'
        }
      });

      // Filter out deleted ambulances
      const validLogs = zoneLogs.filter(log => !log.ambulance.deletedAt);

      // Group by ambulance
      const ambulanceMap = new Map<string, typeof validLogs>();
      
      for (const log of validLogs) {
        if (!ambulanceMap.has(log.ambulanceId)) {
          ambulanceMap.set(log.ambulanceId, []);
        }
        ambulanceMap.get(log.ambulanceId)!.push(log);
      }

      return Array.from(ambulanceMap.entries()).map(([ambulanceId, logs]) => ({
        ambulanceId,
        ambulance: logs[0].ambulance,
        relevantZoneEntries: logs.map(log => ({
          hospitalId: log.hospitalId,
          hospitalName: log.hospital.name,
          entryTime: log.entryTime,
          exitTime: log.exitTime,
          isOrigin: log.hospitalId === originHospitalId
        }))
      }));
    } catch (error) {
      this.logger.error(`Failed to get ambulances for assignment: ${(error as Error).message}`, error);
      throw error;
    }
  }
}

