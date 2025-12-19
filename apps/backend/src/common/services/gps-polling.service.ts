import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AmbulanceTrackingService } from './ambulance-tracking.service';
import { FileLoggerService } from './file-logger.service';
import axios from 'axios';

@Injectable()
export class GPSPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GPSPollingService.name);
  private readonly fileLogger: FileLoggerService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 30000; // 30 seconds
  private readonly GPS_API_URL = 'https://gps3.tawasolmap.com/new_api/';
  private readonly GPS_API_KEY = '7798AA377F99763506758557AC7741A1';
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ambulanceTracking: AmbulanceTrackingService,
    fileLogger: FileLoggerService
  ) {
    this.fileLogger = fileLogger;
  }

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
      this.fileLogger.logGPSPolling(`Polling GPS data for ${ambulances.length} ambulances`, {
        ambulanceCount: ambulances.length,
      });

      // Process each ambulance
      for (const ambulance of ambulances) {
        try {
          await this.fetchAndUpdateAmbulanceLocation(ambulance.id, ambulance.vehicleImei);
        } catch (error) {
          const errorMsg = `Failed to update location for ambulance ${ambulance.callSign} (${ambulance.vehicleImei}): ${(error as Error).message}`;
          this.logger.error(errorMsg);
          this.fileLogger.error(errorMsg, error, {
            ambulanceId: ambulance.id,
            callSign: ambulance.callSign,
            imei: ambulance.vehicleImei,
          });
        }
      }

      this.logger.debug('GPS polling cycle completed');
      this.fileLogger.logGPSPolling('GPS polling cycle completed');
    } catch (error) {
      this.logger.error(`GPS polling error: ${(error as Error).message}`, error);
      this.fileLogger.error(`GPS polling error: ${(error as Error).message}`, error);
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

        // Log full API response structure for debugging
        this.logger.debug(`GPS API response for IMEI ${imei}: status=${response.data?.status}, dataLength=${response.data?.data?.length || 0}`);
        
        if (response.data.status && response.data.data && response.data.data.length > 0) {
          gpsData = response.data.data[0];
          
          // Check if gpsData is actually an object with data
          if (!gpsData || typeof gpsData !== 'object') {
            this.logger.warn(`GPS data is not an object for IMEI ${imei}: ${typeof gpsData}`);
            return;
          }
          
          // DEBUG: Log raw API response structure to understand data format
          this.logger.debug(`Raw GPS API response for IMEI ${imei}: ${JSON.stringify(gpsData)}`);
          
          // Try multiple possible field names for coordinates
          // Some APIs use: lat/lng, latitude/longitude, Lat/Lng, LAT/LNG, etc.
          const lat = parseFloat(
            gpsData.lat || gpsData.latitude || gpsData.Lat || gpsData.LAT || 
            gpsData.lat_deg || gpsData.lat_degree || 0
          );
          const lng = parseFloat(
            gpsData.lng || gpsData.longitude || gpsData.Lng || gpsData.LNG || 
            gpsData.lon || gpsData.lon_deg || gpsData.lon_degree || 0
          );
          
          // Log what fields we found
          if ((lat === 0 && lng === 0) || isNaN(lat) || isNaN(lng)) {
            this.logger.warn(`GPS data structure for IMEI ${imei}: Available fields: ${Object.keys(gpsData).join(', ')}`);
            this.logger.warn(`Attempted to parse: lat from [${gpsData.lat}, ${gpsData.latitude}, ${gpsData.Lat}], lng from [${gpsData.lng}, ${gpsData.longitude}, ${gpsData.Lng}]`);
          }
          
          if (isNaN(lat) || isNaN(lng)) {
            this.logger.warn(`Invalid GPS coordinates for IMEI ${imei}: lat=${gpsData.lat}, lng=${gpsData.lng}`);
            this.fileLogger.warn(`Invalid GPS coordinates for IMEI ${imei}`, { lat: gpsData.lat, lng: gpsData.lng });
            return; // Skip this update
          }
          
          // Skip zero coordinates (device not initialized or no GPS fix)
          if (lat === 0 && lng === 0) {
            this.logger.debug(`Skipping zero coordinates for IMEI ${imei} - device may not have GPS fix`);
            return; // Skip this update silently
          }
          
          // Basic bounds check for Saudi Arabia region (rough bounds)
          // Lat: 16-32, Lng: 34-55
          if (lat < 16 || lat > 32 || lng < 34 || lng > 55) {
            this.logger.warn(`GPS coordinates outside Saudi Arabia for IMEI ${imei}: lat=${lat}, lng=${lng}`);
            this.fileLogger.warn(`GPS coordinates outside expected region for IMEI ${imei}`, { lat, lng });
            return; // Skip this update
          }
          
          // Resolve timestamp: try multiple possible field names
          const rawTime = gpsData.dt_tracker || gpsData.dt_server || gpsData.timestamp || 
                         gpsData.time || gpsData.Time || gpsData.TIME ||
                         gpsData.date || gpsData.Date || gpsData.DATE ||
                         gpsData.datetime || gpsData.DateTime || gpsData.DATETIME ||
                         gpsData.gps_time || gpsData.gpsTime || gpsData.gpsTimeStamp;
          
          let timestamp: Date;
          if (rawTime) {
            timestamp = new Date(rawTime);
            // If parsing failed (invalid date), timestamp will be Invalid Date
            if (isNaN(timestamp.getTime())) {
              this.logger.warn(`Invalid timestamp format for IMEI ${imei}: "${rawTime}", using current time`);
              timestamp = new Date();
            }
          } else {
            this.logger.debug(`No timestamp field found for IMEI ${imei}, using current time`);
            timestamp = new Date();
          }
          const now = new Date();

          // Validate timestamp is not invalid (Unix epoch or earlier indicates invalid data)
          // If timestamp is invalid AND coordinates are 0,0, this is definitely bad data - skip entirely
          const isInvalidTimestamp = timestamp.getTime() < 946684800000; // Before year 2000
          if (isInvalidTimestamp && lat === 0 && lng === 0) {
            this.logger.debug(`Skipping invalid GPS data for IMEI ${imei}: coordinates (0,0) with invalid timestamp ${timestamp.toISOString()}`);
            return; // Skip this update - device has no valid GPS data
          }
          
          if (isInvalidTimestamp) {
            this.logger.debug(`Invalid timestamp for IMEI ${imei}: ${timestamp.toISOString()}, using current time`);
            timestamp = new Date();
          }

          // Validate timestamp is not too far in the future (more than 1 hour)
          const timeDiff = timestamp.getTime() - now.getTime();
          if (timeDiff > 60 * 60 * 1000) {
            this.logger.warn(`GPS timestamp too far in future for IMEI ${imei}: ${timestamp.toISOString()}, using current time instead`);
            timestamp = new Date();
          }
          
          // Validate timestamp is not too far in the past (more than 24 hours)
          if (now.getTime() - timestamp.getTime() > 24 * 60 * 60 * 1000) {
            this.logger.debug(`GPS timestamp too old for IMEI ${imei}: ${timestamp.toISOString()}, using current time`);
            timestamp = new Date();
          }

          // Log to both console and file
          this.logger.log(`Processing GPS for ${imei}: Lat=${lat}, Lng=${lng}, Time=${timestamp.toISOString()} (Raw: ${rawTime})`);
          this.fileLogger.logGPSProcessing(imei, {
            lat,
            lng,
            timestamp,
            rawTime,
          });

          // Update ambulance tracking with real GPS data
          await this.ambulanceTracking.updateAmbulanceLocation(ambulanceId, {
            latitude: lat,
            longitude: lng,
            timestamp: timestamp,
            speed: gpsData.speed ? parseFloat(gpsData.speed) : undefined,
            direction: gpsData.direction ? parseFloat(gpsData.direction) : undefined
          });
        } else {
          // Log the actual response structure when no data is found
          if (response.data) {
            this.logger.debug(`No GPS data returned for IMEI ${imei}. Response structure: ${JSON.stringify({
              status: response.data.status,
              hasData: !!response.data.data,
              dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
              dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
              keys: Object.keys(response.data)
            })}`);
          } else {
            this.logger.debug(`No GPS data returned for IMEI ${imei} - response.data is null/undefined`);
          }
        }
      } catch (apiError: any) {
        // Log detailed error information including response data if available
        const errorDetails: any = {
          message: (apiError as Error).message,
          imei
        };
        
        // If axios error, capture response data
        if (apiError.response) {
          errorDetails.status = apiError.response.status;
          errorDetails.statusText = apiError.response.statusText;
          errorDetails.responseData = apiError.response.data;
          this.logger.error(`GPS API HTTP error for IMEI ${imei}: ${apiError.response.status} ${apiError.response.statusText}`, {
            responseData: apiError.response.data
          });
        } else if (apiError.request) {
          errorDetails.requestError = 'No response received from GPS API';
          this.logger.error(`GPS API request error for IMEI ${imei}: No response received`);
        } else {
          this.logger.error(`GPS API error for IMEI ${imei}: ${(apiError as Error).message}`);
        }
        
        const errorMsg = `GPS API error for IMEI ${imei}: ${(apiError as Error).message}`;
        this.fileLogger.error(errorMsg, apiError, errorDetails);
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
