import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { GpsApiService } from './gps-api.service';
import { GpsValidationService } from './gps-validation.service';
import { GpsStatusEngineService } from './gps-status-engine.service';
import { GpsLoggingService } from './gps-logging.service';
import { GPS_CONSTANTS } from '../constants/gps.constants';

@Injectable()
export class GpsPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GpsPollingService.name);
  private isPolling = true;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private gpsApiService: GpsApiService,
    private gpsValidationService: GpsValidationService,
    private gpsStatusEngine: GpsStatusEngineService,
    private gpsLoggingService: GpsLoggingService,
  ) {}

  onModuleInit() {
    this.logger.log('GPS polling service initialized');
  }

  onModuleDestroy() {
    this.logger.log('GPS polling service destroyed');
  }

  /**
   * Cron job for periodic GPS polling (every minute)
   */
  @Cron('0 */1 * * * *') // Every minute
  async cronPolling() {
    if (this.isPolling) {
      await this.pollAllVehicles();
    }
  }

  /**
   * Poll all active ambulances for GPS data
   */
  async pollAllVehicles(): Promise<void> {
    try {
      const activeAmbulances = await this.prisma.ambulance.findMany({
        where: {
          status: { in: ['AVAILABLE', 'IN_USE'] },
          deletedAt: null,
          vehicleImei: { not: '' },
        },
        select: {
          id: true,
          vehicleImei: true,
          plateNumber: true,
          callSign: true,
          status: true,
        },
      });

      this.logger.debug(`Polling ${activeAmbulances.length} active ambulances`);

      for (const ambulance of activeAmbulances) {
        await this.processVehicleGpsData(ambulance);
      }
    } catch (error) {
      this.logger.error('Error during GPS polling:', error);
    }
  }

  /**
   * Process GPS data for a specific vehicle with automatic status updates
   */
  private async processVehicleGpsData(ambulance: any): Promise<void> {
    try {
      if (!ambulance.id) return;

      const gpsData = await this.gpsApiService.getVehicleLocation(ambulance.id);
      
      if (!gpsData) {
        await this.handleMissingGpsData(ambulance);
        return;
      }

      // Validate GPS data
      const validation = await this.gpsValidationService.validateVehicleStatus(gpsData);
      
      if (!validation.isValid) {
        await this.gpsLoggingService.logValidationFailure(ambulance.id, validation.error!);
        return;
      }

      // Update ambulance location in database
      await this.prisma.ambulance.update({
        where: { id: ambulance.id },
        data: {
          currentLocationLat: gpsData.location.latitude,
          currentLocationLng: gpsData.location.longitude,
          lastUpdated: gpsData.location.timestamp,
          currentLocationAddress: gpsData.address,
        },
      });

      // Log GPS tracking data (minimal)
      await this.prisma.gPSTrackingLog.create({
        data: {
          ambulanceId: ambulance.id,
          latitude: gpsData.location.latitude,
          longitude: gpsData.location.longitude,
          speed: gpsData.location.speed || 0,
          direction: gpsData.location.direction || 0,
          timestamp: gpsData.location.timestamp,
          accuracy: gpsData.location.accuracy || 0,
          fuelLevel: gpsData.fuelLevel,
          engineStatus: gpsData.engineStatus,
          locationAddress: gpsData.address,
        },
      });

      // Process GPS data through status engine for automatic status updates
      await this.gpsStatusEngine.processGpsUpdate(ambulance.id, gpsData);

      this.logger.debug(`Processed GPS data for ambulance ${ambulance.plateNumber}`);
    } catch (error) {
      this.logger.error(`Error processing GPS data for ambulance ${ambulance.id}:`, error);
      await this.gpsLoggingService.logApiError(ambulance.id || 'unknown', 'getVehicleLocation', (error as Error).message);
    }
  }

  /**
   * Handle missing GPS data
   */
  private async handleMissingGpsData(ambulance: any): Promise<void> {
    try {
      // Log missing GPS data
      await this.gpsLoggingService.logApiError(ambulance.id || 'unknown', 'getVehicleLocation', 'No GPS data available');
      
      this.logger.warn(`No GPS data available for ambulance ${ambulance.plateNumber}`);
    } catch (error) {
      this.logger.error(`Error handling missing GPS data for ambulance ${ambulance.id}:`, error);
    }
  }

  /**
   * Get polling status
   */
  getPollingStatus() {
    return {
      isPolling: this.isPolling,
      interval: GPS_CONSTANTS.TIME.DEFAULT_POLLING_INTERVAL,
      lastPoll: new Date().toISOString(),
      activeAmbulances: 0, // Would need to implement
      errors: 0, // Would need to implement
    };
  }

  /**
   * Start GPS polling
   */
  startPolling() {
    this.isPolling = true;
    this.logger.log('GPS polling started');
  }

  /**
   * Stop GPS polling
   */
  stopPolling() {
    this.isPolling = false;
    this.logger.log('GPS polling stopped');
  }

  /**
   * Trigger manual GPS polling
   */
  async triggerPolling() {
    this.logger.log('Manual GPS polling triggered');
    await this.pollAllVehicles();
  }
}
