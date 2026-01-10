import { Injectable, Logger, Inject, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../notifications.service';
import { NotificationType, NotificationPriority, NotificationCategory, UserRole, CaseType } from '@prisma/client';

interface CriticalTimeConfig {
  pathway: 'STEMI' | 'STROKE' | 'TRAUMA' | 'GENERAL';
  timeLimitMinutes: number;
  thresholdPercentage: number; 
}

@Injectable()
export class CriticalTimeMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CriticalTimeMonitorService.name);
  private timers = new Map<string, NodeJS.Timeout>(); // Key: `ticketId`
  private readonly THRESHOLD_PERCENTAGE = 0.85; // 85% threshold

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Initialize timers on module startup - recover from active tickets in database
   */
  async onModuleInit() {
    try {
      await this.recoverTimersFromActiveTickets();
      this.logger.log(`Critical Time Monitor Service initialized. Active timers: ${this.timers.size}`);
    } catch (error) {
      this.logger.error('Error initializing Critical Time Monitor Service:', error);
    }
  }

  /**
   * Cleanup timers on module shutdown
   */
  async onModuleDestroy() {
    try {
      // Clear all timers
      for (const [key, timer] of this.timers.entries()) {
        clearTimeout(timer);
      }
      this.timers.clear();
    } catch (error) {
      this.logger.error('Error destroying Critical Time Monitor Service:', error);
    }
  }

  /**
   * Get critical time limits for each pathway
   */
  private getCriticalTimeConfig(pathway: string): CriticalTimeConfig | null {
    switch (pathway) {
      case 'STEMI':
        return {
          pathway: 'STEMI',
          timeLimitMinutes: 120, // 2 hours
          thresholdPercentage: this.THRESHOLD_PERCENTAGE,
        };
      case 'STROKE':
        return {
          pathway: 'STROKE',
          timeLimitMinutes: 270, // 4.5 hours
          thresholdPercentage: this.THRESHOLD_PERCENTAGE,
        };
      case 'TRAUMA':
        return {
          pathway: 'TRAUMA',
          timeLimitMinutes: 60, // 1 hour
          thresholdPercentage: this.THRESHOLD_PERCENTAGE,
        };
      case 'GENERAL':
        return {
          pathway: 'GENERAL',
          timeLimitMinutes: 90, // 1.5 hours
          thresholdPercentage: this.THRESHOLD_PERCENTAGE,
        };
      default:
        return null;
    }
  }

  /**
   * Get the start time for critical time calculation
   * Priority: acknowledgedAt > actualArrival > journeyEndTime
   */
  private async getCriticalTimeStart(ticketId: string): Promise<Date | null> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          emsAssignments: {
            where: {
              status: 'ARRIVED',
            },
            select: {
              journeyEndTime: true,
            },
            orderBy: {
              journeyEndTime: 'asc',
            },
            take: 1,
          },
        },
      });

      if (!ticket) {
        return null;
      }

      // Priority: acknowledgedAt > actualArrival > journeyEndTime
      if (ticket.acknowledgedAt) {
        return new Date(ticket.acknowledgedAt);
      }

      if (ticket.actualArrival) {
        return new Date(ticket.actualArrival);
      }

      if (ticket.emsAssignments.length > 0 && ticket.emsAssignments[0].journeyEndTime) {
        return new Date(ticket.emsAssignments[0].journeyEndTime);
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting critical time start for ticket ${ticketId}:`, error);
      return null;
    }
  }

  /**
   * Schedule critical time threshold check for a ticket
   * Called when ticket is acknowledged, transfer completed, or EMS assignment arrives
   */
  async scheduleCriticalTimeCheck(ticketId: string): Promise<void> {
    try {
      this.cancelTimer(ticketId);

      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
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
      });

      if (!ticket) {
        this.logger.warn(`Ticket ${ticketId} not found for critical time check`);
        return;
      }

      // Skip if ticket is already completed
      if (ticket.status === 'COMPLETED') {
        return;
      }

      // Get start time (acknowledgedAt, actualArrival, or journeyEndTime)
      const startTime = await this.getCriticalTimeStart(ticketId);
      if (!startTime) {
        return;
      }

      const config = this.getCriticalTimeConfig(ticket.pathway);
      if (!config) {
        return;
      }

      // Calculate when to trigger the notification (85% of time limit)
      const thresholdMinutes = config.timeLimitMinutes * config.thresholdPercentage;
      const thresholdMs = thresholdMinutes * 60 * 1000;
      const elapsed = Date.now() - startTime.getTime();
      const remainingUntilThreshold = thresholdMs - elapsed;

      if (remainingUntilThreshold <= 0) {
        await this.checkCriticalTimeThreshold(ticketId);
        return;
      }

      const timer = setTimeout(async () => {
        await this.checkCriticalTimeThreshold(ticketId);
      }, remainingUntilThreshold);

      this.timers.set(ticketId, timer);
    } catch (error) {
      this.logger.error(`Error scheduling critical time check for ticket ${ticketId}:`, error);
    }
  }

  /**
   * Check if critical time threshold is reached and send notification
   */
  private async checkCriticalTimeThreshold(ticketId: string): Promise<void> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
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
          emsAssignments: {
            where: {
              status: 'ARRIVED',
            },
            select: {
              journeyEndTime: true,
            },
            orderBy: {
              journeyEndTime: 'asc',
            },
            take: 1,
          },
        },
      });

      if (!ticket) {
        this.logger.warn(`Ticket ${ticketId} not found for critical time threshold check`);
        return;
      }

      if (ticket.status === 'COMPLETED') {
        this.cancelTimer(ticketId);
        return;
      }

      const config = this.getCriticalTimeConfig(ticket.pathway);
      if (!config) {
        return;
      }

      // Get start time
      const startTime = await this.getCriticalTimeStart(ticketId);
      if (!startTime) {
        return;
      }

      // Calculate elapsed time
      const elapsed = Date.now() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsed / (1000 * 60));
      const timeLimitMs = config.timeLimitMinutes * 60 * 1000;
      const remainingMs = Math.max(0, timeLimitMs - elapsed);
      const remainingMinutes = Math.floor(remainingMs / (1000 * 60));

      // Check if we've reached the threshold (85%)
      const thresholdMs = config.timeLimitMinutes * config.thresholdPercentage * 60 * 1000;
      if (elapsed < thresholdMs) {
        // Not yet at threshold, reschedule
        const remainingUntilThreshold = thresholdMs - elapsed;
        const timer = setTimeout(async () => {
          await this.checkCriticalTimeThreshold(ticketId);
        }, remainingUntilThreshold);
        this.timers.set(ticketId, timer);
        return;
      }

      if (elapsed >= timeLimitMs) {
        await this.createCriticalTimeNotification(
          ticket,
          elapsedMinutes,
          config.timeLimitMinutes,
          remainingMinutes,
          true, // exceeded
        );
        this.cancelTimer(ticketId);
        return;
      }

      await this.createCriticalTimeNotification(
        ticket,
        elapsedMinutes,
        config.timeLimitMinutes,
        remainingMinutes,
        false, // approaching
      );
      
      this.cancelTimer(ticketId);
      
      const remainingUntilExceeded = timeLimitMs - elapsed;
      if (remainingUntilExceeded > 0) {
        const timer = setTimeout(async () => {
          await this.checkCriticalTimeThreshold(ticketId);
        }, remainingUntilExceeded);
        this.timers.set(ticketId, timer);
      }
    } catch (error) {
      this.logger.error(`Error checking critical time threshold for ticket ${ticketId}:`, error);
    }
  }

  /**
   * Create critical time notification
   */
  private async createCriticalTimeNotification(
    ticket: any,
    elapsedMinutes: number,
    timeLimitMinutes: number,
    remainingMinutes: number,
    exceeded: boolean,
  ): Promise<void> {
    try {
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          type: NotificationType.CRITICAL_TIME_LIMIT_APPROACHING,
          caseId: ticket.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingNotification && !exceeded) {
        return;
      }

      if (existingNotification && exceeded) {
        const existingMetadata = existingNotification.metadata
          ? JSON.parse(existingNotification.metadata)
          : {};
        
        if (existingMetadata.exceeded === true) {
          return;
        }
      }

      const systemUserId = await this.notificationsService.getSystemUserId();
      const rccUserIds = await this.notificationsService.getUsersByRole(UserRole.RCC);

      if (rccUserIds.length === 0) {
        this.logger.warn(`No active RCC users found for critical time notification (ticket: ${ticket.id})`);
        return;
      }

      const patientName = ticket.patient
        ? `${ticket.patient.firstName || ''} ${ticket.patient.lastName || ''}`.trim() || 'Unknown Patient'
        : 'Unknown Patient';
      const patientNationalId = ticket.patient?.nationalId || 'N/A';
      const hospitalName = ticket.destinationHospital?.name || ticket.originHospital?.name || 'Unknown Hospital';

      const title = exceeded
        ? `Critical Time Limit Exceeded - ${hospitalName} - ${ticket.pathway}`
        : `Critical Time Limit Approaching - ${hospitalName} - ${ticket.pathway}`;

      const message = exceeded
        ? `Patient ${patientName} (ID: ${patientNationalId}) at ${hospitalName} has exceeded the ${ticket.pathway} critical time limit. ${elapsedMinutes} minutes elapsed, limit is ${timeLimitMinutes} minutes. Immediate action required.`
        : `Patient ${patientName} (ID: ${patientNationalId}) at ${hospitalName} is approaching the ${ticket.pathway} critical time limit. ${elapsedMinutes} minutes elapsed, ${remainingMinutes} minutes remaining (limit: ${timeLimitMinutes} minutes).`;

      const priority = exceeded ? NotificationPriority.CRITICAL : NotificationPriority.HIGH;

      const metadata = JSON.stringify({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        hospitalId: ticket.destinationHospitalId || ticket.originHospitalId,
        hospitalName,
        pathway: ticket.pathway,
        elapsedMinutes,
        timeLimitMinutes,
        remainingMinutes,
        exceeded,
        startTime: ticket.acknowledgedAt || ticket.actualArrival || ticket.emsAssignments[0]?.journeyEndTime,
        source: 'critical_time_monitor',
      });

      const systemPatientId = await this.notificationsService['getSystemPatientId']();

      const notification = await this.notificationsService.createNotification(
        {
          type: NotificationType.CRITICAL_TIME_LIMIT_APPROACHING,
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
          patientId: ticket.patientId || systemPatientId.id,
          patientName,
          category: NotificationCategory.HOSPITALS,
          recipientUserIds: rccUserIds,
          metadata,
        },
        systemUserId,
      );

      // Emit socket events
      if (notification) {
        this.notificationsService['notificationsGateway'].emitNotificationCreated(notification);
        this.notificationsService['notificationsGateway'].emitNotificationByCategory(
          notification,
          NotificationCategory.HOSPITALS,
        );
        this.notificationsService['notificationsGateway'].emitNotificationByRole(notification, [UserRole.RCC]);
      }

    } catch (error) {
      this.logger.error(`Error creating critical time notification:`, error);
    }
  }

  /**
   * Cancel timer for a ticket
   */
  cancelTimer(ticketId: string): void {
    const timer = this.timers.get(ticketId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(ticketId);
    }
  }

  /**
   * Recover timers from active tickets in database
   */
  private async recoverTimersFromActiveTickets(): Promise<void> {
    try {
      const activeTickets = await this.prisma.ticket.findMany({
        where: {
          status: {
            not: 'COMPLETED',
          },
          pathway: {
            in: ['STEMI', 'STROKE', 'TRAUMA', 'GENERAL'],
          },
          OR: [
            { acknowledgedAt: { not: null } },
            { actualArrival: { not: null } },
            {
              emsAssignments: {
                some: {
                  status: 'ARRIVED',
                  journeyEndTime: { not: null },
                },
              },
            },
          ],
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
            },
          },
        },
      });

      let recoveredCount = 0;
      for (const ticket of activeTickets) {
        const startTime = await this.getCriticalTimeStart(ticket.id);
        if (startTime) {
          await this.scheduleCriticalTimeCheck(ticket.id);
          recoveredCount++;
        }
      }

    } catch (error) {
      this.logger.error('Error recovering timers from active tickets:', error);
    }
  }
}

