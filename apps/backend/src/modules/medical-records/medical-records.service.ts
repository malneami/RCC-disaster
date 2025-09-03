import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecord, MedicalRecordType } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.medicalRecord.update({
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
}
