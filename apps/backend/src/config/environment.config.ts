import { registerAs } from '@nestjs/config';

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  nodeEnv: string;
  enableSwagger: boolean;
  enableMetrics: boolean;
  enableDebugLogs: boolean;
  enableCors: boolean;
  corsOrigins: string[];
  logLevel: string;
  enableSecurityHeaders: boolean;
  enableRateLimit: boolean;
  enableCaching: boolean;
  enableRetry: boolean;
}

export default registerAs('environment', (): EnvironmentConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  return {
    isDevelopment,
    isProduction,
    isTest,
    nodeEnv,
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false' && !isProduction,
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true' || isDevelopment,
    enableCors: process.env.ENABLE_CORS !== 'false',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    logLevel: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableRetry: process.env.ENABLE_RETRY !== 'false',
  };
});


