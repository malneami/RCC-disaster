import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TicketStatus, UserRole } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, userRole?: UserRole, hospitalId?: string) {
    const skip = (page - 1) * limit;

    let where: any = { deletedAt: null };

    // Role-based filtering
    if (userRole === UserRole.CATH_LAB_USER) {
      where.pathway = 'STEMI';
    }

    if (hospitalId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              mrn: true,
            },
          },
          originHospital: {
            select: {
              name: true,
            },
          },
          destinationHospital: {
            select: {
              name: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}