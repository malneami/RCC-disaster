import { Injectable, ForbiddenException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BedStatus, UserRole, CaseType } from '@prisma/client';
import { GetBedsDto } from './dto/get-beds.dto';
import { BedResponseDto, BedListItemDto } from './dto/bed-response.dto';
import { UpdateBedStatusDto } from './dto/update-bed-status.dto';
import { CreateBedDto } from './dto/create-bed.dto';
import { AssignBedDto } from './dto/assign-bed.dto';

@Injectable()
export class BedsService {
  private readonly logger = new Logger(BedsService.name);

  constructor(private prisma: PrismaService) { }

  async findAll(
    filters: GetBedsDto,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<BedListItemDto[]> {
    const isAdminOrRCC = userRole === UserRole.ADMIN || userRole === UserRole.RCC;
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
    }
    else if (filters.hospitalId) {
      where.hospitalId = filters.hospitalId;
    }

    if (filters.unitId) {
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
            name: true,
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
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { unit: { name: 'asc' } },
        { bedNumber: 'asc' },
      ],
    });

    return beds.map((bed): BedListItemDto => {
      const base: any = {
        id: bed.id,
        bedNumber: bed.bedNumber,
        status: bed.status,
        isOperational: bed.isOperational,
        unitName: bed.unit.name,
        hospital: {
          id: bed.hospital.id,
          name: bed.hospital.name,
        },
        currentPatientName: bed.currentPatient
          ? `${bed.currentPatient.firstName} ${bed.currentPatient.lastName}`
          : undefined,
      };

      return base;
    });
  }

  async getStats(
    filters: GetBedsDto,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<{
    total: number;
    vacant: number;
    occupied: number;
    cleaning: number;
    blocked: number;
    reserved: number;
  }> {
    const isAdminOrRCC = userRole === UserRole.ADMIN || userRole === UserRole.RCC;
    const isHospitalUser = [
      UserRole.HOSPITAL_USER,
      UserRole.ED_NURSE,
      UserRole.UNIT_NURSE,
      UserRole.BED_COORDINATOR,
    ].includes(userRole as any);

    if (isHospitalUser && !userHospitalId) {
      throw new ForbiddenException('Hospital assignment required to view bed statistics');
    }

    const where: any = {
      deletedAt: null,
    };

    if (isHospitalUser) {
      where.hospitalId = userHospitalId;
    }
    else if (filters.hospitalId) {
      where.hospitalId = filters.hospitalId;
    }

    if (filters.unitId) {
      where.unitId = filters.unitId;
    }

    const total = await this.prisma.bed.count({ where });
    const [vacant, occupied, cleaning, blocked, reserved] = await Promise.all([
      this.prisma.bed.count({ where: { ...where, status: BedStatus.VACANT } }),
      this.prisma.bed.count({ where: { ...where, status: BedStatus.OCCUPIED } }),
      this.prisma.bed.count({ where: { ...where, status: BedStatus.CLEANING } }),
      this.prisma.bed.count({ where: { ...where, status: BedStatus.BLOCKED } }),
      this.prisma.bed.count({ where: { ...where, status: BedStatus.RESERVED } }),
    ]);

    return {
      total,
      vacant,
      occupied,
      cleaning,
      blocked,
      reserved,
    };
  }

  async create(
    createDto: CreateBedDto,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<BedResponseDto> {
    const isHospitalUser = [
      UserRole.HOSPITAL_USER,
      UserRole.ED_NURSE,
      UserRole.UNIT_NURSE,
      UserRole.BED_COORDINATOR,
    ].includes(userRole as any);

    if (isHospitalUser && !userHospitalId) {
      throw new ForbiddenException('Hospital assignment required to create beds');
    }

    const unit = await this.prisma.unit.findFirst({
      where: {
        id: createDto.unitId,
        deletedAt: null,
      },
      include: {
        hospital: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (isHospitalUser && unit.hospitalId !== userHospitalId) {
      throw new ForbiddenException('Unit does not belong to your hospital');
    }

    const existingBed = await this.prisma.bed.findFirst({
      where: {
        unitId: createDto.unitId,
        bedNumber: createDto.bedNumber,
        deletedAt: null,
      },
    });

    if (existingBed) {
      throw new BadRequestException(`Bed number "${createDto.bedNumber}" already exists in this unit`);
    }

    const bed = await this.prisma.bed.create({
      data: {
        unitId: createDto.unitId,
        hospitalId: unit.hospitalId,
        bedNumber: createDto.bedNumber,
        status: BedStatus.VACANT,
        location: createDto.location || null,
        notes: createDto.notes || null,
        isOperational: createDto.isOperational !== undefined ? createDto.isOperational : true,
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
            dateOfBirth: true,
            gender: true,
            mrn: true,
          },
        },
      },
    });

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
          age: this.calculateAge(bed.currentPatient.dateOfBirth) || undefined,
          gender: bed.currentPatient.gender || undefined,
          mrn: bed.currentPatient.mrn || undefined,
        }
        : undefined,
    };
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
            dateOfBirth: true,
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
          age: this.calculateAge(bed.currentPatient.dateOfBirth) || undefined,
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
            dateOfBirth: true,
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
          age: this.calculateAge(updatedBed.currentPatient.dateOfBirth) || undefined,
          gender: updatedBed.currentPatient.gender || undefined,
          mrn: updatedBed.currentPatient.mrn || undefined,
        }
        : undefined,
    };
  }

  async assignBed(
    bedId: string,
    assignDto: AssignBedDto,
    userId: string,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<BedResponseDto> {
    // 1. Validate bed exists and user has access
    const bed = await this.prisma.bed.findFirst({
      where: {
        id: bedId,
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

    // 2. Validate bed status
    if (bed.status !== BedStatus.VACANT && bed.status !== BedStatus.RESERVED) {
      throw new BadRequestException(
        `Bed is not available. Current status: ${bed.status}. Only VACANT or RESERVED beds can be assigned.`,
      );
    }

    // 3. Validate patient exists
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: assignDto.patientId,
        deletedAt: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (assignDto.caseId && assignDto.caseType) {
      let caseExists = false;
      let casePatientId: string | null = null;

      switch (assignDto.caseType) {
        case CaseType.TRAUMA:
          const traumaCase = await this.prisma.traumaCase.findFirst({
            where: {
              id: assignDto.caseId,
              deletedAt: null,
            },
            select: {
              patientId: true,
            },
          });
          if (traumaCase) {
            caseExists = true;
            casePatientId = traumaCase.patientId;
          }
          break;

        case CaseType.STROKE:
          const strokeCase = await this.prisma.strokeCase.findFirst({
            where: {
              id: assignDto.caseId,
              deletedAt: null,
            },
            select: {
              patientId: true,
            },
          });
          if (strokeCase) {
            caseExists = true;
            casePatientId = strokeCase.patientId;
          }
          break;

        case CaseType.STEMI:
          const stemiCase = await this.prisma.stemiCase.findFirst({
            where: {
              id: assignDto.caseId,
              deletedAt: null,
            },
            select: {
              patientId: true,
            },
          });
          if (stemiCase) {
            caseExists = true;
            casePatientId = stemiCase.patientId;
          }
          break;
      }

      if (!caseExists) {
        throw new NotFoundException(`${assignDto.caseType} case not found`);
      }

      if (casePatientId !== assignDto.patientId) {
        throw new BadRequestException(
          `Case does not belong to the specified patient`,
        );
      }
    }

    const arrivalDate = assignDto.arrivalDate 
      ? new Date(assignDto.arrivalDate)
      : new Date();

    const previousStatus = bed.status;

    const [updatedBed] = await this.prisma.$transaction([
      this.prisma.bed.update({
        where: { id: bedId },
        data: {
          status: BedStatus.OCCUPIED,
          currentPatientId: assignDto.patientId,
          caseId: assignDto.caseId || null,
          caseType: assignDto.caseType || null,
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
      }),
      this.prisma.bedStatusHistory.create({
        data: {
          bedId,
          previousStatus,
          newStatus: BedStatus.OCCUPIED,
          changedById: userId,
          changedAt: arrivalDate,
          patientId: assignDto.patientId,
          caseId: assignDto.caseId || null,
          caseType: assignDto.caseType || null,
        },
      }),
    ]);

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
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            mrn: true,
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
      patientId: item.patientId || null,
      caseId: item.caseId || null,
      caseType: item.caseType || null,
      changedBy: {
        id: item.changedBy.id,
        firstName: item.changedBy.firstName,
        lastName: item.changedBy.lastName,
        email: item.changedBy.email,
      },
      patient: item.patient ? {
        id: item.patient.id,
        name: `${item.patient.firstName} ${item.patient.lastName}`,
        nationalId: item.patient.nationalId || null,
        mrn: item.patient.mrn || null,
      } : null,
    }));
  }

  async delete(
    bedId: string,
    userHospitalId: string | null,
    userRole: UserRole,
  ): Promise<void> {
    if (userRole !== UserRole.HOSPITAL_USER && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      throw new ForbiddenException('Only hospital users, admins, and RCC can delete beds');
    }

    const bed = await this.prisma.bed.findFirst({
      where: {
        id: bedId,
        deletedAt: null,
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    if (userRole === UserRole.HOSPITAL_USER) {
      if (!userHospitalId) {
        throw new ForbiddenException('Hospital assignment required to delete beds');
      }
      if (bed.hospitalId !== userHospitalId) {
        throw new ForbiddenException('Cannot delete bed from another hospital');
      }
    }

    if (bed.status === BedStatus.OCCUPIED) {
      throw new BadRequestException('Cannot delete an occupied bed. Please discharge the patient first.');
    }

    if (bed.currentBedRequestId) {
      throw new BadRequestException('Cannot delete a bed with an active bed request');
    }

    await this.prisma.bed.delete({
      where: { id: bedId },
    });
  }

  private calculateAge(dateOfBirth: Date | string | null | undefined): number | undefined {
    if (!dateOfBirth) return undefined;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}