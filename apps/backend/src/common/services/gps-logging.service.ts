import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GpsConfig } from '../../config/gps.config';

@Injectable()
export class GpsLoggingService {
  private readonly logger = new Logger(GpsLoggingService.name);
  private readonly gpsConfig: GpsConfig;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.gpsConfig = this.configService.get<GpsConfig>('gps')!;
  }

  /**
   * Log GPS API errors only (minimal logging)
   */
  async logApiError(vehicleId: string, endpoint: string, error: string): Promise<void> {
    try {
      if (!this.gpsConfig.enableApiLogging) return;

      await this.prisma.gPSApiLog.create({
        data: {
          vehicleId,
          endpoint,
          statusCode: 500,
          responseTime: 0,
          error,
          timestamp: new Date(),
        },
      });

      this.logger.error(`GPS API Error - ${endpoint}: ${error}`);
    } catch (error) {
      this.logger.error('Failed to log API error:', error);
    }
  }

  /**
   * Log GPS validation failures only
   */
  async logValidationFailure(vehicleId: string, error: string): Promise<void> {
    try {
      if (!this.gpsConfig.enableValidationLogging) return;

      await this.prisma.gPSValidationLog.create({
        data: {
          vehicleId,
          isValid: false,
          error,
          validationRules: JSON.stringify({ error }),
          timestamp: new Date(),
        },
      });

      this.logger.warn(`GPS Validation Failed - ${vehicleId}: ${error}`);
    } catch (error) {
      this.logger.error('Failed to log validation failure:', error);
    }
  }

  /**
   * Get recent API logs (errors only)
   */
  async getRecentApiLogs(limit: number = 50): Promise<any[]> {
    try {
      return await this.prisma.gPSApiLog.findMany({
        where: {
          error: { not: null },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error('Failed to get API logs:', error);
      return [];
    }
  }


  /**
   * Get validation logs (failures only)
   */
  async getValidationLogs(limit: number = 50): Promise<any[]> {
    try {
      return await this.prisma.gPSValidationLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error('Failed to get validation logs:', error);
      return [];
    }
  }

  /**
   * Clean up old logs (keep only last 7 days)
   */
  async cleanupOldLogs(): Promise<void> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      await Promise.all([
        this.prisma.gPSApiLog.deleteMany({
          where: { timestamp: { lt: sevenDaysAgo } },
        }),
        this.prisma.gPSValidationLog.deleteMany({
          where: { timestamp: { lt: sevenDaysAgo } },
        }),
      ]);

      this.logger.log('Cleaned up old GPS logs');
    } catch (error) {
      this.logger.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Mask API key for logging
   */
  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '***';
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
  }
}
