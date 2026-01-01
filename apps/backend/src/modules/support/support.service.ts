import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupportTicketStatus, SupportTicketCategory, MessageSenderType, UserRole } from '@prisma/client';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SupportTicketFilterDto } from './dto/support-ticket-filter.dto';
import { TelegramService } from './telegram.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB per ticket
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'video/mp4', 'video/mov', 'video/quicktime',
    'application/pdf',
  ];

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;

    const lastTicket = await this.prisma.supportTicket.findFirst({
      where: {
        ticketNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        ticketNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastTicket) {
      const lastSequence = parseInt(lastTicket.ticketNumber.replace(prefix, ''), 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }


  async createTicket(dto: CreateSupportTicketDto, userId: string) {
    const ticketNumber = await this.generateTicketNumber();

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        description: dto.description,
        category: dto.category || SupportTicketCategory.OTHER,
        status: SupportTicketStatus.OPEN,
        createdById: userId,
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
      },
    });

    await this.telegramService.sendNewTicketNotification(ticket as any);

    this.logger.log(`Support ticket created: ${ticketNumber} by user ${userId}`);
    return ticket;
  }

  async getUserTickets(userId: string, filters: SupportTicketFilterDto) {
    const { status, category, search, dateFrom, dateTo, page = 1, limit = 20 } = filters;

    const where: any = {
      createdById: userId,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              messages: true,
              attachments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async getTicket(ticketId: string, userId: string, userRole: UserRole) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        attachments: {
          where: {
            messageId: null, 
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.SUPPORT) {
      if (!userId || ticket.createdById !== userId) {
        throw new ForbiddenException('You do not have access to this ticket');
      }
    }

    return ticket;
  }

  async createMessage(ticketId: string, dto: CreateSupportMessageDto, userId: string, userRole: UserRole) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.SUPPORT) {
      if (!userId || ticket.createdById !== userId) {
        throw new ForbiddenException('You do not have access to this ticket');
      }
    }

    const senderType = userRole === UserRole.SUPPORT ? MessageSenderType.SUPPORT : MessageSenderType.USER;

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        content: dto.content,
        senderId: userId,
        senderType,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    if (senderType === MessageSenderType.USER) {
      await this.telegramService.sendNewMessageNotification(ticket as any, dto.content);
    }

    this.logger.log(`Message created on ticket ${ticketId} by user ${userId}`);
    return message;
  }


  async uploadAttachment(
    ticketId: string,
    messageId: string | null,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    userId: string,
    userRole: UserRole
  ) {
    this.validateFile(file);

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.SUPPORT) {
      if (!userId || ticket.createdById !== userId) {
        throw new ForbiddenException('You do not have access to this ticket');
      }
    }

    const totalSize = await this.getTotalAttachmentSize(ticketId);
    if (totalSize + file.size > this.MAX_TOTAL_SIZE) {
      throw new BadRequestException(`Total attachment size exceeds ${this.MAX_TOTAL_SIZE / 1024 / 1024}MB limit`);
    }

    const fileData = file.buffer.toString('base64');

    const attachment = await this.prisma.supportAttachment.create({
      data: {
        ticketId,
        messageId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileData,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Attachment uploaded to ticket ${ticketId} by user ${userId}`);
    return attachment;
  }


  private async getTotalAttachmentSize(ticketId: string): Promise<number> {
    const result = await this.prisma.supportAttachment.aggregate({
      where: { ticketId },
      _sum: {
        fileSize: true,
      },
    });

    return result._sum.fileSize || 0;
  }


  private validateFile(file: { originalname: string; mimetype: string; size: number; buffer: Buffer }): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed. Allowed types: images, videos, PDFs`);
    }
  }


  async getAllTickets(filters: SupportTicketFilterDto) {
    const { status, category, search, dateFrom, dateTo, page = 1, limit = 20 } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { createdBy: { firstName: { contains: search, mode: 'insensitive' } } },
        { createdBy: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
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
          resolvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              messages: true,
              attachments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async getTicketAdmin(ticketId: string, userId?: string) {
    return this.getTicket(ticketId, userId || '', UserRole.SUPPORT);
  }


  async replyToTicket(ticketId: string, dto: CreateSupportMessageDto, userId: string) {
    return this.createMessage(ticketId, dto, userId, UserRole.SUPPORT);
  }


  async updateTicketStatus(ticketId: string, dto: UpdateTicketStatusDto, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === SupportTicketStatus.RESOLVED || dto.status === SupportTicketStatus.CLOSED) {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = userId;
    } else {
      updateData.resolvedAt = null;
      updateData.resolvedById = null;
    }

    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Ticket ${ticketId} status updated to ${dto.status} by user ${userId}`);
    return updatedTicket;
  }


  async getTelegramChatIdFromPhone(phoneNumber: string): Promise<string | null> {
    return this.telegramService.getChatIdFromPhoneNumber(phoneNumber);
  }


  async getStatistics() {
    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      byCategory,
      resolvedToday,
    ] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.CLOSED } }),
      this.prisma.supportTicket.groupBy({
        by: ['category'],
        _count: true,
      }),
      this.prisma.supportTicket.count({
        where: {
          status: SupportTicketStatus.RESOLVED,
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      byCategory: byCategory.map(item => ({
        category: item.category,
        count: item._count,
      })),
      resolvedToday,
    };
  }
}

