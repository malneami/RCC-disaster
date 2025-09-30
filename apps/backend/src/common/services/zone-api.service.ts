import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface ZoneData {
  zone_id: string;
  zone_name: string;
  bounding_box: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  area_km2?: number;
  description?: string;
}

export interface ZoneApiResponse {
  success: boolean;
  data: ZoneData[];
  message?: string;
  total_zones?: number;
}

@Injectable()
export class ZoneApiService {
  private readonly logger = new Logger(ZoneApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private zoneCache: Map<string, { data: ZoneData[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ZONE_API_KEY', '7798AA377F99763506758557AC7741A1');
    this.baseUrl = this.configService.get<string>('ZONE_API_URL', 'https://api.example.com');
  }

  /**
   * Fetch all zones from the external API
   */
  async getAllZones(): Promise<ZoneData[]> {
    const cacheKey = 'all_zones';
    const cached = this.zoneCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      this.logger.debug('Returning cached zone data');
      return cached.data;
    }

    try {
      this.logger.log('Fetching zone data from external API');
      
      const response: AxiosResponse<ZoneApiResponse> = await axios.post(
        this.baseUrl,
        {
          api_key: this.apiKey,
          service: 'get_zone',
          zone_id: '*'
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(`Zone API returned error: ${response.data.message || 'Unknown error'}`);
      }

      const zones = response.data.data.map(zone => this.normalizeZoneData(zone));
      
      // Cache the result
      this.zoneCache.set(cacheKey, {
        data: zones,
        timestamp: Date.now()
      });

      this.logger.log(`Successfully fetched ${zones.length} zones from API`);
      return zones;

    } catch (error) {
      this.logger.error(`Failed to fetch zones from API: ${(error as Error).message}`);
      
      // Return cached data if available, even if expired
      if (cached) {
        this.logger.warn('Using expired cached zone data due to API failure');
        return cached.data;
      }
      
      throw new Error(`Failed to fetch zone data: ${(error as Error).message}`);
    }
  }

  /**
   * Find zones that contain the given coordinates
   */
  async findZonesContainingPoint(latitude: number, longitude: number): Promise<ZoneData[]> {
    const zones = await this.getAllZones();
    
    return zones.filter(zone => {
      const bbox = zone.bounding_box;
      return (
        latitude >= bbox.min_lat &&
        latitude <= bbox.max_lat &&
        longitude >= bbox.min_lng &&
        longitude <= bbox.max_lng
      );
    });
  }

  /**
   * Clear the zone cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.zoneCache.clear();
    this.logger.log('Zone cache cleared');
  }

  /**
   * Normalize zone data from API response
   */
  private normalizeZoneData(zoneData: any): ZoneData {
    return {
      zone_id: zoneData.zone_id || zoneData.id,
      zone_name: zoneData.zone_name || zoneData.name,
      bounding_box: {
        min_lat: parseFloat(zoneData.bounding_box?.min_lat || zoneData.min_lat),
        max_lat: parseFloat(zoneData.bounding_box?.max_lat || zoneData.max_lat),
        min_lng: parseFloat(zoneData.bounding_box?.min_lng || zoneData.min_lng),
        max_lng: parseFloat(zoneData.bounding_box?.max_lng || zoneData.max_lng),
      },
      center: {
        lat: parseFloat(zoneData.center?.lat || zoneData.lat),
        lng: parseFloat(zoneData.center?.lng || zoneData.lng),
      },
      area_km2: zoneData.area_km2 ? parseFloat(zoneData.area_km2) : undefined,
      description: zoneData.description
    };
  }
}

