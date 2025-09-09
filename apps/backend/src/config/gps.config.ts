import { registerAs } from '@nestjs/config';

export interface GpsConfig {
  apiKey: string;
  baseUrl: string;
  updateInterval: number;
  cacheTtl: number;
  rateLimit: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  backoff: 'linear' | 'exponential';
  enableCaching: boolean;
  enableRateLimit: boolean;
  enableRetry: boolean;
}

export default registerAs('gps', (): GpsConfig => ({
  apiKey: process.env.GPS_API_KEY || '',
  baseUrl: process.env.GPS_API_BASE_URL || 'http://gps3.tawasolmap.com/new_api',
  updateInterval: parseInt(process.env.GPS_UPDATE_INTERVAL || '30000', 10),
  cacheTtl: parseInt(process.env.GPS_CACHE_TTL || '60000', 10),
  rateLimit: parseInt(process.env.GPS_RATE_LIMIT || '100', 10),
  timeout: parseInt(process.env.GPS_TIMEOUT || '10000', 10),
  retryAttempts: parseInt(process.env.GPS_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.GPS_RETRY_DELAY || '1000', 10),
  backoff: (process.env.GPS_RETRY_BACKOFF || 'exponential') as 'linear' | 'exponential',
  enableCaching: process.env.GPS_ENABLE_CACHING !== 'false',
  enableRateLimit: process.env.GPS_ENABLE_RATE_LIMIT !== 'false',
  enableRetry: process.env.GPS_ENABLE_RETRY !== 'false',
}));
