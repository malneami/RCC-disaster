import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateHospitalTicketDto, UpdateHospitalTicketDto } from './dto/create-hospital-ticket.dto';
import { HospitalTicket, HospitalTicketStatus } from '@prisma/client';

@Injectable()
export class HospitalTicketsService {
  constructor(private prisma: PrismaService) {}

  async create(createHospitalTicketDto: CreateHospitalTicketDto, userId: string): Promise<HospitalTicket> {
    return this.prisma.hospitalTicket.create({
      data: {
        ...createHospitalTicketDto,
        createdById: userId,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(hospitalId?: string): Promise<HospitalTicket[]> {
    const where = {
      deletedAt: null,
      ...(hospitalId && { hospitalId }),
    };

    return this.prisma.hospitalTicket.findMany({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOpen(hospitalId?: string): Promise<HospitalTicket[]> {
    const where = {
      deletedAt: null,
      status: {
        in: [HospitalTicketStatus.OPEN, HospitalTicketStatus.IN_PROGRESS],
      },
      ...(hospitalId && { hospitalId }),
    };

    return this.prisma.hospitalTicket.findMany({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<HospitalTicket> {
    const hospitalTicket = await this.prisma.hospitalTicket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!hospitalTicket) {
      throw new NotFoundException(`Hospital ticket with ID ${id} not found`);
    }

    return hospitalTicket;
  }

  async update(id: string, updateHospitalTicketDto: UpdateHospitalTicketDto): Promise<HospitalTicket> {
    const hospitalTicket = await this.prisma.hospitalTicket.update({
      where: { id },
      data: updateHospitalTicketDto,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return hospitalTicket;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.hospitalTicket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(hospitalId?: string) {
    const where = {
      deletedAt: null,
      ...(hospitalId && { hospitalId }),
    };

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.hospitalTicket.count({ where }),
      this.prisma.hospitalTicket.count({ 
        where: { ...where, status: HospitalTicketStatus.OPEN } 
      }),
      this.prisma.hospitalTicket.count({ 
        where: { ...where, status: HospitalTicketStatus.IN_PROGRESS } 
      }),
      this.prisma.hospitalTicket.count({ 
        where: { ...where, status: HospitalTicketStatus.RESOLVED } 
      }),
      this.prisma.hospitalTicket.count({ 
        where: { ...where, status: HospitalTicketStatus.CLOSED } 
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
    };
  }
}
