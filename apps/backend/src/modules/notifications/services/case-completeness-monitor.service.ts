import { Injectable, Logger, Inject, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../notifications.service';
import { NotificationType, NotificationPriority, NotificationCategory, UserRole, CaseType } from '@prisma/client';

interface CaseCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
  completenessPercentage: number;
}

@Injectable()
export class CaseCompletenessMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CaseCompletenessMonitorService.name);
  private timers = new Map<string, NodeJS.Timeout>(); // Key: `${caseType}:${caseId}`
  private readonly ESCALATION_HOURS = 24; // 24 hours
  private readonly ESCALATION_MS = this.ESCALATION_HOURS * 60 * 60 * 1000; 

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Initialize timers on module startup - recover from incomplete cases in database
   */
  async onModuleInit() {
    try {
      await this.recoverTimersFromIncompleteCases();
    } catch (error) {
      this.logger.error('Error initializing Case Completeness Monitor Service:', error);
    }
  }

  /**
   * Cleanup timers on module shutdown
   */
  async onModuleDestroy() {
    try {
      for (const [key, timer] of this.timers.entries()) {
        clearTimeout(timer);
      }
      this.timers.clear();
    } catch (error) {
      this.logger.error('Error destroying Case Completeness Monitor Service:', error);
    }
  }

  /**
   * Schedule completeness check and escalation timer for a newly created/updated case
   */
  async scheduleCompletenessMonitoring(
    caseId: string,
    caseType: CaseType,
    createdById: string,
    updated?:boolean,
    caseData?: any,
  ): Promise<void> {
    try {

      const completeness = await this.checkCaseCompleteness(caseId, caseType, caseData);
      
      if (!completeness.isComplete) {
        await this.notifyCreator(caseId, caseType, createdById, completeness.missingFields , updated);
        
        // Only schedule 24-hour escalation check if case is incomplete
        const timerKey = `${caseType}:${caseId}`;
        this.cancelTimer(timerKey);

        const timer = setTimeout(async () => {
          await this.checkAndEscalateIfIncomplete(caseId, caseType);
          this.timers.delete(timerKey);
        }, this.ESCALATION_MS);

        this.timers.set(timerKey, timer);
      } else {
        // Case is complete, cancel any existing timer and don't schedule new one
        const timerKey = `${caseType}:${caseId}`;
        this.cancelTimer(timerKey);
      }
    } catch (error) {
      this.logger.error(`Error scheduling completeness monitoring for case ${caseId}:`, error);
    }
  }

  /**
   * Cancel timer for a case (when case is completed or deleted)
   */
  cancelTimer(timerKey: string): void {
    const existingTimer = this.timers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(timerKey);
    }
  }

  /**
   * Check case completeness and escalate to RCC if still incomplete after 24 hours
   */
  private async checkAndEscalateIfIncomplete(caseId: string, caseType: CaseType): Promise<void> {
    try {

      // Check completeness again before escalating
      const completeness = await this.checkCaseCompleteness(caseId, caseType);

      if (!completeness.isComplete) {
        // Case is still incomplete, escalate to RCC (only one escalation notification per case)
        await this.escalateToRCC(caseId, caseType, completeness.missingFields);
      }
    } catch (error) {
      this.logger.error(`Error checking completeness for case ${caseId}:`, error);
    }
  }

  /**
   * Check if a case is complete based on required fields
   */
  async checkCaseCompleteness(
    caseId: string,
    caseType: CaseType,
    caseData?: any,
  ): Promise<CaseCompletenessResult> {
    try {
      if (!caseData) {
        caseData = await this.fetchCaseData(caseId, caseType);
      }

      if (!caseData) {
        this.logger.warn(`Case ${caseId} of type ${caseType} not found`);
        return {
          isComplete: false,
          missingFields: ['Case not found'],
          completenessPercentage: 0,
        };
      }

      switch (caseType) {
        case 'STEMI':
          return this.checkStemiCompleteness(caseData);
        default:
          this.logger.warn(`Unknown case type: ${caseType}`);
          return {
            isComplete: true,
            missingFields: [],
            completenessPercentage: 100,
          };
      }
    } catch (error) {
      this.logger.error(`Error checking completeness for ${caseType} case ${caseId}:`, error);
      return {
        isComplete: false,
        missingFields: ['Error checking completeness'],
        completenessPercentage: 0,
      };
    }
  }

  /**
   * Check STEMI case completeness
   */
  private checkStemiCompleteness(caseData: any): CaseCompletenessResult {
    const requiredFields = [
      { key: 'triageTime', label: 'Triage Time' },
      { key: 'firstEcgTime', label: 'First ECG Time' },
      { key: 'eligibleForPrimaryPci', label: 'Eligible for Primary PCI' },
      { key: 'thrombolyticGiven', label: 'Thrombolytic Given' },
    ];

    const missingFields: string[] = [];
    let completedFields = 0;
    let totalFields = requiredFields.length;

    // Check basic required fields
    requiredFields.forEach(field => {
      const value = caseData[field.key];
      if (value === null || value === undefined || value === '') {
        missingFields.push(field.label);
      } else {
        completedFields++;
      }
    });

    // If eligible for PCI, check PCI-related fields
    if (caseData.eligibleForPrimaryPci === true) {
      const pciFields = [
        { key: 'pciType', label: 'PCI Type' },
        { key: 'pciLocation', label: 'PCI Location' },
        { key: 'doorOutTime', label: 'Door Out Time' },
        { key: 'balloonInflationTime', label: 'Balloon Inflation Time' },
      ];

      pciFields.forEach(field => {
        const value = caseData[field.key];
        totalFields++;
        if (value === null || value === undefined || value === '') {
          missingFields.push(field.label);
        } else {
          completedFields++;
        }
      });
    }

    const completenessPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completenessPercentage,
    };
  }

  /**
   * Fetch case data from database
   */
  private async fetchCaseData(caseId: string, caseType: CaseType): Promise<any> {
    try {
      switch (caseType) {
        case 'STEMI': {
          const stemiCase = await this.prisma.stemiCase.findUnique({
            where: { id: caseId, deletedAt: null },
          });
          return stemiCase;
        }
        default:
          return null;
      }
    } catch (error) {
      this.logger.error(`Error fetching ${caseType} case ${caseId}:`, error);
      return null;
    }
  }

  /**
   * Notify the case creator about incomplete case
   */
  private async notifyCreator(
    caseId: string,
    caseType: CaseType,
    createdById: string,
    missingFields: string[],
    updated?: boolean,
  ): Promise<void> {
    try {
      // Fetch case details
      const caseData = await this.fetchCaseData(caseId, caseType);
      if (!caseData) {
        this.logger.warn(`Cannot send notification for ${caseType} case ${caseId}: case not found`);
        return;
      }

      // Get patient info
      const patient = await this.prisma.patient.findUnique({
        where: { id: caseData.patientId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!patient) {
        this.logger.warn(`Cannot send notification for ${caseType} case ${caseId}: patient not found`);
        return;
      }

      // Determine appropriate recipients: prefer DATA_COLLECTOR, fall back to creator
      const creator = await this.prisma.user.findUnique({
        where: { id: createdById },
        select: { id: true, role: true},
      });

      let recipientUserIds: string[] = [];

      if (creator && creator.role === UserRole.DATA_COLLECTOR) {
        recipientUserIds = [creator.id];
      } else {
        // Otherwise, notify all active data collectors related to hospital of the case
        const dataCollectors = await this.prisma.user.findMany({
          where: {
            role: UserRole.DATA_COLLECTOR,
            status: 'ACTIVE',
            deletedAt: null,
            hospitalId: caseData.hospitalId,
          },
          select: { id: true },
        });

        recipientUserIds = dataCollectors.map(u => u.id);

        // As a last resort, if no data collectors are found, notify the creator (if exists)
        if (recipientUserIds.length === 0 && creator) {
          recipientUserIds = [creator.id];
        }
      }

      if (recipientUserIds.length === 0) {
        this.logger.warn(
          `No recipients found for incomplete ${caseType} case ${caseId}; skipping notification`,
        );
        return;
      }
      if (!updated) {
        // Check if notification already sent for this case to these recipients (ONE notification per case, per recipient)
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            type: NotificationType.INCOMPLETE_CASE,
            caseId,
            priority: NotificationPriority.MEDIUM, // Creator/data-collector notifications are MEDIUM
            recipients: {
              some: {
                userId: { in: recipientUserIds },
              },
            },
          },
        });
  
        if (existingNotification) {
          return;
        }
      }

      const patientName = `${patient.firstName} ${patient.lastName}`;
      const missingFieldsText = missingFields.join(', ');

      await this.notificationsService.createNotification(
        {
          type: NotificationType.INCOMPLETE_CASE,
          priority: NotificationPriority.MEDIUM,
          title: `Incomplete ${caseType} Case - ${patientName}`,
          message: `The ${caseType} case for patient ${patientName} is incomplete.${!updated ? ' This Case has been created but is still incomplete.' : ' This is a follow-up notification after case has been updated but is still incomplete.'} Missing fields: ${missingFieldsText}. Please complete the case.`,
          caseType,
          caseId,
          ticketId: caseData.ticketId || null,
          patientId: patient.id,
          patientName,
          category: NotificationCategory.TICKETS,
          sourceEntityType: caseType,
          sourceEntityId: caseId,
          recipientUserIds,
          metadata: JSON.stringify({
            missingFields,
            caseType,
            caseId,
            source: 'case_completeness_monitor',
          }),
        },
        await this.notificationsService.getSystemUserId(),
      );

    } catch (error) {
      this.logger.error(`Error notifying creator about incomplete ${caseType} case ${caseId}:`, error);
    }
  }

  /**
   * Escalate incomplete case to RCC after 24 hours
   * Only ONE escalation notification per case (ever) - no repeats 
   */
  private async escalateToRCC(
    caseId: string,
    caseType: CaseType,
    missingFields: string[],
  ): Promise<void> {
    try {
      // Check if escalation notification already sent for this case (ONE notification per case, ever)
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          type: NotificationType.INCOMPLETE_CASE,
          caseId,
          priority: NotificationPriority.HIGH, // Escalation notifications are HIGH
          category: NotificationCategory.TICKETS,
        },
        include: {
          recipients: {
            where: {
              user: {
                role: UserRole.RCC,
              },
            },
          },
        },
      });

      if (existingNotification && existingNotification.recipients.length > 0) {
        return;
      }

      const caseData = await this.fetchCaseData(caseId, caseType);
      if (!caseData) {
        this.logger.warn(`Cannot escalate ${caseType} case ${caseId}: case not found`);
        return;
      }

      const patient = await this.prisma.patient.findUnique({
        where: { id: caseData.patientId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!patient) {
        this.logger.warn(`Cannot escalate ${caseType} case ${caseId}: patient not found`);
        return;
      }

      const creator = await this.prisma.user.findUnique({
        where: { id: caseData.createdById },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      const patientName = `${patient.firstName} ${patient.lastName}`;
      const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown';
      const missingFieldsText = missingFields.join(', ');

      const rccUserIds = await this.notificationsService.getUsersByRole(UserRole.RCC);

      if (rccUserIds.length === 0) {
        this.logger.warn(`No RCC users found for escalation notification (${caseType} case: ${caseId})`);
        return;
      }

      await this.notificationsService.createNotification(
        {
          type: NotificationType.INCOMPLETE_CASE,
          priority: NotificationPriority.HIGH,
          title: `Incomplete ${caseType} Case - 24 Hour Escalation - ${patientName}`,
          message: `The ${caseType} case for patient ${patientName} has been incomplete for 24+ hours. Created by: ${creatorName}. Missing fields: ${missingFieldsText}. Action required.`,
          caseType,
          caseId,
          ticketId: caseData.ticketId || null,
          patientId: patient.id,
          patientName,
          category: NotificationCategory.TICKETS,
          sourceEntityType: caseType,
          sourceEntityId: caseId,
          recipientUserIds: rccUserIds,
          metadata: JSON.stringify({
            missingFields,
            caseType,
            caseId,
            createdById: caseData.createdById,
            creatorName,
            source: 'case_completeness_monitor',
            escalation: true,
            hoursSinceCreation: 24,
          }),
        },
        await this.notificationsService.getSystemUserId(),
      );

    } catch (error) {
      this.logger.error(`Error escalating ${caseType} case ${caseId} to RCC:`, error);
    }
  }

  /**
   * Recover timers from incomplete cases in database on module startup
   */
  private async recoverTimersFromIncompleteCases(): Promise<void> {
    try {

      const [stemiCases] = await Promise.all([
        this.prisma.stemiCase.findMany({
          where: {
            deletedAt: null,
            createdAt: {
              gte: new Date(Date.now() - this.ESCALATION_MS * 2), // Last 48 hours
            },
          },
          select: {
            id: true,
            createdAt: true,
            createdById: true,
            triageTime: true,
            firstEcgTime: true,
            eligibleForPrimaryPci: true,
            thrombolyticGiven: true,
            pciType: true,
            pciLocation: true,
            doorOutTime: true,
            balloonInflationTime: true,
          },
        }),
      ]);

      let recoveredCount = 0;

      // Recover STEMI cases
      for (const caseData of stemiCases) {
        const completeness = this.checkStemiCompleteness(caseData);
        if (!completeness.isComplete) {
          const timeSinceCreation = Date.now() - caseData.createdAt.getTime();
          if (timeSinceCreation < this.ESCALATION_MS) {
            // Still within 24 hours, schedule escalation
            const remainingMs = this.ESCALATION_MS - timeSinceCreation;
            const timerKey = `STEMI:${caseData.id}`;
            const timer = setTimeout(async () => {
              await this.checkAndEscalateIfIncomplete(caseData.id, 'STEMI');
              this.timers.delete(timerKey);
            }, remainingMs);
            this.timers.set(timerKey, timer);
            recoveredCount++;
          } else {
            // Past 24 hours, check completeness again before escalating
            await this.checkAndEscalateIfIncomplete(caseData.id, 'STEMI');
          }
        }
      }      

    } catch (error) {
      this.logger.error('Error recovering timers from incomplete cases:', error);
    }
  }
}
