import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNotificationDto, NotificationFilterDto, MarkNotificationReadDto } from './dto/create-notification.dto';
import { NotificationType, NotificationPriority, CaseType, DeliveryStatus, DeliveryMethod, NotificationCategory, UserRole } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a new notification with recipients
   */
  async createNotification(createNotificationDto: CreateNotificationDto, createdById: string, requestContext?: { ipAddress?: string; userAgent?: string }) {
    try {
      this.logger.log('=== createNotification service called ===');
      this.logger.log('createNotificationDto:', JSON.stringify(createNotificationDto, null, 2));
      this.logger.log('createdById:', createdById);

      const { recipientUserIds, category, ...notificationData } = createNotificationDto;

      // Enhanced validation
      await this.validateNotificationData(notificationData, recipientUserIds || [], createdById);

      this.logger.log('Creating notification with data:', JSON.stringify(notificationData, null, 2));
      this.logger.log('Recipients:', recipientUserIds);

      // Create the notification with enhanced error handling
      const notification = await this.prisma.$transaction(async (tx) => {
        // Create the notification
        const notification = await tx.notification.create({
          data: {
            ...notificationData,
            category: category || NotificationCategory.PATIENTS || this.ensureCategory(notificationData),
            createdById,
            recipients: recipientUserIds && recipientUserIds.length > 0 ? {
              create: recipientUserIds.map(userId => ({
                userId,
                deliveryStatus: DeliveryStatus.PENDING,
                deliveryMethod: createNotificationDto.deliveryMethod || DeliveryMethod.IN_APP,
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

        // TODO: Create audit log when audit table is available
        // await tx.notificationAuditLog.create({
        //   data: {
        //     notificationId: notification.id,
        //     userId: createdById,
        //     action: 'CREATED',
        //     newValues: JSON.stringify(notificationData),
        //     ipAddress: requestContext?.ipAddress,
        //     userAgent: requestContext?.userAgent,
        //   },
        // });

        return notification;
      });

      this.logger.log(`Created notification ${notification.id} for ${recipientUserIds?.length || 0} recipients`);

      // Queue for delivery (async)
      this.queueNotificationDelivery(notification.id).catch(error => {
        this.logger.error(`Failed to queue notification delivery for ${notification.id}:`, error);
      });

      return notification;
    } catch (error) {
      this.logger.error('=== Error in createNotification service ===');
      this.logger.error('Error:', error);
      this.logger.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  /**
   * Validate notification data
   */
  private async validateNotificationData(notificationData: any, recipientUserIds: string[], createdById: string) {
    // Validate required fields
    if (!notificationData.type || !notificationData.priority || !notificationData.title || !notificationData.message) {
      throw new BadRequestException('Missing required fields: type, priority, title, message');
    }

    if (!notificationData.patientId || !notificationData.patientName) {
      throw new BadRequestException('Missing required patient information');
    }

    // Validate creator exists
    const creator = await this.prisma.user.findUnique({
      where: { id: createdById },
      select: { id: true, status: true },
    });

    if (!creator) {
      throw new NotFoundException(`User with ID ${createdById} not found`);
    }

    if (creator.status !== 'ACTIVE') {
      throw new BadRequestException('User is not active');
    }

    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: notificationData.patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${notificationData.patientId} not found`);
    }

    // Validate recipients exist and are active
    if (recipientUserIds && recipientUserIds.length > 0) {
      const recipients = await this.prisma.user.findMany({
        where: {
          id: { in: recipientUserIds },
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      const existingUserIds = recipients.map(user => user.id);
      const missingUserIds = recipientUserIds.filter(id => !existingUserIds.includes(id));

      if (missingUserIds.length > 0) {
        throw new NotFoundException(`Users with IDs ${missingUserIds.join(', ')} not found or inactive`);
      }
    }
  }

  /**
   * Queue notification for delivery
   */
  private async queueNotificationDelivery(notificationId: string) {
    // This would integrate with a job queue system like Bull or Agenda
    // For now, we'll process immediately
    await this.processNotificationDelivery(notificationId);
  }

  /**
   * Process notification delivery
   */
  private async processNotificationDelivery(notificationId: string) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          recipients: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      });

      if (!notification) {
        this.logger.error(`Notification ${notificationId} not found for delivery`);
        return;
      }

      // Process each recipient
      for (const recipient of notification.recipients) {
        await this.deliverToRecipient(notification, recipient);
      }
    } catch (error) {
      this.logger.error(`Failed to process notification delivery for ${notificationId}:`, error);
    }
  }

  /**
   * Deliver notification to a specific recipient
   */
  private async deliverToRecipient(notification: any, recipient: any) {
    try {
      // Update delivery status
      await this.prisma.notificationRecipient.update({
        where: { id: recipient.id },
        data: {
          deliveryStatus: DeliveryStatus.DELIVERED,
        },
      });

      // TODO: Implement email/SMS delivery based on preferences
      this.logger.log(`Delivered notification ${notification.id} to user ${recipient.userId}`);
    } catch (error) {
      this.logger.error(`Failed to deliver notification to user ${recipient.userId}:`, error);

      // Update delivery status to failed
      await this.prisma.notificationRecipient.update({
        where: { id: recipient.id },
        data: {
          deliveryStatus: DeliveryStatus.FAILED,
        },
      });
    }
  }

  /**
   * Get notifications with filtering and pagination
   */
  async getNotifications(filterDto: NotificationFilterDto, userId: string) {
    try {
      this.logger.log('=== getNotifications service called ===');
      this.logger.log('filterDto:', JSON.stringify(filterDto, null, 2));
      this.logger.log('userId:', userId);

      const {
        type,
        priority,
        category,
        caseType,
        patientId,
        caseId,
        isRead,
        search,
        dateFrom,
        dateTo,
        page = '1',
        limit = '20',
      } = filterDto;

      // Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 items per page
      const skip = (pageNum - 1) * limitNum;

      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.status !== 'ACTIVE') {
        throw new BadRequestException('User is not active');
      }

      // Build where clause with enhanced filtering
      const where: any = {
        recipients: {
          some: {
            userId,
            deletedAt: null, // Only include notifications with non-deleted recipients
          },
        },
      };

      // Apply filters (skip empty strings and undefined values)
      // Filter out empty strings that might come from "All" selections
      const typeValue = type as string | NotificationType | undefined;
      if (typeValue && String(typeValue).trim() !== '') {
        where.type = typeValue as NotificationType;
      }
      
      const priorityValue = priority as string | NotificationPriority | undefined;
      if (priorityValue && String(priorityValue).trim() !== '') {
        where.priority = priorityValue as NotificationPriority;
      }
      
      const categoryValue = category as string | NotificationCategory | undefined;
      if (categoryValue && String(categoryValue).trim() !== '') {
        where.category = categoryValue as NotificationCategory;
      }
      
      const caseTypeValue = caseType as string | CaseType | undefined;
      if (caseTypeValue && String(caseTypeValue).trim() !== '') {
        where.caseType = caseTypeValue as CaseType;
      }
      
      if (patientId && patientId.trim() !== '') {
        where.patientId = patientId;
      }
      if (caseId && caseId.trim() !== '') {
        where.caseId = caseId;
      }

      const isReadValue = isRead as string | undefined;
      if (isReadValue && String(isReadValue).trim() !== '') {
        const isReadBoolean = isReadValue.toLowerCase() === 'true';
        this.logger.log(`Filtering by isRead: ${isReadValue} -> ${isReadBoolean}`);
        where.recipients = {
          some: {
            userId,
            isRead: isReadBoolean,
            deletedAt: null, // Only include non-deleted recipients
          },
        };
      }

      // Enhanced search functionality
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          // { tags: { has: search } }, // TODO: Enable when tags field is available
        ];
      }

      // Date range filtering
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (isNaN(fromDate.getTime())) {
            throw new BadRequestException('Invalid dateFrom format');
          }
          where.createdAt.gte = fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          if (isNaN(toDate.getTime())) {
            throw new BadRequestException('Invalid dateTo format');
          }
          where.createdAt.lte = toDate;
        }
      }

      // Execute queries in parallel for better performance
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
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
              where: {
                userId,
                deletedAt: null, // Only include non-deleted recipients
              },
              select: {
                id: true,
                userId: true,
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
          orderBy: [
            { priority: 'desc' }, // High priority first
            { createdAt: 'desc' }, // Then by creation date
          ],
          skip,
          take: limitNum,
        }),
        this.prisma.notification.count({ where }),
      ]);

      // Transform notifications to include user-specific read status
      const transformedNotifications = notifications.map(notification => {
        const userRecipient = notification.recipients.find((r: any) => r.userId === userId);
        return {
          ...notification,
          isRead: userRecipient?.isRead || false,
          readAt: userRecipient?.readAt || null,
          deliveryStatus: userRecipient?.deliveryStatus || 'PENDING',
          recipients: undefined, // Remove recipients array to avoid confusion
        };
      });

      this.logger.log(`Retrieved ${notifications.length} notifications, total: ${total}`);

      return {
        notifications: transformedNotifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      };
    } catch (error) {
      this.logger.error('=== Error in getNotifications service ===');
      this.logger.error('Error:', error);
      this.logger.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to retrieve notifications');
    }
  }

  /**
   * Get notification summary statistics with optional filters
   */
  async getNotificationSummary(userId: string, filterDto?: NotificationFilterDto) {
    // Build base where clause for filtering
    const baseWhere: any = {
      recipients: {
        some: {
          userId,
          deletedAt: null, // Only count non-deleted notifications
        },
      },
    };

    // Apply filters if provided
    if (filterDto) {
      const typeValue = filterDto.type as string | NotificationType | undefined;
      if (typeValue && String(typeValue).trim() !== '') {
        baseWhere.type = typeValue as NotificationType;
      }
      
      const priorityValue = filterDto.priority as string | NotificationPriority | undefined;
      if (priorityValue && String(priorityValue).trim() !== '') {
        baseWhere.priority = priorityValue as NotificationPriority;
      }
      
      const categoryValue = filterDto.category as string | NotificationCategory | undefined;
      if (categoryValue && String(categoryValue).trim() !== '') {
        baseWhere.category = categoryValue as NotificationCategory;
      }
      
      const caseTypeValue = filterDto.caseType as string | CaseType | undefined;
      if (caseTypeValue && String(caseTypeValue).trim() !== '') {
        baseWhere.caseType = caseTypeValue as CaseType;
      }
      
      if (filterDto.patientId && filterDto.patientId.trim() !== '') {
        baseWhere.patientId = filterDto.patientId;
      }
      if (filterDto.caseId && filterDto.caseId.trim() !== '') {
        baseWhere.caseId = filterDto.caseId;
      }

      // Date range filtering
      if (filterDto.dateFrom || filterDto.dateTo) {
        baseWhere.createdAt = {};
        if (filterDto.dateFrom) {
          const fromDate = new Date(filterDto.dateFrom);
          if (!isNaN(fromDate.getTime())) {
            baseWhere.createdAt.gte = fromDate;
          }
        }
        if (filterDto.dateTo) {
          const toDate = new Date(filterDto.dateTo);
          if (!isNaN(toDate.getTime())) {
            baseWhere.createdAt.lte = toDate;
          }
        }
      }

      // Search functionality
      if (filterDto.search && filterDto.search.trim() !== '') {
        baseWhere.OR = [
          { title: { contains: filterDto.search, mode: 'insensitive' } },
          { message: { contains: filterDto.search, mode: 'insensitive' } },
          { patientName: { contains: filterDto.search, mode: 'insensitive' } },
        ];
      }
    }

    const [
      totalNotifications,
      unreadNotifications,
      highPriorityNotifications,
      highPriorityUnreadNotifications,
      mediumPriorityUnreadNotifications,
      emailNotifications,
      smsNotifications,
    ] = await Promise.all([
      this.prisma.notification.count({
        where: baseWhere,
      }),
      this.prisma.notification.count({
        where: {
          ...baseWhere,
          recipients: {
            some: {
              userId,
              isRead: false,
              deletedAt: null,
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: {
          ...baseWhere,
          priority: NotificationPriority.HIGH,
        },
      }),
      this.prisma.notification.count({
        where: {
          ...baseWhere,
          priority: NotificationPriority.HIGH,
          recipients: {
            some: {
              userId,
              isRead: false,
              deletedAt: null,
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: {
          ...baseWhere,
          priority: NotificationPriority.MEDIUM,
          recipients: {
            some: {
              userId,
              isRead: false,
              deletedAt: null,
            },
          },
        },
      }),
      this.prisma.notificationRecipient.count({
        where: {
          userId,
          emailSent: true,
          deletedAt: null,
          ...(filterDto ? {
            notification: baseWhere,
          } : {}),
        },
      }),
      this.prisma.notificationRecipient.count({
        where: {
          userId,
          smsSent: true,
          deletedAt: null,
          ...(filterDto ? {
            notification: baseWhere,
          } : {}),
        },
      }),
    ]);

    return {
      totalNotifications,
      unreadNotifications,
      highPriorityNotifications,
      highPriorityUnreadNotifications,
      mediumPriorityUnreadNotifications,
      emailNotifications,
      smsNotifications,
    };
  }

  /**
   * Get case type counts for notification tabs
   * Returns counts efficiently using database COUNT queries instead of loading all notifications
   */
  async getCaseTypeCounts(userId: string) {
    try {
      const baseWhere = {
        recipients: {
          some: {
            userId,
            deletedAt: null,
          },
        },
      };

      // Get unread count for ALL (not total count)
      const allUnreadCount = await this.prisma.notification.count({
        where: {
          ...baseWhere,
          recipients: {
            some: {
              userId,
              isRead: false,
              deletedAt: null,
            },
          },
        },
      });

      // Get unread counts by case type
      const [stemiUnread, strokeUnread, traumaUnread] = await Promise.all([
        this.prisma.notification.count({
          where: {
            ...baseWhere,
            caseType: 'STEMI',
            recipients: {
              some: {
                userId,
                isRead: false,
                deletedAt: null,
              },
            },
          },
        }),
        this.prisma.notification.count({
          where: {
            ...baseWhere,
            caseType: 'STROKE',
            recipients: {
              some: {
                userId,
                isRead: false,
                deletedAt: null,
              },
            },
          },
        }),
        this.prisma.notification.count({
          where: {
            ...baseWhere,
            caseType: 'TRAUMA',
            recipients: {
              some: {
                userId,
                isRead: false,
                deletedAt: null,
              },
            },
          },
        }),
      ]);

      return {
        ALL: allUnreadCount,
        STEMI: stemiUnread,
        STROKE: strokeUnread,
        TRAUMA: traumaUnread,
      };
    } catch (error) {
      this.logger.error('Failed to get case type counts:', error);
      throw new InternalServerErrorException('Failed to retrieve case type counts');
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(markReadDto: MarkNotificationReadDto, userId: string) {
    const { notificationIds } = markReadDto;

    const result = await this.prisma.notificationRecipient.updateMany({
      where: {
        notificationId: { in: notificationIds },
        userId,
        deletedAt: null, // Only update non-deleted recipients
      },
      data: {
        isRead: true,
        readAt: new Date(),
        deliveryStatus: DeliveryStatus.READ,
      },
    });

    this.logger.log(`Marked ${result.count} notifications as read for user ${userId}`);
    
    // Emit socket event to notify client
    if (result.count > 0) {
      try {
        this.notificationsGateway.emitNotificationRead(notificationIds, userId);
      } catch (error) {
        this.logger.error(`Failed to emit notification-read WebSocket event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return { count: result.count };
  }

  /**
   * Soft delete notification for a specific user
   */
  async deleteNotificationForUser(notificationId: string, userId: string) {
    const result = await this.prisma.notificationRecipient.updateMany({
      where: {
        notificationId,
        userId,
        deletedAt: null, // Only soft delete non-deleted recipients
      },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Soft deleted notification ${notificationId} for user ${userId}`);
    
    // Emit socket event to notify client
    if (result.count > 0) {
      try {
        this.notificationsGateway.emitNotificationDeleted(notificationId, userId);
      } catch (error) {
        this.logger.error(`Failed to emit notification-deleted WebSocket event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return { count: result.count };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
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

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  /**
   * Delete notification (soft delete by archiving)
   */
  async deleteNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        createdById: userId, // Only creator can delete
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found or you don't have permission to delete it`);
    }

    await this.prisma.notification.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    this.logger.log(`Archived notification ${id} by user ${userId}`);
    return { success: true };
  }

  /**
   * Get notification categories distribution
   */
  async getNotificationCategories(userId: string) {
    try {
      const categories = await this.prisma.notification.groupBy({
        by: ['type'],
        where: {
          recipients: {
            some: {
              userId,
              deletedAt: null, // Only count non-deleted recipients
            },
          },
        },
        _count: {
          id: true,
        },
      });

      return categories.map(category => ({
        type: category.type,
        count: category._count?.id || 0,
      }));
    } catch (error) {
      this.logger.error('Failed to get notification categories:', error);
      throw new InternalServerErrorException('Failed to retrieve notification categories');
    }
  }

  /**
   * Clean up expired notifications (scheduled job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredNotifications() {
    try {
      this.logger.log('Starting cleanup of expired notifications...');

      // TODO: Implement when expiresAt field is available
      const expiredNotifications: any[] = [];
      // const expiredNotifications = await this.prisma.notification.findMany({
      //   where: {
      //     expiresAt: {
      //       lte: new Date(),
      //     },
      //     deletedAt: null,
      //   },
      //   select: { id: true },
      // });

      if (expiredNotifications.length > 0) {
        // await this.prisma.notification.updateMany({
        //   where: {
        //     id: { in: expiredNotifications.map(n => n.id) },
        //   },
        //   data: {
        //     deletedAt: new Date(),
        //   },
        // });

        this.logger.log(`Cleaned up ${expiredNotifications.length} expired notifications`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired notifications:', error);
    }
  }

  /**
   * Archive old notifications (scheduled job)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async archiveOldNotifications() {
    try {
      this.logger.log('Starting archive of old notifications...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldNotifications = await this.prisma.notification.findMany({
        where: {
          createdAt: {
            lte: thirtyDaysAgo,
          },
          status: 'READ',
        },
        select: { id: true },
      });

      if (oldNotifications.length > 0) {
        await this.prisma.notification.updateMany({
          where: {
            id: { in: oldNotifications.map(n => n.id) },
          },
          data: {
            status: 'ARCHIVED',
          },
        });

        this.logger.log(`Archived ${oldNotifications.length} old notifications`);
      }
    } catch (error) {
      this.logger.error('Failed to archive old notifications:', error);
    }
  }

  /**
   * Retry failed deliveries (scheduled job)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedDeliveries() {
    try {
      this.logger.log('Starting retry of failed deliveries...');

      // TODO: Implement when new fields are available
      const failedRecipients: any[] = [];
      // const failedRecipients = await this.prisma.notificationRecipient.findMany({
      //   where: {
      //     deliveryStatus: 'FAILED',
      //     deliveryAttempts: { lt: 3 }, // Max 3 attempts
      //     nextRetryAt: { lte: new Date() },
      //     deletedAt: null,
      //   },
      //   include: {
      //     notification: true,
      //     user: {
      //       select: {
      //         id: true,
      //         email: true,
      //         phoneNumber: true,
      //         notificationPreferences: true,
      //       },
      //     },
      //   },
      // });

      for (const recipient of failedRecipients) {
        try {
          await this.deliverToRecipient(recipient.notification, recipient);

          // TODO: Update next retry time when fields are available
          // const nextRetryMinutes = Math.pow(2, recipient.deliveryAttempts) * 5; // 5, 10, 20 minutes
          // const nextRetryAt = new Date();
          // nextRetryAt.setMinutes(nextRetryAt.getMinutes() + nextRetryMinutes);

          // await this.prisma.notificationRecipient.update({
          //   where: { id: recipient.id },
          //   data: { nextRetryAt },
          // });
        } catch (error) {
          this.logger.error(`Failed to retry delivery for recipient ${recipient.id}:`, error);
        }
      }

      if (failedRecipients.length > 0) {
        this.logger.log(`Retried ${failedRecipients.length} failed deliveries`);
      }
    } catch (error) {
      this.logger.error('Failed to retry failed deliveries:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string) {
    try {
      // TODO: Implement when userNotificationPreferences table is available
      return {
        userId,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        inAppNotifications: true,
      };
    } catch (error) {
      this.logger.error('Failed to get user notification preferences:', error);
      throw new InternalServerErrorException('Failed to retrieve notification preferences');
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserNotificationPreferences(userId: string, preferences: any) {
    try {
      // TODO: Implement when userNotificationPreferences table is available
      return {
        userId,
        ...preferences,
      };
    } catch (error) {
      this.logger.error('Failed to update user notification preferences:', error);
      throw new InternalServerErrorException('Failed to update notification preferences');
    }
  }

  /**
   * Get system patient ID (for system notifications that don't have a specific patient)
   */
  private async getSystemPatientId(): Promise<{ id: string; name: string }> {
    try {
      const patient = await this.prisma.patient.findFirst({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (patient) {
        return {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
        };
      }

      // If no patient found, return a placeholder
      // This should rarely happen in a production system
      return {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'System',
      };
    } catch (error) {
      this.logger.error('Failed to get system patient ID:', error);
      return {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'System',
      };
    }
  }

  /**
   * Get system user ID (for system-created notifications)
   */
  async getSystemUserId(): Promise<string> {
    try {
      const adminUser = await this.prisma.user.findFirst({
        where: {
          role: UserRole.ADMIN,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (adminUser) {
        return adminUser.id;
      }

      const rccUser = await this.prisma.user.findFirst({
        where: {
          role: UserRole.RCC,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (rccUser) {
        return rccUser.id;
      }

      throw new InternalServerErrorException('No system user found for creating notifications');
    } catch (error) {
      this.logger.error('Failed to get system user ID:', error);
      throw new InternalServerErrorException('Failed to retrieve system user for notifications');
    }
  }

  /**
   * Get all active users by role
   */
  async getUsersByRole(role: UserRole): Promise<string[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          role,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      return users.map(user => user.id);
    } catch (error) {
      this.logger.error(`Failed to get users by role ${role}:`, error);
      throw new InternalServerErrorException(`Failed to retrieve users with role ${role}`);
    }
  }

  deriveCategoryFromCaseType(caseType: CaseType): NotificationCategory {
    return NotificationCategory.TICKETS;
  }

  /**
   * Ensure category is set in notification data
   */
  ensureCategory(notificationData: Partial<CreateNotificationDto>): NotificationCategory {
    if (notificationData.category) {
      return notificationData.category;
    }

    if (notificationData.caseType) {
      return this.deriveCategoryFromCaseType(notificationData.caseType);
    }

    return NotificationCategory.TICKETS;
  }

  /**
   * Create notification for critical cases incoming to hospitals
   */
  async createCriticalCaseNotification(
    ticketId: string,
    caseType: CaseType,
    caseId: string,
    hospitalId: string,
    isRCCNotification: boolean = false,
  ) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          patient: true,
          destinationHospital: true,
          originHospital: true,
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      }

      const patient = ticket.patient;
      const hospital = ticket.destinationHospital || ticket.originHospital;

      let recipientUserIds: string[];
      if (isRCCNotification) {
        recipientUserIds = await this.getUsersByRole(UserRole.RCC);
      } else {
        const hospitalUsers = await this.prisma.user.findMany({
          where: {
            hospitalId,
            status: 'ACTIVE',
            deletedAt: null,
            role: {
              in: [UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR],
            },
          },
          select: { id: true },
        });
        recipientUserIds = hospitalUsers.map(u => u.id);
      }

      if (recipientUserIds.length === 0) {
        this.logger.warn(`No recipients found for critical case notification (ticket: ${ticketId}, isRCC: ${isRCCNotification})`);
        return null;
      }

      // Determine caseType from ticket pathway (same as createTicketAssignmentNotification)
      let resolvedCaseType: CaseType;
      if (ticket.pathway === 'GENERAL' || ticket.pathway === 'STEMI' || ticket.pathway === 'STROKE' || ticket.pathway === 'TRAUMA') {
        resolvedCaseType = ticket.pathway as CaseType;
      } else {
        this.logger.warn(`Ticket ${ticketId} has unknown pathway ${ticket.pathway}, defaulting to GENERAL`);
        resolvedCaseType = CaseType.GENERAL;
      }

      // Determine priority based on ticket priority (same as createTicketAssignmentNotification)
      let notificationPriority: NotificationPriority;
      switch (ticket.priority) {
        case 'EMERGENCY':
          notificationPriority = NotificationPriority.HIGH;
          break;
        case 'CRITICAL':
          notificationPriority = NotificationPriority.HIGH; // Same as EMERGENCY
          break;
        default:
          notificationPriority = NotificationPriority.HIGH;
      }

      // Override priority for RCC notifications (RCC gets HIGH priority)
      if (isRCCNotification) {
        notificationPriority = NotificationPriority.HIGH;
      }

      const originHospital = ticket.originHospital?.name || 'Unknown';
      const destinationHospital = ticket.destinationHospital?.name || 'Unknown';
      const patientFullName = `${patient.firstName} ${patient.lastName}`;
      
      // Format message with markers for highlighting: [[PATIENT:name]], [[ORIGIN:hospital]], [[DEST:hospital]], [[TICKET:number]]
      const message = `Critical ${caseType} case is incoming. Patient: [[PATIENT:${patientFullName}]]. From: [[ORIGIN:${originHospital}]] to [[DEST:${destinationHospital}]]. Ticket: [[TICKET:${ticket.ticketNumber}]].`;

      const notification = await this.createNotification(
        {
          type: NotificationType.CRITICAL_CASE_INCOMING,
          priority: notificationPriority,
          title: `Critical ${caseType} Case Incoming - ${patientFullName}`,
          message,
          caseType,
          caseId,
          ticketId,
          patientId: patient.id,
          patientName: patientFullName,
          category: isRCCNotification ? NotificationCategory.TICKETS : NotificationCategory.HOSPITALS,
          sourceEntityType: isRCCNotification ? 'TICKET' : 'CASE',
          sourceEntityId: isRCCNotification ? ticketId : caseId,
          recipientUserIds,
          metadata: JSON.stringify({
            ticketId,
            ticketNumber: ticket.ticketNumber,
            caseId,
            caseType: resolvedCaseType,
            pathway: ticket.pathway,
            priority: ticket.priority,
            hospitalId,
            isRCCNotification,
            originHospital: originHospital,
            destinationHospital: destinationHospital,
          }),
        },
        await this.getSystemUserId(),
      );

      if (notification) {
        this.notificationsGateway.emitNotificationCreated(notification);
        this.notificationsGateway.emitNotificationByCategory(
          notification,
          isRCCNotification ? NotificationCategory.TICKETS : NotificationCategory.HOSPITALS,
        );
        if (isRCCNotification) {
          this.notificationsGateway.emitNotificationByRole(notification, [UserRole.RCC]);
        } else {
          this.notificationsGateway.emitNotificationByRole(notification, [
            UserRole.HOSPITAL_USER,
            UserRole.ED_NURSE,
            UserRole.UNIT_NURSE,
            UserRole.BED_COORDINATOR,
          ]);
        }
      }

      return notification;
    } catch (error) {
      this.logger.error(`Failed to create critical case notification for ticket ${ticketId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create critical case notification');
    }
  }

  /**
   * Create notification for ticket assignment to destination hospital
   * Notifies hospital users when a patient is assigned to their hospital
   */
  async createTicketAssignmentNotification(
    ticketId: string,
    destinationHospitalId: string,
  ) {
    try {
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          ticketId,
          type: {
            in: [NotificationType.CRITICAL_CASE_INCOMING, NotificationType.CASE_ASSIGNMENT],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingNotification) {
        return existingNotification;
      }
      
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          patient: true,
          destinationHospital: true,
          originHospital: true,
        },
      });

      if (!ticket) {
        this.logger.error(`Ticket with ID ${ticketId} not found`);
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      }

      if (!ticket.destinationHospitalId) {
        this.logger.warn(`Ticket ${ticketId} has no destination hospital, skipping assignment notification`);
        return null;
      }

      const patient = ticket.patient;
      const hospital = ticket.destinationHospital;

      if (!patient) {
        this.logger.error(`Patient not found for ticket ${ticketId}`);
        throw new NotFoundException(`Patient not found for ticket ${ticketId}`);
      }

      if (!hospital) {
        this.logger.warn(`Destination hospital ${destinationHospitalId} not found for ticket ${ticketId}`);
        return null;
      }

      
      const hospitalUsers = await this.prisma.user.findMany({
        where: {
          hospitalId: destinationHospitalId,
          status: 'ACTIVE',
          deletedAt: null,
          role: {
            in: [UserRole.HOSPITAL_USER, UserRole.ED_NURSE, UserRole.UNIT_NURSE, UserRole.BED_COORDINATOR],
          },
        },
        select: { id: true },
      });

      const recipientUserIds = hospitalUsers.map(u => u.id);

      if (recipientUserIds.length === 0) {
        this.logger.warn(`No hospital users found for ticket assignment notification (ticket: ${ticketId}, hospital: ${destinationHospitalId})`);
        return null;
      }

      
      let notificationPriority: NotificationPriority;
      switch (ticket.priority) {
        case 'EMERGENCY':
          notificationPriority = NotificationPriority.CRITICAL;
          break;
        case 'CRITICAL':
          notificationPriority = NotificationPriority.HIGH; 
          break;
        case 'MEDIUM':
          notificationPriority = NotificationPriority.MEDIUM;
          break;
        default:
          notificationPriority = NotificationPriority.LOW;
      }

      
      let caseType: CaseType;
      if (ticket.pathway === 'GENERAL' || ticket.pathway === 'STEMI' || ticket.pathway === 'STROKE' || ticket.pathway === 'TRAUMA') {
        caseType = ticket.pathway as CaseType;
      } else {
        this.logger.warn(`Ticket ${ticketId} has unknown pathway ${ticket.pathway}, defaulting to GENERAL`);
        caseType = CaseType.GENERAL;
      }

      const isCriticalCase = ticket.priority === 'EMERGENCY' || ticket.priority === 'CRITICAL' || ticket.isEmergency;

      const notificationType = isCriticalCase 
        ? NotificationType.CRITICAL_CASE_INCOMING 
        : NotificationType.CASE_ASSIGNMENT;

      const title = isCriticalCase
        ? `Critical Case Incoming - ${patient.firstName} ${patient.lastName}`
        : `Patient Incoming - ${patient.firstName} ${patient.lastName}`;
      
      let message: string;
      if (isCriticalCase) {
        const originHospital = ticket.originHospital?.name || 'Unknown';
        const destinationHospital = ticket.destinationHospital?.name || hospital.name || 'Unknown';
        const patientFullName = `${patient.firstName} ${patient.lastName}`;
        message = `Critical ${caseType} case is incoming. Patient: [[PATIENT:${patientFullName}]]. From: [[ORIGIN:${originHospital}]] to [[DEST:${destinationHospital}]].`;
      } else {
        message = `Patient ${patient.firstName} ${patient.lastName} is assigned to ${hospital.name}. Ticket: ${ticket.ticketNumber}`;
      }

      const notification = await this.createNotification(
        {
          type: notificationType,
          priority: notificationPriority,
          title,
          message,
          caseType,
          caseId: ticketId, 
          ticketId,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          category: NotificationCategory.HOSPITALS,
          sourceEntityType: 'TICKET',
          sourceEntityId: ticketId,
          recipientUserIds,
          metadata: JSON.stringify({
            ticketId,
            ticketNumber: ticket.ticketNumber,
            destinationHospitalId,
            priority: ticket.priority,
            pathway: ticket.pathway,
            isCriticalCase,
          }),
        },
        await this.getSystemUserId(),
      );

      if (notification) {
        this.notificationsGateway.emitNotificationCreated(notification);
        this.notificationsGateway.emitNotificationByCategory(
          notification,
          NotificationCategory.HOSPITALS,
        );
        this.notificationsGateway.emitNotificationByRole(notification, [
          UserRole.HOSPITAL_USER,
          UserRole.ED_NURSE,
          UserRole.UNIT_NURSE,
          UserRole.BED_COORDINATOR,
        ]);
      }

      this.logger.log(`Successfully created ticket assignment notification ${notification.id} for ticket ${ticketId}`);
      return notification;
    } catch (error) {
      this.logger.error(`=== Error in createTicketAssignmentNotification ===`);
      this.logger.error(`Ticket ID: ${ticketId}, Destination Hospital ID: ${destinationHospitalId}`);
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.error(`Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create ticket assignment notification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create notification for incomplete patient data
   * Notifies RCC users when a patient has incomplete data (national ID zeros or missing date of birth)
   */
  async createIncompletePatientDataNotification(
    patientId: string,
    patientName: string,
    missingFields: string[],
    createdById: string,
  ) {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          type: NotificationType.INCOMPLETE_PATIENT_DATA,
          patientId,
          isRead: false,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
      });

      if (existingNotification) {
        this.logger.log(`Duplicate incomplete patient data notification prevented for patient ${patientId}`);
        return null;
      }

      const rccUserIds = await this.getUsersByRole(UserRole.RCC);

      if (rccUserIds.length === 0) {
        this.logger.warn(`No RCC users found for incomplete patient data notification (patient: ${patientId})`);
        return null;
      }

      const missingFieldsText = missingFields.join(', ');
      const message = `Patient ${patientName} has incomplete data. Missing fields: ${missingFieldsText}`;

      const notification = await this.createNotification(
        {
          type: NotificationType.INCOMPLETE_PATIENT_DATA,
          priority: NotificationPriority.MEDIUM,
          title: `Incomplete Patient Data - ${patientName}`,
          message,
          caseType: CaseType.GENERAL,
          caseId: patientId,
          patientId,
          patientName,
          category: NotificationCategory.PATIENTS,
          recipientUserIds: rccUserIds,
          metadata: JSON.stringify({
            missingFields,
            source: 'patient_data_validation',
          }),
        },
        createdById,
      );

      if (notification) {
        this.notificationsGateway.emitNotificationCreated(notification);
        this.notificationsGateway.emitNotificationByCategory(
          notification,
          NotificationCategory.PATIENTS,
        );
        this.notificationsGateway.emitNotificationByRole(notification, [UserRole.RCC]);
      }

      this.logger.log(`Successfully created incomplete patient data notification ${notification?.id} for patient ${patientId}`);
      return notification;
    } catch (error) {
      this.logger.error(`=== Error in createIncompletePatientDataNotification ===`);
      this.logger.error(`Patient ID: ${patientId}, Patient Name: ${patientName}`);
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.error(`Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      
      // Don't throw error - patient creation/update should still succeed even if notification fails
      return null;
    }
  }

  /**
   * Create notification for KPI threshold breach
   * Notifies RCC users when a hospital KPI reaches YELLOW (warning) or RED (critical) status
   */
  async createKpiBreachNotification(
    hospitalId: string,
    hospitalName: string,
    caseType: 'STEMI' | 'STROKE' | 'TRAUMA',
    kpiName: string,
    kpiId: string,
    status: 'YELLOW' | 'RED',
    percentage: number,
    target: string,
    previousStatus: 'GREEN' | 'YELLOW' | 'RED',
    createdById: string,
  ) {
    try {
      const priority =
        status === 'RED' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;

      const title =
        status === 'RED'
          ? `KPI Critical - ${hospitalName} - ${kpiName}`
          : `KPI Warning - ${hospitalName} - ${kpiName}`;

      const message =
        status === 'RED'
          ? `${hospitalName} ${caseType} KPI '${kpiName}' is at ${percentage}% (Target: ${target}). Immediate attention required.`
          : `${hospitalName} ${caseType} KPI '${kpiName}' is at ${percentage}% (Target: ${target}). Status: Warning`;

      const rccUserIds = await this.getUsersByRole(UserRole.RCC);

      if (rccUserIds.length === 0) {
        this.logger.warn(
          `No active RCC users found for KPI breach notification (hospital: ${hospitalId}, KPI: ${kpiId})`,
        );
        return null;
      }

      const metadata = JSON.stringify({
        hospitalId,
        hospitalName,
        caseType,
        kpiId,
        kpiName,
        status,
        percentage,
        target,
        previousStatus,
        source: 'kpi_monitoring',
      });

      const systemPatient = await this.getSystemPatientId();

      const notification = await this.createNotification(
        {
          type: NotificationType.KPI_THRESHOLD_BREACH,
          priority,
          title,
          message,
          caseType: caseType === 'STEMI' ? CaseType.STEMI : caseType === 'STROKE' ? CaseType.STROKE : CaseType.TRAUMA,
          caseId: hospitalId, 
          patientId: systemPatient.id, 
          patientName: hospitalName, 
          category: NotificationCategory.HOSPITALS,
          recipientUserIds: rccUserIds,
          metadata,
        },
        createdById,
      );

      if (notification) {
        this.notificationsGateway.emitNotificationCreated(notification);
        this.notificationsGateway.emitNotificationByCategory(
          notification,
          NotificationCategory.HOSPITALS,
        );
        this.notificationsGateway.emitNotificationByRole(notification, [UserRole.RCC]);
      }

      this.logger.log(
        `Successfully created KPI breach notification ${notification?.id} for hospital ${hospitalName}, caseType ${caseType}, KPI ${kpiName} (${status})`,
      );
      return notification;
    } catch (error) {
      this.logger.error(`=== Error in createKpiBreachNotification ===`);
      this.logger.error(
        `Hospital ID: ${hospitalId}, Case Type: ${caseType}, KPI ID: ${kpiId}, Status: ${status}`,
      );
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.error(`Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);

      return null;
    }
  }

  /**
   * Create a consolidated notification for multiple KPI breaches at once
   * One notification per hospital/caseType with all failing KPIs
   */
  async createKpiBreachSummaryNotification(
    hospitalId: string,
    hospitalName: string,
    caseType: 'STEMI' | 'STROKE' | 'TRAUMA',
    failingKpis: Array<{
      id: string;
      name: string;
      status: 'YELLOW' | 'RED';
      percentage: number;
      target: string;
      previousStatus: 'GREEN' | 'YELLOW' | 'RED';
    }>,
    createdById: string,
  ) {
    try {
      const redKpis = failingKpis.filter(k => k.status === 'RED');
      const yellowKpis = failingKpis.filter(k => k.status === 'YELLOW');
      const hasRed = redKpis.length > 0;

      const priority = hasRed ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;

      const title = hasRed
        ? `KPI Alert - ${hospitalName} - ${failingKpis.length} KPIs Requiring Attention`
        : `KPI Warning - ${hospitalName} - ${failingKpis.length} KPIs Below Target`;

      const redCount = redKpis.length;
      const yellowCount = yellowKpis.length;
      let message = `${hospitalName} ${caseType} has ${failingKpis.length} KPI(s) requiring attention:\n\n`;
      
      if (redCount > 0) {
        message += `🔴 Critical (${redCount}):\n`;
        redKpis.forEach(kpi => {
          message += `  • ${kpi.name}: ${kpi.percentage}% (Target: ${kpi.target})\n`;
        });
        message += '\n';
      }
      
      if (yellowCount > 0) {
        message += `🟡 Warning (${yellowCount}):\n`;
        yellowKpis.forEach(kpi => {
          message += `  • ${kpi.name}: ${kpi.percentage}% (Target: ${kpi.target})\n`;
        });
      }

      const rccUserIds = await this.getUsersByRole(UserRole.RCC);

      if (rccUserIds.length === 0) {
        this.logger.warn(
          `No active RCC users found for KPI breach summary notification (hospital: ${hospitalId})`,
        );
        return null;
      }

      const metadata = JSON.stringify({
        hospitalId,
        hospitalName,
        caseType,
        totalFailingKpis: failingKpis.length,
        redCount,
        yellowCount,
        kpis: failingKpis.map(kpi => ({
          id: kpi.id,
          name: kpi.name,
          status: kpi.status,
          percentage: kpi.percentage,
          target: kpi.target,
          previousStatus: kpi.previousStatus,
        })),
        source: 'kpi_monitoring',
        notificationType: 'summary', 
      });

      const systemPatient = await this.getSystemPatientId();

      const notification = await this.createNotification(
        {
          type: NotificationType.KPI_THRESHOLD_BREACH,
          priority,
          title,
          message,
          caseType: caseType === 'STEMI' ? CaseType.STEMI : caseType === 'STROKE' ? CaseType.STROKE : CaseType.TRAUMA,
          caseId: hospitalId,
          patientId: systemPatient.id,
          patientName: hospitalName,
          category: NotificationCategory.HOSPITALS,
          recipientUserIds: rccUserIds,
          metadata,
        },
        createdById,
      );

      if (notification) {
        this.notificationsGateway.emitNotificationCreated(notification);
        this.notificationsGateway.emitNotificationByCategory(
          notification,
          NotificationCategory.HOSPITALS,
        );
        this.notificationsGateway.emitNotificationByRole(notification, [UserRole.RCC]);
      }

      this.logger.log(
        `Successfully created KPI breach summary notification ${notification?.id} for hospital ${hospitalName}, caseType ${caseType}, ${failingKpis.length} failing KPIs`,
      );
      return notification;
    } catch (error) {
      this.logger.error(`=== Error in createKpiBreachSummaryNotification ===`);
      this.logger.error(
        `Hospital ID: ${hospitalId}, Case Type: ${caseType}, Failing KPIs: ${failingKpis.length}`,
      );
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.error(`Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);

      return null;
    }
  }
}
