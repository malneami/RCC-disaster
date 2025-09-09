import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GpsApiService } from './gps-api.service';
import { GpsRetryService } from './gps-retry.service';
import { GpsMonitoringService } from '../monitoring/gps-monitoring.service';
import { EmsAlertService } from './ems-alert.service';
import { EmsGateway } from '../../modules/ems-gateway/ems.gateway';

@Injectable()
export class EmsOrchestrationService {
  private readonly logger = new Logger(EmsOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gpsApiService: GpsApiService,
    private readonly gpsRetryService: GpsRetryService,
    private readonly gpsMonitoringService: GpsMonitoringService,
    private readonly emsAlertService: EmsAlertService,
    private readonly emsGateway: EmsGateway,
  ) {}

  async syncAmbulanceLocations(): Promise<void> {
    try {
      this.logger.log('Starting ambulance location sync...');

      const activeAmbulances = await this.prisma.ambulance.findMany({
        where: {
          status: { in: ['AVAILABLE', 'IN_USE'] },
          isActive: true,
        },
        select: { id: true, vehicleId: true, callSign: true },
      });

      if (activeAmbulances.length === 0) {
        this.logger.log('No active ambulances found for location sync');
        return;
      }

      const vehicleIds = activeAmbulances.map(ambulance => ambulance.vehicleId);
      const locations = await this.gpsRetryService.executeWithRetry(
        () => this.gpsApiService.getMultipleVehicleLocations(vehicleIds),
        {
          attempts: 3,
          delay: 1000,
          backoff: 'exponential',
        }
      );

      for (const location of locations) {
        const ambulance = activeAmbulances.find(a => a.vehicleId === location.vehicleId);
        if (ambulance) {
          await this.createGpsLog(ambulance.id, location);
          await this.broadcastLocationUpdate(ambulance.id, location);
          this.logger.debug(`Updated location for ambulance ${ambulance.callSign}`);
        }
      }

      this.logger.log(`Location sync completed for ${locations.length} ambulances`);
    } catch (error) {
      this.logger.error(`Failed to sync ambulance locations: ${(error as Error).message}`);
    }
  }

  private async createGpsLog(ambulanceId: string, location: any): Promise<void> {
    await this.prisma.gPSTrackingLog.create({
      data: {
        ambulanceId,
        latitude: location.location.latitude,
        longitude: location.location.longitude,
        speed: location.location.speed,
        direction: location.location.direction,
        timestamp: location.location.timestamp,
        fuelLevel: location.fuelLevel,
        engineStatus: location.engineStatus,
        locationAddress: location.address,
        accuracy: location.location.accuracy,
      },
    });
  }

  private async broadcastLocationUpdate(ambulanceId: string, location: any): Promise<void> {
    await this.emsGateway.broadcastAmbulanceLocationUpdate(ambulanceId, {
      latitude: location.location.latitude,
      longitude: location.location.longitude,
      speed: location.location.speed,
      direction: location.location.direction,
      fuelLevel: location.fuelLevel,
      engineStatus: location.engineStatus,
      address: location.address,
      timestamp: location.location.timestamp,
    });
  }

  async processAssignmentStatusChange(assignmentId: string, newStatus: string): Promise<void> {
    try {
      const assignment = await this.prisma.eMSAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          ambulance: true,
          driver: true,
          ticket: {
            include: {
              patient: true,
              originHospital: true,
              destinationHospital: true,
            },
          },
        },
      });

      if (!assignment) {
        this.logger.error(`Assignment ${assignmentId} not found`);
        return;
      }

      const ambulanceStatus = this.getAmbulanceStatusFromAssignment(newStatus);
      await this.updateAmbulanceStatus(assignment.ambulanceId, ambulanceStatus);
      await this.broadcastAssignmentUpdate(assignmentId, newStatus, assignment);

      this.logger.log(`Assignment ${assignmentId} status updated to ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to process assignment status change: ${(error as Error).message}`);
    }
  }

  private getAmbulanceStatusFromAssignment(status: string): string {
    switch (status) {
      case 'ASSIGNED':
      case 'EN_ROUTE':
      case 'ARRIVED':
      case 'PATIENT_LOADED':
      case 'IN_TRANSIT':
        return 'IN_USE';
      case 'COMPLETED':
      case 'CANCELLED':
        return 'AVAILABLE';
      default:
        return 'AVAILABLE';
    }
  }

  private async updateAmbulanceStatus(ambulanceId: string, status: string): Promise<void> {
    await this.prisma.ambulance.update({
      where: { id: ambulanceId },
      data: { status: status as any },
    });
  }

  private async broadcastAssignmentUpdate(assignmentId: string, status: string, assignment: any): Promise<void> {
    await this.emsGateway.broadcastAssignmentStatusUpdate(assignmentId, {
      status,
      ambulance: {
        id: assignment.ambulance.id,
        callSign: assignment.ambulance.callSign,
        status: this.getAmbulanceStatusFromAssignment(status),
      },
      driver: {
        id: assignment.driver.id,
        name: `${assignment.driver.firstName} ${assignment.driver.lastName}`,
      },
      ticket: {
        id: assignment.ticket.id,
        ticketNumber: assignment.ticket.ticketNumber,
        priority: assignment.ticket.priority,
      },
    });
  }

  async calculatePerformanceMetrics(ambulanceId: string, date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [assignments, gpsLogs] = await Promise.all([
        this.getAssignmentsForDate(ambulanceId, startOfDay, endOfDay),
        this.getGpsLogsForDate(ambulanceId, startOfDay, endOfDay),
      ]);

      const metrics = this.calculateMetrics(assignments, gpsLogs);
      await this.savePerformanceMetrics(ambulanceId, startOfDay, metrics);
      await this.broadcastPerformanceUpdate(ambulanceId, metrics);

      this.logger.log(`Performance metrics calculated for ambulance ${ambulanceId} on ${date.toISOString()}`);
    } catch (error) {
      this.logger.error(`Failed to calculate performance metrics: ${(error as Error).message}`);
    }
  }

  private async getAssignmentsForDate(ambulanceId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.eMSAssignment.findMany({
      where: {
        ambulanceId,
        assignedAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: { ticket: true },
    });
  }

  private async getGpsLogsForDate(ambulanceId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.gPSTrackingLog.findMany({
      where: {
        ambulanceId,
        timestamp: { gte: startDate, lte: endDate },
      },
    });
  }

  private calculateMetrics(assignments: any[], gpsLogs: any[]): any {
    const totalTransfers = assignments.length;
    const completedTransfers = assignments.filter(a => a.status === 'COMPLETED').length;
    
    let totalResponseTime = 0;
    let totalTransferTime = 0;
    let totalDistance = 0;
    let onTimeArrivals = 0;
    let delayedArrivals = 0;

    for (const assignment of assignments) {
      if (assignment.actualArrivalTime && assignment.assignedAt) {
        const responseTime = (assignment.actualArrivalTime.getTime() - assignment.assignedAt.getTime()) / (1000 * 60);
        totalResponseTime += responseTime;
      }

      if (assignment.journeyStartTime && assignment.journeyEndTime) {
        const transferTime = (assignment.journeyEndTime.getTime() - assignment.journeyStartTime.getTime()) / (1000 * 60);
        totalTransferTime += transferTime;
      }

      if (assignment.distanceKm) {
        totalDistance += assignment.distanceKm;
      }

      if (assignment.estimatedArrivalTime && assignment.actualArrivalTime) {
        const delay = assignment.actualArrivalTime.getTime() - assignment.estimatedArrivalTime.getTime();
        if (delay <= 0) {
          onTimeArrivals++;
        } else {
          delayedArrivals++;
        }
      }
    }

    const fuelConsumption = this.calculateFuelConsumption(gpsLogs);

    return {
      totalTransfers,
      averageResponseTime: totalTransfers > 0 ? totalResponseTime / totalTransfers : 0,
      averageTransferTime: completedTransfers > 0 ? totalTransferTime / completedTransfers : 0,
      totalDistanceKm: totalDistance,
      fuelConsumptionLiters: fuelConsumption,
      maintenanceHours: 0,
      driverRating: 0,
      patientSatisfactionScore: 0,
      onTimeArrivals,
      delayedArrivals,
      cancelledTransfers: assignments.filter(a => a.status === 'CANCELLED').length,
      equipmentFailures: 0,
    };
  }

  private calculateFuelConsumption(gpsLogs: any[]): number {
    const fuelLogs = gpsLogs.filter(log => log.fuelLevel !== null).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let totalConsumption = 0;

    for (let i = 1; i < fuelLogs.length; i++) {
      const prevLog = fuelLogs[i - 1];
      const currentLog = fuelLogs[i];
      if (prevLog.fuelLevel && currentLog.fuelLevel) {
        const fuelChange = prevLog.fuelLevel - currentLog.fuelLevel;
        if (fuelChange > 0) {
          totalConsumption += fuelChange;
        }
      }
    }

    return totalConsumption;
  }

  private async savePerformanceMetrics(ambulanceId: string, date: Date, metrics: any): Promise<void> {
    const existingMetric = await this.prisma.eMSPerformanceMetric.findUnique({
      where: { ambulanceId_date: { ambulanceId, date } },
    });

    if (existingMetric) {
      await this.prisma.eMSPerformanceMetric.update({
        where: { id: existingMetric.id },
        data: metrics,
      });
    } else {
      await this.prisma.eMSPerformanceMetric.create({
        data: { ambulanceId, date, ...metrics },
      });
    }
  }

  private async broadcastPerformanceUpdate(ambulanceId: string, metrics: any): Promise<void> {
    await this.emsGateway.broadcastPerformanceUpdate(ambulanceId, {
      date: new Date().toISOString(),
      ...metrics,
    });
  }

  async runDailyMaintenanceTasks(): Promise<void> {
    try {
      this.logger.log('Running daily EMS maintenance tasks...');

      await Promise.all([
        this.syncAmbulanceLocations(),
        this.emsAlertService.runAllAlertChecks(),
        this.calculatePerformanceMetricsForYesterday(),
        this.cleanupOldGpsLogs(),
      ]);

      this.logger.log('Daily maintenance tasks completed');
    } catch (error) {
      this.logger.error(`Failed to run daily maintenance tasks: ${(error as Error).message}`);
    }
  }

  private async calculatePerformanceMetricsForYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const activeAmbulances = await this.prisma.ambulance.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const ambulance of activeAmbulances) {
      await this.calculatePerformanceMetrics(ambulance.id, yesterday);
    }
  }

  private async cleanupOldGpsLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const deletedCount = await this.prisma.gPSTrackingLog.deleteMany({
      where: { timestamp: { lt: cutoffDate } },
    });

    this.logger.log(`Cleaned up ${deletedCount.count} old GPS logs`);
  }

  async getEmsDashboardData(): Promise<any> {
    const [
      totalAmbulances,
      activeAmbulances,
      availableAmbulances,
      activeAssignments,
      activeSchedules,
      recentAlerts,
    ] = await Promise.all([
      this.prisma.ambulance.count({ where: { isActive: true } }),
      this.prisma.ambulance.count({ where: { status: 'IN_USE', isActive: true } }),
      this.prisma.ambulance.count({ where: { status: 'AVAILABLE', isActive: true } }),
      this.prisma.eMSAssignment.count({
        where: {
          status: { in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'] },
          deletedAt: null,
        },
      }),
      this.prisma.driverSchedule.count({ where: { status: 'ACTIVE' } }),
      this.prisma.eMSAlert.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          ambulance: { select: { callSign: true } },
          driver: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      summary: {
        totalAmbulances,
        activeAmbulances,
        availableAmbulances,
        activeAssignments,
        activeSchedules,
        maintenanceDue: recentAlerts.filter(alert => alert.type === 'MAINTENANCE_DUE').length,
        lowFuelAlerts: recentAlerts.filter(alert => alert.type === 'LOW_FUEL').length,
      },
      recentAlerts,
      timestamp: new Date().toISOString(),
    };
  }
}