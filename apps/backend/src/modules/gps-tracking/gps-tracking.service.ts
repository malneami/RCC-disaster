import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGpsLogDto } from './dto/create-gps-log.dto';
import { GpsFilterDto } from './dto/gps-filter.dto';
import { GPSTrackingLog, Prisma } from '@prisma/client';

interface GpsFilters {
  ambulanceId?: string;
  fromDate?: string;
  toDate?: string;
  minSpeed?: number;
  maxSpeed?: number;
  limit?: number;
}

@Injectable()
export class GpsTrackingService {
  private readonly logger = new Logger(GpsTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createGpsLogDto: CreateGpsLogDto): Promise<GPSTrackingLog> {
    const ambulance = await this.prisma.ambulance.findUnique({
      where: { id: createGpsLogDto.ambulanceId },
    });

    if (!ambulance) {
      throw new NotFoundException(`Ambulance with ID ${createGpsLogDto.ambulanceId} not found`);
    }

    const gpsLog = await this.prisma.gPSTrackingLog.create({
      data: {
        ...createGpsLogDto,
        timestamp: new Date(createGpsLogDto.timestamp),
      },
      include: this.getGpsLogInclude(),
    });

    this.logger.log(`GPS log created for ambulance ${ambulance.callSign}`);
    return gpsLog;
  }

  async findAll(filters: GpsFilters = {}): Promise<GPSTrackingLog[]> {
    const where = this.buildWhereClause(filters);

    return this.prisma.gPSTrackingLog.findMany({
      where,
      include: this.getGpsLogInclude(),
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
    });
  }

  async findById(id: string): Promise<GPSTrackingLog> {
    const gpsLog = await this.prisma.gPSTrackingLog.findUnique({
      where: { id },
      include: this.getDetailedGpsLogInclude(),
    });

    if (!gpsLog) {
      throw new NotFoundException(`GPS log with ID ${id} not found`);
    }

    return gpsLog;
  }

  async getLatestLocation(ambulanceId: string): Promise<GPSTrackingLog | null> {
    return this.prisma.gPSTrackingLog.findFirst({
      where: { ambulanceId },
      include: this.getGpsLogInclude(),
      orderBy: { timestamp: 'desc' },
    });
  }

  async getLocationHistory(ambulanceId: string, hours: number = 24): Promise<GPSTrackingLog[]> {
    const fromDate = new Date();
    fromDate.setHours(fromDate.getHours() - hours);

    return this.prisma.gPSTrackingLog.findMany({
      where: {
        ambulanceId,
        timestamp: {
          gte: fromDate,
        },
      },
      include: this.getGpsLogInclude(),
      orderBy: { timestamp: 'asc' },
    });
  }

  async getActiveAmbulancesLocations(): Promise<GPSTrackingLog[]> {
    const activeAmbulances = await this.prisma.ambulance.findMany({
      where: {
        status: { in: ['AVAILABLE', 'IN_USE'] },
        isActive: true,
      },
      select: { id: true },
    });

    const ambulanceIds = activeAmbulances.map(ambulance => ambulance.id);

    const latestLocations = await Promise.all(
      ambulanceIds.map(async (ambulanceId) => {
        return this.prisma.gPSTrackingLog.findFirst({
          where: { ambulanceId },
          include: this.getDetailedGpsLogInclude(),
          orderBy: { timestamp: 'desc' },
        });
      })
    );

    return latestLocations.filter(location => location !== null);
  }

  async getRouteForAssignment(assignmentId: string): Promise<GPSTrackingLog[]> {
    const assignment = await this.prisma.eMSAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        ambulanceId: true,
        assignedAt: true,
        journeyStartTime: true,
        journeyEndTime: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    const startTime = assignment.journeyStartTime || assignment.assignedAt;
    const endTime = assignment.journeyEndTime || new Date();

    return this.prisma.gPSTrackingLog.findMany({
      where: {
        ambulanceId: assignment.ambulanceId,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: this.getGpsLogInclude(),
      orderBy: { timestamp: 'asc' },
    });
  }

  async getSpeedViolations(minSpeed: number = 100): Promise<GPSTrackingLog[]> {
    return this.prisma.gPSTrackingLog.findMany({
      where: {
        speed: {
          gt: minSpeed,
        },
      },
      include: this.getDetailedGpsLogInclude(),
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async getFuelConsumption(ambulanceId: string, days: number = 7): Promise<any> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const logs = await this.prisma.gPSTrackingLog.findMany({
      where: {
        ambulanceId,
        timestamp: {
          gte: fromDate,
        },
        fuelLevel: {
          not: null,
        },
      },
      select: {
        fuelLevel: true,
        timestamp: true,
        speed: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length < 2) {
      return {
        totalConsumption: 0,
        averageConsumption: 0,
        dataPoints: logs.length,
      };
    }

    const fuelConsumption = this.calculateFuelConsumption(logs);

    return {
      totalConsumption: fuelConsumption.total,
      averageConsumption: fuelConsumption.average,
      dataPoints: logs.length,
      consumptionEvents: fuelConsumption.events,
    };
  }

  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.gPSTrackingLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old GPS logs older than ${daysToKeep} days`);
    return result.count;
  }

  private getGpsLogInclude() {
    return {
      ambulance: {
        select: {
          id: true,
          callSign: true,
          plateNumber: true,
          status: true,
        },
      },
    };
  }

  private getDetailedGpsLogInclude() {
    return {
      ambulance: {
        select: {
          id: true,
          callSign: true,
          plateNumber: true,
          status: true,
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
        },
      },
    };
  }

  private buildWhereClause(filters: GpsFilters): Prisma.GPSTrackingLogWhereInput {
    const where: Prisma.GPSTrackingLogWhereInput = {};

    if (filters.ambulanceId) where.ambulanceId = filters.ambulanceId;

    if (filters.fromDate || filters.toDate) {
      where.timestamp = {};
      if (filters.fromDate) where.timestamp.gte = new Date(filters.fromDate);
      if (filters.toDate) where.timestamp.lte = new Date(filters.toDate);
    }

    if (filters.minSpeed !== undefined || filters.maxSpeed !== undefined) {
      where.speed = {};
      if (filters.minSpeed !== undefined) where.speed.gte = filters.minSpeed;
      if (filters.maxSpeed !== undefined) where.speed.lte = filters.maxSpeed;
    }

    return where;
  }

  private calculateFuelConsumption(logs: any[]): { total: number; average: number; events: number } {
    let totalConsumption = 0;
    let consumptionEvents = 0;

    for (let i = 1; i < logs.length; i++) {
      const prevLog = logs[i - 1];
      const currentLog = logs[i];

      if (prevLog.fuelLevel && currentLog.fuelLevel) {
        const fuelChange = prevLog.fuelLevel - currentLog.fuelLevel;
        if (fuelChange > 0) {
          totalConsumption += fuelChange;
          consumptionEvents++;
        }
      }
    }

    return {
      total: totalConsumption,
      average: consumptionEvents > 0 ? totalConsumption / consumptionEvents : 0,
      events: consumptionEvents,
    };
  }
}