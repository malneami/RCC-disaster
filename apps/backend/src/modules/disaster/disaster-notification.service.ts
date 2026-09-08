import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  DisasterNotificationType,
  NotificationPriority,
  UserRole,
  DeliveryMethod,
} from '@prisma/client';

const DISASTER_ROLES: UserRole[] = ['ADMIN', 'RCC', 'EMS'];

const TYPE_TITLES: Record<DisasterNotificationType, string> = {
  INCIDENT_CREATED: 'New Disaster Incident',
  ANNOUNCEMENT_SENT: 'Disaster Announcement',
  AMBULANCE_ASSIGNED: 'Ambulance Assigned',
  INCIDENT_RESOLVED: 'Disaster Incident Resolved',
};

@Injectable()
export class DisasterNotificationService {
  private readonly logger = new Logger(DisasterNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Get user IDs for disaster-relevant roles (ADMIN, RCC, EMS).
   */
  async getDisasterRoleUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: DISASTER_ROLES },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  /**
   * Get user IDs for users in the given hospital IDs.
   */
  async getUserIdsByHospitalIds(hospitalIds: string[]): Promise<string[]> {
    if (!hospitalIds?.length) return [];
    const users = await this.prisma.user.findMany({
      where: {
        hospitalId: { in: hospitalIds },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true },
    });
    return [...new Set(users.map((u) => u.id))];
  }

  /**
   * Create a disaster notification and emit via WebSocket.
   */
  async createDisasterNotification(
    incidentId: string,
    type: DisasterNotificationType,
    recipientUserIds: string[],
    createdById: string,
    overrides?: { title?: string; message?: string; priority?: NotificationPriority },
  ): Promise<any> {
    if (!recipientUserIds.length) {
      this.logger.debug(`No recipients for disaster notification type ${type}, incident ${incidentId}`);
      return null;
    }

    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!incident) {
      this.logger.warn(`Incident ${incidentId} not found for disaster notification`);
      return null;
    }

    const incidentLabel = this.getIncidentTypeLabel(incident.incidentType);
    const location = incident.locationAddress || 'Unknown location';
    const title = overrides?.title ?? TYPE_TITLES[type];
    const priority = overrides?.priority ?? (type === 'INCIDENT_CREATED' ? 'CRITICAL' : 'HIGH');

    let message = overrides?.message;
    if (!message) {
      switch (type) {
        case 'INCIDENT_CREATED':
          message = `${incidentLabel} at ${location}. Stand by for updates.`;
          break;
        case 'ANNOUNCEMENT_SENT':
          message = `Disaster announcement: ${incidentLabel} at ${location}. Check incident for details.`;
          break;
        case 'AMBULANCE_ASSIGNED':
          message = `Ambulance assigned to ${incidentLabel} at ${location}.`;
          break;
        case 'INCIDENT_RESOLVED':
          message = `Disaster incident (${incidentLabel}) at ${location} has been resolved.`;
          break;
        default:
          message = `${incidentLabel} at ${location}.`;
      }
    }

    const notification = await this.prisma.disasterNotification.create({
      data: {
        disasterIncidentId: incidentId,
        type,
        priority,
        title,
        message,
        createdById,
        recipients: {
          create: recipientUserIds.map((userId) => ({
            userId,
            deliveryMethod: DeliveryMethod.IN_APP,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        disasterIncident: { select: { id: true, incidentType: true, locationAddress: true, status: true } },
        recipients: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          },
        },
      },
    });

    this.emitDisasterNotification(notification);
    this.logger.log(`Created disaster notification ${notification.id} (${type}) for ${recipientUserIds.length} recipients`);
    return notification;
  }

  /**
   * Emit disaster notification to recipient users via NotificationsGateway.
   */
  emitDisasterNotification(notification: any): void {
    try {
      if (!this.notificationsGateway?.server) {
        this.logger.warn('NotificationsGateway server not initialized');
        return;
      }
      const eventData = {
        notification,
        timestamp: new Date().toISOString(),
      };
      if (notification.recipients?.length) {
        notification.recipients.forEach((r: { userId: string }) => {
          this.notificationsGateway.server.to(`user-${r.userId}`).emit('disaster-notification-created', eventData);
        });
      }
      // Also emit to disaster role rooms for real-time
      this.notificationsGateway.server.to('role-ADMIN').emit('disaster-notification-created', eventData);
      this.notificationsGateway.server.to('role-RCC').emit('disaster-notification-created', eventData);
      this.notificationsGateway.server.to('role-EMS').emit('disaster-notification-created', eventData);
    } catch (err) {
      this.logger.error(`Failed to emit disaster notification: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private getIncidentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      RTA_MCI: 'Mass Casualty (RTA)',
      CODE_YELLOW: 'Code Yellow',
      EARTHQUAKE: 'Earthquake',
      FLOOD: 'Flood',
      FIRE: 'Fire',
      CHEMICAL_SPILL: 'Chemical Spill',
      OUTBREAK: 'Outbreak',
      INTERNAL_FIRE: 'Internal Fire',
      SMOKE_ELECTRICAL_FAILURE: 'Smoke/Electrical',
      POWER_FAILURE: 'Power Failure',
      WATER_LEAKAGE_FLOODING: 'Water Leakage',
      IT_SYSTEM_FAILURE: 'IT System Failure',
    };
    return labels[type] || type;
  }
}
