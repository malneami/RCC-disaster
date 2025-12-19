import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AmbulanceTrackingService } from './ambulance-tracking.service';
import { FileLoggerService } from './file-logger.service';
import { GPSMappingService } from './gps-mapping.service';
import axios from 'axios';
import { AmbulanceStatus, AmbulanceType, EquipmentStatus } from '@prisma/client';

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
    private readonly gpsMappingService: GPSMappingService,
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
   * Poll GPS data for ALL devices and update/create ambulances
   */
  private async pollGPSData(): Promise<void> {
    try {
      this.logger.debug('Starting GPS polling cycle...');
      
      // 1. Fetch ALL known ambulances from DB to quick-match
      const existingAmbulances = await this.prisma.ambulance.findMany({});
      const ambulanceMap = new Map(existingAmbulances.map(a => [a.vehicleImei, a]));
      
      this.logger.debug(`Loaded ${existingAmbulances.length} ambulances from DB`);

      // 2. Fetch ALL devices from GPS API
      let apiObjects: any[] = [];
      try {
        const response = await axios.post(
          this.GPS_API_URL,
          {
            api_key: this.GPS_API_KEY,
            service: 'objects',
            imeis: '*' // Request ALL devices
          },
          {
            timeout: 15000,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (response.data?.status && Array.isArray(response.data?.data)) {
          apiObjects = response.data.data;
          this.logger.debug(`Fetched ${apiObjects.length} devices from GPS API`);
        } else {
          this.logger.error('Invalid response from GPS API', { 
            status: response.data?.status, 
            dataType: typeof response.data?.data 
          });
          return; // Abort this cycle if API fails
        }
      } catch (apiError: any) {
        this.logger.error(`GPS API request failed: ${(apiError as Error).message}`);
        this.fileLogger.error(`GPS API request failed`, apiError);
        return;
      }

      // 3. Process each API object
      for (const rawObj of apiObjects) {
        try {
          // Robustly handle missing/invalid IMEI
          if (!rawObj || !rawObj.imei) {
            continue;
          }

          const imei = rawObj.imei;
          const mappedData = this.gpsMappingService.mapGPSObjectToAmbulance(rawObj);

          // Validate coordinates "Ignore the fuck out of it" if invalid
          if (this.isInvalidLocation(mappedData.lat, mappedData.lng)) {
              this.logger.debug(`Ignoring invalid location for IMEI ${imei}: ${mappedData.lat}, ${mappedData.lng}`);
              continue;
          }

          // Check against Saudi Arabia bounds (approximate) to filter noise
          if (mappedData.lat < 16 || mappedData.lat > 32 || mappedData.lng < 34 || mappedData.lng > 55) {
             this.logger.debug(`Ignoring out-of-bounds location for IMEI ${imei}: ${mappedData.lat}, ${mappedData.lng}`);
             continue;
          }

          let ambulanceId = ambulanceMap.get(imei)?.id;

          // 4. Auto-Create if not exists
          if (!ambulanceId) {
            this.logger.log(`Found new device IMEI ${imei} from API. Auto-creating ambulance...`);
            try {
              const newAmbulance = await this.createAmbulanceFromGPS(imei, rawObj);
              ambulanceId = newAmbulance.id;
              // Add to map so we don't try to create it again if duplicate in same batch (unlikely but safe)
              ambulanceMap.set(imei, newAmbulance);
            } catch (createError) {
              this.logger.error(`Failed to auto-create ambulance for IMEI ${imei}: ${(createError as Error).message}`);
              continue; 
            }
          }

          // 5. Update Location
          const timestamp = mappedData.timestamp ? new Date(mappedData.timestamp) : new Date();
          
          // Validate timestamp sanity
          if (isNaN(timestamp.getTime()) || timestamp.getFullYear() < 2000) {
             this.logger.debug(`Invalid timestamp for IMEI ${imei}, using current time`);
             // Actually, if timestamp is bad, strictly speaking we might want to skip update or use now. 
             // "when it comes from the API, it comes" implies strictness? 
             // But let's use current time to ensure visibility if live.
          }

          await this.ambulanceTracking.updateAmbulanceLocation(ambulanceId, {
            latitude: mappedData.lat,
            longitude: mappedData.lng,
            timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
            speed: mappedData.speed,
            direction: mappedData.direction
          });

        } catch (itemError) {
           this.logger.error(`Error processing GPS item for IMEI ${rawObj?.imei}: ${(itemError as Error).message}`);
        }
      }

      this.logger.debug('GPS polling cycle completed successfully');

    } catch (error) {
      this.logger.error(`Critical error in GPS polling cycle: ${(error as Error).message}`, error);
      this.fileLogger.error(`Critical error in GPS polling cycle`, error);
    }
  }

  private isInvalidLocation(lat: any, lng: any): boolean {
    return (
      lat === undefined || 
      lng === undefined || 
      lat === null || 
      lng === null || 
      isNaN(lat) || 
      isNaN(lng) || 
      (lat === 0 && lng === 0)
    );
  }

  private async createAmbulanceFromGPS(imei: string, rawData: any) {
    // Generate intelligent defaults
    const last4 = imei.slice(-4);
    const callSign = `AUTO-${last4}`;
    const plateNumber = rawData.plate_number || `UNK-${last4}`;
    
    // Ensure uniqueness for callSign/plateNumber in case of collision
    // We'll append a random suffix if needed, but for now simple logic
    
    // Check if callSign exists (unlikely given it's new IMEI, but possible if repurposed)
    const existingCallSign = await this.prisma.ambulance.findUnique({ where: { callSign } });
    const finalCallSign = existingCallSign ? `${callSign}-${Date.now().toString().slice(-4)}` : callSign;

    const existingPlate = await this.prisma.ambulance.findUnique({ where: { plateNumber } });
    const finalPlate = existingPlate ? `${plateNumber}-${Date.now().toString().slice(-4)}` : plateNumber;

    return this.prisma.ambulance.create({
      data: {
        vehicleImei: imei,
        callSign: finalCallSign,
        plateNumber: finalPlate,
        model: rawData.model || 'Unknown-Auto',
        year: new Date().getFullYear(),
        type: AmbulanceType.BASIC, // Default safe type
        status: AmbulanceStatus.AVAILABLE,
        equipmentStatus: EquipmentStatus.OPERATIONAL,
        isActive: true,
        baseStation: 'Auto-Detected'
      }
    });
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
