import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecord, MedicalRecordType } from '@prisma/client';
import { AccessLogService, EntityType } from '../../common/services/access-log.service';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessLogService: AccessLogService,
  ) {}

  async create(createMedicalRecordDto: CreateMedicalRecordDto, userId: string): Promise<MedicalRecord> {
    const { patientId, recordDate, ...data } = createMedicalRecordDto;

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const medicalRecord = await this.prisma.medicalRecord.create({
      data: {
        ...data,
        patientId,
        recordDate: new Date(recordDate),
        createdById: userId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
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

    // Explicitly log the access for medical record creation
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.MEDICAL_RECORD,
        entityId: medicalRecord.id,
        userId,
        accessType: 'CREATE',
        accessMethod: 'API',
        reason: `Medical record "${medicalRecord.title}" created via create endpoint`,
      });
    } catch (error) {
      // Don't fail the creation if logging fails
      console.error('Failed to log medical record creation access:', error);
    }

    return medicalRecord;
  }

  async findAll(patientId?: string, recordType?: MedicalRecordType): Promise<MedicalRecord[]> {
    const where: any = {
      deletedAt: null, // Only show non-deleted records
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (recordType) {
      where.recordType = recordType;
    }

    return this.prisma.medicalRecord.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
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
        recordDate: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<MedicalRecord> {
    const medicalRecord = await this.prisma.medicalRecord.findUnique({
      where: { 
        id,
        deletedAt: null, // Only show non-deleted records
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
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

    if (!medicalRecord) {
      throw new NotFoundException(`Medical record with ID ${id} not found`);
    }

    return medicalRecord;
  }

  async findByPatient(patientId: string): Promise<MedicalRecord[]> {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    return this.prisma.medicalRecord.findMany({
      where: { 
        patientId,
        deletedAt: null, // Only show non-deleted records
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
      orderBy: {
        recordDate: 'desc',
      },
    });
  }

  async update(id: string, updateMedicalRecordDto: UpdateMedicalRecordDto, userId: string): Promise<MedicalRecord> {
    const medicalRecord = await this.findOne(id);

    // Check if user has permission to update (created by or admin)
    if (medicalRecord.createdById !== userId) {
      throw new ForbiddenException('You can only update medical records you created');
    }

    const { recordDate, ...data } = updateMedicalRecordDto;
    const updateData: any = { ...data };

    if (recordDate) {
      updateData.recordDate = new Date(recordDate);
    }

    const updatedRecord = await this.prisma.medicalRecord.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
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

    // Explicitly log the access for medical record update
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.MEDICAL_RECORD,
        entityId: id,
        userId,
        accessType: 'UPDATE',
        accessMethod: 'API',
        reason: `Medical record "${updatedRecord.title}" updated via update endpoint`,
      });
    } catch (error) {
      // Don't fail the update if logging fails
      console.error('Failed to log medical record update access:', error);
    }

    return updatedRecord;
  }

  async remove(id: string, userId: string): Promise<void> {
    const medicalRecord = await this.findOne(id);

    // Check if user has permission to delete (created by or admin)
    if (medicalRecord.createdById !== userId) {
      throw new ForbiddenException('You can only delete medical records you created');
    }

    await this.prisma.medicalRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getAccessLogs(filters: {
    page?: number;
    limit?: number;
    medicalRecordId?: string;
    userId?: string;
    accessType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filters.medicalRecordId) {
      whereClause.medicalRecordId = filters.medicalRecordId;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.accessType) {
      whereClause.accessType = filters.accessType;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.timestamp = {};
      if (filters.startDate) {
        whereClause.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.timestamp.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.medicalRecordAccessLog.findMany({
        where: whereClause,
        skip,
        take: limit,
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
          medicalRecord: {
            select: {
              id: true,
              title: true,
              recordType: true,
              patientId: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.medicalRecordAccessLog.count({ where: whereClause }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
