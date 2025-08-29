import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType } from '@prisma/client';

@Injectable()
export class HospitalsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.hospital.findMany({
      where: { deletedAt: null },
      include: {
        services: true,
        equipment: true,
        _count: {
          select: {
            users: true,
            originTickets: true,
            destinationTickets: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByService(serviceType: ServiceType) {
    return this.prisma.hospital.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        services: {
          some: {
            service: serviceType,
            isAvailable: true,
          },
        },
      },
      include: {
        services: {
          where: { service: serviceType },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.hospital.findUnique({
      where: { id },
      include: {
        services: true,
        equipment: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }
}