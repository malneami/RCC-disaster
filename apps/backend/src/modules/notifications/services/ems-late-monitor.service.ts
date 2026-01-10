import { Injectable, Logger, Inject, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../notifications.service';
import { NotificationType, NotificationPriority, NotificationCategory, UserRole, AssignmentStatus, CaseType } from '@prisma/client';

@Injectable()
export class EmsLateMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmsLateMonitorService.name);
  private timers = new Map<string, NodeJS.Timeout[]>(); // Key: `assignmentId`, Value: array of timers for different layers
  private readonly ESCALATION_DELAY_MINUTES = 10; // Escalate to RCC 10 minutes after first EMS notification

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Initialize timers on module startup - recover from active assignments in database
   */
  async onModuleInit() {
    try {
      await this.recoverTimersFromActiveAssignments();
    } catch (error) {
      this.logger.error('Error initializing EMS Late Monitor Service:', error);
    }
  }

  /**
   * Cleanup timers on module shutdown
   */
  async onModuleDestroy() {
    try {
      for (const [assignmentId, timers] of this.timers.entries()) {
        timers.forEach(timer => clearTimeout(timer));
      }
      this.timers.clear();
    } catch (error) {
      this.logger.error('Error destroying EMS Late Monitor Service:', error);
    }
  }

  /**
   * Check if an assignment is acknowledged
   * An assignment is considered acknowledged if:
   * - emsContactTime is set, OR
   * - Status is EN_ROUTE or higher (not EMS_CONTACT)
   */
  private isAcknowledged(assignment: any): boolean {
    if (assignment.emsContactTime) {
      return true;
    }
    
    // Status progression: EMS_CONTACT -> EN_ROUTE -> EMS_ARRIVAL -> DEPARTED -> ARRIVED
    const acknowledgedStatuses: AssignmentStatus[] = ['EN_ROUTE', 'EMS_ARRIVAL', 'DEPARTED', 'ARRIVED', 'CANCELLED'];
    return acknowledgedStatuses.includes(assignment.status);
  }

  /**
   * Schedule monitoring for a new EMS assignment
   * Only starts monitoring when BOTH ambulance and driver are assigned
   * Uses ETA to origin to determine expected arrival time
   */
  async scheduleMonitoring(assignmentId: string): Promise<void> {
    try {
      this.cancelTimers(assignmentId);

      const assignment = await this.prisma.eMSAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          ticket: {
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  nationalId: true,
                },
              },
              originHospital: {
                select: {
                  id: true,
                  name: true,
                },
              },
              destinationHospital: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          ambulance: {
            select: {
              id: true,
              callSign: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!assignment) {
        return;
      }

      // Only monitor if BOTH ambulance and driver are assigned
      if (!assignment.ambulanceId || !assignment.driverId) {
        this.logger.debug(`Assignment ${assignmentId} doesn't have both ambulance and driver assigned yet, skipping monitoring`);
        return;
      }

      // Skip if already acknowledged or completed
      if (this.isAcknowledged(assignment) || assignment.status === 'ARRIVED' || assignment.status === 'CANCELLED') {
        return;
      }

      // Need ETA to origin to calculate expected arrival time
      if (!assignment.etaToOrigin) {
        this.logger.debug(`Assignment ${assignmentId} doesn't have etaToOrigin yet, will retry after ETA is calculated`);
        setTimeout(async () => {
          await this.scheduleMonitoring(assignmentId);
        }, 5000); 
        return;
      }

      const crewAssignedAt = assignment.updatedAt;
      const expectedArrivalTime = new Date(crewAssignedAt.getTime() + assignment.etaToOrigin * 60 * 1000);
      const now = Date.now();
      const expectedArrivalTimeMs = expectedArrivalTime.getTime();

      const timers: NodeJS.Timeout[] = [];

      if (now >= expectedArrivalTimeMs) {
        await this.checkAssignmentStatus(assignmentId, 'first_warning');
      } else {
        const remainingMs = expectedArrivalTimeMs - now;
        const timer1 = setTimeout(async () => {
          await this.checkAssignmentStatus(assignmentId, 'first_warning');
        }, remainingMs);
        timers.push(timer1);
      }

      const escalationTime = expectedArrivalTimeMs + (this.ESCALATION_DELAY_MINUTES * 60 * 1000);
      if (now >= escalationTime) {
        await this.checkAssignmentStatus(assignmentId, 'escalation');
      } else {
        const remainingUntilEscalation = escalationTime - now;
        const timer2 = setTimeout(async () => {
          await this.checkAssignmentStatus(assignmentId, 'escalation');
        }, remainingUntilEscalation);
        timers.push(timer2);
      }

      if (timers.length > 0) {
        this.timers.set(assignmentId, timers);
      }
    } catch (error) {
      this.logger.error(`Error scheduling monitoring for assignment ${assignmentId}:`, error);
    }
  }

  /**
   * Check assignment status and create notifications if needed
   */
  private async checkAssignmentStatus(assignmentId: string, layer: 'first_warning' | 'escalation'): Promise<void> {
    try {
      const assignment = await this.prisma.eMSAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          ticket: {
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  nationalId: true,
                },
              },
              originHospital: {
                select: {
                  id: true,
                  name: true,
                },
              },
              destinationHospital: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          ambulance: {
            select: {
              id: true,
              callSign: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!assignment) {
        return;
      }

      // Skip if assignment is completed or cancelled
      if (assignment.status === 'ARRIVED' || assignment.status === 'CANCELLED') {
        this.cancelTimers(assignmentId);
        return;
      }

      // Skip if already acknowledged (arrived at origin)
      if (this.isAcknowledged(assignment) || assignment.status === 'EMS_ARRIVAL' || assignment.status === 'AT_PICKUP') {
        this.cancelTimers(assignmentId);
        return;
      }

      // Check if they're late based on ETA
      if (!assignment.etaToOrigin) {
        return; // No ETA, can't determine if late
      }

      const crewAssignedAt = assignment.updatedAt; // When crew was assigned
      const expectedArrivalTime = new Date(crewAssignedAt.getTime() + assignment.etaToOrigin * 60 * 1000);
      const now = new Date();
      
      // Calculate how late they are
      const lateMinutes = Math.floor((now.getTime() - expectedArrivalTime.getTime()) / (1000 * 60));

      // Only create notification if they're actually late
      if (lateMinutes > 0) {
        if (layer === 'first_warning') {
          await this.createEmsLateNotification(assignment, lateMinutes, 'first_warning');
        } else if (layer === 'escalation') {
          await this.createEmsLateNotification(assignment, lateMinutes, 'escalation');
          this.cancelTimers(assignmentId); // Cancel timers after escalation
        }
      }
    } catch (error) {
      this.logger.error(`Error checking assignment status for ${assignmentId}:`, error);
    }
  }

  /**
   * Create EMS late notification
   * First warning goes to EMS, escalation goes to RCC
   */
  private async createEmsLateNotification(
    assignment: any,
    lateMinutes: number,
    layer: 'first_warning' | 'escalation',
  ): Promise<void> {
    try {
      const systemUserId = await this.notificationsService.getSystemUserId();
      const ticket = assignment.ticket;
      
      if (!ticket) {
        this.logger.warn(`Ticket not found for assignment ${assignment.id}`);
        return;
      }

      const patientName = ticket.patient
        ? `${ticket.patient.firstName || ''} ${ticket.patient.lastName || ''}`.trim() || 'Unknown Patient'
        : 'Unknown Patient';
      const patientNationalId = ticket.patient?.nationalId || 'N/A';
      const hospitalName = ticket.destinationHospital?.name || ticket.originHospital?.name || 'Unknown Hospital';
      const ambulanceCallSign = assignment.ambulance?.callSign || 'N/A';
      const driverName = assignment.driver
        ? `${assignment.driver.firstName || ''} ${assignment.driver.lastName || ''}`.trim() || 'Unknown Driver'
        : 'Unknown Driver';

      let recipientUserIds: string[] = [];
      let priority: NotificationPriority;
      let title: string;
      let message: string;

      if (layer === 'first_warning') {
        const emsUserIds = await this.notificationsService.getUsersByRole(UserRole.EMS);
        if (emsUserIds.length === 0) {
          return;
        }
        recipientUserIds = emsUserIds;
        priority = NotificationPriority.MEDIUM;
        title = `EMS Late Arrival - ${hospitalName} - ${ticket.pathway || 'GENERAL'}`;
        message = `EMS assignment for patient ${patientName} (ID: ${patientNationalId}) at ${hospitalName} is ${lateMinutes} minute${lateMinutes > 1 ? 's' : ''} late. Expected arrival time has passed. Ambulance: ${ambulanceCallSign}, Driver: ${driverName}. Please respond immediately.`;
      } else {
        // Escalation to RCC
        const rccUserIds = await this.notificationsService.getUsersByRole(UserRole.RCC);
        if (rccUserIds.length === 0) {
          return;
        }
        recipientUserIds = rccUserIds;
        priority = NotificationPriority.CRITICAL;
        title = `URGENT: EMS Late Arrival Escalation - ${hospitalName} - ${ticket.pathway || 'GENERAL'}`;
        message = `CRITICAL: EMS assignment for patient ${patientName} (ID: ${patientNationalId}) at ${hospitalName} is ${lateMinutes} minute${lateMinutes > 1 ? 's' : ''} late. Expected arrival time has passed and EMS has not responded. Ambulance: ${ambulanceCallSign}, Driver: ${driverName}. Immediate RCC intervention required.`;
      }

      const metadata = JSON.stringify({
        assignmentId: assignment.id,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        hospitalId: ticket.destinationHospitalId || ticket.originHospitalId,
        hospitalName,
        pathway: ticket.pathway || 'GENERAL',
        lateMinutes,
        layer,
        ambulanceCallSign,
        driverName,
        source: 'ems_late_monitor',
      });

      const systemPatientId = await this.notificationsService['getSystemPatientId']();

      const notification = await this.notificationsService.createNotification(
        {
          type: NotificationType.EMS_LATE_CASE,
          priority,
          title,
          message,
          caseType: ticket.pathway === 'STEMI' 
            ? CaseType.STEMI 
            : ticket.pathway === 'STROKE' 
            ? CaseType.STROKE 
            : ticket.pathway === 'TRAUMA'
            ? CaseType.TRAUMA
            : CaseType.STEMI, // Default to STEMI as fallback for GENERAL pathway
          caseId: ticket.id,
          ticketId: ticket.id,
          patientId: ticket.patientId || (await this.notificationsService['getSystemPatientId']()).id,
          patientName,
          category: NotificationCategory.EMS,
          recipientUserIds,
          metadata,
        },
        systemUserId,
      );

      // Emit socket events
      if (notification) {
        this.notificationsService['notificationsGateway'].emitNotificationCreated(notification);
        this.notificationsService['notificationsGateway'].emitNotificationByCategory(
          notification,
          NotificationCategory.EMS,
        );
        
        if (layer === 'first_warning') {
          this.notificationsService['notificationsGateway'].emitNotificationByRole(notification, [UserRole.EMS]);
        } else {
          this.notificationsService['notificationsGateway'].emitNotificationByRole(notification, [UserRole.RCC]);
        }
      }
    } catch (error) {
      this.logger.error(`Error creating EMS late notification:`, error);
    }
  }

  /**
   * Update acknowledgment status (called when assignment is acknowledged)
   */
  async updateAcknowledgment(assignmentId: string): Promise<void> {
    try {
      const assignment = await this.prisma.eMSAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        return;
      }

      if (this.isAcknowledged(assignment)) {
        this.cancelTimers(assignmentId);
      }
    } catch (error) {
      this.logger.error(`Error updating acknowledgment for assignment ${assignmentId}:`, error);
    }
  }

  /**
   * Cancel timers for an assignment
   */
  cancelTimers(assignmentId: string): void {
    const timers = this.timers.get(assignmentId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.timers.delete(assignmentId);
    }
  }

  /**
   * Recover timers from active assignments in database
   */
  private async recoverTimersFromActiveAssignments(): Promise<void> {
    try {
      const activeAssignments = await this.prisma.eMSAssignment.findMany({
        where: {
          status: {
            notIn: ['ARRIVED', 'CANCELLED'],
          },
          emsContactTime: null,
          ambulanceId: { not: null },
          driverId: { not: null },
        },
        include: {
          ticket: {
            select: {
              id: true,
            },
          },
        },
      });

      let recoveredCount = 0;
      for (const assignment of activeAssignments) {
        if (!this.isAcknowledged(assignment)) {
          await this.scheduleMonitoring(assignment.id);
          recoveredCount++;
        }
      }
      this.logger.log(`Recovered ${recoveredCount} EMS late monitoring timers from active assignments`);
    } catch (error) {
      this.logger.error('Error recovering timers from active assignments:', error);
    }
  }
}

