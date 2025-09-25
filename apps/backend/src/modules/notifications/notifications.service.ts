import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNotificationDto, NotificationFilterDto, MarkNotificationReadDto } from './dto/create-notification.dto';
import { NotificationType, NotificationPriority, CaseType, DeliveryStatus, DeliveryMethod } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new notification with recipients
   */
  async createNotification(createNotificationDto: CreateNotificationDto, createdById: string) {
    const { recipientUserIds, ...notificationData } = createNotificationDto;

    // Create the notification
    const notification = await this.prisma.notification.create({
      data: {
        ...notificationData,
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
            age: true,
            gender: true,
          },
        },
      },
    });

    this.logger.log(`Created notification ${notification.id} for ${recipientUserIds?.length || 0} recipients`);
    return notification;
  }

  /**
   * Get notifications with filtering and pagination
   */
  async getNotifications(filterDto: NotificationFilterDto, userId: string) {
    const {
      type,
      priority,
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      recipients: {
        some: {
          userId,
        },
      },
    };

    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (caseType) where.caseType = caseType;
    if (patientId) where.patientId = patientId;
    if (caseId) where.caseId = caseId;
    if (isRead !== undefined) {
      where.recipients = {
        some: {
          userId,
          isRead,
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { patientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

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
              age: true,
              gender: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get notification summary statistics
   */
  async getNotificationSummary(userId: string) {
    const [
      totalNotifications,
      highPriorityNotifications,
      emailNotifications,
      smsNotifications,
    ] = await Promise.all([
      this.prisma.notification.count({
        where: {
          recipients: {
            some: { userId },
          },
        },
      }),
      this.prisma.notification.count({
        where: {
          priority: NotificationPriority.HIGH,
          recipients: {
            some: { userId },
          },
        },
      }),
      this.prisma.notificationRecipient.count({
        where: {
          userId,
          emailSent: true,
        },
      }),
      this.prisma.notificationRecipient.count({
        where: {
          userId,
          smsSent: true,
        },
      }),
    ]);

    return {
      totalNotifications,
      highPriorityNotifications,
      emailNotifications,
      smsNotifications,
    };
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
      },
      data: {
        isRead: true,
        readAt: new Date(),
        deliveryStatus: DeliveryStatus.READ,
      },
    });

    this.logger.log(`Marked ${result.count} notifications as read for user ${userId}`);
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
            age: true,
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
    const categories = await this.prisma.notification.groupBy({
      by: ['type'],
      where: {
        recipients: {
          some: { userId },
        },
      },
      _count: {
        id: true,
      },
    });

    return categories.map(category => ({
      type: category.type,
      count: category._count.id,
    }));
  }
}
