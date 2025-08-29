import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: { tickets: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: patients,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tickets: {
          include: {
            originHospital: true,
            destinationHospital: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}