import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HospitalBoundsService, AmbulancePosition } from './hospital-bounds.service';
import { AmbulancesService } from '../../modules/ambulances/ambulances.service';
import { EMSStatusUpdaterService } from './ems-status-updater.service';
import { FileLoggerService } from './file-logger.service';

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
  private readonly fileLogger: FileLoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hospitalBoundsService: HospitalBoundsService,
    private readonly ambulancesService: AmbulancesService,
    private readonly emsStatusUpdater: EMSStatusUpdaterService,
    fileLogger: FileLoggerService
  ) {
    this.fileLogger = fileLogger;
  }

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

      const message = `GPS sync completed. Updated ${updatedCount} ambulances.`;
      this.logger.log(message);
      this.fileLogger.logAmbulanceTracking(message, {
        updatedCount,
        totalRecords: gpsData.length,
        errors: errors.length > 0 ? errors : undefined,
      });
      
      return {
        success: true,
        updatedCount,
        totalRecords: gpsData.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const errorMsg = `GPS sync error: ${(error as Error).message}`;
      this.logger.error(errorMsg, error);
      this.fileLogger.error(errorMsg, error);
      throw error;
    }
  }

  /**
   * Validate GPS coordinates for validity and sanity
   */
  private validateGPSData(update: AmbulanceLocationUpdate, previousLocation: AmbulancePosition | null): {
    isValid: boolean;
    reason?: string;
  } {
    // Check for valid coordinate ranges (Saudi Arabia approximate bounds)
    const SAUDI_MIN_LAT = 16.0;
    const SAUDI_MAX_LAT = 32.0;
    const SAUDI_MIN_LNG = 34.0;
    const SAUDI_MAX_LNG = 55.0;

    if (update.latitude < SAUDI_MIN_LAT || update.latitude > SAUDI_MAX_LAT) {
      return { isValid: false, reason: `Latitude ${update.latitude} out of valid range` };
    }

    if (update.longitude < SAUDI_MIN_LNG || update.longitude > SAUDI_MAX_LNG) {
      return { isValid: false, reason: `Longitude ${update.longitude} out of valid range` };
    }

    // Check for zero coordinates (invalid)
    if (update.latitude === 0 && update.longitude === 0) {
      return { isValid: false, reason: 'Zero coordinates detected' };
    }

    // Check for future timestamps (allow small buffer for clock skew)
    const MAX_FUTURE_TOLERANCE_SECONDS = 60; // 1 minute tolerance for clock skew
    const now = new Date();
    const maxAllowedTime = new Date(now.getTime() + (MAX_FUTURE_TOLERANCE_SECONDS * 1000));

    if (update.timestamp > maxAllowedTime) {
      const futureSeconds = (update.timestamp.getTime() - now.getTime()) / 1000;
      return { 
        isValid: false, 
        reason: `Timestamp is ${futureSeconds.toFixed(0)}s in the future (max tolerance: ${MAX_FUTURE_TOLERANCE_SECONDS}s)` 
      };
    }

    // Check for erratic movement (if previous location exists)
    if (previousLocation) {
      const distance = this.calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        update.latitude,
        update.longitude
      );

      // Calculate time difference (in seconds)
      const timeDiff = (update.timestamp.getTime() - new Date().getTime()) / 1000;
      const absTimeDiff = Math.abs(timeDiff);

      // If coordinates are very recent (within last minute), check for unrealistic speed
      if (absTimeDiff < 60) {
        // Maximum reasonable speed for ambulance: 150 km/h
        const maxReasonableSpeed = 150; // km/h
        const timeHours = absTimeDiff / 3600;
        const calculatedSpeed = distance / timeHours;

        if (calculatedSpeed > maxReasonableSpeed) {
          this.logger.warn(
            `Erratic GPS data detected for ambulance: ` +
            `distance=${distance.toFixed(2)}km, ` +
            `calculated_speed=${calculatedSpeed.toFixed(2)}km/h, ` +
            `time_diff=${absTimeDiff.toFixed(1)}s`
          );
          // Don't reject, but log warning - GPS can have temporary spikes
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Update ambulance location and check hospital proximity
   */
  async updateAmbulanceLocation(ambulanceId: string, update: AmbulanceLocationUpdate): Promise<AmbulanceStatus> {
    try {
      this.logger.log(`Updating location for ambulance ${ambulanceId}`);
      this.fileLogger.logAmbulanceTracking(`Updating location for ambulance ${ambulanceId}`, {
        ambulanceId,
        latitude: update.latitude,
        longitude: update.longitude,
        timestamp: update.timestamp.toISOString(),
      });

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

      // Get previous location for validation
      const previousLocation = await this.getPreviousLocation(ambulanceId);

      // Validate GPS data
      const gpsValidation = this.validateGPSData(update, previousLocation);
      if (!gpsValidation.isValid) {
        const warnMsg = `Invalid GPS data for ambulance ${ambulanceId}: ${gpsValidation.reason}`;
        this.logger.warn(warnMsg);
        this.fileLogger.warn(warnMsg, { ambulanceId, update });
        
        // If we have a previous valid location, use it instead
        if (previousLocation) {
          this.logger.log(`Using previous valid location for ambulance ${ambulanceId}`);
          update.latitude = previousLocation.latitude;
          update.longitude = previousLocation.longitude;
        } else {
          // No previous location and invalid data - skip this update silently
          // This ambulance will be updated when valid GPS data arrives
          this.logger.debug(`Skipping update for ambulance ${ambulanceId} - no valid GPS data yet`);
          return {
            ambulanceId: ambulanceId,
            currentPosition: { latitude: 0, longitude: 0 },
            isWithinHospital: false,
            nearbyHospitals: [],
            nearestHospital: undefined,
            lastUpdated: update.timestamp
          };
        }
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

      // Validate GPS coordinates before zone processing
      // Skip zone processing for invalid coordinates (0,0) to prevent false zone entries/exits
      // IMPORTANT: This validation should match the validation in storeLocationUpdate
      const isInvalidCoordinates = (update.latitude === 0 && update.longitude === 0) ||
                                   isNaN(update.latitude) || isNaN(update.longitude) ||
                                   update.latitude < 16 || update.latitude > 32 ||
                                   update.longitude < 34 || update.longitude > 55;
      
      if (isInvalidCoordinates) {
        this.logger.debug(`Skipping zone processing for ambulance ${ambulanceId} - invalid GPS coordinates: (${update.latitude}, ${update.longitude})`);
        // Still return a status, but don't process zones
        // Use previous valid location if available, otherwise return invalid position
        const previousLocation = await this.getPreviousLocation(ambulanceId);
        return {
          ambulanceId: ambulanceId,
          currentPosition: previousLocation || {
            latitude: update.latitude,
            longitude: update.longitude
          },
          isWithinHospital: false,
          nearbyHospitals: [],
          nearestHospital: undefined,
          lastUpdated: update.timestamp
        };
      }

      // Check hospital proximity
      const validation = await this.hospitalBoundsService.validateAmbulancePosition({
        latitude: update.latitude,
        longitude: update.longitude
      });

      // Handle Zone Logic (Permanent Log) - only for valid GPS coordinates
      await this.handleZoneLogic(ambulanceId, validation);

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

      // Log the result to both console and file
      if (validation.isWithinAnyHospital) {
        const message = `Ambulance ${ambulanceId} is within ${validation.nearbyHospitals.length} hospital(s)`;
        this.logger.log(message);
        this.fileLogger.logLocationUpdate(ambulanceId, {
          latitude: update.latitude,
          longitude: update.longitude,
          isWithinHospital: true,
          nearbyHospitalsCount: validation.nearbyHospitals.length,
          hospitalNames: validation.nearbyHospitals.map((h: any) => h.hospital.hospitalName),
        });
      } else {
        const message = `Ambulance ${ambulanceId} is not within any hospital zone.`;
        this.logger.log(message);
        this.fileLogger.logLocationUpdate(ambulanceId, {
          latitude: update.latitude,
          longitude: update.longitude,
          isWithinHospital: false,
          nearbyHospitalsCount: 0,
        });
      }

      return status;
    } catch (error) {
      const errorMsg = `Failed to update ambulance location: ${(error as Error).message}`;
      this.logger.error(errorMsg, error);
      this.fileLogger.error(errorMsg, error, { ambulanceId });
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
   * Store location update in database and maintain rolling 10-day window
   * Avoids storing duplicate coordinates with same timestamp
   * IMPORTANT: Only stores valid coordinates (not 0,0 and within valid range)
   */
  private async storeLocationUpdate(ambulanceId: string, update: AmbulanceLocationUpdate): Promise<void> {
    try {
      // CRITICAL: Validate coordinates before storing
      // Skip invalid coordinates (0,0) or coordinates outside valid range
      if (update.latitude === 0 && update.longitude === 0) {
        this.logger.debug(`Skipping storage of invalid coordinates (0,0) for ambulance ${ambulanceId}`);
        return;
      }
      
      if (isNaN(update.latitude) || isNaN(update.longitude)) {
        this.logger.debug(`Skipping storage of NaN coordinates for ambulance ${ambulanceId}`);
        return;
      }
      
      // Validate coordinates are within Saudi Arabia bounds
      if (update.latitude < 16 || update.latitude > 32 || 
          update.longitude < 34 || update.longitude > 55) {
        this.logger.debug(`Skipping storage of coordinates outside valid range for ambulance ${ambulanceId}: (${update.latitude}, ${update.longitude})`);
        return;
      }

      // 1. Check if we already have this exact location stored recently (within 30 seconds)
      // This prevents duplicate entries from multiple polling cycles reporting same GPS data
      // Reduced from 1 minute to 30 seconds to allow more frequent updates
      const recentDuplicate = await this.prisma.gPSTrackingLog.findFirst({
        where: {
          ambulanceId: ambulanceId,
          latitude: update.latitude,
          longitude: update.longitude,
          timestamp: {
            gte: new Date(update.timestamp.getTime() - 30 * 1000), // Within 30 seconds
            lte: new Date(update.timestamp.getTime() + 30 * 1000)
          }
        }
      });

      // Skip if exact duplicate exists within 30 seconds
      if (recentDuplicate) {
        this.logger.debug(`Skipping duplicate location for ambulance ${ambulanceId} at (${update.latitude}, ${update.longitude})`);
        return;
      }

      // 2. Save new location
      await this.prisma.gPSTrackingLog.create({
        data: {
          ambulanceId: ambulanceId,
          latitude: update.latitude,
          longitude: update.longitude,
          timestamp: update.timestamp,
          speed: update.speed,
          direction: update.direction,
        }
      });
      
      this.logger.debug(`Stored location update for ambulance ${ambulanceId}: (${update.latitude}, ${update.longitude}) at ${update.timestamp.toISOString()}`);

      // 3. Delete logs older than 10 days for this ambulance (for investigation purposes)
      const retentionPeriod = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
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
   * Includes debouncing to prevent rapid entry/exit due to GPS noise
   * IMPORTANT: This function should only be called with valid GPS coordinates
   */
  private async handleZoneLogic(ambulanceId: string, validation: any): Promise<void> {
    let zoneChanged = false;
    const MIN_ZONE_DURATION_MS = 3 * 60 * 1000; // Minimum 3 minutes in zone before exit is valid (increased from 2 to reduce GPS noise)
    const MIN_ENTRY_CONFIRMATION_MS = 130 * 1000; // Require 120 seconds of history (was 45s) to allow capturing 3+ logs with 30s polling interval
    const ZONE_TRANSITION_COOLDOWN_MS = 3 * 60 * 1000; // 3 minute cooldown between zone transitions (prevents rapid re-entries)
    const now = new Date();
    
    // Safety check: Ensure validation has valid coordinates
    // This is a double-check in case invalid data somehow gets through
    if (!validation || !validation.nearbyHospitals) {
      this.logger.warn(`Invalid validation data for ambulance ${ambulanceId} - skipping zone processing`);
      return;
    }

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

        // If no open entry, check if we should create one
        if (!openEntry) {
          // Check if there was a recent exit from this zone (within last 5 minutes)
          // This prevents rapid re-entry after a brief exit due to GPS noise
          const recentExit = await this.prisma.ambulanceZoneLog.findFirst({
            where: {
              ambulanceId: ambulanceId,
              hospitalId: hospital.hospital.hospitalId,
              exitTime: {
                not: null,
                gte: new Date(now.getTime() - 5 * 60 * 1000) // Within last 5 minutes
              }
            },
            orderBy: {
              exitTime: 'desc'
            }
          });

          // If there was a recent exit with very short duration (< 3 minutes), 
          // it might be GPS noise - check if we should merge instead of creating new entry
          if (recentExit && recentExit.durationMinutes && recentExit.durationMinutes < 3) {
            // This was likely GPS noise - reopen the previous entry instead
            const timeSinceExit = now.getTime() - recentExit.exitTime!.getTime();
            if (timeSinceExit < ZONE_TRANSITION_COOLDOWN_MS) { // Within cooldown period
              // Reopen the previous entry (treat as continuous stay)
              await this.prisma.ambulanceZoneLog.update({
                where: { id: recentExit.id },
                data: {
                  exitTime: null,
                  durationMinutes: null
                }
              });
              this.logger.log(`Ambulance ${ambulanceId} zone entry merged with previous entry for ${hospital.hospital.hospitalName} (GPS noise correction)`);
              zoneChanged = true;
              continue;
            }
          }
          
          // Check for zone transition cooldown - prevent rapid re-entries from GPS noise
          if (recentExit && recentExit.exitTime) {
            const timeSinceExit = now.getTime() - recentExit.exitTime.getTime();
            if (timeSinceExit < ZONE_TRANSITION_COOLDOWN_MS) {
              this.logger.debug(
                `Ambulance ${ambulanceId} attempted to re-enter ${hospital.hospital.hospitalName} within cooldown period ` +
                `(${Math.round(timeSinceExit / 1000)}s since exit). Waiting for cooldown...`
              );
              continue; // Skip entry - still in cooldown period
            }
          }

          // IMPORTANT: Check recent GPS history to confirm ambulance has been in zone consistently
          // This prevents false entries from single GPS noise spikes or invalid coordinates
          // Increased from 30s to 45s and from 3 to 5 points for better confirmation
          const recentGPSLogs = await this.prisma.gPSTrackingLog.findMany({
            where: {
              ambulanceId: ambulanceId,
              timestamp: {
                gte: new Date(now.getTime() - MIN_ENTRY_CONFIRMATION_MS) // Last 45 seconds
              },
              // Filter out invalid coordinates at query level
              latitude: {
                not: 0,
                gte: 16.0,
                lte: 32.0
              },
              longitude: {
                not: 0,
                gte: 34.0,
                lte: 55.0
              }
            },
            orderBy: {
              timestamp: 'desc'
            },
            take: 6 // Check last 6 GPS updates (increased from 5 for better confirmation)
          });

          // Filter out any remaining invalid coordinates (double-check)
          const validGPSLogs = recentGPSLogs.filter(log => {
            if (log.latitude === 0 && log.longitude === 0) return false;
            if (isNaN(log.latitude) || isNaN(log.longitude)) return false;
            if (log.latitude < 16 || log.latitude > 32 || log.longitude < 34 || log.longitude > 55) return false;
            return true;
          });

          // Verify at least 3 of the valid GPS points are also in this hospital zone
          // This confirms the ambulance is actually in the zone, not just a GPS glitch
          // Increased from 2 to 3 points for better confirmation
          if (validGPSLogs.length >= 3) {
            let pointsInZone = 0;
            const hospitalBounds = hospital.hospital; // HospitalBounds object
            for (const log of validGPSLogs) {
              const distance = this.hospitalBoundsService.calculateDistance(
                log.latitude,
                log.longitude,
                hospitalBounds.centerLat,
                hospitalBounds.centerLng
              );
              if (distance <= hospitalBounds.radiusKm) {
                pointsInZone++;
              }
            }
            
            // Require at least 3 out of valid points to be in zone before logging entry
            // This prevents false entries from GPS noise or invalid coordinates
            // Require 70% of points (increased from 60%) to be in zone for better accuracy
            const requiredPoints = Math.max(3, Math.ceil(validGPSLogs.length * 0.7)); // At least 70% of valid points
            if (pointsInZone < requiredPoints) {
              this.logger.debug(
                `Ambulance ${ambulanceId} appears near ${hospitalBounds.hospitalName} but only ${pointsInZone}/${validGPSLogs.length} valid GPS points confirm (need ${requiredPoints}) - waiting for confirmation before logging entry`
              );
              continue; // Skip entry - not enough confirmation
            }
          } else {
            // Not enough valid GPS logs in recent history - skip entry to avoid false positives
            this.logger.debug(
              `Ambulance ${ambulanceId} appears near ${hospital.hospital.hospitalName} but only ${validGPSLogs.length} GPS points available (need at least 3) - skipping entry`
            );
            continue;
          }

          // Classify zone type (origin/destination/other)
          const zoneType = await this.classifyZoneType(ambulanceId, hospital.hospital.hospitalId);
          
          await this.prisma.ambulanceZoneLog.create({
            data: {
              ambulanceId: ambulanceId,
              hospitalId: hospital.hospital.hospitalId,
              zoneType: zoneType,
              entryTime: now
            }
          });
          this.logger.log(`Ambulance ${ambulanceId} entered ${zoneType} zone of ${hospital.hospital.hospitalName} (confirmed by recent GPS history)`);
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
        // Check minimum duration threshold before allowing exit
        const entryDuration = now.getTime() - entry.entryTime.getTime();
        
        if (entryDuration < MIN_ZONE_DURATION_MS) {
          // Too short - likely GPS noise, don't exit yet
          this.logger.debug(
            `Ambulance ${ambulanceId} appears to have exited ${entry.hospital.name} zone, ` +
            `but duration (${Math.round(entryDuration / 1000)}s) is below minimum threshold. ` +
            `Waiting for confirmation...`
          );
          continue; // Skip this exit for now
        }

        // Close the entry
        const exitTime = now;
        const durationMinutes = Math.round(entryDuration / 60000);
        
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

  /**
   * Get suspicious zone entries for investigation
   * Finds entries with unusually short durations that might indicate GPS issues
   */
  async getSuspiciousZoneEntries(filters: {
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Array<{
    id: string;
    ambulanceId: string;
    ambulance: any;
    hospitalId: string;
    hospitalName: string;
    zoneType: string;
    entryTime: Date;
    exitTime: Date | null;
    durationMinutes: number | null;
    isSuspicious: boolean;
    suspiciousReason: string;
  }>> {
    try {
      const where: any = {
        exitTime: { not: null }, // Only completed entries
        durationMinutes: { not: null }
      };

      // Apply duration filters
      if (filters.minDurationMinutes !== undefined || filters.maxDurationMinutes !== undefined) {
        where.durationMinutes = {};
        if (filters.minDurationMinutes !== undefined) {
          where.durationMinutes.gte = filters.minDurationMinutes;
        }
        if (filters.maxDurationMinutes !== undefined) {
          where.durationMinutes.lte = filters.maxDurationMinutes;
        }
      }

      // Apply date filters
      if (filters.startDate) {
        where.entryTime = { ...where.entryTime, gte: filters.startDate };
      }
      if (filters.endDate) {
        where.entryTime = { ...where.entryTime, lte: filters.endDate };
      }

      const logs = await this.prisma.ambulanceZoneLog.findMany({
        where,
        include: {
          ambulance: {
            select: {
              id: true,
              vehicleImei: true,
              callSign: true,
              plateNumber: true,
              status: true
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

      return logs.map(log => {
        let suspiciousReason = '';
        const duration = log.durationMinutes || 0;

        if (duration < 3) {
          suspiciousReason = 'Very short duration (< 3 mins) - likely GPS noise';
        } else if (duration < 5) {
          suspiciousReason = 'Short duration (< 5 mins) - possible brief stop or GPS fluctuation';
        } else if (duration <= 10) {
          suspiciousReason = 'Short duration (5-10 mins) - quick stop, possible drive-through';
        }

        return {
          id: log.id,
          ambulanceId: log.ambulanceId,
          ambulance: log.ambulance,
          hospitalId: log.hospitalId,
          hospitalName: log.hospital.name,
          zoneType: log.zoneType,
          entryTime: log.entryTime,
          exitTime: log.exitTime,
          durationMinutes: log.durationMinutes,
          isSuspicious: duration <= 10,
          suspiciousReason
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get suspicious zone entries: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Get ambulance route history for map visualization
   * Returns GPS tracking points within the specified time range
   */
  async getAmbulanceRoute(
    ambulanceId: string,
    options: {
      startTime: Date;
      endTime: Date;
      limit?: number;
    }
  ): Promise<{
    ambulanceId: string;
    ambulance: any;
    route: Array<{
      latitude: number;
      longitude: number;
      timestamp: Date;
      speed?: number;
      direction?: number;
    }>;
    totalPoints: number;
    startTime: Date;
    endTime: Date;
    distanceTraveled: number;
  }> {
    try {
      // Get ambulance details
      const ambulance = await this.prisma.ambulance.findFirst({
        where: {
          id: ambulanceId,
          deletedAt: null
        },
        select: {
          id: true,
          vehicleImei: true,
          callSign: true,
          plateNumber: true,
          status: true
        }
      });

      if (!ambulance) {
        throw new Error(`Ambulance ${ambulanceId} not found`);
      }

      // Get GPS tracking logs within time range
      // IMPORTANT: Filter out invalid coordinates (0,0) and coordinates outside valid range
      this.logger.debug(`Fetching route for ambulance ${ambulanceId} from ${options.startTime.toISOString()} to ${options.endTime.toISOString()}`);
      
      const allLogs = await this.prisma.gPSTrackingLog.findMany({
        where: {
          ambulanceId,
          timestamp: {
            gte: options.startTime,
            lte: options.endTime
          },
          // Filter out invalid coordinates at query level
          latitude: {
            not: 0,
            gte: 16.0, // Saudi Arabia minimum latitude
            lte: 32.0  // Saudi Arabia maximum latitude
          },
          longitude: {
            not: 0,
            gte: 34.0, // Saudi Arabia minimum longitude
            lte: 55.0  // Saudi Arabia maximum longitude
          }
        },
        orderBy: {
          timestamp: 'asc'
        },
        // Remove the limit multiplication - we want all valid points
        take: options.limit ? options.limit * 10 : 10000 // Get more points to account for deduplication
      });

      this.logger.debug(`Found ${allLogs.length} GPS logs in database for ambulance ${ambulanceId} in time range`);

      // Filter out any remaining invalid coordinates (double-check)
      const validLogs = allLogs.filter(log => {
        // Skip invalid coordinates
        if (log.latitude === 0 && log.longitude === 0) return false;
        if (isNaN(log.latitude) || isNaN(log.longitude)) return false;
        if (log.latitude < 16 || log.latitude > 32 || log.longitude < 34 || log.longitude > 55) return false;
        return true;
      });
      
      this.logger.debug(`After filtering invalid coordinates: ${validLogs.length} valid logs for ambulance ${ambulanceId}`);

      // Remove duplicate consecutive coordinates (GPS sometimes reports same location multiple times)
      // BUT: Only remove if they are EXACTLY the same AND within 30 seconds (likely duplicate from polling)
      // This is less aggressive - we keep points even if they're close together (ambulance might be moving slowly)
      const logs = validLogs.filter((log, index) => {
        if (index === 0) return true;
        const prev = validLogs[index - 1];
        
        // If coordinates are exactly the same AND timestamp is very close (< 30 seconds), it's likely a duplicate
        const isExactDuplicate = prev.latitude === log.latitude && 
                                  prev.longitude === log.longitude;
        const timeDiff = Math.abs(log.timestamp.getTime() - prev.timestamp.getTime());
        const isRecentDuplicate = timeDiff < 30 * 1000; // 30 seconds
        
        // Remove only if it's an exact duplicate within 30 seconds
        if (isExactDuplicate && isRecentDuplicate) {
          return false;
        }
        
        // Otherwise keep the point (even if close together - ambulance might be moving slowly)
        return true;
      }).slice(0, options.limit || 1000);
      
      this.logger.debug(`After deduplication: ${logs.length} unique route points for ambulance ${ambulanceId} (limit: ${options.limit || 1000})`);

      // Calculate total distance traveled and detect gaps
      // A gap is defined as > 10 minutes between consecutive points
      const GAP_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
      let distanceTraveled = 0;
      const routeWithGaps = logs.map((log, index) => {
        let hasGapBefore = false;
        let gapMinutes = 0;
        
        if (index > 0) {
          const prev = logs[index - 1];
          const timeDiff = log.timestamp.getTime() - prev.timestamp.getTime();
          hasGapBefore = timeDiff > GAP_THRESHOLD_MS;
          gapMinutes = Math.round(timeDiff / 60000);
          
          // Only add to distance if not a gap (gaps indicate missing data, not actual travel)
          if (!hasGapBefore) {
            distanceTraveled += this.calculateDistance(
              prev.latitude,
              prev.longitude,
              log.latitude,
              log.longitude
            );
          }
        }
        
        return {
          latitude: log.latitude,
          longitude: log.longitude,
          timestamp: log.timestamp,
          speed: log.speed ?? undefined,
          direction: log.direction ?? undefined,
          hasGapBefore, // True if there's a data gap before this point
          gapMinutes: hasGapBefore ? gapMinutes : undefined // Minutes since previous point if gap
        };
      });

      return {
        ambulanceId,
        ambulance,
        route: routeWithGaps,
        totalPoints: logs.length,
        startTime: options.startTime,
        endTime: options.endTime,
        distanceTraveled: Math.round(distanceTraveled * 100) / 100 // Round to 2 decimal places (km)
      };
    } catch (error) {
      this.logger.error(`Failed to get ambulance route: ${(error as Error).message}`, error);
      throw error;
    }
  }
}

