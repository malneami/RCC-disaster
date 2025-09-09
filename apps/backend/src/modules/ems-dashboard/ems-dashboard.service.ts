import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmsDashboardService {
  private readonly logger = new Logger(EmsDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(): Promise<any> {
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
      },
      recentAlerts,
      timestamp: new Date().toISOString(),
    };
  }

  async getAmbulanceStatus(ambulanceId: string): Promise<any> {
    const ambulance = await this.prisma.ambulance.findUnique({
      where: { id: ambulanceId },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        assignments: {
          where: {
            status: { in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'] },
            deletedAt: null,
          },
          include: {
            ticket: {
              select: {
                id: true,
                ticketNumber: true,
                priority: true,
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        gpsTrackingLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        alerts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ambulance) {
      throw new Error(`Ambulance ${ambulanceId} not found`);
    }

    return {
      ambulance: {
        id: ambulance.id,
        callSign: ambulance.callSign,
        plateNumber: ambulance.plateNumber,
        type: ambulance.type,
        status: ambulance.status,
        baseStation: ambulance.baseStation,
      },
      driver: ambulance.driver,
      currentLocation: ambulance.gpsTrackingLogs[0] ? {
        latitude: ambulance.gpsTrackingLogs[0].latitude,
        longitude: ambulance.gpsTrackingLogs[0].longitude,
        speed: ambulance.gpsTrackingLogs[0].speed,
        direction: ambulance.gpsTrackingLogs[0].direction,
        timestamp: ambulance.gpsTrackingLogs[0].timestamp,
        address: ambulance.gpsTrackingLogs[0].locationAddress,
      } : null,
      activeAssignment: ambulance.assignments[0] || null,
      alertCount: ambulance.alerts.length,
      alerts: ambulance.alerts,
    };
  }

  async getPerformanceReport(startDate: Date, endDate: Date): Promise<any> {
    // Validate dates
    const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
      ? startDate 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    
    const validEndDate = endDate instanceof Date && !isNaN(endDate.getTime()) 
      ? endDate 
      : new Date(); // Default to now

    try {

      const metrics = await this.prisma.eMSPerformanceMetric.findMany({
      where: {
        date: {
          gte: validStartDate,
          lte: validEndDate,
        },
      },
      include: {
        ambulance: {
          select: {
            id: true,
            callSign: true,
            plateNumber: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const summary = this.calculatePerformanceSummary(metrics);

      return {
        summary,
        metrics,
        period: {
          startDate: validStartDate.toISOString(),
          endDate: validEndDate.toISOString(),
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error generating performance report:', error);
      // Return empty report on error
      return {
        summary: {
          totalAssignments: 0,
          avgResponseTime: 0,
          onTimeArrivals: 0,
          totalDistance: 0,
          avgAssignmentDuration: 0,
        },
        metrics: [],
        period: {
          startDate: validStartDate.toISOString(),
          endDate: validEndDate.toISOString(),
        },
        generatedAt: new Date().toISOString(),
        error: 'Failed to generate performance report',
      };
    }
  }

  async getFleetStatus(): Promise<any> {
    const ambulances = await this.prisma.ambulance.findMany({
      where: { isActive: true },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        gpsTrackingLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        assignments: {
          where: {
            status: { in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'] },
            deletedAt: null,
          },
          include: {
            ticket: {
              select: {
                ticketNumber: true,
                priority: true,
              },
            },
          },
        },
        alerts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { callSign: 'asc' },
    });

    const fleetSummary = this.calculateFleetSummary(ambulances);

    return {
      summary: fleetSummary,
      ambulances: ambulances.map(ambulance => this.mapAmbulanceToFleetStatus(ambulance)),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getDriverPerformance(driverId: string, days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [assignments, schedules, driver] = await Promise.all([
      this.getDriverAssignments(driverId, startDate, endDate),
      this.getDriverSchedules(driverId, startDate, endDate),
      this.getDriver(driverId),
    ]);

    if (!driver) {
      throw new Error(`Driver ${driverId} not found`);
    }

    const performance = this.calculateDriverPerformance(assignments, schedules);

    return {
      driver,
      performance,
      assignments,
      schedules,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
      generatedAt: new Date().toISOString(),
    };
  }


  private calculatePerformanceSummary(metrics: any[]): any {
    return {
      totalTransfers: metrics.reduce((sum, m) => sum + m.totalTransfers, 0),
      averageResponseTime: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m.averageResponseTime || 0), 0) / metrics.length 
        : 0,
      averageTransferTime: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m.averageTransferTime || 0), 0) / metrics.length 
        : 0,
      totalDistance: metrics.reduce((sum, m) => sum + (m.totalDistanceKm || 0), 0),
      onTimeArrivals: metrics.reduce((sum, m) => sum + (m.onTimeArrivals || 0), 0),
      delayedArrivals: metrics.reduce((sum, m) => sum + (m.delayedArrivals || 0), 0),
      cancelledTransfers: metrics.reduce((sum, m) => sum + (m.cancelledTransfers || 0), 0),
      equipmentFailures: metrics.reduce((sum, m) => sum + (m.equipmentFailures || 0), 0),
    };
  }

  private calculateFleetSummary(ambulances: any[]): any {
    return {
      total: ambulances.length,
      available: ambulances.filter(a => a.status === 'AVAILABLE').length,
      inUse: ambulances.filter(a => a.status === 'IN_USE').length,
      offline: ambulances.filter(a => a.status === 'OFFLINE').length,
      withAlerts: ambulances.filter(a => a.alerts.length > 0).length,
    };
  }

  private mapAmbulanceToFleetStatus(ambulance: any): any {
    return {
      id: ambulance.id,
      callSign: ambulance.callSign,
      plateNumber: ambulance.plateNumber,
      type: ambulance.type,
      status: ambulance.status,
      baseStation: ambulance.baseStation,
      driver: ambulance.driver,
      currentLocation: ambulance.gpsTrackingLogs[0] ? {
        latitude: ambulance.gpsTrackingLogs[0].latitude,
        longitude: ambulance.gpsTrackingLogs[0].longitude,
        speed: ambulance.gpsTrackingLogs[0].speed,
        timestamp: ambulance.gpsTrackingLogs[0].timestamp,
      } : null,
      activeAssignment: ambulance.assignments[0] || null,
      alertCount: ambulance.alerts.length,
      alerts: ambulance.alerts,
    };
  }

  private async getDriverAssignments(driverId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.eMSAssignment.findMany({
      where: {
        driverId,
        assignedAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: {
        ambulance: { select: { callSign: true, plateNumber: true } },
        ticket: { select: { ticketNumber: true, priority: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  private async getDriverSchedules(driverId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.driverSchedule.findMany({
      where: {
        driverId,
        shiftStart: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      orderBy: { shiftStart: 'desc' },
    });
  }

  private async getDriver(driverId: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    });
  }

  private calculateDriverPerformance(assignments: any[], schedules: any[]): any {
    return {
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter(a => a.status === 'COMPLETED').length,
      cancelledAssignments: assignments.filter(a => a.status === 'CANCELLED').length,
      totalSchedules: schedules.length,
      totalOvertimeHours: schedules.reduce((sum, s) => sum + (s.overtimeHours || 0), 0),
      averageResponseTime: 0,
      onTimeArrivals: 0,
    };
  }


}