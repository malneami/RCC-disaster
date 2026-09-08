import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { DisasterGateway } from './disaster.gateway';
import {
  DisasterEscalationLevel,
  DisasterCommandDecisionAction,
  DisasterAssignmentStatus,
} from '@prisma/client';

@Injectable()
export class DisasterEscalationMonitorService {
  private readonly logger = new Logger(DisasterEscalationMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hospitalsService: HospitalsService,
    private readonly disasterGateway: DisasterGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndAutoEscalate() {
    try {
      const activeRooms = await this.prisma.disasterCommandRoom.findMany({
        where: { closedAt: null },
        include: {
          disasterIncident: {
            include: { ambulanceAssignments: true },
          },
          activatedBy: { select: { id: true } },
        },
      });

      for (const room of activeRooms) {
        await this.evaluateIncident(room);
      }
    } catch (err) {
      this.logger.error('Disaster escalation check failed', err);
    }
  }

  private async evaluateIncident(room: {
    id: string;
    disasterIncidentId: string;
    escalationLevel: DisasterEscalationLevel;
    activatedById: string;
    disasterIncident: {
      ambulanceAssignments: Array<{
        triageCategory: string | null;
        status: string;
        assignedAt: Date;
      }>;
    };
  }) {
    const assignments = room.disasterIncident.ambulanceAssignments;
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const redCasesLast10Min = assignments.filter(
      (a) =>
        a.triageCategory === 'RED' &&
        new Date(a.assignedAt).getTime() >= tenMinutesAgo.getTime(),
    ).length;

    const activeCriticalCases = assignments.filter(
      (a) =>
        a.triageCategory === 'RED' &&
        a.status !== DisasterAssignmentStatus.ARRIVED,
    ).length;

    let icuCapacityPercent = 100;
    try {
      const hospitals = await this.hospitalsService.findAll({});
      const icuTotal = hospitals.reduce((s, h) => s + ((h as any).icuBeds ?? 0), 0);
      const icuAvailable = hospitals.reduce(
        (s, h) => s + ((h as any).icuBedsAvailable ?? 0),
        0,
      );
      if (icuTotal > 0) {
        icuCapacityPercent = (icuAvailable / icuTotal) * 100;
      }
    } catch {
      // Ignore hospital fetch errors
    }

    let newLevel: DisasterEscalationLevel | null = null;

    if (room.escalationLevel === DisasterEscalationLevel.LEVEL_1) {
      if (redCasesLast10Min >= 5 || activeCriticalCases >= 6) {
        newLevel = DisasterEscalationLevel.LEVEL_2;
      }
    } else if (room.escalationLevel === DisasterEscalationLevel.LEVEL_2) {
      if (activeCriticalCases >= 15 || icuCapacityPercent < 10) {
        newLevel = DisasterEscalationLevel.LEVEL_3;
      }
    }

    if (newLevel) {
      await this.autoEscalate(room.id, room.disasterIncidentId, newLevel, room.activatedById);
    }
  }

  private async autoEscalate(
    roomId: string,
    incidentId: string,
    newLevel: DisasterEscalationLevel,
    userId: string,
  ) {
    try {
      await this.prisma.disasterCommandRoom.update({
        where: { id: roomId },
        data: { escalationLevel: newLevel },
      });

      await this.prisma.disasterCommandDecisionLog.create({
        data: {
          commandRoomId: roomId,
          userId,
          action: DisasterCommandDecisionAction.ESCALATED,
          details: {
            escalationLevel: newLevel,
            autoEscalated: true,
          } as any,
        },
      });

      const room = await this.prisma.disasterCommandRoom.findUnique({
        where: { id: roomId },
        include: {
          activatedBy: { select: { firstName: true, lastName: true } },
          roleAssignments: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      });

      this.disasterGateway.broadcastCommandRoomUpdated(incidentId, {
        type: 'escalated',
        room,
      });
      this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);

      this.logger.log(
        `Auto-escalated incident ${incidentId} to ${newLevel}`,
      );
    } catch (err) {
      this.logger.error(`Auto-escalation failed for incident ${incidentId}`, err);
    }
  }
}
