import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../cache/redis.service';

export interface GpsMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  cacheHits: number;
  cacheMisses: number;
  lastUpdated: Date;
}

@Injectable()
export class GpsMonitoringService {
  private readonly logger = new Logger(GpsMonitoringService.name);
  private metrics: GpsMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    rateLimitHits: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastUpdated: new Date(),
  };

  constructor(private redisService: RedisService) {}

  async recordRequest(success: boolean, responseTime: number): Promise<void> {
    this.metrics.totalRequests++;
    this.metrics.lastUpdated = new Date();

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;

    // Store metrics in Redis for persistence
    await this.storeMetrics();
  }

  async recordRateLimitHit(): Promise<void> {
    this.metrics.rateLimitHits++;
    await this.storeMetrics();
  }

  async recordCacheHit(): Promise<void> {
    this.metrics.cacheHits++;
    await this.storeMetrics();
  }

  async recordCacheMiss(): Promise<void> {
    this.metrics.cacheMisses++;
    await this.storeMetrics();
  }

  async getMetrics(): Promise<GpsMetrics> {
    // Try to get metrics from Redis first
    const storedMetrics = await this.redisService.getJson<GpsMetrics>('gps_metrics');
    if (storedMetrics) {
      this.metrics = { ...this.metrics, ...storedMetrics };
    }
    
    return { ...this.metrics };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: GpsMetrics;
    issues: string[];
  }> {
    const metrics = await this.getMetrics();
    const issues: string[] = [];
    
    // Calculate success rate
    const successRate = metrics.totalRequests > 0 
      ? (metrics.successfulRequests / metrics.totalRequests) * 100 
      : 100;

    // Check for issues
    if (successRate < 95) {
      issues.push(`Low success rate: ${successRate.toFixed(2)}%`);
    }

    if (metrics.averageResponseTime > 5000) {
      issues.push(`High response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    }

    if (metrics.rateLimitHits > 10) {
      issues.push(`High rate limit hits: ${metrics.rateLimitHits}`);
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (issues.length === 0) {
      status = 'healthy';
    } else if (issues.length <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      metrics,
      issues,
    };
  }

  async resetMetrics(): Promise<void> {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastUpdated: new Date(),
    };

    await this.storeMetrics();
    this.logger.log('GPS metrics reset');
  }

  private async storeMetrics(): Promise<void> {
    try {
      await this.redisService.setJson('gps_metrics', this.metrics, 3600); // 1 hour TTL
    } catch (error) {
      this.logger.error('Failed to store GPS metrics:', error);
    }
  }

  async logApiCall(
    method: string,
    endpoint: string,
    success: boolean,
    responseTime: number,
    error?: string,
  ): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      success,
      responseTime,
      error,
    };

    if (success) {
      this.logger.log(`GPS API Call: ${method} ${endpoint} - ${responseTime}ms`);
    } else {
      this.logger.error(`GPS API Call Failed: ${method} ${endpoint} - ${responseTime}ms`, error);
    }

    await this.recordRequest(success, responseTime);
  }
}


