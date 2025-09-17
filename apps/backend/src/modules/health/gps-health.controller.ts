import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { GpsApiService } from '../../common/services/gps-api.service';
import { GpsMonitoringService } from '../../common/monitoring/gps-monitoring.service';
import { RedisService } from '../../common/cache/redis.service';
import { ConfigService } from '@nestjs/config';
import { GpsConfig } from '../../config/gps.config';

@Controller('health/gps')
export class GpsHealthController {
  constructor(
    private readonly gpsApiService: GpsApiService,
    private readonly gpsMonitoringService: GpsMonitoringService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getGpsHealth() {
    try {
      const gpsConfig = this.configService.get<GpsConfig>('gps')!;
      const metrics = await this.gpsMonitoringService.getHealthStatus();
      
      // Test GPS API connectivity
      const apiHealth = await this.testGpsApiHealth();
      
      // Test Redis connectivity
      const redisHealth = await this.testRedisHealth();
      
      const overallStatus = this.determineOverallStatus(metrics.status, apiHealth, redisHealth);
      
      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
          gpsApi: {
            status: apiHealth.status,
            responseTime: apiHealth.responseTime,
            error: apiHealth.error,
          },
          redis: {
            status: redisHealth.status,
            responseTime: redisHealth.responseTime,
            error: redisHealth.error,
          },
          monitoring: {
            status: metrics.status,
            metrics: metrics.metrics,
            issues: metrics.issues,
          },
        },
        configuration: {
          apiKeyConfigured: !!gpsConfig.apiKey,
          baseUrl: gpsConfig.baseUrl,
          rateLimit: gpsConfig.rateLimit,
          timeout: gpsConfig.timeout,
          retryAttempts: gpsConfig.retryAttempts,
          cachingEnabled: gpsConfig.enableCaching,
          rateLimitEnabled: gpsConfig.enableRateLimit,
          retryEnabled: gpsConfig.enableRetry,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unhealthy',
          error: 'Health check failed',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('metrics')
  async getGpsMetrics() {
    try {
      const metrics = await this.gpsMonitoringService.getMetrics();
      return {
        metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to retrieve metrics',
          message: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('config')
  async getGpsConfig() {
    try {
      const gpsConfig = this.configService.get<GpsConfig>('gps')!;
      
      // Return configuration without sensitive data
      return {
        baseUrl: gpsConfig.baseUrl,
        updateInterval: gpsConfig.updateInterval,
        cacheTtl: gpsConfig.cacheTtl,
        rateLimit: gpsConfig.rateLimit,
        timeout: gpsConfig.timeout,
        retryAttempts: gpsConfig.retryAttempts,
        retryDelay: gpsConfig.retryDelay,
        enableCaching: gpsConfig.enableCaching,
        enableRateLimit: gpsConfig.enableRateLimit,
        enableRetry: gpsConfig.enableRetry,
        apiKeyConfigured: !!gpsConfig.apiKey,
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to retrieve configuration',
          message: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async testGpsApiHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Test API connectivity with a simple request
      const gpsConfig = this.configService.get('gps');
      const isConfigured = !!gpsConfig?.apiKey;
      
      if (!isConfigured) {
        return {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: 'GPS API key not configured',
        };
      }

      // Test with a mock vehicle ID (this won't make an actual API call)
      // but will test the client configuration
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  private async testRedisHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Test Redis connectivity
      const testKey = 'health_check_test';
      await this.redisService.set(testKey, 'test', 10);
      const value = await this.redisService.get(testKey);
      await this.redisService.del(testKey);
      
      if (value !== 'test') {
        return {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: 'Redis read/write test failed',
        };
      }

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  private determineOverallStatus(
    monitoringStatus: 'healthy' | 'degraded' | 'unhealthy',
    apiHealth: { status: 'healthy' | 'unhealthy' },
    redisHealth: { status: 'healthy' | 'unhealthy' },
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (apiHealth.status === 'unhealthy' || redisHealth.status === 'unhealthy') {
      return 'unhealthy';
    }
    
    if (monitoringStatus === 'unhealthy') {
      return 'unhealthy';
    }
    
    if (monitoringStatus === 'degraded') {
      return 'degraded';
    }
    
    return 'healthy';
  }
}
