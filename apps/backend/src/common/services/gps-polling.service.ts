import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AmbulanceTrackingService } from './ambulance-tracking.service';
import axios from 'axios';

@Injectable()
export class GPSPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GPSPollingService.name);
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 30000; // 30 seconds
  private readonly GPS_API_URL = 'http://gps3.tawasolmap.com/new_api/';
  private readonly GPS_API_KEY = '7798AA377F99763506758557AC7741A1';
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ambulanceTracking: AmbulanceTrackingService
  ) {}

  async onModuleInit() {
    // Auto-start polling when module initializes
    // Check environment variable to enable/disable
    const autoStart = process.env.GPS_POLLING_ENABLED !== 'false';
    
    if (autoStart) {
      this.logger.log('GPS Polling Service initializing...');
      
      // Start polling after a short delay
      setTimeout(() => {
        this.start();
      }, 2000);
    }
  }

  async onModuleDestroy() {
    this.stop();
  }

  /**
   * Start GPS polling
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('GPS Polling is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log(`🔄 GPS Polling started (interval: ${this.POLL_INTERVAL_MS / 1000}s)`);
    
    // Poll immediately
    this.pollGPSData();
    
    // Then poll at regular intervals
    this.pollingInterval = setInterval(() => {
      this.pollGPSData();
    }, this.POLL_INTERVAL_MS);
  }

  /**
   * Stop GPS polling
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.logger.log('GPS Polling stopped');
  }

  /**
   * Check if polling is running
   */
  isPolling(): boolean {
    return this.isRunning;
  }

  /**
   * Poll GPS data for all active ambulances
   */
  private async pollGPSData(): Promise<void> {
    try {
      // Get all active ambulances
      const ambulances = await this.prisma.ambulance.findMany({
        where: {
          deletedAt: null,
          isActive: true
        },
        select: {
          id: true,
          vehicleImei: true,
          callSign: true
        }
      });

      if (ambulances.length === 0) {
        this.logger.debug('No active ambulances to track');
        return;
      }

      this.logger.debug(`Polling GPS data for ${ambulances.length} ambulances`);

      // Process each ambulance
      for (const ambulance of ambulances) {
        try {
          await this.fetchAndUpdateAmbulanceLocation(ambulance.id, ambulance.vehicleImei);
        } catch (error) {
          this.logger.error(
            `Failed to update location for ambulance ${ambulance.callSign} (${ambulance.vehicleImei}): ${(error as Error).message}`
          );
        }
      }

      this.logger.debug('GPS polling cycle completed');
    } catch (error) {
      this.logger.error(`GPS polling error: ${(error as Error).message}`, error);
    }
  }

  /**
   * Fetch GPS data for a single ambulance and update tracking
   */
  private async fetchAndUpdateAmbulanceLocation(ambulanceId: string, imei: string): Promise<void> {
    try {
      let gpsData: any = null;

      // Fetch from GPS API
      try {
        const response = await axios.post(
          this.GPS_API_URL,
          {
            api_key: this.GPS_API_KEY,
            service: 'objects',
            imeis: imei
          },
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status && response.data.data && response.data.data.length > 0) {
          gpsData = response.data.data[0];
          
          // Resolve timestamp: try dt_tracker, then dt_server, then timestamp, then now
          const rawTime = gpsData.dt_tracker || gpsData.dt_server || gpsData.timestamp;
          const timestamp = rawTime ? new Date(rawTime) : new Date();

          this.logger.log(`Processing GPS for ${imei}: Lat=${gpsData.lat}, Lng=${gpsData.lng}, Time=${timestamp.toISOString()} (Raw: ${rawTime})`);

          // Update ambulance tracking with real GPS data
          await this.ambulanceTracking.updateAmbulanceLocation(ambulanceId, {
            latitude: parseFloat(gpsData.lat),
            longitude: parseFloat(gpsData.lng),
            timestamp: timestamp,
            speed: gpsData.speed ? parseFloat(gpsData.speed) : undefined,
            direction: gpsData.direction ? parseFloat(gpsData.direction) : undefined
          });
        } else {
          this.logger.debug(`No GPS data returned for IMEI ${imei}`);
        }
      } catch (apiError) {
        this.logger.error(`GPS API error for IMEI ${imei}: ${(apiError as Error).message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to fetch and update location for ${imei}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Manually trigger a GPS poll (for testing)
   */
  async triggerPoll(): Promise<{ success: boolean; message: string }> {
    try {
      await this.pollGPSData();
      return {
        success: true,
        message: 'GPS poll completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `GPS poll failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get polling status
   */
  getStatus(): {
    isRunning: boolean;
    pollIntervalMs: number;
  } {
    return {
      isRunning: this.isRunning,
      pollIntervalMs: this.POLL_INTERVAL_MS
    };
  }
}
