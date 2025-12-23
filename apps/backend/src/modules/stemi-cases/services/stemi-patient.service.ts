import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PatientInfoDto } from '../dto/create-stemi-case.dto';
import { AccessLogService, EntityType } from '../../../common/services/access-log.service';

@Injectable()
export class StemiPatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessLogService: AccessLogService,
  ) {}

  async createOrUpdatePatient(patientInfo: PatientInfoDto, userId: string) {
    const {
      firstName,
      lastName,
      nationalId,
      age,
      gender,
      phoneNumber,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
    } = patientInfo;

    try {
      // Try to find existing patient by national ID
      let patient = await this.prisma.patient.findUnique({
        where: { nationalId },
      });

      if (patient) {
        // Update existing patient
        patient = await this.prisma.patient.update({
          where: { id: patient.id },
          data: {
            firstName,
            lastName,
            age: age || undefined,
            dateOfBirth: patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth) : undefined,
            gender,
            phoneNumber: phoneNumber || null,
            address: address || null,
            emergencyContact: emergencyContact || null,
            emergencyPhone: emergencyPhone || null,
            medicalHistory: medicalHistory || null,
            allergies: allergies || null,
            medications: medications || null,
            updatedAt: new Date(),
          },
        });
        
        // Log access for patient update
        try {
          await this.accessLogService.logAccess({
            entityType: EntityType.PATIENT,
            entityId: patient.id,
            userId,
            accessType: 'UPDATE',
            accessMethod: 'API',
            reason: 'Patient updated via STEMI createOrUpdatePatient endpoint',
          });
        } catch (error) {
          console.error('Failed to log patient update access:', error);
        }
      } else {
        // Create new patient
        patient = await this.prisma.patient.create({
          data: {
            firstName,
            lastName,
            nationalId,
            age: age || undefined,
            dateOfBirth: patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth) : undefined,
            gender,
            phoneNumber: phoneNumber || null,
            address: address || null,
            emergencyContact: emergencyContact || null,
            emergencyPhone: emergencyPhone || null,
            medicalHistory: medicalHistory || null,
            allergies: allergies || null,
            medications: medications || null,
            createdById: userId,
          },
        });
        
        // Log access for patient creation
        try {
          await this.accessLogService.logAccess({
            entityType: EntityType.PATIENT,
            entityId: patient.id,
            userId,
            accessType: 'CREATE',
            accessMethod: 'API',
            reason: 'Patient created via STEMI createOrUpdatePatient endpoint',
          });
        } catch (error) {
          console.error('Failed to log patient creation access:', error);
        }
      }

      return patient;
    } catch (error) {
      console.error('Error creating/updating patient:', error);
      throw error;
    }
  }

  /**
   * Helper function to generate detailed change description
   */
  private generateChangeDescription(oldData: any, newData: any): string {
    const changes: string[] = [];
    const fieldsToTrack = [
      'firstName', 'lastName', 'nationalId', 'age', 'gender',
      'phoneNumber', 'address', 'emergencyContact', 'emergencyPhone',
      'medicalHistory', 'allergies', 'medications'
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

  async updatePatient(patientId: string, patientInfo: PatientInfoDto, userId?: string, ipAddress?: string, userAgent?: string) {
    const {
      firstName,
      lastName,
      nationalId,
      age,
      gender,
      phoneNumber,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
    } = patientInfo;

    try {
      // First, get the current patient data for comparison
      const currentPatient = await this.prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!currentPatient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }

      // Build update data, only including nationalId if it's actually changing
      const updateData: any = {
        firstName,
        lastName,
        age: age || undefined,
        dateOfBirth: patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth) : undefined,
        gender,
        phoneNumber: phoneNumber !== undefined ? (phoneNumber || null) : undefined,
        address: address !== undefined ? (address || null) : undefined,
        emergencyContact: emergencyContact !== undefined ? (emergencyContact || null) : undefined,
        emergencyPhone: emergencyPhone !== undefined ? (emergencyPhone || null) : undefined,
        medicalHistory: medicalHistory !== undefined ? (medicalHistory || null) : undefined,
        allergies: allergies || undefined ? (allergies || null) : undefined,
        medications: medications !== undefined ? (medications || null) : undefined,
        updatedAt: new Date(),
      };

      // Only update nationalId if it's different from the current value
      if (nationalId && nationalId !== currentPatient.nationalId) {
        // Check if the new nationalId already exists for another patient
        const existingPatient = await this.prisma.patient.findUnique({
          where: { nationalId },
          select: { id: true }
        });
        
        if (existingPatient && existingPatient.id !== patientId) {
          throw new Error(`A patient with national ID ${nationalId} already exists`);
        }
        
        updateData.nationalId = nationalId;
      }

      const patient = await this.prisma.patient.update({
        where: { id: patientId },
        data: updateData,
      });

      // Generate detailed change description
      const changeDescription = this.generateChangeDescription(currentPatient, updateData);
      const reason = changeDescription !== 'No fields changed' 
        ? `Patient updated via STEMI updatePatient endpoint: ${changeDescription}`
        : 'Patient updated via STEMI updatePatient endpoint (no fields changed)';

      // Log access for patient update - ALWAYS log, even if userId is missing
      try {
        if (!userId) {
          console.warn('[StemiPatientService] updatePatient called without userId - cannot log access');
        } else {
          console.log('[StemiPatientService] Logging patient update access:', {
            patientId,
            userId,
            accessType: 'UPDATE',
            ipAddress,
            changes: changeDescription,
          });
          await this.accessLogService.logAccess({
            entityType: EntityType.PATIENT,
            entityId: patientId,
            userId,
            accessType: 'UPDATE',
            accessMethod: 'API',
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            reason,
          });
          console.log('[StemiPatientService] Successfully logged patient update access');
        }
      } catch (error) {
        console.error('[StemiPatientService] Failed to log patient update access:', error);
        console.error('[StemiPatientService] Error stack:', error instanceof Error ? error.stack : 'No stack');
      }

      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }
}
