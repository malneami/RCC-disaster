import { Injectable, Inject, forwardRef, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PatientMergeService } from './patient-merge.service';
import { AccessLogService, EntityType } from '../../common/services/access-log.service';
import { CreatePatientDto } from './dto/patient.dto';
import { Patient } from '@prisma/client';
import { PatientsExportService } from './services/patients-export.service';
import { PatientsStatisticsService } from './services/patients-statistics.service';
import { DuplicateDetectionService } from './services/duplicate-detection.service';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PatientMergeService))
    private patientMergeService: PatientMergeService,
    private accessLogService: AccessLogService,
    private patientsExportService: PatientsExportService,
    private patientsStatisticsService: PatientsStatisticsService,
    private duplicateDetectionService: DuplicateDetectionService,
  ) { }

  async findAll(page = 1, limit = 10, filters?: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const skip = (page - 1) * limit;
    const whereClause = this.buildWhereClause(filters);

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where: whereClause,
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
      this.prisma.patient.count({ where: whereClause }),
    ]);

    // Normalize "00000000000000-*" back to "00000000000000" for display
    const normalizedPatients = patients.map(patient => {
      if (patient.nationalId && patient.nationalId.startsWith('00000000000000-')) {
        return { ...patient, nationalId: '00000000000000' };
      }
      return patient;
    });

    // Log search operations for HIPAA compliance
    if (filters?.search && userId && normalizedPatients.length > 0) {
      this.logSearchAccess(normalizedPatients, userId, filters.search, ipAddress, userAgent);
    }

    return {
      data: normalizedPatients,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  private sanitizeSearchQuery(query: string): string {
    if (!query) return '';
    try {
      const decoded = decodeURIComponent(query);
      return decoded.trim();
    } catch (error) {
      return query.trim();
    }
  }

  private buildWhereClause(filters?: any): any {
    const whereClause: any = { deletedAt: null };

    if (!filters) {
      return whereClause;
    }

    const andConditions: any[] = [];

    if (filters.search) {
      const sanitizedSearch = this.sanitizeSearchQuery(filters.search);
      if (sanitizedSearch) {
        const words = sanitizedSearch.split(/\s+/).filter(word => word.length > 0);

        if (words.length === 1) {
          andConditions.push({
            OR: [
              { firstName: { contains: words[0], mode: 'insensitive' } },
              { lastName: { contains: words[0], mode: 'insensitive' } },
              { middleName: { contains: words[0], mode: 'insensitive' } },
              { mrn: { contains: words[0], mode: 'insensitive' } },
              { nationalId: { contains: words[0], mode: 'insensitive' } },
              { phoneNumber: { contains: words[0], mode: 'insensitive' } },
            ],
          });
        } else {
          const wordConditions = words.map(word => ({
            OR: [
              { firstName: { contains: word, mode: 'insensitive' } },
              { lastName: { contains: word, mode: 'insensitive' } },
              { middleName: { contains: word, mode: 'insensitive' } },
              { mrn: { contains: word, mode: 'insensitive' } },
              { nationalId: { contains: word, mode: 'insensitive' } },
              { phoneNumber: { contains: word, mode: 'insensitive' } },
            ],
          }));
          andConditions.push({
            OR: [
              { AND: wordConditions },
              { firstName: { contains: sanitizedSearch, mode: 'insensitive' } },
              { lastName: { contains: sanitizedSearch, mode: 'insensitive' } },
              { middleName: { contains: sanitizedSearch, mode: 'insensitive' } },
              { mrn: { contains: sanitizedSearch, mode: 'insensitive' } },
              { nationalId: { contains: sanitizedSearch, mode: 'insensitive' } },
              { phoneNumber: { contains: sanitizedSearch, mode: 'insensitive' } },
            ],
          });
        }
      }
    }

    // Direct property filters
    if (filters.gender) whereClause.gender = filters.gender;
    if (filters.maritalStatus) whereClause.maritalStatus = filters.maritalStatus;
    if (filters.privacyLevel) whereClause.privacyLevel = filters.privacyLevel;
    if (filters.bloodType) whereClause.bloodType = filters.bloodType;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (!isNaN(startDate.getTime())) {
          startDate.setUTCHours(0, 0, 0, 0);
          whereClause.createdAt.gte = startDate;
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        if (!isNaN(endDate.getTime())) {
          endDate.setUTCHours(23, 59, 59, 999);
          whereClause.createdAt.lte = endDate;
        }
      }
    }

    // Insurance filter
    if (filters.hasInsurance !== undefined) {
      if (filters.hasInsurance) {
        andConditions.push({
          OR: [
            { insuranceProvider: { not: null } },
            { insuranceNumber: { not: null } },
          ],
        });
      } else {
        andConditions.push({
          AND: [
            { insuranceProvider: null },
            { insuranceNumber: null },
          ],
        });
      }
    }

    // Combine all AND conditions
    if (andConditions.length > 0) {
      whereClause.AND = whereClause.AND ? [...whereClause.AND, ...andConditions] : andConditions;
    }

    return whereClause;
  }

  private logSearchAccess(patients: any[], userId: string, searchQuery: string, ipAddress?: string, userAgent?: string) {
    const logPromises = patients.map((patient) =>
      this.accessLogService.logAccess({
        entityType: EntityType.PATIENT,
        entityId: patient.id,
        userId,
        accessType: 'SEARCH',
        accessMethod: 'API',
        ipAddress,
        userAgent,
        reason: `Searched patients with query: "${searchQuery}"`,
      }).catch((err) => {
        console.error('Failed to log search access:', err);
      })
    );
    // Log asynchronously without blocking the response
    Promise.all(logPromises).catch(() => { });
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        lastAccessedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        tickets: {
          include: {
            originHospital: true,
            destinationHospital: true,
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
          orderBy: { createdAt: 'desc' },
        },
        medicalRecords: {
          where: {
            deletedAt: null, // Only include non-deleted medical records
          },
          include: {
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { recordDate: 'desc' },
        },
        accessLogs: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 50, // Limit to recent access logs
        },
        _count: {
          select: {
            tickets: true,
            medicalRecords: {
              where: {
                deletedAt: null, // Only count non-deleted medical records
              },
            },
            accessLogs: true,
          },
        },
      },
    });

    // Normalize "00000000000000-*" back to "00000000000000" for display
    if (patient && patient.nationalId && patient.nationalId.startsWith('00000000000000-')) {
      patient.nationalId = '00000000000000';
    }

    return patient;
  }

  async search(query: string) {
    const sanitizedQuery = this.sanitizeSearchQuery(query);

    if (!sanitizedQuery || sanitizedQuery.length < 2) {
      return [];
    }

    const words = sanitizedQuery.split(/\s+/).filter(word => word.length > 0);
    const searchConditions: any[] = [];

    if (words.length === 1) {

      searchConditions.push(
        { firstName: { contains: words[0], mode: 'insensitive' } },
        { lastName: { contains: words[0], mode: 'insensitive' } },
        { middleName: { contains: words[0], mode: 'insensitive' } },
        { mrn: { contains: words[0], mode: 'insensitive' } },
        { phoneNumber: { contains: words[0], mode: 'insensitive' } },
        { nationalId: { contains: words[0], mode: 'insensitive' } },
      );
    } else {

      const wordConditions = words.map(word => ({
        OR: [
          { firstName: { contains: word, mode: 'insensitive' } },
          { lastName: { contains: word, mode: 'insensitive' } },
          { middleName: { contains: word, mode: 'insensitive' } },
          { mrn: { contains: word, mode: 'insensitive' } },
          { nationalId: { contains: word, mode: 'insensitive' } },
          { phoneNumber: { contains: word, mode: 'insensitive' } },
        ],
      }));


      searchConditions.push(
        { AND: wordConditions },
        { firstName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { lastName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { middleName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { mrn: { contains: sanitizedQuery, mode: 'insensitive' } },
        { nationalId: { contains: sanitizedQuery, mode: 'insensitive' } },
        { phoneNumber: { contains: sanitizedQuery, mode: 'insensitive' } },
      );
    }

    if (sanitizedQuery === '00000000000000' || sanitizedQuery.includes('00000000000000')) {
      searchConditions.push({
        nationalId: { startsWith: '00000000000000-', mode: 'insensitive' },
      });
    }

    const patients = await this.prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: searchConditions,
      },
      take: 20,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    // Normalize "00000000000000-*" back to "00000000000000" for display
    return patients.map(patient => {
      if (patient.nationalId && patient.nationalId.startsWith('00000000000000-')) {
        return { ...patient, nationalId: '00000000000000' };
      }
      return patient;
    });
  }

  async create(createPatientDto: CreatePatientDto, userId: string): Promise<Patient & { createdBy: { firstName: string; lastName: string; email: string | null } }> {
    try {
      // Process nationalId using helper
      const nationalId = await this.ensureUniqueNationalId(createPatientDto.nationalId);

      // Prepare and clean data
      const patientData: any = {
        ...createPatientDto,
        nationalId,
        createdById: userId,
      };

      this.cleanupPatientData(patientData);

      const result = await this.prisma.patient.create({
        data: patientData,
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Return normalized ID for display
      if (this.isOriginalNationalId(createPatientDto.nationalId)) {
        result.nationalId = '00000000000000';
      }

      this.logAccess(result.id, userId, 'CREATE', 'Patient created via create endpoint');

      return result;
    } catch (error: any) {
      this.handlePatientError(error, 'creating');
      throw error; // handlePatientError might throw, but TS needs this
    }
  }

  /**
   * Helper function to generate detailed change description
   */
  private generateChangeDescription(oldData: any, newData: any): string {
    const changes: string[] = [];
    const fieldsToTrack = [
      'firstName', 'lastName', 'middleName', 'nationalId', 'mrn',
      'age', 'ageMonths', 'ageDays', 'gender', 'maritalStatus',
      'dateOfBirth', 'phoneNumber', 'email', 'address', 'city', 'state', 'zipCode', 'country',
      'emergencyContact', 'emergencyPhone', 'emergencyEmail', 'emergencyRelationship',
      'insuranceProvider', 'insuranceNumber', 'insuranceGroup', 'insuranceExpiry',
      'bloodType', 'rhFactor', 'allergies', 'medications', 'medicalHistory',
      'riskFactors', 'chronicConditions', 'weight', 'height', 'bmi',
      'privacyLevel', 'consentGiven'
    ];

    for (const field of fieldsToTrack) {
      const oldValue = oldData[field];
      const newValue = newData[field];

      // Skip if field wasn't in the update
      if (newValue === undefined) {
        continue;
      }

      // Handle null/undefined comparisons
      const oldVal = oldValue === null || oldValue === undefined ? null : String(oldValue);
      const newVal = newValue === null || newValue === undefined ? null : String(newValue);

      // Only track if value actually changed
      if (oldVal !== newVal) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        const oldDisplay = oldVal === null ? 'null' : (oldVal === '' ? 'empty' : oldVal);
        const newDisplay = newVal === null ? 'null' : (newVal === '' ? 'empty' : newVal);
        changes.push(`${fieldName} from "${oldDisplay}" to "${newDisplay}"`);
      }
    }

    if (changes.length === 0) {
      return 'No fields changed';
    }

    return changes.join(', ');
  }

  async update(id: string, updatePatientDto: any, userId: string, ipAddress?: string, userAgent?: string) {
    const existingPatient = await this.prisma.patient.findUnique({ where: { id } });

    if (!existingPatient) {
      throw new NotFoundException('Patient not found');
    }

    try {
      // Handle national ID updates
      let nationalId = updatePatientDto.nationalId;
      if (nationalId) {
        nationalId = await this.ensureUniqueNationalId(nationalId, existingPatient.nationalId || undefined);
      }


      // Prepare update data
      const updateData: any = {
        ...updatePatientDto,
        nationalId: nationalId || updatePatientDto.nationalId, // Use processed or original (if no change)
        lastAccessedAt: new Date(),
        lastAccessedBy: userId,
      };

      this.cleanupPatientData(updateData);

      // Update the patient
      const updatedPatient = await this.prisma.patient.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lastAccessedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Return the original nationalId value to the frontend (not the unique variant)
      if (updatePatientDto.nationalId && updatePatientDto.nationalId.trim() === '00000000000000') {
        updatedPatient.nationalId = '00000000000000';
      } else if (updatedPatient.nationalId && updatedPatient.nationalId.startsWith('00000000000000-')) {
        updatedPatient.nationalId = '00000000000000';
      }

      // Audit logs
      const changeDescription = this.generateChangeDescription(existingPatient, updateData);
      const reason = changeDescription !== 'No fields changed'
        ? `Patient updated: ${changeDescription}`
        : 'Patient updated (no fields changed)';

      this.logAccess(id, userId, 'UPDATE', reason, ipAddress, userAgent, changeDescription);

      return updatedPatient;
    } catch (error: any) {
      this.handlePatientError(error, 'updating');
      throw error;
    }
  }

  // --- Delegated Methods ---

  async exportPatient(
    id: string,
    format: 'PDF' | 'JSON' | 'CSV' = 'PDF',
    options: {
      includeMedicalRecords?: boolean;
      includeAccessLogs?: boolean;
    } = {},
    userId: string,
  ) {
    return this.patientsExportService.exportPatient(id, format, options, userId);
  }

  async getLatestCaseInfo(nationalId: string): Promise<{
    caseType: 'stroke' | 'trauma' | 'stemi' | null;
    caseId: string | null;
    createdAt: string | null;
    status: string | null;
  }> {
    const patient = await this.prisma.patient.findFirst({
      where: { nationalId, deletedAt: null },
      include: {
        strokeCases: {
          select: { id: true, createdAt: true, currentStatus: true },
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        traumaCases: {
          select: { id: true, createdAt: true, disposition: true },
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        stemiCases: {
          select: { id: true, createdAt: true, currentStatus: true },
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!patient) {
      return { caseType: null, caseId: null, createdAt: null, status: null };
    }

    // Find the most recent case across all types
    const cases: any[] = [
      ...(patient.strokeCases || []).map((c) => ({ ...c, type: 'stroke', status: c.currentStatus })),
      ...(patient.traumaCases || []).map((c) => ({ ...c, type: 'trauma', status: c.disposition })),
      ...(patient.stemiCases || []).map((c) => ({ ...c, type: 'stemi', status: c.currentStatus })),
    ];

    if (cases.length === 0) {
      return { caseType: null, caseId: null, createdAt: null, status: null };
    }

    // Sort by creation date and get the latest
    cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const latestCase = cases[0];

    return {
      caseType: latestCase.type as any,
      caseId: latestCase.id,
      createdAt: latestCase.createdAt.toISOString(),
      status: latestCase.status,
    };
  }

  async getStatistics(filters?: { startDate?: string; endDate?: string; hospitalId?: string }) {
    return this.patientsStatisticsService.getStatistics(filters);
  }

  async getDuplicateGroups(confidenceThreshold: number = 0.8) {
    return this.duplicateDetectionService.getDuplicateGroups(confidenceThreshold);
  }

  async mergeDuplicates(primaryPatientId: string, duplicatePatientIds: string[], userId: string) {
    const primaryPatient = await this.prisma.patient.findUnique({
      where: { id: primaryPatientId },
    });

    if (!primaryPatient) {
      throw new Error('Primary patient not found');
    }

    // Create a temporary array with primary and duplicates
    const allPatients = [
      primaryPatient,
      ...(await this.prisma.patient.findMany({
        where: { id: { in: duplicatePatientIds } },
      })),
    ];

    // Log the merge action
    for (const duplicateId of duplicatePatientIds) {
      await this.prisma.patientAccessLog.create({
        data: {
          patientId: duplicateId,
          userId,
          accessType: 'DELETE',
          accessMethod: 'WEB',
          reason: `Merged with patient ${primaryPatientId}`,
        },
      });
    }

    // Perform the merge using the merge service
    await this.patientMergeService.mergeDuplicatePatients(allPatients);

    return { success: true, primaryPatientId };
  }

  async ignoreDuplicates(patientIds: string[]) {
    // Mark patients as not duplicates by setting isPrimaryRecord to true
    await this.prisma.patient.updateMany({
      where: { id: { in: patientIds } },
      data: { isPrimaryRecord: true },
    });

    return { success: true, ignored: patientIds.length };
  }

  async getAccessLogs(filters: {
    page?: number;
    limit?: number;
    patientId?: string;
    userId?: string;
    accessType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    // Use provided values or defaults, but ensure they're numbers
    const page = filters.page !== undefined && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit !== undefined && filters.limit > 0 ? filters.limit : 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filters.patientId) {
      whereClause.patientId = filters.patientId;
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
        const startDate = new Date(filters.startDate);
        if (!isNaN(startDate.getTime())) {
          startDate.setUTCHours(0, 0, 0, 0);
          whereClause.timestamp.gte = startDate;
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        if (!isNaN(endDate.getTime())) {
          endDate.setUTCHours(23, 59, 59, 999);
          whereClause.timestamp.lte = endDate;
        }
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.patientAccessLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mrn: true,
              nationalId: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          timestamp: 'desc',
        },
      }),
      this.prisma.patientAccessLog.count({ where: whereClause }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async createAccessLog(dto: any, userId: string, ipAddress?: string, userAgent?: string) {
    return this.accessLogService.logAccess({
      entityType: EntityType.PATIENT,
      entityId: dto.patientId,
      userId: userId,
      accessType: dto.accessType,
      accessMethod: dto.accessMethod || 'API',
      ipAddress,
      userAgent,
      reason: dto.reason,
    });
  }

  async updateAccessLog(logId: string, updateDto: any) {
    // Since AccessLogService is generic, specific updates might need direct Prisma usage 
    // or we add update capabilities to AccessLogService. 
    // For now, doing it directly here as it was likely done before.
    return this.prisma.patientAccessLog.update({
      where: { id: logId },
      data: updateDto,
    });
  }

  // --- Helpers ---

  /**
   * Generates a unique national ID if the input is the special "00000000000000" placeholder.
   * If existingId is provided (update scenario), it preserves the existing unique suffix if the base matches.
   */
  private async ensureUniqueNationalId(nationalId: string | null | undefined, existingId?: string): Promise<string | null | undefined> {
    if (!nationalId) return nationalId;

    // Check if input is the placeholder "00000000000000"
    if (nationalId.trim() === '00000000000000') {
      // If updating, and the existing ID is already a variant of this placeholder, keep it
      if (existingId && existingId.startsWith('00000000000000-')) {
        return existingId;
      }
      // Otherwise generate a new unique variant
      const suffix = require('crypto').randomUUID().replace(/-/g, '').substring(26);
      return `00000000000000-${suffix}`;
    }

    // Check for duplicates in the database (including deleted patients)
    if (existingId && nationalId === existingId) {
      return nationalId;
    }

    const duplicate = await this.prisma.patient.findFirst({
      where: {
        nationalId: nationalId,
        // Check ALL patients (implicitly included as we don't filter deletedAt)
      },
    });

    if (duplicate) {
      throw new ConflictException('A patient with this National ID already exists (possibly deleted). Please use a different National ID.');
    }

    return nationalId;
  }

  private isOriginalNationalId(id: string | null | undefined): boolean {
    return !!id && id.trim() === '00000000000000';
  }

  private cleanupPatientData(data: any) {
    if (data.dateOfBirth) {
      data.dateOfBirth = data.dateOfBirth === '' ? null : new Date(data.dateOfBirth);
    }
    if (data.insuranceExpiry) {
      data.insuranceExpiry = data.insuranceExpiry === '' ? null : new Date(data.insuranceExpiry);
    }

    // Remove transient/frontend-only fields
    delete data.age; // calculated from DoB
    delete data.ageMonths;
    delete data.ageDays;
  }

  private handlePatientError(error: any, action: string) {
    console.error(`Service: Error ${action} patient:`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nationalId')) {
      throw new ConflictException('A patient with this National ID already exists. Please use a different National ID.');
    }
    // Re-throw if not handled
  }

  private async logAccess(
    entityId: string,
    userId: string,
    accessType: 'CREATE' | 'UPDATE' | 'VIEW',
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    changes?: string
  ) {
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.PATIENT,
        entityId,
        userId,
        accessType,
        accessMethod: 'API',
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        reason,
      });
      if (changes) {
        console.log(`[PatientsService] Logged ${accessType} with changes: ${changes}`);
      }
    } catch (error) {
      console.error(`Failed to log ${accessType} access:`, error);
    }
  }
}