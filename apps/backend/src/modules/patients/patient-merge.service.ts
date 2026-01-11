import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Patient } from '@prisma/client';

@Injectable()
export class PatientMergeService {
  private readonly logger = new Logger(PatientMergeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find and merge duplicate patients based on National ID
   * Returns the primary patient ID to use
   */
  async findAndMergeDuplicatesByNationalId(nationalId: string): Promise<string | null> {
    if (!nationalId || nationalId.trim().length === 0) {
      throw new Error('National ID is required for duplicate checking');
    }

    const trimmedNationalId = nationalId.trim();

    this.logger.log(`Checking for duplicates with National ID: ${trimmedNationalId}`);

    // Find all patients with this National ID
    const duplicatePatients = await this.prisma.patient.findMany({
      where: {
        nationalId: trimmedNationalId,
        deletedAt: null,
      },
      include: {
        strokeCases: {
          select: { id: true, strokeType: true, createdAt: true }
        },
        tickets: {
          select: { id: true, ticketNumber: true, createdAt: true }
        },
        medicalRecords: {
          select: { id: true, recordType: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    if (duplicatePatients.length === 0) {
      this.logger.log(`No existing patients found with National ID: ${trimmedNationalId}`);
      return null; // No duplicates found
    }

    if (duplicatePatients.length === 1) {
      this.logger.log(`Found 1 existing patient with National ID: ${trimmedNationalId}`);
      return duplicatePatients[0].id; // Return existing patient ID
    }

    // Multiple duplicates found - merge them
    this.logger.warn(`Found ${duplicatePatients.length} duplicate patients with National ID: ${trimmedNationalId}`);
    return await this.mergeDuplicatePatients(duplicatePatients);
  }

  /**
   * Merge multiple duplicate patients into one primary patient
   */
  async mergeDuplicatePatients(duplicatePatients: Patient[]): Promise<string> {
    if (duplicatePatients.length < 2) {
      return duplicatePatients[0].id;
    }

    // Sort by creation date - oldest becomes primary
    const sortedPatients = duplicatePatients.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const primaryPatient = sortedPatients[0];
    const duplicatePatientsToMerge = sortedPatients.slice(1);

    this.logger.log(`Merging ${duplicatePatientsToMerge.length} duplicate patients into primary: ${primaryPatient.id}`);

    try {
      // Start transaction
      await this.prisma.$transaction(async (tx) => {
        // Update all related records to point to primary patient
        for (const duplicate of duplicatePatientsToMerge) {
          // Update stroke cases
          await tx.strokeCase.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update tickets
          await tx.ticket.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update medical records
          await tx.medicalRecord.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update patient access logs
          await tx.patientAccessLog.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update STEMI cases
          await tx.stemiCase.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Trauma cases
          await tx.traumaCase.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Stroke Assessment Scores
          await tx.strokeAssessmentScore.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Stroke Rehabilitation
          await tx.strokeRehabilitation.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Beds
          await tx.bed.updateMany({
            where: { currentPatientId: duplicate.id },
            data: { currentPatientId: primaryPatient.id }
          });

          // Update Bed Requests
          await tx.bedRequest.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Bed Status History
          await tx.bedStatusHistory.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Notifications
          await tx.notification.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Case Notes
          await tx.caseNote.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // Update Replies
          await tx.reply.updateMany({
            where: { patientId: duplicate.id },
            data: { patientId: primaryPatient.id }
          });

          // --- SAFETY CHECK: Verify all critical records were moved ---
          const remainingTrauma = await tx.traumaCase.count({ where: { patientId: duplicate.id } });
          const remainingStemi = await tx.stemiCase.count({ where: { patientId: duplicate.id } });
          const remainingStroke = await tx.strokeCase.count({ where: { patientId: duplicate.id } });

          if (remainingTrauma > 0 || remainingStemi > 0 || remainingStroke > 0) {
            throw new Error(`Merge Validation Failed: Duplicate patient ${duplicate.id} still has orphaned cases (Trauma: ${remainingTrauma}, STEMI: ${remainingStemi}, Stroke: ${remainingStroke}). Transaction rolled back.`);
          }
          // -----------------------------------------------------------

          // Soft delete the duplicate patient
          await tx.patient.update({
            where: { id: duplicate.id },
            data: { 
              deletedAt: new Date(),
              // Add note about merge
              medicalHistory: `MERGED: This patient record was merged with patient ${primaryPatient.id} on ${new Date().toISOString()}. Original record created: ${duplicate.createdAt.toISOString()}`
            }
          });
        }

        // Update primary patient with most complete information
        const mergedData = this.mergePatientData(primaryPatient, duplicatePatientsToMerge);
        await tx.patient.update({
          where: { id: primaryPatient.id },
          data: mergedData
        });
      });

      this.logger.log(`Successfully merged ${duplicatePatientsToMerge.length} duplicate patients into primary: ${primaryPatient.id}`);
      return primaryPatient.id;

    } catch (error) {
      this.logger.error(`Error merging duplicate patients:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to merge duplicate patients: ${errorMessage}`);
    }
  }

  /**
   * Merge patient data from multiple records, keeping the most complete information
   */
  private mergePatientData(primaryPatient: Patient, duplicatePatients: Patient[]): Partial<Patient> {
    const mergedData: Partial<Patient> = {};

    // Helper function to get the most complete value
    const getMostComplete = (field: keyof Patient, defaultValue: any = null) => {
      const values = [primaryPatient[field], ...duplicatePatients.map(p => p[field])];
      return values.find(v => v !== null && v !== undefined && v !== '') || defaultValue;
    };

    // Merge key fields, keeping the most complete information
    mergedData.firstName = getMostComplete('firstName', primaryPatient.firstName);
    mergedData.lastName = getMostComplete('lastName', primaryPatient.lastName);
    mergedData.middleName = getMostComplete('middleName', primaryPatient.middleName);
    mergedData.phoneNumber = getMostComplete('phoneNumber', primaryPatient.phoneNumber);
    mergedData.email = getMostComplete('email', primaryPatient.email);
    mergedData.address = getMostComplete('address', primaryPatient.address);
    mergedData.city = getMostComplete('city', primaryPatient.city);
    mergedData.state = getMostComplete('state', primaryPatient.state);
    mergedData.zipCode = getMostComplete('zipCode', primaryPatient.zipCode);
    mergedData.country = getMostComplete('country', primaryPatient.country);
    mergedData.emergencyContact = getMostComplete('emergencyContact', primaryPatient.emergencyContact);
    mergedData.emergencyPhone = getMostComplete('emergencyPhone', primaryPatient.emergencyPhone);
    mergedData.emergencyEmail = getMostComplete('emergencyEmail', primaryPatient.emergencyEmail);
    mergedData.emergencyRelationship = getMostComplete('emergencyRelationship', primaryPatient.emergencyRelationship);
    mergedData.insuranceProvider = getMostComplete('insuranceProvider', primaryPatient.insuranceProvider);
    mergedData.insuranceNumber = getMostComplete('insuranceNumber', primaryPatient.insuranceNumber);
    mergedData.insuranceGroup = getMostComplete('insuranceGroup', primaryPatient.insuranceGroup);
    mergedData.bloodType = getMostComplete('bloodType', primaryPatient.bloodType);
    mergedData.rhFactor = getMostComplete('rhFactor', primaryPatient.rhFactor);
    mergedData.allergies = getMostComplete('allergies', primaryPatient.allergies);
    mergedData.medications = getMostComplete('medications', primaryPatient.medications);
    mergedData.medicalHistory = getMostComplete('medicalHistory', primaryPatient.medicalHistory);
    mergedData.riskFactors = getMostComplete('riskFactors', primaryPatient.riskFactors);
    mergedData.chronicConditions = getMostComplete('chronicConditions', primaryPatient.chronicConditions);
    mergedData.weight = getMostComplete('weight', primaryPatient.weight);
    mergedData.height = getMostComplete('height', primaryPatient.height);
    mergedData.bmi = getMostComplete('bmi', primaryPatient.bmi);

    // Keep the most recent update time
    mergedData.updatedAt = new Date();

    return mergedData;
  }

  /**
   * Check for potential duplicates by name and date of birth
   */
  async findPotentialDuplicatesByNameAndDOB(firstName: string, lastName: string, dateOfBirth: Date): Promise<Patient[]> {
    const dobStart = new Date(dateOfBirth);
    dobStart.setHours(0, 0, 0, 0);
    
    const dobEnd = new Date(dateOfBirth);
    dobEnd.setHours(23, 59, 59, 999);

    return await this.prisma.patient.findMany({
      where: {
        AND: [
          { firstName: { equals: firstName, mode: 'insensitive' } },
          { lastName: { equals: lastName, mode: 'insensitive' } },
          { dateOfBirth: { gte: dobStart, lte: dobEnd } },
          { deletedAt: null }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}
