import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  apiRateLimit: number;
  apiRateWindow: number;
  enableCors: boolean;
  corsOrigins: string[];
  logLevel: string;
  enableMetrics: boolean;
  metricsPort: number;
}

export default registerAs('app', (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '1000', 10),
  apiRateWindow: parseInt(process.env.API_RATE_WINDOW || '60000', 10),
  enableCors: process.env.ENABLE_CORS !== 'false',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  logLevel: process.env.LOG_LEVEL || 'info',
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
}));


