import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GpsValidationService } from './gps-validation.service';
import { GpsApiService } from './gps-api.service';
import { GPS_CONSTANTS, GPS_STATUS_TYPES } from '../constants/gps.constants';

export interface GpsAlert {
  type: keyof typeof GPS_STATUS_TYPES.ALERT_TYPES;
  ambulanceId: string;
  ticketId?: string;
  severity: keyof typeof GPS_STATUS_TYPES.ALERT_SEVERITY;
  message: string;
  timestamp: Date;
  requiresAction: boolean;
  metadata?: any;
}

@Injectable()
export class GpsMonitoringEnhancedService {
  private readonly logger = new Logger(GpsMonitoringEnhancedService.name);

  constructor(
    private prisma: PrismaService,
    private gpsValidationService: GpsValidationService,
    private gpsApiService: GpsApiService,
  ) {}

  /**
   * Check GPS health for all active ambulances
   */
  async checkGPSHealth(): Promise<GpsAlert[]> {
    const alerts: GpsAlert[] = [];
    
    try {
      const activeAmbulances = await this.prisma.ambulance.findMany({
        where: {
          status: 'IN_USE',
          deletedAt: null,
        },
        include: {
          assignments: {
            where: {
              status: { in: ['ASSIGNED', 'EN_ROUTE', 'AT_PICKUP', 'PATIENT_LOADED', 'ARRIVED'] as any[] },
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      for (const ambulance of activeAmbulances) {
        const alert = await this.checkAmbulanceGPSHealth(ambulance);
        if (alert) {
          alerts.push(alert);
        }
      }
    } catch (error) {
      this.logger.error('Error checking GPS health:', error);
    }

    return alerts;
  }

  /**
   * Check GPS health for a specific ambulance
   */
  private async checkAmbulanceGPSHealth(ambulance: any): Promise<GpsAlert | null> {
    try {
      if (!ambulance.id) {
        return this.createAlert(
          'SIGNAL_LOSS',
          ambulance.id,
          'MEDIUM',
          'No GPS device assigned to ambulance',
          true,
        );
      }

      const gpsData = await this.gpsApiService.getVehicleLocation(ambulance.id);
      
      if (!gpsData) {
        return this.createAlert(
          'SIGNAL_LOSS',
          ambulance.id,
          'HIGH',
          'GPS signal lost',
          true,
        );
      }

      const validation = await this.gpsValidationService.validateVehicleStatus(gpsData);
      
      if (!validation.isValid) {
        return this.createAlert(
          'INVALID_COORDINATES',
          ambulance.id,
          'MEDIUM',
          `GPS validation failed: ${validation.error}`,
          false,
        );
      }

      // Check for stale data
      const dataAge = Date.now() - gpsData.location.timestamp.getTime();
      if (dataAge > GPS_CONSTANTS.TIME.GPS_DATA_MAX_AGE) {
        return this.createAlert(
          'STALE_DATA',
          ambulance.id,
          'MEDIUM',
          `GPS data is stale (${Math.round(dataAge / 1000)}s old)`,
          false,
        );
      }

      // Check for speed violations
      const speed = gpsData.location.speed || 0;
      if (speed > GPS_CONSTANTS.SPEED.MAX_REASONABLE_SPEED) {
        return this.createAlert(
          'SPEED_VIOLATION',
          ambulance.id,
          'HIGH',
          `Speed violation: ${speed.toFixed(1)} km/h`,
          true,
        );
      }

      return null; // No alerts
    } catch (error) {
      this.logger.error(`Error checking GPS health for ambulance ${ambulance.id}:`, error);
      return this.createAlert(
        'SIGNAL_LOSS',
        ambulance.id,
        'HIGH',
        'GPS health check failed',
        true,
      );
    }
  }

  /**
   * Create a GPS alert
   */
  private createAlert(
    type: keyof typeof GPS_STATUS_TYPES.ALERT_TYPES,
    ambulanceId: string,
    severity: keyof typeof GPS_STATUS_TYPES.ALERT_SEVERITY,
    message: string,
    requiresAction: boolean,
    ticketId?: string,
  ): GpsAlert {
    return {
      type,
      ambulanceId,
      ticketId,
      severity,
      message,
      timestamp: new Date(),
      requiresAction,
    };
  }

  /**
   * Get system health summary
   */
  async getSystemHealth(): Promise<{
    isHealthy: boolean;
    lastUpdate: Date;
    activeConnections: number;
    errorRate: number;
    averageResponseTime: number;
    alerts: GpsAlert[];
  }> {
    const alerts = await this.checkGPSHealth();
    const activeAmbulances = await this.prisma.ambulance.count({
      where: { status: 'IN_USE', deletedAt: null },
    });

    return {
      isHealthy: alerts.length === 0,
      lastUpdate: new Date(),
      activeConnections: activeAmbulances,
      errorRate: alerts.length / Math.max(activeAmbulances, 1),
      averageResponseTime: 0, // Would need to implement response time tracking
      alerts,
    };
  }
}
