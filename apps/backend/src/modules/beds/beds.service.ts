import { Injectable, ForbiddenException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BedStatus, UserRole } from '@prisma/client';
import { GetBedsDto } from './dto/get-beds.dto';
import { BedResponseDto } from './dto/bed-response.dto';
import { UpdateBedStatusDto } from './dto/update-bed-status.dto';

@Injectable()
export class BedsService {
  private readonly logger = new Logger(BedsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(
    filters: GetBedsDto,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<BedResponseDto[]> {
    const isHospitalUser = [
      UserRole.HOSPITAL_USER,
      UserRole.ED_NURSE,
      UserRole.UNIT_NURSE,
      UserRole.BED_COORDINATOR,
    ].includes(userRole as any);
    
    if (isHospitalUser && !userHospitalId) {
      throw new ForbiddenException('Hospital assignment required to view beds');
    }

    const where: any = {
      deletedAt: null,
    };

    if (isHospitalUser) {
      where.hospitalId = userHospitalId;
    } else if (filters.hospitalId) {
      where.hospitalId = filters.hospitalId;
    } else if (userHospitalId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      where.hospitalId = userHospitalId;
    }

    if (filters.unitId) {
      const targetHospitalId = filters.hospitalId || userHospitalId;
      
      if (targetHospitalId) {
        const unit = await this.prisma.unit.findFirst({
          where: {
            id: filters.unitId,
            hospitalId: targetHospitalId,
            deletedAt: null,
          },
        });

        if (!unit) {
          if (isHospitalUser) {
            throw new ForbiddenException('Unit not found or does not belong to your hospital');
          } else {
            throw new NotFoundException('Unit not found or does not belong to the specified hospital');
          }
        }
      }

      where.unitId = filters.unitId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const beds = await this.prisma.bed.findMany({
      where,
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        currentPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            age: true,
            gender: true,
            mrn: true,
          },
        },
      },
      orderBy: [
        { unit: { name: 'asc' } },
        { bedNumber: 'asc' },
      ],
    });

    return beds.map((bed) => ({
      id: bed.id,
      bedNumber: bed.bedNumber,
      status: bed.status,
      location: bed.location || undefined,
      isOperational: bed.isOperational,
      unit: {
        id: bed.unit.id,
        name: bed.unit.name,
        bedType: bed.unit.bedType,
      },
      hospital: {
        id: bed.hospital.id,
        name: bed.hospital.name,
      },
      currentPatient: bed.currentPatient
        ? {
            id: bed.currentPatient.id,
            name: `${bed.currentPatient.firstName} ${bed.currentPatient.lastName}`,
            nationalId: bed.currentPatient.nationalId || undefined,
            age: bed.currentPatient.age || undefined,
            gender: bed.currentPatient.gender || undefined,
            mrn: bed.currentPatient.mrn || undefined,
          }
        : undefined,
    }));
  }

  async findOne(id: string, userHospitalId: string | null, userRole: UserRole): Promise<BedResponseDto> {
    const bed = await this.prisma.bed.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        currentPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            age: true,
            gender: true,
            mrn: true,
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    const isHospitalUser = [
      UserRole.HOSPITAL_USER,
      UserRole.ED_NURSE,
      UserRole.UNIT_NURSE,
      UserRole.BED_COORDINATOR,
    ].includes(userRole as any);
    
    if (isHospitalUser && bed.hospitalId !== userHospitalId) {
      throw new ForbiddenException('Access denied to this bed');
    }

    return {
      id: bed.id,
      bedNumber: bed.bedNumber,
      status: bed.status,
      location: bed.location || undefined,
      isOperational: bed.isOperational,
      unit: {
        id: bed.unit.id,
        name: bed.unit.name,
        bedType: bed.unit.bedType,
      },
      hospital: {
        id: bed.hospital.id,
        name: bed.hospital.name,
      },
      currentPatient: bed.currentPatient
        ? {
            id: bed.currentPatient.id,
            name: `${bed.currentPatient.firstName} ${bed.currentPatient.lastName}`,
            nationalId: bed.currentPatient.nationalId || undefined,
            age: bed.currentPatient.age || undefined,
            gender: bed.currentPatient.gender || undefined,
            mrn: bed.currentPatient.mrn || undefined,
          }
        : undefined,
    };
  }

  async getUnitsByHospital(hospitalId: string): Promise<Array<{ id: string; name: string; bedType: string }>> {
    const units = await this.prisma.unit.findMany({
      where: {
        hospitalId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        bedType: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      bedType: unit.bedType,
    }));
  }

  async updateStatus(
    id: string,
    updateDto: UpdateBedStatusDto,
    userId: string,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<BedResponseDto> {
    const bed = await this.prisma.bed.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    const isHospitalUser = [
      UserRole.HOSPITAL_USER,
      UserRole.ED_NURSE,
      UserRole.UNIT_NURSE,
      UserRole.BED_COORDINATOR,
    ].includes(userRole as any);

    if (isHospitalUser && bed.hospitalId !== userHospitalId) {
      throw new ForbiddenException('Access denied to this bed');
    }

    const previousStatus = bed.status;
    const newStatus = updateDto.status;

    if (previousStatus === newStatus) {
      throw new BadRequestException(`Bed is already ${newStatus}`);
    }

    const validTransitions: Record<BedStatus, BedStatus[]> = {
      VACANT: [BedStatus.OCCUPIED, BedStatus.CLEANING, BedStatus.BLOCKED, BedStatus.RESERVED],
      OCCUPIED: [BedStatus.CLEANING, BedStatus.BLOCKED],
      CLEANING: [BedStatus.VACANT, BedStatus.BLOCKED],
      BLOCKED: [BedStatus.VACANT, BedStatus.CLEANING],
      RESERVED: [BedStatus.OCCUPIED, BedStatus.VACANT, BedStatus.BLOCKED],
    };

    if (!validTransitions[previousStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${previousStatus} to ${newStatus}`,
      );
    }

    const shouldClearPatient = newStatus === BedStatus.VACANT || newStatus === BedStatus.CLEANING;
    
    const updatedBed = await this.prisma.bed.update({
      where: { id },
      data: {
        status: newStatus,
        ...(shouldClearPatient && {
          currentPatientId: null,
          currentBedRequestId: null,
        }),
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        currentPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            age: true,
            gender: true,
            mrn: true,
          },
        },
      },
    });

    await this.prisma.bedStatusHistory.create({
      data: {
        bedId: id,
        previousStatus,
        newStatus,
        changedById: userId,
        reason: updateDto.reason || null,
        notes: updateDto.notes || null,
      },
    });

    return {
      id: updatedBed.id,
      bedNumber: updatedBed.bedNumber,
      status: updatedBed.status,
      location: updatedBed.location || undefined,
      isOperational: updatedBed.isOperational,
      unit: {
        id: updatedBed.unit.id,
        name: updatedBed.unit.name,
        bedType: updatedBed.unit.bedType,
      },
      hospital: {
        id: updatedBed.hospital.id,
        name: updatedBed.hospital.name,
      },
      currentPatient: updatedBed.currentPatient
        ? {
            id: updatedBed.currentPatient.id,
            name: `${updatedBed.currentPatient.firstName} ${updatedBed.currentPatient.lastName}`,
            nationalId: updatedBed.currentPatient.nationalId || undefined,
            age: updatedBed.currentPatient.age || undefined,
            gender: updatedBed.currentPatient.gender || undefined,
            mrn: updatedBed.currentPatient.mrn || undefined,
          }
        : undefined,
    };
  }

  async getBedStatusHistory(
    bedId: string,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<any[]> {
    const bed = await this.prisma.bed.findFirst({
      where: {
        id: bedId,
        deletedAt: null,
      },
      select: {
        id: true,
        hospitalId: true,
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    const isHospitalUser = [
      UserRole.HOSPITAL_USER,
      UserRole.ED_NURSE,
      UserRole.UNIT_NURSE,
      UserRole.BED_COORDINATOR,
    ].includes(userRole as any);

    if (isHospitalUser && bed.hospitalId !== userHospitalId) {
      throw new ForbiddenException('Access denied to this bed');
    }

    const history = await this.prisma.bedStatusHistory.findMany({
      where: {
        bedId,
      },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    });

    return history.map((item) => ({
      id: item.id,
      previousStatus: item.previousStatus || null,
      newStatus: item.newStatus,
      changedAt: item.changedAt,
      reason: item.reason || null,
      notes: item.notes || null,
      changedBy: {
        id: item.changedBy.id,
        firstName: item.changedBy.firstName,
        lastName: item.changedBy.lastName,
        email: item.changedBy.email,
      },
    }));
  }
}