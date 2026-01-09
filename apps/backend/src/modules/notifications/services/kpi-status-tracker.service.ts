import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationType } from '@prisma/client';

export type KpiStatus = 'GREEN' | 'YELLOW' | 'RED';
export type CaseType = 'STEMI' | 'STROKE' | 'TRAUMA';

@Injectable()
export class KpiStatusTrackerService {
  private readonly logger = new Logger(KpiStatusTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a notification already exists for this case
   * Once a KPI fails and notification is created, no more notifications for this case
   */
  async hasCaseNotification(
    caseId: string,
    caseType: CaseType,
  ): Promise<boolean> {
    try {
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          type: NotificationType.KPI_THRESHOLD_BREACH,
          caseId: caseId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return existingNotification !== null;
    } catch (error) {
      this.logger.error(`Error checking for case notification: ${error}`);
      return false;
    }
  }
}

