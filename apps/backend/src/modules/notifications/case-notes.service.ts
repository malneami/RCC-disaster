import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCaseNoteDto } from './dto/create-notification.dto';
import { NotificationPriority, CaseType, DeliveryStatus, DeliveryMethod, NotificationType, NotificationCategory } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class CaseNotesService {
  private readonly logger = new Logger(CaseNotesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a new case note with recipients
   */
  async createCaseNote(createCaseNoteDto: CreateCaseNoteDto, createdById: string) {
    try {
      console.log('=== CASE NOTES SERVICE DEBUG ===');
      console.log('Received DTO:', JSON.stringify(createCaseNoteDto, null, 2));
      console.log('Created by ID:', createdById);
      
      const { recipientUserIds, ...caseNoteData } = createCaseNoteDto;

      this.logger.log(`Creating case note for case ${createCaseNoteDto.caseId} with ${recipientUserIds?.length || 0} recipients`);
      this.logger.log(`Created by user ID: ${createdById}`);
      this.logger.log(`Patient ID: ${createCaseNoteDto.patientId}`);
      this.logger.log(`Case Type: ${createCaseNoteDto.caseType}`);

      // Validate that the createdById exists
      const createdByUser = await this.prisma.user.findUnique({
        where: { id: createdById },
        select: { id: true, firstName: true, lastName: true }
      });
      
      if (!createdByUser) {
        this.logger.error(`User with ID ${createdById} not found`);
        throw new Error(`User with ID ${createdById} not found`);
      }

      // Validate that the patient exists
      const patient = await this.prisma.patient.findUnique({
        where: { id: createCaseNoteDto.patientId },
        select: { id: true, firstName: true, lastName: true }
      });
      
      if (!patient) {
        this.logger.error(`Patient with ID ${createCaseNoteDto.patientId} not found`);
        throw new Error(`Patient with ID ${createCaseNoteDto.patientId} not found`);
      }

      // Validate that all recipient users exist
      if (recipientUserIds && recipientUserIds.length > 0) {
        const existingUsers = await this.prisma.user.findMany({
          where: { id: { in: recipientUserIds } },
          select: { id: true, firstName: true, lastName: true }
        });
        
        const existingUserIds = existingUsers.map(user => user.id);
        const missingUserIds = recipientUserIds.filter(id => !existingUserIds.includes(id));
        
        if (missingUserIds.length > 0) {
          this.logger.error(`Users with IDs ${missingUserIds.join(', ')} not found`);
          throw new Error(`Users with IDs ${missingUserIds.join(', ')} not found`);
        }
      }

      // Create the case note
      const caseNote = await this.prisma.caseNote.create({
        data: {
          content: caseNoteData.content,
          priority: caseNoteData.priority,
          caseType: caseNoteData.caseType,
          caseId: caseNoteData.caseId,
          ticketId: caseNoteData.ticketId,
          patientId: caseNoteData.patientId,
          patientName: caseNoteData.patientName,
          notifyTeam: caseNoteData.notifyTeam,
          metadata: caseNoteData.metadata,
          createdById,
          recipients: recipientUserIds && recipientUserIds.length > 0 ? {
            create: recipientUserIds.map(userId => ({
              userId,
              deliveryStatus: DeliveryStatus.PENDING,
              deliveryMethod: createCaseNoteDto.deliveryMethod || DeliveryMethod.IN_APP,
            })),
          } : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipients: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
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
      });

      // If notifyTeam is true, also create a notification
      if (createCaseNoteDto.notifyTeam) {
        try {
          await this.createNotificationFromCaseNote(caseNote, createdById);
        } catch (notificationError) {
          this.logger.error(`Failed to create notification: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`);
          // Continue with case note creation even if notification fails
        }
      }

      this.logger.log(`Created case note ${caseNote.id} for ${recipientUserIds?.length || 0} recipients`);
      
      // Emit WebSocket event for real-time updates
      try {
        this.notificationsGateway.emitCaseNoteCreated(caseNote);
      } catch (websocketError) {
        this.logger.error(`Failed to emit WebSocket event: ${websocketError instanceof Error ? websocketError.message : String(websocketError)}`);
        // Continue with case note creation even if WebSocket emission fails
      }
      
      return caseNote;
    } catch (error) {
      this.logger.error(`Failed to create case note: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      this.logger.error(`Error details:`, JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Create notification from case note
   */
  private async createNotificationFromCaseNote(caseNote: any, createdById: string) {
    try {
      // Get the recipient user IDs from the case note
      const recipientUserIds = caseNote.recipients?.map((r: any) => r.userId) || [];
      
      const notification = await this.prisma.notification.create({
        data: {
          type: NotificationType.CASE_COMMENT,
          priority: caseNote.priority,
          title: `Case Note Added - ${caseNote.patientName}`,
          message: `New case note added for ${caseNote.patientName}: "${caseNote.content.substring(0, 100)}${caseNote.content.length > 100 ? '...' : ''}"`,
          caseType: caseNote.caseType,
          caseId: caseNote.caseId,
          ticketId: caseNote.ticketId,
          patientId: caseNote.patientId,
          patientName: caseNote.patientName,
          category: NotificationCategory.TICKETS,
          createdById,
          metadata: JSON.stringify({ caseNoteId: caseNote.id }),
          recipients: recipientUserIds.length > 0 ? {
            create: recipientUserIds.map((userId: string) => ({
              userId,
              deliveryStatus: DeliveryStatus.PENDING,
              deliveryMethod: DeliveryMethod.IN_APP,
            })),
          } : undefined,
        },
        include: {
          recipients: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Created notification ${notification.id} from case note ${caseNote.id} for ${recipientUserIds.length} recipients`);
      
      // Emit WebSocket event for the notification
      try {
        this.notificationsGateway.emitNotificationCreated(notification);
      } catch (websocketError) {
        this.logger.error(`Failed to emit notification WebSocket event: ${websocketError instanceof Error ? websocketError.message : String(websocketError)}`);
        // Continue even if WebSocket emission fails
      }
      
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification from case note: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw the error, just log it - case note creation should still succeed
      return null;
    }
  }

  /**
   * Get case notes for a specific case
   * Returns all case notes for the case, not just those where the user is a recipient
   */
  async getCaseNotes(caseType: CaseType, caseId: string, userId: string) {
    try {
      const caseNotes = await this.prisma.caseNote.findMany({
        where: {
          caseType,
          caseId,
        },
        select: {
          id: true,
          content: true,
          priority: true,
          caseType: true,
          caseId: true,
          ticketId: true,
          patientId: true,
          patientName: true,
          notifyTeam: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipients: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              isRead: true,
              readAt: true,
              deliveryStatus: true,
              deliveryMethod: true,
            },
          },
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
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`Found ${caseNotes.length} case notes for case ${caseId}`);
      return caseNotes;
    } catch (error) {
      this.logger.error(`Error getting case notes: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get case note by ID
   */
  async getCaseNoteById(id: string, userId: string) {
    const caseNote = await this.prisma.caseNote.findFirst({
      where: {
        id,
        recipients: {
          some: { userId },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipients: {
          where: { userId },
          select: {
            id: true,
            isRead: true,
            readAt: true,
            deliveryStatus: true,
            deliveryMethod: true,
          },
        },
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
    });

    if (!caseNote) {
      throw new NotFoundException(`Case note with ID ${id} not found`);
    }

    return caseNote;
  }

  /**
   * Update case note
   */
  async updateCaseNote(id: string, updateData: Partial<CreateCaseNoteDto>, userId: string) {
    const caseNote = await this.prisma.caseNote.findFirst({
      where: {
        id,
        createdById: userId, // Only creator can update
      },
    });

    if (!caseNote) {
      throw new NotFoundException(`Case note with ID ${id} not found or you don't have permission to update it`);
    }

    const updatedCaseNote = await this.prisma.caseNote.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
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
    });

    this.logger.log(`Updated case note ${id} by user ${userId}`);
    
    // Emit WebSocket event for real-time updates
    try {
      this.notificationsGateway.emitCaseNoteUpdated(updatedCaseNote);
    } catch (websocketError) {
      this.logger.error(`Failed to emit WebSocket update event: ${websocketError instanceof Error ? websocketError.message : String(websocketError)}`);
      // Continue even if WebSocket emission fails
    }
    
    return updatedCaseNote;
  }

  /**
   * Delete case note
   */
  async deleteCaseNote(id: string, userId: string) {
    const caseNote = await this.prisma.caseNote.findFirst({
      where: {
        id,
        createdById: userId, // Only creator can delete
      },
    });

    if (!caseNote) {
      throw new NotFoundException(`Case note with ID ${id} not found or you don't have permission to delete it`);
    }

    await this.prisma.caseNote.delete({
      where: { id },
    });

    this.logger.log(`Deleted case note ${id} by user ${userId}`);
    
    // Emit WebSocket event for real-time updates
    try {
      this.notificationsGateway.emitCaseNoteDeleted(id, caseNote.caseType, caseNote.caseId);
    } catch (websocketError) {
      this.logger.error(`Failed to emit WebSocket deletion event: ${websocketError instanceof Error ? websocketError.message : String(websocketError)}`);
      // Continue even if WebSocket emission fails
    }
    
    return { success: true };
  }

  /**
   * Mark case note as read
   */
  async markCaseNoteAsRead(id: string, userId: string) {
    const result = await this.prisma.caseNoteRecipient.updateMany({
      where: {
        caseNoteId: id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
        deliveryStatus: DeliveryStatus.READ,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Case note with ID ${id} not found or you don't have access to it`);
    }

    this.logger.log(`Marked case note ${id} as read for user ${userId}`);
    return { success: true };
  }
}
