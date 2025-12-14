import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AlertType, AlertPriority, AlertStatus } from '@prisma/client';

export interface CreateAlertData {
  type: AlertType;
  priority: AlertPriority;
  message: string;
  ambulanceId?: string;
  driverId?: string;
  equipmentId?: string;
  metadata?: any;
}

@Injectable()
export class EmsAlertService {
  private readonly logger = new Logger(EmsAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAlert(data: CreateAlertData): Promise<void> {
    await this.prisma.eMSAlert.create({
      data: {
        type: data.type,
        priority: data.priority,
        message: data.message,
        ambulanceId: data.ambulanceId,
        driverId: data.driverId,
        equipmentId: data.equipmentId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Alert created: ${data.type} - ${data.message}`);
  }

  async checkMaintenanceAlerts(): Promise<void> {
    await Promise.all([
      this.checkAmbulanceMaintenance(),
      this.checkEquipmentMaintenance(),
    ]);
  }

  private async checkAmbulanceMaintenance(): Promise<void> {
    const ambulancesWithMaintenanceDue = await this.prisma.ambulance.findMany({
      where: {
        nextMaintenanceDue: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        isActive: true,
      },
    });

    for (const ambulance of ambulancesWithMaintenanceDue) {
      if (ambulance.nextMaintenanceDue) {
        const daysUntilDue = Math.ceil(
          (ambulance.nextMaintenanceDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        const priority = this.getMaintenancePriority(daysUntilDue);

        const existingAlert = await this.prisma.eMSAlert.findFirst({
          where: {
            type: 'MAINTENANCE_DUE',
            ambulanceId: ambulance.id,
            status: 'ACTIVE',
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: 'MAINTENANCE_DUE',
            priority,
            message: `Maintenance due for ambulance ${ambulance.callSign} in ${daysUntilDue} days`,
            ambulanceId: ambulance.id,
            metadata: { daysUntilDue, nextMaintenanceDue: ambulance.nextMaintenanceDue },
          });
        }
      }
    }
  }

  private async checkEquipmentMaintenance(): Promise<void> {
    const equipmentWithInspectionDue = await this.prisma.equipmentInventory.findMany({
      where: {
        nextInspectionDue: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        ambulance: {
          select: {
            id: true,
            callSign: true,
          },
        },
      },
    });

    for (const equipment of equipmentWithInspectionDue) {
      if (equipment.nextInspectionDue) {
        const daysUntilDue = Math.ceil(
          (equipment.nextInspectionDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        const priority = this.getMaintenancePriority(daysUntilDue);

        const existingAlert = await this.prisma.eMSAlert.findFirst({
          where: {
            type: 'MAINTENANCE_DUE',
            equipmentId: equipment.id,
            status: 'ACTIVE',
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: 'MAINTENANCE_DUE',
            priority,
            message: `Equipment inspection due for ${equipment.equipmentType} (${equipment.serialNumber || 'N/A'}) in ${daysUntilDue} days`,
            ambulanceId: equipment.ambulanceId,
            equipmentId: equipment.id,
            metadata: { 
              daysUntilDue, 
              nextInspectionDue: equipment.nextInspectionDue,
              equipmentType: equipment.equipmentType,
              serialNumber: equipment.serialNumber,
            },
          });
        }
      }
    }
  }

  private getMaintenancePriority(daysUntilDue: number): AlertPriority {
    if (daysUntilDue <= 0) return 'CRITICAL';
    if (daysUntilDue <= 3) return 'HIGH';
    return 'MEDIUM';
  }

  async checkDriverOvertimeAlerts(): Promise<void> {
    const activeSchedules = await this.prisma.driverSchedule.findMany({
      where: {
        status: 'ACTIVE',
        shiftEnd: { lt: new Date() },
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        ambulance: { select: { id: true, callSign: true } },
      },
    });

    for (const schedule of activeSchedules) {
      const overtimeHours = schedule.overtimeHours || 0;
      
      if (overtimeHours > 2) {
        const priority = this.getOvertimePriority(overtimeHours);
        const existingAlert = await this.prisma.eMSAlert.findFirst({
          where: { type: 'DRIVER_OVERTIME', driverId: schedule.driverId, status: 'ACTIVE' },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: 'DRIVER_OVERTIME',
            priority,
            message: `Driver ${schedule.driver.firstName} ${schedule.driver.lastName} has ${overtimeHours} hours overtime`,
            driverId: schedule.driverId,
            ambulanceId: schedule.ambulanceId,
            metadata: { overtimeHours, scheduleId: schedule.id },
          });
        }
      }
    }
  }

  private getOvertimePriority(overtimeHours: number): AlertPriority {
    if (overtimeHours > 4) return 'CRITICAL';
    if (overtimeHours > 3) return 'HIGH';
    return 'MEDIUM';
  }

  async checkSpeedViolations(): Promise<void> {
    const speedViolations = await this.prisma.gPSTrackingLog.findMany({
      where: {
        speed: { gt: 100 },
        timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      include: {
        ambulance: {
          select: {
            id: true,
            callSign: true,
            driver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    for (const violation of speedViolations) {
      if (violation.speed && violation.ambulance.driver) {
        const priority = this.getSpeedPriority(violation.speed);
        const existingAlert = await this.prisma.eMSAlert.findFirst({
          where: {
            type: 'SPEED_VIOLATION',
            ambulanceId: violation.ambulanceId,
            status: 'ACTIVE',
            createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: 'SPEED_VIOLATION',
            priority,
            message: `Speed violation: ${violation.speed} km/h by ambulance ${violation.ambulance.callSign}`,
            ambulanceId: violation.ambulanceId,
            driverId: violation.ambulance.driver.id,
            metadata: { 
              speed: violation.speed, 
              location: { lat: violation.latitude, lng: violation.longitude },
              timestamp: violation.timestamp,
            },
          });
        }
      }
    }
  }

  private getSpeedPriority(speed: number): AlertPriority {
    if (speed > 120) return 'CRITICAL';
    if (speed > 110) return 'HIGH';
    return 'MEDIUM';
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await this.prisma.eMSAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });

    this.logger.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.prisma.eMSAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    this.logger.log(`Alert ${alertId} resolved`);
  }

  async runAllAlertChecks(): Promise<void> {
    this.logger.log('Running all EMS alert checks...');
    
    await Promise.all([
      this.checkMaintenanceAlerts(),
      this.checkDriverOvertimeAlerts(),
      this.checkSpeedViolations(),
    ]);

    this.logger.log('All EMS alert checks completed');
  }
}