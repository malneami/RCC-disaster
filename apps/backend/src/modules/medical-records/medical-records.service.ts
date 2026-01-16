import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecord, MedicalRecordType, UserRole } from '@prisma/client';
import { AccessLogService, EntityType } from '../../common/services/access-log.service';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessLogService: AccessLogService,
  ) { }

  async create(createMedicalRecordDto: CreateMedicalRecordDto, userId: string): Promise<MedicalRecord> {
    const { patientId, recordDate, attachments, ...data } = createMedicalRecordDto;

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

    // Handle nested attachments if provided
    if (attachments && attachments.length > 0) {
      await Promise.all(
        attachments.map((att) =>
          this.prisma.medicalRecordAttachment.create({
            data: {
              medicalRecordId: medicalRecord.id,
              fileName: att.fileName,
              mimeType: att.mimeType,
              fileSize: att.fileSize,
              fileData: att.fileData,
              uploadedById: userId,
            },
          })
        )
      );
    }

    // Explicitly log the access for medical record creation
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.MEDICAL_RECORD,
        entityId: medicalRecord.id,
        userId,
        accessType: 'CREATE',
        accessMethod: 'API',
        reason: `Medical record "${medicalRecord.title}" created via create endpoint${attachments && attachments.length > 0 ? ` with ${attachments.length} attachments` : ''}`,
      });
    } catch (error) {
      // Don't fail the creation if logging fails
      console.error('Failed to log medical record creation access:', error);
    }

    return this.findOne(medicalRecord.id);
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            uploadedAt: true,
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            uploadedAt: true,
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: {
        recordDate: 'desc',
      },
    });
  }

  async update(id: string, updateMedicalRecordDto: UpdateMedicalRecordDto, userId: string, userRole?: UserRole): Promise<MedicalRecord> {
    const medicalRecord = await this.findOne(id);

    // Check if user has permission to update (created by or admin/rcc)
    if (medicalRecord.createdById !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
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

  async remove(id: string, userId: string, userRole?: UserRole): Promise<void> {
    const medicalRecord = await this.findOne(id);

    // Check if user has permission to delete (created by or admin/rcc)
    if (medicalRecord.createdById !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
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
  async uploadAttachment(
    medicalRecordId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    userId: string,
  ) {
    const medicalRecord = await this.findOne(medicalRecordId);

    const fileData = file.buffer.toString('base64');

    const attachment = await this.prisma.medicalRecordAttachment.create({
      data: {
        medicalRecordId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileData,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log access
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.MEDICAL_RECORD,
        entityId: medicalRecordId,
        userId,
        accessType: 'UPDATE',
        accessMethod: 'API',
        reason: `Attachment "${file.originalname}" uploaded`,
      });
    } catch (error) {
      console.error('Failed to log access:', error);
    }

    // Return attachment without fileData to keep response light
    const { fileData: _, ...result } = attachment;
    return result;
  }

  async getAttachment(attachmentId: string) {
    const attachment = await this.prisma.medicalRecordAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    return attachment;
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.medicalRecordAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        medicalRecord: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    if (attachment.medicalRecord.createdById !== userId) {
      throw new ForbiddenException('You can only delete attachments from records you created');
    }

    await this.prisma.medicalRecordAttachment.delete({
      where: { id: attachmentId },
    });

    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.MEDICAL_RECORD,
        entityId: attachment.medicalRecordId,
        userId,
        accessType: 'UPDATE',
        accessMethod: 'API',
        reason: `Attachment "${attachment.fileName}" deleted`,
      });
    } catch (error) {
      console.error('Failed to log access:', error);
    }

    return { success: true };
  }
}
