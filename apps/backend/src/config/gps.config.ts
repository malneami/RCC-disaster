import { registerAs } from '@nestjs/config';
import { GpsConfig } from '../common/interfaces/gps.interfaces';
import { GPS_CONFIG_DEFAULTS } from '../common/constants/gps.constants';

export { GpsConfig };

export default registerAs('gps', (): GpsConfig => ({
  apiKey: process.env.GPS_API_KEY || GPS_CONFIG_DEFAULTS.API_KEY,
  baseUrl: process.env.GPS_API_BASE_URL || GPS_CONFIG_DEFAULTS.BASE_URL,
  updateInterval: parseInt(process.env.GPS_UPDATE_INTERVAL || GPS_CONFIG_DEFAULTS.UPDATE_INTERVAL.toString(), 10),
  cacheTtl: parseInt(process.env.GPS_CACHE_TTL || GPS_CONFIG_DEFAULTS.CACHE_TTL.toString(), 10),
  rateLimit: parseInt(process.env.GPS_RATE_LIMIT || GPS_CONFIG_DEFAULTS.RATE_LIMIT.toString(), 10),
  timeout: parseInt(process.env.GPS_TIMEOUT || GPS_CONFIG_DEFAULTS.TIMEOUT.toString(), 10),
  retryAttempts: parseInt(process.env.GPS_RETRY_ATTEMPTS || GPS_CONFIG_DEFAULTS.RETRY_ATTEMPTS.toString(), 10),
  retryDelay: parseInt(process.env.GPS_RETRY_DELAY || GPS_CONFIG_DEFAULTS.RETRY_DELAY.toString(), 10),
  backoff: (process.env.GPS_RETRY_BACKOFF || GPS_CONFIG_DEFAULTS.BACKOFF) as 'linear' | 'exponential',
  enableCaching: process.env.GPS_ENABLE_CACHING !== 'false' ? GPS_CONFIG_DEFAULTS.ENABLE_CACHING : false,
  enableRateLimit: process.env.GPS_ENABLE_RATE_LIMIT !== 'false' ? GPS_CONFIG_DEFAULTS.ENABLE_RATE_LIMIT : false,
  enableRetry: process.env.GPS_ENABLE_RETRY !== 'false' ? GPS_CONFIG_DEFAULTS.ENABLE_RETRY : false,
  enableApiLogging: process.env.GPS_ENABLE_API_LOGGING === 'true' ? GPS_CONFIG_DEFAULTS.ENABLE_API_LOGGING : false,
  enableDataLogging: process.env.GPS_ENABLE_DATA_LOGGING === 'true' ? GPS_CONFIG_DEFAULTS.ENABLE_DATA_LOGGING : false,
  enableValidationLogging: process.env.GPS_ENABLE_VALIDATION_LOGGING === 'true' ? GPS_CONFIG_DEFAULTS.ENABLE_VALIDATION_LOGGING : false,
  enableDetailedLogging: process.env.GPS_ENABLE_DETAILED_LOGGING === 'true' ? GPS_CONFIG_DEFAULTS.ENABLE_DETAILED_LOGGING : false,
  logSamplingRate: parseFloat(process.env.GPS_LOG_SAMPLING_RATE || GPS_CONFIG_DEFAULTS.LOG_SAMPLING_RATE.toString()),
  maxLogsPerMinute: parseInt(process.env.GPS_MAX_LOGS_PER_MINUTE || GPS_CONFIG_DEFAULTS.MAX_LOGS_PER_MINUTE.toString(), 10),
}));
