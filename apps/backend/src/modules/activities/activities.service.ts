import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityType } from '@prisma/client';

export interface CreateActivityDto {
  type: ActivityType;
  description: string;
  userId: string;
  ticketId?: string;
  metadata?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createActivityDto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: createActivityDto,
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: {
            select: {
              ticketNumber: true,
              pathway: true,
            },
          },
        },
      }),
      this.prisma.activity.count({ where: { userId } }),
    ]);

    return {
      data: activities,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}