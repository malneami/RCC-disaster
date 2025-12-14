import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// Define EMSEventType locally since it's not exported from Prisma client
enum EMSEventType {
  AMBULANCE_DISPATCHED = 'AMBULANCE_DISPATCHED',
  AMBULANCE_ARRIVED = 'AMBULANCE_ARRIVED',
  PATIENT_LOADED = 'PATIENT_LOADED',
  PATIENT_DELIVERED = 'PATIENT_DELIVERED',
  AMBULANCE_RETURNED = 'AMBULANCE_RETURNED',
  MAINTENANCE_STARTED = 'MAINTENANCE_STARTED',
  MAINTENANCE_COMPLETED = 'MAINTENANCE_COMPLETED',
  SPEED_VIOLATION = 'SPEED_VIOLATION',
  DRIVER_BREAK_STARTED = 'DRIVER_BREAK_STARTED',
  DRIVER_BREAK_ENDED = 'DRIVER_BREAK_ENDED',
}

export interface CreateTimelineEventData {
  eventType: string;
  eventCategory: 'STROKE' | 'EMS' | 'GENERAL';
  ticketId?: string;
  strokeCaseId?: string;
  ambulanceId?: string;
  driverId?: string;
  eventDescription: string;
  eventLocation?: string;
  gpsCoordinates?: string; // JSON: {lat, lng}
  distanceKm?: number;
  speed?: number;
  fromStatus?: string;
  toStatus?: string;
  minutesFromSymptom?: number;
  minutesFromAdmission?: number;
  withinTarget?: boolean;
  targetMinutes?: number;
  nihssAtSession?: number;
  clinicalNotes?: string;
  triggeredBy: string;
  metadata?: string; // JSON string
}

@Injectable()
export class TimelineEventsService {
  private readonly logger = new Logger(TimelineEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEvent(data: CreateTimelineEventData): Promise<void> {
    try {
      await this.prisma.timelineEvent.create({
        data: {
          eventType: data.eventType,
          eventCategory: data.eventCategory,
          ticketId: data.ticketId,
          strokeCaseId: data.strokeCaseId,
          ambulanceId: data.ambulanceId,
          driverId: data.driverId,
          eventTimestamp: new Date(),
          eventDescription: data.eventDescription,
          eventLocation: data.eventLocation,
          gpsCoordinates: data.gpsCoordinates,
          distanceKm: data.distanceKm,
          speed: data.speed,
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          minutesFromSymptom: data.minutesFromSymptom,
          minutesFromAdmission: data.minutesFromAdmission,
          withinTarget: data.withinTarget,
          targetMinutes: data.targetMinutes,
          nihssAtSession: data.nihssAtSession,
          clinicalNotes: data.clinicalNotes,
          triggeredBy: data.triggeredBy,
          metadata: data.metadata,
          createdById: data.triggeredBy,
        },
      });

      this.logger.log(`Timeline event created: ${data.eventType} - ${data.eventDescription}`);
    } catch (error) {
      this.logger.error(`Failed to create timeline event: ${(error as Error).message}`);
      throw error;
    }
  }

  async createEMSEvent(
    eventType: string,
    description: string,
    triggeredBy: string,
    options: {
      ticketId?: string;
      ambulanceId?: string;
      driverId?: string;
      eventLocation?: string;
      gpsCoordinates?: string;
      distanceKm?: number;
      speed?: number;
      metadata?: any;
    } = {}
  ): Promise<void> {
    await this.createEvent({
      eventType,
      eventCategory: 'EMS',
      ticketId: options.ticketId,
      ambulanceId: options.ambulanceId,
      driverId: options.driverId,
      eventDescription: description,
      eventLocation: options.eventLocation,
      gpsCoordinates: options.gpsCoordinates,
      distanceKm: options.distanceKm,
      speed: options.speed,
      triggeredBy,
      metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
    });
  }

  async createTicketEvent(
    eventType: string,
    description: string,
    ticketId: string,
    triggeredBy: string,
    metadata?: any
  ): Promise<void> {
    await this.createEvent({
      eventType,
      eventCategory: 'GENERAL',
      ticketId,
      eventDescription: description,
      triggeredBy,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  }

  async getEventsByTicket(ticketId: string): Promise<any[]> {
    return this.prisma.timelineEvent.findMany({
      where: { ticketId },
      include: {
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        ambulance: {
          select: {
            id: true,
            callSign: true,
            plateNumber: true,
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
      orderBy: { eventTimestamp: 'desc' },
    });
  }

  async getEventsByAmbulance(ambulanceId: string, limit = 50): Promise<any[]> {
    return this.prisma.timelineEvent.findMany({
      where: { ambulanceId },
      include: {
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            priority: true,
          },
        },
      },
      orderBy: { eventTimestamp: 'desc' },
      take: limit,
    });
  }

  async getEventsByDriver(driverId: string, limit = 50): Promise<any[]> {
    return this.prisma.timelineEvent.findMany({
      where: { driverId },
      include: {
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            priority: true,
          },
        },
        ambulance: {
          select: {
            id: true,
            callSign: true,
            plateNumber: true,
          },
        },
      },
      orderBy: { eventTimestamp: 'desc' },
      take: limit,
    });
  }
}
