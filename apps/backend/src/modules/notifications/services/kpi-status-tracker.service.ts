import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationType } from '@prisma/client';

export type KpiStatus = 'GREEN' | 'YELLOW' | 'RED';
export type CaseType = 'STEMI' | 'STROKE' | 'TRAUMA';

@Injectable()
export class KpiStatusTrackerService {
  private readonly logger = new Logger(KpiStatusTrackerService.name);
  private readonly DUPLICATE_PREVENTION_HOURS = 24; // Prevent duplicate notifications within 24 hour

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a notification already exists for this case
   * within the duplicate prevention window
   */
  async hasRecentCaseNotification(
    caseId: string,
    caseType: CaseType,
  ): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - this.DUPLICATE_PREVENTION_HOURS * 60 * 60 * 1000);

      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          type: NotificationType.KPI_THRESHOLD_BREACH,
          createdAt: {
            gte: oneHourAgo,
          },
          caseId: caseId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return existingNotification !== null;
    } catch (error) {
      this.logger.error(`Error checking for recent case notification: ${error}`);
      return false;
    }
  }
}

