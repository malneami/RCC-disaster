import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { GpsConfig } from '../../config/gps.config';
import { RedisService } from '../cache/redis.service';
import { GpsLoggingService } from './gps-logging.service';
import { VehicleStatus, GpsLocation } from '../interfaces/gps.interfaces';
import { GPS_ERROR_MESSAGES } from '../constants/gps.constants';

// Re-export interfaces for backward compatibility
export { VehicleStatus, GpsLocation };

@Injectable()
export class GpsApiService {
  private readonly logger = new Logger(GpsApiService.name);
  private readonly apiClient: AxiosInstance;
  private readonly gpsConfig: GpsConfig;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
    private gpsLoggingService: GpsLoggingService,
  ) {
    this.gpsConfig = this.configService.get<GpsConfig>('gps')!;
    
    this.apiClient = axios.create({
      baseURL: this.gpsConfig.baseUrl,
      timeout: this.gpsConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get GPS location for a specific ambulance by IMEI
   */
  async getVehicleLocation(ambulanceId: string): Promise<VehicleStatus | null> {
    const endpoint = '/';
    
    try {
      if (!this.gpsConfig.apiKey) {
        this.logger.warn('GPS API key not configured, returning null');
        await this.gpsLoggingService.logApiError(ambulanceId, endpoint, 'API key not configured');
        return null;
      }

      // Get ambulance with IMEI
      const ambulance = await this.getAmbulanceWithImei(ambulanceId);
      if (!ambulance || !ambulance.vehicleImei) {
        this.logger.warn(`No IMEI found for ambulance ${ambulanceId}`);
        await this.gpsLoggingService.logApiError(ambulanceId, endpoint, 'No IMEI configured for ambulance');
        return null;
      }

      const requestBody = {
        api_key: this.gpsConfig.apiKey,
        service: 'objects',
        imeis: ambulance.vehicleImei, // Use actual IMEI
      };

      const startTime = Date.now();
      const response: AxiosResponse = await this.apiClient.post(endpoint, requestBody);
      const responseTime = Date.now() - startTime;

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        this.logger.warn(`No GPS data found for IMEI ${ambulance.vehicleImei}`);
        return null;
      }

      const vehicleData = response.data.data[0];
      
      const vehicleStatus: VehicleStatus = {
        vehicleId: ambulanceId, // Use our internal ambulance ID
        location: {
          latitude: parseFloat(vehicleData.lat) || 0,
          longitude: parseFloat(vehicleData.lng) || 0,
          speed: parseFloat(vehicleData.speed) || 0,
          direction: parseFloat(vehicleData.angle) || 0,
          timestamp: new Date(vehicleData.dt_tracker),
          accuracy: parseFloat(vehicleData.params?.gpslev) || 0,
        },
        fuelLevel: vehicleData.params?.io9 ? parseFloat(vehicleData.params.io9) : undefined,
        engineStatus: vehicleData.params?.io1 === '1',
        address: vehicleData.name || undefined,
      };

      this.logger.debug(`Retrieved GPS data for ambulance ${ambulanceId} (IMEI: ${ambulance.vehicleImei}): ${vehicleStatus.location.latitude}, ${vehicleStatus.location.longitude}`);
      return vehicleStatus;

    } catch (error) {
      this.logger.error(`Error fetching GPS location for ambulance ${ambulanceId}:`, error);
      await this.gpsLoggingService.logApiError(ambulanceId, endpoint, (error as Error).message);
      return null;
    }
  }

  /**
   * Get GPS locations for all ambulances with IMEI
   */
  async getAllVehicleLocations(): Promise<VehicleStatus[]> {
    const endpoint = '/';
    
    try {
      if (!this.gpsConfig.apiKey) {
        this.logger.warn('GPS API key not configured, returning empty array');
        await this.gpsLoggingService.logApiError('all', endpoint, 'API key not configured');
        return [];
      }

      // Get all ambulances with IMEI
      const ambulances = await this.getAmbulancesWithImei();
      if (ambulances.length === 0) {
        this.logger.warn('No ambulances with IMEI found');
        return [];
      }

      // Get all IMEIs
      const imeis = ambulances.map(ambulance => ambulance.vehicleImei).filter(Boolean);
      
      const requestBody = {
        api_key: this.gpsConfig.apiKey,
        service: 'objects',
        imeis: imeis.join(','), // Send comma-separated IMEIs
      };

      const startTime = Date.now();
      const response: AxiosResponse = await this.apiClient.post(endpoint, requestBody);
      const responseTime = Date.now() - startTime;

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        this.logger.warn('No GPS data found for any vehicles');
        return [];
      }

      // Map GPS data back to our ambulance IDs
      const vehicleStatuses: VehicleStatus[] = [];
      
      for (const vehicleData of response.data.data) {
        const ambulance = ambulances.find(amb => amb.vehicleImei === vehicleData.imei);
        if (ambulance) {
          vehicleStatuses.push({
            vehicleId: ambulance.id, // Use our internal ambulance ID
            location: {
              latitude: parseFloat(vehicleData.lat) || 0,
              longitude: parseFloat(vehicleData.lng) || 0,
              speed: parseFloat(vehicleData.speed) || 0,
              direction: parseFloat(vehicleData.angle) || 0,
              timestamp: new Date(vehicleData.dt_tracker),
              accuracy: parseFloat(vehicleData.params?.gpslev) || 0,
            },
            fuelLevel: vehicleData.params?.io9 ? parseFloat(vehicleData.params.io9) : undefined,
            engineStatus: vehicleData.params?.io1 === '1',
            address: vehicleData.name || undefined,
          });
        }
      }

      this.logger.debug(`Retrieved GPS data for ${vehicleStatuses.length} ambulances`);
      return vehicleStatuses;

    } catch (error) {
      this.logger.error('Error fetching GPS locations for all vehicles:', error);
      await this.gpsLoggingService.logApiError('all', endpoint, (error as Error).message);
      return [];
    }
  }

  /**
   * Get GPS locations for multiple specific vehicles
   */
  async getMultipleVehicleLocations(vehicleIds: string[]): Promise<VehicleStatus[]> {
    try {
      const allVehicles = await this.getAllVehicleLocations();
      return allVehicles.filter(vehicle => vehicleIds.includes(vehicle.vehicleId));
    } catch (error) {
      this.logger.error('Error fetching GPS locations for multiple vehicles:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get ambulance with IMEI from database
   */
  private async getAmbulanceWithImei(ambulanceId: string) {
    return this.prisma.ambulance.findUnique({
      where: { id: ambulanceId },
      select: { id: true, vehicleImei: true, plateNumber: true, callSign: true },
    });
  }

  /**
   * Get all ambulances with IMEI from database
   */
  private async getAmbulancesWithImei() {
    return this.prisma.ambulance.findMany({
      where: { 
        vehicleImei: { not: '' },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, vehicleImei: true, plateNumber: true, callSign: true },
    });
  }

  /**
   * Mask API key for logging
   */
  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '***';
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
  }
}
