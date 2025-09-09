import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisConfig } from '../../config/redis.config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis | null = null;
  private readonly redisConfig: RedisConfig;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.redisConfig = this.configService.get<RedisConfig>('redis')!;
  }

  async onModuleInit() {
    try {
      this.redis = new Redis({
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        password: this.redisConfig.password,
        db: this.redisConfig.db,
        maxRetriesPerRequest: this.redisConfig.maxRetriesPerRequest,
        lazyConnect: this.redisConfig.lazyConnect,
        keepAlive: this.redisConfig.keepAlive,
        connectTimeout: this.redisConfig.connectTimeout,
        commandTimeout: this.redisConfig.commandTimeout,
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error: Error) => {
        this.logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        this.logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.warn('Redis is not available, continuing without cache:', (error as Error).message);
      this.redis = null;
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.disconnect();
      this.logger.log('Redis disconnected');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }
    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set expiry for key ${key}:`, error);
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get JSON for key ${key}:`, error);
      return null;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, ttl);
    } catch (error) {
      this.logger.error(`Failed to set JSON for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }
    try {
      const result = await this.redis.incr(key);
      if (ttl && result === 1) {
        await this.expire(key, ttl);
      }
      return result;
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      return 0;
    }
  }

  async decrement(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Failed to decrement key ${key}:`, error);
      return 0;
    }
  }

  async getClient(): Promise<Redis | null> {
    return this.redis;
  }

  isRedisAvailable(): boolean {
    return this.isConnected && this.redis !== null;
  }
}
