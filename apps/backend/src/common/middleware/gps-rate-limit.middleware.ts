import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../cache/redis.service';
import { GpsConfig } from '../../config/gps.config';

@Injectable()
export class GpsRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GpsRateLimitMiddleware.name);
  private readonly gpsConfig: GpsConfig;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.gpsConfig = this.configService.get<GpsConfig>('gps')!;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    if (!this.gpsConfig.enableRateLimit) {
      return next();
    }

    try {
      const clientId = this.getClientId(req);
      const key = `gps_rate_limit:${clientId}`;
      const windowSize = 60; // 1 minute window
      
      const currentCount = await this.redisService.increment(key, windowSize);
      
      if (currentCount > this.gpsConfig.rateLimit) {
        this.logger.warn(`Rate limit exceeded for client ${clientId}: ${currentCount}/${this.gpsConfig.rateLimit}`);
        
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'GPS API rate limit exceeded',
          retryAfter: windowSize,
          limit: this.gpsConfig.rateLimit,
          current: currentCount,
        });
        return;
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.gpsConfig.rateLimit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.gpsConfig.rateLimit - currentCount));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowSize * 1000).toISOString());

      next();
    } catch (error) {
      this.logger.error('Rate limiting error:', error);
      // Allow request to proceed if rate limiting fails
      next();
    }
  }

  private getClientId(req: Request): string {
    // Try to get client ID from various sources
    const apiKey = req.headers['x-api-key'] as string;
    const userId = req.headers['x-user-id'] as string;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    return apiKey || userId || ip;
  }
}
