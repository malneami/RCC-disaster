import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export enum EntityType {
  PATIENT = 'PATIENT',
  TICKET = 'TICKET',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
}

export interface AccessLogData {
  entityType: EntityType;
  entityId: string;
  userId: string;
  accessType: string;
  accessMethod: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

@Injectable()
export class AccessLogService {
  constructor(private prisma: PrismaService) {}

  async logAccess(data: AccessLogData): Promise<void> {
    const { entityType, entityId, userId, accessType, accessMethod, ipAddress, userAgent, reason } = data;

    console.log('[AccessLogService] Logging access:', {
      entityType,
      entityId,
      userId,
      accessType,
      accessMethod,
      reason,
    });

    try {
      // Log access and update lastAccessedAt/lastAccessedBy
      switch (entityType) {
        case EntityType.PATIENT:
          const patientLog = await this.prisma.patientAccessLog.create({
            data: {
              patientId: entityId,
              userId,
              accessType: accessType as any,
              accessMethod,
              ipAddress,
              userAgent,
              reason,
            },
          });
          console.log('[AccessLogService] Patient access log created:', patientLog.id);
          
          await this.prisma.patient.update({
            where: { id: entityId },
            data: {
              lastAccessedAt: new Date(),
              lastAccessedBy: userId,
            },
          }).catch((err) => {
            console.error('[AccessLogService] Failed to update patient lastAccessedAt:', err);
          });
          break;

        case EntityType.TICKET:
          const ticketLog = await this.prisma.ticketAccessLog.create({
            data: {
              ticketId: entityId,
              userId,
              accessType: accessType as any,
              accessMethod,
              ipAddress,
              userAgent,
              reason,
            },
          });
          console.log('[AccessLogService] Ticket access log created:', ticketLog.id);
          
          await this.prisma.ticket.update({
            where: { id: entityId },
            data: {
              lastAccessedAt: new Date(),
              lastAccessedBy: userId,
            },
          }).catch((err) => {
            console.error('[AccessLogService] Failed to update ticket lastAccessedAt:', err);
          });
          break;

        case EntityType.MEDICAL_RECORD:
          const medicalRecordLog = await this.prisma.medicalRecordAccessLog.create({
            data: {
              medicalRecordId: entityId,
              userId,
              accessType: accessType as any,
              accessMethod,
              ipAddress,
              userAgent,
              reason,
            },
          });
          console.log('[AccessLogService] Medical record access log created:', medicalRecordLog.id);
          
          await this.prisma.medicalRecord.update({
            where: { id: entityId },
            data: {
              lastAccessedAt: new Date(),
              lastAccessedBy: userId,
            },
          }).catch((err) => {
            console.error('[AccessLogService] Failed to update medical record lastAccessedAt:', err);
          });
          break;
      }
    } catch (error) {
      // Don't fail the request if logging fails
      console.error('[AccessLogService] Failed to log access:', error);
      console.error('[AccessLogService] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data: {
          entityType,
          entityId,
          userId,
          accessType,
        },
      });
      // Don't re-throw - we don't want logging failures to break the main operation
      // But log it so we can debug
    }
  }
}

