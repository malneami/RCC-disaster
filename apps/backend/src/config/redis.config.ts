import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  connectTimeout: number;
  commandTimeout: number;
}

export default registerAs('redis', (): RedisConfig => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
  lazyConnect: process.env.REDIS_LAZY_CONNECT !== 'false',
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000', 10),
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
}));
