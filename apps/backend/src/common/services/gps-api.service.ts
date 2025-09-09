import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { GpsConfig } from '../../config/gps.config';
import { RedisService } from '../cache/redis.service';

export interface GpsLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
  timestamp: Date;
  accuracy?: number;
}

export interface VehicleStatus {
  vehicleId: string;
  location: GpsLocation;
  fuelLevel?: number;
  engineStatus?: boolean;
  address?: string;
}

@Injectable()
export class GpsApiService {
  private readonly logger = new Logger(GpsApiService.name);
  private readonly apiClient: AxiosInstance;
  private readonly gpsConfig: GpsConfig;
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.gpsConfig = this.configService.get<GpsConfig>('gps')!;
    
    if (!this.gpsConfig.apiKey) {
      this.logger.warn('TawasolMap GPS3 API key not configured');
    }

    this.apiClient = axios.create({
      baseURL: this.gpsConfig.baseUrl,
      timeout: this.gpsConfig.timeout,
      headers: {
        'Authorization': `Bearer ${this.gpsConfig.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RCC-Healthcare-EMS/1.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.apiClient.interceptors.request.use(
      (config: any) => {
        this.logger.debug(`GPS API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        this.logger.error('GPS API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response: any) => {
        this.logger.debug(`GPS API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        this.logger.error('GPS API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async getVehicleLocation(vehicleId: string): Promise<VehicleStatus | null> {
    try {
      if (!this.gpsConfig.apiKey) {
        this.logger.warn('GPS API key not configured, returning null');
        return null;
      }

      const response = await this.apiClient.get(`/vehicles/${vehicleId}/location`);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        return {
          vehicleId,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed,
            direction: data.direction,
            timestamp: new Date(data.timestamp),
            accuracy: data.accuracy,
          },
          fuelLevel: data.fuelLevel,
          engineStatus: data.engineStatus,
          address: data.address,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get location for vehicle ${vehicleId}:`, (error as Error).message);
      
      if ((error as any).response?.status === 404) {
        return null;
      }
      
      throw new HttpException(
        `Failed to get GPS location: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getMultipleVehicleLocations(vehicleIds: string[]): Promise<VehicleStatus[]> {
    try {
      if (!this.gpsConfig.apiKey) {
        this.logger.warn('GPS API key not configured, returning empty array');
        return [];
      }

      const response = await this.apiClient.post('/vehicles/locations', {
        vehicleIds,
      });

      if (response.data && response.data.success) {
        return response.data.data.map((vehicle: any) => ({
          vehicleId: vehicle.vehicleId,
          location: {
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            speed: vehicle.speed,
            direction: vehicle.direction,
            timestamp: new Date(vehicle.timestamp),
            accuracy: vehicle.accuracy,
          },
          fuelLevel: vehicle.fuelLevel,
          engineStatus: vehicle.engineStatus,
          address: vehicle.address,
        }));
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get multiple vehicle locations:', (error as Error).message);
      throw new HttpException(
        `Failed to get GPS locations: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getVehicleHistory(vehicleId: string, fromDate: Date, toDate: Date): Promise<GpsLocation[]> {
    try {
      if (!this.gpsConfig.apiKey) {
        this.logger.warn('GPS API key not configured, returning empty array');
        return [];
      }

      const response = await this.apiClient.get(`/vehicles/${vehicleId}/history`, {
        params: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      });

      if (response.data && response.data.success) {
        return response.data.data.map((point: any) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          speed: point.speed,
          direction: point.direction,
          timestamp: new Date(point.timestamp),
          accuracy: point.accuracy,
        }));
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to get history for vehicle ${vehicleId}:`, (error as Error).message);
      throw new HttpException(
        `Failed to get GPS history: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async sendCommand(vehicleId: string, command: string, parameters?: any): Promise<boolean> {
    try {
      if (!this.gpsConfig.apiKey) {
        this.logger.warn('GPS API key not configured, command not sent');
        return false;
      }

      const response = await this.apiClient.post(`/vehicles/${vehicleId}/commands`, {
        command,
        parameters,
      });

      return response.data && response.data.success;
    } catch (error) {
      this.logger.error(`Failed to send command to vehicle ${vehicleId}:`, (error as Error).message);
      throw new HttpException(
        `Failed to send GPS command: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      if (!this.gpsConfig.apiKey) {
        this.logger.warn('GPS API key not configured, reverse geocoding not available');
        return null;
      }

      const response = await this.apiClient.get('/geocoding/reverse', {
        params: { latitude, longitude },
      });

      if (response.data && response.data.success) {
        return response.data.data.address;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to reverse geocode ${latitude}, ${longitude}:`, (error as Error).message);
      return null;
    }
  }

  async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async isApiConfigured(): Promise<boolean> {
    return !!this.gpsConfig.apiKey;
  }
}