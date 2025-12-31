import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PatientMergeService } from './patient-merge.service';
import { AccessLogService, EntityType } from '../../common/services/access-log.service';
import * as PDFDocument from 'pdfkit';
import { CreatePatientDto } from './dto/patient.dto';
import { Patient } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PatientMergeService))
    private patientMergeService: PatientMergeService,
    private accessLogService: AccessLogService,
  ) {}

  async findAll(page = 1, limit = 10, filters?: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const whereClause: any = { deletedAt: null };
    const isSearch = filters?.search;

    if (filters) {
      // Build AND conditions array for proper filter combination
      const andConditions: any[] = [];

      // Search filter - creates OR condition that should be ANDed with other filters
      if (filters.search) {
        andConditions.push({
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { mrn: { contains: filters.search, mode: 'insensitive' } },
            { nationalId: { contains: filters.search, mode: 'insensitive' } },
            { phoneNumber: { contains: filters.search, mode: 'insensitive' } },
          ],
        });
      }

      // Gender filter
      if (filters.gender) {
        whereClause.gender = filters.gender;
      }

      // Marital status filter
      if (filters.maritalStatus) {
        whereClause.maritalStatus = filters.maritalStatus;
      }

      // Privacy level filter
      if (filters.privacyLevel) {
        whereClause.privacyLevel = filters.privacyLevel;
      }

      // Blood type filter
      if (filters.bloodType) {
        whereClause.bloodType = filters.bloodType;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) {
          // Set to start of day in UTC to ensure accurate filtering
          const startDate = new Date(filters.startDate);
          startDate.setUTCHours(0, 0, 0, 0);
          whereClause.createdAt.gte = startDate;
        }
        if (filters.endDate) {
          // Set to end of day in UTC to include the entire day
          const endDate = new Date(filters.endDate);
          endDate.setUTCHours(23, 59, 59, 999);
          whereClause.createdAt.lte = endDate;
        }
      }

      // Insurance filter
      if (filters.hasInsurance !== undefined) {
        if (filters.hasInsurance) {
          // Patients with insurance (either provider or number is not null)
          andConditions.push({
            OR: [
              { insuranceProvider: { not: null } },
              { insuranceNumber: { not: null } },
            ],
          });
        } else {
          // Patients without insurance (both provider and number are null)
          andConditions.push({
            AND: [
              { insuranceProvider: null },
              { insuranceNumber: null },
            ],
          });
        }
      }

      // Combine all AND conditions if we have any
      if (andConditions.length > 0) {
        // If we already have AND conditions, merge them
        if (whereClause.AND) {
          whereClause.AND = [...whereClause.AND, ...andConditions];
        } else {
          whereClause.AND = andConditions;
        }
      }

      // Hospital filter (if implemented - this would require a relationship)
      // For now, we'll skip this as it would need a different data model
    }

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
    if (isSearch && userId && normalizedPatients.length > 0) {
      // Log access for each patient returned in search results
      const logPromises = normalizedPatients.map((patient) =>
        this.accessLogService.logAccess({
          entityType: EntityType.PATIENT,
          entityId: patient.id,
          userId,
          accessType: 'SEARCH',
          accessMethod: 'API',
          ipAddress,
          userAgent,
          reason: `Searched patients with query: "${filters.search}"`,
        }).catch((err) => {
          // Don't fail the request if logging fails
          console.error('Failed to log search access:', err);
        })
      );
      // Log asynchronously without blocking the response
      Promise.all(logPromises).catch(() => {
        // Ignore errors
      });
    }

    return {
      data: normalizedPatients,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
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
    if (!query || query.length < 2) {
      return [];
    }

    // Special handling for "00000000000000" - also search for variants with suffix
    const searchConditions: any[] = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { mrn: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query, mode: 'insensitive' } },
          { nationalId: { contains: query, mode: 'insensitive' } },
    ];

    // If searching for "00000000000000", also search for variants with suffix
    if (query.trim() === '00000000000000' || query.includes('00000000000000')) {
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
      console.log('Service: Creating patient with data:', createPatientDto);
      console.log('Service: User ID:', userId);
      
      // Special handling for "00000000000000" - allow multiple uses for new babies
      // Make it unique by appending a short UUID suffix
      let nationalId = createPatientDto.nationalId;
      if (nationalId && nationalId.trim() === '00000000000000') {
        // Generate a short unique suffix (last 6 chars of UUID)
        const suffix = require('crypto').randomUUID().replace(/-/g, '').substring(26);
        nationalId = `00000000000000-${suffix}`;
        console.log('Service: Special National ID "00000000000000" detected, using unique variant:', nationalId);
      }
      
      // Prepare data for Prisma, converting dateOfBirth string to Date if provided
      const patientData: any = {
          ...createPatientDto,
        nationalId: nationalId,
          createdById: userId,
      };
      
      // Convert dateOfBirth from string to Date if provided
      if (patientData.dateOfBirth) {
        patientData.dateOfBirth = new Date(patientData.dateOfBirth);
      }
      
      // Convert insuranceExpiry from string to Date if provided
      if (patientData.insuranceExpiry) {
        patientData.insuranceExpiry = new Date(patientData.insuranceExpiry);
      }
      
      // Only include ageMonths and ageDays if they are defined (to avoid Prisma errors before migration)
      if (patientData.ageMonths === undefined) {
        delete patientData.ageMonths;
      }
      if (patientData.ageDays === undefined) {
        delete patientData.ageDays;
      }
      // Remove age since it's not in the Prisma schema (calculated from DoB)
      if (patientData.age !== undefined) {
        delete patientData.age;
      }
      
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
      
      // Return the original nationalId value to the frontend (not the unique variant)
      if (createPatientDto.nationalId && createPatientDto.nationalId.trim() === '00000000000000') {
        result.nationalId = '00000000000000';
      }

      // Explicitly log the access for patient creation
      try {
        await this.accessLogService.logAccess({
          entityType: EntityType.PATIENT,
          entityId: result.id,
          userId,
          accessType: 'CREATE',
          accessMethod: 'API',
          reason: 'Patient created via create endpoint',
        });
      } catch (error) {
        // Don't fail the creation if logging fails
        console.error('Failed to log patient creation access:', error);
      }
      
      console.log('Service: Patient created successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Service: Error creating patient:', error);
      // Handle unique constraint violation
      if (error.code === 'P2002' && error.meta?.target?.includes('nationalId')) {
        // If it's the special "00000000000000" ID, retry with a unique suffix
        if (createPatientDto.nationalId && createPatientDto.nationalId.trim() === '00000000000000') {
          const suffix = require('crypto').randomUUID().replace(/-/g, '').substring(26);
          const uniqueNationalId = `00000000000000-${suffix}`;
          return this.create({ ...createPatientDto, nationalId: uniqueNationalId }, userId);
        }
        throw new Error('A patient with this National ID already exists. Please use a different National ID or update the existing patient.');
      }
      throw error;
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
    // First check if patient exists and get current values for comparison
    const existingPatient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      throw new Error('Patient not found');
    }

    // Special handling for "00000000000000" - allow multiple uses for new babies
    // Make it unique by appending a short UUID suffix
    let nationalId = updatePatientDto.nationalId;
    if (nationalId && nationalId.trim() === '00000000000000') {
      // Check if the existing patient already has a variant of "00000000000000"
      if (existingPatient.nationalId && existingPatient.nationalId.startsWith('00000000000000-')) {
        // Keep the existing unique variant
        nationalId = existingPatient.nationalId;
      } else {
        // Generate a short unique suffix (last 6 chars of UUID)
        const suffix = require('crypto').randomUUID().replace(/-/g, '').substring(26);
        nationalId = `00000000000000-${suffix}`;
      }
      console.log('Service: Special National ID "00000000000000" detected in update, using unique variant:', nationalId);
    }

    // Prepare update data, converting dateOfBirth string to Date if provided
    const updateData: any = {
        ...updatePatientDto,
      nationalId: nationalId || updatePatientDto.nationalId,
        lastAccessedAt: new Date(),
        lastAccessedBy: userId,
    };
    
    // Handle dateOfBirth: convert from string to Date if provided, or set to null if explicitly cleared
    if (updateData.dateOfBirth !== undefined) {
      if (updateData.dateOfBirth === null || updateData.dateOfBirth === '') {
        updateData.dateOfBirth = null;
      } else {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }
    }
    
    // Handle insuranceExpiry: convert from string to Date if provided, or set to null if explicitly cleared
    if (updateData.insuranceExpiry !== undefined) {
      if (updateData.insuranceExpiry === null || updateData.insuranceExpiry === '') {
        updateData.insuranceExpiry = null;
      } else {
        updateData.insuranceExpiry = new Date(updateData.insuranceExpiry);
      }
    }
    
    // Only include ageMonths and ageDays if they are defined (to avoid Prisma errors before migration)
    if (updateData.ageMonths === undefined) {
      delete updateData.ageMonths;
    }
    if (updateData.ageDays === undefined) {
      delete updateData.ageDays;
    }

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

    // Generate detailed change description
    const changeDescription = this.generateChangeDescription(existingPatient, updateData);
    const reason = changeDescription !== 'No fields changed' 
      ? `Patient updated: ${changeDescription}`
      : 'Patient updated (no fields changed)';

    // Explicitly log the access for patient updates with IP and detailed changes
    try {
      console.log('[PatientsService] Logging patient update access:', {
        patientId: id,
        userId,
        accessType: 'UPDATE',
        ipAddress,
        changes: changeDescription,
      });
      await this.accessLogService.logAccess({
        entityType: EntityType.PATIENT,
        entityId: id,
        userId,
        accessType: 'UPDATE',
        accessMethod: 'API',
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        reason,
      });
      console.log('[PatientsService] Successfully logged patient update access');
    } catch (error) {
      // Don't fail the update if logging fails
      console.error('[PatientsService] Failed to log patient update access:', error);
      console.error('[PatientsService] Error stack:', error instanceof Error ? error.stack : 'No stack');
    }

    return updatedPatient;
  }

  async exportPatient(
    id: string,
    format: 'PDF' | 'JSON' | 'CSV' = 'PDF',
    options: {
      includeMedicalRecords?: boolean;
      includeAccessLogs?: boolean;
    } = {},
    userId: string,
  ) {
    // Get patient with all related data
    const patient = await this.prisma.patient.findUnique({
      where: { id },
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
        tickets: options.includeAccessLogs ? {
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
        } : false,
        medicalRecords: options.includeMedicalRecords ? {
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
        } : false,
        accessLogs: options.includeAccessLogs ? {
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
          take: 50,
        } : false,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Log the export activity
    await this.prisma.patientAccessLog.create({
      data: {
        patientId: id,
        userId,
        accessType: 'EXPORT',
        accessMethod: 'API',
        reason: `Exported patient data in ${format} format`,
      },
    });

    // Generate export based on format
    switch (format) {
      case 'JSON':
        return this.generateJsonExport(patient);
      case 'CSV':
        return this.generateCsvExport(patient);
      case 'PDF':
      default:
        return await this.generatePdfExport(patient);
    }
  }

  /**
   * Normalize National ID for display/export
   * Removes the UUID suffix from "00000000000000-XXXXXX" format
   */
  private normalizeNationalId(nationalId: string | null | undefined): string {
    if (!nationalId) return '';
    // If it starts with "00000000000000-", normalize it back to "00000000000000"
    if (nationalId.startsWith('00000000000000-')) {
      return '00000000000000';
    }
    return nationalId;
  }

  private generateJsonExport(patient: any) {
    const data = {
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        nationalId: this.normalizeNationalId(patient.nationalId),
        firstName: patient.firstName,
        lastName: patient.lastName,
        middleName: patient.middleName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        maritalStatus: patient.maritalStatus,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        zipCode: patient.zipCode,
        country: patient.country,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        emergencyEmail: patient.emergencyEmail,
        emergencyRelationship: patient.emergencyRelationship,
        insuranceProvider: patient.insuranceProvider,
        insuranceNumber: patient.insuranceNumber,
        insuranceGroup: patient.insuranceGroup,
        insuranceExpiry: patient.insuranceExpiry,
        bloodType: patient.bloodType,
        rhFactor: patient.rhFactor,
        allergies: patient.allergies,
        medications: patient.medications,
        medicalHistory: patient.medicalHistory,
        riskFactors: patient.riskFactors,
        chronicConditions: patient.chronicConditions,
        weight: patient.weight,
        height: patient.height,
        bmi: patient.bmi,
        privacyLevel: patient.privacyLevel,
        consentGiven: patient.consentGiven,
        consentDate: patient.consentDate,
        dataRetentionPolicy: patient.dataRetentionPolicy,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        lastAccessedAt: patient.lastAccessedAt,
        createdBy: patient.createdBy,
        lastAccessedByUser: patient.lastAccessedByUser,
      },
      medicalRecords: patient.medicalRecords || [],
      tickets: patient.tickets || [],
      accessLogs: patient.accessLogs || [],
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        version: '1.0',
      },
    };

    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    
    return {
      data: buffer,
      contentType: 'application/json',
      filename: `patient-${patient.firstName}-${patient.lastName}-${patient.id}.json`,
    };
  }

  private generateCsvExport(patient: any) {
    // Create CSV content
    const csvRows = [
      ['Field', 'Value'],
      ['ID', patient.id],
      ['MRN', patient.mrn || ''],
      ['National ID', this.normalizeNationalId(patient.nationalId)],
      ['First Name', patient.firstName],
      ['Last Name', patient.lastName],
      ['Middle Name', patient.middleName || ''],
      ['Date of Birth', patient.dateOfBirth],
      ['Gender', patient.gender],
      ['Marital Status', patient.maritalStatus || ''],
      ['Phone Number', patient.phoneNumber || ''],
      ['Email', patient.email || ''],
      ['Address', patient.address || ''],
      ['City', patient.city || ''],
      ['State', patient.state || ''],
      ['ZIP Code', patient.zipCode || ''],
      ['Country', patient.country || ''],
      ['Emergency Contact', patient.emergencyContact || ''],
      ['Emergency Phone', patient.emergencyPhone || ''],
      ['Emergency Email', patient.emergencyEmail || ''],
      ['Emergency Relationship', patient.emergencyRelationship || ''],
      ['Insurance Provider', patient.insuranceProvider || ''],
      ['Insurance Number', patient.insuranceNumber || ''],
      ['Insurance Group', patient.insuranceGroup || ''],
      ['Insurance Expiry', patient.insuranceExpiry || ''],
      ['Blood Type', patient.bloodType || ''],
      ['RH Factor', patient.rhFactor || ''],
      ['Allergies', patient.allergies || ''],
      ['Medications', patient.medications || ''],
      ['Medical History', patient.medicalHistory || ''],
      ['Risk Factors', patient.riskFactors || ''],
      ['Chronic Conditions', patient.chronicConditions || ''],
      ['Weight (kg)', patient.weight || ''],
      ['Height (cm)', patient.height || ''],
      ['BMI', patient.bmi || ''],
      ['Privacy Level', patient.privacyLevel],
      ['Consent Given', patient.consentGiven],
      ['Consent Date', patient.consentDate || ''],
      ['Data Retention Policy', patient.dataRetentionPolicy || ''],
      ['Created At', patient.createdAt],
      ['Updated At', patient.updatedAt],
      ['Last Accessed At', patient.lastAccessedAt || ''],
      ['Created By', patient.createdBy ? `${patient.createdBy.firstName} ${patient.createdBy.lastName}` : ''],
      ['Last Accessed By', patient.lastAccessedByUser ? `${patient.lastAccessedByUser.firstName} ${patient.lastAccessedByUser.lastName}` : ''],
    ];

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const buffer = Buffer.from(csvContent, 'utf-8');
    
    return {
      data: buffer,
      contentType: 'text/csv',
      filename: `patient-${patient.firstName}-${patient.lastName}-${patient.id}.csv`,
    };
  }

  private formatAgeForDisplay(patient: any): string {
    // If date of birth exists, calculate age from it
    if (patient.dateOfBirth) {
      try {
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();
        
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();
        
        // Adjust for negative days
        if (days < 0) {
          months--;
          const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          days += lastMonth.getDate();
        }
        
        // Adjust for negative months
        if (months < 0) {
          years--;
          months += 12;
        }
        
        const parts: string[] = [];
        if (years > 0) {
          parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
        }
        if (months > 0) {
          parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
        }
        if (days > 0 || parts.length === 0) {
          parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        }
        
        return parts.join(', ');
      } catch (error) {
        // If DOB is invalid, fall through to stored values
      }
    }
    
    return 'N/A';
    
    return 'N/A';
  }

  private generatePdfExport(patient: any) {
    return new Promise<{ data: Buffer; contentType: string; filename: string }>((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Patient Report - ${patient.firstName} ${patient.lastName}`,
          Author: 'RCC Healthcare Platform',
          Subject: 'Patient Information Report',
          Keywords: 'patient, medical, report',
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          data: buffer,
          contentType: 'application/pdf',
          filename: `patient-${patient.firstName}-${patient.lastName}-${patient.id}.pdf`,
        });
      });

      // Header
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('Patient Information Report', { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(12)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
        .moveDown(2);

      // Patient Details Section
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('PATIENT DETAILS')
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Name: ${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`)
        .text(`MRN: ${patient.mrn || 'N/A'}`)
        .text(`National ID: ${this.normalizeNationalId(patient.nationalId) || 'N/A'}`)
        .text(`Age: ${this.formatAgeForDisplay(patient)}`);
      
      // Only show date of birth if it exists
      if (patient.dateOfBirth) {
        try {
          doc.text(`Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`);
        } catch (error) {
          // If date is invalid, skip it
        }
      }
      
      doc.text(`Gender: ${patient.gender}`)
        .text(`Marital Status: ${patient.maritalStatus || 'N/A'}`)
        .moveDown(1);

      // Contact Information Section
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('CONTACT INFORMATION')
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Phone: ${patient.phoneNumber || 'N/A'}`)
        .text(`Email: ${patient.email || 'N/A'}`)
        .text(`Address: ${patient.address || 'N/A'}`)
        .text(`City: ${patient.city || 'N/A'}`)
        .text(`State: ${patient.state || 'N/A'}`)
        .text(`ZIP Code: ${patient.zipCode || 'N/A'}`)
        .text(`Country: ${patient.country || 'N/A'}`)
        .moveDown(1);

      // Emergency Contact Section
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('EMERGENCY CONTACT')
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Name: ${patient.emergencyContact || 'N/A'}`)
        .text(`Phone: ${patient.emergencyPhone || 'N/A'}`)
        .text(`Email: ${patient.emergencyEmail || 'N/A'}`)
        .text(`Relationship: ${patient.emergencyRelationship || 'N/A'}`)
        .moveDown(1);

      // Insurance Information Section
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('INSURANCE INFORMATION')
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Provider: ${patient.insuranceProvider || 'N/A'}`)
        .text(`Policy Number: ${patient.insuranceNumber || 'N/A'}`)
        .text(`Group: ${patient.insuranceGroup || 'N/A'}`)
        .text(`Expiry: ${patient.insuranceExpiry ? new Date(patient.insuranceExpiry).toLocaleDateString() : 'N/A'}`)
        .moveDown(1);

      // Medical Information Section
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('MEDICAL INFORMATION')
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Blood Type: ${patient.bloodType || 'N/A'}`)
        .text(`RH Factor: ${patient.rhFactor || 'N/A'}`)
        .text(`Allergies: ${patient.allergies || 'N/A'}`)
        .text(`Medications: ${patient.medications || 'N/A'}`)
        .text(`Medical History: ${patient.medicalHistory || 'N/A'}`)
        .text(`Risk Factors: ${patient.riskFactors || 'N/A'}`)
        .text(`Chronic Conditions: ${patient.chronicConditions || 'N/A'}`)
        .text(`Weight: ${patient.weight || 'N/A'} kg`)
        .text(`Height: ${patient.height || 'N/A'} cm`)
        .text(`BMI: ${patient.bmi || 'N/A'}`)
        .moveDown(1);

      // Privacy & Consent Section
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('PRIVACY & CONSENT')
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Privacy Level: ${patient.privacyLevel}`)
        .text(`Consent Given: ${patient.consentGiven ? 'Yes' : 'No'}`)
        .text(`Consent Date: ${patient.consentDate ? new Date(patient.consentDate).toLocaleDateString() : 'N/A'}`)
        .text(`Data Retention Policy: ${patient.dataRetentionPolicy || 'N/A'}`)
        .moveDown(1);

      // System Information Section
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('SYSTEM INFORMATION')
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Created At: ${new Date(patient.createdAt).toLocaleString()}`)
        .text(`Updated At: ${new Date(patient.updatedAt).toLocaleString()}`)
        .text(`Last Accessed At: ${patient.lastAccessedAt ? new Date(patient.lastAccessedAt).toLocaleString() : 'Never'}`)
        .text(`Created By: ${patient.createdBy ? `${patient.createdBy.firstName} ${patient.createdBy.lastName}` : 'N/A'}`)
        .text(`Last Accessed By: ${patient.lastAccessedByUser ? `${patient.lastAccessedByUser.firstName} ${patient.lastAccessedByUser.lastName}` : 'N/A'}`)
        .moveDown(1);

      // Medical Records Section (if included)
      if (patient.medicalRecords && patient.medicalRecords.length > 0) {
        doc.addPage();
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text(`MEDICAL RECORDS (${patient.medicalRecords.length} records)`)
          .moveDown(0.5);

        patient.medicalRecords.forEach((record: any, index: number) => {
          doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${record.title}`)
            .moveDown(0.2);

          doc.fontSize(10)
            .font('Helvetica')
            .text(`Type: ${record.recordType}`)
            .text(`Date: ${new Date(record.recordDate).toLocaleDateString()}`)
            .text(`Description: ${record.description || 'N/A'}`)
            .text(`Diagnosis: ${record.diagnosis || 'N/A'}`)
            .text(`Treatment: ${record.treatment || 'N/A'}`)
            .moveDown(0.5);
        });
      }

      // Tickets Section (if included)
      if (patient.tickets && patient.tickets.length > 0) {
        doc.addPage();
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text(`TICKETS (${patient.tickets.length} tickets)`)
          .moveDown(0.5);

        patient.tickets.forEach((ticket: any, index: number) => {
          doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. Ticket ID: ${ticket.id}`)
            .moveDown(0.2);

          doc.fontSize(10)
            .font('Helvetica')
            .text(`Status: ${ticket.status}`)
            .text(`Priority: ${ticket.priority}`)
            .text(`Created: ${new Date(ticket.createdAt).toLocaleString()}`)
            .text(`Origin: ${ticket.originHospital?.name || 'N/A'}`)
            .text(`Destination: ${ticket.destinationHospital?.name || 'N/A'}`)
            .moveDown(0.5);
        });
      }

      // Access Logs Section (if included)
      if (patient.accessLogs && patient.accessLogs.length > 0) {
        doc.addPage();
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text(`ACCESS LOGS (${patient.accessLogs.length} recent entries)`)
          .moveDown(0.5);

        patient.accessLogs.forEach((log: any, index: number) => {
          doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${new Date(log.timestamp).toLocaleString()}`)
            .moveDown(0.2);

          doc.fontSize(10)
            .font('Helvetica')
            .text(`User: ${log.user.firstName} ${log.user.lastName} (${log.user.role})`)
            .text(`Access Type: ${log.accessType}`)
            .text(`Method: ${log.accessMethod}`)
            .text(`Reason: ${log.reason || 'N/A'}`)
            .moveDown(0.5);
        });
      }

      // Footer
      doc.addPage();
      doc.fontSize(10)
        .font('Helvetica')
        .text('---', { align: 'center' })
        .moveDown(0.5)
        .text('This report was generated automatically by the RCC Healthcare Platform.', { align: 'center' })
        .text('For questions or concerns, please contact the system administrator.', { align: 'center' })
        .moveDown(1)
        .text(`Report ID: ${patient.id}`, { align: 'center' })
        .text(`Generated: ${new Date().toISOString()}`, { align: 'center' });

      doc.end();
    });
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
    const cases = [
      ...(patient.strokeCases || []).map((c: any) => ({ ...c, type: 'stroke' as const, status: c.currentStatus })),
      ...(patient.traumaCases || []).map((c: any) => ({ ...c, type: 'trauma' as const, status: c.disposition })),
      ...(patient.stemiCases || []).map((c: any) => ({ ...c, type: 'stemi' as const, status: c.currentStatus })),
    ];

    if (cases.length === 0) {
      return { caseType: null, caseId: null, createdAt: null, status: null };
    }

    // Sort by creation date and get the latest
    const latestCase = cases.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      caseType: latestCase.type,
      caseId: latestCase.id,
      createdAt: latestCase.createdAt.toISOString(),
      status: latestCase.currentStatus,
    };
  }

  async getStatistics(filters?: { startDate?: string; endDate?: string; hospitalId?: string }) {
    // Base where clause - only exclude deleted patients
    const whereClause: any = { deletedAt: null };
    
    // Note: Date filters are only used for "recent activity" metric, not for total counts
    // This ensures all existing patients are included in statistics

    const [
      total,
      byGender,
      byPrivacyLevel,
      byBloodType,
      byMaritalStatus,
      withInsurance,
      withoutInsurance,
      recentActivity,
      byCaseType,
      byAgeGroup,
    ] = await Promise.all([
      // Total patients
      this.prisma.patient.count({ where: whereClause }),

      // By gender
      this.prisma.patient.groupBy({
        by: ['gender'],
        where: whereClause,
        _count: true,
      }),

      // By privacy level
      this.prisma.patient.groupBy({
        by: ['privacyLevel'],
        where: whereClause,
        _count: true,
      }),

      // By blood type
      this.prisma.patient.groupBy({
        by: ['bloodType'],
        where: whereClause,
        _count: true,
      }),

      // By marital status
      this.prisma.patient.groupBy({
        by: ['maritalStatus'],
        where: whereClause,
        _count: true,
      }),

      // With insurance
      this.prisma.patient.count({
        where: {
          ...whereClause,
          OR: [
            { insuranceProvider: { not: null } },
            { insuranceNumber: { not: null } },
          ],
        },
      }),

      // Without insurance
      this.prisma.patient.count({
        where: {
          ...whereClause,
          AND: [
            { insuranceProvider: null },
            { insuranceNumber: null },
          ],
        },
      }),

      // Recent activity - use date filters if provided, otherwise default to last 30 days
      this.prisma.patient.count({
        where: {
          ...whereClause,
          updatedAt: {
            gte: filters?.startDate 
              ? new Date(filters.startDate)
              : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ...(filters?.endDate && {
              lte: new Date(filters.endDate + 'T23:59:59.999Z'),
            }),
          },
        },
      }),

      // By case type (stroke, trauma, stemi)
      Promise.all([
        this.prisma.patient.count({
          where: {
            ...whereClause,
            strokeCases: { some: { deletedAt: null } },
          },
        }),
        this.prisma.patient.count({
          where: {
            ...whereClause,
            traumaCases: { some: { deletedAt: null } },
          },
        }),
        this.prisma.patient.count({
          where: {
            ...whereClause,
            stemiCases: { some: { deletedAt: null } },
          },
        }),
      ]),

      // By age group
      this.prisma.patient.findMany({
        where: whereClause,
        select: { dateOfBirth: true },
      }),
    ]);

    // Helper to calculate age from DoB (duplicated here for scope access or make class method)
    const calculateAge = (dob: Date | string | null): number | null => {
        if (!dob) return null;
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Process age groups
    const ageGroups = {
      '0-17': 0,
      '18-30': 0,
      '31-50': 0,
      '51-70': 0,
      '71+': 0,
      unknown: 0,
    };

    byAgeGroup.forEach((patient) => {
      const age = calculateAge(patient.dateOfBirth);
      
      if (age === null) {
        ageGroups.unknown++;
      } else if (age <= 17) {
        ageGroups['0-17']++;
      } else if (age <= 30) {
        ageGroups['18-30']++;
      } else if (age <= 50) {
        ageGroups['31-50']++;
      } else if (age <= 70) {
        ageGroups['51-70']++;
      } else {
        ageGroups['71+']++;
      }
    });

    return {
      total,
      byGender: byGender.reduce((acc, item) => {
        acc[item.gender] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPrivacyLevel: byPrivacyLevel.reduce((acc, item) => {
        acc[item.privacyLevel] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byBloodType: byBloodType.reduce((acc, item) => {
        if (item.bloodType) {
          acc[item.bloodType] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      byMaritalStatus: byMaritalStatus.reduce((acc, item) => {
        if (item.maritalStatus) {
          acc[item.maritalStatus] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      insurance: {
        with: withInsurance,
        without: withoutInsurance,
        percentage: total > 0 ? ((withInsurance / total) * 100).toFixed(2) : '0.00',
      },
      recentActivity,
      byCaseType: {
        stroke: byCaseType[0],
        trauma: byCaseType[1],
        stemi: byCaseType[2],
      },
      byAgeGroup: ageGroups,
    };
  }

  async getDuplicateGroups(confidenceThreshold: number = 0.8) {
    const allPatients = await this.prisma.patient.findMany({
      where: { deletedAt: null, isPrimaryRecord: true },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const duplicateGroups: any[] = [];
    const processed = new Set<string>();

    for (const patient of allPatients) {
      if (processed.has(patient.id)) continue;

      const duplicates = await this.prisma.patient.findMany({
        where: {
          deletedAt: null,
          id: { not: patient.id },
          OR: [
            ...(patient.mrn ? [{ mrn: patient.mrn }] : []),
            ...(patient.nationalId ? [{ nationalId: patient.nationalId }] : []),
            ...(patient.phoneNumber ? [{ phoneNumber: patient.phoneNumber }] : []),
          ],
        },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      if (duplicates.length > 0) {
        const group = {
          groupId: `group-${patient.id}`,
          primaryPatientId: patient.id,
          patients: [
            {
              patientId: patient.id,
              confidence: 1.0,
              matchReason: 'Primary record',
              matchedFields: [],
              patient: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                mrn: patient.mrn,
                nationalId: patient.nationalId,
                phoneNumber: patient.phoneNumber,
                createdAt: patient.createdAt,
                createdBy: patient.createdBy,
              },
            },
            ...duplicates.map((dup) => ({
              patientId: dup.id,
              confidence: 0.9,
              matchReason: 'Potential duplicate',
              matchedFields: [
                ...(patient.mrn && dup.mrn === patient.mrn ? ['mrn'] : []),
                ...(patient.nationalId && dup.nationalId === patient.nationalId ? ['nationalId'] : []),
                ...(patient.phoneNumber && dup.phoneNumber === patient.phoneNumber ? ['phoneNumber'] : []),
              ],
              patient: {
                id: dup.id,
                firstName: dup.firstName,
                lastName: dup.lastName,
                mrn: dup.mrn,
                nationalId: dup.nationalId,
                phoneNumber: dup.phoneNumber,
                createdAt: dup.createdAt,
                createdBy: dup.createdBy,
              },
            })),
          ],
          totalConfidence: 0.95,
        };

        duplicateGroups.push(group);
        processed.add(patient.id);
        duplicates.forEach((d) => processed.add(d.id));
      }
    }

    return duplicateGroups;
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
        // Handle both date-only strings (YYYY-MM-DD) and full ISO strings
        const startDateStr = filters.startDate.includes('T') 
          ? filters.startDate 
          : filters.startDate + 'T00:00:00.000Z';
        const startDate = new Date(startDateStr);
        // Set to start of day in UTC
        startDate.setUTCHours(0, 0, 0, 0);
        whereClause.timestamp.gte = startDate;
      }
      if (filters.endDate) {
        // Handle both date-only strings (YYYY-MM-DD) and full ISO strings
        const endDateStr = filters.endDate.includes('T')
          ? filters.endDate
          : filters.endDate + 'T23:59:59.999Z';
        const endDate = new Date(endDateStr);
        // Set to end of day in UTC
        if (!filters.endDate.includes('T')) {
          endDate.setUTCHours(23, 59, 59, 999);
        }
        whereClause.timestamp.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.patientAccessLog.findMany({
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
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.patientAccessLog.count({ where: whereClause }),
    ]);

    // Serialize the response to ensure proper JSON formatting
    const serializedLogs = logs.map((log) => ({
      id: log.id,
      patientId: log.patientId,
      userId: log.userId,
      accessType: log.accessType,
      accessMethod: log.accessMethod,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      reason: log.reason,
      timestamp: log.timestamp.toISOString(),
      user: log.user ? {
        id: log.user.id,
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        email: log.user.email,
        role: log.user.role,
      } : null,
      patient: log.patient ? {
        id: log.patient.id,
        firstName: log.patient.firstName,
        lastName: log.patient.lastName,
        mrn: log.patient.mrn,
        nationalId: log.patient.nationalId,
      } : null,
    }));

    return {
      data: serializedLogs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async createAccessLog(
    createAccessLogDto: {
      patientId: string;
      userId: string;
      accessType: string;
      accessMethod?: string;
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
    },
    currentUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createAccessLogDto.patientId },
    });
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createAccessLogDto.userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Use provided IP/UserAgent or fallback to request values
    const log = await this.prisma.patientAccessLog.create({
      data: {
        patientId: createAccessLogDto.patientId,
        userId: createAccessLogDto.userId,
        accessType: createAccessLogDto.accessType as any,
        accessMethod: createAccessLogDto.accessMethod || 'API',
        ipAddress: createAccessLogDto.ipAddress || ipAddress || null,
        userAgent: createAccessLogDto.userAgent || userAgent || null,
        reason: createAccessLogDto.reason || null,
      },
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
    });

    // Serialize response
    return {
      id: log.id,
      patientId: log.patientId,
      userId: log.userId,
      accessType: log.accessType,
      accessMethod: log.accessMethod,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      reason: log.reason,
      timestamp: log.timestamp.toISOString(),
      user: log.user ? {
        id: log.user.id,
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        email: log.user.email,
        role: log.user.role,
      } : null,
      patient: log.patient ? {
        id: log.patient.id,
        firstName: log.patient.firstName,
        lastName: log.patient.lastName,
        mrn: log.patient.mrn,
        nationalId: log.patient.nationalId,
      } : null,
    };
  }

  async updateAccessLog(
    logId: string,
    updateAccessLogDto: {
      accessType?: string;
      accessMethod?: string;
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
    },
  ) {
    // Check if log exists
    const existingLog = await this.prisma.patientAccessLog.findUnique({
      where: { id: logId },
    });
    if (!existingLog) {
      const error: any = new Error('Access log not found');
      error.statusCode = 404;
      throw error;
    }

    // Build update data
    const updateData: any = {};
    if (updateAccessLogDto.accessType) {
      updateData.accessType = updateAccessLogDto.accessType;
    }
    if (updateAccessLogDto.accessMethod) {
      updateData.accessMethod = updateAccessLogDto.accessMethod;
    }
    if (updateAccessLogDto.ipAddress !== undefined) {
      updateData.ipAddress = updateAccessLogDto.ipAddress || null;
    }
    if (updateAccessLogDto.userAgent !== undefined) {
      updateData.userAgent = updateAccessLogDto.userAgent || null;
    }
    if (updateAccessLogDto.reason !== undefined) {
      updateData.reason = updateAccessLogDto.reason || null;
    }

    // Update the log
    const updatedLog = await this.prisma.patientAccessLog.update({
      where: { id: logId },
      data: updateData,
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
    });

    // Serialize response
    return {
      id: updatedLog.id,
      patientId: updatedLog.patientId,
      userId: updatedLog.userId,
      accessType: updatedLog.accessType,
      accessMethod: updatedLog.accessMethod,
      ipAddress: updatedLog.ipAddress,
      userAgent: updatedLog.userAgent,
      reason: updatedLog.reason,
      timestamp: updatedLog.timestamp.toISOString(),
      user: updatedLog.user ? {
        id: updatedLog.user.id,
        firstName: updatedLog.user.firstName,
        lastName: updatedLog.user.lastName,
        email: updatedLog.user.email,
        role: updatedLog.user.role,
      } : null,
      patient: updatedLog.patient ? {
        id: updatedLog.patient.id,
        firstName: updatedLog.patient.firstName,
        lastName: updatedLog.patient.lastName,
        mrn: updatedLog.patient.mrn,
        nationalId: updatedLog.patient.nationalId,
      } : null,
    };
  }
}