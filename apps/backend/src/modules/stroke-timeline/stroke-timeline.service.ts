import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStrokeTimelineDto, UpdateStrokeTimelineDto } from './dto/create-stroke-timeline.dto';
import { StrokeTimeline, StrokeEventType } from '@prisma/client';

@Injectable()
export class StrokeTimelineService {
  constructor(private prisma: PrismaService) {}

  async create(createStrokeTimelineDto: CreateStrokeTimelineDto, userId: string): Promise<StrokeTimeline> {
    // Validate that the stroke case exists
    const strokeCase = await this.prisma.strokeCase.findUnique({
      where: { id: createStrokeTimelineDto.strokeCaseId },
    });

    if (!strokeCase) {
      throw new NotFoundException('Stroke case not found');
    }

    // Validate that the ticket exists
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: createStrokeTimelineDto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Calculate timing metrics if not provided
    const timingMetrics = await this.calculateTimingMetrics(createStrokeTimelineDto, strokeCase);

    return this.prisma.strokeTimeline.create({
      data: {
        ...createStrokeTimelineDto,
        eventTimestamp: new Date(createStrokeTimelineDto.eventTimestamp),
        createdById: userId,
        ...timingMetrics,
      },
      include: {
        strokeCase: {
          select: {
            id: true,
            strokeType: true,
            currentStatus: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
          },
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    strokeCaseId?: string;
    ticketId?: string;
    eventType?: StrokeEventType;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<StrokeTimeline[]> {
    const where: any = {};

    if (filters?.strokeCaseId) {
      where.strokeCaseId = filters.strokeCaseId;
    }

    if (filters?.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.eventTimestamp = {};
      if (filters.dateFrom) where.eventTimestamp.gte = filters.dateFrom;
      if (filters.dateTo) where.eventTimestamp.lte = filters.dateTo;
    }

    return this.prisma.strokeTimeline.findMany({
      where,
      include: {
        strokeCase: {
          select: {
            id: true,
            strokeType: true,
            currentStatus: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
          },
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { eventTimestamp: 'asc' },
    });
  }

  async findOne(id: string): Promise<StrokeTimeline> {
    const timeline = await this.prisma.strokeTimeline.findUnique({
      where: { id },
      include: {
        strokeCase: {
          select: {
            id: true,
            strokeType: true,
            currentStatus: true,
            timeOfSymptomOnset: true,
            pathwayStarted: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                gender: true,
              },
            },
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            hospital: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!timeline) {
      throw new NotFoundException('Stroke timeline event not found');
    }

    return timeline;
  }

  async update(id: string, updateStrokeTimelineDto: UpdateStrokeTimelineDto, userId: string): Promise<StrokeTimeline> {
    const existingTimeline = await this.findOne(id);

    // Recalculate timing metrics if needed
    const timingMetrics = await this.calculateTimingMetrics(
      { ...existingTimeline, ...updateStrokeTimelineDto },
      null // strokeCase relation not available in simplified schema
    );

    return this.prisma.strokeTimeline.update({
      where: { id },
      data: {
        ...updateStrokeTimelineDto,
        eventTimestamp: updateStrokeTimelineDto.eventTimestamp ? new Date(updateStrokeTimelineDto.eventTimestamp) : undefined,
        updatedAt: new Date(),
        ...timingMetrics,
      },
      include: {
        strokeCase: true,
        ticket: true,
        triggeredByUser: true,
        createdBy: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists

    await this.prisma.strokeTimeline.delete({
      where: { id },
    });
  }

  async getTimelineForCase(strokeCaseId: string): Promise<StrokeTimeline[]> {
    return this.findAll({ strokeCaseId });
  }

  async getTimelineForTicket(ticketId: string): Promise<StrokeTimeline[]> {
    return this.findAll({ ticketId });
  }

  async getCriticalEvents(hospitalId?: string, hoursBack?: number): Promise<StrokeTimeline[]> {
    const where: any = {
      eventType: {
        in: ['TREATMENT_START', 'TREATMENT_COMPLETE', 'COMPLICATION', 'TRANSFER'],
      },
    };

    if (hospitalId) {
      where.strokeCase = {
        OR: [
          { originHospitalId: hospitalId },
          { destinationHospitalId: hospitalId },
        ],
      };
    }

    if (hoursBack) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
      where.eventTimestamp = {
        gte: cutoffTime,
      };
    }

    return this.prisma.strokeTimeline.findMany({
      where,
      include: {
        strokeCase: {
          select: {
            id: true,
            strokeType: true,
            currentStatus: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            priority: true,
          },
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { eventTimestamp: 'desc' },
    });
  }

  private async calculateTimingMetrics(timelineData: any, strokeCase: any) {
    const metrics: any = {};

    // Calculate minutes from symptom onset
    if (strokeCase.symptomOnset && timelineData.eventTimestamp) {
      const symptomTime = new Date(strokeCase.symptomOnset);
      const eventTime = new Date(timelineData.eventTimestamp);
      const minutesFromSymptom = Math.floor((eventTime.getTime() - symptomTime.getTime()) / (1000 * 60));
      
      if (minutesFromSymptom >= 0) {
        metrics.minutesFromSymptom = minutesFromSymptom;
      }
    }

    // Calculate minutes from admission (pathway start)
    if (strokeCase.pathwayStarted && timelineData.eventTimestamp) {
      const pathwayStart = new Date(strokeCase.pathwayStarted);
      const eventTime = new Date(timelineData.eventTimestamp);
      const minutesFromAdmission = Math.floor((eventTime.getTime() - pathwayStart.getTime()) / (1000 * 60));
      
      if (minutesFromAdmission >= 0) {
        metrics.minutesFromAdmission = minutesFromAdmission;
      }
    }

    // Determine if within target based on event type
    if (timelineData.eventType && timelineData.eventTimestamp) {
      const targetMinutes = this.getTargetMinutesForEventType(timelineData.eventType);
      if (targetMinutes && metrics.minutesFromAdmission !== undefined) {
        metrics.withinTarget = metrics.minutesFromAdmission <= targetMinutes;
        metrics.targetMinutes = targetMinutes;
      }
    }

    return metrics;
  }

  private getTargetMinutesForEventType(eventType: StrokeEventType): number | null {
    const targets: Record<StrokeEventType, number | null> = {
      ARRIVAL: null,
      TRIAGE: 10, // 10 minutes for triage
      ASSESSMENT: 15, // 15 minutes for initial assessment
      IMAGING: 25, // 25 minutes for CT scan
      LABORATORY: 30, // 30 minutes for lab results
      TREATMENT_START: 60, // 60 minutes for treatment start (door to needle)
      TREATMENT_COMPLETE: 90, // 90 minutes for treatment completion
      TRANSFER: 120, // 2 hours for transfer
      DISCHARGE: null,
      COMPLICATION: null,
      FOLLOWUP: null,
    };

    return targets[eventType] || null;
  }
}
