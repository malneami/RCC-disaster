import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCriticalCaseDto, UpdateCriticalCaseDto } from './dto/create-critical-case.dto';
import { CriticalCase, CriticalCaseStatus } from '@prisma/client';

@Injectable()
export class CriticalCasesService {
  constructor(private prisma: PrismaService) {}

  async create(createCriticalCaseDto: CreateCriticalCaseDto, userId: string): Promise<CriticalCase> {
    return this.prisma.criticalCase.create({
      data: {
        ...createCriticalCaseDto,
        startTime: new Date(createCriticalCaseDto.startTime),
        createdById: userId,
      },
      include: {
        hospital: true,
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
  }

  async findAll(hospitalId?: string): Promise<CriticalCase[]> {
    const where = {
      deletedAt: null,
      ...(hospitalId && { hospitalId }),
    };

    return this.prisma.criticalCase.findMany({
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
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async findActive(hospitalId?: string): Promise<CriticalCase[]> {
    const where = {
      deletedAt: null,
      status: CriticalCaseStatus.ACTIVE,
      ...(hospitalId && { hospitalId }),
    };

    return this.prisma.criticalCase.findMany({
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
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<CriticalCase> {
    const criticalCase = await this.prisma.criticalCase.findFirst({
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
      },
    });

    if (!criticalCase) {
      throw new NotFoundException(`Critical case with ID ${id} not found`);
    }

    return criticalCase;
  }

  async update(id: string, updateCriticalCaseDto: UpdateCriticalCaseDto): Promise<CriticalCase> {
    const data: any = { ...updateCriticalCaseDto };
    
    if (updateCriticalCaseDto.startTime) {
      data.startTime = new Date(updateCriticalCaseDto.startTime);
    }

    const criticalCase = await this.prisma.criticalCase.update({
      where: { id },
      data,
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
      },
    });

    return criticalCase;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.criticalCase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(hospitalId?: string) {
    const where = {
      deletedAt: null,
      ...(hospitalId && { hospitalId }),
    };

    const [total, active, critical, urgent] = await Promise.all([
      this.prisma.criticalCase.count({ where }),
      this.prisma.criticalCase.count({ 
        where: { ...where, status: CriticalCaseStatus.ACTIVE } 
      }),
      this.prisma.criticalCase.count({ 
        where: { ...where, severity: 'CRITICAL' } 
      }),
      this.prisma.criticalCase.count({ 
        where: { ...where, severity: 'URGENT' } 
      }),
    ]);

    return {
      total,
      active,
      critical,
      urgent,
    };
  }
}
